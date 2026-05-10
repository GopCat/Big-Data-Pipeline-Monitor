from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.alert_rule import AlertRuleCreate, AlertRuleRead, AlertRuleUpdate
from services import alert_rule_service

router = APIRouter(prefix="/alert-rules", tags=["alert-rules"])


@router.post("/", response_model=AlertRuleRead, status_code=status.HTTP_201_CREATED)
def create_alert_rule(rule: AlertRuleCreate, db: Session = Depends(get_db)):
    return alert_rule_service.create_alert_rule(db, rule)


@router.get("/", response_model=list[AlertRuleRead])
def get_alert_rules(db: Session = Depends(get_db)):
    return alert_rule_service.get_all_alert_rules(db)


@router.get("/{rule_id}", response_model=AlertRuleRead)
def get_alert_rule(rule_id: int, db: Session = Depends(get_db)):
    return alert_rule_service.get_alert_rule_by_id(db, rule_id)


@router.patch("/{rule_id}", response_model=AlertRuleRead)
def update_alert_rule(rule_id: int, rule_update: AlertRuleUpdate, db: Session = Depends(get_db)):
    return alert_rule_service.update_alert_rule(db, rule_id, rule_update)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert_rule(rule_id: int, db: Session = Depends(get_db)):
    alert_rule_service.delete_alert_rule(db, rule_id)
    return None