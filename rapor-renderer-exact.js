/* Isolated renderer: keeps CQlass report CSS completely separate from viewer CSS. */
(function(){
  const originalRender=window.renderPts;
  if(typeof originalRender!=='function') return;
  window.renderPts=function(raw){
    const reportMarkup=originalRender(raw);
    const srcdoc=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="rapor-cqlass.css?v=20260925-exact2"><style>html,body{margin:0;padding:0;background:#eef1f0}body{overflow-x:auto}.rpv-paper-wrap{margin:0!important}</style></head><body>${reportMarkup}</body></html>`;
    const safe=srcdoc.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<div class="rpv-isolated-shell"><iframe class="rpv-exact-frame" title="Rapor PTS" srcdoc="${safe}"></iframe></div>`;
  };
})();