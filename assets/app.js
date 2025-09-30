const worldName = 'Dreamless Kingdom';

const catalogs = {
  entries: {
    key: 'entries',
    label: 'Encyclopedia',
    tagLabel: 'Tag',
    searchPlaceholder: 'Search titles and summaries… (press /)',
    exportFile: 'dreamless-kingdom-entries.json',
    datasetField: 'entries',
    getTag: (item) => item.tag,
    searchFields: [
      (item) => item.title,
      (item) => item.summary,
      (item) => item.category,
      (item) => item.tag
    ],
    modalTitle: 'Entry',
    cardSummary: (item) => item.summary,
    renderModal: (item, catalogKey) => {
      const hooks = generateHooks(item);
      return `
        <div class="kv">
          <div>World</div><div>${worldName}</div>
          <div>Category</div><div>${item.category || 'Entry'}</div>
          <div>Tag</div><div>${item.tag}</div>
          <div>ID</div><div><code>${item.id}</code></div>
        </div>
        <hr/>
        <p>${item.summary}</p>
        <h3>Adventure Hooks</h3>
        <ul>${hooks.map((h) => `<li>${h}</li>`).join('')}</ul>
        <hr/>
        <div class="small">Deep link: <a href="#/${catalogKey}/${item.id}">#/${catalogKey}/${item.id}</a></div>
      `;
    }
  },
  flora: {
    key: 'flora',
    label: 'Flora Atlas',
    tagLabel: 'Ecosystem',
    searchPlaceholder: 'Search plants by name, ecosystem, or traits…',
    exportFile: 'dreamless-kingdom-flora.json',
    datasetField: 'plants',
    getTag: (item) => item.ecosystem,
    searchFields: [
      (item) => item.title,
      (item) => item.summary,
      (item) => item.ecosystem,
      (item) => (item.features || []).join(' '),
      (item) => (item.uses || []).join(' '),
      (item) => item.hazards,
      (item) => item.propagation
    ],
    modalTitle: 'Plant',
    cardSummary: (item) => item.summary,
    renderModal: (item, catalogKey) => {
      const notes = generateFieldNotes(item);
      const parts = [];
      if (item.features && item.features.length) {
        parts.push(`
          <h3>Key Traits</h3>
          <ul>${item.features.map((f) => `<li>${f}</li>`).join('')}</ul>
        `);
      }
      if (item.uses && item.uses.length) {
        parts.push(`
          <h3>Common Uses</h3>
          <ul>${item.uses.map((u) => `<li>${u}</li>`).join('')}</ul>
        `);
      }
      if (item.hazards) {
        parts.push(`
          <h3>Risks & Precautions</h3>
          <p>${item.hazards}</p>
        `);
      }
      if (item.propagation) {
        parts.push(`
          <h3>Propagation Ritual</h3>
          <p>${item.propagation}</p>
        `);
      }
      parts.push(`
        <h3>Field Notes</h3>
        <ul>${notes.map((n) => `<li>${n}</li>`).join('')}</ul>
      `);
      return `
        <div class="kv">
          <div>World</div><div>${worldName}</div>
          <div>Catalog</div><div>${catalogs.flora.label}</div>
          <div>Ecosystem</div><div>${item.ecosystem}</div>
          <div>Classification</div><div>${item.classification || 'Plant'}</div>
          <div>Rarity</div><div>${item.rarity || 'Unknown'}</div>
          <div>ID</div><div><code>${item.id}</code></div>
        </div>
        <hr/>
        <p>${item.summary}</p>
        ${parts.join('')}
        <hr/>
        <div class="small">Deep link: <a href="#/${catalogKey}/${item.id}">#/${catalogKey}/${item.id}</a></div>
      `;
    }
  }
};

const state = {
  active: 'entries',
  catalogs: {
    entries: { list: [], filtered: [], tags: new Set(), tag: 'All', q: '' },
    flora: { list: [], filtered: [], tags: new Set(), tag: 'All', q: '' }
  }
};

function normalize(value) {
  return (value || '').toString().toLowerCase();
}

