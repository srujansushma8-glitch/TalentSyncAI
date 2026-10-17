from typing import List, Dict, Optional
from backend.app.models.project import Project
from backend.app.models.employee import Employee
from backend.app.models.skill import Skill
from backend.app.schemas.skill_gap import (
    ProjectSkillGapReport,
    SkillGapItem,
    CandidateUpskillTarget,
    OrgSkillGapReport,
    OrgSkillGapItem,
)


def analyze_project_skill_gaps(
    project: Project,
    all_employees: List[Employee],
    selected_member_ids: Optional[List[int]] = None
) -> ProjectSkillGapReport:
    """
    Evaluates project skill requirements against assigned team members or active workforce.
    Classifies gaps into missing completely, deficient proficiency, or satisfied.
    """
    # If selected_member_ids given, evaluate those; else evaluate assigned members or all active candidates
    if selected_member_ids:
        eval_pool = [e for e in all_employees if e.id in selected_member_ids]
    elif project.assignments:
        assigned_ids = {a.employee_id for a in project.assignments if a.status == "active"}
        eval_pool = [e for e in all_employees if e.id in assigned_ids]
        if not eval_pool:
            eval_pool = [e for e in all_employees if e.is_active]
    else:
        eval_pool = [e for e in all_employees if e.is_active]

    gap_items: List[SkillGapItem] = []
    satisfied_count = 0
    missing_mandatory_count = 0
    deficient_count = 0

    for req in project.required_skills:
        skill_name = req.skill.name if req.skill else f"Skill #{req.skill_id}"
        skill_cat = req.skill.category if req.skill else "General"
        min_p = req.min_proficiency

        # Find highest proficiency present in eval_pool
        highest_p = 0
        trainees: List[CandidateUpskillTarget] = []

        # Also search whole active workforce for potential trainees who are 1 level below
        for emp in all_employees:
            if not emp.is_active:
                continue
            for es in emp.skills:
                if es.skill_id == req.skill_id:
                    if emp in eval_pool and es.proficiency_level > highest_p:
                        highest_p = es.proficiency_level
                    
                    # Trainee candidate if 1-2 levels below requirement
                    if es.proficiency_level < min_p:
                        diff = min_p - es.proficiency_level
                        trainees.append(CandidateUpskillTarget(
                            employee_id=emp.id,
                            employee_name=emp.name,
                            current_proficiency=es.proficiency_level,
                            target_proficiency=min_p,
                            learning_effort_hours=diff * 20.0
                        ))

        # Sort trainees by closest to target proficiency
        trainees.sort(key=lambda t: t.current_proficiency, reverse=True)
        top_trainees = trainees[:3]

        if highest_p >= min_p:
            status = "satisfied"
            severity = "NONE"
            satisfied_count += 1
            action = f"Fully satisfied by team (Level {highest_p} >= {min_p})."
        elif highest_p > 0:
            status = "deficient_proficiency"
            severity = "CRITICAL" if req.is_mandatory else "MODERATE"
            deficient_count += 1
            action = f"Proficiency gap (Highest is Level {highest_p}, requires Level {min_p}). Enroll candidate in intermediate/advanced training."
        else:
            status = "missing_completely"
            severity = "CRITICAL" if req.is_mandatory else "LOW"
            if req.is_mandatory:
                missing_mandatory_count += 1
            action = "Skill entirely missing from evaluated roster. Immediate cross-training or external hiring needed."

        gap_items.append(SkillGapItem(
            skill_id=req.skill_id,
            skill_name=skill_name,
            category=skill_cat,
            is_mandatory=req.is_mandatory,
            required_proficiency=min_p,
            current_highest_proficiency=highest_p,
            status=status,
            severity=severity,
            recommended_action=action,
            viable_trainees=top_trainees
        ))

    # Overall project health rating
    if missing_mandatory_count > 0:
        overall_health = "CRITICAL_GAP"
    elif deficient_count > 0:
        overall_health = "RISK"
    else:
        overall_health = "HEALTHY"

    return ProjectSkillGapReport(
        project_id=project.id,
        project_name=project.name,
        overall_health=overall_health,
        required_skills_count=len(project.required_skills),
        satisfied_skills_count=satisfied_count,
        missing_mandatory_count=missing_mandatory_count,
        proficiency_deficient_count=deficient_count,
        gaps=gap_items
    )


def analyze_org_skill_gaps(
    all_projects: List[Project],
    all_employees: List[Employee],
    all_skills: List[Skill]
) -> OrgSkillGapReport:
    """
    Computes organization-wide aggregate skill demand vs supply.
    """
    # Calculate demand per skill
    demand_counts: Dict[int, int] = {}
    for p in all_projects:
        if p.status in ["planning", "in_progress"]:
            for req in p.required_skills:
                demand_counts[req.skill_id] = demand_counts.get(req.skill_id, 0) + 1

    # Calculate supply per skill
    supply_counts: Dict[int, int] = {}
    proficient_counts: Dict[int, int] = {}
    for emp in all_employees:
        if not emp.is_active:
            continue
        for es in emp.skills:
            supply_counts[es.skill_id] = supply_counts.get(es.skill_id, 0) + 1
            if es.proficiency_level >= 3:
                proficient_counts[es.skill_id] = proficient_counts.get(es.skill_id, 0) + 1

    items: List[OrgSkillGapItem] = []
    critical_count = 0

    for s in all_skills:
        dem = demand_counts.get(s.id, 0)
        sup = supply_counts.get(s.id, 0)
        prof = proficient_counts.get(s.id, 0)
        shortage = max(0, dem - prof)

        if dem > 0:
            if prof == 0:
                severity = "CRITICAL"
                critical_count += 1
            elif shortage > 0:
                severity = "HIGH"
                critical_count += 1
            elif sup >= dem:
                severity = "BALANCED"
            else:
                severity = "MODERATE"

            items.append(OrgSkillGapItem(
                skill_id=s.id,
                skill_name=s.name,
                category=s.category,
                total_required_in_projects=dem,
                total_employees_with_skill=sup,
                proficient_employees_count=prof,
                shortage_gap=shortage,
                severity=severity
            ))

    # Sort items by shortage_gap and severity
    items.sort(key=lambda x: (x.shortage_gap, x.total_required_in_projects), reverse=True)

    return OrgSkillGapReport(
        total_skills_tracked=len(all_skills),
        critical_shortages_count=critical_count,
        top_demanded_skills=items
    )
