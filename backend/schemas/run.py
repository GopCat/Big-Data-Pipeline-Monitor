from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RunBase(BaseModel):
    pipeline_id: int
    status: str = "pending"
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    runtime: Optional[int] = None
    records_processed: Optional[int] = None
    error_message: Optional[str] = None


class RunCreate(BaseModel):
    pipeline_id: int


class RunUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    runtime: Optional[int] = None
    records_processed: Optional[int] = None
    error_message: Optional[str] = None


class RunRead(RunBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)