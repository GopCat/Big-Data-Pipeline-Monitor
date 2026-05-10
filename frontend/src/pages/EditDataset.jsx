import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

function EditDataset() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    owner: "",
    schema_version: "",
    is_active: true,
  });

  const fetchDataset = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await api.get(`/api/datasets/${id}`);
      const data = response.data;

      setFormData({
        name: data.name || "",
        description: data.description || "",
        owner: data.owner || "",
        schema_version: data.schema_version || "",
        is_active: Boolean(data.is_active),
      });
    } catch (err) {
      console.error("Fetch dataset error:", err.response?.data || err.message);
      setLoadError(err.response?.data?.detail || "Failed to load dataset.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
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

      await api.patch(`/api/datasets/${id}`, formData);
      navigate(`/datasets/${id}`);
    } catch (err) {
      console.error("Update dataset error:", err.response?.data || err.message);
      setSubmitError(err.response?.data?.detail || "Failed to update dataset.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingState
        title="Loading dataset"
        message="Please wait while dataset data is being loaded."
      />
    );
  }

  if (loadError) {
    return (
      <ErrorState
        title="Something went wrong"
        message={loadError}
        onRetry={fetchDataset}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Edit Dataset</h1>
          <p className="page-subtitle">Update dataset information.</p>
        </div>

        <button className="secondary-btn" onClick={() => navigate(`/datasets/${id}`)}>
          Back to Detail
        </button>
      </div>

      <div className="page-section">
        <div className="card">
          <h2 className="card-title">Dataset Form</h2>

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
                <label>Owner</label>
                <input
                  type="text"
                  name="owner"
                  value={formData.owner}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="filter-item">
                <label>Schema Version</label>
                <input
                  type="text"
                  name="schema_version"
                  value={formData.schema_version}
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
                onClick={() => navigate(`/datasets/${id}`)}
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

export default EditDataset;