// media query match that indicates desktop width (source switches layouts at 1200px)
const isDesktop = window.matchMedia('(width >= 1200px)');

/* the order in which authored nav sections appear in nav.plain.html */
const SECTION_NAMES = ['utility', 'brand', 'sections', 'tools', 'contact', 'breadcrumb'];

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local preview) first, then /nav.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the nav sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // resolve relative media paths against the fragment location, not the page
  const base = resp.url || window.location.href;
  container.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), base).href;
  });
  container.querySelectorAll('source[srcset]').forEach((source) => {
    source.srcset = new URL(source.getAttribute('srcset'), base).href;
  });
  return container;
}

/**
 * Returns the label nodes of a list item (everything except its nested list),
 * unwrapping a single wrapping paragraph.
 * @param {Element} li list item
 * @returns {Node[]} label nodes
 */
function getLabelNodes(li) {
  const nodes = [...li.childNodes].filter((n) => n.nodeName !== 'UL'
    && !(n.nodeType === Node.TEXT_NODE && !n.textContent.trim()));
  if (nodes.length === 1 && nodes[0].nodeName === 'P') return [...nodes[0].childNodes];
  return nodes;
}

/**
 * Closes every open dropdown panel in the nav.
 * @param {Element} nav nav element
 * @param {Element} [except] button to leave untouched
 */
function closeAllPanels(nav, except) {
  nav.querySelectorAll('button[aria-expanded="true"][aria-controls^="nav-"]').forEach((button) => {
    if (button !== except) button.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Wires a toggle button to the panel it controls.
 * @param {Element} nav nav element
 * @param {HTMLButtonElement} button toggle button
 * @param {Function} [onOpen] callback after opening
 */
function bindToggle(nav, button, onOpen) {
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const expanded = button.getAttribute('aria-expanded') === 'true';
    closeAllPanels(nav, button);
    button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    if (!expanded && onOpen) onOpen();
  });
  // desktop: close the panel when keyboard focus moves to another control
  // (relatedTarget is null for plain clicks, which the outside-click handler covers)
  const item = button.parentElement;
  item.addEventListener('focusout', (e) => {
    if (isDesktop.matches && e.relatedTarget && !item.contains(e.relatedTarget)) {
      button.setAttribute('aria-expanded', 'false');
    }
  });
}

let panelCount = 0;

/**
 * Turns a list item with a nested list into a click-to-open dropdown.
 * @param {Element} nav nav element
 * @param {Element} li list item
 */
function buildDropdown(nav, li) {
  const subList = li.querySelector(':scope > ul');
  if (!subList) return;
  panelCount += 1;
  const panelId = `nav-panel-${panelCount}`;
  li.classList.add('nav-drop');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-drop-trigger';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', panelId);
  const labelNodes = getLabelNodes(li);
  button.append(...labelNodes);
  const icon = button.querySelector('img');
  if (icon && !button.textContent.trim()) {
    button.classList.add('nav-drop-trigger-icon');
    button.setAttribute('aria-label', icon.alt || 'menu');
    icon.alt = '';
  }
  [...li.childNodes].forEach((n) => { if (n !== subList) n.remove(); });
  // panel (border + bar) > column (padding) > list — mirrors source structure
  const panel = document.createElement('div');
  panel.id = panelId;
  panel.className = 'nav-dropdown';
  const column = document.createElement('div');
  column.className = 'nav-dropdown-column';
  subList.classList.add('nav-dropdown-list');
  column.append(subList);
  panel.append(column);
  li.append(button, panel);
  bindToggle(nav, button);
}

/**
 * Builds the search toggle and its search panel from the authored search link.
 * The link href is the results URL; `{query}` is replaced with the search term.
 * @param {Element} nav nav element
 * @param {HTMLAnchorElement} link authored search link
 * @returns {HTMLLIElement} search list item
 */
