
(()=>{
window.netquestCurrentUser=window.netquestCurrentUser||'';
window.netquestCurrentRole=window.netquestCurrentRole||'student';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ic=n=>`<svg class="i"><use href="#i-${n}"/></svg>`;
let mx=innerWidth/2,my=innerHeight/2;
// Kursor desktop yang minimal: satu titik kecil, tanpa lingkaran besar.
addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;$('#cur').style.transform=`translate(${mx}px,${my}px)`;const t=e.target.closest('.glass');if(t){const r=t.getBoundingClientRect();t.style.setProperty('--mx',(mx-r.left)+'px');t.style.setProperty('--my',(my-r.top)+'px')}});
// Efek suara ringan dibuat dengan Web Audio, aktif hanya setelah pengguna menyalakannya.
let soundOn=false,audioCtx=null;
function sfx(kind='tap'){if(!soundOn)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);const now=audioCtx.currentTime;const tones=kind==='success'?[660,880,1040]:kind==='login'?[440,660,880]:kind==='fail'?[300,190]:kind==='tap'?[520]:[520];o.type=kind==='fail'?'triangle':'sine';o.frequency.setValueAtTime(tones[0],now);tones.slice(1).forEach((n,i)=>o.frequency.setValueAtTime(n,now+(i+1)*.085));g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(kind==='fail'?.06:.045,now+.018);g.gain.exponentialRampToValueAtTime(.0001,now+(kind==='fail'?.32:.26));o.start(now);o.stop(now+(kind==='fail'?.33:.27))}catch(e){}}
$('#soundToggle').addEventListener('click',()=>{soundOn=!soundOn;$('#soundToggle').textContent=soundOn?'♫ Suara: Nyala':'♫ Suara: Mati';$('#soundToggle').setAttribute('aria-pressed',String(soundOn));if(soundOn)sfx('success')});
document.addEventListener('click',e=>{const el=e.target.closest('button,[role="button"]');if(el&&!el.matches('[data-q],[data-osi],[data-det],[data-route],[data-mchoice],[data-s]')&&el.id!=='again')sfx('tap')});
// Login selalu muncul saat halaman dibuka; intro tampil sesudah login berhasil.
function runIntroLoading(){
  const bar=document.getElementById('introLoadingBar');
  const pct=document.getElementById('introLoadingPercent');
  const status=document.getElementById('introLoadingStatus');
  const track=bar?.parentElement;
  if(!bar||!pct||!status||!track)return;
  const stages=[
    [0,'MENGHUBUNGKAN MODUL PEMBELAJARAN'],
    [24,'MEMUAT MATERI DAN SIMULASI'],
    [52,'MENYIAPKAN LABORATORIUM JARINGAN'],
    [78,'MENYINKRONKAN PROGRES BELAJAR'],
    [96,'RUANG BELAJAR SIAP']
  ];
  const started=performance.now(),duration=2800;
  let lastStage=-1;
  if(window.__nexoraIntroTimer)clearInterval(window.__nexoraIntroTimer);
  const tick=()=>{
    const progress=Math.min(100,Math.round(((performance.now()-started)/duration)*100));
    bar.style.width=progress+'%';pct.textContent=progress+'%';
    track.setAttribute('aria-valuenow',String(progress));
    let stage=0;for(let i=0;i<stages.length;i++){if(progress>=stages[i][0])stage=i;}
    if(stage!==lastStage){status.textContent=stages[stage][1];lastStage=stage;}
    if(progress>=100){clearInterval(window.__nexoraIntroTimer);window.__nexoraIntroTimer=null;}
  };
  tick();window.__nexoraIntroTimer=setInterval(tick,32);
}

function startNEXORALogin(event){
  if(event){event.preventDefault();}
  syncRoleFields();
  const input=$('#gateName'), error=$('#gateError'), gate=$('#authGate'), intro=$('#introSequence');
  const role=selectedRole('gateRole');
  const name=roleLoginName(role,input?.value);
  if(name.length<2){if(error)error.textContent='Nama minimal 2 karakter ya.';input?.focus();return false;}
  if(!ROLE_PASSWORDS[role]&&isReservedName(name)){if(error)error.textContent=RESERVED_MSG;input?.focus();return false;}
  const pwMsg=passwordError(role,$('#gatePassword'));
  if(pwMsg){if(error)error.textContent=pwMsg;const gp=$('#gatePassword');if(gp){gp.focus();gp.select();}return false;}
  const gpClear=$('#gatePassword');if(gpClear)gpClear.value='';
  try{loadAccount(name,role);setRoleUI(role);draw();}catch(err){console.error('NEXORA login:',err);}
  try{sessionStorage.setItem('nq_session_user',name);}catch(err){/* Tetap izinkan masuk bila penyimpanan browser dibatasi. */}
  if(error)error.textContent='';
  const welcomeName=$('#introStudentName');if(welcomeName)welcomeName.textContent=name.toLocaleUpperCase('id-ID');
  const btn=gate?.querySelector('button[type="submit"]');if(btn){btn.disabled=true;btn.textContent='Menyiapkan ruang belajar…';}
  document.body.classList.add('unlocked');document.body.style.overflowX='hidden';
  if(gate){gate.style.transition='opacity .35s ease, transform .35s ease';gate.style.opacity='0';gate.style.transform='scale(.985)';}
  soundOn=true;const sound=$('#soundToggle');if(sound){sound.textContent='♫ Suara: Nyala';sound.setAttribute('aria-pressed','true');}sfx('login');
  window.setTimeout(()=>{if(gate)gate.style.display='none';if(intro){intro.style.display='grid';intro.classList.add('play');runIntroLoading();}sfx('success');},380);
  const enterHome=()=>{if(intro){intro.classList.remove('play','intro-exit');intro.style.display='none';}if(gate)gate.style.display='none';document.body.classList.add('unlocked');go('home');updateSession();};
  window.setTimeout(()=>{if(intro)intro.classList.add('intro-exit');window.setTimeout(enterHome,700);},3500);
  // Failsafe: pastikan overlay tidak tertinggal jika animasi browser gagal.
  window.setTimeout(enterHome,5200);
  return false;
}

window.startNEXORALogin=startNEXORALogin;

/* ===== Login Siswa / Guru / Admin: akun lokal ===== */
const ROLEKEY='nq_role';
const roleNames={student:'Siswa',teacher:'Guru',admin:'Admin'};
const roleIcons={student:'🎓',teacher:'👨‍🏫',admin:'⚙️'};
function selectedRole(group){return document.querySelector(`input[name="${group}"]:checked`)?.value||'student'}
/* Password Guru & Admin. Siswa tidak memakai password.
   Catatan: ini pengaman sisi-browser untuk demo sekolah (password terlihat di source). Ganti nilainya di sini. */
const ROLE_PASSWORDS={teacher:'guru123',admin:'admin123'};
function passwordError(role,input){
  const need=ROLE_PASSWORDS[role];if(!need)return'';
  const v=input?input.value.trim():'';
  if(!v)return 'Password '+roleNames[role]+' wajib diisi.';
  return v===need?'':'Password '+roleNames[role]+' salah.';
}
/* Guru & Admin tidak mengisi nama: namanya otomatis "Guru" / "Admin". */
function roleLoginName(role,typed){return ROLE_PASSWORDS[role]?roleNames[role]:String(typed||'').trim()}
function isReservedName(n){const k=String(n||'').trim().toLowerCase();return Object.keys(ROLE_PASSWORDS).some(r=>roleNames[r].toLowerCase()===k)}
const RESERVED_MSG='Nama "Guru" dan "Admin" dipakai untuk peran masing-masing. Gunakan nama lain.';
const roleSyncs=[];
function syncRoleFields(){roleSyncs.forEach(f=>f())}
function bindRolePassword(group,boxId,inputId,nameId){
  const box=$('#'+boxId),input=$('#'+inputId);if(!box||!input)return;
  const sync=()=>{const need=!!ROLE_PASSWORDS[selectedRole(group)];box.style.display=need?'flex':'none';if(!need)input.value='';
    const nm=nameId&&$('#'+nameId);if(nm){const fld=nm.closest('.field');if(fld)fld.style.display=need?'none':'flex';nm.required=!need}};
  $$(`input[name="${group}"]`).forEach(r=>{r.addEventListener('change',sync);r.addEventListener('click',sync)});roleSyncs.push(sync);sync();
}
function currentRole(){try{return localStorage.getItem(ROLEKEY)||window.netquestCurrentRole||'student'}catch(e){return window.netquestCurrentRole||'student'}}
function accountKey(name){return 'nq_account_'+String(name).toLowerCase().replace(/[^a-z0-9]+/gi,'_').slice(0,40)}
function getAccounts(){try{return JSON.parse(localStorage.getItem('nq_accounts')||'{}')}catch(e){return{}}}
function saveAccounts(a){try{localStorage.setItem('nq_accounts',JSON.stringify(a))}catch(e){}}
function userRankFromXP(xp){return ([...ranks].reverse().find(r=>xp>=r[0])||ranks[0])[1]}
function esc(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function saveCurrentAccount(){
 let name=String(window.netquestCurrentUser||'');try{name=localStorage.getItem('nq_demo_user')||name}catch(e){}
 if(!name)return;const a=getAccounts(),key=accountKey(name),old=a[key]||{};let school=old.school||'';
 try{school=localStorage.getItem('nq_school')||school}catch(e){}
 a[key]={name,role:currentRole(),school,xp:Number(st?.xp||0),got:st?.got||{},updatedAt:Date.now()};saveAccounts(a);
}
function loadAccount(name,role){
 window.netquestCurrentUser=String(name||'');window.netquestCurrentRole=role||'student';
 const a=getAccounts(),saved=a[accountKey(name)];
 try{localStorage.setItem('nq_demo_user',name);localStorage.setItem(ROLEKEY,role)}catch(e){}
 if(saved){st={xp:Number(saved.xp)||0,got:saved.got&&typeof saved.got==='object'?saved.got:{}};if(saved.school)try{localStorage.setItem('nq_school',saved.school)}catch(e){}}
 else st={xp:0,got:{}};
 const b=getAccounts();b[accountKey(name)]={name,role,school:(saved&&saved.school)||'',xp:Number(st.xp)||0,got:st.got||{},updatedAt:Date.now()};saveAccounts(b);
 try{localStorage.setItem('nq',JSON.stringify(st))}catch(e){}
 window.dispatchEvent(new Event('netquest:account-changed'));
}
function setRoleUI(role){
 const badge=$('#roleBadge');if(badge){badge.className='role-badge '+role;badge.textContent=roleIcons[role]+' '+roleNames[role]}
 $$('[data-role-nav]').forEach(b=>b.style.display=b.dataset.roleNav===role?'flex':'none');
}
function switchAccount(name,role){saveCurrentAccount();loadAccount(name,role);setRoleUI(role);draw();refreshPremiumUI()}
function studentAccounts(){return Object.values(getAccounts()).filter(a=>a.role==='student')}
function renderTeacherDashboard(){
 const rows=$('#teacherStudentRows');if(!rows)return;const users=studentAccounts().sort((a,b)=>(b.xp||0)-(a.xp||0));
 $('#teacherTotalStudents').textContent=users.length;const top=users.reduce((m,u)=>Math.max(m,Number(u.xp)||0),0),avg=users.length?Math.round(users.reduce((s,u)=>s+(Number(u.xp)||0),0)/users.length):0;
 $('#teacherTopXP').textContent=top+' XP';$('#teacherAvgXP').textContent=avg+' XP';
 rows.innerHTML=users.length?users.map(u=>`<tr><td><b>${esc(u.name)}</b><br><small>${esc(u.school||'Sekolah belum diisi')}</small></td><td>${userRankFromXP(Number(u.xp)||0)}</td><td><b>${Number(u.xp)||0} XP</b></td><td>${Object.keys(u.got||{}).length} aktivitas</td><td><button class="btn" data-teacher-view="${esc(u.name)}">Lihat</button></td></tr>`).join(''):`<tr><td colspan="5">Belum ada akun siswa pada perangkat ini.</td></tr>`;
}
const adminDefaultQuests=[{title:'Uji koneksi di Virtual Lab',xp:20},{title:'Selesaikan kuis materi',xp:15},{title:'Selesaikan misi cerita',xp:20}];
let adminQuests=(()=>{try{const q=JSON.parse(localStorage.getItem('nq_admin_quests')||'null');return Array.isArray(q)&&q.length?q:adminDefaultQuests.slice()}catch(e){return adminDefaultQuests.slice()}})() ;
function saveAdminQuests(){try{localStorage.setItem('nq_admin_quests',JSON.stringify(adminQuests))}catch(e){}}

$('#refreshTeacher')?.addEventListener('click',renderTeacherDashboard);
$('#adminRefresh')?.addEventListener('click',renderAdminCenter);
$('#adminAddQuest')?.addEventListener('click',()=>{
 const title=$('#adminQuestTitle').value.trim();if(!title){$('#adminFeedback').className='msg no';$('#adminFeedback').textContent='Masukkan nama quest terlebih dahulu.';return}
 adminQuests.push({title,xp:20});saveAdminQuests();$('#adminQuestTitle').value='';renderAdminCenter();$('#adminFeedback').className='msg ok';$('#adminFeedback').textContent='Quest berhasil ditambahkan.';
});
$('#adminResetQuest')?.addEventListener('click',()=>{adminQuests=adminDefaultQuests.slice();saveAdminQuests();renderAdminCenter()});
$('#adminResetCurrent')?.addEventListener('click',()=>{
 if(confirm('Reset XP dan achievement akun admin saat ini?')){st={xp:0,got:{}};saveCurrentAccount();draw();renderAdminCenter();$('#adminFeedback').className='msg ok';$('#adminFeedback').textContent='Progress akun saat ini berhasil direset.'}
});
document.addEventListener('click',e=>{
 const tv=e.target.closest('[data-teacher-view]');
 if(tv){const a=getAccounts()[accountKey(tv.dataset.teacherView)];if(a)$('#teacherFeedback').textContent=`${a.name}: ${a.xp||0} XP · ${userRankFromXP(a.xp||0)} · ${Object.keys(a.got||{}).length} aktivitas tercatat.`}
 const del=e.target.closest('[data-admin-delete]');
 if(del&&currentRole()==='admin'){const name=del.dataset.adminDelete;if(confirm('Hapus akun '+name+' dan progress lokalnya?')){const a=getAccounts();delete a[accountKey(name)];saveAccounts(a);renderAdminCenter();renderTeacherDashboard();}}
 const rem=e.target.closest('[data-admin-remove]');
 if(rem&&currentRole()==='admin'){adminQuests.splice(Number(rem.dataset.adminRemove),1);saveAdminQuests();renderAdminCenter();}
});
const oldGoRole=go;
go=function(v){if(v==='teacher'&&currentRole()!=='teacher'){oldGoRole('home');return}if(v==='admin'&&currentRole()!=='admin'){oldGoRole('home');return}oldGoRole(v);if(v==='teacher')renderTeacherDashboard();if(v==='admin')renderAdminCenter();};
window.addEventListener('beforeunload',saveCurrentAccount);window.addEventListener('pagehide',saveCurrentAccount);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveCurrentAccount()});

