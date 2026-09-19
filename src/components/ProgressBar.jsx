export const ProgressBar = ({ percentage = 0, showLabel = true, height = 8 }) => {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  const getColorClass = () => {
    if (clamped >= 75) return 'progress-fill-success';
    if (clamped >= 40) return 'progress-fill-primary';
    return 'progress-fill-warning';
  };

  return (
    <div className="progress-container">
      {showLabel && (
        <div className="progress-labels">
          <span className="progress-title">Course Progress</span>
          <span className="progress-value">{clamped}%</span>
        </div>
      )}
      <div className="progress-track" style={{ height: `${height}px` }}>
        <div 
          className={`progress-fill ${getColorClass()}`} 
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
