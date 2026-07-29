import { useState } from 'react';
import type { Vehicle } from '../api/vehicles';
import { useAuth } from '../context/AuthContext';

const CATEGORY_ICONS: Record<string, string> = {
  sedan: '🚗', suv: '🚙', truck: '🛻', coupe: '🏎️',
  convertible: '🚘', minivan: '🚐', hatchback: '🚗',
  electric: '⚡', hybrid: '🔋', other: '🚗',
};

interface Props {
  vehicle: Vehicle;
  onPurchase?: (id: string) => Promise<void>;
}

export default function VehicleCard({ vehicle, onPurchase }: Props) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const inStock = vehicle.quantity > 0;

  const handlePurchase = async () => {
    if (!onPurchase) return;
    setLoading(true);
    try {
      await onPurchase(vehicle._id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="vehicle-card" aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
      {/* Category icon banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
        padding: '1.75rem 1.5rem 1rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(99,102,241,0.08)',
      }}>
        <div>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem', lineHeight: 1 }}>
            {CATEGORY_ICONS[vehicle.category] ?? '🚗'}
          </div>
          <span className="badge badge-indigo">{vehicle.category}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            ${vehicle.price.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>list price</div>
        </div>
      </div>

      {/* Vehicle info */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 0.25rem', lineHeight: 1.2 }}>
          {vehicle.make} {vehicle.model}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem' }}>
          {vehicle.year}
          {vehicle.description && ` • ${vehicle.description}`}
        </p>

        {/* Stock indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span
            className={`badge ${inStock ? (vehicle.quantity < 3 ? 'badge-amber' : 'badge-green') : 'badge-red'}`}
          >
            {inStock
              ? vehicle.quantity < 3
                ? `⚠ Only ${vehicle.quantity} left`
                : `✓ ${vehicle.quantity} in stock`
              : '✕ Out of stock'}
          </span>
        </div>

        {/* Purchase button */}
        {isAuthenticated && onPurchase && (
          <button
            id={`purchase-${vehicle._id}`}
            className="btn-primary"
            style={{ width: '100%', fontSize: '0.875rem' }}
            disabled={!inStock || loading}
            onClick={handlePurchase}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Processing…
                </span>
              : inStock ? 'Purchase' : 'Out of Stock'}
          </button>
        )}
      </div>
    </article>
  );
}
