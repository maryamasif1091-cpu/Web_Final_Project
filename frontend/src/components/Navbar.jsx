import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span>TalentFlow <span className="brand-sub">ATS</span></span>
        </Link>

        <div className="nav-links">
          <Link to="/jobs" className="nav-link">Browse Jobs</Link>
          {!user ? (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          ) : (
            <>
              {user.role === 'candidate' && (
                <Link to="/dashboard" className="nav-link">My Dashboard</Link>
              )}
              {(user.role === 'hr' || user.role === 'admin') && (
                <Link to="/hr" className="nav-link">HR Portal</Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link">Admin</Link>
              )}
              <div className="nav-user">
                <img
                  src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}&background=1a56db&color=fff`}
                  alt="avatar"
                  className="nav-avatar"
                />
                <span className="nav-username">{user.name}</span>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}