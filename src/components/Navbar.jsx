import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <NavLink to="/dashboard" className="navbar-brand">
                <div className="logo-icon">⚡</div>
                <span>FlowDesk</span>
            </NavLink>

            <div className="navbar-nav">
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    Dashboard
                </NavLink>
                <NavLink to="/projects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    Projects
                </NavLink>
                <NavLink to="/tasks" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    Tasks
                </NavLink>
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
            </div>
        </nav>
    );
};

export default Navbar;
