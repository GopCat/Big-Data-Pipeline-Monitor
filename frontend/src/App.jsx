import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import DatasetsList from "./pages/DatasetsList";
import PipelinesList from "./pages/PipelinesList";
import PipelineDetail from "./pages/PipelineDetail";
import RunsList from "./pages/RunsList";
import AlertsList from "./pages/AlertsList";
import DatasetDetail from "./pages/DatasetDetail";
import CreateDataset from "./pages/CreateDataset";
import CreatePipeline from "./pages/CreatePipeline";
import EditDataset from "./pages/EditDataset";
import EditPipeline from "./pages/EditPipeline";

function App() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/datasets" element={<DatasetsList />} />
          <Route path="/pipelines" element={<PipelinesList />} />
          <Route path="/pipelines/:id" element={<PipelineDetail />} />
          <Route path="/pipelines/new" element={<CreatePipeline />} />
          <Route path="/runs" element={<RunsList />} />
          <Route path="/alerts" element={<AlertsList />} />
          <Route path="/datasets/new" element={<CreateDataset />} />
          <Route path="/datasets/:id" element={<DatasetDetail />} />
          <Route path="/datasets/:id/edit" element={<EditDataset />} />
          <Route path="/pipelines/:id/edit" element={<EditPipeline />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;