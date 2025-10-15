import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InteractiveComponentRenderer from '../InteractiveComponentRenderer';
import { type InteractiveComponent } from '@/lib/ai/interactiveDsl';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => null,
}));

describe('InteractiveComponentRenderer', () => {
  it('invokes onSendMessage when a quick reply is clicked', () => {
    const components: InteractiveComponent[] = [
      {
        type: 'quick_replies',
        title: 'Scegli un opzione',
        options: [
          { id: 'yes', label: 'Sì', value: 'si' },
          { id: 'no', label: 'No', value: 'no' },
        ],
      },
    ];

    const onSendMessage = jest.fn();

    render(<InteractiveComponentRenderer components={components} onSendMessage={onSendMessage} />);

    fireEvent.click(screen.getByText('Sì'));

    expect(onSendMessage).toHaveBeenCalledWith('si');
  });

  it('sends formatted value when confirming a date selection', () => {
    const components: InteractiveComponent[] = [
      {
        type: 'date_picker',
        title: 'Quando vuoi partire?',
        minDate: '2024-01-01',
        action: { type: 'send_message', value: 'Partenza il {{selected_date}}' },
      },
    ];

    const onSendMessage = jest.fn();

    render(<InteractiveComponentRenderer components={components} onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText(/scegli una data/i);
    fireEvent.change(input, { target: { value: '2024-05-10' } });

    fireEvent.click(screen.getByRole('button', { name: /conferma/i }));

    expect(onSendMessage).toHaveBeenCalledWith('Partenza il 2024-05-10');
  });
});
