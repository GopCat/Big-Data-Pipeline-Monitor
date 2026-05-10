from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.alert_rule import AlertRule
from models.pipeline import Pipeline
from schemas.alert_rule import AlertRuleCreate, AlertRuleUpdate


def create_alert_rule(db: Session, rule_data: AlertRuleCreate) -> AlertRule:
    pipeline = db.query(Pipeline).filter(Pipeline.id == rule_data.pipeline_id).first()
    if not pipeline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pipeline does not exist"
        )

    existing_rule = db.query(AlertRule).filter(AlertRule.name == rule_data.name).first()
    if existing_rule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alert rule with this name already exists"
        )

    db_rule = AlertRule(**rule_data.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


def get_all_alert_rules(db: Session) -> list[AlertRule]:
    return db.query(AlertRule).all()


def get_alert_rule_by_id(db: Session, rule_id: int) -> AlertRule:
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert rule not found"
        )
    return rule


def update_alert_rule(db: Session, rule_id: int, rule_update: AlertRuleUpdate) -> AlertRule:
    rule = get_alert_rule_by_id(db, rule_id)
    update_data = rule_update.model_dump(exclude_unset=True)

    if "pipeline_id" in update_data:
        pipeline = db.query(Pipeline).filter(Pipeline.id == update_data["pipeline_id"]).first()
        if not pipeline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pipeline does not exist"
            )

    if "name" in update_data:
        existing_rule = db.query(AlertRule).filter(
            AlertRule.name == update_data["name"],
            AlertRule.id != rule_id
        ).first()
        if existing_rule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Alert rule with this name already exists"
            )

    for field, value in update_data.items():
        setattr(rule, field, value)

    db.commit()
    db.refresh(rule)
    return rule


def delete_alert_rule(db: Session, rule_id: int) -> None:
    rule = get_alert_rule_by_id(db, rule_id)
    db.delete(rule)
    db.commit()