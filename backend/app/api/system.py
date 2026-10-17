from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.schemas.auth import UserOut
from backend.app.seed.seed_data import seed_database
from backend.app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/system", tags=["System & Settings"])


@router.post("/reset-demo-data")
def reset_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR])),
):
    """
    Resets the database to pristine synthetic demo state.
    """
    seed_database(db)
    return {
        "success": True,
        "message": "Demo data successfully re-initialized with 22 synthetic employees and 5 projects."
    }


@router.get("/users", response_model=List[UserOut])
def list_system_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    users = db.query(User).all()
    return users
