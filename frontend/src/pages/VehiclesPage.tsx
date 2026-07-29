import { useState, useEffect, useCallback } from 'react';
import type { Vehicle } from '../api/vehicles';
import { searchVehicles, purchaseVehicle } from '../api/vehicles';
import VehicleCard from '../components/VehicleCard';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['','sedan','suv','truck','coupe','convertible','minivan','hatchback','electric','hybrid','other'];

interface Toast { id: number; msg: string; type: 'success' | 'error' }

export default function VehiclesPage() {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Search state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const addToast = (msg: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (make)     params.make     = make;
      if (model)    params.model    = model;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await searchVehicles(params);
      setVehicles(res.data.vehicles);
    } catch {
      addToast('Failed to load vehicles.', 'error');
    } finally {
      setLoading(false);
    }
  }, [make, model, category, minPrice, maxPrice]);

  useEffect(() => { fetch(); }, [fetch]);

  const handlePurchase = async (id: string) => {
    try {
      await purchaseVehicle(id);
      addToast('Vehicle purchased successfully! 🎉', 'success');
      fetch();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      addToast(status === 409 ? 'Sorry — this vehicle is out of stock.' : 'Purchase failed.', 'error');
    }
  };

  const handleReset = () => {
    setMake(''); setModel(''); setCategory(''); setMinPrice(''); setMaxPrice('');
  };

  const hasFilters = make || model || category || minPrice || maxPrice;

  return (
    <>
      <main className="page-container">
        {/* Hero */}
        <div style={{ marginBottom: '2.5rem', paddingTop: '0.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.5rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Browse <span className="gradient-text">Inventory</span>
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '1rem' }}>
            {loading ? 'Loading…' : `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Search / Filter bar */}
        <div className="glass" style={{ borderRadius: '1.25rem', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Make</label>
              <input id="search-make" className="input-field" value={make} onChange={e => setMake(e.target.value)} placeholder="e.g. Toyota" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Model</label>
              <input id="search-model" className="input-field" value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. Camry" style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Category</label>
              <select id="search-category" className="input-field" value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <option value="" style={{ background: '#1e1e2e' }}>All categories</option>
                {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c} style={{ background: '#1e1e2e' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Min Price</label>
              <input id="search-min-price" className="input-field" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="$0" min={0} style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Max Price</label>
              <input id="search-max-price" className="input-field" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Any" min={0} style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} />
            </div>
            {hasFilters && (
              <button id="search-reset" className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', alignSelf: 'end' }} onClick={handleReset}>
                Clear ✕
              </button>
            )}
          </div>
        </div>

        {/* Vehicle grid */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: '0.75rem', color: '#64748b' }}>
            <span className="animate-spin" style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
            Loading vehicles…
          </div>
        ) : vehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h2 style={{ color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem' }}>No vehicles found</h2>
            <p style={{ fontSize: '0.9rem' }}>Try adjusting your search filters.</p>
            {hasFilters && <button className="btn-ghost" style={{ marginTop: '1rem' }} onClick={handleReset}>Clear Filters</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {vehicles.map(v => (
              <VehicleCard
                key={v._id}
                vehicle={v}
                onPurchase={isAuthenticated ? handlePurchase : undefined}
              />
            ))}
          </div>
        )}

        {/* Login prompt for unauthenticated visitors */}
        {!isAuthenticated && vehicles.length > 0 && (
          <div className="glass" style={{ borderRadius: '1.25rem', padding: '1.5rem', marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', margin: '0 0 0.75rem', fontSize: '0.95rem' }}>
              <a href="/login" style={{ color: '#a5b4fc', fontWeight: 600 }}>Sign in</a> to purchase vehicles
            </p>
          </div>
        )}
      </main>

      {/* Toasts */}
      <div aria-live="polite" style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 100 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}
