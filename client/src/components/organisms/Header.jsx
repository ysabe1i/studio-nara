import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'home' },
  { to: '/library', label: 'library' },
  { to: '/notes', label: 'quick notes' },
  { to: '/settings', label: 'settings' },
]

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
      <NavLink to="/" className="font-pixel text-primary text-2xl">nara</NavLink>
      {user?.emailVerified && (
        <nav className="flex items-center gap-6" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) =>
                `text-small font-medium ${isActive ? 'text-primary' : 'text-ink/70 hover:text-ink'}`
              }>
              {item.label}
            </NavLink>
          ))}
          <button type="button" onClick={logout} className="text-small text-ink/50 hover:text-ink">
            log out
          </button>
        </nav>
      )}
    </header>
  )
}