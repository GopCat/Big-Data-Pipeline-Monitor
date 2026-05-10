from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.alert import AlertCreate, AlertRead, AlertUpdate
from services import alert_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/", response_model=AlertRead, status_code=status.HTTP_201_CREATED)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    return alert_service.create_alert(db, alert)


@router.get("/", response_model=list[AlertRead])
def get_alerts(db: Session = Depends(get_db)):
    return alert_service.get_all_alerts(db)


@router.get("/{alert_id}", response_model=AlertRead)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    return alert_service.get_alert_by_id(db, alert_id)


@router.patch("/{alert_id}", response_model=AlertRead)
def update_alert(alert_id: int, alert_update: AlertUpdate, db: Session = Depends(get_db)):
    return alert_service.update_alert(db, alert_id, alert_update)