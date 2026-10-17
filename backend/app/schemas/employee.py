from pydantic import BaseModel, EmailStr
from typing import Optional, List
from backend.app.models.employee import AvailabilityStatus


class SkillBase(BaseModel):
    id: int
    name: str
    category: str


class EmployeeSkillOut(BaseModel):
    skill_id: int
    name: str
    category: str
    proficiency_level: int
    is_verified: bool

    class Config:
        from_attributes = True


class EmployeeSkillUpdate(BaseModel):
    skill_id: int
    proficiency_level: int  # 1 to 4


class AssignmentBrief(BaseModel):
    id: int
    project_id: int
    project_name: str
    assigned_weekly_hours: float
    role_in_project: str
    status: str


class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    department: str
    job_title: str
    years_of_experience: float
    weekly_working_hours: float = 40.0
    availability_status: AvailabilityStatus = AvailabilityStatus.AVAILABLE
    learning_interests: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    skills: Optional[List[EmployeeSkillUpdate]] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    years_of_experience: Optional[float] = None
    weekly_working_hours: Optional[float] = None
    availability_status: Optional[AvailabilityStatus] = None
    learning_interests: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeOut(EmployeeBase):
    id: int
    employee_code: str
    is_active: bool
    committed_hours: float
    remaining_capacity: float
    utilization_percent: float
    skills: List[EmployeeSkillOut] = []
    assignments: List[AssignmentBrief] = []

    class Config:
        from_attributes = True
