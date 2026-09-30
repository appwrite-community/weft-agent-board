// Seed content for Fernway, a fictional travel booking company.

export const team = { id: 'fernway', name: 'Fernway' };

export const people = [
  {
    id: 'maya',
    name: 'Maya Chen',
    email: 'maya@example.com',
    title: 'Product lead',
    role: 'owner',
  },
  {
    id: 'theo',
    name: 'Theo Okafor',
    email: 'theo@example.com',
    title: 'iOS engineer',
    role: 'member',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    email: 'priya@example.com',
    title: 'Product designer',
    role: 'member',
  },
  {
    id: 'jonah',
    name: 'Jonah Weiss',
    email: 'jonah@example.com',
    title: 'QA engineer',
    role: 'member',
  },
];

export const agent = { id: 'fernway-agent', name: 'Weft Agent' };

export const boards = [
  { id: 'ios-4-2', name: 'iOS 4.2 release', description: 'Ships to the App Store on October 14.' },
  {
    id: 'checkout',
    name: 'Checkout revamp',
    description: 'One-page checkout for flights and hotels.',
  },
  {
    id: 'growth-q4',
    name: 'Q4 growth experiments',
    description: 'Experiments for the holiday travel season.',
  },
];

type Status = 'inbox' | 'next' | 'doing' | 'done';
type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';
type Label = 'bug' | 'feature' | 'design' | 'ops' | 'qa';

export type SeedCard = {
  id: string;
  boardId: string;
  status: Status;
  title: string;
  description?: string;
  priority?: Priority;
  label?: Label;
  assigneeId?: string;
  dueAt?: string;
  createdBy: string;
  createdAt: string;
};

const due = (day: number) => `2026-10-${String(day).padStart(2, '0')}T12:00:00.000Z`;
const created = (day: number, hour = 10) =>
  `2026-09-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00.000Z`;