function renderAdminCenter(){
 const users=Object.values(getAccounts());$('#adminTotalUsers').textContent=users.length;$('#adminQuestCount').textContent=adminQuests.length;$('#adminAchievementCount').textContent=achievementDefs.length;
 const ul=$('#adminUserList');if(ul)ul.innerHTML=users.length?users.map(u=>`<div class="admin-row"><span><b>${esc(u.name)}</b><small>${roleIcons[u.role]||''} ${roleNames[u.role]||u.role} · ${Number(u.xp)||0} XP</small></span><button class="btn" data-admin-delete="${esc(u.name)}">Hapus</button></div>`).join(''):`<div class="msg">Belum ada akun.</div>`;
 const ql=$('#adminQuestList');if(ql)ql.innerHTML=adminQuests.map((q,i)=>`<div class="admin-row"><span><b>${esc(q.title)}</b><small>Quest demo · ${q.xp} XP</small></span><button class="btn" data-admin-remove="${i}">Hapus</button></div>`).join('');
}

$('#gateForm').addEventListener('submit',startNEXORALogin);

// XP
let st={xp:0,got:{}};try{const saved=JSON.parse(localStorage.getItem('nq')||'null');if(saved&&typeof saved==='object'){st={xp:Number.isFinite(Number(saved.xp))?Math.max(0,Number(saved.xp)):0,got:saved.got&&typeof saved.got==='object'?saved.got:{}}}}catch(e){}
const ranks=[[0,'Newbie'],[40,'Teknisi Junior'],[90,'Network Admin'],[150,'NetOps Pro'],[220,'Net Master'],[320,'Legenda Jaringan']];
function draw(){const idx=[...ranks].reverse().findIndex(x=>st.xp>=x[0]);const r=[...ranks].reverse()[idx]||ranks[0];const next=ranks.find(x=>x[0]>st.xp);const base=r[0],span=next?next[0]-base:1;$('#rank').textContent=r[1];$('#xpt').textContent=st.xp+' XP';$('#xpb').style.width=(next?Math.max(0,Math.min(100,(st.xp-base)/span*100)):100)+'%';['vlan','ip','fix','quiz'].forEach(k=>{const item=$('#m-'+k);if(item)item.classList.toggle('ok',!!st.got['done_'+k])});if(window.premiumReady&&typeof refreshPremiumUI==='function')refreshPremiumUI()}
function gain(key,n,x=mx,y=my){if(st.got[key])return;st.got[key]=1;st.xp+=n;try{localStorage.setItem('nq',JSON.stringify(st))}catch(e){}saveCurrentAccount();draw();const f=document.createElement('div');f.className='fx';f.textContent='+'+n+' XP';f.style.left=x+'px';f.style.top=y+'px';document.body.appendChild(f);setTimeout(()=>f.remove(),1200)}
window.netquestAwardCyberShield=function(){if(st.got.game_cybershield)return false;gain('game_cybershield',25);return true};
window.netquestAwardSimNetwork=function(){if(st.got.game_simnetwork)return false;gain('game_simnetwork',60);return true};
window.netquestAwardTJKTQuest=function(){if(st.got.game_tjktquest)return false;gain('game_tjktquest',20);return true};
window.netquestTJKTQuestRewarded=function(){return !!st.got.game_tjktquest};
draw();
// navigasi
function go(v){
  const target=$$('.view').find(s=>s.id===v);
  if(!target)return;
  $$('.view').forEach(s=>{s.classList.remove('on','nq-view-enter');if(s!==target)s.setAttribute('aria-hidden','true')});
  $$('.topnav [data-v]').forEach(b=>b.classList.toggle('active',b.dataset.v===v));
  target.removeAttribute('aria-hidden');
  target.classList.add('on');
  /* Force a fresh animation on every navigation, including returning to a page. */
  void target.offsetWidth;
  target.classList.add('nq-view-enter');
  target.addEventListener('animationend',()=>target.classList.remove('nq-view-enter'),{once:true});
  if(window.nexoraLenis){window.nexoraLenis.scrollTo(0,{duration:0.85});}else{scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b)go(b.dataset.v)});
