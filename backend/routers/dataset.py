from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.dataset import DatasetCreate, DatasetRead, DatasetUpdate
from services import dataset_service

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("/", response_model=DatasetRead, status_code=status.HTTP_201_CREATED)
def create_dataset(dataset: DatasetCreate, db: Session = Depends(get_db)):
    return dataset_service.create_dataset(db, dataset)


@router.get("/", response_model=list[DatasetRead])
def get_datasets(db: Session = Depends(get_db)):
    return dataset_service.get_all_datasets(db)


@router.get("/{dataset_id}", response_model=DatasetRead)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    return dataset_service.get_dataset_by_id(db, dataset_id)


@router.patch("/{dataset_id}", response_model=DatasetRead)
def update_dataset(dataset_id: int, dataset_update: DatasetUpdate, db: Session = Depends(get_db)):
    return dataset_service.update_dataset(db, dataset_id, dataset_update)