from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.project import Project
from backend.app.models.employee import Employee
from backend.app.models.assignment import Assignment
from backend.app.models.audit import AuditLog
from backend.app.schemas.optimization import OptimizationResponse
from backend.app.services.team_optimizer import optimize_project_team
from backend.app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/optimization", tags=["Team Optimization"])


@router.get("/{project_id}", response_model=OptimizationResponse)
def get_optimized_teams(
    project_id: int,
    team_size: Optional[int] = None,
    weekly_hours: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    employees = db.query(Employee).filter(Employee.is_active == True).all()

    return optimize_project_team(
        project,
        employees,
        custom_team_size=team_size,
        custom_weekly_hours=weekly_hours
    )


@router.post("/{project_id}/apply")
def apply_optimized_team(
    project_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.PM])),
):
    """
    Applies the selected team combination to live database assignments.
    Transactional and protected by manager authorization.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    allocations = payload.get("allocations", [])
    if not allocations:
        raise HTTPException(status_code=400, detail="No member allocations provided")

    # Deactivate existing active assignments for this project
    db.query(Assignment).filter(
        Assignment.project_id == project_id,
        Assignment.status == "active"
    ).update({"status": "cancelled"})

    assigned_names = []
    for alloc in allocations:
        emp_id = alloc.get("employee_id")
        hours = float(alloc.get("assigned_hours", 15.0))
        role = alloc.get("role", "Team Member")

        emp = db.query(Employee).filter(Employee.id == emp_id).first()
        if not emp:
            continue

        asgn = Assignment(
            project_id=project.id,
            employee_id=emp.id,
            assigned_weekly_hours=hours,
            role_in_project=role,
            status="active",
            approved_by_id=current_user.id
        )
        db.add(asgn)
        assigned_names.append(f"{emp.name} ({hours}h)")

    project.status = "in_progress"

    # Audit log
    audit = AuditLog(
        action="TEAM_OPTIMIZATION_APPLIED",
        entity_type="Project",
        entity_id=project.id,
        performed_by_id=current_user.id,
        details=f"Applied team allocation of {len(assigned_names)} members: {', '.join(assigned_names)}."
    )
    db.add(audit)

    db.commit()

    return {
        "success": True,
        "message": f"Successfully applied team of {len(assigned_names)} members to {project.name}.",
        "assigned_members": assigned_names
    }
