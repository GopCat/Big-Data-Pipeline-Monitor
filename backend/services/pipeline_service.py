from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.dataset import Dataset
from models.pipeline import Pipeline
from models.run import Run
from schemas.pipeline import PipelineCreate, PipelineUpdate
from services.pipeline_simulator import start_pipeline_simulation


def create_pipeline(db: Session, pipeline_data: PipelineCreate) -> Pipeline:
    dataset = db.query(Dataset).filter(Dataset.id == pipeline_data.dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset does not exist"
        )

    existing_pipeline = db.query(Pipeline).filter(Pipeline.name == pipeline_data.name).first()
    if existing_pipeline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pipeline with this name already exists"
        )

    db_pipeline = Pipeline(**pipeline_data.model_dump())
    db.add(db_pipeline)
    db.commit()
    db.refresh(db_pipeline)
    return db_pipeline


def get_all_pipelines(db: Session) -> list[Pipeline]:
    return db.query(Pipeline).all()


def get_pipeline_by_id(db: Session, pipeline_id: int) -> Pipeline:
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found"
        )
    return pipeline


def update_pipeline(db: Session, pipeline_id: int, pipeline_update: PipelineUpdate) -> Pipeline:
    pipeline = get_pipeline_by_id(db, pipeline_id)

    update_data = pipeline_update.model_dump(exclude_unset=True)

    if "dataset_id" in update_data:
        dataset = db.query(Dataset).filter(Dataset.id == update_data["dataset_id"]).first()
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dataset does not exist"
            )

    if "name" in update_data:
        existing_pipeline = db.query(Pipeline).filter(
            Pipeline.name == update_data["name"],
            Pipeline.id != pipeline_id
        ).first()
        if existing_pipeline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pipeline with this name already exists"
            )

    for field, value in update_data.items():
        setattr(pipeline, field, value)

    db.commit()
    db.refresh(pipeline)
    return pipeline


def run_pipeline(db: Session, pipeline_id: int) -> Run:
    pipeline = get_pipeline_by_id(db, pipeline_id)

    if not pipeline.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pipeline is not active"
        )

    new_run = Run(
        pipeline_id=pipeline.id,
        status="pending",
        started_at=None,
        finished_at=None,
        runtime=None,
        records_processed=None,
        error_message=None
    )

    db.add(new_run)
    db.commit()
    db.refresh(new_run)

    start_pipeline_simulation(new_run.id)

    return new_run