import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

function PipelineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [updatingPipeline, setUpdatingPipeline] = useState(false);

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/api/pipelines/${id}`);
      setPipeline(response.data);
    } catch (err) {
      console.error("Fetch pipeline detail error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to load pipeline detail.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    const normalizedValue =
      typeof value === "string" &&
      !value.endsWith("Z") &&
      !value.includes("+")
        ? `${value}Z`
        : value;

    const date = new Date(normalizedValue);

    const parts = new Intl.DateTimeFormat("cs-CZ", {
      timeZone: "Europe/Prague",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);

    const get = (type) => parts.find((part) => part.type === type)?.value || "";

    return `${get("day")}.${get("month")}.${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
  };

  const handleRunPipeline = async () => {
    try {
      setError("");
      setSuccessMessage("");
      setRunningPipeline(true);

      await api.post(`/api/pipelines/${id}/run`);

      setSuccessMessage("Pipeline run started successfully.");
      await fetchPipeline();
      navigate("/runs");
    } catch (err) {
      console.error("Run pipeline error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to run pipeline.");
    } finally {
      setRunningPipeline(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setError("");
      setSuccessMessage("");
      setUpdatingPipeline(true);

      await api.patch(`/api/pipelines/${id}`, {
        is_active: !pipeline.is_active,
      });

      setSuccessMessage(
        `Pipeline ${pipeline.is_active ? "deactivated" : "activated"} successfully.`
      );
      await fetchPipeline();
    } catch (err) {
      console.error("Toggle pipeline error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to update pipeline.");
    } finally {
      setUpdatingPipeline(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [id]);

  if (loading) {
    return (
      <LoadingState
        title="Loading pipeline detail"
        message="Please wait while pipeline detail is being loaded."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error}
        onRetry={fetchPipeline}
      />
    );
  }

  if (!pipeline) {
    return (
      <EmptyState
        title="Pipeline not found"
        message="The requested pipeline detail is not available."
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{pipeline.name}</h1>
          <p className="page-subtitle">Pipeline detail and summary information.</p>
        </div>

        <div className="actions-row">
          <button
            className="secondary-btn"
            onClick={() => navigate("/pipelines")}
          >
            Back to Pipelines
          </button>

          <button
            className="success-btn"
            onClick={() => navigate(`/pipelines/${id}/edit`)}
          >
            Edit Pipeline
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="page-section">
        <div className="details-grid">
          <div className="detail-item">
            <span>Name</span>
            <strong>{pipeline.name || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Description</span>
            <strong>{pipeline.description || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Dataset ID</span>
            <strong>{pipeline.dataset_id ?? "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Schedule</span>
            <strong>{pipeline.schedule || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Active</span>
            <strong>{pipeline.is_active ? "Yes" : "No"}</strong>
          </div>

          <div className="detail-item">
            <span>ID</span>
            <strong>{pipeline.id}</strong>
          </div>

          <div className="detail-item">
            <span>Created At</span>
            <strong>{formatDateTime(pipeline.created_at) || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Updated At</span>
            <strong>{formatDateTime(pipeline.updated_at) || "-"}</strong>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="card">
          <h2 className="card-title">Pipeline Actions</h2>

          <div className="actions-row">
            <button
              className="success-btn"
              onClick={handleRunPipeline}
              disabled={!pipeline.is_active || runningPipeline}
            >
              {runningPipeline ? "Starting..." : "Run pipeline"}
            </button>

            <button
              className="secondary-btn"
              onClick={handleToggleActive}
              disabled={updatingPipeline}
            >
              {updatingPipeline
                ? "Updating..."
                : pipeline.is_active
                ? "Deactivate"
                : "Activate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PipelineDetail;