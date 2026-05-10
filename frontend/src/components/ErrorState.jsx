function ErrorState({ title = "Error", message = "Something went wrong.", onRetry }) {
  return (
    <div className="error-state">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && <button onClick={onRetry}>Try again</button>}
    </div>
  );
}

export default ErrorState;