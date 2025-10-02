
const state = {
  entries: [],
  filtered: [],
  tags: new Set(),
  q: '',
  tag: 'All',
};

const STATIC_TOPOGRAPHY_SVG = `
  <svg class="map-topography" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="terrain-water" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#071018"/>
        <stop offset="55%" stop-color="#0b1826"/>
        <stop offset="100%" stop-color="#050b13"/>
      </linearGradient>
      <radialGradient id="terrain-glow" cx="52%" cy="38%" r="62%">
        <stop offset="0%" stop-color="#1f3b54" stop-opacity="0.9"/>
        <stop offset="60%" stop-color="#142941" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#0b1826" stop-opacity="0.7"/>
      </radialGradient>
      <linearGradient id="terrain-fill" x1="32%" y1="12%" x2="78%" y2="88%">
        <stop offset="0%" stop-color="#1f3951"/>
        <stop offset="40%" stop-color="#203c4c"/>
        <stop offset="100%" stop-color="#122332"/>
      </linearGradient>
      <linearGradient id="terrain-ridge" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3d8fb6" stop-opacity="0.85"/>
        <stop offset="50%" stop-color="#6abbe0" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#3682ab" stop-opacity="0.85"/>
      </linearGradient>
      <filter id="terrain-haze" x="-15%" y="-15%" width="130%" height="130%">
        <feGaussianBlur stdDeviation="18" result="blur"/>
        <feBlend in="blur" in2="SourceGraphic" mode="screen"/>
      </filter>
    </defs>
    <rect width="1200" height="720" fill="url(#terrain-water)"/>
    <g class="land" filter="url(#terrain-haze)">
      <path class="landmass" d="M132 484C134 356 244 272 398 242C512 220 624 170 734 182C850 196 938 262 970 338C1004 418 956 508 890 566C822 626 712 642 610 616C520 594 462 618 376 610C268 600 168 564 132 484Z" fill="url(#terrain-glow)"/>
      <path class="landmass-outline" d="M152 470C154 366 250 292 396 262C500 240 612 188 722 198C826 208 904 266 932 330C962 396 926 472 868 524C812 576 710 596 618 574C520 550 462 574 384 566C288 556 190 528 152 470Z" fill="url(#terrain-fill)"/>
    </g>
    <g class="contours">
      <path class="contour contour-major" d="M188 470C198 382 296 320 428 292C528 270 622 238 708 248C782 256 846 288 876 338C912 398 874 466 822 516C770 566 688 584 604 564C520 544 462 566 394 558C306 548 224 520 188 470Z"/>
      <path class="contour contour-major" d="M236 470C248 396 320 348 430 320C512 300 596 276 674 286C734 294 786 320 810 356C842 404 812 458 770 496C726 536 656 548 586 532C514 516 460 534 400 526C324 516 266 502 236 470Z"/>
      <path class="contour contour-tight" d="M292 468C304 410 360 368 448 348C520 332 586 320 642 330C688 338 726 356 742 382C764 420 740 456 706 486C670 516 612 524 556 510C502 496 460 510 410 502C356 494 312 486 292 468Z"/>
      <path class="contour contour-tight" d="M338 468C348 426 394 392 460 378C516 366 570 360 612 368C646 374 676 388 688 410C704 438 686 466 660 490C632 514 584 520 540 506C494 492 458 504 420 498C380 492 350 484 338 468Z"/>
      <path class="contour contour-fine" d="M382 470C390 440 424 414 474 404C514 396 552 392 586 398C612 402 636 414 644 430C656 452 642 474 620 494C596 514 560 518 526 508C494 498 462 508 432 504C406 500 390 490 382 470Z"/>
      <path class="contour contour-fine" d="M430 470C438 448 464 432 500 426C530 422 560 420 582 424C602 428 620 438 626 450C636 468 624 486 604 500C582 516 552 518 526 508C502 500 474 510 450 506C438 504 432 492 430 470Z"/>
      <path class="contour contour-major" d="M322 404C350 352 420 314 510 300C580 290 642 292 694 304C742 314 782 338 802 366"/>
      <path class="contour contour-fine" d="M264 426C292 366 366 320 468 304"/>
      <path class="contour contour-fine" d="M526 286C582 276 648 276 698 286"/>
    </g>
    <g class="ridges">
      <path class="ridge" d="M332 344C378 310 454 286 544 278C626 270 710 284 772 320"/>
      <path class="ridge" d="M364 310C430 268 536 244 640 250C706 254 764 272 806 298"/>
    </g>
    <g class="waterways">
      <path class="river" d="M520 520C552 486 562 452 560 418C558 374 582 338 636 312"/>
      <path class="river" d="M468 496C500 462 506 426 498 390"/>
      <path class="lake" d="M646 370C662 354 692 348 712 360C732 372 732 396 716 414C700 432 666 438 648 424C632 412 630 388 646 370Z"/>
      <path class="lake" d="M424 432C438 420 460 416 476 424C492 432 492 450 478 462C464 474 440 478 426 468C414 460 412 444 424 432Z"/>
    </g>
    <g class="highlights">
      <path class="glow" d="M300 516C360 556 452 578 548 576C644 574 720 548 786 494"/>
      <path class="glow" d="M248 448C292 378 380 326 496 310"/>
    </g>
    <g class="islands">
      <path class="island" d="M968 420C984 404 1008 398 1028 406C1048 414 1052 432 1038 446C1024 460 996 466 978 456C962 448 954 434 968 420Z"/>
      <path class="island" d="M204 308C214 296 234 292 250 298C266 304 268 320 256 332C244 344 222 348 208 340C196 334 194 320 204 308Z"/>
    </g>
  </svg>
`;

function createTopographySvg(){
  const template = document.createElement('template');
  template.innerHTML = STATIC_TOPOGRAPHY_SVG.trim();
  const svg = template.content.firstElementChild;
  if(svg){
    svg.setAttribute('aria-hidden', 'true');
  }
  return svg;
}

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
  const topo = createTopographySvg();
  if(topo){
    map.appendChild(topo);
  }
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
