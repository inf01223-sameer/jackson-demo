/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-split (Jackson .subpage-herospace-block).
 * Content model: row 1 = image, row 2 = H1 (+ optional description paragraphs).
 */
export default function parse(element, { document }) {
  const cells = [];

  const img = element.querySelector(':scope > .image img, .image img, img');
  if (img) cells.push([img]);

  const textCell = [];
  const srcTitle = element.querySelector('.card-content h1, h1, .title');
  if (srcTitle && srcTitle.textContent.trim()) {
    const h1 = document.createElement('h1');
    h1.textContent = srcTitle.textContent.replace(/\s+/g, ' ').trim();
    textCell.push(h1);
  }

  const desc = element.querySelector('.card-content .description');
  if (desc && desc.textContent.trim()) {
    const paras = [...desc.querySelectorAll('p')].filter((p) => p.textContent.trim());
    if (paras.length) {
      textCell.push(...paras);
    } else {
      const p = document.createElement('p');
      p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
      textCell.push(p);
    }
  }

  if (textCell.length) cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-split', cells });
  element.replaceWith(block);
}
