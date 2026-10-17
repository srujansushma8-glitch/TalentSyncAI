import itertools
import math
from typing import List, Dict, Set, Optional, Tuple
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.models.project import Project, ProjectRequiredSkill
from backend.app.services.matching_engine import calculate_candidate_match
from backend.app.schemas.optimization import (
    OptimizationResponse,
    TeamOption,
    TeamMemberAllocation,
)


def optimize_project_team(
    project: Project,
    all_employees: List[Employee],
    custom_team_size: Optional[int] = None,
    custom_weekly_hours: Optional[float] = None
) -> OptimizationResponse:
    """
    Combinatorial multi-objective team optimizer.
    Balances mandatory skill coverage, proficiency satisfaction, capacity limits, and workload fairness.
    """
    target_team_size = custom_team_size or project.required_team_size
    target_weekly_hours = custom_weekly_hours or project.estimated_weekly_hours

    if target_team_size <= 0:
        target_team_size = 1

    per_member_hours = round(target_weekly_hours / target_team_size, 1)

    # 1. Filter active candidate pool
    active_pool = [e for e in all_employees if e.is_active]
    if not active_pool:
        empty_option = TeamOption(
            id="primary",
            name="No Candidates Available",
            team_fit_score=0.0,
            is_feasible=False,
            skill_coverage_percent=0.0,
            proficiency_coverage_percent=0.0,
            workload_fairness_score=0.0,
            uncovered_mandatory_skills=[r.skill.name for r in project.required_skills if r.is_mandatory and r.skill],
            members=[],
            trade_off_explanation="No active employee records found in database."
        )
        return OptimizationResponse(
            project_id=project.id,
            project_name=project.name,
            required_team_size=target_team_size,
            estimated_weekly_hours=target_weekly_hours,
            is_fully_feasible=False,
            recommended_team=empty_option,
            alternative_teams=[],
            feasibility_notes=["No eligible employees available for staffing."],
            solver_used="Deterministic Multi-Objective Optimizer"
        )

    # Pre-calculate match scores for each candidate
    candidate_matches = {}
    for emp in active_pool:
        candidate_matches[emp.id] = calculate_candidate_match(
            emp, project, custom_allocation_hours=per_member_hours
        )

    # Required skills summary
    req_skills = project.required_skills
    mandatory_reqs = [r for r in req_skills if r.is_mandatory]
    optional_reqs = [r for r in req_skills if not r.is_mandatory]

    # Pre-screen candidates: sort by individual score
    sorted_candidates = sorted(
        active_pool,
        key=lambda e: (
            not candidate_matches[e.id].has_hard_constraint_violation,
            candidate_matches[e.id].match_score
        ),
        reverse=True
    )

    # Limit search space for combinatorial evaluation to top candidates (e.g. top 15) to guarantee < 100ms response
    search_pool = sorted_candidates[:min(len(sorted_candidates), 16)]

    evaluated_teams: List[Tuple[float, bool, float, float, float, List[Employee], List[str], List[str], str]] = []

    # Evaluate combinations of size target_team_size
    possible_combos = list(itertools.combinations(search_pool, target_team_size))
    if not possible_combos:
        possible_combos = [tuple(search_pool[:target_team_size])]

    for combo in possible_combos:
        members = list(combo)
        
        # Check individual capacity and availability
        capacity_feasible = True
        for m in members:
            match = candidate_matches[m.id]
            if m.availability_status == AvailabilityStatus.UNAVAILABLE or match.remaining_capacity < per_member_hours:
                capacity_feasible = False
                break

        # Check combined skill coverage
        # Map: skill_id -> max proficiency in team
        team_skill_prof: Dict[int, int] = {}
        for m in members:
            for es in m.skills:
                team_skill_prof[es.skill_id] = max(team_skill_prof.get(es.skill_id, 0), es.proficiency_level)

        uncovered_mandatory = []
        for r in mandatory_reqs:
            s_name = r.skill.name if r.skill else f"Skill #{r.skill_id}"
            if r.skill_id not in team_skill_prof or team_skill_prof[r.skill_id] < r.min_proficiency:
                uncovered_mandatory.append(s_name)

        uncovered_optional = []
        for r in optional_reqs:
            s_name = r.skill.name if r.skill else f"Skill #{r.skill_id}"
            if r.skill_id not in team_skill_prof or team_skill_prof[r.skill_id] < r.min_proficiency:
                uncovered_optional.append(s_name)

        # Skill coverage %
        total_req_count = len(req_skills)
        if total_req_count > 0:
            covered_count = total_req_count - (len(uncovered_mandatory) + len(uncovered_optional))
            skill_coverage_pct = round((covered_count / total_req_count) * 100.0, 1)
        else:
            skill_coverage_pct = 100.0

        # Proficiency satisfaction %
        if total_req_count > 0:
            prof_ratio_sum = 0.0
            for r in req_skills:
                actual = team_skill_prof.get(r.skill_id, 0)
                prof_ratio_sum += min(1.0, actual / r.min_proficiency) if r.min_proficiency > 0 else 1.0
            prof_coverage_pct = round((prof_ratio_sum / total_req_count) * 100.0, 1)
        else:
            prof_coverage_pct = 100.0

        # Workload fairness (Standard Deviation of new utilization across members)
        new_utils = []
        for m in members:
            new_tot = m.committed_hours + per_member_hours
            u = (new_tot / m.weekly_working_hours) * 100.0 if m.weekly_working_hours > 0 else 100.0
            new_utils.append(u)

        avg_u = sum(new_utils) / len(new_utils)
        variance = sum((u - avg_u) ** 2 for u in new_utils) / len(new_utils)
        std_dev = math.sqrt(variance)
        # Fairness score: 100 is perfectly balanced (0 std dev), drops as variance increases
        fairness_score = round(max(0.0, 100.0 - (std_dev * 2.0)), 1)

        # Average candidate match score
        avg_candidate_match = sum(candidate_matches[m.id].match_score for m in members) / len(members)

        # Overall Team Fit Score (0 to 100)
        # 45% Skill Coverage, 25% Proficiency Coverage, 20% Candidate Fit, 10% Workload Fairness
        team_fit = (
            0.45 * skill_coverage_pct +
            0.25 * prof_coverage_pct +
            0.20 * avg_candidate_match +
            0.10 * fairness_score
        )

        is_feasible = capacity_feasible and len(uncovered_mandatory) == 0

        # Penalize team fit if hard constraints violated
        if not is_feasible:
            team_fit = max(0.0, team_fit - 25.0)

        # Trade-off note
        notes = []
        if is_feasible:
            notes.append(f"Fully covers all mandatory skills with {skill_coverage_pct:.0f}% total requirement coverage.")
            notes.append(f"Workload fairness index: {fairness_score:.0f}/100.")
        else:
            if not capacity_feasible:
                notes.append("Capacity constraint exceeded for one or more members.")
            if uncovered_mandatory:
                notes.append(f"Missing mandatory skills: {', '.join(uncovered_mandatory)}.")

        evaluated_teams.append((
            round(team_fit, 1),
            is_feasible,
            skill_coverage_pct,
            prof_coverage_pct,
            fairness_score,
            members,
            uncovered_mandatory,
            uncovered_optional,
            " ".join(notes)
        ))

    # Sort evaluated teams by (is_feasible, team_fit)
    evaluated_teams.sort(key=lambda t: (t[1], t[0]), reverse=True)

    def build_team_option(opt_id: str, name: str, data) -> TeamOption:
        team_fit, is_feas, cov_pct, prof_pct, fair_score, members, unc_mand, unc_opt, notes = data
        member_allocations: List[TeamMemberAllocation] = []

        for m in members:
            new_tot = m.committed_hours + per_member_hours
            new_u = round((new_tot / m.weekly_working_hours) * 100.0, 1) if m.weekly_working_hours > 0 else 0.0
            rem_cap = max(0.0, m.weekly_working_hours - new_tot)

            # Find skills covered by this member for the project
            covered = []
            for es in m.skills:
                for req in req_skills:
                    if es.skill_id == req.skill_id:
                        s_name = req.skill.name if req.skill else f"Skill #{req.skill_id}"
                        covered.append(f"{s_name} (L{es.proficiency_level})")

            member_allocations.append(TeamMemberAllocation(
                employee_id=m.id,
                employee_name=m.name,
                employee_code=m.employee_code,
                department=m.department,
                job_title=m.job_title,
                assigned_hours=per_member_hours,
                current_committed_hours=m.committed_hours,
                new_total_committed_hours=new_tot,
                new_utilization_percent=new_u,
                remaining_capacity=rem_cap,
                covered_skills=covered
            ))

        return TeamOption(
            id=opt_id,
            name=name,
            team_fit_score=team_fit,
            is_feasible=is_feas,
            skill_coverage_percent=cov_pct,
            proficiency_coverage_percent=prof_pct,
            workload_fairness_score=fair_score,
            uncovered_mandatory_skills=unc_mand,
            uncovered_optional_skills=unc_opt,
            members=member_allocations,
            trade_off_explanation=notes
        )

    # Primary recommended team
    primary_data = evaluated_teams[0]
    recommended_team = build_team_option("primary", "Recommended Optimal Team", primary_data)

    # Alternative teams (choose distinct combinations)
    alternative_teams: List[TeamOption] = []
    seen_member_sets = {frozenset(m.id for m in primary_data[5])}

    alt_idx = 1
    for data in evaluated_teams[1:]:
        m_set = frozenset(m.id for m in data[5])
        if m_set not in seen_member_sets:
            seen_member_sets.add(m_set)
            alt_name = f"Alternative Plan {alt_idx} (Balanced Distribution)" if alt_idx == 1 else f"Alternative Plan {alt_idx} (Max Proficiency)"
            alternative_teams.append(build_team_option(f"alt_{alt_idx}", alt_name, data))
            alt_idx += 1
            if len(alternative_teams) >= 2:
                break

    feasibility_notes = []
    if not recommended_team.is_feasible:
        feasibility_notes.append("No combination meets 100% of mandatory project constraints.")
        if recommended_team.uncovered_mandatory_skills:
            feasibility_notes.append(
                f"Missing critical skills across available staff: {', '.join(recommended_team.uncovered_mandatory_skills)}. Consider upskilling or contract hiring."
            )
    else:
        feasibility_notes.append("All hard constraints satisfied: 100% mandatory skills covered and sufficient capacity verified.")

    return OptimizationResponse(
        project_id=project.id,
        project_name=project.name,
        required_team_size=target_team_size,
        estimated_weekly_hours=target_weekly_hours,
        is_fully_feasible=recommended_team.is_feasible,
        recommended_team=recommended_team,
        alternative_teams=alternative_teams,
        feasibility_notes=feasibility_notes,
        solver_used="Deterministic Multi-Objective Optimizer"
    )
