/* the order in which authored footer sections appear in footer.plain.html */
const SECTION_NAMES = ['links', 'legal', 'social', 'disclosures'];

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content/footer.plain.html (local preview) first, then /footer.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the footer sections
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
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
 * Opens links to other sites in a new tab (as on the source site).
 * @param {Element} root container
 */
function decorateExternalLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    if (a.hostname && a.hostname !== window.location.hostname && a.protocol.startsWith('http')) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

/**
 * Groups heading + list pairs into columns.
 * @param {Element} section links section
 * @returns {HTMLDivElement} columns container
 */
function buildColumns(section) {
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  let column = null;
  [...section.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName) || !column) {
      column = document.createElement('div');
      column.className = 'footer-column';
      columns.append(column);
    }
    column.append(child);
  });
  return columns;
}

/**
 * Turns icon links into masked icons so they can change colour on hover.
 * The image stays in the DOM (hidden) and its alt text labels the link.
 * @param {Element} list social list
 */
function decorateSocial(list) {
  list.classList.add('footer-social');
  list.querySelectorAll('a').forEach((a) => {
    const img = a.querySelector('img');
    if (!img) return;
    a.setAttribute('aria-label', img.alt || a.textContent.trim());
    a.style.setProperty('--footer-icon', `url("${img.src}")`);
    a.classList.add('footer-social-icon');
    img.alt = '';
  });
}

/**
 * Marks up the disclosure paragraphs (badge, notice box, body copy).
 * @param {Element} section disclosures section
 */
function decorateDisclosures(section) {
  section.querySelectorAll(':scope > p').forEach((p) => {
    const onlyChild = p.children.length === 1 && !p.textContent.replace(p.children[0].textContent, '').trim();
    if (onlyChild && p.querySelector(':scope > a > img, :scope > img, :scope > a > picture, :scope > picture')) {
      p.className = 'footer-badge';
    } else if (onlyChild && p.querySelector(':scope > strong')) {
      p.className = 'footer-notice';
    }
  });
}

/**
 * Wraps content in the centred inner column.
 * @param {string} className band class
 * @param {...Node} nodes content
 * @returns {HTMLDivElement} band
 */
function band(className, ...nodes) {
  const outer = document.createElement('div');
  outer.className = className;
  const inner = document.createElement('div');
  inner.className = 'footer-inner';
  inner.append(...nodes);
  outer.append(inner);
  return outer;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  if (!fragment) return;

  const sections = {};
  [...fragment.children].forEach((section, i) => {
    const name = SECTION_NAMES[i];
    if (!name) return;
    section.classList.add(`footer-${name}`);
    sections[name] = section;
  });

  // main band: link columns, divider, bottom row (copyright + legal + social)
  const mainContent = [];
  if (sections.links) mainContent.push(buildColumns(sections.links));
  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';
  if (sections.legal) {
    const copyright = sections.legal.querySelector(':scope > p');
    if (copyright) copyright.className = 'footer-copyright';
    sections.legal.querySelector(':scope > ul')?.classList.add('footer-legal-links');
    bottom.append(sections.legal);
  }
  const socialList = sections.social?.querySelector('ul');
  if (socialList) {
    decorateSocial(socialList);
    bottom.append(socialList);
  }
  if (mainContent.length && bottom.children.length) {
    const divider = document.createElement('hr');
    divider.className = 'footer-divider';
    mainContent.push(divider);
  }
  if (bottom.children.length) mainContent.push(bottom);

  block.textContent = '';
  if (mainContent.length) block.append(band('footer-main', ...mainContent));
  if (sections.disclosures) {
    decorateDisclosures(sections.disclosures);
    block.append(band('footer-disclosures', ...sections.disclosures.childNodes));
  }
  decorateExternalLinks(block);
}
