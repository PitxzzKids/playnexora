
(()=>{
  'use strict';
  const toast=(message)=>{
    let node=document.querySelector('.toast-bh');
    if(!node){node=document.createElement('div');node.className='toast-bh';node.setAttribute('role','status');node.setAttribute('aria-live','polite');document.body.appendChild(node)}
    node.textContent=message;
    clearTimeout(node._hideTimer);
    node._hideTimer=setTimeout(()=>node.remove(),3200);
  };
  document.querySelectorAll('.topnav [data-v]').forEach(button=>{
    button.addEventListener('click',()=>{
      document.querySelectorAll('.topnav [data-v]').forEach(item=>{
        const active=item===button;
        item.classList.toggle('active',active);
        if(active)item.setAttribute('aria-current','page');
        else item.removeAttribute('aria-current');
      });
    },{passive:true});
  });
  window.netquestDiagnostics=()=>{
    const views=[...document.querySelectorAll('main .view')];
    const nav=[...document.querySelectorAll('.topnav [data-v]')];
    const missing=nav.map(x=>x.dataset.v).filter((id,i,a)=>a.indexOf(id)===i&&!document.getElementById(id));
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const duplicateIds=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
    let storage='tersedia';try{const k='__nq_health__';localStorage.setItem(k,'1');localStorage.removeItem(k)}catch(e){storage='dibatasi browser'}
    return {views:views.length,navigationItems:nav.length,missingViews:missing,duplicateIds,localStorage:storage,backend:'tidak terhubung (mode HTML lokal)'};
  };
  window.addEventListener('error',(event)=>{
    console.error('[NEXORA] Runtime error:',event.message,event.filename,event.lineno);
    if(!document.hidden)toast('Ada kendala pada salah satu komponen. Coba muat ulang halaman jika fitur tidak merespons.');
  });
  window.addEventListener('unhandledrejection',(event)=>{
    console.error('[NEXORA] Async error:',event.reason);
    if(!document.hidden)toast('Satu proses belum berhasil diselesaikan. Periksa kembali input dan coba lagi.');
  });
})();
