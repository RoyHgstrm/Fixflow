'use client'

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Icon } from 'ol/style';

// Ensure the map container has a defined size
export const MapContainer = ({ 
  children, 
  className = '', 
  style = {} 
}: { 
  children?: React.ReactNode, 
  className?: string, 
  style?: React.CSSProperties 
}) => {
  return (
    <div 
      className={`w-full h-[500px] min-h-[300px] relative ${className}`} 
      style={{
        ...style,
        minWidth: '100%',
        maxWidth: '100%',
      }}
    >
      {children}
    </div>
  );
};

export function BaseMap({ 
  locations, 
  zoom = 10 
}: { 
  locations: Array<{ id: string; name: string; address?: string; latitude: number; longitude: number; type: 'customer' | 'work_order' }>, 
  zoom?: number 
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Ensure the map container has a non-zero size
    const containerWidth = mapRef.current.offsetWidth;
    const containerHeight = mapRef.current.offsetHeight;

    if (containerWidth === 0 || containerHeight === 0) {
      console.warn('Map container has zero dimensions', { 
        width: containerWidth, 
        height: containerHeight 
      });
      return;
    }

    // Create vector source and layer for markers
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    // Add markers for each location
    locations.forEach(location => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([location.longitude, location.latitude])),
        name: location.name,
        address: location.address,
      });

      // Optional: Add a custom marker style
      feature.setStyle(new Style({
        image: new Icon({
          src: '/marker-icon.png', // Ensure you have this icon in public folder
          scale: 0.5
        })
      }));

      vectorSource.addFeature(feature);
    });

    // Create map instance
    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer // Add the vector layer with markers
      ],
      view: new View({
        center: locations.length > 0 
          ? fromLonLat([locations[0].longitude, locations[0].latitude]) 
          : fromLonLat([24.9384, 60.1699]), // Default to Helsinki
        zoom: zoom
      })
    });

    // Adjust view to fit all markers if multiple locations
    if (locations.length > 1) {
      const extent = vectorSource.getExtent();
      mapInstance.current.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        maxZoom: zoom
      });
    }

    // Clean up
    return () => {
      if (mapInstance.current) {
        mapInstance.current.dispose();
      }
    };
  }, [locations, zoom]);

  return (
    <MapContainer>
      <div 
        ref={mapRef} 
        className="absolute inset-0 w-full h-full"
      />
    </MapContainer>
  );
}

export default BaseMap; 