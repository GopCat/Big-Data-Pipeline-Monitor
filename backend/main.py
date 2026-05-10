# Run from terminal:
# cd backend
# source .venv/bin/activate
# uv run uvicorn main:app --reload
#
# Open:
# http://127.0.0.1:8000/docs

import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import SessionLocal, create_tables
from services.alert_service import check_long_running_runs
from core.config import settings

# Import models so SQLAlchemy registers them
from models.dataset import Dataset
from models.pipeline import Pipeline
from models.run import Run
from models.alert import Alert
from models.alert_rule import AlertRule
from models.user import User
from models.pipeline_version import PipelineVersion
from models.run_step import RunStep

# Import routers
from routers.dataset import router as dataset_router
from routers.pipeline import router as pipeline_router
from routers.run import router as run_router
from routers.alert import router as alert_router
from routers.alert_rule import router as alert_rule_router
from routers.user import router as user_router
from routers.pipeline_version import router as pipeline_version_router
from routers.run_step import router as run_step_router

app = FastAPI(
    title="Big Data Pipeline API",
    description="API for managing and monitoring the big data pipeline",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def monitor_long_running_runs_loop():
    while True:
        db = SessionLocal()
        try:
            created = check_long_running_runs(db)
            if created:
                print(f"[monitor] Created {created} long-running run alert(s).")
        except Exception as e:
            print(f"[monitor] Error while checking long-running runs: {e}")
        finally:
            db.close()

        await asyncio.sleep(30)


@app.on_event("startup")
async def on_startup():
    create_tables()
    asyncio.create_task(monitor_long_running_runs_loop())


@app.get("/")
def read_root():
    return {"message": "Big Data Pipeline API is running"}


app.include_router(dataset_router, prefix=settings.API_PREFIX)
app.include_router(pipeline_router, prefix=settings.API_PREFIX)
app.include_router(run_router, prefix=settings.API_PREFIX)
app.include_router(alert_router, prefix=settings.API_PREFIX)
app.include_router(alert_rule_router, prefix=settings.API_PREFIX)
app.include_router(user_router, prefix=settings.API_PREFIX)
app.include_router(pipeline_version_router, prefix=settings.API_PREFIX)
app.include_router(run_step_router, prefix=settings.API_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)