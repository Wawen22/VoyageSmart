/**
 * Conversation UI Handler
 * Gestisce i componenti UI per le conversazioni AI
 */

'use client';

import { 
  DateSelector, 
  AccommodationTypeSelector, 
  CurrencySelector, 
  ConfirmationButtons, 
  DataSummary 
} from './ConversationComponents';

interface ConversationUIHandlerProps {
  uiComponent?: string;
  uiProps?: any;
  onUserAction: (action: string, value?: any) => void;
}

export default function ConversationUIHandler({ 
  uiComponent, 
  uiProps, 
  onUserAction 
}: ConversationUIHandlerProps) {
  
  if (!uiComponent) {
    return null;
  }

  switch (uiComponent) {
    case 'date_selector':
      return (
        <DateSelector
          label={uiProps?.label || 'Seleziona Data'}
          minDate={uiProps?.minDate}
          onSelect={(date) => onUserAction('date_selected', date)}
        />
      );

    case 'type_selector':
      return (
        <AccommodationTypeSelector
          onSelect={(type) => onUserAction('type_selected', type)}
        />
      );

    case 'currency_selector':
      return (
        <CurrencySelector
          onSelect={(currency) => onUserAction('currency_selected', currency)}
        />
      );

    case 'confirmation_buttons':
      return (
        <ConfirmationButtons
          onConfirm={() => onUserAction('confirmed')}
          onCancel={() => onUserAction('cancelled')}
          confirmText={uiProps?.confirmText}
          cancelText={uiProps?.cancelText}
          loading={uiProps?.loading}
        />
      );

    case 'data_summary':
      return (
        <DataSummary
          data={uiProps?.data || {}}
          onConfirm={() => onUserAction('confirmed')}
          onCancel={() => onUserAction('cancelled')}
          loading={uiProps?.loading}
        />
      );

    default:
      return null;
  }
}
