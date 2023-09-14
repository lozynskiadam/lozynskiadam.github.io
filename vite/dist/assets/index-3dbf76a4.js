var Yt=Object.defineProperty;var Xt=(r,t,e)=>t in r?Yt(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var T=(r,t,e)=>(Xt(r,typeof t!="symbol"?t+"":t,e),e),Ft=(r,t,e)=>{if(!t.has(r))throw TypeError("Cannot "+e)};var m=(r,t,e)=>(Ft(r,t,"read from private field"),e?e.call(r):t.get(r)),F=(r,t,e)=>{if(t.has(r))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(r):t.set(r,e)},I=(r,t,e,i)=>(Ft(r,t,"write to private field"),i?i.call(r,e):t.set(r,e),e);var St=(r,t,e,i)=>({set _(n){I(r,t,n,e)},get _(){return m(r,t,i)}});(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const y of a.addedNodes)y.tagName==="LINK"&&y.rel==="modulepreload"&&i(y)}).observe(document,{childList:!0,subtree:!0});function e(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(n){if(n.ep)return;n.ep=!0;const a=e(n);fetch(n.href,a)}})();const E=32,Mt=33,Bt=19,_t="data/sprites.json",Vt="data/items.json",Qt="data/effects.json";const $t=function(r){return Math.floor(Math.random()*(r+1))},ct=function(r){return $t(r)===r},Zt=function(r){return window.btoa(String.fromCharCode(...window.crypto.getRandomValues(new Uint8Array(r*2)))).replace(/[+/]/g,"").substring(0,r)},kt=function(){return"#000000".replace(/0/g,function(){return(~~(Math.random()*16)).toString(16)})},Dt=function(r){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:null},Jt=function(r,t){Object.keys(t).forEach(n=>{t[Dt(n).toString()]=Dt(t[n]),delete t[n]});const e=document.createElement("canvas").getContext("2d");e.canvas.width=r.width,e.canvas.height=r.height,e.drawImage(r,0,0);const i=e.getImageData(0,0,e.canvas.width,e.canvas.height);for(let n=0;n<i.data.length;n+=4){const a=[i.data[n],i.data[n+1],i.data[n+2]].toString();if(a in t){const y=t[a];i.data[n]=y[0],i.data[n+1]=y[1],i.data[n+2]=y[2],i.data[n+3]=255}}return e.putImageData(i,0,0),e.canvas},jt=async function(r){return new Promise(t=>{const e=new Image;e.onload=()=>t(e),e.src=r})},Nt=async function(r,t,e){return new Promise(i=>{if(!t)return r;const n=["#ff0000","#ff00ff","#0000ff","#ffff00","#00ffff","#ff00ff"],a={};e.forEach((O,w)=>{a[n[w]]=O});const y=Jt(t,a),b=document.createElement("canvas").getContext("2d");b.canvas.width=r.width,b.canvas.height=r.height,b.drawImage(r,0,0),b.globalCompositeOperation="overlay",b.drawImage(y,0,0);const A=new Image;A.onload=()=>i(A),A.src=b.canvas.toDataURL("image/png")})};var vt,Tt,it,ft,dt,Q,_,Y,pt,nt,st,$,yt;const lt=class lt{constructor(t,e){F(this,Tt,null);F(this,it,null);F(this,ft,null);F(this,dt,null);F(this,Q,null);F(this,_,null);F(this,Y,null);F(this,pt,null);F(this,nt,null);F(this,st,null);F(this,$,null);F(this,yt,null);t&&(m(lt,vt)[t]=this),I(this,Tt,t),I(this,it,e.image),I(this,ft,e.image),I(this,dt,e.mask||null),I(this,Q,e.speed||null),I(this,_,e.states||{}),m(this,_).origin=[{x:0,y:0,w:m(this,it).width,h:m(this,it).height}],I(this,Y,document.createElement("canvas")),I(this,pt,m(this,Y).getContext("2d")),I(this,st,this.getDefaultState()),I(this,$,1)}static async load(t){try{const i=await(await fetch(t)).json();await Promise.all(Object.entries(i).map(async([n,a])=>{const b={image:await jt(a.base),speed:a.speed||null,states:a.states||null};a.mask&&(b.mask=await jt(a.mask)),new lt(n,b)}))}catch(e){console.error("Error loading sprites:",e)}}static get(t){return m(lt,vt)[t]??null}clone(){return new lt(null,{image:m(this,ft),mask:m(this,dt),speed:m(this,Q),states:m(this,_)})}async play(t=null){return new Promise(e=>{t=t||this.getDefaultState(),this.stop(),this.rewind(),I(this,st,t);const i=m(this,_)[t].length;i>1&&m(this,Q)&&I(this,nt,setInterval(()=>{++St(this,$)._>i&&(this.stop(),e())},m(this,Q)))})}stop(){clearInterval(m(this,nt)),I(this,nt,null)}rewind(){I(this,$,1)}loop(t=null){if(t=t||this.getDefaultState(),m(this,nt)&&m(this,st)===t)return;this.stop(),this.rewind(),I(this,st,t);const e=m(this,_)[t].length;e>1&&m(this,Q)&&I(this,nt,setInterval(()=>{++St(this,$)._>e&&I(this,$,1)},m(this,Q)))}async dye(t){I(this,it,await Nt(m(this,ft),m(this,dt),t)),I(this,yt,null)}getDefaultState(){return Object.keys(m(this,_))[0]}getFrame(){const t=m(this,_)[m(this,st)][m(this,$)-1];return m(this,yt)===t?m(this,Y):(I(this,yt,t),m(this,Y).width=t.w,m(this,Y).height=t.h,m(this,pt).clearRect(0,0,m(this,Y).width,m(this,Y).height),m(this,pt).drawImage(m(this,it),t.x,t.y,t.w,t.h,0,0,t.w,t.h),m(this,Y))}};vt=new WeakMap,Tt=new WeakMap,it=new WeakMap,ft=new WeakMap,dt=new WeakMap,Q=new WeakMap,_=new WeakMap,Y=new WeakMap,pt=new WeakMap,nt=new WeakMap,st=new WeakMap,$=new WeakMap,yt=new WeakMap,F(lt,vt,{});let rt=lt;var bt;const ht=class ht{constructor(t,e){T(this,"id",null);T(this,"name",null);T(this,"sprite",null);T(this,"type",null);T(this,"isBlockingCreatures",null);T(this,"isMoveable",null);m(ht,bt)[t]=this,this.id=e.id,this.name=e.name,this.sprite=rt.get(e.sprite),this.sprite.loop(),this.type=e.type,this.isBlockingCreatures=e.isBlockingCreatures,this.isMoveable=e.isMoveable}static async load(t){try{const i=await(await fetch(t)).json();return new Promise(n=>{Object.values(i).forEach(a=>{new ht(a.id,a)}),n()})}catch(e){console.error("Error loading items:",e)}}static get(t){return m(ht,bt)[t]??null}};bt=new WeakMap,F(ht,bt,{});let U=ht;const It=function(r,t,e=1){const i=r.x-e,n=r.y-e,a=r.x+e,y=r.y+e;return t.x>=i&&t.x<=a&&t.y>=n&&t.y<=y},ot=function(r,t){return r.x===t.x&&r.y===t.y};var te=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},ee=function(){this.pointsToAvoid={},this.startX,this.callback,this.startY,this.endX,this.endY,this.nodeHash={},this.openList},ie=function(r,t,e,i,n){this.parent=r,this.x=t,this.y=e,this.costSoFar=i,this.simpleDistanceToTarget=n,this.bestGuessDistance=function(){return this.costSoFar+this.simpleDistanceToTarget}},qt={exports:{}};(function(r,t){(function(){var e,i,n,a,y,b,A,O,w,j,H,K,Z,W,q;n=Math.floor,j=Math.min,i=function(l,h){return l<h?-1:l>h?1:0},w=function(l,h,f,g,u){var o;if(f==null&&(f=0),u==null&&(u=i),f<0)throw new Error("lo must be non-negative");for(g==null&&(g=l.length);f<g;)o=n((f+g)/2),u(h,l[o])<0?g=o:f=o+1;return[].splice.apply(l,[f,f-f].concat(h)),h},b=function(l,h,f){return f==null&&(f=i),l.push(h),W(l,0,l.length-1,f)},y=function(l,h){var f,g;return h==null&&(h=i),f=l.pop(),l.length?(g=l[0],l[0]=f,q(l,0,h)):g=f,g},O=function(l,h,f){var g;return f==null&&(f=i),g=l[0],l[0]=h,q(l,0,f),g},A=function(l,h,f){var g;return f==null&&(f=i),l.length&&f(l[0],h)<0&&(g=[l[0],h],h=g[0],l[0]=g[1],q(l,0,f)),h},a=function(l,h){var f,g,u,o,s,v;for(h==null&&(h=i),o=(function(){v=[];for(var x=0,P=n(l.length/2);0<=P?x<P:x>P;0<=P?x++:x--)v.push(x);return v}).apply(this).reverse(),s=[],g=0,u=o.length;g<u;g++)f=o[g],s.push(q(l,f,h));return s},Z=function(l,h,f){var g;if(f==null&&(f=i),g=l.indexOf(h),g!==-1)return W(l,0,g,f),q(l,g,f)},H=function(l,h,f){var g,u,o,s,v;if(f==null&&(f=i),u=l.slice(0,h),!u.length)return u;for(a(u,f),v=l.slice(h),o=0,s=v.length;o<s;o++)g=v[o],A(u,g,f);return u.sort(f).reverse()},K=function(l,h,f){var g,u,o,s,v,x,P,B,R;if(f==null&&(f=i),h*10<=l.length){if(o=l.slice(0,h).sort(f),!o.length)return o;for(u=o[o.length-1],P=l.slice(h),s=0,x=P.length;s<x;s++)g=P[s],f(g,u)<0&&(w(o,g,0,null,f),o.pop(),u=o[o.length-1]);return o}for(a(l,f),R=[],v=0,B=j(h,l.length);0<=B?v<B:v>B;0<=B?++v:--v)R.push(y(l,f));return R},W=function(l,h,f,g){var u,o,s;for(g==null&&(g=i),u=l[f];f>h;){if(s=f-1>>1,o=l[s],g(u,o)<0){l[f]=o,f=s;continue}break}return l[f]=u},q=function(l,h,f){var g,u,o,s,v;for(f==null&&(f=i),u=l.length,v=h,o=l[h],g=2*h+1;g<u;)s=g+1,s<u&&!(f(l[g],l[s])<0)&&(g=s),l[h]=l[g],h=g,g=2*h+1;return l[h]=o,W(l,v,h,f)},e=function(){l.push=b,l.pop=y,l.replace=O,l.pushpop=A,l.heapify=a,l.updateItem=Z,l.nlargest=H,l.nsmallest=K;function l(h){this.cmp=h??i,this.nodes=[]}return l.prototype.push=function(h){return b(this.nodes,h,this.cmp)},l.prototype.pop=function(){return y(this.nodes,this.cmp)},l.prototype.peek=function(){return this.nodes[0]},l.prototype.contains=function(h){return this.nodes.indexOf(h)!==-1},l.prototype.replace=function(h){return O(this.nodes,h,this.cmp)},l.prototype.pushpop=function(h){return A(this.nodes,h,this.cmp)},l.prototype.heapify=function(){return a(this.nodes,this.cmp)},l.prototype.updateItem=function(h){return Z(this.nodes,h,this.cmp)},l.prototype.clear=function(){return this.nodes=[]},l.prototype.empty=function(){return this.nodes.length===0},l.prototype.size=function(){return this.nodes.length},l.prototype.clone=function(){var h;return h=new l,h.nodes=this.nodes.slice(0),h},l.prototype.toArray=function(){return this.nodes.slice(0)},l.prototype.insert=l.prototype.push,l.prototype.top=l.prototype.peek,l.prototype.front=l.prototype.peek,l.prototype.has=l.prototype.contains,l.prototype.copy=l.prototype.clone,l}(),function(l,h){return r.exports=h()}(this,function(){return e})}).call(te)})(qt);var ne=qt.exports,se=ne,M={},oe=ee,re=ie,ae=se;const le=0,ue=1;var ce=M,he=1;M.js=function(){var r=1,t=1.4,e=!1,i={},n,a={},y={},b={},A=!0,O,w={},j=[],H=Number.MAX_VALUE,K,Z=!1;this.setAcceptableTiles=function(u){u instanceof Array?K=u:!isNaN(parseFloat(u))&&isFinite(u)&&(K=[u])},this.enableSync=function(){e=!0},this.disableSync=function(){e=!1},this.enableDiagonals=function(){Z=!0},this.disableDiagonals=function(){Z=!1},this.setGrid=function(u){n=u;for(var o=0;o<n.length;o++)for(var s=0;s<n[0].length;s++)a[n[o][s]]||(a[n[o][s]]=1)},this.setTileCost=function(u,o){a[u]=o},this.setAdditionalPointCost=function(u,o,s){y[o]===void 0&&(y[o]={}),y[o][u]=s},this.removeAdditionalPointCost=function(u,o){y[o]!==void 0&&delete y[o][u]},this.removeAllAdditionalPointCosts=function(){y={}},this.setDirectionalCondition=function(u,o,s){b[o]===void 0&&(b[o]={}),b[o][u]=s},this.removeAllDirectionalConditions=function(){b={}},this.setIterationsPerCalculation=function(u){H=u},this.avoidAdditionalPoint=function(u,o){i[o]===void 0&&(i[o]={}),i[o][u]=1},this.stopAvoidingAdditionalPoint=function(u,o){i[o]!==void 0&&delete i[o][u]},this.enableCornerCutting=function(){A=!0},this.disableCornerCutting=function(){A=!1},this.stopAvoidingAllAdditionalPoints=function(){i={}},this.findPath=function(u,o,s,v,x){var P=function(xt){e?x(xt):setTimeout(function(){x(xt)})};if(K===void 0)throw new Error("You can't set a path without first calling setAcceptableTiles() on EasyStar.");if(n===void 0)throw new Error("You can't set a path without first calling setGrid() on EasyStar.");if(u<0||o<0||s<0||v<0||u>n[0].length-1||o>n.length-1||s>n[0].length-1||v>n.length-1)throw new Error("Your start or end point is outside the scope of your grid.");if(u===s&&o===v){P([]);return}for(var B=n[v][s],R=!1,at=0;at<K.length;at++)if(B===K[at]){R=!0;break}if(R===!1){P(null);return}var D=new oe;D.openList=new ae(function(xt,zt){return xt.bestGuessDistance()-zt.bestGuessDistance()}),D.isDoneCalculating=!1,D.nodeHash={},D.startX=u,D.startY=o,D.endX=s,D.endY=v,D.callback=P,D.openList.push(f(D,D.startX,D.startY,null,r));var At=he++;return w[At]=D,j.push(At),At},this.cancelPath=function(u){return u in w?(delete w[u],!0):!1},this.calculate=function(){if(!(j.length===0||n===void 0||K===void 0))for(O=0;O<H;O++){if(j.length===0)return;e&&(O=0);var u=j[0],o=w[u];if(typeof o>"u"){j.shift();continue}if(o.openList.size()===0){o.callback(null),delete w[u],j.shift();continue}var s=o.openList.pop();if(o.endX===s.x&&o.endY===s.y){var v=[];v.push({x:s.x,y:s.y});for(var x=s.parent;x!=null;)v.push({x:x.x,y:x.y}),x=x.parent;v.reverse();var P=v;o.callback(P),delete w[u],j.shift();continue}s.list=le,s.y>0&&W(o,s,0,-1,r*h(s.x,s.y-1)),s.x<n[0].length-1&&W(o,s,1,0,r*h(s.x+1,s.y)),s.y<n.length-1&&W(o,s,0,1,r*h(s.x,s.y+1)),s.x>0&&W(o,s,-1,0,r*h(s.x-1,s.y)),Z&&(s.x>0&&s.y>0&&(A||q(n,K,s.x,s.y-1,s)&&q(n,K,s.x-1,s.y,s))&&W(o,s,-1,-1,t*h(s.x-1,s.y-1)),s.x<n[0].length-1&&s.y<n.length-1&&(A||q(n,K,s.x,s.y+1,s)&&q(n,K,s.x+1,s.y,s))&&W(o,s,1,1,t*h(s.x+1,s.y+1)),s.x<n[0].length-1&&s.y>0&&(A||q(n,K,s.x,s.y-1,s)&&q(n,K,s.x+1,s.y,s))&&W(o,s,1,-1,t*h(s.x+1,s.y-1)),s.x>0&&s.y<n.length-1&&(A||q(n,K,s.x,s.y+1,s)&&q(n,K,s.x-1,s.y,s))&&W(o,s,-1,1,t*h(s.x-1,s.y+1)))}};var W=function(u,o,s,v,x){var P=o.x+s,B=o.y+v;if((i[B]===void 0||i[B][P]===void 0)&&q(n,K,P,B,o)){var R=f(u,P,B,o,x);R.list===void 0?(R.list=ue,u.openList.push(R)):o.costSoFar+x<R.costSoFar&&(R.costSoFar=o.costSoFar+x,R.parent=o,u.openList.updateItem(R))}},q=function(u,o,s,v,x){var P=b[v]&&b[v][s];if(P){var B=l(x.x-s,x.y-v),R=function(){for(var D=0;D<P.length;D++)if(P[D]===B)return!0;return!1};if(!R())return!1}for(var at=0;at<o.length;at++)if(u[v][s]===o[at])return!0;return!1},l=function(u,o){if(u===0&&o===-1)return M.TOP;if(u===1&&o===-1)return M.TOP_RIGHT;if(u===1&&o===0)return M.RIGHT;if(u===1&&o===1)return M.BOTTOM_RIGHT;if(u===0&&o===1)return M.BOTTOM;if(u===-1&&o===1)return M.BOTTOM_LEFT;if(u===-1&&o===0)return M.LEFT;if(u===-1&&o===-1)return M.TOP_LEFT;throw new Error("These differences are not valid: "+u+", "+o)},h=function(u,o){return y[o]&&y[o][u]||a[n[o][u]]},f=function(u,o,s,v,x){if(u.nodeHash[s]!==void 0){if(u.nodeHash[s][o]!==void 0)return u.nodeHash[s][o]}else u.nodeHash[s]={};var P=g(o,s,u.endX,u.endY);if(v!==null)var B=v.costSoFar+x;else B=0;var R=new re(v,o,s,B,P);return u.nodeHash[s][o]=R,R},g=function(u,o,s,v){if(Z){var x=Math.abs(u-s),P=Math.abs(o-v);return x<P?t*x+P:t*P+x}else{var x=Math.abs(u-s),P=Math.abs(o-v);return x+P}}};M.TOP="TOP";M.TOP_RIGHT="TOP_RIGHT";M.RIGHT="RIGHT";M.BOTTOM_RIGHT="BOTTOM_RIGHT";M.BOTTOM="BOTTOM";M.BOTTOM_LEFT="BOTTOM_LEFT";M.LEFT="LEFT";M.TOP_LEFT="TOP_LEFT";var fe=Object.defineProperty,de=(r,t,e)=>t in r?fe(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e,C=(r,t,e)=>(de(r,typeof t!="symbol"?t+"":t,e),e);class Ht{constructor(t){C(this,"_onPressed"),C(this,"_onPressedWithRepeat"),C(this,"_onReleased"),C(this,"_isPressed"),C(this,"_identity"),this._isPressed=!1,this._identity=t,typeof t=="function"?this._onPressedWithRepeat=t:(this._onPressed=t.onPressed,this._onPressedWithRepeat=t.onPressedWithRepeat,this._onReleased=t.onReleased)}get isEmpty(){return!this._onPressed&&!this._onPressedWithRepeat&&!this._onReleased}isOwnHandler(t){return this._identity===t}executePressed(t){var e,i;this._isPressed||(e=this._onPressed)==null||e.call(this,t),this._isPressed=!0,(i=this._onPressedWithRepeat)==null||i.call(this,t)}executeReleased(t){var e;this._isPressed&&((e=this._onReleased)==null||e.call(this,t)),this._isPressed=!1}}const Ot=class V{constructor(t,e,i={}){C(this,"_normalizedKeyCombo"),C(this,"_parsedKeyCombo"),C(this,"_handlerState"),C(this,"_keyComboEventMapper"),C(this,"_movingToNextSequenceAt"),C(this,"_sequenceIndex"),C(this,"_unitIndex"),C(this,"_lastActiveKeyPresses"),C(this,"_lastActiveKeyCount"),C(this,"_isPressedWithFinalUnit"),this._normalizedKeyCombo=V.normalizeKeyCombo(t),this._parsedKeyCombo=V.parseKeyCombo(t),this._handlerState=new Ht(i),this._keyComboEventMapper=e,this._movingToNextSequenceAt=0,this._sequenceIndex=0,this._unitIndex=0,this._lastActiveKeyPresses=[],this._lastActiveKeyCount=0,this._isPressedWithFinalUnit=null}static parseKeyCombo(t){if(V._parseCache[t])return V._parseCache[t];const e=t.toLowerCase();let i="",n=[],a=[n],y=[a];const b=[y];let A=!1;for(let w=0;w<t.length;w+=1)if(e[w]==="\\")A=!0;else if((e[w]==="+"||e[w]===">"||e[w]===",")&&!A){if(i)throw new Error("cannot have two operators in a row");i=e[w]}else e[w].match(/[^\s]/)&&(i&&(i===","?(n=[],a=[n],y=[a],b.push(y)):i===">"?(n=[],a=[n],y.push(a)):i==="+"&&(n=[],a.push(n)),i=""),A=!1,n.push(e[w]));const O=b.map(w=>w.map(j=>j.map(H=>H.join(""))));return V._parseCache[t]=O,O}static stringifyKeyCombo(t){return t.map(e=>e.map(i=>i.map(n=>n==="+"?"\\+":n===">"?"\\>":n===","?"\\,":n).join("+")).join(">")).join(",")}static normalizeKeyCombo(t){if(V._normalizationCache[t])return V._normalizationCache[t];const e=this.stringifyKeyCombo(this.parseKeyCombo(t));return V._normalizationCache[t]=e,e}get isPressed(){return!!this._isPressedWithFinalUnit}get sequenceIndex(){return this.isPressed?this._parsedKeyCombo.length:this._sequenceIndex}isOwnHandler(t){return this._handlerState.isOwnHandler(t)}executePressed(t){var e;(e=this._isPressedWithFinalUnit)!=null&&e.has(t.key)&&this._handlerState.executePressed(this._wrapEvent(this._lastActiveKeyPresses,{key:t.key,event:t}))}executeReleased(t){var e;(e=this._isPressedWithFinalUnit)!=null&&e.has(t.key)&&(this._handlerState.executeReleased(this._wrapEvent(this._lastActiveKeyPresses,{key:t.key,event:t})),this._isPressedWithFinalUnit=null)}updateState(t,e){const i=t.length,n=i<this._lastActiveKeyCount;this._lastActiveKeyCount=i;const a=this._parsedKeyCombo[this._sequenceIndex],y=a.slice(0,this._unitIndex),b=a.slice(this._unitIndex),A=()=>{this._movingToNextSequenceAt=0,this._sequenceIndex=0,this._unitIndex=0,this._lastActiveKeyPresses.length=0,this._handlerState.isEmpty&&(this._isPressedWithFinalUnit=null)};let O=0;if(n){if(this._movingToNextSequenceAt===0)return A();if(this._movingToNextSequenceAt+e<Date.now()||i!==0)return;this._movingToNextSequenceAt=0,this._sequenceIndex+=1,this._unitIndex=0;return}for(const w of y){for(const j of w){let H=!1;for(let K=O;K<t.length&&K<O+w.length;K+=1)if(t[K].key===j){H=!0;break}if(!H)return A()}O+=w.length}if(this._movingToNextSequenceAt===0){for(const w of b){for(const j of w){let H=!1;for(let K=O;K<t.length&&K<O+w.length;K+=1)if(t[K].key===j){H=!0;break}if(!H)return}this._unitIndex+=1,O+=w.length}if(O<i-1)return A();if(this._lastActiveKeyPresses[this._sequenceIndex]=t.slice(0),this._sequenceIndex<this._parsedKeyCombo.length-1){this._movingToNextSequenceAt=Date.now();return}this._isPressedWithFinalUnit=new Set(a[a.length-1])}}_wrapEvent(t,e){return{...this._keyComboEventMapper(t,e),keyCombo:this._normalizedKeyCombo,keyEvents:t.flat().map(i=>i.event),finalKeyEvent:e.event}}};C(Ot,"_parseCache",{}),C(Ot,"_normalizationCache",{});let et=Ot;const pe={addEventListener:(...r)=>{},removeEventListener:(...r)=>{},dispatchEvent:(...r)=>{}},ye={userAgent:""},mt=()=>typeof document<"u"?document:pe,ge=()=>typeof navigator<"u"?navigator:ye,me=()=>ge().userAgent.toLocaleLowerCase().includes("mac");let Lt=!1;const ve=r=>{!me()||r.key!=="Meta"||(Lt=!0)},be=r=>{!Lt||r.key!=="Meta"||(Lt=!1,Wt())},Pt=new Map,we=r=>{Pt.set(r.key,r)},Ce=r=>{Pt.delete(r.key)},Wt=()=>{for(const r of Pt.values()){const t=new KeyboardEvent("keyup",{key:r.key,code:r.code,bubbles:!0,cancelable:!0});mt().dispatchEvent(t)}Pt.clear()},xe=r=>{try{const t=()=>r();return addEventListener("focus",t),()=>{removeEventListener("focus",t)}}catch{}},Se=r=>{try{const t=()=>{Wt(),r()};return addEventListener("blur",t),()=>removeEventListener("blur",t)}catch{}},ke=r=>{try{const t=e=>(we(e),ve(e),r({key:e.key,originalEvent:e,composedPath:()=>e.composedPath(),preventDefault:()=>e.preventDefault()}));return mt().addEventListener("keydown",t),()=>mt().removeEventListener("keydown",t)}catch{}},Pe=r=>{try{const t=e=>(Ce(e),be(e),r({key:e.key,originalEvent:e,composedPath:()=>e.composedPath(),preventDefault:()=>e.preventDefault()}));return mt().addEventListener("keyup",t),()=>mt().removeEventListener("keyup",t)}catch{}},Te=1e3;class Ee{constructor(t={}){C(this,"sequenceTimeout"),C(this,"_isActive"),C(this,"_unbinder"),C(this,"_onActiveBinder"),C(this,"_onInactiveBinder"),C(this,"_onKeyPressedBinder"),C(this,"_onKeyReleasedBinder"),C(this,"_keyComboEventMapper"),C(this,"_selfReleasingKeys"),C(this,"_keyRemap"),C(this,"_handlerStates"),C(this,"_keyComboStates"),C(this,"_keyComboStatesArray"),C(this,"_activeKeyPresses"),C(this,"_activeKeyMap"),C(this,"_watchedKeyComboStates"),this.sequenceTimeout=Te,this._isActive=!0,this._onActiveBinder=()=>{},this._onInactiveBinder=()=>{},this._onKeyPressedBinder=()=>{},this._onKeyReleasedBinder=()=>{},this._keyComboEventMapper=()=>({}),this._selfReleasingKeys=[],this._keyRemap={},this._handlerStates={},this._keyComboStates={},this._keyComboStatesArray=[],this._activeKeyPresses=[],this._activeKeyMap=new Map,this._watchedKeyComboStates={},this.bindEnvironment(t)}get pressedKeys(){return this._activeKeyPresses.map(t=>t.key)}bindKey(t,e){var i;t=t.toLowerCase();const n=new Ht(e);(i=this._handlerStates)[t]??(i[t]=[]),this._handlerStates[t].push(n)}unbindKey(t,e){t=t.toLowerCase();const i=this._handlerStates[t];if(i)if(e)for(let n=0;n<i.length;n+=1)i[n].isOwnHandler(e)&&(i.splice(n,1),n-=1);else i.length=0}bindKeyCombo(t,e){var i;t=et.normalizeKeyCombo(t);const n=new et(t,this._keyComboEventMapper,e);(i=this._keyComboStates)[t]??(i[t]=[]),this._keyComboStates[t].push(n),this._keyComboStatesArray.push(n)}unbindKeyCombo(t,e){t=et.normalizeKeyCombo(t);const i=this._keyComboStates[t];if(i)if(e){for(let n=0;n<i.length;n+=1)if(i[n].isOwnHandler(e)){for(let a=0;a<this._keyComboStatesArray.length;a+=1)this._keyComboStatesArray[a]===i[n]&&(this._keyComboStatesArray.splice(a,1),a-=1);i.splice(n,1),n-=1}}else i.length=0}checkKey(t){return this._activeKeyMap.has(t.toLowerCase())}checkKeyCombo(t){return this._ensureCachedKeyComboState(t).isPressed}checkKeyComboSequenceIndex(t){return this._ensureCachedKeyComboState(t).sequenceIndex}bindEnvironment(t={}){this.unbindEnvironment(),this._onActiveBinder=t.onActive??xe,this._onInactiveBinder=t.onInactive??Se,this._onKeyPressedBinder=t.onKeyPressed??ke,this._onKeyReleasedBinder=t.onKeyReleased??Pe,this._keyComboEventMapper=t.mapKeyComboEvent??(()=>({})),this._selfReleasingKeys=t.selfReleasingKeys??[],this._keyRemap=t.keyRemap??{};const e=this._onActiveBinder(()=>{this._isActive=!0}),i=this._onInactiveBinder(()=>{this._isActive=!1}),n=this._onKeyPressedBinder(y=>{this._handleKeyPress(y)}),a=this._onKeyReleasedBinder(y=>{this._handleKeyRelease(y)});this._unbinder=()=>{e==null||e(),i==null||i(),n==null||n(),a==null||a()}}unbindEnvironment(){var t;(t=this._unbinder)==null||t.call(this)}_ensureCachedKeyComboState(t){t=et.normalizeKeyCombo(t),this._watchedKeyComboStates[t]||(this._watchedKeyComboStates[t]=new et(t,this._keyComboEventMapper));const e=this._watchedKeyComboStates[t];return e.updateState(this._activeKeyPresses,this.sequenceTimeout),e}_handleKeyPress(t){if(!this._isActive)return;t={...t,key:t.key.toLowerCase()};const e=this._keyRemap[t.key];e&&(t.key=e);const i=this._handlerStates[t.key];if(i)for(const a of i)a.executePressed(t);const n=this._activeKeyMap.get(t.key);if(n)n.event=t;else{const a={key:t.key,event:t};this._activeKeyMap.set(t.key,a),this._activeKeyPresses.push(a)}this._updateKeyComboStates();for(const a of this._keyComboStatesArray)a.executePressed(t)}_handleKeyRelease(t){t={...t,key:t.key.toLowerCase()};const e=this._keyRemap[t.key];e&&(t.key=e);const i=this._handlerStates[t.key];if(i)for(const n of i)n.executeReleased(t);if(this._activeKeyMap.has(t.key)){this._activeKeyMap.delete(t.key);for(let n=0;n<this._activeKeyPresses.length;n+=1)if(this._activeKeyPresses[n].key===t.key){this._activeKeyPresses.splice(n,1),n-=1;break}}this._tryReleaseSelfReleasingKeys(),this._updateKeyComboStates();for(const n of this._keyComboStatesArray)n.executeReleased(t)}_updateKeyComboStates(){for(const t of this._keyComboStatesArray)t.updateState(this._activeKeyPresses,this.sequenceTimeout)}_tryReleaseSelfReleasingKeys(){for(const t of this._activeKeyPresses)for(const e of this._selfReleasingKeys)t.key===e&&this._handleKeyRelease(t.event)}}let Ke,Rt;const Ae=r=>{Rt=r??new Ee(Ke)},Gt=()=>(Rt||Ae(),Rt),Ie=(...r)=>Gt().bindKey(...r),J=(...r)=>Gt().checkKey(...r);et.normalizeKeyCombo;et.stringifyKeyCombo;et.parseKeyCombo;const N=class N{static init(){document.addEventListener("keydown",()=>setTimeout(N.triggerKeyHoldingFunctions)),window.keyboardLoop=setInterval(N.triggerKeyHoldingFunctions,200),Ie("shift",{onPressed:()=>{N.shift.isPressed=!0,G.onPositionChange()},onReleased:()=>{N.shift.isPressed=!1,G.onPositionChange()}})}};T(N,"shift",{isPressed:!1}),T(N,"triggerKeyHoldingFunctions",()=>{(J("ArrowUp")||J("w"))&&window.dispatchEvent(new CustomEvent("move-north")),(J("ArrowDown")||J("s"))&&window.dispatchEvent(new CustomEvent("move-south")),(J("ArrowLeft")||J("a"))&&window.dispatchEvent(new CustomEvent("move-west")),(J("ArrowRight")||J("d"))&&window.dispatchEvent(new CustomEvent("move-east"))});let ut=N;const c=class c{static init(){document.addEventListener("mousemove",c.onMove,!1),document.addEventListener("mousedown",t=>{(t.which===1||t.button===0)&&(c.buttons.left.isPressed=!0,c.onLeftButtonPress()),(t.which===3||t.button===2)&&(c.buttons.right.isPressed=!0,c.onRightButtonPress())}),document.addEventListener("mouseup",t=>{(t.which===1||t.button===0)&&(c.buttons.left.isPressed=!1,c.onLeftButtonRelease()),(t.which===3||t.button===2)&&(c.buttons.right.isPressed=!1,c.onRightButtonRelease())}),document.addEventListener("contextmenu",t=>(t==null?void 0:t.cancelable)&&t.preventDefault())}static onMove(t){const e=p.ctx.canvas.getBoundingClientRect(),i={positionWindow:{...c.positionWindow},positionClient:{...c.positionClient},positionServer:{...c.positionServer}};c.positionWindow={x:t.clientX,y:t.clientY},c.positionClient={x:Math.floor(((t.clientX-e.left)/(e.right-e.left)*p.ctx.canvas.width+k.creature.offset.x)/E),y:Math.floor(((t.clientY-e.top)/(e.bottom-e.top)*p.ctx.canvas.height+k.creature.offset.y)/E)},c.positionServer=p.positionClientToServer(c.positionClient),ot(c.positionClient,i.positionClient)||c.onPositionChange(),ot(c.positionServer,i.positionServer)||c.onPositionChange(),c.grabbing.initialised&&!c.grabbing.itemId&&c.onGrabStart()}static onPositionChange(){if(c.grabbing.itemId)return;if(ut.shift.isPressed){p.ctx.canvas.setAttribute("cursor","eye");return}c.positionServer=p.positionClientToServer(c.positionClient);const t=p.getTileTopItem(c.positionServer);if(!t){p.ctx.canvas.removeAttribute("cursor");return}t===6?p.ctx.canvas.setAttribute("cursor","chest"):t===8?p.ctx.canvas.setAttribute("cursor","pick"):p.ctx.canvas.removeAttribute("cursor")}static onLeftButtonPress(){if(ut.shift.isPressed)return;const t=p.getTileTopItem(c.positionServer);if(t&&U.get(t).isMoveable){c.grabbing.itemId=null,c.grabbing.position={x:null,y:null},c.grabbing.initialised=!0;return}}static onLeftButtonRelease(){c.grabbing.initialised&&c.grabbing.itemId?c.onGrabEnd():(c.grabbing.initialised=!1,c.grabbing.itemId=null,c.grabbing.position={x:null,y:null},p.isWalkable(c.positionServer)&&X.mapClick())}static onRightButtonPress(){const t=p.getTileTopItem(c.positionServer);if(!c.buttons.right.isBlocked&&t&&It(k.creature.position,c.positionServer)){if(t===6){c.buttons.right.isBlocked=!0,gt.get("yellow-sparkles").run(c.positionServer),p.tiles[c.positionServer.y][c.positionServer.x].pop(),p.tiles[c.positionServer.y][c.positionServer.x].push(9),c.onPositionChange(),setTimeout(()=>{c.buttons.right.isBlocked=!1},600);return}if(t===8){c.buttons.right.isBlocked=!0,gt.get("ore-hit").run(c.positionServer),p.tiles[k.creature.position.y][k.creature.position.x].push(10),setTimeout(()=>{c.buttons.right.isBlocked=!1},600);return}}}static onRightButtonRelease(){U.get(p.getTileTopItem(c.positionServer)).type==="object"&&!It(k.creature.position,c.positionServer)&&X.mapClick(!0)}static onGrabStart(){c.grabbing.itemId=p.getTileTopItem(c.positionServer),c.grabbing.position={...c.positionServer},p.ctx.canvas.setAttribute("cursor","crosshair")}static onGrabEnd(){c.handleThrow(),c.grabbing.initialised=!1,c.grabbing.itemId=null,c.grabbing.position={x:null,y:null},c.onPositionChange()}static handleThrow(){if(It(k.creature.position,c.grabbing.position)===!1||ot(c.grabbing.position,c.positionServer))return;const t=p.getTileTopItem(c.grabbing.position);t===c.grabbing.itemId&&(p.getTileStack(c.positionServer).find(e=>U.get(e).isBlockingCreatures)||(p.tiles[c.grabbing.position.y][c.grabbing.position.x].pop(),p.tiles[c.positionServer.y][c.positionServer.x].push(t)))}};T(c,"positionWindow",{x:null,y:null}),T(c,"positionClient",{x:null,y:null}),T(c,"positionServer",{x:null,y:null}),T(c,"buttons",{left:{isBlocked:!1,isPressed:!1},right:{isBlocked:!1,isPressed:!1}}),T(c,"grabbing",{initialised:!1,itemId:null,position:{x:null,y:null}});let G=c;const S=class S{static init(){S.easyStar=new ce.js,window.addEventListener("move-north",()=>{S.targetPosition=null,k.walk("north")}),window.addEventListener("move-south",()=>{S.targetPosition=null,k.walk("south")}),window.addEventListener("move-west",()=>{S.targetPosition=null,k.walk("west")}),window.addEventListener("move-east",()=>{S.targetPosition=null,k.walk("east")}),window.addEventListener("map-click-step-done",S.mapClickStep)}static move(t,e,i){t.movement.timeouts.forEach(n=>clearTimeout(n)),t.movement.timeouts=[],t.currentFrame=0,t.offset={x:0,y:0},t.movement.isMoving=!0;for(let n=0;n<E;n++){const a=setTimeout(()=>S.handleMovingFrame(t,e,i),1e3/t.speed/E*n);t.movement.timeouts.push(a)}}static handleMovingFrame(t,e,i){if(t.sprite.loop("walk-"+i),t.movement.currentFrame++,S.updateOffsetAfterAnimationFrameChange(t,i),t.movement.currentFrame===E/2&&(t.position=e,window.dispatchEvent(new CustomEvent("hero-position-changed")),S.updateOffsetAfterPositionChange(t,i)),t.movement.currentFrame===E){if(t.movement.isMoving=!1,t.movement.currentFrame=0,t.movement.timeouts.forEach(n=>clearTimeout(n)),t.movement.timeouts=[],t.isHero()&&k.queuedMove&&(i=k.queuedMove,k.queuedMove=null,k.walk(i)))return;if(S.targetPosition){window.dispatchEvent(new CustomEvent("map-click-step-done"));return}t.sprite.loop("idle-"+i)}}static getDirection(t,e){if(t.x<e.x)return"east";if(t.x>e.x)return"west";if(t.y>e.y)return"north";if(t.y<e.y)return"south"}static getTargetPosition(t,e){const i={north:{x:0,y:-1},south:{x:0,y:1},west:{x:-1,y:0},east:{x:1,y:0}};return{x:t.position.x+i[e].x,y:t.position.y+i[e].y}}static updateOffsetAfterAnimationFrameChange(t,e){({north:()=>t.offset.y--,south:()=>t.offset.y++,west:()=>t.offset.x--,east:()=>t.offset.x++})[e]()}static updateOffsetAfterPositionChange(t,e){({north:()=>t.offset.y=E/2,south:()=>t.offset.y=-(E/2),west:()=>t.offset.x=E/2,east:()=>t.offset.x=-(E/2)})[e]()}static mapClick(t=!1){S.targetPosition={...G.positionServer},S.targetUse=t,S.mapClickStep()}static mapClickStep(){if(!S.targetPosition||ot(S.targetPosition,k.creature.position)){S.targetPosition=null,S.targetUse=null,k.creature.sprite.loop("idle-south");return}const t=[],e=p.positionServerToClient(k.creature.position),i=p.positionServerToClient(S.targetPosition);for(let n=p.area.fromY;n<=p.area.toY;n++){const a=[];for(let y=p.area.fromX;y<=p.area.toX;y++){let b=p.isWalkable({x:y,y:n});!b&&S.targetUse&&(b=!0),a.push(Number(b))}t.push(a)}return S.easyStar.setGrid(t),S.easyStar.setAcceptableTiles([1]),S.easyStar.findPath(e.x,e.y,i.x,i.y,n=>{if(n===null){console.log("Path was not found.");return}if(S.targetUse&&n.length===2){console.log("Using object..."),S.targetPosition=null,S.targetUse=null,k.creature.sprite.loop("idle-south");return}k.walk(S.getDirection(e,n[1]))}),S.easyStar.calculate(),t}};T(S,"easyStar",null),T(S,"targetPosition",null);let X=S;class Ut{constructor(t,e,i){T(this,"position",{x:null,y:null});T(this,"offset",{x:null,y:null});T(this,"sprite",null);T(this,"speed",2);T(this,"movement",{isMoving:!1,currentFrame:0,timeouts:[]});p.creatures[t]=this,this.position=e,this.offset=i,this.sprite=rt.get("outfit").clone(),this.sprite.dye([kt(),kt(),kt(),kt()]),this.sprite.loop("idle-south")}isHero(){return this===k.creature}move(t,e){X.move(this,e,t)}}const z=class z{static init(){z.creature=new Ut("Nemnes",{x:100,y:100},{x:0,y:0}),gt.get("energy").run(z.creature.position)}static walk(t){if(z.creature.movement.isMoving)return z.creature.movement.currentFrame>E-E/3?(z.queuedMove=t,!0):!1;const e=X.getTargetPosition(z.creature,t);return p.isWalkable(e)?(X.move(this.creature,e,t),!0):(z.creature.sprite.loop("idle-"+t),!1)}};T(z,"creature",null),T(z,"queuedMove",null);let k=z;const d=class d{static init(){const t=document.createElement("canvas");t.id="board",t.width=E*Mt,t.height=E*Bt,document.querySelector("#app").append(t),d.ctx=t.getContext("2d"),d.width=Mt,d.height=Bt,d.update(),window.addEventListener("hero-position-changed",()=>{d.update()})}static update(){d.area.fromX=k.creature.position.x-Math.floor(d.width/2),d.area.toX=k.creature.position.x+Math.floor(d.width/2),d.area.fromY=k.creature.position.y-Math.floor(d.height/2),d.area.toY=k.creature.position.y+Math.floor(d.height/2);for(const[i,n]of Object.entries(d.creatures))d.isOnArea(n.position)||delete d.creatures[i];const t=[],e={};for(let i=d.area.fromY;i<=d.area.toY;i++)for(let n=d.area.fromX;n<=d.area.toX;n++)e[i]=e[i]||{},d.tiles[i]&&d.tiles[i][n]?e[i][n]=d.tiles[i][n]:(e[i][n]=[],t.push({x:n,y:i}));d.tiles=e,d.requestTiles(t)}static getTileStack(t){return typeof d.tiles[t.y]>"u"||typeof d.tiles[t.y][t.x]>"u"?[]:d.tiles[t.y][t.x]}static getTileTopItem(t){const e=d.getTileStack(t);return e[e.length-1]??null}static updateTile(t,e){typeof d.tiles[t.y]<"u"&&typeof d.tiles[t.y][t.x]<"u"&&(d.tiles[t.y][t.x]=e)}static requestTiles(t){setTimeout(()=>{for(const e of t){const i=[];ct(40)?i.push(2):ct(40)?i.push(3):ct(30)?i.push(4):i.push(1),ot(e,k.creature.position)||(ct(100)?i.push(6):ct(100)&&i.push(8)),d.updateTile(e,i),ct(350)&&new Ut(Zt(20),e,{x:0,y:0})}},100)}static isWalkable(t){const e=d.getTileStack(t);return!(!e.find(i=>U.get(i).type==="ground")||e.find(i=>U.get(i).isBlockingCreatures))}static isOnArea(t){return t.x>=d.area.fromX&&t.x<=d.area.toX&&t.y>=d.area.fromY&&t.y<=d.area.toY}static positionClientToServer(t){return{x:t.x+d.area.fromX,y:t.y+d.area.fromY}}static positionServerToClient(t){return{x:t.x-d.area.fromX,y:t.y-d.area.fromY}}static getVisibleEffectsSprites(t){return d.effects&&d.effects[t.y]&&d.effects[t.y][t.x]?Object.values(this.effects[t.y][t.x]):[]}};T(d,"ctx",null),T(d,"width",null),T(d,"height",null),T(d,"tiles",{}),T(d,"effects",{}),T(d,"creatures",{}),T(d,"area",{fromX:null,fromY:null,toX:null,toY:null});let p=d;var wt,Et,Kt,Ct;const tt=class tt{constructor(t,e){F(this,Kt,null);F(this,Ct,null);m(tt,wt)[t]=this,I(this,Kt,t),I(this,Ct,e)}static async load(t){try{const i=await(await fetch(t)).json();return new Promise(n=>{Object.values(i).forEach(a=>{new tt(a.id,rt.get(a.sprite))}),n()})}catch(e){console.error("Error loading effects:",e)}}static get(t){return m(tt,wt)[t]??null}run(t){p.effects[t.y]||(p.effects[t.y]={}),p.effects[t.y][t.x]||(p.effects[t.y][t.x]={});const e=++St(tt,Et)._,i=m(this,Ct).clone();p.effects[t.y][t.x][e]=i,i.play().then(()=>{delete p.effects[t.y][t.x][e]})}};wt=new WeakMap,Et=new WeakMap,Kt=new WeakMap,Ct=new WeakMap,F(tt,wt,{}),F(tt,Et,0);let gt=tt;class L{static renderTile(t,e,i,n){i==="ground"&&n.forEach(a=>{U.get(a).type==="ground"&&L.drawSprite(t,U.get(a).sprite)}),i==="objects"&&(n.forEach(a=>{const y=U.get(a);y.type==="object"&&L.drawSprite(t,y.sprite)}),ut.shift.isPressed&&ot(t,G.positionClient)&&L.drawSprite(t,rt.get("cursor")),X.targetPosition&&!X.targetUse&&ot(e,X.targetPosition)&&L.drawSprite(t,rt.get("cursor")),Object.values(p.creatures).forEach(a=>{ot(e,a.position)&&L.drawCreature(t,a)}),p.getVisibleEffectsSprites(e).forEach(a=>{L.drawSprite(t,a)}))}static drawSprite(t,e){const i=e.getFrame(),n=t.y*E+(E-i.height),a=t.x*E+(Math.ceil(E/2)-Math.ceil(i.width/2));L.tempCtx.drawImage(i,a,n)}static drawCreature(t,e){const i=e.sprite.getFrame(),n=t.y*E+(E-i.height)+e.offset.y,a=t.x*E+(Math.ceil(E/2)-Math.ceil(i.width/2))+e.offset.x;L.tempCtx.drawImage(i,a,n)}static cropEdges(t){t.clearRect(0,0,E,t.canvas.height),t.clearRect(0,0,t.canvas.width,E),t.clearRect(t.canvas.width-E,0,t.canvas.width,t.canvas.height),t.clearRect(0,t.canvas.height-E,t.canvas.width,t.canvas.height)}static render(){const t=document.createElement("canvas");t.width=p.ctx.canvas.width,t.height=p.ctx.canvas.height,L.tempCtx=t.getContext("2d"),L.tempCtx.fillStyle="#25131a",L.tempCtx.fillRect(0,0,L.tempCtx.canvas.width,L.tempCtx.canvas.height);for(let e of["ground","objects"]){let i=0;for(let[n,a]of Object.entries(p.tiles)){let y=0;for(let[b,A]of Object.entries(a)){const O={x:y,y:i},w={x:Number(b),y:Number(n)};L.renderTile(O,w,e,A),y++}i++}}L.renderInfoBox(L.tempCtx),p.ctx.clearRect(0,0,p.ctx.canvas.width,p.ctx.canvas.height),p.ctx.drawImage(t,-k.creature.offset.x,-k.creature.offset.y),L.cropEdges(p.ctx),window.requestAnimationFrame(L.render)}static renderInfoBox(t){if(ut.shift.isPressed){const e={x:G.positionClient.x*E+E/3*2,y:G.positionClient.y*E+E/3*2};for(const[a,y]of Object.entries(p.creatures))if(G.positionServer.x===y.position.x&&G.positionServer.y===y.position.y){const b=a.length*5.5+8;t.fillStyle="#1c3d17",t.fillRect(e.x,e.y,b,16),t.strokeStyle="#FFA500",t.strokeRect(e.x,e.y,b,16),t.font="normal bold 9px monospace",t.strokeStyle="#000000",t.strokeText(a,e.x+4,e.y+11),t.strokeText(a,e.x+4,e.y+11),t.fillStyle="#FFA500",t.fillText(a,e.x+4,e.y+11);return}const i=p.getTileTopItem(G.positionServer),n=U.get(i);if(n&&n.type==="object"){const a=n.name.length*5.5+8;t.fillStyle="#172459",t.fillRect(e.x,e.y,a,16),t.strokeStyle="#FFA500",t.strokeRect(e.x,e.y,a,16),t.font="normal bold 9px monospace",t.strokeStyle="#000000",t.strokeText(n.name,e.x+4,e.y+11),t.strokeText(n.name,e.x+4,e.y+11),t.fillStyle="#FFA500",t.fillText(n.name,e.x+4,e.y+11)}}}}const Oe=async()=>{async function r(){await rt.load(_t),await U.load(Vt),await gt.load(Qt)}async function t(){ut.init(),G.init(),k.init(),X.init(),p.init(),L.render()}await r(),await t()};Oe();
