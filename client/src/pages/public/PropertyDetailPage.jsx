import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, EnvelopeSimple, Phone, CalendarPlus, FilePdf, DownloadSimple } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { apiUrl } from '../../lib/apiClient.js';
import { Badge, Button, Spinner, DataError } from '../../components/ui/index.js';
import { Gallery } from '../../components/property/Gallery.jsx';
import { SpecSheet } from '../../components/property/SpecSheet.jsx';
import { PropertyMap } from '../../components/property/PropertyMap.jsx';
import { PropertyCard } from '../../components/property/PropertyCard.jsx';
import { FavoriteButton } from '../../components/property/FavoriteButton.jsx';
import { InquiryForm } from '../../components/lead/InquiryForm.jsx';
import { ViewingFormModal } from '../../components/appointment/ViewingFormModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatMoney } from '../../lib/format.js';

export default function PropertyDetailPage() {
  const { key } = useParams();
  const { data, loading, error, refetch } = useApi(`/properties/${key}`);
  const property = data?.property;
  const { user } = useAuth();
  const toast = useToast();
  const [viewingOpen, setViewingOpen] = useState(false);

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-content px-4 py-16">
        <DataError message={error} onRetry={refetch} />
      </div>
    );
  }
  if (!property) return null;

  const place =
    property.location?.formattedAddress ||
    [property.location?.city, property.location?.state].filter(Boolean).join(', ');
  const agent = property.agent;
  const agentName = agent ? `${agent.user.firstName} ${agent.user.lastName}` : null;

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <Link to="/search" className="text-sm text-accent hover:underline">
        Back to listings
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <span className="font-mono uppercase tracking-wide text-accent">Larkspur Realty</span>
            <span className="h-1 w-1 rounded-full bg-line" />
            <span className="font-mono">{property.reference}</span>
          </div>
          <h1 className="mt-1 text-3xl sm:text-4xl">{property.title}</h1>
          {place && (
            <p className="mt-1 flex items-center gap-1 text-ink-soft">
              <MapPin size={16} weight="fill" className="text-ink-soft/70" /> {place}
            </p>
          )}
        </div>
        <div className="flex items-start gap-3">
          <div className="text-right">
            <p className="font-display text-3xl text-ink">
              {formatMoney(property.price, property.currency, property.listingMode)}
            </p>
            <Badge tone={property.listingMode === 'RENT' ? 'gold' : 'accent'}>
              {property.listingMode === 'RENT' ? 'For rent' : 'For sale'}
            </Badge>
          </div>
          <FavoriteButton propertyId={property.id} size={20} />
        </div>
      </div>

      <div className="mt-6">
        <Gallery images={property.images} title={property.title} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <h2 className="text-xl">About this property</h2>
          <p className="mt-3 whitespace-pre-line text-ink-soft">{property.description}</p>

          <h2 className="mt-10 text-xl">Specification</h2>
          <SpecSheet property={property} />

          {property.amenities?.length > 0 && (
            <>
              <h2 className="mt-10 text-xl">Amenities</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {property.amenities.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    {a.name}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="mt-10 text-xl">Location</h2>
          <div className="mt-3">
            <PropertyMap
              latitude={property.location?.latitude}
              longitude={property.location?.longitude}
              address={place}
            />
          </div>

          <h2 className="mt-10 text-xl">Documents</h2>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={apiUrl(`/properties/${property.reference}/brochure.pdf`)}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-2 rounded border border-line px-3 py-2 text-sm hover:border-ink-soft"
            >
              <FilePdf size={16} className="text-ink-soft" /> Property brochure (PDF)
            </a>
            {property.documents?.map((d) => (
              <a
                key={d.id}
                href={apiUrl(`/documents/${d.id}/download`)}
                className="flex w-fit items-center gap-2 rounded border border-line px-3 py-2 text-sm hover:border-ink-soft"
              >
                <DownloadSimple size={16} className="text-ink-soft" /> {d.title}
              </a>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-line bg-surface p-5 warm-shadow">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent">
              Presented by Larkspur Realty
            </p>
            <h3 className="mt-1.5 text-lg">Ask about this listing</h3>
            {agentName && (
              <p className="mt-1 text-sm text-ink-soft">
                Goes to{' '}
                <Link to={`/agents/${agent.id}`} className="text-accent hover:underline">
                  {agentName}
                </Link>
                {agent.title ? `, ${agent.title}` : ''}
              </p>
            )}
            <div className="mt-3">
              <InquiryForm propertyId={property.id} agentName={agentName} />
            </div>

            <button
              onClick={() => setViewingOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-line py-2 text-sm text-ink hover:border-ink-soft"
            >
              <CalendarPlus size={16} /> Request a viewing
            </button>

            {agent && (agent.user.email || agent.user.phone) && (
              <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3 text-sm">
                {agent.user.email && (
                  <a
                    href={`mailto:${agent.user.email}`}
                    className="flex items-center gap-2 text-accent hover:underline"
                  >
                    <EnvelopeSimple size={15} /> {agent.user.email}
                  </a>
                )}
                {agent.user.phone && (
                  <a
                    href={`tel:${agent.user.phone}`}
                    className="flex items-center gap-2 text-accent hover:underline"
                  >
                    <Phone size={15} /> {agent.user.phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {property.similar?.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl">Similar listings</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {property.similar.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      <ViewingFormModal
        open={viewingOpen}
        onClose={() => setViewingOpen(false)}
        propertyId={property.id}
        defaultContact={
          user ? { name: `${user.firstName} ${user.lastName}`, email: user.email, phone: user.phone } : {}
        }
        title={`Request a viewing of ${property.reference}`}
        onDone={() => {
          setViewingOpen(false);
          toast.success('Viewing requested. The agent will confirm a time.');
        }}
      />
    </div>
  );
}
