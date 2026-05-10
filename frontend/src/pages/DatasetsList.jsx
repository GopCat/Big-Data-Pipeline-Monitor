import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";

function DatasetsList() {
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ownerFilter, setOwnerFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/datasets/");
      setDatasets(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load datasets.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const ownerOptions = useMemo(() => {
    return [...new Set(datasets.map((dataset) => dataset.owner).filter(Boolean))];
  }, [datasets]);

  const toTimestamp = (value) => {
    if (!value) return 0;

    const normalizedValue =
      typeof value === "string" &&
      !value.endsWith("Z") &&
      !value.includes("+")
        ? `${value}Z`
        : value;

    return new Date(normalizedValue).getTime();
  };

  const filteredDatasets = useMemo(() => {
    return [...datasets]
      .filter((dataset) => {
        const matchesOwner = ownerFilter ? dataset.owner === ownerFilter : true;

        const matchesActive =
          activeFilter === "" ? true : String(dataset.is_active) === activeFilter;

        return matchesOwner && matchesActive;
      })
      .sort((a, b) => {
        const dateA = toTimestamp(a.updated_at);
        const dateB = toTimestamp(b.updated_at);

        if (dateB !== dateA) {
          return dateB - dateA;
        }

        return b.id - a.id;
      });
  }, [datasets, ownerFilter, activeFilter]);

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
        title="Loading datasets"
        message="Please wait while datasets are being loaded."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error}
        onRetry={fetchDatasets}
      />
    );
  }

  if (!datasets || datasets.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Datasets</h1>
            <p className="page-subtitle">Overview of all registered datasets.</p>
          </div>

          <button className="success-btn" onClick={() => navigate("/datasets/new")}>
            New Dataset
          </button>
        </div>

        <EmptyState
          title="No datasets found"
          message="There are no datasets available yet."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Datasets</h1>
          <p className="page-subtitle">Overview of all registered datasets.</p>
        </div>

        <button className="success-btn" onClick={() => navigate("/datasets/new")}>
          New Dataset
        </button>
      </div>

      <div className="page-section">
        <div className="filters-bar">
          <div className="filter-item">
            <label>Filter by owner</label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="">All owners</option>
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Filter by active status</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All datasets</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="card">
          <h2 className="card-title">Filtered Summary</h2>
          <p className="page-subtitle">
            Showing {filteredDatasets.length} of {datasets.length} datasets.
          </p>
        </div>
      </div>

      {filteredDatasets.length === 0 ? (
        <EmptyState
          title="No datasets match the selected filters"
          message="Try changing the selected owner or active status."
        />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Owner</th>
                <th>Schema Version</th>
                <th>Active</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDatasets.map((dataset) => (
                <tr key={dataset.id}>
                  <td>{dataset.id}</td>
                  <td>{dataset.name}</td>
                  <td>{dataset.description || "-"}</td>
                  <td>{dataset.owner || "-"}</td>
                  <td>{dataset.schema_version || "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        dataset.is_active ? "badge-active" : "badge-inactive"
                      }`}
                    >
                      {dataset.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDateTime(dataset.created_at)}</td>
                  <td>{formatDateTime(dataset.updated_at)}</td>
                  <td>
                    <div className="actions-row">
                      <button
                        className="secondary-btn"
                        onClick={() => navigate(`/datasets/${dataset.id}`)}
                      >
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DatasetsList;