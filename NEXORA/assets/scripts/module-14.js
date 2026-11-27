
(()=>{
 'use strict';
 const root=document.getElementById('nqRubricList');
 const audit=root?.closest('.glass.card');
 if(!root||!audit)return;
 const categories=[
  {id:'ui',name:'Desain UI/UX',hint:'Demo: navigasi sidebar, pencarian menu, tampilan ponsel, fokus keyboard, dan pesan status.'},
  {id:'materi',name:'Kelengkapan Materi',hint:'Demo: materi konsep, OSI/TCP-IP, IPv4/subnetting, VLAN, routing, layanan, keamanan, dan evaluasi.'},
  {id:'interaktif',name:'Interaktif & Inovatif',hint:'Demo: ubah input simulasi, jalankan kuis, lihat umpan balik, lalu ulangi aktivitas.'},
  {id:'pedagogi',name:'Inovasi Pembelajaran',hint:'Demo: jalur kompetensi, misi kasus, refleksi jurnal, serta proyek akhir berbasis masalah.'},
  {id:'teknologi',name:'Inovasi Teknologi',hint:'Demo: Virtual Lab, penyimpanan progres lokal, ekspor bukti, dan batasan akun demo.'}
 ];
 const breakdown=document.createElement('div');
 breakdown.id='nqRubricBreakdown';
 breakdown.setAttribute('aria-live','polite');
 const evidence=document.createElement('div');
 evidence.className='nq-evidence-guide';
 evidence.innerHTML=categories.map(c=>`<article><b>${c.name}</b><p>${c.hint}</p></article>`).join('');
 const title=document.createElement('h3');
 title.textContent='Rincian skor per aspek';
 title.style.marginTop='18px';
 const guideTitle=document.createElement('h3');
 guideTitle.textContent='Panduan bukti demonstrasi';
 guideTitle.style.marginTop='18px';
 const actions=document.createElement('div');
 actions.className='nq-report-actions';
 actions.innerHTML='<button class="btn p" id="nqPrintEvidence" type="button">Cetak laporan untuk guru</button><span class="nq-cap-note" style="margin:0;flex:1">Laporan mencantumkan skor audit, status indikator, rancangan proyek, dan contoh bukti yang perlu didemonstrasikan.</span>';
 const note=audit.querySelector('.nq-cap-note');
 if(note){note.insertAdjacentElement('beforebegin',title);note.insertAdjacentElement('beforebegin',breakdown);note.insertAdjacentElement('beforebegin',guideTitle);note.insertAdjacentElement('beforebegin',evidence);note.insertAdjacentElement('afterend',actions)}
 function refresh(){
  const checks=[...root.querySelectorAll('input[type="checkbox"][data-rubric]')];
  breakdown.replaceChildren();
  let total=0;
  categories.forEach(c=>{
   const group=checks.filter(x=>x.dataset.rubric===c.id);
   const earned=group.filter(x=>x.checked).length*5;
   total+=earned;
   const item=document.createElement('div');item.className='nq-rubric-metric';
   const head=document.createElement('div');head.className='nq-rubric-metric-head';
   const name=document.createElement('span');name.textContent=c.name;
   const score=document.createElement('strong');score.textContent=earned+'/20';head.append(name,score);
   const track=document.createElement('div');track.className='nq-rubric-track';
   const fill=document.createElement('span');fill.style.width=(earned/20*100)+'%';track.append(fill);
   const hint=document.createElement('p');hint.className='nq-rubric-hint';hint.textContent=group.filter(x=>x.checked).length+' dari '+group.length+' indikator terverifikasi';
   item.append(head,track,hint);breakdown.append(item);
  });
  const scoreNode=document.getElementById('nqRubricScore');
  if(scoreNode && Number((scoreNode.textContent||'').split('/')[0])!==total){scoreNode.innerHTML=total+'<span>/100</span>';}
 }
 root.addEventListener('change',refresh);
 document.getElementById('nqRubricClear')?.addEventListener('click',()=>setTimeout(refresh,0));
 document.getElementById('nqPrintEvidence')?.addEventListener('click',()=>{
  refresh();
  const checks=[...root.querySelectorAll('input[type="checkbox"][data-rubric]')];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const val=id=>document.getElementById(id)?.value?.trim()||'Belum diisi';
  const total=checks.filter(x=>x.checked).length*5;
  const rows=categories.map(c=>{const list=checks.filter(x=>x.dataset.rubric===c.id);const n=list.filter(x=>x.checked).length;return `<tr><td>${esc(c.name)}</td><td>${n*5}/20</td><td>${n}/${list.length}</td><td>${esc(c.hint)}</td></tr>`}).join('');
  const criteria=checks.map(x=>`<li><span class="${x.checked?'yes':'no'}">${x.checked?'TERVERIFIKASI':'BELUM DICEK'}</span> ${esc(x.parentElement.textContent.trim())}</li>`).join('');
  const w=window.open('','_blank');
  if(!w){const status=document.getElementById('nqCapstoneStatus');if(status){status.textContent='Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.';status.className='msg no'}return}
  try{w.opener=null}catch(e){}
  const project=[['Nama proyek',val('nqProjectName')],['Kebutuhan jaringan',val('nqProjectNeed')],['Topologi',val('nqProjectTopology')],['Perangkat',val('nqProjectDevices')],['Rencana IP',val('nqProjectAddress')],['Segmentasi VLAN',val('nqProjectVlan')],['Keamanan & layanan',val('nqProjectSecurity')],['Rencana pengujian',val('nqProjectTest')]].map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
  w.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Laporan Audit NEXORA TJKT</title><style>body{font:11px/1.5 Arial,sans-serif;color:#172033;margin:28px}h1{font-size:22px;margin:0}h2{font-size:15px;margin:22px 0 8px}p{color:#475569}.meta{margin:5px 0 18px;color:#64748b}table{width:100%;border-collapse:collapse;margin:8px 0 14px}th,td{border:1px solid #cbd5e1;padding:7px;text-align:left;vertical-align:top}th{width:28%;background:#f1f5f9}.score{font-size:28px;font-weight:bold;margin:8px 0}.yes{color:#087443;font-weight:bold}.no{color:#a04b00;font-weight:bold}li{margin:5px 0}.disclaimer{margin-top:20px;padding:10px;background:#f8fafc;border:1px solid #cbd5e1}@media print{body{margin:0}}</style>
<style id="nexora-desktop-layout-final-fix">
/* Final layout correction: keep the desktop sidebar beside the page, never over it. */
@media (min-width: 901px) {
  :root { --navw: 248px !important; }
  body > nav#mainSidebar.topnav {
    position: fixed !important;
    left: 16px !important;
    top: 16px !important;
    bottom: 16px !important;
    right: auto !important;
    width: 220px !important;
    height: auto !important;
    max-height: none !important;
    margin: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    transform: none !important;
    z-index: 120 !important;
  }
  body > header.hud {
    position: sticky !important;
    width: calc(100% - 284px) !important;
    max-width: none !important;
    margin: 14px 24px 0 260px !important;
    box-sizing: border-box !important;
  }
  body > main#mainContent {
    position: relative !important;
    display: block !important;
    width: calc(100% - 284px) !important;
    max-width: none !important;
    min-width: 0 !important;
    margin: 24px 24px 145px 260px !important;
    box-sizing: border-box !important;
  }
  body > footer {
    width: calc(100% - 284px) !important;
    margin: 24px 24px 110px 260px !important;
    box-sizing: border-box !important;
  }
  #mainContent .view,
  #mainContent .view > *,
  #mainContent .card,
  #mainContent .nq-cap-grid,
  #mainContent .nq-cap-grid > * {
    min-width: 0;
    max-width: 100%;
  }
  #capstone .nq-cap-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    align-items: start;
    gap: 16px;
  }
}
@media (min-width: 901px) and (max-width: 1100px) {
  body > main#mainContent { margin-left: 250px !important; width: calc(100% - 274px) !important; }
  body > header.hud { margin-left: 250px !important; width: calc(100% - 274px) !important; }
  body > footer { margin-left: 250px !important; width: calc(100% - 274px) !important; }
}
@media (max-width: 680px) {
  #capstone .nq-cap-grid { grid-template-columns: minmax(0, 1fr) !important; }
}
</style>
<style id="nexora-analytics-heading-render-fix">
#analytics .nq-dashboard-topline h1,
#analytics #analyticsTitle {
  display: block !important;
  min-height: 1.2em;
  overflow: visible !important;
  color: #f4f1ff;
}
#analytics #analyticsTitle .nexora-word {
  background: none !important;
  background-image: none !important;
  -webkit-background-clip: initial !important;
  background-clip: initial !important;
  color: inherit;
}
#analytics #analyticsTitle .grad {
  background: linear-gradient(100deg,#e9dcff 0%,#9fdfff 42%,#c6a1ff 78%,#f1a9de 100%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
}
</style>

