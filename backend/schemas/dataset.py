from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DatasetBase(BaseModel):
    name: str
    description: str
    owner: str
    schema_version: str = "v1"
    is_active: bool = True


class DatasetCreate(DatasetBase):
    pass


class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    schema_version: Optional[str] = None
    is_active: Optional[bool] = None


class DatasetRead(DatasetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)