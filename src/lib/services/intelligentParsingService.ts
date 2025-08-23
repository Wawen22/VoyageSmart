/**
 * Intelligent Parsing Service
 * Servizio per interpretare intelligentemente le risposte dell'utente
 */

import { parse, format, isValid } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Interpreta una data scritta in linguaggio naturale
 */
export function parseNaturalDate(input: string): string | null {
  const cleanInput = input.toLowerCase().trim();
  
  // Patterns per date in italiano
  const datePatterns = [
    // Formato ISO: 2025-04-25
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // Formato europeo: 25/04/2025, 25-04-2025
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // Formato americano: 04/25/2025
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  ];

  // Prova i pattern numerici
  for (const pattern of datePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      let year, month, day;
      
      if (pattern === datePatterns[0]) { // ISO format
        [, year, month, day] = match;
      } else if (pattern === datePatterns[1]) { // European format
        [, day, month, year] = match;
      } else { // American format
        [, month, day, year] = match;
      }
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
    }
  }

  // Pattern per date in linguaggio naturale italiano
  const naturalPatterns = [
    // "25 aprile 2025", "25 aprile", "aprile 25"
    /(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?/,
    // "aprile 25 2025", "aprile 25"
    /(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{1,2})(?:\s+(\d{4}))?/
  ];

  const monthMap: Record<string, number> = {
    gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
    luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12
  };

  for (const pattern of naturalPatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      let day: number, month: number, year: number;
      const currentYear = new Date().getFullYear();
      
      if (pattern === naturalPatterns[0]) {
        // "25 aprile 2025"
        day = parseInt(match[1]);
        month = monthMap[match[2]];
        year = match[3] ? parseInt(match[3]) : currentYear;
      } else {
        // "aprile 25 2025"
        month = monthMap[match[1]];
        day = parseInt(match[2]);
        year = match[3] ? parseInt(match[3]) : currentYear;
      }
      
      const date = new Date(year, month - 1, day);
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
    }
  }

  // Pattern per date relative
  const today = new Date();
  const relativePatterns = [
    { pattern: /oggi/, offset: 0 },
    { pattern: /domani/, offset: 1 },
    { pattern: /dopodomani/, offset: 2 },
    { pattern: /fra (\d+) giorni?/, offset: null },
    { pattern: /tra (\d+) giorni?/, offset: null }
  ];

  for (const { pattern, offset } of relativePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      let targetDate: Date;
      
      if (offset !== null) {
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + offset);
      } else {
        // Pattern con numero di giorni
        const days = parseInt(match[1]);
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + days);
      }
      
      return format(targetDate, 'yyyy-MM-dd');
    }
  }

  return null;
}

/**
 * Interpreta il tipo di accommodation
 */
export function parseAccommodationType(input: string): string | null {
  const cleanInput = input.toLowerCase().trim();
  console.log('=== parseAccommodationType ===');
  console.log('Input:', input);
  console.log('Clean input:', cleanInput);

  // Prima controlla se è un valore diretto valido
  const validTypes = ['hotel', 'apartment', 'hostel', 'house', 'villa', 'resort', 'camping', 'other'];
  console.log('Valid types:', validTypes);
  console.log('Checking if cleanInput is in validTypes:', validTypes.includes(cleanInput));

  if (validTypes.includes(cleanInput)) {
    console.log(`✅ Direct match found! Returning: ${cleanInput}`);
    return cleanInput;
  }

  const typeMap: Record<string, string[]> = {
    hotel: ['hotel', 'albergo', 'grand hotel', 'boutique hotel'],
    apartment: ['appartamento', 'casa', 'airbnb', 'casa vacanze', 'appartamentino', 'monolocale', 'bilocale'],
    hostel: ['ostello', 'hostel', 'backpacker'],
    house: ['casa', 'villetta', 'casetta', 'abitazione'],
    villa: ['villa', 'villa di lusso', 'dimora'],
    resort: ['resort', 'villaggio turistico', 'club'],
    camping: ['camping', 'campeggio', 'camper', 'tenda'],
    other: ['altro', 'diverso', 'non so']
  };

  // Cerca corrispondenze esatte o parziali
  for (const [type, keywords] of Object.entries(typeMap)) {
    for (const keyword of keywords) {
      console.log(`Checking if "${cleanInput}" includes "${keyword}"`);
      if (cleanInput.includes(keyword)) {
        console.log(`Match found! Returning: ${type}`);
        return type;
      }
    }
  }

  console.log('No match found, returning null');
  return null;
}

