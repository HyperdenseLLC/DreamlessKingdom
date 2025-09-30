
const state = {
  entries: [],
  filtered: [],
  tags: new Set(),
  q: '',
  tag: 'All',
};

function renderMapMarkers(){
  const map = document.querySelector('#map');
  if(!map) return;
  map.innerHTML = '';
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
    `A caravan arrives seeking the ${t}. Their leader claims it belongs to their lineage. Decide who is right.`,
    `A child in the village has dreams of the ${t}. The dreams reveal a hidden location each night.`,
    `A Sporeborne artist offers a masterpiece if you let them study the ${t} for one hour.`,
    `Rumor says the ${t} can silence the Choir for a day. Someone wants you to try.`,
    `A fissure opens in the Deep Mines, echoing the pulse of the ${t}. Explore before it seals.`,
    `A guild archivist insists the ${t} is counterfeit. Prove or disprove it in the field.`
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
