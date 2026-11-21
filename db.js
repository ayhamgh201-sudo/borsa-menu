import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore,doc,onSnapshot,setDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
