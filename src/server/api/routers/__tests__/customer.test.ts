import { describe, it, expect, vi } from 'vitest';
import { customerRouter } from '@/server/api/routers/customer';
import { db } from '@/server/db';

vi.mock('@/server/db', () => ({
  db: {
    customer: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Customer Router', () => {
  it('should create a customer', async () => {
    const input = { name: 'Test Customer', email: 'test@example.com' };
    const expectedCustomer = { id: '1', ...input };

    vi.mocked(db.customer.create).mockResolvedValue(expectedCustomer);

    const result = await customerRouter.create({ input, ctx: { db, session: null } });

    expect(db.customer.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(expectedCustomer);
  });

  it('should get all customers', async () => {
    const expectedCustomers = [{ id: '1', name: 'Test Customer', email: 'test@example.com' }];

    vi.mocked(db.customer.findMany).mockResolvedValue(expectedCustomers);

    const result = await customerRouter.getAll({ ctx: { db, session: null } });

    expect(db.customer.findMany).toHaveBeenCalled();
    expect(result).toEqual(expectedCustomers);
  });
});