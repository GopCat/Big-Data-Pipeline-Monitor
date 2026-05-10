import { useEffect, useState } from "react";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import StatsCard from "../components/StatsCard";
import StatusCard from "../components/StatusCard";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    datasets: [],
    pipelines: [],
    runs: [],
    alerts: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [datasetsRes, pipelinesRes, runsRes, alertsRes] = await Promise.all([
        api.get("/api/datasets/"),
        api.get("/api/pipelines/"),
        api.get("/api/runs/"),
        api.get("/api/alerts/"),
      ]);

      setDashboardData({
        datasets: datasetsRes.data,
        pipelines: pipelinesRes.data,
        runs: runsRes.data,
        alerts: alertsRes.data,
      });
    } catch (err) {
      setError("Failed to load dashboard data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
        title="Loading dashboard"
        message="Please wait while dashboard data is being loaded."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error}
        onRetry={fetchDashboardData}
      />
    );
  }

  const { datasets, pipelines, runs, alerts } = dashboardData;

  const activePipelinesCount = pipelines.filter((pipeline) => pipeline.is_active).length;
  const failedRunsCount = runs.filter((run) => run.status === "failed").length;
  const openAlertsCount = alerts.filter((alert) => alert.status === "open").length;
  const recentRuns = [...runs].slice(-3).reverse();
  const recentAlerts = [...alerts].slice(-3).reverse();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Quick overview of the pipeline monitoring platform.</p>
        </div>
      </div>

      <div className="page-section">
        <div className="stats-grid">
          <StatsCard title="Datasets" value={datasets.length} />
          <StatsCard title="Pipelines" value={pipelines.length} />
          <StatsCard title="Active Pipelines" value={activePipelinesCount} />
          <StatsCard title="Runs" value={runs.length} />
          <StatsCard title="Failed Runs" value={failedRunsCount} />
          <StatsCard title="Open Alerts" value={openAlertsCount} />
        </div>
      </div>

      <div className="page-section">
        <div className="card">
          <h2 className="card-title">Recent Runs</h2>

          {recentRuns.length === 0 ? (
            <p className="page-subtitle">No runs available.</p>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Pipeline</th>
                    <th>Status</th>
                    <th>Started At</th>
                    <th>Finished At</th>
                  </tr>
                </thead>

                <tbody>
                  {recentRuns.map((run) => (
                    <tr key={run.id}>
                      <td>{run.id}</td>
                      <td>{run.pipeline_id}</td>
                      <td>
                        <StatusCard status={run.status} />
                      </td>
                      <td>{formatDateTime(run.started_at)}</td>
                      <td>{formatDateTime(run.finished_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="page-section">
        <div className="card">
          <h2 className="card-title">Recent Alerts</h2>

          {recentAlerts.length === 0 ? (
            <p className="page-subtitle">No alerts available.</p>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Pipeline</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Message</th>
                    <th>Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {recentAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.id}</td>
                      <td>{alert.pipeline_id}</td>
                      <td>
                        <span className={`status-text status-${alert.severity}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td>
                        <StatusCard status={alert.status} />
                      </td>
                      <td>{alert.message}</td>
                      <td>{formatDateTime(alert.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;