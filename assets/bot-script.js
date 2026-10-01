/*
  CHAT BOT SCRIPT — the "5 things we need to know about your event" conversation.

  Edit any of the wording below and push; the site picks it up automatically.
  Keep the quote marks around each line, and the commas between items.

  Placeholders you can use in any line (the bot fills them in):
    {site}      Control Video  or  LED Truck Co. — whichever site the visitor is on
    {name}      the visitor's first name (once they've given it)
    {question}  the anti-spam sum, e.g. "What is 4 + 7?"
    {phone}     (301) 277-3429
    {email}     hello@controlvideo.com
    {file}      (uploading message only) the file being sent
    {error}     (error message only) what went wrong

  How a step works:
    say          the chat bubbles, sent one after another
    placeholder  the grey hint inside the typing box
    skip         the button that skips the question (delete the line to make it required)

  ⚠ OPTIONS lists are saved into Airtable dropdown fields, so each option must match the
    Airtable field exactly. To rename one, rename it in Airtable too and in
    netlify/functions/forms.mjs (CHOICES) — or just ask Claude to do it.

  The order of the questions is set in assets/site.js.
*/
window.CV_BOT_SCRIPT = {

  header: {
    title: 'Tell us about your event',
    shortTitle: 'Tell us about your event',           // used on phones
    subtitle: '{site} · rough answers are fine',
    messageButton: 'Just send a message'               // top-right; switches to the contact form
  },

  steps: {

    name: {
      say: [
        'Hi — I’m the {site} planning bot. Five answers get us to a real number, and rough answers are fine.',
        'First, what’s your name?'
      ],
      placeholder: 'Your name',
      messageInstead: 'Just send a message instead'    // button under the first question
    },

    contact: {
      say: ['Thanks, {name}. What’s the best email or phone number to reach you?'],
      placeholder: 'Email or phone',
      badEmail: 'That email doesn’t look quite right — try again?',
      badPhone: 'Could you give me an email address or a phone number with area code?'
    },

    organization: {
      say: ['What organization is this for?'],
      placeholder: 'Organization',
      skip: 'Just me'
    },

    // 1 ─ How many people?
    headcount: {
      say: [
        '1 of 5 · How many people?',
        'Your best number, even a range. It sizes the screens, the gear and the crew.'
      ],
      placeholder: 'e.g. 400, or 300–500',
      skip: 'Not sure'
    },
    headcountIs: {                                     // only asked if they gave a number
      say: ['Is that confirmed, a capacity cap, or a best guess?'],
      options: ['Confirmed', 'Capacity cap', 'Best guess']                  // ⚠ OPTIONS
    },

    // 2 ─ Where is it?
    venue: {
      say: ['2 of 5 · Where is it?', 'Venue and the specific room.'],
      placeholder: 'e.g. Mellon Auditorium, main hall',
      skip: 'Not booked yet'
    },
    setting: {
      say: ['Indoor, outdoor, or both? It changes power, weather and rigging.'],
      options: ['Indoor', 'Outdoor', 'Both']                                // ⚠ OPTIONS
    },

    // 3 ─ When?
    showTime: {
      say: ['3 of 5 · When is the show? Date and time.'],
      placeholder: 'e.g. Fri Mar 14, 7 pm',
      skip: 'Not set yet'
    },
    loadIn: {
      say: ['When can we get in to set up?'],
      placeholder: 'e.g. Mar 14, 8 am',
      skip: 'Don’t know yet'
    },
    outBy: {
      say: ['And when do we have to be out?'],
      placeholder: 'e.g. midnight',
      skip: 'Don’t know yet'
    },

    // 4 ─ What should the audience see and hear?
    seeHear: {
      say: [
        '4 of 5 · What should the audience see and hear?',
        'Tap everything you know you need, then Done. “Not sure yet” is a fine answer.'
      ],
      options: ['LED wall', 'Projection', 'Screens / TVs', 'Cameras on screen', 'Livestream',   // ⚠ OPTIONS
                'Recording', 'Audio', 'Lighting', 'Stage', 'LED truck or trailer', 'Not sure yet'],
      done: 'Done'
    },

    // 5 ─ What can't go wrong?
    mustLand: {
      say: ['5 of 5 · What can’t go wrong?', 'The one moment that has to land. We build the plan around it.'],
      placeholder: 'e.g. The keynote walk-on at 7:30',
      skip: 'Skip'
    },

    budget: {
      say: ['Last question — a budget range, if you have one?'],
      options: ['Under $10k', '$10k–25k', '$25k–50k', '$50k+', 'Not set']   // ⚠ OPTIONS
    },

    files: {
      say: ['Got a floor plan or run of show? Send it over — or paste a link.'],
      placeholder: 'Paste a link, or tap Add files',
      addButton: 'Add files',
      noneButton: 'Nothing to send',
      doneButton: 'That’s everything',
      gotOne: 'Got it. Anything else?',
      gotMany: 'Got them. Anything else?',
      gotNone: 'I couldn’t take that one — check the note next to it, or paste a link instead.'
    },

    answer: {
      say: ['One quick check to keep the robots out: {question}'],
      placeholder: 'Answer'
    },

    confirm: {
      say: ['Here’s what I’ve got:', '{summary}', 'Send it to the team?'],   // {summary} = the recap card
      // Used instead when online sending is unavailable (opens an email with everything filled in):
      sayEmail: ['Here’s what I’ve got:', '{summary}', 'Online sending isn’t switched on right now, so I’ll open an email with all of this filled in — just hit send.'],
      attachNote: 'Attach your files to that email.',
      sendButton: 'Send it',
      emailButton: 'Open email',
      restartButton: 'Start over'
    }
  },

  // Labels on the recap card shown before sending
  summary: {
    name: 'Name', contact: 'Reach you at', people: 'People', where: 'Where', when: 'When',
    seeHear: 'See & hear', mustLand: 'Can’t go wrong', budget: 'Budget', files: 'Files', note: 'Note',
    loadIn: 'in', outBy: 'out by'
  },

  messages: {
    sending: 'Sending…',
    uploading: 'Uploading {file}…',
    sent: [
      'Got it, {name} — it’s with our team. The people who will plan and run it will reply within one business day.',
      'If it’s urgent, call {phone}.'
    ],
    closeButton: 'Close',
    anotherButton: 'Start another',
    error: '{error} You can try again, or send it all by email instead.',
    tryAgainButton: 'Try again',
    emailOpening: ['Your email app should be opening with everything filled in. If it doesn’t, write to {email} or call {phone}.'],
    emailAgainButton: 'Open email again'
  }
};
