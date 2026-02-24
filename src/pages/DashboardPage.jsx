import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard');
                setData(res.data);
            } catch (err) {
                setError('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="loading-spinner">⟳ Loading dashboard…</div>;
    if (error) return <div className="error-msg">{error}</div>;

    const statuses = ['Backlog', 'Todo', 'In Progress', 'Done'];
    const maxCount = data ? Math.max(...statuses.map(s => data.tasksByStatus[s] || 0), 1) : 1;
    const priorities = ['High', 'Medium', 'Low'];
    const maxPrio = data ? Math.max(...priorities.map(p => data.tasksByPriority[p] || 0), 1) : 1;

    const dotClass = { 'Backlog': 'backlog', 'Todo': 'todo', 'In Progress': 'inprogress', 'Done': 'done' };

    return (
        <>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Good day, {user?.name?.split(' ')[0]} 👋</h1>
                    <p className="page-subtitle">Here's what's happening in <strong style={{ color: 'var(--teal)' }}>{user?.orgName}</strong></p>
                </div>
                <Link to="/tasks" className="btn btn-primary">+ New Task</Link>
            </div>

            {/* Overview Stats */}
            <div className="section">
                <div className="section-title">📊 Overview</div>
                <div className="stats-grid">
                    <div className="stat-card" style={{ '--accent': 'var(--teal)' }}>
                        <div className="stat-icon">📁</div>
                        <div className="stat-value">{data.totalProjects}</div>
                        <div className="stat-label">Total Projects</div>
                    </div>
                    <div className="stat-card" style={{ '--accent': '#60a5fa' }}>
                        <div className="stat-icon">📋</div>
                        <div className="stat-value">{data.totalTasks}</div>
                        <div className="stat-label">Total Tasks</div>
                    </div>
                    <div className="stat-card" style={{ '--accent': '#4ade80' }}>
                        <div className="stat-icon">✅</div>
                        <div className="stat-value">{data.completedPercentage}%</div>
                        <div className="stat-label">Completion Rate</div>
                    </div>
                    <div className="stat-card" style={{ '--accent': '#ef4444' }}>
                        <div className="stat-icon">🔴</div>
                        <div className="stat-value">{data.overdueTasks}</div>
                        <div className="stat-label">Overdue Tasks</div>
                    </div>
                </div>
            </div>

            {/* Analytics Row */}
            <div className="section">
                <div className="section-title">📈 Analytics</div>
                <div className="analytics-grid">
                    {/* Tasks by Status */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Tasks by Stage</h3>
                        <div className="bar-chart">
                            {statuses.map(s => (
                                <div key={s} className="bar-row">
                                    <span className="bar-label">
                                        <span className={`status-dot dot-${dotClass[s]}`}></span>
                                        {s}
                                    </span>
                                    <div className="bar-track">
                                        <div className="bar-fill" style={{ width: `${((data.tasksByStatus[s] || 0) / maxCount) * 100}%` }}></div>
                                    </div>
                                    <span className="bar-count">{data.tasksByStatus[s] || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tasks by Priority */}
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Tasks by Priority</h3>
                        <div className="bar-chart">
                            {priorities.map((p, i) => {
                                const colors = ['#ef4444', '#fbbf24', '#4ade80'];
                                return (
                                    <div key={p} className="bar-row">
                                        <span className="bar-label">{p}</span>
                                        <div className="bar-track">
                                            <div className="bar-fill" style={{
                                                width: `${((data.tasksByPriority[p] || 0) / maxPrio) * 100}%`,
                                                background: colors[i]
                                            }}></div>
                                        </div>
                                        <span className="bar-count">{data.tasksByPriority[p] || 0}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Completion Gauge */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3>Overall Completion</h3>
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{
                                fontSize: '3rem', fontWeight: '800',
                                background: 'linear-gradient(135deg, var(--teal), var(--teal-light))',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                            }}>
                                {data.completedPercentage}%
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                {data.doneTasks} of {data.totalTasks} tasks completed
                            </div>
                        </div>
                        <div className="progress-bar-wrap" style={{ height: '10px' }}>
                            <div className="progress-bar-fill" style={{ width: `${data.completedPercentage}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Tasks */}
            <div className="section">
                <div className="section-title">🕒 Recent Tasks</div>
                {data.recentTasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p>No tasks yet. <Link to="/tasks" style={{ color: 'var(--teal)' }}>Create your first task →</Link></p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {data.recentTasks.map(task => {
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
                            return (
                                <div key={task._id} className={`task-card ${isOverdue ? 'overdue' : ''}`}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <div className="task-title">{task.title}</div>
                                        <div className="task-project">📁 {task.projectId?.name || '—'}</div>
                                    </div>
                                    <div className="task-meta">
                                        <span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                                        <span className={`badge ${task.status === 'Done' ? 'badge-done' : ''}`}
                                            style={task.status !== 'Done' ? { background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' } : {}}>
                                            {task.status}
                                        </span>
                                        {isOverdue && <span className="badge badge-overdue">Overdue</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default DashboardPage;
