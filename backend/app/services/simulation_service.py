import uuid
from typing import List, Dict, Optional
from backend.app.models.project import Project
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.services.team_optimizer import optimize_project_team
from backend.app.schemas.simulation import (
    SimulationParams,
    SimulationComparison,
    SimulationMemberDiff,
)
from backend.app.schemas.optimization import TeamMemberAllocation


def run_what_if_simulation(
    project: Project,
    all_employees: List[Employee],
    params: SimulationParams
) -> SimulationComparison:
    """
    Simulates modifications to team size, weekly hours, candidate availability, or skill requirements
    entirely in memory without modifying live database records.
    """
    sim_id = str(uuid.uuid4())[:8]

    # 1. Compute Original baseline state
    orig_res = optimize_project_team(
        project,
        all_employees,
        custom_team_size=project.required_team_size,
        custom_weekly_hours=project.estimated_weekly_hours
    )
    orig_team = orig_res.recommended_team

    # 2. Prepare cloned employee state with simulated overrides
    # Map candidate overrides: {emp_id: CandidateOverride}
    override_map = {o.employee_id: o for o in params.candidate_overrides}

    simulated_employees: List[Employee] = []
    for emp in all_employees:
        if not emp.is_active:
            continue

        override = override_map.get(emp.id)
        if override and override.is_excluded:
            # Candidate is simulated as completely unavailable/excluded
            continue

        sim_emp = Employee(
            id=emp.id,
            user_id=emp.user_id,
            employee_code=emp.employee_code,
            name=emp.name,
            email=emp.email,
            department=emp.department,
            job_title=emp.job_title,
            years_of_experience=emp.years_of_experience,
            weekly_working_hours=emp.weekly_working_hours,
            availability_status=emp.availability_status,
            learning_interests=emp.learning_interests,
            is_active=emp.is_active
        )
        sim_emp.skills = list(emp.skills)
        sim_emp.assignments = list(emp.assignments)

        if override:
            if override.is_forced_available is True:
                sim_emp.availability_status = AvailabilityStatus.AVAILABLE
            elif override.is_forced_available is False:
                sim_emp.availability_status = AvailabilityStatus.UNAVAILABLE

        simulated_employees.append(sim_emp)

    # 3. Target parameters
    new_team_size = params.adjusted_team_size or project.required_team_size
    new_weekly_hours = params.adjusted_weekly_hours or project.estimated_weekly_hours

    # 4. Run optimization on simulated parameters
    sim_res = optimize_project_team(
        project,
        simulated_employees,
        custom_team_size=new_team_size,
        custom_weekly_hours=new_weekly_hours
    )
    sim_team = sim_res.recommended_team

    # 5. Calculate Member Diffs
    orig_member_ids = {m.employee_id for m in orig_team.members}
    sim_member_ids = {m.employee_id for m in sim_team.members}

    member_diffs: List[SimulationMemberDiff] = []

    # Retained or removed members
    for om in orig_team.members:
        if om.employee_id in sim_member_ids:
            sm = next(m for m in sim_team.members if m.employee_id == om.employee_id)
            member_diffs.append(SimulationMemberDiff(
                employee_id=om.employee_id,
                employee_name=om.employee_name,
                status="retained",
                allocated_hours=sm.assigned_hours,
                utilization_before=om.new_utilization_percent,
                utilization_after=sm.new_utilization_percent
            ))
        else:
            member_diffs.append(SimulationMemberDiff(
                employee_id=om.employee_id,
                employee_name=om.employee_name,
                status="removed",
                allocated_hours=0.0,
                utilization_before=om.new_utilization_percent,
                utilization_after=round((om.current_committed_hours / 40.0) * 100.0, 1)
            ))

    # Newly added members
    for sm in sim_team.members:
        if sm.employee_id not in orig_member_ids:
            member_diffs.append(SimulationMemberDiff(
                employee_id=sm.employee_id,
                employee_name=sm.employee_name,
                status="added",
                allocated_hours=sm.assigned_hours,
                utilization_before=round((sm.current_committed_hours / 40.0) * 100.0, 1),
                utilization_after=sm.new_utilization_percent
            ))

    # Trade-offs & resolved gaps
    resolved_gaps = []
    for s in orig_team.uncovered_mandatory_skills:
        if s not in sim_team.uncovered_mandatory_skills:
            resolved_gaps.append(f"Successfully covered critical skill: {s}")

    capacity_warnings = []
    for sm in sim_team.members:
        if sm.new_utilization_percent > 100.0:
            capacity_warnings.append(f"{sm.employee_name} becomes overloaded ({sm.new_utilization_percent:.0f}%)")

    # Trade-off note
    notes = []
    fit_delta = sim_team.team_fit_score - orig_team.team_fit_score
    cov_delta = sim_team.skill_coverage_percent - orig_team.skill_coverage_percent

    if fit_delta > 0:
        notes.append(f"Simulated plan improves overall team fit by +{fit_delta:.1f} points.")
    elif fit_delta < 0:
        notes.append(f"Simulated plan decreases team fit by {abs(fit_delta):.1f} points.")
    else:
        notes.append("Simulated plan maintains identical overall team fit.")

    if cov_delta > 0:
        notes.append(f"Skill coverage increased by +{cov_delta:.1f}%.")
    elif cov_delta < 0:
        notes.append(f"Skill coverage dropped by {abs(cov_delta):.1f}%.")

    return SimulationComparison(
        project_id=project.id,
        project_name=project.name,
        simulation_id=sim_id,
        original_team_size=project.required_team_size,
        simulated_team_size=new_team_size,
        original_weekly_hours=project.estimated_weekly_hours,
        simulated_weekly_hours=new_weekly_hours,
        original_skill_coverage=orig_team.skill_coverage_percent,
        simulated_skill_coverage=sim_team.skill_coverage_percent,
        original_team_fit_score=orig_team.team_fit_score,
        simulated_team_fit_score=sim_team.team_fit_score,
        original_members=orig_team.members,
        simulated_members=sim_team.members,
        member_diffs=member_diffs,
        resolved_gaps=resolved_gaps,
        new_capacity_warnings=capacity_warnings,
        trade_off_summary=" ".join(notes)
    )
