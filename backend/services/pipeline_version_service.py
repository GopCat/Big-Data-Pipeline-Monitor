from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.pipeline import Pipeline
from models.pipeline_version import PipelineVersion
from schemas.pipeline_version import PipelineVersionCreate, PipelineVersionUpdate


def create_pipeline_version(db: Session, version_data: PipelineVersionCreate) -> PipelineVersion:
    pipeline = db.query(Pipeline).filter(Pipeline.id == version_data.pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pipeline does not exist"
        )

    existing_version = db.query(PipelineVersion).filter(
        PipelineVersion.pipeline_id == version_data.pipeline_id,
        PipelineVersion.version == version_data.version
    ).first()
    if existing_version:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This pipeline version already exists"
        )

    if version_data.is_active:
        active_versions = db.query(PipelineVersion).filter(
            PipelineVersion.pipeline_id == version_data.pipeline_id,
            PipelineVersion.is_active == True
        ).all()
        for active_version in active_versions:
            active_version.is_active = False

    db_version = PipelineVersion(**version_data.model_dump())
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version


def get_all_pipeline_versions(db: Session) -> list[PipelineVersion]:
    return db.query(PipelineVersion).all()


def get_pipeline_version_by_id(db: Session, version_id: int) -> PipelineVersion:
    version = db.query(PipelineVersion).filter(PipelineVersion.id == version_id).first()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline version not found"
        )
    return version


def update_pipeline_version(db: Session, version_id: int, version_update: PipelineVersionUpdate) -> PipelineVersion:
    version = get_pipeline_version_by_id(db, version_id)
    update_data = version_update.model_dump(exclude_unset=True)

    if "version" in update_data:
        existing_version = db.query(PipelineVersion).filter(
            PipelineVersion.pipeline_id == version.pipeline_id,
            PipelineVersion.version == update_data["version"],
            PipelineVersion.id != version_id
        ).first()
        if existing_version:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This pipeline version already exists"
            )

    if update_data.get("is_active") is True:
        active_versions = db.query(PipelineVersion).filter(
            PipelineVersion.pipeline_id == version.pipeline_id,
            PipelineVersion.is_active == True,
            PipelineVersion.id != version_id
        ).all()
        for active_version in active_versions:
            active_version.is_active = False

    for field, value in update_data.items():
        setattr(version, field, value)

    db.commit()
    db.refresh(version)
    return version