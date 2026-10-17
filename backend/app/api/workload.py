from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.models.employee import Employee
from backend.app.models.assignment import Assignment
from backend.app.models.audit import AuditLog
from backend.app.schemas.workload import WorkloadSummaryResponse
from backend.app.services.workload_service import calculate_workforce_workload
from backend.app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/workload", tags=["Workload & Capacity"])


@router.get("", response_model=WorkloadSummaryResponse)
def get_workload_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employees = db.query(Employee).all()
    return calculate_workforce_workload(employees)


@router.post("/rebalance/apply")
def apply_rebalance_transfer(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR, UserRole.PM])),
):
    """
    Applies a workload rebalancing transfer:
    Reduces hours from overloaded employee on a project, and allocates them to candidate recipient.
    """
    from_emp_id = payload.get("overloaded_employee_id")
    to_emp_id = payload.get("candidate_recipient_id")
    project_id = payload.get("target_project_id")
    transfer_hours = float(payload.get("suggested_hours_to_transfer", 10.0))

    from_emp = db.query(Employee).filter(Employee.id == from_emp_id).first()
    to_emp = db.query(Employee).filter(Employee.id == to_emp_id).first()
    if not from_emp or not to_emp:
        raise HTTPException(status_code=404, detail="Employee records not found")

    # Find active assignment of from_emp
    asgn_from = db.query(Assignment).filter(
        Assignment.project_id == project_id,
        Assignment.employee_id == from_emp_id,
        Assignment.status == "active"
    ).first()

    if not asgn_from:
        raise HTTPException(status_code=400, detail="Source assignment not active")

    # Reduce or remove from_emp assignment
    if asgn_from.assigned_weekly_hours <= transfer_hours:
        asgn_from.status = "completed"
    else:
        asgn_from.assigned_weekly_hours -= transfer_hours

    # Add or update to_emp assignment
    asgn_to = db.query(Assignment).filter(
        Assignment.project_id == project_id,
        Assignment.employee_id == to_emp_id,
        Assignment.status == "active"
    ).first()

    if asgn_to:
        asgn_to.assigned_weekly_hours += transfer_hours
    else:
        asgn_to = Assignment(
            project_id=project_id,
            employee_id=to_emp_id,
            assigned_weekly_hours=transfer_hours,
            role_in_project=asgn_from.role_in_project,
            status="active",
            approved_by_id=current_user.id
        )
        db.add(asgn_to)

    # Log in audit table
    audit = AuditLog(
        action="WORKLOAD_REBALANCED",
        entity_type="Assignment",
        entity_id=project_id,
        performed_by_id=current_user.id,
        details=f"Rebalanced {transfer_hours}h from {from_emp.name} to {to_emp.name} on Project #{project_id}."
    )
    db.add(audit)

    db.commit()

    return {
        "success": True,
        "message": f"Successfully rebalanced {transfer_hours}h from {from_emp.name} to {to_emp.name}."
    }
