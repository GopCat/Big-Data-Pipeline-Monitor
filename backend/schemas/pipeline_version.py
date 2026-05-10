from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class PipelineVersionBase(BaseModel):
    pipeline_id: int
    version: int
    config: dict[str, Any]
    is_active: bool = False


class PipelineVersionCreate(PipelineVersionBase):
    pass


class PipelineVersionUpdate(BaseModel):
    version: int | None = None
    config: dict[str, Any] | None = None
    is_active: bool | None = None


class PipelineVersionRead(PipelineVersionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)