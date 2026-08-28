import { Badge } from '../ui/Badge.jsx';

const MAP = {
  NEW: ['New', 'accent'],
  CONTACTED: ['Contacted', 'neutral'],
  QUALIFIED: ['Qualified', 'neutral'],
  VIEWING_SCHEDULED: ['Viewing scheduled', 'neutral'],
  NEGOTIATION: ['Negotiation', 'neutral'],
  WON: ['Won', 'accent'],
  LOST: ['Lost', 'danger'],
};

export function LeadStatusBadge({ status }) {
  const [label, tone] = MAP[status] || [String(status || '').toLowerCase(), 'neutral'];
  return <Badge tone={tone}>{label}</Badge>;
}
