import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const TeamPage = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const [members, setMembers] = useState([]);
    const [taskCounts, setTaskCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, tRes] = await Promise.all([
                    api.get('/org/members'),
                    api.get('/tasks'),
                ]);
                setMembers(mRes.data);

                // Build task count per member (client-side from returned data is fine here)
                const counts = {};
                mRes.data.forEach(m => { counts[m._id] = { total: 0, done: 0 }; });
                tRes.data.forEach(t => {
                    const aid = t.assignedTo?._id;
                    if (aid && counts[aid]) {
                        counts[aid].total += 1;
                        if (t.status === 'Done') counts[aid].done += 1;
                    }
                });
                setTaskCounts(counts);
            } catch {
                /* ignore */
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="loading-spinner">⟳ Loading team…</div>;

    const admins = members.filter(m => m.role === 'Admin');
    const regular = members.filter(m => m.role === 'Member');

    const MemberCard = ({ member }) => {
        const counts = taskCounts[member._id] || { total: 0, done: 0 };
        const pct = counts.total === 0 ? 0 : Math.round((counts.done / counts.total) * 100);
        const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

        return (
            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                    width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--teal), var(--coral))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: '700', color: '#fff',
                }}>
                    {initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{member.name}</span>
                        <span className={`role-tag ${member.role.toLowerCase()}`}>{member.role}</span>
                        {member._id === user?._id && (
                            <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>You</span>
                        )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{member.email}</div>
                    <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                            <span>Tasks assigned</span>
                            <span>{counts.done}/{counts.total} done</span>
                        </div>
                        <div className="progress-bar-wrap" style={{ height: '5px' }}>
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Team</h1>
                    <p className="page-subtitle">{members.length} member{members.length !== 1 ? 's' : ''} in <strong style={{ color: 'var(--teal)' }}>{user?.orgName}</strong></p>
                </div>
            </div>

            {admins.length > 0 && (
                <div className="section">
                    <div className="section-title">👑 Admins</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {admins.map(m => <MemberCard key={m._id} member={m} />)}
                    </div>
                </div>
            )}

            {regular.length > 0 && (
                <div className="section">
                    <div className="section-title">👥 Members</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {regular.map(m => <MemberCard key={m._id} member={m} />)}
                    </div>
                </div>
            )}

            {members.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <p>No team members yet. Share your organization name so others can join.</p>
                </div>
            )}

            {/* Join Instructions */}
            <div className="card" style={{ marginTop: '1.5rem', background: 'rgba(44,165,141,0.06)', borderColor: 'var(--teal)' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>🔗 Invite Others</h3>
                <p style={{ fontSize: '0.88rem', marginBottom: '0.5rem' }}>Share your organization name so teammates can join via the Register page → "Join Org" tab.</p>
                <div style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '0.6rem 1rem',
                    fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--teal)',
                    display: 'inline-block',
                }}>
                    {user?.orgName}
                </div>
            </div>
        </>
    );
};

export default TeamPage;
