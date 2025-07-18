'use client';

import React, { useState, useEffect } from 'react';
import { BaseMap } from './map';
import { geocodeAddress } from './map';
import { toast } from 'sonner';

interface CustomerMapWrapperProps {
  customers: Array<{
    id: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }>;
  height?: string;
  showStats?: boolean;
}

export function CustomerMap({ customers, height, showStats }: CustomerMapWrapperProps) {
  const validCoordinates = customers
    .filter(customer => customer.latitude != null && customer.longitude != null)
    .map(customer => ({ 
      id: customer.id,
      name: customer.name,
      address: customer.address,
      latitude: customer.latitude!,
      longitude: customer.longitude!,
      type: 'customer' as const,
    }));

  if (validCoordinates.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <p>No locations found. Add addresses with valid coordinates to your customers to see them on the map.</p>
      </div>
    );
  }

  return <BaseMap locations={validCoordinates} height={height} showStats={showStats} />;
} 