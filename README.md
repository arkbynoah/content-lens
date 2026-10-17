# Content Lens

A local browser extension that sorts the **actual Instagram/TikTok profile grid**. Chrome is the development target; no server, video downloads, API key, or build step is required.

## Use

1. Load `extension/` with **Load unpacked** at `chrome://extensions` (Developer mode enabled).
2. Refresh Instagram/TikTok after installing or reloading the extension.
3. Open a profile's Reels/videos tab. A compact **Content Lens** toolbar appears immediately above the native posts.
4. Choose **Views**, **Likes**, or **Comments**, then **High → low** or **Low → high**. The existing tiles visually move into rank order, including pinned reels.
5. Scroll normally to see more posts. Your selected sort and filters automatically apply as the site adds new tiles; there is no loading screen or automatic scrolling.
6. **Reset** restores the site's original order and removes filters.

Instagram likes/comments are read from recognized hover-overlay markup, even when the overlay is not visible. Select **Metric availability** to inspect count coverage. If a metric is missing from every tile, its control explains the limitation and preserves original order. Unknown values stay last; a missing metric never becomes zero. Counts reflect the site's displayed values and may be rounded. The toolbar reports the number of currently loaded native tiles, not a claimed full-account total.

## Saved collections\n\nInstagram Saved supports native post-type, caption, and manual tag filters. When counts are absent, metric controls explain why and tiles are not covered with unavailable labels. Counts observed on other grids within 24 hours can be reused by post identity (including Instagram p/reel link variants). This does not fetch every saved post’s counts.\n\nTikTok Favorites uses its own card adapter and keeps Videos/Favorites/Liked sorting preferences separate even when the address does not change. Only recognizable post cards are collected, not inbox or navigation links.\n\nRun tests/fixtures/saved.html for nine collection-specific browser checks.\n\n## Tags and portability

Open **Filters** to choose Videos/Reels, Carousels/photo sets, or Photos; filter manual presentation/structure tags; or search notes and available captions/image descriptions. **Tag posts** adds small Tag buttons to the native tiles. Choose a reel, label it, and save. Presentation and structure are independent: a reel can be both Talking head and Storytelling. Automatic classification is not implemented.

Tags and notes persist locally in the browser. Open **Back up tags** (or the extension popup's backup link), export JSON, and keep it alongside the `extension/` folder. On a new laptop, load that folder and import the backup. Copying source files alone does not copy browser storage; export before uninstalling, which clears local storage.

## Version 0.6: saved collections

Dropdowns reserve space for consistently inset arrows. Metric availability uses a separate icon with an explicit gap and padded hit area. The inline toolbar has direct metric controls, independent sort direction, loaded-post coverage, expandable filters, and rank/count labels on native tiles. The popup and backup screens share its light/dark visual style. Extraction now recognizes Instagram's real `View Count Icon` SVG/title wrapper and background-image thumbnails, while excluding third-party extension icons.

The sorter applies CSS grid order to existing native cells across row wrappers. It does not clone, reparent, replace, or download posts, which preserves the site's event handlers and React ownership. Reset removes the extension's layout attributes. Newly rendered rows are rescanned; a return from a reel restores that profile's sorting choice for the current page session.

## Validation

- Ten Node tests cover saved route recognition, post types, metric identity and expiration, plus count parsing, canonical URLs, unknown values, tag filtering, backup validation, route scoping, and manifest files.
- Twelve browser regression checks cover observed Instagram markup, native cross-row sorting, original node identity, ascending/unknown/zero behavior, filtering without blank slots, reset, appended rows, Instagram’s unlabeled likes/comments sprites, unrelated counters, hidden likes, and bidirectional likes sorting.
- Browser integration checks in tests/fixtures/browsing.html exercise automatic sorting/filtering of newly added tiles, immediate controls, no startup scrolling, reset, and preserved dropdown/icon spacing.
- Live Chrome validation on `@swerikcodes/reels/`: view extraction and native visual ranking verified. First row after Most viewed was **3M, 1M, 717K, 665K**. Likes sorted **55.5K, 29.5K, 19.4K, 14.9K** across the first row. Comments and ascending direction were verified; one missing count remained last. Scrolling appended posts and reapplied sorting.
- TikTok Favorites sorting was verified live with 31 loaded posts: the first six were 9.3M, 6.2M, 4M, 4M, 3.9M, and 3.6M views. The adapter uses inspected markup: favorites-item cards expose video-views counts; inbox links are excluded. Collection routes and mixed content are covered by browser fixtures. Individual TikTok collection contents could not be verified because the current Collections tab showed no cards. Firefox and Safari have not been packaged/tested.

Run core checks:

```sh
npm test
npm run check
```

Open `tests/fixtures/native-grid.html` in Chrome for DOM/layout regression tests. No external dependencies are needed.

## Limits / next work

- Sorts currently loaded native tiles only; the platform may limit or virtualize the accessible list. Sorting and filters reapply as you scroll and the site adds tiles. A newly loaded popular post may move above earlier ones. The extension does not preload posts or move the page for collection.
- English labels and English number abbreviations are supported initially.
- Some likes/comments are absent from the grid or intentionally hidden. The Instagram sprite selectors are guarded against unrelated lists but may need updates when Instagram changes its markup. These are not fetched from private endpoints.
- Creator insights, followers gained per reel, reach, watch time, and automatic video classification remain unimplemented. Instagram Saved often omits counts entirely. No ranking is invented when a metric is missing.
- Site layout changes can require adapter updates. Unsupported grid structures are left alone.
- CSS visual sorting preserves DOM order, so screen-reader reading order can differ from visual rank. Native keyboard/screen-reader sorting needs further work.
- No account cookies, credentials, media files, or private network APIs are accessed. Post tags/notes and recently observed public counts are stored locally. Metric records expire after 24 hours, are marked ≈ when reused, and are excluded from tag backups. They are collected from grids you browse; there is no background scraping or auto-load.

## Browsers

Chrome is the tested target. Edge/Brave can generally share the Chromium package, but are untested. Firefox needs compatibility testing and distribution setup; Safari needs Apple's packaging workflow.

References: [MDN cross-browser extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension), [Safari packaging](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari), [Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage).
