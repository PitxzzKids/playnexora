
(()=>{
 const $=id=>document.getElementById(id);const STORE='nq_analytics_v1',PREF='nq_display_prefs_v1';
 const safeRead=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch(e){return fallback}};
 const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}};
 const getLog=()=>{const v=safeRead(STORE,{events:[],views:{}});return v&&Array.isArray(v.events)&&v.views&&typeof v.views==='object'?v:{events:[],views:{}}};
 const record=(label,icon='◈')=>{const d=getLog();d.events.unshift({label:String(label).slice(0,90),icon,time:Date.now()});d.events=d.events.slice(0,35);safeWrite(STORE,d);render()};
 const fmt=t=>{try{return new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(t))}catch(e){return 'Baru saja'}};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){const log=getLog(),state=safeRead('nq',{xp:0,got:{}})||{},got=state.got&&typeof state.got==='object'?state.got:{};const xp=Math.max(0,Number(state.xp)||0);const done=Object.keys(got).filter(k=>!!got[k]).length;
  if($('nqaXP'))$('nqaXP').textContent=xp.toLocaleString('id-ID');if($('nqaActivities'))$('nqaActivities').textContent=log.events.length.toLocaleString('id-ID');if($('nqaDone'))$('nqaDone').textContent=done.toLocaleString('id-ID');if($('nqaViews'))$('nqaViews').textContent=Object.keys(log.views).length.toLocaleString('id-ID');
  const box=$('nqaActivityList');if(box)box.innerHTML=log.events.length?log.events.slice(0,12).map(x=>`<div class="nq-activity-item"><span class="nq-activity-icon">${esc(x.icon||'◈')}</span><span><b>${esc(x.label)}</b><small>${fmt(x.time)}</small></span></div>`).join(''):'<p>Belum ada aktivitas tercatat. Mulai dengan membuka materi, misi, atau simulasi.</p>';
 }
 function loadPrefs(){const p=safeRead(PREF,{motion:true,lite:false});const motion=p.motion!==false;if($('nqaMotion'))$('nqaMotion').checked=motion;if($('nqaLite'))$('nqaLite').checked=!!p.lite;document.body.classList.toggle('nq-no-blackhole',!motion);document.body.classList.toggle('nq-lite-effects',!!p.lite)}
 function savePrefs(){const p={motion:!!$('nqaMotion')?.checked,lite:!!$('nqaLite')?.checked};safeWrite(PREF,p);document.body.classList.toggle('nq-no-blackhole',!p.motion);document.body.classList.toggle('nq-lite-effects',p.lite);record('Pengaturan tampilan diperbarui','⚙')}
 document.addEventListener('click',e=>{const nav=e.target.closest('[data-v]');if(nav){const id=nav.dataset.v;if(id&&id!=='analytics'){const d=getLog();d.views[id]=(d.views[id]||0)+1;d.events.unshift({label:'Membuka menu '+(nav.textContent||id).trim().replace(/\s+/g,' ').slice(0,55),icon:'⌂',time:Date.now()});d.events=d.events.slice(0,35);safeWrite(STORE,d)}else if(id==='analytics')record('Membuka Analitik & Pengaturan','◷');}
  const game=e.target.closest('[data-gamepanel]');if(game)record('Membuka panel permainan','🎮');const mission=e.target.closest('[data-mission]');if(mission)record('Memilih misi cerita','◈');const lab=e.target.closest('[data-node]');if(lab)record('Memilih perangkat Virtual Lab','⌘');
 });
 $('nqaMotion')?.addEventListener('change',savePrefs);$('nqaLite')?.addEventListener('change',savePrefs);
 $('nqaClear')?.addEventListener('click',()=>{if(!confirm('Hapus riwayat aktivitas lokal? Progres XP dan misi tidak akan dihapus.'))return;safeWrite(STORE,{events:[],views:{}});render()});
 $('nqaDiagnostics')?.addEventListener('click',()=>{const dup=[];document.querySelectorAll('[id]').forEach(el=>{const id=el.id;if(document.querySelectorAll('#'+CSS.escape(id)).length>1&&!dup.includes(id))dup.push(id)});const nav=[...document.querySelectorAll('.topnav [data-v]')].map(x=>x.dataset.v);const missing=nav.filter(id=>!document.getElementById(id));let storage='tersedia';try{const k='__nq_test__';localStorage.setItem(k,'1');localStorage.removeItem(k)}catch(e){storage='tidak dapat ditulis'}const frames=['cyberShieldFrame','simNetworkFrame'].filter(id=>!$(id));const issues=[];if(dup.length)issues.push('ID ganda: '+dup.join(', '));if(missing.length)issues.push('Menu tanpa halaman: '+missing.join(', '));if(frames.length)issues.push('Frame tidak ditemukan: '+frames.join(', '));if(storage!=='tersedia')issues.push('Penyimpanan browser '+storage);const box=$('nqaDiagnosticsResult');if(box){box.className='nq-diagnostic-result '+(issues.length?'warn':'ok');box.innerHTML=issues.length?'Perlu diperiksa:<br>• '+issues.map(esc).join('<br>'):'✓ Pemeriksaan dasar lulus: ID tidak ganda, semua menu memiliki halaman, frame utama tersedia, dan localStorage dapat ditulis. Progres Learning Studio dipisahkan per akun pada browser ini. Tes ini bukan pengganti pengujian seluruh gameplay.';}});
 const canvas=$('blackholeCanvas');if(canvas){const p=safeRead(PREF,{motion:true});if(p.motion===false)document.body.classList.add('nq-no-blackhole')}
 loadPrefs();render();
 // Keep XP and completion counters fresh when existing game logic updates storage.
 window.addEventListener('storage',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
})();
