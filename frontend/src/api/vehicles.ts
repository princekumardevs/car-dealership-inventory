import api from './client';

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  price: number;
  quantity: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehiclePayload {
  make: string;
  model: string;
  year: number;
  category: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface SearchParams {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}

// List all vehicles
export const getVehicles = () =>
  api.get<{ vehicles: Vehicle[] }>('/vehicles');

// Search with filters
export const searchVehicles = (params: SearchParams) =>
  api.get<{ vehicles: Vehicle[] }>('/vehicles/search', { params });

// Admin: create
export const createVehicle = (data: VehiclePayload) =>
  api.post<{ vehicle: Vehicle }>('/vehicles', data);

// Admin: update
export const updateVehicle = (id: string, data: Partial<VehiclePayload>) =>
  api.put<{ vehicle: Vehicle }>(`/vehicles/${id}`, data);

// Admin: delete
export const deleteVehicle = (id: string) =>
  api.delete(`/vehicles/${id}`);

// Purchase (any auth user)
export const purchaseVehicle = (id: string) =>
  api.post<{ vehicle: Vehicle }>(`/vehicles/${id}/purchase`);

// Admin: restock
export const restockVehicle = (id: string, quantity: number) =>
  api.post<{ vehicle: Vehicle }>(`/vehicles/${id}/restock`, { quantity });
