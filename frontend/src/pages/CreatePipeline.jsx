import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

function CreatePipeline() {
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [datasetsError, setDatasetsError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dataset_id: "",
    schedule: "",
    is_active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchDatasets = async () => {
    try {
      setLoadingDatasets(true);
      setDatasetsError("");

      const response = await api.get("/api/datasets/");
      setDatasets(response.data || []);
    } catch (err) {
      console.error("Fetch datasets error:", err.response?.data || err.message);
      setDatasetsError(
        err.response?.data?.detail || "Failed to load datasets for pipeline creation."
      );
    } finally {
      setLoadingDatasets(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setSubmitError("");

      await api.post("/api/pipelines/", {
        name: formData.name,
        description: formData.description,
        dataset_id: Number(formData.dataset_id),
        schedule: formData.schedule,
        is_active: formData.is_active,
      });

      navigate("/pipelines");
    } catch (err) {
      console.error("Create pipeline error:", err.response?.data || err.message);
      setSubmitError(err.response?.data?.detail || "Failed to create pipeline.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDatasets) {
    return (
      <LoadingState
        title="Loading pipeline form"
        message="Please wait while datasets are being loaded."
      />
    );
  }

  if (datasetsError) {
    return (
      <ErrorState
        title="Something went wrong"
        message={datasetsError}
        onRetry={fetchDatasets}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>New Pipeline</h1>
          <p className="page-subtitle">Create a new pipeline configuration.</p>
        </div>

        <button className="secondary-btn" onClick={() => navigate("/pipelines")}>
          Back to Pipelines
        </button>
      </div>

      <div className="page-section">
        <div className="card">
          <h2 className="card-title">Pipeline Form</h2>

          {submitError && (
            <div className="error-state" style={{ marginBottom: "1rem" }}>
              <h2>Submission failed</h2>
              <p>{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="details-grid">
              <div className="filter-item">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="filter-item">
                <label>Dataset</label>
                <select
                  name="dataset_id"
                  value={formData.dataset_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select dataset</option>
                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name} (ID: {dataset.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label>Schedule</label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  placeholder="e.g. 0 2 * * *"
                  required
                />
              </div>
            </div>

            <div className="page-section">
              <div className="filter-item">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter pipeline description"
                  style={{
                    width: "100%",
                    padding: "0.75rem 0.9rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                    fontSize: "0.95rem",
                    backgroundColor: "white",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  style={{ width: "auto" }}
                />
                Active
              </label>
            </div>

            <div className="actions-row">
              <button type="submit" className="success-btn" disabled={submitting}>
                {submitting ? "Creating..." : "Create Pipeline"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigate("/pipelines")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreatePipeline;