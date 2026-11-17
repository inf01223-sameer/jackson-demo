import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Promo cards: one row per card, [image | title + description + link].
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-promo-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      const onlyPicture = div.querySelector('picture')
        && !div.textContent.trim()
        && div.querySelectorAll('picture').length === 1;
      if (onlyPicture) div.className = 'cards-promo-card-image';
      else if (!div.textContent.trim() && !div.querySelector('picture')) div.remove();
      else div.className = 'cards-promo-card-body';
    });
    // keep the image first regardless of authored cell order
    const image = li.querySelector('.cards-promo-card-image');
    if (image && image !== li.firstElementChild) li.prepend(image);
    // a paragraph holding only a link is the card CTA (rendered as a red button)
    li.querySelectorAll('.cards-promo-card-body p').forEach((p) => {
      const a = p.querySelector('a[href]');
      if (!a || p.textContent.trim() !== a.textContent.trim()) return;
      p.className = 'cards-promo-card-cta';
      a.classList.add('button');
    });
    if (li.children.length) ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}
