'use server';

import { prisma } from '@/lib/prisma';
import { UserRole, USER_ROLES, WorkOrderWithRelations, CustomerWithRelations, ReportsStats, PaginatedResponse, WorkOrderResponse, WorkOrderStats, CustomerStats } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { WorkOrderStatus as PrismaWorkOrderStatus } from '@prisma/client';

export async function fetchDashboardData(userId: string, userRole: UserRole) {
  try {
    // Prepare work order where clause based on user role
    const workOrderWhereClause: Record<string, unknown> = {
      companyId: (await prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { companyId: true } 
      }))?.companyId,
    };

    // Adjust work order filtering based on user role
    if (userRole === USER_ROLES.FIELD_WORKER || userRole === USER_ROLES.TECHNICIAN) {
      workOrderWhereClause.assignedToId = userId;
    } else if (userRole === USER_ROLES.SOLO) {
      workOrderWhereClause.createdById = userId;
    }

    // Fetch work orders
    const workOrders = await prisma.workOrder.findMany({
      where: workOrderWhereClause,
      take: 5,
      include: {
        customer: true,
        assignedTo: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch customers
    const customerWhereClause: Record<string, unknown> = {
      createdById: userId,
    };

    const customers = await prisma.customer.findMany({
      where: customerWhereClause,
      take: 5,
      include: {
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate WorkOrderStats
    const workOrderCounts = await prisma.workOrder.groupBy({
      by: ['status'],
      where: workOrderWhereClause,
      _count: true,
    });

    const workOrderStats: WorkOrderStats = {
      total: workOrders.length,
      pending: workOrderCounts.find(c => c.status === PrismaWorkOrderStatus.PENDING)?._count ?? 0,
      assigned: workOrderCounts.find(c => c.status === PrismaWorkOrderStatus.ASSIGNED)?._count ?? 0,
      inProgress: workOrderCounts.find(c => c.status === PrismaWorkOrderStatus.IN_PROGRESS)?._count ?? 0,
      completed: workOrderCounts.find(c => c.status === PrismaWorkOrderStatus.COMPLETED)?._count ?? 0,
      cancelled: workOrderCounts.find(c => c.status === PrismaWorkOrderStatus.CANCELLED)?._count ?? 0,
      totalValue: workOrders.reduce((sum, wo) => sum + (wo.amount ?? 0), 0),
    };

    // Calculate CustomerStats
    const customerCounts = await prisma.customer.groupBy({
      by: ['type'],
      where: customerWhereClause,
      _count: true,
    });

    const customerStats: CustomerStats = {
      totalCustomers: customers.length,
      residential: customerCounts.find(c => c.type === 'RESIDENTIAL')?._count ?? 0,
      commercial: customerCounts.find(c => c.type === 'COMMERCIAL')?._count ?? 0,
      industrial: customerCounts.find(c => c.type === 'INDUSTRIAL')?._count ?? 0,
    };

    // Fetch other relevant data (ReportsStats, adjust as needed)
    const stats: ReportsStats = {
      totalRevenue: 0, 
      newCustomers: 0, 
      completedWorkOrders: 0, 
      pendingWorkOrders: 0, 
      inProgressWorkOrders: 0, 
      assignedWorkOrders: 0, 
      cancelledWorkOrders: 0, 
      averageCompletionTime: 0, 
      revenueOverTime: [], 
      workOrdersByType: [], 
      residentialCustomers: 0, 
      commercialCustomers: 0, 
      industrialCustomers: 0, 
      topCustomersByRevenue: [], 
      workOrdersByPriority: [], 
    };

    return {
      workOrders: { items: workOrders as WorkOrderResponse[], hasMore: false },
      customers: { items: customers as CustomerWithRelations[], hasMore: false },
      stats,
      workOrderStats,
      customerStats,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

export async function revalidateDashboard() {
  revalidatePath('/dashboard');
} 