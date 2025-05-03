# Componenti dell'Itinerario

Questo documento descrive i componenti principali dell'itinerario di VoyageSmart.

## Viste dell'Itinerario

L'itinerario offre tre diverse viste per visualizzare le attività pianificate:

### 1. Vista Lista

La vista lista mostra le attività organizzate per giorno in un formato verticale. Ogni giorno è rappresentato da una scheda che contiene:
- Data e giorno della settimana
- Note del giorno
- Elenco delle attività pianificate per quel giorno

Questa vista è ideale per avere una panoramica completa dell'itinerario giorno per giorno.

### 2. Vista Calendario

La vista calendario mostra le attività in un formato simile a un calendario, con:
- Giorni visualizzati in formato griglia
- Attività mostrate come eventi all'interno di ogni giorno
- Possibilità di vedere la durata delle attività visivamente

Questa vista è utile per avere una visione d'insieme dell'intero viaggio e identificare rapidamente i giorni più o meno impegnati.

### 3. Vista Mappa

La vista mappa mostra tutte le attività dell'itinerario su una mappa interattiva, con:
- Marker colorati in base al tipo di attività
- Numerazione progressiva delle attività
- Popup informativi con dettagli dell'attività al passaggio del mouse
- Possibilità di visualizzare i dettagli completi cliccando su un marker
- Aggiornamento delle coordinate direttamente dalla mappa

Questa vista è particolarmente utile per:
- Visualizzare la distribuzione geografica delle attività
- Pianificare gli spostamenti tra le diverse location
- Identificare attività vicine tra loro
- Ottimizzare i percorsi giornalieri

## Componenti Principali

- `ItineraryMapView.tsx`: Componente che visualizza tutte le attività dell'itinerario su una mappa interattiva
- `CalendarView.tsx`: Componente che visualizza le attività in formato calendario
- `DaySchedule.tsx`: Componente che visualizza le attività di un singolo giorno in formato lista
- `ActivityDetailsModal.tsx`: Modale per visualizzare i dettagli completi di un'attività
- `ActivityModal.tsx`: Modale per aggiungere o modificare un'attività
- `DayModal.tsx`: Modale per aggiungere o modificare un giorno
- `MoveActivityModal.tsx`: Modale per spostare un'attività da un giorno all'altro

## Funzionalità Principali

- Aggiunta, modifica ed eliminazione di giorni e attività
- Visualizzazione delle attività in diversi formati (lista, calendario, mappa)
- Spostamento delle attività tra giorni diversi
- Visualizzazione dei dettagli completi delle attività
- Geocodifica automatica delle location per visualizzarle sulla mappa
- Autocompletamento degli indirizzi con suggerimenti da Mapbox
- Aggiornamento delle coordinate delle attività direttamente dalla mappa
- Popup informativi migliorati con dettagli ben leggibili
