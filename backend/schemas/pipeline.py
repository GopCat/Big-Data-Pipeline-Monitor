from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PipelineBase(BaseModel):
    name: str
    description: Optional[str] = None
    dataset_id: int
    schedule: Optional[str] = None
    is_active: bool = True


class PipelineCreate(PipelineBase):
    pass


class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    dataset_id: Optional[int] = None
    schedule: Optional[str] = None
    is_active: Optional[bool] = None


class PipelineRead(PipelineBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
