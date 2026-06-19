import { Injectable } from '@angular/core';
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

export interface AuthenticatedUserResponse {
  username: string;
  role: UserRole;
}

export interface UserApiResponse {
  id: number;
  username: string;
  role: UserRole;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE_URL = '/api';

  private async request<T>(
    endpoint: string,
    method: string,
    body: any = null
  ): Promise<T> {
    const url = `${this.BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
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
        let errorDetail = this.defaultErrorMessage(response.status, response.statusText);

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => null);

          const parsedError = this.errorDetailFromJson(errorData);
          if (parsedError) {
            errorDetail = parsedError;
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
      if (e instanceof TypeError && String(e.message || '').toLowerCase().includes('fetch')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando em http://localhost:8080 e tente novamente.');
      }
      throw e;
    }
  }

  private errorDetailFromJson(errorData: any): string {
    if (!errorData) return '';

    if (typeof errorData?.message === 'string' && errorData.message.trim()) {
      const validation = this.validationErrorsText(errorData.errors);
      return validation ? `${errorData.message.trim()}: ${validation}` : errorData.message.trim();
    }

    const validation = this.validationErrorsText(errorData.errors);
    if (validation) return validation;

    if (typeof errorData?.error === 'string' && errorData.error.trim()) {
      return errorData.error.trim();
    }

    return '';
  }

  private validationErrorsText(errors: any): string {
    if (!errors || typeof errors !== 'object') return '';

    return Object.entries(errors)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('; ');
  }

  private defaultErrorMessage(status: number, statusText: string): string {
    if (status === 0) return 'Não foi possível conectar ao servidor.';
    if (status === 400) return 'A solicitação possui dados inválidos.';
    if (status === 401) return 'Sua sessão expirou. Faça login novamente.';
    if (status === 403) return 'Você não tem permissão para executar esta ação.';
    if (status === 404) return 'Registro não encontrado.';
    if (status >= 500) return 'Erro interno no servidor. Tente novamente em instantes.';
    return statusText?.trim() || `Erro HTTP ${status}`;
  }

  async login(
    username: string,
    password: string
  ): Promise<AuthenticatedUserResponse> {
    return this.request<AuthenticatedUserResponse>(
      '/auth/login',
      'POST',
      { username, password }
    );
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('/auth/logout', 'POST');
    } catch {
      // Server may be unreachable — local logout still proceeds.
    }
  }

  async me(): Promise<AuthenticatedUserResponse | null> {
    try {
      return await this.request<AuthenticatedUserResponse>('/auth/me', 'GET');
    } catch {
      return null;
    }
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

  // --- Driver x Vehicle Assignments ---
  async getDriverVehicleAssignments(params?: { driverId?: number; vehicleId?: number }) {
    const search = new URLSearchParams();
    if (params?.driverId) search.set('driverId', String(params.driverId));
    if (params?.vehicleId) search.set('vehicleId', String(params.vehicleId));
    const query = search.toString();
    return this.request<any[]>(`/driver-vehicle-assignments${query ? `?${query}` : ''}`, 'GET');
  }

  async createDriverVehicleAssignment(data: any) {
    return this.request<any>('/driver-vehicle-assignments', 'POST', data);
  }

  async updateDriverVehicleAssignment(id: number, data: any) {
    return this.request<any>(`/driver-vehicle-assignments/${id}`, 'PUT', data);
  }

  async deleteDriverVehicleAssignment(id: number) {
    return this.request<void>(`/driver-vehicle-assignments/${id}`, 'DELETE');
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
  async getTrips(params?: { date?: string; startDate?: string; endDate?: string }) {
    const search = new URLSearchParams();
    if (params?.date) search.set('date', params.date);
    if (params?.startDate) search.set('startDate', params.startDate);
    if (params?.endDate) search.set('endDate', params.endDate);
    const query = search.toString();
    return this.request<any[]>(`/trips${query ? `?${query}` : ''}`, 'GET');
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
