import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

function DatasetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDataset = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/api/datasets/${id}`);
      setDataset(response.data);
    } catch (err) {
      console.error("Fetch dataset detail error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to load dataset detail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, [id]);

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

  if (loading) {
    return (
      <LoadingState
        title="Loading dataset detail"
        message="Please wait while dataset detail is being loaded."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error}
        onRetry={fetchDataset}
      />
    );
  }

  if (!dataset) {
    return (
      <EmptyState
        title="Dataset not found"
        message="The requested dataset detail is not available."
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{dataset.name}</h1>
          <p className="page-subtitle">Dataset detail and metadata overview.</p>
        </div>

        <div className="actions-row">
          <button className="secondary-btn" onClick={() => navigate("/datasets")}>
            Back to Datasets
          </button>
          <button className="success-btn" onClick={() => navigate(`/datasets/${id}/edit`)}>
            Edit Dataset
        </button>
        </div>
      </div>

      <div className="page-section">
        <div className="details-grid">
          <div className="detail-item">
            <span>ID</span>
            <strong>{dataset.id}</strong>
          </div>

          <div className="detail-item">
            <span>Name</span>
            <strong>{dataset.name || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Description</span>
            <strong>{dataset.description || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Owner</span>
            <strong>{dataset.owner || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Schema Version</span>
            <strong>{dataset.schema_version || "-"}</strong>
          </div>

          <div className="detail-item">
            <span>Active</span>
            <strong>{dataset.is_active ? "Yes" : "No"}</strong>
          </div>

          <div className="detail-item">
            <span>Created At</span>
            <strong>{formatDateTime(dataset.created_at)}</strong>
          </div>

          <div className="detail-item">
            <span>Updated At</span>
            <strong>{formatDateTime(dataset.updated_at)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatasetDetail;