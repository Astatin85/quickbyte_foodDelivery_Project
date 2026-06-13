import React, { useState, useEffect } from 'react';
import api from '../../api/config';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: roleFilter ? { role: roleFilter } : {} });
      setUsers(res.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const toggleStatus = async (authId, currentStatus) => {
    try {
      await api.put(`/admin/users/${authId}/status`, { is_active: !currentStatus });
      toast.success('User status updated');
      load();
    } catch { toast.error('Failed'); }
  };

  // Filter by mobile number or name — client-side fast search
  const filtered = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(u.auth_id).includes(q) ||
      (u.full_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 User Management</h1>
        <p className="page-subtitle">{filtered.length} of {users.length} users</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Mobile / name search */}
        <div className="search-bar" style={{ flex: '1 1 260px', minWidth: 200 }}>
          <span>🔍</span>
          <input
            placeholder="Search by mobile number or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px', fontSize: '1rem' }}>✕</button>
          )}
        </div>

        {/* Role filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', 'CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER'].map(r => (
            <button
              key={r}
              className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setRoleFilter(r)}
              style={{ fontSize: '0.78rem' }}
            >
              {r || 'All Roles'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>📱 Mobile (Auth ID)</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.auth_id}>
                  <td><code style={{ fontSize: '0.88rem', color: 'var(--primary)' }}>{u.auth_id}</code></td>
                  <td>{u.full_name || '—'}</td>
                  <td>
                    <span style={{ background: 'rgba(255,107,53,0.15)', color: 'var(--primary)', padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>
                      {u.user_type || u.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ background: u.is_active !== false ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: u.is_active !== false ? 'var(--success)' : 'var(--danger)', padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>
                      {u.is_active !== false ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.is_active !== false ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleStatus(u.auth_id, u.is_active !== false)}
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                    >
                      {u.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  {search ? `No users matching "${search}"` : 'No users found'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
