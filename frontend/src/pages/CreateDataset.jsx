import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function CreateDataset() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    owner: "",
    schema_version: "",
    is_active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      setError("");

      await api.post("/api/datasets/", formData);
      navigate("/datasets");
    } catch (err) {
      console.error("Create dataset error:", err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to create dataset.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>New Dataset</h1>
          <p className="page-subtitle">Create a new dataset record.</p>
        </div>

        <button className="secondary-btn" onClick={() => navigate("/datasets")}>
          Back to Datasets
        </button>
      </div>

      <div className="page-section">
        <div className="card">
          <h2 className="card-title">Dataset Form</h2>

          {error && (
            <div className="error-state" style={{ marginBottom: "1rem" }}>
              <h2>Submission failed</h2>
              <p>{error}</p>
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

              <div className="filter-item">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
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
                {submitting ? "Creating..." : "Create Dataset"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigate("/datasets")}
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

export default CreateDataset;