const sessionBtn=$('#sessionBtn'),loginNav=$('#loginNav');
function updateSession(){let u=String(window.netquestCurrentUser||'');try{u=localStorage.getItem('nq_demo_user')||u}catch(e){}sessionBtn.textContent=u?('Hai, '+u.slice(0,12)):'Login';sessionBtn.dataset.v=u?'home':'login';loginNav.textContent=u?'Beranda pengguna':'Masuk / Login';}
updateSession();
$('#loginForm').addEventListener('submit',e=>{
 e.preventDefault();syncRoleFields();
 const role=selectedRole('loginRole'),name=roleLoginName(role,$('#loginName').value),err=$('#loginError');
 if(name.length<2){err.textContent='Nama minimal 2 karakter ya.';return}
 if(!ROLE_PASSWORDS[role]&&isReservedName(name)){err.textContent=RESERVED_MSG;return}
 const pwMsg=passwordError(role,$('#loginPassword'));
 if(pwMsg){err.textContent=pwMsg;const lp=$('#loginPassword');if(lp){lp.focus();lp.select();}return}
 const lpClear=$('#loginPassword');if(lpClear)lpClear.value='';
 switchAccount(name,role);err.textContent='';updateSession();go(role==='teacher'?'teacher':role==='admin'?'admin':'home');
 const note=document.createElement('div');note.className='msg ok';note.style.marginTop='16px';
 note.innerHTML='<b>Berhasil masuk sebagai '+roleNames[role]+', '+esc(name)+'!</b> Progress akun dipulihkan dari browser ini.';
 $('#home').prepend(note);setTimeout(()=>note.remove(),5000);
});
bindRolePassword('gateRole','gatePassBox','gatePassword','gateName');bindRolePassword('loginRole','loginPassBox','loginPassword','loginName');
window.addEventListener('pageshow',syncRoleFields);window.addEventListener('load',syncRoleFields);
// terminal hero
const lines=['$ ping 192.168.10.1','Reply: time=1ms','$ show vlan brief','10 GURU   aktif','20 SISWA  aktif','30 SERVER aktif','$ semua jaringan OK'];let li=0,ci=0,buf='';
const heroTerm=$('#heroTerm');if(heroTerm)setInterval(()=>{const L=lines[li];if(ci<L.length){buf+=L[ci++]}else if(ci++>L.length+6){buf+='\n';li++;ci=0;if(li>=lines.length){li=0;buf=''}}heroTerm.textContent=buf},70);
// VLAN — pemilihan pengirim/tujuan eksplisit agar alur klik tidak ambigu.
const H=[['PC Guru','laptop',10],['PC Siswa','monitor',20],['PC Lab','monitor',20],['Server','server',30]];
let src=null,dst=null,l3=false,selectionMode='source';
function renderVlanSelection(){
  $('#vlanPickSource')?.classList.toggle('p',selectionMode==='source');
  $('#vlanPickTarget')?.classList.toggle('p',selectionMode==='target');
  $('#vlanPickSource')?.setAttribute('aria-pressed',String(selectionMode==='source'));
  $('#vlanPickTarget')?.setAttribute('aria-pressed',String(selectionMode==='target'));
  $('#vlanSelectionStatus').textContent='Mode aktif: pilih perangkat '+(selectionMode==='source'?'pengirim.':'tujuan.');
  $('#vlanSourceName').textContent=src===null?'Belum dipilih':H[src][0]+' · VLAN '+H[src][2];
  $('#vlanTargetName').textContent=dst===null?'Belum dipilih':H[dst][0]+' · VLAN '+H[dst][2];
}
function hosts(){$('#hosts').innerHTML=H.map((h,i)=>`<div class="host ${i===src?'sel':i===dst?'dst':''}" data-i="${i}" role="button" tabindex="0" aria-label="${h[0]}, VLAN ${h[2]}" aria-pressed="${i===src||i===dst}"><div class="ic">${ic(h[1])}</div><small>${h[0]}</small><br><button type="button" class="tag v${h[2]}" data-c="${i}" aria-label="Ubah VLAN ${h[0]}">VLAN ${h[2]}</button></div>`).join('');renderVlanSelection()}
hosts();
$('#vlanPickSource').addEventListener('click',()=>{selectionMode='source';renderVlanSelection()});
$('#vlanPickTarget').addEventListener('click',()=>{selectionMode='target';renderVlanSelection()});
function selectVlanHost(i){if(selectionMode==='source'){src=i;if(dst===src)dst=null;}else{dst=i;if(src===dst)src=null;}hosts()}
$('#hosts').addEventListener('click',e=>{const c=e.target.closest('[data-c]');if(c){const h=H[+c.dataset.c];h[2]=h[2]===30?10:h[2]+10;hosts();return}const k=e.target.closest('.host');if(k)selectVlanHost(+k.dataset.i)});
$('#hosts').addEventListener('keydown',e=>{const k=e.target.closest('.host');if(k&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectVlanHost(+k.dataset.i)}});
$('#l3').onclick=function(){l3=!l3;this.classList.toggle('on',l3);this.setAttribute('aria-pressed',String(l3));$('#l3Status').textContent=l3?'Aktif':'Mati';};
$('#vlanReset').addEventListener('click',()=>{H[0][2]=10;H[1][2]=20;H[2][2]=20;H[3][2]=30;src=null;dst=null;l3=false;selectionMode='source';$('#l3').classList.remove('on');$('#l3').setAttribute('aria-pressed','false');$('#l3Status').textContent='Mati';$('#vmsg').className='msg';$('#vmsg').textContent='Simulasi direset. Pilih pengirim dan tujuan.';hosts();});
function center(el,p){const a=el.getBoundingClientRect(),b=p.getBoundingClientRect();return[a.left-b.left+a.width/2-9,a.top-b.top+a.height/2-9]}
$('#send').onclick=()=>{if(src===null||dst===null||src===dst){$('#vmsg').className='msg no';$('#vmsg').textContent='Pilih satu pengirim dan satu tujuan yang berbeda.';return}
const s=H[src],d=H[dst],same=s[2]===d[2],ok=same||l3,stg=$('#stage'),el=$$('.host'),a=center(el[src],stg),m=center($('#sw'),stg),b=center(el[dst],stg),p=$('#pkt');
const kf=ok?[a,m,b]:[a,m];p.animate(kf.map((c,i)=>({transform:`translate(${c[0]}px,${c[1]}px) scale(${i===kf.length-1&&!ok?.2:1})`,opacity:1})),{duration:1300,easing:'ease-in-out',fill:'forwards'}).finished.then(()=>{p.animate([{opacity:1},{opacity:0}],{duration:300,fill:'forwards'});if(!ok){$('#sw').classList.add('bad');setTimeout(()=>$('#sw').classList.remove('bad'),600)}}).catch(()=>{});
setTimeout(()=>{$('#vmsg').className='msg '+(ok?'ok':'no');$('#vmsg').textContent=ok?(same?`Terkirim: ${s[0]} dan ${d[0]} berada pada VLAN ${s[2]}.`:`Terkirim melalui Inter-VLAN Routing Layer 3 dari VLAN ${s[2]} ke VLAN ${d[2]}.`):`Paket ditolak: VLAN ${s[2]} dan VLAN ${d[2]} berbeda, sedangkan routing Layer 3 belum aktif.`;
if(ok&&same)gain('v1',15);if(!ok)gain('v2',10);if(ok&&!same){gain('v3',20);gain('done_vlan',10)}},1300)};
// Subnet
const toInt=s=>{const b=s.trim().split('.');return b.length===4&&b.every(x=>/^\d+$/.test(x)&&+x<256)?b.reduce((a,x)=>a*256+ +x,0)>>>0:null},toIp=n=>[n>>>24,n>>>16&255,n>>>8&255,n&255].join('.');
$('#bits').innerHTML=Array.from({length:4},()=>'<div class="oct">'+'<i></i>'.repeat(8)+'</div>').join('');
function sub(){const p=+$('#pre').value,n=toInt($('#ipin').value);$('#prel').textContent='/'+p;$$('#bits i').forEach((b,i)=>{b.className=i<p?'':'h';b.textContent=i<p?'N':'H'});if(n===null){$('#stats').innerHTML='<div class="stat" style="grid-column:1/3"><small>Error</small><b>Isi 4 angka 0–255 dipisah titik.</b></div>';return}
const mask=(0xffffffff<<(32-p))>>>0,net=(n&mask)>>>0,bc=(net|~mask)>>>0,u=Math.pow(2,32-p)-2,S=[['Network',toIp(net)],['Broadcast',toIp(bc)],['Mask',toIp(mask)],['Host usable',u.toLocaleString('id-ID')],['Host pertama',toIp(net+1)],['Host terakhir',toIp(bc-1)]];$('#stats').innerHTML=S.map(x=>`<div class="stat"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}
$('#pre').oninput=()=>{sub();gain('s1',10)};$('#ipin').oninput=sub;sub();
$('#chk').onclick=()=>{const a=+$('#ans').value,ok=a===26;$('#imsg').className='msg '+(ok?'ok':'no');$('#imsg').innerHTML=ok?'<b>Tepat.</b> /26 memberi 62 host usable, cukup untuk 50 dan masih ada ruang tumbuh.':a>26?`<b>Terlalu kecil.</b> /${a} hanya menyediakan ${Math.max(0,Math.pow(2,32-a)-2)} host.`:'<b>Belum optimal.</b> Muat, tetapi memboroskan alamat. Coba prefix yang lebih besar.';if(ok){gain('s2',25);gain('done_ip',10)}};
// Diagnosa
const T=[{n:'PC pindah port, ping gateway gagal',b:'Setelah dipindah ke port switch lain, link menyala tetapi gateway tidak terjangkau.',o:['Port masuk VLAN yang salah','DNS server mati','Bandwidth penuh'],c:0,pr:['Link UP 1 Gbps full duplex. Kabel sehat.','IP 192.168.20.34/24\nGateway 192.168.20.1\nIP terlihat benar.','Ping gateway: Request timed out\nHost lain di VLAN sama: tidak terlihat.','Tidak relevan: ping memakai alamat IP.']},
{n:'Ping IP berhasil, nama domain gagal',b:'Client bisa ping 198.51.100.25 tetapi browser gagal membuka nama situs.',o:['Kabel putus','Resolver DNS bermasalah','Trunk VLAN rusak'],c:1,pr:['Link UP, tidak ada error.','IP, mask, dan gateway benar.','Ping 198.51.100.25: reply 12 ms','dig example.test\nconnection timed out ke resolver.\nPeriksa IP DNS dan port 53.']},
{n:'Bisa akses lokal, tidak bisa antar-subnet',b:'Client mengakses perangkat satu subnet, tetapi semua subnet lain gagal.',o:['Gateway salah atau rute balik hilang','Monitor rusak','Kabel terlalu panjang'],c:0,pr:['Link UP, counter error normal.','IP dan mask sesuai.\nGateway 192.168.10.254, padahal router di .1','Ke subnet lain: Destination unreachable\nKe sesama subnet: reply','Uji memakai IP juga gagal, bukan masalah nama.']}];
let ti=0;$('#tk').innerHTML=T.map((t,i)=>`<option value="${i}">${t.n}</option>`).join('');
function tick(){const t=T[ti];$('#brief').textContent=t.b;$('#dx').innerHTML=t.o.map((o,i)=>`<button class="opt" data-a="${i}">${o}</button>`).join('');$('#dmsg').innerHTML='';type('$ pilih alat uji...')}
let tm;function type(s){clearInterval(tm);let i=0;$('#out').textContent='';tm=setInterval(()=>{$('#out').textContent=s.slice(0,++i);if(i>=s.length)clearInterval(tm)},18)}
$('#tk').onchange=e=>{ti=+e.target.value;tick()};
document.addEventListener('click',e=>{const p=e.target.closest('[data-p]');if(p){type('$ '+p.textContent.toLowerCase()+'\n'+T[ti].pr[+p.dataset.p]);gain('p'+ti,5)}
const a=e.target.closest('[data-a]');if(a){const ok=+a.dataset.a===T[ti].c;a.classList.add(ok?'right':'wrong');$('#dmsg').innerHTML=`<div class="msg ${ok?'ok':'no'}">${ok?'<b>Benar.</b> Jalankan perbaikan, uji ulang, lalu dokumentasikan.':'<b>Belum sesuai bukti.</b> Jalankan alat uji dan cocokkan hasilnya.'}</div>`;if(ok){gain('f'+ti,20);if(['f0','f1','f2'].every(k=>st.got[k]))gain('done_fix',10)}}});
tick();
// Kuis
const Q=[["Fungsi utama VLAN adalah...",["Memisahkan broadcast domain secara logis","Menambah kecepatan internet","Menggantikan firewall"],0],["Host beda VLAN perlu berkomunikasi. Yang dibutuhkan...",["Hub tambahan","Perangkat Layer 3 dengan routing","Kabel lebih pendek"],1],["Prefix /26 memiliki berapa alamat IPv4 total?",["32","64","128"],1],["Ping ke IP berhasil tetapi nama domain gagal. Periksa...",["Konfigurasi DNS","Daya switch","Warna kabel"],0],["PAT/NAT pada router berfungsi untuk...",["Membuat VLAN","Menerjemahkan alamat privat ke publik","Mempercepat DNS"],1],["Langkah troubleshooting yang paling tepat...",["Ubah banyak setting sekaligus","Kumpulkan bukti, uji hipotesis, perbaiki, verifikasi","Langsung ganti semua perangkat"],1],["Perangkat yang meneruskan frame berdasarkan MAC address adalah...",["Switch","Router","Modem"],0],["Alamat IPv4 memiliki panjang...",["16 bit","32 bit","64 bit"],1],["Alamat MAC umumnya memiliki panjang...",["32 bit","48 bit","128 bit"],1],["Perintah Windows untuk melihat konfigurasi IP adalah...",["ipconfig","mkdir","format"],0],["Perintah untuk menguji keterjangkauan host adalah...",["ping","copy","tasklist"],0],["Subnet mask untuk prefix /24 adalah...",["255.255.0.0","255.255.255.0","255.255.255.252"],1],["Port default HTTP adalah...",["21","80","443"],1],["Port default HTTPS adalah...",["25","110","443"],2],["DHCP digunakan untuk...",["Memberikan konfigurasi IP secara otomatis","Mengenkripsi semua trafik","Membuat kabel jaringan"],0],["DNS bertugas untuk...",["Mengubah nama domain menjadi alamat IP","Mengisi daya router","Mengatur kecepatan kipas"],0],["Kabel straight-through biasanya digunakan untuk menghubungkan...",["Perangkat berbeda jenis, misalnya PC ke switch","Dua PC langsung pada perangkat lama tanpa auto MDI-X","Dua konektor listrik"],0],["Jika lampu link switch mati, pemeriksaan awal yang masuk akal adalah...",["Periksa kabel, port, dan daya perangkat","Ubah wallpaper PC","Hapus browser"],0],["Default gateway adalah...",["Alamat perangkat yang menjadi jalan keluar ke jaringan lain","Nama Wi-Fi","Nomor seri keyboard"],0],["Prinsip keamanan akun yang baik adalah...",["Gunakan satu password untuk semua akun","Bagikan password ke teman","Gunakan password kuat dan jangan dibagikan"],2]]
let qi=0,sc=0,sk=0;
function q(){if(qi>=Q.length){const pct=Math.round(sc/Q.length*100);$('#qbox').innerHTML=`<div style="text-align:center;padding:30px 0"><div style="font-size:64px;color:var(--c1)">${ic(pct>=80?'trophy':pct>=50?'thumb':'book')}</div><h2>Skor ${sc} dari ${Q.length}</h2><p>${pct>=80?'Mantap, kamu siap praktik di lab.':pct>=50?'Cukup baik. Ulangi misi yang masih ragu.':'Pelajari lagi lewat simulasi, lalu coba ulang.'}</p><div class="row" style="justify-content:center"><button class="btn p" id="again">Ulangi kuis</button></div></div>`;$('#qb').style.width='100%';gain('done_quiz',20);return}
$('#qn').textContent=`Soal ${qi+1} dari ${Q.length}`;$('#qs').textContent='Streak '+sk;$('#qb').style.width=qi/Q.length*100+'%';const x=Q[qi];$('#qbox').innerHTML=`<h3 style="margin-top:20px;font-size:20px">${x[0]}</h3><div class="opts">${x[1].map((o,i)=>`<button class="opt" data-q="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}</div>`}
document.addEventListener('click',e=>{if(e.target.id==='again'){qi=sc=sk=0;q();return}const b=e.target.closest('[data-q]');if(!b||b.parentNode.dataset.l)return;b.parentNode.dataset.l=1;const ok=+b.dataset.q===Q[qi][2];b.classList.add(ok?'right':'wrong');if(!ok)b.parentNode.children[Q[qi][2]].classList.add('right');if(ok){sfx('success');sc++;sk++;gain('q'+qi,8+(sk>2?4:0),e.clientX,e.clientY)}else{sfx('fail');sk=0}$('#qs').textContent='Streak '+sk;const fb=document.createElement('p');fb.style.cssText='margin:14px 0 0;color:var(--mut);font-size:14px';fb.textContent=ok?'Benar! Bagus, lanjutkan.':'Belum tepat. Jawaban yang benar ditandai warna hijau.';b.parentNode.appendChild(fb);setTimeout(()=>{qi++;q()},1350)});
q();
// Arena Game
function boom(){const cs=['#22e1ff','#8b6cff','#3dffb0','#ffb454','#ff5d7a'];for(let i=0;i<36;i++){const d=document.createElement('i');d.className='cf';d.style.background=cs[i%5];d.style.left=innerWidth/2+'px';d.style.top=innerHeight/2.5+'px';document.body.appendChild(d);const a=Math.random()*6.28,v=140+Math.random()*260;d.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*v}px,${Math.sin(a)*v+160}px) rotate(${Math.random()*720}deg)`,opacity:0}],{duration:1300+Math.random()*600,easing:'cubic-bezier(.2,.8,.4,1)'}).finished.then(()=>d.remove())}}
$$('[data-g]').forEach(b=>b.onclick=()=>{$$('[data-g]').forEach(x=>x.classList.toggle('p',x===b));$$('.gp').forEach(p=>p.classList.toggle('on',p.id===b.dataset.g))});
const W=[['Putih-Oranye','#ff9a3c',1],['Oranye','#ff9a3c',0],['Putih-Hijau','#2fcf6b',1],['Biru','#3b82f6',0],['Putih-Biru','#3b82f6',1],['Hijau','#2fcf6b',0],['Putih-Cokelat','#a0693b',1],['Cokelat','#a0693b',0]];
const wc=w=>w[2]?`repeating-linear-gradient(135deg,#fff 0 5px,${w[1]} 5px 10px)`:w[1];
let ck=0,ct=0,ctm;
function cable(){clearInterval(ctm);ck=0;ct=0;$('#ctime').textContent='0.0 s';$('#cslots').innerHTML=W.map((w,i)=>`<div class="slot"><small>${i+1}</small></div>`).join('');const o=W.map((w,i)=>i).sort(()=>Math.random()-.5);$('#cpool').innerHTML=o.map(i=>`<button class="wire" data-w="${i}"><i style="background:${wc(W[i])}"></i><small>${W[i][0]}</small></button>`).join('');$('#cmsg').className='msg';$('#cmsg').textContent='Mulai dari pin 1: Putih-Oranye.'}
$('#cpool').addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(!b)return;if(!ck&&!ctm){const t0=performance.now();ctm=setInterval(()=>{ct=(performance.now()-t0)/1000;$('#ctime').textContent=ct.toFixed(1)+' s'},100)}
if(+b.dataset.w===ck){const s=$$('#cslots .slot')[ck];s.insertAdjacentHTML('afterbegin',`<i style="background:${wc(W[ck])}"></i>`);s.classList.add('fill');b.classList.add('gone');ck++;if(ck===8){clearInterval(ctm);ctm=0;$('#cmsg').className='msg ok';$('#cmsg').innerHTML=`<b>Selesai dalam ${ct.toFixed(1)} detik.</b> Kabel straight T568B siap di-crimping.`;boom();gain('g1',25)}}else{b.classList.add('shake');setTimeout(()=>b.classList.remove('shake'),400);$('#cmsg').className='msg no';$('#cmsg').textContent='Urutan belum tepat. Cek pin berikutnya.'}});
$('#cre').onclick=()=>{ctm=0;cable()};cable();
const P=[['80','HTTP'],['443','HTTPS'],['22','SSH'],['53','DNS'],['21','FTP'],['25','SMTP']];
let fl=[],mv=0,mt=0,lock=false;
function mem(){fl=[];mv=0;mt=0;lock=false;const c=P.flatMap((p,i)=>[[i,p[0],'port'],[i,p[1],'layanan']]).sort(()=>Math.random()-.5);$('#mgrid').innerHTML=c.map(x=>`<button class="fc" data-k="${x[0]}"><span class="fi"><b class="ff">${ic('plug')}</b><b class="fb ${x[2]}">${x[1]}</b></span></button>`).join('');$('#mmv').textContent='0 langkah';$('#mmsg').className='msg';$('#mmsg').textContent='Cocokkan nomor port dengan layanannya.'}
$('#mgrid').addEventListener('click',e=>{const c=e.target.closest('.fc');if(!c||lock||c.classList.contains('open')||c.classList.contains('hit'))return;c.classList.add('open');fl.push(c);if(fl.length===2){mv++;$('#mmv').textContent=mv+' langkah';const[a,b]=fl;if(a.dataset.k===b.dataset.k){a.classList.add('hit');b.classList.add('hit');fl=[];if(++mt===P.length){$('#mmsg').className='msg ok';$('#mmsg').innerHTML=`<b>Semua pasangan ketemu dalam ${mv} langkah.</b>`;boom();gain('g2',25)}}else{lock=true;setTimeout(()=>{a.classList.remove('open');b.classList.remove('open');fl=[];lock=false},800)}}});
$('#mre').onclick=mem;mem();
let sp={on:0,s:0,t:0,a:0};
function sq(){const p=24+Math.floor(Math.random()*7),c=2**(32-p)-2,o=[...new Set([c,c+2,c*2+2,Math.max(2,Math.floor(c/2)-1)])].sort(()=>Math.random()-.5);sp.a=c;$('#sq').innerHTML=`<h3 style="font-size:22px;margin-top:16px">Host usable pada /${p}?</h3><div class="opts">${o.map(v=>`<button class="opt" data-s="${v}">${v}</button>`).join('')}</div>`}
function endSp(){sp.on=0;$('#sgo').disabled=false;$('#sq').innerHTML=`<div class="msg ${sp.s>=5?'ok':'no'}"><b>Waktu habis. Skor ${sp.s}.</b> ${sp.s>=5?'Bagus, kamu cepat menghitung subnet.':'Target 5 benar. Coba lagi.'}</div>`;if(sp.s>=5){boom();gain('g3',30)}}
$('#sgo').onclick=()=>{sp.on=1;sp.s=0;$('#ssc').textContent='0';$('#sgo').disabled=true;const b=$('#sbar');b.style.transition='none';b.style.width='100%';void b.offsetWidth;b.style.transition='width 30s linear';b.style.width='0%';sq();clearTimeout(sp.t);sp.t=setTimeout(endSp,30000)};
$('#sq').addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b||!sp.on)return;if(+b.dataset.s===sp.a){sp.s++;$('#ssc').textContent=sp.s;b.classList.add('right');sfx('success');setTimeout(()=>sp.on&&sq(),250)}else{b.classList.add('wrong');sfx('tap');setTimeout(()=>sp.on&&sq(),300)}});
// GAME 4: OSI Challenge
const osiQ=[
 {q:'Kabel UTP putus sehingga sinyal tidak sampai.',a:'Physical',o:['Physical','Network','Application','Session'],why:'Layer Physical menangani media fisik dan bit.'},
 {q:'Switch meneruskan frame berdasarkan alamat MAC.',a:'Data Link',o:['Transport','Data Link','Presentation','Network'],why:'Layer Data Link menangani frame dan alamat MAC.'},
 {q:'Router menentukan jalur paket berdasarkan alamat IP.',a:'Network',o:['Network','Physical','Application','Data Link'],why:'Layer Network menangani pengalamatan IP dan routing.'},
 {q:'TCP memastikan pengiriman data yang andal.',a:'Transport',o:['Session','Transport','Network','Physical'],why:'Layer Transport mengatur komunikasi end-to-end, termasuk TCP.'},
 {q:'Browser meminta halaman web melalui HTTP/HTTPS.',a:'Application',o:['Application','Data Link','Physical','Network'],why:'HTTP dan HTTPS merupakan protokol layer Application.'},
 {q:'Data dienkripsi atau diterjemahkan ke format yang sesuai.',a:'Presentation',o:['Presentation','Transport','Network','Physical'],why:'Layer Presentation berkaitan dengan format, enkripsi, dan kompresi data.'}
];let oi=0,oscore=0,olock=false;
function osiRender(){if(oi>=osiQ.length){$('#osibox').innerHTML=`<div class="msg ${oscore>=4?'ok':'no'}"><h3>Tantangan selesai: ${oscore}/${osiQ.length}</h3><p>${oscore>=4?'Mantap! Pemahaman layer OSI kamu bagus.':'Coba lagi dan perhatikan fungsi setiap layer.'}</p><button class="btn p" id="osiplayagain">Main lagi</button></div>`;if(oscore>=4){boom();gain('g-osi',30)}$('#osiplayagain').onclick=osiReset;return}const x=osiQ[oi];$('#osinum').textContent=oi+1;$('#osibar').style.width=(oi/osiQ.length*100)+'%';$('#osibox').innerHTML=`<h3 style="margin:18px 0">${x.q}</h3><div class="opts">${x.o.map(v=>`<button class="opt" data-osi="${v}">${v}</button>`).join('')}</div><div id="osifeed" class="msg" aria-live="polite"></div>`}
function osiReset(){oi=0;oscore=0;olock=false;osiRender()}$('#osirestart').onclick=osiReset;$('#osibox').addEventListener('click',e=>{const b=e.target.closest('[data-osi]');if(!b||olock)return;olock=true;const x=osiQ[oi];const ok=b.dataset.osi===x.a;if(ok){oscore++;b.classList.add('right');sfx('success')}else{b.classList.add('wrong');sfx('tap')}$('#osifeed').className='msg '+(ok?'ok':'no');$('#osifeed').textContent=(ok?'Benar! ':'Belum tepat. ')+x.why;setTimeout(()=>{oi++;olock=false;osiRender()},1150)});osiRender();
// GAME 5: Detektif Jaringan
const detQ=[
 {q:'Satu PC tidak bisa membuka situs, tetapi PC lain normal.',o:['Periksa kabel/Wi-Fi dan konfigurasi IP PC itu','Matikan semua switch sekolah','Ganti semua kabel di lab'],a:0,why:'Mulai dari perangkat yang bermasalah: koneksi, IP, gateway, dan DNS.'},
 {q:'PC dapat ping gateway, tetapi tidak dapat membuka nama situs.',o:['Periksa DNS','Ganti monitor','Ubah warna kabel'],a:0,why:'Jika koneksi IP jalan tetapi nama domain gagal, periksa DNS.'},
 {q:'Lampu port switch mati dan perangkat tidak terhubung.',o:['Periksa kabel, konektor, dan port','Ubah subnet menjadi /8 langsung','Hapus browser'],a:0,why:'Lampu link mati sering menunjukkan masalah fisik atau port.'},
 {q:'Dua PC punya alamat IP yang sama.',o:['Atasi konflik IP dan tetapkan alamat unik','Tambah volume speaker','Ganti nama file'],a:0,why:'Setiap host pada jaringan yang sama harus memiliki IP yang tidak bentrok.'},
 {q:'PC berbeda subnet tidak bisa berkomunikasi.',o:['Periksa gateway dan routing','Periksa wallpaper desktop','Ganti keyboard'],a:0,why:'Komunikasi antar-subnet memerlukan gateway dan routing yang benar.'}
];let di=0,dscore=0,dlock=false;
function detRender(){if(di>=detQ.length){$('#detbox').innerHTML=`<div class="msg ${dscore>=4?'ok':'no'}"><h3>Kasus selesai: ${dscore}/${detQ.length}</h3><p>${dscore>=4?'Detektif hebat! Kamu memilih langkah diagnosis yang tepat.':'Coba ulangi. Diagnosis jaringan harus dilakukan secara bertahap.'}</p><button class="btn p" id="detagain">Mulai lagi</button></div>`;if(dscore>=4){boom();gain('g-detect',30)}$('#detagain').onclick=detReset;return}const x=detQ[di];$('#detnum').textContent=di+1;$('#detbox').innerHTML=`<div class="glass card" style="margin-top:16px"><div style="font-size:30px">🕵️</div><h3>${x.q}</h3><div class="opts">${x.o.map((v,i)=>`<button class="opt" data-det="${i}">${v}</button>`).join('')}</div><div id="detfeed" class="msg"></div></div>`}
function detReset(){di=0;dscore=0;dlock=false;detRender()}$('#detrestart').onclick=detReset;$('#detbox').addEventListener('click',e=>{const b=e.target.closest('[data-det]');if(!b||dlock)return;dlock=true;const x=detQ[di],ok=+b.dataset.det===x.a;if(ok){dscore++;b.classList.add('right');sfx('success')}else{b.classList.add('wrong');sfx('tap')}$('#detfeed').className='msg '+(ok?'ok':'no');$('#detfeed').textContent=(ok?'Tepat! ':'Belum tepat. ')+x.why;setTimeout(()=>{di++;dlock=false;detRender()},1400)});detRender();
// GAME 6: Rute Paket
const routeSteps=[{q:'Langkah pertama: perangkat apa yang menghubungkan PC ke jaringan lokal?',o:['Switch','Printer','Speaker'],a:'Switch',why:'Switch menghubungkan perangkat dalam LAN.'},{q:'Server berada di jaringan berbeda. Perangkat apa yang memilih jalur antarjaringan?',o:['Router','Mouse','Accessori monitor'],a:'Router',why:'Router meneruskan paket antarjaringan berdasarkan alamat IP.'},{q:'Sebelum paket sampai, apa yang perlu dipastikan pada PC?',o:['IP tujuan dan gateway benar','Wallpaper sama','Volume maksimal'],a:'IP tujuan dan gateway benar',why:'Alamat tujuan dan default gateway yang tepat membantu paket menemukan jalurnya.'}];let ri=0,rlock=false;
function routeRender(){if(ri>=routeSteps.length){$('#rstep').textContent='3';$('#routebox').innerHTML='<div class="msg ok"><h3>🎉 Paket berhasil sampai!</h3><p>Kamu menyelesaikan rute PC → Switch → Router → Server.</p><button class="btn p" id="routeagain">Kirim paket lagi</button></div>';boom();gain('g-route',35);$('#routeagain').onclick=routeReset;return}$('#rstep').textContent=ri;const x=routeSteps[ri];$('#routebox').innerHTML=`<h3 style="margin:18px 0">${x.q}</h3><div class="opts">${x.o.map(v=>`<button class="opt" data-route="${v}">${v}</button>`).join('')}</div><div id="routefeed" class="msg"></div>`}
function routeReset(){ri=0;rlock=false;routeRender()}$('#routerestart').onclick=routeReset;$('#routebox').addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(!b||rlock)return;rlock=true;const x=routeSteps[ri],ok=b.dataset.route===x.a;if(ok){b.classList.add('right');sfx('success')}else{b.classList.add('wrong');sfx('tap')}$('#routefeed').className='msg '+(ok?'ok':'no');$('#routefeed').textContent=(ok?'Benar! ':'Coba lagi. ')+x.why;if(ok)setTimeout(()=>{ri++;rlock=false;routeRender()},1050);else setTimeout(()=>{b.classList.remove('wrong');rlock=false},850)});routeRender();


