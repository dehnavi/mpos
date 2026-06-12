// MPOS IDE frontend — vanilla ES module, no build step.

const state = {
  meta: null,
  tree: [],
  modifiedPaths: new Set(),
  currentPath: null,
  currentDoc: null,
  mode: 'edit',
  activeTab: 'metadata',
  collapsedFolders: new Set(),
  treeFilter: '',
  dirtySections: new Set(),
  panelCache: { validation: null, diff: null },
};

const TOP_DIR_LABELS = {
  docs: 'Docs',
  planning: 'Planning',
  tasks: 'Tasks',
  decisions: 'Decisions',
  changes: 'Changes',
  tutorials: 'Tutorials',
};
const TOP_DIR_ORDER = ['docs', 'planning', 'tasks', 'decisions', 'changes', 'tutorials'];

const TYPE_ICONS = {
  epic: 'epic',
  story: 'story',
  task: 'task',
  sprint: 'sprint',
  decision: 'decision',
  'change-request': 'change',
  'change-report': 'change',
  onboarding: 'book',
};

const MARKER_ORDER = ['CONFLICT', 'OPEN_QUESTION', 'RISK', 'DECISION', 'BUSINESS_RULE', 'ASSUMPTION', 'TODO'];

const META_FIELDS = [
  ['title', 'Title'],
  ['id', 'ID'],
  ['type', 'Type'],
  ['status', 'Status'],
  ['owner', 'Owner'],
  ['priority', 'Priority'],
  ['epic', 'Epic'],
  ['story', 'Story'],
  ['sprint', 'Sprint'],
  ['created_at', 'Created'],
  ['updated_at', 'Last updated'],
];

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const ICON_PATHS = {
  chevron: '<path d="M9 6l6 6-6 6"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4.17a2 2 0 0 1 1.41.59L12 7h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  epic: '<path d="M12 2 3 7l9 5 9-5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
  story: '<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  task: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 5-6"/>',
  sprint: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  decision: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  change: '<circle cx="7" cy="6" r="2.5"/><circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="6" r="2.5"/><path d="M7 8.5V18M17 8.5a4.5 4.5 0 0 1-4.5 4.5H9.5"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M4 19.5V4.5"/>',
  sidebar: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>',
};