function buildSearch(nav, link) {
  const li = document.createElement('li');
  li.className = 'nav-search';
  const icon = link.querySelector('img');
  const label = (icon && icon.alt) || link.textContent.trim() || 'search';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-search-trigger';
  button.setAttribute('aria-label', label);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'nav-search-panel');
  if (icon) {
    icon.alt = '';
    button.append(icon);
  }

  const panel = document.createElement('div');
  panel.id = 'nav-search-panel';
  panel.className = 'nav-search-panel';
  const form = document.createElement('form');
  form.setAttribute('role', 'search');
  const field = document.createElement('div');
  field.className = 'nav-search-field';
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'nav-search-input';
  input.name = 'q';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Search');
  const inputLabel = document.createElement('label');
  inputLabel.htmlFor = input.id;
  inputLabel.textContent = 'Search';
  field.append(input, inputLabel);
  form.append(field);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-search-close';
  close.setAttribute('aria-label', 'Close search');
  close.textContent = '✕';
  panel.append(form, close);

  const template = decodeURI(link.href);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    const term = encodeURIComponent(query);
    window.location.href = template.includes('{query}')
      ? template.replace('{query}', term)
      : `${template}${template.includes('?') ? '&' : '?'}q=${term}`;
  });
  input.addEventListener('input', () => field.classList.toggle('has-value', !!input.value));
  close.addEventListener('click', () => {
    button.setAttribute('aria-expanded', 'false');
    button.focus();
  });
  panel.addEventListener('click', (e) => e.stopPropagation());

  li.append(button, panel);
  bindToggle(nav, button, () => setTimeout(() => input.focus(), 50));
  return li;
}

/**
 * Returns a share-network keyword for a link (used for styling only).
 * @param {HTMLAnchorElement} a link
 * @returns {string} keyword
 */
function shareNetwork(a) {
  if (a.protocol === 'mailto:') return 'email';
  const host = a.hostname.replace(/^www\./, '');
  return host.split('.')[0] || 'link';
}

/**
 * Decorates the contact/share row: phone line + share links.
 * @param {Element} section contact section
 */
function decorateContact(section) {
  const paragraphs = [...section.querySelectorAll(':scope > p')];
  const [text, phone, share] = paragraphs;
  if (text) text.className = 'nav-contact-text';
  if (phone) phone.className = 'nav-contact-phone';
  if (share) {
    share.className = 'nav-share-label';
    const divider = document.createElement('span');
    divider.className = 'nav-contact-divider';
    divider.setAttribute('aria-hidden', 'true');
    share.before(divider);
  }
  const list = section.querySelector(':scope > ul');
  if (list) {
    list.className = 'nav-share-links';
    const pageUrl = encodeURIComponent(window.location.href);
    list.querySelectorAll('a').forEach((a) => {
      a.classList.add(`nav-share-${shareNetwork(a)}`);
      const img = a.querySelector('img');
      if (img && img.alt) {
        a.setAttribute('aria-label', img.alt);
        img.alt = '';
      }
      if (a.href.endsWith('=')) a.href = `${a.href}${pageUrl}`;
      if (a.protocol !== 'mailto:') {
        a.target = '_blank';
        a.rel = 'noopener';
      }
    });
  }
}

/**
 * Turns a URL path segment into a sentence-case label.
 * @param {string} segment path segment
 * @returns {string} label
 */
