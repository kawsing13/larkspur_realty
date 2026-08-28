import { useRef, useState } from 'react';
import { DownloadSimple, Trash, UploadSimple, FilePdf, File } from '@phosphor-icons/react';
import { api, errorMessage, downloadFile } from '../../lib/apiClient.js';
import { useApi } from '../../hooks/useApi.js';
import { Button, Input, Select, Field, Badge, Spinner } from '../ui/index.js';
import { formatBytes, formatDate } from '../../lib/format.js';

const DOC_TYPES = [
  ['BROCHURE', 'Brochure'],
  ['FLOOR_PLAN', 'Floor plan'],
  ['PERMIT', 'Permit'],
  ['TITLE', 'Title'],
  ['OTHER', 'Other'],
];
const VISIBILITY = [
  ['PRIVATE', 'Private (our office)'],
  ['AGENTS', 'All agents'],
  ['PUBLIC', 'Public (on the listing)'],
];
const visTone = (v) => (v === 'PUBLIC' ? 'accent' : v === 'AGENTS' ? 'neutral' : 'danger');

export function DocumentManager({ propertyId }) {
  const { data, loading, error, refetch } = useApi(`/documents?propertyId=${propertyId}`);
  const fileRef = useRef(null);
  const [form, setForm] = useState({ title: '', docType: 'BROCHURE', visibility: 'PRIVATE' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const upload = async () => {
    if (!file || !form.title.trim()) return;
    setBusy('upload');
    setMsg('');
    try {
      const body = new FormData();
      body.append('propertyId', propertyId);
      body.append('title', form.title.trim());
      body.append('docType', form.docType);
      body.append('visibility', form.visibility);
      body.append('file', file);
      await api.post('/documents', body);
      setForm({ title: '', docType: 'BROCHURE', visibility: 'PRIVATE' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      refetch();
    } catch (err) {
      setMsg(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id) => {
    setBusy(id);
    try {
      await api.delete(`/documents/${id}`);
      refetch();
    } catch (err) {
      setMsg(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const changeVisibility = async (id, visibility) => {
    setBusy(id);
    try {
      await api.patch(`/documents/${id}`, { visibility });
      refetch();
    } catch (err) {
      setMsg(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {msg && (
        <p className="rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger" role="alert">
          {msg}
        </p>
      )}

      <div className="rounded border border-line bg-surface p-4">
        <h3 className="text-sm font-medium">Add a document</h3>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Title">
            {(id) => <Input id={id} value={form.title} onChange={set('title')} />}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              {(id) => (
                <Select id={id} value={form.docType} onChange={set('docType')}>
                  {DOC_TYPES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Who can see it">
              {(id) => (
                <Select id={id} value={form.visibility} onChange={set('visibility')}>
                  {VISIBILITY.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <div>
            <Button onClick={upload} loading={busy === 'upload'} disabled={!file || !form.title.trim()}>
              <UploadSimple size={16} /> Upload
            </Button>
            <p className="mt-1 text-xs text-ink-soft">PDF, image, or Word/Excel. Up to 20 MB.</p>
          </div>
        </div>
      </div>

      <div>
        {loading && <Spinner />}
        {!loading && error && <p className="text-sm text-danger">{error}</p>}
        {!loading && !error && data?.data.length === 0 && (
          <p className="rounded border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
            No documents yet.
          </p>
        )}
        {!loading && !error && data?.data.length > 0 && (
          <ul className="divide-y divide-line rounded border border-line">
            {data.data.map((d) => {
              const Icon = d.mimeType === 'application/pdf' ? FilePdf : File;
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <Icon size={20} className="text-ink-soft" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-ink-soft">
                      {d.fileName} · {formatBytes(d.sizeBytes)} · {formatDate(d.createdAt)}
                    </p>
                  </div>
                  <Select
                    className="h-8 w-40 text-xs"
                    value={d.visibility}
                    onChange={(e) => changeVisibility(d.id, e.target.value)}
                    aria-label="Visibility"
                  >
                    {VISIBILITY.map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </Select>
                  <Badge tone={visTone(d.visibility)}>{d.visibility.toLowerCase()}</Badge>
                  <button
                    onClick={() => downloadFile(`/documents/${d.id}/download`, d.fileName)}
                    aria-label="Download"
                    className="text-ink-soft hover:text-ink"
                  >
                    <DownloadSimple size={16} />
                  </button>
                  <button
                    onClick={() => remove(d.id)}
                    disabled={busy === d.id}
                    aria-label="Delete"
                    className="text-ink-soft hover:text-danger"
                  >
                    {busy === d.id ? <Spinner size={14} /> : <Trash size={16} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
