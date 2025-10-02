
const state = {
  entries: [],
  filtered: [],
  tags: new Set(),
  q: '',
  tag: 'All',
  explorer: null,
  explorerFrame: null,
  variantCycle: null,
  npcs: [],
  selectedZone: null,
  mapCamera: null,
  activeEvents: [],
  bloomDormant: new Map(),
  zoneToastTimer: null,
};

const LABEL_PLACEMENTS = new Map();

const MAP_WORLD_SCALE = 1.46;
const MAP_ZONE_SIZE_SCALE = 0.78;
const LANDSCAPE_SPREAD = 1.18;

const SCENE_EVENTS = [
  {
    id: 'aurora-surge',
    title: 'Aurora Surge',
    summary: 'Auroral currents braid around the surveyor, accelerating each stride across the ley-lines.',
    duration: 28,
    cooldown: 68,
    speedMultiplier: 1.24,
    npcBias: 0.08,
    status: 'Aurora surge guiding the route',
    logNote: 'Ley-lines amplifying pace',
    type: 'phenomenon',
    glyph: [
      ' /\\ ',
      '<**>',
      ' \/ ',
    ],
    mapDuration: 24,
    mapLabel: 'Auroral surge flare',
    moodTag: 'wonder',
  },
  {
    id: 'veilwind-fog',
    title: 'Veilwind Fog',
    summary: 'A hush of phosphor fog settles in, slowing the route but drawing more contacts out of hiding.',
    duration: 34,
    cooldown: 72,
    speedMultiplier: 0.78,
    npcBias: 0.22,
    status: 'Navigating veilwind fog',
    logNote: 'NPC encounters favored',
    type: 'weather',
    requiresShelter: true,
    shelterDuration: 6.2,
    redirectType: 'npc',
    glyph: [
      '~~~~',
      '::::',
      '~~~~',
    ],
    mapDuration: 28,
    mapLabel: 'Veilwind fog bank',
    moodTag: 'uneasy',
  },
  {
    id: 'festival-rally',
    title: 'Festival Rally',
    summary: 'Carnival caravans flood the promenades, sharing shortcuts and festival rumors with the surveyor.',
    duration: 26,
    cooldown: 64,
    speedMultiplier: 1.08,
    npcBias: 0.32,
    status: 'Festival rally rippling through streets',
    logNote: 'Caravan guidance engaged',
    type: 'encounter',
    redirectType: 'npc',
    disruptDuration: 4.2,
    glyph: [
      '[=^=]',
      ' /|\\ ',
      ' / \\ ',
    ],
    mapDuration: 22,
    mapLabel: 'Festival rally procession',
    moodTag: 'jubilant',
  },
  {
    id: 'shelterfront-squall',
    title: 'Shelterfront Squall',
    summary: 'Slate rain lashes the route, forcing the surveyor to dive beneath vaulted arcades for cover.',
    duration: 32,
    cooldown: 78,
    speedMultiplier: 0.7,
    npcBias: 0.12,
    status: 'Racing the shelterfront squall',
    logNote: 'Seeking shelter from the storm',
    type: 'weather',
    requiresShelter: true,
    shelterDuration: 7.5,
    redirectType: 'npc',
    glyph: [
      '.::. ',
      '//\\',
      '\\//',
    ],
    mapDuration: 26,
    mapLabel: 'Shelterfront squall',
    moodTag: 'weary',
  },
  {
    id: 'nomad-crossing',
    title: 'Nomad Crossing',
    summary: 'Nomad barges annex the causeway and barter new detours toward hidden curios.',
    duration: 24,
    cooldown: 70,
    speedMultiplier: 0.92,
    npcBias: 0.18,
    status: 'Detouring around nomad crossings',
    logNote: 'Route redirected by traders',
    type: 'encounter',
    redirectType: 'entry',
    redirectCategory: 'Curio',
    disruptDuration: 3.6,
    glyph: [
      '==o==',
      ' /|\\ ',
      '_/ \\_',
    ],
    mapDuration: 20,
    mapLabel: 'Nomad crossing detour',
    moodTag: 'curiosity',
  },
  {
    id: 'murmur-bloom',
    title: 'Murmur Bloom',
    summary: 'Whispering groves exhale spores, cycling older growth back beneath the soil.',
    duration: 30,
    cooldown: 76,
    speedMultiplier: 0.96,
    npcBias: 0.04,
    status: 'Cataloguing murmuring bloom beds',
    logNote: 'Dormant flora awaiting return',
    type: 'bloom',
    bloomDormancyCount: 3,
    bloomDormancyDuration: 24,
    glyph: [
      ' .*. ',
      '(::)',
      ' \/ ',
    ],
    mapDuration: 24,
    mapLabel: 'Murmur bloom cycle',
    moodTag: 'calm',
  },
  {
    id: 'ashen-fallow',
    title: 'Ashen Fallow',
    summary: 'A hush ripples through the arboretum as petals crumble, promising clustered regrowth later.',
    duration: 36,
    cooldown: 82,
    speedMultiplier: 0.88,
    npcBias: 0.06,
    status: 'Tracing ashen fallow fields',
    logNote: 'Flora entering fallow phase',
    type: 'bloom',
    bloomDormancyCount: 4,
    bloomDormancyDuration: 30,
    glyph: [
      '\\..//',
      '.xx.',
      '//..\\',
    ],
    mapDuration: 28,
    mapLabel: 'Ashen fallow cycle',
    moodTag: 'uneasy',
  },
];

const MOOD_EFFECTS = {
  wonder: {
    delta: 2,
    tone: 'wonderstruck',
    messages: [
      'The surveyor pauses, eyes wide as {source} refracts unheard colours.',
      '{source} ignites a hush of awe; their pulse keeps tempo with the aurora.',
    ],
  },
  calm: {
    delta: 1,
    tone: 'soothed',
    messages: [
      '{source} loosens the tension in their shoulders, a quiet breath settling in.',
      'They let the calm from {source} steady their stride.',
    ],
  },
  curiosity: {
    delta: 1,
    tone: 'curious',
    messages: [
      '{source} sparks a dozen new questions the surveyor wants to chase.',
      'They sketch rapid glyphs, curiosity stirred by {source}.',
    ],
  },
  uneasy: {
    delta: -1,
    tone: 'uneasy',
    messages: [
      'A prickle of unease lingers after {source}; they scan the mists twice.',
      '{source} leaves them wary, pace tightening for a few breaths.',
    ],
  },
  weary: {
    delta: -2,
    tone: 'weary',
    messages: [
      'Fatigue seeps in as {source} drags against their stride.',
      '{source} tests their reserves; the satchel feels heavier.',
    ],
  },
  jubilant: {
    delta: 3,
    tone: 'elated',
    messages: [
      'Joy bursts bright — {source} feels like the kingdom applauding.',
      'They laugh under their breath; {source} turns the trek celebratory.',
    ],
  },
  grit: {
    delta: 1,
    tone: 'resolute',
    messages: [
      '{source} steels their resolve; maps reshuffle under determined hands.',
      'They square their shoulders, determined after {source}.',
    ],
  },
  focused: {
    delta: 0,
    tone: 'focused',
    messages: [
      '{source} sharpens their focus, every route plotted twice.',
      'They note {source} with clinical precision, attention narrowed.',
    ],
  },
};

const MOOD_TONE_PROMPTS = {
  steady: [
    'Footsteps fall in a steady cadence along the moss-lined causeways.',
    'The surveyor hums a familiar interval while the route stays gentle.',
  ],
  wonderstruck: [
    'They keep glancing up, chasing auroral reflections in their jars.',
    'Every step feels lighter, wonder pooling in their eyes.',
  ],
  soothed: [
    'Breath slows; the hush of leaves keeps the surveyor soothed.',
    'The quiet drip of condensation steadies their pulse.',
  ],
  curious: [
    'Questions stack in their notebook margins, curiosity tugging them onward.',
    'They trace new angles across the map, hunting fresh leads.',
  ],
  uneasy: [
    'The surveyor checks the perimeter, unease lingering in their gait.',
    'They tighten cloak clasps, glancing back at their trail.',
  ],
  weary: [
    'Fatigue rumbles under each stride, but they keep moving.',
    'Their shoulders sag briefly before the next waypoint pulls them onward.',
  ],
  elated: [
    'They almost skip between lantern posts, elation brightening the route.',
    'Field notes spill into celebratory scrawl; morale soars.',
  ],
  resolute: [
    'Jaw set, they navigate with quiet resolve.',
    'Their stance is firm, determination guiding the compass.',
  ],
  focused: [
    'Every landmark is catalogued; focus sharpens the route.',
    'They measure distance with crisp precision, distractions fading.',
  ],
};

const ENTRY_MOOD_TAGS = {
  dreamroot: 'calm',
  'honeyglobe-capsule': 'focused',
  'chorus-spore-cluster': 'wonder',
  'glassfern-scribes': 'curiosity',
  'moonlace-bloom': 'wonder',
  'emberleaf-vines': 'grit',
  'tidal-iris': 'calm',
  'starlit-bramble': 'curiosity',
  'whisper-willow': 'calm',
  'gloomcap-mantle': 'uneasy',
  'umbral-mistle': 'focused',
  'wanderers-ember': 'jubilant',
  'archive-lichen-scroll': 'focused',
  'tidelight-caul': 'calm',
  'shatterlight-thistle': 'grit',
  'mint-cluster': 'calm',
  'sparkling-mineral': 'curiosity',
  'golden-cap-sphere': 'wonder',
  'teal-crown-root': 'jubilant',
  'sunspore-eye': 'jubilant',
  'ambercrest-lantern': 'focused',
  'lost-camera': 'curiosity',
  'blooming-robes': 'wonder',
  'umbral-iris-lens': 'focused',
};

const DIALOGUE_MOOD_TAGS = {
  'archivist-sel:sel-greeting': 'calm',
  'skywright-ila:ila-greeting': 'curiosity',
  'carnival-quartermaster:jansa-greeting': 'jubilant',
  'tideglass-warden:celyne-greeting': 'calm',
  'hollow-gardener:thalen-greeting': 'calm',
  'forge-liaison:brakk-greeting': 'grit',
  'deepway-cartographer:neer-greeting': 'focused',
  'resonant-historian:aderyn-greeting': 'wonder',
};

const ISO_PROJECTION = (()=>{
  const marginX = 12;
  const marginYTop = 8;
  const marginYBottom = 12;
  return {
    marginX,
    marginYTop,
    marginYBottom,
    scaleX: 100 - marginX,
    scaleY: 100 - (marginYTop + marginYBottom),
  };
})();

const MAP_ZONES = [
  {
    name: 'The Village',
    description: 'Resonant Plaza • Choir Ruins • Alchemists\' Span',
    x: 46,
    y: 36,
    width: 34,
    height: 28,
    regions: ['Resonant Plaza', 'Choir Ruins', "Alchemists' Span"],
    subtitle: 'Markets and memory-scribes',
    shapeSeed: 0.32,
    contours: [
      { feature: 'choir-uplands', weight: 1.2 },
      { feature: 'ridge-of-sighs', weight: 0.7 },
    ],
  },
  {
    name: 'The Parade',
    description: 'Sunken Promenade • Carnival Quarter Greenways',
    x: 52,
    y: 68,
    width: 30,
    height: 26,
    regions: ['Sunken Promenade', 'Carnival Quarter Greenways'],
    subtitle: 'Festival route through the lowlights',
    shapeSeed: 0.64,
    contours: [
      { feature: 'sunken-promenade', weight: 1.4 },
      { feature: 'ridge-of-sighs', weight: 0.5 },
    ],
  },
  {
    name: 'The Forest',
    description: 'Verdant Hollows • Whispering Arboretum • Wanderer\'s Causeway • Archive Warrens',
    x: 36,
    y: 62,
    width: 42,
    height: 38,
    regions: ['Verdant Hollows', 'Whispering Arboretum', "Wanderer's Causeway", 'Archive Warrens'],
    subtitle: 'Wild growth hugging the southern ridge',
    shapeSeed: 0.12,
    contours: [
      { feature: 'ridge-of-sighs', weight: 1.2 },
      { feature: 'sunken-promenade', weight: 0.6 },
    ],
  },
  {
    name: 'The Deep Forest',
    description: 'Skybreak Ridge • Wind-Carved Steps',
    x: 24,
    y: 24,
    width: 26,
    height: 24,
    regions: ['Skybreak Ridge', 'Wind-Carved Steps'],
    subtitle: 'High canopies and aurora-lit trails',
    shapeSeed: 0.52,
    contours: [
      { feature: 'ridge-of-sighs', weight: 0.8 },
      { feature: 'choir-uplands', weight: 0.6 },
    ],
  },
  {
    name: 'The Mines',
    description: 'Veiled Deepways • Deep Mines • Dusk Tunnels Fen',
    x: 68,
    y: 78,
    width: 32,
    height: 30,
    regions: ['Veiled Deepways', 'Deep Mines', 'Dusk Tunnels Fen'],
    subtitle: 'Collapsed shafts and fungal lifts',
    shapeSeed: 0.21,
    contours: [
      { feature: 'deepway-sink', weight: 1.6 },
    ],
  },
  {
    name: 'The Palace',
    description: 'Gilt Palace Conservatory • Veiled Colonnade • Shatterlight Forge • Undersea Observatory • Tideglass Reaches',
    x: 70,
    y: 48,
    width: 38,
    height: 36,
    regions: ['Gilt Palace Conservatory', 'Veiled Colonnade', 'Shatterlight Forge', 'Undersea Observatory', 'Tideglass Reaches'],
    subtitle: 'Seat of rationed wonder',
    shapeSeed: 0.84,
    contours: [
      { feature: 'palace-terraces', weight: 1.5 },
      { feature: 'deepway-sink', weight: 0.4 },
    ],
  },
];

const MAP_TOPOLOGY_FEATURES = [
  {
    id: 'choir-uplands',
    name: 'Choir Uplands',
    type: 'hill',
    x: 40,
    y: 34,
    width: 24,
    height: 18,
    rotation: -6,
    intensity: 1.15,
    influences: ['The Village'],
    effect: 'Tiered hillocks quicken aerial traversal but slow caravans hauling instruments uphill.',
  },
  {
    id: 'sunken-promenade',
    name: 'Sunken Promenade Basin',
    type: 'valley',
    x: 50,
    y: 70,
    width: 30,
    height: 20,
    rotation: 8,
    intensity: 1.05,
    influences: ['The Parade'],
    effect: 'Flooded concourse demands careful footing yet concentrates spores for bloom harvesting.',
  },
  {
    id: 'ridge-of-sighs',
    name: 'Ridge of Sighs',
    type: 'ridge',
    x: 28,
    y: 52,
    width: 38,
    height: 16,
    rotation: -18,
    intensity: 1.1,
    influences: ['The Forest', 'The Deep Forest'],
    effect: 'High ridgeline shields windswept paths; climbers gain vantage while wagons detour around sheer drops.',
  },
  {
    id: 'palace-terraces',
    name: 'Palace Terraces',
    type: 'hill',
    x: 72,
    y: 48,
    width: 28,
    height: 22,
    rotation: 12,
    intensity: 1.2,
    influences: ['The Palace'],
    effect: 'Layered terraces boost glidewings bound for the conservatory but tax runners with steep switchbacks.',
  },
  {
    id: 'deepway-sink',
    name: 'Deepway Sink',
    type: 'valley',
    x: 72,
    y: 82,
    width: 34,
    height: 18,
    rotation: 18,
    intensity: 0.9,
    influences: ['The Mines'],
    effect: 'Collapsed earth forms a sink that slows haulers though lift caravans can coast along exposed rails.',
  },
];

const TOPOLOGY_FEATURE_MAP = new Map(
  MAP_TOPOLOGY_FEATURES.map(feature => [feature.id, feature])
);

const WORLD_TOPOGRAPHY = Object.freeze({
  gridWidth: 72,
  gridHeight: 42,
  seed: 0.618,
});

const WORLD_TOPOGRAPHY_PALETTE = [
  { limit: -1.15, pattern: '~~' },
  { limit: -0.7, pattern: 'vv' },
  { limit: -0.25, pattern: '--' },
  { limit: 0.2, pattern: '..' },
  { limit: 0.6, pattern: '::' },
  { limit: 1, pattern: '/\\' },
  { limit: Infinity, pattern: '^^' },
];

const WORLD_TOPOGRAPHY_RIDGE_PATTERNS = [
  { limit: 15, pattern: '||' },
  { limit: 35, pattern: '/\\' },
  { limit: 70, pattern: '--' },
  { limit: 110, pattern: '\\/' },
  { limit: 145, pattern: '\\' },
  { limit: 180, pattern: '||' },
];

let cachedTopographyAscii = null;

function generateWorldTopographyAscii(){
  if(cachedTopographyAscii) return cachedTopographyAscii;
  const width = WORLD_TOPOGRAPHY.gridWidth;
  const height = WORLD_TOPOGRAPHY.gridHeight;
  const rows = [];
  for(let gy = 0; gy < height; gy += 1){
    const py = height <= 1 ? 0 : (gy / (height - 1)) * 100;
    let row = '';
    for(let gx = 0; gx < width; gx += 1){
      const px = width <= 1 ? 0 : (gx / (width - 1)) * 100;
      const sample = computeWorldTopographySample(px, py);
      let pattern = pickTopographyPattern(sample);
      const charIndex = Math.abs(Math.floor(gx + gy)) % pattern.length;
      let char = pattern[charIndex] || pattern[0] || '.';
      if(sample.elevation > 1.35 && sample.hillInfluence > 0.55 && ((gx + gy) % 5 === 0)){
        char = 'A';
      } else if(sample.elevation > 1.75 && sample.hillInfluence > 0.7 && ((gx * 3 + gy) % 7 === 0)){
        char = 'M';
      } else if(sample.elevation < -0.85 && sample.valleyInfluence > 0.5 && ((gx + gy * 2) % 4 === 0)){
        char = 'v';
      }
      row += char;
    }
    rows.push(row);
  }
  cachedTopographyAscii = rows.join('\n');
  return cachedTopographyAscii;
}

function computeWorldTopographySample(px, py){
  let elevation = ((py / 100) - 0.5) * 0.9;
  elevation += ((px / 100) - 0.5) * 0.4;
  let hillInfluence = 0;
  let valleyInfluence = 0;
  let ridgeInfluence = 0;
  let ridgeRotation = null;
  MAP_TOPOLOGY_FEATURES.forEach(feature => {
    if(!feature) return;
    const spanX = Math.max(6, Number.isFinite(feature.width) ? feature.width : 20);
    const spanY = Math.max(6, Number.isFinite(feature.height) ? feature.height : spanX);
    const dx = px - feature.x;
    const dy = py - feature.y;
    const distX = dx / (spanX * 0.5);
    const distY = dy / (spanY * 0.5);
    const distance = Math.hypot(distX, distY);
    if(distance > 2.2) return;
    const falloff = Math.max(0, 1 - (distance ** 1.35));
    if(falloff <= 0) return;
    const intensity = Number.isFinite(feature.intensity) ? feature.intensity : 1;
    const influence = falloff * intensity;
    const type = feature.type || 'hill';
    if(type === 'valley' || type === 'sink'){
      elevation -= influence * 1.2;
      valleyInfluence = Math.max(valleyInfluence, influence);
    } else if(type === 'ridge'){
      elevation += influence * 0.9;
      if(influence > ridgeInfluence){
        ridgeInfluence = influence;
        ridgeRotation = feature.rotation ?? 0;
      }
    } else {
      elevation += influence * 1.3;
      hillInfluence = Math.max(hillInfluence, influence);
      if(influence > ridgeInfluence && Number.isFinite(feature.rotation)){
        ridgeInfluence = influence * 0.6;
        ridgeRotation = feature.rotation;
      }
    }
  });
  const jitter = seededJitter(WORLD_TOPOGRAPHY.seed, px * 1.71 + py * 2.13, 0.55);
  const drift = seededJitter(WORLD_TOPOGRAPHY.seed, px * -0.42 + py * 0.58, 0.35);
  elevation += jitter * 0.35 + drift * 0.25;
  return { elevation, hillInfluence, valleyInfluence, ridgeInfluence, ridgeRotation };
}

