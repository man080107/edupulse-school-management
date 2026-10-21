import React from 'react';

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color = 'var(--blue-600)',
  bgColor = 'var(--blue-50)',
}) {
  return (
    <div
      className="stat-card"
      style={{
        '--stat-color': color,
        '--stat-bg': bgColor,
      }}
    >
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
      {Icon && (
        <div className="stat-icon-box">
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}
