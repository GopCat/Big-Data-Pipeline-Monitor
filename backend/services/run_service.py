from datetime import datetime, timezone


from fastapi import HTTPException, status
from sqlalchemy.orm import Session


from models.alert import Alert
from models.run import Run
from schemas.run import RunUpdate



def get_all_runs(db: Session) -> list[Run]:
    return db.query(Run).all()



def get_run_by_id(db: Session, run_id: int) -> Run:
    run = db.query(Run).filter(Run.id == run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run not found"
        )
    return run



def update_run(db: Session, run_id: int, run_update: RunUpdate) -> Run:
    run = get_run_by_id(db, run_id)

    update_data = run_update.model_dump(exclude_unset=True)

    if "status" in update_data:
        valid_transitions = {
            "pending": ["running"],
            "running": ["success", "failed"],
            "success": [],
            "failed": [],
        }

        new_status = update_data["status"]
        if new_status not in valid_transitions.get(run.status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{run.status}' to '{new_status}'"
            )

        if new_status == "running" and not run.started_at:
            run.started_at = datetime.now(timezone.utc)

        if new_status in ["success", "failed"]:
            run.finished_at = datetime.now(timezone.utc)

            if run.started_at:
                started_at = run.started_at
                finished_at = run.finished_at

                if started_at.tzinfo is None:
                    started_at = started_at.replace(tzinfo=timezone.utc)

                if finished_at.tzinfo is None:
                    finished_at = finished_at.replace(tzinfo=timezone.utc)

                run.runtime = int((finished_at - started_at).total_seconds())
            long_running_alerts = (
                db.query(Alert)
                .filter(
                    Alert.run_id == run.id,
                    Alert.alert_type == "run_too_long",
                    Alert.status == "open"
                )
                .all()
            )

            for alert in long_running_alerts:
                alert.status = "closed"

            for field, value in update_data.items():
                setattr(run, field, value)

    if update_data.get("status") == "failed":
        alert = Alert(
            pipeline_id=run.pipeline_id,
            run_id=run.id,
            alert_type="run_failed",
            severity="critical",
            status="open",
            message=run.error_message or "Pipeline run failed"
        )
        db.add(alert)

    db.commit()
    db.refresh(run)
    return run