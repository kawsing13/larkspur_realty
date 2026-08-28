import { useState } from 'react';
import { Button, Modal, Textarea } from '../ui/index.js';

const LABELS = {
  submit: 'Submit for review',
  withdraw: 'Withdraw',
  approve: 'Approve and publish',
  unpublish: 'Unpublish',
  republish: 'Republish',
  restore: 'Restore to draft',
  archive: 'Archive',
};

// Shows the workflow buttons that make sense for the current status and the
// caller's role. `onAction(action, payload)` runs the transition; `busy` is the
// action name currently in flight, or null.
export function WorkflowActions({ listing, listingMode, canApprove, canSubmit, onAction, busy }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  const status = listing.status;

  const simpleButton = (name, variant = 'secondary') => (
    <Button key={name} variant={variant} loading={busy === name} onClick={() => onAction(name)}>
      {LABELS[name]}
    </Button>
  );

  const buttons = [];
  if ((status === 'DRAFT' || status === 'CHANGES_REQUESTED') && canSubmit) {
    buttons.push(simpleButton('submit', 'primary'));
  }
  if (status === 'PENDING_REVIEW') {
    if (canApprove) {
      buttons.push(simpleButton('approve', 'primary'));
      buttons.push(
        <Button key="rc" variant="secondary" onClick={() => setNoteOpen(true)}>
          Request changes
        </Button>,
      );
    }
    if (canSubmit) buttons.push(simpleButton('withdraw'));
  }
  if (status === 'PUBLISHED' && canApprove) buttons.push(simpleButton('unpublish'));
  if (status === 'UNPUBLISHED' && canApprove) buttons.push(simpleButton('republish'));
  if ((status === 'PUBLISHED' || status === 'UNPUBLISHED') && canSubmit) {
    buttons.push(
      <Button key="close" variant="secondary" loading={busy === 'close'} onClick={() => onAction('close')}>
        {listingMode === 'RENT' ? 'Mark as rented' : 'Mark as sold'}
      </Button>,
    );
  }
  if (status === 'ARCHIVED' && canApprove) buttons.push(simpleButton('restore'));
  if (status !== 'ARCHIVED' && canApprove) buttons.push(simpleButton('archive', 'ghost'));

  return (
    <div>
      {buttons.length > 0 ? (
        <div className="flex flex-wrap gap-2">{buttons}</div>
      ) : (
        <p className="text-sm text-ink-soft">Nothing for you to do at this stage.</p>
      )}

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Request changes"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={busy === 'request-changes'}
              disabled={!note.trim()}
              onClick={async () => {
                await onAction('request-changes', { note: note.trim() });
                setNoteOpen(false);
                setNote('');
              }}
            >
              Send back to agent
            </Button>
          </>
        }
      >
        <p className="mb-2">The agent sees this note, revises the listing, and resubmits.</p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="What needs to change before this can be published?"
        />
      </Modal>
    </div>
  );
}
