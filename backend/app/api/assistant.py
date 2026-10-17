from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.services.assistant_service import query_workforce_assistant
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/assistant", tags=["Workforce Assistant"])


@router.post("/query")
def ask_assistant(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = payload.get("query", "")
    return query_workforce_assistant(query, db, user_role=current_user.role.value)
