import type { GeoJSON } from 'geojson';
import type { LngLatBounds, Map as VectorMap } from 'maplibre-gl';

export type MapMarker = {
  setLngLat: (point: [number, number]) => unknown;
  getLngLat: () => { lng: number; lat: number };
  getElement: () => HTMLElement;
  remove: () => unknown;
};

export type MapSource = { setData: (data: GeoJSON) => unknown };
type Camera = Pick<VectorMap, 'getBearing' | 'getContainer' | 'getZoom' | 'cameraForBounds' | 'fitBounds' | 'easeTo' | 'jumpTo' | 'remove'>;

export type TrackingMap = {
  camera: Camera;
  marker: (element: HTMLElement, anchor: 'center' | 'bottom', point: [number, number]) => MapMarker;
  source: (name: string) => MapSource | undefined;
};

export function vectorTrackingMap(map: VectorMap, Marker: typeof import('maplibre-gl').Marker): TrackingMap {
  return {
    camera: map,
    marker: (element, anchor, point) => new Marker({ element, anchor }).setLngLat(point).addTo(map),
    source: (name) => map.getSource<import('maplibre-gl').GeoJSONSource>(name),
  };
}

type RasterCamera = {
  getBearing: () => number;
  getContainer: () => HTMLElement;
  getZoom: () => number;
  cameraForBounds: (bounds: LngLatBounds, options: { maxZoom?: number; padding: Padding }) => { zoom: number };
  fitBounds: (bounds: LngLatBounds, options: { maxZoom?: number; padding: Padding; duration: number }) => unknown;
  easeTo: (options: { zoom: number; duration: number }) => unknown;
  jumpTo: (options: { center: [number, number]; padding: Padding }) => unknown;
  remove: () => unknown;
};

type Padding = { top: number; bottom: number; left: number; right: number };
export type TrackingCamera = Camera | RasterCamera;

export type RasterTrackingMap = Omit<TrackingMap, 'camera'> & { camera: RasterCamera };

