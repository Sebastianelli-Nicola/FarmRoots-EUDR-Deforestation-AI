import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Lot } from '../../types/lot'

const RISK_COLORS: Record<string, string> = {
  green: '#16a34a',
  amber: '#d97706',
  red:   '#dc2626',
}

const COLOR_EXPR: maplibregl.ExpressionSpecification = [
  'match', ['get', 'riskLevel'],
  'green', RISK_COLORS.green,
  'amber', RISK_COLORS.amber,
  'red',   RISK_COLORS.red,
  '#6b7280',
]

// Zoom level at which clustering stops and polygons appear
const CLUSTER_ZOOM = 7

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
}

function polygonCentroid(coordinates: number[][][]): [number, number] {
  const ring = coordinates[0]
  const n = ring.length - 1 // exclude closing duplicate point
  let sumLng = 0
  let sumLat = 0
  for (let i = 0; i < n; i++) {
    sumLng += ring[i][0]
    sumLat += ring[i][1]
  }
  return [sumLng / n, sumLat / n]
}

interface LotMapProps {
  lots: Lot[]
  center?: [number, number]
  zoom?: number
  height?: number | string
}

export default function LotMap({
  lots,
  center = [-52, -14],
  zoom = 4,
  height = 384,
}: LotMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const polygonLots = lots.filter(
      (lot) => lot.geoJsonCoordinates.geometry.type === 'Polygon',
    )

    // Source 1: polygon features for zoomed-in view
    const polygonCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: polygonLots.map((lot) => ({
        ...lot.geoJsonCoordinates,
        properties: {
          ...lot.geoJsonCoordinates.properties,
          riskLevel: lot.riskLevel,
          lotId:     lot.id,
          commodity: lot.commodity,
          riskScore: lot.riskScore,
        },
      })),
    }

    // Source 2: centroid points for clustering at low zoom
    const centroidCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: polygonLots.map((lot) => {
        const geom = lot.geoJsonCoordinates.geometry as GeoJSON.Polygon
        const [lng, lat] = polygonCentroid(geom.coordinates)
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [lng, lat] },
          properties: {
            riskLevel: lot.riskLevel,
            lotId:     lot.id,
            commodity: lot.commodity,
            riskScore: lot.riskScore,
          },
        }
      }),
    }

    let active = true

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center,
      zoom,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      if (!active) return

      // ── Polygon source (rendered at zoom ≥ CLUSTER_ZOOM) ──────────────────
      map.addSource('lots-polygons', { type: 'geojson', data: polygonCollection })

      map.addLayer({
        id: 'lots-fill',
        type: 'fill',
        source: 'lots-polygons',
        minzoom: CLUSTER_ZOOM,
        paint: { 'fill-color': COLOR_EXPR, 'fill-opacity': 0.45 },
      })

      map.addLayer({
        id: 'lots-outline',
        type: 'line',
        source: 'lots-polygons',
        minzoom: CLUSTER_ZOOM,
        paint: { 'line-color': COLOR_EXPR, 'line-width': 2 },
      })

      // ── Cluster source (centroid points, visible at zoom < CLUSTER_ZOOM) ──
      map.addSource('lots-centroids', {
        type: 'geojson',
        data: centroidCollection,
        cluster: true,
        clusterMaxZoom: CLUSTER_ZOOM - 1,
        clusterRadius: 55,
      })

      // Cluster bubble
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'lots-centroids',
        filter: ['has', 'point_count'],
        maxzoom: CLUSTER_ZOOM,
        paint: {
          'circle-color': '#0f172a',
          'circle-radius': [
            'step', ['get', 'point_count'],
            22,
            5,  30,
            15, 38,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      // Cluster count label
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'lots-centroids',
        filter: ['has', 'point_count'],
        maxzoom: CLUSTER_ZOOM,
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Regular'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      })

      // Individual points for fully unclustered features (zoom near CLUSTER_ZOOM)
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'lots-centroids',
        filter: ['!', ['has', 'point_count']],
        maxzoom: CLUSTER_ZOOM,
        paint: {
          'circle-radius': 10,
          'circle-color': COLOR_EXPR,
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      // ── Popups ────────────────────────────────────────────────────────────
      const popupHtml = (p: Record<string, string>) =>
        `<div style="font-size:13px;line-height:1.5">
          <strong>${p.lotId}</strong><br/>
          Prodotto: ${p.commodity}<br/>
          Rischio: <strong style="color:${RISK_COLORS[p.riskLevel] ?? '#6b7280'}">${p.riskLevel}</strong><br/>
          Score: ${p.riskScore}/100
        </div>`

      map.on('click', 'lots-fill', (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        new maplibregl.Popup({ closeButton: true, maxWidth: '220px' })
          .setLngLat(e.lngLat)
          .setHTML(popupHtml(feature.properties as Record<string, string>))
          .addTo(map)
      })

      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
        new maplibregl.Popup({ closeButton: true, maxWidth: '220px' })
          .setLngLat(coords)
          .setHTML(popupHtml(feature.properties as Record<string, string>))
          .addTo(map)
      })

      // Cursor changes
      for (const layer of ['lots-fill', 'unclustered-point']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
      }
    })

    mapRef.current = map

    return () => {
      active = false
      map.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height, borderRadius: 8 }} />
}
