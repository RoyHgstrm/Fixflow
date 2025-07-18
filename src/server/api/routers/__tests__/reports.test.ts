import { describe, it, expect, vi } from 'vitest';
import { reportsRouter } from '@/server/api/routers/reports';
import { db } from '@/server/db';

vi.mock('@/server/db', () => ({
  db: {
    invoice: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    customer: {
      count: vi.fn(),
    },
    workOrder: {
      count: vi.fn(),
    },
  },
}));

describe('Reports Router', () => {
  it('should get stats with a date range', async () => {
    const session = { user: { companyId: '1' } };
    const from = new Date('2025-01-01');
    const to = new Date('2025-01-31');
    const expectedStats = {
      totalRevenue: 1000,
      newCustomers: 10,
      completedWorkOrders: 20,
      pendingWorkOrders: 5,
      revenueOverTime: [{ date: new Date('2025-01-15'), revenue: 1000 }],
    };

    vi.mocked(db.invoice.aggregate).mockResolvedValue({ _sum: { total: 1000 } });
    vi.mocked(db.customer.count).mockResolvedValue(10);
    vi.mocked(db.workOrder.count).mockResolvedValueOnce(20).mockResolvedValueOnce(5);
    vi.mocked(db.invoice.groupBy).mockResolvedValue([{ paidDate: new Date('2025-01-15'), _sum: { total: 1000 } }]);

    const result = await reportsRouter.getStats({ ctx: { db, session }, input: { from, to } });

    expect(result).toEqual(expectedStats);
  });
});