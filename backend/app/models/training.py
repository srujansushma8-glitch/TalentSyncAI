from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base


class TrainingResource(Base):
    __tablename__ = "training_resources"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    level = Column(String(50), nullable=False, default="Intermediate")  # Beginner, Intermediate, Advanced
    estimated_hours = Column(Float, nullable=False, default=20.0)
    description = Column(Text, nullable=True)

    # Relationships
    skill = relationship("Skill", back_populates="training_resources")
    recommendations = relationship("TrainingRecommendation", back_populates="resource", cascade="all, delete-orphan")


class TrainingRecommendation(Base):
    __tablename__ = "training_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("training_resources.id", ondelete="CASCADE"), nullable=False)
    target_skill_id = Column(Integer, ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String(255), nullable=False)
    status = Column(String(50), default="recommended", nullable=False)  # recommended, enrolled, completed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="training_recommendations")
    resource = relationship("TrainingResource", back_populates="recommendations")
    target_skill = relationship("Skill")
