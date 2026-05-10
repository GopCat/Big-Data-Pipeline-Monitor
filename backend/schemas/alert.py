from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AlertBase(BaseModel):
    pipeline_id: int
    run_id: Optional[int] = None
    alert_type: str
    severity: str = "warning"
    status: str = "open"
    message: str


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    severity: Optional[str] = None
    status: Optional[str] = None
    message: Optional[str] = None


class AlertRead(AlertBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)