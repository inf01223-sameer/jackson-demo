/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-promo (Jackson .two-column promo cards).
 * Content model: one row per card, [image | H3 title + description + CTA link].
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

function buildLink(document, srcLink) {
  const a = document.createElement('a');
  a.href = normalizeHref(srcLink.getAttribute('href'));
  a.textContent = srcLink.textContent.replace(/\s+/g, ' ').trim();
  if (srcLink.getAttribute('title')) a.title = srcLink.getAttribute('title');
  return a;
}

export default function parse(element, { document }) {
  const cells = [];

  const cards = element.querySelectorAll('.promo-card-block');
  cards.forEach((card) => {
    const img = card.querySelector('.promo-image img');
    const content = card.querySelector('.card-content') || card;
    const body = [];

    const titleEl = content.querySelector('.title');
    if (titleEl && titleEl.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = titleEl.textContent.replace(/\s+/g, ' ').trim();
      body.push(h3);
    }

    const desc = content.querySelector('.description');
    if (desc) {
      const paras = [...desc.querySelectorAll('p')].filter((p) => p.textContent.trim());
      if (paras.length) {
        paras.forEach((p) => {
          p.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', normalizeHref(a.getAttribute('href'))));
          body.push(p);
        });
      } else if (desc.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
        body.push(p);
      }
    }

    content.querySelectorAll('.action a[href]').forEach((srcLink) => {
      if (!srcLink.textContent.trim()) return;
      const p = document.createElement('p');
      p.append(buildLink(document, srcLink));
      body.push(p);
    });

    if (!img && !body.length) return;
    cells.push([img || '', body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
}
