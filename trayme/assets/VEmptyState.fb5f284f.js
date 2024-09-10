import{p as P,I as z,m as E,b as D,d as j,e as B,g as F,f as W,u as A,t as N,h as R,i as $,j as q,k as a,F as H,V as M,l as U,n as v,q as w,r as G}from"./index.8bfaa31f.js";const J=P({actionText:String,bgColor:String,color:String,icon:z,image:String,justify:{type:String,default:"center"},headline:String,title:String,text:String,textWidth:{type:[Number,String],default:500},href:String,to:String,...E(),...D(),...j({size:void 0}),...B()},"VEmptyState"),L=F()({name:"VEmptyState",props:J(),emits:{"click:action":e=>!0},setup(e,h){let{emit:k,slots:t}=h;const{themeClasses:f}=W(e),{backgroundColorClasses:S,backgroundColorStyles:x}=A(N(e,"bgColor")),{dimensionStyles:V}=R(e),{displayClasses:_}=$();function s(n){k("click:action",n)}return q(()=>{var c,l,o,m,d,u,y;const n=!!(t.actions||e.actionText),C=!!(t.headline||e.headline),T=!!(t.title||e.title),b=!!(t.text||e.text),I=!!(t.media||e.image||e.icon),i=e.size||(e.image?200:96);return a("div",{class:["v-empty-state",{[`v-empty-state--${e.justify}`]:!0},f.value,S.value,_.value,e.class],style:[x.value,V.value,e.style]},[I&&a("div",{key:"media",class:"v-empty-state__media"},[t.media?a(v,{key:"media-defaults",defaults:{VImg:{src:e.image,height:i},VIcon:{size:i,icon:e.icon}}},{default:()=>[t.media()]}):a(H,null,[e.image?a(M,{key:"image",src:e.image,height:i},null):e.icon?a(U,{key:"icon",color:e.color,size:i,icon:e.icon},null):void 0])]),C&&a("div",{key:"headline",class:"v-empty-state__headline"},[(l=(c=t.headline)==null?void 0:c.call(t))!=null?l:e.headline]),T&&a("div",{key:"title",class:"v-empty-state__title"},[(m=(o=t.title)==null?void 0:o.call(t))!=null?m:e.title]),b&&a("div",{key:"text",class:"v-empty-state__text",style:{maxWidth:w(e.textWidth)}},[(u=(d=t.text)==null?void 0:d.call(t))!=null?u:e.text]),t.default&&a("div",{key:"content",class:"v-empty-state__content"},[t.default()]),n&&a("div",{key:"actions",class:"v-empty-state__actions"},[a(v,{defaults:{VBtn:{class:"v-empty-state__action-btn",color:(y=e.color)!=null?y:"surface-variant",text:e.actionText}}},{default:()=>{var r,g;return[(g=(r=t.actions)==null?void 0:r.call(t,{props:{onClick:s}}))!=null?g:a(G,{onClick:s},null)]}})])])}),{}}});export{L as V};