// ===== Premium interactive experiences =====
const premiumMissions=[
 {title:'Lab kehilangan koneksi',label:'INCIDENT 01 / PHYSICAL LAYER',story:'Beberapa komputer di lab tidak dapat terhubung. Lampu indikator pada salah satu port switch mati setelah meja dipindahkan.',question:'Apa pemeriksaan pertama yang paling tepat?',choices:['Periksa kabel, konektor, dan port switch','Ubah semua alamat IP menjadi statis','Ganti DNS seluruh lab'],correct:0,explain:'Mulai dari Layer 1: pastikan kabel dan konektor terpasang baik, lalu uji port. Jangan mengubah konfigurasi IP sebelum bukti fisik diperiksa.'},
 {title:'IP bertabrakan',label:'INCIDENT 02 / ADDRESSING',story:'Dua komputer kadang kehilangan koneksi dan sistem menampilkan peringatan konflik alamat IP.',question:'Apa tindakan yang paling tepat?',choices:['Tetapkan alamat unik dan periksa cakupan DHCP','Ganti kabel HDMI','Matikan semua firewall tanpa pemeriksaan'],correct:0,explain:'Konflik terjadi ketika dua perangkat memakai alamat IP yang sama. Periksa konfigurasi DHCP/reservasi dan pastikan setiap host memperoleh alamat unik.'},
 {title:'Internet tanpa nama',label:'INCIDENT 03 / DNS',story:'Pengguna dapat melakukan ping ke alamat IP publik, tetapi nama domain tidak bisa dibuka.',question:'Komponen apa yang paling relevan untuk diperiksa?',choices:['DNS resolver dan konfigurasi DNS klien','Ukuran monitor','Nomor VLAN printer saja'],correct:0,explain:'Jika konektivitas IP berhasil tetapi nama domain gagal diterjemahkan, periksa alamat DNS, keterjangkauan resolver, dan respons query.'},
 {title:'Jaringan beda subnet',label:'INCIDENT 04 / ROUTING',story:'Komputer dapat berkomunikasi dengan perangkat satu subnet, tetapi tidak dapat mencapai server di subnet lain.',question:'Apa yang perlu diverifikasi lebih dulu?',choices:['Default gateway, routing, dan rute balik','Kecepatan refresh monitor','Nama folder pada komputer'],correct:0,explain:'Komunikasi antar-subnet memerlukan gateway Layer 3 serta rute yang sesuai di kedua arah. Verifikasi IP, mask, gateway, dan routing.'}
];
let missionIndex=0,missionDone={};
try{const savedMissions=JSON.parse(localStorage.getItem('nq_story_done')||'{}');missionDone=savedMissions&&typeof savedMissions==='object'?savedMissions:{}}catch(e){missionDone={}}
function renderMission(){const m=premiumMissions[missionIndex];const map=$('#missionMap');if(!map)return;$$('#missionMap [data-mission]').forEach(b=>{b.classList.toggle('active',+b.dataset.mission===missionIndex);const n=b.querySelector('.node-num');if(n)n.textContent=missionDone[missionIndex]?'✓':String(+b.dataset.mission+1).padStart(2,'0')});$('#missionPanel').innerHTML=`<div class="section-kicker">${m.label}</div><h2 style="font-size:clamp(23px,3vw,32px)">${m.title}</h2><p style="margin-top:10px">${m.story}</p><div class="msg" style="margin-top:16px"><b>Ticket / Gejala</b><br>${m.question}</div><div id="missionChoices" style="margin-top:12px">${m.choices.map((c,i)=>`<button class="mission-choice" data-mchoice="${i}">${String.fromCharCode(65+i)}. ${c}</button>`).join('')}</div><div id="missionFeedback" aria-live="polite"></div><div class="row"><button class="btn" id="missionPrev" ${missionIndex===0?'disabled':''}>← Sebelumnya</button><button class="btn p" id="missionNext">${missionIndex===3?'Kembali ke misi pertama':'Misi berikutnya →'}</button></div>`;$('#missionPrev').onclick=()=>{missionIndex=Math.max(0,missionIndex-1);renderMission()};$('#missionNext').onclick=()=>{missionIndex=missionIndex===3?0:missionIndex+1;renderMission()}}
$('#missionMap')?.addEventListener('click',e=>{const b=e.target.closest('[data-mission]');if(!b)return;missionIndex=+b.dataset.mission;renderMission()});
$('#missionPanel')?.addEventListener('click',e=>{const b=e.target.closest('[data-mchoice]');if(!b||b.disabled)return;const m=premiumMissions[missionIndex],ok=+b.dataset.mchoice===m.correct;$$('#missionChoices [data-mchoice]').forEach(x=>{x.disabled=true;if(+x.dataset.mchoice===m.correct)x.classList.add('correct')});if(!ok)b.classList.add('incorrect');$('#missionFeedback').innerHTML=`<div class="msg ${ok?'ok':'no'}"><b>${ok?'Keputusan tepat.':'Belum tepat.'}</b><br>${m.explain}</div>`;sfx(ok?'success':'tap');if(ok&&!missionDone[missionIndex]){missionDone[missionIndex]=1;try{localStorage.setItem('nq_story_done',JSON.stringify(missionDone))}catch(e){}gain('story_'+missionIndex,20);refreshPremiumUI()} });
renderMission();