function pickTopographyPattern(sample){
  if(sample.ridgeInfluence > 0.55 && Number.isFinite(sample.ridgeRotation)){
    return pickOrientationPattern(sample.ridgeRotation);
  }
  if(sample.valleyInfluence > 0.6){
    return '~~';
  }
  let pattern = '::';
  for(const option of WORLD_TOPOGRAPHY_PALETTE){
    if(sample.elevation <= option.limit){
      pattern = option.pattern;
      break;
    }
  }
  if(sample.hillInfluence > 0.65 && sample.elevation > 0.4){
    const oriented = Number.isFinite(sample.ridgeRotation)
      ? pickOrientationPattern(sample.ridgeRotation)
      : null;
    if(oriented) pattern = oriented;
  }
  return pattern;
}

function pickOrientationPattern(rotation){
  const normalized = Math.abs(rotation % 180);
  for(const option of WORLD_TOPOGRAPHY_RIDGE_PATTERNS){
    if(normalized <= option.limit){
      return option.pattern;
    }
  }
  const fallback = WORLD_TOPOGRAPHY_RIDGE_PATTERNS[WORLD_TOPOGRAPHY_RIDGE_PATTERNS.length - 1];
  return fallback ? fallback.pattern : '||';
}

function renderMapTopography(layers){
  const asciiNode = layers?.topography?.ascii;
  if(!asciiNode) return;
  const ascii = generateWorldTopographyAscii();
  if(ascii && asciiNode.textContent !== ascii){
    asciiNode.textContent = ascii;
  }
}

const NPCS = [
  {
    id: 'archivist-sel',
    name: 'Archivist Sel',
    title: 'Archivist of Whispered Threads',
    description: 'Keeps the Choir\'s last resonant ledgers and trades in memories etched onto light.',
    location: { x: 26, y: 26, region: 'Choir Ruins' },
    dialogues: [
      {
        id: 'sel-greeting',
        title: 'Soft Greeting',
        fallback: true,
        requires: [],
        lines: [
          'Sel nods toward the floating notes above the Choir ruins.',
          '"The archive hums louder each time you pass. Keep listening for the quiet crescendos."'
        ]
      },
      {
        id: 'sel-dreamroot',
        title: 'Dreamroot Resonance',
        requires: ['dreamroot'],
        lines: [
          '"Dreamroot sap carries lullabies from before the Silence," Sel whispers.',
          '"I can braid its cadence into the choir stones so sleepers hear home again."'
        ]
      },
      {
        id: 'sel-glassfern',
        title: 'Glassfern Correspondence',
        requires: ['glassfern-scribes'],
        lines: [
          'Sel spreads transparent fronds across the ledger.',
          '"These scribes will archive every whispered treaty you rescued from the Hollows."'
        ]
      }
    ]
  },
  {
    id: 'skywright-ila',
    name: 'Skywright Ila',
    title: 'Cartographer of Stormlines',
    description: 'Charts auroral slipstreams threading the Skybreak parapets.',
    location: { x: 18, y: 14, region: 'Skybreak Ridge' },
    dialogues: [
      {
        id: 'ila-greeting',
        title: 'Stormline Briefing',
        fallback: true,
        requires: [],
        lines: [
          'Ila sketches arcs of lightning across floating parchment.',
          '"Slipstreams bend around your routes. Tell me where the clouds refused to part."'
        ]
      },
      {
        id: 'ila-starlit',
        title: 'Starlit Drafting',
        requires: ['starlit-bramble'],
        lines: [
          '"Those bramble spores glitter like storm seeds," Ila muses.',
          '"I\'ll seed them along the ridge beacons so the marchers can read the winds."'
        ]
      },
      {
        id: 'ila-umbral',
        title: 'Umbral Drift Survey',
        requires: ['umbral-mistle'],
        lines: [
          'Ila traces a finger along the mistle filaments you share.',
          '"These hold the map of every shadow gale. I\'ll chart safe passage through the night squalls."'
        ]
      }
    ]
  },
  {
    id: 'carnival-quartermaster',
    name: 'Quartermaster Jansa',
    title: 'Carnival Quartermaster',
    description: 'Directs festival caravans and keeps the ember routes aglow.',
    location: { x: 58, y: 74, region: 'Carnival Quarter Greenways' },
    dialogues: [
      {
        id: 'jansa-greeting',
        title: 'Festival Banter',
        fallback: true,
        requires: [],
        lines: [
          'Jansa flips a coin of cooled emberlight.',
          '"Keep that survey gear limber. The parade shifts routes whenever your trail does."'
        ]
      },
      {
        id: 'jansa-emberleaf',
        title: 'Emberleaf Logistics',
        requires: ['emberleaf-vines'],
        lines: [
          '"Those emberleaf braids you gathered kept three floats from freezing," Jansa grins.',
          '"Take this glow-map—more dancers want your routes."'
        ]
      },
      {
        id: 'jansa-wanderers',
        title: 'Wanderer\'s Ember Exchange',
        requires: ['wanderers-ember'],
        lines: [
          'Jansa cups the wanderer\'s ember until it steadies.',
          '"We\'ll send that spark down quiet alleys so the ration marshals never notice."'
        ]
      }
    ]
  },
  {
    id: 'tideglass-warden',
    name: 'Warden Celyne',
    title: 'Tideglass Warden',
    description: 'Monitors the undersea currents that lap at the kingdom\'s deepest vaults.',
    location: { x: 84, y: 46, region: 'Undersea Observatory' },
    dialogues: [
      {
        id: 'celyne-greeting',
        title: 'Brine Salute',
        fallback: true,
        requires: [],
        lines: [
          'Celyne offers a vial of glowing brine.',
          '"Let the tides steady your stride. The observatory charts every ripple you spark."'
        ]
      },
      {
        id: 'celyne-tidal',
        title: 'Tidal Iris Synchrony',
        requires: ['tidal-iris'],
        lines: [
          '"The tidal irises still mirror the undersea pulse," Celyne murmurs.',
          '"I\'ll tune them beside the observatory lens so sailors can dream-steer again."'
        ]
      },
      {
        id: 'celyne-tidelight',
        title: 'Tidelight Infusion',
        requires: ['tidelight-caul'],
        lines: [
          'Celyne weaves tidelight threads through the currents.',
          '"With this caul, the deepways will glow soft enough for the miners to rest."'
        ]
      }
    ]
  },
  {
    id: 'hollow-gardener',
    name: 'Gardener Thalen',
    title: 'Whispering Arboretum Tender',
    description: 'Cultivates groves that respond to spoken promises.',
    location: { x: 32, y: 64, region: 'Whispering Arboretum' },
    dialogues: [
      {
        id: 'thalen-greeting',
        title: 'Soft Soil Exchange',
        fallback: true,
        requires: [],
        lines: [
          'Thalen kneels to press their palm into humming loam.',
          '"Every root listened when you crossed the Hollows. Stay and hear what they remember."'
        ]
      },
      {
        id: 'thalen-whisper',
        title: 'Willow Promise',
        requires: ['whisper-willow'],
        lines: [
          '"Your willow carried vows even I could not coax," Thalen says softly.',
          '"Let\'s braid them into the arboretum ward so the sleepers feel safe."'
        ]
      },
      {
        id: 'thalen-gloomcap',
        title: 'Gloomcap Balms',
        requires: ['gloomcap-mantle'],
        lines: [
          'Thalen turns the mantle to catch stray moonlight.',
          '"The miners will rest easier if we line the paths with this glow. Walk with me?"'
        ]
      }
    ]
  },
  {
    id: 'forge-liaison',
    name: 'Liaison Brakk',
    title: 'Shatterlight Forge Envoy',
    description: 'Keeps the forge embers synchronized with the Radiant Courts.',
    location: { x: 66, y: 44, region: 'Shatterlight Forge' },
    dialogues: [
      {
        id: 'brakk-greeting',
        title: 'Forge Rapport',
        fallback: true,
        requires: [],
        lines: [
          'Brakk taps a rhythm on their gauntlet to match the forge pulse.',
          '"Report in, surveyor. The Courts rely on your cadence to temper their blades."'
        ]
      },
      {
        id: 'brakk-auric',
        title: 'Auric Harmonization',
        requires: ['auric-marrow'],
        lines: [
          '"Auric marrow runs hot. I\'ll temper the crucibles with it," Brakk nods.',
          '"Stay close in case the resonance spikes again."'
        ]
      },
      {
        id: 'brakk-thistle',
        title: 'Thistle Quench',
        requires: ['shatterlight-thistle'],
        lines: [
          'Brakk crushes the thistle sparks into their gauntlet.',
          '"This will keep the forge tempered while the Courts sleep. Your timing is precise."'
        ]
      }
    ]
  },
  {
    id: 'deepway-cartographer',
    name: 'Cartographer Neer',
    title: 'Dusk Tunnel Pathfinder',
    description: 'Maps the glowless warrens beyond the Veiled Deepways.',
    location: { x: 74, y: 76, region: 'Dusk Tunnels Fen' },
    dialogues: [
      {
        id: 'neer-greeting',
        title: 'Tunnel Orientation',
        fallback: true,
        requires: [],
        lines: [
          'Neer unfurls a map stitched with phosphor thread.',
          '"Your routes keep the tunnels from swallowing the caravans. Sit; let\'s revise them."'
        ]
      },
      {
        id: 'neer-tidelight',
        title: 'Tidelight Charts',
        requires: ['tidelight-caul'],
        lines: [
          '"The caul\'s glow will trace the safe hollows," Neer murmurs.',
          '"I\'ll ink its rhythm into these depths before it fades."'
        ]
      },
      {
        id: 'neer-ember',
        title: 'Ember Relay',
        requires: ['wanderers-ember'],
        lines: [
          'Neer sets the ember into a lantern cage.',
          '"Guides will trade for this light all winter. You always arrive when the dark thickens."'
        ]
      }
    ]
  },
  {
    id: 'resonant-historian',
    name: 'Historian Aderyn',
    title: 'Resonant Historian',
    description: 'Collects echoes from collapsed amphitheatres to retune the Choir\'s harmonics.',
    location: { x: 44, y: 32, region: 'Resonant Plaza' },
    dialogues: [
      {
        id: 'aderyn-greeting',
        title: 'Echoed Salute',
        fallback: true,
        requires: [],
        lines: [
          'Aderyn cups their ear toward the plaza stones.',
          '"Every echo you chase keeps the Choir awake. Trade me any verse you rescued."'
        ]
      },
      {
        id: 'aderyn-chorus',
        title: 'Chorus Reconstruction',
        requires: ['chorus-spore-cluster'],
        lines: [
          '"These spores remember the lost choristers," Aderyn whispers.',
          '"I\'ll lace them through the ruined aisles so the songs can resurface."'
        ]
      },
      {
        id: 'aderyn-moonlace',
        title: 'Moonlace Archive',
        requires: ['moonlace-bloom'],
        lines: [
          'Moonlace filaments shimmer across Aderyn\'s ledger.',
          '"With this light I can expose the Palace forgeries before the next ration decree lands."'
        ]
      }
    ]
  },
  {
    id: 'fen-warden-lys',
    name: 'Warden Lys',
    title: 'Fen Boundary Warden',
    description: 'Guards the Dawnmire crossings where sleepers wander when the tides recede.',
    location: { x: 60, y: 84, region: 'Dusk Tunnels Fen' },
    dialogues: [
      {
        id: 'lys-greeting',
        title: 'Mistwatch Briefing',
        fallback: true,
        requires: [],
        lines: [
          'Lys plants a staff beside the marsh lights.',
          '"You walk brinks others fear. Tell me what the reeds whispered while you crossed."'
        ]
      },
      {
        id: 'lys-dawnmire',
        title: 'Reed Signal Mapping',
        requires: ['dawnmire-reed'],
        lines: [
          '"These reeds warned of tide reversals in time," Lys nods.',
          '"I\'ll weave them into our sentry bells so no pilgrim sinks again."'
        ]
      },
      {
        id: 'lys-gloomcap',
        title: 'Gloomcap Lantern Net',
        requires: ['gloomcap-mantle'],
        lines: [
          'Lys strings the mantle between watch posts.',
          '"Let\'s trap the worst shadows before the Palace patrols drift this way."'
        ]
      }
    ]
  },
  {
    id: 'skyglass-mechanist',
    name: 'Mechanist Corin',
    title: 'Skyglass Mechanist',
    description: 'Maintains the atlas instruments that align the Alchemists\' Span with the sky lanes.',
    location: { x: 48, y: 44, region: "Alchemists' Span" },
    dialogues: [
      {
        id: 'corin-greeting',
        title: 'Calibration Exchange',
        fallback: true,
        requires: [],
        lines: [
          'Corin adjusts a skyglass dial to match your arrival.',
          '"Your routes correct our instruments faster than any guild apprentice. Keep sharing their drift."'
        ]
      },
      {
        id: 'corin-honeyglobe',
        title: 'Honeyglobe Coolant',
        requires: ['honeyglobe-capsule'],
        lines: [
          '"Honeyglobe nectar steadies the condenser," Corin grins.',
          '"I\'ll freeze a map-layer for you once it settles."'
        ]
      },
      {
        id: 'corin-zephyr',
        title: 'Zephyr Compass Draft',
        requires: ['zephyr-peony'],
        lines: [
          'Corin slots peony petals into the compass cage.',
          '"With this, the sky lanes will echo your footpaths. Expect more runners at your side."'
        ]
      }
    ]
  },
  {
    id: 'village-oracle',
    name: 'The Oracle',
    title: 'Gate Seer',
    description: 'A lyrical seer guarding the village gate and waiting for the Parade to return.',
    location: { x: 42, y: 50, region: 'Verdant Hollows' },
    dialogues: [
      {
        id: 'oracle-greeting',
        title: 'Vision at the Gate',
        fallback: true,
        requires: [],
        lines: [
          '"Ah, traveler! I hope your journey here was kind," the Oracle smiles.',
          '"If you can find the gate key, perhaps you can help us remember how to dream again."'
        ]
      },
      {
        id: 'oracle-parade-invite',
        title: 'Parade Premonition',
        requires: ['teal-crown-root'],
        lines: [
          'The Oracle gasps as the root you carry shimmers.',
          '"That Crown Root gleams like the drums from my vision. When the Mayor calls, stand with me and we will open the gate."'
        ]
      }
    ]
  },
  {
    id: 'hollow-forager',
    name: 'The Forager',
    title: 'Dreamroot Gatherer',
    description: 'A gentle villager who pieces together memories from scattered spores.',
    location: { x: 36, y: 62, region: 'Verdant Hollows' },
    dialogues: [
      {
        id: 'forager-welcome',
        title: 'Quiet Greeting',
        fallback: true,
        requires: [],
        lines: [
          '"A newcomer! Welcome to our quiet corner."',
          '"I sometimes remember fragments of dreams. Would you help me search for them?"'
        ]
      },
      {
        id: 'forager-dreamroot',
        title: 'Dreamroot Gratitude',
        requires: ['dreamroot'],
        lines: [
          'The Forager cradles the Dreamroot you deliver.',
          '"Thank you. Maybe dreams will come to me again—and to everyone you meet."'
        ]
      }
    ]
  },
  {
    id: 'forest-thornbinder',
    name: 'Thornbinder',
    title: 'Caretaker of Sparks',
    description: 'Tends shimmering plants near the village gate and catalogues their secrets.',
    location: { x: 38, y: 58, region: 'Verdant Hollows' },
    dialogues: [
      {
        id: 'thornbinder-greeting',
        title: 'Listening Garden',
        fallback: true,
        requires: [],
        lines: [
          '"There are a lot of different plants around the village; if they sparkle and glow you can learn from them."',
          '"The plants are listening. Tread gently."'
        ]
      },
      {
        id: 'thornbinder-secrets',
        title: 'Glassfern Secrets',
        requires: ['glassfern-scribes'],
        lines: [
          'Thornbinder traces the transparent fronds between their fingers.',
          '"See? The scribes catch every whisper. Promise me you will archive what they reveal."'
        ]
      }
    ]
  },
  {
    id: 'village-murmurer',
    name: 'Murmurer',
    title: 'Choir Devotee',
    description: 'A storyteller who reminds visitors who shaped the Dreamless Kingdom.',
    location: { x: 40, y: 56, region: 'Verdant Hollows' },
    dialogues: [
      {
        id: 'murmurer-greeting',
        title: 'Soft Reminder',
        fallback: true,
        requires: [],
        lines: [
          '"This world was made by Hyperdense!" the Murmurer proclaims.',
          '"Be sure to press X near villagers and plants—the Cantor still hasn’t sung back, but we wait."'
        ]
      },
      {
        id: 'murmurer-chorus',
        title: 'Chorus Whisper',
        requires: ['chorus-spore-cluster'],
        lines: [
          'They inhale the spores you share and shiver.',
          '"These echoes belong to the Choir. Keep them close until their hymn returns."'
        ]
      }
    ]
  },
  {
    id: 'market-shopper',
    name: 'The Shopper',
    title: 'Guarded Collector',
    description: 'Hoarder of rare supplies who only trades when genuine need is shown.',
    location: { x: 46, y: 66, region: 'Sunken Promenade' },
    dialogues: [
      {
        id: 'shopper-suspicion',
        title: 'Protective Hoard',
        fallback: true,
        requires: [],
        lines: [
          '"You\'re here to take my treasures, aren’t you?" the Shopper narrows their eyes.',
          '"If you need something, come with a purpose."'
        ]
      },
      {
        id: 'shopper-mint',
        title: 'Mint Negotiation',
        requires: ['mint-cluster'],
        lines: [
          'They weigh the mint in careful hands.',
          '"Don’t tell the Caretaker I shared this sprig. Maybe sharing was worth it after all."'
        ]
      }
    ]
  },
  {
    id: 'perfumer-adele',
    name: 'The Perfumer',
    title: 'Scent Archivist',
    description: 'Distils incense to draw forgotten creatures back toward the village.',
    location: { x: 48, y: 64, region: 'Sunken Promenade' },
    dialogues: [
      {
        id: 'perfumer-request',
        title: 'Incense Plea',
        fallback: true,
        requires: [],
        lines: [
          '"I\'ve nearly perfected an incense that attracts the village’s rarest creatures—but I\'ve run out of mint."',
          '"Could you ask the Shopper for some?"'
        ]
      },
      {
        id: 'perfumer-incense',
        title: 'Scent of Trust',
        requires: ['mint-cluster'],
        lines: [
          'She inhales the minted bundle and smiles.',
          '"The incense works beautifully thanks to you. I\'ll remember who helped the village breathe again."'
        ]
      }
    ]
  },
  {
    id: 'teacher-brin',
    name: 'The Teacher',
    title: 'Aspiring Smith',
    description: 'A teacher dreaming of metalwork after years spent watching Hammer craft.',
    location: { x: 52, y: 64, region: 'Sunken Promenade' },
    dialogues: [
      {
        id: 'teacher-dream',
        title: 'Trying New Tools',
        fallback: true,
        requires: [],
        lines: [
          '"I’ve always wanted to try my hand at metalwork, but I never had the time," they admit.',
          '"Maybe if I had a bit of copper I could start something small."'
        ]
      },
      {
        id: 'teacher-copper',
        title: 'Copper Confidence',
        requires: ['bio-copper-bar'],
        lines: [
          'They cradle the bio-copper bar like a precious text.',
          '"This feels so exciting. Maybe this will be the start of something."'
        ]
      }
    ]
  },
  {
    id: 'almskeeper-iora',
    name: 'The Almskeeper',
    title: 'Keeper of Lost Manifestos',
    description: 'Collects forbidden writings to challenge the Palace’s version of history.',
    location: { x: 32, y: 46, region: 'Whispering Arboretum' },
    dialogues: [
      {
        id: 'almskeeper-greeting',
        title: 'Buried Truths',
        fallback: true,
        requires: [],
        lines: [
          '"Do you come bearing burdens? Or searching for those not yet yours?"',
          '"Perhaps if we had the Lost Manifestos, we could make some changes within the palace."'
        ]
      },
      {
        id: 'almskeeper-manifesto',
        title: 'Manifesto Restoration',
        requires: ['archive-lichen-scroll'],
        lines: [
          'The Almskeeper studies the living scroll you recovered.',
          '"This truth doesn’t need a sermon. It needs a vessel. Thank you for listening when others chose silence."'
        ]
      }
    ]
  },
  {
    id: 'visionary-kael',
    name: 'The Visionary',
    title: 'Disillusioned Architect',
    description: 'A Palace architect who longs to build with hope instead of compliance.',
    location: { x: 60, y: 44, region: 'Shatterlight Forge' },
    dialogues: [
      {
        id: 'visionary-frustration',
        title: 'Prefab Lament',
        fallback: true,
        requires: [],
        lines: [
          '"It’s nothing. Deadlines. Prefab plans. No artistry. No soul."',
          '"Somewhere I left blueprints that still listen before they speak."'
        ]
      },
      {
        id: 'visionary-mineral',
        title: 'Sparkling Inspiration',
        requires: ['sparkling-mineral'],
        lines: [
          'They hold the mineral to the light until it hums.',
          '"Tell the Taskmaster I expect daring. With this spark we can build with hope again."'
        ]
      }
    ]
  },
  {
    id: 'mayor-lute',
    name: 'The Mayor',
    title: 'Parade Steward',
    description: 'Coordinates the Parade while shielding the village from Palace oversight.',
    location: { x: 44, y: 52, region: 'Verdant Hollows' },
    dialogues: [
      {
        id: 'mayor-greeting',
        title: 'Parade Preparations',
        fallback: true,
        requires: [],
        lines: [
          '"Preparations are nearly complete for the Parade," the Mayor beams.',
          '"Hope, mostly. The Palace wants spectacle, but this memory is for us."'
        ]
      },
      {
        id: 'mayor-crown-root',
        title: 'Gate Signal',
        requires: ['teal-crown-root'],
        lines: [
          'They recognize the teal glow immediately.',
          '"With that root we can begin the Parade right away. Will you stand with us when the gate opens?"'
        ]
      }
    ]
  },
  {
    id: 'alchemist-vessa',
    name: 'The Alchemist',
    title: 'Fog Distiller',
    description: 'Studies the creeping fog and bottles memories before they fade.',
    location: { x: 46, y: 46, region: "Alchemists' Span" },
    dialogues: [
      {
        id: 'alchemist-request',
        title: 'Honeyglobe Appeal',
        fallback: true,
        requires: [],
        lines: [
          '"The fog started flowing a few years back. If I only had a Honeyglobe Capsule I could brew a memory potion."',
          '"Better to bottle a nightmare than to let it loose."'
        ]
      },
      {
        id: 'alchemist-clarity',
        title: 'Golden Cap Refinement',
        requires: ['golden-cap-sphere'],
        lines: [
          'She swirls the sphere until the fog clears from her eyes.',
          '"Thanks to you I\'m out of this mind fog. Maybe I can do something about the environmental fog too."'
        ]
      }
    ]
  },
  {
    id: 'harvester-ryx',
    name: 'The Harvester',
    title: 'Spore Field Tender',
    description: 'Cuts only ripened fungi and listens for the stories each harvest carries.',
    location: { x: 34, y: 66, region: 'Verdant Hollows' },
    dialogues: [
      {
        id: 'harvester-intro',
        title: 'Beauty in Decay',
        fallback: true,
        requires: [],
        lines: [
          '"There’s beauty in decay, if you know how to cut it clean."',
          '"Everything we grow remembers. Even what we bury feeds something."'
        ]
      },
      {
        id: 'harvester-emberleaf',
        title: 'Emberleaf Gratitude',
        requires: ['emberleaf-vines'],
        lines: [
          'Ryx braids the emberleaf into a glowing wreath.',
          '"You harvested fullness, not volume. Take this blessing of warmth along your route."'
        ]
      }
    ]
  },
  {
    id: 'dewkeeper-sol',
    name: 'The Dewkeeper',
    title: 'Mist Listener',
    description: 'Half plant, half caretaker, safeguarding the morning’s breath on the moss.',
    location: { x: 30, y: 58, region: 'Verdant Hollows' },
    dialogues: [
      {
        id: 'dewkeeper-greeting',
        title: 'Hushed Steps',
        fallback: true,
        requires: [],
        lines: [
          '"Hush… walk softer here. The morning’s breath still clings to the moss."',
          '"Not entirely a plant, but enough to dream like one."'
        ]
      },
      {
        id: 'dewkeeper-gratitude',
        title: 'Aperture Blessing',
        requires: ['carapace-aperture'],
        lines: [
          'They study the aperture you present with reverence.',
          '"I’m so glad you helped the Mothwing. May this dew you carry now keep your journey bright."'
        ]
      }
    ]
  },
  {
    id: 'torchbearer-elan',
    name: 'The Torchbearer',
    title: 'Tunnel Guide',
    description: 'Keeps the tunnel torches lit so travelers don’t forget themselves in the dark.',
    location: { x: 62, y: 66, region: 'Deep Mines' },
    dialogues: [
      {
        id: 'torchbearer-warning',
        title: 'Hold the Flame',
        fallback: true,
        requires: [],
        lines: [
          '"Keep to the lit paths. The shadows twist stranger than they seem."',
          '"Someone has to hold the flame, even if it only pushes the dark back a little."'
        ]
      },
      {
        id: 'torchbearer-lantern',
        title: 'Crown Root Favor',
        requires: ['ambercrest-lantern'],
        lines: [
          'They cradle the lantern and breathe easier.',
          '"With this Ambercrest glow I can rest for a moment. Take this Crown Root to the Mayor—tell them the tunnels approve."'
        ]
      }
    ]
  },
  {
    id: 'sporeborn-twins',
    name: 'Sporeborn Duo',
    title: 'Dream Photographers',
    description: 'Two friends chronicling beauty so their shared memories do not fade.',
    location: { x: 58, y: 60, region: 'Deep Mines' },
    dialogues: [
      {
        id: 'sporeborn-greeting',
        title: 'Shared Lens',
        fallback: true,
        requires: [],
        lines: [
          '"This place is really pretty, don’t you think?" one asks while snapping a picture.',
          '"My friend lost their camera, though. If only we had another."'
        ]
      },
      {
        id: 'sporeborn-camera',
        title: 'Camera Returned',
        requires: ['lost-camera'],
        lines: [
          'They clutch the recovered camera with delight.',
          '"We’ll take pictures of everything now! Here—share this Sunspore Eye so the light travels with you."'
        ]
      },
      {
        id: 'sporeborn-gift',
        title: 'Sunspore Snapshot',
        requires: ['sunspore-eye'],
        lines: [
          'The duo compare the lens you carry with their prints.',
          '"Keep that eye open. Every path deserves to be remembered."'
        ]
      }
    ]
  },
  {
    id: 'excavator-june',
    name: 'The Excavator',
    title: 'Echo Listener',
    description: 'Remains in the mines to hear what the earth remembers after the crews were dismissed.',
    location: { x: 64, y: 72, region: 'Deep Mines' },
    dialogues: [
      {
        id: 'excavator-greeting',
        title: 'Loose Earth',
        fallback: true,
        requires: [],
        lines: [
          '"Keep your helmet low. The earth here is loose—memories shift and settle when you least expect it."',
          '"If you’re not afraid of ghosts, maybe you’d help me chase a few out."'
        ]
      },
      {
        id: 'excavator-reward',
        title: 'Echo Token',
        requires: ['sparkling-mineral'],
        lines: [
          'They feel the ground settle as the mineral hums.',
          '"You found them. Here—take this token, a story etched in stone."'
        ]
      }
    ]
  },
  {
    id: 'veilspinner-sera',
    name: 'The Veilspinner',
    title: 'Shadow Weaver',
    description: 'Maps hidden figures in the Dark Forest and mends the veil between memories.',
    location: { x: 28, y: 48, region: 'Whispering Arboretum' },
    dialogues: [
      {
        id: 'veilspinner-offer',
        title: 'Woven Challenge',
        fallback: true,
        requires: [],
        lines: [
          '"Ah, a stranger caught at the edge of my weaving. Do you have a steady hand and sharper eye?"',
          '"If you can find those I’ve lost, I’ll see that your journey isn’t forgotten."'
        ]
      },
      {
        id: 'veilspinner-reward',
        title: 'Memento Threads',
        requires: ['blooming-robes'],
        lines: [
          'She drapes the robes across her loom and smiles.',
          '"You found them all—very few manage that. May this token remind you that what’s hidden can return to the light."'
        ]
      }
    ]
  },
  {
    id: 'devout-keeper',
    name: 'The Devout',
    title: 'Shrine Watcher',
    description: 'Keeps vigil beside a quiet shrine, waiting for dreams to return.',
    location: { x: 30, y: 44, region: 'Whispering Arboretum' },
    dialogues: [
      {
        id: 'devout-greeting',
        title: 'Silent Shrine',
        fallback: true,
        requires: [],
        lines: [
          '"This shrine once sang with dreams. Now it chokes on silence. Still... I wait."',
          '"Devotion isn’t about reward. It’s about holding space so something lost knows where to return."'
        ]
      },
      {
        id: 'devout-manifesto',
        title: 'Token of Faith',
        requires: ['archive-lichen-scroll'],
        lines: [
          'They accept the living script with awe.',
          '"Here, take this token—perhaps it will awaken the shrine and the Sleeper will hear us again."'
        ]
      }
    ]
  },
  {
    id: 'gossamer-weaver',
    name: 'Gossamer',
    title: 'Thread Archivist',
    description: 'Weaves fragile memory threads through the Dark Forest canopy.',
    location: { x: 32, y: 50, region: 'Whispering Arboretum' },
    dialogues: [
      {
        id: 'gossamer-greeting',
        title: 'Fragile Threads',
        fallback: true,
        requires: [],
        lines: [
          '"Careful where you step. The threads are fragile—and not all of them were spun by me."',
          '"I try to hold the past together, even if the weave unravels the moment you blink."'
        ]
      },
      {
        id: 'gossamer-vessel',
        title: 'Stillmoon Trade',
        requires: ['stillmoon-vessel'],
        lines: [
          'She turns the vessel in the dim light.',
          '"This may help me hold the past together. Take my old lens—its focus belongs with you now."'
        ]
      }
    ]
  },
  {
    id: 'gatherer-nim',
    name: 'The Gatherer',
    title: 'Memory Hoarder',
    description: 'Collects abandoned curios so their stories aren’t erased by the Palace.',
    location: { x: 60, y: 68, region: 'Deep Mines' },
    dialogues: [
      {
        id: 'gatherer-greeting',
        title: 'Worth of Remnants',
        fallback: true,
        requires: [],
        lines: [
          '"I collect what others leave behind. Shells, buttons, fragments of song—anything that still remembers being wanted."',
          '"The Palace calls it hoarding. I call it remembering."'
        ]
      },
      {
        id: 'gatherer-key',
        title: 'Crimson Bargain',
        requires: ['crimson-dome-key'],
        lines: [
          'They trade the key for something wrapped in cloth.',
          '"I found this old camera around the mines. Take it, and promise you’ll keep its memories alive."'
        ]
      }
    ]
  },
  {
    id: 'pollinator-sae',
    name: 'The Pollinator',
    title: 'Swarm Guide',
    description: 'Listens to pollinating custodians that carry memories between blooms.',
    location: { x: 68, y: 56, region: 'Veiled Colonnade' },
    dialogues: [
      {
        id: 'pollinator-greeting',
        title: 'Shimmering Calm',
        fallback: true,
        requires: [],
        lines: [
          '"Shhh—don’t startle them. They’ve just begun to settle."',
          '"They’re not bugs. Carriers. Custodians of pollen and memory."'
        ]
      },
      {
        id: 'pollinator-lens',
        title: 'Lens Exchange',
        requires: ['umbral-iris-lens'],
        lines: [
          'They fit the lens atop a humming flower.',
          '"You’re so generous! Tell the Manager the plants should be ready for the Parade."'
        ]
      }
    ]
  },
  {
    id: 'gardener-elm',
    name: 'The Gardener',
    title: 'Memory Tiller',
    description: 'Keeps beds planted for ceremonies of remembrance and resistance.',
    location: { x: 34, y: 60, region: 'Verdant Hollows' },
    dialogues: [
      {
        id: 'gardener-greeting',
        title: 'Memory Beds',
        fallback: true,
        requires: [],
        lines: [
          '"Mind your step. These beds aren’t just for food—they’re for remembering."',
          '"Each row was planted for someone. The soil holds stories if you’re willing to listen."'
        ]
      },
      {
        id: 'gardener-salve',
        title: 'Relieved Roots',
        requires: ['bottled-salve'],
        lines: [
          'They massage the salve into aching hands.',
          '"Amazing—this is just what my joints need. Take this Ambercrest Lantern to the torchbearer."'
        ]
      }
    ]
  },
  {
    id: 'mothwing-kera',
    name: 'The Mothwing',
    title: 'Light Scout',
    description: 'Studies light that bends around hidden paths between dreams.',
    location: { x: 32, y: 56, region: 'Verdant Hollows' },
    dialogues: [
      {
        id: 'mothwing-greeting',
        title: 'Bent Light',
        fallback: true,
        requires: [],
        lines: [
          '"You ever seen light bend? Not just shimmer—but bow, as if it’s ashamed of what it reveals?"',
          '"All good things are dangerous. That’s why we hide them."'
        ]
      },
      {
        id: 'mothwing-aperture',
        title: 'Shared Aperture',
        requires: ['carapace-aperture'],
        lines: [
          'She recognizes the aperture from her dreams.',
          '"Incredible! I’ll tell the Dewkeeper you helped me. Follow the light where it leads."'
        ]
      }
    ]
  },
  {
    id: 'husktender-vale',
    name: 'The Husktender',
    title: 'Hide-and-Seek Host',
    description: 'Organises games in the Dark Forest to keep friendships from fading.',
    location: { x: 26, y: 54, region: 'Whispering Arboretum' },
    dialogues: [
      {
        id: 'husktender-invite',
        title: 'Seeking Help',
        fallback: true,
        requires: [],
        lines: [
          '"Do you think you could help me? First you’ll need to prove yourself—find all my friends hiding in the clearing."',
          '"If you find my friend I’ll take you to the Parade with me!"'
        ]
      },
      {
        id: 'husktender-grateful',
        title: 'Reward of Trust',
        requires: ['sunspore-eye'],
        lines: [
          'They admire the glinting eye you now carry.',
          '"You did it! You found them all. I can trust you with finding my friend now."'
        ]
      }
    ]
  },
  {
    id: 'maestro-lyr',
    name: 'The Maestro',
    title: 'Parade Conductor',
    description: 'Rehearses tirelessly so the Parade sounds perfect when the gate opens.',
    location: { x: 48, y: 50, region: 'Gilt Palace Conservatory' },
    dialogues: [
      {
        id: 'maestro-greeting',
        title: 'Perfect Cadence',
        fallback: true,
        requires: [],
        lines: [
          '"Shhh! Listen. The Parade must be perfect—every note practiced to the edge of collapse."',
          '"Not yet. The gate remains shut, and so the symphony remains unheard."'
        ]
      },
      {
        id: 'maestro-inspiration',
        title: 'Gifted Arrangements',
        requires: ['golden-cap-sphere', 'lilac-crown-terrarium'],
        lines: [
          'They pair the sphere with the terrarium until the miniature floats sway in time.',
          '"I can’t believe you found them! Take my most valued possession—let the others know music still cares for them."'
        ]
      }
    ]
  },
  {
    id: 'florist-ren',
    name: 'The Florist',
    title: 'Wild Bed Curator',
    description: 'Cultivates conversational blooms that bite back when ignored.',
    location: { x: 34, y: 50, region: 'Whispering Arboretum' },
    dialogues: [
      {
        id: 'florist-greeting',
        title: 'Careful Footing',
        fallback: true,
        requires: [],
        lines: [
          '"Welcome—mind your step. The petals bruise easily, and some of them bite back."',
          '"I used to keep things tidy. Now I let the wildness speak—it’s not chaos, it’s memory made visible."'
        ]
      },
      {
        id: 'florist-umbrella',
        title: 'Shaded Beds',
        requires: ['glassmoss-umbrella'],
        lines: [
          'They unfurl the umbrella over a temperamental bed.',
          '"This is perfect. I hear the Fungalmonger took something from the Gatherer—maybe you can mend that rift next."'
        ]
      }
    ]
  }
];

