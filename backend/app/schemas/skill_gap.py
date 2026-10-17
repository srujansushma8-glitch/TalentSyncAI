from pydantic import BaseModel
from typing import List, Optional


class CandidateUpskillTarget(BaseModel):
    employee_id: int
    employee_name: str
    current_proficiency: int
    target_proficiency: int
    learning_effort_hours: float


class SkillGapItem(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    is_mandatory: bool
    required_proficiency: int
    current_highest_proficiency: int
    status: str  # "satisfied", "deficient_proficiency", "missing_completely"
    severity: str  # "CRITICAL", "MODERATE", "LOW", "NONE"
    recommended_action: str
    viable_trainees: List[CandidateUpskillTarget] = []


class ProjectSkillGapReport(BaseModel):
    project_id: int
    project_name: str
    overall_health: str  # "HEALTHY", "RISK", "CRITICAL_GAP"
    required_skills_count: int
    satisfied_skills_count: int
    missing_mandatory_count: int
    proficiency_deficient_count: int
    gaps: List[SkillGapItem]


class OrgSkillGapItem(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    total_required_in_projects: int
    total_employees_with_skill: int
    proficient_employees_count: int  # proficiency >= 3
    shortage_gap: int
    severity: str  # "CRITICAL", "HIGH", "MODERATE", "BALANCED"


class OrgSkillGapReport(BaseModel):
    total_skills_tracked: int
    critical_shortages_count: int
    top_demanded_skills: List[OrgSkillGapItem]
