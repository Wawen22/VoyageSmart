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
  DataSummary,
  FieldWithCancel,
  TransportationTypeSelector,
  TransportationSummary
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

    case 'field_with_cancel':
      return (
        <FieldWithCancel
          mainComponent={uiProps?.mainComponent || 'text_input'}
          mainProps={uiProps?.mainProps || {}}
          onCancel={() => onUserAction('cancelled')}
          onAction={(action, data) => {
            // Mappa le azioni del componente principale alle azioni del chatbot
            if (action === 'selected') {
              const componentType = uiProps?.mainComponent;
              switch (componentType) {
                case 'date_selector':
                  onUserAction('date_selected', data);
                  break;
                case 'type_selector':
                  onUserAction('type_selected', data);
                  break;
                case 'transportation_type_selector':
                  onUserAction('transportation_type_selected', data);
                  break;
                case 'currency_selector':
                  onUserAction('currency_selected', data);
                  break;
                default:
                  onUserAction('text_input', data);
              }
            }
          }}
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

    case 'transportation_type_selector':
      return (
        <TransportationTypeSelector
          onSelect={(type) => onUserAction('transportation_type_selected', type)}
        />
      );

    case 'transportation_summary_with_continue':
      return (
        <TransportationSummary
          data={uiProps?.data || {}}
          onContinue={() => onUserAction('continue_with_partial_data')}
          onCancel={() => onUserAction('cancelled')}
          isPartial={uiProps?.isPartial}
          loading={uiProps?.loading}
        />
      );

    case 'transportation_final_summary':
      return (
        <TransportationSummary
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
