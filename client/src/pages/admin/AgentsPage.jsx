import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/apiClient.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { usePageParam } from '../../hooks/usePageParam.js';
import {
  Badge,
  Button,
  Input,
  Field,
  Modal,
  Spinner,
  DataError,
  Pagination,
} from '../../components/ui/index.js';

export default function AgentsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const [createOpen, setCreateOpen] = useState(false);

  const { page, setPage } = usePageParam(debounced);

  const qs = new URLSearchParams({ pageSize: '20', page: String(page) });
  if (debounced) qs.set('search', debounced);
  const { data, loading, error, refetch } = useApi(`/agents?${qs.toString()}`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Agents</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus size={16} /> New agent
        </Button>
      </div>

      <div className="mt-4 max-w-xs">
        <Input
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-6">
        {loading && (
          <div className="py-10 text-center">
            <Spinner />
          </div>
        )}
        {!loading && error && <DataError message={error} onRetry={refetch} />}
        {!loading && !error && data?.data.length > 0 && (
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-ink/[0.03] text-left text-ink-soft">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Properties</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.data.map((a) => (
                  <tr key={a.id} className="hover:bg-ink/[0.02]">
                    <td className="px-3 py-2">
                      <Link to={`/admin/agents/${a.id}`} className="text-accent hover:underline">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{a.email}</td>
                    <td className="px-3 py-2 text-ink-soft">{a.title || '-'}</td>
                    <td className="px-3 py-2 font-mono">{a.propertyCount}</td>
                    <td className="px-3 py-2">
                      <Badge tone={a.status === 'ACTIVE' ? 'accent' : 'neutral'}>
                        {a.status.toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && data && (
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        )}
      </div>

      <CreateAgentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          refetch();
          toast.success('Agent account created');
        }}
      />
    </div>
  );
}

function CreateAgentModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    title: '',
    licenseNumber: '',
    temporaryPassword: '',
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const createMut = useMutation((body) => api.post('/agents', body));

  const submit = async () => {
    try {
      await createMut.run({ ...form, phone: form.phone || undefined });
      onCreated();
      setForm({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        title: '',
        licenseNumber: '',
        temporaryPassword: '',
      });
    } catch {
      /* error shown in the modal */
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New agent account"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={createMut.loading}
            onClick={submit}
            disabled={
              !form.email || !form.firstName || !form.lastName || form.temporaryPassword.length < 8
            }
          >
            Create account
          </Button>
        </>
      }
    >
      {createMut.error && (
        <p className="mb-3 rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger">
          {createMut.error}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            {(id) => <Input id={id} value={form.firstName} onChange={set('firstName')} />}
          </Field>
          <Field label="Last name">
            {(id) => <Input id={id} value={form.lastName} onChange={set('lastName')} />}
          </Field>
        </div>
        <Field label="Email">
          {(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} />}
        </Field>
        <Field label="Phone" hint="Optional">
          {(id) => <Input id={id} type="tel" value={form.phone} onChange={set('phone')} />}
        </Field>
        <Field label="Title" hint="Optional">
          {(id) => <Input id={id} value={form.title} onChange={set('title')} />}
        </Field>
        <Field label="Temporary password" hint="Share this with the agent; they change it after signing in">
          {(id) => (
            <Input
              id={id}
              type="text"
              value={form.temporaryPassword}
              onChange={set('temporaryPassword')}
            />
          )}
        </Field>
      </div>
    </Modal>
  );
}
