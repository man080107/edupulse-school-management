import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no records matching your current filter criteria.',
  icon: Icon = Inbox,
  actionButton = null,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={26} />
      </div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{description}</div>
      {actionButton && <div style={{ marginTop: '10px' }}>{actionButton}</div>}
    </div>
  );
}
