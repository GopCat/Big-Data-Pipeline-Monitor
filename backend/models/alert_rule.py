from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)

    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)
    rule_type = Column(String(50), nullable=False)   # runtime_exceeded, run_failed, etc.
    threshold = Column(Float, nullable=True)         # např. 300 sekund
    severity = Column(String(20), nullable=False, default="warning")
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    pipeline = relationship("Pipeline", back_populates="alert_rules")