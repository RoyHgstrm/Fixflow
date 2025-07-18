
import { render, screen } from '@testing-library/react';
import ReportsClientPage from '@/app/dashboard/reports/ReportsClientPage';

describe('ReportsClientPage', () => {
  it('renders the reports page with cards', () => {
    render(<ReportsClientPage />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Active Now')).toBeInTheDocument();
  });
});
