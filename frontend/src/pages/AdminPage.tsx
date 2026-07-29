import { useState, useEffect, useCallback } from 'react';
import type { Vehicle, VehiclePayload } from '../api/vehicles';
import {
  getVehicles, createVehicle, updateVehicle, deleteVehicle, restockVehicle,
} from '../api/vehicles';
import VehicleForm from '../components/VehicleForm';

interface Toast { id: number; msg: string; type: 'success' | 'error' }
interface RestockState { vehicleId: string; vehicleName: string; amount: string }

export default function AdminPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);
  const [restock, setRestock] = useState<RestockState | null>(null);
  const [restockLoading, setRestockLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addToast = (msg: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVehicles();
      setVehicles(res.data.vehicles);
    } catch {
      addToast('Failed to load vehicles.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: VehiclePayload) => {
    await createVehicle(data);
    addToast('Vehicle added successfully! ✓', 'success');
    setShowForm(false);
    load();
  };

  const handleUpdate = async (data: VehiclePayload) => {
    if (!editTarget) return;
    await updateVehicle(editTarget._id, data);
    addToast('Vehicle updated successfully! ✓', 'success');
    setEditTarget(null);
    load();
  };

  const handleDelete = async (v: Vehicle) => {
    if (!confirm(`Delete ${v.year} ${v.make} ${v.model}? This cannot be undone.`)) return;
    setDeletingId(v._id);
    try {
      await deleteVehicle(v._id);
      addToast('Vehicle deleted.', 'success');
      load();
    } catch {
      addToast('Delete failed.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestock = async () => {
    if (!restock) return;
    const amount = parseInt(restock.amount, 10);
    if (!amount || amount <= 0) { addToast('Enter a valid positive quantity.', 'error'); return; }
    setRestockLoading(true);
    try {
      await restockVehicle(restock.vehicleId, amount);
      addToast(`Restocked ${restock.vehicleName} with ${amount} unit${amount > 1 ? 's' : ''}.`, 'success');
      setRestock(null);
      load();
    } catch {
      addToast('Restock failed.', 'error');
    } finally {
      setRestockLoading(false);
    }
  };

  const stats = {
    total: vehicles.length,
    inStock: vehicles.filter(v => v.quantity > 0).length,
    outOfStock: vehicles.filter(v => v.quantity === 0).length,
    totalValue: vehicles.reduce((sum, v) => sum + v.price * v.quantity, 0),
  };

  return (
    <>
      <main className="page-container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Manage vehicle inventory</p>
          </div>
          <button id="admin-add-vehicle" className="btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
            + Add Vehicle
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Listings', value: stats.total, color: '#6366f1' },
            { label: 'In Stock',       value: stats.inStock, color: '#10b981' },
            { label: 'Out of Stock',   value: stats.outOfStock, color: '#ef4444' },
            { label: 'Inventory Value', value: `$${stats.totalValue.toLocaleString()}`, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="vehicle-card" style={{ padding: '1.25rem', borderRadius: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, marginBottom: '0.25rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="vehicle-card" style={{ borderRadius: '1.25rem', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              Vehicle Inventory
            </h2>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: '0.75rem', color: '#64748b' }}>
              <span className="animate-spin" style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
              Loading…
            </div>
          ) : vehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🚗</div>
              <p>No vehicles in inventory. Add one to get started.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Year</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{v.make} {v.model}</div>
                        {v.description && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>{v.description}</div>}
                      </td>
                      <td>{v.year}</td>
                      <td><span className="badge badge-indigo">{v.category}</span></td>
                      <td style={{ fontWeight: 600, color: '#a5b4fc' }}>${v.price.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${v.quantity === 0 ? 'badge-red' : v.quantity < 3 ? 'badge-amber' : 'badge-green'}`}>
                          {v.quantity}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            id={`restock-${v._id}`}
                            className="btn-success"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                            onClick={() => setRestock({ vehicleId: v._id, vehicleName: `${v.make} ${v.model}`, amount: '' })}
                          >
                            Restock
                          </button>
                          <button
                            id={`edit-${v._id}`}
                            className="btn-ghost"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                            onClick={() => { setEditTarget(v); setShowForm(true); }}
                          >
                            Edit
                          </button>
                          <button
                            id={`delete-${v._id}`}
                            className="btn-danger"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                            disabled={deletingId === v._id}
                            onClick={() => handleDelete(v)}
                          >
                            {deletingId === v._id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Vehicle add/edit modal */}
      {showForm && (
        <VehicleForm
          initial={editTarget}
          onSubmit={editTarget ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}

      {/* Restock modal */}
      {restock && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Restock Vehicle">
          <div className="modal-box" style={{ maxWidth: 360 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>
              Restock Vehicle
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Add units to <strong style={{ color: '#a5b4fc' }}>{restock.vehicleName}</strong>
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="restock-qty" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quantity to Add
              </label>
              <input
                id="restock-qty"
                className="input-field"
                type="number"
                min={1}
                value={restock.amount}
                onChange={e => setRestock(r => r ? { ...r, amount: e.target.value } : null)}
                placeholder="e.g. 10"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setRestock(null)} id="restock-cancel">Cancel</button>
              <button className="btn-success" style={{ flex: 2 }} onClick={handleRestock} disabled={restockLoading} id="restock-submit">
                {restockLoading ? 'Restocking…' : 'Confirm Restock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div aria-live="polite" style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 100 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}
