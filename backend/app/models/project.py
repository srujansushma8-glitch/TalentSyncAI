import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum, Text, DateTime, Date, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.database import Base


class ProjectStatus(str, enum.Enum):
    DRAFT = "draft"
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ProjectPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    department = Column(String(100), nullable=False)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PLANNING, nullable=False)
    priority = Column(Enum(ProjectPriority), default=ProjectPriority.MEDIUM, nullable=False)
    required_team_size = Column(Integer, default=3, nullable=False)
    estimated_weekly_hours = Column(Float, default=30.0, nullable=False)
    min_experience = Column(Float, default=1.0, nullable=False)
    start_date = Column(Date, nullable=True)
    deadline = Column(Date, nullable=True)
    project_manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project_manager = relationship("User")
    required_skills = relationship("ProjectRequiredSkill", back_populates="project", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="project", cascade="all, delete-orphan")

    @property
    def assigned_count(self) -> int:
        return len([a for a in self.assignments if a.status == "active"])

    @property
    def staffing_fulfillment_percent(self) -> float:
        if self.required_team_size <= 0:
            return 100.0
        return round(min(100.0, (self.assigned_count / self.required_team_size) * 100.0), 1)


class ProjectRequiredSkill(Base):
    __tablename__ = "project_required_skills"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    min_proficiency = Column(Integer, nullable=False, default=2)  # 1 to 4
    is_mandatory = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("project_id", "skill_id", name="uq_project_skill"),
    )

    # Relationships
    project = relationship("Project", back_populates="required_skills")
    skill = relationship("Skill", back_populates="project_requirements")
