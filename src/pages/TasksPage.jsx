import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Backlog', 'Todo', 'In Progress', 'Done'];

const STATUS_COLORS = {
    'Backlog': '#8892a4',
    'Todo': '#fbbf24',
    'In Progress': '#60a5fa',
    'Done': '#2CA58D',
};

const TasksPage = () => {
    const { user } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [toast, setToast] = useState('');
    const [form, setForm] = useState({
        title: '', description: '', status: 'Backlog',
        priority: 'Medium', dueDate: '', projectId: '', assignedTo: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const showToast = (msg, isErr = false) => {
        setToast({ msg, isErr });
        setTimeout(() => setToast(''), 3000);
    };

    const fetchTasks = async () => {
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterPriority) params.priority = filterPriority;
            if (filterProject) params.projectId = filterProject;
            const res = await api.get('/tasks', { params });
            setTasks(res.data);
        } catch { setError('Failed to load tasks'); }
        finally { setLoading(false); }
    };

    const fetchProjects = async () => {
        const res = await api.get('/projects');
        setProjects(res.data);
    };

    const fetchMembers = async () => {
        const res = await api.get('/org/members');
        setMembers(res.data);
    };

    useEffect(() => {
        Promise.all([fetchProjects(), fetchMembers()]);
    }, []);

    useEffect(() => { fetchTasks(); }, [filterStatus, filterPriority, filterProject]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.projectId) return;
        setSubmitting(true);
        try {
            await api.post('/tasks', {
                ...form,
                assignedTo: form.assignedTo || undefined,
                dueDate: form.dueDate || undefined,
            });
            setForm({ title: '', description: '', status: 'Backlog', priority: 'Medium', dueDate: '', projectId: '', assignedTo: '' });
            setShowModal(false);
            showToast('Task created!');
            fetchTasks();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create task', true);
        } finally { setSubmitting(false); }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.patch(`/tasks/${taskId}`, { status: newStatus });
            setTasks(prev => prev.map(t => t._id === taskId
                ? { ...t, status: newStatus, isOverdue: t.dueDate && new Date(t.dueDate) < new Date() && newStatus !== 'Done' }
                : t
            ));
            showToast('Status updated');
        } catch { showToast('Failed to update', true); }
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(prev => prev.filter(t => t._id !== taskId));
            showToast('Task deleted');
        } catch { showToast('Failed to delete', true); }
    };

    const grouped = STATUSES.reduce((acc, s) => {
        acc[s] = tasks.filter(t => t.status === s);
        return acc;
    }, {});

    if (loading) return <div className="loading-spinner">⟳ Loading tasks…</div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Task Board</h1>
                    <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Task</button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter:</span>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Stages</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                    <option value="">All Priorities</option>
                    {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                    <option value="">All Projects</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                {(filterStatus || filterPriority || filterProject) && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterProject(''); }}>
                        Clear ✕
                    </button>
                )}
            </div>

            {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

            {/* Kanban Board */}
            <div className="kanban-board">
                {STATUSES.map(status => (
                    <div key={status} className="kanban-col">
                        <div className="kanban-col-header">
                            <span className="col-title" style={{ color: STATUS_COLORS[status] }}>
                                {status}
                            </span>
                            <span className="col-count">{grouped[status].length}</span>
                        </div>
                        <div className="kanban-col-body">
                            {grouped[status].length === 0 && (
                                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                    No tasks
                                </div>
                            )}
                            {grouped[status].map(task => (
                                <div key={task._id} className={`task-card ${task.isOverdue ? 'overdue' : ''}`}>
                                    <div className="task-title">{task.title}</div>
                                    {task.description && (
                                        <div className="task-desc">{task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}</div>
                                    )}
                                    <div className="task-meta">
                                        <span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                                        {task.isOverdue && <span className="badge badge-overdue">Overdue</span>}
                                        {task.projectId && <span className="task-project">📁 {task.projectId.name}</span>}
                                    </div>
                                    {task.assignedTo && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                                            👤 {task.assignedTo.name}
                                        </div>
                                    )}
                                    {task.dueDate && (
                                        <div className={`task-due ${task.isOverdue ? 'overdue-text' : ''}`} style={{ marginTop: '0.4rem' }}>
                                            📅 {new Date(task.dueDate).toLocaleDateString()}
                                        </div>
                                    )}
                                    <div className="task-actions">
                                        <select
                                            className="status-select"
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                        >
                                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task._id)}>🗑</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Task Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">New Task</span>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Task Title *</label>
                                <input placeholder="e.g. Design login page" value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea placeholder="Task details…" value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label>Project *</label>
                                    <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required>
                                        <option value="">Select project</option>
                                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Stage</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Assign To</label>
                                <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                                    <option value="">Unassigned</option>
                                    {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Creating…' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className={`toast ${toast.isErr ? 'error' : ''}`}>{toast.msg}</div>}
        </>
    );
};

export default TasksPage;
