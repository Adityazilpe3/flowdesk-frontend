import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Backlog', 'Todo', 'In Progress', 'Done'];

const STATUS_COLORS = {
    'Backlog': '#8892a4',
    'Todo': '#fbbf24',
    'In Progress': '#60a5fa',
    'Done': '#2CA58D',
};

const ProjectDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [toast, setToast] = useState('');

    const [form, setForm] = useState({
        title: '', description: '', status: 'Backlog',
        priority: 'Medium', dueDate: '', assignedTo: '',
    });

    const showToast = (msg, err = false) => {
        setToast({ msg, err });
        setTimeout(() => setToast(''), 3000);
    };

    const fetchAll = async () => {
        try {
            const [pRes, tRes, mRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get('/tasks', { params: { projectId: id } }),
                api.get('/org/members'),
            ]);
            setProject(pRes.data);
            setTasks(tRes.data);
            setMembers(mRes.data);
        } catch {
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, [id]);

    const resetForm = () => setForm({ title: '', description: '', status: 'Backlog', priority: 'Medium', dueDate: '', assignedTo: '' });

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', { ...form, projectId: id, assignedTo: form.assignedTo || undefined, dueDate: form.dueDate || undefined });
            setShowAdd(false);
            resetForm();
            showToast('Task added!');
            fetchAll();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed', true);
        }
    };

    const handleEditTask = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/tasks/${editTask._id}`, { ...form, assignedTo: form.assignedTo || undefined, dueDate: form.dueDate || undefined });
            setEditTask(null);
            resetForm();
            showToast('Task updated!');
            fetchAll();
        } catch {
            showToast('Failed to update', true);
        }
    };

    const openEdit = (task) => {
        setEditTask(task);
        setForm({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
            assignedTo: task.assignedTo?._id || '',
        });
    };

    const handleStatusChange = async (taskId, newStatus) => {
        await api.patch(`/tasks/${taskId}`, { status: newStatus });
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        showToast('Status updated');
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        await api.delete(`/tasks/${taskId}`);
        setTasks(prev => prev.filter(t => t._id !== taskId));
        showToast('Deleted');
    };

    const grouped = STATUSES.reduce((acc, s) => {
        acc[s] = tasks.filter(t => t.status === s);
        return acc;
    }, {});

    if (loading) return <div className="loading-spinner">⟳ Loading project…</div>;
    if (!project) return null;

    const modalForm = (onSubmit, title) => (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setEditTask(null); resetForm(); }}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">{title}</span>
                    <button className="modal-close" onClick={() => { setShowAdd(false); setEditTask(null); resetForm(); }}>✕</button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>Title *</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Task title" />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details…" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                            <label>Stage</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                {STATUSES.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Priority</label>
                            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                {['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Due Date</label>
                            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Assign To</label>
                            <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                                <option value="">Unassigned</option>
                                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => { setShowAdd(false); setEditTask(null); resetForm(); }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Task</button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <>
            {/* Header */}
            <div style={{ marginBottom: '0.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: '1rem' }}>
                    ← Back to Projects
                </button>
            </div>

            <div className="page-header">
                <div>
                    <h1 className="page-title">📁 {project.name}</h1>
                    {project.description && <p className="page-subtitle">{project.description}</p>}
                    <div style={{ marginTop: '0.75rem' }}>
                        <div className="progress-bar-wrap" style={{ height: '8px', maxWidth: '300px' }}>
                            <div className="progress-bar-fill" style={{ width: `${project.completionPercentage}%` }}></div>
                        </div>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem', display: 'block' }}>
                            {project.completionPercentage}% complete · {project.doneTasks}/{project.totalTasks} tasks done
                        </span>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Task</button>
            </div>

            {/* Kanban Board */}
            <div className="kanban-board">
                {STATUSES.map(status => (
                    <div key={status} className="kanban-col">
                        <div className="kanban-col-header">
                            <span className="col-title" style={{ color: STATUS_COLORS[status] }}>{status}</span>
                            <span className="col-count">{grouped[status].length}</span>
                        </div>
                        <div className="kanban-col-body">
                            {grouped[status].length === 0 && (
                                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>No tasks</div>
                            )}
                            {grouped[status].map(task => {
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
                                return (
                                    <div key={task._id} className={`task-card ${isOverdue ? 'overdue' : ''}`}>
                                        <div className="task-title">{task.title}</div>
                                        {task.description && <div className="task-desc">{task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}</div>}
                                        <div className="task-meta">
                                            <span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                                            {isOverdue && <span className="badge badge-overdue">Overdue</span>}
                                        </div>
                                        {task.assignedTo && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>👤 {task.assignedTo.name}</div>}
                                        {task.dueDate && <div className={`task-due ${isOverdue ? 'overdue-text' : ''}`} style={{ marginTop: '0.4rem' }}>📅 {new Date(task.dueDate).toLocaleDateString()}</div>}
                                        <div className="task-actions">
                                            <select className="status-select" value={task.status} onChange={e => handleStatusChange(task._id, e.target.value)}>
                                                {STATUSES.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)} style={{ padding: '0.25rem 0.5rem' }}>✏️</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task._id)}>🗑</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {showAdd && modalForm(handleAddTask, 'Add Task')}
            {editTask && modalForm(handleEditTask, 'Edit Task')}
            {toast && <div className={`toast ${toast.err ? 'error' : ''}`}>{toast.msg}</div>}
        </>
    );
};

export default ProjectDetailPage;
