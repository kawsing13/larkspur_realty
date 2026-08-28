import { useState } from 'react';
import { useParams, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { api } from '../../lib/apiClient.js';
import { useApi } from '../../hooks/useApi.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button, Spinner, DataError } from '../../components/ui/index.js';
import { StatusBadge } from '../../components/property/StatusBadge.jsx';
import { PropertyForm } from '../../components/property/PropertyForm.jsx';
import { LocationEditor } from '../../components/property/LocationEditor.jsx';
import { AmenityPicker } from '../../components/property/AmenityPicker.jsx';
import { ImageManager } from '../../components/property/ImageManager.jsx';
import { DocumentManager } from '../../components/property/DocumentManager.jsx';
import { WorkflowActions } from '../../components/listing/WorkflowActions.jsx';
import { StatusTimeline } from '../../components/listing/StatusTimeline.jsx';
import { formatDate } from '../../lib/format.js';

const TABS = ['Details', 'Location', 'Photos', 'Documents', 'Amenities', 'Review'];

// Handles both "new property" and "edit property", for the agent and admin portals.
export default function PropertyEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { user, hasRole } = useAuth();

  const base = location.pathname.startsWith('/admin') ? '/admin' : '/agent';
  const canApprove = hasRole('ADMINISTRATOR', 'SUPER_ADMIN');

  const wantedTab = searchParams.get('tab');
  const initialTab = TABS.find((t) => t.toLowerCase() === wantedTab) || 'Details';
  const [tab, setTab] = useState(initialTab);
  const [busyAction, setBusyAction] = useState(null);

  const types = useApi('/property-types');
  const amenities = useApi('/amenities');
  const propertyReq = useApi(isNew ? null : `/properties/manage/${id}`);
  const property = propertyReq.data?.property;
  const listing = property?.listing;
  const reload = () => propertyReq.refetch();

  const createMut = useMutation((body) => api.post('/properties', body));
  const detailsMut = useMutation((body) => api.patch(`/properties/${id}`, body));
  const locationMut = useMutation((body) => api.put(`/properties/${id}/location`, body));
  const amenityMut = useMutation((slugs) => api.put(`/properties/${id}/amenities`, { slugs }));

  const owns =
    !!property &&
    ((user?.agentId && property.agentId === user.agentId) || property.createdById === user?.id);
  const canSubmit = canApprove || owns;

  // ---- create mode ----
  if (isNew) {
    return (
      <div className="max-w-2xl">
        <BackLink base={base} />
        <h1 className="mt-2 text-2xl">New property</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Start with the basics. Add photos, a location, and amenities on the next screen.
        </p>
        <div className="mt-6">
          <PropertyForm
            types={types.data?.data}
            submitting={createMut.loading}
            error={createMut.error}
            submitLabel="Create property"
            onSubmit={async (body) => {
              try {
                const data = await createMut.run(body);
                toast.success('Property created');
                navigate(`${base}/properties/${data.property.id}`, { replace: true });
              } catch {
                /* error is shown inline by PropertyForm */
              }
            }}
          />
        </div>
      </div>
    );
  }

  // ---- edit mode ----
  if (propertyReq.loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner />
      </div>
    );
  }
  if (propertyReq.error) return <DataError message={propertyReq.error} onRetry={reload} />;
  if (!property) return null;

  const runAction = async (action, payload = {}) => {
    setBusyAction(action);
    try {
      await api.post(`/listings/${listing.id}/${action}`, payload);
      toast.success('Listing updated');
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Could not update the listing');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <BackLink base={base} />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs text-ink-soft">{property.reference}</span>
          <h1 className="text-2xl">{property.title}</h1>
        </div>
        <StatusBadge status={property.status} />
      </div>

      {listing?.status === 'CHANGES_REQUESTED' && listing.reviewNotes && (
        <div className="mt-4 rounded border border-danger/30 bg-danger/5 p-3 text-sm">
          <p className="font-medium text-danger">Changes requested</p>
          <p className="mt-1 text-ink-soft">{listing.reviewNotes}</p>
          <button
            onClick={() => setTab('Review')}
            className="mt-1 text-xs text-accent hover:underline"
          >
            Go to Review
          </button>
        </div>
      )}

      {/* Section tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
              tab === t
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Details' && (
          <PropertyForm
            property={property}
            types={types.data?.data}
            submitting={detailsMut.loading}
            error={detailsMut.error}
            submitLabel="Save details"
            onSubmit={async (body) => {
              try {
                await detailsMut.run(body);
                toast.success('Details saved');
                reload();
              } catch {
                /* inline */
              }
            }}
          />
        )}

        {tab === 'Location' && (
          <LocationEditor
            location={property.location}
            saving={locationMut.loading}
            error={locationMut.error}
            onSave={async (body) => {
              try {
                await locationMut.run(body);
                toast.success('Location saved');
                reload();
              } catch {
                /* inline */
              }
            }}
          />
        )}

        {tab === 'Photos' && (
          <ImageManager propertyId={property.id} images={property.images} onChange={reload} />
        )}

        {tab === 'Documents' && <DocumentManager propertyId={property.id} />}

        {tab === 'Amenities' && (
          <AmenityPicker
            all={amenities.data?.data}
            selected={property.amenities}
            saving={amenityMut.loading}
            error={amenityMut.error}
            onSave={async (slugs) => {
              try {
                await amenityMut.run(slugs);
                toast.success('Amenities saved');
                reload();
              } catch {
                /* inline */
              }
            }}
          />
        )}

        {tab === 'Review' && listing && (
          <div className="flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-3">
                <StatusBadge status={listing.status} />
                <span className="text-sm text-ink-soft">
                  {listing.submittedBy && listing.status === 'PENDING_REVIEW'
                    ? `Submitted by ${listing.submittedBy} on ${formatDate(listing.submittedAt)}`
                    : listing.reviewedBy && listing.reviewedAt
                      ? `Last reviewed by ${listing.reviewedBy} on ${formatDate(listing.reviewedAt)}`
                      : null}
                </span>
              </div>

              <div className="mt-4">
                <WorkflowActions
                  listing={listing}
                  listingMode={property.listingMode}
                  canApprove={canApprove}
                  canSubmit={canSubmit}
                  onAction={runAction}
                  busy={busyAction}
                />
              </div>
            </div>

            <div>
              <h3 className="text-base">History</h3>
              <div className="mt-3">
                <StatusTimeline history={listing.history} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BackLink({ base }) {
  return (
    <Link
      to={`${base}/properties`}
      className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
    >
      <ArrowLeft size={14} /> All properties
    </Link>
  );
}
