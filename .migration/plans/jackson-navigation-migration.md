# Jackson.com Navigation Migration Plan

## Goal
Rebuild the header and navigation from Jackson's [Retirement Statistics page](https://www.jackson.com/your-financial-future/retirement-statistics.html) on your site so it matches the original on desktop and mobile. That covers structure, content, styling and behaviour: dropdowns and mega menus, hover and click, the mobile hamburger, and any utility links or search.

## Current State
- The site still uses the stock starter navigation: a "Boilerplate" brand link, three sample dropdowns (Example Content, Getting Started, Documentation) and a search placeholder.
- The header code is the standard starter version. It loads the nav from the shared `nav` page and supports simple one-level dropdowns plus a basic mobile hamburger.
- The Retirement Statistics page hasn't been migrated yet. The new navigation will show on every page, so I'll check it on the home page preview. I can migrate the Retirement Statistics page separately if you want it too.
- Content lives in Document Authoring (inf01223-sameer / jackson-demo).

## Approach
1. **Capture the source navigation.** Take desktop and mobile screenshots of the Jackson header. Open every top-level item to record the full menu tree: labels, links, groupings, featured or promo areas, icons and logo. Also record utility items such as Login, Contact, Find a Financial Professional and search.
2. **Record the behaviour.** For each item, note whether its menu opens on hover or click and how it is laid out (simple dropdown, multi-column mega menu, or side panel). Also note sticky or scroll behaviour and how the mobile menu works: drawer, accordion and back navigation.
3. **Rebuild the nav content.** Replace the sample nav page with Jackson's content. Keep the three-part layout authors already use: brand/logo, main sections with nested menus, and tools/utility links. Download the logo and any icons locally.
4. **Update the header code and styling.** Extend the header block to handle Jackson's mega menu layout, the hover/click behaviour and the mobile pattern. Use Jackson's fonts, colours, spacing and hover states. Keep it accessible: keyboard navigation, Escape to close and the correct expanded/collapsed announcements.
5. **Check it against the original.** Compare the preview with the Jackson site at desktop and mobile widths. Fix differences in layout, menu contents, styling and interactions until they match.

## Scope Notes
- **Links:** links in the nav will point to Jackson's real page paths. Pages that haven't been migrated yet will lead nowhere on your site until they are.
- **Search and login:** these will look and sit exactly like Jackson's. Any working search or login backend from Jackson is out of scope; those links will point to the matching Jackson pages.
- **Where changes land:** everything is done on your local copy only (code and the nav page). Nothing is uploaded to Document Authoring, previewed or published unless you ask for that separately.
- **Footer:** not included. That's a separate task.

## Checklist
- [ ] Capture desktop and mobile screenshots of the Jackson header and every expanded menu
- [ ] Pull out the full nav tree: top-level items, submenu groups, links, featured content, utility links, logo
- [ ] Record the interaction for each item (hover vs. click, mega menu layout, sticky behaviour, mobile drawer/accordion)
- [ ] Download the Jackson logo and any nav icons locally
- [ ] Replace the sample nav page with Jackson's nav content (brand, sections, tools)
- [ ] Extend the header code to support Jackson's mega menu and mobile menu
- [ ] Style the header to match Jackson (fonts, colours, spacing, hover and active states, breakpoints)
- [ ] Check keyboard and screen-reader support (focus, Escape, expanded/collapsed state)
- [ ] Compare against the original at desktop width and fix differences
- [ ] Compare against the original at mobile width and fix differences
- [ ] Summarise what changed and confirm that only the local copy was updated

*This plan is ready to run. Switch to Execute mode to start the navigation migration.*
