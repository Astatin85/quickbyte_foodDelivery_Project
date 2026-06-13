import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/config';
import toast from 'react-hot-toast';

const CUISINES = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican', 'Fast Food', 'Biryani', 'Pizza', 'Burger', 'Desserts'];
const FOOD_EMOJIS = { Pizza: '🍕', Burger: '🍔', Chinese: '🍜', Biryani: '🍚', Italian: '🍝', Desserts: '🍰', default: '🍽️' };

const getEmoji = (cuisine) => {
  for (const key of Object.keys(FOOD_EMOJIS)) {
    if (cuisine?.includes(key)) return FOOD_EMOJIS[key];
  }
  return FOOD_EMOJIS.default;
};

const safeRating = (r) => {
  const n = parseFloat(r);
  return isNaN(n) ? null : n.toFixed(1);
};

export default function CustomerRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [city, setCity] = useState('');
  const [minRating, setMinRating] = useState('');
  const navigate = useNavigate();

  const [userCity, setUserCity] = useState(null);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (cuisine) params.cuisine = cuisine;
      if (minRating) params.min_rating = minRating;
      const res = await api.get('/customer/restaurants', { params });
      // New API returns { restaurants, city }
      if (res.data && res.data.restaurants) {
        setRestaurants(res.data.restaurants);
        setUserCity(res.data.city);
      } else {
        setRestaurants(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load restaurants');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRestaurants(); }, []);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🏪 Browse Restaurants</h1>
          <p className="page-subtitle">Discover amazing food near you</p>
        </div>
        {userCity && (
          <div style={{ background: 'rgba(255,107,53,0.15)', color: 'var(--primary)', padding: '8px 16px', borderRadius: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📍</span>
            <span>Showing restaurants in {userCity}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 28, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="search-bar" style={{ flex: '1 1 200px', minWidth: 200 }}>
          <span>🔍</span>
          <input placeholder="Search restaurants..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchRestaurants()} />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <select className="input" value={cuisine} onChange={e => setCuisine(e.target.value)}>
            <option value="">All Cuisines</option>
            {CUISINES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <select className="input" value={minRating} onChange={e => setMinRating(e.target.value)}>
            <option value="">Any Rating</option>
            <option value="4.5">4.5+ ⭐</option>
            <option value="4">4.0+ ⭐</option>
            <option value="3.5">3.5+ ⭐</option>
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchRestaurants}>Apply</button>
        <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setCuisine(''); setMinRating(''); setTimeout(fetchRestaurants, 0); }}>Reset</button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="grid-3">
          {restaurants.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon">🏪</div>
              <h3>No restaurants found</h3>
              <p>Try different filters</p>
            </div>
          ) : restaurants.map((r, i) => {
            const rating = safeRating(r.avg_rating);
            return (
              <motion.div key={r.restaurant_id} className="card" style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/customer/restaurants/${r.restaurant_id}`)}>
                <div style={{ height: 140, background: `linear-gradient(135deg, hsl(${(r.restaurant_id * 53) % 360},60%,25%), hsl(${(r.restaurant_id * 53 + 60) % 360},50%,15%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem' }}>
                  {getEmoji(r.cuisine_type)}
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{r.name}</h3>
                    <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '3px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700 }}>
                      ⭐ {rating || 'New'}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(240,240,248,0.5)', fontSize: '0.83rem', marginBottom: 10 }}>{r.cuisine_type} • {r.city}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(240,240,248,0.4)' }}>
                    <span>Min. ₹{r.minimum_order_amount}</span>
                    <span>{r.total_reviews || 0} reviews</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
