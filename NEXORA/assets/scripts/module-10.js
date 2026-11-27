
(()=>{
 'use strict';
 const sidebar=document.getElementById('mainSidebar');
 const search=document.getElementById('navSearch');
 const close=()=>document.body.classList.remove('sidebar-open');
 const open=()=>document.body.classList.add('sidebar-open');
 document.getElementById('mobileMenuTrigger')?.addEventListener('click',open);
 document.getElementById('sidebarClose')?.addEventListener('click',close);
 document.getElementById('sidebarScrim')?.addEventListener('click',close);
 document.getElementById('sidebarCollapse')?.addEventListener('click',()=>{
   if(innerWidth<=900){close();return}
   document.body.classList.toggle('sidebar-collapsed');
 });
 sidebar?.querySelectorAll('[data-v]').forEach(button=>button.addEventListener('click',()=>{
   close();
   if(search){search.value='';filterMenus('')}
 }));
 function filterMenus(value){
   const q=String(value||'').trim().toLocaleLowerCase('id');
   sidebar?.querySelectorAll('.nav-group').forEach(group=>{
     let shown=0;
     group.querySelectorAll('button[data-v]').forEach(button=>{
       const match=!q||button.textContent.toLocaleLowerCase('id').includes(q);
       button.hidden=!match;if(match)shown++;
     });
     group.hidden=shown===0;
   });
 }
 search?.addEventListener('input',()=>filterMenus(search.value));
 document.addEventListener('keydown',event=>{
   if((event.key==='/'||event.key.toLowerCase()==='k')&&!event.ctrlKey&&!event.metaKey&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){
     event.preventDefault();if(innerWidth<=900)open();search?.focus();
   }
   if(event.key==='Escape')close();
 });
 window.addEventListener('resize',()=>{if(innerWidth>900)close()},{passive:true});
})();
