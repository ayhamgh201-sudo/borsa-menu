import {subscribe,saveMenu,starter,imgHtml,hydrateImages,saveImage,deleteImage,auth,signInWithEmailAndPassword,signOut,onAuthStateChanged} from "./db.js?v=3";
const $=id=>document.getElementById(id);let data=starter();let pending=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200)}function save(){draw();saveMenu(data).then(()=>toast('تم الحفظ ✓')).catch(()=>toast('تعذر الحفظ، تحقق من الاتصال'))}
function draw(){ $('total').textContent=data.products.length;$('catTotal').textContent=data.categories.length;const cv=$('category').value;$('category').innerHTML=data.categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');if(cv&&data.categories.some(c=>c.id===cv))$('category').value=cv;$('category').disabled=!data.categories.length;$('catList').innerHTML=data.categories.map(c=>`<span class="category-chip">${esc(c.name)} <button data-catdel="${esc(c.id)}">×</button></span>`).join('');document.querySelectorAll('[data-catdel]').forEach(b=>b.onclick=()=>{let id=b.dataset.catdel;if(data.products.some(p=>p.categoryId===id)){toast('انقل أو احذف أصناف هذا القسم أولاً');return}if(confirm('حذف القسم؟')){data.categories=data.categories.filter(c=>c.id!==id);save()}});const q=$('filter').value.toLowerCase();let list=data.products.filter(p=>(p.name+' '+(p.desc||'')).toLowerCase().includes(q));$('emptyItems').style.display=list.length?'none':'block';$('items').innerHTML=list.map(p=>{let c=data.categories.find(x=>x.id===p.categoryId);return `<article class="admin-item"><div class="admin-thumb">${p.image?imgHtml(p.image,'',p.icon||'☕'):esc(p.icon||'☕')}</div><div class="admin-info"><strong>${esc(p.name)} ${p.featured?'✦':''}</strong><small>${esc(c?.name||'')} • ${esc(p.price)}</small></div><div class="admin-actions"><button data-edit="${p.id}">تعديل</button><button class="del" data-del="${p.id}">حذف</button></div></article>`}).join('');hydrateImages($('items'));document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(confirm('حذف هذا الصنف؟')){let dp=data.products.find(p=>p.id===b.dataset.del);if(dp&&dp.image)deleteImage(dp.image);data.products=data.products.filter(p=>p.id!==b.dataset.del);save();toast('تم الحذف')}})}
$('catForm').onsubmit=e=>{e.preventDefault();let name=$('catName').value.trim();if(data.categories.some(c=>c.name===name)){toast('القسم موجود مسبقاً');return}data.categories.push({id:uid(),name,english:$('catEnglish').value.trim()});e.target.reset();save();toast('تمت إضافة القسم')};function reset(){ $('itemForm').reset();$('itemId').value='';$('icon').value='☕';$('formTitle').textContent='إضافة صنف جديد';$('saveBtn').textContent='حفظ الصنف';$('cancel').hidden=true;pending=null;$('image').value='';showPreview()}function edit(id){let p=data.products.find(x=>x.id===id);$('itemId').value=p.id;$('name').value=p.name;$('category').value=p.categoryId;$('price').value=p.price;$('desc').value=p.desc||'';$('image').value=p.image||'';pending=null;showPreview();$('icon').value=p.icon||'☕';$('featuredCheck').checked=!!p.featured;$('formTitle').textContent='تعديل الصنف';$('saveBtn').textContent='حفظ التعديلات';$('cancel').hidden=false;window.scrollTo({top:250,behavior:'smooth'})}
$('itemForm').onsubmit=async e=>{e.preventDefault();let cid=$('category').value;if(!data.categories.some(c=>c.id===cid)){toast('أضف قسماً أولاً');return}
const old=$('itemId').value,btn=$('saveBtn'),label=btn.textContent;let image=$('image').value;
if(pending){btn.disabled=true;btn.textContent='جارٍ رفع الصورة...';
 try{image=await saveImage(pending)}catch(err){toast('تعذر رفع الصورة. تأكد من تحديث قواعد Firebase والاتصال');btn.disabled=false;btn.textContent=label;return}
 btn.disabled=false;btn.textContent=label}
const prev=old?data.products.find(x=>x.id===old):null;
let p={id:old||uid(),name:$('name').value.trim(),categoryId:cid,price:$('price').value.trim(),desc:$('desc').value.trim(),image,icon:$('icon').value.trim()||'☕',featured:$('featuredCheck').checked};
if(prev&&prev.image&&prev.image!==image)deleteImage(prev.image);
if(old)data.products=data.products.map(x=>x.id===old?p:x);else data.products.push(p);save();reset();toast(old?'تم تعديل الصنف':'تمت إضافة الصنف')};$('cancel').onclick=reset;$('filter').oninput=draw;$('export').onclick=()=>{let a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download='borsa-menu-backup.json';a.click();URL.revokeObjectURL(url)};$('import').onchange=async e=>{try{let d=JSON.parse(await e.target.files[0].text());if(!Array.isArray(d.categories)||!Array.isArray(d.products))throw 0;if(confirm('استبدال المنيو الحالي بالنسخة المختارة؟')){data=d;save();toast('تم استيراد النسخة')}}catch(err){toast('ملف النسخة غير صالح')}e.target.value=''};$('deleteAll').onclick=()=>{if(confirm('حذف جميع الأصناف؟')){data.products.forEach(p=>p.image&&deleteImage(p.image));data.products=[];save();reset();toast('تم حذف الأصناف')}};
let unsub=null;
onAuthStateChanged(auth,u=>{
  $('login').hidden=!!u;$('app').hidden=!u;$('logout').hidden=!u;
  if(unsub){unsub();unsub=null}
  if(u)unsub=subscribe(d=>{data=d;draw()},()=>toast('تعذر تحميل البيانات'));
});
$('loginForm').onsubmit=async e=>{e.preventDefault();$('loginErr').textContent='';
  try{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('pass').value)}
  catch(err){$('loginErr').textContent='البريد أو كلمة المرور غير صحيحة'}};
$('logout').onclick=()=>signOut(auth);

function showPreview(){
  const box=$('imgPreview'),cur=$('image').value;
  if(pending){box.innerHTML=`<img src="${pending}" alt="">`}
  else if(cur){box.innerHTML=imgHtml(cur,'','📷');hydrateImages(box)}
  else box.textContent='📷';
  $('imgRemove').hidden=!(pending||cur);
}
// تصغير الصورة قبل الرفع (حتى 560 بكسل) لتبقى خفيفة وسريعة
function compress(file,max=560,q=0.72){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file),im=new Image();
    im.onload=()=>{
      const s=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));
      const w=Math.round(im.naturalWidth*s),h=Math.round(im.naturalHeight*s);
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);
      URL.revokeObjectURL(url);res(c.toDataURL('image/jpeg',q));
    };
    im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('bad image'))};
    im.src=url;
  });
}
$('imageFile').onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  try{pending=await compress(f);showPreview()}catch(err){toast('تعذر قراءة الصورة، جرّب صورة أخرى')}
  e.target.value='';
};
$('imgRemove').onclick=()=>{pending=null;$('image').value='';showPreview()};
