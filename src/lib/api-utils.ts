import { TRPCError } from "@trpc/server";
import type { 
  UserRole, 
  ExtendedUser, 
  Result, 
  ApiError
} from "./types";
import { success, failure, ApiErrorCode } from "./types";

// User role constants for comparison
export const USER_ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER', 
  EMPLOYEE: 'EMPLOYEE',
  ADMIN: 'ADMIN',
  TECHNICIAN: 'TECHNICIAN',
  CLIENT: 'CLIENT',
} as const;

// Helper to safely get user role
export function getUserRole(user: unknown): UserRole {
  const extendedUser = user as ExtendedUser;
  return extendedUser?.role ?? USER_ROLES.ADMIN;
}

// Role-based permission checking
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export function requirePermission(userRole: UserRole, requiredRoles: UserRole[], action = 'perform this action'): void {
  if (!hasPermission(userRole, requiredRoles)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You don't have permission to ${action}`,
    });
  }
}

// Database operation helpers
export function ensureDbConnection(db: unknown): asserts db is NonNullable<typeof db> {
  if (!db) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database connection not available',
    });
  }
}

// Error handling utilities
export function handleDbError(error: unknown, context: string): never {
  if (error instanceof TRPCError) {
    throw error;
  }
  
  console.error(`Database error in ${context}:`, error);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Failed to ${context}`,
  });
}

// Result pattern helpers for async operations
export async function withResult<T>(
  operation: () => Promise<T>,
  context: string
): Promise<Result<T, ApiError>> {
  try {
    const data = await operation();
    return { success: true, data } as Result<T, ApiError>;
  } catch (error) {
    const apiError: ApiError = {
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: error instanceof Error ? error.message : `Failed to ${context}`,
      details: error,
    };
    return { success: false, error: apiError };
  }
}

// Filter builders for role-based queries
export interface FilterBuilder {
  build(): Record<string, unknown>;
}

export class WorkOrderFilterBuilder implements FilterBuilder {
  private where: Record<string, unknown> = {};

  constructor(private userRole: UserRole, private userId: string) {}

  withRoleBasedAccess(): this {
    if (this.userRole === USER_ROLES.CLIENT) {
      this.where.customer = { createdById: this.userId };
    } else if (this.userRole === USER_ROLES.TECHNICIAN || this.userRole === USER_ROLES.EMPLOYEE) {
      this.where.assignedToId = this.userId;
    }
    // ADMIN, MANAGER, OWNER can see all
    return this;
  }

  withStatus(status?: string): this {
    if (status) {
      this.where.status = status;
    }
    return this;
  }

  withAssignee(assignedToId?: string): this {
    if (assignedToId) {
      this.where.assignedToId = assignedToId;
    }
    return this;
  }

  withCustomer(customerId?: string): this {
    if (customerId) {
      this.where.customerId = customerId;
    }
    return this;
  }

  withSearch(search?: string): this {
    if (search) {
      this.where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    return this;
  }

  build(): Record<string, unknown> {
    return this.where;
  }
}

export class CustomerFilterBuilder implements FilterBuilder {
  private where: Record<string, unknown> = {};

  constructor(private userRole: UserRole, private userId: string) {}

  withRoleBasedAccess(): this {
    if (this.userRole === USER_ROLES.CLIENT) {
      this.where.createdById = this.userId;
    }
    // ADMIN, MANAGER, OWNER, TECHNICIAN, EMPLOYEE can see all
    return this;
  }

  withType(type?: string): this {
    if (type) {
      this.where.type = type;
    }
    return this;
  }

  withSearch(search?: string): this {
    if (search) {
      this.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this;
  }

  build(): Record<string, unknown> {
    return this.where;
  }
}

// Pagination helpers
export interface PaginationOptions {
  limit: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
  hasNextPage: boolean;
}

export function buildPaginationOptions(options: PaginationOptions) {
  const { limit, cursor } = options;
  return cursor 
    ? { cursor: { id: cursor }, skip: 1, take: limit + 1 }
    : { take: limit + 1 };
}

export function processPaginatedResult<T extends { id: string }>(
  items: T[],
  limit: number
): PaginatedResult<T> {
  const hasNextPage = items.length > limit;
  if (hasNextPage) {
    items.pop(); // Remove the extra item
  }
  
  const nextCursor = hasNextPage ? items[items.length - 1]?.id : undefined;
  
  return {
    items,
    nextCursor,
    hasNextPage,
  };
}

// Validation helpers
export function validateRequired<T>(value: T | null | undefined, fieldName: string): T {
  if (value == null) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} is required`,
    });
  }
  return value;
}

export function validateExists<T>(value: T | null, entityName: string): T {
  if (!value) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `${entityName} not found`,
    });
  }
  return value;
} 