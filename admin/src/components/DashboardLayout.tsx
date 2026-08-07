import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function DashboardLayout() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#fef6f0] via-[#fdf2f8] to-[#f0f4ff] p-4 gap-4">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center justify-between py-6 bg-white rounded-2xl shadow-sm">
        {/* Top section */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold">K</span>
          </div>

          <nav className="flex flex-col gap-3">
            <NavLink
              to="/products"
              end
              className={({ isActive }) =>
                `w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-orange-50'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </NavLink>

            <NavLink
              to="/mockups"
              className={({ isActive }) =>
                `w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-orange-50'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </NavLink>

            <NavLink
              to="/users"
              className={({ isActive }) =>
                `w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-orange-50'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </NavLink>

            <NavLink
              to="/store"
              className={({ isActive }) =>
                `w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-orange-50'
                }`
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </NavLink>
          </nav>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-3">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isActive ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-orange-50'
              }`
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </NavLink>
          <button
            onClick={logout}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
