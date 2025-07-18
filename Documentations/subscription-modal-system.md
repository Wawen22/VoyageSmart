# Sistema Modal di Sottoscrizione

## Panoramica

Il nuovo sistema di modal per la sottoscrizione è stato progettato per migliorare l'esperienza utente gestendo quando e come viene mostrato il popup dei piani di sottoscrizione.

## Caratteristiche Principali

### 1. Visualizzazione Controllata
- **Una volta per sessione**: Il modal viene mostrato solo una volta per sessione di navigazione
- **Trigger su elementi premium**: Appare automaticamente quando si clicca su funzionalità premium
- **Gestione intelligente**: Non compare più ad ogni caricamento pagina

### 2. Piani Inclusi
Il modal ora mostra tutti e tre i piani disponibili:
- **Free Plan**: Funzionalità base
- **Premium Plan**: Funzionalità avanzate
- **AI Assistant Plan**: Funzionalità AI complete

### 3. Integrazione Semplificata

## Componenti Principali

### OnboardingModal
```tsx
// Provider per gestire il modal globalmente
<OnboardingModalProvider>
  <App />
</OnboardingModalProvider>

// Hook per controllare il modal
const { showModal, hideModal } = useOnboardingModal();
```

### usePremiumFeature Hook
```tsx
const { 
  hasAccess, 
  executeWithAccess, 
  withPremiumAccess, 
  showUpgradeModal 
} = usePremiumFeature();

// Controlla accesso
if (hasAccess('accommodations')) {
  // Utente ha accesso
}

// Esegue azione con controllo accesso
executeWithAccess('premium', () => {
  // Azione da eseguire se ha accesso
});

// Wrapper per click events
<button onClick={withPremiumAccess('ai', handleAIFeature)}>
  Usa AI Assistant
</button>
```

### PremiumFeatureWrapper
```tsx
<PremiumFeatureWrapper 
  feature="accommodations" 
  onClick={() => router.push('/accommodations')}
>
  <div>Contenuto che richiede premium</div>
</PremiumFeatureWrapper>
```

## Utilizzo

### 1. Per Elementi Cliccabili
```tsx
// Invece di Link normale
<Link href="/accommodations">Accommodations</Link>

// Usa il wrapper premium
<div onClick={withPremiumAccess('accommodations', () => router.push('/accommodations'))}>
  Accommodations
</div>
```

### 2. Per Controlli di Accesso
```tsx
// Controlla se l'utente può accedere
if (hasAccess('transportation')) {
  // Mostra funzionalità completa
} else {
  // Mostra indicatore premium
}
```

### 3. Per Mostrare il Modal Manualmente
```tsx
const { showUpgradeModal } = usePremiumFeature();

<Button onClick={() => showUpgradeModal?.()}>
  Upgrade Account
</Button>
```

## Funzionalità Supportate

- `premium`: Funzionalità premium generiche
- `ai`: Funzionalità AI Assistant
- `unlimited_trips`: Viaggi illimitati
- `accommodations`: Gestione alloggi
- `transportation`: Gestione trasporti

## Gestione Sessione

Il sistema utilizza `sessionStorage` per tracciare se l'utente ha già visto il modal nella sessione corrente:
- Chiave: `hasSeenOnboardingThisSession`
- Reset automatico: Ad ogni nuova sessione del browser
- Comportamento: Modal appare solo una volta per sessione, poi solo su click elementi premium

## Migrazione da Sistema Precedente

### Prima
```tsx
// Modal appariva sempre al primo accesso
localStorage.getItem('hasSeenOnboarding')
```

### Dopo
```tsx
// Modal appare una volta per sessione
sessionStorage.getItem('hasSeenOnboardingThisSession')
```

## Vantaggi

1. **Migliore UX**: Non disturba l'utente ad ogni visita
2. **Conversioni Mirate**: Appare quando l'utente è interessato a funzionalità premium
3. **Flessibilità**: Facile da integrare in nuovi componenti
4. **Manutenibilità**: Sistema centralizzato e riutilizzabile

## Note Tecniche

- Il provider deve essere posizionato nel layout principale
- Il hook `usePremiumFeature` gestisce automaticamente i fallback
- Compatibile con il sistema di sottoscrizioni esistente
- Non richiede modifiche al backend
