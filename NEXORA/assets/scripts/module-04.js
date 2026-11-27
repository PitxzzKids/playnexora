
(()=>{
  const canvas=document.getElementById('blackholeCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  let width=1,height=1,dpr=1,raf=0,last=0,paused=false,pointerX=.5,pointerY=.4;
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const random=(min,max)=>min+Math.random()*(max-min);
  const stars=Array.from({length:260},()=>({x:Math.random(),y:Math.random(),z:random(.25,1),r:random(.25,1.4),phase:random(0,Math.PI*2),speed:random(.35,1.5)}));
  const dust=Array.from({length:330},()=>({angle:random(0,Math.PI*2),radius:random(1.08,3.15),speed:random(.025,.15)*(Math.random()<.5?-1:1),size:random(.45,1.8),alpha:random(.16,.72),tone:Math.random()}));
  const resize=()=>{
    const rect=canvas.getBoundingClientRect();
    width=Math.max(1,rect.width||innerWidth);height=Math.max(1,rect.height||innerHeight);
    dpr=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  const ellipse=(x,y,rx,ry,rotation,color,lineWidth=1,blur=0)=>{
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
    ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.stroke();ctx.restore();
  };
  const draw=(stamp)=>{
    const t=stamp*.001;
    ctx.clearRect(0,0,width,height);
    const compact=width<760;
    const cx=width*(compact?.77:.765)+(pointerX-.5)*13;
    const cy=height*(compact?.31:.34)+(pointerY-.5)*10;
    const radius=Math.max(34,Math.min(width,height)*(compact?.105:.112));

    // Low-contrast nebulae give the page depth without hiding its content.
    const nebula=ctx.createRadialGradient(cx,cy,radius*.3,cx,cy,radius*5.1);
    nebula.addColorStop(0,'rgba(91,45,148,.14)');nebula.addColorStop(.35,'rgba(91,45,148,.075)');nebula.addColorStop(.72,'rgba(20,82,130,.035)');nebula.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=nebula;ctx.fillRect(0,0,width,height);
    const haze=ctx.createRadialGradient(width*.18,height*.76,0,width*.18,height*.76,Math.max(width,height)*.58);
    haze.addColorStop(0,'rgba(31,112,142,.075)');haze.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);

    // Deep-space stars, with subtle parallax and independent twinkle phases.
    for(const star of stars){
      const twinkle=.42+.58*(.5+.5*Math.sin(t*star.speed+star.phase));
      const x=(star.x*width+(pointerX-.5)*star.z*9+width)%width;
      const y=(star.y*height+(pointerY-.5)*star.z*7+height)%height;
      ctx.globalAlpha=twinkle*(.22+star.z*.5);
      ctx.fillStyle=star.z>.78?'#f1dcff':(star.z>.48?'#9ddfff':'#9b91c7');
      ctx.beginPath();ctx.arc(x,y,star.r*star.z,0,Math.PI*2);ctx.fill();
      if(star.z>.94&&twinkle>.87){ctx.globalAlpha=.22;ctx.fillRect(x-4,y,8,.45);ctx.fillRect(x,y-4,.45,8)}
    }
    ctx.globalAlpha=1;

    // Gravitational glow and the accretion disc, built as several tilted 3D-like layers.
    const corona=ctx.createRadialGradient(cx,cy,radius*.68,cx,cy,radius*3.7);
    corona.addColorStop(0,'rgba(0,0,0,0)');corona.addColorStop(.27,'rgba(123,80,190,.05)');corona.addColorStop(.48,'rgba(147,83,216,.12)');corona.addColorStop(.67,'rgba(65,137,189,.055)');corona.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=corona;ctx.beginPath();ctx.arc(cx,cy,radius*3.7,0,Math.PI*2);ctx.fill();

    ctx.save();ctx.translate(cx,cy);ctx.rotate(-.11+Math.sin(t*.12)*.018);
    // Back-side light bending and soft disk volume.
    for(let layer=0;layer<7;layer++){
      ctx.save();ctx.rotate(t*(layer%2?-.035:.025)*(layer+1));ctx.scale(1,.19+layer*.017);
      const g=ctx.createLinearGradient(-radius*3.8,0,radius*3.8,0);
      g.addColorStop(0,'rgba(91,63,190,0)');g.addColorStop(.16,`rgba(105,75,218,${.10+layer*.012})`);
      g.addColorStop(.34,`rgba(174,105,255,${.19+layer*.014})`);g.addColorStop(.49,`rgba(255,193,224,${.28+layer*.014})`);
      g.addColorStop(.515,`rgba(255,244,222,${.4-layer*.018})`);g.addColorStop(.68,`rgba(164,105,255,${.2+layer*.01})`);g.addColorStop(1,'rgba(78,65,172,0)');
      ctx.beginPath();ctx.ellipse(0,0,radius*(2.05+layer*.22),radius*(.72+layer*.1),0,0,Math.PI*2);
      ctx.strokeStyle=g;ctx.lineWidth=radius*(.065+layer*.012);ctx.shadowColor='#a77cff';ctx.shadowBlur=18+layer*2;ctx.stroke();ctx.restore();
    }
    // Fine orbital filaments add the sense of a rotating volume.
    for(let i=0;i<16;i++){
      const phase=t*(i%2?-.09:.075)+i*.39;
      ctx.save();ctx.rotate(phase);ctx.scale(1,.24);
      ctx.beginPath();ctx.ellipse(0,0,radius*(1.28+(i%6)*.27),radius*(.63+(i%4)*.08),0,Math.PI*.12,Math.PI*1.88);
      ctx.strokeStyle=i%3===0?'rgba(255,208,235,.2)':'rgba(150,123,255,.13)';ctx.lineWidth=.7;ctx.stroke();ctx.restore();
    }
    ctx.restore();

    // Orbiting particles: warm inner flow, cool outer debris.
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-.11);ctx.scale(1,.34);
    for(const p of dust){
      const a=p.angle+t*p.speed;
      const rr=radius*p.radius;
      const x=Math.cos(a)*rr*1.42,y=Math.sin(a)*rr*.88;
      ctx.globalAlpha=p.alpha*(.55+.45*Math.sin(a*2+t));
      ctx.fillStyle=p.tone>.78?'#ffd7ef':(p.tone>.38?'#b39aff':'#8cdcff');
      ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=p.size*5;
      ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1;ctx.shadowBlur=0;

    // Photon ring, event horizon and the black core.
    ellipse(cx,cy,radius*1.15,radius*.39,-.11,'rgba(255,225,255,.76)',1.25,20);
    ellipse(cx,cy,radius*1.32,radius*.48,-.11,'rgba(151,122,255,.24)',1,15);
    const core=ctx.createRadialGradient(cx-radius*.22,cy-radius*.24,radius*.04,cx,cy,radius*1.08);
    core.addColorStop(0,'#000');core.addColorStop(.72,'#010106');core.addColorStop(.88,'#03020b');core.addColorStop(.96,'rgba(11,6,22,.94)');core.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=core;ctx.beginPath();ctx.arc(cx,cy,radius*1.08,0,Math.PI*2);ctx.fill();
    const edge=ctx.createRadialGradient(cx,cy,radius*.82,cx,cy,radius*1.12);
    edge.addColorStop(0,'rgba(0,0,0,0)');edge.addColorStop(.72,'rgba(180,132,255,.24)');edge.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=edge;ctx.beginPath();ctx.arc(cx,cy,radius*1.12,0,Math.PI*2);ctx.fill();

    // A few lensing arcs appear to curve around the event horizon.
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-.11);
    for(let i=0;i<4;i++){
      ctx.beginPath();ctx.ellipse(0,0,radius*(1.25+i*.14),radius*(.43+i*.055),0,Math.PI*(.12+i*.08),Math.PI*(.78+i*.08));
      ctx.strokeStyle=`rgba(224,190,255,${.16-i*.025})`;ctx.lineWidth=1;ctx.shadowColor='#a886ff';ctx.shadowBlur=12;ctx.stroke();
    }
    ctx.restore();ctx.shadowBlur=0;ctx.globalAlpha=1;
  };
  const shouldAnimate=()=>!paused&&!document.hidden&&!document.body.classList.contains('nq-no-blackhole')&&!reduceMotion;
  const loop=now=>{
    if(!shouldAnimate()){raf=0;draw(now);return}
    raf=requestAnimationFrame(loop);
    if(now-last>30){last=now;draw(now)}
  };
  const start=()=>{if(!raf){if(shouldAnimate())raf=requestAnimationFrame(loop);else draw(performance.now())}};
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0};
  resize();start();
  window.addEventListener('resize',()=>{resize();draw(performance.now())},{passive:true});
  window.addEventListener('pointermove',e=>{pointerX=e.clientX/Math.max(1,innerWidth);pointerY=e.clientY/Math.max(1,innerHeight)},{passive:true});
  document.addEventListener('visibilitychange',()=>{paused=document.hidden;if(paused)stop();else start()});
  new MutationObserver(()=>{if(shouldAnimate())start();else{stop();draw(performance.now())}}).observe(document.body,{attributes:true,attributeFilter:['class']});
  if(reduceMotion)draw(0);
})();
(()=>{
const toast=msg=>{let el=document.querySelector('.toast-bh');if(!el){el=document.createElement('div');el.className='toast-bh';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=msg;clearTimeout(el._timer);el._timer=setTimeout(()=>el.remove(),2800)};const keys=()=>{const out=new Set(['nq','nq_demo_user','nq_school','nq_accounts','nq_admin_quests','nq_lab_done','tjktQuestEnhanced.v2']);try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(k.startsWith('nq_')||k.startsWith('netquest_')||k.startsWith('cybershield_')||k.startsWith('tjktQuestEnhanced.v2:')))out.add(k)}}catch(e){}return [...out]};document.getElementById('backupExport')?.addEventListener('click',()=>{try{const data={app:'NEXORA TJKT',format:1,exportedAt:new Date().toISOString(),data:{}};keys().forEach(k=>{const v=localStorage.getItem(k);if(v!==null)data.data[k]=v});const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='netquest-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup progres berhasil dibuat.')}catch(e){toast('Backup gagal: penyimpanan browser tidak tersedia.')}});document.getElementById('backupImport')?.addEventListener('click',()=>document.getElementById('backupImportFile')?.click());const isNEXORAStorageKey=k=>['nq','nq_demo_user','nq_school','nq_accounts','nq_admin_quests','nq_lab_done','tjktQuestEnhanced.v2'].includes(k)||k.startsWith('nq_')||k.startsWith('netquest_')||k.startsWith('cybershield_')||k.startsWith('tjktQuestEnhanced.v2:');document.getElementById('backupImportFile')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>12000000)throw Error('File backup terlalu besar');const obj=JSON.parse(await f.text());if(obj.app!=='NEXORA TJKT'||obj.format!==1||!obj.data||typeof obj.data!=='object'||Array.isArray(obj.data))throw Error('Format backup tidak dikenali');const staged={};for(const [k,v] of Object.entries(obj.data)){if(!isNEXORAStorageKey(k))continue;if(typeof v!=='string'||v.length>2000000)throw Error('Isi backup tidak valid');staged[k]=v}if(!Object.keys(staged).length)throw Error('Backup tidak berisi data NEXORA');if(!confirm('Impor backup akan mengganti seluruh data NEXORA pada browser ini. Lanjutkan?'))return;const snapshot={};const current=keys().filter(isNEXORAStorageKey);current.forEach(k=>{const v=localStorage.getItem(k);if(v!==null)snapshot[k]=v});try{current.forEach(k=>localStorage.removeItem(k));Object.entries(staged).forEach(([k,v])=>localStorage.setItem(k,v));toast('Backup berhasil dipulihkan. Muat ulang halaman untuk menerapkan seluruh data.')}catch(writeError){try{keys().filter(isNEXORAStorageKey).forEach(k=>localStorage.removeItem(k));Object.entries(snapshot).forEach(([k,v])=>localStorage.setItem(k,v))}catch(rollbackError){console.error('[NEXORA] Backup rollback failed:',rollbackError)}throw writeError}}catch(err){console.error('[NEXORA] Backup import failed:',err);toast('Impor gagal. File tidak valid atau penyimpanan browser tidak mencukupi. Data sebelumnya dipertahankan bila pemulihan memungkinkan.')}finally{e.target.value=''}});addEventListener('error',e=>console.error('NEXORA runtime error:',e.message,e.filename,e.lineno))})();
