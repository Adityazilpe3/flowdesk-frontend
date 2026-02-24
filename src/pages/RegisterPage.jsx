import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const { register, joinOrg } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('create'); // 'create' | 'join'
    const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (tab === 'create') {
                await register(form.name, form.email, form.password, form.orgName);
            } else {
                await joinOrg(form.name, form.email, form.password, form.orgName);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo">⚡</div>
                    <h1>Get Started</h1>
                    <p>Create or join a workspace</p>
                </div>

                <div className="tab-group">
                    <button className={`tab-btn ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
                        Create Org
                    </button>
                    <button className={`tab-btn ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>
                        Join Org
                    </button>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>{tab === 'create' ? 'Organization Name (new)' : 'Organization Name (existing)'}</label>
                        <input
                            name="orgName"
                            placeholder={tab === 'create' ? 'e.g. Acme Corp' : 'Enter exact org name'}
                            value={form.orgName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {tab === 'create' && (
                        <p style={{ fontSize: '0.8rem', marginBottom: '1rem', color: 'var(--teal)' }}>
                            ✓ You will be assigned as Admin of this organization
                        </p>
                    )}
                    {tab === 'join' && (
                        <p style={{ fontSize: '0.8rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            ℹ You will join as a Member
                        </p>
                    )}

                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
                        {loading ? 'Creating account…' : tab === 'create' ? 'Create & Join' : 'Join Organization'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