// Virtual lab topology: interactive source/target selection and simulated packet test.
const labNodes={pc1:{name:'PC Siswa',ip:'192.168.10.10',net:'10',type:'host'},pc2:{name:'PC Guru',ip:'192.168.10.20',net:'10',type:'host'},switch:{name:'Switch',ip:'Layer 2',net:'lan',type:'switch'},router:{name:'Router',ip:'192.168.10.1 / 192.168.20.1',net:'router',type:'router'},server:{name:'Server',ip:'192.168.20.10',net:'20',type:'server'}};
let labSource='pc1',labTarget='server',labPick='source';
function labRender(){if(!$('#labTopology'))return;$$('#labTopology [data-node]').forEach(n=>{n.classList.toggle('active',n.dataset.node===labSource||n.dataset.node===labTarget)});$('#labSourceValue').textContent=labNodes[labSource]?.name||'Belum dipilih';$('#labTargetValue').textContent=labNodes[labTarget]?.name||'Belum dipilih'}
$('#labSource')?.addEventListener('click',()=>{labPick='source';$('#labStatus').innerHTML='<span class="live-dot"></span><span>Pilih perangkat yang akan menjadi sumber paket.</span>'});
$('#labTarget')?.addEventListener('click',()=>{labPick='target';$('#labStatus').innerHTML='<span class="live-dot"></span><span>Pilih perangkat tujuan paket.</span>'});
$('#labTopology')?.addEventListener('click',e=>{const b=e.target.closest('[data-node]');if(!b)return;const id=b.dataset.node;if(labPick==='source'){labSource=id;if(labTarget===labSource)labTarget=id==='server'?'pc1':'server'}else{labTarget=id;if(labTarget===labSource)labSource=id==='server'?'pc1':'server'}labRender();$('#labStatus').innerHTML=`<span class="live-dot"></span><span>${labPick==='source'?'Sumber':'Tujuan'} dipilih: ${labNodes[id].name}.</span>`});
$('#labSend')?.addEventListener('click',()=>{if(labSource===labTarget){$('#labStatus').innerHTML='<span class="live-dot"></span><span>Pilih sumber dan tujuan yang berbeda.</span>';return}const a=labNodes[labSource],b=labNodes[labTarget];const same=a.net===b.net;const switchEndpoint=labSource==='switch'||labTarget==='switch';const routerEndpoint=labSource==='router'||labTarget==='router';const routed=!same&&!switchEndpoint&&!routerEndpoint&&labNodes.router;const ok=!switchEndpoint&&(same||routerEndpoint||!!routed);const hops=switchEndpoint?'—':(same?'1 (LAN)':(routerEndpoint?'1 (Gateway)':'2 (Switch + Router)'));const latency=(same?'1.2':(ok?'4.8':'—'))+(ok?' ms':'');$('#labHops').textContent=hops;$('#labLatency').textContent=latency;$('#labTerminal').textContent=`NEXORA NETWORK CONSOLE\n$ ping ${b.ip}\nSource: ${a.name} (${a.ip})\nDestination: ${b.name} (${b.ip})\n\n${ok?'Reply from '+b.ip+': time='+latency+' TTL=64\nReply from '+b.ip+': time='+(same?'1.4':'5.1')+' ms TTL=64\n\nSimulation result: SUCCESS':(switchEndpoint?'Error: Layer-2 switch tidak memiliki alamat IP manajemen pada simulasi ini. Pilih host atau router.':'Request timed out. Periksa IP, VLAN, gateway, dan routing.')}\n\nNote: simulated output only.`;$('#labStatus').innerHTML=`<span class="live-dot" style="background:${ok?'#48f2ba':'#ff5d7a'}"></span><span>${ok?'Ping simulasi berhasil.':'Koneksi simulasi gagal. Periksa topologi.'}</span>`;sfx(ok?'success':'tap');if(ok){gain('lab_packet',15);try{localStorage.setItem('nq_lab_done','1')}catch(e){}refreshPremiumUI()}});
labRender();

