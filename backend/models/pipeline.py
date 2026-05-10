from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(String(500), nullable=True)

    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    schedule = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    dataset = relationship("Dataset", back_populates="pipelines")
    runs = relationship("Run", back_populates="pipeline", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="pipeline", cascade="all, delete-orphan")
    alert_rules = relationship("AlertRule", back_populates="pipeline", cascade="all, delete-orphan")
    versions = relationship("PipelineVersion", back_populates="pipeline", cascade="all, delete-orphan")