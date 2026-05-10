from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AlertRuleBase(BaseModel):
    name: str
    pipeline_id: int
    rule_type: str
    threshold: Optional[float] = None
    severity: str = "warning"
    is_active: bool = True


class AlertRuleCreate(AlertRuleBase):
    pass


class AlertRuleUpdate(BaseModel):
    name: Optional[str] = None
    pipeline_id: Optional[int] = None
    rule_type: Optional[str] = None
    threshold: Optional[float] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None


class AlertRuleRead(AlertRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)