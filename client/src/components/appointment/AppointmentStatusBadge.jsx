import { Badge } from '../ui/Badge.jsx';

const MAP = {
  REQUESTED: ['Requested', 'accent'],
  CONFIRMED: ['Confirmed', 'accent'],
  RESCHEDULED: ['Rescheduled', 'neutral'],
  CANCELLED: ['Cancelled', 'danger'],
  COMPLETED: ['Completed', 'neutral'],
  NO_SHOW: ['No-show', 'danger'],
};

export function AppointmentStatusBadge({ status }) {
  const [label, tone] = MAP[status] || [String(status || '').toLowerCase(), 'neutral'];
  return <Badge tone={tone}>{label}</Badge>;
}
