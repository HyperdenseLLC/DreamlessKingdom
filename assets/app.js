
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
};

const MAP_WORLD_SCALE = 1.12;

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
  }
];

const ISO_PROJECTION = (()=>{
  const angle = Math.PI / 6;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rangeX = cos * 100;
  const marginX = 14;
  const marginYTop = 10;
  const marginYBottom = 18;
  return {
    angle,
    cos,
    sin,
    rangeX,
    marginX,
    marginYTop,
    marginYBottom,
    scaleX: 100 - marginX,
    scaleY: 100 - (marginYTop + marginYBottom),
  };
})();

const MAP_ZONES = [
  {
    name: 'Aurora Marches',
    description: 'Skybreak Ridge • Wind-Carved Steps',
    x: 20,
    y: 18,
    width: 28,
    height: 20,
    regions: ['Skybreak Ridge', 'Wind-Carved Steps']
  },
  {
    name: 'Choir Expanse',
    description: 'Resonant Plaza • Choir Ruins • Alchemists\' Span',
    x: 38,
    y: 30,
    width: 30,
    height: 22,
    regions: ['Resonant Plaza', 'Choir Ruins', "Alchemists' Span"]
  },
  {
    name: 'Verdant Hollows',
    description: 'Dreamroot Terraces & Whispering Groves',
    x: 30,
    y: 60,
    width: 34,
    height: 24,
    regions: ['Verdant Hollows', 'Whispering Arboretum']
  },
  {
    name: 'Carnival Ribbon',
    description: 'Sunken Promenade • Carnival Greenways',
    x: 46,
    y: 72,
    width: 28,
    height: 22,
    regions: ['Sunken Promenade', 'Carnival Quarter Greenways']
  },
  {
    name: 'Radiant Courts',
    description: 'Gilt Palace • Veiled Colonnade • Shatterlight Forge',
    x: 62,
    y: 40,
    width: 32,
    height: 26,
    regions: ['Gilt Palace Conservatory', 'Veiled Colonnade', 'Shatterlight Forge']
  },
  {
    name: 'Tideglass Reach',
    description: 'Undersea Observatory • Tideglass Reaches',
    x: 82,
    y: 52,
    width: 28,
    height: 24,
    regions: ['Undersea Observatory', 'Tideglass Reaches']
  },
  {
    name: 'Veiled Deepways',
    description: 'Deep Mines • Dusk Tunnels',
    x: 72,
    y: 72,
    width: 30,
    height: 26,
    regions: ['Deep Mines', 'Dusk Tunnels Fen']
  },
  {
    name: 'Western Fringe',
    description: 'Wanderer\'s Causeway • Archive Warrens',
    x: 22,
    y: 78,
    width: 30,
    height: 24,
    regions: ["Wanderer's Causeway", 'Archive Warrens']
  }
];

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

function projectIsoPoint(x, y){
  if(x == null || y == null) return { left: 50, top: 50 };
  const rawX = ((x - y) * ISO_PROJECTION.cos + ISO_PROJECTION.rangeX) / (ISO_PROJECTION.rangeX * 2);
  const rawY = (x + y) * ISO_PROJECTION.sin / 100;
  const left = rawX * ISO_PROJECTION.scaleX + ISO_PROJECTION.marginX / 2;
  const top = rawY * ISO_PROJECTION.scaleY + ISO_PROJECTION.marginYTop;
  return {
    left: Math.min(100, Math.max(0, left)),
    top: Math.min(100, Math.max(0, top)),
  };
}

function projectIsoSize(width, height){
  const w = Math.max(0, Number.isFinite(width) ? width : 0);
  const hSource = Number.isFinite(height) ? height : width;
  const h = Math.max(0, hSource);
  const isoWidth = (w * ISO_PROJECTION.cos / (ISO_PROJECTION.rangeX * 2)) * ISO_PROJECTION.scaleX;
  const isoHeight = (h * ISO_PROJECTION.sin / 100) * ISO_PROJECTION.scaleY;
  return {
    width: Math.min(ISO_PROJECTION.scaleX, Math.max(isoWidth, 6)),
    height: Math.min(ISO_PROJECTION.scaleY, Math.max(isoHeight, Math.max(isoWidth * 0.65, 5))),
  };
}

function rectanglesOverlap(a, b){
  if(!a || !b) return false;
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
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
  const ground = document.createElement('div');
  ground.className = 'map-ground';
  ground.setAttribute('aria-hidden', 'true');
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
  const npcLayer = document.createElement('div');
  npcLayer.className = 'map-layer map-layer-npcs';
  const actorsLayer = document.createElement('div');
  actorsLayer.className = 'map-layer map-layer-actors';
  world.append(ground, pathSvg, zonesLayer, markersLayer, npcLayer, actorsLayer);
  map.appendChild(viewport);
  map._layers = {
    viewport,
    world,
    ground,
    path: { svg: pathSvg, line: pathLine },
    zones: zonesLayer,
    markers: markersLayer,
    npcs: npcLayer,
    actors: actorsLayer,
  };
  return map._layers;
}

