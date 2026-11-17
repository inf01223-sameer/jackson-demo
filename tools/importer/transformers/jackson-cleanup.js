/* eslint-disable */
/* global WebImporter */

/**
 * Jackson (www.jackson.com) cleanup transformer.
 * Removes non-authorable chrome; keeps everything inside
 * div.body-content > section > div.content-wrapper.
 */

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Site chrome outside the body content: site-selector bar experience
    // fragment, user toggle container, masthead/footer experience fragments.
    element
      .querySelectorAll('.full-width-container, .toggle-container, .experiencefragment, .masthead')
      .forEach((el) => {
        if (!el.closest('.body-content')) el.remove();
      });

    removeAll(element, [
      'footer.global-footer-wrapper',
      '.global-footer',
      // OneTrust cookie banner / preference center
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
      // Qualtrics feedback tab and intercept container
      '.QSIFeedbackButton',
      '[id^="ZN_"]',
      // Session timeout modal and mask
      '.session-timeout-panel',
      '#background-mask',
      // Tracking beacons
      '[id^="batBeacon"]',
      // Hidden form-number elements inside tabs
      '.tab-form-number.hidden',
      '.tab-archive-form-number.hidden',
      // Non-content elements
      'script',
      'noscript',
      'iframe',
      'style',
      'link',
    ]);
  }

  if (hookName === 'afterTransform') {
    removeAll(element, [
      'script',
      'noscript',
      'iframe',
      'style',
      'link',
      'meta',
    ]);

    // Strip tracking/event attributes
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (n.startsWith('data-') || n.startsWith('on')) {
          el.removeAttribute(n);
        }
      });
    });
  }
}
