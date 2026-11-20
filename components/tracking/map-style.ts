/** Detailed light basemap. Swap the URL, or the two road colours, to restyle every map. */
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const MAJOR = '#f6b23a';
const MAJOR_EDGE = '#d9842b';

/** Trunk and motorway roads read yellow-orange, with an outline. Local streets stay as the style draws them. */
export function tuneMapStyle(map: { getStyle(): { layers?: { id: string; type: string }[] } | undefined; setPaintProperty(layer: string, prop: string, value: unknown): void }) {
  for (const layer of map.getStyle()?.layers ?? []) {
    if (layer.type !== 'line') continue;
    if (/^(road|bridge|tunnel)_(motorway|trunk_primary)$/.test(layer.id)) {
      map.setPaintProperty(layer.id, 'line-color', MAJOR);
    }
    if (/^(road|bridge|tunnel)_(motorway|trunk_primary)_casing$/.test(layer.id)) {
      map.setPaintProperty(layer.id, 'line-color', MAJOR_EDGE);
    }
  }
}
