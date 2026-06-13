import { AfterViewInit, Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { ApiService } from '../../core/services/api.service';
import {
  POSICAO_FROTA_STATUS,
  StatusType,
  TrackingPosition,
  TrackingStatus,
  TrackingSyncResult,
  TrackingTrip,
} from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';

type TrackingFilter = 'todos' | 'online' | 'atrasados' | 'sem-posicao';
const KNOWN_STATUSES = new Set<string>(POSICAO_FROTA_STATUS);

@Component({
  selector: 'app-rastreamento',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusPillComponent],
  templateUrl: './rastreamento.component.html',
  styleUrls: ['./rastreamento.component.scss'],
})
export class RastreamentoComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  private map: L.Map | null = null;
  private readonly markers = new Map<number, L.Marker>();
  private trailLayers: L.Polyline[] = [];
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  readonly trips = signal<TrackingTrip[]>([]);
  readonly status = signal<TrackingStatus | null>(null);
  readonly lastSync = signal<TrackingSyncResult | null>(null);
  readonly selectedTripId = signal<number | null>(null);
  readonly query = signal('');
  readonly filter = signal<TrackingFilter>('todos');
  readonly loading = signal(false);
  readonly syncing = signal(false);
  readonly error = signal<string | null>(null);
  readonly panelCollapsed = signal(false);

  readonly filteredTrips = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.filter();

    return this.trips().filter((trip) => {
      const matchesQuery = !query || [
        trip.tripCode,
        trip.driverName,
        trip.horsePlate,
        trip.trailerPlate ?? '',
        trip.originLabel,
        trip.destinationLabel,
        trip.status,
      ].join(' ').toLowerCase().includes(query);

      if (!matchesQuery) {
        return false;
      }

      if (filter === 'online') {
        return !trip.missingPosition && !trip.stale;
      }
      if (filter === 'atrasados') {
        return trip.stale;
      }
      if (filter === 'sem-posicao') {
        return trip.missingPosition;
      }

      return true;
    });
  });

  readonly selectedTrip = computed(() => {
    const selectedId = this.selectedTripId();
    return this.trips().find((trip) => trip.tripId === selectedId)
      ?? this.filteredTrips()[0]
      ?? null;
  });

  readonly kpis = computed(() => {
    const trips = this.trips();
    const online = trips.filter((trip) => !trip.missingPosition && !trip.stale).length;
    const stale = trips.filter((trip) => trip.stale).length;
    const missing = trips.filter((trip) => trip.missingPosition).length;
    const speeds = trips
      .map((trip) => trip.latestPosition?.speed)
      .filter((speed): speed is number => typeof speed === 'number');

    return {
      total: trips.length,
      online,
      stale,
      missing,
      averageSpeed: speeds.length
        ? Math.round(speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length)
        : 0,
    };
  });

  constructor() {
    effect(() => {
      this.filteredTrips();
      this.selectedTripId();
      queueMicrotask(() => this.renderMap());
    });
  }

  ngOnInit(): void {
    void this.load();
    this.refreshTimer = setInterval(() => void this.load(false), 120000);
  }

  ngAfterViewInit(): void {
    // controls live at the bottom-left so the floating chips/panel stay clear
    this.map = L.map('tracking-map', {
      zoomControl: false,
      attributionControl: false,
    }).setView([-15.78, -47.93], 4);

    L.control.zoom({ position: 'bottomleft' }).addTo(this.map);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(this.map);

    this.renderMap();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.map?.remove();
    this.map = null;
  }

  async load(showSpinner = true): Promise<void> {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.error.set(null);

    try {
      const [status, trips] = await Promise.all([
        this.api.getTrackingStatus(),
        this.api.getTrackingActiveTrips(),
      ]);
      this.status.set(status);
      this.lastSync.set(status.lastSync);
      this.trips.set(trips);
    } catch (error: any) {
      this.error.set(error?.message ?? 'Falha ao carregar rastreamento');
    } finally {
      if (showSpinner) {
        this.loading.set(false);
      }
    }
  }

  async syncNow(): Promise<void> {
    this.syncing.set(true);
    this.error.set(null);

    try {
      const result = await this.api.syncTracking();
      this.lastSync.set(result);
      await this.load(false);
    } catch (error: any) {
      this.error.set(error?.message ?? 'Falha ao sincronizar Sascar');
    } finally {
      this.syncing.set(false);
    }
  }

  selectTrip(trip: TrackingTrip): void {
    this.selectedTripId.set(trip.tripId);
    const position = trip.latestPosition;
    if (position && this.map) {
      this.map.flyTo([position.latitude, position.longitude], Math.max(this.map.getZoom(), 12), {
        duration: 0.5,
      });
    }
  }

  isSelected(trip: TrackingTrip): boolean {
    return this.selectedTrip()?.tripId === trip.tripId;
  }

  toggleFilter(value: TrackingFilter): void {
    this.filter.set(this.filter() === value ? 'todos' : value);
  }

  togglePanel(): void {
    this.panelCollapsed.set(!this.panelCollapsed());
  }

  syncTitle(): string {
    const s = this.status();
    if (!s) return 'Sem dados de sincronização';
    return `Última sync: ${this.formatDateTime(s.lastSync?.finishedAt ?? null)} | ${s.lastSync?.received ?? 0} posições`;
  }

  syncDotClass(): Record<string, boolean> {
    const s = this.status();
    return {
      'is-active': !!s?.enabled,
      'is-inactive': !s?.enabled,
    };
  }

  clearFilters(): void {
    this.query.set('');
    this.filter.set('todos');
  }

  healthLabel(trip: TrackingTrip): string {
    if (trip.missingPosition) return 'Sem posição';
    if (trip.stale) return 'Atrasado';
    return 'Online';
  }

  healthClass(trip: TrackingTrip): string {
    if (trip.missingPosition) return 'is-missing';
    if (trip.stale) return 'is-stale';
    return 'is-online';
  }

  formatDateTime(value?: string | null): string {
    if (!value) {
      return '-';
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  ageLabel(value?: string | null): string {
    if (!value) {
      return '-';
    }

    const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  }

  locationLabel(position?: TrackingPosition | null): string {
    if (!position) {
      return 'Sem posição recebida';
    }

    const cityState = [position.city, position.state].filter(Boolean).join(' - ');
    return cityState || `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`;
  }

  statusForPill(status: string): StatusType {
    return KNOWN_STATUSES.has(status) ? status as StatusType : 'Vazio';
  }

  private renderMap(): void {
    if (!this.map) {
      return;
    }

    this.markers.forEach((marker) => marker.remove());
    this.markers.clear();
    this.trailLayers.forEach((layer) => layer.remove());
    this.trailLayers = [];

    const bounds = L.latLngBounds([]);
    const selectedId = this.selectedTrip()?.tripId ?? null;

    for (const trip of this.filteredTrips()) {
      if (trip.trail.length > 1) {
        const points = trip.trail.map((point) => L.latLng(point.latitude, point.longitude));
        const layer = L.polyline(points, {
          color: trip.tripId === selectedId ? '#085eac' : '#7895b2',
          weight: trip.tripId === selectedId ? 4 : 2,
          opacity: trip.tripId === selectedId ? 0.8 : 0.35,
        }).addTo(this.map);
        this.trailLayers.push(layer);
        points.forEach((point) => bounds.extend(point));
      }

      const position = trip.latestPosition;
      if (!position) {
        continue;
      }

      const point = L.latLng(position.latitude, position.longitude);
      const marker = L.marker(point, {
        icon: this.markerIcon(trip),
        title: `${trip.tripCode} - ${trip.horsePlate}`,
      }).addTo(this.map);

      marker.bindTooltip(`${trip.tripCode} | ${trip.horsePlate}`, {
        direction: 'top',
        offset: [0, -16],
      });
      marker.on('click', () => this.selectTrip(trip));
      this.markers.set(trip.tripId, marker);
      bounds.extend(point);
    }

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    } else {
      this.map.setView([-15.78, -47.93], 4);
    }
  }

  private markerIcon(trip: TrackingTrip): L.DivIcon {
    const selected = this.selectedTrip()?.tripId === trip.tripId ? ' is-selected' : '';
    return L.divIcon({
      className: 'tracking-marker-wrapper',
      html: `<div class="tracking-marker ${this.healthClass(trip)}${selected}">
        <span>${this.escapeHtml(trip.horsePlate)}</span>
      </div>`,
      iconSize: [72, 34],
      iconAnchor: [36, 17],
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
