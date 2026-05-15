import random
import threading
import time
from datetime import datetime, timezone

from db.database import SessionLocal
from models.alert import Alert
from models.run import Run
from schemas.run_step import RunStepCreate, RunStepUpdate
from services import run_step_service


MIN_DURATION_SECONDS = 50
MAX_DURATION_SECONDS = 120
SUCCESS_PROBABILITY = 0.7
MIN_RECORDS = 500
MAX_RECORDS = 5000


def ensure_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def calculate_runtime_seconds(started_at, finished_at):
    started_at = ensure_utc(started_at)
    finished_at = ensure_utc(finished_at)

    if not started_at or not finished_at:
        return None

    return int((finished_at - started_at).total_seconds())


def simulate_pipeline_run(run_id: int) -> None:
    db = SessionLocal()

    try:
        run = db.query(Run).filter(Run.id == run_id).first()
        if not run:
            return

        if run.status != "pending":
            return

        time.sleep(5)

        run = db.query(Run).filter(Run.id == run_id).first()
        if not run or run.status != "pending":
            return

        run.status = "running"
        run.started_at = datetime.now(timezone.utc)
        run.records_processed = 0
        run.error_message = None
        db.commit()
        db.refresh(run)

        step_names = ["Extract", "Validate", "Transform", "Load"]
        created_step_ids = []

        for step_name in step_names:
            step = run_step_service.create_run_step(
                db,
                RunStepCreate(
                    run_id=run.id,
                    name=step_name,
                    status="pending"
                )
            )
            created_step_ids.append(step.id)

        duration = random.randint(MIN_DURATION_SECONDS, MAX_DURATION_SECONDS)
        total_records = random.randint(MIN_RECORDS, MAX_RECORDS)
        step_duration = max(1, duration // len(created_step_ids))
        should_fail = random.random() >= SUCCESS_PROBABILITY
        failed_step_index = (
            random.randint(0, len(created_step_ids) - 1)
            if should_fail else None
        )

        processed_so_far = 0

        for index, step_id in enumerate(created_step_ids):
            run_step_service.update_run_step(
                db,
                step_id,
                RunStepUpdate(status="running")
            )

            for _ in range(step_duration):
                time.sleep(1)

                run = db.query(Run).filter(Run.id == run_id).first()
                if not run:
                    return

                if run.status != "running":
                    return

                increment = max(1, total_records // duration)
                processed_so_far = min(total_records, processed_so_far + increment)
                run.records_processed = processed_so_far
                db.commit()
                db.refresh(run)

            if should_fail and index == failed_step_index:
                run_step_service.update_run_step(
                    db,
                    step_id,
                    RunStepUpdate(status="failed")
                )

                current_step = run_step_service.get_run_step_by_id(db, step_id)

                run = db.query(Run).filter(Run.id == run_id).first()
                if not run:
                    return

                run.status = "failed"
                run.finished_at = datetime.now(timezone.utc)
                run.error_message = f"Step '{current_step.name}' failed."
                run.runtime = calculate_runtime_seconds(run.started_at, run.finished_at)

                failed_alert = Alert(
                    pipeline_id=run.pipeline_id,
                    run_id=run.id,
                    alert_type="run_failed",
                    severity="critical",
                    status="open",
                    message=run.error_message
                )
                db.add(failed_alert)
                db.commit()
                return

            run_step_service.update_run_step(
                db,
                step_id,
                RunStepUpdate(status="success")
            )

        run = db.query(Run).filter(Run.id == run_id).first()
        if not run:
            return

        run.status = "success"
        run.finished_at = datetime.now(timezone.utc)
        run.error_message = None
        run.records_processed = total_records
        run.runtime = calculate_runtime_seconds(run.started_at, run.finished_at)

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

        db.commit()

    except Exception as e:
        db.rollback()

        try:
            run = db.query(Run).filter(Run.id == run_id).first()
            if run:
                run.status = "failed"
                run.finished_at = datetime.now(timezone.utc)
                run.error_message = f"Simulator error: {str(e)}"
                run.runtime = calculate_runtime_seconds(run.started_at, run.finished_at)
                db.commit()
        except Exception as inner_error:
            db.rollback()
            print(f"[simulator] Failed to mark run {run_id} as failed: {inner_error}")

        print(f"[simulator] Error while simulating run {run_id}: {e}")

    finally:
        db.close()


def start_pipeline_simulation(run_id: int) -> None:
    thread = threading.Thread(
        target=simulate_pipeline_run,
        args=(run_id,),
        daemon=True
    )
    thread.start()