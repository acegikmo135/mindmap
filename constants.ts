import { Chapter, Flashcard } from './types';

// Class 8 Maths Chapters
const MATHS_CHAPTERS: Chapter[] = [
  {
    id: 'maths-8-01',
    title: 'Rational Numbers',
    subject: 'Maths',
    concepts: [
      {
        id: 'm8-01-c1',
        title: 'Properties of Rational Numbers',
        description: 'Closure, Commutativity, Associativity, and Distributivity.',
        estimatedMinutes: 20,
        status: 'NOT_STARTED',
        masteryLevel: 0,
        prerequisites: [],
        dependencyNote: 'Foundation for all operations.'
      },
      {
        id: 'm8-01-c2',
        title: 'Representation on Number Line',
        description: 'Locating rational numbers visually.',
        estimatedMinutes: 15,
        status: 'LOCKED',
        masteryLevel: 0,
        prerequisites: ['m8-01-c1'],
        dependencyNote: 'Visualizing the numbers defined previously.'
      },
      {
        id: 'm8-01-c3',
        title: 'Rational Numbers between Two Rational Numbers',
        description: 'Finding mean and infinite density of numbers.',
        estimatedMinutes: 15,
        status: 'LOCKED',
        masteryLevel: 0,
        prerequisites: ['m8-01-c2'],
        dependencyNote: 'Understanding density property.'
      }
    ]
  },
  {
    id: 'maths-8-02',
    title: 'Linear Equations in One Variable',
    subject: 'Maths',
    concepts: [
      {
        id: 'm8-02-c1',
        title: 'Solving Equations (Variable on One Side)',
        description: 'Basic transposition and balancing methods.',
        estimatedMinutes: 20,
        status: 'NOT_STARTED',
        masteryLevel: 0,
        prerequisites: [],
        dependencyNote: 'Basic algebra skills.'
      },
      {
        id: 'm8-02-c2',
        title: 'Applications of Linear Equations',
        description: 'Word problems involving numbers, age, and perimeter.',
        estimatedMinutes: 25,
        status: 'LOCKED',
        masteryLevel: 0,
        prerequisites: ['m8-02-c1'],
        dependencyNote: 'Applying calculation skills to real contexts.'
      },
      {
        id: 'm8-02-c3',
        title: 'Solving Equations (Variable on Both Sides)',
        description: 'Advanced grouping of variable terms.',
        estimatedMinutes: 20,
        status: 'LOCKED',
        masteryLevel: 0,
        prerequisites: ['m8-02-c1'],
        dependencyNote: 'Handling complex variable arrangements.'
      }
    ]
  }
];

// Class 8 Science Chapters
const SCIENCE_CHAPTERS: Chapter[] = [
  {
    id: 'sci-8-01',
    title: 'Crop Production and Management',
    subject: 'Science',
    concepts: [
      {
        id: 's8-01-c1',
        title: 'Agricultural Practices',
        description: 'Introduction to crops (Kharif and Rabi).',
        estimatedMinutes: 10,
        status: 'NOT_STARTED',
        masteryLevel: 0,
        prerequisites: [],
        dependencyNote: 'Categorizing what we grow.'
      },
      {
        id: 's8-01-c2',
        title: 'Preparation of Soil',
        description: 'Tilling, ploughing, and leveling.',
        estimatedMinutes: 15,
        status: 'LOCKED',
        masteryLevel: 0,
        prerequisites: ['s8-01-c1'],
        dependencyNote: 'First step before sowing.'
      },
      {
        id: 's8-01-c3',
        title: 'Sowing and Adding Manure',
        description: 'Selection of seeds and nutrient replenishment.',
        estimatedMinutes: 20,
        status: 'LOCKED',
        masteryLevel: 0,
        prerequisites: ['s8-01-c2'],
        dependencyNote: 'Putting seeds in prepared soil.'
      },
      {
        id: 's8-01-c4',
        title: 'Irrigation & Harvesting',
        description: 'Water supply methods and cutting of crops.',
        estimatedMinutes: 20,
        status: 'LOCKED',
        masteryLevel: 0,
        prerequisites: ['s8-01-c3'],
        dependencyNote: 'Maintaining and collecting the yield.'
      }
    ]
  },
  {
    id: 'sci-8-02',
    title: 'Microorganisms: Friend and Foe',
    subject: 'Science',
    concepts: [
      {
        id: 's8-02-c1',
        title: 'Major Groups of Microorganisms',
        description: 'Bacteria, Fungi, Protozoa, and Algae.',
        estimatedMinutes: 15,
        status: 'NOT_STARTED',
        masteryLevel: 0,
        prerequisites: [],
        dependencyNote: 'Classification basics.'
      },
      {
        id: 's8-02-c2',
        title: 'Friendly Microorganisms',
        description: 'Making of curd, bread, and commercial uses.',
        estimatedMinutes: 15,
        status: 'LOCKED',
        masteryLevel: 0,
        prerequisites: ['s8-02-c1'],
        dependencyNote: 'Understanding benefits.'
      },
      {
        id: 's8-02-c3',
        title: 'Harmful Microorganisms',
        description: 'Pathogens causing diseases in humans and plants.',
        estimatedMinutes: 15,
        status: 'LOCKED',
        masteryLevel: 0,
        prerequisites: ['s8-02-c1'],
        dependencyNote: 'Understanding risks.'
      },
      {
        id: 's8-02-c4',
        title: 'Food Preservation',
        description: 'Chemical methods, salt, sugar, oil, and heat.',
        estimatedMinutes: 15,
        status: 'LOCKED',
        masteryLevel: 0,
        prerequisites: ['s8-02-c3'],
        dependencyNote: 'Preventing harmful microbial growth.'
      }
    ]
  }
];

// Social Science Chapters
const SS_CHAPTERS: Chapter[] = [
  {
    id: 'ss-hist-01',
    title: 'India Through the Ages',
    subject: 'Social Science',
    concepts: [
      { id: 'ss-h1-c1', title: 'Ancient Civilizations', description: 'Indus Valley, Vedic period, and early kingdoms of ancient India.', estimatedMinutes: 20, status: 'NOT_STARTED', masteryLevel: 0, prerequisites: [] },
      { id: 'ss-h1-c2', title: 'Medieval India', description: 'The Mughal Empire, Delhi Sultanate, and regional kingdoms.', estimatedMinutes: 20, status: 'LOCKED', masteryLevel: 0, prerequisites: ['ss-h1-c1'] },
      { id: 'ss-h1-c3', title: 'Colonial Period', description: 'British East India Company, rise of colonialism, and resistance.', estimatedMinutes: 20, status: 'LOCKED', masteryLevel: 0, prerequisites: ['ss-h1-c2'] },
      { id: 'ss-h1-c4', title: 'Freedom Movement', description: 'Non-cooperation, Civil Disobedience, and Quit India Movement.', estimatedMinutes: 25, status: 'LOCKED', masteryLevel: 0, prerequisites: ['ss-h1-c3'] },
      { id: 'ss-h1-c5', title: 'Modern India', description: 'Independence, partition, constitution, and development after 1947.', estimatedMinutes: 20, status: 'LOCKED', masteryLevel: 0, prerequisites: ['ss-h1-c4'] },
    ],
  },
];

export const PREFILLED_CHAPTERS: Chapter[] = [
  ...MATHS_CHAPTERS,
  ...SCIENCE_CHAPTERS,
  ...SS_CHAPTERS,
];

export const MOCK_FLASHCARDS: Flashcard[] = [];