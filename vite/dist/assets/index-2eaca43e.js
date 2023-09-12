var ve=Object.defineProperty;var ge=(r,e,t)=>e in r?ve(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var p=(r,e,t)=>(ge(r,typeof e!="symbol"?e+"":e,t),t),he=(r,e,t)=>{if(!e.has(r))throw TypeError("Cannot "+t)};var c=(r,e,t)=>(he(r,e,"read from private field"),t?t.call(r):e.get(r)),b=(r,e,t)=>{if(e.has(r))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(r):e.set(r,t)},y=(r,e,t,s)=>(he(r,e,"write to private field"),s?s.call(r,t):e.set(r,t),t);var te=(r,e,t,s)=>({set _(i){y(r,e,i,t)},get _(){return c(r,e,s)}});(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const h of n.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&s(h)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();const m=32,ue=33,fe=19,we="data/sprites.json",be="data/items.json",Ce="data/effects.json";class k{static rand(e){return Math.floor(Math.random()*(e+1))}static roll(e){return k.rand(e)===e}static randomString(e){return window.btoa(String.fromCharCode(...window.crypto.getRandomValues(new Uint8Array(e*2)))).replace(/[+/]/g,"").substring(0,e)}static randomColor(){return"#000000".replace(/0/g,function(){return(~~(Math.random()*16)).toString(16)})}static hexToRGB(e){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:null}static replaceColors(e,t){Object.keys(t).forEach(n=>{t[k.hexToRGB(n).toString()]=k.hexToRGB(t[n]),delete t[n]});const s=document.createElement("canvas").getContext("2d");s.canvas.width=e.width,s.canvas.height=e.height,s.drawImage(e,0,0);const i=s.getImageData(0,0,s.canvas.width,s.canvas.height);for(let n=0;n<i.data.length;n+=4){const h=[i.data[n],i.data[n+1],i.data[n+2]].toString();if(h in t){const d=t[h];i.data[n]=d[0],i.data[n+1]=d[1],i.data[n+2]=d[2],i.data[n+3]=255}}return s.putImageData(i,0,0),s.canvas}static async loadImage(e){return new Promise(t=>{const s=new Image;s.onload=()=>t(s),s.src=e})}static async dye(e,t,s){return new Promise(i=>{if(!t)return e;const n=["#ff0000","#ff00ff","#0000ff","#ffff00","#00ffff","#ff00ff"],h={};s.forEach((w,B)=>{h[n[B]]=w});const d=k.replaceColors(t,h),g=document.createElement("canvas").getContext("2d");g.canvas.width=e.width,g.canvas.height=e.height,g.drawImage(e,0,0),g.globalCompositeOperation="overlay",g.drawImage(d,0,0);const x=new Image;x.onload=()=>i(x),x.src=g.canvas.toDataURL("image/png")})}}var $,ne,q,N,U,T,E,K,G,X,Y,R,Q;const D=class D{constructor(e,t){b(this,ne,null);b(this,q,null);b(this,N,null);b(this,U,null);b(this,T,null);b(this,E,null);b(this,K,null);b(this,G,null);b(this,X,null);b(this,Y,null);b(this,R,null);b(this,Q,null);e&&(c(D,$)[e]=this),y(this,ne,e),y(this,q,t.image),y(this,N,t.image),y(this,U,t.mask||null),y(this,T,t.speed||null),y(this,E,t.states||{}),c(this,E).origin=[{x:0,y:0,w:c(this,q).width,h:c(this,q).height}],y(this,K,document.createElement("canvas")),y(this,G,c(this,K).getContext("2d")),y(this,Y,this.getDefaultState()),y(this,R,1)}static async load(e){try{const s=await(await fetch(e)).json();await Promise.all(Object.entries(s).map(async([i,n])=>{const d={image:await k.loadImage(n.base),speed:n.speed||null,states:n.states||null};n.mask&&(d.mask=await k.loadImage(n.mask)),new D(i,d)}))}catch(t){console.error("Error loading sprites:",t)}}static get(e){return c(D,$)[e]??null}clone(){return new D(null,{image:c(this,N),mask:c(this,U),speed:c(this,T),states:c(this,E)})}async play(e=null){return new Promise(t=>{e=e||this.getDefaultState(),this.stop(),this.rewind(),y(this,Y,e);const s=c(this,E)[e].length;s>1&&c(this,T)&&y(this,X,setInterval(()=>{++te(this,R)._>s&&(this.stop(),t())},c(this,T)))})}stop(){clearInterval(c(this,X)),y(this,X,null)}rewind(){y(this,R,1)}loop(e=null){if(e=e||this.getDefaultState(),c(this,X)&&c(this,Y)===e)return;this.stop(),this.rewind(),y(this,Y,e);const t=c(this,E)[e].length;t>1&&c(this,T)&&y(this,X,setInterval(()=>{++te(this,R)._>t&&y(this,R,1)},c(this,T)))}async dye(e){y(this,q,await k.dye(c(this,N),c(this,U),e)),y(this,Q,null)}getDefaultState(){return Object.keys(c(this,E))[0]}getFrame(){const e=c(this,E)[c(this,Y)][c(this,R)-1];return c(this,Q)===e?c(this,K):(y(this,Q,e),c(this,K).width=e.w,c(this,K).height=e.h,c(this,G).clearRect(0,0,c(this,K).width,c(this,K).height),c(this,G).drawImage(c(this,q),e.x,e.y,e.w,e.h,0,0,e.w,e.h),c(this,K))}};$=new WeakMap,ne=new WeakMap,q=new WeakMap,N=new WeakMap,U=new WeakMap,T=new WeakMap,E=new WeakMap,K=new WeakMap,G=new WeakMap,X=new WeakMap,Y=new WeakMap,R=new WeakMap,Q=new WeakMap,b(D,$,{});let W=D;var J;const z=class z{constructor(e,t){p(this,"id",null);p(this,"name",null);p(this,"sprite",null);p(this,"type",null);p(this,"isBlockingCreatures",null);p(this,"isMoveable",null);c(z,J)[e]=this,this.id=t.id,this.name=t.name,this.sprite=W.get(t.sprite),this.sprite.loop(),this.type=t.type,this.isBlockingCreatures=t.isBlockingCreatures,this.isMoveable=t.isMoveable}static async load(e){try{const s=await(await fetch(e)).json();return new Promise(i=>{Object.values(s).forEach(n=>{new z(n.id,n)}),i()})}catch(t){console.error("Error loading items:",t)}}static get(e){return c(z,J)[e]??null}};J=new WeakMap,b(z,J,{});let S=z;class de{constructor(e,t,s){p(this,"position",{x:null,y:null});p(this,"offset",{x:null,y:null});p(this,"sprite",null);p(this,"speed",2);l.creatures[e]=this,this.position=t,this.offset=s,this.sprite=W.get("outfit").clone(),this.sprite.dye([k.randomColor(),k.randomColor(),k.randomColor(),k.randomColor()]),this.sprite.loop("idle-south")}isHero(){return this===v.creature}}class se{static init(){window.addEventListener("move-north",()=>v.walk("north")),window.addEventListener("move-south",()=>v.walk("south")),window.addEventListener("move-west",()=>v.walk("west")),window.addEventListener("move-east",()=>v.walk("east"))}static getTargetPosition(e,t){const s={north:{x:0,y:-1},south:{x:0,y:1},west:{x:-1,y:0},east:{x:1,y:0}};return{x:e.position.x+s[t].x,y:e.position.y+s[t].y}}static updateOffsetAfterAnimationFrameChange(e,t){({north:()=>e.offset.y--,south:()=>e.offset.y++,west:()=>e.offset.x--,east:()=>e.offset.x++})[t]()}static updateOffsetAfterPositionChange(e,t){({north:()=>e.offset.y=m/2,south:()=>e.offset.y=-(m/2),west:()=>e.offset.x=m/2,east:()=>e.offset.x=-(m/2)})[t]()}}const u=class u{static init(){u.creature=new de("Nemnes",{x:100,y:100},{x:0,y:0}),V.get("energy").run(u.creature.position.x,u.creature.position.y)}static walk(e){if(u.movement.isMoving)return u.movement.currentFrame>m-m/3?(u.movement.queuedMove=e,!0):!1;const t=se.getTargetPosition(u.creature,e);if(!l.isWalkable(t.x,t.y))return u.creature.sprite.loop("idle-"+e),!1;u.movement.isMoving=!0;for(let s=0;s<m;s++){const i=setTimeout(()=>u.handleWalkFrame(e,t),1e3/u.creature.speed/m*s);u.movement.timeouts.push(i)}return!0}static handleWalkFrame(e,t){u.creature.sprite.loop("walk-"+e),u.movement.currentFrame++,se.updateOffsetAfterAnimationFrameChange(u.creature,e),u.movement.currentFrame===m/2&&(u.creature.position=t,window.dispatchEvent(new CustomEvent("hero-position-changed")),se.updateOffsetAfterPositionChange(u.creature,e)),u.movement.currentFrame===m&&(u.movement.isMoving=!1,u.movement.currentFrame=0,u.movement.timeouts.forEach(s=>clearTimeout(s)),u.movement.timeouts=[],u.movement.queuedMove?(e=u.movement.queuedMove,u.movement.queuedMove=null,u.walk(e)||u.creature.sprite.loop("idle-"+e)):u.creature.sprite.loop("idle-"+e))}};p(u,"creature",null),p(u,"movement",{queuedMove:null,isMoving:!1,currentFrame:0,timeouts:[]});let v=u;const a=class a{static init(){const e=document.createElement("canvas");e.id="board",e.width=m*ue,e.height=m*fe,document.querySelector("#app").append(e),a.ctx=e.getContext("2d"),a.width=ue,a.height=fe,a.update(),window.addEventListener("hero-position-changed",()=>{a.update()})}static update(){a.area.fromX=v.creature.position.x-Math.floor(a.width/2),a.area.toX=v.creature.position.x+Math.floor(a.width/2),a.area.fromY=v.creature.position.y-Math.floor(a.height/2),a.area.toY=v.creature.position.y+Math.floor(a.height/2);for(const[s,i]of Object.entries(a.creatures))a.isOnArea(i.position.x,i.position.y)||delete a.creatures[s];const e=[],t={};for(let s=a.area.fromY;s<=a.area.toY;s++)for(let i=a.area.fromX;i<=a.area.toX;i++)t[s]=t[s]||{},a.tiles[s]&&a.tiles[s][i]?t[s][i]=a.tiles[s][i]:(t[s][i]=[],e.push({x:i,y:s}));a.tiles=t,a.requestTiles(e)}static getTileStack(e,t){return typeof a.tiles[t]>"u"||typeof a.tiles[t][e]>"u"?[]:a.tiles[t][e]}static getTileTopItem(e,t){const s=a.getTileStack(e,t);return s[s.length-1]??null}static updateTile(e,t,s){typeof a.tiles[t]<"u"&&typeof a.tiles[t][e]<"u"&&(a.tiles[t][e]=s)}static requestTiles(e){setTimeout(()=>{for(const t of e){const s=t.x,i=t.y,n=[];k.roll(40)?n.push(2):k.roll(40)?n.push(3):k.roll(30)?n.push(4):n.push(1),s===v.creature.position.x&&i===v.creature.position.y||(k.roll(100)?n.push(6):k.roll(100)&&n.push(8)),a.updateTile(s,i,n),k.roll(350)&&new de(k.randomString(20),{x:s,y:i},{x:0,y:0})}},100)}static isWalkable(e,t){const s=a.getTileStack(e,t);return!(!s.find(i=>S.get(i).type==="ground")||s.find(i=>S.get(i).isBlockingCreatures))}static isInHeroRange(e,t,s=1){const i=v.creature.position.x-s,n=v.creature.position.y-s,h=v.creature.position.x+s,d=v.creature.position.y+s;return e>=i&&e<=h&&t>=n&&t<=d}static isOnArea(e,t){return e>=a.area.fromX&&e<=a.area.toX&&t>=a.area.fromY&&t<=a.area.toY}static positionLocalToServer(e,t){return{x:a.area.fromX+e,y:a.area.fromY+t}}static getEffects(e,t){return a.effects&&a.effects[t]&&a.effects[t][e]?Object.values(this.effects[t][e]):[]}};p(a,"ctx",null),p(a,"width",null),p(a,"height",null),p(a,"tiles",{}),p(a,"effects",{}),p(a,"creatures",{}),p(a,"area",{fromX:null,fromY:null,toX:null,toY:null});let l=a;var _,oe,re,ee;const L=class L{constructor(e,t){b(this,re,null);b(this,ee,null);c(L,_)[e]=this,y(this,re,e),y(this,ee,t)}static async load(e){try{const s=await(await fetch(e)).json();return new Promise(i=>{Object.values(s).forEach(n=>{new L(n.id,W.get(n.sprite))}),i()})}catch(t){console.error("Error loading effects:",t)}}static get(e){return c(L,_)[e]??null}run(e,t){l.effects[t]||(l.effects[t]={}),l.effects[t][e]||(l.effects[t][e]={});const s=++te(L,oe)._,i=c(this,ee).clone();l.effects[t][e][s]=i,i.play().then(()=>{delete l.effects[t][e][s]})}};_=new WeakMap,oe=new WeakMap,re=new WeakMap,ee=new WeakMap,b(L,_,{}),b(L,oe,0);let V=L;var ke=Object.defineProperty,xe=(r,e,t)=>e in r?ke(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,f=(r,e,t)=>(xe(r,typeof e!="symbol"?e+"":e,t),t);class me{constructor(e){f(this,"_onPressed"),f(this,"_onPressedWithRepeat"),f(this,"_onReleased"),f(this,"_isPressed"),f(this,"_identity"),this._isPressed=!1,this._identity=e,typeof e=="function"?this._onPressedWithRepeat=e:(this._onPressed=e.onPressed,this._onPressedWithRepeat=e.onPressedWithRepeat,this._onReleased=e.onReleased)}get isEmpty(){return!this._onPressed&&!this._onPressedWithRepeat&&!this._onReleased}isOwnHandler(e){return this._identity===e}executePressed(e){var t,s;this._isPressed||(t=this._onPressed)==null||t.call(this,e),this._isPressed=!0,(s=this._onPressedWithRepeat)==null||s.call(this,e)}executeReleased(e){var t;this._isPressed&&((t=this._onReleased)==null||t.call(this,e)),this._isPressed=!1}}const ae=class A{constructor(e,t,s={}){f(this,"_normalizedKeyCombo"),f(this,"_parsedKeyCombo"),f(this,"_handlerState"),f(this,"_keyComboEventMapper"),f(this,"_movingToNextSequenceAt"),f(this,"_sequenceIndex"),f(this,"_unitIndex"),f(this,"_lastActiveKeyPresses"),f(this,"_lastActiveKeyCount"),f(this,"_isPressedWithFinalUnit"),this._normalizedKeyCombo=A.normalizeKeyCombo(e),this._parsedKeyCombo=A.parseKeyCombo(e),this._handlerState=new me(s),this._keyComboEventMapper=t,this._movingToNextSequenceAt=0,this._sequenceIndex=0,this._unitIndex=0,this._lastActiveKeyPresses=[],this._lastActiveKeyCount=0,this._isPressedWithFinalUnit=null}static parseKeyCombo(e){if(A._parseCache[e])return A._parseCache[e];const t=e.toLowerCase();let s="",i=[],n=[i],h=[n];const d=[h];let g=!1;for(let w=0;w<e.length;w+=1)if(t[w]==="\\")g=!0;else if((t[w]==="+"||t[w]===">"||t[w]===",")&&!g){if(s)throw new Error("cannot have two operators in a row");s=t[w]}else t[w].match(/[^\s]/)&&(s&&(s===","?(i=[],n=[i],h=[n],d.push(h)):s===">"?(i=[],n=[i],h.push(n)):s==="+"&&(i=[],n.push(i)),s=""),g=!1,i.push(t[w]));const x=d.map(w=>w.map(B=>B.map(j=>j.join(""))));return A._parseCache[e]=x,x}static stringifyKeyCombo(e){return e.map(t=>t.map(s=>s.map(i=>i==="+"?"\\+":i===">"?"\\>":i===","?"\\,":i).join("+")).join(">")).join(",")}static normalizeKeyCombo(e){if(A._normalizationCache[e])return A._normalizationCache[e];const t=this.stringifyKeyCombo(this.parseKeyCombo(e));return A._normalizationCache[e]=t,t}get isPressed(){return!!this._isPressedWithFinalUnit}get sequenceIndex(){return this.isPressed?this._parsedKeyCombo.length:this._sequenceIndex}isOwnHandler(e){return this._handlerState.isOwnHandler(e)}executePressed(e){var t;(t=this._isPressedWithFinalUnit)!=null&&t.has(e.key)&&this._handlerState.executePressed(this._wrapEvent(this._lastActiveKeyPresses,{key:e.key,event:e}))}executeReleased(e){var t;(t=this._isPressedWithFinalUnit)!=null&&t.has(e.key)&&(this._handlerState.executeReleased(this._wrapEvent(this._lastActiveKeyPresses,{key:e.key,event:e})),this._isPressedWithFinalUnit=null)}updateState(e,t){const s=e.length,i=s<this._lastActiveKeyCount;this._lastActiveKeyCount=s;const n=this._parsedKeyCombo[this._sequenceIndex],h=n.slice(0,this._unitIndex),d=n.slice(this._unitIndex),g=()=>{this._movingToNextSequenceAt=0,this._sequenceIndex=0,this._unitIndex=0,this._lastActiveKeyPresses.length=0,this._handlerState.isEmpty&&(this._isPressedWithFinalUnit=null)};let x=0;if(i){if(this._movingToNextSequenceAt===0)return g();if(this._movingToNextSequenceAt+t<Date.now()||s!==0)return;this._movingToNextSequenceAt=0,this._sequenceIndex+=1,this._unitIndex=0;return}for(const w of h){for(const B of w){let j=!1;for(let I=x;I<e.length&&I<x+w.length;I+=1)if(e[I].key===B){j=!0;break}if(!j)return g()}x+=w.length}if(this._movingToNextSequenceAt===0){for(const w of d){for(const B of w){let j=!1;for(let I=x;I<e.length&&I<x+w.length;I+=1)if(e[I].key===B){j=!0;break}if(!j)return}this._unitIndex+=1,x+=w.length}if(x<s-1)return g();if(this._lastActiveKeyPresses[this._sequenceIndex]=e.slice(0),this._sequenceIndex<this._parsedKeyCombo.length-1){this._movingToNextSequenceAt=Date.now();return}this._isPressedWithFinalUnit=new Set(n[n.length-1])}}_wrapEvent(e,t){return{...this._keyComboEventMapper(e,t),keyCombo:this._normalizedKeyCombo,keyEvents:e.flat().map(s=>s.event),finalKeyEvent:t.event}}};f(ae,"_parseCache",{}),f(ae,"_normalizationCache",{});let O=ae;const Pe={addEventListener:(...r)=>{},removeEventListener:(...r)=>{},dispatchEvent:(...r)=>{}},Ke={userAgent:""},Z=()=>typeof document<"u"?document:Pe,Se=()=>typeof navigator<"u"?navigator:Ke,Ee=()=>Se().userAgent.toLocaleLowerCase().includes("mac");let le=!1;const Ie=r=>{!Ee()||r.key!=="Meta"||(le=!0)},Ae=r=>{!le||r.key!=="Meta"||(le=!1,pe())},ie=new Map,Te=r=>{ie.set(r.key,r)},Re=r=>{ie.delete(r.key)},pe=()=>{for(const r of ie.values()){const e=new KeyboardEvent("keyup",{key:r.key,code:r.code,bubbles:!0,cancelable:!0});Z().dispatchEvent(e)}ie.clear()},Fe=r=>{try{const e=()=>r();return addEventListener("focus",e),()=>{removeEventListener("focus",e)}}catch{}},Le=r=>{try{const e=()=>{pe(),r()};return addEventListener("blur",e),()=>removeEventListener("blur",e)}catch{}},Me=r=>{try{const e=t=>(Te(t),Ie(t),r({key:t.key,originalEvent:t,composedPath:()=>t.composedPath(),preventDefault:()=>t.preventDefault()}));return Z().addEventListener("keydown",e),()=>Z().removeEventListener("keydown",e)}catch{}},Oe=r=>{try{const e=t=>(Re(t),Ae(t),r({key:t.key,originalEvent:t,composedPath:()=>t.composedPath(),preventDefault:()=>t.preventDefault()}));return Z().addEventListener("keyup",e),()=>Z().removeEventListener("keyup",e)}catch{}},qe=1e3;class Xe{constructor(e={}){f(this,"sequenceTimeout"),f(this,"_isActive"),f(this,"_unbinder"),f(this,"_onActiveBinder"),f(this,"_onInactiveBinder"),f(this,"_onKeyPressedBinder"),f(this,"_onKeyReleasedBinder"),f(this,"_keyComboEventMapper"),f(this,"_selfReleasingKeys"),f(this,"_keyRemap"),f(this,"_handlerStates"),f(this,"_keyComboStates"),f(this,"_keyComboStatesArray"),f(this,"_activeKeyPresses"),f(this,"_activeKeyMap"),f(this,"_watchedKeyComboStates"),this.sequenceTimeout=qe,this._isActive=!0,this._onActiveBinder=()=>{},this._onInactiveBinder=()=>{},this._onKeyPressedBinder=()=>{},this._onKeyReleasedBinder=()=>{},this._keyComboEventMapper=()=>({}),this._selfReleasingKeys=[],this._keyRemap={},this._handlerStates={},this._keyComboStates={},this._keyComboStatesArray=[],this._activeKeyPresses=[],this._activeKeyMap=new Map,this._watchedKeyComboStates={},this.bindEnvironment(e)}get pressedKeys(){return this._activeKeyPresses.map(e=>e.key)}bindKey(e,t){var s;e=e.toLowerCase();const i=new me(t);(s=this._handlerStates)[e]??(s[e]=[]),this._handlerStates[e].push(i)}unbindKey(e,t){e=e.toLowerCase();const s=this._handlerStates[e];if(s)if(t)for(let i=0;i<s.length;i+=1)s[i].isOwnHandler(t)&&(s.splice(i,1),i-=1);else s.length=0}bindKeyCombo(e,t){var s;e=O.normalizeKeyCombo(e);const i=new O(e,this._keyComboEventMapper,t);(s=this._keyComboStates)[e]??(s[e]=[]),this._keyComboStates[e].push(i),this._keyComboStatesArray.push(i)}unbindKeyCombo(e,t){e=O.normalizeKeyCombo(e);const s=this._keyComboStates[e];if(s)if(t){for(let i=0;i<s.length;i+=1)if(s[i].isOwnHandler(t)){for(let n=0;n<this._keyComboStatesArray.length;n+=1)this._keyComboStatesArray[n]===s[i]&&(this._keyComboStatesArray.splice(n,1),n-=1);s.splice(i,1),i-=1}}else s.length=0}checkKey(e){return this._activeKeyMap.has(e.toLowerCase())}checkKeyCombo(e){return this._ensureCachedKeyComboState(e).isPressed}checkKeyComboSequenceIndex(e){return this._ensureCachedKeyComboState(e).sequenceIndex}bindEnvironment(e={}){this.unbindEnvironment(),this._onActiveBinder=e.onActive??Fe,this._onInactiveBinder=e.onInactive??Le,this._onKeyPressedBinder=e.onKeyPressed??Me,this._onKeyReleasedBinder=e.onKeyReleased??Oe,this._keyComboEventMapper=e.mapKeyComboEvent??(()=>({})),this._selfReleasingKeys=e.selfReleasingKeys??[],this._keyRemap=e.keyRemap??{};const t=this._onActiveBinder(()=>{this._isActive=!0}),s=this._onInactiveBinder(()=>{this._isActive=!1}),i=this._onKeyPressedBinder(h=>{this._handleKeyPress(h)}),n=this._onKeyReleasedBinder(h=>{this._handleKeyRelease(h)});this._unbinder=()=>{t==null||t(),s==null||s(),i==null||i(),n==null||n()}}unbindEnvironment(){var e;(e=this._unbinder)==null||e.call(this)}_ensureCachedKeyComboState(e){e=O.normalizeKeyCombo(e),this._watchedKeyComboStates[e]||(this._watchedKeyComboStates[e]=new O(e,this._keyComboEventMapper));const t=this._watchedKeyComboStates[e];return t.updateState(this._activeKeyPresses,this.sequenceTimeout),t}_handleKeyPress(e){if(!this._isActive)return;e={...e,key:e.key.toLowerCase()};const t=this._keyRemap[e.key];t&&(e.key=t);const s=this._handlerStates[e.key];if(s)for(const n of s)n.executePressed(e);const i=this._activeKeyMap.get(e.key);if(i)i.event=e;else{const n={key:e.key,event:e};this._activeKeyMap.set(e.key,n),this._activeKeyPresses.push(n)}this._updateKeyComboStates();for(const n of this._keyComboStatesArray)n.executePressed(e)}_handleKeyRelease(e){e={...e,key:e.key.toLowerCase()};const t=this._keyRemap[e.key];t&&(e.key=t);const s=this._handlerStates[e.key];if(s)for(const i of s)i.executeReleased(e);if(this._activeKeyMap.has(e.key)){this._activeKeyMap.delete(e.key);for(let i=0;i<this._activeKeyPresses.length;i+=1)if(this._activeKeyPresses[i].key===e.key){this._activeKeyPresses.splice(i,1),i-=1;break}}this._tryReleaseSelfReleasingKeys(),this._updateKeyComboStates();for(const i of this._keyComboStatesArray)i.executeReleased(e)}_updateKeyComboStates(){for(const e of this._keyComboStatesArray)e.updateState(this._activeKeyPresses,this.sequenceTimeout)}_tryReleaseSelfReleasingKeys(){for(const e of this._activeKeyPresses)for(const t of this._selfReleasingKeys)e.key===t&&this._handleKeyRelease(e.event)}}let Ye,ce;const Be=r=>{ce=r??new Xe(Ye)},ye=()=>(ce||Be(),ce),je=(...r)=>ye().bindKey(...r),F=(...r)=>ye().checkKey(...r);O.normalizeKeyCombo;O.stringifyKeyCombo;O.parseKeyCombo;const o=class o{static init(){document.addEventListener("mousemove",o.onMove,!1),document.addEventListener("mousedown",e=>{(e.which===1||e.button===0)&&(o.buttons.left.isDown=!0,o.onLeftButtonClick()),(e.which===3||e.button===2)&&(o.buttons.right.isDown=!0,o.onRightButtonClick())}),document.addEventListener("mouseup",e=>{(e.which===1||e.button===0)&&(o.buttons.left.isDown=!1,o.grabbing.itemId&&o.onGrabEnd()),(e.which===3||e.button===2)&&(o.buttons.right.isDown=!1)}),document.addEventListener("contextmenu",e=>(e==null?void 0:e.cancelable)&&e.preventDefault())}static onMove(e){const t=l.ctx.canvas.getBoundingClientRect(),s={...o.position};o.position.clientX=e.clientX,o.position.clientY=e.clientY,o.position.x=Math.floor(((e.clientX-t.left)/(t.right-t.left)*l.ctx.canvas.width+v.creature.offset.x)/m),o.position.y=Math.floor(((e.clientY-t.top)/(t.bottom-t.top)*l.ctx.canvas.height+v.creature.offset.y)/m);const i=l.positionLocalToServer(o.position.x,o.position.y);o.position.serverX=i.x,o.position.serverY=i.y,(o.position.x!==s.x||o.position.y!==s.y)&&o.onPositionChange(s),(o.position.serverX!==s.serverX||o.position.serverY!==s.serverY)&&o.onPositionChange(s)}static onPositionChange(){if(o.grabbing.itemId)return;if(H.shift.isPressed){l.ctx.canvas.setAttribute("cursor","eye");return}const e=l.positionLocalToServer(o.position.x,o.position.y),t=l.getTileTopItem(e.x,e.y);if(!t){l.ctx.canvas.removeAttribute("cursor");return}t===6?l.ctx.canvas.setAttribute("cursor","chest"):t===8?l.ctx.canvas.setAttribute("cursor","pick"):l.ctx.canvas.removeAttribute("cursor")}static onLeftButtonClick(){if(H.shift.isPressed)return;const e=l.getTileTopItem(o.position.serverX,o.position.serverY);if(e&&S.get(l.getTileTopItem(o.position.serverX,o.position.serverY)).isMoveable){o.onGrabStart(e);return}}static onRightButtonClick(){const e=l.getTileTopItem(o.position.serverX,o.position.serverY);if(!o.buttons.right.isBlocked&&e&&l.isInHeroRange(o.position.serverX,o.position.serverY)){if(e===6){o.buttons.right.isBlocked=!0,V.get("yellow-sparkles").run(o.position.serverX,o.position.serverY),l.tiles[o.position.serverY][o.position.serverX].pop(),l.tiles[o.position.serverY][o.position.serverX].push(9),o.onPositionChange(),setTimeout(()=>{o.buttons.right.isBlocked=!1},600);return}if(e===8){o.buttons.right.isBlocked=!0,V.get("ore-hit").run(o.position.serverX,o.position.serverY),l.tiles[v.creature.position.y][v.creature.position.x].push(10),setTimeout(()=>{o.buttons.right.isBlocked=!1},600);return}}}static onGrabStart(e){o.grabbing.itemId=e,o.grabbing.from={x:o.position.serverX,y:o.position.serverY},l.ctx.canvas.setAttribute("cursor","crosshair")}static onGrabEnd(){o.handleThrow(),o.grabbing.itemId=null,o.grabbing.from={x:null,y:null},o.onPositionChange()}static handleThrow(){if(l.isInHeroRange(o.grabbing.from.x,o.grabbing.from.y)===!1||o.grabbing.from.x===o.position.serverX&&o.grabbing.from.y===o.position.serverY)return;const e=l.getTileTopItem(o.grabbing.from.x,o.grabbing.from.y);e===o.grabbing.itemId&&(l.getTileStack(o.position.serverX,o.position.serverY).find(t=>S.get(t).isBlockingCreatures)||(l.tiles[o.grabbing.from.y][o.grabbing.from.x].pop(),l.tiles[o.position.serverY][o.position.serverX].push(e)))}};p(o,"position",{x:null,y:null,clientX:null,clientY:null,serverX:null,serverY:null}),p(o,"buttons",{left:{isBlocked:!1,isDown:!1},right:{isBlocked:!1,isDown:!1}}),p(o,"grabbing",{itemId:null,from:{x:null,y:null}});let P=o;const M=class M{static init(){document.addEventListener("keydown",()=>setTimeout(M.triggerKeyHoldingFunctions)),window.keyboardLoop=setInterval(M.triggerKeyHoldingFunctions,200),je("shift",{onPressed:()=>{M.shift.isPressed=!0,P.onPositionChange()},onReleased:()=>{M.shift.isPressed=!1,P.onPositionChange()}})}};p(M,"shift",{isPressed:!1}),p(M,"triggerKeyHoldingFunctions",()=>{(F("ArrowUp")||F("w"))&&window.dispatchEvent(new CustomEvent("move-north")),(F("ArrowDown")||F("s"))&&window.dispatchEvent(new CustomEvent("move-south")),(F("ArrowLeft")||F("a"))&&window.dispatchEvent(new CustomEvent("move-west")),(F("ArrowRight")||F("d"))&&window.dispatchEvent(new CustomEvent("move-east"))});let H=M;class C{static renderTile(e,t,s,i,n,h){n==="ground"&&h.forEach(d=>{S.get(d).type==="ground"&&C.drawSprite(S.get(d).sprite.getFrame(),e,t)}),n==="objects"&&(H.shift.isPressed&&P.position.x===e&&P.position.y===t&&C.drawSprite(W.get("cursor").getFrame(),e,t),h.forEach(d=>{const g=S.get(d);g.type==="object"&&C.drawSprite(g.sprite.getFrame(),e,t)}),Object.values(l.creatures).forEach(d=>{s===d.position.x&&i===d.position.y&&C.drawCreature(d,e,t)}),l.getEffects(s,i).forEach(d=>{C.drawSprite(d.getFrame(),e,t)}))}static drawSprite(e,t,s){let i=s*m+(m-e.height),n=t*m+(Math.ceil(m/2)-Math.ceil(e.width/2));C.tempCtx.drawImage(e,n,i)}static drawCreature(e,t,s){let i=e.sprite.getFrame(),n=s*m+(m-i.height)+e.offset.y,h=t*m+(Math.ceil(m/2)-Math.ceil(i.width/2))+e.offset.x;C.tempCtx.drawImage(i,h,n)}static cropEdges(e){e.clearRect(0,0,m,e.canvas.height),e.clearRect(0,0,e.canvas.width,m),e.clearRect(e.canvas.width-m,0,e.canvas.width,e.canvas.height),e.clearRect(0,e.canvas.height-m,e.canvas.width,e.canvas.height)}static render(){const e=document.createElement("canvas");e.width=l.ctx.canvas.width,e.height=l.ctx.canvas.height,C.tempCtx=e.getContext("2d"),C.tempCtx.fillStyle="#25131a",C.tempCtx.fillRect(0,0,C.tempCtx.canvas.width,C.tempCtx.canvas.height);for(let t of["ground","objects"]){let s=0;for(let[i,n]of Object.entries(l.tiles)){let h=0;for(let[d,g]of Object.entries(n))C.renderTile(h,s,Number(d),Number(i),t,g),h++;s++}}C.renderInfoBox(C.tempCtx),l.ctx.clearRect(0,0,l.ctx.canvas.width,l.ctx.canvas.height),l.ctx.drawImage(e,-v.creature.offset.x,-v.creature.offset.y),C.cropEdges(l.ctx),window.requestAnimationFrame(C.render)}static renderInfoBox(e){if(H.shift.isPressed){const t=P.position.x*m+m/3*2,s=P.position.y*m+m/3*2;for(const[h,d]of Object.entries(l.creatures))if(P.position.serverX===d.position.x&&P.position.serverY===d.position.y){const g=h.length*5.5+8;e.fillStyle="#1c3d17",e.fillRect(t,s,g,16),e.strokeStyle="#FFA500",e.strokeRect(t,s,g,16),e.font="normal bold 9px monospace",e.strokeStyle="#000000",e.strokeText(h,t+4,s+11),e.strokeText(h,t+4,s+11),e.fillStyle="#FFA500",e.fillText(h,t+4,s+11);return}const i=l.getTileTopItem(P.position.serverX,P.position.serverY),n=S.get(i);if(n&&n.type==="object"){const h=n.name.length*5.5+8;e.fillStyle="#172459",e.fillRect(t,s,h,16),e.strokeStyle="#FFA500",e.strokeRect(t,s,h,16),e.font="normal bold 9px monospace",e.strokeStyle="#000000",e.strokeText(n.name,t+4,s+11),e.strokeText(n.name,t+4,s+11),e.fillStyle="#FFA500",e.fillText(n.name,t+4,s+11)}}}}const De=async()=>{async function r(){await W.load(we),await S.load(be),await V.load(Ce)}async function e(){H.init(),P.init(),v.init(),se.init(),l.init(),C.render()}await r(),await e()};De();
