'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { UserRole, USER_ROLES, WorkOrderWithRelations, CustomerWithRelations, ReportsStats, PaginatedResult } from '@/lib/types';
import { CustomerType, WorkOrderStatus } from '@prisma/client';

type CustomerFilters = {
  type?: CustomerType;
  search?: string;
  limit?: number;
  cursor?: string;
};

type WorkOrderFilters = {
  status?: WorkOrderStatus;
  search?: string;
  limit?: number;
  cursor?: string;
};

async function buildCustomerQuery(filters: CustomerFilters, userCompanyId: string) {
  const where: Record<string, unknown> = { companyId: userCompanyId };

  if (typeof filters.type === 'string') {
    where.type = filters.type;
  }

  if (typeof filters.search === 'string' && filters.search.trim() !== '') {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return where;
}

async function buildWorkOrderQuery(filters: WorkOrderFilters, userCompanyId: string, userId: string, role: UserRole) {
  const where: Record<string, unknown> = { companyId: userCompanyId };

  if (role === USER_ROLES.FIELD_WORKER) where.assignedToId = userId;
  else if (role === USER_ROLES.SOLO) where.createdById = userId;

  if (typeof filters.status === 'string') {
    where.status = filters.status;
  }

  if (typeof filters.search === 'string' && filters.search.trim() !== '') {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return where;
}

export async function fetchCustomers(
  filters: CustomerFilters, 
  userId: string, 
  userCompanyId: string, 
  role: UserRole
): Promise<PaginatedResult<CustomerWithRelations>> {
  const where = await buildCustomerQuery(filters, userCompanyId);

  const limit = filters.limit ?? 10;
  const customers = await prisma.customer.findMany({
    where,
    take: limit,
    skip: filters.cursor ? 1 : 0,
    ...(filters.cursor && { cursor: { id: filters.cursor }, skip: 1 }),
    include: {
      createdBy: {
        select: { name: true, id: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.customer.count({ where });

  return {
    items: customers.map(customer => ({
      ...customer,
      createdBy: { 
        name: customer.createdBy?.name ?? null, 
        id: customer.createdBy?.id ?? '' 
      }
    } as CustomerWithRelations)),
    nextCursor: customers.length === limit ? customers[customers.length - 1].id : undefined,
    hasMore: total > limit
  };
}

export async function fetchWorkOrders(
  filters: WorkOrderFilters, 
  userId: string, 
  userCompanyId: string, 
  role: UserRole
): Promise<PaginatedResult<WorkOrderWithRelations>> {
  const where = await buildWorkOrderQuery(filters, userCompanyId, userId, role);

  const limit = filters.limit ?? 10;
  const workOrders = await prisma.workOrder.findMany({
    where,
    take: limit,
    skip: filters.cursor ? 1 : 0,
    ...(filters.cursor && { cursor: { id: filters.cursor }, skip: 1 }),
    include: {
      customer: true,
      assignedTo: true,
      createdBy: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.workOrder.count({ where });

  return {
    items: workOrders.map(workOrder => ({
      ...workOrder,
      customer: workOrder.customer ?? undefined,
      assignedTo: workOrder.assignedTo ?? undefined,
      createdBy: workOrder.createdBy
    } as WorkOrderWithRelations)),
    nextCursor: workOrders.length === limit ? workOrders[workOrders.length - 1].id : undefined,
    hasMore: total > limit
  };
}

export async function fetchReportsStats(
  filters: Record<string, unknown>, 
  userId: string, 
  userCompanyId: string, 
  role: UserRole
): Promise<ReportsStats | null> {
  // Implement reports stats fetching logic
  return null;
}

export async function invalidateCache(paths: string[]) {
  paths.forEach(path => revalidatePath(path));
} 