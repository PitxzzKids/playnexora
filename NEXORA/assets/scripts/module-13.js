
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const STORE='netquest_capstone_v1', RUBRIC='netquest_rubric_v1';
const form=$('nqCapstoneForm'), list=$('nqRubricList');
if(!form||!list)return;
const fields=['nqProjectName','nqProjectNeed','nqProjectTopology','nqProjectDevices','nqProjectAddress','nqProjectVlan','nqProjectSecurity','nqProjectTest'];
const safe=(fn)=>{try{return fn()}catch(e){return null}};
const read=(key,fallback)=>safe(()=>JSON.parse(localStorage.getItem(key)))||fallback;
const project=read(STORE,{});
fields.forEach(id=>{if($(id)&&project[id]!==undefined)$(id).value=project[id]});
const checks=[...list.querySelectorAll('input[type="checkbox"]')];
const saved=read(RUBRIC,[]);
checks.forEach((c,i)=>c.checked=!!saved[i]);
function updateScore(){
 const count=checks.filter(c=>c.checked).length,score=count*5,pct=score;
 $('nqRubricScore').innerHTML=score+'<span>/100</span>';
 $('nqRubricPercent').textContent=pct+'%';
 $('nqScoreRing').style.background=`conic-gradient(var(--c1) ${pct*3.6}deg,rgba(255,255,255,.1) 0deg)`;
 const advice=$('nqRubricAdvice');
 advice.textContent=score===100?'Semua indikator sudah dicentang. Siapkan demonstrasi dan bukti untuk setiap aspek.':score>=80?'Hasil audit sangat baik. Periksa kembali indikator yang belum terpenuhi.':score>=60?'Sudah berkembang. Lengkapi fitur dan bukti uji yang masih kurang.':'Lanjutkan pengembangan secara bertahap dan uji setiap fitur.';
 safe(()=>localStorage.setItem(RUBRIC,JSON.stringify(checks.map(c=>c.checked))));
}
checks.forEach(c=>c.addEventListener('change',updateScore));
form.addEventListener('submit',e=>{
 e.preventDefault();
 const data={};fields.forEach(id=>data[id]=$(id).value.trim());
 data.savedAt=new Date().toISOString();
 safe(()=>localStorage.setItem(STORE,JSON.stringify(data)));
 $('nqCapstoneStatus').textContent='Portofolio tersimpan di browser ini pada '+new Date(data.savedAt).toLocaleString('id-ID')+'.';
 $('nqCapstoneStatus').className='msg ok';
});
$('nqCapstoneReset').addEventListener('click',()=>{
 form.reset();safe(()=>localStorage.removeItem(STORE));
 $('nqCapstoneStatus').textContent='Form dikosongkan. Data tersimpan sebelumnya dihapus dari browser ini.';
 $('nqCapstoneStatus').className='msg';
});
$('nqRubricClear').addEventListener('click',()=>{checks.forEach(c=>c.checked=false);updateScore()});
$('nqRubricExport').addEventListener('click',()=>{
 const report={title:'NEXORA TJKT — Audit Rubrik',createdAt:new Date().toISOString(),score:checks.filter(c=>c.checked).length*5,maxScore:100,criteria:checks.map(c=>({criterion:c.parentElement.textContent.trim(),category:c.dataset.rubric,verified:c.checked})),disclaimer:'Audit mandiri; bukan nilai resmi atau jaminan penilaian guru.'};
 download('NEXORA-Audit-Rubrik.json',report);
});
function download(name,obj){
 const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
updateScore();
})();