// Achievement collection and local XP leaderboard.
const achievementDefs=[
 {id:'first',icon:'⚡',name:'Langkah Pertama',desc:'Kumpulkan minimal 10 XP.',test:()=>st.xp>=10},
 {id:'lab',icon:'⌁',name:'Packet Pilot',desc:'Berhasil menjalankan ping di Virtual Lab.',test:()=>!!st.got.lab_packet},
 {id:'case',icon:'◈',name:'Case Solver',desc:'Selesaikan minimal satu kasus Story Mode.',test:()=>Object.keys(missionDone||{}).some(k=>missionDone[k])},
 {id:'subnet',icon:'▦',name:'Subnet Scout',desc:'Selesaikan tantangan subnetting dengan benar.',test:()=>!!st.got.s2},
 {id:'quiz',icon:'✎',name:'Quiz Rookie',desc:'Selesaikan satu sesi kuis evaluasi.',test:()=>!!st.got.done_quiz},
 {id:'cable',icon:'🔌',name:'Cable Master',desc:'Selesaikan tantangan susun kabel T568B.',test:()=>!!(st.got.game_crimp_t568b||st.got.g1)},
 {id:'games',icon:'🎮',name:'Game Master',desc:'Selesaikan salah satu tantangan game lanjutan.',test:()=>['g-osi','g-detect','g-route','g3','g2'].some(k=>!!st.got[k])},
 {id:'explorer',icon:'✦',name:'Network Explorer',desc:'Kumpulkan minimal 100 XP.',test:()=>st.xp>=100},
 {id:'legend',icon:'♛',name:'Network Legend',desc:'Kumpulkan minimal 320 XP.',test:()=>st.xp>=320}
];
function refreshPremiumUI(){
 const name=(()=>{try{return localStorage.getItem('nq_demo_user')||'Teknisi Jaringan'}catch(e){return'Teknisi Jaringan'}})();
 const dash=$('#dashName');if(dash)dash.textContent=name.split(/[\s_-]+/)[0].slice(0,22);
 if($('#dashRank'))$('#dashRank').textContent=$('#rank')?.textContent||'Newbie';
 if($('#dashXP'))$('#dashXP').textContent=String(st?.xp||0);
 if($('#dashMissions'))$('#dashMissions').textContent=Object.keys(missionDone||{}).filter(k=>missionDone[k]).length+'/4';
 const unlocked=achievementDefs.filter(a=>{try{return a.test()}catch(e){return false}});
 const count=unlocked.length,pct=Math.round(count/achievementDefs.length*100);
 if($('#achXP'))$('#achXP').textContent=(st?.xp||0)+' XP';
 if($('#achRank'))$('#achRank').textContent=$('#rank')?.textContent||'Newbie';
 if($('#achCount'))$('#achCount').textContent=count+' / '+achievementDefs.length;
 if($('#achievementPercent'))$('#achievementPercent').textContent=pct+'% terbuka';
 if($('#achievementBar'))$('#achievementBar').style.width=pct+'%';
 const grid=$('#achievementGrid');
 if(grid)grid.innerHTML=achievementDefs.map(a=>{const yes=unlocked.some(x=>x.id===a.id);return `<article class="achievement-card ${yes?'unlocked':''}"><span class="badge-icon">${a.icon}</span><b>${a.name}</b><small>${a.desc}</small><span class="achievement-state">${yes?'✓ TERBUKA':'🔒 TERKUNCI'}</span></article>`}).join('');
 const next=ranks.find(r=>r[0]>(st?.xp||0));
 if($('#achNext'))$('#achNext').textContent=next?`${next[0]-(st?.xp||0)} XP lagi menuju ${next[1]}`:'Rank tertinggi tercapai';
 // Legacy badge labels are kept in sync if present in older page versions.
 const bd=(id,yes)=>{const el=$(id);if(el){el.textContent=yes?'Terbuka':'Belum terbuka';el.style.color=yes?'var(--c3)':'var(--mut)'}};
 bd('#badgeLab',!!st.got.lab_packet);bd('#badgeStory',Object.keys(missionDone||{}).some(k=>missionDone[k]));bd('#badgeSubnet',!!st.got.s2);bd('#badgeXP',(st?.xp||0)>=100);
 let board=[];try{const savedBoard=JSON.parse(localStorage.getItem('nq_board')||'[]');board=Array.isArray(savedBoard)?savedBoard.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(Number(x.xp))).map(x=>({name:x.name,xp:Number(x.xp)})):[]}catch(e){board=[]}
 const xp=st?.xp||0;const i=board.findIndex(x=>x.name.toLowerCase()===name.toLowerCase());
 if(i>=0)board[i].xp=Math.max(board[i].xp||0,xp);else board.push({name,xp});
 board.sort((a,b)=>b.xp-a.xp||a.name.localeCompare(b.name));board=board.slice(0,10);
 try{localStorage.setItem('nq_board',JSON.stringify(board))}catch(e){}
 const pos=board.findIndex(x=>x.name.toLowerCase()===name.toLowerCase())+1;
 if($('#myRanking'))$('#myRanking').innerHTML=`Posisi kamu: <b>#${pos||'—'}</b> dari ${board.length} profil lokal · <b>${xp} XP</b>`;
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const list=$('#leaderboardList');
 if(list)list.innerHTML=board.length?board.map((x,i)=>`<div class="leader-row"><span class="leader-rank">${i===0?'♛':String(i+1).padStart(2,'0')}</span><span class="leader-name">${esc(x.name)}<small>${x.name.toLowerCase()===name.toLowerCase()?'Profil kamu':i===0?'Skor tertinggi lokal':'Peserta lokal'}</small></span><span class="leader-score">${x.xp} XP</span></div>`).join(''):'<div class="msg">Belum ada skor. Selesaikan aktivitas untuk mulai mengisi klasemen.</div>';
}

