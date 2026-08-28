import { useState } from 'react';
import { api, errorMessage } from '../../lib/apiClient.js';
import { useApi } from '../../hooks/useApi.js';
import { Modal, Button, Select, Field, Input } from '../ui/index.js';

export function AssignAgentModal({ open, onClose, inquiryId, currentAgentName, onAssigned }) {
  const agents = useApi(open ? '/agents?status=ACTIVE&pageSize=100' : null);
  const [agentId, setAgentId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post(`/inquiries/${inquiryId}/assign`, { agentId, reason: reason || undefined });
      onAssigned();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign this lead"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} disabled={!agentId} onClick={submit}>
            Assign
          </Button>
        </>
      }
    >
      {error && (
        <p className="mb-3 rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger">
          {error}
        </p>
      )}
      {currentAgentName && (
        <p className="mb-3 text-sm">
          Currently with <span className="font-medium">{currentAgentName}</span>.
        </p>
      )}
      <div className="flex flex-col gap-3">
        <Field label="Agent">
          {(id) => (
            <Select id={id} value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              <option value="">Choose an agent</option>
              {(agents.data?.data || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Reason" hint="Optional, shown in the lead history">
          {(id) => <Input id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
      </div>
    </Modal>
  );
}
