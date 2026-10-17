from pydantic import BaseModel
from typing import List, Optional, Dict
from backend.app.schemas.optimization import TeamMemberAllocation


class CandidateOverride(BaseModel):
    employee_id: int
    is_forced_available: Optional[bool] = None
    is_excluded: Optional[bool] = None


class SimulationParams(BaseModel):
    project_id: int
    adjusted_team_size: Optional[int] = None
    adjusted_weekly_hours: Optional[float] = None
    candidate_overrides: List[CandidateOverride] = []
    required_skill_ids: Optional[List[int]] = None


class SimulationMemberDiff(BaseModel):
    employee_id: int
    employee_name: str
    status: str  # "retained", "added", "removed"
    allocated_hours: float
    utilization_before: float
    utilization_after: float


class SimulationComparison(BaseModel):
    project_id: int
    project_name: str
    simulation_id: str

    # Team size & hours
    original_team_size: int
    simulated_team_size: int
    original_weekly_hours: float
    simulated_weekly_hours: float

    # Metric comparisons
    original_skill_coverage: float
    simulated_skill_coverage: float
    original_team_fit_score: float
    simulated_team_fit_score: float

    # Member deltas
    original_members: List[TeamMemberAllocation]
    simulated_members: List[TeamMemberAllocation]
    member_diffs: List[SimulationMemberDiff]

    # Gaps and capacity
    resolved_gaps: List[str] = []
    new_capacity_warnings: List[str] = []
    trade_off_summary: str


class ApplySimulationRequest(BaseModel):
    project_id: int
    allocations: List[TeamMemberAllocation]
