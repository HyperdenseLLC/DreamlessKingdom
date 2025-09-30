
const state = {
  entries: [],
  filtered: [],
  tags: new Set(),
  q: '',
  tag: 'All',
  explorer: null,
  explorerFrame: null,
};

function renderMapMarkers(){
  const map = document.querySelector('#map');
  if(!map) return;
  map.innerHTML = '';
  const filteredIds = new Set(state.filtered.map(e=>e.id));
  state.entries.filter(e=>e.location).forEach(e=>{
    const marker = document.createElement('button');
    const classes = ['marker'];
    if(!filteredIds.has(e.id)) classes.push('dim');
    if(state.explorer?.collected?.has(e.id)) classes.push('collected');
    if(state.explorer?.target?.entry?.id === e.id) classes.push('target');
    marker.className = classes.join(' ');
    marker.style.left = `${e.location.x}%`;
    marker.style.top = `${e.location.y}%`;
    marker.setAttribute('aria-label', `${e.title} — ${e.location.region||'Unknown region'}`);
    marker.title = `${e.title}\n${e.location.region||'Unknown region'}`;
    marker.innerHTML = '<span></span>';
    marker.addEventListener('click', ()=>openModal(e));
    map.appendChild(marker);
  });
  if(state.explorer){
    renderExplorerElement();
  }
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
    const isCollected = !!state.explorer?.collected?.has(e.id);
    card.className = 'card' + (isCollected ? ' collected' : '');
    card.innerHTML = `<h3>${e.title}</h3>
      <p class="small">${e.summary}</p>
      <span class="tag">${e.tag}</span>
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

async function main(){
  const res = await fetch('data/entries.json');
  const j = await res.json();
  state.entries = j.entries;
  state.tags = new Set(state.entries.map(e=>e.tag));
  renderTags();
  applyFilters();
  restoreFromHash();
  renderMapMarkers();
  initExplorer();
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

function ensureExplorerElement(){
  if(!state.explorer) return null;
  const map = document.querySelector('#map');
  if(!map) return null;
  let el = map.querySelector('.explorer');
  if(!el){
    el = document.createElement('div');
    el.className = 'explorer';
    el.setAttribute('aria-hidden', 'true');
    map.appendChild(el);
  } else if(el.parentElement !== map){
    map.appendChild(el);
  }
  state.explorer.element = el;
  return el;
}

function renderExplorerElement(){
  if(!state.explorer) return;
  const el = ensureExplorerElement();
  if(!el) return;
  el.style.left = `${state.explorer.x}%`;
  el.style.top = `${state.explorer.y}%`;
}

function renderExplorerStatus(){
  const el = document.querySelector('#explorer-status');
  if(!el || !state.explorer) return;
  const ex = state.explorer;
  let text = 'Surveyor calibrating instruments…';
  if(ex.phase === 'travel' && ex.target?.entry){
    const region = ex.target.entry.location?.region || 'Unknown region';
    text = `En route to ${ex.target.entry.title} (${region})`;
  } else if(ex.phase === 'collecting'){
    const remaining = Math.max(0, ex.pauseTimer || 0);
    const suffix = remaining > 0 ? ` (${Math.ceil(remaining)}s)` : '';
    text = `Cataloguing ${ex.lastCollectedTitle}${suffix}`;
  } else if(ex.phase === 'idle'){
    text = 'Surveyor selecting the next waypoint…';
  }
  el.textContent = text;
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
    li.innerHTML = `<span class="log-time">${time}</span><span class="log-title">${item.title}</span>`;
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
  renderExplorerCount();
  renderExplorerLog();
  renderMapMarkers();
}

function pickExplorerTarget(){
  const ex = state.explorer;
  if(!ex) return;
  const candidates = state.entries.filter(e=>e.location);
  if(!candidates.length){
    ex.phase = 'idle';
    ex.target = null;
    renderExplorerStatus();
    return;
  }
  const unvisited = candidates.filter(e=>!ex.collected.has(e.id));
  const pool = unvisited.length ? unvisited : candidates;
  const next = pool[Math.floor(Math.random()*pool.length)];
  ex.target = { entry: next };
  ex.phase = 'travel';
  renderExplorerStatus();
  renderMapMarkers();
}

function handleExplorerCollect(entry){
  const ex = state.explorer;
  if(!ex) return;
  const isNew = !ex.collected.has(entry.id);
  ex.collected.add(entry.id);
  ex.totalCollected += 1;
  ex.log.unshift({ id: entry.id, title: entry.title, time: new Date() });
  ex.log = ex.log.slice(0, 8);
  ex.pauseTimer = 2.2;
  ex.pauseDuration = ex.pauseTimer;
  ex.phase = 'collecting';
  ex.lastCollectedTitle = entry.title;
  ex.target = null;
  renderExplorerUI();
  if(isNew){
    renderGrid();
  }
}

function explorerStep(ts){
  const ex = state.explorer;
  if(!ex) return;
  if(!ex.lastTick) ex.lastTick = ts;
  const dt = Math.min((ts - ex.lastTick)/1000, 0.25);
  ex.lastTick = ts;

  if(ex.pauseTimer && ex.pauseTimer > 0){
    ex.pauseTimer = Math.max(0, ex.pauseTimer - dt);
    renderExplorerStatus();
    if(ex.pauseTimer === 0){
      ex.phase = 'idle';
      renderExplorerStatus();
      pickExplorerTarget();
    }
  } else {
    if(!ex.target){
      pickExplorerTarget();
    }
    const targetEntry = ex.target?.entry;
    if(targetEntry?.location){
      const tx = targetEntry.location.x;
      const ty = targetEntry.location.y;
      const dx = tx - ex.x;
      const dy = ty - ex.y;
      const dist = Math.hypot(dx, dy);
      if(dist < 0.4){
        ex.x = tx;
        ex.y = ty;
        handleExplorerCollect(targetEntry);
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
    speed: 9,
    collected: new Set(),
    log: [],
    totalCollected: 0,
    phase: 'idle',
    pauseTimer: 0,
    pauseDuration: 0,
    lastCollectedTitle: '',
    element: null,
    lastTick: null,
  };
  ensureExplorerElement();
  renderExplorerUI();
  state.explorerFrame = requestAnimationFrame(explorerStep);
}
