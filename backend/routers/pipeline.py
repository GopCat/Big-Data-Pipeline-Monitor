from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.pipeline import PipelineCreate, PipelineRead, PipelineUpdate
from schemas.run import RunRead
from services import pipeline_service

router = APIRouter(prefix="/pipelines", tags=["pipelines"])


@router.post("/", response_model=PipelineRead, status_code=status.HTTP_201_CREATED)
def create_pipeline(pipeline: PipelineCreate, db: Session = Depends(get_db)):
    return pipeline_service.create_pipeline(db, pipeline)


@router.get("/", response_model=list[PipelineRead])
def get_pipelines(db: Session = Depends(get_db)):
    return pipeline_service.get_all_pipelines(db)


@router.get("/{pipeline_id}", response_model=PipelineRead)
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    return pipeline_service.get_pipeline_by_id(db, pipeline_id)


@router.patch("/{pipeline_id}", response_model=PipelineRead)
def update_pipeline(
    pipeline_id: int,
    pipeline_update: PipelineUpdate,
    db: Session = Depends(get_db)
):
    return pipeline_service.update_pipeline(db, pipeline_id, pipeline_update)


@router.post("/{pipeline_id}/run", response_model=RunRead, status_code=status.HTTP_201_CREATED)
def run_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    return pipeline_service.run_pipeline(db, pipeline_id)