import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";

function PipelinesList() {
  const navigate = useNavigate();

  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [runningPipelineId, setRunningPipelineId] = useState(null);
  const [updatingPipelineId, setUpdatingPipelineId] = useState(null);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/pipelines/");
      setPipelines(response.data);
    } catch (err) {
      setError("Failed to load pipelines.");
      console.error(err);
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

  const sortedPipelines = useMemo(() => {
    return [...pipelines].sort((a, b) => {
      const dateA = a.updated_at ? new Date(`${a.updated_at}Z`).getTime() : 0;
      const dateB = b.updated_at ? new Date(`${b.updated_at}Z`).getTime() : 0;

      if (dateB !== dateA) {
        return dateB - dateA;
      }

      return b.id - a.id;
    });
  }, [pipelines]);

  const handleRunPipeline = async (pipelineId) => {
    try {
      setError("");
      setSuccessMessage("");
      setRunningPipelineId(pipelineId);

      await api.post(`/api/pipelines/${pipelineId}/run`);

      setSuccessMessage("Pipeline run started successfully.");
      await fetchPipelines();
      navigate("/runs");
    } catch (err) {
      console.error("Run pipeline error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to run pipeline.");
    } finally {
      setRunningPipelineId(null);
    }
  };

  const handleToggleActive = async (pipeline) => {
    try {
      setError("");
      setSuccessMessage("");
      setUpdatingPipelineId(pipeline.id);

      await api.patch(`/api/pipelines/${pipeline.id}`, {
        is_active: !pipeline.is_active,
      });

      setSuccessMessage(
        `Pipeline ${pipeline.is_active ? "deactivated" : "activated"} successfully.`
      );
      await fetchPipelines();
    } catch (err) {
      console.error("Toggle pipeline error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to update pipeline.");
    } finally {
      setUpdatingPipelineId(null);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  if (loading) {
    return (
      <LoadingState
        title="Loading pipelines"
        message="Please wait while pipelines are being loaded."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error}
        onRetry={fetchPipelines}
      />
    );
  }

  if (!pipelines || pipelines.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Pipelines</h1>
            <p className="page-subtitle">Overview of all configured pipelines.</p>
          </div>

          <button className="success-btn" onClick={() => navigate("/pipelines/new")}>
            New Pipeline
          </button>
        </div>

        <EmptyState
          title="No pipelines found"
          message="There are no pipelines available yet."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Pipelines</h1>
          <p className="page-subtitle">Overview of all configured pipelines.</p>
        </div>

        <button className="success-btn" onClick={() => navigate("/pipelines/new")}>
          New Pipeline
        </button>
      </div>

      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Dataset</th>
              <th>Schedule</th>
              <th>Active</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedPipelines.map((pipeline) => (
              <tr key={pipeline.id}>
                <td>{pipeline.name}</td>
                <td>{pipeline.dataset_id ?? "-"}</td>
                <td>{pipeline.schedule || "-"}</td>
                <td>
                  <span
                    className={`badge ${
                      pipeline.is_active ? "badge-active" : "badge-inactive"
                    }`}
                  >
                    {pipeline.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{formatDateTime(pipeline.created_at)}</td>
                <td>{formatDateTime(pipeline.updated_at)}</td>
                <td>
                  <div className="actions-row">
                    <button
                      className="secondary-btn"
                      onClick={() => navigate(`/pipelines/${pipeline.id}`)}
                    >
                      Detail
                    </button>

                    <button
                      className="success-btn"
                      onClick={() => handleRunPipeline(pipeline.id)}
                      disabled={!pipeline.is_active || runningPipelineId === pipeline.id}
                    >
                      {runningPipelineId === pipeline.id ? "Starting..." : "Run pipeline"}
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => handleToggleActive(pipeline)}
                      disabled={updatingPipelineId === pipeline.id}
                    >
                      {updatingPipelineId === pipeline.id
                        ? "Updating..."
                        : pipeline.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PipelinesList;