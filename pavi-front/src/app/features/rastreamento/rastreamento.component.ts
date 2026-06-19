import { AfterViewInit, Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { ApiService } from '../../core/services/api.service';
import {
  POSICAO_FROTA_STATUS,
  StatusType,
  TrackingPosition,
  TrackingStatus,
  TrackingTrip,
} from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';

type TrackingFilter = 'todos' | 'online' | 'atrasados' | 'sem-posicao';
type TrackedMarker = L.Marker & { trkHealth?: string; trkSelected?: boolean };
const KNOWN_STATUSES = new Set<string>(POSICAO_FROTA_STATUS);
const BRAZIL_CENTER: L.LatLngExpression = [-15.78, -47.93];
const BRAZIL_VIEW_ZOOM = 4;
const BRAZIL_BOUNDS = {
  minLat: -34,
  maxLat: 6,
  minLng: -74,
  maxLng: -32,
};

@Component({
  selector: 'app-rastreamento',
  standalone: true,
  imports: [CommonModule, IconComponent, StatusPillComponent, PageTitleComponent],
  templateUrl: './rastreamento.component.html',
  styleUrls: ['./rastreamento.component.scss'],
})
export class RastreamentoComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  private map: L.Map | null = null;
  private clusterGroup: L.MarkerClusterGroup | null = null;
  private trailGroup: L.LayerGroup | null = null;
  private mapResizeObserver: ResizeObserver | null = null;
  private readonly markers = new Map<number, TrackedMarker>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  // Only fit/recenter the map on the first load, on filter changes, or on an
  // explicit "Centralizar" click — never on the 120s background refresh, so the
  // user's pan/zoom is preserved.
  private pendingFit = true;

  readonly trips = signal<TrackingTrip[]>([]);
  readonly status = signal<TrackingStatus | null>(null);
  readonly selectedTripId = signal<number | null>(null);
  readonly query = signal('');
  readonly filter = signal<TrackingFilter>('todos');
  readonly loading = signal(false);
  readonly syncing = signal(false);
  readonly error = signal<string | null>(null);

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
    this.map = L.map('tracking-map', {
      zoomControl: false,
      attributionControl: false,
    }).setView(BRAZIL_CENTER, BRAZIL_VIEW_ZOOM);

    // zoom + attribution at bottom-right so the legend stays clear (bottom-left)
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(this.map);

    this.clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      iconCreateFunction: (cluster: L.MarkerCluster) => this.clusterIcon(cluster),
    }).addTo(this.map);
    this.trailGroup = L.layerGroup().addTo(this.map);

    window.addEventListener('resize', this.onResize);
    const mapElement = document.getElementById('tracking-map');
    if (mapElement && typeof ResizeObserver !== 'undefined') {
      this.mapResizeObserver = new ResizeObserver(() => this.refreshMapSize());
      this.mapResizeObserver.observe(mapElement);
    }

    // the map lives in a grid cell that's only sized after layout settles
    setTimeout(() => {
      this.refreshMapSize();
      this.renderMap();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    window.removeEventListener('resize', this.onResize);
    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = null;
    this.map?.remove();
    this.map = null;
    this.clusterGroup = null;
    this.trailGroup = null;
    this.markers.clear();
  }

  private readonly onResize = (): void => {
    this.refreshMapSize();
  };

  async load(showSpinner = true): Promise<void> {
    if (showSpinner) {
      this.loading.set(true);
    }
    // manual/first load re-frames the fleet; background refresh keeps the view
    this.pendingFit = showSpinner;
    this.error.set(null);

    try {
      const [status, trips] = await Promise.all([
        this.api.getTrackingStatus(),
        this.api.getTrackingActiveTrips(),
      ]);
      this.status.set(status);
      this.trips.set(trips);
      this.refreshMapSize();
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
      await this.api.syncTracking();
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

  setQuery(value: string): void {
    this.pendingFit = true;
    this.query.set(value);
  }

  setFilter(value: TrackingFilter): void {
    this.pendingFit = true;
    this.filter.set(value);
  }

  clearFilters(): void {
    this.pendingFit = true;
    this.query.set('');
    this.filter.set('todos');
  }

  recenter(): void {
    this.pendingFit = true;
    this.renderMap();
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
    if (!this.map || !this.clusterGroup || !this.trailGroup) {
      return;
    }

    this.map.invalidateSize({ pan: false });
    const trips = this.filteredTrips();
    const selectedId = this.selectedTrip()?.tripId ?? null;
    const fitBounds = L.latLngBounds([]);
    const seen = new Set<number>();
    const added: L.Marker[] = [];
    let clustersDirty = false;

    // trails are plain polylines (not clustered) and restyle on selection — rebuild
    this.trailGroup.clearLayers();

    for (const trip of trips) {
      if (trip.trail.length > 1) {
        const points = trip.trail.map((point) => L.latLng(point.latitude, point.longitude));
        L.polyline(points, {
          color: trip.tripId === selectedId ? '#085eac' : '#7895b2',
          weight: trip.tripId === selectedId ? 4 : 2,
          opacity: trip.tripId === selectedId ? 0.8 : 0.35,
        }).addTo(this.trailGroup);
      }

      const position = trip.latestPosition;
      if (!position) {
        continue;
      }

      seen.add(trip.tripId);
      const point = L.latLng(position.latitude, position.longitude);
      if (this.isFleetPoint(position)) {
        fitBounds.extend(point);
      }

      const health = this.healthClass(trip);
      const isSelected = trip.tripId === selectedId;
      const existing = this.markers.get(trip.tripId);

      if (existing) {
        // update markers in place — clearing/rebuilding the cluster group on
        // every render (incl. each selection) would flicker and re-cluster all
        if (!existing.getLatLng().equals(point)) {
          existing.setLatLng(point);
          clustersDirty = true;
        }
        if (existing.trkHealth !== health || existing.trkSelected !== isSelected) {
          existing.setIcon(this.markerIcon(trip));
          existing.trkHealth = health;
          existing.trkSelected = isSelected;
        }
        existing.setZIndexOffset(isSelected ? 1000 : 0);
      } else {
        const tripId = trip.tripId;
        const marker = L.marker(point, {
          icon: this.markerIcon(trip),
          title: `${trip.tripCode} - ${trip.horsePlate}`,
          zIndexOffset: isSelected ? 1000 : 0,
        }) as TrackedMarker;
        marker.trkHealth = health;
        marker.trkSelected = isSelected;
        marker.bindTooltip(`${trip.tripCode} | ${trip.horsePlate}`, {
          direction: 'top',
          offset: [0, -16],
        });
        // look the trip up fresh on click so flyTo uses the latest position
        marker.on('click', () => {
          const current = this.trips().find((t) => t.tripId === tripId);
          if (current) {
            this.selectTrip(current);
          }
        });
        this.markers.set(tripId, marker);
        added.push(marker);
      }
    }

    // drop markers for trips no longer shown
    for (const [tripId, marker] of this.markers) {
      if (!seen.has(tripId)) {
        this.clusterGroup.removeLayer(marker);
        this.markers.delete(tripId);
        clustersDirty = true;
      }
    }

    if (added.length) {
      this.clusterGroup.addLayers(added);
    }
    if (clustersDirty) {
      this.clusterGroup.refreshClusters();
    }

    if (this.pendingFit) {
      this.fitFleetView(fitBounds);
      this.pendingFit = false;
    }
  }

  private fitFleetView(bounds: L.LatLngBounds): void {
    this.refreshMapSize();

    requestAnimationFrame(() => {
      if (!this.map) {
        return;
      }

      this.map.invalidateSize({ pan: false });

      if (!bounds.isValid()) {
        this.map.setView(BRAZIL_CENTER, BRAZIL_VIEW_ZOOM, { animate: false });
        return;
      }

      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        this.map.setView(bounds.getCenter(), 10, { animate: false });
        return;
      }

      this.map.fitBounds(bounds, {
        paddingTopLeft: [36, 32],
        paddingBottomRight: [36, 32],
        maxZoom: 11,
        animate: false,
      });
    });
  }

  private refreshMapSize(): void {
    if (!this.map) {
      return;
    }

    requestAnimationFrame(() => {
      this.map?.invalidateSize({ pan: false });
      requestAnimationFrame(() => this.map?.invalidateSize({ pan: false }));
    });
  }

  private isFleetPoint(position: TrackingPosition): boolean {
    return Number.isFinite(position.latitude)
      && Number.isFinite(position.longitude)
      && position.latitude >= BRAZIL_BOUNDS.minLat
      && position.latitude <= BRAZIL_BOUNDS.maxLat
      && position.longitude >= BRAZIL_BOUNDS.minLng
      && position.longitude <= BRAZIL_BOUNDS.maxLng;
  }

  private clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
    // only online/stale markers are plotted (missing-position trips have no
    // coordinates), so a cluster is "stale" if any child is stale
    const hasStale = cluster
      .getAllChildMarkers()
      .some((marker: L.Marker) => (marker as TrackedMarker).trkHealth === 'is-stale');
    const cls = hasStale ? 'is-stale' : 'is-online';

    return L.divIcon({
      className: 'trk-cluster-wrapper',
      html: `<div class="trk-cluster ${cls}">${cluster.getChildCount()}</div>`,
      iconSize: [42, 42],
    });
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
