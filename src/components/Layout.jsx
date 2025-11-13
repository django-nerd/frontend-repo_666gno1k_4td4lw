import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const location = useLocation()
  const nav = [
    { to: '/', label: 'Dashboard' },
    { to: '/canned', label: 'Canned' },
    { to: '/import', label: 'Import' },
    { to: '/portal', label: 'Customer Portal' },
  ]
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-xl font-bold text-blue-600">Agent Inbox</Link>
          <nav className="ml-auto flex items-center gap-2">
            {nav.map(n => (
              <Link key={n.to} to={n.to} className={`text-sm px-2 py-1 rounded ${location.pathname===n.to? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>{n.label}</Link>
            ))}
            <Link to="/test" className="text-sm text-gray-600 hover:text-gray-900">Health</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
