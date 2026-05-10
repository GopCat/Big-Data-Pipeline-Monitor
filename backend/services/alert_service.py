from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from models.alert import Alert
from models.pipeline import Pipeline
from models.run import Run
from schemas.alert import AlertCreate, AlertUpdate


def create_alert(db: Session, alert_data: AlertCreate) -> Alert:
    pipeline = db.query(Pipeline).filter(Pipeline.id == alert_data.pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pipeline does not exist"
        )

    if alert_data.run_id is not None:
        run = db.query(Run).filter(Run.id == alert_data.run_id).first()
        if not run:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Run does not exist"
            )

    db_alert = Alert(**alert_data.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


def get_all_alerts(db: Session) -> list[Alert]:
    return db.query(Alert).all()


def get_alert_by_id(db: Session, alert_id: int) -> Alert:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    return alert


def update_alert(db: Session, alert_id: int, alert_update: AlertUpdate) -> Alert:
    alert = get_alert_by_id(db, alert_id)

    update_data = alert_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(alert, field, value)

    db.commit()
    db.refresh(alert)
    return alert


LONG_RUNNING_THRESHOLD_SECONDS = 60


def check_long_running_runs(db: Session) -> int:
    now = datetime.now(timezone.utc)
    threshold_time = now - timedelta(seconds=LONG_RUNNING_THRESHOLD_SECONDS)

    long_running_runs = (
        db.query(Run)
        .filter(
            Run.status == "running",
            Run.started_at.isnot(None),
            Run.started_at <= threshold_time
        )
        .all()
    )

    created_count = 0

    for run in long_running_runs:
        existing_alert = (
            db.query(Alert)
            .filter(
                Alert.run_id == run.id,
                Alert.alert_type == "run_too_long",
                Alert.status == "open"
            )
            .first()
        )

        if existing_alert:
            continue

        started_at = run.started_at
        if started_at.tzinfo is None:
            started_at = started_at.replace(tzinfo=timezone.utc)

        duration_seconds = int((now - started_at).total_seconds())

        alert = Alert(
            pipeline_id=run.pipeline_id,
            run_id=run.id,
            alert_type="run_too_long",
            severity="warning",
            status="open",
            message=f"Pipeline run has been running for {duration_seconds} seconds, which exceeds the 60 second threshold."
        )
        db.add(alert)
        created_count += 1

    if created_count > 0:
        db.commit()

    return created_count