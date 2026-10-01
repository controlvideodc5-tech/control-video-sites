window.CV_BOT_SCRIPT = {

  header: {
    title: 'Plan your event',
    shortTitle: 'Plan your event',
    subtitle: 'A few details help {site} build the right plan',
    messageButton: 'Just send a message'
  },

  steps: {

    name: {
      say: [
        'Hi — I’m {site}’s event planning assistant. I’ll ask a few quick questions so our team can understand what you need.',
        'What should I call you?'
      ],
      placeholder: 'Your first name',
      messageInstead: 'Just send a message instead'
    },

    contact: {
      say: ['Thanks, {name}. What’s the best email or phone number to reach you?'],
      placeholder: 'Email or phone',
      badEmail: 'That email doesn’t look quite right. Could you check it?',
      badPhone: 'Please enter an email address or a phone number with area code.'
    },

    organization: {
      say: ['Who are you planning this event for?'],
      placeholder: 'Organization or client',
      skip: 'Just me'
    },

    headcount: {
      say: [
        '1 of 5 · How many people do you expect?',
        'A rough number or range helps us plan the screens, equipment, and crew.'
      ],
      placeholder: 'e.g. 400 or 300–500',
      skip: 'Not sure'
    },
    headcountIs: {
      say: ['How firm is that number?'],
      options: ['Confirmed', 'Capacity cap', 'Best guess']
    },

    venue: {
      say: ['2 of 5 · Where will the event take place?', 'Share the venue and room, if you know them.'],
      placeholder: 'e.g. Mellon Auditorium, main hall',
      skip: 'Not booked yet'
    },
    setting: {
      say: ['Will it be indoors, outdoors, or a mix? This helps us plan for power, weather, and rigging.'],
      options: ['Indoor', 'Outdoor', 'Both']
    },

    showTime: {
      say: ['3 of 5 · When is the event? Include the date and start time if you know them.'],
      placeholder: 'e.g. Fri Mar 14, 7 pm',
      skip: 'Not set yet'
    },
    loadIn: {
      say: ['When can our crew access the venue to set up?'],
      placeholder: 'e.g. Mar 14, 8 am',
      skip: 'Don’t know yet'
    },
    outBy: {
      say: ['When does everything need to be cleared out?'],
      placeholder: 'e.g. midnight',
      skip: 'Don’t know yet'
    },

    seeHear: {
      say: [
        '4 of 5 · What should guests see and hear?',
        'Choose everything you’re considering. You can include “Not sure yet.”'
      ],
      options: ['LED wall', 'Projection', 'Screens / TVs', 'Cameras on screen', 'Livestream',
                'Recording', 'Audio', 'Lighting', 'Stage', 'LED truck or trailer', 'Not sure yet'],
      done: 'Done'
    },

    mustLand: {
      say: ['5 of 5 · What’s the one moment that matters most?', 'Knowing what has to go smoothly helps us shape the plan around it.'],
      placeholder: 'e.g. The keynote walk-on at 7:30',
      skip: 'Skip'
    },

    budget: {
      say: ['Do you have a budget range in mind? It helps us suggest options that fit.'],
      options: ['Under $10k', '$10k–25k', '$25k–50k', '$50k+', 'Not set']
    },

    files: {
      say: ['Have a floor plan or run of show? Upload it or paste a link.'],
      placeholder: 'Paste a link, or tap Add files',
      addButton: 'Add files',
      noneButton: 'Nothing to send',
      doneButton: 'That’s everything',
      gotOne: 'Got it. Anything else to share?',
      gotMany: 'Got them. Anything else to share?',
      gotNone: 'I couldn’t accept that file. Check the note beside it, or paste a link instead.'
    },

    answer: {
      say: ['One quick check to keep the robots out: {question}'],
      placeholder: 'Answer'
    },

    confirm: {
      say: ['Here’s what I’ve got:', '{summary}', 'Ready to send this to our team?'],
      sayEmail: ['Here’s what I’ve got:', '{summary}', 'Online sending isn’t available right now. I’ll open an email with your details filled in; just review it and press send.'],
      attachNote: 'Remember to attach your files to the email.',
      sendButton: 'Send it',
      emailButton: 'Open email',
      restartButton: 'Start over'
    }
  },

  summary: {
    name: 'Name', contact: 'Reach you at', people: 'People', where: 'Where', when: 'When',
    seeHear: 'See & hear', mustLand: 'Key moment', budget: 'Budget', files: 'Files', note: 'Note',
    loadIn: 'in', outBy: 'out by'
  },

  messages: {
    sending: 'Sending…',
    uploading: 'Uploading {file}…',
    sent: [
      'Thanks, {name} — our team has your event details. The people planning and running it will reply within one business day.',
      'Need help sooner? Call {phone}.'
    ],
    closeButton: 'Close',
    anotherButton: 'Start another',
    error: '{error} You can try again or send everything by email.',
    tryAgainButton: 'Try again',
    emailOpening: ['Your email app should open with everything filled in. If it doesn’t, write to {email} or call {phone}.'],
    emailAgainButton: 'Open email again'
  }
};