function hashFromString(value) {
  return Array.from(normalize(value)).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function generateHooks(entry) {
  const t = entry.title;
  const seeds = [
    `A caravan arrives seeking the ${t}. Their leader claims it belongs to their lineage. Decide who is right.`,
    `A child in the village has dreams of the ${t}. The dreams reveal a hidden location each night.`,
    `A Sporeborne artist offers a masterpiece if you let them study the ${t} for one hour.`,
    `Rumor says the ${t} can silence the Choir for a day. Someone wants you to try.`,
    `A fissure opens in the Deep Mines, echoing the pulse of the ${t}. Explore before it seals.`,
    `A guild archivist insists the ${t} is counterfeit. Prove or disprove it in the field.`
  ];
  const base = hashFromString(entry.id);
  return [
    seeds[base % seeds.length],
    seeds[(base + 2) % seeds.length],
    seeds[(base + 4) % seeds.length]
  ];
}

function generateFieldNotes(plant) {
  const t = plant.title;
  const e = plant.ecosystem;
  const seeds = [
    `Seasonal wardens report the ${t} shifting the balance in ${e}. Document who it aids and who it hinders.`,
    `An apprentice botanist believes the ${t} can revive a failing refuge. Test their theory without angering local stewards.`,
    `Trade envoys offer contraband in exchange for the ${t}. Decide whether its spread beyond ${e} is wise.`,
    `The ${t} reacts strangely during this cycle's eclipse. Determine if it is a warning or an opportunity.`,
    `A rival catalog insists the ${t} is myth. Gather proof before their dismissal erases crucial knowledge.`,
    `Migratory beasts have begun nesting near the ${t}. Map the new symbiosis and its risks.`,
    `The ${t} mirrors the Choir's latest hymn. Record what happens if the song is altered mid-verse.`
  ];
  const base = hashFromString(plant.id);
  return [
    seeds[base % seeds.length],
    seeds[(base + 3) % seeds.length],
    seeds[(base + 5) % seeds.length]
  ];
}

function setActiveCatalog(key, opts = {}) {
  if (!catalogs[key]) return;
  const changed = state.active !== key;
  state.active = key;
  const config = catalogs[key];
  const dataset = state.catalogs[key];
  const searchInput = document.querySelector('#q');
  if (searchInput) {
    searchInput.placeholder = config.searchPlaceholder;
    searchInput.value = dataset.q || '';
  }
  renderTabs();
  renderTags();
  applyFilters();
  if (changed && !opts.silent) {
    closeModal();
  }
}

function applyFilters() {
  const key = state.active;
  const config = catalogs[key];
  const dataset = state.catalogs[key];
  const q = normalize(dataset.q);
  const tagSelection = dataset.tag;
  dataset.filtered = dataset.list.filter((item) => {
    const matchesQ = !q || config.searchFields.some((fn) => {
      const value = fn(item);
      return value && normalize(value).includes(q);
    });
    const tagValue = config.getTag(item);
    const matchesTag = tagSelection === 'All' || tagValue === tagSelection;
    return matchesQ && matchesTag;
  });
  renderGrid();
  renderCount();
}

function renderCount() {
  const dataset = state.catalogs[state.active];
  const el = document.querySelector('#count');
  if (el) {
    el.textContent = `${dataset.filtered.length} / ${dataset.list.length}`;
  }
}

function renderGrid() {
  const grid = document.querySelector('#grid');
  if (!grid) return;
  grid.innerHTML = '';
  const config = catalogs[state.active];
  const dataset = state.catalogs[state.active];
  if (!dataset.filtered.length) {
    const empty = document.createElement('article');
    empty.className = 'card';
    empty.innerHTML = '<p class="small">No results match your filters yet. Adjust your search or ecosystem.</p>';
    grid.appendChild(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  dataset.filtered.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    const tagValue = config.getTag(item);
    const summary = config.cardSummary(item);
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p class="small">${summary}</p>
      ${tagValue ? `<span class="tag">${tagValue}</span>` : ''}
    `;
    card.addEventListener('click', () => openModal(item, state.active));
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

function renderTags() {
  const bar = document.querySelector('#tags');
  if (!bar) return;
  const config = catalogs[state.active];
  const dataset = state.catalogs[state.active];
  bar.innerHTML = '';
  const label = document.querySelector('#tag-label');
  if (label) {
    label.textContent = config.tagLabel;
  }
  const all = document.createElement('button');
  all.type = 'button';
  all.className = 'badge' + (dataset.tag === 'All' ? ' active' : '');
  all.textContent = 'All';
  all.addEventListener('click', () => {
    dataset.tag = 'All';
    applyFilters();
    renderTags();
  });
  bar.appendChild(all);
  Array.from(dataset.tags)
    .filter(Boolean)
    .sort()
    .forEach((tag) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'badge' + (dataset.tag === tag ? ' active' : '');
      btn.textContent = tag;
      btn.addEventListener('click', () => {
        dataset.tag = tag;
        applyFilters();
        renderTags();
      });
      bar.appendChild(btn);
    });
}

function renderTabs() {
  const tabs = document.querySelector('#catalog-tabs');
  if (!tabs) return;
  tabs.innerHTML = '';
  Object.values(catalogs).forEach((config) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = state.active === config.key ? 'active' : '';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', state.active === config.key ? 'true' : 'false');
    btn.textContent = config.label;
    btn.addEventListener('click', () => {
      if (state.active !== config.key) {
        setActiveCatalog(config.key);
      }
    });
    tabs.appendChild(btn);
  });
}

function openModal(item, catalogKey = state.active, opts = {}) {
  const modal = document.querySelector('#modal');
  const body = modal.querySelector('.body');
  const heading = document.querySelector('#modal-heading');
  const config = catalogs[catalogKey];
  if (heading) {
    heading.textContent = config.modalTitle;
  }
  body.innerHTML = config.renderModal(item, catalogKey);
  modal.classList.add('open');
  if (!opts.fromHash) {
    location.hash = `#/${catalogKey}/${item.id}`;
  }
}

function closeModal(opts = {}) {
  const modal = document.querySelector('#modal');
  if (!modal.classList.contains('open')) return;
  modal.classList.remove('open');
  if (!opts.suppressHash) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
  }
}

function restoreFromHash() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash) {
    closeModal({ suppressHash: true });
    return;
  }
  const parts = hash.split('/').filter(Boolean);
  if (parts.length !== 2) return;
  let [catalogKey, id] = parts;
  if (catalogKey === 'item') catalogKey = 'entries';
  if (!catalogs[catalogKey]) return;
  const dataset = state.catalogs[catalogKey];
  const item = dataset.list.find((entry) => entry.id === id);
  if (!item) return;
  const tagValue = catalogs[catalogKey].getTag(item);
  dataset.q = '';
  dataset.tag = tagValue || 'All';
  setActiveCatalog(catalogKey, { silent: true });
  openModal(item, catalogKey, { fromHash: true });
}

