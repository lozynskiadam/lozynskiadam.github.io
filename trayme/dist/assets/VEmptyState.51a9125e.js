import{p as z,P as E,G as I,T as D,ak as B,a1 as F,g as W,a4 as j,al as A,am as N,a8 as R,an as $,b as G,e as a,F as H,ah as M,C as U,h as v,ao as q,v as w}from"./index.a2d32b78.js";const J=z({actionText:String,bgColor:String,color:String,icon:E,image:String,justify:{type:String,default:"center"},headline:String,title:String,text:String,textWidth:{type:[Number,String],default:500},href:String,to:String,...I(),...D(),...B({size:void 0}),...F()},"VEmptyState"),L=W()({name:"VEmptyState",props:J(),emits:{"click:action":e=>!0},setup(e,h){let{emit:k,slots:t}=h;const{themeClasses:f}=j(e),{backgroundColorClasses:S,backgroundColorStyles:x}=A(N(e,"bgColor")),{dimensionStyles:V}=R(e),{displayClasses:C}=$();function s(n){k("click:action",n)}return G(()=>{var c,l,o,m,d,u,y;const n=!!(t.actions||e.actionText),_=!!(t.headline||e.headline),T=!!(t.title||e.title),b=!!(t.text||e.text),P=!!(t.media||e.image||e.icon),i=e.size||(e.image?200:96);return a("div",{class:["v-empty-state",{[`v-empty-state--${e.justify}`]:!0},f.value,S.value,C.value,e.class],style:[x.value,V.value,e.style]},[P&&a("div",{key:"media",class:"v-empty-state__media"},[t.media?a(v,{key:"media-defaults",defaults:{VImg:{src:e.image,height:i},VIcon:{size:i,icon:e.icon}}},{default:()=>[t.media()]}):a(H,null,[e.image?a(M,{key:"image",src:e.image,height:i},null):e.icon?a(U,{key:"icon",color:e.color,size:i,icon:e.icon},null):void 0])]),_&&a("div",{key:"headline",class:"v-empty-state__headline"},[(l=(c=t.headline)==null?void 0:c.call(t))!=null?l:e.headline]),T&&a("div",{key:"title",class:"v-empty-state__title"},[(m=(o=t.title)==null?void 0:o.call(t))!=null?m:e.title]),b&&a("div",{key:"text",class:"v-empty-state__text",style:{maxWidth:q(e.textWidth)}},[(u=(d=t.text)==null?void 0:d.call(t))!=null?u:e.text]),t.default&&a("div",{key:"content",class:"v-empty-state__content"},[t.default()]),n&&a("div",{key:"actions",class:"v-empty-state__actions"},[a(v,{defaults:{VBtn:{class:"v-empty-state__action-btn",color:(y=e.color)!=null?y:"surface-variant",text:e.actionText}}},{default:()=>{var r,g;return[(g=(r=t.actions)==null?void 0:r.call(t,{props:{onClick:s}}))!=null?g:a(w,{onClick:s},null)]}})])])}),{}}});export{L as V};