from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.project import Project
from backend.app.models.employee import Employee
from backend.app.models.skill import Skill
from backend.app.schemas.skill_gap import ProjectSkillGapReport, OrgSkillGapReport
from backend.app.services.skill_gap_service import analyze_project_skill_gaps, analyze_org_skill_gaps
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/skill-gaps", tags=["Skill Gap Analysis"])


@router.get("/project/{project_id}", response_model=ProjectSkillGapReport)
def get_project_gaps(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    all_employees = db.query(Employee).all()
    return analyze_project_skill_gaps(project, all_employees)


@router.get("/organization", response_model=OrgSkillGapReport)
def get_organization_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = db.query(Project).all()
    employees = db.query(Employee).all()
    skills = db.query(Skill).all()

    return analyze_org_skill_gaps(projects, employees, skills)
