// Italian is the source of truth for the message schema: `en` must satisfy `Messages`.
const it = {
  app: {
    name: 'Expenses manager',
    skipToContent: 'Vai al contenuto',
    loading: 'Caricamento in corso',
  },
  nav: {
    label: 'Navigazione principale',
    dashboard: 'Panoramica',
    expenses: 'Spese',
    categories: 'Categorie',
    settings: 'Impostazioni',
  },
  auth: {
    email: 'Email',
    password: 'Password',
    name: 'Nome',
    login: {
      title: 'Accedi',
      subtitle: 'Bentornato. Accedi per vedere le tue spese.',
      submit: 'Accedi',
      switchPrompt: 'Non hai un account?',
      switchAction: 'Registrati',
    },
    register: {
      title: 'Crea un account',
      subtitle: 'Bastano pochi secondi per iniziare a tenere traccia delle spese.',
      passwordHint: 'Almeno 8 caratteri.',
      submit: 'Crea account',
      switchPrompt: 'Hai già un account?',
      switchAction: 'Accedi',
    },
  },
  dashboard: {
    title: 'Panoramica',
    empty: {
      title: 'Ancora nessun dato',
      description: 'Quando registrerai le prime spese, qui vedrai come stai spendendo.',
    },
  },
  expenses: {
    title: 'Spese',
    empty: {
      title: 'Nessuna spesa registrata',
      description: 'Le spese che aggiungerai compariranno qui, raggruppate per giorno.',
    },
    notices: {
      createFailed: 'Impossibile salvare la spesa. La modifica è stata annullata.',
      updateFailed: 'Impossibile aggiornare la spesa. La modifica è stata annullata.',
      deleteFailed: 'Impossibile eliminare la spesa. La modifica è stata annullata.',
      loadMoreFailed: 'Impossibile caricare altre spese.',
    },
    form: {
      errors: {
        amountInvalid: 'Inserisci un importo maggiore di zero con al massimo due decimali.',
        descriptionRequired: 'Inserisci una descrizione.',
        descriptionTooLong: 'Usa al massimo 255 caratteri.',
        categoryRequired: 'Scegli una categoria.',
        dateInvalid: 'Inserisci una data valida.',
      },
    },
  },
  categories: {
    title: 'Categorie',
    empty: {
      title: 'Nessuna categoria',
      description: 'Le categorie ti aiutano a capire dove vanno i tuoi soldi.',
    },
    colors: {
      ocean: 'Oceano',
      brick: 'Mattone',
      slate: 'Ardesia',
      amber: 'Ambra',
      moss: 'Muschio',
      plum: 'Prugna',
      indigo: 'Indaco',
      rust: 'Ruggine',
    },
    notices: {
      createFailed: 'Impossibile creare la categoria. La modifica è stata annullata.',
      updateFailed: 'Impossibile aggiornare la categoria. La modifica è stata annullata.',
      archiveFailed: 'Impossibile archiviare la categoria. La modifica è stata annullata.',
      unarchiveFailed: 'Impossibile ripristinare la categoria. La modifica è stata annullata.',
      deleteFailed: 'Impossibile eliminare la categoria. La modifica è stata annullata.',
      deleteInUse:
        'Questa categoria è usata da alcune spese e non può essere eliminata. Archiviala invece.',
    },
    form: {
      errors: {
        nameRequired: 'Inserisci un nome.',
        nameTooLong: 'Usa al massimo 60 caratteri.',
        colorInvalid: 'Scegli un colore.',
        iconInvalid: 'Scegli un’icona.',
      },
    },
  },
  settings: {
    title: 'Impostazioni',
    language: {
      label: 'Lingua',
      description: 'La scelta viene ricordata su questo dispositivo e nel tuo account.',
    },
    account: {
      title: 'Account',
      logout: 'Esci',
    },
  },
  errors: {
    network: 'Impossibile raggiungere il server. Controlla la connessione e riprova.',
    unknown: 'Qualcosa è andato storto. Riprova tra poco.',
    sessionExpired: 'La sessione è scaduta. Accedi di nuovo.',
  },
}

export type Messages = typeof it
export default it
