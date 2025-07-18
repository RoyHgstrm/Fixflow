import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(address)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FixFlow/1.0 (https://fixflow.fi; contact@fixflow.fi)',
        'Referer': 'https://fixflow.fi'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 500 });
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      return NextResponse.json({ 
        coordinates: { 
          lat: parseFloat(lat), 
          lon: parseFloat(lon) 
        },
        source: 'Nominatim'
      });
    } else {
      return NextResponse.json({ error: 'No coordinates found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge'; 