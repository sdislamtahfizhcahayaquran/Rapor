const SUPABASE_URL='https://lmglkxzemtvxcgktiord.supabase.co';
const SUPABASE_KEY='sb_publishable_3HyNVUYXakILMKo2SK-DJw_ka7-Yx93';
const state={classes:[],period:null,token:''};
const $=s=>document.querySelector(s);
const statusBox=$('#status');
function setStatus(msg,type='info'){statusBox.textContent=msg;statusBox.dataset.type=type}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function rpcUrl(name){return `${SUPABASE_URL}/rest/v1/rpc/${name}`}
async function rpc(name,payload={}){const r=await fetch(rpcUrl(name),{method:'POST',headers:{'content-type':'application/json','apikey':SUPABASE_KEY,'authorization':`Bearer ${SUPABASE_KEY}`},body:JSON.stringify(payload)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||j.error||`HTTP ${r.status}`);return j}
async function call(action,payload={}){
  if(!state.token)throw new Error('viewer_token_missing');
  if(action==='bootstrap')return rpc('yayasan_live_rapor_bootstrap',{p_token:state.token});
  if(action==='students'||action==='class_detail')return rpc('yayasan_live_rapor_students',{p_token:state.token,p_class_id:payload.class_id});
  throw new Error('report_preview_not_active');
}
function initToken(){
  const raw=location.hash.replace(/^#/,'').trim();
  if(raw){
    const token=raw.startsWith('k=')?decodeURIComponent(raw.slice(2)):raw;
    if(token)sessionStorage.setItem('cq_rapor_viewer_token',token);
    history.replaceState(null,'',location.pathname+location.search);
  }
  state.token=sessionStorage.getItem('cq_rapor_viewer_token')||'';
}
function renderClasses(){
  const q=$('#search').value.toLowerCase(),f=$('#filter').value;
  const rows=state.classes.filter(c=>`${c.name} ${c.code} ${c.walas||''}`.toLowerCase().includes(q)).filter(c=>f==='all'||(f==='complete'&&Number(c.incomplete_count||0)===0)||(f==='incomplete'&&Number(c.incomplete_count||0)>0));
  $('#classRows').innerHTML=rows.map(c=>`<tr><td><strong>${esc(c.name||c.code)}</strong></td><td>${esc(c.walas||'-')}</td><td>${esc(c.progress??0)}%</td><td>${Number(c.incomplete_count||0)?`<span class="badge warn">${esc(c.incomplete_count)}</span>`:'<span class="badge ok">0</span>'}</td><td><button data-detail="${esc(c.id)}">Lihat</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Belum ada data.</td></tr>';
  $('#classSelect').innerHTML='<option value="">Pilih kelas</option>'+state.classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name||c.code)}</option>`).join('');
  document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>openDetail(b.dataset.detail));
}
async function bootstrap(){
  initToken();
  if(!state.token){setStatus('Link viewer belum membawa token akses.','warn');$('#period').textContent='Akses belum aktif';renderClasses();return}
  try{
    setStatus('Memuat data rapor…');
    const j=await call('bootstrap');
    state.classes=j.classes||[];
    state.period={academic_year:j.academic_year,semester_no:j.semester_no};
    $('#period').textContent=`${j.academic_year||'-'} • Semester ${j.semester_no||'-'} • PTS`;
    setStatus('Terhubung • mode baca saja');
    renderClasses();
  }catch(e){setStatus(`Gagal memuat: ${e.message}`,'warn');renderClasses()}
}
async function openDetail(id){
  try{
    const j=await call('class_detail',{class_id:id});
    const cls=state.classes.find(x=>x.id===id)||{};
    $('#detailTitle').textContent=`${cls.name||cls.code||'Kelas'} • ${cls.walas||'-'}`;
    $('#studentRows').innerHTML=(j.students||[]).map(s=>`<tr><td>${esc(s.name)}</td><td>${s.status==='Selesai'?'<span class="badge ok">Selesai</span>':'<span class="badge warn">Belum lengkap</span>'}</td><td>${esc((s.missing||[]).join(', ')||'-')}</td><td><button data-report="${esc(id)}|${esc(s.id)}">Lihat Rapor</button></td></tr>`).join('')||'<tr><td colspan="4" class="empty">Belum ada siswa.</td></tr>';
    document.querySelectorAll('[data-report]').forEach(b=>b.onclick=()=>{const [c,s]=b.dataset.report.split('|');$('#detailDialog').close();showReport(c,s)});
    $('#detailDialog').showModal();
  }catch(e){setStatus(`Gagal membuka kelas: ${e.message}`,'warn')}
}
async function showReport(classId,studentId){
  document.querySelector('[data-tab="rapor"]').click();
  $('#reportArea').innerHTML='<article class="report-card"><h2>Preview rapor penuh sedang dikunci</h2><p class="muted">Daftar kelas dan siswa sudah tersambung secara read-only. Preview rapor penuh belum dibuka karena endpoint detail masih menunggu jalur autentikasi yang lebih ketat.</p></article>';
}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active')});
$('#search').oninput=renderClasses;
$('#filter').onchange=renderClasses;
$('#refresh').onclick=bootstrap;
$('#closeDialog').onclick=()=>$('#detailDialog').close();
$('#classSelect').onchange=e=>$('#openClass').disabled=!e.target.value;
$('#openClass').onclick=async()=>{const id=$('#classSelect').value;if(id)openDetail(id)};
bootstrap();