function renderMapZones(layer){
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
    const classes = ['map-zone'];
    if(isActive) classes.push('active');
    const vertical = zone.y > 55 ? 'label-above' : 'label-below';
    classes.push(vertical);
    zoneEl.className = classes.join(' ');
    const { left, top } = projectIsoPoint(zone.x, zone.y);
    const size = projectIsoSize(zone.width, zone.height || zone.width);
    zoneEl.style.left = `${left}%`;
    zoneEl.style.top = `${top}%`;
    zoneEl.style.width = `${size.width}%`;
    zoneEl.style.height = `${size.height}%`;
    const label = document.createElement('div');
    label.className = 'map-zone-label';
    label.innerHTML = `<strong>${zone.name}</strong>${zone.description ? `<span>${zone.description}</span>` : ''}`;
    zoneEl.appendChild(label);
    layer.appendChild(zoneEl);
  });
}

function renderMapMarkers(){
  const map = document.querySelector('#map');
  if(!map) return;
  const layers = ensureMapStructure();
  if(!layers) return;
  const { zones, markers, npcs } = layers;
  renderMapZones(zones);
  markers.innerHTML = '';
  if(npcs) npcs.innerHTML = '';
  const filteredIds = new Set(state.filtered.map(e=>e.id));
  state.entries.filter(e=>e.location).forEach(e=>{
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
    });
  }
  if(state.explorer){
    renderExplorerElement();
  } else {
    layers.actors.innerHTML = '';
  }
  updateExplorerTrail();
  requestAnimationFrame(resolveMapLabelCollisions);
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
  zones.forEach(zone => {
    const label = zone.querySelector('.map-zone-label');
    if(!label) return;
    label.style.removeProperty('--label-shift-x');
    label.style.removeProperty('--label-gap');
    label.style.removeProperty('--label-shift-y');
    const prefersAbove = zone.classList.contains('label-above');
    const orientations = prefersAbove ? ['label-above', 'label-below'] : ['label-below', 'label-above'];
    const gaps = [22, 28, 36];
    const shifts = [0, -64, 64, -110, 110];
    let placed = false;
    for(const orientation of orientations){
      orientationClasses.forEach(cls => zone.classList.remove(cls));
      zone.classList.add(orientation);
      for(const gap of gaps){
        label.style.setProperty('--label-gap', `${gap}px`);
        for(const shift of shifts){
          label.style.setProperty('--label-shift-x', `${shift}px`);
          const rect = label.getBoundingClientRect();
          const overlaps = markerRects.some(markerRect => rectanglesOverlap(rect, markerRect));
          if(!overlaps){
            placed = true;
            break;
          }
        }
        if(placed) break;
      }
      if(placed) break;
    }
    if(!placed){
      orientationClasses.forEach(cls => zone.classList.remove(cls));
      zone.classList.add(orientations[0]);
      label.style.setProperty('--label-gap', '36px');
      label.style.setProperty('--label-shift-x', orientations[0] === 'label-above' ? '-110px' : '110px');
    }
  });
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

