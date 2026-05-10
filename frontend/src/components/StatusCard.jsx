function StatusCard({ status }) {
  return <span className={`status-text status-${status}`}>{status}</span>;
}

export default StatusCard;