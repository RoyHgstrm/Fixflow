import { describe, it, expect, vi } from 'vitest';
import { workOrderRouter } from '@/server/api/routers/workOrder';
import { db } from '@/server/db';

vi.mock('@/server/db', () => ({
  db: {
    workOrder: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('WorkOrder Router', () => {
  it('should create a work order', async () => {
    const input = { customerId: '1', description: 'Test work order' };
    const expectedWorkOrder = { id: '1', ...input };

    vi.mocked(db.workOrder.create).mockResolvedValue(expectedWorkOrder);

    const result = await workOrderRouter.create({ input, ctx: { db, session: null } });

    expect(db.workOrder.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(expectedWorkOrder);
  });

  it('should get all work orders', async () => {
    const expectedWorkOrders = [{ id: '1', customerId: '1', description: 'Test work order' }];

    vi.mocked(db.workOrder.findMany).mockResolvedValue(expectedWorkOrders);

    const result = await workOrderRouter.getAll({ ctx: { db, session: null } });

    expect(db.workOrder.findMany).toHaveBeenCalled();
    expect(result).toEqual(expectedWorkOrders);
  });
});