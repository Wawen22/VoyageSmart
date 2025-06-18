'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Save, Edit, RotateCcw, Play } from 'lucide-react';

interface WizardActionButtonsProps {
  type: 'start' | 'generate' | 'final';
  onAction: (action: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  compact?: boolean; // Per layout più compatti
}

export default function WizardActionButtons({
  type,
  onAction,
  isLoading = false,
  disabled = false,
  compact = false
}: WizardActionButtonsProps) {
  
  if (type === 'start') {
    return (
      <div className="flex justify-center mt-4">
        <Button
          onClick={() => onAction('start')}
          disabled={disabled || isLoading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Play className="h-4 w-4 mr-2" />
          Inizia
        </Button>
      </div>
    );
  }

  if (type === 'generate') {
    return (
      <div className="flex justify-center mt-4">
        <Button
          onClick={() => onAction('generate')}
          disabled={disabled || isLoading}
          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isLoading ? 'Generando...' : 'Genera Attività'}
        </Button>
      </div>
    );
  }

  if (type === 'final') {
    // Layout compatto per spazi ristretti
    if (compact) {
      return (
        <div className="space-y-2 mt-4">
          {/* Pulsante principale "Salva" */}
          <div className="flex justify-center">
            <Button
              onClick={() => onAction('save')}
              disabled={disabled || isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
            >
              <Save className="h-3 w-3 mr-2" />
              {isLoading ? 'Salvando...' : 'Salva'}
            </Button>
          </div>

          {/* Pulsanti secondari in una riga */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => onAction('edit')}
              variant="outline"
              disabled={disabled || isLoading}
              className="w-full px-3 py-2 border-2 border-blue-300 text-blue-700 hover:border-blue-500 hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 text-xs font-medium"
            >
              <Edit className="h-3 w-3 mr-1" />
              Modifica
            </Button>

            <Button
              onClick={() => onAction('restart')}
              variant="outline"
              disabled={disabled || isLoading}
              className="w-full px-3 py-2 border-2 border-orange-300 text-orange-700 hover:border-orange-500 hover:bg-orange-100 hover:text-orange-800 transition-all duration-200 text-xs font-medium"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Ricomincia
            </Button>
          </div>
        </div>
      );
    }

    // Layout normale per spazi adeguati
    return (
      <div className="space-y-3 mt-6">
        {/* Prima riga: Pulsante principale "Salva" */}
        <div className="flex justify-center">
          <Button
            onClick={() => onAction('save')}
            disabled={disabled || isLoading}
            className="w-full max-w-xs bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salva Attività'}
          </Button>
        </div>

        {/* Seconda riga: Pulsanti secondari */}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={() => onAction('edit')}
            variant="outline"
            disabled={disabled || isLoading}
            className="w-full sm:w-auto px-4 py-2 border-2 border-blue-300 text-blue-700 hover:border-blue-500 hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 text-sm font-medium"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifica
          </Button>

          <Button
            onClick={() => onAction('restart')}
            variant="outline"
            disabled={disabled || isLoading}
            className="w-full sm:w-auto px-4 py-2 border-2 border-orange-300 text-orange-700 hover:border-orange-500 hover:bg-orange-100 hover:text-orange-800 transition-all duration-200 text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Ricomincia
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