// ===== Learning games: Cisco, MikroTik, Ubuntu Linux, and cable crimping =====
const topicData={
 cisco:{title:'Cisco Networking Basics',intro:'Cisco adalah ekosistem perangkat dan pembelajaran jaringan. Pada latihan ini kamu mengenal CLI switch/router dan konsep konfigurasi dasar.',points:['enable — masuk ke privileged EXEC mode.','configure terminal — masuk ke mode konfigurasi global.','hostname SW1 — memberi nama perangkat.','show running-config — melihat konfigurasi yang sedang berjalan.','show vlan brief — melihat daftar VLAN pada switch.','copy running-config startup-config — menyimpan konfigurasi.'],note:'Perintah di sini adalah contoh pembelajaran pada perangkat/lab milik sendiri. Perhatikan mode CLI sebelum menjalankan perintah.'},
 mikrotik:{title:'Konfigurasi Dasar MikroTik',intro:'MikroTik RouterOS digunakan untuk mengatur router, alamat IP, DHCP, DNS, dan firewall. Praktikkan pada perangkat/lab sekolah dengan arahan guru.',points:['Identifikasi interface dengan /interface print.','Lihat alamat IP dengan /ip address print.','Atur alamat IP pada interface LAN melalui menu IP → Addresses.','DHCP Server membantu klien memperoleh IP otomatis.','Periksa rute dengan /ip route print.','Simpan dan dokumentasikan perubahan konfigurasi.'],note:'Nama interface dan alamat jaringan harus disesuaikan dengan topologi lab. Jangan menyalin konfigurasi tanpa memahami dampaknya.'},
 linux:{title:'Perintah Dasar Linux Ubuntu (Oracle VM)',intro:'Ubuntu yang dijalankan di Oracle VM VirtualBox dapat digunakan untuk belajar terminal, file, jaringan, dan layanan server.',points:['pwd — melihat lokasi direktori saat ini.','ls -la — melihat isi direktori secara detail.','cd nama_folder — berpindah direktori.','mkdir latihan — membuat folder latihan.','ip a — melihat informasi interface dan alamat IP.','ping alamat — menguji konektivitas jaringan.','sudo apt update — memperbarui daftar paket.','sudo systemctl status apache2 — memeriksa status layanan Apache2.'],note:'Gunakan sudo hanya saat diperlukan. Perintah sistem dijalankan pada mesin virtual latihan, dan pahami perintah sebelum mengeksekusinya.'}
};
const topicQuestions={
 cisco:[['Perintah untuk masuk ke mode konfigurasi global Cisco?', ['enable','configure terminal','show vlan brief'],1,'configure terminal digunakan setelah masuk ke privileged EXEC mode.'],['Perintah untuk melihat daftar VLAN pada switch?', ['show vlan brief','hostname SW1','exit'],0,'show vlan brief menampilkan VLAN dan port yang terdaftar.'],['Perintah menyimpan konfigurasi aktif ke startup?', ['reload','copy running-config startup-config','disable'],1,'Perintah tersebut menyimpan konfigurasi agar digunakan saat perangkat dinyalakan kembali.']],
 mikrotik:[['RouterOS MikroTik digunakan untuk mengelola apa?', ['Pengolah kata','Jaringan dan routing','Desain gambar'],1,'MikroTik mengelola fungsi jaringan seperti routing, DHCP, dan firewall.'],['Menu/perintah untuk melihat alamat IP RouterOS?', ['/ip address print','/system reboot','/file print'],0,'Perintah ini menampilkan alamat IP yang terpasang.'],['Apa fungsi DHCP Server?', ['Memberi IP otomatis ke klien','Menghapus file','Mengganti kabel'],0,'DHCP Server membagikan konfigurasi IP kepada perangkat klien.']],
 linux:[['Perintah melihat direktori aktif?', ['ls','pwd','mkdir'],1,'pwd menampilkan working directory saat ini.'],['Perintah melihat alamat IP di Ubuntu?', ['ip a','cd','clear'],0,'ip a menampilkan interface dan alamat IP.'],['Perintah membuat folder baru?', ['mkdir','ping','sudo'],0,'mkdir diikuti nama folder membuat direktori baru.']]
};
let activeTopic='cisco',topicIndex=0,topicScore=0,topicLocked=false;
function renderTopic(){const d=topicData[activeTopic];$('#lessonContent').innerHTML=`<h3>${d.title}</h3><p>${d.intro}</p><ul>${d.points.map(x=>`<li>${x}</li>`).join('')}</ul><div class="msg">💡 ${d.note}</div>`;$$('[data-topic]').forEach(b=>b.classList.toggle('active',b.dataset.topic===activeTopic));$('#topicQuiz').hidden=true;$('#topicQuiz').innerHTML=''}
$$('[data-topic]').forEach(b=>b.addEventListener('click',()=>{activeTopic=b.dataset.topic;renderTopic()}));renderTopic();
function renderTopicQuestion(){const q=topicQuestions[activeTopic][topicIndex],box=$('#topicQuiz');if(topicIndex>=topicQuestions[activeTopic].length){box.innerHTML=`<h3>Kuis selesai!</h3><p>Skor kamu: <b>${topicScore}/${topicQuestions[activeTopic].length}</b></p><div class="msg ${topicScore>=2?'ok':'no'}">${topicScore>=2?'Bagus! Materi mulai kamu kuasai.':'Pelajari kembali ringkasan lalu coba lagi.'}</div><button class="btn p" id="retryTopic">Ulangi kuis</button>`;$('#retryTopic').onclick=()=>{$('#startTopicQuiz').click()};if(topicScore>=2)gain('study_'+activeTopic,25);return}const x=q;box.innerHTML=`<small>SOAL ${topicIndex+1} / ${topicQuestions[activeTopic].length}</small><h3 style="margin-top:8px">${x[0]}</h3>${x[1].map((v,i)=>`<button class="quiz-option" data-topic-answer="${i}">${String.fromCharCode(65+i)}. ${v}</button>`).join('')}<div id="topicFeedback" class="msg">Pilih jawaban yang paling tepat.</div>`}
$('#startTopicQuiz').addEventListener('click',()=>{topicIndex=0;topicScore=0;topicLocked=false;$('#topicQuiz').hidden=false;renderTopicQuestion();$('#topicQuiz').scrollIntoView({behavior:'smooth',block:'nearest'})});
$('#topicQuiz').addEventListener('click',e=>{const b=e.target.closest('[data-topic-answer]');if(!b||topicLocked)return;topicLocked=true;const q=topicQuestions[activeTopic][topicIndex],ok=+b.dataset.topicAnswer===q[2];if(ok)topicScore++;$$('[data-topic-answer]').forEach(x=>{x.disabled=true;if(+x.dataset.topicAnswer===q[2])x.classList.add('correct')});if(!ok)b.classList.add('incorrect');$('#topicFeedback').className='msg '+(ok?'ok':'no');$('#topicFeedback').textContent=(ok?'Benar. ':'Belum tepat. ')+q[3];const next=document.createElement('button');next.className='btn p';next.textContent='Soal berikutnya →';next.style.marginTop='12px';next.onclick=()=>{topicIndex++;topicLocked=false;renderTopicQuestion()};$('#topicQuiz').append(next)});
$$('[data-gamepanel]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.gamepanel;$$('.gamepanel').forEach(x=>x.classList.toggle('active',x.id==='panel-'+id));if(id==='crimp')resetCrimp();}));
// Crimping T568B ordering exercise: select the correct wire color at each pin.
const t568b=['Putih-Jingga','Jingga','Putih-Hijau','Biru','Putih-Biru','Hijau','Putih-Cokelat','Cokelat'];
const wireColors=['Putih-Jingga','Jingga','Putih-Hijau','Biru','Putih-Biru','Hijau','Putih-Cokelat','Cokelat'];let crimpStep=0,crimpPoints=0,crimpLocked=false;
function resetCrimp(){crimpStep=0;crimpPoints=0;crimpLocked=false;$('#crimpPin').textContent='1 / 8';$('#crimpScore').textContent='0';$('#crimpFeedback').className='msg';$('#crimpFeedback').textContent='Pilih warna pertama untuk memulai.';$('#crimpSlots').innerHTML=t568b.map((_,i)=>`<div class="pin-slot" id="pin-${i}">Pin ${i+1}<br><small>Belum dipilih</small></div>`).join('');$('#crimpChoices').innerHTML=[...wireColors].sort(()=>Math.random()-.5).map(c=>`<button class="crimp-wire" data-wire="${c}">${c}</button>`).join('')}
$('#crimpChoices').addEventListener('click',e=>{const b=e.target.closest('[data-wire]');if(!b||crimpLocked||b.disabled)return;const chosen=b.dataset.wire,correct=t568b[crimpStep];if(chosen===correct){crimpPoints+=10;$('#pin-'+crimpStep).innerHTML=`<b>${crimpStep+1}. ${chosen}</b>`;b.disabled=true;crimpStep++;$('#crimpScore').textContent=crimpPoints;$('#crimpPin').textContent=crimpStep>=8?'Selesai':' '+(crimpStep+1)+' / 8';$('#crimpFeedback').className='msg ok';$('#crimpFeedback').textContent=crimpStep>=8?'🎉 Urutan T568B benar! Kamu menyelesaikan tantangan crimping.':'Benar! Lanjut ke pin berikutnya.';if(crimpStep>=8){crimpLocked=true;gain('game_crimp_t568b',35)}}else{$('#crimpFeedback').className='msg no';$('#crimpFeedback').textContent=`Belum tepat untuk pin ${crimpStep+1}. Coba periksa urutan T568B pada materi.`;sfx('fail')}});
$('#crimpReset').addEventListener('click',resetCrimp);resetCrimp();
// Learner profile saved locally in this browser.
function renderProfile(){let name=String(window.netquestCurrentUser||''),school='';try{name=localStorage.getItem('nq_demo_user')||name;school=localStorage.getItem('nq_school')||''}catch(e){}const safe=name||'Teknisi Jaringan';$('#profileDisplayName').textContent=safe;$('#profileAvatar').textContent=safe.trim().charAt(0).toUpperCase()||'N';$('#profileSchoolDisplay').textContent=school||'Asal sekolah belum diisi';$('#profileName').value=name;$('#profileSchool').value=school;$('#profileXP').textContent=(st?.xp||0)+' XP';$('#profileRank').textContent=$('#rank')?.textContent||'Newbie';$('#profileRankStat').textContent=$('#rank')?.textContent||'Newbie';$('#profileMissionCount').textContent=Object.keys(missionDone||{}).filter(k=>missionDone[k]).length+' / 4'}
$('#saveProfile').addEventListener('click',()=>{
 const name=$('#profileName').value.trim(),school=$('#profileSchool').value.trim();
 const previousName=String(window.netquestCurrentUser||'');
 const role=currentRole();
 if(name.length<2){$('#profileFeedback').className='msg no';$('#profileFeedback').textContent='Nama minimal 2 karakter.';return}
 if(role==='student'&&isReservedName(name)&&name.toLowerCase()!==previousName.toLowerCase()){$('#profileFeedback').className='msg no';$('#profileFeedback').textContent=RESERVED_MSG;return}
 const accounts=getAccounts(),oldKey=previousName?accountKey(previousName):'',newKey=accountKey(name);
 if(oldKey&&oldKey!==newKey&&Object.prototype.hasOwnProperty.call(accounts,newKey)){$('#profileFeedback').className='msg no';$('#profileFeedback').textContent='Nama tersebut sudah digunakan akun lain. Pilih nama yang berbeda.';return}
 const existing=accounts[oldKey]||accounts[newKey]||{};
 if(oldKey&&oldKey!==newKey)delete accounts[oldKey];
 accounts[newKey]={...existing,name,role,school,xp:Number(st?.xp||0),got:st?.got||{},updatedAt:Date.now()};
 window.netquestCurrentUser=name;window.netquestCurrentRole=role;
 try{localStorage.setItem('nq_demo_user',name);localStorage.setItem('nq_school',school)}catch(e){}
 saveAccounts(accounts);saveCurrentAccount();
 window.dispatchEvent(new Event('netquest:account-changed'));updateSession();renderProfile();refreshPremiumUI();
 $('#profileFeedback').className='msg ok';$('#profileFeedback').textContent='Profil berhasil disimpan. Data akun dan progres mengikuti nama baru.'
});
const oldGo=go;go=function(v){oldGo(v);if(v==='profile')renderProfile()};



// ===== Daily Quest =====
const dailyQuestDefs=[
 {id:'daily_lab',icon:'⌘',title:'Uji koneksi di Virtual Lab',desc:'Pilih sumber dan tujuan lalu jalankan ping simulasi sampai berhasil.',xp:20,go:'lab'},
 {id:'daily_quiz',icon:'✎',title:'Selesaikan satu kuis',desc:'Kerjakan kuis materi atau kuis evaluasi sampai selesai.',xp:15,go:'quiz'},
 {id:'daily_story',icon:'◈',title:'Selesaikan satu misi cerita',desc:'Ambil keputusan pada Story Mode dan selesaikan satu kasus.',xp:20,go:'story'}
];
function dayKey(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dailyStorageKey(){
 let name='';try{name=localStorage.getItem('nq_demo_user')||''}catch(e){}
 const normalized=String(name||'guest').trim().replace(/\s+/g,' ').toLocaleLowerCase('id').slice(0,64)||'guest';
 return 'nq_daily_v2:'+encodeURIComponent(normalized);
}
function dailyState(){
 const today=dayKey(),key=dailyStorageKey();
 try{
  let rawText=localStorage.getItem(key);
  // Move the old shared daily record to the first signed-in account only once.
  let activeUser='';try{activeUser=localStorage.getItem('nq_demo_user')||''}catch(e){}
  if(!rawText&&activeUser){
   const legacy=localStorage.getItem('nq_daily');
   if(legacy){localStorage.setItem(key,legacy);localStorage.removeItem('nq_daily');rawText=legacy;}
  }
  const raw=JSON.parse(rawText||'null');
  if(raw&&typeof raw==='object'){
   if(raw.date===today)return {date:today,done:raw.done&&typeof raw.done==='object'?raw.done:{},streak:Math.max(0,Number(raw.streak)||0),lastDate:String(raw.lastDate||'')};
   return {date:today,done:{},streak:Math.max(0,Number(raw.streak)||0),lastDate:String(raw.lastDate||raw.date||'')};
  }
 }catch(e){}
 return {date:today,done:{},streak:0,lastDate:''};
}
let daily=dailyState();
function saveDaily(){try{localStorage.setItem(dailyStorageKey(),JSON.stringify(daily))}catch(e){}}
function markDaily(id){if(daily.done[id])return;daily.done[id]=1;const q=dailyQuestDefs.find(x=>x.id===id);if(q)gain(id,q.xp);saveDaily();renderDaily();refreshPremiumUI()}
function dailyExternalDone(){
 if(st.got.lab_packet)markDaily('daily_lab');
 if(st.got.done_quiz)markDaily('daily_quiz');
 if(Object.keys(missionDone||{}).some(k=>missionDone[k]))markDaily('daily_story');
}
function renderDaily(){
 dailyExternalDone();
 const list=$('#dailyList');if(!list)return;
 const done=dailyQuestDefs.filter(q=>daily.done[q.id]).length,total=dailyQuestDefs.length;
 $('#dailyDate').textContent='📅 '+dayKey();$('#dailyProgressText').textContent=done+' / '+total+' selesai';$('#dailyXPText').textContent='+'+dailyQuestDefs.filter(q=>daily.done[q.id]).reduce((a,q)=>a+q.xp,0)+' XP';$('#dailyBar').style.width=(done/total*100)+'%';
 list.innerHTML=dailyQuestDefs.map(q=>`<div class="quest-item ${daily.done[q.id]?'done':''}"><span class="quest-icon">${q.icon}</span><span><b>${q.title}</b><small>${q.desc}</small></span><span class="quest-reward">${daily.done[q.id]?'✓ SELESAI':'+'+q.xp+' XP'}</span>${daily.done[q.id]?'':'<button class="btn p" data-daily-go="'+q.id+'">Mulai →</button>'}</div>`).join('');
 $('#dailyStreak').textContent=String(daily.streak||0);
}
$('#dailyList')?.addEventListener('click',e=>{const b=e.target.closest('[data-daily-go]');if(!b)return;const q=dailyQuestDefs.find(x=>x.id===b.dataset.dailyGo);if(q)go(q.go)});
function updateDailyStreak(){const today=dayKey();if(daily.lastDate===today)return;const d=new Date();d.setDate(d.getDate()-1);const prev=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');daily.streak=daily.lastDate===prev?(daily.streak||0)+1:1;daily.lastDate=today;saveDaily()}
updateDailyStreak();renderDaily();
window.addEventListener('netquest:account-changed',()=>{
 daily=dailyState();
 updateDailyStreak();
 renderDaily();
});

// ===== Skill Tree =====
const skillDefs=[
 {id:'foundation',icon:'◉',name:'Network Foundation',xp:0,desc:'Dasar jaringan, perangkat, IP, dan alur komunikasi.',detail:'Mulai dari materi dasar TJKT. Target praktik: pahami fungsi router, switch, host, gateway, dan alamat IP.'},
 {id:'switching',icon:'⌁',name:'Switching Specialist',xp:60,desc:'VLAN dan segmentasi jaringan lokal.',detail:'Buka dengan XP 60. Fokus praktik: ubah VLAN pada simulasi dan buktikan kapan routing diperlukan.'},
 {id:'routing',icon:'◇',name:'Routing Engineer',xp:120,desc:'Routing, gateway, dan pengujian koneksi.',detail:'Buka dengan XP 120. Fokus praktik: gunakan Virtual Lab untuk memahami jalur PC → Switch → Router → Server.'},
 {id:'linux',icon:'$_',name:'Linux Network Ops',xp:180,desc:'Terminal Ubuntu dan layanan jaringan.',detail:'Buka dengan XP 180. Fokus praktik: gunakan Ubuntu VM untuk memeriksa IP, konektivitas, dan layanan server.'},
 {id:'troubleshoot',icon:'⚒',name:'Troubleshooting Pro',xp:250,desc:'Menganalisis gejala dan menemukan akar masalah.',detail:'Buka dengan XP 250. Fokus praktik: selesaikan kasus Story Mode dan bedakan masalah Layer 1, addressing, dan DNS.'},
 {id:'master',icon:'♛',name:'Network Master',xp:320,desc:'Jalur lanjutan untuk menyatukan semua kemampuan.',detail:'Buka dengan XP 320. Target: selesaikan kombinasi materi, simulasi, game, dan misi untuk membangun portofolio belajar.'}
];
let selectedSkill='foundation';
function renderSkillTree(){const box=$('#skillTree');if(!box)return;const xp=st?.xp||0;box.innerHTML=skillDefs.map(x=>{const ok=xp>=x.xp;return `<button class="skill-node ${ok?'unlocked':'locked'}" data-skill="${x.id}"><span class="skill-status">${ok?'✓ TERBUKA':'🔒 '+x.xp+' XP'}</span><div class="skill-icon">${x.icon}</div><h3>${x.name}</h3><p>${x.desc}</p><span class="skill-cost">${x.xp===0?'START':'UNLOCK @ '+x.xp+' XP'}</span></button>`}).join('');renderSkillDetail()}
function renderSkillDetail(){const x=skillDefs.find(v=>v.id===selectedSkill)||skillDefs[0],ok=(st?.xp||0)>=x.xp;$('#skillDetail').innerHTML=`<b>${x.name}</b><p style="margin-top:6px">${x.detail}</p><div class="msg ${ok?'ok':'no'}">${ok?'Node aktif. Kamu bisa menggunakan jalur ini sebagai target latihan.':'Node terkunci. Kumpulkan '+(x.xp-(st?.xp||0))+' XP lagi untuk membukanya.'}</div>`}
$('#skillTree')?.addEventListener('click',e=>{const b=e.target.closest('[data-skill]');if(!b)return;selectedSkill=b.dataset.skill;renderSkillDetail()});
renderSkillTree();

// ===== Certificate Center =====
function renderCertificate(){const xp=st?.xp||0,max=250,p=Math.min(100,Math.round(xp/max*100));$('#certXP').textContent=xp+' XP';$('#certBar').style.width=p+'%';const ok=xp>=max;$('#certStatus').textContent=ok?'Terbuka':'Terkunci';$('#certStatus').style.color=ok?'var(--c3)':'var(--mut)';$('#printCertificate').disabled=!ok;let name=String(window.netquestCurrentUser||'Teknisi Jaringan'),school='';try{name=localStorage.getItem('nq_demo_user')||name;school=localStorage.getItem('nq_school')||''}catch(e){}$('#certName').textContent=name;$('#certId').textContent='NQ-TJKT-'+dayKey().replaceAll('-','')+'-'+String(name.length).padStart(2,'0');$('#certFeedback').innerHTML=ok?`<b>🎉 Sertifikat terbuka.</b> ${school?('Sekolah: '+esc(school)+'. '):''}Gunakan tombol cetak untuk menyimpan atau mencetaknya.`:`Kumpulkan ${max-xp} XP lagi untuk membuka sertifikat.`}
$('#printCertificate')?.addEventListener('click',()=>{if((st?.xp||0)<250)return;window.print()});
renderCertificate();

const oldRefreshPremiumUI=refreshPremiumUI;
refreshPremiumUI=function(){oldRefreshPremiumUI();renderDaily();renderSkillTree();renderCertificate()};

window.premiumReady=true;refreshPremiumUI();
})();
