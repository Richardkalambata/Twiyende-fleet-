import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoJSON } from 'geojson';
import type { LngLatBounds } from 'maplibre-gl';
import { LUSAKA_BOUNDS } from '@/lib/tracking-math';

import type { RasterTrackingMap } from './map-renderer';

const styles: Record<string, L.PathOptions> = {
  'bus-trails': { color: '#1f5bff', weight: 4, opacity: 0.4 },
  'route-line': { color: '#1f5bff', weight: 5, opacity: 0.6 },
  'you-line': { color: '#416ce3', weight: 2, dashArray: '4 5' },
  'stop-dots': { color: '#fff', weight: 2, fillColor: '#0b1b3b', fillOpacity: 1 },
  'accuracy-halo': { color: '#1f5bff', weight: 1, fillOpacity: 0.14 },
  'you-halo': { color: '#1a73e8', weight: 1, fillOpacity: 0.14 },
};

export function rasterTrackingMap(node: HTMLElement, rider: boolean, onDrag: () => void): RasterTrackingMap {
  const map = L.map(node, {
    zoomControl: !rider,
    maxBounds: rider ? [[LUSAKA_BOUNDS.south, LUSAKA_BOUNDS.west], [LUSAKA_BOUNDS.north, LUSAKA_BOUNDS.east]] : undefined,
    zoomSnap: 0.5,
    maxZoom: 19,
  }).setView([-15.414, 28.29], 15.5);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);
  map.on('dragstart', onDrag);
  const sources = new Map(Object.entries(styles).map(([name, style]) => {
    const layer = L.geoJSON(undefined, {
      style,
      interactive: false,
      pointToLayer: (_feature, point) => L.circleMarker(point, { ...style, radius: 4 }),
    }).addTo(map);
    return [name, { setData: (data: GeoJSON) => {
      layer.clearLayers();
      if (data.type === 'Feature' && data.geometry?.type === 'LineString' && data.geometry.coordinates.length < 2) return;
      layer.addData(data);
    } }];
  }));

  const leafletBounds = (bounds: LngLatBounds) => L.latLngBounds(
    [bounds.getSouth(), bounds.getWest()],
    [bounds.getNorth(), bounds.getEast()],
  );

  return {
    camera: {
      getBearing: () => 0,
      getContainer: () => node,
      getZoom: () => map.getZoom(),
      cameraForBounds: (bounds, { padding, maxZoom = 16 }) => ({
        zoom: Math.min(maxZoom, map.getBoundsZoom(leafletBounds(bounds), false, L.point(padding.left + padding.right, padding.top + padding.bottom))),
      }),
      fitBounds: (bounds, { padding, maxZoom, duration }) => map.fitBounds(leafletBounds(bounds), {
        paddingTopLeft: [padding.left, padding.top],
        paddingBottomRight: [padding.right, padding.bottom],
        maxZoom,
        animate: duration > 0,
      }),
      easeTo: ({ zoom, duration }) => map.setZoom(zoom, { animate: duration > 0 }),
      jumpTo: ({ center: [lng, lat], padding }) => {
        const zoom = map.getZoom();
        const center = map.project([lat, lng], zoom);
        const offset = L.point((padding.right - padding.left) / 2, (padding.bottom - padding.top) / 2);
        const target = map.unproject(center.add(offset), zoom);
        if (map.latLngToContainerPoint(target).distanceTo(map.latLngToContainerPoint(map.getCenter())) > 0.75) {
          map.panTo(target, { animate: false });
        }
      },
      remove: () => map.remove(),
    },
    marker: (element, anchor, [lng, lat]) => {
      const icon = L.divIcon({
        className: 'twende-raster-marker',
        html: element,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      element.classList.add('twende-raster-pin', `twende-anchor-${anchor}`);
      const marker = L.marker([lat, lng], { icon, keyboard: false, interactive: false }).addTo(map);
      return {
        setLngLat: ([nextLng, nextLat]) => marker.setLatLng([nextLat, nextLng]),
        getLngLat: () => marker.getLatLng(),
        getElement: () => element,
        remove: () => marker.remove(),
      };
    },
    source: (name) => sources.get(name),
  };
}
