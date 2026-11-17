import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero split: text panel on one side, image on the other.
 * Authored as rows/cells in any order; the first picture becomes the media,
 * every other non-empty element becomes the text content.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'hero-split-content';
  const media = document.createElement('div');
  media.className = 'hero-split-media';

  const picture = block.querySelector('picture');
  if (picture) {
    // unwrap a picture-only paragraph so the media column holds the picture directly
    const holder = picture.parentElement;
    media.append(picture);
    if (holder && holder.tagName === 'P' && !holder.textContent.trim() && !holder.children.length) {
      holder.remove();
    }
  }

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      [...cell.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
        if (node.nodeType === Node.TEXT_NODE) {
          const p = document.createElement('p');
          p.textContent = node.textContent.trim();
          content.append(p);
          return;
        }
        content.append(node);
      });
    });
  });

  media.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, true, [
      { media: '(min-width: 900px)', width: '1200' },
      { width: '750' },
    ]));
  });

  // the hero image is above the fold: load it eagerly
  const img = media.querySelector('img');
  if (img) {
    img.loading = 'eager';
    img.fetchPriority = 'high';
  }

  block.replaceChildren(content);
  if (media.children.length) block.append(media);
  else block.classList.add('hero-split-no-media');
}
