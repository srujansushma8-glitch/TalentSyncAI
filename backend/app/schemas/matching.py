from pydantic import BaseModel
from typing import List, Optional, Dict


class MatchedSkillDetail(BaseModel):
    skill_id: int
    skill_name: str
    employee_proficiency: int
    required_proficiency: int
    is_mandatory: bool
    meets_proficiency: bool


class MissingSkillDetail(BaseModel):
    skill_id: int
    skill_name: str
    required_proficiency: int
    is_mandatory: bool


class CandidateMatchScore(BaseModel):
    employee_id: Optional[int] = None
    employee_code: str
    employee_name: str
    department: str
    job_title: str
    years_of_experience: float
    availability_status: str
    weekly_working_hours: float
    committed_hours: float
    remaining_capacity: float
    proposed_allocation_hours: float

    # Exact weighted scores (0 to 100)
    match_score: float
    skill_score: float         # 40%
    experience_score: float    # 20%
    availability_score: float  # 25%
    proficiency_score: float   # 15%

    # Skill details
    matched_skills: List[MatchedSkillDetail] = []
    missing_skills: List[MissingSkillDetail] = []
    proficiency_mismatches: List[MatchedSkillDetail] = []

    # Constraints and Explainability
    has_hard_constraint_violation: bool
    violations: List[str] = []
    warnings: List[str] = []
    explanation: str


class MatchingWeights(BaseModel):
    skill_weight: float = 0.40
    experience_weight: float = 0.20
    availability_weight: float = 0.25
    proficiency_weight: float = 0.15


class ProjectMatchingResult(BaseModel):
    project_id: int
    project_name: str
    weights_used: MatchingWeights
    total_candidates_evaluated: int
    eligible_candidates_count: int
    candidates: List[CandidateMatchScore]
