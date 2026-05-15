import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import StatusCard from "../components/StatusCard";

function AlertsList() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pipelineFilter, setPipelineFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/alerts/");
      setAlerts(response.data);
    } catch (err) {
      setError("Failed to load alerts.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(true);

    const interval = setInterval(() => {
      fetchAlerts(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const pipelineOptions = useMemo(() => {
    return [...new Set(alerts.map((alert) => alert.pipeline_id))];
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesPipeline = pipelineFilter
        ? String(alert.pipeline_id) === pipelineFilter
        : true;

      const matchesSeverity = severityFilter
        ? alert.severity === severityFilter
        : true;

      const matchesStatus = statusFilter
        ? alert.status === statusFilter
        : true;

      return matchesPipeline && matchesSeverity && matchesStatus;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [alerts, pipelineFilter, severityFilter, statusFilter]);

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
        title="Loading alerts"
        message="Please wait while alerts are being loaded."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error}
        onRetry={fetchAlerts}
      />
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <EmptyState
        title="No alerts found"
        message="There are no alerts available yet."
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alerts</h1>
          <p className="page-subtitle">Overview of all alert events in the system.</p>
        </div>
      </div>

      <div className="page-section">
        <div className="filters-bar">
          <div className="filter-item">
            <label>Filter by pipeline</label>
            <select
              value={pipelineFilter}
              onChange={(e) => setPipelineFilter(e.target.value)}
            >
              <option value="">All pipelines</option>
              {pipelineOptions.map((pipelineId) => (
                <option key={pipelineId} value={pipelineId}>
                  Pipeline {pipelineId}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Filter by severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="">All severities</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Filter by status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="card">
          <h2 className="card-title">Filtered Summary</h2>
          <p className="page-subtitle">
            Showing {filteredAlerts.length} of {alerts.length} alerts.
          </p>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <EmptyState
          title="No alerts match the selected filters"
          message="Try changing the selected filters."
        />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Pipeline</th>
                <th>Run</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Message</th>
                <th>Created At</th>
              </tr>
            </thead>

            <tbody>
              {filteredAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.id}</td>
                  <td>{alert.pipeline_id}</td>
                  <td>{alert.run_id ?? "-"}</td>
                  <td>{alert.alert_type || "-"}</td>
                  <td>
                    <span className={`status-text status-${alert.severity}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td>
                    <StatusCard status={alert.status} />
                  </td>
                  <td>{alert.message || "-"}</td>
                  <td>{formatDateTime(alert.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AlertsList;