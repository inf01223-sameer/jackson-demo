/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-findings (Jackson .tab.v4 research tabs).
 * Content model: one row per tab, [tab label | panel content].
 * Panel content order: H2 'Key findings', H3 headline, summary paragraph(s),
 * CTA link, partner image, H3 'Reporting and analysis', then per group:
 * H4 heading + list of links. All panels are included, including hidden ones.
 */

const SOURCE_ORIGIN = 'https://www.jackson.com';
const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip|csv|txt)$/i;

function normalizeHref(href) {
  if (!href) return href;
  const raw = href.trim();
  if (/^(#|mailto:|tel:|javascript:)/i.test(raw)) return raw;
  let url;
  try {
    url = new URL(raw, SOURCE_ORIGIN);
  } catch (e) {
    return raw;
  }
  const isJackson = /^(www\.)?jackson\.com$/i.test(url.hostname)
    || (!/^[a-z][a-z0-9+.-]*:/i.test(raw) && !raw.startsWith('//'));
  if (!isJackson) return url.href;
  if (DOC_EXT.test(url.pathname)) return `${SOURCE_ORIGIN}${url.pathname}${url.search}${url.hash}`;
  const path = url.pathname.replace(/\.html$/i, '');
  return `${path}${url.search}${url.hash}`;
}

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function buildLink(document, srcLink) {
  const a = document.createElement('a');
  a.href = normalizeHref(srcLink.getAttribute('href'));
  a.textContent = clean(srcLink.textContent);
  return a;
}

function heading(document, tag, text) {
  const h = document.createElement(tag);
  h.textContent = text;
  return h;
}

/** Label text of a tab <li>, ignoring hidden form-number helper divs. */
function tabLabel(li) {
  const textNodes = [...li.childNodes]
    .filter((n) => n.nodeType === 3)
    .map((n) => n.textContent)
    .join(' ');
  return clean(textNodes) || clean(li.textContent);
}

function buildPanelContent(document, panel) {
  const out = [];
  const layout = panel.querySelector('.comparison-highlight-layout') || panel;
  const accordion = panel.querySelector('.accordion');

  // H2 "Key findings"
  const h2 = [...layout.querySelectorAll('h2')].find((h) => clean(h.textContent));
  if (h2) out.push(heading(document, 'h2', clean(h2.textContent)));

  // Main findings: headline, summary, CTA
  const main = layout.querySelector('.main-content') || layout;
  const headline = [...main.querySelectorAll('.cta-list__header h3, h3')]
    .find((h) => clean(h.textContent) && !(accordion && accordion.contains(h)));
  if (headline) out.push(heading(document, 'h3', clean(headline.textContent)));

  main.querySelectorAll('.cta-list__description p').forEach((p) => {
    if (!p.textContent.trim()) return;
    p.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', normalizeHref(a.getAttribute('href'))));
    // drop trailing <br> / &nbsp; padding
    let last = p.lastChild;
    while (last && ((last.nodeType === 3 && !last.textContent.trim()) || last.nodeName === 'BR')) {
      const prev = last.previousSibling;
      last.remove();
      last = prev;
    }
    out.push(p);
  });

  main.querySelectorAll('.cta-list__links a[href]').forEach((srcLink) => {
    if (!clean(srcLink.textContent)) return;
    const p = document.createElement('p');
    p.append(buildLink(document, srcLink));
    out.push(p);
  });

  // Partner image
  const img = layout.querySelector('.secondary-content img');
  if (img) {
    const p = document.createElement('p');
    p.append(img);
    out.push(p);
  }

  // Reporting and analysis
  if (accordion) {
    accordion.querySelectorAll('.accordion-item').forEach((item) => {
      const titleEl = item.querySelector('.accordion-title h3, .accordion-title');
      const title = clean(titleEl && titleEl.textContent);
      if (title) out.push(heading(document, 'h3', title));

      const desc = item.querySelector('.accordion-description') || item;
      desc.querySelectorAll('.cta-list').forEach((group) => {
        const h4 = group.querySelector('.cta-list__header h4, h4');
        if (h4 && clean(h4.textContent)) out.push(heading(document, 'h4', clean(h4.textContent)));

        group.querySelectorAll('.cta-list__description p').forEach((p) => {
          if (p.textContent.trim()) out.push(p);
        });

        const links = [...group.querySelectorAll('.cta-list__links a[href]')].filter((a) => clean(a.textContent));
        if (links.length) {
          const ul = document.createElement('ul');
          links.forEach((srcLink) => {
            const li = document.createElement('li');
            li.append(buildLink(document, srcLink));
            ul.append(li);
          });
          out.push(ul);
        }
      });
    });
  }

  return out;
}

export default function parse(element, { document }) {
  const cells = [];

  const tabs = [...element.querySelectorAll('.tab-container > ul > li')];
  const panels = [...element.querySelectorAll('.tab-content-wrappper > .tab-content, .tab-content-wrapper > .tab-content')];

  tabs.forEach((li, i) => {
    const label = tabLabel(li);
    const panel = (li.id && element.querySelector(`[id="${li.id}-tab"]`)) || panels[i];
    if (!label && !panel) return;
    const content = panel ? buildPanelContent(document, panel) : [];
    cells.push([label, content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-findings', cells });
  element.replaceWith(block);
}
