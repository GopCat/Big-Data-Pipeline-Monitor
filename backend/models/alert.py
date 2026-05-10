from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)
    run_id = Column(Integer, ForeignKey("runs.id"), nullable=True)

    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, default="warning")
    status = Column(String(20), nullable=False, default="open")
    message = Column(String(2000), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    pipeline = relationship("Pipeline", back_populates="alerts")
    run = relationship("Run", back_populates="alerts")