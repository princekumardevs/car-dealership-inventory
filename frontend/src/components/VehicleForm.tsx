import { useState, useEffect } from 'react';
import type { Vehicle, VehiclePayload } from '../api/vehicles';

const CATEGORIES = ['sedan','suv','truck','coupe','convertible','minivan','hatchback','electric','hybrid','other'];

interface Props {
  initial?: Vehicle | null;
  onSubmit: (data: VehiclePayload) => Promise<void>;
  onCancel: () => void;
}

const empty: VehiclePayload = {
  make: '', model: '', year: new Date().getFullYear(),
  category: 'sedan', price: 0, quantity: 0, description: '',
};

export default function VehicleForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<VehiclePayload>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!initial;

  useEffect(() => {
    if (initial) {
      setForm({
        make: initial.make, model: initial.model, year: initial.year,
        category: initial.category, price: initial.price,
        quantity: initial.quantity, description: initial.description ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [initial]);

  const set = (k: keyof VehiclePayload, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}>
      <div className="modal-box">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.5rem' }}>
          {isEdit ? '✏️ Edit Vehicle' : '➕ Add New Vehicle'}
        </h2>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem',
            color: '#fca5a5', fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form id="vehicle-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Make *</label>
              <input id="field-make" className="input-field" value={form.make} required onChange={e => set('make', e.target.value)} placeholder="e.g. Toyota" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model *</label>
              <input id="field-model" className="input-field" value={form.model} required onChange={e => set('model', e.target.value)} placeholder="e.g. Camry" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year *</label>
              <input id="field-year" className="input-field" type="number" value={form.year} required min={1900} max={2100} onChange={e => set('year', parseInt(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category *</label>
              <select id="field-category" className="input-field" value={form.category} onChange={e => set('category', e.target.value)} style={{ cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1e1e2e' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price ($) *</label>
              <input id="field-price" className="input-field" type="number" value={form.price} required min={0} onChange={e => set('price', parseFloat(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity *</label>
              <input id="field-quantity" className="input-field" type="number" value={form.quantity} required min={0} onChange={e => set('quantity', parseInt(e.target.value))} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
            <textarea id="field-description" className="input-field" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional vehicle description…" rows={2} style={{ resize: 'vertical', minHeight: '60px' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onCancel} id="form-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading} id="form-submit">
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
