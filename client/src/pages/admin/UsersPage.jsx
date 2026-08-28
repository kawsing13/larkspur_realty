import { useState } from 'react';
import { Users } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { api, errorMessage } from '../../lib/apiClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { usePageParam } from '../../hooks/usePageParam.js';
import {
  Badge,
  Button,
  Input,
  Spinner,
  DataError,
  EmptyState,
  Pagination,
} from '../../components/ui/index.js';
import { formatDate } from '../../lib/format.js';

const statusTone = (status) =>
  status === 'SUSPENDED' ? 'danger' : status === 'ACTIVE' ? 'accent' : 'neutral';

export default function UsersPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const [busyId, setBusyId] = useState(null);

  const { page, setPage } = usePageParam(debounced);

  const qs = new URLSearchParams({ pageSize: '20', page: String(page) });
  if (debounced) qs.set('search', debounced);
  const { data, loading, error, refetch } = useApi(`/users?${qs.toString()}`);

  const setStatus = async (user, status) => {
    setBusyId(user.id);
    try {
      await api.patch(`/users/${user.id}/status`, { status });
      toast.success(`${user.email} is now ${status.toLowerCase()}`);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl">Users</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Everyone with an account. Suspending a user ends their sessions right away.
      </p>

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

        {!loading && !error && data?.data.length === 0 && (
          <EmptyState icon={Users} title="No users match that search" />
        )}

        {!loading && !error && data?.data.length > 0 && (
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-ink/[0.03] text-left text-ink-soft">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Roles</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Last seen</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.data.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{u.email}</td>
                    <td className="px-3 py-2 text-ink-soft">{u.roles.join(', ')}</td>
                    <td className="px-3 py-2">
                      <Badge tone={statusTone(u.status)}>{u.status.toLowerCase()}</Badge>
                    </td>
                    <td className="px-3 py-2 text-ink-soft">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'never'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {u.status === 'SUSPENDED' ? (
                        <Button
                          variant="ghost"
                          loading={busyId === u.id}
                          onClick={() => setStatus(u, 'ACTIVE')}
                        >
                          Reactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          loading={busyId === u.id}
                          onClick={() => setStatus(u, 'SUSPENDED')}
                        >
                          Suspend
                        </Button>
                      )}
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
    </div>
  );
}
