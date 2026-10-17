from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TrainingResourceBase(BaseModel):
    skill_id: int
    title: str
    provider: str
    url: str
    level: str = "Intermediate"
    estimated_hours: float = 20.0
    description: Optional[str] = None


class TrainingResourceCreate(TrainingResourceBase):
    pass


class TrainingResourceOut(TrainingResourceBase):
    id: int
    skill_name: str
    skill_category: str

    class Config:
        from_attributes = True


class TrainingRecommendationOut(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    resource_id: int
    resource_title: str
    resource_provider: str
    resource_url: str
    level: str
    estimated_hours: float
    target_skill_name: str
    reason: str
    sequence_order: int
    priority: str  # "HIGH", "MEDIUM", "LOW"
    status: str    # "recommended", "enrolled", "completed"
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateTrainingStatus(BaseModel):
    status: str  # "recommended", "enrolled", "completed"
