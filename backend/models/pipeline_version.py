from sqlalchemy import Column, Integer, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class PipelineVersion(Base):
    __tablename__ = "pipeline_versions"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)
    version = Column(Integer, nullable=False)
    config = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    pipeline = relationship("Pipeline", back_populates="versions")