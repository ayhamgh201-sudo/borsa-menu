import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore,doc,onSnapshot,setDoc,getDoc,deleteDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {firebaseConfig} from "./firebase-config.js";

const app=initializeApp(firebaseConfig);
export const db=getFirestore(app), auth=getAuth(app);
const ref=doc(db,'menu','main');

export const starter=()=>({categories:[{id:'cold',name:'مشروبات باردة',english:'COLD DRINKS'},{id:'hot',name:'مشروبات ساخنة',english:'HOT DRINKS'},{id:'sweets',name:'سويت وحلويات',english:'SWEETS & DESSERTS'},{id:'breakfast',name:'وجبات الفطور',english:'BREAKFAST'}],products:[]});

const clean=d=>({categories:Array.isArray(d?.categories)?d.categories:[],products:Array.isArray(d?.products)?d.products:[]});

// تحديث مباشر: يُستدعى cb عند أي تغيير يحفظه الموظف
export function subscribe(cb,onErr){
  return onSnapshot(ref,s=>cb(s.exists()?clean(s.data()):starter()),onErr);
}
export const saveMenu=d=>setDoc(ref,{...clean(d),updatedAt:Date.now()});
export {signInWithEmailAndPassword,signOut,onAuthStateChanged};

// ===== الصور: تُحفظ مصغّرة في مجموعة images، وتُخزَّن على الجهاز بعد أول تحميل =====
const ready={};
const LS='borsa_img_';
const esc2=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cached(id){
  if(ready[id]) return ready[id];
  try{const c=localStorage.getItem(LS+id);if(c){ready[id]=c;return c}}catch(e){}
  return '';
}
const loading=new Map();
export function resolveImage(ref){
  if(!ref||!ref.startsWith('img:')) return Promise.resolve(ref||'');
  const id=ref.slice(4), c=cached(id);
  if(c) return Promise.resolve(c);
  if(!loading.has(id)) loading.set(id,getDoc(doc(db,'images',id)).then(s=>{
    loading.delete(id);
    const v=s.exists()?s.data().data:'';
    if(v){ready[id]=v;try{localStorage.setItem(LS+id,v)}catch(e){}}
    return v;
  }).catch(()=>{loading.delete(id);return ''}));
  return loading.get(id);
}
export function imgHtml(ref,alt='',icon=''){
  if(!ref) return '';
  if(ref.startsWith('img:')){
    const c=cached(ref.slice(4));
    return c?`<img src="${c}" alt="${esc2(alt)}">`:`<img data-ref="${esc2(ref)}" data-icon="${esc2(icon)}" alt="${esc2(alt)}">`;
  }
  return `<img src="${esc2(ref)}" alt="${esc2(alt)}">`;
}
export function hydrateImages(root=document){
  root.querySelectorAll('img[data-ref]').forEach(el=>{
    const ref=el.dataset.ref;el.removeAttribute('data-ref');
    resolveImage(ref).then(src=>{if(src)el.src=src;else if(el.parentNode)el.parentNode.textContent=el.dataset.icon||'☕'});
  });
}
export async function saveImage(dataUrl){
  const id='i'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  await setDoc(doc(db,'images',id),{data:dataUrl,createdAt:Date.now()});
  ready[id]=dataUrl;
  return 'img:'+id;
}
export function deleteImage(ref){
  if(!ref||!ref.startsWith('img:')) return;
  const id=ref.slice(4);delete ready[id];
  try{localStorage.removeItem(LS+id)}catch(e){}
  deleteDoc(doc(db,'images',id)).catch(()=>{});
}
// ===== نهاية الصور =====
