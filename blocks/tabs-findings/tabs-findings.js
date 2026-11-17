import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';

let instanceCount = 0;

function isPictureOnly(el) {
  if (el.tagName === 'PICTURE') return true;
  const pic = el.querySelector('picture');
  if (!pic) return false;
  const clone = el.cloneNode(true);
  clone.querySelectorAll('picture').forEach((p) => p.remove());
  return !clone.textContent.trim();
}

function isHeading(el, levels) {
  return levels.includes(el.tagName);
}

/**
 * Builds the collapsible "Reporting and analysis" part from a heading and
 * the elements that follow it, grouping content under each H4.
 */
function buildCollapsible(titleEl, items, idBase) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tabs-findings-collapsible';

  const heading = titleEl || document.createElement('h3');
  if (!titleEl) heading.textContent = 'More';
  heading.classList.add('tabs-findings-collapsible-heading');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tabs-findings-collapsible-toggle';
  button.id = `${idBase}-toggle`;
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', `${idBase}-content`);
  const label = document.createElement('span');
  label.className = 'tabs-findings-collapsible-label';
  label.append(...heading.childNodes);
  const icon = document.createElement('span');
  icon.className = 'tabs-findings-collapsible-icon';
  icon.setAttribute('aria-hidden', 'true');
  button.append(label, icon);
  heading.replaceChildren(button);

  const content = document.createElement('div');
  content.className = 'tabs-findings-collapsible-content';
  content.id = `${idBase}-content`;
  content.setAttribute('role', 'region');
  content.setAttribute('aria-labelledby', button.id);
  content.hidden = true;

  let group = null;
  items.forEach((el) => {
    if (isHeading(el, ['H4']) || !group) {
      group = document.createElement('div');
      group.className = 'tabs-findings-group';
      content.append(group);
    }
    group.append(el);
  });

  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    content.hidden = expanded;
  });

  wrapper.append(heading, content);
  return wrapper;
}

/**
 * Splits one panel's authored content into:
 * intro heading(s), a two-column findings row, and a collapsible link section.
 */
function buildPanel(cell, idBase) {
  const elements = [...cell.children];
  const frag = document.createDocumentFragment();
  if (!elements.length) return frag;

  // collapsible starts at the first H4, or at the H2/H3 directly before it (its title)
  const firstH4 = elements.findIndex((el) => isHeading(el, ['H4']));
  let collapseStart = firstH4;
  if (firstH4 > 0 && isHeading(elements[firstH4 - 1], ['H2', 'H3'])) {
    collapseStart = firstH4 - 1;
  }

  const main = collapseStart >= 0 ? elements.slice(0, collapseStart) : elements;
  const rest = collapseStart >= 0 ? elements.slice(collapseStart) : [];

  // leading H2s (e.g. "Key findings") sit above the two-column row
  const intro = [];
  while (main.length && isHeading(main[0], ['H2'])) intro.push(main.shift());
  if (intro.length) {
    const introEl = document.createElement('div');
    introEl.className = 'tabs-findings-intro';
    introEl.append(...intro);
    frag.append(introEl);
  }

  if (main.length) {
    const row = document.createElement('div');
    row.className = 'tabs-findings-row';
    const text = document.createElement('div');
    text.className = 'tabs-findings-text';
    const media = document.createElement('div');
    media.className = 'tabs-findings-media';
    main.forEach((el) => (isPictureOnly(el) ? media : text).append(el));
    // a paragraph holding only a link is the panel's call to action
    text.querySelectorAll(':scope > p').forEach((p) => {
      const a = p.querySelector('a[href]');
      if (!a || a.querySelector('img') || p.textContent.trim() !== a.textContent.trim()) return;
      p.classList.add('button-wrapper');
      a.classList.add('button', 'primary');
    });
    if (text.children.length) row.append(text);
    if (media.children.length) row.append(media);
    else row.classList.add('tabs-findings-row-single');
    frag.append(row);
  }

  if (rest.length) {
    const titleEl = isHeading(rest[0], ['H2', 'H3']) ? rest.shift() : null;
    frag.append(buildCollapsible(titleEl, rest, idBase));
  }

  return frag;
}

function activate(block, tablist, button) {
  tablist.querySelectorAll('[role=tab]').forEach((tab) => {
    const selected = tab === button;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  block.querySelectorAll(':scope > [role=tabpanel]').forEach((panel) => {
    const show = panel.id === button.getAttribute('aria-controls');
    panel.setAttribute('aria-hidden', String(!show));
    panel.hidden = !show;
  });
}

/**
 * Tabs with a findings layout: one row per tab, [label | panel content].
 * @param {Element} block The block element
 */
export default function decorate(block) {
  instanceCount += 1;
  const prefix = `tabs-findings-${instanceCount}`;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-findings-list';
  tablist.setAttribute('role', 'tablist');

  const rows = [...block.children];
  const usedIds = new Set();
  rows.forEach((row, i) => {
    const cells = [...row.children];
    const labelCell = cells[0];
    const labelText = (labelCell?.textContent || '').trim() || `Tab ${i + 1}`;
    let id = `${prefix}-${toClassName(labelText) || i + 1}`;
    if (usedIds.has(id)) id = `${id}-${i + 1}`;
    usedIds.add(id);

    // panel content: every cell after the label (authors may split content)
    const contentCell = document.createElement('div');
    cells.slice(1).forEach((cell) => contentCell.append(...cell.childNodes));
    // wrap stray text nodes so they can be laid out
    [...contentCell.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      if (!node.textContent.trim()) { node.remove(); return; }
      const p = document.createElement('p');
      p.textContent = node.textContent.trim();
      node.replaceWith(p);
    });

    const panel = document.createElement('div');
    panel.className = 'tabs-findings-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `${id}-tab`);
    panel.tabIndex = 0;
    panel.append(buildPanel(contentCell, `${id}-more`));

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-findings-tab';
    button.id = `${id}-tab`;
    button.textContent = labelText;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    button.addEventListener('click', () => activate(block, tablist, button));
    tablist.append(button);

    row.replaceWith(panel);
  });

  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.querySelectorAll('[role=tab]')];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    tabs[next].focus();
    activate(block, tablist, tabs[next]);
  });

  block.prepend(tablist);
  const first = tablist.querySelector('[role=tab]');
  if (first) activate(block, tablist, first);

  block.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}
