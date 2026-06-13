import React, { useState, useEffect } from 'react';
import api from '../../api/config';
import toast from 'react-hot-toast';

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try { const res = await api.get('/admin/restaurants'); setRestaurants(res.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleApprove = async (id, current) => {
    try {
      await api.put(`/admin/restaurants/${id}/approve`, { is_approved: !current });
      toast.success('Restaurant status updated');
      load();
    } catch { toast.error('Failed'); }
  };

  // Client-side search filtering
  const filtered = restaurants.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name?.toLowerCase().includes(q) || r.owner_name?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q) || r.cuisine_type?.toLowerCase().includes(q);
    const matchCity = !cityFilter || r.city === cityFilter;
    return matchSearch && matchCity;
  });

  const cities = [...new Set(restaurants.map(r => r.city).filter(Boolean))].sort();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏪 Restaurant Management</h1>
        <p className="page-subtitle">{filtered.length} of {restaurants.length} restaurants</p>
      </div>

      {/* Search & filter toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: '1 1 260px', minWidth: 200 }}>
          <span>🔍</span>
          <input
            placeholder="Search by name, owner, city, or cuisine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px', fontSize: '1rem' }}>✕</button>
          )}
        </div>
        {cities.length > 0 && (
          <select className="input" style={{ width: 160 }} value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            <option value="">All Cities</option>
            {cities.map(c => <option key={c}>{c}</option>)}
          </select>
        )}
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Cuisine</th>
                <th>City</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.restaurant_id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.owner_name}<br /><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.owner_phone}</span></td>
                  <td>{r.cuisine_type}</td>
                  <td>{r.city}</td>
                  <td>⭐ {r.avg_rating ? Number(r.avg_rating).toFixed(1) : 'N/A'} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({r.total_reviews})</span></td>
                  <td>
                    <span style={{ background: r.is_approved !== false ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: r.is_approved !== false ? 'var(--success)' : 'var(--warning)', padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>
                      {r.is_approved !== false ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${r.is_approved !== false ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleApprove(r.restaurant_id, r.is_approved !== false)}
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      {r.is_approved !== false ? 'Suspend' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  {search ? `No restaurants matching "${search}"` : 'No restaurants found'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
