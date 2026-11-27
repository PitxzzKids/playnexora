
(()=>{'use strict';
 const KEY='nexora_lms_assignments_v1',DONE='nexora_lms_assignment_done_v1';
 const $=id=>document.getElementById(id);
 const safeRead=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch(_){return fallback}};
 const getTasks=()=>safeRead(KEY,[]),getDone=()=>safeRead(DONE,{});
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const studentKey=()=>{const n=$('dashName')?.textContent?.trim()||$('loginName')?.value?.trim()||'Siswa';return n.toLowerCase()};
 function render(){const tasks=getTasks(),done=getDone(),who=studentKey();const student=$('nexoraStudentAssignmentList'),teacher=$('nexoraTeacherAssignmentList'),count=$('nexoraAssignmentCount');
  if(count)count.textContent=tasks.length+' TUGAS';
  if(student)student.innerHTML=tasks.length?tasks.map(t=>{const complete=!!done[who+'|'+t.id];return `<article class="nexora-assignment-item ${complete?'is-done':''}"><h4>${esc(t.title)}</h4><div class="nexora-assignment-meta"><span>${esc(t.topic)}</span><span>${t.due?'Tenggat: '+esc(t.due):'Tanpa tenggat'}</span><span>${complete?'✓ Selesai':'Belum selesai'}</span></div><p>${esc(t.desc)}</p><button class="btn ${complete?'':'p'}" type="button" data-nexora-done="${esc(t.id)}">${complete?'Tandai belum selesai':'Tandai selesai'}</button></article>`}).join(''):'<p class="msg">Belum ada tugas. Guru dapat menambahkan tugas melalui Teacher Center.</p>';
  if(teacher)teacher.innerHTML=tasks.length?tasks.map(t=>`<article class="nexora-assignment-item"><h4>${esc(t.title)}</h4><div class="nexora-assignment-meta"><span>${esc(t.topic)}</span><span>${t.due?'Tenggat: '+esc(t.due):'Tanpa tenggat'}</span><span>Dibuat: ${esc(t.created)}</span></div><p>${esc(t.desc)}</p><button class="btn" type="button" data-nexora-delete="${esc(t.id)}">Hapus tugas</button></article>`).join(''):'<p class="msg">Belum ada tugas yang diterbitkan.</p>';
 }
 const form=$('nexoraAssignmentForm');if(form)form.addEventListener('submit',e=>{e.preventDefault();const title=$('nexoraAssignmentTitle')?.value.trim(),desc=$('nexoraAssignmentDesc')?.value.trim();if(!title||!desc)return;const tasks=getTasks();tasks.unshift({id:'tsk_'+Date.now().toString(36),title,topic:$('nexoraAssignmentTopic')?.value||'Umum',desc,due:$('nexoraAssignmentDue')?.value||'',created:new Date().toLocaleDateString('id-ID')});try{localStorage.setItem(KEY,JSON.stringify(tasks));form.reset();if($('nexoraAssignmentFeedback'))$('nexoraAssignmentFeedback').textContent='Tugas berhasil diterbitkan pada browser ini.';render()}catch(_){if($('nexoraAssignmentFeedback'))$('nexoraAssignmentFeedback').textContent='Penyimpanan penuh atau diblokir oleh browser.'}});
 document.addEventListener('click',e=>{const doneBtn=e.target.closest('[data-nexora-done]');if(doneBtn){const done=getDone(),k=studentKey()+'|'+doneBtn.dataset.nexoraDone;if(done[k])delete done[k];else done[k]=true;try{localStorage.setItem(DONE,JSON.stringify(done))}catch(_){}render();return}const del=e.target.closest('[data-nexora-delete]');if(del){const tasks=getTasks().filter(t=>t.id!==del.dataset.nexoraDelete);try{localStorage.setItem(KEY,JSON.stringify(tasks))}catch(_){}render()}});
 render();document.addEventListener('click',e=>{if(e.target.closest('[data-v]'))setTimeout(render,120)});
})();
