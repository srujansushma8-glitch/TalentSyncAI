from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    assigned_weekly_hours = Column(Float, nullable=False, default=15.0)
    role_in_project = Column(String(100), nullable=False, default="Team Member")
    status = Column(String(50), nullable=False, default="active")  # active, completed, cancelled
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments")
    approved_by = relationship("User")
