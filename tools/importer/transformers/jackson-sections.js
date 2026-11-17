/* eslint-disable */
/* global WebImporter */

/**
 * Jackson sections transformer.
 * beforeTransform: insert <hr> section breaks (and markers for styled sections)
 * while the original section elements still exist.
 * afterTransform: add Section Metadata blocks for styled sections.
 */

// class marker: the cleanup transformer strips data-* attributes before this afterTransform runs
const MARKER_PREFIX = 'excat-section-marker-';

function findSectionEl(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!sections || sections.length < 2) return;
  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionEl(element, section);
      if (!el) continue;
      if (i === 0 && !section.style) continue;
      const hr = document.createElement('hr');
      if (section.style) hr.classList.add(`${MARKER_PREFIX}${section.id}`);
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr.${MARKER_PREFIX}${section.id}`);
      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      if (marker) {
        // Find the end of this section: next <hr> sibling or end of parent.
        let end = marker.nextElementSibling;
        while (end && end.tagName !== 'HR') end = end.nextElementSibling;
        if (end) end.parentNode.insertBefore(metadata, end);
        else marker.parentNode.appendChild(metadata);

        if (i === 0) marker.remove();
        else marker.removeAttribute('class');
      } else {
        const el = findSectionEl(element, section);
        if (el) el.after(metadata);
      }
    }
  }
}
