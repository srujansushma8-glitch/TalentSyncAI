from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.employee import Employee
from backend.app.models.project import Project
from backend.app.models.skill import Skill
from backend.app.services.export_service import (
    export_employees_skills_csv,
    export_projects_csv,
    export_workload_csv,
    export_skill_gaps_csv,
)
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])


@router.get("/employees.csv")
def download_employees_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employees = db.query(Employee).all()
    csv_data = export_employees_skills_csv(employees)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=employees_skills_inventory.csv"}
    )


@router.get("/projects.csv")
def download_projects_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = db.query(Project).all()
    csv_data = export_projects_csv(projects)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=project_staffing_report.csv"}
    )


@router.get("/workload.csv")
def download_workload_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employees = db.query(Employee).all()
    csv_data = export_workload_csv(employees)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=workload_capacity_report.csv"}
    )


@router.get("/skill-gaps.csv")
def download_skill_gaps_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = db.query(Project).all()
    employees = db.query(Employee).all()
    skills = db.query(Skill).all()
    csv_data = export_skill_gaps_csv(projects, employees, skills)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=org_skill_gaps_report.csv"}
    )
