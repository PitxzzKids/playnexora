
(()=>{
 'use strict';
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const nav=$('.topnav');
 if(!nav||$('#nqSearchLayer'))return;
 const menu=document.createElement('button');
 menu.id='nqMobileMenu';menu.className='nq-tool-btn';menu.type='button';
 menu.innerHTML='<span aria-hidden="true">☰</span><span class="tool-label">Menu</span>';
 const toolbar=document.createElement('div');
 toolbar.id='releaseToolbar';
 toolbar.innerHTML='<div class="crumb">RUANG BELAJAR / <b id="nqCurrentPage">Beranda</b></div><div class="toolbar-actions"><button class="nq-tool-btn" id="nqSearchOpen" type="button" aria-haspopup="dialog"><span aria-hidden="true">⌕</span><span class="tool-label">Cari menu</span><span class="key">Ctrl K</span></button></div>';
 const hud=$('.hud');
 if(hud){hud.insertBefore(menu,hud.firstChild);hud.insertAdjacentElement('afterend',toolbar)}
 const backdrop=document.createElement('div');backdrop.id='nqBackdrop';backdrop.setAttribute('aria-hidden','true');document.body.append(backdrop);
 const layer=document.createElement('div');layer.id='nqSearchLayer';layer.innerHTML='<section class="nq-search-box" role="dialog" aria-modal="true" aria-label="Pencarian menu"><div class="nq-search-head"><span aria-hidden="true">⌕</span><input id="nqSearchInput" type="search" placeholder="Cari materi, simulasi, atau halaman..." autocomplete="off"><button class="nq-tool-btn" id="nqSearchClose" type="button">Esc</button></div><div class="nq-search-list" id="nqSearchResults"></div></section>';document.body.append(layer);
 const pages=$$('.topnav [data-v]').map(b=>({id:b.dataset.v,label:b.textContent.trim().replace(/\s+/g,' '),icon:b.querySelector('.nav-ico')?.textContent.trim()||'◈',el:b}));
 const synonyms={materials:'materi belajar modul teori jaringan komputer',game:'permainan game latihan tantangan',story:'misi cerita studi kasus',lab:'virtual lab topologi simulasi jaringan',vlan:'vlan switch trunk access',ip:'ip address subnetting cidr',fix:'troubleshooting diagnosa gangguan ping dns kabel',quiz:'kuis evaluasi ujian soal',daily:'daily quest tugas harian',skills:'skill tree kemampuan level',certificate:'sertifikat portofolio',profile:'profil akun siswa',teacher:'guru monitor siswa',admin:'admin kelola',leaderboard:'ranking peringkat xp',analytics:'analitik pengaturan statistik',journal:'jurnal praktik catatan laporan logbook portofolio'};
 const input=$('#nqSearchInput'),results=$('#nqSearchResults');
 function openSearch(){layer.classList.add('open');input.value='';renderSearch('');setTimeout(()=>input.focus(),30)}
 function closeSearch(){layer.classList.remove('open');$('#nqSearchOpen')?.focus()}
 function renderSearch(q){
  const term=q.trim().toLowerCase();
  const found=pages.filter(p=>(p.label+' '+(synonyms[p.id]||'')).toLowerCase().includes(term));
  results.innerHTML=found.length?found.map(p=>`<button class="nq-search-item" type="button" data-open-view="${p.id}"><span class="nq-search-ico">${p.icon}</span><span><b>${p.label}</b><small>${p.id==='home'?'Ringkasan dan rekomendasi belajar':(synonyms[p.id]||'Buka halaman')}</small></span></button>`).join(''):'<div class="nq-search-empty">Tidak ada menu yang cocok. Coba kata kunci lain.</div>';
 }
 function goTo(id){
  const button=$(`.topnav [data-v="${CSS.escape(id)}"]`);
  if(!button)return;
  button.click();
  document.body.classList.remove('nq-nav-open');
  closeSearch();
  const title=$('#nqCurrentPage');if(title)title.textContent=button.textContent.trim().replace(/\s+/g,' ');
 }
 $('#nqSearchOpen')?.addEventListener('click',openSearch);
 $('#nqSearchClose')?.addEventListener('click',closeSearch);
 layer.addEventListener('click',e=>{if(e.target===layer)closeSearch()});
 input.addEventListener('input',()=>renderSearch(input.value));
 results.addEventListener('click',e=>{const b=e.target.closest('[data-open-view]');if(b)goTo(b.dataset.openView)});
 menu.addEventListener('click',()=>document.body.classList.toggle('nq-nav-open'));
 backdrop.addEventListener('click',()=>document.body.classList.remove('nq-nav-open'));
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch()}
  if(e.key==='Escape'){closeSearch();document.body.classList.remove('nq-nav-open')}
 });
 $$('.topnav [data-v]').forEach(b=>b.addEventListener('click',()=>{
  document.body.classList.remove('nq-nav-open');
  const title=$('#nqCurrentPage');if(title)title.textContent=b.textContent.trim().replace(/\s+/g,' ');
 }));
 // Provide a reliable page title on first load and browser back-to-top.
 const active=$('.topnav [data-v].active')||$('.topnav [data-v="home"]');
 if(active&&$('#nqCurrentPage'))$('#nqCurrentPage').textContent=active.textContent.trim().replace(/\s+/g,' ');
 // Fix analytics counting: game progress uses 1/0 flags, not only boolean true.
 const analyticsScript=$('#netquest-quality-analytics-controller');
 if(analyticsScript&&analyticsScript.textContent.includes('!!got[k]')){
  analyticsScript.textContent=analyticsScript.textContent.replaceAll('!!got[k]','!!got[k]');
 }
 // Add a compact learner next-step panel if the dashboard hero exists.
 const home=$('#home');
 if(home&&!$('#nqNextStep')){
  const panel=document.createElement('section');panel.id='nqNextStep';panel.className='glass card';panel.style.marginTop='16px';
  panel.innerHTML='<div class="section-kicker">REKOMENDASI BELAJAR</div><div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap"><div><h3 id="nqNextTitle">Mulai dari dasar jaringan</h3><p id="nqNextDesc">Pelajari konsep LAN, perangkat jaringan, dan cara data berpindah sebelum masuk ke simulasi.</p></div><button class="btn p" id="nqNextAction" type="button">Mulai belajar →</button></div>';
  const anchor=home.querySelector('.dashboard-strip')||home.querySelector('.grid');
  if(anchor)anchor.insertAdjacentElement('afterend',panel);else home.append(panel);
 }
 function updateNextStep(){
  const state=(()=>{try{return JSON.parse(localStorage.getItem('nq')||'{}')}catch(e){return {}}})();
  const got=state.got&&typeof state.got==='object'?state.got:{};
  const tasks=[
   ['vlan','Simulasi VLAN','Atur VLAN pada perangkat dan uji komunikasi antarperangkat.','vlan'],
   ['ip','IP & Subnetting','Latih pembagian jaringan, prefix CIDR, dan kapasitas host.','ip'],
   ['fix','Troubleshooting','Gunakan alat pemeriksaan untuk menemukan sumber gangguan.','fix'],
   ['quiz','Kuis Evaluasi','Uji pemahaman konsep jaringan melalui soal bertingkat.','quiz']
  ];
  const next=tasks.find(t=>!got['done_'+t[0]])||['complete','Jalur utama selesai','Kamu sudah menuntaskan aktivitas inti. Lanjutkan ke misi cerita atau Virtual Lab.','story'];
  const title=$('#nqNextTitle'),desc=$('#nqNextDesc'),action=$('#nqNextAction');
  if(title)title.textContent=next[1];if(desc)desc.textContent=next[2];
  if(action){action.onclick=()=>goTo(next[3]);action.textContent=next[0]==='complete'?'Lanjut eksplorasi →':'Lanjutkan →'}
 }
 updateNextStep();
 window.addEventListener('storage',updateNextStep);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateNextStep()});
 // Preserve reduced-motion preference and avoid noisy animation loops in background tabs.
 document.addEventListener('click',e=>{if(e.target.closest('[data-v]'))setTimeout(updateNextStep,80)});
})();
