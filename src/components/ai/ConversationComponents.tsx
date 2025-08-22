/**
 * Interactive Components for AI Conversation
 * Componenti UI interattivi per migliorare l'esperienza conversazionale
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Check, X, MapPin, CreditCard, Building2, Home, Hotel, TreePine } from 'lucide-react';
import { format, parse } from 'date-fns';
import { it } from 'date-fns/locale';

interface DateSelectorProps {
  label: string;
  onSelect: (date: string) => void;
  minDate?: string;
}

export function DateSelector({ label, onSelect, minDate }: DateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState('');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onSelect(selectedDate);
    }
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 my-3 border border-slate-600/50">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-medium text-slate-200">{label}</span>
      </div>
      
      <div className="flex gap-2">
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          min={minDate}
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          onClick={handleConfirm}
          disabled={!selectedDate}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface OptionSelectorProps {
  title: string;
  options: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
  }>;
  onSelect: (value: string) => void;
}

export function OptionSelector({ title, options, onSelect }: OptionSelectorProps) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 my-3 border border-slate-600/50">
      <div className="mb-3">
        <span className="text-sm font-medium text-slate-200">{title}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            onClick={() => onSelect(option.value)}
            variant="outline"
            className="h-auto p-3 flex flex-col items-center gap-2 bg-slate-800/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-left"
          >
            {option.icon && (
              <div className="text-blue-400">
                {option.icon}
              </div>
            )}
            <div className="text-center">
              <div className="text-sm font-medium text-white">{option.label}</div>
              {option.description && (
                <div className="text-xs text-slate-400 mt-1">{option.description}</div>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

interface ConfirmationButtonsProps {
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function ConfirmationButtons({
  onConfirm,
  onCancel,
  confirmText = "Conferma e Salva",
  cancelText = "Annulla",
  loading = false
}: ConfirmationButtonsProps) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 my-3 border border-slate-600/50">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
        >
          <Check className="h-4 w-4 mr-2" />
          {loading ? 'Salvando...' : confirmText}
        </Button>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outline"
          className="w-full sm:flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 min-h-[44px]"
        >
          <X className="h-4 w-4 mr-2" />
          {cancelText}
        </Button>
      </div>
    </div>
  );
}

interface CurrencySelectorProps {
  onSelect: (currency: string) => void;
}

export function CurrencySelector({ onSelect }: CurrencySelectorProps) {
  const currencies = [
    { value: 'EUR', label: 'Euro (€)', flag: '🇪🇺' },
    { value: 'USD', label: 'US Dollar ($)', flag: '🇺🇸' },
    { value: 'GBP', label: 'British Pound (£)', flag: '🇬🇧' },
    { value: 'CHF', label: 'Swiss Franc', flag: '🇨🇭' },
    { value: 'JPY', label: 'Japanese Yen (¥)', flag: '🇯🇵' },
    { value: 'CAD', label: 'Canadian Dollar', flag: '🇨🇦' }
  ];

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 my-3 border border-slate-600/50">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="h-4 w-4 text-green-400" />
        <span className="text-sm font-medium text-slate-200">Seleziona Valuta</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {currencies.map((currency) => (
          <Button
            key={currency.value}
            onClick={() => onSelect(currency.value)}
            variant="outline"
            className="h-auto p-3 flex items-center gap-3 bg-slate-800/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-left justify-start"
          >
            <span className="text-lg">{currency.flag}</span>
            <div>
              <div className="text-sm font-medium text-white">{currency.value}</div>
              <div className="text-xs text-slate-400">{currency.label}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

export function AccommodationTypeSelector({ onSelect }: { onSelect: (type: string) => void }) {
  const types = [
    { value: 'hotel', label: 'Hotel', icon: <Building2 className="h-5 w-5" />, description: 'Hotel tradizionale' },
    { value: 'apartment', label: 'Appartamento', icon: <Home className="h-5 w-5" />, description: 'Casa vacanze' },
    { value: 'hostel', label: 'Ostello', icon: <Hotel className="h-5 w-5" />, description: 'Sistemazione economica' },
    { value: 'house', label: 'Casa', icon: <Home className="h-5 w-5" />, description: 'Casa intera' },
    { value: 'villa', label: 'Villa', icon: <Home className="h-5 w-5" />, description: 'Villa di lusso' },
    { value: 'resort', label: 'Resort', icon: <TreePine className="h-5 w-5" />, description: 'Resort turistico' },
    { value: 'camping', label: 'Camping', icon: <TreePine className="h-5 w-5" />, description: 'Campeggio' },
    { value: 'other', label: 'Altro', icon: <MapPin className="h-5 w-5" />, description: 'Altro tipo' }
  ];

  return <OptionSelector title="Tipo di Alloggio" options={types} onSelect={onSelect} />;
}

interface DataSummaryProps {
  data: Record<string, any>;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DataSummary({ data, onConfirm, onCancel, loading }: DataSummaryProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy', { locale: it });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 my-3 border border-slate-600/50 max-w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-3">📋 Riepilogo Alloggio</h3>

        <div className="space-y-2 text-sm">
          {data.name && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Nome:</span>
              <span className="text-white font-medium break-words">{data.name}</span>
            </div>
          )}
          {data.type && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Tipo:</span>
              <span className="text-white font-medium capitalize">{data.type}</span>
            </div>
          )}
          {data.check_in_date && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Check-in:</span>
              <span className="text-white font-medium">{formatDate(data.check_in_date)}</span>
            </div>
          )}
          {data.check_out_date && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Check-out:</span>
              <span className="text-white font-medium">{formatDate(data.check_out_date)}</span>
            </div>
          )}
          {data.address && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Indirizzo:</span>
              <span className="text-white font-medium break-words">{data.address}</span>
            </div>
          )}
          {data.booking_reference && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Prenotazione:</span>
              <span className="text-white font-medium break-words">{data.booking_reference}</span>
            </div>
          )}
          {data.contact_info && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Contatti:</span>
              <span className="text-white font-medium break-words">{data.contact_info}</span>
            </div>
          )}
          {data.cost && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Costo:</span>
              <span className="text-white font-medium">{data.cost} {data.currency || 'EUR'}</span>
            </div>
          )}
          {data.notes && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-400 font-medium">Note:</span>
              <span className="text-white font-medium break-words">{data.notes}</span>
            </div>
          )}
        </div>
      </div>

      <ConfirmationButtons
        onConfirm={onConfirm}
        onCancel={onCancel}
        loading={loading}
      />
    </div>
  );
}
