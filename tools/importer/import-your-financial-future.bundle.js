/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-your-financial-future.js
  var import_your_financial_future_exports = {};
  __export(import_your_financial_future_exports, {
    default: () => import_your_financial_future_default
  });

  // tools/importer/parsers/hero-split.js
  function parse(element, { document }) {
    const cells = [];
    const img = element.querySelector(":scope > .image img, .image img, img");
    if (img) cells.push([img]);
    const textCell = [];
    const srcTitle = element.querySelector(".card-content h1, h1, .title");
    if (srcTitle && srcTitle.textContent.trim()) {
      const h1 = document.createElement("h1");
      h1.textContent = srcTitle.textContent.replace(/\s+/g, " ").trim();
      textCell.push(h1);
    }
    const desc = element.querySelector(".card-content .description");
    if (desc && desc.textContent.trim()) {
      const paras = [...desc.querySelectorAll("p")].filter((p) => p.textContent.trim());
      if (paras.length) {
        textCell.push(...paras);
      } else {
        const p = document.createElement("p");
        p.textContent = desc.textContent.replace(/\s+/g, " ").trim();
        textCell.push(p);
      }
    }
    if (textCell.length) cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-split", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-findings.js
  var SOURCE_ORIGIN = "https://www.jackson.com";
  var DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip|csv|txt)$/i;
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
    const isJackson = /^(www\.)?jackson\.com$/i.test(url.hostname) || !/^[a-z][a-z0-9+.-]*:/i.test(raw) && !raw.startsWith("//");
    if (!isJackson) return url.href;
    if (DOC_EXT.test(url.pathname)) return `${SOURCE_ORIGIN}${url.pathname}${url.search}${url.hash}`;
    const path = url.pathname.replace(/\.html$/i, "");
    return `${path}${url.search}${url.hash}`;
  }
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function buildLink(document, srcLink) {
    const a = document.createElement("a");
    a.href = normalizeHref(srcLink.getAttribute("href"));
    a.textContent = clean(srcLink.textContent);
    return a;
  }
  function heading(document, tag, text) {
    const h = document.createElement(tag);
    h.textContent = text;
    return h;
  }
  function tabLabel(li) {
    const textNodes = [...li.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ");
    return clean(textNodes) || clean(li.textContent);
  }
  function buildPanelContent(document, panel) {
    const out = [];
    const layout = panel.querySelector(".comparison-highlight-layout") || panel;
    const accordion = panel.querySelector(".accordion");
    const h2 = [...layout.querySelectorAll("h2")].find((h) => clean(h.textContent));
    if (h2) out.push(heading(document, "h2", clean(h2.textContent)));
    const main = layout.querySelector(".main-content") || layout;
    const headline = [...main.querySelectorAll(".cta-list__header h3, h3")].find((h) => clean(h.textContent) && !(accordion && accordion.contains(h)));
    if (headline) out.push(heading(document, "h3", clean(headline.textContent)));
    main.querySelectorAll(".cta-list__description p").forEach((p) => {
      if (!p.textContent.trim()) return;
      p.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", normalizeHref(a.getAttribute("href"))));
      let last = p.lastChild;
      while (last && (last.nodeType === 3 && !last.textContent.trim() || last.nodeName === "BR")) {
        const prev = last.previousSibling;
        last.remove();
        last = prev;
      }
      out.push(p);
    });
    main.querySelectorAll(".cta-list__links a[href]").forEach((srcLink) => {
      if (!clean(srcLink.textContent)) return;
      const p = document.createElement("p");
      p.append(buildLink(document, srcLink));
      out.push(p);
    });
    const img = layout.querySelector(".secondary-content img");
    if (img) {
      const p = document.createElement("p");
      p.append(img);
      out.push(p);
    }
    if (accordion) {
      accordion.querySelectorAll(".accordion-item").forEach((item) => {
        const titleEl = item.querySelector(".accordion-title h3, .accordion-title");
        const title = clean(titleEl && titleEl.textContent);
        if (title) out.push(heading(document, "h3", title));
        const desc = item.querySelector(".accordion-description") || item;
        desc.querySelectorAll(".cta-list").forEach((group) => {
          const h4 = group.querySelector(".cta-list__header h4, h4");
          if (h4 && clean(h4.textContent)) out.push(heading(document, "h4", clean(h4.textContent)));
          group.querySelectorAll(".cta-list__description p").forEach((p) => {
            if (p.textContent.trim()) out.push(p);
          });
          const links = [...group.querySelectorAll(".cta-list__links a[href]")].filter((a) => clean(a.textContent));
          if (links.length) {
            const ul = document.createElement("ul");
            links.forEach((srcLink) => {
              const li = document.createElement("li");
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
  function parse2(element, { document }) {
    const cells = [];
    const tabs = [...element.querySelectorAll(".tab-container > ul > li")];
    const panels = [...element.querySelectorAll(".tab-content-wrappper > .tab-content, .tab-content-wrapper > .tab-content")];
    tabs.forEach((li, i) => {
      const label = tabLabel(li);
      const panel = li.id && element.querySelector(`[id="${li.id}-tab"]`) || panels[i];
      if (!label && !panel) return;
      const content = panel ? buildPanelContent(document, panel) : [];
      cells.push([label, content]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-findings", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-promo.js
  var SOURCE_ORIGIN2 = "https://www.jackson.com";
  var DOC_EXT2 = /\.(pdf|docx?|xlsx?|pptx?|zip|csv|txt)$/i;
  function normalizeHref2(href) {
    if (!href) return href;
    const raw = href.trim();
    if (/^(#|mailto:|tel:|javascript:)/i.test(raw)) return raw;
    let url;
    try {
      url = new URL(raw, SOURCE_ORIGIN2);
    } catch (e) {
      return raw;
    }
    const isJackson = /^(www\.)?jackson\.com$/i.test(url.hostname) || !/^[a-z][a-z0-9+.-]*:/i.test(raw) && !raw.startsWith("//");
    if (!isJackson) return url.href;
    if (DOC_EXT2.test(url.pathname)) return `${SOURCE_ORIGIN2}${url.pathname}${url.search}${url.hash}`;
    const path = url.pathname.replace(/\.html$/i, "");
    return `${path}${url.search}${url.hash}`;
  }
  function buildLink2(document, srcLink) {
    const a = document.createElement("a");
    a.href = normalizeHref2(srcLink.getAttribute("href"));
    a.textContent = srcLink.textContent.replace(/\s+/g, " ").trim();
    if (srcLink.getAttribute("title")) a.title = srcLink.getAttribute("title");
    return a;
  }
  function parse3(element, { document }) {
    const cells = [];
    const cards = element.querySelectorAll(".promo-card-block");
    cards.forEach((card) => {
      const img = card.querySelector(".promo-image img");
      const content = card.querySelector(".card-content") || card;
      const body = [];
      const titleEl = content.querySelector(".title");
      if (titleEl && titleEl.textContent.trim()) {
        const h3 = document.createElement("h3");
        h3.textContent = titleEl.textContent.replace(/\s+/g, " ").trim();
        body.push(h3);
      }
      const desc = content.querySelector(".description");
      if (desc) {
        const paras = [...desc.querySelectorAll("p")].filter((p) => p.textContent.trim());
        if (paras.length) {
          paras.forEach((p) => {
            p.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", normalizeHref2(a.getAttribute("href"))));
            body.push(p);
          });
        } else if (desc.textContent.trim()) {
          const p = document.createElement("p");
          p.textContent = desc.textContent.replace(/\s+/g, " ").trim();
          body.push(p);
        }
      }
      content.querySelectorAll(".action a[href]").forEach((srcLink) => {
        if (!srcLink.textContent.trim()) return;
        const p = document.createElement("p");
        p.append(buildLink2(document, srcLink));
        body.push(p);
      });
      if (!img && !body.length) return;
      cells.push([img || "", body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/jackson-cleanup.js
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      element.querySelectorAll(".full-width-container, .toggle-container, .experiencefragment, .masthead").forEach((el) => {
        if (!el.closest(".body-content")) el.remove();
      });
      removeAll(element, [
        "footer.global-footer-wrapper",
        ".global-footer",
        // OneTrust cookie banner / preference center
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#onetrust-pc-sdk",
        // Qualtrics feedback tab and intercept container
        ".QSIFeedbackButton",
        '[id^="ZN_"]',
        // Session timeout modal and mask
        ".session-timeout-panel",
        "#background-mask",
        // Tracking beacons
        '[id^="batBeacon"]',
        // Hidden form-number elements inside tabs
        ".tab-form-number.hidden",
        ".tab-archive-form-number.hidden",
        // Non-content elements
        "script",
        "noscript",
        "iframe",
        "style",
        "link"
      ]);
    }
    if (hookName === "afterTransform") {
      removeAll(element, [
        "script",
        "noscript",
        "iframe",
        "style",
        "link",
        "meta"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("data-") || n.startsWith("on")) {
            el.removeAttribute(n);
          }
        });
      });
    }
  }

  // tools/importer/transformers/jackson-sections.js
  var MARKER_PREFIX = "excat-section-marker-";
  function findSectionEl(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && template.sections;
    if (!sections || sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionEl(element, section);
        if (!el) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.classList.add(`${MARKER_PREFIX}${section.id}`);
        el.parentNode.insertBefore(hr, el);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr.${MARKER_PREFIX}${section.id}`);
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (marker) {
          let end = marker.nextElementSibling;
          while (end && end.tagName !== "HR") end = end.nextElementSibling;
          if (end) end.parentNode.insertBefore(metadata, end);
          else marker.parentNode.appendChild(metadata);
          if (i === 0) marker.remove();
          else marker.removeAttribute("class");
        } else {
          const el = findSectionEl(element, section);
          if (el) el.after(metadata);
        }
      }
    }
  }

  // tools/importer/import-your-financial-future.js
  var PAGE_TEMPLATE = {
    "name": "your-financial-future",
    "urls": [
      "https://www.jackson.com/your-financial-future/retirement-statistics.html"
    ],
    "representativeUrl": "https://www.jackson.com/your-financial-future/retirement-statistics.html",
    "description": "Your Financial Future subpages: split hero, tabbed research findings, promo cards, disclosure",
    "blocks": [
      {
        "name": "hero-split",
        "instances": [
          ".herospace .subpage-herospace-block"
        ]
      },
      {
        "name": "tabs-findings",
        "instances": [
          ".tab-container.v4 .tab.v4"
        ]
      },
      {
        "name": "cards-promo",
        "instances": [
          ".layout-container .two-column"
        ]
      }
    ],
    "urlPattern": "/your-financial-future/*",
    "sections": [
      {
        "id": "section-1",
        "name": "hero",
        "selector": [
          ".content-wrapper > .herospace",
          ".herospace"
        ],
        "style": null,
        "blocks": [
          "hero-split"
        ],
        "defaultContent": []
      },
      {
        "id": "section-2",
        "name": "research-intro-and-tabs",
        "selector": [
          ".content-wrapper > .tab-container.v4",
          ".tab-container.v4"
        ],
        "style": null,
        "blocks": [
          "tabs-findings"
        ],
        "defaultContent": [
          ".tab-container.v4 > .content-area > .header"
        ]
      },
      {
        "id": "section-3",
        "name": "additional-resources",
        "selector": [
          ".content-wrapper > .layout-container",
          ".layout-container"
        ],
        "style": "centered",
        "blocks": [
          "cards-promo"
        ],
        "defaultContent": [
          ".layout-container > .content-area > h3"
        ]
      },
      {
        "id": "section-4",
        "name": "disclosure",
        "selector": [
          ".content-wrapper > .disclosure",
          ".disclosure"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".disclosure > .content-area > p"
        ]
      }
    ]
  };
  var parsers = {
    "hero-split": parse,
    "tabs-findings": parse2,
    "cards-promo": parse3
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var transformers = [transform, ...lateTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
      matches.forEach((element) => {
        if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    };
    template.blocks.forEach((blockDef) => {
      const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
      (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
    });
    template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
    return pageBlocks;
  }
  function markPageTargets(payload) {
    const { document, params } = payload;
    executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_your_financial_future_default = {
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_your_financial_future_exports);
})();
