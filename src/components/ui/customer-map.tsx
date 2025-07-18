'use client';

import React, { useState, useEffect } from 'react';
import { CustomerMap as BaseCustomerMap } from './map';
import { geocodeAddress } from './map';
import { toast } from 'sonner';

interface CustomerMapWrapperProps {
  customers: Array<{
    id: string;
    name: string;
    address?: string;
    city?: string;
  }>;
}

export function CustomerMap({ customers }: CustomerMapWrapperProps) {
  const [geocodedCoordinates, setGeocodedCoordinates] = useState<[number, number][]>([]);
  const [isGeocoding, setIsGeocoding] = useState(true);

  useEffect(() => {
    const geocodeCustomers = async () => {
      if (!customers || customers.length === 0) {
        setGeocodedCoordinates([]);
        setIsGeocoding(false);
        return;
      }

      setIsGeocoding(true);
      const coordinates: [number, number][] = [];

      for (const customer of customers) {
        // Skip customers without an address
        if (!customer.address) continue;

        try {
          // Construct full address
          const fullAddress = customer.city 
            ? `${customer.address}, ${customer.city}, Finland`.trim()
            : `${customer.address}, Finland`.trim();

          const result = await geocodeAddress(fullAddress);
          
          if (result) {
            coordinates.push(result);
          } else {
            toast.warning(`Could not geocode address for ${customer.name}`);
          }
        } catch (error) {
          console.error(`Geocoding error for ${customer.name}:`, error);
          toast.error(`Failed to geocode address for ${customer.name}`);
        }
      }

      setGeocodedCoordinates(coordinates);
      setIsGeocoding(false);
    };

    geocodeCustomers();
  }, [customers]);

  if (isGeocoding) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <p>Geocoding customer locations...</p>
      </div>
    );
  }

  if (geocodedCoordinates.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <p>No locations found. Add addresses to your customers to see them on the map.</p>
      </div>
    );
  }

  return <BaseCustomerMap coordinates={geocodedCoordinates} />;
} 