async function main() {
  const [entriesRes, floraRes] = await Promise.all([
    fetch('data/entries.json').then((r) => r.json()),
    fetch('data/flora.json').then((r) => r.json())
  ]);
  state.catalogs.entries.list = entriesRes.entries || [];
  state.catalogs.entries.tags = new Set(
    (entriesRes.entries || []).map((entry) => catalogs.entries.getTag(entry)).filter(Boolean)
  );
  state.catalogs.flora.list = floraRes.plants || [];
  state.catalogs.flora.tags = new Set(
    (floraRes.plants || []).map((plant) => catalogs.flora.getTag(plant)).filter(Boolean)
  );
  setActiveCatalog(state.active, { silent: true });
  restoreFromHash();
}

window.addEventListener('hashchange', restoreFromHash);

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('#q');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const dataset = state.catalogs[state.active];
      dataset.q = e.target.value;
      applyFilters();
    });
  }
  const closeBtn = document.querySelector('#close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal());
  }
  const modal = document.querySelector('#modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'modal') closeModal();
    });
  }
  const exportBtn = document.querySelector('#export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const config = catalogs[state.active];
      const dataset = state.catalogs[state.active];
      const payload = {
        world: worldName,
        catalog: config.label,
        items: dataset.filtered
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = config.exportFile;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
  main();
});
