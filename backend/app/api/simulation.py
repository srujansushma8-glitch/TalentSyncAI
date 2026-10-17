from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.project import Project
from backend.app.models.employee import Employee
from backend.app.models.assignment import Assignment
from backend.app.models.audit import AuditLog
from backend.app.schemas.simulation import (
    SimulationParams,
    SimulationComparison,
    ApplySimulationRequest,
)
from backend.app.services.simulation_service import run_what_if_simulation
from backend.app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/simulation", tags=["What-If Simulator"])


@router.post("/run", response_model=SimulationComparison)
def simulate_scenario(
    params: SimulationParams,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == params.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    all_employees = db.query(Employee).all()
    return run_what_if_simulation(project, all_employees, params)


@router.post("/apply")
def apply_simulated_allocation(
    payload: ApplySimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.PM])),
):
    """
    Manager approval gate: commits simulated allocation into live assignments with an audit trail.
    """
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Deactivate existing active assignments
    db.query(Assignment).filter(
        Assignment.project_id == payload.project_id,
        Assignment.status == "active"
    ).update({"status": "cancelled"})

    applied_names = []
    for alloc in payload.allocations:
        emp = db.query(Employee).filter(Employee.id == alloc.employee_id).first()
        if not emp:
            continue

        asgn = Assignment(
            project_id=project.id,
            employee_id=emp.id,
            assigned_weekly_hours=alloc.assigned_hours,
            role_in_project="Simulated Approved Member",
            status="active",
            approved_by_id=current_user.id
        )
        db.add(asgn)
        applied_names.append(f"{emp.name} ({alloc.assigned_hours}h)")

    project.status = "in_progress"

    audit = AuditLog(
        action="SIMULATION_APPROVED_AND_APPLIED",
        entity_type="Project",
        entity_id=project.id,
        performed_by_id=current_user.id,
        details=f"Approved simulation allocation for {project.name}: {', '.join(applied_names)}."
    )
    db.add(audit)

    db.commit()

    return {
        "success": True,
        "message": f"Successfully applied {len(applied_names)} simulated allocations to project '{project.name}'.",
        "applied_members": applied_names
    }
