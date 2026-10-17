# Content Lens

A local browser extension that sorts the **actual Instagram/TikTok profile grid**. Chrome is the development target; no server, video downloads, API key, or build step is required.

## Use

1. Load `extension/` with **Load unpacked** at `chrome://extensions` (Developer mode enabled).
2. Refresh Instagram/TikTok after installing or reloading the extension.
3. Open a profile's Reels/videos tab. A compact **Content Lens** toolbar appears immediately above the native posts.
4. Choose **Views**, **Likes**, or **Comments**, then **High → low** or **Low → high**. The existing tiles visually move into rank order, including pinned reels.
5. **Load more** scrolls through the site's own lazy loading and returns to the toolbar. Loaded posts automatically join the selected sort.
6. **Reset** restores the site's original order and removes filters.

Instagram likes/comments are read from recognized hover-overlay markup, even when the overlay is not visible. Select **Metric availability** to inspect count coverage. If a metric is missing from every tile, its control explains the limitation and preserves original order. Unknown values stay last; a missing metric never becomes zero. Counts reflect the site's displayed values and may be rounded. The toolbar reports the number of currently loaded native tiles, not a claimed full-account total.

## Tags and portability

Open **Filters** to filter manual presentation/structure tags or search notes and available image descriptions. **Tag posts** adds small Tag buttons to the native tiles. Choose a reel, label it, and save. Presentation and structure are independent: a reel can be both Talking head and Storytelling. Automatic classification is not implemented.

Tags and notes persist locally in the browser. Open **Back up tags** (or the extension popup's backup link), export JSON, and keep it alongside the `extension/` folder. On a new laptop, load that folder and import the backup. Copying source files alone does not copy browser storage; export before uninstalling, which clears local storage.

## Version 0.3: clear controls and engagement sorting

The inline toolbar has direct metric controls, independent sort direction, loaded-post coverage, expandable filters, and rank/count labels on native tiles. The popup and backup screens share its light/dark visual style. Extraction now recognizes Instagram's real `View Count Icon` SVG/title wrapper and background-image thumbnails, while excluding third-party extension icons.

The sorter applies CSS grid order to existing native cells across row wrappers. It does not clone, reparent, replace, or download posts, which preserves the site's event handlers and React ownership. Reset removes the extension's layout attributes. Newly rendered rows are rescanned; a return from a reel restores that profile's sorting choice for the current page session.

## Validation

- Seven Node tests cover count parsing, canonical URLs, unknown values, tag filtering, backup validation, route scoping, and manifest files.
- Twelve browser regression checks cover observed Instagram markup, native cross-row sorting, original node identity, ascending/unknown/zero behavior, filtering without blank slots, reset, appended rows, Instagram’s unlabeled likes/comments sprites, unrelated counters, hidden likes, and bidirectional likes sorting.
- Live Chrome validation on `@swerikcodes/reels/`: view extraction and native visual ranking verified. First row after Most viewed was **3M, 1M, 717K, 665K**. Likes sorted **55.5K, 29.5K, 19.4K, 14.9K** across the first row. Comments and ascending direction were verified; one missing count remained last. Scrolling appended posts and reapplied sorting. Load more increased the native collection from 16 to 24 posts.
- TikTok's adapter is present but has not yet been live-validated. Firefox and Safari have not been packaged/tested.

Run core checks:

```sh
npm test
npm run check
```

Open `tests/fixtures/native-grid.html` in Chrome for DOM/layout regression tests. No external dependencies are needed.

## Limits / next work

- Sorts loaded tiles only; the platform may limit or virtualize the accessible list. Load more does not claim that every post has been fetched.
- English labels and English number abbreviations are supported initially.
- Some likes/comments are absent from the grid or intentionally hidden. The Instagram sprite selectors are guarded against unrelated lists but may need updates when Instagram changes its markup. These are not fetched from private endpoints.
- Creator insights, followers gained per reel, reach, watch time, automatic video classification, and a verified saved-collections integration remain unimplemented.
- Site layout changes can require adapter updates. Unsupported grid structures are left alone.
- CSS visual sorting preserves DOM order, so screen-reader reading order can differ from visual rank. Native keyboard/screen-reader sorting needs further work.
- No account cookies, credentials, media files, or private network APIs are accessed. Only post tags/notes are persisted; current metrics are read from the page.

## Browsers

Chrome is the tested target. Edge/Brave can generally share the Chromium package, but are untested. Firefox needs compatibility testing and distribution setup; Safari needs Apple's packaging workflow.

References: [MDN cross-browser extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension), [Safari packaging](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari), [Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage).