/**
 * Interpreta la valuta
 */
export function parseCurrency(input: string): string | null {
  const cleanInput = input.toLowerCase().trim();
  console.log('=== parseCurrency ===');
  console.log('Input:', input);
  console.log('Clean input:', cleanInput);

  // Prima controlla se è un codice valuta diretto
  const validCurrencies = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD'];
  const upperInput = cleanInput.toUpperCase();
  console.log('Upper input:', upperInput);
  console.log('Valid currencies:', validCurrencies);
  console.log('Is valid currency:', validCurrencies.includes(upperInput));

  if (validCurrencies.includes(upperInput)) {
    console.log(`✅ Direct currency match found! Returning: ${upperInput}`);
    return upperInput;
  }

  const currencyMap: Record<string, string[]> = {
    EUR: ['euro', 'eur', '€', 'europa'],
    USD: ['dollaro', 'usd', '$', 'dollar', 'americano'],
    GBP: ['sterlina', 'gbp', '£', 'pound', 'inglese', 'britannica'],
    CHF: ['franco', 'chf', 'svizzero', 'svizzera'],
    JPY: ['yen', 'jpy', '¥', 'giapponese'],
    CAD: ['dollaro canadese', 'cad', 'canadese']
  };

  for (const [currency, keywords] of Object.entries(currencyMap)) {
    for (const keyword of keywords) {
      console.log(`Checking if "${cleanInput}" includes "${keyword}"`);
      if (cleanInput.includes(keyword)) {
        console.log(`Currency match found! Returning: ${currency}`);
        return currency;
      }
    }
  }

  console.log('No currency match found, returning null');
  return null;
}

/**
 * Interpreta un numero/costo, possibilmente con valuta
 */
export function parseNumber(input: string): number | null {
  const cleanInput = input.replace(/[^\d.,]/g, '').replace(',', '.');
  const number = parseFloat(cleanInput);

  if (isNaN(number) || number < 0) {
    return null;
  }

  return number;
}

/**
 * Interpreta costo e valuta insieme (es. "320 euro", "150 USD")
 */
export function parseCostWithCurrency(input: string): {
  cost: number | null;
  currency: string | null;
} {
  const cleanInput = input.trim();
  console.log('=== parseCostWithCurrency ===');
  console.log('Input:', cleanInput);

  // Pattern per riconoscere numero + valuta
  const patterns = [
    // "320 euro", "150 dollari", "50 sterline"
    /(\d+(?:[.,]\d+)?)\s*(euro|eur|€|dollaro|dollari|usd|\$|sterlina|sterline|gbp|£|franco|franchi|chf|yen|jpy|¥)/i,
    // "€320", "$150", "£50"
    /(€|\$|£|¥)\s*(\d+(?:[.,]\d+)?)/i,
    // Solo numero
    /^(\d+(?:[.,]\d+)?)$/
  ];

  for (const pattern of patterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      let cost: number;
      let currencyText: string;

      if (pattern === patterns[0]) {
        // Numero + valuta testuale
        cost = parseFloat(match[1].replace(',', '.'));
        currencyText = match[2].toLowerCase();
      } else if (pattern === patterns[1]) {
        // Simbolo + numero
        currencyText = match[1];
        cost = parseFloat(match[2].replace(',', '.'));
      } else {
        // Solo numero
        cost = parseFloat(match[1].replace(',', '.'));
        console.log('Only number found:', cost);
        return { cost, currency: null };
      }

      // Mappa i simboli e testi alle valute
      const currencyMap: Record<string, string> = {
        'euro': 'EUR', 'eur': 'EUR', '€': 'EUR',
        'dollaro': 'USD', 'dollari': 'USD', 'usd': 'USD', '$': 'USD',
        'sterlina': 'GBP', 'sterline': 'GBP', 'gbp': 'GBP', '£': 'GBP',
        'franco': 'CHF', 'franchi': 'CHF', 'chf': 'CHF',
        'yen': 'JPY', 'jpy': 'JPY', '¥': 'JPY'
      };

      const currency = currencyMap[currencyText] || null;
      console.log('Parsed cost:', cost, 'currency:', currency);

      if (!isNaN(cost) && cost >= 0) {
        return { cost, currency };
      }
    }
  }

  console.log('No cost/currency pattern matched');
  return { cost: null, currency: null };
}

