import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProjectsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'Admin';

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (err) {
            setError('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/projects', form);
            setForm({ name: '', description: '' });
            setShowModal(false);
            showToast('Project created!');
            fetchProjects();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create project');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this project and all its tasks?')) return;
        try {
            await api.delete(`/projects/${id}`);
            showToast('Project deleted');
            fetchProjects();
        } catch (err) {
            setError('Failed to delete project');
        }
    };

    if (loading) return <div className="loading-spinner">⟳ Loading projects…</div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your organization</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
                )}
            </div>

            {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

            {projects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📁</div>
                    <p>{isAdmin ? 'No projects yet. Create your first one!' : 'No projects in your organization yet.'}</p>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map((project) => (
                        <div key={project._id} className="project-card clickable" onClick={() => navigate(`/projects/${project._id}`)}>
                            <div className="project-card-header">
                                <div className="project-name">📁 {project.name}</div>
                                {isAdmin && (
                                    <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(project._id); }}>
                                        🗑
                                    </button>
                                )}
                            </div>
                            {project.description && (
                                <p className="project-desc">{project.description}</p>
                            )}
                            <div className="progress-bar-wrap">
                                <div className="progress-bar-fill" style={{ width: `${project.completionPercentage}%` }}></div>
                            </div>
                            <div className="progress-label">
                                <span>{project.completionPercentage}% complete</span>
                                <span>{project.doneTasks}/{project.totalTasks} tasks done</span>
                            </div>
                            <div className="project-footer">
                                <span>👤 {project.createdBy?.name}</span>
                                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">New Project</span>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Project Name *</label>
                                <input
                                    placeholder="e.g. Website Redesign"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    placeholder="What is this project about?"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Creating…' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className="toast">{toast}</div>}
        </>
    );
};

export default ProjectsPage;
