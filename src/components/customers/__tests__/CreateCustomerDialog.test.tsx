
import { render, screen } from '@testing-library/react';
import { CreateCustomerDialog } from '@/components/customers/CreateCustomerDialog';

describe('CreateCustomerDialog', () => {
  it('renders the dialog', () => {
    render(<CreateCustomerDialog />);

    const button = screen.getByRole('button', { name: /Create Customer/i });

    expect(button).toBeInTheDocument();
  });
});