const RARITY_TABLE = [
  {
    key: 'common',
    label: 'Common Strain',
    weight: 42,
    flavor: 'Tonight the strain settles readily along public walkways, eager to be tended.'
  },
  {
    key: 'rare',
    label: 'Rare Bloom',
    weight: 32,
    flavor: 'Sightings are scarce; only patient caretakers can coax the petals to unfurl.'
  },
  {
    key: 'mythic',
    label: 'Mythic Bloom',
    weight: 18,
    flavor: 'Legends whisper of this radiance. Its glow resurfaces when the archive is most attentive.'
  },
  {
    key: 'unstable',
    label: 'Unstable Phenotype',
    weight: 8,
    flavor: 'Volatile motes flicker from the specimen. Handle with patient, gloved hands.'
  }
];

const MUTATION_TRAITS = [
  {
    label: 'Echo-Touched',
    description: 'Echo-touched filaments hum with choir overtones, attracting soundkeepers within earshot.',
    hook: 'Record the resonance before the Palace bellkeepers dampen it again.'
  },
  {
    label: 'Glacier-Kissed',
    description: 'A glacier-kissed sheen keeps the bloom cool, leaving frost prints on the soil it touches.',
    hook: 'Ferry a shard of its chill to the Verdant Hollows cistern before dawn.'
  },
  {
    label: 'Aurora-Threshed',
    description: 'Aurora-threshed petals refract stray starlight into shimmering pollen streams.',
    hook: 'Document the refraction angles for the skywright guild.'
  },
  {
    label: 'Tide-Bound',
    description: 'The bloom exhales brine-laced mist, pulsing in rhythm with unseen tides below the city.',
    hook: 'Sync the mist cadence with the Tideglass Observatory to predict the next surge.'
  }
];

const CONDITION_TRAITS = [
  {
    label: 'Moonshadow Veil',
    description: 'Requires a moonshadow veil cast through mirrored basins; otherwise it withdraws into the soil.',
    hook: 'Assemble portable mirrors to keep the veil stable during transport.'
  },
  {
    label: 'Silent Watch',
    description: 'Thrives only when bells and engines fall silent; any clamor causes petals to seal.',
    hook: 'Broker a quiet corridor through the Carnival Quarter to escort it safely.'
  },
  {
    label: 'Ember Rite',
    description: 'Needs a steady ember rite, with low coals circling its roots to keep the colors vivid.',
    hook: 'Secure emberleaf braids to weave around the staging crate.'
  },
  {
    label: 'Brine Wake',
    description: 'Feeds on brine wake condensation harvested from subterranean currents.',
    hook: 'Collect fresh condensation vials from the Tideglass wardens.'
  }
];

const QUIRK_TRAITS = [
  {
    label: 'Flux Spores',
    description: 'Flux spores spill from its core, rewriting nearby moss with archival script.',
  },
  {
    label: 'Lantern Heart',
    description: 'A lantern heart pulse glows beneath the petals, brightening with each whispered story.',
  },
  {
    label: 'Memory Resin',
    description: 'Memory resin beads along the stems, storing fleeting impressions of onlookers.',
  },
  {
    label: 'Skylace Tendrils',
    description: 'Skylace tendrils float weightlessly, drifting toward strong currents of imagination.',
  }
];