<style id="nexora-lenis-style">
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-scrolling iframe { pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  html.lenis, html.lenis body { scroll-behavior: auto !important; }
}
</style>
</head><body><h1>NEXORA TJKT — Laporan Audit & Portofolio</h1><div class="meta">Dibuat: ${esc(new Date().toLocaleString('id-ID'))}</div><div class="score">Skor audit mandiri: ${total}/100</div><p>Skor ini menunjukkan indikator yang dicentang sebagai telah diperiksa. Nilai akhir tetap ditentukan oleh guru setelah demonstrasi dan verifikasi.</p><h2>Rincian lima aspek</h2><table><thead><tr><th>Aspek</th><th>Skor</th><th>Indikator</th><th>Contoh bukti demonstrasi</th></tr></thead><tbody>${rows}</tbody></table><h2>Portofolio proyek akhir</h2><table>${project}</table><h2>Status seluruh indikator</h2><ol>${criteria}</ol><div class="disclaimer">Catatan: akun dan penyimpanan pada versi ini merupakan prototipe lokal di browser. Laporan ini bukan sertifikat resmi dan tidak menjamin nilai tertentu.</div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250))<\/script>
<style id="nexora-logo-integration">
.auth-mark .nexora-logo-symbol{width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 0 10px rgba(50,210,255,.2))}
.auth-mark b{display:none}
.logo .nexora-logo-box{display:grid;place-items:center;width:38px;height:38px;padding:3px;border-radius:11px;background:linear-gradient(145deg,#13263d,#17162f)!important;border:1px solid rgba(91,211,255,.25);box-shadow:0 0 18px rgba(50,210,255,.12)!important;animation:none!important}
.logo .nexora-logo-box img{width:100%;height:100%;object-fit:contain}
.nav-brand-mark{display:grid;place-items:center;overflow:hidden;padding:3px;background:linear-gradient(145deg,#13263d,#17162f)!important;border:1px solid rgba(91,211,255,.25);box-shadow:0 0 18px rgba(50,210,255,.12)!important}
.nav-brand-mark img{width:100%;height:100%;object-fit:contain}
@media(max-width:760px){.logo .nexora-logo-box{width:30px;height:30px;padding:2px}.nav-brand-mark{width:39px;height:39px}}
</style>

</body></html>`);
  w.document.close();
 });
 refresh();
})();
