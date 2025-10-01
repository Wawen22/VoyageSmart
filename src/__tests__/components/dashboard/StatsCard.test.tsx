import { render, screen } from '@testing-library/react';
import { MapPinIcon } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';

describe('StatsCard', () => {
  const defaultProps = {
    title: 'Total Trips',
    value: 5,
    icon: MapPinIcon,
    color: '#3b82f6',
    description: 'All your adventures'
  };

  it('renders correctly with basic props', () => {
    render(<StatsCard {...defaultProps} />);
    
    expect(screen.getByText('Total Trips')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('All your adventures')).toBeInTheDocument();
  });

  it('renders with trend indicator when provided', () => {
    const propsWithTrend = {
      ...defaultProps,
      trend: {
        value: 20,
        isPositive: true
      }
    };

    render(<StatsCard {...propsWithTrend} />);
    
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it.skip('applies correct color styling', () => {
    render(<StatsCard {...defaultProps} />);

    const iconContainer = screen.getByRole('generic');
    expect(iconContainer).toHaveStyle({
      backgroundColor: '#3b82f615'
    });
  });

  it('has proper accessibility attributes', () => {
    render(<StatsCard {...defaultProps} />);
    
    // Check that the card is properly structured for screen readers
    expect(screen.getByText('Total Trips')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles large numbers correctly', () => {
    const propsWithLargeNumber = {
      ...defaultProps,
      value: 1234
    };

    render(<StatsCard {...propsWithLargeNumber} />);
    
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('renders without description when not provided', () => {
    const propsWithoutDescription = {
      title: 'Total Trips',
      value: 5,
      icon: MapPinIcon,
      color: '#3b82f6'
    };

    render(<StatsCard {...propsWithoutDescription} />);
    
    expect(screen.getByText('Total Trips')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('All your adventures')).not.toBeInTheDocument();
  });

  it('handles negative trend correctly', () => {
    const propsWithNegativeTrend = {
      ...defaultProps,
      trend: {
        value: -15,
        isPositive: false
      }
    };

    render(<StatsCard {...propsWithNegativeTrend} />);
    
    expect(screen.getByText('15%')).toBeInTheDocument();
    // Check for negative trend styling
    const trendElement = screen.getByText('15%').parentElement;
    expect(trendElement).toHaveClass('bg-red-100', 'text-red-700');
  });

  it.skip('has hover effects applied', () => {
    render(<StatsCard {...defaultProps} />);

    const card = screen.getByRole('generic').closest('.overflow-hidden');
    expect(card).toHaveClass('hover:shadow-lg', 'transition-all', 'duration-300');
  });

  it.skip('renders progress bar with correct width', () => {
    const propsWithValue = {
      ...defaultProps,
      value: 3 // Should result in 30% width (3/10 * 100)
    };

    render(<StatsCard {...propsWithValue} />);

    const progressBar = screen.getByRole('generic').querySelector('.h-full');
    expect(progressBar).toHaveStyle({
      width: '30%'
    });
  });

  it.skip('caps progress bar at 100%', () => {
    const propsWithHighValue = {
      ...defaultProps,
      value: 15 // Should cap at 100% (15/10 * 100 = 150%, but capped at 100%)
    };

    render(<StatsCard {...propsWithHighValue} />);

    const progressBar = screen.getByRole('generic').querySelector('.h-full');
    expect(progressBar).toHaveStyle({
      width: '100%'
    });
  });
});
