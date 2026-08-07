import { useEffect, useState } from 'react';
import { config } from '../config';

type UserRole = 'admin' | 'editor' | 'viewer';

interface UserItem {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  createdAt: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const fetchUsers = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(`${config.apiUrl}/api/users`, { signal });
      const data = await res.json();
      setUsers(data);
    } catch (e: any) {
      if (e.name !== 'AbortError') throw e;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await fetch(`${config.apiUrl}/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-700',
    editor: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          + Nuevo usuario
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No hay usuarios</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => setEditingUser(user)}
              className="flex items-center gap-4 px-5 py-4 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full bg-gray-200"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.name}</p>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[user.role]}`}>
                {user.role}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <UserModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchUsers(); }}
        />
      )}

      {editingUser && (
        <UserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => { setEditingUser(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user?: UserItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user?.role || 'editor');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const body: any = { name, email, role };
      if (password) body.password = password;

      const url = isEditing
        ? `${config.apiUrl}/api/users/${user.id}`
        : `${config.apiUrl}/api/users`;

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Error al guardar usuario');
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
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@ejemplo.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEditing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
              required={!isEditing}
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <div className="flex gap-2">
              {(['admin', 'editor', 'viewer'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                    role === r
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-orange-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear usuario'}
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
