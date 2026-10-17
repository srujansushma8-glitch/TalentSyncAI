from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(50), nullable=False, default="General")
    description = Column(String(255), nullable=True)

    # Relationships
    employee_skills = relationship("EmployeeSkill", back_populates="skill", cascade="all, delete-orphan")
    project_requirements = relationship("ProjectRequiredSkill", back_populates="skill")
    training_resources = relationship("TrainingResource", back_populates="skill")


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    proficiency_level = Column(Integer, nullable=False, default=1)  # 1 to 4 scale
    is_verified = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("employee_id", "skill_id", name="uq_employee_skill"),
    )

    # Relationships
    employee = relationship("Employee", back_populates="skills")
    skill = relationship("Skill", back_populates="employee_skills")
