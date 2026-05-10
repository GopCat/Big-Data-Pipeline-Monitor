import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import StatusCard from "../components/StatusCard";

function RunsList() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pipelineFilter, setPipelineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [expandedRunId, setExpandedRunId] = useState(null);
  const [runStepsByRunId, setRunStepsByRunId] = useState({});
  const [stepsLoadingByRunId, setStepsLoadingByRunId] = useState({});
  const [stepsErrorByRunId, setStepsErrorByRunId] = useState({});

  const fetchRuns = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/api/runs");
      setRuns(response.data);
    } catch (err) {
      setError("Failed to load runs.");
      console.error(err);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const fetchRunSteps = async (runId) => {
    try {
      setStepsLoadingByRunId((prev) => ({ ...prev, [runId]: true }));
      setStepsErrorByRunId((prev) => ({ ...prev, [runId]: "" }));

      const response = await api.get(`/api/run-steps?run_id=${runId}`);

      setRunStepsByRunId((prev) => ({
        ...prev,
        [runId]: response.data,
      }));
    } catch (err) {
      setStepsErrorByRunId((prev) => ({
        ...prev,
        [runId]: "Failed to load run steps.",
      }));
      console.error(err);
    } finally {
      setStepsLoadingByRunId((prev) => ({ ...prev, [runId]: false }));
    }
  };

  const toggleRunDetail = async (runId) => {
    if (expandedRunId === runId) {
      setExpandedRunId(null);
      return;
    }

    setExpandedRunId(runId);
    await fetchRunSteps(runId);
  };

  useEffect(() => {
    fetchRuns(true);

    const interval = setInterval(() => {
      fetchRuns(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!expandedRunId) return;

    fetchRunSteps(expandedRunId);

    const interval = setInterval(() => {
      fetchRunSteps(expandedRunId);
    }, 3000);

    return () => clearInterval(interval);
  }, [expandedRunId]);

  const pipelineOptions = useMemo(() => {
    return [...new Set(runs.map((run) => run.pipeline_id))];
  }, [runs]);

  const filteredRuns = useMemo(() => {
    return runs
      .filter((run) => {
        const matchesPipeline = pipelineFilter
          ? String(run.pipeline_id) === pipelineFilter
          : true;

        const matchesStatus = statusFilter
          ? run.status === statusFilter
          : true;

        return matchesPipeline && matchesStatus;
      })
      .sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;

        const dateA = a.started_at ? new Date(a.started_at).getTime() : 0;
        const dateB = b.started_at ? new Date(b.started_at).getTime() : 0;

        if (dateB !== dateA) {
          return dateB - dateA;
        }

        return b.id - a.id;
      });
  }, [runs, pipelineFilter, statusFilter]);

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
        title="Loading runs"
        message="Please wait while runs are being loaded."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error}
        onRetry={() => fetchRuns(true)}
      />
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <EmptyState
        title="No runs found"
        message="There are no pipeline runs available yet."
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Runs</h1>
          <p className="page-subtitle">Overview of all pipeline runs.</p>
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
            <label>Filter by status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="page-section">
        <div className="card">
          <h2 className="card-title">Filtered Summary</h2>
          <p className="page-subtitle">
            Showing {filteredRuns.length} of {runs.length} runs.
          </p>
        </div>
      </div>

      {filteredRuns.length === 0 ? (
        <EmptyState
          title="No runs match the selected filters"
          message="Try changing the selected pipeline or status filter."
        />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Detail</th>
                <th>ID</th>
                <th>Pipeline</th>
                <th>Status</th>
                <th>Started At</th>
                <th>Finished At</th>
                <th>Runtime</th>
                <th>Records Processed</th>
                <th>Error Message</th>
              </tr>
            </thead>

            <tbody>
              {filteredRuns.map((run) => {
                const isExpanded = expandedRunId === run.id;
                const runSteps = runStepsByRunId[run.id] || [];
                const stepsLoading = stepsLoadingByRunId[run.id];
                const stepsError = stepsErrorByRunId[run.id];

                return (
                  <>
                    <tr key={run.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleRunDetail(run.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`run-detail-${run.id}`}
                        >
                          {isExpanded ? "Hide" : "Show"}
                        </button>
                      </td>
                      <td>{run.id}</td>
                      <td>{run.pipeline_id}</td>
                      <td>
                        <StatusCard status={run.status} />
                      </td>
                      <td>
                        {run.status === "pending"
                          ? "Waiting to start"
                          : formatDateTime(run.started_at)}
                      </td>
                      <td>{formatDateTime(run.finished_at)}</td>
                      <td>{run.runtime ?? "-"}</td>
                      <td>{run.records_processed ?? "-"}</td>
                      <td>{run.error_message || "-"}</td>
                    </tr>

                    {isExpanded && (
                      <tr id={`run-detail-${run.id}`}>
                        <td colSpan={9}>
                          <div className="card" style={{ margin: "12px 0" }}>
                            <h3 className="card-title">Run Detail</h3>

                            <p><strong>Run ID:</strong> {run.id}</p>
                            <p><strong>Pipeline ID:</strong> {run.pipeline_id}</p>
                            <p><strong>Status:</strong> {run.status}</p>
                            <p><strong>Started At:</strong> {formatDateTime(run.started_at)}</p>
                            <p><strong>Finished At:</strong> {formatDateTime(run.finished_at)}</p>
                            <p><strong>Runtime:</strong> {run.runtime ?? "-"}</p>
                            <p><strong>Records Processed:</strong> {run.records_processed ?? "-"}</p>
                            <p><strong>Error Message:</strong> {run.error_message || "-"}</p>

                            <div style={{ marginTop: "16px" }}>
                              <h4>Run Steps</h4>

                              {stepsLoading ? (
                                <p>Loading run steps...</p>
                              ) : stepsError ? (
                                <p>{stepsError}</p>
                              ) : runSteps.length === 0 ? (
                                <p>No run steps found.</p>
                              ) : (
                                <table className="data-table">
                                  <thead>
                                    <tr>
                                      <th>ID</th>
                                      <th>Name</th>
                                      <th>Status</th>
                                      <th>Started At</th>
                                      <th>Finished At</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {runSteps.map((step) => (
                                      <tr key={step.id}>
                                        <td>{step.id}</td>
                                        <td>{step.name}</td>
                                        <td>
                                          <StatusCard status={step.status} />
                                        </td>
                                        <td>{formatDateTime(step.started_at)}</td>
                                        <td>{formatDateTime(step.finished_at)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RunsList;