function g(){}const mt=t=>t;function pt(t,e){for(const n in e)t[n]=e[n];return t}function et(t){return t()}function Y(){return Object.create(null)}function E(t){t.forEach(et)}function T(t){return typeof t=="function"}function yt(t,e){return t!=t?e==e:t!==e||t&&typeof t=="object"||typeof t=="function"}function gt(t){return Object.keys(t).length===0}function Q(t,...e){if(t==null)return g;const n=t.subscribe(...e);return n.unsubscribe?()=>n.unsubscribe():n}function Kt(t){let e;return Q(t,n=>e=n)(),e}function Qt(t,e,n){t.$$.on_destroy.push(Q(e,n))}function Ut(t,e,n,i){if(t){const s=nt(t,e,n,i);return t[0](s)}}function nt(t,e,n,i){return t[1]&&i?pt(n.ctx.slice(),t[1](i(e))):n.ctx}function Vt(t,e,n,i){if(t[2]&&i){const s=t[2](i(n));if(e.dirty===void 0)return s;if(typeof s=="object"){const u=[],o=Math.max(e.dirty.length,s.length);for(let r=0;r<o;r+=1)u[r]=e.dirty[r]|s[r];return u}return e.dirty|s}return e.dirty}function Xt(t,e,n,i,s,u){if(s){const o=nt(e,n,i,u);t.p(o,s)}}function Yt(t){if(t.ctx.length>32){const e=[],n=t.ctx.length/32;for(let i=0;i<n;i++)e[i]=-1;return e}return-1}function Zt(t){const e={};for(const n in t)n[0]!=="$"&&(e[n]=t[n]);return e}function te(t,e){const n={};e=new Set(e);for(const i in t)!e.has(i)&&i[0]!=="$"&&(n[i]=t[i]);return n}function ee(t){const e={};for(const n in t)e[n]=!0;return e}function ne(t){return t??""}function ie(t,e,n){return t.set(n),e}function se(t){return t&&T(t.destroy)?t.destroy:g}const it=typeof window<"u";let bt=it?()=>window.performance.now():()=>Date.now(),U=it?t=>requestAnimationFrame(t):g;const A=new Set;function st(t){A.forEach(e=>{e.c(t)||(A.delete(e),e.f())}),A.size!==0&&U(st)}function $t(t){let e;return A.size===0&&U(st),{promise:new Promise(n=>{A.add(e={c:t,f:n})}),abort(){A.delete(e)}}}let I=!1;function wt(){I=!0}function xt(){I=!1}function vt(t,e,n,i){for(;t<e;){const s=t+(e-t>>1);n(s)<=i?t=s+1:e=s}return t}function kt(t){if(t.hydrate_init)return;t.hydrate_init=!0;let e=t.childNodes;if(t.nodeName==="HEAD"){const c=[];for(let l=0;l<e.length;l++){const f=e[l];f.claim_order!==void 0&&c.push(f)}e=c}const n=new Int32Array(e.length+1),i=new Int32Array(e.length);n[0]=-1;let s=0;for(let c=0;c<e.length;c++){const l=e[c].claim_order,f=(s>0&&e[n[s]].claim_order<=l?s+1:vt(1,s,h=>e[n[h]].claim_order,l))-1;i[c]=n[f]+1;const _=f+1;n[_]=c,s=Math.max(_,s)}const u=[],o=[];let r=e.length-1;for(let c=n[s]+1;c!=0;c=i[c-1]){for(u.push(e[c-1]);r>=c;r--)o.push(e[r]);r--}for(;r>=0;r--)o.push(e[r]);u.reverse(),o.sort((c,l)=>c.claim_order-l.claim_order);for(let c=0,l=0;c<o.length;c++){for(;l<u.length&&o[c].claim_order>=u[l].claim_order;)l++;const f=l<u.length?u[l]:null;t.insertBefore(o[c],f)}}function Et(t,e){t.appendChild(e)}function rt(t){if(!t)return document;const e=t.getRootNode?t.getRootNode():t.ownerDocument;return e&&e.host?e:t.ownerDocument}function Nt(t){const e=ct("style");return St(rt(t),e),e.sheet}function St(t,e){return Et(t.head||t,e),e.sheet}function At(t,e){if(I){for(kt(t),(t.actual_end_child===void 0||t.actual_end_child!==null&&t.actual_end_child.parentNode!==t)&&(t.actual_end_child=t.firstChild);t.actual_end_child!==null&&t.actual_end_child.claim_order===void 0;)t.actual_end_child=t.actual_end_child.nextSibling;e!==t.actual_end_child?(e.claim_order!==void 0||e.parentNode!==t)&&t.insertBefore(e,t.actual_end_child):t.actual_end_child=e.nextSibling}else(e.parentNode!==t||e.nextSibling!==null)&&t.appendChild(e)}function re(t,e,n){I&&!n?At(t,e):(e.parentNode!==t||e.nextSibling!=n)&&t.insertBefore(e,n||null)}function ot(t){t.parentNode&&t.parentNode.removeChild(t)}function oe(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function ct(t){return document.createElement(t)}function jt(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function V(t){return document.createTextNode(t)}function ce(){return V(" ")}function le(){return V("")}function ue(t,e,n,i){return t.addEventListener(e,n,i),()=>t.removeEventListener(e,n,i)}function X(t,e,n){n==null?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function ae(t,e){const n=Object.getOwnPropertyDescriptors(t.__proto__);for(const i in e)e[i]==null?t.removeAttribute(i):i==="style"?t.style.cssText=e[i]:i==="__value"?t.value=t[i]=e[i]:n[i]&&n[i].set?t[i]=e[i]:X(t,i,e[i])}function fe(t,e){for(const n in e)X(t,n,e[n])}function _e(t,e){Object.keys(e).forEach(n=>{Ct(t,n,e[n])})}function Ct(t,e,n){e in t?t[e]=typeof t[e]=="boolean"&&n===""?!0:n:X(t,e,n)}function de(t,e,n){const i=new Set;for(let s=0;s<t.length;s+=1)t[s].checked&&i.add(t[s].__value);return n||i.delete(e),Array.from(i)}function Mt(t){return Array.from(t.childNodes)}function Ot(t){t.claim_info===void 0&&(t.claim_info={last_index:0,total_claimed:0})}function lt(t,e,n,i,s=!1){Ot(t);const u=(()=>{for(let o=t.claim_info.last_index;o<t.length;o++){const r=t[o];if(e(r)){const c=n(r);return c===void 0?t.splice(o,1):t[o]=c,s||(t.claim_info.last_index=o),r}}for(let o=t.claim_info.last_index-1;o>=0;o--){const r=t[o];if(e(r)){const c=n(r);return c===void 0?t.splice(o,1):t[o]=c,s?c===void 0&&t.claim_info.last_index--:t.claim_info.last_index=o,r}}return i()})();return u.claim_order=t.claim_info.total_claimed,t.claim_info.total_claimed+=1,u}function ut(t,e,n,i){return lt(t,s=>s.nodeName===e,s=>{const u=[];for(let o=0;o<s.attributes.length;o++){const r=s.attributes[o];n[r.name]||u.push(r.name)}u.forEach(o=>s.removeAttribute(o))},()=>i(e))}function he(t,e,n){return ut(t,e,n,ct)}function me(t,e,n){return ut(t,e,n,jt)}function Dt(t,e){return lt(t,n=>n.nodeType===3,n=>{const i=""+e;if(n.data.startsWith(i)){if(n.data.length!==i.length)return n.splitText(i.length)}else n.data=i},()=>V(e),!0)}function pe(t){return Dt(t," ")}function ye(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function ge(t,e){t.value=e??""}function be(t,e,n,i){n===null?t.style.removeProperty(e):t.style.setProperty(e,n,i?"important":"")}function $e(t,e,n){t.classList[n?"add":"remove"](e)}function at(t,e,{bubbles:n=!1,cancelable:i=!1}={}){const s=document.createEvent("CustomEvent");return s.initCustomEvent(t,n,i,e),s}function we(t,e){return new t(e)}const B=new Map;let F=0;function Pt(t){let e=5381,n=t.length;for(;n--;)e=(e<<5)-e^t.charCodeAt(n);return e>>>0}function Tt(t,e){const n={stylesheet:Nt(e),rules:{}};return B.set(t,n),n}function Z(t,e,n,i,s,u,o,r=0){const c=16.666/i;let l=`{
`;for(let y=0;y<=1;y+=c){const b=e+(n-e)*u(y);l+=y*100+`%{${o(b,1-b)}}
`}const f=l+`100% {${o(n,1-n)}}
}`,_=`__svelte_${Pt(f)}_${r}`,h=rt(t),{stylesheet:a,rules:d}=B.get(h)||Tt(h,t);d[_]||(d[_]=!0,a.insertRule(`@keyframes ${_} ${f}`,a.cssRules.length));const p=t.style.animation||"";return t.style.animation=`${p?`${p}, `:""}${_} ${i}ms linear ${s}ms 1 both`,F+=1,_}function zt(t,e){const n=(t.style.animation||"").split(", "),i=n.filter(e?u=>u.indexOf(e)<0:u=>u.indexOf("__svelte")===-1),s=n.length-i.length;s&&(t.style.animation=i.join(", "),F-=s,F||qt())}function qt(){U(()=>{F||(B.forEach(t=>{const{ownerNode:e}=t.stylesheet;e&&ot(e)}),B.clear())})}let P;function D(t){P=t}function j(){if(!P)throw new Error("Function called outside component initialization");return P}function xe(t){j().$$.on_mount.push(t)}function ve(t){j().$$.after_update.push(t)}function ke(t){j().$$.on_destroy.push(t)}function Ee(){const t=j();return(e,n,{cancelable:i=!1}={})=>{const s=t.$$.callbacks[e];if(s){const u=at(e,n,{cancelable:i});return s.slice().forEach(o=>{o.call(t,u)}),!u.defaultPrevented}return!0}}function Ne(t,e){return j().$$.context.set(t,e),e}function Se(t){return j().$$.context.get(t)}function Ae(t,e){const n=t.$$.callbacks[e.type];n&&n.slice().forEach(i=>i.call(this,e))}const O=[],tt=[],L=[],J=[],ft=Promise.resolve();let K=!1;function _t(){K||(K=!0,ft.then(dt))}function je(){return _t(),ft}function H(t){L.push(t)}function Ce(t){J.push(t)}const W=new Set;let q=0;function dt(){const t=P;do{for(;q<O.length;){const e=O[q];q++,D(e),Lt(e.$$)}for(D(null),O.length=0,q=0;tt.length;)tt.pop()();for(let e=0;e<L.length;e+=1){const n=L[e];W.has(n)||(W.add(n),n())}L.length=0}while(O.length);for(;J.length;)J.pop()();K=!1,W.clear(),D(t)}function Lt(t){if(t.fragment!==null){t.update(),E(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(H)}}let M;function Rt(){return M||(M=Promise.resolve(),M.then(()=>{M=null})),M}function G(t,e,n){t.dispatchEvent(at(`${e?"intro":"outro"}${n}`))}const R=new Set;let x;function Me(){x={r:0,c:[],p:x}}function Oe(){x.r||E(x.c),x=x.p}function ht(t,e){t&&t.i&&(R.delete(t),t.i(e))}function Bt(t,e,n,i){if(t&&t.o){if(R.has(t))return;R.add(t),x.c.push(()=>{R.delete(t),i&&(n&&t.d(1),i())}),t.o(e)}else i&&i()}const Ft={duration:0};function De(t,e,n,i){const s={direction:"both"};let u=e(t,n,s),o=i?0:1,r=null,c=null,l=null;function f(){l&&zt(t,l)}function _(a,d){const p=a.b-o;return d*=Math.abs(p),{a:o,b:a.b,d:p,duration:d,start:a.start,end:a.start+d,group:a.group}}function h(a){const{delay:d=0,duration:p=300,easing:y=mt,tick:b=g,css:v}=u||Ft,N={start:bt()+d,b:a};a||(N.group=x,x.r+=1),r||c?c=N:(v&&(f(),l=Z(t,o,a,p,d,y,v)),a&&b(0,1),r=_(N,p),H(()=>G(t,a,"start")),$t(k=>{if(c&&k>c.start&&(r=_(c,p),c=null,G(t,r.b,"start"),v&&(f(),l=Z(t,o,r.b,r.duration,0,y,u.css))),r){if(k>=r.end)b(o=r.b,1-o),G(t,r.b,"end"),c||(r.b?f():--r.group.r||E(r.group.c)),r=null;else if(k>=r.start){const C=k-r.start;o=r.a+r.d*y(C/r.duration),b(o,1-o)}}return!!(r||c)}))}return{run(a){T(u)?Rt().then(()=>{u=u(s),h(a)}):h(a)},end(){f(),r=c=null}}}const Pe=typeof window<"u"?window:typeof globalThis<"u"?globalThis:global;function Te(t,e){Bt(t,1,1,()=>{e.delete(t.key)})}function ze(t,e,n,i,s,u,o,r,c,l,f,_){let h=t.length,a=u.length,d=h;const p={};for(;d--;)p[t[d].key]=d;const y=[],b=new Map,v=new Map;for(d=a;d--;){const m=_(s,u,d),$=n(m);let w=o.get($);w?i&&w.p(m,e):(w=l($,m),w.c()),b.set($,y[d]=w),$ in p&&v.set($,Math.abs(d-p[$]))}const N=new Set,k=new Set;function C(m){ht(m,1),m.m(r,f),o.set(m.key,m),f=m.first,a--}for(;h&&a;){const m=y[a-1],$=t[h-1],w=m.key,z=$.key;m===$?(f=m.first,h--,a--):b.has(z)?!o.has(w)||N.has(w)?C(m):k.has(z)?h--:v.get(w)>v.get(z)?(k.add(w),C(m)):(N.add(z),h--):(c($,o),h--)}for(;h--;){const m=t[h];b.has(m.key)||c(m,o)}for(;a;)C(y[a-1]);return y}function qe(t,e){const n={},i={},s={$$scope:1};let u=t.length;for(;u--;){const o=t[u],r=e[u];if(r){for(const c in o)c in r||(i[c]=1);for(const c in r)s[c]||(n[c]=r[c],s[c]=1);t[u]=r}else for(const c in o)s[c]=1}for(const o in i)o in n||(n[o]=void 0);return n}function Le(t){return typeof t=="object"&&t!==null?t:{}}function Re(t,e,n,i){const s=t.$$.props[e];s!==void 0&&(t.$$.bound[s]=n,i===void 0&&n(t.$$.ctx[s]))}function Be(t){t&&t.c()}function Fe(t,e){t&&t.l(e)}function Ht(t,e,n,i){const{fragment:s,after_update:u}=t.$$;s&&s.m(e,n),i||H(()=>{const o=t.$$.on_mount.map(et).filter(T);t.$$.on_destroy?t.$$.on_destroy.push(...o):E(o),t.$$.on_mount=[]}),u.forEach(H)}function It(t,e){const n=t.$$;n.fragment!==null&&(E(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function Wt(t,e){t.$$.dirty[0]===-1&&(O.push(t),_t(),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function He(t,e,n,i,s,u,o,r=[-1]){const c=P;D(t);const l=t.$$={fragment:null,ctx:[],props:u,update:g,not_equal:s,bound:Y(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(e.context||(c?c.$$.context:[])),callbacks:Y(),dirty:r,skip_bound:!1,root:e.target||c.$$.root};o&&o(l.root);let f=!1;if(l.ctx=n?n(t,e.props||{},(_,h,...a)=>{const d=a.length?a[0]:h;return l.ctx&&s(l.ctx[_],l.ctx[_]=d)&&(!l.skip_bound&&l.bound[_]&&l.bound[_](d),f&&Wt(t,_)),h}):[],l.update(),f=!0,E(l.before_update),l.fragment=i?i(l.ctx):!1,e.target){if(e.hydrate){wt();const _=Mt(e.target);l.fragment&&l.fragment.l(_),_.forEach(ot)}else l.fragment&&l.fragment.c();e.intro&&ht(t.$$.fragment),Ht(t,e.target,e.anchor,e.customElement),xt(),dt()}D(c)}class Ie{$destroy(){It(this,1),this.$destroy=g}$on(e,n){if(!T(n))return g;const i=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return i.push(n),()=>{const s=i.indexOf(n);s!==-1&&i.splice(s,1)}}$set(e){this.$$set&&!gt(e)&&(this.$$.skip_bound=!0,this.$$set(e),this.$$.skip_bound=!1)}}const S=[];function Gt(t,e){return{subscribe:Jt(t,e).subscribe}}function Jt(t,e=g){let n;const i=new Set;function s(r){if(yt(t,r)&&(t=r,n)){const c=!S.length;for(const l of i)l[1](),S.push(l,t);if(c){for(let l=0;l<S.length;l+=2)S[l][0](S[l+1]);S.length=0}}}function u(r){s(r(t))}function o(r,c=g){const l=[r,c];return i.add(l),i.size===1&&(n=e(s)||g),r(t),()=>{i.delete(l),i.size===0&&(n(),n=null)}}return{set:s,update:u,subscribe:o}}function We(t,e,n){const i=!Array.isArray(t),s=i?[t]:t,u=e.length<2;return Gt(n,o=>{let r=!1;const c=[];let l=0,f=g;const _=()=>{if(l)return;f();const a=e(i?c[0]:c,o);u?o(a):f=T(a)?a:g},h=s.map((a,d)=>Q(a,p=>{c[d]=p,l&=~(1<<d),r&&_()},()=>{l|=1<<d}));return r=!0,_(),function(){E(h),f()}})}export{ze as $,je as A,Jt as B,Ut as C,Xt as D,Yt as E,Vt as F,Qt as G,At as H,g as I,pt as J,jt as K,me as L,fe as M,qe as N,oe as O,te as P,Zt as Q,tt as R,Ie as S,ue as T,E as U,We as V,Kt as W,ke as X,Le as Y,ae as Z,$e as _,ce as a,Te as a0,Ee as a1,ge as a2,se as a3,de as a4,ne as a5,mt as a6,Pe as a7,T as a8,H as a9,De as aa,Ne as ab,Se as ac,_e as ad,Ae as ae,ee as af,Re as ag,Ce as ah,ie as ai,re as b,pe as c,Oe as d,le as e,ht as f,Me as g,ot as h,He as i,ve as j,ct as k,he as l,Mt as m,X as n,xe as o,be as p,V as q,Dt as r,yt as s,Bt as t,ye as u,we as v,Be as w,Fe as x,Ht as y,It as z};
