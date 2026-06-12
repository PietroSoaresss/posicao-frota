import { Injectable, signal } from '@angular/core';
import {
  CreateUserRequest,
  TrackingStatus,
  TrackingSyncResult,
  TrackingTrip,
  UpdateUserRequest,
  UserRole,
} from '../models/models';

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

//teste git

export interface AuthTokens {
  token: string;
  username: string;
  role: UserRole;
}

export interface UserApiResponse {
  id: number;
  username: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE_URL = '/api';

  token = signal<string | null>(null);

  setToken(token: string | null): void {
    this.token.set(token);
  }

  clearToken(): void {
    this.token.set(null);
  }

  private async request<T>(
    endpoint: string,
    method: string,
    body: any = null
  ): Promise<T> {
    const url = `${this.BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.token();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const contentType = response.headers.get('content-type');

      let data: any = null;

      if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        return data;
      } else {
        let errorDetail = 'Unknown Error';

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => null);

          if (
            typeof errorData?.message === 'string' &&
            errorData.message.trim()
          ) {
            errorDetail = errorData.message.trim();
          } else if (
            typeof errorData === 'string' &&
            errorData.trim()
          ) {
            errorDetail = errorData.trim();
          }
        } else {
          const errorText = await response.text();

          if (errorText.trim()) {
            errorDetail = errorText.trim();
          }
        }

        throw new Error(`HTTP ${response.status}: ${errorDetail}`);
      }
    } catch (e: any) {
      throw e;
    }
  }

  async login(
    username: string,
    password: string
  ): Promise<AuthTokens> {
    const res = await this.request<AuthTokens>(
      '/auth/login',
      'POST',
      { username, password }
    );

    this.setToken(res.token);

    return res;
  }

  async getCities(stateId?: number) {
    const ep = stateId
      ? `/cities?stateId=${stateId}`
      : '/cities';

    return this.request<any[]>(ep, 'GET');
  }

  async getStates() {
    return this.request<any[]>('/states', 'GET');
  }

  // --- Companies ---
  async getCompanies() {
    return this.request<any[]>('/companies', 'GET');
  }

  async createCompany(data: any) {
    return this.request<any>('/companies', 'POST', data);
  }

  async updateCompany(id: number, data: any) {
    return this.request<any>(`/companies/${id}`, 'PUT', data);
  }

  async deleteCompany(id: number) {
    return this.request<void>(`/companies/${id}`, 'DELETE');
  }

  // --- Drivers ---
  async getDrivers() {
    return this.request<any[]>('/drivers', 'GET');
  }

  async createDriver(data: any) {
    return this.request<any>('/drivers', 'POST', data);
  }

  async updateDriver(id: number, data: any) {
    return this.request<any>(`/drivers/${id}`, 'PUT', data);
  }

  async deleteDriver(id: number) {
    return this.request<void>(`/drivers/${id}`, 'DELETE');
  }

  // --- Vehicles ---
  async getVehicles() {
    return this.request<any[]>('/vehicles', 'GET');
  }

  async createVehicle(data: any) {
    return this.request<any>('/vehicles', 'POST', data);
  }

  async updateVehicle(id: number, data: any) {
    return this.request<any>(`/vehicles/${id}`, 'PUT', data);
  }

  async deleteVehicle(id: number) {
    return this.request<void>(`/vehicles/${id}`, 'DELETE');
  }

  // --- Manufacturers ---
  async getManufacturers() {
    return this.request<any[]>('/manufacturers', 'GET');
  }

  // --- Vehicle Models ---
  async getVehicleModels() {
    return this.request<any[]>('/vehicle-models', 'GET');
  }

  // --- Trips ---
  async getTrips() {
    return this.request<any[]>('/trips', 'GET');
  }

  async createTrip(data: any) {
    return this.request<any>('/trips', 'POST', data);
  }

  async updateTrip(id: number, data: any) {
    return this.request<any>(`/trips/${id}`, 'PUT', data);
  }

  async deleteTrip(id: number) {
    return this.request<void>(`/trips/${id}`, 'DELETE');
  }

  // --- Deliveries ---
  async getDeliveries() {
    return this.request<any[]>('/deliveries', 'GET');
  }

  async getDeliveriesByTrip(tripId: number) {
    return this.request<any[]>(
      `/deliveries?tripId=${tripId}`,
      'GET'
    );
  }

  async createDelivery(data: any) {
    return this.request<any>('/deliveries', 'POST', data);
  }

  async updateDelivery(id: number, data: any) {
    return this.request<any>(`/deliveries/${id}`, 'PUT', data);
  }

  async deleteDelivery(id: number) {
    return this.request<void>(`/deliveries/${id}`, 'DELETE');
  }

  // --- Tracking ---
  async getTrackingActiveTrips() {
    return this.request<TrackingTrip[]>('/tracking/active-trips', 'GET');
  }

  async getTrackingStatus() {
    return this.request<TrackingStatus>('/tracking/status', 'GET');
  }

  async syncTracking() {
    return this.request<TrackingSyncResult>('/tracking/sync', 'POST');
  }

  // --- Users ---
  async getUsers() {
    return this.request<UserApiResponse[]>('/users', 'GET');
  }

  async createUser(data: CreateUserRequest) {
    return this.request<UserApiResponse>(
      '/users',
      'POST',
      data
    );
  }

  async updateUser(
    id: number,
    data: UpdateUserRequest
  ) {
    return this.request<UserApiResponse>(
      `/users/${id}`,
      'PUT',
      data
    );
  }

  async deleteUser(id: number) {
    return this.request<void>(`/users/${id}`, 'DELETE');
  }
}
