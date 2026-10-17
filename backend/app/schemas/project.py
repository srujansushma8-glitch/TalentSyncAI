from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from backend.app.models.project import ProjectStatus, ProjectPriority


class ProjectRequiredSkillBase(BaseModel):
    skill_id: int
    min_proficiency: int = 2
    is_mandatory: bool = True


class ProjectRequiredSkillOut(ProjectRequiredSkillBase):
    id: int
    skill_name: str
    category: str

    class Config:
        from_attributes = True


class ProjectAssignmentBrief(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    assigned_weekly_hours: float
    role_in_project: str
    status: str


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    department: str
    status: ProjectStatus = ProjectStatus.PLANNING
    priority: ProjectPriority = ProjectPriority.MEDIUM
    required_team_size: int = 3
    estimated_weekly_hours: float = 30.0
    min_experience: float = 1.0
    start_date: Optional[date] = None
    deadline: Optional[date] = None


class ProjectCreate(ProjectBase):
    required_skills: List[ProjectRequiredSkillBase] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    required_team_size: Optional[int] = None
    estimated_weekly_hours: Optional[float] = None
    min_experience: Optional[float] = None
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    required_skills: Optional[List[ProjectRequiredSkillBase]] = None


class ProjectOut(ProjectBase):
    id: int
    created_at: datetime
    assigned_count: int
    staffing_fulfillment_percent: float
    required_skills: List[ProjectRequiredSkillOut] = []
    assignments: List[ProjectAssignmentBrief] = []

    class Config:
        from_attributes = True