export const cards: SeedCard[] = [
  // iOS 4.2 release: the inbox the agent triages.
  {
    id: 'seat-map-crash',
    boardId: 'ios-4-2',
    status: 'inbox',
    title: 'Seat map crashes when rotating the iPad during seat selection',
    description:
      'TestFlight crash report from 4.2 beta 3. 14 crashes from 9 users since Monday, all on iPad in split view.',
    createdBy: 'jonah',
    createdAt: created(28, 9),
  },
  {
    id: 'apple-pay-usd',
    boardId: 'ios-4-2',
    status: 'inbox',
    title: 'Apple Pay sheet shows USD for bookings paid in yen',
    description:
      'Support ticket from a customer in Osaka. The booking total is ¥48,200, but the Apple Pay sheet shows $48,200.00.',
    createdBy: 'maya',
    createdAt: created(27, 14),
  },
  {
    id: 'boarding-pass-dark-mode',
    boardId: 'ios-4-2',
    status: 'inbox',
    title: 'Boarding pass barcode is hard to scan in dark mode',
    description:
      'A gate agent at SFO could not scan the pass until the passenger turned the screen brightness up.',
    createdBy: 'priya',
    createdAt: created(26, 16),
  },
  {
    id: 'gate-change-live-activity',
    boardId: 'ios-4-2',
    status: 'inbox',
    title: 'Show gate changes as a Live Activity',
    description: 'Most requested feature in the 4.2 beta survey (31 of 212 responses).',
    createdBy: 'maya',
    createdAt: created(25, 11),
  },
  {
    id: 'apple-pay-jpy-confirmation',
    boardId: 'ios-4-2',
    status: 'inbox',
    title: 'Wrong currency on the Apple Pay confirmation for JPY fares',
    description: 'Beta tester report: paid for a Tokyo to Osaka fare, the confirmation said USD.',
    createdBy: 'jonah',
    createdAt: created(28, 15),
  },
  {
    id: 'app-store-screenshots',
    boardId: 'ios-4-2',
    status: 'inbox',
    title: 'Update App Store screenshots for 4.2',
    createdBy: 'maya',
    createdAt: created(29, 8),
  },
  // iOS 4.2 release: planned and in-flight work.
  {
    id: 'offline-boarding-passes',
    boardId: 'ios-4-2',
    status: 'next',
    title: 'Offline boarding passes: cache the last five passes',
    priority: 'high',
    label: 'feature',
    assigneeId: 'theo',
    dueAt: due(7),
    createdBy: 'maya',
    createdAt: created(22),
  },
  {
    id: 'fare-calendar-voiceover',
    boardId: 'ios-4-2',
    status: 'next',
    title: 'Add VoiceOver labels to the fare calendar',
    description:
      'VoiceOver reads each day as a number only. Read the date and the lowest fare, for example "October 3, from $212".',
    priority: 'medium',
    label: 'design',
    assigneeId: 'priya',
    dueAt: due(9),
    createdBy: 'priya',
    createdAt: created(21),
  },
  {
    id: 'check-in-retry',
    boardId: 'ios-4-2',
    status: 'next',
    title: 'Retry check-in when the network drops',
    description:
      'Check-in fails with a generic error on a weak airport connection. Retry twice with backoff before showing an error.',
    priority: 'high',
    label: 'bug',
    assigneeId: 'theo',
    dueAt: due(6),
    createdBy: 'jonah',
    createdAt: created(23),
  },
  {
    id: 'price-alert-fare-class',
    boardId: 'ios-4-2',
    status: 'next',
    title: 'Price alert emails link to the wrong fare class',
    description: 'Alerts for Premium Economy open the Economy results page.',
    priority: 'medium',
    label: 'bug',
    createdBy: 'maya',
    createdAt: created(24),
  },
  {
    id: 'trip-summary-redesign',
    boardId: 'ios-4-2',
    status: 'doing',
    title: 'Redesign the trip summary card',
    description:
      'Show the next flight, the hotel check-in time, and the gate on one card. Designs are in review with Maya.',
    priority: 'high',
    label: 'design',
    assigneeId: 'priya',
    createdBy: 'priya',
    createdAt: created(19),
  },
  {
    id: 'apns-token-auth',
    boardId: 'ios-4-2',
    status: 'doing',
    title: 'Move push notifications to token-based APNs auth',
    description:
      'The APNs certificate expires in November. Token-based auth removes the yearly renewal.',
    priority: 'medium',
    label: 'ops',
    assigneeId: 'theo',
    createdBy: 'theo',
    createdAt: created(20),
  },
  {
    id: 'beta-4-regression',
    boardId: 'ios-4-2',
    status: 'doing',
    title: 'Regression pass for 4.2 beta 4',
    description:
      'Full regression on iPhone and iPad, with extra time on booking, check-in, and payments.',
    priority: 'high',
    label: 'qa',
    assigneeId: 'jonah',
    dueAt: due(3),
    createdBy: 'jonah',
    createdAt: created(24),
  },
  {
    id: 'onboarding-localization',
    boardId: 'ios-4-2',
    status: 'doing',
    title: 'Localize onboarding for pt-BR and es-MX',
    description:
      'Strings are with the translators. Screens need a check for text that gets cut off.',
    priority: 'medium',
    label: 'feature',
    assigneeId: 'maya',
    createdBy: 'maya',
    createdAt: created(18),
  },
  {
    id: 'duplicate-trip-fix',
    boardId: 'ios-4-2',
    status: 'done',
    title: 'Fix duplicate trip after rebooking',
    priority: 'high',
    label: 'bug',
    assigneeId: 'theo',
    createdBy: 'jonah',
    createdAt: created(18),
  },
  {
    id: 'wallet-rail-passes',
    boardId: 'ios-4-2',
    status: 'done',
    title: 'Add Apple Wallet passes for rail tickets',
    priority: 'medium',
    label: 'feature',
    assigneeId: 'theo',
    createdBy: 'maya',
    createdAt: created(18),
  },
  {
    id: 'booking-dark-mode',
    boardId: 'ios-4-2',
    status: 'done',
    title: 'Dark mode for the booking flow',
    priority: 'medium',
    label: 'design',
    assigneeId: 'priya',
    createdBy: 'priya',
    createdAt: created(19),
  },
  {
    id: 'crash-free-report',
    boardId: 'ios-4-2',
    status: 'done',
    title: 'Crash-free sessions report for beta builds',
    priority: 'low',
    label: 'ops',
    assigneeId: 'jonah',
    createdBy: 'jonah',
    createdAt: created(20),
  },

  // Checkout revamp.
  {
    id: 'promo-code-pay-button',
    boardId: 'checkout',
    status: 'inbox',
    title: 'Promo code field hides the Pay button on small phones',
    label: 'bug',
    createdBy: 'jonah',
    createdAt: created(27),
  },
  {
    id: 'total-with-taxes',
    boardId: 'checkout',
    status: 'next',
    title: 'Show the total with taxes on the first screen',
    priority: 'medium',
    label: 'feature',
    assigneeId: 'priya',
    createdBy: 'maya',
    createdAt: created(22),
  },
  {
    id: 'split-payment',
    boardId: 'checkout',
    status: 'doing',
    title: 'Split a payment between two cards',
    priority: 'medium',
    label: 'feature',
    assigneeId: 'theo',
    createdBy: 'maya',
    createdAt: created(20),
  },
  {
    id: 'fraud-check-timeout',
    boardId: 'checkout',
    status: 'doing',
    title: 'Fraud check timeout blocks checkout',
    priority: 'urgent',
    label: 'bug',
    assigneeId: 'theo',
    createdBy: 'jonah',
    createdAt: created(28),
  },
  {
    id: 'remember-payment-method',
    boardId: 'checkout',
    status: 'done',
    title: 'Remember the last payment method',
    priority: 'medium',
    label: 'feature',
    assigneeId: 'theo',
    createdBy: 'maya',
    createdAt: created(18),
  },
  {
    id: 'checkout-funnel-events',
    boardId: 'checkout',
    status: 'done',
    title: 'Checkout funnel events',
    priority: 'low',
    label: 'ops',
    assigneeId: 'jonah',
    createdBy: 'jonah',
    createdAt: created(19),
  },

  // Q4 growth experiments.
  {
    id: 'survey-drop-off',
    boardId: 'growth-q4',
    status: 'inbox',
    title: 'Onboarding survey drop-off on step 3',
    label: 'design',
    createdBy: 'priya',
    createdAt: created(26),
  },
  {
    id: 'home-price-alerts',
    boardId: 'growth-q4',
    status: 'next',
    title: 'Price alerts on the home screen',
    priority: 'medium',
    label: 'feature',
    assigneeId: 'maya',
    createdBy: 'maya',
    createdAt: created(23),
  },
  {
    id: 'hotel-upsell-test',
    boardId: 'growth-q4',
    status: 'next',
    title: 'A/B test the hotel upsell after booking',
    priority: 'medium',
    label: 'feature',
    assigneeId: 'priya',
    createdBy: 'maya',
    createdAt: created(24),
  },
  {
    id: 'referral-credit',
    boardId: 'growth-q4',
    status: 'doing',
    title: 'Referral credit for first bookings',
    priority: 'high',
    label: 'feature',
    assigneeId: 'maya',
    createdBy: 'maya',
    createdAt: created(21),
  },
  {
    id: 'weekend-deals-push',
    boardId: 'growth-q4',
    status: 'done',
    title: 'Weekend deals push campaign',
    priority: 'low',
    label: 'ops',
    assigneeId: 'maya',
    createdBy: 'maya',
    createdAt: created(19),
  },
];
