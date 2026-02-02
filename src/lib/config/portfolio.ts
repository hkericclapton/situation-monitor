// My Portfolio Configuration
// This tracks my Swiss stock investments

export const MY_PORTFOLIO = {
  stocks: [
    {
      ticker: 'GALD.SW',
      name: 'Galderma',
      exchange: 'SIX Swiss Exchange',
      position: 'Core Holding',
      weight: 60,
      entry_target: 65.0,
      currency: 'CHF',
      keywords: [
        'Galderma',
        'GALD.SW',
        'Nemluvio',
        'nemolizumab',
        'Dysport',
        'Restylane',
        'Sculptra',
        'Allergan',
        'AbbVie aesthetics',
        'injectable dermatology',
        'atopic dermatitis'
      ]
    },
    {
      ticker: 'ALC.SW',
      name: 'Alcon',
      exchange: 'SIX Swiss Exchange',
      position: 'Core Holding',
      weight: 40,
      entry_target: 85.0,
      currency: 'CHF',
      keywords: [
        'Alcon',
        'ALC.SW',
        'Unity VCS',
        'Dailies Total1',
        'PanOptix',
        'Tryptyr',
        'IOL',
        'intraocular lens',
        'cataract surgery',
        'contact lens',
        'ophthalmology',
        'J&J Vision',
        'Johnson & Johnson Vision'
      ]
    },
    {
      ticker: 'SQN.SW',
      name: 'Swissquote',
      exchange: 'SIX Swiss Exchange',
      position: 'Watchlist',
      weight: 0,
      entry_target: 420.0,
      currency: 'CHF',
      keywords: [
        'Swissquote',
        'SQN.SW',
        'Saxo Bank',
        'Interactive Brokers',
        'IBKR',
        'Yuh app',
        'Swiss broker',
        'trading fees',
        'crypto custody',
        'fintech Switzerland'
      ]
    }
  ],
  
  competitors: [
    {
      ticker: 'ABBV',
      name: 'AbbVie',
      relation: 'Galderma competitor (Botox/Juvéderm)'
    },
    {
      ticker: 'JNJ',
      name: 'Johnson & Johnson',
      relation: 'Alcon competitor (Acuvue/TECNIS)'
    }
  ],
  
  alerts: {
    critical: [
      'Nemluvio sales',
      'Unity VCS orders',
      'Saxo Bank fees',
      'FDA approval',
      'EMA approval',
      'earnings miss',
      'guidance cut'
    ],
    monitor: [
      'market share',
      'clinical trial',
      'product launch',
      'analyst downgrade',
      'insider selling'
    ]
  }
};

// RSS Feeds for my sectors
export const MY_RSS_FEEDS = [
  // Swiss Finance
  'https://www.fuw.ch/rss/',
  'https://www.handelszeitung.ch/rss',
  'https://www.swissinfo.ch/eng/rss',
  
  // Pharma/Healthcare
  'https://www.fiercepharma.com/rss/xml',
  'https://www.biopharmadive.com/feeds/news/',
  'https://endpts.com/feed/',
  
  // Medical Devices
  'https://www.medtechdive.com/feeds/news/',
  'https://www.massdevice.com/feed/',
  
  // Fintech
  'https://www.finextra.com/rss/headlines.aspx',
  
  // General Business
  'https://www.ft.com/rss/home'
];

export default MY_PORTFOLIO;