const CYCLE_THEMES = [
  {
    key: 'amberdrift',
    label: 'Amberdrift Cycle',
    description: 'Ley amber glitters through the Hollows, heightening sap resonance across the kingdom.',
    prompt: 'Amber currents coax sweeter resins from each cooperative bloom tonight.'
  },
  {
    key: 'cinderwake',
    label: 'Cinderwake Cycle',
    description: 'Dormant embers reignite along the Carnival routes, tinting flora with warm flares.',
    prompt: 'Smouldering breezes encourage even shy petals to release stored illumination.'
  },
  {
    key: 'tidelight',
    label: 'Tidelight Cycle',
    description: 'Subterranean tides surge upward, lacing the air with luminous brine.',
    prompt: 'Aquifer pulses tug roots sideways and lure plankton motes to every bloom.'
  },
  {
    key: 'silencebloom',
    label: 'Silence Bloom Cycle',
    description: 'Palace bells fall mute; flora answer with rare, still attention.',
    prompt: 'In the hush, spores weave new memory threads for careful listeners to follow.'
  },
  {
    key: 'auroral',
    label: 'Auroral Scatter Cycle',
    description: 'Skybreak storms drop prismatic dust that refracts through canopy and stone alike.',
    prompt: 'Prismatic scatter rewrites pigments, bending light to hint at forgotten paths.'
  }
];

