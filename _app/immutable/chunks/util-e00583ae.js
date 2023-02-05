import{H as Ot,I as ke,B as it}from"./index-3840e2ce.js";var T="top",S="bottom",C="right",$="left",je="auto",ue=[T,S,C,$],_="start",fe="end",Et="clippingParents",ot="viewport",ie="popper",At="reference",Qe=ue.reduce(function(e,t){return e.concat([t+"-"+_,t+"-"+fe])},[]),st=[].concat(ue,[je]).reduce(function(e,t){return e.concat([t,t+"-"+_,t+"-"+fe])},[]),Dt="beforeRead",Pt="read",kt="afterRead",Rt="beforeMain",Tt="main",$t="afterMain",jt="beforeWrite",Bt="write",St="afterWrite",Ct=[Dt,Pt,kt,Rt,Tt,$t,jt,Bt,St];function N(e){return e?(e.nodeName||"").toLowerCase():null}function L(e){if(e==null)return window;if(e.toString()!=="[object Window]"){var t=e.ownerDocument;return t&&t.defaultView||window}return e}function J(e){var t=L(e).Element;return e instanceof t||e instanceof Element}function B(e){var t=L(e).HTMLElement;return e instanceof t||e instanceof HTMLElement}function Be(e){if(typeof ShadowRoot>"u")return!1;var t=L(e).ShadowRoot;return e instanceof t||e instanceof ShadowRoot}function Lt(e){var t=e.state;Object.keys(t.elements).forEach(function(r){var n=t.styles[r]||{},a=t.attributes[r]||{},i=t.elements[r];!B(i)||!N(i)||(Object.assign(i.style,n),Object.keys(a).forEach(function(c){var o=a[c];o===!1?i.removeAttribute(c):i.setAttribute(c,o===!0?"":o)}))})}function Mt(e){var t=e.state,r={popper:{position:t.options.strategy,left:"0",top:"0",margin:"0"},arrow:{position:"absolute"},reference:{}};return Object.assign(t.elements.popper.style,r.popper),t.styles=r,t.elements.arrow&&Object.assign(t.elements.arrow.style,r.arrow),function(){Object.keys(t.elements).forEach(function(n){var a=t.elements[n],i=t.attributes[n]||{},c=Object.keys(t.styles.hasOwnProperty(n)?t.styles[n]:r[n]),o=c.reduce(function(s,u){return s[u]="",s},{});!B(a)||!N(a)||(Object.assign(a.style,o),Object.keys(i).forEach(function(s){a.removeAttribute(s)}))})}}const Wt={name:"applyStyles",enabled:!0,phase:"write",fn:Lt,effect:Mt,requires:["computeStyles"]};function V(e){return e.split("-")[0]}var G=Math.max,xe=Math.min,ee=Math.round;function Re(){var e=navigator.userAgentData;return e!=null&&e.brands?e.brands.map(function(t){return t.brand+"/"+t.version}).join(" "):navigator.userAgent}function ft(){return!/^((?!chrome|android).)*safari/i.test(Re())}function te(e,t,r){t===void 0&&(t=!1),r===void 0&&(r=!1);var n=e.getBoundingClientRect(),a=1,i=1;t&&B(e)&&(a=e.offsetWidth>0&&ee(n.width)/e.offsetWidth||1,i=e.offsetHeight>0&&ee(n.height)/e.offsetHeight||1);var c=J(e)?L(e):window,o=c.visualViewport,s=!ft()&&r,u=(n.left+(s&&o?o.offsetLeft:0))/a,f=(n.top+(s&&o?o.offsetTop:0))/i,y=n.width/a,x=n.height/i;return{width:y,height:x,top:f,right:u+y,bottom:f+x,left:u,x:u,y:f}}function Se(e){var t=te(e),r=e.offsetWidth,n=e.offsetHeight;return Math.abs(t.width-r)<=1&&(r=t.width),Math.abs(t.height-n)<=1&&(n=t.height),{x:e.offsetLeft,y:e.offsetTop,width:r,height:n}}function ct(e,t){var r=t.getRootNode&&t.getRootNode();if(e.contains(t))return!0;if(r&&Be(r)){var n=t;do{if(n&&e.isSameNode(n))return!0;n=n.parentNode||n.host}while(n)}return!1}function q(e){return L(e).getComputedStyle(e)}function Ht(e){return["table","td","th"].indexOf(N(e))>=0}function X(e){return((J(e)?e.ownerDocument:e.document)||window.document).documentElement}function Oe(e){return N(e)==="html"?e:e.assignedSlot||e.parentNode||(Be(e)?e.host:null)||X(e)}function Ge(e){return!B(e)||q(e).position==="fixed"?null:e.offsetParent}function Vt(e){var t=/firefox/i.test(Re()),r=/Trident/i.test(Re());if(r&&B(e)){var n=q(e);if(n.position==="fixed")return null}var a=Oe(e);for(Be(a)&&(a=a.host);B(a)&&["html","body"].indexOf(N(a))<0;){var i=q(a);if(i.transform!=="none"||i.perspective!=="none"||i.contain==="paint"||["transform","perspective"].indexOf(i.willChange)!==-1||t&&i.willChange==="filter"||t&&i.filter&&i.filter!=="none")return a;a=a.parentNode}return null}function le(e){for(var t=L(e),r=Ge(e);r&&Ht(r)&&q(r).position==="static";)r=Ge(r);return r&&(N(r)==="html"||N(r)==="body"&&q(r).position==="static")?t:r||Vt(e)||t}function Ce(e){return["top","bottom"].indexOf(e)>=0?"x":"y"}function oe(e,t,r){return G(e,xe(t,r))}function Nt(e,t,r){var n=oe(e,t,r);return n>r?r:n}function ut(){return{top:0,right:0,bottom:0,left:0}}function lt(e){return Object.assign({},ut(),e)}function pt(e,t){return t.reduce(function(r,n){return r[n]=e,r},{})}var qt=function(t,r){return t=typeof t=="function"?t(Object.assign({},r.rects,{placement:r.placement})):t,lt(typeof t!="number"?t:pt(t,ue))};function Ft(e){var t,r=e.state,n=e.name,a=e.options,i=r.elements.arrow,c=r.modifiersData.popperOffsets,o=V(r.placement),s=Ce(o),u=[$,C].indexOf(o)>=0,f=u?"height":"width";if(!(!i||!c)){var y=qt(a.padding,r),x=Se(i),l=s==="y"?T:$,O=s==="y"?S:C,v=r.rects.reference[f]+r.rects.reference[s]-c[s]-r.rects.popper[f],h=c[s]-r.rects.reference[s],p=le(i),m=p?s==="y"?p.clientHeight||0:p.clientWidth||0:0,w=v/2-h/2,d=y[l],g=m-x[f]-y[O],b=m/2-x[f]/2+w,E=oe(d,b,g),P=s;r.modifiersData[n]=(t={},t[P]=E,t.centerOffset=E-b,t)}}function Xt(e){var t=e.state,r=e.options,n=r.element,a=n===void 0?"[data-popper-arrow]":n;a!=null&&(typeof a=="string"&&(a=t.elements.popper.querySelector(a),!a)||ct(t.elements.popper,a)&&(t.elements.arrow=a))}const Ut={name:"arrow",enabled:!0,phase:"main",fn:Ft,effect:Xt,requires:["popperOffsets"],requiresIfExists:["preventOverflow"]};function re(e){return e.split("-")[1]}var Yt={top:"auto",right:"auto",bottom:"auto",left:"auto"};function It(e){var t=e.x,r=e.y,n=window,a=n.devicePixelRatio||1;return{x:ee(t*a)/a||0,y:ee(r*a)/a||0}}function Je(e){var t,r=e.popper,n=e.popperRect,a=e.placement,i=e.variation,c=e.offsets,o=e.position,s=e.gpuAcceleration,u=e.adaptive,f=e.roundOffsets,y=e.isFixed,x=c.x,l=x===void 0?0:x,O=c.y,v=O===void 0?0:O,h=typeof f=="function"?f({x:l,y:v}):{x:l,y:v};l=h.x,v=h.y;var p=c.hasOwnProperty("x"),m=c.hasOwnProperty("y"),w=$,d=T,g=window;if(u){var b=le(r),E="clientHeight",P="clientWidth";if(b===L(r)&&(b=X(r),q(b).position!=="static"&&o==="absolute"&&(E="scrollHeight",P="scrollWidth")),b=b,a===T||(a===$||a===C)&&i===fe){d=S;var D=y&&b===g&&g.visualViewport?g.visualViewport.height:b[E];v-=D-n.height,v*=s?1:-1}if(a===$||(a===T||a===S)&&i===fe){w=C;var A=y&&b===g&&g.visualViewport?g.visualViewport.width:b[P];l-=A-n.width,l*=s?1:-1}}var k=Object.assign({position:o},u&&Yt),M=f===!0?It({x:l,y:v}):{x:l,y:v};if(l=M.x,v=M.y,s){var R;return Object.assign({},k,(R={},R[d]=m?"0":"",R[w]=p?"0":"",R.transform=(g.devicePixelRatio||1)<=1?"translate("+l+"px, "+v+"px)":"translate3d("+l+"px, "+v+"px, 0)",R))}return Object.assign({},k,(t={},t[d]=m?v+"px":"",t[w]=p?l+"px":"",t.transform="",t))}function zt(e){var t=e.state,r=e.options,n=r.gpuAcceleration,a=n===void 0?!0:n,i=r.adaptive,c=i===void 0?!0:i,o=r.roundOffsets,s=o===void 0?!0:o,u={placement:V(t.placement),variation:re(t.placement),popper:t.elements.popper,popperRect:t.rects.popper,gpuAcceleration:a,isFixed:t.options.strategy==="fixed"};t.modifiersData.popperOffsets!=null&&(t.styles.popper=Object.assign({},t.styles.popper,Je(Object.assign({},u,{offsets:t.modifiersData.popperOffsets,position:t.options.strategy,adaptive:c,roundOffsets:s})))),t.modifiersData.arrow!=null&&(t.styles.arrow=Object.assign({},t.styles.arrow,Je(Object.assign({},u,{offsets:t.modifiersData.arrow,position:"absolute",adaptive:!1,roundOffsets:s})))),t.attributes.popper=Object.assign({},t.attributes.popper,{"data-popper-placement":t.placement})}const Qt={name:"computeStyles",enabled:!0,phase:"beforeWrite",fn:zt,data:{}};var ye={passive:!0};function Gt(e){var t=e.state,r=e.instance,n=e.options,a=n.scroll,i=a===void 0?!0:a,c=n.resize,o=c===void 0?!0:c,s=L(t.elements.popper),u=[].concat(t.scrollParents.reference,t.scrollParents.popper);return i&&u.forEach(function(f){f.addEventListener("scroll",r.update,ye)}),o&&s.addEventListener("resize",r.update,ye),function(){i&&u.forEach(function(f){f.removeEventListener("scroll",r.update,ye)}),o&&s.removeEventListener("resize",r.update,ye)}}const Jt={name:"eventListeners",enabled:!0,phase:"write",fn:function(){},effect:Gt,data:{}};var Kt={left:"right",right:"left",bottom:"top",top:"bottom"};function be(e){return e.replace(/left|right|bottom|top/g,function(t){return Kt[t]})}var Zt={start:"end",end:"start"};function Ke(e){return e.replace(/start|end/g,function(t){return Zt[t]})}function Le(e){var t=L(e),r=t.pageXOffset,n=t.pageYOffset;return{scrollLeft:r,scrollTop:n}}function Me(e){return te(X(e)).left+Le(e).scrollLeft}function _t(e,t){var r=L(e),n=X(e),a=r.visualViewport,i=n.clientWidth,c=n.clientHeight,o=0,s=0;if(a){i=a.width,c=a.height;var u=ft();(u||!u&&t==="fixed")&&(o=a.offsetLeft,s=a.offsetTop)}return{width:i,height:c,x:o+Me(e),y:s}}function er(e){var t,r=X(e),n=Le(e),a=(t=e.ownerDocument)==null?void 0:t.body,i=G(r.scrollWidth,r.clientWidth,a?a.scrollWidth:0,a?a.clientWidth:0),c=G(r.scrollHeight,r.clientHeight,a?a.scrollHeight:0,a?a.clientHeight:0),o=-n.scrollLeft+Me(e),s=-n.scrollTop;return q(a||r).direction==="rtl"&&(o+=G(r.clientWidth,a?a.clientWidth:0)-i),{width:i,height:c,x:o,y:s}}function We(e){var t=q(e),r=t.overflow,n=t.overflowX,a=t.overflowY;return/auto|scroll|overlay|hidden/.test(r+a+n)}function dt(e){return["html","body","#document"].indexOf(N(e))>=0?e.ownerDocument.body:B(e)&&We(e)?e:dt(Oe(e))}function se(e,t){var r;t===void 0&&(t=[]);var n=dt(e),a=n===((r=e.ownerDocument)==null?void 0:r.body),i=L(n),c=a?[i].concat(i.visualViewport||[],We(n)?n:[]):n,o=t.concat(c);return a?o:o.concat(se(Oe(c)))}function Te(e){return Object.assign({},e,{left:e.x,top:e.y,right:e.x+e.width,bottom:e.y+e.height})}function tr(e,t){var r=te(e,!1,t==="fixed");return r.top=r.top+e.clientTop,r.left=r.left+e.clientLeft,r.bottom=r.top+e.clientHeight,r.right=r.left+e.clientWidth,r.width=e.clientWidth,r.height=e.clientHeight,r.x=r.left,r.y=r.top,r}function Ze(e,t,r){return t===ot?Te(_t(e,r)):J(t)?tr(t,r):Te(er(X(e)))}function rr(e){var t=se(Oe(e)),r=["absolute","fixed"].indexOf(q(e).position)>=0,n=r&&B(e)?le(e):e;return J(n)?t.filter(function(a){return J(a)&&ct(a,n)&&N(a)!=="body"}):[]}function nr(e,t,r,n){var a=t==="clippingParents"?rr(e):[].concat(t),i=[].concat(a,[r]),c=i[0],o=i.reduce(function(s,u){var f=Ze(e,u,n);return s.top=G(f.top,s.top),s.right=xe(f.right,s.right),s.bottom=xe(f.bottom,s.bottom),s.left=G(f.left,s.left),s},Ze(e,c,n));return o.width=o.right-o.left,o.height=o.bottom-o.top,o.x=o.left,o.y=o.top,o}function vt(e){var t=e.reference,r=e.element,n=e.placement,a=n?V(n):null,i=n?re(n):null,c=t.x+t.width/2-r.width/2,o=t.y+t.height/2-r.height/2,s;switch(a){case T:s={x:c,y:t.y-r.height};break;case S:s={x:c,y:t.y+t.height};break;case C:s={x:t.x+t.width,y:o};break;case $:s={x:t.x-r.width,y:o};break;default:s={x:t.x,y:t.y}}var u=a?Ce(a):null;if(u!=null){var f=u==="y"?"height":"width";switch(i){case _:s[u]=s[u]-(t[f]/2-r[f]/2);break;case fe:s[u]=s[u]+(t[f]/2-r[f]/2);break}}return s}function ce(e,t){t===void 0&&(t={});var r=t,n=r.placement,a=n===void 0?e.placement:n,i=r.strategy,c=i===void 0?e.strategy:i,o=r.boundary,s=o===void 0?Et:o,u=r.rootBoundary,f=u===void 0?ot:u,y=r.elementContext,x=y===void 0?ie:y,l=r.altBoundary,O=l===void 0?!1:l,v=r.padding,h=v===void 0?0:v,p=lt(typeof h!="number"?h:pt(h,ue)),m=x===ie?At:ie,w=e.rects.popper,d=e.elements[O?m:x],g=nr(J(d)?d:d.contextElement||X(e.elements.popper),s,f,c),b=te(e.elements.reference),E=vt({reference:b,element:w,strategy:"absolute",placement:a}),P=Te(Object.assign({},w,E)),D=x===ie?P:b,A={top:g.top-D.top+p.top,bottom:D.bottom-g.bottom+p.bottom,left:g.left-D.left+p.left,right:D.right-g.right+p.right},k=e.modifiersData.offset;if(x===ie&&k){var M=k[a];Object.keys(A).forEach(function(R){var U=[C,S].indexOf(R)>=0?1:-1,Y=[T,S].indexOf(R)>=0?"y":"x";A[R]+=M[Y]*U})}return A}function ar(e,t){t===void 0&&(t={});var r=t,n=r.placement,a=r.boundary,i=r.rootBoundary,c=r.padding,o=r.flipVariations,s=r.allowedAutoPlacements,u=s===void 0?st:s,f=re(n),y=f?o?Qe:Qe.filter(function(O){return re(O)===f}):ue,x=y.filter(function(O){return u.indexOf(O)>=0});x.length===0&&(x=y);var l=x.reduce(function(O,v){return O[v]=ce(e,{placement:v,boundary:a,rootBoundary:i,padding:c})[V(v)],O},{});return Object.keys(l).sort(function(O,v){return l[O]-l[v]})}function ir(e){if(V(e)===je)return[];var t=be(e);return[Ke(e),t,Ke(t)]}function or(e){var t=e.state,r=e.options,n=e.name;if(!t.modifiersData[n]._skip){for(var a=r.mainAxis,i=a===void 0?!0:a,c=r.altAxis,o=c===void 0?!0:c,s=r.fallbackPlacements,u=r.padding,f=r.boundary,y=r.rootBoundary,x=r.altBoundary,l=r.flipVariations,O=l===void 0?!0:l,v=r.allowedAutoPlacements,h=t.options.placement,p=V(h),m=p===h,w=s||(m||!O?[be(h)]:ir(h)),d=[h].concat(w).reduce(function(Z,F){return Z.concat(V(F)===je?ar(t,{placement:F,boundary:f,rootBoundary:y,padding:u,flipVariations:O,allowedAutoPlacements:v}):F)},[]),g=t.rects.reference,b=t.rects.popper,E=new Map,P=!0,D=d[0],A=0;A<d.length;A++){var k=d[A],M=V(k),R=re(k)===_,U=[T,S].indexOf(M)>=0,Y=U?"width":"height",j=ce(t,{placement:k,boundary:f,rootBoundary:y,altBoundary:x,padding:u}),W=U?R?C:$:R?S:T;g[Y]>b[Y]&&(W=be(W));var de=be(W),I=[];if(i&&I.push(j[M]<=0),o&&I.push(j[W]<=0,j[de]<=0),I.every(function(Z){return Z})){D=k,P=!1;break}E.set(k,I)}if(P)for(var ve=O?3:1,Ee=function(F){var ae=d.find(function(he){var z=E.get(he);if(z)return z.slice(0,F).every(function(Ae){return Ae})});if(ae)return D=ae,"break"},ne=ve;ne>0;ne--){var me=Ee(ne);if(me==="break")break}t.placement!==D&&(t.modifiersData[n]._skip=!0,t.placement=D,t.reset=!0)}}const sr={name:"flip",enabled:!0,phase:"main",fn:or,requiresIfExists:["offset"],data:{_skip:!1}};function _e(e,t,r){return r===void 0&&(r={x:0,y:0}),{top:e.top-t.height-r.y,right:e.right-t.width+r.x,bottom:e.bottom-t.height+r.y,left:e.left-t.width-r.x}}function et(e){return[T,C,S,$].some(function(t){return e[t]>=0})}function fr(e){var t=e.state,r=e.name,n=t.rects.reference,a=t.rects.popper,i=t.modifiersData.preventOverflow,c=ce(t,{elementContext:"reference"}),o=ce(t,{altBoundary:!0}),s=_e(c,n),u=_e(o,a,i),f=et(s),y=et(u);t.modifiersData[r]={referenceClippingOffsets:s,popperEscapeOffsets:u,isReferenceHidden:f,hasPopperEscaped:y},t.attributes.popper=Object.assign({},t.attributes.popper,{"data-popper-reference-hidden":f,"data-popper-escaped":y})}const cr={name:"hide",enabled:!0,phase:"main",requiresIfExists:["preventOverflow"],fn:fr};function ur(e,t,r){var n=V(e),a=[$,T].indexOf(n)>=0?-1:1,i=typeof r=="function"?r(Object.assign({},t,{placement:e})):r,c=i[0],o=i[1];return c=c||0,o=(o||0)*a,[$,C].indexOf(n)>=0?{x:o,y:c}:{x:c,y:o}}function lr(e){var t=e.state,r=e.options,n=e.name,a=r.offset,i=a===void 0?[0,0]:a,c=st.reduce(function(f,y){return f[y]=ur(y,t.rects,i),f},{}),o=c[t.placement],s=o.x,u=o.y;t.modifiersData.popperOffsets!=null&&(t.modifiersData.popperOffsets.x+=s,t.modifiersData.popperOffsets.y+=u),t.modifiersData[n]=c}const pr={name:"offset",enabled:!0,phase:"main",requires:["popperOffsets"],fn:lr};function dr(e){var t=e.state,r=e.name;t.modifiersData[r]=vt({reference:t.rects.reference,element:t.rects.popper,strategy:"absolute",placement:t.placement})}const vr={name:"popperOffsets",enabled:!0,phase:"read",fn:dr,data:{}};function mr(e){return e==="x"?"y":"x"}function hr(e){var t=e.state,r=e.options,n=e.name,a=r.mainAxis,i=a===void 0?!0:a,c=r.altAxis,o=c===void 0?!1:c,s=r.boundary,u=r.rootBoundary,f=r.altBoundary,y=r.padding,x=r.tether,l=x===void 0?!0:x,O=r.tetherOffset,v=O===void 0?0:O,h=ce(t,{boundary:s,rootBoundary:u,padding:y,altBoundary:f}),p=V(t.placement),m=re(t.placement),w=!m,d=Ce(p),g=mr(d),b=t.modifiersData.popperOffsets,E=t.rects.reference,P=t.rects.popper,D=typeof v=="function"?v(Object.assign({},t.rects,{placement:t.placement})):v,A=typeof D=="number"?{mainAxis:D,altAxis:D}:Object.assign({mainAxis:0,altAxis:0},D),k=t.modifiersData.offset?t.modifiersData.offset[t.placement]:null,M={x:0,y:0};if(b){if(i){var R,U=d==="y"?T:$,Y=d==="y"?S:C,j=d==="y"?"height":"width",W=b[d],de=W+h[U],I=W-h[Y],ve=l?-P[j]/2:0,Ee=m===_?E[j]:P[j],ne=m===_?-P[j]:-E[j],me=t.elements.arrow,Z=l&&me?Se(me):{width:0,height:0},F=t.modifiersData["arrow#persistent"]?t.modifiersData["arrow#persistent"].padding:ut(),ae=F[U],he=F[Y],z=oe(0,E[j],Z[j]),Ae=w?E[j]/2-ve-z-ae-A.mainAxis:Ee-z-ae-A.mainAxis,ht=w?-E[j]/2+ve+z+he+A.mainAxis:ne+z+he+A.mainAxis,De=t.elements.arrow&&le(t.elements.arrow),gt=De?d==="y"?De.clientTop||0:De.clientLeft||0:0,Ve=(R=k==null?void 0:k[d])!=null?R:0,yt=W+Ae-Ve-gt,bt=W+ht-Ve,Ne=oe(l?xe(de,yt):de,W,l?G(I,bt):I);b[d]=Ne,M[d]=Ne-W}if(o){var qe,wt=d==="x"?T:$,xt=d==="x"?S:C,Q=b[g],ge=g==="y"?"height":"width",Fe=Q+h[wt],Xe=Q-h[xt],Pe=[T,$].indexOf(p)!==-1,Ue=(qe=k==null?void 0:k[g])!=null?qe:0,Ye=Pe?Fe:Q-E[ge]-P[ge]-Ue+A.altAxis,Ie=Pe?Q+E[ge]+P[ge]-Ue-A.altAxis:Xe,ze=l&&Pe?Nt(Ye,Q,Ie):oe(l?Ye:Fe,Q,l?Ie:Xe);b[g]=ze,M[g]=ze-Q}t.modifiersData[n]=M}}const gr={name:"preventOverflow",enabled:!0,phase:"main",fn:hr,requiresIfExists:["offset"]};function yr(e){return{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}}function br(e){return e===L(e)||!B(e)?Le(e):yr(e)}function wr(e){var t=e.getBoundingClientRect(),r=ee(t.width)/e.offsetWidth||1,n=ee(t.height)/e.offsetHeight||1;return r!==1||n!==1}function xr(e,t,r){r===void 0&&(r=!1);var n=B(t),a=B(t)&&wr(t),i=X(t),c=te(e,a,r),o={scrollLeft:0,scrollTop:0},s={x:0,y:0};return(n||!n&&!r)&&((N(t)!=="body"||We(i))&&(o=br(t)),B(t)?(s=te(t,!0),s.x+=t.clientLeft,s.y+=t.clientTop):i&&(s.x=Me(i))),{x:c.left+o.scrollLeft-s.x,y:c.top+o.scrollTop-s.y,width:c.width,height:c.height}}function Or(e){var t=new Map,r=new Set,n=[];e.forEach(function(i){t.set(i.name,i)});function a(i){r.add(i.name);var c=[].concat(i.requires||[],i.requiresIfExists||[]);c.forEach(function(o){if(!r.has(o)){var s=t.get(o);s&&a(s)}}),n.push(i)}return e.forEach(function(i){r.has(i.name)||a(i)}),n}function Er(e){var t=Or(e);return Ct.reduce(function(r,n){return r.concat(t.filter(function(a){return a.phase===n}))},[])}function Ar(e){var t;return function(){return t||(t=new Promise(function(r){Promise.resolve().then(function(){t=void 0,r(e())})})),t}}function Dr(e){var t=e.reduce(function(r,n){var a=r[n.name];return r[n.name]=a?Object.assign({},a,n,{options:Object.assign({},a.options,n.options),data:Object.assign({},a.data,n.data)}):n,r},{});return Object.keys(t).map(function(r){return t[r]})}var tt={placement:"bottom",modifiers:[],strategy:"absolute"};function rt(){for(var e=arguments.length,t=new Array(e),r=0;r<e;r++)t[r]=arguments[r];return!t.some(function(n){return!(n&&typeof n.getBoundingClientRect=="function")})}function Pr(e){e===void 0&&(e={});var t=e,r=t.defaultModifiers,n=r===void 0?[]:r,a=t.defaultOptions,i=a===void 0?tt:a;return function(o,s,u){u===void 0&&(u=i);var f={placement:"bottom",orderedModifiers:[],options:Object.assign({},tt,i),modifiersData:{},elements:{reference:o,popper:s},attributes:{},styles:{}},y=[],x=!1,l={state:f,setOptions:function(p){var m=typeof p=="function"?p(f.options):p;v(),f.options=Object.assign({},i,f.options,m),f.scrollParents={reference:J(o)?se(o):o.contextElement?se(o.contextElement):[],popper:se(s)};var w=Er(Dr([].concat(n,f.options.modifiers)));return f.orderedModifiers=w.filter(function(d){return d.enabled}),O(),l.update()},forceUpdate:function(){if(!x){var p=f.elements,m=p.reference,w=p.popper;if(rt(m,w)){f.rects={reference:xr(m,le(w),f.options.strategy==="fixed"),popper:Se(w)},f.reset=!1,f.placement=f.options.placement,f.orderedModifiers.forEach(function(A){return f.modifiersData[A.name]=Object.assign({},A.data)});for(var d=0;d<f.orderedModifiers.length;d++){if(f.reset===!0){f.reset=!1,d=-1;continue}var g=f.orderedModifiers[d],b=g.fn,E=g.options,P=E===void 0?{}:E,D=g.name;typeof b=="function"&&(f=b({state:f,options:P,name:D,instance:l})||f)}}}},update:Ar(function(){return new Promise(function(h){l.forceUpdate(),h(f)})}),destroy:function(){v(),x=!0}};if(!rt(o,s))return l;l.setOptions(u).then(function(h){!x&&u.onFirstUpdate&&u.onFirstUpdate(h)});function O(){f.orderedModifiers.forEach(function(h){var p=h.name,m=h.options,w=m===void 0?{}:m,d=h.effect;if(typeof d=="function"){var g=d({state:f,name:p,instance:l,options:w}),b=function(){};y.push(g||b)}})}function v(){y.forEach(function(h){return h()}),y=[]}return l}}var kr=[Jt,vr,Qt,Wt,pr,sr,gr,Ut,cr],Fr=Pr({defaultModifiers:kr});function Rr(e,t,r,n){var a,i,c=!1,o="withOld"in r,s=(p,m)=>{if(a=m,o&&(i=p),!c){let w=t(p,m);if(t.length<2)m(w);else return w}c=!1},u=Ot(e,s,n),f=!Array.isArray(e),y=p=>{f?(c=!0,e.set(p)):p.forEach((m,w)=>{c=!0,e[w].set(m)}),c=!1};o&&(r=r.withOld);var x=r.length>=(o?3:2),l=null;function O(p){if(l&&(l(),l=null),o)var m=r(p,i,y);else var m=r(p,y);x?typeof m=="function"&&(l=m):y(m)}var v=!1;function h(p){var m,w,d,g;if(v){g=p(ke(u)),a(g);return}var b=u.subscribe(E=>{v?m?w=!0:m=!0:d=E});g=p(d),v=!0,a(g),b(),v=!1,w&&(g=ke(u)),m&&O(g)}return{subscribe:u.subscribe,set(p){h(()=>p)},update:h}}const Tr=20,K=it([]),He=it(null),we=new Map,nt=e=>{if(we.has(e))return;const t=setTimeout(()=>{we.delete(e),mt(e)},1e3);we.set(e,t)},$r=e=>{const t=we.get(e);t&&clearTimeout(t)};function jr(e){e.id&&$r(e.id),K.update(t=>t.map(r=>r.id===e.id?{...r,...e}:r))}function Br(e){K.update(t=>[e,...t].slice(0,Tr))}function Sr(e){ke(K).find(t=>t.id===e.id)?jr(e):Br(e)}function Cr(e){K.update(t=>(e?nt(e):t.forEach(r=>{nt(r.id)}),t.map(r=>r.id===e||e===void 0?{...r,visible:!1}:r)))}function mt(e){K.update(t=>e===void 0?[]:t.filter(r=>r.id!==e))}function Xr(e){He.set(e)}function Ur(e){let t;He.update(r=>(t=e-(r||0),null)),K.update(r=>r.map(n=>({...n,pauseDuration:n.pauseDuration+t})))}const Lr={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3};function Yr(e={}){return{toasts:Rr(K,r=>r.map(n=>{var a,i;return{...e,...e[n.type],...n,duration:n.duration||((a=e[n.type])==null?void 0:a.duration)||(e==null?void 0:e.duration)||Lr[n.type],style:[e.style,(i=e[n.type])==null?void 0:i.style,n.style].join(";")}}),r=>r),pausedAt:He}}const Mr=e=>typeof e=="function",at=(e,t)=>Mr(e)?e(t):e,Wr=(()=>{let e=0;return()=>(e+=1,e.toString())})(),Ir=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){const t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),Hr=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(r==null?void 0:r.id)||Wr()}),pe=e=>(t,r)=>{const n=Hr(t,e,r);return Sr(n),n.id},H=(e,t)=>pe("blank")(e,t);H.error=pe("error");H.success=pe("success");H.loading=pe("loading");H.custom=pe("custom");H.dismiss=e=>{Cr(e)};H.remove=e=>mt(e);H.promise=(e,t,r)=>{const n=H.loading(t.loading,{...r,...r==null?void 0:r.loading});return e.then(a=>(H.success(at(t.success,a),{id:n,...r,...r==null?void 0:r.success}),a)).catch(a=>{H.error(at(t.error,a),{id:n,...r,...r==null?void 0:r.error})}),e};const Vr=H,zr=e=>{const t=r=>e&&!e.contains(r.target)&&!r.defaultPrevented&&e.dispatchEvent(new CustomEvent("click_outside",e));return document.addEventListener("click",t,!0),{destroy(){document.removeEventListener("click",t,!0)}}};function Qr(e){e?(document.documentElement.classList.add("dark"),$e=!0):(document.documentElement.classList.remove("dark"),$e=!1)}const Nr=()=>localStorage.theme==="dark"||!("theme"in localStorage)&&window.matchMedia("(prefers-color-scheme: dark)").matches?(document.documentElement.classList.add("dark"),!0):(document.documentElement.classList.remove("dark"),!1);let $e=Nr();function Gr(e,t){var r;Vr.promise(e,{loading:`Loading ${t}...`,success:`${t} Loaded!`,error:`Error while loading ${t}!`},{position:"top-right",style:`${$e?"background: #1f2937; color: #fff;":"background: #fff; color: #000;"} min-width: 200px;`}),(r=document.querySelector(".toaster .message"))==null||r.setAttribute("title",t)}export{Qr as a,jr as b,Fr as c,Gr as d,Ur as e,zr as f,$e as g,Ir as p,Xr as s,Vr as t,Yr as u};
