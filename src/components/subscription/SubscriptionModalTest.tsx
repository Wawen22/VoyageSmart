'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import { useOnboardingModal } from './OnboardingModal';

/**
 * Componente di test per verificare il funzionamento del sistema di modal
 * Rimuovere in produzione
 */
export default function SubscriptionModalTest() {
  const { hasAccess, withPremiumAccess, showUpgradeModal } = usePremiumFeature();
  
  let modalContext: any = null;
  try {
    modalContext = useOnboardingModal();
  } catch (error) {
    // Context non disponibile
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Test Sistema Modal Sottoscrizione</CardTitle>
        <CardDescription>
          Testa le funzionalità del nuovo sistema di modal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">Stato Accessi:</h3>
          <ul className="text-sm space-y-1">
            <li>Premium: {hasAccess('premium') ? '✅' : '❌'}</li>
            <li>AI: {hasAccess('ai') ? '✅' : '❌'}</li>
            <li>Accommodations: {hasAccess('accommodations') ? '✅' : '❌'}</li>
            <li>Transportation: {hasAccess('transportation') ? '✅' : '❌'}</li>
            <li>Unlimited Trips: {hasAccess('unlimited_trips') ? '✅' : '❌'}</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Test Buttons:</h3>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => modalContext?.showModal?.()}
          >
            Mostra Modal Manualmente
          </Button>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={withPremiumAccess('accommodations', () => alert('Accesso a Accommodations!'))}
          >
            Test Accommodations
          </Button>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={withPremiumAccess('transportation', () => alert('Accesso a Transportation!'))}
          >
            Test Transportation
          </Button>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={withPremiumAccess('ai', () => alert('Accesso a AI Assistant!'))}
          >
            Test AI Assistant
          </Button>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              if (showUpgradeModal) {
                showUpgradeModal();
              } else {
                alert('Modal context non disponibile');
              }
            }}
          >
            Test Hook showUpgradeModal
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Questo componente è solo per test. Rimuovere in produzione.</p>
        </div>
      </CardContent>
    </Card>
  );
}
