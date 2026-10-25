// Safety wording from docs/research/07 section 4. Say what to do, never what
// the patient has, and never that anyone can wait. Change only with a staff read.
export const emergency = {
  'emergency.button': 'Emergency',
  'emergency.title': 'Emergency',
  'emergency.goNow': 'Go to Emergency now, or tell any staff member.',
  'emergency.noToken': 'You don’t need a token.',
  'emergency.where': 'Emergency (Casualty) is on the ground floor.',
  'emergency.fromEntrance': 'From the main entrance:',
  'emergency.urgentSending': 'Telling staff…',
  'emergency.showWay': 'Show the way to Emergency',
  'emergency.numbers': 'Call 112 for any emergency. Call 108 for an ambulance.',
  'emergency.call112': 'Call 112: any emergency',
  'emergency.call108': 'Call 108: ambulance',
  'emergency.signsIntro': 'Any of these? Go to Emergency now. You don’t need a token.',
  'emergency.sign.chest': 'Chest pain or pressure, or pain that spreads to the arm, jaw or back',
  'emergency.sign.breathing': 'Trouble breathing',
  'emergency.sign.bleeding': 'Heavy bleeding, or bleeding that will not stop',
  'emergency.sign.faint': 'Fainting, or cannot be woken',
  'emergency.sign.stroke':
    'Sudden weakness or numbness on one side, a drooping face, slurred speech or sudden loss of sight',
  'emergency.sign.injury': 'Serious injury, such as a bad fall, a road accident, a deep cut or a burn',
  'emergency.sign.fits': 'Fits (the body jerks and the person does not respond)',
  'emergency.sign.pregnancy':
    'A pregnant woman with bleeding, very bad stomach pain, fits, or a baby that is moving less',
  'emergency.sign.child':
    'A child who cannot drink or feed, vomits everything, has fits, or is very sleepy and hard to wake',
  'emergency.incomplete': 'This list is not complete. If you are worried, tell any staff member.',
  'emergency.notTriage': 'This app does not decide who needs care first. Hospital staff do.',
  'emergency.urgentHelp': 'I need urgent help',
  'emergency.urgentSent':
    'Staff are being told now. If you can, go to Emergency or call out to any staff member.',
  'emergency.urgentQueued':
    'No connection. Staff have not been told yet. Please call out to any staff member.',
} as const;
