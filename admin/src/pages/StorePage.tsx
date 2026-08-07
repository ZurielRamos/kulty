import { useEffect, useState } from 'react';
import { config } from '../config';

export function StorePage() {
  const [logo, setLogo] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoBlob, setLogoBlob] = useState<Blob | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [prices, setPrices] = useState([
    { size: '35x50', price: 0 },
    { size: '50x70', price: 0 },
    { size: '70x100', price: 0 },
    { size: '100x140', price: 0 },
  ]);

  useEffect(() => {
    fetch(`${config.apiUrl}/api/store`)
      .then((res) => res.json())
      .then((data) => {
        setLogo(data.logo);
        setPhone(data.phone || '');
        setInstagram(data.instagram || '');
        setFacebook(data.facebook || '');
        setTiktok(data.tiktok || '');
        if (data.prices?.length) setPrices(data.prices);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePasteLogo = (e: React.ClipboardEvent) => {
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
              canvas.height = 200;
              const ctx = canvas.getContext('2d')!;
              const size = Math.min(img.width, img.height);
              const sx = (img.width - size) / 2;
              const sy = (img.height - size) / 2;
              ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              setLogoPreview(dataUrl);
              canvas.toBlob(
                (blob) => { if (blob) setLogoBlob(blob); },
                'image/jpeg',
                0.9,
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

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      // Subir logo si hay uno nuevo
      if (logoBlob) {
        const formData = new FormData();
        formData.append('file', logoBlob, 'logo.jpg');
        const logoRes = await fetch(`${config.apiUrl}/api/store/logo`, {
          method: 'POST',
          body: formData,
        });
        if (logoRes.ok) {
          const data = await logoRes.json();
          setLogo(data.logo);
          setLogoBlob(null);
          setLogoPreview(null);
        }
      }

      // Guardar datos de texto
      await fetch(`${config.apiUrl}/api/store`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, instagram, facebook, tiktok, prices }),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {} finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Tienda</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          ✓ Configuración guardada
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
        <h2 className="font-semibold text-gray-800">Logo</h2>

        <div className="flex items-center gap-4">
          <div
            onPaste={handlePasteLogo}
            tabIndex={0}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer focus:border-orange-400 focus:outline-none"
          >
            {logoPreview || logo ? (
              <img src={logoPreview || logo!} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gray-400 text-center px-1">Ctrl+V</span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Pega una imagen cuadrada. Se recortará a 200x200px.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">Contacto y redes sociales</h2>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono / WhatsApp</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+57 300 123 4567"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Instagram</label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@kultyshop"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Facebook</label>
          <input
            type="text"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/kultyshop"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">TikTok</label>
          <input
            type="text"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="@kultyshop"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800">Precios por tamaño</h2>
        <p className="text-sm text-gray-400">Configura el precio de cada tamaño disponible (en tu moneda local)</p>

        <div className="grid grid-cols-2 gap-3">
          {prices.map((item, idx) => (
            <div key={item.size} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 w-20">{item.size} cm</span>
              <input
                type="number"
                value={item.price || ''}
                onChange={(e) => {
                  const updated = [...prices];
                  updated[idx] = { ...item, price: Number(e.target.value) };
                  setPrices(updated);
                }}
                placeholder="0"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
