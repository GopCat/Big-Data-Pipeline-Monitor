from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.dataset import Dataset
from schemas.dataset import DatasetCreate, DatasetUpdate


def create_dataset(db: Session, dataset_data: DatasetCreate) -> Dataset:
    existing_dataset = db.query(Dataset).filter(Dataset.name == dataset_data.name).first()
    if existing_dataset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset with this name already exists"
        )

    db_dataset = Dataset(**dataset_data.model_dump())
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset


def get_all_datasets(db: Session) -> list[Dataset]:
    return db.query(Dataset).all()


def get_dataset_by_id(db: Session, dataset_id: int) -> Dataset:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    return dataset


def update_dataset(db: Session, dataset_id: int, dataset_update: DatasetUpdate) -> Dataset:
    dataset = get_dataset_by_id(db, dataset_id)

    update_data = dataset_update.model_dump(exclude_unset=True)

    if "name" in update_data:
        existing_dataset = db.query(Dataset).filter(
            Dataset.name == update_data["name"],
            Dataset.id != dataset_id
        ).first()
        if existing_dataset:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dataset with this name already exists"
            )

    for field, value in update_data.items():
        setattr(dataset, field, value)

    db.commit()
    db.refresh(dataset)
    return dataset