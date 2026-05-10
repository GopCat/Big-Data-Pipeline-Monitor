from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.run import RunRead, RunUpdate
from services import run_service

router = APIRouter(prefix="/runs", tags=["runs"])


@router.get("/", response_model=list[RunRead])
def get_runs(db: Session = Depends(get_db)):
    return run_service.get_all_runs(db)


@router.get("/{run_id}", response_model=RunRead)
def get_run(run_id: int, db: Session = Depends(get_db)):
    return run_service.get_run_by_id(db, run_id)


@router.patch("/{run_id}", response_model=RunRead)
def update_run(run_id: int, run_update: RunUpdate, db: Session = Depends(get_db)):
    return run_service.update_run(db, run_id, run_update)