/**
 * Interpreta risposte di conferma
 */
export function parseConfirmation(input: string): boolean | null {
  const cleanInput = input.toLowerCase().trim();
  
  const positiveResponses = [
    'sì', 'si', 'yes', 'ok', 'okay', 'va bene', 'perfetto', 'confermo', 
    'conferma', 'salva', 'procedi', 'continua', 'esatto', 'corretto', 'giusto'
  ];
  
  const negativeResponses = [
    'no', 'non', 'annulla', 'cancel', 'stop', 'ferma', 'sbagliato', 
    'non salvare', 'non va bene', 'non confermo'
  ];

  // Controlla risposte positive
  for (const response of positiveResponses) {
    if (cleanInput.includes(response)) {
      return true;
    }
  }

  // Controlla risposte negative
  for (const response of negativeResponses) {
    if (cleanInput.includes(response)) {
      return false;
    }
  }

  return null;
}

/**
 * Estrae informazioni di contatto (email, telefono)
 */
export function parseContactInfo(input: string): string | null {
  const cleanInput = input.trim();
  
  // Pattern per email
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = cleanInput.match(emailPattern);
  
  // Pattern per telefono (vari formati)
  const phonePatterns = [
    /\+?\d{1,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/,
    /\d{3}[\s\-]?\d{3}[\s\-]?\d{4}/,
    /\d{10,}/
  ];
  
  let phoneMatch = null;
  for (const pattern of phonePatterns) {
    phoneMatch = cleanInput.match(pattern);
    if (phoneMatch) break;
  }

  // Combina email e telefono se presenti
  const parts = [];
  if (emailMatch) parts.push(emailMatch[0]);
  if (phoneMatch) parts.push(phoneMatch[0]);
  
  if (parts.length > 0) {
    return parts.join(' - ');
  }

  // Se non trova pattern specifici ma c'è del testo, restituisce il testo
  if (cleanInput.length > 0) {
    return cleanInput;
  }

  return null;
}

/**
 * Funzione principale per interpretare intelligentemente le risposte
 */
export function intelligentParse(input: string, fieldType: string): {
  success: boolean;
  value: any;
  confidence: number;
  suggestion?: string;
} {
  const cleanInput = input.trim();
  
  if (!cleanInput) {
    return { success: false, value: null, confidence: 0 };
  }

  switch (fieldType) {
    case 'date':
      const date = parseNaturalDate(cleanInput);
      return {
        success: !!date,
        value: date,
        confidence: date ? 0.9 : 0,
        suggestion: date ? `Interpretato come: ${format(new Date(date), 'dd MMMM yyyy', { locale: it })}` : undefined
      };

    case 'datetime':
      const datetime = parseNaturalDateTime(cleanInput);
      return {
        success: !!datetime,
        value: datetime,
        confidence: datetime ? 0.9 : 0,
        suggestion: datetime ? `Interpretato come: ${format(new Date(datetime), 'dd MMMM yyyy HH:mm', { locale: it })}` : undefined
      };

    case 'accommodation_type':
      console.log('=== Parsing accommodation type ===');
      console.log('Clean input:', cleanInput);
      const type = parseAccommodationType(cleanInput);
      console.log('Parsed type:', type);
      return {
        success: !!type,
        value: type,
        confidence: type ? 0.8 : 0,
        suggestion: type ? `Interpretato come: ${type}` : undefined
      };

    case 'transportation_type':
      const transportType = parseTransportationType(cleanInput);
      return {
        success: !!transportType,
        value: transportType,
        confidence: transportType ? 0.8 : 0,
        suggestion: transportType ? `Interpretato come: ${transportType}` : undefined
      };

    case 'time':
      const time = parseTime(cleanInput);
      return {
        success: !!time,
        value: time,
        confidence: time ? 0.9 : 0,
        suggestion: time ? `Interpretato come: ${time}` : undefined
      };

    case 'location':
      const location = parseLocation(cleanInput);
      return {
        success: !!location,
        value: location,
        confidence: location ? 0.7 : 0,
        suggestion: location ? `Interpretato come: ${location}` : undefined
      };

    case 'currency':
      const currency = parseCurrency(cleanInput);
      return {
        success: !!currency,
        value: currency,
        confidence: currency ? 0.9 : 0,
        suggestion: currency ? `Interpretato come: ${currency}` : undefined
      };

    case 'number':
      // Prova prima il parsing avanzato costo+valuta
      const costWithCurrency = parseCostWithCurrency(cleanInput);
      if (costWithCurrency.cost !== null) {
        const result = {
          success: true,
          value: costWithCurrency.cost,
          confidence: 0.9,
          suggestion: costWithCurrency.currency
            ? `Interpretato come: ${costWithCurrency.cost} ${costWithCurrency.currency}`
            : `Interpretato come: ${costWithCurrency.cost}`,
          additionalData: costWithCurrency.currency ? { currency: costWithCurrency.currency } : undefined
        };
        return result;
      }

      // Fallback al parsing semplice
      const number = parseNumber(cleanInput);
      return {
        success: number !== null,
        value: number,
        confidence: number !== null ? 0.9 : 0,
        suggestion: number !== null ? `Interpretato come: ${number}` : undefined
      };

    case 'confirmation':
      const confirmation = parseConfirmation(cleanInput);
      return {
        success: confirmation !== null,
        value: confirmation,
        confidence: confirmation !== null ? 0.95 : 0,
        suggestion: confirmation !== null ? `Interpretato come: ${confirmation ? 'Sì' : 'No'}` : undefined
      };

    case 'contact':
      const contact = parseContactInfo(cleanInput);
      return {
        success: !!contact,
        value: contact,
        confidence: contact ? 0.7 : 0,
        suggestion: contact ? `Interpretato come: ${contact}` : undefined
      };

    default:
      // Per campi di testo libero (nome, indirizzo, note)
      return {
        success: true,
        value: cleanInput,
        confidence: 1.0
      };
  }
}

/**
 * Parsing per data e ora naturale (es: "domani alle 14:30", "15 gennaio ore 9:00")
 */
export function parseNaturalDateTime(input: string): string | null {
  const cleanInput = input.toLowerCase().trim();
  console.log('=== parseNaturalDateTime ===');
  console.log('Input:', input);

  // Pattern per data + ora (es: "domani alle 14:30", "15 gennaio ore 9:00")
  const dateTimePatterns = [
    // "domani alle 14:30"
    /^(domani|oggi|dopodomani)\s+alle?\s+(\d{1,2})[:\.](\d{2})$/i,
    // "15 gennaio alle 14:30"
    /^(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+alle?\s+(\d{1,2})[:\.](\d{2})$/i,
    // "2024-01-15 14:30"
    /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2})[:\.](\d{2})$/i,
    // "15/01/2024 14:30"
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2})[:\.](\d{2})$/i
  ];

  for (const pattern of dateTimePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      console.log('DateTime pattern matched:', match);

      // Prova a parsare la data
      let dateStr = '';
      let timeStr = '';

      if (match[1] === 'oggi' || match[1] === 'domani' || match[1] === 'dopodomani') {
        // Gestisci parole relative
        const today = new Date();
        if (match[1] === 'domani') {
          today.setDate(today.getDate() + 1);
        } else if (match[1] === 'dopodomani') {
          today.setDate(today.getDate() + 2);
        }
        dateStr = today.toISOString().split('T')[0];
        timeStr = `${match[2].padStart(2, '0')}:${match[3].padStart(2, '0')}`;
      } else {
        // Altri pattern - usa il parsing esistente per la data e aggiungi l'ora
        const datePart = match[0].replace(/\s+alle?\s+\d{1,2}[:\.]?\d{2}$/i, '');
        const parsedDate = parseNaturalDate(datePart);
        if (parsedDate) {
          dateStr = parsedDate.split('T')[0];
          const timeMatch = match[0].match(/(\d{1,2})[:\.](\d{2})$/);
          if (timeMatch) {
            timeStr = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2].padStart(2, '0')}`;
          }
        }
      }

      if (dateStr && timeStr) {
        const result = `${dateStr}T${timeStr}:00.000Z`;
        console.log('Parsed datetime:', result);
        return result;
      }
    }
  }

  // Fallback: prova solo la data se non c'è ora
  const dateOnly = parseNaturalDate(cleanInput);
  if (dateOnly) {
    console.log('Fallback to date only:', dateOnly);
    return dateOnly;
  }

  console.log('No datetime match found');
  return null;
}

/**
 * Parsing per tipo di trasporto
 */
export function parseTransportationType(input: string): string | null {
  const cleanInput = input.toLowerCase().trim();
  console.log('=== parseTransportationType ===');
  console.log('Input:', input);
  console.log('Clean input:', cleanInput);

  // Prima controlla se è un valore diretto valido
  const validTypes = ['flight', 'train', 'bus', 'car', 'other'];
  console.log('Valid types:', validTypes);
  console.log('Checking if cleanInput is in validTypes:', validTypes.includes(cleanInput));

  if (validTypes.includes(cleanInput)) {
    console.log(`✅ Direct match found! Returning: ${cleanInput}`);
    return cleanInput;
  }

  const transportTypes = {
    'flight': ['volo', 'aereo', 'flight', 'plane'],
    'train': ['treno', 'train', 'ferrovia', 'trenitalia', 'italo'],
    'bus': ['autobus', 'bus', 'pullman', 'corriera'],
    'car': ['macchina', 'auto', 'automobile', 'car', 'veicolo', 'privata'],
    'other': ['altro', 'other']
  };

  // Cerca corrispondenze esatte o parziali
  for (const [type, keywords] of Object.entries(transportTypes)) {
    for (const keyword of keywords) {
      console.log(`Checking if "${cleanInput}" includes "${keyword}"`);
      if (cleanInput.includes(keyword)) {
        console.log(`Match found! Returning: ${type}`);
        return type;
      }
    }
  }

  console.log('No match found, returning null');
  return null;
}

/**
 * Parsing per orario
 */
export function parseTime(input: string): string | null {
  const cleanInput = input.toLowerCase().trim();

  // Pattern per orari: 20:30, 20.30, 8:30 PM, ore 20, alle 20:30
  const timePatterns = [
    /(\d{1,2})[:\.](\d{2})/,           // 20:30, 20.30
    /ore\s+(\d{1,2})[:\.]?(\d{2})?/,  // ore 20:30, ore 20
    /alle\s+(\d{1,2})[:\.]?(\d{2})?/, // alle 20:30, alle 20
    /(\d{1,2})\s*[:\.]?\s*(\d{2})?\s*(am|pm)/i // 8:30 PM, 8 PM
  ];

  for (const pattern of timePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      let minutes = match[2] ? parseInt(match[2]) : 0;

      // Gestione AM/PM
      if (match[3]) {
        const ampm = match[3].toLowerCase();
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
      }

      // Validazione
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
  }

  return null;
}

/**
 * Parsing per località
 */
export function parseLocation(input: string): string | null {
  const cleanInput = input.trim();

  // Rimuovi preposizioni comuni
  const cleanedLocation = cleanInput
    .replace(/^(da|a|per|verso|in|di|del|della|dello|dei|degli|delle)\s+/i, '')
    .replace(/\s+(da|a|per|verso|in|di|del|della|dello|dei|degli|delle)$/i, '');

  // Se rimane qualcosa di sensato, restituiscilo
  if (cleanedLocation.length > 1) {
    // Capitalizza la prima lettera
    return cleanedLocation.charAt(0).toUpperCase() + cleanedLocation.slice(1).toLowerCase();
  }

  return null;
}

/**
 * Parsing multi-campo per trasporti - interpreta una frase completa
 */
export function parseTransportationMultiField(input: string): Partial<any> {
  const cleanInput = input.toLowerCase().trim();
  console.log('=== parseTransportationMultiField ===');
  console.log('Input:', input);

  const result: any = {};

  // 1. Tipo di trasporto
  const type = parseTransportationType(cleanInput);
  if (type) {
    result.type = type;
    console.log('Parsed type:', type);
  }

  // 2. Località di partenza (da, parte da, partenza da)
  const departurePatterns = [
    /(?:da|parte da|partenza da|partendo da)\s+([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+(?:alle|a|verso|per|arriva|arrivo|il|del|\d))/i,
    /(?:da|parte da|partenza da|partendo da)\s+([^,]+?)(?:\s*,|\s*$)/i
  ];

  for (const pattern of departurePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      const location = parseLocation(match[1]);
      if (location) {
        result.departure_location = location;
        console.log('Parsed departure:', location);
        break;
      }
    }
  }

  // 3. Località di arrivo (a, arriva a, arrivo a, per)
  const arrivalPatterns = [
    /(?:arriva a|arrivo a|verso|per|a)\s+([^,\s]+(?:\s+[^,\s]+)*?)(?:\s+(?:alle|a|il|del|\d))/i,
    /(?:arriva a|arrivo a|verso|per|a)\s+([^,]+?)(?:\s*,|\s*$)/i
  ];

  for (const pattern of arrivalPatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      const location = parseLocation(match[1]);
      if (location) {
        result.arrival_location = location;
        console.log('Parsed arrival:', location);
        break;
      }
    }
  }

  // 4. Orario di partenza (alle X, parte alle X)
  const departureTimePatterns = [
    /(?:parte|partenza)\s+alle\s+(\d{1,2}[:\.]?\d{0,2})/i,
    /alle\s+(\d{1,2}[:\.]?\d{0,2})(?:\s+(?:e|,))/i,
    /alle\s+(\d{1,2}[:\.]?\d{0,2})(?:\s*$)/i
  ];

  for (const pattern of departureTimePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      const time = parseTime(match[1]);
      if (time) {
        result.departure_time = time;
        console.log('Parsed departure time:', time);
        break;
      }
    }
  }

  // 5. Orario di arrivo (arriva alle X)
  const arrivalTimePatterns = [
    /(?:arriva|arrivo)\s+alle\s+(\d{1,2}[:\.]?\d{0,2})/i,
    /alle\s+(\d{1,2}[:\.]?\d{0,2})(?:\s+(?:del|il))/i
  ];

  for (const pattern of arrivalTimePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      const time = parseTime(match[1]);
      if (time) {
        result.arrival_time = time;
        console.log('Parsed arrival time:', time);
        break;
      }
    }
  }

  // 6. Data (del 25 aprile, il 25 aprile, 25/04/2025)
  const datePatterns = [
    /(?:del|il)\s+(\d{1,2}\s+\w+)/i,
    /(?:del|il)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i
  ];

  for (const pattern of datePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      const date = parseNaturalDate(match[1]);
      if (date) {
        result.departure_date = date;
        result.arrival_date = date; // Assumiamo stesso giorno se non specificato diversamente
        console.log('Parsed date:', date);
        break;
      }
    }
  }

  // 7. Costo (costa X euro, X euro)
  const costPatterns = [
    /(?:costa|costo|prezzo)\s+(\d+(?:[,\.]\d{2})?)\s*(euro|€|dollar|\$)/i,
    /(\d+(?:[,\.]\d{2})?)\s*(euro|€|dollar|\$)/i
  ];

  for (const pattern of costPatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      const cost = parseFloat(match[1].replace(',', '.'));
      const currency = match[2].toLowerCase();

      if (!isNaN(cost)) {
        result.cost = cost;

        // Mappa valuta
        if (currency.includes('euro') || currency.includes('€')) {
          result.currency = 'EUR';
        } else if (currency.includes('dollar') || currency.includes('$')) {
          result.currency = 'USD';
        }

        console.log('Parsed cost:', cost, result.currency);
        break;
      }
    }
  }

  console.log('=== Multi-field parsing result ===', result);
  return result;
}
