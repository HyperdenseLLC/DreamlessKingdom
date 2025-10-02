
const state = {
  entries: [],
  filtered: [],
  tags: new Set(),
  q: '',
  tag: 'All',
};

const WORLD_TOPOGRAPHY = Object.freeze({
  gridWidth: 64,
  gridHeight: 36,
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
  },
];

function renderMapMarkers(){
  const map = document.querySelector('#map');
  if(!map) return;
  map.innerHTML = '';
  const ascii = document.createElement('pre');
  ascii.className = 'map-topography-ascii';
  ascii.setAttribute('aria-hidden', 'true');
  ascii.textContent = generateWorldTopographyAscii();
  map.appendChild(ascii);
  const filteredIds = new Set(state.filtered.map(e=>e.id));
  state.entries.filter(e=>e.location).forEach(e=>{
    const marker = document.createElement('button');
    marker.className = 'marker' + (filteredIds.has(e.id) ? '' : ' dim');
    marker.style.left = `${e.location.x}%`;
    marker.style.top = `${e.location.y}%`;
    marker.setAttribute('aria-label', `${e.title} — ${e.location.region||'Unknown region'}`);
    marker.title = `${e.title}\n${e.location.region||'Unknown region'}`;
    marker.innerHTML = '<span></span>';
    marker.addEventListener('click', ()=>openModal(e));
    map.appendChild(marker);
  });
}

function normalize(s) { return (s||'').toLowerCase(); }

function generateHooks(e) {
  const hooks = [];
  const t = e.title;
  const tag = e.tag;
  const seeds = [
    `A grove-tender begs you to transplant the ${t} before a frost wave rolls across the Verdant Hollows.`,
    `The Gilt Conservatory offers a charter if you retrieve living samples of the ${t} without bruising a single frond.`,
    `Spore choristers swear the ${t} hums at dusk. Record its melody before the Choir Ruins collapse again.`,
    `A caravan of night brewers covets the ${t}, but a rival syndicate posted a bounty to burn it first. Choose a side.`,
    `Atlas mapwrights insist the ${t} migrates along ley-lines. Track its drift with the overlay before the trail fades.`,
    `A dreamless sleeper briefly murmured the name ${t}. Discover what vision the plant shared.`
  ];
  // pick three deterministic by hash of id for stable hooks
  const h = Array.from(normalize(e.id)).reduce((a,c)=>a+c.charCodeAt(0),0);
  hooks.push(seeds[h % seeds.length]);
  hooks.push(seeds[(h+2) % seeds.length]);
  hooks.push(seeds[(h+4) % seeds.length]);
  return hooks;
}

function applyFilters() {
  const q = normalize(state.q);
  const tag = state.tag;
  state.filtered = state.entries.filter(e => {
    const matchesQ = !q || normalize(e.title).includes(q) || normalize(e.summary).includes(q);
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
    card.className = 'card';
    card.innerHTML = `<h3>${e.title}</h3>
      <p class="small">${e.summary}</p>
      <span class="tag">${e.tag}</span>`;
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
  body.innerHTML = `
    <div class="kv">
      <div>World</div><div>Dreamless Kingdom</div>
      <div>Category</div><div>${e.category||'Entry'}</div>
      <div>Tag</div><div>${e.tag}</div>
      ${region ? `<div>Region</div><div>${region}</div>` : ''}
      <div>ID</div><div><code>${e.id}</code></div>
      ${coords ? `<div>Map Coordinates</div><div>${coords}</div>` : ''}
    </div>
    <hr/>
    <p>${e.summary}</p>
    <h3>Adventure Hooks</h3>
    <ul>${hooks.map(h=>`<li>${h}</li>`).join('')}</ul>
    <hr/>
    <div class="small">Deep link: <a href="#/item/${e.id}">#/item/${e.id}</a></div>
  `;
  modal.classList.add('open');
  location.hash = `#/item/${e.id}`;
}

function closeModal(){
  const modal = document.querySelector('#modal');
  modal.classList.remove('open');
  if(location.hash.startsWith('#/item/')){
    history.pushState('', document.title, window.location.pathname + window.location.search);
  }
}

function restoreFromHash(){
  const parts = location.hash.split('/');
  if(parts.length===3 && parts[1]==='item'){
    const id = parts[2];
    const e = state.entries.find(e=>e.id===id);
    if(e) openModal(e);
  }
}

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
      const idx = Math.abs(Math.floor(gx + gy)) % pattern.length;
      let char = pattern[idx] || pattern[0] || '.';
      if(sample.elevation > 1.4 && sample.hillInfluence > 0.55 && ((gx + gy) % 5 === 0)){
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

function seededRandom(seed, index = 0){
  const value = Math.sin((seed || 1) * 1337.13 + index * 97.73) * 43758.5453;
  return value - Math.floor(value);
}

function seededJitter(seed, index, amplitude = 1){
  return (seededRandom(seed, index) - 0.5) * 2 * amplitude;
}

async function main(){
  const res = await fetch('data/entries.json');
  const j = await res.json();
  state.entries = j.entries;
  state.tags = new Set(state.entries.map(e=>e.tag));
  renderTags();
  applyFilters();
  restoreFromHash();
  renderMapMarkers();
}

window.addEventListener('hashchange', restoreFromHash);
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
