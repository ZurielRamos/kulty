import { useEffect, useState } from 'react';
import { config } from '../config';

interface MockupItem {
  id: number;
  title: string;
  type: 'vertical' | 'horizontal' | 'cuadrado';
  quality: 'baja' | 'media' | 'alta';
  mockupUuid: string;
  smartObjectUuid: string;
  previewUrl: string;
  createdAt: string;
}

export function MockupsPage() {
  const [mockups, setMockups] = useState<MockupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMockup, setEditingMockup] = useState<MockupItem | null>(null);

  const fetchMockups = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(`${config.apiUrl}/api/mockups`, { signal });
      const data = await res.json();
      setMockups(data);
    } catch (e: any) {
      if (e.name !== 'AbortError') throw e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchMockups(controller.signal);
    return () => controller.abort();
  }, []);

  const handleDelete = async (id: number) => {
    await fetch(`${config.apiUrl}/api/mockups/${id}`, { method: 'DELETE' });
    fetchMockups();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mockups</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          + Nuevo mockup
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mockups.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No hay mockups configurados
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {mockups.map((mockup) => (
            <div
              key={mockup.id}
              className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer aspect-[4/5]"
              onClick={() => setEditingMockup(mockup)}
            >
              {mockup.previewUrl ? (
                <img
                  src={mockup.previewUrl}
                  alt={mockup.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Info flotante */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                <h3 className="font-medium text-xs text-white truncate">{mockup.title}</h3>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/20 text-white rounded-full capitalize backdrop-blur-sm">
                    {mockup.type}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(mockup.id); }}
                    className="text-[10px] text-red-300 hover:text-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateMockupModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            fetchMockups();
          }}
        />
      )}

      {editingMockup && (
        <EditMockupModal
          mockup={editingMockup}
          onClose={() => setEditingMockup(null)}
          onSaved={() => {
            setEditingMockup(null);
            fetchMockups();
          }}
        />
      )}
    </div>
  );
}

function CreateMockupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'vertical' | 'horizontal' | 'cuadrado'>('vertical');
  const [quality, setQuality] = useState<'baja' | 'media' | 'alta'>('baja');
  const [mockupUuid, setMockupUuid] = useState('');
  const [smartObjectUuid, setSmartObjectUuid] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pegar imagen desde clipboard — recortar a 200x200 centrada
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 200;
              canvas.height = 250;
              const ctx = canvas.getContext('2d')!;

              // Crop centrado cover 7:10
              const targetRatio = 4 / 5;
              const imgRatio = img.width / img.height;
              let sw: number, sh: number, sx: number, sy: number;
              if (imgRatio > targetRatio) {
                sh = img.height;
                sw = img.height * targetRatio;
                sx = (img.width - sw) / 2;
                sy = 0;
              } else {
                sw = img.width;
                sh = img.width / targetRatio;
                sx = 0;
                sy = (img.height - sh) / 2;
              }
              ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 200, 250);

              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              setPreviewImage(dataUrl);
              canvas.toBlob(
                (blob) => { if (blob) setPreviewBlob(blob); },
                'image/jpeg',
                0.85,
              );
            };
            img.src = reader.result as string;
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !mockupUuid || !smartObjectUuid) return;

    setIsUploading(true);
    setError(null);

    try {
      const res = await fetch(`${config.apiUrl}/api/mockups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, quality, mockupUuid, smartObjectUuid, previewUrl: '' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Error al crear mockup');
      }

      const mockup = await res.json();

      // Subir miniatura si hay imagen
      if (previewBlob) {
        const formData = new FormData();
        formData.append('file', previewBlob, 'preview.jpg');
        await fetch(`${config.apiUrl}/api/mockups/${mockup.id}/preview`, {
          method: 'POST',
          body: formData,
        });
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Nuevo Mockup</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            {/* Miniatura */}
            <div
              onPaste={handlePaste}
              tabIndex={0}
              className="w-16 h-20 rounded-xl border-2 border-dashed border-gray-300 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer focus:border-orange-400 focus:outline-none"
            >
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400 text-center px-1">Ctrl+V</span>
              )}
            </div>

            {/* Título */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Canvas en pared blanca"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <div className="flex gap-2">
              {(['vertical', 'horizontal', 'cuadrado'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                    type === t
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calidad
            </label>
            <div className="flex gap-2">
              {(['baja', 'media', 'alta'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                    quality === q
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pegar código de Sudomock
            </label>
            <textarea
              placeholder="Pega aquí el código curl de Sudomock..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none font-mono text-xs resize-none"
              onChange={(e) => {
                const text = e.target.value;
                // Extraer mockup_uuid
                const mockupMatch = text.match(/"mockup_uuid"\s*:\s*"([^"]+)"/);
                if (mockupMatch) setMockupUuid(mockupMatch[1]);
                // Extraer smart object uuid
                const soMatch = text.match(/"uuid"\s*:\s*"([^"]+)"/);
                if (soMatch) setSmartObjectUuid(soMatch[1]);
              }}
            />
            {(mockupUuid || smartObjectUuid) && (
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                {mockupUuid && <p>Mockup: <span className="font-mono text-orange-600">{mockupUuid}</span></p>}
                {smartObjectUuid && <p>Smart Object: <span className="font-mono text-orange-600">{smartObjectUuid}</span></p>}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isUploading || !title || !mockupUuid || !smartObjectUuid}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {isUploading ? 'Guardando...' : 'Crear mockup'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditMockupModal({
  mockup,
  onClose,
  onSaved,
}: {
  mockup: MockupItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(mockup.title);
  const [type, setType] = useState(mockup.type);
  const [quality, setQuality] = useState(mockup.quality || 'baja');
  const [mockupUuid, setMockupUuid] = useState(mockup.mockupUuid);
  const [smartObjectUuid, setSmartObjectUuid] = useState(mockup.smartObjectUuid);
  const [previewImage, setPreviewImage] = useState<string | null>(mockup.previewUrl || null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 200;
              canvas.height = 250;
              const ctx = canvas.getContext('2d')!;
              const targetRatio = 4 / 5;
              const imgRatio = img.width / img.height;
              let sw: number, sh: number, sx: number, sy: number;
              if (imgRatio > targetRatio) {
                sh = img.height;
                sw = img.height * targetRatio;
                sx = (img.width - sw) / 2;
                sy = 0;
              } else {
                sw = img.width;
                sh = img.width / targetRatio;
                sx = 0;
                sy = (img.height - sh) / 2;
              }
              ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 200, 250);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              setPreviewImage(dataUrl);
              canvas.toBlob(
                (blob) => { if (blob) setPreviewBlob(blob); },
                'image/jpeg',
                0.85,
              );
            };
            img.src = reader.result as string;
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`${config.apiUrl}/api/mockups/${mockup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, quality, mockupUuid, smartObjectUuid, previewUrl: mockup.previewUrl || '' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Error al actualizar mockup');
      }

      // Subir nueva miniatura si se pegó una
      if (previewBlob) {
        const formData = new FormData();
        formData.append('file', previewBlob, 'preview.jpg');
        await fetch(`${config.apiUrl}/api/mockups/${mockup.id}/preview`, {
          method: 'POST',
          body: formData,
        });
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Editar Mockup</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div
              onPaste={handlePaste}
              tabIndex={0}
              className="w-16 h-20 rounded-xl border-2 border-dashed border-gray-300 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer focus:border-orange-400 focus:outline-none"
            >
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400 text-center px-1">Ctrl+V</span>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-2">
              {(['vertical', 'horizontal', 'cuadrado'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                    type === t
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calidad</label>
            <div className="flex gap-2">
              {(['baja', 'media', 'alta'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                    quality === q
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mockup UUID</label>
            <input
              type="text"
              value={mockupUuid}
              onChange={(e) => setMockupUuid(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Smart Object UUID</label>
            <input
              type="text"
              value={smartObjectUuid}
              onChange={(e) => setSmartObjectUuid(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none font-mono text-sm"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
