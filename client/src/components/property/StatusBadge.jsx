import { Badge } from '../ui/Badge.jsx';

// One place that maps a property / listing status to a human label and a tone.
const MAP = {
  DRAFT: ['Draft', 'neutral'],
  PENDING_REVIEW: ['In review', 'neutral'],
  CHANGES_REQUESTED: ['Changes requested', 'danger'],
  PUBLISHED: ['Published', 'accent'],
  UNPUBLISHED: ['Unpublished', 'neutral'],
  ARCHIVED: ['Archived', 'danger'],
  SOLD: ['Sold', 'accent'],
  RENTED: ['Rented', 'accent'],
  CLOSED_SOLD: ['Sold', 'accent'],
  CLOSED_RENTED: ['Rented', 'accent'],
};

export function StatusBadge({ status }) {
  const [label, tone] = MAP[status] || [String(status || '').toLowerCase(), 'neutral'];
  return <Badge tone={tone}>{label}</Badge>;
}
