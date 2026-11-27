
(()=>{
  let prefs={motion:true,lite:false};
  try{const saved=JSON.parse(localStorage.getItem('nq_display_prefs_v1')||'null');if(saved&&typeof saved==='object')prefs={...prefs,...saved}}catch(_){}
  const motion=prefs.motion!==false&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.toggle('nq-no-blackhole',!motion);
  const toggle=document.getElementById('nqaMotion');
  if(toggle)toggle.checked=prefs.motion!==false;
  const canvas=document.getElementById('blackholeCanvas');
  if(canvas){canvas.style.display='block';canvas.style.visibility='visible';canvas.style.opacity=motion?'.58':'0'}
})();