function hashString(str){
  let h = 0;
  for(let i = 0; i < str.length; i++){
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h >>> 0;
}

function mulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function pick(list, rng){
  if(!list.length) return null;
  const index = Math.floor(rng() * list.length);
  return list[Math.min(index, list.length - 1)];
}

function pickMany(list, count){
  if(!Array.isArray(list) || !list.length || count <= 0) return [];
  const pool = list.slice();
  const result = [];
  while(pool.length && result.length < count){
    const index = Math.floor(Math.random() * pool.length);
    const [item] = pool.splice(index, 1);
    if(item != null){
      result.push(item);
    }
  }
  return result;
}

function weightedPick(list, rng){
  const total = list.reduce((sum, item)=> sum + item.weight, 0);
  let r = rng() * total;
  for(const item of list){
    r -= item.weight;
    if(r <= 0){
      return item;
    }
  }
  return list[list.length - 1];
}

function joinSentences(...parts){
  return parts
    .map(part => (part || '').toString().trim())
    .filter(Boolean)
    .join(' ');
}

function pickCycle(seed){
  const index = hashString(`cycle:${seed}`) % CYCLE_THEMES.length;
  return CYCLE_THEMES[index];
}

function buildVariantProfile(entry, seed, cycle){
  const rng = mulberry32(hashString(`${entry.id}|${seed}`));
  const rarity = weightedPick(RARITY_TABLE, rng);
  const mutation = pick(MUTATION_TRAITS, rng);
  const condition = pick(CONDITION_TRAITS, rng);
  const quirk = pick(QUIRK_TRAITS, rng);
  const description = joinSentences(
    rarity?.flavor,
    mutation?.description,
    quirk?.description,
    condition?.description,
    cycle?.prompt
  );
  const hook = joinSentences(mutation?.hook, condition?.hook);
  return {
    rarity: rarity?.label,
    rarityKey: rarity?.key,
    rarityClass: rarity ? `rarity-${rarity.key}` : '',
    mutation: mutation?.label,
    mutationDescription: mutation?.description,
    condition: condition?.label,
    conditionDescription: condition?.description,
    quirk: quirk?.label,
    quirkDescription: quirk?.description,
    cycleKey: cycle?.key,
    cycleLabel: cycle?.label,
    description,
    hook,
  };
}

function applyVariantProfiles(entries){
  if(!entries?.length) return null;
  const seed = new Date().toISOString().slice(0, 10);
  const cycle = pickCycle(seed);
  entries.forEach(entry => {
    const variant = buildVariantProfile(entry, seed, cycle);
    entry.variant = variant;
    entry.displaySummary = joinSentences(entry.summary, variant?.description);
  });
  return {
    seed,
    label: cycle?.label,
    description: cycle?.description,
    prompt: cycle?.prompt,
  };
}

function renderVariantCycle(){
  const el = document.getElementById('variant-cycle');
  if(!el) return;
  if(!state.variantCycle){
    el.textContent = 'Cycle harmonics calibrating…';
    return;
  }
  const { label, description, prompt, seed } = state.variantCycle;
  el.innerHTML = `
    <strong>${label || 'Cycle Pending'}</strong>
    ${description ? `<span class="note">${description}</span>` : ''}
    ${prompt ? `<span class="note">${prompt}</span>` : ''}
    <span class="note">Seed ${seed}</span>
  `;
}

function applyLandscapeSpread(value){
  if(value == null) return 50;
  const offset = value - 50;
  const scaled = 50 + offset * LANDSCAPE_SPREAD;
  return clampNumber(scaled, 0, 100);
}

function projectIsoPoint(x, y){
  if(x == null || y == null) return { left: 50, top: 50 };
  const sx = clampNumber(applyLandscapeSpread(x), 0, 100);
  const sy = clampNumber(applyLandscapeSpread(y), 0, 100);
  const left = ISO_PROJECTION.marginX / 2 + (sx / 100) * ISO_PROJECTION.scaleX;
  const top = ISO_PROJECTION.marginYTop + (sy / 100) * ISO_PROJECTION.scaleY;
  return {
    left: Math.min(100, Math.max(0, left)),
    top: Math.min(100, Math.max(0, top)),
  };
}

function projectIsoSize(width, height){
  const w = Math.max(0, Number.isFinite(width) ? width : 0);
  const hSource = Number.isFinite(height) ? height : width;
  const h = Math.max(0, hSource);
  const scaledWidth = (w / 100) * ISO_PROJECTION.scaleX * MAP_ZONE_SIZE_SCALE;
  const scaledHeight = (h / 100) * ISO_PROJECTION.scaleY * MAP_ZONE_SIZE_SCALE;
  const minSize = 6;
  return {
    width: Math.min(ISO_PROJECTION.scaleX, Math.max(scaledWidth, minSize)),
    height: Math.min(ISO_PROJECTION.scaleY, Math.max(scaledHeight, minSize)),
  };
}

function rectanglesOverlap(a, b){
  if(!a || !b) return false;
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function clampNumber(value, min, max){
  if(!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function scatterCoordinate(base, radius = 6){
  const origin = base && Number.isFinite(base.x) && Number.isFinite(base.y)
    ? { x: base.x, y: base.y }
    : { x: 50, y: 50 };
  const r = Math.max(0, Number.isFinite(radius) ? radius : 0);
  if(r === 0){
    return {
      x: clampNumber(origin.x, 4, 96),
      y: clampNumber(origin.y, 4, 96),
    };
  }
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * r;
  return {
    x: clampNumber(origin.x + Math.cos(angle) * distance, 4, 96),
    y: clampNumber(origin.y + Math.sin(angle) * distance, 4, 96),
  };
}

function seededRandom(seed, index = 0){
  const value = Math.sin((seed || 1) * 1337.13 + index * 97.73) * 43758.5453;
  return value - Math.floor(value);
}

function seededJitter(seed, index, amplitude = 1){
  return (seededRandom(seed, index) - 0.5) * 2 * amplitude;
}

function pickOne(list, fallback = null){
  if(!Array.isArray(list) || !list.length) return fallback;
  const index = Math.floor(Math.random() * list.length);
  return list[index] ?? fallback;
}

function pickOneSeeded(list, seed, offset = 0){
  if(!Array.isArray(list) || !list.length) return null;
  const value = seededRandom(seed, offset);
  const index = Math.floor(value * list.length) % list.length;
  return list[(index + list.length) % list.length];
}

function formatMoodLine(template, context = {}){
  if(!template) return '';
  return template
    .replaceAll('{source}', context.source || 'the route')
    .replaceAll('{zone}', context.zone || 'the kingdom')
    .replaceAll('{tone}', context.tone || '');
}

function ensureMapStructure(){
  const map = document.querySelector('#map');
  if(!map) return null;
  if(map._layers) return map._layers;
  map.innerHTML = '';
  const viewport = document.createElement('div');
  viewport.className = 'map-viewport';
  const world = document.createElement('div');
  world.className = 'map-world';
  world.style.setProperty('--map-world-size', `${(MAP_WORLD_SCALE * 100).toFixed(0)}%`);
  viewport.appendChild(world);
  const topographyLayer = document.createElement('div');
  topographyLayer.className = 'map-layer map-layer-topography';
  topographyLayer.setAttribute('aria-hidden', 'true');
  const topographyAscii = document.createElement('pre');
  topographyAscii.className = 'map-topography-ascii';
  topographyAscii.setAttribute('aria-hidden', 'true');
  topographyLayer.appendChild(topographyAscii);
  const pathSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pathSvg.classList.add('map-path');
  pathSvg.setAttribute('viewBox', '0 0 100 100');
  pathSvg.setAttribute('preserveAspectRatio', 'none');
  pathSvg.setAttribute('aria-hidden', 'true');
  const pathLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  pathLine.classList.add('map-path-line');
  pathLine.setAttribute('vector-effect', 'non-scaling-stroke');
  pathSvg.appendChild(pathLine);
  const zonesLayer = document.createElement('div');
  zonesLayer.className = 'map-layer map-layer-zones';
  const markersLayer = document.createElement('div');
  markersLayer.className = 'map-layer map-layer-markers';
  const eventsLayer = document.createElement('div');
  eventsLayer.className = 'map-layer map-layer-events';
  const npcLayer = document.createElement('div');
  npcLayer.className = 'map-layer map-layer-npcs';
  const actorsLayer = document.createElement('div');
  actorsLayer.className = 'map-layer map-layer-actors';
  world.append(topographyLayer, pathSvg, zonesLayer, markersLayer, eventsLayer, npcLayer, actorsLayer);
  map.appendChild(viewport);
  const detail = document.createElement('div');
  detail.id = 'map-zone-detail';
  detail.className = 'map-zone-detail';
  detail.setAttribute('aria-live', 'polite');
  detail.setAttribute('aria-atomic', 'true');
  detail.hidden = true;
  map.appendChild(detail);
  const arrival = document.createElement('div');
  arrival.id = 'map-zone-arrival';
  arrival.className = 'map-zone-arrival';
  arrival.setAttribute('aria-live', 'polite');
  arrival.setAttribute('aria-atomic', 'true');
  map.appendChild(arrival);
  const telemetry = document.getElementById('telemetry-readout');
  map._layers = {
    viewport,
    world,
    topography: { layer: topographyLayer, ascii: topographyAscii },
    path: { svg: pathSvg, line: pathLine },
    zones: zonesLayer,
    markers: markersLayer,
    events: eventsLayer,
    npcs: npcLayer,
    actors: actorsLayer,
    detail,
    arrival,
    telemetry,
  };
  renderMapTopography(map._layers);
  if(state.mapCamera){
    if(typeof state.mapCamera.manual !== 'boolean'){
      state.mapCamera.manual = false;
    }
    world.style.setProperty('--map-offset-x', `${state.mapCamera.offsetX.toFixed(2)}px`);
    world.style.setProperty('--map-offset-y', `${state.mapCamera.offsetY.toFixed(2)}px`);
  }
  initMapCameraControls(map._layers);
  return map._layers;
}

function initMapCameraControls(layers){
  const viewport = layers?.viewport;
  const world = layers?.world;
  if(!viewport || !world) return;
  if(viewport._cameraControlsInitialized) return;
  viewport._cameraControlsInitialized = true;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  const isInteractiveTarget = (node)=>{
    if(!node) return false;
    return Boolean(node.closest('button, a, input, textarea, select, .marker, .map-event'));
  };
  viewport.addEventListener('pointerdown', (event)=>{
    if(typeof event.button === 'number' && event.button !== 0) return;
    if(dragPointerId !== null) return;
    if(isInteractiveTarget(event.target)) return;
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    const camera = state.mapCamera ||= { offsetX: 0, offsetY: 0, manual: false };
    dragOffsetX = camera.offsetX;
    dragOffsetY = camera.offsetY;
    camera.manual = true;
    viewport.classList.add('dragging');
    if(viewport.setPointerCapture){
      viewport.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  });
  viewport.addEventListener('pointermove', (event)=>{
    if(event.pointerId !== dragPointerId) return;
    const camera = state.mapCamera ||= { offsetX: 0, offsetY: 0, manual: false };
    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;
    const nextX = dragOffsetX + dx;
    const nextY = dragOffsetY + dy;
    camera.manual = true;
    updateMapCamera({ immediate: true, targetOffsets: { x: nextX, y: nextY } });
  });
  const endDrag = (event)=>{
    if(dragPointerId === null) return;
    if(event && event.pointerId !== dragPointerId) return;
    if(viewport.releasePointerCapture && dragPointerId !== null){
      try {
        viewport.releasePointerCapture(dragPointerId);
      } catch (err) {
        // Ignore release errors when pointer is already released.
      }
    }
    dragPointerId = null;
    viewport.classList.remove('dragging');
    updateMapCamera({ immediate: true });
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);
  viewport.addEventListener('dblclick', (event)=>{
    if(isInteractiveTarget(event.target)) return;
    const camera = state.mapCamera ||= { offsetX: 0, offsetY: 0, manual: false };
    camera.manual = false;
    updateMapCamera({ immediate: true, force: true });
    event.preventDefault();
  });
}

function resolveZoneFeatures(zone){
  if(!zone) return [];
  const features = new Map();
  MAP_TOPOLOGY_FEATURES.forEach(feature => {
    if(Array.isArray(feature?.influences) && feature.influences.includes(zone.name)){
      features.set(feature.id, { feature, weight: 1 });
    }
  });
  if(Array.isArray(zone.contours)){
    zone.contours.forEach(contour => {
      const id = contour?.feature || contour?.id;
      if(!id) return;
      const feature = TOPOLOGY_FEATURE_MAP.get(id);
      if(!feature) return;
      const weight = Number.isFinite(contour?.weight) ? contour.weight : 1;
      const existing = features.get(feature.id);
      if(existing){
        existing.weight += weight;
      } else {
        features.set(feature.id, { feature, weight });
      }
    });
  }
  return Array.from(features.values());
}

function computeZoneSeedValue(zone){
  const base = Number.isFinite(zone?.shapeSeed) ? zone.shapeSeed : 0;
  const text = zone?.name || '';
  let hash = 0;
  for(let i = 0; i < text.length; i += 1){
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 997) / 997;
  return base + normalized;
}

function seededNoise(seed, step){
  const value = Math.sin((seed + step * 0.37) * 12.9898 + (seed * 78.233)) * 43758.5453;
  return value - Math.floor(value);
}

function generateZoneClipPath(zone, features = resolveZoneFeatures(zone)){
  if(!zone) return null;
  const steps = 14;
  if(steps < 3) return null;
  const ratio = Number.isFinite(zone.height) && Number.isFinite(zone.width) && zone.width > 0
    ? clampNumber(zone.height / zone.width, 0.6, 1.6)
    : 1;
  const diameter = Math.max(zone.width || 0, zone.height || 0);
  const scale = clampNumber(diameter / 36, 0.7, 1.35);
  const baseRadius = 30 * scale;
  const minRadius = 18 * scale;
  const maxRadius = 52 * scale;
  const seed = computeZoneSeedValue(zone);
  const points = [];
  for(let i = 0; i < steps; i += 1){
    const angle = (i / steps) * Math.PI * 2;
    let radius = baseRadius + (seededNoise(seed, i) - 0.5) * 8;
    features.forEach(({ feature, weight }) => {
      if(!feature) return;
      const fx = feature.x - zone.x;
      const fy = feature.y - zone.y;
      if(!Number.isFinite(fx) || !Number.isFinite(fy)) return;
      const featureAngle = Math.atan2(fy, fx);
      let diff = angle - featureAngle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const angleInfluence = Math.cos(diff);
      if(angleInfluence <= 0) return;
      const dist = Math.hypot(fx, fy);
      const span = Math.max(zone.width || 0, zone.height || 0, feature.width || 0, feature.height || 0, 1);
      const distanceFactor = clampNumber(1 - (dist / (span * 1.1)), 0, 1);
      const type = feature.type || 'hill';
      const sign = (type === 'valley' || type === 'sink') ? -1 : (type === 'ridge' ? 0.8 : 1);
      const intensity = Number.isFinite(feature.intensity) ? feature.intensity : 1;
      const magnitude = (6 + (intensity - 1) * 8) * (Number.isFinite(weight) ? weight : 1);
      const directional = angleInfluence ** 1.6;
      radius += sign * directional * distanceFactor * magnitude;
    });
    radius = clampNumber(radius, minRadius, maxRadius);
    const px = clampNumber(50 + Math.cos(angle) * radius, -5, 105);
    const py = clampNumber(50 + Math.sin(angle) * radius * ratio, -5, 105);
    points.push(`${px.toFixed(2)}% ${py.toFixed(2)}%`);
  }
  if(points.length < 3) return null;
  return `polygon(${points.join(', ')})`;
}

function computeZoneOrientation(zone, features = resolveZoneFeatures(zone)){
  if(!zone || !features.length) return null;
  let sumX = 0;
  let sumY = 0;
  features.forEach(({ feature, weight }) => {
    if(!feature) return;
    const fx = feature.x - zone.x;
    const fy = feature.y - zone.y;
    if(!Number.isFinite(fx) || !Number.isFinite(fy) || (fx === 0 && fy === 0)) return;
    const type = feature.type || 'hill';
    const sign = (type === 'valley' || type === 'sink') ? -1 : (type === 'ridge' ? 0.6 : 1);
    const influenceWeight = (Number.isFinite(weight) ? weight : 1) * sign;
    sumX += fx * influenceWeight;
    sumY += fy * influenceWeight;
  });
  if(sumX === 0 && sumY === 0) return null;
  const angle = Math.atan2(sumY, sumX) * (180 / Math.PI);
  return (angle + 360) % 360;
}

function generateZoneAsciiArt(zone, orientation){
  const width = Number.isFinite(zone?.width) ? zone.width : 36;
  const height = Number.isFinite(zone?.height) ? zone.height : width;
  const gridWidth = clampNumber(Math.round(width / 2.4), 12, 22);
  const gridHeight = clampNumber(Math.round(height / 3.4), 6, 12);
  const normalizedOrientation = Number.isFinite(orientation)
    ? Math.abs(orientation % 180)
    : null;
  const orientationPatterns = [
    { limit: 22.5, pattern: '==' },
    { limit: 52.5, pattern: '/\\' },
    { limit: 82.5, pattern: '\\' },
    { limit: 112.5, pattern: '||' },
    { limit: 142.5, pattern: '\\/' },
    { limit: 180, pattern: '..' },
  ];
  let fillPattern = '..';
  if(normalizedOrientation !== null){
    for(const option of orientationPatterns){
      if(normalizedOrientation <= option.limit){
        fillPattern = option.pattern;
        break;
      }
    }
  }
  const seed = computeZoneSeedValue(zone);
  const fillVariations = ['..', '--', '::', '~~', '<>', '**'];
  if(fillPattern === '..'){
    const variantIndex = Math.floor((Math.abs(seed) * 37) % fillVariations.length);
    fillPattern = fillVariations[variantIndex] || '..';
  }
  const patternChars = fillPattern.split('');
  const rows = [];
  for(let y = 0; y < gridHeight; y += 1){
    const progress = gridHeight <= 1 ? 0 : y / (gridHeight - 1);
    const bulge = Math.sin(progress * Math.PI);
    const wave = seededJitter(seed, y * 1.7, 0.35);
    const offset = seededJitter(seed, y + 24.1, 1.4);
    const center = gridWidth / 2 + offset;
    let radius = (gridWidth / 3) + bulge * (gridWidth / 2.8) + wave * (gridWidth / 3.6);
    radius = Math.max(2.2, radius);
    let start = Math.max(0, Math.floor(center - radius));
    let end = Math.min(gridWidth - 1, Math.ceil(center + radius));
    if(end - start < 3){
      const adjust = 3 - (end - start);
      start = Math.max(0, start - Math.ceil(adjust / 2));
      end = Math.min(gridWidth - 1, end + Math.floor(adjust / 2));
    }
    let row = '';
    for(let x = 0; x < gridWidth; x += 1){
      if(x < start || x > end){
        row += ' ';
        continue;
      }
      const isEdge = (x === start || x === end);
      if(isEdge){
        const slope = seededJitter(seed, x * 0.6 + y * 0.8, 0.9);
        const isTop = y === 0;
        const isBottom = y === gridHeight - 1;
        let edgeChar = '|';
        if(isTop){
          edgeChar = x === start ? '/' : '\\';
        } else if(isBottom){
          edgeChar = x === start ? '\\' : '/';
        } else if(slope > 0.45){
          edgeChar = ')';
        } else if(slope < -0.45){
          edgeChar = '(';
        } else if(slope > 0){
          edgeChar = ']';
        } else {
          edgeChar = '[';
        }
        row += edgeChar;
      } else {
        const index = Math.abs(Math.floor((x + y + seed) % patternChars.length));
        let fillChar = patternChars[index] || '.';
        const sparkle = seededRandom(seed, x * 5.7 + y * 3.9);
        if(sparkle > 0.94){
          const accents = ['*', '.', ':', "'"];
          const accent = accents[Math.floor(seededRandom(seed, x * 2.6 + y * 1.8) * accents.length)];
          if(accent) fillChar = accent;
        }
        row += fillChar;
      }
    }
    rows.push(row.replace(/\s+$/u, ''));
  }
  return rows.join('\n').replace(/\s+$/gmu, '');
}

function renderMapZones(layer){
  const layers = ensureMapStructure();
  if(layers){
    renderMapTopography(layers);
  }
  if(!layer) return;
  layer.innerHTML = '';
  const activeRegions = new Set(
    state.filtered
      .map(e => e.location?.region)
      .filter(Boolean)
  );
  MAP_ZONES.forEach(zone => {
    const zoneEl = document.createElement('div');
    const isActive = zone.regions.some(region => activeRegions.has(region));
    const isSelected = state.selectedZone?.name === zone.name;
    const classes = ['map-zone'];
    if(isActive) classes.push('active');
    if(isSelected) classes.push('selected');
    const vertical = zone.y > 55 ? 'label-above' : 'label-below';
    classes.push(vertical);
    zoneEl.className = classes.join(' ');
    const { left, top } = projectIsoPoint(zone.x, zone.y);
    const size = projectIsoSize(zone.width, zone.height || zone.width);
    zoneEl.style.left = `${left}%`;
    zoneEl.style.top = `${top}%`;
    zoneEl.style.width = `${size.width}%`;
    zoneEl.style.height = `${size.height}%`;
    const zoneFeatures = resolveZoneFeatures(zone);
    const clipPath = generateZoneClipPath(zone, zoneFeatures);
    if(clipPath){
      zoneEl.style.setProperty('--zone-clip', clipPath);
      zoneEl.style.clipPath = clipPath;
      zoneEl.style.webkitClipPath = clipPath;
    } else {
      zoneEl.style.removeProperty('--zone-clip');
      zoneEl.style.removeProperty('clip-path');
      zoneEl.style.removeProperty('-webkit-clip-path');
    }
    const orientation = computeZoneOrientation(zone, zoneFeatures);
    if(Number.isFinite(orientation)){
      zoneEl.style.setProperty('--zone-orientation', `${orientation.toFixed(1)}deg`);
    } else {
      zoneEl.style.removeProperty('--zone-orientation');
    }
    const ascii = document.createElement('pre');
    ascii.className = 'map-zone-ascii';
    ascii.setAttribute('aria-hidden', 'true');
    ascii.textContent = generateZoneAsciiArt(zone, orientation);
    zoneEl.appendChild(ascii);
    zoneEl.dataset.zoneName = zone.name;
    const label = document.createElement('div');
    label.className = 'map-zone-label';
    label.setAttribute('role', 'button');
    label.setAttribute('tabindex', '0');
    label.setAttribute('aria-expanded', String(isSelected));
    label.setAttribute('aria-controls', 'map-zone-detail');
    label.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = zone.name;
    label.appendChild(title);
    const subtitleText = zone.subtitle || (Array.isArray(zone.regions) ? zone.regions.join(' • ') : '');
    const ariaSummary = subtitleText ? `${zone.name}. ${subtitleText}. Select to view region details.` : `${zone.name}. Select to view region details.`;
    label.setAttribute('aria-label', ariaSummary);
    if(subtitleText){
      const subtitle = document.createElement('span');
      subtitle.textContent = subtitleText;
      label.appendChild(subtitle);
    }
    label.addEventListener('click', () => {
      state.selectedZone = state.selectedZone === zone ? null : zone;
      renderSelectedZoneState();
    });
    label.addEventListener('keydown', (event) => {
      if(event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar'){
        event.preventDefault();
        state.selectedZone = state.selectedZone === zone ? null : zone;
        renderSelectedZoneState();
      }
    });
    zoneEl.appendChild(label);
    layer.appendChild(zoneEl);
  });
  renderSelectedZoneState();
}

function renderSelectedZoneState(){
  const layers = ensureMapStructure();
  if(!layers) return;
  const zones = Array.from(layers.zones?.querySelectorAll('.map-zone') || []);
  zones.forEach(zoneEl => {
    const zoneName = zoneEl.dataset.zoneName;
    const selected = state.selectedZone?.name === zoneName;
    zoneEl.classList.toggle('selected', selected);
    const label = zoneEl.querySelector('.map-zone-label');
    if(label){
      label.setAttribute('aria-expanded', String(selected));
    }
  });
  renderMapZoneDetail();
}

function renderMapZoneDetail(){
  const layers = ensureMapStructure();
  if(!layers?.detail) return;
  const detail = layers.detail;
  const zone = state.selectedZone;
  if(!zone){
    detail.hidden = true;
    detail.innerHTML = '';
    return;
  }
  detail.hidden = false;
  detail.innerHTML = '';
  const title = document.createElement('h3');
  title.textContent = zone.name;
  const body = document.createElement('p');
  body.textContent = zone.description;
  detail.append(title, body);
  if(Array.isArray(zone.regions) && zone.regions.length){
    const list = document.createElement('ul');
    list.className = 'map-zone-region-list';
    zone.regions.forEach(region => {
      const item = document.createElement('li');
      item.textContent = region;
      list.appendChild(item);
    });
    detail.appendChild(list);
  }
  const topology = MAP_TOPOLOGY_FEATURES.filter(feature =>
    Array.isArray(feature?.influences) && feature.influences.includes(zone.name)
  );
  if(topology.length){
    const heading = document.createElement('h4');
    heading.textContent = 'Topological influences';
    detail.appendChild(heading);
    const list = document.createElement('ul');
    list.className = 'map-zone-topology-list';
    topology.forEach(feature => {
      if(!feature) return;
      const item = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = feature.name || 'Formation';
      item.appendChild(label);
      const typeLabel = feature.type
        ? `${feature.type.charAt(0).toUpperCase()}${feature.type.slice(1)} formation`
        : '';
      const fragments = [];
      if(typeLabel) fragments.push(typeLabel);
      if(feature.effect) fragments.push(feature.effect);
      const description = fragments.join('. ');
      if(description){
        item.appendChild(document.createTextNode(` — ${description}`));
      }
      list.appendChild(item);
    });
    detail.appendChild(list);
  }
}

function renderMapEventLegend(){
  const container = document.getElementById('map-event-key');
  if(!container) return;
  container.innerHTML = '';
  const heading = document.createElement('h3');
  heading.textContent = 'Random Event Key';
  container.appendChild(heading);
  const list = document.createElement('ul');
  list.className = 'map-event-key-list';
  const seen = new Set();
  SCENE_EVENTS.forEach(event => {
    if(!event) return;
    const glyph = Array.isArray(event.glyph)
      ? event.glyph.join('\n')
      : (event.glyph || '[]');
    const key = event.id || glyph;
    if(seen.has(key)) return;
    seen.add(key);
    const item = document.createElement('li');
    const typeClass = event.type
      ? `type-${String(event.type).toLowerCase().replace(/[^a-z0-9-]/g, '-')}`
      : 'type-generic';
    item.classList.add(typeClass);
    const art = document.createElement('pre');
    art.textContent = glyph;
    item.appendChild(art);
    const labels = document.createElement('div');
    labels.className = 'map-event-key-labels';
    const header = document.createElement('div');
    header.className = 'map-event-key-header';
    const name = document.createElement('strong');
    name.textContent = event.title || 'Event anomaly';
    header.appendChild(name);
    if(event.type){
      const badge = document.createElement('span');
      badge.className = 'map-event-key-type';
      badge.textContent = String(event.type).replace(/[-_]/g, ' ');
      header.appendChild(badge);
    }
    labels.appendChild(header);
    const description = event.mapLabel || event.summary || '';
    if(description){
      const desc = document.createElement('span');
      desc.className = 'map-event-key-description';
      desc.textContent = description;
      labels.appendChild(desc);
    }
    item.appendChild(labels);
    list.appendChild(item);
  });
  if(list.children.length){
    container.appendChild(list);
  } else {
    const placeholder = document.createElement('p');
    placeholder.className = 'map-event-key-placeholder small muted';
    placeholder.textContent = 'No random events catalogued.';
    container.appendChild(placeholder);
  }
}

function renderMapEvents(layer){
  if(!layer) return;
  layer.innerHTML = '';
  const events = Array.isArray(state.activeEvents) ? state.activeEvents : [];
  events.forEach(event => {
    if(!event) return;
    const marker = document.createElement('div');
    const typeClass = event.type
      ? `type-${String(event.type).toLowerCase().replace(/[^a-z0-9-]/g, '-')}`
      : 'type-generic';
    marker.className = `map-event ${typeClass}`;
    const pos = projectIsoPoint(event.x, event.y);
    marker.style.left = `${pos.left}%`;
    marker.style.top = `${pos.top}%`;
    marker.setAttribute('role', 'img');
    if(event.ariaLabel){
      marker.setAttribute('aria-label', event.ariaLabel);
    } else if(event.title){
      marker.setAttribute('aria-label', event.title);
    }
    if(event.title){
      const summaryLine = event.summary ? `\n${event.summary}` : '';
      marker.title = `${event.title}${summaryLine}`;
    } else if(event.summary){
      marker.title = event.summary;
    }
    const art = document.createElement('pre');
    art.textContent = event.glyph || '[]';
    marker.appendChild(art);
    if(event.caption){
      const caption = document.createElement('span');
      caption.className = 'map-event-caption';
      caption.textContent = event.caption;
      marker.appendChild(caption);
    }
    layer.appendChild(marker);
  });
}

function renderMapMarkers(){
  const map = document.querySelector('#map');
  if(!map) return;
  const layers = ensureMapStructure();
  if(!layers) return;
  const { zones, markers, npcs, events } = layers;
  renderMapZones(zones);
  markers.innerHTML = '';
  if(npcs) npcs.innerHTML = '';
  state.npcs.forEach(npc => { if(npc) npc.element = null; });
  const filteredIds = new Set(state.filtered.map(e=>e.id));
  const dormant = state.bloomDormant instanceof Map ? state.bloomDormant : null;
  state.entries.filter(e=>e.location).forEach(e=>{
    if(dormant?.has(e.id)) return;
    const marker = document.createElement('button');
    const classes = ['marker'];
    if(!filteredIds.has(e.id)) classes.push('dim');
    if(state.explorer?.collected?.has(e.id)) classes.push('collected');
    if(state.explorer?.target?.entry?.id === e.id) classes.push('target');
    if(e.category === 'Character') classes.push('character');
    marker.className = classes.join(' ');
    const pos = projectIsoPoint(e.location.x, e.location.y);
    marker.style.left = `${pos.left}%`;
    marker.style.top = `${pos.top}%`;
    const region = e.location.region || 'Unknown region';
    const variant = e.variant;
    const ariaLabel = [e.title, variant?.rarity, region].filter(Boolean).join(' — ');
    marker.setAttribute('aria-label', ariaLabel);
    marker.title = `${e.title}${variant?.rarity ? ` (${variant.rarity})` : ''}\n${region}`;
    marker.innerHTML = '<span></span>';
    marker.addEventListener('click', ()=>openModal(e));
    markers.appendChild(marker);
  });
  if(npcs){
    state.npcs.forEach(npc=>{
      if(!npc?.location) return;
      const marker = document.createElement('button');
      const classes = ['marker', 'character'];
      classes.push('npc');
      const hasNewDialogue = hasNewNpcDialogue(npc);
      if(hasNewDialogue) classes.push('new-dialogue');
      if(state.explorer?.target?.type === 'npc' && state.explorer?.target?.npc?.id === npc.id){
        classes.push('target');
      }
      marker.className = classes.join(' ');
      const pos = projectIsoPoint(npc.location.x, npc.location.y);
      marker.style.left = `${pos.left}%`;
      marker.style.top = `${pos.top}%`;
      marker.setAttribute('aria-label', `${npc.name} — ${npc.title}`);
      marker.title = `${npc.name}\n${npc.title}${hasNewDialogue ? '\nNew exchange available' : ''}`;
      marker.innerHTML = '<span></span>';
      marker.addEventListener('click', ()=>openNpcModal(npc));
      npcs.appendChild(marker);
      npc.element = marker;
    });
  }
  if(state.explorer){
    renderExplorerElement();
  } else {
    layers.actors.innerHTML = '';
  }
  if(events){
    renderMapEvents(events);
  }
  updateExplorerTrail();
  requestAnimationFrame(resolveMapLabelCollisions);
}

function spawnMapEvent(event, options = {}){
  if(!event) return null;
  if(!Array.isArray(state.activeEvents)) state.activeEvents = [];
  const explorer = state.explorer;
  const baseAnchor = options.anchor || event.mapLocation || {
    x: explorer?.x ?? 50,
    y: explorer?.y ?? 50,
  };
  const jitter = Number.isFinite(options.jitter)
    ? options.jitter
    : (Number.isFinite(event.mapJitter) ? event.mapJitter : 7);
  const position = scatterCoordinate(baseAnchor, jitter);
  const glyph = Array.isArray(event.glyph)
    ? event.glyph.join('\n')
    : (event.glyph || '[]');
  const ttlSource = Number.isFinite(options.duration)
    ? options.duration
    : (Number.isFinite(event.mapDuration)
      ? event.mapDuration
      : (Number.isFinite(event.duration) ? Math.max(6, event.duration * 0.6) : 18));
  const ttl = Number.isFinite(ttlSource) ? Math.max(1, ttlSource) : Number.POSITIVE_INFINITY;
  const instance = {
    id: `${event.id || 'event'}:${Date.now()}:${Math.floor(Math.random() * 1000)}`,
    sourceId: event.id || null,
    title: event.title || '',
    summary: event.summary || '',
    type: event.type || 'phenomenon',
    glyph,
    caption: event.caption || options.caption || '',
    ariaLabel: event.mapLabel || event.ariaLabel || event.title || '',
    x: position.x,
    y: position.y,
    ttl,
  };
  state.activeEvents.push(instance);
  const layers = ensureMapStructure();
  if(layers?.events){
    renderMapEvents(layers.events);
  }
  return instance;
}

function spawnBloomRegrowth(info){
  const anchor = info?.origin || info?.entry?.location || { x: 50, y: 50 };
  return spawnMapEvent({
    id: `regrowth-${info?.entry?.id || Date.now()}`,
    title: info?.entry?.title ? `${info.entry.title} Regrowth` : 'Floral Regrowth',
    summary: 'Fresh shoots spark a new cluster nearby.',
    type: 'bloom',
    glyph: [
      ' .^. ',
      '< * >',
      '  |  ',
    ],
    mapDuration: 16 + Math.random() * 6,
    mapLabel: info?.entry?.title
      ? `${info.entry.title} regrowth cluster`
      : 'Floral regrowth cluster',
    caption: 'Regrowth',
  }, { anchor, jitter: 4 });
}

function logBloomRegrowth(info){
  const ex = state.explorer;
  if(!ex) return;
  const title = info?.entry?.title ? `${info.entry.title} Regrowth` : 'Floral Regrowth';
  ex.log.unshift({
    type: 'scene',
    id: `scene:regrowth:${info?.entry?.id || Date.now()}`,
    title,
    summary: 'Dormant beds awaken and cluster anew.',
    note: 'Bloom cycle renewed',
    time: new Date(),
  });
  ex.log = ex.log.slice(0, 10);
  renderExplorerLog();
}

function updateBloomDormancy(dt){
  const dormant = state.bloomDormant;
  if(!(dormant instanceof Map) || dormant.size === 0) return;
  const regrowthQueue = [];
  dormant.forEach((info, id) => {
    if(!info) return;
    const next = Math.max(0, (Number.isFinite(info.timer) ? info.timer : 0) - dt);
    info.timer = next;
    if(next === 0){
      dormant.delete(id);
      regrowthQueue.push(info);
    }
  });
  if(regrowthQueue.length){
    renderMapMarkers();
    regrowthQueue.forEach(info => {
      spawnBloomRegrowth(info);
      logBloomRegrowth(info);
    });
  }
}

function updateActiveEvents(dt){
  const events = Array.isArray(state.activeEvents) ? state.activeEvents : [];
  let needsRender = false;
  if(events.length){
    events.forEach(event => {
      if(!event) return;
      if(Number.isFinite(event.ttl)){
        const next = Math.max(0, event.ttl - dt);
        if(next !== event.ttl){
          event.ttl = next;
          if(next === 0){
            event.expired = true;
          }
        }
      }
    });
    const active = events.filter(event => !event?.expired);
    if(active.length !== events.length){
      state.activeEvents = active;
      needsRender = true;
    }
  }
  if(needsRender){
    const layers = ensureMapStructure();
    if(layers?.events){
      renderMapEvents(layers.events);
    }
  }
  updateBloomDormancy(dt);
}

function resolveMapLabelCollisions(){
  const layers = ensureMapStructure();
  if(!layers) return;
  const zones = Array.from(layers.zones?.querySelectorAll('.map-zone') || []);
  if(!zones.length) return;
  const markerNodes = [
    ...(layers.markers ? Array.from(layers.markers.querySelectorAll('.marker')) : []),
    ...(layers.npcs ? Array.from(layers.npcs.querySelectorAll('.marker')) : []),
  ];
  if(!markerNodes.length) return;
  const markerRects = markerNodes.map(el => el.getBoundingClientRect());
  const orientationClasses = ['label-above', 'label-below'];
  const nextPlacements = new Map();
  zones.forEach((zone, index) => {
    const label = zone.querySelector('.map-zone-label');
    if(!label) return;
    label.style.removeProperty('--label-shift-y');
    const zoneKey = zone.dataset.zoneName || `zone-${index}`;
    const prefersAbove = zone.classList.contains('label-above');
    const orientations = prefersAbove ? ['label-above', 'label-below'] : ['label-below', 'label-above'];
    const gaps = [24, 30, 38];
    const shifts = [0, -72, 72, -118, 118];
    const tryPlacement = (orientation, gap, shift) => {
      orientationClasses.forEach(cls => zone.classList.remove(cls));
      zone.classList.add(orientation);
      label.style.setProperty('--label-gap', `${gap}px`);
      label.style.setProperty('--label-shift-x', `${shift}px`);
      const rect = label.getBoundingClientRect();
      return !markerRects.some(markerRect => rectanglesOverlap(rect, markerRect));
    };

    let placement = null;
    const cached = LABEL_PLACEMENTS.get(zoneKey);
    if(cached && tryPlacement(cached.orientation, cached.gap, cached.shift)){
      placement = cached;
    } else {
      for(const orientation of orientations){
        let found = false;
        for(const gap of gaps){
          for(const shift of shifts){
            if(tryPlacement(orientation, gap, shift)){
              placement = { orientation, gap, shift };
              found = true;
              break;
            }
          }
          if(found) break;
        }
        if(found) break;
      }
    }

    if(!placement){
      const fallbackOrientation = orientations[0];
      const fallbackGap = 38;
      const fallbackShift = fallbackOrientation === 'label-above' ? -118 : 118;
      tryPlacement(fallbackOrientation, fallbackGap, fallbackShift);
      placement = { orientation: fallbackOrientation, gap: fallbackGap, shift: fallbackShift };
    }

    nextPlacements.set(zoneKey, placement);
  });
  LABEL_PLACEMENTS.clear();
  nextPlacements.forEach((value, key)=> LABEL_PLACEMENTS.set(key, value));
}

function normalize(s) { return (s||'').toLowerCase(); }


function generateHooks(e) {
  const hooks = [];
  const t = e.title;
  const seeds = [
    `A grove-tender begs you to transplant the ${t} before a frost wave rolls across the Verdant Hollows.`,
    `The Gilt Conservatory offers a charter if you retrieve living samples of the ${t} without bruising a single frond.`,
    `Spore choristers swear the ${t} hums at dusk. Record its melody before the Choir Ruins collapse again.`,
    `A caravan of night brewers covets the ${t}, but a rival syndicate posted a bounty to burn it first. Choose a side.`,
    `Atlas mapwrights insist the ${t} migrates along ley-lines. Track its drift with the overlay before the trail fades.`,
    `A dreamless sleeper briefly murmured the name ${t}. Discover what vision the plant shared.`
  ];
  if(e.variant?.hook){
    hooks.push(e.variant.hook);
  }
  // pick three deterministic by hash of id for stable hooks
  const h = Array.from(normalize(e.id)).reduce((a,c)=>a+c.charCodeAt(0),0);
  hooks.push(seeds[h % seeds.length]);
  hooks.push(seeds[(h+2) % seeds.length]);
  hooks.push(seeds[(h+4) % seeds.length]);
  return hooks.slice(0, 4);
}

function applyFilters() {
  const q = normalize(state.q);
  const tag = state.tag;
  state.filtered = state.entries.filter(e => {
    const haystack = joinSentences(e.title, e.summary, e.displaySummary, e.variant?.condition, e.variant?.quirk);
    const matchesQ = !q || normalize(haystack).includes(q);
    const matchesTag = tag === 'All' || e.tag === tag;
    return matchesQ && matchesTag;
  });
  renderGrid();
  renderCount();
  renderMapMarkers();
}

function renderCount(){
  document.querySelector('#count').textContent = `${state.filtered.length} / ${state.entries.length}`;
}

function renderGrid() {
  const grid = document.querySelector('#grid');
  grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  state.filtered.forEach(e=>{
    const card = document.createElement('article');
    const isCollected = !!state.explorer?.collected?.has(e.id);
    card.className = 'card' + (isCollected ? ' collected' : '');
    const variant = e.variant;
    const summary = e.displaySummary || e.summary;
    const rarityBadge = variant?.rarity ? `<span class="rarity-badge ${variant?.rarityClass || ''}">${variant.rarity}</span>` : '';
    card.innerHTML = `
      <div class="card-header">
        <h3>${e.title}</h3>
        ${rarityBadge}
      </div>
      <p class="small">${summary}</p>
      <div class="card-traits">
        <span class="tag">${e.tag}</span>
        ${variant?.condition ? `<span class="tag alt">${variant.condition}</span>` : ''}
        ${variant?.mutation ? `<span class="tag alt">${variant.mutation}</span>` : ''}
        ${variant?.quirk ? `<span class="tag alt subtle">${variant.quirk}</span>` : ''}
      </div>
      ${isCollected ? '<div class="card-status">Catalogued by roaming surveyor</div>' : ''}`;
    card.addEventListener('click', ()=>openModal(e));
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

function renderNpcDirectory(){
  const container = document.querySelector('#npc-directory');
  if(!container) return;
  container.innerHTML = '';
  const npcs = Array.isArray(state.npcs) ? state.npcs : [];
  if(!npcs.length){
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No contacts catalogued yet.';
    container.appendChild(empty);
    return;
  }
  const entries = Array.isArray(state.entries) ? state.entries : [];
  const entriesById = new Map(entries.map(entry => [entry.id, entry]));
  const explorer = state.explorer;
  const frag = document.createDocumentFragment();
  npcs.forEach(npc => {
    const card = document.createElement('article');
    card.className = 'npc-card';
    const hasNew = hasNewNpcDialogue(npc);
    if(hasNew) card.classList.add('npc-card-new');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    const labelParts = [npc.name];
    if(npc.title) labelParts.push(npc.title);
    card.setAttribute('aria-label', labelParts.join(' — '));

    const header = document.createElement('div');
    header.className = 'npc-card-header';
    header.innerHTML = `
      <div>
        <h3>${npc.name}</h3>
        ${npc.title ? `<p class="npc-title">${npc.title}</p>` : ''}
      </div>
      ${hasNew ? '<span class="npc-card-status">New exchange</span>' : ''}
    `;
    card.appendChild(header);

    if(npc.description){
      const description = document.createElement('p');
      description.className = 'npc-description';
      description.textContent = npc.description;
      card.appendChild(description);
    }

    const metaWrap = document.createElement('div');
    metaWrap.className = 'npc-meta';
    if(npc.location?.region){
      const region = document.createElement('span');
      region.className = 'npc-region';
      region.textContent = `Stationed at ${npc.location.region}`;
      metaWrap.appendChild(region);
    }

    const dialogues = Array.isArray(npc.dialogues) ? npc.dialogues : [];
    const unlockedCount = dialogues.reduce((count, dialogue) => count + (npcDialogueUnlocked(dialogue, explorer) ? 1 : 0), 0);
    const progress = document.createElement('span');
    progress.className = 'npc-location';
    progress.textContent = `Dialogues ${unlockedCount}/${dialogues.length}`;
    metaWrap.appendChild(progress);
    card.appendChild(metaWrap);

    if(dialogues.length){
      const list = document.createElement('ul');
      list.className = 'npc-dialogue-list compact';
      dialogues.forEach(dialogue => {
        const meta = getNpcDialogueMeta(npc, dialogue, entriesById);
        const li = document.createElement('li');
        const classes = ['npc-dialogue'];
        classes.push(meta.unlocked ? 'unlocked' : 'locked');
        if(meta.unlocked && !meta.seen && !meta.fallback){
          classes.push('new');
        }
        li.className = classes.join(' ');
        li.innerHTML = `
          <strong>${dialogue.title}</strong>
          <span class="preview">${meta.preview}</span>
          <span class="status">${meta.status}</span>
        `;
        list.appendChild(li);
      });
      card.appendChild(list);
    }

    const hint = document.createElement('p');
    hint.className = 'small muted';
    hint.textContent = 'Click or press Enter to open the full dossier.';
    card.appendChild(hint);

    card.addEventListener('click', ()=>openNpcModal(npc));
    card.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openNpcModal(npc);
      }
    });

    frag.appendChild(card);
  });

  container.appendChild(frag);
}

function renderTags(){
  const bar = document.querySelector('#tags');
  bar.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'badge' + (state.tag==='All'?' active':'');
  all.textContent = 'All';
  all.addEventListener('click', ()=>{ state.tag = 'All'; applyFilters(); renderTags(); });
  bar.appendChild(all);
  Array.from(state.tags).sort().forEach(tag=>{
    const b = document.createElement('button');
    b.className = 'badge' + (state.tag===tag?' active':'');
    b.textContent = tag;
    b.addEventListener('click', ()=>{ state.tag = tag; applyFilters(); renderTags(); });
    bar.appendChild(b);
  });
}

function openModal(e){
  const modal = document.querySelector('#modal');
  const body = modal.querySelector('.body');
  const hooks = generateHooks(e);
  const region = e.location?.region;
  const coords = e.location ? `${e.location.x.toFixed(1)}%, ${e.location.y.toFixed(1)}%` : null;
  const variant = e.variant;
  const variantSummary = variant?.description;
  const cycleLabel = state.variantCycle?.label;
  body.innerHTML = `
    <div class="kv">
      <div>World</div><div>Dreamless Kingdom</div>
      <div>Category</div><div>${e.category||'Entry'}</div>
      <div>Tag</div><div>${e.tag}</div>
      ${region ? `<div>Region</div><div>${region}</div>` : ''}
      <div>ID</div><div><code>${e.id}</code></div>
      ${coords ? `<div>Map Coordinates</div><div>${coords}</div>` : ''}
      ${variant?.rarity ? `<div>Rarity</div><div>${variant.rarity}</div>` : ''}
      ${variant?.mutation ? `<div>Mutation</div><div>${variant.mutation}</div>` : ''}
      ${variant?.condition ? `<div>Condition</div><div>${variant.condition}</div>` : ''}
      ${variant?.quirk ? `<div>Quirk</div><div>${variant.quirk}</div>` : ''}
      ${cycleLabel ? `<div>Cycle</div><div>${cycleLabel}</div>` : ''}
    </div>
    <hr/>
    <p>${e.summary}</p>
    ${variantSummary ? `<div class="variant-callout"><h4>Variant Notes</h4><p>${variantSummary}</p></div>` : ''}
    <h3>Adventure Hooks</h3>
    <ul>${hooks.map(h=>`<li>${h}</li>`).join('')}</ul>
    <hr/>
    <div class="small">Deep link: <a href="#/item/${e.id}">#/item/${e.id}</a></div>
  `;
  modal.classList.add('open');
  location.hash = `#/item/${e.id}`;
}

function getNpcDialogueMeta(npc, dialogue, entriesById){
  const ex = state.explorer;
  if(!dialogue){
    return {
      key: npcDialogueKey(npc, {}),
      unlocked: false,
      preview: 'Exchange unavailable.',
      status: 'No dialogue available.',
      seen: false,
      fallback: false,
    };
  }
  const key = npcDialogueKey(npc, dialogue);
  const requires = Array.isArray(dialogue.requires) ? dialogue.requires : [];
  const requirementTitles = requires.map(id => entriesById.get(id)?.title || id);
  const requirementText = requirementTitles.length ? `Requires: ${requirementTitles.join(', ')}` : 'Always available';
  const unlocked = npcDialogueUnlocked(dialogue, ex);
  const preview = unlocked ? (dialogue.lines?.[0] || 'Conversation ready to share.') : requirementText;
  const seen = !!ex?.dialogueSeen?.has(key);
  const status = unlocked
    ? ((seen || dialogue.fallback) ? 'Exchange recorded' : 'Awaiting exchange')
    : 'Collect the listed specimens to unlock.';
  return {
    key,
    unlocked,
    preview,
    status,
    seen,
    fallback: !!dialogue.fallback,
  };
}

function openNpcModal(npc){
  if(!npc) return;
  const modal = document.querySelector('#modal');
  const body = modal.querySelector('.body');
  const entriesById = new Map(state.entries.map(entry => [entry.id, entry]));
  const dialogues = Array.isArray(npc.dialogues) ? npc.dialogues : [];
  const listHtml = dialogues.map(dialogue => {
    const meta = getNpcDialogueMeta(npc, dialogue, entriesById);
    const classes = ['npc-dialogue'];
    classes.push(meta.unlocked ? 'unlocked' : 'locked');
    if(meta.unlocked && !meta.seen && !meta.fallback){
      classes.push('new');
    }
    return `
      <li class="${classes.join(' ')}">
        <strong>${dialogue.title}</strong>
        <span class="preview">${meta.preview}</span>
        <span class="status">${meta.status}</span>
      </li>
    `;
  }).join('');
  body.innerHTML = `
    <div class="npc-profile">
      <h2>${npc.name}</h2>
      <p class="small">${npc.title || ''}</p>
      ${npc.description ? `<p class="muted">${npc.description}</p>` : ''}
      ${npc.location?.region ? `<p class="small muted">Stationed at ${npc.location.region}</p>` : ''}
    </div>
    <hr/>
    <h3>Conversation Threads</h3>
    <ul class="npc-dialogue-list">${listHtml}</ul>
    <div class="small muted">Meet this contact in the field to hear their full remarks.</div>
  `;
  modal.classList.add('open');
  location.hash = `#/npc/${npc.id}`;
}

function closeModal(){
  const modal = document.querySelector('#modal');
  modal.classList.remove('open');
  if(location.hash.startsWith('#/item/') || location.hash.startsWith('#/npc/')){
    history.pushState('', document.title, window.location.pathname + window.location.search);
  }
}

function restoreFromHash(){
  const parts = location.hash.split('/');
  if(parts.length===3 && parts[1]==='item'){
    const id = parts[2];
    const e = state.entries.find(e=>e.id===id);
    if(e) openModal(e);
  } else if(parts.length===3 && parts[1]==='npc'){
    const id = parts[2];
    const npc = state.npcs.find(n=>n.id===id);
    if(npc) openNpcModal(npc);
  }
}

async function main(){
  const res = await fetch('data/entries.json');
  const j = await res.json();
  state.entries = j.entries;
  state.npcs = NPCS.map(npc => {
    const location = npc.location ? { ...npc.location } : null;
    return {
      ...npc,
      location,
      home: location ? { x: location.x, y: location.y } : null,
      wanderTarget: location ? { x: location.x, y: location.y } : null,
      wanderPause: Math.random() * 5,
      wanderSpeed: 0.35 + Math.random() * 0.4,
      wanderRadius: 6 + Math.random() * 6,
      element: null,
    };
  });
  state.variantCycle = applyVariantProfiles(state.entries);
  state.tags = new Set(state.entries.map(e=>e.tag));
  renderVariantCycle();
  renderTags();
  applyFilters();
  renderInventory();
  renderNpcDirectory();
  restoreFromHash();
  initExplorer();
}

window.addEventListener('hashchange', restoreFromHash);
window.addEventListener('resize', ()=>{
  updateMapCamera({ immediate: true });
  updateExplorerTrail();
  renderMapTelemetry();
  requestAnimationFrame(resolveMapLabelCollisions);
});
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelector('#q').addEventListener('input', (e)=>{ state.q = e.target.value; applyFilters(); });
  document.querySelector('#close').addEventListener('click', closeModal);
  document.querySelector('#modal').addEventListener('click', (e)=>{ if(e.target.id==='modal') closeModal(); });
  renderMapEventLegend();
  main();
});

function ensureExplorerElement(){
  if(!state.explorer) return null;
  const map = document.querySelector('#map');
  if(!map) return null;
  const layers = ensureMapStructure();
  if(!layers) return null;
  let el = layers.actors.querySelector('.explorer');
  if(!el){
    el = document.createElement('div');
    el.className = 'explorer';
    el.setAttribute('aria-hidden', 'true');
    layers.actors.appendChild(el);
  } else if(el.parentElement !== layers.actors){
    layers.actors.appendChild(el);
  }
  state.explorer.element = el;
  return el;
}

function renderExplorerElement(){
  if(!state.explorer) return;
  const el = ensureExplorerElement();
  if(!el) return;
  const pos = projectIsoPoint(state.explorer.x, state.explorer.y);
  el.style.left = `${pos.left}%`;
  el.style.top = `${pos.top}%`;
  updateMapCamera();
}

function updateMapCamera({ immediate = false, force = false, targetOffsets = null } = {}){
  const layers = ensureMapStructure();
  if(!layers?.viewport || !layers?.world) return;
  const viewport = layers.viewport;
  const world = layers.world;
  const viewportWidth = viewport.clientWidth;
  const viewportHeight = viewport.clientHeight;
  const worldWidth = world.clientWidth;
  const worldHeight = world.clientHeight;
  if(!viewportWidth || !viewportHeight || !worldWidth || !worldHeight) return;
  const camera = state.mapCamera ||= { offsetX: 0, offsetY: 0, manual: false };
  const clampOffset = (value, max)=>Math.max(-max, Math.min(max, value));
  const maxOffsetX = Math.max(0, (worldWidth - viewportWidth) / 2);
  const maxOffsetY = Math.max(0, (worldHeight - viewportHeight) / 2);
  let desiredX = clampOffset(camera.offsetX, maxOffsetX);
  let desiredY = clampOffset(camera.offsetY, maxOffsetY);
  if(targetOffsets){
    desiredX = clampOffset(targetOffsets.x, maxOffsetX);
    desiredY = clampOffset(targetOffsets.y, maxOffsetY);
    camera.manual = true;
  } else if(force || !camera.manual){
    const ex = state.explorer;
    if(ex){
      const pos = projectIsoPoint(ex.x, ex.y);
      const targetX = (pos.left / 100) * worldWidth;
      const targetY = (pos.top / 100) * worldHeight;
      const offsetX = viewportWidth / 2 - targetX;
      const offsetY = viewportHeight / 2 - targetY;
      desiredX = clampOffset(offsetX, maxOffsetX);
      desiredY = clampOffset(offsetY, maxOffsetY);
    }
    if(force){
      camera.manual = false;
    }
  } else {
    desiredX = clampOffset(camera.offsetX, maxOffsetX);
    desiredY = clampOffset(camera.offsetY, maxOffsetY);
  }
  const lerpFactor = (immediate || targetOffsets) ? 1 : 0.22;
  const nextX = immediate || targetOffsets
    ? desiredX
    : camera.offsetX + (desiredX - camera.offsetX) * lerpFactor;
  const nextY = immediate || targetOffsets
    ? desiredY
    : camera.offsetY + (desiredY - camera.offsetY) * lerpFactor;
  camera.offsetX = Math.abs(nextX - desiredX) < 0.1 ? desiredX : nextX;
  camera.offsetY = Math.abs(nextY - desiredY) < 0.1 ? desiredY : nextY;
  if(immediate || targetOffsets){
    world.classList.add('no-transition');
  }
  world.style.setProperty('--map-offset-x', `${camera.offsetX.toFixed(2)}px`);
  world.style.setProperty('--map-offset-y', `${camera.offsetY.toFixed(2)}px`);
  if(immediate || targetOffsets){
    requestAnimationFrame(()=> world.classList.remove('no-transition'));
  }
}

function updateExplorerTrail(){
  const map = document.querySelector('#map');
  if(!map) return;
  const layers = ensureMapStructure();
  if(!layers) return;
  const svg = layers.path?.svg;
  const line = layers.path?.line;
  if(!svg || !line) return;
  const path = state.explorer?.path || [];
  if(!path.length){
    line.setAttribute('points', '');
    line.classList.remove('active');
    svg.setAttribute('viewBox', '0 0 100 100');
    return;
  }
  const world = layers.world;
  const width = world?.clientWidth || 0;
  const height = world?.clientHeight || 0;
  if(width > 0 && height > 0){
    svg.setAttribute('viewBox', `0 0 ${width.toFixed(2)} ${height.toFixed(2)}`);
    const points = path.map(pt => {
      const projected = projectIsoPoint(pt.x, pt.y);
      const px = (projected.left / 100) * width;
      const py = (projected.top / 100) * height;
      return `${px.toFixed(2)},${py.toFixed(2)}`;
    }).join(' ');
    line.setAttribute('points', points);
  } else {
    svg.setAttribute('viewBox', '0 0 100 100');
    const points = path.map(pt => {
      const projected = projectIsoPoint(pt.x, pt.y);
      return `${projected.left},${projected.top}`;
    }).join(' ');
    line.setAttribute('points', points);
  }
  line.classList.toggle('active', path.length > 1);
}

function chooseNpcWanderTarget(npc){
  const base = npc?.home || npc?.location;
  if(!base) return null;
  const radius = clampNumber(npc?.wanderRadius, 3, 16);
  const angle = Math.random() * Math.PI * 2;
  const distance = (0.35 + Math.random() * 0.65) * radius;
  const offsetX = Math.cos(angle) * distance;
  const offsetY = Math.sin(angle) * distance;
  return {
    x: clampNumber(base.x + offsetX, 4, 96),
    y: clampNumber(base.y + offsetY, 4, 96),
  };
}

function updateNpcWandering(dt){
  if(!Array.isArray(state.npcs) || !state.npcs.length) return;
  state.npcs.forEach(npc => {
    if(!npc || !npc.location) return;
    if(typeof npc.wanderPause !== 'number'){
      npc.wanderPause = Math.random() * 5;
    }
    if(!npc.wanderTarget){
      npc.wanderTarget = chooseNpcWanderTarget(npc);
    }
    if(npc.wanderPause > 0){
      npc.wanderPause = Math.max(0, npc.wanderPause - dt);
      return;
    }
    const target = npc.wanderTarget;
    if(!target){
      npc.wanderPause = 2.5 + Math.random() * 3.5;
      return;
    }
    const dx = target.x - npc.location.x;
    const dy = target.y - npc.location.y;
    const dist = Math.hypot(dx, dy);
    if(dist < 0.12){
      npc.wanderPause = 2.8 + Math.random() * 4.2;
      npc.wanderTarget = chooseNpcWanderTarget(npc);
      return;
    }
    const speed = clampNumber(npc.wanderSpeed, 0.2, 1) * dt;
    if(speed <= 0){
      npc.wanderTarget = chooseNpcWanderTarget(npc);
      return;
    }
    const step = Math.min(dist, speed);
    if(step <= 0){
      npc.wanderTarget = chooseNpcWanderTarget(npc);
      return;
    }
    npc.location.x = clampNumber(npc.location.x + (dx / dist) * step, 3, 97);
    npc.location.y = clampNumber(npc.location.y + (dy / dist) * step, 3, 97);
    if(npc.element){
      const pos = projectIsoPoint(npc.location.x, npc.location.y);
      npc.element.style.left = `${pos.left}%`;
      npc.element.style.top = `${pos.top}%`;
    }
  });
}

function findZoneForCoordinate(x, y){
  if(!Number.isFinite(x) || !Number.isFinite(y)) return null;
  let insideCandidate = null;
  let insideDistance = Infinity;
  let fallback = null;
  let fallbackDistance = Infinity;
  MAP_ZONES.forEach(zone => {
    const width = Number.isFinite(zone.width) ? zone.width : 0;
    const height = Number.isFinite(zone.height) ? zone.height : width;
    const halfW = width / 2;
    const halfH = height / 2;
    const dx = x - zone.x;
    const dy = y - zone.y;
    const distance = Math.hypot(dx, dy);
    if(width && height){
      if(x >= zone.x - halfW && x <= zone.x + halfW && y >= zone.y - halfH && y <= zone.y + halfH){
        if(distance < insideDistance){
          insideDistance = distance;
          insideCandidate = zone;
        }
      }
    }
    if(distance < fallbackDistance){
      fallbackDistance = distance;
      fallback = zone;
    }
  });
  return insideCandidate || fallback;
}

function hashString(str){
  return Array.from(str || '').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function announceZoneArrival(zone){
  const layers = ensureMapStructure();
  if(!layers?.arrival) return;
  const el = layers.arrival;
  if(state.zoneToastTimer){
    clearTimeout(state.zoneToastTimer);
    state.zoneToastTimer = null;
  }
  if(!zone){
    el.classList.remove('visible');
    el.innerHTML = '';
    el.dataset.zone = '';
    return;
  }
  const subtitle = zone.subtitle || (Array.isArray(zone.regions) ? zone.regions.join(' • ') : '');
  el.innerHTML = `
    <strong>${zone.name}</strong>
    ${subtitle ? `<span>${subtitle}</span>` : ''}
  `;
  el.dataset.zone = zone.name;
  el.classList.add('visible');
  state.zoneToastTimer = setTimeout(() => {
    el.classList.remove('visible');
    state.zoneToastTimer = null;
  }, 4500);
}

function renderMapTelemetry(){
  const layers = ensureMapStructure();
  if(!layers?.telemetry) return;
  const el = layers.telemetry;
  const ex = state.explorer;
  if(!ex){
    el.textContent = 'Telemetry calibrating…';
    el.classList.add('muted');
    announceZoneArrival(null);
    return;
  }
  const zone = findZoneForCoordinate(ex.x, ex.y);
  if(zone?.name !== ex.currentZoneName){
    ex.currentZoneName = zone?.name || null;
    if(zone){
      announceZoneArrival(zone);
    } else {
      announceZoneArrival(null);
    }
  }
  const elapsed = ex.elapsedTime || 0;
  const locationName = zone?.name || 'Uncharted stretch';
  const zoneSubtitle = zone?.subtitle || '';
  const zoneSeed = hashString(zone?.name || 'kingdom');
  const timeScale = 120; // 1 real second = 2 in-world minutes
  const worldMinutes = (elapsed * timeScale) % (24 * 60);
  const hours = Math.floor(worldMinutes / 60);
  const minutes = Math.floor(worldMinutes % 60);
  const timeLabel = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const locationFactor = clampNumber((ex.x + ex.y) / 200, 0, 1);
  const drift = (Math.sin(elapsed / 12 + zoneSeed * 0.12) + 1) / 2;
  const windBase = 6 + (zoneSeed % 7);
  const wind = clampNumber(windBase + Math.sin(elapsed / 7 + locationFactor * 3) * 3 + drift * 4, 2, 26);
  const humidity = clampNumber(55 + (1 - locationFactor) * 28 + Math.cos(elapsed / 9 + zoneSeed * 0.3) * 14, 24, 97);
  const temperature = clampNumber(18 + Math.sin(elapsed / 11 + zoneSeed * 0.2) * 6 - locationFactor * 4, 6, 32);
  const aurora = clampNumber(38 + drift * 48 + (ex.sceneEvent ? 12 : 0), 20, 98);
  el.classList.remove('muted');
  el.innerHTML = `
    <div class="telemetry-grid">
      <div class="telemetry-pair"><span>Locale</span><strong>${locationName}</strong></div>
      <div class="telemetry-pair"><span>Time</span><strong>${timeLabel}</strong></div>
      <div class="telemetry-pair"><span>Wind</span><strong>${wind.toFixed(1)} knots</strong></div>
      <div class="telemetry-pair"><span>Humidity</span><strong>${Math.round(humidity)}%</strong></div>
      <div class="telemetry-pair"><span>Ambient</span><strong>${temperature.toFixed(1)}°C</strong></div>
      <div class="telemetry-pair"><span>Aurora Flux</span><strong>${Math.round(aurora)}%</strong></div>
    </div>
    ${zoneSubtitle ? `<div class="telemetry-note">${zoneSubtitle}</div>` : ''}
  `;
}

function recordExplorerPosition(force = false){
  const ex = state.explorer;
  if(!ex) return;
  if(!Array.isArray(ex.path)) ex.path = [];
  const last = ex.path[ex.path.length - 1];
  const delta = last ? Math.hypot(ex.x - last.x, ex.y - last.y) : Infinity;
  if(!last || delta >= 0.4 || force){
    ex.path.push({ x: ex.x, y: ex.y });
    if(ex.path.length > 240){
      ex.path.shift();
    }
  } else {
    ex.path[ex.path.length - 1] = { x: ex.x, y: ex.y };
  }
  updateExplorerTrail();
}

function ensureObserverMoodElement(){
  const existing = document.querySelector('#observer-mood');
  if(existing) return existing;
  const container = document.querySelector('.observer-body');
  if(!container) return null;
  const el = document.createElement('div');
  el.id = 'observer-mood';
  el.className = 'observer-mood';
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  const log = container.querySelector('.observer-log');
  if(log){
    container.insertBefore(el, log);
  } else {
    container.appendChild(el);
  }
  return el;
}

function formatMoodToneLabel(tone){
  return String(tone || 'steady')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ensureExplorerMood(explorer = state.explorer){
  if(!explorer) return null;
  if(!explorer.mood){
    explorer.mood = {
      value: 0,
      tone: 'steady',
      queue: [],
      display: null,
      idleTimer: 10 + Math.random() * 6,
      lastTag: null,
      lastContext: null,
    };
  }
  return explorer.mood;
}

function promoteMoodDisplay(mood){
  if(!mood || mood.display || !mood.queue.length) return;
  const next = mood.queue.shift();
  if(!next?.text) return;
  mood.display = {
    text: next.text,
    tone: next.tone || mood.tone || 'steady',
    emphasis: next.emphasis || 'neutral',
    remaining: Math.max(2.5, next.duration || 6),
  };
  renderExplorerMood();
}

function queueExplorerMoodMessage(message){
  const mood = ensureExplorerMood();
  if(!mood || !message?.text) return;
  mood.queue.push({
    text: message.text,
    tone: message.tone,
    emphasis: message.emphasis,
    duration: message.duration,
  });
  if(!mood.display){
    promoteMoodDisplay(mood);
  }
}

function applyExplorerMoodTag(tag, context = {}){
  if(!tag) return;
  const effect = MOOD_EFFECTS[tag];
  if(!effect) return;
  const mood = ensureExplorerMood();
  if(!mood) return;
  mood.value = clampNumber((mood.value || 0) + (effect.delta || 0), -5, 5);
  mood.tone = effect.tone || mood.tone || 'steady';
  mood.lastTag = tag;
  mood.lastContext = context;
  const template = pickOne(effect.messages);
  if(template){
    const text = formatMoodLine(template, {
      ...context,
      tone: mood.tone,
    });
    const emphasis = effect.delta > 0 ? 'positive' : (effect.delta < 0 ? 'negative' : 'neutral');
    queueExplorerMoodMessage({
      text,
      tone: mood.tone,
      emphasis,
      duration: 6.5,
    });
  }
  mood.idleTimer = 12 + Math.random() * 8;
}

function renderExplorerMood(){
  const el = ensureObserverMoodElement();
  const ex = state.explorer;
  if(!el){
    return;
  }
  if(!ex){
    el.classList.remove('visible', 'mood-positive', 'mood-negative');
    el.textContent = '';
    el.dataset.tone = '';
    return;
  }
  const mood = ensureExplorerMood(ex);
  if(!mood?.display){
    el.classList.remove('visible', 'mood-positive', 'mood-negative');
    el.textContent = '';
    el.dataset.tone = '';
    return;
  }
  const toneLabel = formatMoodToneLabel(mood.display.tone);
  el.innerHTML = `
    <div class="mood-label">Mood — ${toneLabel}</div>
    <div class="mood-text">${mood.display.text}</div>
  `;
  el.dataset.tone = mood.display.tone || '';
  el.classList.toggle('mood-positive', mood.display.emphasis === 'positive');
  el.classList.toggle('mood-negative', mood.display.emphasis === 'negative');
  el.classList.add('visible');
}

function updateExplorerMood(dt){
  const mood = ensureExplorerMood();
  if(!mood) return;
  if(mood.display){
    mood.display.remaining -= dt;
    if(mood.display.remaining <= 0){
      mood.display = null;
      renderExplorerMood();
    }
  }
  if(!mood.display){
    promoteMoodDisplay(mood);
  }
  const timer = Math.max(0, (mood.idleTimer ?? 0) - dt);
  mood.idleTimer = timer;
  if(timer === 0){
    const tone = mood.tone || 'steady';
    const prompts = MOOD_TONE_PROMPTS[tone] || MOOD_TONE_PROMPTS.steady || [];
    const template = pickOne(prompts);
    if(template){
      queueExplorerMoodMessage({
        text: formatMoodLine(template, { tone, zone: mood.lastContext?.zone || '' }),
        tone,
        emphasis: 'neutral',
        duration: 5.5,
      });
    }
    mood.idleTimer = 18 + Math.random() * 10;
  }
}

function renderExplorerStatus(){
  const el = document.querySelector('#explorer-status');
  if(!el || !state.explorer) return;
  const ex = state.explorer;
  let text = 'Surveyor calibrating instruments…';
  if(ex.phase === 'travel' && ex.target){
    if(ex.target.type === 'npc' && ex.target.npc){
      const npc = ex.target.npc;
      const region = npc.location?.region || 'Unknown region';
      const hasNew = hasNewNpcDialogue(npc);
      const detail = hasNew ? ' — new exchange' : '';
      text = `Visiting ${npc.name}${detail} (${region})`;
    } else if(ex.target.entry){
      const entry = ex.target.entry;
      const region = entry.location?.region || 'Unknown region';
      const variant = entry.variant;
      const detailParts = [];
      if(variant?.rarity) detailParts.push(variant.rarity);
      if(variant?.condition) detailParts.push(variant.condition);
      const detail = detailParts.length ? ` — ${detailParts.join(' • ')}` : '';
      text = `En route to ${entry.title}${detail} (${region})`;
    }
  } else if(ex.phase === 'collecting'){
    const remaining = Math.max(0, ex.pauseTimer || 0);
    const suffix = remaining > 0 ? ` (${Math.ceil(remaining)}s)` : '';
    const variant = ex.lastCollectedVariant;
    const detailParts = [];
    if(variant?.rarity) detailParts.push(variant.rarity);
    if(variant?.condition) detailParts.push(variant.condition);
    const detail = detailParts.length ? ` — ${detailParts.join(' • ')}` : '';
    text = `Cataloguing ${ex.lastCollectedTitle}${detail}${suffix}`;
  } else if(ex.phase === 'conversing'){
    const remaining = Math.max(0, ex.pauseTimer || 0);
    const suffix = remaining > 0 ? ` (${Math.ceil(remaining)}s)` : '';
    const npc = ex.currentNpc;
    const dialogueTitle = ex.currentDialogue?.title ? ` — ${ex.currentDialogue.title}` : '';
    text = npc ? `Trading notes with ${npc.name}${dialogueTitle}${suffix}` : `Trading notes${suffix}`;
  } else if(ex.phase === 'idle'){
    text = 'Surveyor selecting the next waypoint…';
  }
  if(ex.sceneEvent){
    const descriptor = ex.sceneEvent.status || ex.sceneEvent.summary;
    if(descriptor){
      const remaining = Math.max(0, Math.ceil(ex.sceneTimer || 0));
      const suffix = remaining ? ` (${remaining}s)` : '';
      text += ` • ${descriptor}${suffix}`;
    }
  }
  el.textContent = text;
}

function renderSceneEvent(){
  const el = document.querySelector('#observer-scene');
  if(!el || !state.explorer) return;
  const ex = state.explorer;
  const event = ex.sceneEvent;
  if(event){
    const descriptor = event.status || event.summary || 'Field conditions shifting';
    const remaining = Math.max(0, Math.ceil(ex.sceneTimer || 0));
    el.textContent = remaining ? `${descriptor} (${remaining}s)` : descriptor;
    el.classList.remove('muted');
  } else {
    el.textContent = 'No anomalies detected.';
    el.classList.add('muted');
  }
}

function renderExplorerCount(){
  const el = document.querySelector('#explorer-count');
  if(!el || !state.explorer) return;
  el.textContent = state.explorer.totalCollected;
}

function renderExplorerLog(){
  const list = document.querySelector('#explorer-log');
  if(!list || !state.explorer) return;
  list.innerHTML = '';
  const frag = document.createDocumentFragment();
  state.explorer.log.forEach(item=>{
    const li = document.createElement('li');
    const time = item.time.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    if(item.type === 'dialogue'){
      li.classList.add('dialogue');
      if(item.isNew) li.classList.add('new');
      const lines = Array.isArray(item.lines) ? item.lines : [item.lines].filter(Boolean);
      const dialogueHtml = lines.map(line=>`<span>${line}</span>`).join('');
      const subtitle = item.dialogueTitle ? `<span class="log-subtitle">${item.dialogueTitle}</span>` : '';
      const note = item.isNew ? '<span class="log-note">New insight</span>' : '';
      li.innerHTML = `
        <div class="log-header">
          <span class="log-time">${time}</span>
          <div class="log-title-group">
            <span class="log-title">${item.title}</span>
            ${subtitle}
          </div>
          ${note}
        </div>
        <div class="log-dialogue">${dialogueHtml}</div>
      `;
    } else if(item.type === 'scene'){
      li.classList.add('scene');
      const summary = item.summary ? `<span class="log-summary">${item.summary}</span>` : '';
      const note = item.note ? `<span class="log-note">${item.note}</span>` : '';
      li.innerHTML = `
        <div class="log-header">
          <span class="log-time">${time}</span>
          <div class="log-title-group">
            <span class="log-title">${item.title}</span>
            ${summary}
          </div>
          ${note}
        </div>
      `;
    } else {
      const noteParts = [];
      if(item.rarity) noteParts.push(item.rarity);
      if(item.condition) noteParts.push(item.condition);
      if(item.mutation) noteParts.push(item.mutation);
      if(item.quirk) noteParts.push(item.quirk);
      const note = noteParts.length ? `<span class="log-note">${noteParts.join(' • ')}</span>` : '';
      li.innerHTML = `<span class="log-time">${time}</span><span class="log-title">${item.title}</span>${note}`;
    }
    frag.appendChild(li);
  });
  if(!state.explorer.log.length){
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No samples catalogued yet. Keep observing!';
    frag.appendChild(li);
  }
  list.appendChild(frag);
}

function renderInventory(){
  const list = document.querySelector('#inventory-list');
  const summary = document.querySelector('#inventory-summary');
  if(!list) return;

  list.innerHTML = '';
  const explorer = state.explorer;
  const entries = Array.isArray(state.entries) ? state.entries : [];
  const entriesById = new Map(entries.map(entry => [entry.id, entry]));

  if(!explorer){
    if(summary){
      summary.textContent = 'Inventory link calibrating…';
    }
    const li = document.createElement('li');
    li.className = 'inventory-empty';
    li.textContent = 'Surveyor feed initializing. Inventory data will appear shortly.';
    list.appendChild(li);
    return;
  }

  const collectedIds = explorer.collected ? Array.from(explorer.collected) : [];
  const collectedEntries = collectedIds
    .map(id => entriesById.get(id))
    .filter(Boolean);
  collectedEntries.reverse();

  const uniqueCount = collectedEntries.length;
  if(summary){
    summary.textContent = uniqueCount
      ? `${uniqueCount} ${uniqueCount === 1 ? 'specimen catalogued' : 'specimens catalogued'}`
      : 'No specimens catalogued yet';
  }

  if(!uniqueCount){
    const li = document.createElement('li');
    li.className = 'inventory-empty';
    li.textContent = 'No specimens catalogued yet. The surveyor is still scouting the region.';
    list.appendChild(li);
    return;
  }

  const latestId = explorer.lastCollectedId;
  const frag = document.createDocumentFragment();

  collectedEntries.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'inventory-item';
    if(latestId === entry.id){
      li.classList.add('latest');
    }

    const header = document.createElement('div');
    header.className = 'inventory-item-header';

    const title = document.createElement('h3');
    title.textContent = entry.title;
    header.appendChild(title);

    if(latestId === entry.id){
      const badge = document.createElement('span');
      badge.className = 'inventory-pill highlight';
      badge.textContent = 'Latest capture';
      header.appendChild(badge);
    }

    li.appendChild(header);

    const variant = entry.variant || null;
    const tags = [];
    if(entry.tag){
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = entry.tag;
      tags.push(tag);
    }
    if(variant?.rarity){
      const rarity = document.createElement('span');
      rarity.className = `rarity-badge ${variant.rarityClass || ''}`.trim();
      rarity.textContent = variant.rarity;
      tags.push(rarity);
    }
    if(variant?.condition){
      const condition = document.createElement('span');
      condition.className = 'tag alt';
      condition.textContent = variant.condition;
      tags.push(condition);
    }
    if(variant?.mutation){
      const mutation = document.createElement('span');
      mutation.className = 'tag alt subtle';
      mutation.textContent = variant.mutation;
      tags.push(mutation);
    }
    if(variant?.quirk){
      const quirk = document.createElement('span');
      quirk.className = 'tag alt subtle';
      quirk.textContent = variant.quirk;
      tags.push(quirk);
    }

    if(tags.length){
      const tagWrap = document.createElement('div');
      tagWrap.className = 'inventory-tags';
      tags.forEach(tagEl => tagWrap.appendChild(tagEl));
      li.appendChild(tagWrap);
    }

    const metaTokens = [];
    if(entry.location?.region){
      const region = document.createElement('span');
      region.className = 'inventory-pill region';
      region.textContent = entry.location.region;
      metaTokens.push(region);
    }
    if(variant?.hook){
      const hook = document.createElement('span');
      hook.className = 'inventory-pill hook';
      hook.textContent = variant.hook;
      metaTokens.push(hook);
    }

    if(metaTokens.length){
      const meta = document.createElement('div');
      meta.className = 'inventory-meta';
      metaTokens.forEach(token => meta.appendChild(token));
      li.appendChild(meta);
    }

    const summaryText = entry.displaySummary || entry.summary || '';
    if(summaryText){
      const paragraph = document.createElement('p');
      paragraph.className = 'inventory-description small';
      paragraph.textContent = summaryText;
      li.appendChild(paragraph);
    }

    frag.appendChild(li);
  });

  list.appendChild(frag);
}

function renderExplorerUI(){
  renderExplorerElement();
  renderExplorerStatus();
  renderSceneEvent();
  renderExplorerMood();
  renderExplorerCount();
  renderExplorerLog();
  renderInventory();
  renderNpcDirectory();
  renderMapMarkers();
}

function npcDialogueKey(npc, dialogue){
  return `${npc?.id || 'npc'}:${dialogue?.id || 'dialogue'}`;
}

function npcDialogueUnlocked(dialogue, explorer){
  if(!dialogue) return false;
  const needs = dialogue.requires || [];
  if(!needs.length) return true;
  if(!explorer) return false;
  return needs.every(id => explorer.collected.has(id));
}

function selectNpcDialogue(npc, { preview = false } = {}){
  const ex = state.explorer;
  if(!ex || !npc) return null;
  const dialogues = Array.isArray(npc.dialogues) ? npc.dialogues : [];
  const available = dialogues.filter(d => npcDialogueUnlocked(d, ex));
  if(!available.length) return null;
  const seen = ex.dialogueSeen;
  const routeCollected = ex.routeCollected || new Set();
  const routeSequence = Array.isArray(ex.routeSequence) ? ex.routeSequence : [];
  const lastCollectedId = ex.lastCollectedId;
  const scored = available.map(dialogue => {
    const key = npcDialogueKey(npc, dialogue);
    const requires = Array.isArray(dialogue.requires) ? dialogue.requires : [];
    const matchesLast = lastCollectedId && routeCollected.has(lastCollectedId) && requires.includes(lastCollectedId) ? 1 : 0;
    const routeMatches = requires.reduce((count, id) => count + (routeCollected.has(id) ? 1 : 0), 0);
    let recentIndex = null;
    for(let i = routeSequence.length - 1; i >= 0; i--){
      if(requires.includes(routeSequence[i])){
        recentIndex = routeSequence.length - 1 - i;
        break;
      }
    }
    return {
      dialogue,
      key,
      seen: seen.has(key),
      fallback: !!dialogue.fallback,
      matchesLast,
      routeMatches,
      requiresCount: requires.length,
      recentIndex,
    };
  });
  const fallback = scored.find(item => item.fallback) || scored[scored.length - 1];
  const pickBest = (candidates)=>{
    if(!candidates.length) return null;
    return candidates.slice().sort((a, b)=>{
      if(b.matchesLast !== a.matchesLast) return b.matchesLast - a.matchesLast;
      if(b.routeMatches !== a.routeMatches) return b.routeMatches - a.routeMatches;
      const aRecent = a.recentIndex == null ? Number.POSITIVE_INFINITY : a.recentIndex;
      const bRecent = b.recentIndex == null ? Number.POSITIVE_INFINITY : b.recentIndex;
      if(aRecent !== bRecent) return aRecent - bRecent;
      if(b.requiresCount !== a.requiresCount) return b.requiresCount - a.requiresCount;
      if(a.fallback !== b.fallback) return a.fallback ? 1 : -1;
      if(a.seen !== b.seen) return a.seen ? 1 : -1;
      return dialogues.indexOf(a.dialogue) - dialogues.indexOf(b.dialogue);
    })[0];
  };
  let choiceEntry = pickBest(scored.filter(item => !item.seen && (item.matchesLast || item.routeMatches > 0)));
  if(!choiceEntry) choiceEntry = pickBest(scored.filter(item => !item.seen && !item.fallback));
  if(!choiceEntry) choiceEntry = pickBest(scored.filter(item => item.matchesLast || item.routeMatches > 0));
  if(!choiceEntry) choiceEntry = pickBest(scored);
  if(!choiceEntry) choiceEntry = fallback || null;
  if(!choiceEntry) return null;
  const { dialogue, key } = choiceEntry;
  const isNew = !choiceEntry.seen && !choiceEntry.fallback;
  if(!preview){
    seen.add(key);
  }
  return { npc, dialogue, key, isNew };
}

function hasNewNpcDialogue(npc){
  const ex = state.explorer;
  if(!ex) return false;
  const result = selectNpcDialogue(npc, { preview: true });
  return !!(result && result.isNew);
}

function startBloomDormancy(event){
  if(!event) return;
  if(!(state.bloomDormant instanceof Map)) state.bloomDormant = new Map();
  const plantEntries = state.entries.filter(entry => {
    if(!entry?.location) return false;
    const category = String(entry.category || '').toLowerCase();
    return category === 'plant';
  });
  if(!plantEntries.length) return;
  const available = plantEntries.filter(entry => !state.bloomDormant.has(entry.id));
  const pool = available.length ? available : plantEntries;
  const desiredCount = Number.isFinite(event.bloomDormancyCount)
    ? Math.max(1, Math.min(pool.length, Math.round(event.bloomDormancyCount)))
    : Math.max(1, Math.min(pool.length, Math.round(pool.length * 0.12)));
  const selected = pickMany(pool, desiredCount);
  if(!selected.length) return;
  const baseDuration = Number.isFinite(event.bloomDormancyDuration)
    ? event.bloomDormancyDuration
    : Math.max(12, (event.duration || 24) * 0.8);
  selected.forEach(entry => {
    if(!entry?.id || state.bloomDormant.has(entry.id)) return;
    const duration = baseDuration * (0.6 + Math.random() * 0.7);
    state.bloomDormant.set(entry.id, {
      timer: duration,
      entry,
      origin: entry.location,
      eventId: event.id,
    });
    spawnMapEvent({
      id: `${event.id || 'bloom'}-wilt-${entry.id}`,
      title: `${entry.title} Dormancy`,
      summary: `${entry.title} withdraws beneath the soil.`,
      type: 'bloom-wilt',
      glyph: [
        '\\|//',
        ' xx ',
        '//|\\',
      ],
      mapDuration: duration,
      mapLabel: `${entry.title} dormant cluster`,
      caption: 'Dormant',
    }, { anchor: entry.location, jitter: 2 });
  });
  renderMapMarkers();
}

function applySceneEventEffects(event){
  const ex = state.explorer;
  if(!ex || !event) return;
  if(event.type === 'weather' && event.requiresShelter){
    const shelterPause = Math.max(event.shelterDuration || 5.5, 4) + Math.random() * 1.5;
    ex.pauseTimer = Math.max(ex.pauseTimer || 0, shelterPause);
    ex.pauseDuration = ex.pauseTimer;
    ex.phase = 'idle';
    ex.target = null;
    ex.pendingRedirect = {
      type: event.redirectType || 'npc',
      reason: 'shelter',
    };
  } else if(event.type === 'encounter'){
    const disruption = Math.max(event.disruptDuration || 3.5, 2.5) + Math.random() * 1.5;
    ex.pauseTimer = Math.max(ex.pauseTimer || 0, disruption);
    ex.pauseDuration = ex.pauseTimer;
    ex.phase = 'idle';
    ex.target = null;
    if(event.redirectType){
      ex.pendingRedirect = {
        type: event.redirectType,
        category: event.redirectCategory || null,
        region: event.redirectRegion || null,
        reason: 'encounter',
      };
    }
  } else if(event.type === 'bloom'){
    startBloomDormancy(event);
  }
}

function triggerSceneEvent(){
  const ex = state.explorer;
  if(!ex || !SCENE_EVENTS.length) return;
  const previousId = ex.sceneEvent?.id;
  const pool = SCENE_EVENTS.filter(event => event.id !== previousId);
  const candidates = pool.length ? pool : SCENE_EVENTS;
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  if(!choice) return;
  ex.sceneEvent = { ...choice };
  ex.sceneTimer = Math.max(4, choice.duration || 24);
  ex.sceneTimerDisplay = Math.ceil(ex.sceneTimer);
  ex.sceneCooldown = Math.max(24, choice.cooldown || 48);
  ex.sceneInfluence = {
    npcBias: Math.max(0, choice.npcBias || 0),
  };
  ex.speed = ex.baseSpeed * (choice.speedMultiplier || 1);
  const sceneMarker = spawnMapEvent(choice);
  applySceneEventEffects(choice, sceneMarker);
  ex.log.unshift({
    type: 'scene',
    id: `scene:${choice.id}:${Date.now()}`,
    title: choice.title,
    summary: choice.summary,
    note: choice.logNote || '',
    time: new Date(),
  });
  ex.log = ex.log.slice(0, 10);
  if(choice.moodTag){
    applyExplorerMoodTag(choice.moodTag, {
      source: choice.title,
      type: 'event',
      zone: findZoneForCoordinate(ex.x, ex.y)?.name || '',
    });
  }
  renderExplorerLog();
  renderSceneEvent();
  renderExplorerStatus();
  renderMapTelemetry();
}

function clearSceneEvent(){
  const ex = state.explorer;
  if(!ex || !ex.sceneEvent) return;
  ex.sceneEvent = null;
  ex.sceneInfluence = null;
  ex.sceneTimer = 0;
  ex.sceneTimerDisplay = null;
  ex.speed = ex.baseSpeed;
  ex.sceneCooldown = Math.max(ex.sceneCooldown || 0, 18);
  renderSceneEvent();
  renderExplorerStatus();
  renderMapTelemetry();
}

function pickExplorerTarget(){
  const ex = state.explorer;
  if(!ex) return;
  const entryCandidates = state.entries.filter(e=>e.location);
  const npcCandidates = Array.isArray(state.npcs) ? state.npcs.filter(n=>n.location) : [];
  const unvisitedEntries = entryCandidates.filter(e=>!ex.collected.has(e.id));
  const entryPool = unvisitedEntries.length ? unvisitedEntries : entryCandidates;
  const npcsWithNew = npcCandidates.filter(hasNewNpcDialogue);
  const npcBias = Math.min(0.6, Math.max(0, ex.sceneInfluence?.npcBias || 0));
  const npcChance = Math.min(0.85, 0.22 + npcBias);
  const redirect = ex.pendingRedirect;
  if(redirect){
    ex.pendingRedirect = null;
    let nextTarget = null;
    if(redirect.type === 'npc' && npcCandidates.length){
      let pool = npcCandidates.slice();
      if(redirect.region){
        const filtered = pool.filter(npc => npc.location?.region === redirect.region);
        if(filtered.length) pool = filtered;
      }
      if(pool.length){
        const npc = pool[Math.floor(Math.random() * pool.length)];
        nextTarget = { type: 'npc', npc };
      }
    } else if(redirect.type === 'entry' && entryPool.length){
      let pool = entryPool.slice();
      if(redirect.category){
        const filtered = pool.filter(entry => entry.category === redirect.category);
        if(filtered.length) pool = filtered;
      }
      if(redirect.region){
        const filtered = pool.filter(entry => entry.location?.region === redirect.region);
        if(filtered.length) pool = filtered;
      }
      if(pool.length){
        const entry = pool[Math.floor(Math.random() * pool.length)];
        nextTarget = { type: 'entry', entry };
      }
    }
    if(nextTarget){
      ex.target = nextTarget;
      ex.phase = 'travel';
      renderExplorerStatus();
      renderMapMarkers();
      return;
    }
  }
  let nextTarget = null;
  if(npcsWithNew.length){
    const npc = npcsWithNew[Math.floor(Math.random() * npcsWithNew.length)];
    nextTarget = { type: 'npc', npc };
  } else if(entryPool.length){
    if(npcCandidates.length && Math.random() < npcChance){
      const npc = npcCandidates[Math.floor(Math.random() * npcCandidates.length)];
      nextTarget = { type: 'npc', npc };
    } else {
      const entry = entryPool[Math.floor(Math.random() * entryPool.length)];
      nextTarget = { type: 'entry', entry };
    }
  } else if(npcCandidates.length){
    const npc = npcCandidates[Math.floor(Math.random() * npcCandidates.length)];
    nextTarget = { type: 'npc', npc };
  }

  if(nextTarget){
    ex.target = nextTarget;
    ex.phase = 'travel';
  } else {
    ex.target = null;
    ex.phase = 'idle';
  }
  renderExplorerStatus();
  renderMapMarkers();
}

function handleExplorerCollect(entry){
  const ex = state.explorer;
  if(!ex) return;
  const isNew = !ex.collected.has(entry.id);
  recordExplorerPosition();
  ex.collected.add(entry.id);
  if(ex.routeCollected) ex.routeCollected.add(entry.id);
  if(Array.isArray(ex.routeSequence)) ex.routeSequence.push(entry.id);
  ex.totalCollected += 1;
  ex.log.unshift({
    type: 'collection',
    id: entry.id,
    title: entry.title,
    time: new Date(),
    rarity: entry.variant?.rarity,
    condition: entry.variant?.condition,
    mutation: entry.variant?.mutation,
    quirk: entry.variant?.quirk
  });
  ex.log = ex.log.slice(0, 10);
  ex.pauseTimer = 3.4;
  ex.pauseDuration = ex.pauseTimer;
  ex.phase = 'collecting';
  ex.lastCollectedTitle = entry.title;
  ex.lastCollectedVariant = entry.variant || null;
  ex.lastCollectedId = entry.id;
  ex.target = null;
  const moodTag = ENTRY_MOOD_TAGS[entry.id];
  if(moodTag){
    applyExplorerMoodTag(moodTag, {
      source: entry.title,
      type: 'discovery',
      zone: entry.location?.region || findZoneForCoordinate(entry.location?.x, entry.location?.y)?.name || '',
    });
  }
  renderExplorerUI();
  if(isNew){
    renderGrid();
  }
}

function handleExplorerNpc(npc){
  const ex = state.explorer;
  if(!ex || !npc) return;
  recordExplorerPosition();
  const selection = selectNpcDialogue(npc) || {};
  const dialogue = selection.dialogue || null;
  const lines = Array.isArray(dialogue?.lines) && dialogue.lines.length ? dialogue.lines.slice(0) : [`${npc.name} shares a quiet exchange.`];
  const duration = Math.max(3.4, lines.length * 1.7);
  ex.pauseTimer = duration;
  ex.pauseDuration = duration;
  ex.phase = 'conversing';
  ex.currentNpc = npc;
  ex.currentDialogue = {
    id: selection.key || null,
    title: dialogue?.title || '',
    lines,
    isNew: !!selection.isNew,
  };
  ex.log.unshift({
    type: 'dialogue',
    id: selection.key || `npc:${npc.id}:${Date.now()}`,
    title: npc.name,
    dialogueTitle: dialogue?.title || '',
    time: new Date(),
    lines,
    isNew: !!selection.isNew,
  });
  ex.log = ex.log.slice(0, 10);
  ex.target = null;
  if(ex.routeCollected) ex.routeCollected.clear();
  if(Array.isArray(ex.routeSequence)) ex.routeSequence.length = 0;
  if(npc){
    npc.wanderPause = Math.max(npc.wanderPause || 0, duration + 1.5);
    npc.wanderTarget = { x: npc.location.x, y: npc.location.y };
  }
  let moodTag = dialogue?.moodTag || (selection.key ? DIALOGUE_MOOD_TAGS[selection.key] : null);
  if(!moodTag && Array.isArray(dialogue?.requires)){
    for(const requirement of dialogue.requires){
      if(ENTRY_MOOD_TAGS[requirement]){
        moodTag = ENTRY_MOOD_TAGS[requirement];
        break;
      }
    }
  }
  if(moodTag){
    applyExplorerMoodTag(moodTag, {
      source: dialogue?.title || npc.name,
      type: 'dialogue',
      npc: npc.name,
      zone: npc.location?.region || '',
    });
  }
  renderExplorerUI();
}

function explorerStep(ts){
  const ex = state.explorer;
  if(!ex) return;
  if(!ex.lastTick) ex.lastTick = ts;
  const dt = Math.min((ts - ex.lastTick)/1000, 0.25);
  ex.lastTick = ts;
  ex.elapsedTime = (ex.elapsedTime || 0) + dt;
  updateNpcWandering(dt);
  updateActiveEvents(dt);
  updateExplorerMood(dt);
  ex.telemetryTimer = (ex.telemetryTimer || 0) + dt;
  if(ex.telemetryTimer >= 0.5){
    ex.telemetryTimer = 0;
    renderMapTelemetry();
  }

  if(ex.sceneTimer && ex.sceneTimer > 0){
    ex.sceneTimer = Math.max(0, ex.sceneTimer - dt);
    const display = Math.ceil(ex.sceneTimer);
    if(display !== ex.sceneTimerDisplay){
      ex.sceneTimerDisplay = display;
      renderSceneEvent();
      renderExplorerStatus();
    }
    if(ex.sceneTimer === 0){
      clearSceneEvent();
    }
  } else if(ex.sceneEvent){
    clearSceneEvent();
  } else {
    if(ex.sceneCooldown && ex.sceneCooldown > 0){
      ex.sceneCooldown = Math.max(0, ex.sceneCooldown - dt);
    } else if(Math.random() < 0.0035){
      triggerSceneEvent();
    }
  }

  if(ex.pauseTimer && ex.pauseTimer > 0){
    ex.pauseTimer = Math.max(0, ex.pauseTimer - dt);
    renderExplorerStatus();
    if(ex.pauseTimer === 0){
      ex.phase = 'idle';
      ex.currentNpc = null;
      ex.currentDialogue = null;
      renderExplorerStatus();
      pickExplorerTarget();
    }
  } else {
    if(!ex.target){
      pickExplorerTarget();
    }
    const targetEntry = ex.target?.entry;
    const targetNpc = ex.target?.npc;
    const destination = targetEntry?.location || targetNpc?.location;
    if(destination){
      const tx = destination.x;
      const ty = destination.y;
      const dx = tx - ex.x;
      const dy = ty - ex.y;
      const dist = Math.hypot(dx, dy);
      if(dist < 0.4){
        ex.x = tx;
        ex.y = ty;
        if(targetEntry){
          handleExplorerCollect(targetEntry);
        } else if(targetNpc){
          handleExplorerNpc(targetNpc);
        }
      } else if(dist > 0){
        const move = ex.speed * dt;
        if(move >= dist){
          ex.x = tx;
          ex.y = ty;
        } else {
          ex.x += (dx / dist) * move;
          ex.y += (dy / dist) * move;
        }
      }
    }
  }

  recordExplorerPosition();
  renderExplorerElement();
  state.explorerFrame = requestAnimationFrame(explorerStep);
}

function initExplorer(){
  if(!state.entries.length) return;
  if(state.explorerFrame){
    cancelAnimationFrame(state.explorerFrame);
    state.explorerFrame = null;
  }
  state.activeEvents = [];
  state.bloomDormant = new Map();
  state.explorer = {
    x: 50,
    y: 50,
    baseSpeed: 1.6,
    speed: 1.6,
    collected: new Set(),
    routeCollected: new Set(),
    routeSequence: [],
    log: [],
    totalCollected: 0,
    phase: 'idle',
    pauseTimer: 0,
    pauseDuration: 0,
    lastCollectedTitle: '',
    lastCollectedVariant: null,
    lastCollectedId: null,
    element: null,
    lastTick: null,
    path: [],
    dialogueSeen: new Set(),
    currentNpc: null,
    currentDialogue: null,
    sceneEvent: null,
    sceneInfluence: null,
    sceneTimer: 0,
    sceneTimerDisplay: null,
    sceneCooldown: 14,
    elapsedTime: 0,
    telemetryTimer: 0,
    pendingRedirect: null,
    currentZoneName: null,
  };
  ensureExplorerMood(state.explorer);
  ensureExplorerElement();
  recordExplorerPosition(true);
  updateMapCamera({ immediate: true });
  renderExplorerUI();
  renderMapTelemetry();
  state.explorerFrame = requestAnimationFrame(explorerStep);
}
