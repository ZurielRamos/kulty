import { useEffect, useState } from 'react';
import { config } from '../config';

interface SettingsGroup {
  title: string;
  key: string;
  description: string;
  fields: { key: string; label: string; type?: 'text' | 'password' }[];
}

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: 'Tienda',
    key: 'store',
    description: 'Configuración general de la tienda',
    fields: [
      { key: 'STORE_LOGO', label: 'URL del Logo' },
    ],
  },
  {
    title: 'OpenRouter',
    key: 'openrouter',
    description: 'API para análisis de imágenes y generación de embeddings',
    fields: [
      { key: 'OPENROUTER_API_KEY', label: 'API Key', type: 'password' },
    ],
  },
  {
    title: 'Cloudinary',
    key: 'cloudinary',
    description: 'Almacenamiento de imágenes',
    fields: [
      { key: 'CLOUDINARY_CLOUD_NAME', label: 'Cloud Name' },
      { key: 'CLOUDINARY_UPLOAD_PRESET', label: 'Upload Preset' },
      { key: 'CLOUDINARY_API_KEY', label: 'API Key' },
    ],
  },
  {
    title: 'Sudomock',
    key: 'sudomock',
    description: 'Generación de mockups',
    fields: [
      { key: 'SUDOMOCK_API_KEY', label: 'API Key', type: 'password' },
    ],
  },
];

interface SudomockAccount {
  account: { name: string; email: string };
  subscription: { plan: string; status: string };
  usage: { credits_used_this_month: number; credits_limit: number; credits_remaining: number };
  api_key: { name: string; total_requests: number };
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [sudomockAccount, setSudomockAccount] = useState<SudomockAccount | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${config.apiUrl}/api/settings`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`${config.apiUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Error al guardar configuración');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleValidateSudomock = async () => {
    setValidating(true);
    setSudomockAccount(null);
    try {
      const res = await fetch(`${config.apiUrl}/api/settings/validate/sudomock`);
      const data = await res.json();
      if (data.success) {
        setSudomockAccount(data.data);
        // Guardar plan en settings
        setSettings((prev) => ({ ...prev, SUDOMOCK_PLAN: data.data.subscription.plan }));
        await fetch(`${config.apiUrl}/api/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SUDOMOCK_PLAN: data.data.subscription.plan }),
        });
      } else {
        setError(data.error || 'Error al validar Sudomock');
      }
    } catch {
      setError('Error de conexión al validar');
    } finally {
      setValidating(false);
    }
  };

  const togglePassword = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
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
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          ✓ Configuración guardada
        </div>
      )}

      <div className="space-y-4">
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.key} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800">{group.title}</h2>
              {group.key === 'sudomock' && settings['SUDOMOCK_PLAN'] && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium capitalize">
                  {settings['SUDOMOCK_PLAN']}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-4">{group.description}</p>

            <div className="space-y-3">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={
                        field.type === 'password' && !showPasswords[field.key]
                          ? 'password'
                          : 'text'
                      }
                      value={settings[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.key}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none font-mono text-sm pr-10"
                    />
                    {field.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => togglePassword(field.key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords[field.key] ? '🙈' : '👁'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón validar para Sudomock */}
            {group.key === 'sudomock' && (
              <div className="mt-4">
                <button
                  onClick={handleValidateSudomock}
                  disabled={validating}
                  className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {validating ? 'Validando...' : 'Validar credenciales'}
                </button>

                {sudomockAccount && (
                  <div className="mt-3 p-3 bg-green-50 rounded-xl text-sm space-y-1">
                    <p className="font-medium text-green-800">✓ Conexión válida</p>
                    <p className="text-green-700">
                      <span className="text-green-500">Cuenta:</span> {sudomockAccount.account.name} ({sudomockAccount.account.email})
                    </p>
                    <p className="text-green-700">
                      <span className="text-green-500">Plan:</span> {sudomockAccount.subscription.plan} — {sudomockAccount.subscription.status}
                    </p>
                    <p className="text-green-700">
                      <span className="text-green-500">Créditos:</span> {sudomockAccount.usage.credits_remaining}/{sudomockAccount.usage.credits_limit} restantes ({sudomockAccount.usage.credits_used_this_month} usados)
                    </p>
                    <p className="text-green-700">
                      <span className="text-green-500">API Key:</span> {sudomockAccount.api_key.name} — {sudomockAccount.api_key.total_requests} requests
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
