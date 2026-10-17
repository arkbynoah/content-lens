globalThis.ContentLensStyles = `
:host { all:initial; display:block; width:100%; color-scheme:light dark; font:12px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:light-dark(#25252b,#f0f0f5); --border:light-dark(#e4e4eb,#303036); --muted:light-dark(#696974,#a1a1ad); --surface:light-dark(#f6f6f9,#17171c); --accent:light-dark(#5a45ce,#bcb3ff); }
* { box-sizing:border-box; } [hidden] { display:none !important; }
.shell { margin:14px 0 12px; border:1px solid var(--border); border-radius:12px; background:light-dark(#fff,#111115); overflow:hidden; }
.bar { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:12px 14px 10px; }
.brand { display:flex; align-items:center; gap:7px; font-weight:650; letter-spacing:-.2px; margin-right:auto; padding-right:10px; white-space:nowrap; }
.mark { display:grid; place-items:center; width:24px; height:24px; border-radius:7px; background:light-dark(#eeebff,#29243f); color:var(--accent); font-size:17px; }
button,select,input,textarea { font:inherit; color:inherit; }
button,select { border:1px solid var(--border); border-radius:7px; background:transparent; padding:7px 10px; cursor:pointer; min-height:34px; white-space:nowrap; }
button:hover { background:var(--surface); }
button:disabled,select:disabled { opacity:.4; cursor:default; }
button[aria-expanded=true],button[aria-pressed=true] { color:var(--accent); background:light-dark(#f1eeff,#2b2540); border-color:light-dark(#d7cef8,#504369); }
.segments { display:flex; padding:3px; gap:2px; border:1px solid var(--border); border-radius:9px; background:var(--surface); }
.segments button { min-height:29px; padding:4px 11px; border:1px solid transparent; border-radius:6px; color:var(--muted); }
.segments button[aria-pressed=true] { color:light-dark(#272130,#fff); background:light-dark(#fff,#39333f); border-color:light-dark(#e1dce9,#574b67); box-shadow:0 1px 3px #0001; font-weight:600; }
.direction { font-size:11px; max-width:120px; } .quiet { border-color:transparent; color:var(--muted); }
.status-row { display:flex; align-items:center; gap:12px; padding:0 14px 10px; color:var(--muted); font-size:11px; flex-wrap:wrap; }
.count { white-space:nowrap; } .text-button { min-height:24px; border:0; padding:2px 0; color:var(--muted); font-size:11px; text-decoration:underline; text-decoration-color:transparent; text-underline-offset:3px; }
.text-button:hover { background:transparent; color:var(--accent); text-decoration-color:currentColor; }
.note { font-size:11px; color:var(--muted); padding:0 14px 12px; max-width:760px; }
.panel { border-top:1px solid var(--border); padding:14px; background:var(--surface); }
.panel-heading { display:flex; flex-wrap:wrap; gap:6px 12px; align-items:center; margin-bottom:12px; }
.muted { color:var(--muted); font-size:11px; } .fields { display:flex; flex-wrap:wrap; align-items:start; gap:12px; margin:10px 0; }
label { display:grid; gap:6px; color:var(--muted); font-size:11px; flex:1; min-width:140px; }
select,input,textarea { width:100%; } input,textarea { border:1px solid var(--border); border-radius:7px; background:light-dark(#fff,#111115); padding:8px 10px; min-height:34px; font-size:12px; }
label select { background-color:light-dark(#fff,#111115); color:light-dark(#25252b,#eee); }
textarea { min-height:65px; resize:vertical; } .panel-actions { display:flex; align-items:flex-end; flex-wrap:wrap; gap:8px; margin-top:12px; }
.panel-actions a { margin-left:0; font-size:11px; color:var(--muted); text-underline-offset:3px; }
.editor { display:flex; flex-wrap:wrap; gap:12px; align-items:end; }
.metrics p { font-size:11px; color:var(--muted); margin:10px 0 0; max-width:650px; } .metric-rows { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }
.metric-row { display:grid; gap:4px; flex:1; min-width:120px; padding:10px; border:1px solid var(--border); border-radius:8px; background:light-dark(#fff,#111115); }
.metric-row span:last-child { font-size:11px; color:var(--muted); }
:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
@media(max-width:650px) { .brand { width:100%; margin-bottom:3px; } .bar { gap:6px; } .segments { flex:1; } .segments button { flex:1; padding-inline:8px; } }

select { appearance:none; -webkit-appearance:none; padding:8px 38px 8px 12px; min-height:36px; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='m2 4 4 4 4-4' fill='none' stroke='%238b8b96' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; }
.direction { width:124px; max-width:none; flex:0 0 124px; }
label select { background-color:light-dark(#fff,#111115); background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='m2 4 4 4 4-4' fill='none' stroke='%238b8b96' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); }
select:hover { background-color:var(--surface); }
.bar { gap:10px; }
.status-row { gap:8px 16px; padding-top:2px; }
.text-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:6px 10px; min-height:32px; border:1px solid transparent; line-height:18px; text-decoration:none; }
.text-button:hover { background:var(--surface); text-decoration:none; }
.info-icon { display:inline-flex; align-items:center; justify-content:center; width:14px; height:14px; flex:0 0 14px; border:1px solid currentColor; border-radius:50%; font:600 10px/1 Georgia,serif; }
@media(max-width:650px) { .status-row { gap:8px; } }

.category-field { flex:0 1 310px; min-width:220px; }
.filter-buttons { display:flex; flex:1; flex-wrap:wrap; align-items:center; gap:8px; }
.filter-buttons button,.filter-buttons a { height:36px; min-height:36px; display:inline-flex; align-items:center; justify-content:center; padding:8px 12px; }
.filter-buttons a { margin-left:auto; }
.result-help { padding:0 14px 12px; margin:0; color:var(--muted); font-size:11px; }
.empty-results { display:flex; flex-direction:column; align-items:center; justify-content:flex-start; height:100%; min-height:240px; padding:32px 24px; text-align:center; border:1px solid var(--border); border-radius:12px; background:var(--surface); }
.empty-results strong { font-size:16px; } .empty-results p { max-width:620px; color:var(--muted); font-size:12px; margin:12px 0 18px; }
.empty-actions { display:flex; justify-content:center; flex-wrap:wrap; gap:8px; }
@media(max-width:650px) { .category-field { flex:1 1 100%; } .filter-buttons { flex-basis:100%; } .filter-buttons a { margin-left:0; } }
.index-progress { position:fixed; z-index:2147483647; bottom:24px; left:50%; transform:translateX(-50%); display:flex; gap:16px; align-items:center; padding:12px 18px; border:1px solid var(--border); border-radius:12px; background:light-dark(#fff,#24212e); box-shadow:0 8px 32px #0005; max-width:90vw; }
.library-link { color:var(--accent); margin-left:auto; padding:6px 10px; text-underline-offset:3px; }
.segments button[aria-disabled=true] { opacity:.45; cursor:help; }
`;