function icon(name, size) {
  const s = size || 16;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

function fileIcon(type) {
  return TYPE_ICONS[type] || 'file';
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str).replace(/["\\]/g, '\\$&');
}

function enc(value) {
  return encodeURIComponent(value);
}

function humanize(value) {
  if (!value) return '';
  if (value === 'prd') return 'PRD';
  return String(value)
    .split(/[-_]/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function normalizeSectionText(content) {
  return content.trim();
}

async function api(path, options) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options && options.headers) },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Status bar / banner
// ---------------------------------------------------------------------------

function setStatus(message, type) {
  const bar = document.getElementById('status-bar');
  document.getElementById('status-bar-msg').textContent = message;
  bar.classList.remove('status-error', 'status-success');
  if (type === 'error') bar.classList.add('status-error');
  if (type === 'success') bar.classList.add('status-success');
}

function showBanner(title, message) {
  const banner = document.getElementById('doc-banner');
  banner.innerHTML = `<h4>${escapeHtml(title)}</h4><p>${escapeHtml(message)}</p>`;
  banner.classList.remove('hidden');
}

function hideBanner() {
  document.getElementById('doc-banner').classList.add('hidden');
}

function updateUnsavedIndicator() {
  document.getElementById('unsaved-indicator').classList.toggle('hidden', state.dirtySections.size === 0);
}

// ---------------------------------------------------------------------------
// Health pill
// ---------------------------------------------------------------------------

function renderHealthPill(validation) {
  const pill = document.getElementById('health-pill');
  if (validation.critical > 0) {
    pill.className = 'pill pill-critical';
    pill.textContent = `${validation.critical} critical issue${validation.critical === 1 ? '' : 's'}`;
  } else if (validation.warning > 0) {
    pill.className = 'pill pill-warning';
    pill.textContent = `${validation.warning} warning${validation.warning === 1 ? '' : 's'}`;
  } else {
    pill.className = 'pill pill-ok';
    pill.textContent = 'All checks passing';
  }
  pill.title = `Workspace validation: ${validation.critical} critical, ${validation.warning} warnings, ${validation.info} info`;
}

async function refreshStatus() {
  try {
    const status = await api('/status');
    state.modifiedPaths = new Set([...status.git.staged, ...status.git.unstaged, ...status.git.untracked]);
    renderHealthPill(status.validation);
    return status;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tree
// ---------------------------------------------------------------------------

function buildTreeData(items) {
  const root = { children: new Map(), files: [] };
  for (const item of items) {
    const parts = item.path.split('/');
    parts.pop();
    let node = root;
    let prefix = '';
    for (const part of parts) {
      prefix = prefix ? `${prefix}/${part}` : part;
      if (!node.children.has(part)) {
        node.children.set(part, { name: part, fullPath: prefix, children: new Map(), files: [] });
      }
      node = node.children.get(part);
    }
    node.files.push(item);
  }
  return root;
}

function renderTree() {
  const container = document.getElementById('tree');
  container.innerHTML = '';

  const filter = state.treeFilter.trim().toLowerCase();
  let items = state.tree;
  if (filter) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(filter) ||
        item.id.toLowerCase().includes(filter) ||
        item.path.toLowerCase().includes(filter) ||
        item.status.toLowerCase().includes(filter),
    );
  }

  if (items.length === 0) {
    container.innerHTML = '<p class="tree-empty">No files match your filter.</p>';
    return;
  }

  const tree = buildTreeData(items);
  const sortedDirs = [...tree.children.keys()].sort((a, b) => {
    const ai = TOP_DIR_ORDER.indexOf(a);
    const bi = TOP_DIR_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  for (const dirName of sortedDirs) {
    container.appendChild(renderFolderNode(tree.children.get(dirName), !!filter));
  }
}

function renderFolderNode(node, forceExpand) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tree-group';

  const collapsed = !forceExpand && state.collapsedFolders.has(node.fullPath);

  const row = document.createElement('button');
  row.className = `tree-row${collapsed ? ' collapsed' : ''}`;
  row.type = 'button';
  row.innerHTML = `
    <span class="chevron">${icon('chevron', 14)}</span>
    <span class="row-icon">${icon('folder', 16)}</span>
    <span class="row-label">${escapeHtml(TOP_DIR_LABELS[node.fullPath] || node.name)}</span>
  `;
  wrapper.appendChild(row);

  const childrenContainer = document.createElement('div');
  childrenContainer.className = `tree-children${collapsed ? ' collapsed' : ''}`;

  const sortedSubdirs = [...node.children.keys()].sort((a, b) => a.localeCompare(b));
  for (const subdir of sortedSubdirs) {
    childrenContainer.appendChild(renderFolderNode(node.children.get(subdir), forceExpand));
  }

  const sortedFiles = [...node.files].sort((a, b) => a.path.localeCompare(b.path));
  for (const file of sortedFiles) {
    childrenContainer.appendChild(renderFileRow(file));
  }

  wrapper.appendChild(childrenContainer);

  row.addEventListener('click', () => {
    if (forceExpand) return;
    if (state.collapsedFolders.has(node.fullPath)) {
      state.collapsedFolders.delete(node.fullPath);
    } else {
      state.collapsedFolders.add(node.fullPath);
    }
    row.classList.toggle('collapsed');
    childrenContainer.classList.toggle('collapsed');
  });

  return wrapper;
}

function renderFileRow(item) {
  const row = document.createElement('button');
  row.className = `tree-row${item.path === state.currentPath ? ' active' : ''}`;
  row.type = 'button';
  row.dataset.path = item.path;
  const modified = state.modifiedPaths.has(item.path);
  const showId = item.id && item.type !== 'onboarding';
  row.innerHTML = `
    <span class="row-icon">${icon(fileIcon(item.type), 16)}</span>
    ${showId ? `<span class="row-id">${escapeHtml(item.id)}</span>` : ''}
    <span class="row-label">${escapeHtml(item.title || item.path)}</span>
    ${modified ? '<span class="modified-dot" title="Unsaved Git changes"></span>' : ''}
  `;
  row.addEventListener('click', () => openDoc(item.path));
  return row;
}

// ---------------------------------------------------------------------------
// Document header
// ---------------------------------------------------------------------------

function renderDocHeader(doc) {
  document.getElementById('doc-title').textContent = doc.frontmatter.title || doc.path;
  document.getElementById('doc-id-badge').textContent = doc.frontmatter.id || '';
  document.getElementById('doc-type-badge').textContent = humanize(String(doc.frontmatter.type || ''));

  const select = document.getElementById('status-select');
  const badge = document.getElementById('status-badge');
  const statusValues = state.meta.statusValues[doc.frontmatter.type];

  if (statusValues && statusValues.length) {
    select.innerHTML = statusValues
      .map((v) => `<option value="${escapeHtml(v)}"${v === doc.frontmatter.status ? ' selected' : ''}>${escapeHtml(humanize(v))}</option>`)
      .join('');
    select.classList.remove('hidden');
    badge.classList.add('hidden');
  } else {
    select.classList.add('hidden');
    if (doc.frontmatter.status) {
      badge.textContent = humanize(String(doc.frontmatter.status));
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  document.getElementById('status-bar-path').textContent = doc.path;
}

async function updateStatus(newStatus) {
  const select = document.getElementById('status-select');
  const previous = state.currentDoc.frontmatter.status;
  setStatus('Updating status…', 'info');
  try {
    const updated = await api(`/doc?path=${enc(state.currentPath)}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    onSaveSuccess(updated, null);
    setStatus(`Status updated to "${humanize(newStatus)}".`, 'success');
  } catch (err) {
    select.value = previous;
    showBanner('Status update failed', err.message);
    setStatus('Status update failed.', 'error');
  }
}

// ---------------------------------------------------------------------------
// Outline
// ---------------------------------------------------------------------------

function renderOutline(sections) {
  const outline = document.getElementById('doc-outline');
  outline.innerHTML = '';
  sections.forEach((section, index) => {
    const chip = document.createElement('button');
    chip.className = 'outline-chip';
    chip.type = 'button';

    const dot = document.createElement('span');
    dot.className = 'chip-dot';
    if (section.markers && section.markers.length) {
      dot.classList.add(`marker-${section.markers[0]}`);
    }
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(section.heading));

    chip.addEventListener('click', () => scrollToSection(index));
    outline.appendChild(chip);
  });
}

function scrollToSection(index) {
  if (state.mode !== 'preview') {
    const block = document.querySelector(`#sections .section-block[data-index="${index}"]`);
    if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (state.mode !== 'edit') {
    const target = document.getElementById(`preview-section-${index}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ---------------------------------------------------------------------------
// Sections (edit pane)
// ---------------------------------------------------------------------------

function renderSections(doc) {
  const container = document.getElementById('sections');
  container.innerHTML = '';
  state.dirtySections.clear();
  doc.sections.forEach((section, index) => {
    container.appendChild(buildSectionBlock(section, index));
  });
  updateUnsavedIndicator();
}

function buildSectionBlock(section, index) {
  const block = document.createElement('div');
  block.className = 'section-block';
  block.dataset.heading = section.heading;
  block.dataset.index = String(index);

  const header = document.createElement('div');
  header.className = 'section-block-header';

  const h3 = document.createElement('h3');
  for (const markerName of section.markers || []) {
    const dot = document.createElement('span');
    dot.className = `section-marker-dot marker-${markerName}`;
    dot.title = humanize(markerName);
    h3.appendChild(dot);
  }
  h3.appendChild(document.createTextNode(section.heading));
  header.appendChild(h3);

  const actions = document.createElement('div');
  actions.className = 'section-actions';

  const dirtyLabel = document.createElement('span');
  dirtyLabel.className = 'section-dirty-label hidden';
  dirtyLabel.textContent = 'Unsaved';
  actions.appendChild(dirtyLabel);

  const diffBtn = document.createElement('button');
  diffBtn.className = 'btn hidden';
  diffBtn.type = 'button';
  diffBtn.textContent = 'Preview changes';
  actions.appendChild(diffBtn);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.type = 'button';
  saveBtn.textContent = 'Save';
  saveBtn.disabled = true;
  actions.appendChild(saveBtn);

  header.appendChild(actions);
  block.appendChild(header);

  const textarea = document.createElement('textarea');
  const normalized = normalizeSectionText(section.content);
  textarea.value = normalized;
  textarea.dataset.original = normalized;
  textarea.setAttribute('aria-label', `${section.heading} content`);
  block.appendChild(textarea);

  const diffPane = document.createElement('div');
  diffPane.className = 'section-diff hidden';
  block.appendChild(diffPane);

  textarea.addEventListener('input', () => {
    const dirty = textarea.value !== textarea.dataset.original;
    block.classList.toggle('dirty', dirty);
    dirtyLabel.classList.toggle('hidden', !dirty);
    diffBtn.classList.toggle('hidden', !dirty);
    saveBtn.disabled = !dirty;
    if (!dirty) {
      diffPane.classList.add('hidden');
      diffBtn.textContent = 'Preview changes';
      state.dirtySections.delete(section.heading);
    } else {
      state.dirtySections.add(section.heading);
    }
    updateUnsavedIndicator();
  });

  diffBtn.addEventListener('click', () => {
    const showing = !diffPane.classList.contains('hidden');
    if (showing) {
      diffPane.classList.add('hidden');
      diffBtn.textContent = 'Preview changes';
      return;
    }
    renderInlineDiff(diffPane, textarea.dataset.original, textarea.value);
    diffPane.classList.remove('hidden');
    diffBtn.textContent = 'Hide changes';
  });

  saveBtn.addEventListener('click', () => saveSection(section.heading, textarea, saveBtn));

  return block;
}

function updateSectionBlock(heading, section) {
  const block = document.querySelector(`#sections .section-block[data-heading="${escapeAttr(heading)}"]`);
  if (!block) return;

  const textarea = block.querySelector('textarea');
  const normalized = normalizeSectionText(section.content);
  textarea.value = normalized;
  textarea.dataset.original = normalized;

  block.classList.remove('dirty');
  block.querySelector('.section-dirty-label').classList.add('hidden');

  const diffBtn = block.querySelector('.section-actions .btn');
  diffBtn.classList.add('hidden');
  diffBtn.textContent = 'Preview changes';
  block.querySelector('.section-diff').classList.add('hidden');
  block.querySelector('.btn-primary').disabled = true;

  const h3 = block.querySelector('h3');
  h3.querySelectorAll('.section-marker-dot').forEach((d) => d.remove());
  for (const markerName of section.markers || []) {
    const dot = document.createElement('span');
    dot.className = `section-marker-dot marker-${markerName}`;
    dot.title = humanize(markerName);
    h3.insertBefore(dot, h3.firstChild);
  }
}

async function saveSection(heading, textarea, saveBtn) {
  saveBtn.disabled = true;
  setStatus(`Saving "${heading}"…`, 'info');
  try {
    const updated = await api(`/doc?path=${enc(state.currentPath)}`, {
      method: 'PUT',
      body: JSON.stringify({ section: heading, text: textarea.value }),
    });
    onSaveSuccess(updated, heading);
    setStatus(`Saved "${heading}".`, 'success');
  } catch (err) {
    saveBtn.disabled = false;
    if (err.status === 400) {
      showBanner(
        "This edit can't be saved as-is",
        `${err.message} Tip: MPOS keeps each document's section headings consistent so the CLI, Git history, and other documents stay in sync. Avoid adding, removing, or renaming "##" headings from the editor.`,
      );
    } else {
      showBanner('Save failed', err.message);
    }
    setStatus('Save failed — your edits are still here.', 'error');
  }
}

function onSaveSuccess(updatedDoc, changedHeading) {
  state.currentDoc = updatedDoc;
  hideBanner();

  if (changedHeading) {
    state.dirtySections.delete(changedHeading);
    const updatedSection = updatedDoc.sections.find((s) => s.heading === changedHeading);
    if (updatedSection) updateSectionBlock(changedHeading, updatedSection);
  }

  updateUnsavedIndicator();
  renderDocHeader(updatedDoc);
  renderOutline(updatedDoc.sections);
  renderPreview(updatedDoc);

  state.panelCache = { validation: null, diff: null };
  renderPanel();
  fetchValidationBadge();
  refreshStatus().then(renderTree);
}

// ---------------------------------------------------------------------------
// Diff helpers
// ---------------------------------------------------------------------------

function diffLines(oldText, newText) {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const result = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ type: 'same', line: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'del', line: a[i] });
      i++;
    } else {
      result.push({ type: 'add', line: b[j] });
      j++;
    }
  }
  while (i < n) result.push({ type: 'del', line: a[i++] });
  while (j < m) result.push({ type: 'add', line: b[j++] });

  return result;
}

function renderInlineDiff(container, oldText, newText) {
  const diff = diffLines(oldText, newText);
  const pre = document.createElement('pre');
  pre.className = 'diff';
  pre.innerHTML = diff
    .map((d) => {
      const text = escapeHtml(d.line);
      if (d.type === 'add') return `<span class="diff-add">+ ${text}</span>`;
      if (d.type === 'del') return `<span class="diff-del">- ${text}</span>`;
      return `<span>  ${text}</span>`;
    })
    .join('\n');
  container.innerHTML = '';
  container.appendChild(pre);
}

function formatGitDiff(diff) {
  return diff
    .split('\n')
    .map((line) => {
      const escaped = escapeHtml(line);
      if (line.startsWith('+') && !line.startsWith('+++')) return `<span class="diff-add">${escaped}</span>`;
      if (line.startsWith('-') && !line.startsWith('---')) return `<span class="diff-del">${escaped}</span>`;
      if (line.startsWith('@@')) return `<span class="diff-hunk">${escaped}</span>`;
      return escaped;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Preview pane
// ---------------------------------------------------------------------------

function renderPreview(doc) {
  const pane = document.getElementById('preview-html');
  pane.innerHTML = '';

  if (state.dirtySections.size > 0) {
    const note = document.createElement('div');
    note.className = 'preview-note';
    note.textContent = "This preview reflects the document's last saved version. Save a section to update its preview.";
    pane.appendChild(note);
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = doc.html;
  pane.appendChild(wrapper);

  const h2s = wrapper.querySelectorAll('h2');
  doc.sections.forEach((_section, idx) => {
    if (h2s[idx]) h2s[idx].id = `preview-section-${idx}`;
  });
}

// ---------------------------------------------------------------------------
// Right panel
// ---------------------------------------------------------------------------

function renderPanel() {
  const content = document.getElementById('panel-content');
  if (!state.currentDoc) {
    content.innerHTML =
      '<p class="panel-empty">Open a document to see its metadata, related documents, markers, validation results, and change history here.</p>';
    return;
  }
  switch (state.activeTab) {
    case 'metadata':
      return renderMetadataTab(content);
    case 'related':
      return renderRelatedTab(content);
    case 'markers':
      return renderMarkersTab(content);
    case 'validation':
      return renderValidationTab(content);
    case 'changes':
      return renderChangesTab(content);
    default:
      return undefined;
  }
}

function humanizeMetaValue(key, value) {
  if (key === 'status' || key === 'type' || key === 'priority') return humanize(String(value));
  return String(value);
}

function renderMetadataTab(content) {
  const fm = state.currentDoc.frontmatter;
  let rows = '';
  for (const [key, label] of META_FIELDS) {
    const value = fm[key];
    if (value === undefined || value === null || value === '') continue;
    rows += `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(humanizeMetaValue(key, value))}</td></tr>`;
  }
  if (Array.isArray(fm.tags) && fm.tags.length) {
    rows += `<tr><th>Tags</th><td>${fm.tags.map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}</td></tr>`;
  }
  content.innerHTML = `
    <p class="panel-section-title">Frontmatter</p>
    <table class="meta-table">${rows}</table>
    <p class="panel-empty" style="margin-top: 14px;">Frontmatter is the metadata block at the top of the file. Change the status using the dropdown above the editor; other fields are managed by MPOS commands and templates.</p>
  `;
}

function resolveRelatedPath(fromPath, relPath) {
  const stack = fromPath.split('/').slice(0, -1);
  for (const part of relPath.split('/')) {
    if (part === '..') stack.pop();
    else if (part === '.' || part === '') continue;
    else stack.push(part);
  }
  return stack.join('/');
}

function renderRelatedTab(content) {
  const related = state.currentDoc.frontmatter.related;
  if (!Array.isArray(related) || related.length === 0) {
    content.innerHTML = '<p class="panel-empty">No related documents are listed in this file\'s frontmatter.</p>';
    return;
  }

  content.innerHTML = '<p class="panel-section-title">Related documents</p><ul class="related-list"></ul>';
  const list = content.querySelector('.related-list');

  for (const rel of related) {
    const resolved = resolveRelatedPath(state.currentPath, rel);
    const treeItem = state.tree.find((t) => t.path === resolved);

    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'related-item';
    btn.innerHTML = `
      <div class="related-title">${escapeHtml(treeItem ? treeItem.title : rel)}</div>
      <div class="related-path">${escapeHtml(resolved)}</div>
    `;
    btn.addEventListener('click', () => openDoc(resolved));
    li.appendChild(btn);
    list.appendChild(li);
  }
}

function renderMarkersTab(content) {
  const markers = state.currentDoc.markers || {};
  const present = MARKER_ORDER.filter((name) => (markers[name] || []).length > 0);

  if (present.length === 0) {
    content.innerHTML = `
      <p class="panel-empty">No markers found in this document. Markers such as <span class="marker marker-OPEN_QUESTION">OPEN QUESTION</span> or <span class="marker marker-BUSINESS_RULE">BUSINESS RULE</span> highlight important notes inline within a section.</p>
    `;
    return;
  }

  content.innerHTML = '';
  for (const name of present) {
    const entries = markers[name];

    const group = document.createElement('div');
    group.className = 'marker-group';

    const title = document.createElement('div');
    title.className = 'marker-group-title';
    title.innerHTML = `<span class="marker marker-${name}">${escapeHtml(humanize(name))}</span><span class="marker-group-count">${entries.length}</span>`;
    group.appendChild(title);

    for (const entry of entries) {
      const item = document.createElement('div');
      item.className = 'marker-entry';
      item.innerHTML = `${entry.localId ? `<span class="marker-local-id">${escapeHtml(entry.localId)}</span> ` : ''}${escapeHtml(entry.text)}`;
      group.appendChild(item);
    }

    content.appendChild(group);
  }
}

async function renderValidationTab(content) {
  content.innerHTML = '<p class="panel-empty">Loading validation results…</p>';

  if (!state.panelCache.validation) {
    try {
      state.panelCache.validation = await api(`/validate?path=${enc(state.currentPath)}`);
    } catch (err) {
      content.innerHTML = `<p class="panel-empty">Could not load validation results: ${escapeHtml(err.message)}</p>`;
      return;
    }
  }

  const findings = (state.panelCache.validation.results[0] && state.panelCache.validation.results[0].findings) || [];
  if (findings.length === 0) {
    content.innerHTML = '<p class="panel-empty">No validation issues found for this document.</p>';
    return;
  }

  const order = { critical: 0, warning: 1, info: 2 };
  const sorted = [...findings].sort((a, b) => order[a.severity] - order[b.severity]);

  content.innerHTML = '<p class="panel-section-title">Validation results</p><ul class="validation-list"></ul>';
  const list = content.querySelector('.validation-list');
  for (const f of sorted) {
    const li = document.createElement('li');
    li.className = `validation-item sev-${f.severity}`;
    li.innerHTML = `<span class="sev-label">${escapeHtml(f.severity)}</span>${escapeHtml(f.message)}`;
    list.appendChild(li);
  }
}

async function renderChangesTab(content) {
  content.innerHTML = '<p class="panel-empty">Loading changes…</p>';

  if (state.panelCache.diff === null) {
    try {
      const res = await api(`/diff?path=${enc(state.currentPath)}`);
      state.panelCache.diff = res.diff || '';
    } catch (err) {
      content.innerHTML = `<p class="panel-empty">Could not load changes: ${escapeHtml(err.message)}</p>`;
      return;
    }
  }

  if (!state.panelCache.diff) {
    content.innerHTML = '<p class="panel-empty">No uncommitted changes to this file.</p>';
    return;
  }

  content.innerHTML = `
    <p class="panel-section-title">Uncommitted changes</p>
    <p class="panel-empty" style="margin-bottom: 10px;">This compares the file on disk with the last Git commit.</p>
    <pre class="diff">${formatGitDiff(state.panelCache.diff)}</pre>
  `;
}

async function fetchValidationBadge() {
  try {
    const result = await api(`/validate?path=${enc(state.currentPath)}`);
    state.panelCache.validation = result;
    const findings = (result.results[0] && result.results[0].findings) || [];

    const tab = document.querySelector('.panel-tab[data-tab="validation"]');
    tab.querySelectorAll('.tab-count').forEach((el) => el.remove());
    if (findings.length) {
      const critical = findings.filter((f) => f.severity === 'critical').length;
      const badge = document.createElement('span');
      badge.className = `tab-count ${critical ? 'count-critical' : 'count-warning'}`;
      badge.textContent = String(findings.length);
      tab.appendChild(badge);
    }

    if (state.activeTab === 'validation') renderPanel();
  } catch {
    // Validation badge is best-effort; tab still works on demand.
  }
}

// ---------------------------------------------------------------------------
// Document loading
// ---------------------------------------------------------------------------

async function openDoc(relPath) {
  if (state.dirtySections.size > 0) {
    const ok = confirm('You have unsaved edits in this document. Discard them and open another document?');
    if (!ok) return;
  }

  setStatus('Loading…', 'info');
  hideBanner();

  try {
    const doc = await api(`/doc?path=${enc(relPath)}`);
    state.currentPath = relPath;
    state.currentDoc = doc;
    state.dirtySections.clear();
    state.panelCache = { validation: null, diff: null };

    document.getElementById('doc-empty').classList.add('hidden');
    document.getElementById('doc-view').classList.remove('hidden');

    renderDocHeader(doc);
    renderOutline(doc.sections);
    renderSections(doc);
    renderPreview(doc);
    renderPanel();
    renderTree();
    setStatus('Ready.', 'info');

    fetchValidationBadge();
  } catch (err) {
    showBanner('Could not open this document', err.message);
    setStatus('Failed to load document.', 'error');
  }
}

// ---------------------------------------------------------------------------
// Mode buttons, panel tabs
// ---------------------------------------------------------------------------

function setupModeButtons() {
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      state.mode = btn.dataset.mode;
      document.getElementById('doc-content').className = `mode-${state.mode}`;
      if (state.currentDoc) renderPreview(state.currentDoc);
    });
  });
}

function setupPanelTabs() {
  document.querySelectorAll('.panel-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.activeTab = tab.dataset.tab;
      renderPanel();
    });
  });
}

// ---------------------------------------------------------------------------
// Header search
// ---------------------------------------------------------------------------

function setupHeaderSearch() {
  const box = document.getElementById('search-box');
  const results = document.getElementById('search-results');
  let timer = null;

  box.addEventListener('input', () => {
    clearTimeout(timer);
    const q = box.value.trim();
    if (!q) {
      results.innerHTML = '';
      return;
    }
    timer = setTimeout(async () => {
      try {
        const matches = await api(`/search?q=${enc(q)}`);
        renderSearchResults(matches);
      } catch {
        results.innerHTML = '<div class="search-result"><span class="sr-meta">Search failed.</span></div>';
      }
    }, 200);
  });

  document.addEventListener('click', (e) => {
    if (!results.contains(e.target) && e.target !== box) results.innerHTML = '';
  });
}

function renderSearchResults(matches) {
  const results = document.getElementById('search-results');
  results.innerHTML = '';

  if (matches.length === 0) {
    results.innerHTML = '<div class="search-result"><span class="sr-meta">No matches found.</span></div>';
    return;
  }

  for (const match of matches) {
    const btn = document.createElement('button');
    btn.className = 'search-result';
    btn.innerHTML = `
      <div class="sr-title">${escapeHtml(match.title)}</div>
      <div class="sr-meta">${escapeHtml(match.id)} &middot; ${escapeHtml(humanize(match.type))} &middot; ${escapeHtml(match.path)}</div>
      <div class="sr-snippet">${escapeHtml(match.snippet)}</div>
    `;
    btn.addEventListener('click', () => {
      results.innerHTML = '';
      document.getElementById('search-box').value = '';
      openDoc(match.path);
    });
    results.appendChild(btn);
  }
}

// ---------------------------------------------------------------------------
// Tree filter, tutorials link
// ---------------------------------------------------------------------------

function setupTreeFilter() {
  const input = document.getElementById('tree-filter-input');
  input.addEventListener('input', () => {
    state.treeFilter = input.value;
    renderTree();
  });
}

function findTutorialStart() {
  return (
    state.tree.find((t) => t.type === 'onboarding' && /01-getting-started/.test(t.path)) ||
    state.tree.find((t) => t.type === 'onboarding')
  );
}

function setupTutorialLinks() {
  const handler = (e) => {
    e.preventDefault();
    const tut = findTutorialStart();
    if (tut) openDoc(tut.path);
  };
  document.getElementById('tutorials-link').addEventListener('click', handler);
  document.getElementById('open-getting-started').addEventListener('click', handler);
}

// ---------------------------------------------------------------------------
// Sidebar/panel collapse + resize
// ---------------------------------------------------------------------------

function setupCollapseToggles() {
  const appBody = document.getElementById('app-body');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const panelToggle = document.getElementById('panel-toggle');

  sidebarToggle.addEventListener('click', () => {
    const collapsed = appBody.classList.toggle('sidebar-collapsed');
    sidebarToggle.classList.toggle('active', !collapsed);
    sidebarToggle.setAttribute('aria-pressed', String(!collapsed));
  });

  panelToggle.addEventListener('click', () => {
    const collapsed = appBody.classList.toggle('panel-collapsed');
    panelToggle.classList.toggle('active', !collapsed);
    panelToggle.setAttribute('aria-pressed', String(!collapsed));
  });

  if (window.innerWidth <= 820) {
    appBody.classList.add('sidebar-collapsed', 'panel-collapsed');
    sidebarToggle.classList.remove('active');
    sidebarToggle.setAttribute('aria-pressed', 'false');
    panelToggle.classList.remove('active');
    panelToggle.setAttribute('aria-pressed', 'false');
  }
}

function setupResizer(handle, onDelta) {
  let startX = 0;

  function onMouseMove(e) {
    const dx = e.clientX - startX;
    startX = e.clientX;
    onDelta(dx);
  }
  function onMouseUp() {
    handle.classList.remove('active');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  handle.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    handle.classList.add('active');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
  });
}

function setupResizers() {
  setupResizer(document.getElementById('sidebar-resizer'), (dx) => {
    const current = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w'), 10);
    const next = Math.min(480, Math.max(200, current + dx));
    document.documentElement.style.setProperty('--sidebar-w', `${next}px`);
  });

  setupResizer(document.getElementById('panel-resizer'), (dx) => {
    const current = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--panel-w'), 10);
    const next = Math.min(560, Math.max(260, current - dx));
    document.documentElement.style.setProperty('--panel-w', `${next}px`);
  });
}

// ---------------------------------------------------------------------------
// Unsaved-changes guard
// ---------------------------------------------------------------------------

function setupBeforeUnload() {
  window.addEventListener('beforeunload', (e) => {
    if (state.dirtySections.size > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function applyStaticIcons() {
  document.getElementById('sidebar-toggle').innerHTML = icon('sidebar', 18);
  document.getElementById('panel-toggle').innerHTML = icon('panel', 18);
}

async function init() {
  applyStaticIcons();

  state.meta = await api('/meta');
  document.getElementById('project-name').textContent = state.meta.project.name;
  state.tree = await api('/tree');

  setupHeaderSearch();
  setupTreeFilter();
  setupModeButtons();
  setupPanelTabs();
  setupResizers();
  setupCollapseToggles();
  setupTutorialLinks();
  setupBeforeUnload();
  document.getElementById('status-select').addEventListener('change', (e) => updateStatus(e.target.value));

  await refreshStatus();
  renderTree();
  renderPanel();
}

init();
