import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

function EditPipeline() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dataset_id: "",
    schedule: "",
    is_active: true,
  });

  const fetchPageData = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const [pipelineResponse, datasetsResponse] = await Promise.all([
        api.get(`/api/pipelines/${id}`),
        api.get("/api/datasets/"),
      ]);

      const pipeline = pipelineResponse.data;

      setDatasets(datasetsResponse.data || []);
      setFormData({
        name: pipeline.name || "",
        description: pipeline.description || "",
        dataset_id: pipeline.dataset_id ? String(pipeline.dataset_id) : "",
        schedule: pipeline.schedule || "",
        is_active: Boolean(pipeline.is_active),
      });
    } catch (err) {
      console.error("Fetch pipeline data error:", err.response?.data || err.message);
      setLoadError(err.response?.data?.detail || "Failed to load pipeline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [id]);

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

      await api.patch(`/api/pipelines/${id}`, {
        name: formData.name,
        description: formData.description,
        dataset_id: Number(formData.dataset_id),
        schedule: formData.schedule,
        is_active: formData.is_active,
      });

      navigate(`/pipelines/${id}`);
    } catch (err) {
      console.error("Update pipeline error:", err.response?.data || err.message);
      setSubmitError(err.response?.data?.detail || "Failed to update pipeline.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingState
        title="Loading pipeline"
        message="Please wait while pipeline data is being loaded."
      />
    );
  }

  if (loadError) {
    return (
      <ErrorState
        title="Something went wrong"
        message={loadError}
        onRetry={fetchPageData}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Edit Pipeline</h1>
          <p className="page-subtitle">Update pipeline configuration.</p>
        </div>

        <button className="secondary-btn" onClick={() => navigate(`/pipelines/${id}`)}>
          Back to Detail
        </button>
      </div>

      <div className="page-section">
        <div className="card">
          <h2 className="card-title">Pipeline Form</h2>

          {submitError && (
            <div className="error-state" style={{ marginBottom: "1rem" }}>
              <h2>Update failed</h2>
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
                {submitting ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigate(`/pipelines/${id}`)}
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

export default EditPipeline;