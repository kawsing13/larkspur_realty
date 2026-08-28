import { useRef, useState } from 'react';
import { Star, Trash, UploadSimple } from '@phosphor-icons/react';
import { api, errorMessage } from '../../lib/apiClient.js';
import { Button, Spinner } from '../ui/index.js';

// Upload, set cover, and delete property photos. Files go straight to object
// storage via the API; this component only calls the endpoints and refreshes.
export function ImageManager({ propertyId, images = [], onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('image', file);
      await api.post(`/properties/${propertyId}/images`, body);
      await onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const act = async (request, id) => {
    setBusyId(id);
    setError('');
    try {
      await request();
      await onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p
          className="rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <Button variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}>
          <UploadSimple size={16} /> Add photo
        </Button>
        <p className="mt-1 text-xs text-ink-soft">
          JPEG, PNG, WebP, or AVIF, up to 5 MB. The first photo becomes the cover.
        </p>
      </div>

      {images.length === 0 ? (
        <p className="rounded border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
          No photos yet.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <li key={img.id} className="overflow-hidden rounded border border-line">
              <div className="aspect-[4/3] bg-ink/5">
                <img src={img.url} alt={img.caption || ''} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <button
                  onClick={() =>
                    act(
                      () => api.patch(`/properties/${propertyId}/images/${img.id}`, { isCover: true }),
                      img.id,
                    )
                  }
                  disabled={img.isCover || busyId === img.id}
                  className={`flex items-center gap-1 text-xs ${
                    img.isCover ? 'text-accent' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  <Star size={14} weight={img.isCover ? 'fill' : 'regular'} />
                  {img.isCover ? 'Cover photo' : 'Make cover'}
                </button>
                <button
                  onClick={() =>
                    act(() => api.delete(`/properties/${propertyId}/images/${img.id}`), img.id)
                  }
                  disabled={busyId === img.id}
                  aria-label="Delete photo"
                  className="text-ink-soft hover:text-danger"
                >
                  {busyId === img.id ? <Spinner size={14} /> : <Trash size={14} />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
