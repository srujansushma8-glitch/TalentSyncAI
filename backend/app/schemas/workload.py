from pydantic import BaseModel
from typing import List, Optional


class EmployeeWorkloadItem(BaseModel):
    employee_id: int
    employee_code: str
    employee_name: str
    department: str
    job_title: str
    weekly_working_hours: float
    committed_hours: float
    remaining_capacity: float
    utilization_percent: float
    status: str  # "OVERLOADED", "OPTIMAL", "UNDERUTILIZED"
    active_assignments_count: int


class RebalanceSuggestion(BaseModel):
    overloaded_employee_id: int
    overloaded_employee_name: str
    target_project_id: int
    target_project_name: str
    current_assigned_hours: float
    suggested_hours_to_transfer: float
    candidate_recipient_id: int
    candidate_recipient_name: str
    candidate_current_utilization: float
    candidate_projected_utilization: float
    justification: str


class WorkloadSummaryResponse(BaseModel):
    total_employees: int
    average_utilization_percent: float
    overloaded_count: int
    optimal_count: int
    underutilized_count: int
    overloaded_employees: List[EmployeeWorkloadItem]
    underutilized_employees: List[EmployeeWorkloadItem]
    all_employees: List[EmployeeWorkloadItem]
    rebalance_suggestions: List[RebalanceSuggestion]
