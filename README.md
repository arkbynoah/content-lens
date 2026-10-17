# Content Lens

A local browser extension that sorts the **actual Instagram/TikTok profile grid**. Chrome is the development target; no server, video downloads, API key, or build step is required.

## Use

1. Load `extension/` with **Load unpacked** at `chrome://extensions` (Developer mode enabled).
2. Refresh Instagram/TikTok after installing or reloading the extension.
3. Open a profile's Reels/videos tab. A compact **Content Lens** toolbar appears immediately above the native posts.
4. Choose **Views**, **Likes**, or **Comments**, then **High → low** or **Low → high**. The existing tiles visually move into rank order, including pinned reels.
5. Scroll normally to see more posts. Your selected sort and filters automatically apply as the site adds new tiles; filters never start an indexing pass. Optional indexing is described below.
6. **Reset** restores the site's original order and removes filters.

Instagram likes/comments are read from recognized hover-overlay markup, even when the overlay is not visible. Select **Metric availability** to inspect count coverage. If a metric is missing from every tile, its control explains the limitation and preserves original order. Unknown values stay last; a missing metric never becomes zero. Counts reflect the site's displayed values and may be rounded. The toolbar reports the number of currently loaded native tiles, not a claimed full-account total.

## Saved collections

Instagram Saved supports native post-type, caption, and manual tag filters. When counts are absent, metric controls explain why and tiles are not covered with unavailable labels. Counts observed on other grids within 24 hours can be reused by post identity (including Instagram p/reel link variants). This does not fetch every saved post’s counts.

TikTok Favorites uses its own card adapter and keeps Videos/Favorites/Liked sorting preferences separate even when the address does not change. Only recognizable post cards are collected, not inbox or navigation links.

Run tests/fixtures/saved.html for nine collection-specific browser checks.

## Tags and portability

Open **Filters** to choose Videos/Reels, Carousels/photo sets, or Photos; filter manual presentation/structure tags; or search notes and available captions/image descriptions. **Tag posts** adds small Tag buttons to the native tiles. Choose a reel, label it, and save. Presentation and structure are independent: a reel can be both Talking head and Storytelling. Optional caption suggestions provide rough category clues; they do not analyze video. Manual tags take priority. Unknown categories remain unclassified.

