from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RunStepBase(BaseModel):
    run_id: int
    name: str
    status: str = "pending"


class RunStepCreate(RunStepBase):
    pass


class RunStepUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class RunStepRead(RunStepBase):
    id: int
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)