function segmentLabel(segment) {
  const text = decodeURIComponent(segment).replace(/\.html$/, '').replace(/[-_]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Builds the breadcrumb trail from the authored home link and the page path.
 * Hidden on the home page (matches source).
 * @param {Element} section breadcrumb section
 * @returns {boolean} true if a trail was rendered
 */
function decorateBreadcrumb(section) {
  const home = section.querySelector('a');
  const segments = window.location.pathname.split('/').filter(Boolean);
  // local preview serves pages under /content/; that prefix is not part of the site path
  const prefix = segments[0] === 'content' ? '/content' : '';
  if (prefix) segments.shift();
  if (segments.length && /^index(\.html)?$/.test(segments[segments.length - 1])) segments.pop();
  if (!home || !segments.length) return false;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  const homeLi = document.createElement('li');
  homeLi.append(home);
  ol.append(homeLi);
  let path = prefix;
  segments.forEach((segment, i) => {
    path += `/${segment}`;
    const li = document.createElement('li');
    if (i < segments.length - 1) {
      const a = document.createElement('a');
      a.href = path;
      a.textContent = segmentLabel(segment);
      li.append(a);
    } else {
      const h1 = document.querySelector('main h1');
      const title = (h1 && h1.textContent.trim())
        || document.title.split('|')[0].trim()
        || segmentLabel(segment);
      const current = document.createElement('span');
      current.setAttribute('aria-current', 'page');
      current.textContent = title;
      li.className = 'active';
      li.append(current);
    }
    ol.append(li);
  });
  nav.append(ol);
  section.replaceChildren(nav);
  return true;
}

/**
 * Toggles the mobile menu.
 * @param {Element} nav nav element
 * @param {boolean|null} [force] force open (true) or closed (false)
 */
function toggleMenu(nav, force = null) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  const open = force !== null ? force : !expanded;
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  const button = nav.querySelector('.nav-hamburger button');
  if (button) button.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (!open) closeAllPanels(nav);
}

/**
 * Builds the header of the mobile menu panel (logo, CTA, close button)
 * from the already-decorated brand and CTA links.
 * @param {Element} nav nav element
 * @param {Element} [brand] brand section
 * @param {Element} [tools] tools section
 * @returns {HTMLDivElement} panel header
 */
function buildMenuHeader(nav, brand, tools) {
  const header = document.createElement('div');
  header.className = 'nav-menu-header';
  const logo = brand && brand.querySelector('a');
  if (logo) header.append(logo.cloneNode(true));
  const cta = tools && tools.querySelector('.nav-cta a');
  if (cta) {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'nav-menu-cta';
    ctaWrap.append(cta.cloneNode(true));
    header.append(ctaWrap);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-menu-close';
  close.setAttribute('aria-label', 'Close menu');
  close.textContent = '✕';
  close.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu(nav, false);
    nav.querySelector('.nav-hamburger button')?.focus();
  });
  header.append(close);
  return header;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'primary');
  const sections = {};
  [...fragment.children].forEach((section, i) => {
    const name = SECTION_NAMES[i];
    if (!name) return;
    section.classList.add(`nav-${name}`);
    sections[name] = section;
  });

  // utility (site selector) bar: <strong> marks the active link
  if (sections.utility) {
    sections.utility.querySelectorAll('li').forEach((li) => {
      const strong = li.querySelector('strong');
      if (strong && strong.querySelector('a')) {
        li.classList.add('active');
        strong.replaceWith(...strong.childNodes);
      }
    });
  }

  // main bar: brand + sections + tools
  const main = document.createElement('div');
  main.className = 'nav-main';
  if (sections.brand) main.append(sections.brand);

  const menu = document.createElement('div');
  menu.className = 'nav-menu';
  const list = sections.sections ? sections.sections.querySelector(':scope > ul') : null;
  if (list) {
    list.className = 'nav-list';
    [...list.children].forEach((li) => buildDropdown(nav, li));
    menu.append(sections.sections);
  }

  if (sections.tools) {
    const toolsList = document.createElement('ul');
    toolsList.className = 'nav-tools-list';
    sections.tools.querySelectorAll('a').forEach((a) => {
      if (a.querySelector('img') || /search/i.test(a.href)) {
        toolsList.append(buildSearch(nav, a));
      } else {
        const li = document.createElement('li');
        li.className = 'nav-cta';
        li.append(a);
        toolsList.append(li);
      }
    });
    sections.tools.replaceChildren(toolsList);
    main.append(sections.tools);
  }
  main.insertBefore(menu, sections.tools || null);
  menu.prepend(buildMenuHeader(nav, sections.brand, sections.tools));

  // menu trigger (mobile only)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false">
      <span class="nav-hamburger-icon" aria-hidden="true"></span>Menu
    </button>`;
  const focusables = () => [...menu.querySelectorAll('a[href], button')]
    .filter((el) => el.getClientRects().length > 0);
  hamburger.querySelector('button').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu(nav);
    // the open panel covers the header bar: move focus into it
    if (nav.getAttribute('aria-expanded') === 'true') focusables()[0]?.focus();
  });
  // keep keyboard focus inside the open mobile panel
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || isDesktop.matches || nav.getAttribute('aria-expanded') !== 'true') return;
    const items = focusables();
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  main.append(hamburger);

  if (sections.utility) nav.append(sections.utility);
  nav.append(main);
  if (sections.contact) {
    decorateContact(sections.contact);
    nav.append(sections.contact);
  }
  if (sections.breadcrumb) {
    if (decorateBreadcrumb(sections.breadcrumb)) {
      nav.append(sections.breadcrumb);
      block.closest('header')?.classList.add('has-breadcrumb');
    }
  }

  // close panels on outside click / escape
  document.addEventListener('click', (e) => {
    if (nav.contains(e.target)) return;
    closeAllPanels(nav);
    if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') toggleMenu(nav, false);
  });
  nav.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-drop, .nav-search, .nav-menu')) closeAllPanels(nav);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const open = nav.querySelector('button[aria-expanded="true"][aria-controls^="nav-"]');
    if (open) {
      open.setAttribute('aria-expanded', 'false');
      open.focus();
    } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      hamburger.querySelector('button').focus();
    }
  });

  // reset state when crossing the desktop breakpoint
  nav.setAttribute('aria-expanded', 'false');
  isDesktop.addEventListener('change', () => {
    closeAllPanels(nav);
    toggleMenu(nav, false);
  });

  block.textContent = '';
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
