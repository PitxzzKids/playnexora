
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const ipToInt=value=>{
   const parts=String(value||'').trim().split('.');
   if(parts.length!==4)return null;
   const nums=parts.map(x=>/^\d{1,3}$/.test(x)?Number(x):NaN);
   if(nums.some(x=>!Number.isInteger(x)||x<0||x>255))return null;
   return nums.reduce((n,x)=>(n*256+x)>>>0,0)>>>0;
 };
 const intToIp=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
 const hostCapacity=prefix=>prefix<=30?Math.max(0,2**(32-prefix)-2):0;
 let subnetReport='';
 function calculateSubnet(){
   const address=$('subnetCalcAddress')?.value.trim()||'';
   const prefixRaw=$('subnetCalcPrefix')?.value??'';
   const needRaw=$('subnetHostNeed')?.value??'';
   const prefix=Number(prefixRaw),need=Number(needRaw),ip=ipToInt(address),feedback=$('subnetCalcFeedback');
   const fail=message=>{if(feedback){feedback.className='msg no';feedback.textContent=message}subnetReport='';};
   if(ip===null){fail('Alamat IPv4 tidak valid. Gunakan empat oktet dari 0 sampai 255, misalnya 192.168.10.25.');return}
   if(prefixRaw===''||!Number.isInteger(prefix)||prefix<0||prefix>32){fail('Prefix harus berupa bilangan bulat antara 0 dan 32.');return}
   if(needRaw===''||!Number.isSafeInteger(need)||need<1||need>4294967294){fail('Kebutuhan host harus berupa bilangan bulat dari 1 sampai 4.294.967.294.');return}
   const mask=prefix===0?0:(0xffffffff<<(32-prefix))>>>0;
   const network=(ip&mask)>>>0;
   const broadcast=(network|(~mask))>>>0;
   const total=2**(32-prefix);
   const usable=prefix<=30?total-2:prefix===31?2:1;
   const first=prefix<=30?(network+1)>>>0:network;
   const last=prefix<=30?(broadcast-1)>>>0:broadcast;
   const rows=[
     ['Network ID',intToIp(network)],['Broadcast',prefix>=31?'Tidak digunakan untuk aturan point-to-point / host':intToIp(broadcast)],
     ['Subnet mask',intToIp(mask)],['Total alamat',total.toLocaleString('id-ID')],['Host usable',usable.toLocaleString('id-ID')],
     ['Rentang host',prefix<=30?intToIp(first)+' – '+intToIp(last):(prefix===31?intToIp(first)+' – '+intToIp(last):intToIp(first))]
   ];
   const out=$('subnetCalcResults');
   if(out){out.replaceChildren();rows.forEach(([label,value])=>{const card=document.createElement('div');card.className='stat';const small=document.createElement('small');small.textContent=label;const strong=document.createElement('b');strong.textContent=value;card.append(small,strong);out.append(card)})}
   let recommended=null;
   for(let p=30;p>=0;p--){if(hostCapacity(p)>=need){recommended=p;break}}
   const rec=$('subnetRecommendation');
   if(rec){
     if(recommended===null){rec.textContent='Kebutuhan host terlalu besar untuk satu subnet IPv4 LAN konvensional.'}
     else{const cap=hostCapacity(recommended);rec.replaceChildren(document.createTextNode('Prefix paling kecil yang masih memenuhi kebutuhan '+need.toLocaleString('id-ID')+' host: '));const bold=document.createElement('b');bold.textContent='/'+recommended;rec.append(bold,document.createTextNode(' dengan '+cap.toLocaleString('id-ID')+' host usable.'))}
   }
   subnetReport=['NEXORA — HASIL KALKULATOR SUBNET',`Alamat input: ${address}/${prefix}`,...rows.map(x=>x[0]+': '+x[1]),rec?.textContent||''].join('\n');
   if(feedback){feedback.className='msg ok';feedback.textContent='Perhitungan berhasil. Pastikan kebutuhan host dan prefix sesuai desain jaringan.'}
 }
 $('subnetCalculate')?.addEventListener('click',calculateSubnet);
 ['subnetCalcAddress','subnetCalcPrefix','subnetHostNeed'].forEach(id=>$(id)?.addEventListener('input',calculateSubnet));
 $('subnetCopy')?.addEventListener('click',async()=>{
   if(!subnetReport){calculateSubnet();if(!subnetReport)return}
   try{await navigator.clipboard.writeText(subnetReport);$('subnetCalcFeedback').textContent='Hasil subnet berhasil disalin.'}
   catch(e){$('subnetCalcFeedback').textContent='Clipboard tidak tersedia pada browser ini. Pilih dan salin hasil yang tampil secara manual.'}
 });
 calculateSubnet();

 // Glossary filter uses textContent only; no user query is inserted into HTML.
 $('glossarySearch')?.addEventListener('input',e=>{
   const q=e.target.value.trim().toLocaleLowerCase('id');let visible=0;
   document.querySelectorAll('.glossary-item').forEach(card=>{const show=(card.dataset.term+' '+card.textContent).toLocaleLowerCase('id').includes(q);card.hidden=!show;if(show)visible++});
   const empty=$('glossaryEmpty');if(empty)empty.hidden=visible!==0;
 });

 // Personal practical journal is namespaced by the current local demo account.
 const journalKey=()=>{
   let name='guest';try{name=localStorage.getItem('nq_demo_user')||'guest'}catch(e){}
   return 'nq_journal_v1:'+encodeURIComponent(name.toLocaleLowerCase('id').slice(0,64));
 };
 let journalOwnerKey=journalKey();
 const readJournal=(key=journalOwnerKey)=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string').slice(0,100):[]}catch(e){return[]}};
 const writeJournal=(items,key=journalOwnerKey)=>{try{localStorage.setItem(key,JSON.stringify(items));return true}catch(e){return false}};
 let journalEntries=readJournal(journalOwnerKey);
 function syncJournalAccount(){const next=journalKey();if(next!==journalOwnerKey){journalOwnerKey=next;journalEntries=readJournal(journalOwnerKey);renderJournal()}}
 window.addEventListener('netquest:account-changed',syncJournalAccount);
 window.addEventListener('storage',e=>{if(e.key==='nq_demo_user')syncJournalAccount()});
 const fmtDate=stamp=>{try{return new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(stamp))}catch(e){return 'Tanggal tidak tersedia'}};
 function renderJournal(){
   const box=$('journalEntries'),count=$('journalCount');if(!box)return;
   const q=($('journalSearch')?.value||'').trim().toLocaleLowerCase('id');
   const filtered=journalEntries.filter(x=>(x.title+' '+x.topic+' '+x.steps+' '+x.reflection+' '+x.result).toLocaleLowerCase('id').includes(q));
   if(count)count.textContent=journalEntries.length+' catatan tersimpan';
   box.replaceChildren();
   if(!filtered.length){const empty=document.createElement('div');empty.className='msg';empty.textContent=journalEntries.length?'Tidak ada catatan yang cocok dengan pencarian.':'Belum ada catatan. Simpan hasil praktik pertamamu menggunakan form.';box.append(empty);return}
   filtered.forEach(entry=>{
     const card=document.createElement('article');card.className='journal-entry';
     const head=document.createElement('div');head.className='journal-entry-head';
     const titleWrap=document.createElement('div');const title=document.createElement('h4');title.textContent=entry.title;const meta=document.createElement('small');meta.textContent=entry.topic+' • '+fmtDate(entry.createdAt);titleWrap.append(title,meta);
     const del=document.createElement('button');del.type='button';del.className='journal-delete';del.dataset.journalDelete=entry.id;del.textContent='Hapus';del.setAttribute('aria-label','Hapus catatan '+entry.title);head.append(titleWrap,del);card.append(head);
     const steps=document.createElement('p');steps.textContent=entry.steps;card.append(steps);
     const result=document.createElement('span');result.className='journal-result';result.textContent='Hasil: '+entry.result;card.append(result);
     if(entry.reflection){const reflection=document.createElement('p');reflection.textContent='Kesimpulan: '+entry.reflection;card.append(reflection)}
     box.append(card);
   });
 }
 $('journalForm')?.addEventListener('submit',e=>{
   e.preventDefault();syncJournalAccount();
   const title=$('journalEntryTitle').value.trim(),steps=$('journalEntrySteps').value.trim();
   if(title.length<3||steps.length<8){$('journalFeedback').className='msg no';$('journalFeedback').textContent='Isi judul minimal 3 karakter dan langkah praktik minimal 8 karakter.';return}
   if(journalEntries.length>=100){$('journalFeedback').className='msg no';$('journalFeedback').textContent='Batas 100 catatan tercapai. Ekspor atau hapus beberapa catatan terlebih dahulu.';return}
   const entry={id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2)),title,topic:$('journalEntryTopic').value,steps,result:$('journalEntryResult').value,reflection:$('journalEntryReflection').value.trim(),createdAt:Date.now()};
   journalEntries.unshift(entry);
   if(!writeJournal(journalEntries)){journalEntries.shift();$('journalFeedback').className='msg no';$('journalFeedback').textContent='Tidak dapat menyimpan jurnal. Periksa ruang penyimpanan browser atau ekspor catatan lama.';return}
   $('journalForm').reset();$('journalFeedback').className='msg ok';$('journalFeedback').textContent='Catatan praktik berhasil disimpan pada browser ini.';renderJournal();
 });
 $('journalSearch')?.addEventListener('input',renderJournal);
 $('journalEntries')?.addEventListener('click',e=>{
   syncJournalAccount();const b=e.target.closest('[data-journal-delete]');if(!b)return;
   journalEntries=journalEntries.filter(x=>x.id!==b.dataset.journalDelete);writeJournal(journalEntries);renderJournal();
 });
 $('journalClear')?.addEventListener('click',()=>{
   syncJournalAccount();if(!journalEntries.length)return;
   if(!confirm('Hapus seluruh jurnal praktik untuk akun ini?'))return;
   journalEntries=[];writeJournal(journalEntries);renderJournal();
 });
 $('journalExport')?.addEventListener('click',()=>{
   syncJournalAccount();if(!journalEntries.length){$('journalFeedback').className='msg no';$('journalFeedback').textContent='Belum ada catatan untuk diekspor.';return}
   const text=['NEXORA TJKT — JURNAL PRAKTIK','Akun: '+(localStorage.getItem('nq_demo_user')||'guest'),''].concat(journalEntries.flatMap((x,i)=>[`${i+1}. ${x.title}`,`Tanggal: ${fmtDate(x.createdAt)}`,`Topik: ${x.topic}`,`Hasil: ${x.result}`,'Langkah dan konfigurasi:',x.steps,'Kesimpulan:',x.reflection||'-','', '----------------------------------------',''])).join('\n');
   const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NEXORA-Jurnal-Praktik.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 renderJournal();
})();
