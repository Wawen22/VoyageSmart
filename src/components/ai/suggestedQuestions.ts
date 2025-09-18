import { SuggestedQuestion, TripData } from './types';

export const generateSuggestedQuestions = (
  currentSection: string,
  tripData: TripData | undefined,
  setInput: (input: string) => void,
  handleSendMessage: (message: string) => void,
  setSuggestedQuestions: (questions: SuggestedQuestion[]) => void
) => {
  const questions: SuggestedQuestion[] = [];
  const crossSectionQuestions: SuggestedQuestion[] = [];

  // Suggerimenti specifici per sezione
  switch (currentSection) {
    case 'expenses':
      // Suggerimenti specifici per spese
      if (tripData?.expenses && tripData.expenses.length > 0) {
        questions.push({
          text: "Riepilogo spese",
          action: () => {
            const question = "Mostrami un riepilogo delle mie spese";
            setInput(question);
            handleSendMessage(question);
          }
        });

        questions.push({
          text: "Spese per categoria",
          action: () => {
            const question = "Come sono distribuite le spese per categoria?";
            setInput(question);
            handleSendMessage(question);
          }
        });

        questions.push({
          text: "Saldi partecipanti",
          action: () => {
            const question = "Mostrami i saldi tra i partecipanti";
            setInput(question);
            handleSendMessage(question);
          }
        });
      }
      break;

    case 'itinerary':
      // Suggerimenti specifici per itinerario
      if (tripData?.itinerary && tripData.itinerary.length > 0) {
        questions.push({
          text: "Programma di oggi",
          action: () => {
            const question = "Cosa ho in programma oggi?";
            setInput(question);
            handleSendMessage(question);
          }
        });

        questions.push({
          text: "Attività consigliate",
          action: () => {
            const question = "Suggeriscimi altre attività per il mio viaggio";
            setInput(question);
            handleSendMessage(question);
          }
        });
      } else {
        questions.push({
          text: "Crea itinerario",
          action: () => {
            const question = "Aiutami a creare un itinerario per il mio viaggio";
            setInput(question);
            handleSendMessage(question);
          }
        });

        questions.push({
          text: "Cosa posso fare a " + (tripData?.destination || "destinazione"),
          action: () => {
            const question = "Cosa posso fare a " + (tripData?.destination || "destinazione") + "?";
            setInput(question);
            handleSendMessage(question);
          }
        });
      }
      break;

    case 'accommodations':
      // Suggerimenti specifici per alloggi
      if (tripData?.accommodations && tripData.accommodations.length > 0) {
        questions.push({
          text: "Dettagli alloggi",
          action: () => {
            const question = "Mostrami i dettagli dei miei alloggi";
            setInput(question);
            handleSendMessage(question);
          }
        });

        questions.push({
          text: "Check-in/Check-out",
          action: () => {
            const question = "Quando sono i check-in e check-out?";
            setInput(question);
            handleSendMessage(question);
          }
        });
      }
      break;

    case 'transportation':
      // Suggerimenti specifici per trasporti
      if (tripData?.transportation && tripData.transportation.length > 0) {
        questions.push({
          text: "Info trasporti",
          action: () => {
            const question = "Mostrami le informazioni sui miei trasporti";
            setInput(question);
            handleSendMessage(question);
          }
        });

        questions.push({
          text: "Orari partenza",
          action: () => {
            const question = "Quali sono gli orari di partenza dei miei trasporti?";
            setInput(question);
            handleSendMessage(question);
          }
        });
      }
      break;

    default:
      // Suggerimenti generali per overview o altre sezioni
      questions.push({
        text: "Panoramica viaggio",
        action: () => {
          const question = "Dammi una panoramica completa del mio viaggio";
          setInput(question);
          handleSendMessage(question);
        }
      });

      questions.push({
        text: "Cosa posso fare a " + (tripData?.destination || "destinazione"),
        action: () => {
          const question = "Cosa posso fare a " + (tripData?.destination || "destinazione") + "?";
          setInput(question);
          handleSendMessage(question);
        }
      });
  }

  // Aggiungi sempre suggerimenti cross-section utili (se non siamo già in quella sezione)

  // Alloggi (sempre utile)
  if (currentSection !== 'accommodations') {
    crossSectionQuestions.push({
      text: "Alloggi",
      action: () => {
        const question = "Mostrami i miei alloggi";
        setInput(question);
        handleSendMessage(question);
      }
    });
  }

  // Trasporti (sempre utile)
  if (currentSection !== 'transportation') {
    crossSectionQuestions.push({
      text: "Trasporti",
      action: () => {
        const question = "Mostrami i miei trasporti";
        setInput(question);
        handleSendMessage(question);
      }
    });
  }

  // Spese (sempre utile)
  if (currentSection !== 'expenses') {
    crossSectionQuestions.push({
      text: "Spese",
      action: () => {
        const question = "Mostrami le mie spese";
        setInput(question);
        handleSendMessage(question);
      }
    });
  }

  // Itinerario (sempre utile)
  if (currentSection !== 'itinerary') {
    crossSectionQuestions.push({
      text: "Itinerario",
      action: () => {
        const question = "Mostrami il mio itinerario";
        setInput(question);
        handleSendMessage(question);
      }
    });
  }

  // Panoramica generale (sempre utile)
  crossSectionQuestions.push({
    text: "Panoramica viaggio",
    action: () => {
      const question = "Dammi una panoramica del mio viaggio";
      setInput(question);
      handleSendMessage(question);
    }
  });

  // Combina suggerimenti specifici con quelli principali
  // Massimo 5 suggerimenti totali per non occupare troppo spazio
  const maxTotal = 5;
  const maxSpecific = Math.min(questions.length, 2); // Max 2 specifici
  const maxCrossSection = Math.min(crossSectionQuestions.length, maxTotal - maxSpecific);

  const finalQuestions = [
    ...questions.slice(0, maxSpecific),
    ...crossSectionQuestions.slice(0, maxCrossSection)
  ];

  setSuggestedQuestions(finalQuestions);
};
