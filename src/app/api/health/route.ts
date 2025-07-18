import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check - can be extended to check database connectivity
    return NextResponse.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy', 
      error: 'Service check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
} 