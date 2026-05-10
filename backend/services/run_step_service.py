from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.run_step import RunStep
from models.run import Run
from schemas.run_step import RunStepCreate, RunStepUpdate


def create_run_step(db: Session, step_data: RunStepCreate) -> RunStep:
    run = db.query(Run).filter(Run.id == step_data.run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Run does not exist"
        )

    db_step = RunStep(**step_data.model_dump())
    db.add(db_step)
    db.commit()
    db.refresh(db_step)
    return db_step


def get_all_run_steps(db: Session) -> list[RunStep]:
    return db.query(RunStep).all()


def get_run_step_by_id(db: Session, step_id: int) -> RunStep:
    step = db.query(RunStep).filter(RunStep.id == step_id).first()
    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run step not found"
        )
    return step


def get_run_steps_by_run_id(db: Session, run_id: int) -> list[RunStep]:
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )

    return (
        db.query(RunStep)
        .filter(RunStep.run_id == run_id)
        .all()
    )


def update_run_step(db: Session, step_id: int, step_update: RunStepUpdate) -> RunStep:
    step = get_run_step_by_id(db, step_id)
    update_data = step_update.model_dump(exclude_unset=True)

    if "status" in update_data:
        valid_transitions = {
            "pending": ["running"],
            "running": ["success", "failed"],
            "success": [],
            "failed": [],
        }

        new_status = update_data["status"]
        if new_status not in valid_transitions.get(step.status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{step.status}' to '{new_status}'"
            )

        if new_status == "running" and not step.started_at:
            step.started_at = datetime.now(timezone.utc)

        if new_status in ["success", "failed"] and not step.finished_at:
            step.finished_at = datetime.now(timezone.utc)

    for field, value in update_data.items():
        setattr(step, field, value)

    db.commit()
    db.refresh(step)
    return step