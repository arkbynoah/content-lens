globalThis.ContentLensStyles = `
:host { all:initial; display:block; width:100%; color-scheme:light dark; font:12px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:light-dark(#25252b,#f0f0f5); --border:light-dark(#e4e4eb,#303036); --muted:light-dark(#696974,#a1a1ad); --surface:light-dark(#f6f6f9,#17171c); --accent:light-dark(#5a45ce,#bcb3ff); }
* { box-sizing:border-box; } [hidden] { display:none !important; }
.shell { margin:14px 0 12px; border:1px solid var(--border); border-radius:12px; background:light-dark(#fff,#111115); overflow:hidden; }
.bar { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:12px 14px 10px; }
.brand { display:flex; align-items:center; gap:7px; font-weight:650; letter-spacing:-.2px; margin-right:auto; padding-right:10px; white-space:nowrap; }
.mark { display:grid; place-items:center; width:24px; height:24px; border-radius:7px; background:light-dark(#eeebff,#29243f); color:var(--accent); font-size:17px; }
button,select,input,textarea { font:inherit; color:inherit; }
button,select { border:1px solid var(--border); border-radius:7px; background:transparent; padding:7px 10px; cursor:pointer; min-height:34px; white-space:nowrap; }
button:hover,select:hover { background:var(--surface); }
button:disabled,select:disabled { opacity:.4; cursor:default; }
button[aria-expanded=true],button[aria-pressed=true] { color:var(--accent); background:light-dark(#f1eeff,#2b2540); border-color:light-dark(#d7cef8,#504369); }
.segments { display:flex; padding:3px; gap:2px; border:1px solid var(--border); border-radius:9px; background:var(--surface); }
.segments button { min-height:29px; padding:4px 11px; border:1px solid transparent; border-radius:6px; color:var(--muted); }
.segments button[aria-pressed=true] { color:light-dark(#272130,#fff); background:light-dark(#fff,#39333f); border-color:light-dark(#e1dce9,#574b67); box-shadow:0 1px 3px #0001; font-weight:600; }
.direction { font-size:11px; max-width:120px; } .quiet { border-color:transparent; color:var(--muted); }
.status-row { display:flex; align-items:center; gap:12px; padding:0 14px 10px; color:var(--muted); font-size:11px; flex-wrap:wrap; }
.count { white-space:nowrap; } .text-button { min-height:24px; border:0; padding:2px 0; color:var(--muted); font-size:11px; text-decoration:underline; text-decoration-color:transparent; text-underline-offset:3px; }
.text-button:hover { background:transparent; color:var(--accent); text-decoration-color:currentColor; }
.load-more { margin-left:auto; color:var(--accent); border:0; padding:2px 0; min-height:26px; font-size:11px; font-weight:600; }
.note { font-size:11px; color:var(--muted); padding:0 14px 12px; max-width:760px; }
.panel { border-top:1px solid var(--border); padding:14px; background:var(--surface); }
.panel-heading { display:flex; flex-wrap:wrap; gap:6px 12px; align-items:center; margin-bottom:12px; }
.muted { color:var(--muted); font-size:11px; } .fields { display:flex; flex-wrap:wrap; align-items:start; gap:12px; margin:10px 0; }
label { display:grid; gap:6px; color:var(--muted); font-size:11px; flex:1; min-width:140px; }
select,input,textarea { width:100%; } input,textarea { border:1px solid var(--border); border-radius:7px; background:light-dark(#fff,#111115); padding:8px 10px; min-height:34px; font-size:12px; }
label select { background:light-dark(#fff,#111115); color:light-dark(#25252b,#eee); }
textarea { min-height:65px; resize:vertical; } .panel-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-top:12px; }
.panel-actions a { margin-left:auto; font-size:11px; color:var(--muted); text-underline-offset:3px; }
.editor { display:flex; flex-wrap:wrap; gap:12px; align-items:end; }
.metrics p { font-size:11px; color:var(--muted); margin:10px 0 0; max-width:650px; } .metric-rows { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }
.metric-row { display:grid; gap:4px; flex:1; min-width:120px; padding:10px; border:1px solid var(--border); border-radius:8px; background:light-dark(#fff,#111115); }
.metric-row span:last-child { font-size:11px; color:var(--muted); }
:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
@media(max-width:650px) { .brand { width:100%; margin-bottom:3px; } .bar { gap:6px; } .segments { flex:1; } .segments button { flex:1; padding-inline:8px; } }
`;
