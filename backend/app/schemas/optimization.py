from pydantic import BaseModel
from typing import List, Optional
from backend.app.schemas.matching import CandidateMatchScore


class TeamMemberAllocation(BaseModel):
    employee_id: int
    employee_name: str
    employee_code: str
    department: str
    job_title: str
    assigned_hours: float
    current_committed_hours: float
    new_total_committed_hours: float
    new_utilization_percent: float
    remaining_capacity: float
    covered_skills: List[str]


class TeamOption(BaseModel):
    id: str  # e.g., "primary", "alternative_1", "alternative_2"
    name: str
    team_fit_score: float  # 0 to 100
    is_feasible: bool
    skill_coverage_percent: float
    proficiency_coverage_percent: float
    workload_fairness_score: float
    uncovered_mandatory_skills: List[str] = []
    uncovered_optional_skills: List[str] = []
    members: List[TeamMemberAllocation] = []
    trade_off_explanation: str


class OptimizationResponse(BaseModel):
    project_id: int
    project_name: str
    required_team_size: int
    estimated_weekly_hours: float
    is_fully_feasible: bool
    recommended_team: TeamOption
    alternative_teams: List[TeamOption] = []
    feasibility_notes: List[str] = []
    solver_used: str  # "Deterministic Branch-and-Bound Optimizer" or "OR-Tools CP-SAT"
