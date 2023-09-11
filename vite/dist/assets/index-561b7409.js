var ve=Object.defineProperty;var ge=(r,e,t)=>e in r?ve(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var p=(r,e,t)=>(ge(r,typeof e!="symbol"?e+"":e,t),t),le=(r,e,t)=>{if(!e.has(r))throw TypeError("Cannot "+t)};var h=(r,e,t)=>(le(r,e,"read from private field"),t?t.call(r):e.get(r)),b=(r,e,t)=>{if(e.has(r))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(r):e.set(r,t)},y=(r,e,t,s)=>(le(r,e,"write to private field"),s?s.call(r,t):e.set(r,t),t);var ee=(r,e,t,s)=>({set _(i){y(r,e,i,t)},get _(){return h(r,e,s)}});(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const d of n.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&s(d)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();const m=32,he=33,ue=19,we="data/sprites.json",be="data/items.json",Ce="data/effects.json";class v{static rand(e){return Math.floor(Math.random()*(e+1))}static roll(e){return v.rand(e)===e}static randomString(e){return window.btoa(String.fromCharCode(...window.crypto.getRandomValues(new Uint8Array(e*2)))).replace(/[+/]/g,"").substring(0,e)}static randomColor(){return"#000000".replace(/0/g,function(){return(~~(Math.random()*16)).toString(16)})}static hexToRGB(e){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:null}static replaceColors(e,t){Object.keys(t).forEach(n=>{t[v.hexToRGB(n).toString()]=v.hexToRGB(t[n]),delete t[n]});const s=document.createElement("canvas").getContext("2d");s.canvas.width=e.width,s.canvas.height=e.height,s.drawImage(e,0,0);const i=s.getImageData(0,0,s.canvas.width,s.canvas.height);for(let n=0;n<i.data.length;n+=4){const d=[i.data[n],i.data[n+1],i.data[n+2]].toString();if(d in t){const f=t[d];i.data[n]=f[0],i.data[n+1]=f[1],i.data[n+2]=f[2],i.data[n+3]=255}}return s.putImageData(i,0,0),s.canvas}static async loadImage(e){return new Promise(t=>{const s=new Image;s.onload=()=>t(s),s.src=e})}static async dye(e,t,s){return new Promise(i=>{if(!t)return e;const n=["#ff0000","#ff00ff","#0000ff","#ffff00","#00ffff","#ff00ff"],d={};s.forEach((g,B)=>{d[n[B]]=g});const f=v.replaceColors(t,d),w=document.createElement("canvas").getContext("2d");w.canvas.width=e.width,w.canvas.height=e.height,w.drawImage(e,0,0),w.globalCompositeOperation="overlay",w.drawImage(f,0,0);const x=new Image;x.onload=()=>i(x),x.src=w.canvas.toDataURL("image/png")})}}var Z,se,F,z,H,A,E,K,N,q,O,T,U;const Y=class Y{constructor(e,t){b(this,se,null);b(this,F,null);b(this,z,null);b(this,H,null);b(this,A,null);b(this,E,null);b(this,K,null);b(this,N,null);b(this,q,null);b(this,O,null);b(this,T,null);b(this,U,null);e&&(h(Y,Z)[e]=this),y(this,se,e),y(this,F,t.image),y(this,z,t.image),y(this,H,t.mask||null),y(this,A,t.speed||null),y(this,E,t.states||{}),h(this,E).origin=[{x:0,y:0,w:h(this,F).width,h:h(this,F).height}],y(this,K,document.createElement("canvas")),y(this,N,h(this,K).getContext("2d")),y(this,O,this.getDefaultState()),y(this,T,1)}static async load(e){try{const s=await(await fetch(e)).json();await Promise.all(Object.entries(s).map(async([i,n])=>{const f={image:await v.loadImage(n.base),speed:n.speed||null,states:n.states||null};n.mask&&(f.mask=await v.loadImage(n.mask)),new Y(i,f)}))}catch(t){console.error("Error loading sprites:",t)}}static get(e){return h(Y,Z)[e]??null}clone(){return new Y(null,{image:h(this,z),mask:h(this,H),speed:h(this,A),states:h(this,E)})}async play(e=null){return new Promise(t=>{e=e||this.getDefaultState(),this.stop(),this.rewind(),y(this,O,e);const s=h(this,E)[e].length;s>1&&h(this,A)&&y(this,q,setInterval(()=>{++ee(this,T)._>s&&(this.stop(),t())},h(this,A)))})}stop(){clearInterval(h(this,q)),y(this,q,null)}rewind(){y(this,T,1)}loop(e=null){if(e=e||this.getDefaultState(),h(this,q)&&h(this,O)===e)return;this.stop(),this.rewind(),y(this,O,e);const t=h(this,E)[e].length;t>1&&h(this,A)&&y(this,q,setInterval(()=>{++ee(this,T)._>t&&y(this,T,1)},h(this,A)))}async dye(e){y(this,F,await v.dye(h(this,z),h(this,H),e)),y(this,U,null)}getDefaultState(){return Object.keys(h(this,E))[0]}getFrame(){const e=h(this,E)[h(this,O)][h(this,T)-1];return h(this,U)===e?h(this,K):(y(this,U,e),h(this,K).width=e.w,h(this,K).height=e.h,h(this,N).clearRect(0,0,h(this,K).width,h(this,K).height),h(this,N).drawImage(h(this,F),e.x,e.y,e.w,e.h,0,0,e.w,e.h),h(this,K))}};Z=new WeakMap,se=new WeakMap,F=new WeakMap,z=new WeakMap,H=new WeakMap,A=new WeakMap,E=new WeakMap,K=new WeakMap,N=new WeakMap,q=new WeakMap,O=new WeakMap,T=new WeakMap,U=new WeakMap,b(Y,Z,{});let D=Y;var $;const j=class j{constructor(e,t){p(this,"id",null);p(this,"name",null);p(this,"sprite",null);p(this,"type",null);p(this,"isBlockingCreatures",null);p(this,"isMoveable",null);h(j,$)[e]=this,this.id=t.id,this.name=t.name,this.sprite=D.get(t.sprite),this.sprite.loop(),this.type=t.type,this.isBlockingCreatures=t.isBlockingCreatures,this.isMoveable=t.isMoveable}static async load(e){try{const s=await(await fetch(e)).json();return new Promise(i=>{Object.values(s).forEach(n=>{new j(n.id,n)}),i()})}catch(t){console.error("Error loading items:",t)}}static get(e){return h(j,$)[e]??null}};$=new WeakMap,b(j,$,{});let P=j;class fe{constructor(e,t,s){p(this,"position",{x:null,y:null});p(this,"offset",{x:null,y:null});p(this,"sprite",null);p(this,"speed",2);l.creatures[e]=this,this.position=t,this.offset=s,this.sprite=D.get("outfit").clone(),this.sprite.dye([v.randomColor(),v.randomColor(),v.randomColor(),v.randomColor()]),this.sprite.loop("idle-south")}}const a=class a{static init(){a.creature=new fe("Nemnes",{x:100,y:100},{x:0,y:0}),G.get("energy").run(a.creature.position.x,a.creature.position.y),window.addEventListener("move-north",()=>a.walk("north")),window.addEventListener("move-south",()=>a.walk("south")),window.addEventListener("move-west",()=>a.walk("west")),window.addEventListener("move-east",()=>a.walk("east")),window.addEventListener("randomize-outfit",()=>{a.creature.sprite.dye([v.randomColor(),v.randomColor(),v.randomColor(),v.randomColor()])})}static setPosition(e,t){a.creature.position={x:e,y:t},a.movement.timeouts.forEach(s=>clearTimeout(s)),a.movement.timeouts=[],a.movement.queuedMove=null,a.movement.isMoving=!1,a.movement.currentFrame=0,window.dispatchEvent(new CustomEvent("hero-position-changed"))}static walk(e){if(a.movement.isMoving)return a.movement.currentFrame>m-m/3?(a.movement.queuedMove=e,!0):!1;const t=a.getTargetPosition(e);if(!l.isWalkable(t.x,t.y))return a.creature.sprite.loop("idle-"+e),!1;a.movement.isMoving=!0;for(let s=0;s<m;s++){const i=setTimeout(()=>a.handleWalkFrame(e,t),1e3/a.creature.speed/m*s);a.movement.timeouts.push(i)}return!0}static handleWalkFrame(e,t){a.creature.sprite.loop("walk-"+e),a.movement.currentFrame++,a.updateOffsetAfterAnimationFrameChange(e),a.movement.currentFrame===m/2&&(a.creature.position=t,window.dispatchEvent(new CustomEvent("hero-position-changed")),a.updateOffsetAfterPositionChange(e)),a.movement.currentFrame===m&&(a.movement.isMoving=!1,a.movement.currentFrame=0,a.movement.timeouts.forEach(s=>clearTimeout(s)),a.movement.timeouts=[],a.movement.queuedMove?(e=a.movement.queuedMove,a.movement.queuedMove=null,a.walk(e)||a.creature.sprite.loop("idle-"+e)):a.creature.sprite.loop("idle-"+e))}static getTargetPosition(e){const t={north:{x:0,y:-1},south:{x:0,y:1},west:{x:-1,y:0},east:{x:1,y:0}};return{x:a.creature.position.x+t[e].x,y:a.creature.position.y+t[e].y}}static updateOffsetAfterAnimationFrameChange(e){({north:()=>a.creature.offset.y--,south:()=>a.creature.offset.y++,west:()=>a.creature.offset.x--,east:()=>a.creature.offset.x++})[e]()}static updateOffsetAfterPositionChange(e){({north:()=>a.creature.offset.y=m/2,south:()=>a.creature.offset.y=-(m/2),west:()=>a.creature.offset.x=m/2,east:()=>a.creature.offset.x=-(m/2)})[e]()}};p(a,"creature",null),p(a,"movement",{queuedMove:null,isMoving:!1,currentFrame:0,timeouts:[]});let C=a;const c=class c{static init(){const e=document.createElement("canvas");e.id="board",e.width=m*he,e.height=m*ue,document.querySelector("#app").append(e),c.ctx=e.getContext("2d"),c.width=he,c.height=ue,c.update(),window.addEventListener("hero-position-changed",()=>{c.update()})}static update(){c.area.fromX=C.creature.position.x-Math.floor(c.width/2),c.area.toX=C.creature.position.x+Math.floor(c.width/2),c.area.fromY=C.creature.position.y-Math.floor(c.height/2),c.area.toY=C.creature.position.y+Math.floor(c.height/2);for(const[s,i]of Object.entries(c.creatures))c.isOnArea(i.position.x,i.position.y)||delete c.creatures[s];const e=[],t={};for(let s=c.area.fromY;s<=c.area.toY;s++)for(let i=c.area.fromX;i<=c.area.toX;i++)t[s]=t[s]||{},c.tiles[s]&&c.tiles[s][i]?t[s][i]=c.tiles[s][i]:(t[s][i]=[],e.push({x:i,y:s}));c.tiles=t,c.requestTiles(e)}static getTileStack(e,t){return typeof c.tiles[t]>"u"||typeof c.tiles[t][e]>"u"?[]:c.tiles[t][e]}static getTileTopItem(e,t){const s=c.getTileStack(e,t);return s[s.length-1]??null}static updateTile(e,t,s){typeof c.tiles[t]<"u"&&typeof c.tiles[t][e]<"u"&&(c.tiles[t][e]=s)}static requestTiles(e){setTimeout(()=>{for(const t of e){const s=t.x,i=t.y,n=[];v.roll(40)?n.push(2):v.roll(40)?n.push(3):v.roll(30)?n.push(4):n.push(1),s===C.creature.position.x&&i===C.creature.position.y||(v.roll(100)?n.push(6):v.roll(100)&&n.push(8)),c.updateTile(s,i,n),v.roll(350)&&new fe(v.randomString(20),{x:s,y:i},{x:0,y:0})}},100)}static isWalkable(e,t){const s=c.getTileStack(e,t);return!(!s.find(i=>P.get(i).type==="ground")||s.find(i=>P.get(i).isBlockingCreatures))}static isInHeroRange(e,t,s=1){const i=C.creature.position.x-s,n=C.creature.position.y-s,d=C.creature.position.x+s,f=C.creature.position.y+s;return e>=i&&e<=d&&t>=n&&t<=f}static isOnArea(e,t){return e>=c.area.fromX&&e<=c.area.toX&&t>=c.area.fromY&&t<=c.area.toY}static positionLocalToServer(e,t){return{x:c.area.fromX+e,y:c.area.fromY+t}}static getEffects(e,t){return c.effects&&c.effects[t]&&c.effects[t][e]?Object.values(this.effects[t][e]):[]}};p(c,"ctx",null),p(c,"width",null),p(c,"height",null),p(c,"tiles",{}),p(c,"effects",{}),p(c,"creatures",{}),p(c,"area",{fromX:null,fromY:null,toX:null,toY:null});let l=c;var J,ie,ne,_;const L=class L{constructor(e,t){b(this,ne,null);b(this,_,null);h(L,J)[e]=this,y(this,ne,e),y(this,_,t)}static async load(e){try{const s=await(await fetch(e)).json();return new Promise(i=>{Object.values(s).forEach(n=>{new L(n.id,D.get(n.sprite))}),i()})}catch(t){console.error("Error loading effects:",t)}}static get(e){return h(L,J)[e]??null}run(e,t){l.effects[t]||(l.effects[t]={}),l.effects[t][e]||(l.effects[t][e]={});const s=++ee(L,ie)._,i=h(this,_).clone();l.effects[t][e][s]=i,i.play().then(()=>{delete l.effects[t][e][s]})}};J=new WeakMap,ie=new WeakMap,ne=new WeakMap,_=new WeakMap,b(L,J,{}),b(L,ie,0);let G=L;var ke=Object.defineProperty,xe=(r,e,t)=>e in r?ke(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,u=(r,e,t)=>(xe(r,typeof e!="symbol"?e+"":e,t),t);class me{constructor(e){u(this,"_onPressed"),u(this,"_onPressedWithRepeat"),u(this,"_onReleased"),u(this,"_isPressed"),u(this,"_identity"),this._isPressed=!1,this._identity=e,typeof e=="function"?this._onPressedWithRepeat=e:(this._onPressed=e.onPressed,this._onPressedWithRepeat=e.onPressedWithRepeat,this._onReleased=e.onReleased)}get isEmpty(){return!this._onPressed&&!this._onPressedWithRepeat&&!this._onReleased}isOwnHandler(e){return this._identity===e}executePressed(e){var t,s;this._isPressed||(t=this._onPressed)==null||t.call(this,e),this._isPressed=!0,(s=this._onPressedWithRepeat)==null||s.call(this,e)}executeReleased(e){var t;this._isPressed&&((t=this._onReleased)==null||t.call(this,e)),this._isPressed=!1}}const oe=class I{constructor(e,t,s={}){u(this,"_normalizedKeyCombo"),u(this,"_parsedKeyCombo"),u(this,"_handlerState"),u(this,"_keyComboEventMapper"),u(this,"_movingToNextSequenceAt"),u(this,"_sequenceIndex"),u(this,"_unitIndex"),u(this,"_lastActiveKeyPresses"),u(this,"_lastActiveKeyCount"),u(this,"_isPressedWithFinalUnit"),this._normalizedKeyCombo=I.normalizeKeyCombo(e),this._parsedKeyCombo=I.parseKeyCombo(e),this._handlerState=new me(s),this._keyComboEventMapper=t,this._movingToNextSequenceAt=0,this._sequenceIndex=0,this._unitIndex=0,this._lastActiveKeyPresses=[],this._lastActiveKeyCount=0,this._isPressedWithFinalUnit=null}static parseKeyCombo(e){if(I._parseCache[e])return I._parseCache[e];const t=e.toLowerCase();let s="",i=[],n=[i],d=[n];const f=[d];let w=!1;for(let g=0;g<e.length;g+=1)if(t[g]==="\\")w=!0;else if((t[g]==="+"||t[g]===">"||t[g]===",")&&!w){if(s)throw new Error("cannot have two operators in a row");s=t[g]}else t[g].match(/[^\s]/)&&(s&&(s===","?(i=[],n=[i],d=[n],f.push(d)):s===">"?(i=[],n=[i],d.push(n)):s==="+"&&(i=[],n.push(i)),s=""),w=!1,i.push(t[g]));const x=f.map(g=>g.map(B=>B.map(X=>X.join(""))));return I._parseCache[e]=x,x}static stringifyKeyCombo(e){return e.map(t=>t.map(s=>s.map(i=>i==="+"?"\\+":i===">"?"\\>":i===","?"\\,":i).join("+")).join(">")).join(",")}static normalizeKeyCombo(e){if(I._normalizationCache[e])return I._normalizationCache[e];const t=this.stringifyKeyCombo(this.parseKeyCombo(e));return I._normalizationCache[e]=t,t}get isPressed(){return!!this._isPressedWithFinalUnit}get sequenceIndex(){return this.isPressed?this._parsedKeyCombo.length:this._sequenceIndex}isOwnHandler(e){return this._handlerState.isOwnHandler(e)}executePressed(e){var t;(t=this._isPressedWithFinalUnit)!=null&&t.has(e.key)&&this._handlerState.executePressed(this._wrapEvent(this._lastActiveKeyPresses,{key:e.key,event:e}))}executeReleased(e){var t;(t=this._isPressedWithFinalUnit)!=null&&t.has(e.key)&&(this._handlerState.executeReleased(this._wrapEvent(this._lastActiveKeyPresses,{key:e.key,event:e})),this._isPressedWithFinalUnit=null)}updateState(e,t){const s=e.length,i=s<this._lastActiveKeyCount;this._lastActiveKeyCount=s;const n=this._parsedKeyCombo[this._sequenceIndex],d=n.slice(0,this._unitIndex),f=n.slice(this._unitIndex),w=()=>{this._movingToNextSequenceAt=0,this._sequenceIndex=0,this._unitIndex=0,this._lastActiveKeyPresses.length=0,this._handlerState.isEmpty&&(this._isPressedWithFinalUnit=null)};let x=0;if(i){if(this._movingToNextSequenceAt===0)return w();if(this._movingToNextSequenceAt+t<Date.now()||s!==0)return;this._movingToNextSequenceAt=0,this._sequenceIndex+=1,this._unitIndex=0;return}for(const g of d){for(const B of g){let X=!1;for(let S=x;S<e.length&&S<x+g.length;S+=1)if(e[S].key===B){X=!0;break}if(!X)return w()}x+=g.length}if(this._movingToNextSequenceAt===0){for(const g of f){for(const B of g){let X=!1;for(let S=x;S<e.length&&S<x+g.length;S+=1)if(e[S].key===B){X=!0;break}if(!X)return}this._unitIndex+=1,x+=g.length}if(x<s-1)return w();if(this._lastActiveKeyPresses[this._sequenceIndex]=e.slice(0),this._sequenceIndex<this._parsedKeyCombo.length-1){this._movingToNextSequenceAt=Date.now();return}this._isPressedWithFinalUnit=new Set(n[n.length-1])}}_wrapEvent(e,t){return{...this._keyComboEventMapper(e,t),keyCombo:this._normalizedKeyCombo,keyEvents:e.flat().map(s=>s.event),finalKeyEvent:t.event}}};u(oe,"_parseCache",{}),u(oe,"_normalizationCache",{});let M=oe;const Ke={addEventListener:(...r)=>{},removeEventListener:(...r)=>{},dispatchEvent:(...r)=>{}},Ee={userAgent:""},V=()=>typeof document<"u"?document:Ke,Pe=()=>typeof navigator<"u"?navigator:Ee,Se=()=>Pe().userAgent.toLocaleLowerCase().includes("mac");let re=!1;const Ie=r=>{!Se()||r.key!=="Meta"||(re=!0)},Ae=r=>{!re||r.key!=="Meta"||(re=!1,pe())},te=new Map,Te=r=>{te.set(r.key,r)},Re=r=>{te.delete(r.key)},pe=()=>{for(const r of te.values()){const e=new KeyboardEvent("keyup",{key:r.key,code:r.code,bubbles:!0,cancelable:!0});V().dispatchEvent(e)}te.clear()},Le=r=>{try{const e=()=>r();return addEventListener("focus",e),()=>{removeEventListener("focus",e)}}catch{}},Me=r=>{try{const e=()=>{pe(),r()};return addEventListener("blur",e),()=>removeEventListener("blur",e)}catch{}},Fe=r=>{try{const e=t=>(Te(t),Ie(t),r({key:t.key,originalEvent:t,composedPath:()=>t.composedPath(),preventDefault:()=>t.preventDefault()}));return V().addEventListener("keydown",e),()=>V().removeEventListener("keydown",e)}catch{}},qe=r=>{try{const e=t=>(Re(t),Ae(t),r({key:t.key,originalEvent:t,composedPath:()=>t.composedPath(),preventDefault:()=>t.preventDefault()}));return V().addEventListener("keyup",e),()=>V().removeEventListener("keyup",e)}catch{}},Oe=1e3;class Be{constructor(e={}){u(this,"sequenceTimeout"),u(this,"_isActive"),u(this,"_unbinder"),u(this,"_onActiveBinder"),u(this,"_onInactiveBinder"),u(this,"_onKeyPressedBinder"),u(this,"_onKeyReleasedBinder"),u(this,"_keyComboEventMapper"),u(this,"_selfReleasingKeys"),u(this,"_keyRemap"),u(this,"_handlerStates"),u(this,"_keyComboStates"),u(this,"_keyComboStatesArray"),u(this,"_activeKeyPresses"),u(this,"_activeKeyMap"),u(this,"_watchedKeyComboStates"),this.sequenceTimeout=Oe,this._isActive=!0,this._onActiveBinder=()=>{},this._onInactiveBinder=()=>{},this._onKeyPressedBinder=()=>{},this._onKeyReleasedBinder=()=>{},this._keyComboEventMapper=()=>({}),this._selfReleasingKeys=[],this._keyRemap={},this._handlerStates={},this._keyComboStates={},this._keyComboStatesArray=[],this._activeKeyPresses=[],this._activeKeyMap=new Map,this._watchedKeyComboStates={},this.bindEnvironment(e)}get pressedKeys(){return this._activeKeyPresses.map(e=>e.key)}bindKey(e,t){var s;e=e.toLowerCase();const i=new me(t);(s=this._handlerStates)[e]??(s[e]=[]),this._handlerStates[e].push(i)}unbindKey(e,t){e=e.toLowerCase();const s=this._handlerStates[e];if(s)if(t)for(let i=0;i<s.length;i+=1)s[i].isOwnHandler(t)&&(s.splice(i,1),i-=1);else s.length=0}bindKeyCombo(e,t){var s;e=M.normalizeKeyCombo(e);const i=new M(e,this._keyComboEventMapper,t);(s=this._keyComboStates)[e]??(s[e]=[]),this._keyComboStates[e].push(i),this._keyComboStatesArray.push(i)}unbindKeyCombo(e,t){e=M.normalizeKeyCombo(e);const s=this._keyComboStates[e];if(s)if(t){for(let i=0;i<s.length;i+=1)if(s[i].isOwnHandler(t)){for(let n=0;n<this._keyComboStatesArray.length;n+=1)this._keyComboStatesArray[n]===s[i]&&(this._keyComboStatesArray.splice(n,1),n-=1);s.splice(i,1),i-=1}}else s.length=0}checkKey(e){return this._activeKeyMap.has(e.toLowerCase())}checkKeyCombo(e){return this._ensureCachedKeyComboState(e).isPressed}checkKeyComboSequenceIndex(e){return this._ensureCachedKeyComboState(e).sequenceIndex}bindEnvironment(e={}){this.unbindEnvironment(),this._onActiveBinder=e.onActive??Le,this._onInactiveBinder=e.onInactive??Me,this._onKeyPressedBinder=e.onKeyPressed??Fe,this._onKeyReleasedBinder=e.onKeyReleased??qe,this._keyComboEventMapper=e.mapKeyComboEvent??(()=>({})),this._selfReleasingKeys=e.selfReleasingKeys??[],this._keyRemap=e.keyRemap??{};const t=this._onActiveBinder(()=>{this._isActive=!0}),s=this._onInactiveBinder(()=>{this._isActive=!1}),i=this._onKeyPressedBinder(d=>{this._handleKeyPress(d)}),n=this._onKeyReleasedBinder(d=>{this._handleKeyRelease(d)});this._unbinder=()=>{t==null||t(),s==null||s(),i==null||i(),n==null||n()}}unbindEnvironment(){var e;(e=this._unbinder)==null||e.call(this)}_ensureCachedKeyComboState(e){e=M.normalizeKeyCombo(e),this._watchedKeyComboStates[e]||(this._watchedKeyComboStates[e]=new M(e,this._keyComboEventMapper));const t=this._watchedKeyComboStates[e];return t.updateState(this._activeKeyPresses,this.sequenceTimeout),t}_handleKeyPress(e){if(!this._isActive)return;e={...e,key:e.key.toLowerCase()};const t=this._keyRemap[e.key];t&&(e.key=t);const s=this._handlerStates[e.key];if(s)for(const n of s)n.executePressed(e);const i=this._activeKeyMap.get(e.key);if(i)i.event=e;else{const n={key:e.key,event:e};this._activeKeyMap.set(e.key,n),this._activeKeyPresses.push(n)}this._updateKeyComboStates();for(const n of this._keyComboStatesArray)n.executePressed(e)}_handleKeyRelease(e){e={...e,key:e.key.toLowerCase()};const t=this._keyRemap[e.key];t&&(e.key=t);const s=this._handlerStates[e.key];if(s)for(const i of s)i.executeReleased(e);if(this._activeKeyMap.has(e.key)){this._activeKeyMap.delete(e.key);for(let i=0;i<this._activeKeyPresses.length;i+=1)if(this._activeKeyPresses[i].key===e.key){this._activeKeyPresses.splice(i,1),i-=1;break}}this._tryReleaseSelfReleasingKeys(),this._updateKeyComboStates();for(const i of this._keyComboStatesArray)i.executeReleased(e)}_updateKeyComboStates(){for(const e of this._keyComboStatesArray)e.updateState(this._activeKeyPresses,this.sequenceTimeout)}_tryReleaseSelfReleasingKeys(){for(const e of this._activeKeyPresses)for(const t of this._selfReleasingKeys)e.key===t&&this._handleKeyRelease(e.event)}}let Xe,ae;const Ye=r=>{ae=r??new Be(Xe)},ye=()=>(ae||Ye(),ae),de=(...r)=>ye().bindKey(...r),R=(...r)=>ye().checkKey(...r);M.normalizeKeyCombo;M.stringifyKeyCombo;M.parseKeyCombo;const Q=class Q{static init(){document.addEventListener("keydown",()=>setTimeout(Q.triggerKeyHoldingFunctions)),window.keyboardLoop=setInterval(Q.triggerKeyHoldingFunctions,200),de(" ",()=>window.dispatchEvent(new CustomEvent("randomize-outfit"))),de("Spacebar",()=>window.dispatchEvent(new CustomEvent("randomize-outfit")))}};p(Q,"triggerKeyHoldingFunctions",()=>{(R("ArrowUp")||R("w"))&&window.dispatchEvent(new CustomEvent("move-north")),(R("ArrowDown")||R("s"))&&window.dispatchEvent(new CustomEvent("move-south")),(R("ArrowLeft")||R("a"))&&window.dispatchEvent(new CustomEvent("move-west")),(R("ArrowRight")||R("d"))&&window.dispatchEvent(new CustomEvent("move-east"))});let ce=Q;const o=class o{static init(){document.addEventListener("mousemove",o.onMove,!1),document.addEventListener("mousedown",e=>{(e.which===1||e.button===0)&&(o.buttons.left.isDown=!0,o.onLeftButtonClick()),(e.which===3||e.button===2)&&(o.buttons.right.isDown=!0)}),document.addEventListener("mouseup",e=>{(e.which===1||e.button===0)&&(o.buttons.left.isDown=!1,o.grabbing.itemId&&o.onGrabEnd()),(e.which===3||e.button===2)&&(o.buttons.right.isDown=!1)}),document.addEventListener("contextmenu",e=>(e==null?void 0:e.cancelable)&&e.preventDefault())}static onMove(e){const t=l.ctx.canvas.getBoundingClientRect(),s={...o.position};o.position.clientX=e.clientX,o.position.clientY=e.clientY,o.position.x=Math.floor(((e.clientX-t.left)/(t.right-t.left)*l.ctx.canvas.width+C.creature.offset.x)/m),o.position.y=Math.floor(((e.clientY-t.top)/(t.bottom-t.top)*l.ctx.canvas.height+C.creature.offset.y)/m);const i=l.positionLocalToServer(o.position.x,o.position.y);o.position.serverX=i.x,o.position.serverY=i.y,(o.position.x!==s.x||o.position.y!==s.y)&&o.onPositionChange(s),(o.position.serverX!==s.serverX||o.position.serverY!==s.serverY)&&o.onPositionChange(s)}static onPositionChange(){if(o.grabbing.itemId)return;const e=l.positionLocalToServer(o.position.x,o.position.y),t=l.getTileTopItem(e.x,e.y);if(!t){l.ctx.canvas.removeAttribute("cursor");return}t===6?l.ctx.canvas.setAttribute("cursor","chest"):t===8?l.ctx.canvas.setAttribute("cursor","pick"):l.ctx.canvas.removeAttribute("cursor")}static onLeftButtonClick(){const e=l.getTileTopItem(o.position.serverX,o.position.serverY);if(e&&P.get(l.getTileTopItem(o.position.serverX,o.position.serverY)).isMoveable){o.onGrabStart(e);return}if(!o.buttons.left.isBlocked&&e&&l.isInHeroRange(o.position.serverX,o.position.serverY)){if(e===6){o.buttons.left.isBlocked=!0,G.get("yellow-sparkles").run(o.position.serverX,o.position.serverY),l.tiles[o.position.serverY][o.position.serverX].pop(),l.tiles[o.position.serverY][o.position.serverX].push(9),o.onPositionChange(),setTimeout(()=>{o.buttons.left.isBlocked=!1},600);return}if(e===8){o.buttons.left.isBlocked=!0,G.get("ore-hit").run(o.position.serverX,o.position.serverY),l.tiles[C.creature.position.y][C.creature.position.x].push(10),setTimeout(()=>{o.buttons.left.isBlocked=!1},600);return}}}static onRightButtonClick(){}static onGrabStart(e){o.grabbing.itemId=e,o.grabbing.from={x:o.position.serverX,y:o.position.serverY},l.ctx.canvas.setAttribute("cursor","crosshair")}static onGrabEnd(){o.handleThrow(),o.grabbing.itemId=null,o.grabbing.from={x:null,y:null},o.onPositionChange()}static handleThrow(){if(l.isInHeroRange(o.grabbing.from.x,o.grabbing.from.y)===!1||o.grabbing.from.x===o.position.serverX&&o.grabbing.from.y===o.position.serverY)return;const e=l.getTileTopItem(o.grabbing.from.x,o.grabbing.from.y);e===o.grabbing.itemId&&(l.getTileStack(o.position.serverX,o.position.serverY).find(t=>P.get(t).isBlockingCreatures)||(l.tiles[o.grabbing.from.y][o.grabbing.from.x].pop(),l.tiles[o.position.serverY][o.position.serverX].push(e)))}};p(o,"position",{x:null,y:null,clientX:null,clientY:null,serverX:null,serverY:null}),p(o,"buttons",{left:{isBlocked:!1,isDown:!1},right:{isBlocked:!1,isDown:!1}}),p(o,"grabbing",{itemId:null,from:{x:null,y:null}});let W=o;class k{static renderTile(e,t,s,i,n,d){n==="ground"&&d.forEach(f=>{P.get(f).type==="ground"&&k.drawSprite(P.get(f).sprite.getFrame(),e,t)}),n==="objects"&&(W.buttons.right.isDown&&W.position.x===e&&W.position.y===t&&k.drawSprite(D.get("cursor").getFrame(),e,t),d.forEach(f=>{const w=P.get(f);w.type==="object"&&k.drawSprite(w.sprite.getFrame(),e,t)}),Object.values(l.creatures).forEach(f=>{s===f.position.x&&i===f.position.y&&k.drawCreature(f,e,t)}),l.getEffects(s,i).forEach(f=>{k.drawSprite(f.getFrame(),e,t)}))}static drawSprite(e,t,s){let i=s*m+(m-e.height),n=t*m+(Math.ceil(m/2)-Math.ceil(e.width/2));k.tempCtx.drawImage(e,n,i)}static drawCreature(e,t,s){let i=e.sprite.getFrame(),n=s*m+(m-i.height)+e.offset.y,d=t*m+(Math.ceil(m/2)-Math.ceil(i.width/2))+e.offset.x;k.tempCtx.drawImage(i,d,n)}static cropEdges(e){e.clearRect(0,0,m,e.canvas.height),e.clearRect(0,0,e.canvas.width,m),e.clearRect(e.canvas.width-m,0,e.canvas.width,e.canvas.height),e.clearRect(0,e.canvas.height-m,e.canvas.width,e.canvas.height)}static render(){const e=document.createElement("canvas");e.width=l.ctx.canvas.width,e.height=l.ctx.canvas.height,k.tempCtx=e.getContext("2d"),k.tempCtx.fillStyle="#25131a",k.tempCtx.fillRect(0,0,k.tempCtx.canvas.width,k.tempCtx.canvas.height);for(let t of["ground","objects"]){let s=0;for(let[i,n]of Object.entries(l.tiles)){let d=0;for(let[f,w]of Object.entries(n))k.renderTile(d,s,Number(f),Number(i),t,w),d++;s++}}l.ctx.clearRect(0,0,l.ctx.canvas.width,l.ctx.canvas.height),l.ctx.drawImage(e,-C.creature.offset.x,-C.creature.offset.y),k.cropEdges(l.ctx),window.requestAnimationFrame(k.render)}}const De=async()=>{async function r(){await D.load(we),await P.load(be),await G.load(Ce)}async function e(){ce.init(),W.init(),C.init(),l.init(),k.render()}await r(),await e()};De();
