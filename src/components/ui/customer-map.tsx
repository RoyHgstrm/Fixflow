'use client';

import React, { useState, useEffect } from 'react';
import { BaseMap, MapContainer } from './map'; // Import MapContainer

interface CustomerMapWrapperProps {
  customers: Array<{
    id: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    type?: 'customer' | 'work_order';
  }>;
  height?: string;
}

export function CustomerMap({ customers, height }: CustomerMapWrapperProps) {
  const validCoordinates = customers
    .filter(customer => customer.latitude != null && customer.longitude != null)
    .map(customer => ({ 
      id: customer.id,
      name: customer.name,
      address: customer.address,
      latitude: customer.latitude!,
      longitude: customer.longitude!,
      type: customer.type || 'customer',
    }));

  if (validCoordinates.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <p>No locations found. Add addresses with valid coordinates to your customers to see them on the map.</p>
      </div>
    );
  }

  return (
    <MapContainer style={height ? { height } : undefined}> {/* Pass height via style */}
      <BaseMap locations={validCoordinates} /> {/* BaseMap only needs locations */}
    </MapContainer>
  );
} 