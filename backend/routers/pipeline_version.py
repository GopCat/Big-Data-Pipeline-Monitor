from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.pipeline_version import (
    PipelineVersionCreate,
    PipelineVersionRead,
    PipelineVersionUpdate,
)
from services import pipeline_version_service

router = APIRouter(prefix="/pipeline-versions", tags=["pipeline-versions"])


@router.post("/", response_model=PipelineVersionRead, status_code=status.HTTP_201_CREATED)
def create_pipeline_version(version: PipelineVersionCreate, db: Session = Depends(get_db)):
    return pipeline_version_service.create_pipeline_version(db, version)


@router.get("/", response_model=list[PipelineVersionRead])
def get_pipeline_versions(db: Session = Depends(get_db)):
    return pipeline_version_service.get_all_pipeline_versions(db)


@router.get("/{version_id}", response_model=PipelineVersionRead)
def get_pipeline_version(version_id: int, db: Session = Depends(get_db)):
    return pipeline_version_service.get_pipeline_version_by_id(db, version_id)


@router.patch("/{version_id}", response_model=PipelineVersionRead)
def update_pipeline_version(
    version_id: int,
    version_update: PipelineVersionUpdate,
    db: Session = Depends(get_db)
):
    return pipeline_version_service.update_pipeline_version(db, version_id, version_update)