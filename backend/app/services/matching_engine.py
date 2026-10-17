from typing import List, Dict, Tuple, Optional
from backend.app.models.employee import Employee, AvailabilityStatus
from backend.app.models.project import Project, ProjectRequiredSkill
from backend.app.schemas.matching import (
    CandidateMatchScore,
    MatchedSkillDetail,
    MissingSkillDetail,
    MatchingWeights,
)


def calculate_candidate_match(
    employee: Employee,
    project: Project,
    weights: Optional[MatchingWeights] = None,
    custom_allocation_hours: Optional[float] = None
) -> CandidateMatchScore:
    """
    Computes deterministic match score using the exact 40/20/25/15 weighted model:
    match_score = 0.40 * skill_score + 0.20 * experience_score + 0.25 * availability_score + 0.15 * proficiency_score
    """
    if weights is None:
        weights = MatchingWeights()

    # Validate weight sum equals 1.0 (with slight float tolerance)
    weight_sum = weights.skill_weight + weights.experience_weight + weights.availability_weight + weights.proficiency_weight
    if abs(weight_sum - 1.0) > 0.001:
        raise ValueError(f"Matching weights must sum to 1.0 (100%), got {weight_sum}")

    # Determine proposed weekly allocation for this candidate
    if custom_allocation_hours is not None:
        proposed_hours = custom_allocation_hours
    elif project.required_team_size > 0:
        proposed_hours = round(project.estimated_weekly_hours / project.required_team_size, 1)
    else:
        proposed_hours = project.estimated_weekly_hours

    # Map employee skills: {skill_id: (proficiency, skill_name, is_verified)}
    emp_skills_map = {
        es.skill_id: (es.proficiency_level, es.skill.name if es.skill else f"Skill #{es.skill_id}")
        for es in employee.skills
    }

    # Analyze Project Requirements
    req_skills = project.required_skills
    matched_skills: List[MatchedSkillDetail] = []
    missing_skills: List[MissingSkillDetail] = []
    proficiency_mismatches: List[MatchedSkillDetail] = []

    total_weight = 0.0
    accumulated_skill_weight = 0.0
    proficiency_sum = 0.0

    if not req_skills:
        skill_score = 100.0
        proficiency_score = 100.0
    else:
        for req in req_skills:
            w = 2.0 if req.is_mandatory else 1.0
            total_weight += w
            skill_name = req.skill.name if req.skill else f"Skill #{req.skill_id}"

            if req.skill_id in emp_skills_map:
                emp_prof, _ = emp_skills_map[req.skill_id]
                accumulated_skill_weight += w
                meets_prof = emp_prof >= req.min_proficiency

                detail = MatchedSkillDetail(
                    skill_id=req.skill_id,
                    skill_name=skill_name,
                    employee_proficiency=emp_prof,
                    required_proficiency=req.min_proficiency,
                    is_mandatory=req.is_mandatory,
                    meets_proficiency=meets_prof
                )
                matched_skills.append(detail)

                if meets_prof:
                    proficiency_sum += 100.0
                else:
                    proficiency_mismatches.append(detail)
                    ratio = (emp_prof / req.min_proficiency) if req.min_proficiency > 0 else 1.0
                    proficiency_sum += ratio * 100.0
            else:
                missing_skills.append(MissingSkillDetail(
                    skill_id=req.skill_id,
                    skill_name=skill_name,
                    required_proficiency=req.min_proficiency,
                    is_mandatory=req.is_mandatory
                ))

        skill_score = (accumulated_skill_weight / total_weight) * 100.0 if total_weight > 0 else 100.0
        proficiency_score = (proficiency_sum / len(matched_skills)) if matched_skills else 0.0

    # 2. Experience Score (20% weight)
    min_exp = project.min_experience if project.min_experience > 0 else 1.0
    emp_exp = employee.years_of_experience
    if emp_exp >= min_exp:
        # 80 base + up to 20 for extra tenure
        surplus = min(5.0, emp_exp - min_exp)
        experience_score = 80.0 + (surplus / 5.0) * 20.0
    else:
        experience_score = (emp_exp / min_exp) * 80.0
    experience_score = min(100.0, max(0.0, experience_score))

    # 3. Availability Score (25% weight)
    committed = employee.committed_hours
    available_hours = max(0.0, employee.weekly_working_hours - committed)
    remaining_after_proj = available_hours - proposed_hours

    if employee.availability_status == AvailabilityStatus.UNAVAILABLE or not employee.is_active:
        availability_score = 0.0
    elif available_hours <= 0:
        availability_score = 0.0
    elif available_hours >= proposed_hours:
        # Full proposed hours available
        availability_score = 100.0
    else:
        # Partial capacity available
        availability_score = (available_hours / proposed_hours) * 70.0
    availability_score = min(100.0, max(0.0, availability_score))

    # Calculate Total Match Score
    match_score = (
        weights.skill_weight * skill_score +
        weights.experience_weight * experience_score +
        weights.availability_weight * availability_score +
        weights.proficiency_weight * proficiency_score
    )

    # Hard Constraints & Violations
    violations: List[str] = []
    warnings: List[str] = []

    if employee.availability_status == AvailabilityStatus.UNAVAILABLE:
        violations.append(f"Employee marked as Unavailable ({employee.availability_status.value})")

    if not employee.is_active:
        violations.append("Employee profile is currently inactive")

    if remaining_after_proj < 0:
        violations.append(
            f"Capacity violation: Needs {proposed_hours}h, only {available_hours}h available (Short by {abs(remaining_after_proj):.1f}h)"
        )

    # Missing mandatory skills
    missing_mandatory = [m for m in missing_skills if m.is_mandatory]
    if missing_mandatory:
        names = ", ".join(m.skill_name for m in missing_mandatory)
        violations.append(f"Missing mandatory project skill(s): {names}")

    # Warnings for soft constraints
    if proficiency_mismatches:
        pm_names = ", ".join(f"{p.skill_name} (Level {p.employee_proficiency}/{p.required_proficiency})" for p in proficiency_mismatches)
        warnings.append(f"Proficiency below requirement for: {pm_names}")

    if employee.availability_status == AvailabilityStatus.PARTIALLY_AVAILABLE:
        warnings.append("Employee is marked as Partially Available")

    has_violation = len(violations) > 0

    # Build human-readable explainability text
    explanation_parts = []
    explanation_parts.append(f"{employee.name} scored {match_score:.1f}% overall for '{project.name}'.")
    explanation_parts.append(
        f"Components: Skill Compatibility: {skill_score:.1f}% (40%), Experience: {experience_score:.1f}% (20%), Availability: {availability_score:.1f}% (25%), Proficiency: {proficiency_score:.1f}% (15%)."
    )

    if has_violation:
        explanation_parts.append(f"⛔ HARD CONSTRAINT ALERT: {'; '.join(violations)}.")
    elif warnings:
        explanation_parts.append(f"⚠️ Notes: {'; '.join(warnings)}.")
    else:
        explanation_parts.append("✅ Fully qualified with sufficient available capacity.")

    return CandidateMatchScore(
        employee_id=employee.id,
        employee_code=employee.employee_code,
        employee_name=employee.name,
        department=employee.department,
        job_title=employee.job_title,
        years_of_experience=employee.years_of_experience,
        availability_status=employee.availability_status.value,
        weekly_working_hours=employee.weekly_working_hours,
        committed_hours=committed,
        remaining_capacity=available_hours,
        proposed_allocation_hours=proposed_hours,
        match_score=round(match_score, 1),
        skill_score=round(skill_score, 1),
        experience_score=round(experience_score, 1),
        availability_score=round(availability_score, 1),
        proficiency_score=round(proficiency_score, 1),
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        proficiency_mismatches=proficiency_mismatches,
        has_hard_constraint_violation=has_violation,
        violations=violations,
        warnings=warnings,
        explanation=" ".join(explanation_parts)
    )