function openNpcModal(npc){
  if(!npc) return;
  const modal = document.querySelector('#modal');
  const body = modal.querySelector('.body');
  const ex = state.explorer;
  const seen = ex?.dialogueSeen || new Set();
  const entriesById = new Map(state.entries.map(entry => [entry.id, entry]));
  const dialogues = Array.isArray(npc.dialogues) ? npc.dialogues : [];
  const listHtml = dialogues.map(dialogue => {
    const key = npcDialogueKey(npc, dialogue);
    const unlocked = npcDialogueUnlocked(dialogue, ex);
    const requirementTitles = (dialogue.requires || []).map(id => entriesById.get(id)?.title || id);
    const requirementText = requirementTitles.length ? `Requires: ${requirementTitles.join(', ')}` : 'Always available';
    const preview = unlocked ? (dialogue.lines?.[0] || 'Conversation ready to share.') : requirementText;
    const status = unlocked ? (seen.has(key) || dialogue.fallback ? 'Exchange recorded' : 'Awaiting exchange') : 'Collect the listed specimens to unlock.';
    const classes = ['npc-dialogue'];
    classes.push(unlocked ? 'unlocked' : 'locked');
    return `
      <li class="${classes.join(' ')}">
        <strong>${dialogue.title}</strong>
        <span class="preview">${preview}</span>
        <span class="status">${status}</span>
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
  state.npcs = NPCS.map(npc => ({ ...npc }));
  state.variantCycle = applyVariantProfiles(state.entries);
  state.tags = new Set(state.entries.map(e=>e.tag));
  renderVariantCycle();
  renderTags();
  applyFilters();
  restoreFromHash();
  initExplorer();
}

window.addEventListener('hashchange', restoreFromHash);
window.addEventListener('resize', ()=>{
  updateMapCamera({ immediate: true });
  requestAnimationFrame(resolveMapLabelCollisions);
});
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelector('#q').addEventListener('input', (e)=>{ state.q = e.target.value; applyFilters(); });
  document.querySelector('#close').addEventListener('click', closeModal);
  document.querySelector('#modal').addEventListener('click', (e)=>{ if(e.target.id==='modal') closeModal(); });
  document.querySelector('#export').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify({world:'Dreamless Kingdom',entries:state.filtered}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dreamless-kingdom-entries.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
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

function updateMapCamera({ immediate = false } = {}){
  const ex = state.explorer;
  if(!ex) return;
  const layers = ensureMapStructure();
  if(!layers?.viewport || !layers?.world) return;
  const viewport = layers.viewport;
  const world = layers.world;
  const viewportWidth = viewport.clientWidth;
  const viewportHeight = viewport.clientHeight;
  const worldWidth = world.clientWidth;
  const worldHeight = world.clientHeight;
  if(!viewportWidth || !viewportHeight || !worldWidth || !worldHeight) return;
  const pos = projectIsoPoint(ex.x, ex.y);
  const targetX = (pos.left / 100) * worldWidth;
  const targetY = (pos.top / 100) * worldHeight;
  const offsetX = viewportWidth / 2 - targetX;
  const offsetY = viewportHeight / 2 - targetY;
  const maxOffsetX = Math.max(0, (worldWidth - viewportWidth) / 2);
  const maxOffsetY = Math.max(0, (worldHeight - viewportHeight) / 2);
  const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
  const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));
  if(immediate){
    world.classList.add('no-transition');
  }
  world.style.setProperty('--map-offset-x', `${clampedX}px`);
  world.style.setProperty('--map-offset-y', `${clampedY}px`);
  if(immediate){
    requestAnimationFrame(()=> world.classList.remove('no-transition'));
  }
}

function updateExplorerTrail(){
  const map = document.querySelector('#map');
  if(!map) return;
  const layers = ensureMapStructure();
  if(!layers) return;
  const line = layers.path?.line;
  if(!line) return;
  const path = state.explorer?.path || [];
  if(!path.length){
    line.setAttribute('points', '');
    line.classList.remove('active');
    return;
  }
  const points = path.map(pt => {
    const projected = projectIsoPoint(pt.x, pt.y);
    return `${projected.left},${projected.top}`;
  }).join(' ');
  line.setAttribute('points', points);
  line.classList.toggle('active', path.length > 1);
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

function renderExplorerUI(){
  renderExplorerElement();
  renderExplorerStatus();
  renderSceneEvent();
  renderExplorerCount();
  renderExplorerLog();
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
  const fallback = available.find(d => d.fallback) || available[available.length - 1];
  const seen = ex.dialogueSeen;
  let choice = available.find(d => !seen.has(npcDialogueKey(npc, d)));
  if(!choice) choice = fallback;
  const key = npcDialogueKey(npc, choice);
  const isNew = !seen.has(key) && !choice?.fallback;
  if(!preview){
    seen.add(key);
  }
  return { npc, dialogue: choice, key, isNew };
}

function hasNewNpcDialogue(npc){
  const ex = state.explorer;
  if(!ex) return false;
  const result = selectNpcDialogue(npc, { preview: true });
  return !!(result && result.isNew);
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
  ex.log.unshift({
    type: 'scene',
    id: `scene:${choice.id}:${Date.now()}`,
    title: choice.title,
    summary: choice.summary,
    note: choice.logNote || '',
    time: new Date(),
  });
  ex.log = ex.log.slice(0, 10);
  renderExplorerLog();
  renderSceneEvent();
  renderExplorerStatus();
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
  ex.pauseTimer = 2.2;
  ex.pauseDuration = ex.pauseTimer;
  ex.phase = 'collecting';
  ex.lastCollectedTitle = entry.title;
  ex.lastCollectedVariant = entry.variant || null;
  ex.target = null;
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
  const duration = Math.max(2.6, lines.length * 1.4);
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
  renderExplorerUI();
}

function explorerStep(ts){
  const ex = state.explorer;
  if(!ex) return;
  if(!ex.lastTick) ex.lastTick = ts;
  const dt = Math.min((ts - ex.lastTick)/1000, 0.25);
  ex.lastTick = ts;

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
  state.explorer = {
    x: 50,
    y: 50,
    baseSpeed: 5,
    speed: 5,
    collected: new Set(),
    log: [],
    totalCollected: 0,
    phase: 'idle',
    pauseTimer: 0,
    pauseDuration: 0,
    lastCollectedTitle: '',
    lastCollectedVariant: null,
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
  };
  ensureExplorerElement();
  recordExplorerPosition(true);
  updateMapCamera({ immediate: true });
  renderExplorerUI();
  state.explorerFrame = requestAnimationFrame(explorerStep);
}
