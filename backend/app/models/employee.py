import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base


class AvailabilityStatus(str, enum.Enum):
    AVAILABLE = "available"
    PARTIALLY_AVAILABLE = "partially_available"
    UNAVAILABLE = "unavailable"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=False, index=True)
    job_title = Column(String(100), nullable=False)
    years_of_experience = Column(Float, nullable=False, default=0.0)
    weekly_working_hours = Column(Float, nullable=False, default=40.0)
    availability_status = Column(Enum(AvailabilityStatus), default=AvailabilityStatus.AVAILABLE, nullable=False)
    learning_interests = Column(Text, nullable=True)  # Comma-separated or descriptive
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="employee_profile")
    skills = relationship("EmployeeSkill", back_populates="employee", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="employee", cascade="all, delete-orphan")
    training_recommendations = relationship("TrainingRecommendation", back_populates="employee", cascade="all, delete-orphan")

    @property
    def committed_hours(self) -> float:
        """Calculate total committed hours across active assignments."""
        return sum(a.assigned_weekly_hours for a in self.assignments if a.status == "active")

    @property
    def remaining_capacity(self) -> float:
        """Calculate remaining unassigned weekly hours."""
        return max(0.0, self.weekly_working_hours - self.committed_hours)

    @property
    def utilization_percent(self) -> float:
        """Calculate current workforce utilization percentage."""
        if self.weekly_working_hours <= 0:
            return 0.0
        return round((self.committed_hours / self.weekly_working_hours) * 100.0, 1)