Tags and notes persist locally in the browser. Open **Back up tags** (or the extension popup's backup link), export JSON, and keep it alongside the `extension/` folder. On a new laptop, load that folder and import the backup. Copying source files alone does not copy browser storage; export before uninstalling, which clears local storage.

## Version 0.7: collection browser

**Browse collection** opens a separate local library with instant search, collection/type/category filters, 24 results per page, a page-number jump, and tag editing. The existing native sorting toolbar remains in place. Metadata (links, captions, creator names, thumbnail URLs, and collection membership) is indexed as you browse. Thumbnail images load from platform media hosts; videos are not downloaded or uploaded to an AI service.

**Index collection** is an optional, explicit pass for discovering older posts without manually scrolling. It scrolls the source page while showing a small Stop control, records posts as they appear, and restores the starting scroll position. It pauses after two minutes, or after the page stops advancing for eight steps. Another pass can resume from the previous position within this tab session. Filtering never starts indexing, and there is no startup auto-load or blocking loading screen.

The index is an observed snapshot, not a complete or live replica. Platform loading limits, virtualization, and inaccessible posts can prevent full coverage. Removed saves can remain indexed. The library always reports indexed coverage rather than claiming the entire folder is loaded. Currently **tag backups do not include the collection index**; it can be rebuilt by browsing on another device.

Native content filters use a viewport-sized scrolling results area instead of preserving the entire unfiltered grid height. Zero matches show an explanation and recovery buttons. Category options show the number of tagged matches, or caption-suggestion matches when enabled. Tag posts clears category/search constraints so untagged posts remain reachable. Reset restores the site's natural grid layout. Sorting without content filters retains the normal page layout. The bounded results area does not itself discover older posts; use Index collection or return to normal browsing for that.

**Category matching → Include caption suggestions** uses conservative local text rules. Suggestions are explicitly labeled in the library. Captions can discuss storytelling without being a storytelling video, so these are clues rather than reliable classification. Full video/audio analysis is not implemented.

The reader also recognizes numeric `view_count`, `like_count`, and `comment_count` values tied to post codes in Instagram's embedded page JSON. Null values stay unknown. Live inspection of one saved Reel returned likes and comments with `view_count: null`; opening posts is therefore not a reliable way to recover every view count. No background post requests or private endpoints are used.

## Native grid and appearance

Dropdowns reserve space for consistently inset arrows. Metric availability uses a separate icon with an explicit gap and padded hit area. The inline toolbar has direct metric controls, independent sort direction, loaded-post coverage, expandable filters, and rank/count labels on native tiles. The popup and backup screens share its light/dark visual style. Extraction now recognizes Instagram's real `View Count Icon` SVG/title wrapper and background-image thumbnails, while excluding third-party extension icons.

The sorter applies CSS grid order to existing native cells across row wrappers. It does not clone, reparent, replace, or download posts, which preserves the site's event handlers and React ownership. Reset removes the extension's layout attributes. Newly rendered rows are rescanned; a return from a reel restores that profile's sorting choice for the current page session.

## Version 0.7.1: filter recovery

Fixed the unbounded blank region caused by the previous grid-height reservation. Filtered native results have a bounded scroll region that retains its scroll position during background rescans. Empty states distinguish missing manual labels from a combined search/type/category mismatch, with one-click ways to clear categories, try useful caption suggestions, or tag loaded posts. The category dropdown, tag button, clear button, and backup link align at 36px height; the dropdown no longer stretches across most of the toolbar.

## Validation

Version 0.7.1 adds thirteen browser checks in `tests/fixtures/filters.html` for large-grid blank-space regression, missing manual categories, optional suggestions, combined search, recovery, tagging, stable rescanning, preserved result scrolling, action alignment, and invalidated extension context recovery.

Version 0.7: 13 Node checks, 9 collection browser checks, 6 indexing checks, 12 native browsing checks, and 9 saved-collection checks pass. Live Chrome validation indexed 144 Content Study posts across Instagram’s changing live grid, restored the source position after stopping, opened the local library through the extension worker, and returned 15 immediate caption-search matches for “storytelling”. These matches are text search, not confirmed video classifications. The library showed six pages of results with working thumbnail previews. This turn did not revalidate TikTok live.

- Thirteen Node tests cover caption hints, index identity, and saved route recognition, post types, metric identity and expiration, plus count parsing, canonical URLs, unknown values, tag filtering, backup validation, route scoping, and manifest files.
- Twelve browser regression checks cover observed Instagram markup, native cross-row sorting, original node identity, ascending/unknown/zero behavior, filtering without blank slots, reset, appended rows, Instagram’s unlabeled likes/comments sprites, unrelated counters, hidden likes, and bidirectional likes sorting.
- Browser integration checks in tests/fixtures/browsing.html exercise automatic sorting/filtering of newly added tiles, immediate controls, no startup scrolling, reset, and preserved dropdown/icon spacing.
- Live Chrome validation on `@swerikcodes/reels/`: view extraction and native visual ranking verified. First row after Most viewed was **3M, 1M, 717K, 665K**. Likes sorted **55.5K, 29.5K, 19.4K, 14.9K** across the first row. Comments and ascending direction were verified; one missing count remained last. Scrolling appended posts and reapplied sorting.
- TikTok Favorites sorting was verified live with 31 loaded posts: the first six were 9.3M, 6.2M, 4M, 4M, 3.9M, and 3.6M views. The adapter uses inspected markup: favorites-item cards expose video-views counts; inbox links are excluded. Collection routes and mixed content are covered by browser fixtures. Individual TikTok collection contents could not be verified because the current Collections tab showed no cards. Firefox and Safari have not been packaged/tested.

Run core checks:

```sh
npm test
npm run check
```

Open `tests/fixtures/library.html` for nine library checks, `tests/fixtures/browsing.html` for twelve browsing checks, and `tests/fixtures/native-grid.html` in Chrome for DOM/layout regression tests. No external dependencies are needed.

## Limits / next work

- Sorts currently loaded native tiles only; the platform may limit or virtualize the accessible list. Sorting and filters reapply as you scroll and the site adds tiles. A newly loaded popular post may move above earlier ones. Only the optional Index collection action moves the page to discover posts.
- English labels and English number abbreviations are supported initially.
- Some likes/comments are absent from the grid or intentionally hidden. The Instagram sprite selectors are guarded against unrelated lists but may need updates when Instagram changes its markup. These are not fetched from private endpoints.
- Creator insights, followers gained per reel, reach, watch time, and automatic video classification remain unimplemented. Instagram Saved often omits counts entirely. No ranking is invented when a metric is missing.
- Site layout changes can require adapter updates. Unsupported grid structures are left alone.
- CSS visual sorting preserves DOM order, so screen-reader reading order can differ from visual rank. Native keyboard/screen-reader sorting needs further work.
- No account cookies, credentials, media files, or private network APIs are accessed. Tags, notes, the collection index, and recently observed counts are stored locally. Metric records expire after 24 hours, are marked ≈ when reused, and are excluded from tag backups. They are collected from grids you browse; there are no background post requests or startup auto-load.

## Browsers

Chrome is the tested target. Edge/Brave can generally share the Chromium package, but are untested. Firefox needs compatibility testing and distribution setup; Safari needs Apple's packaging workflow.

References: [MDN cross-browser extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension), [Safari packaging](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari), [Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage).

### Extension branding (0.7.2)

The lavender lens mark appears in the Chrome extension menu, toolbar action, extension-page favicons, popup, and native-page toolbar. Chrome uses bundled PNG assets at multiple sizes; the editable vector source is `extension/icons/content-lens.svg`. To regenerate assets, run `python3 scripts/generate-icons.py` with Pillow installed. No image tooling is needed to run the extension. The popup prioritizes browsing indexed posts, with tag backup as a secondary action. Sorting and filters remain beside the native posts.
