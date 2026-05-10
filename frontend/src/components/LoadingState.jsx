function LoadingState({ title = "Loading...", message = "Please wait." }) {
  return (
    <div className="loading-state">
      <h2>{title}</h2>
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}

export default LoadingState;