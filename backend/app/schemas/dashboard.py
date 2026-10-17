from pydantic import BaseModel
from typing import List, Dict, Any


class DashboardKPIs(BaseModel):
    total_employees: int
    active_projects: int
    available_employees: int
    projects_with_staffing_gaps: int
    overloaded_employees: int
    underutilized_employees: int
    average_workforce_utilization: float
    overall_skill_coverage_percent: float


class UtilizationDistributionPoint(BaseModel):
    tier: str  # "<50%", "50-70%", "70-100%", ">100% (Overloaded)"
    count: int
    percentage: float


class DepartmentCapacityPoint(BaseModel):
    department: str
    total_headcount: int
    total_capacity_hours: float
    allocated_hours: float
    utilization_rate: float


class SkillDistributionPoint(BaseModel):
    category: str
    employee_count: int
    avg_proficiency: float


class ProjectStaffingPoint(BaseModel):
    project_id: int
    project_name: str
    priority: str
    required_team_size: int
    assigned_count: int
    fulfillment_percent: float
    has_gaps: bool


class DashboardAnalyticsResponse(BaseModel):
    kpis: DashboardKPIs
    utilization_distribution: List[UtilizationDistributionPoint]
    department_capacities: List[DepartmentCapacityPoint]
    skill_distributions: List[SkillDistributionPoint]
    project_staffing: List[ProjectStaffingPoint]
    recent_activity: List[Dict[str, Any]] = []
