import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/projects', label: 'Projects' },
        { to: '/tasks', label: 'Tasks' },
        { to: '/team', label: 'Team' },
    ];

    return (
        <nav className="navbar">
            <NavLink to="/dashboard" className="navbar-brand" onClick={() => setMenuOpen(false)}>
                <div className="logo-icon">⚡</div>
                <span>FlowDesk</span>
            </NavLink>

            {/* Desktop nav */}
            <div className="navbar-nav">
                {navLinks.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                        {label}
                    </NavLink>
                ))}
            </div>

            <div className="navbar-right">
                <div className="user-badge">
                    <div>
                        <div className="user-name">{user?.name}</div>
                        <div className="org-name">🏢 {user?.orgName}</div>
                    </div>
                    <span className={`role-tag ${user?.role?.toLowerCase()}`}>{user?.role}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>

                {/* Mobile hamburger */}
                <button
                    className="hamburger-btn"
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="mobile-menu">
                    {navLinks.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {label}
                        </NavLink>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
