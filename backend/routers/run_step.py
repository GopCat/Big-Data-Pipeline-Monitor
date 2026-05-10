from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.run_step import RunStepCreate, RunStepRead, RunStepUpdate
from services import run_step_service

router = APIRouter(prefix="/run-steps", tags=["run-steps"])


@router.post("/", response_model=RunStepRead, status_code=status.HTTP_201_CREATED)
def create_run_step(step: RunStepCreate, db: Session = Depends(get_db)):
    return run_step_service.create_run_step(db, step)


@router.get("/", response_model=list[RunStepRead])
def get_run_steps(run_id: int | None = None, db: Session = Depends(get_db)):
    if run_id is not None:
        return run_step_service.get_run_steps_by_run_id(db, run_id)
    return run_step_service.get_all_run_steps(db)


@router.get("/{step_id}", response_model=RunStepRead)
def get_run_step(step_id: int, db: Session = Depends(get_db)):
    return run_step_service.get_run_step_by_id(db, step_id)


@router.patch("/{step_id}", response_model=RunStepRead)
def update_run_step(step_id: int, step_update: RunStepUpdate, db: Session = Depends(get_db)):
    return run_step_service.update_run_step(db, step_id, step_update)