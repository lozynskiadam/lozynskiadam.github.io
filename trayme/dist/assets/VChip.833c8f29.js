import{p as J,L as O,B as Q,ao as Se,C as Y,ap as ue,g as Z,aq as be,al as Ce,ar as re,as as G,D as k,at as ee,au as Ve,I as le,w as xe,b as de,e as i,av as te,O as _,i as Ie,aw as Pe,Y as ve,Z as fe,a1 as pe,J as ze,ak as L,d as he,ax as ae,P as Ae,M as we,R as Re,ay as _e,W as Ee,X as Te,ai as Fe,a0 as Be,az as Ge,a2 as Oe,a3 as De,a4 as Me,a6 as We,aa as Le,aA as He,u as $e,aB as qe,ab as Ke,ac as ne,ad as Ne,ag as Ue,aC as Xe,h as H,aD as je,F as se,N as ie}from"./index.d0e08cdc.js";function Je(e){let{selectedElement:n,containerElement:a,isRtl:u,isHorizontal:o}=e;const y=D(o,a),c=ye(o,u,a),g=D(o,n),v=ge(o,n),m=g*.4;return c>v?v-m:c+y<v+g?v-y+g+m:c}function Qe(e){let{selectedElement:n,containerElement:a,isHorizontal:u}=e;const o=D(u,a),y=ge(u,n),c=D(u,n);return y-o/2+c/2}function oe(e,n){const a=e?"scrollWidth":"scrollHeight";return(n==null?void 0:n[a])||0}function Ye(e,n){const a=e?"clientWidth":"clientHeight";return(n==null?void 0:n[a])||0}function ye(e,n,a){if(!a)return 0;const{scrollLeft:u,offsetWidth:o,scrollWidth:y}=a;return e?n?y-o+u:u:a.scrollTop}function D(e,n){const a=e?"offsetWidth":"offsetHeight";return(n==null?void 0:n[a])||0}function ge(e,n){const a=e?"offsetLeft":"offsetTop";return(n==null?void 0:n[a])||0}const Ze=Symbol.for("vuetify:v-slide-group"),ke=J({centerActive:Boolean,direction:{type:String,default:"horizontal"},symbol:{type:null,default:Ze},nextIcon:{type:O,default:"$next"},prevIcon:{type:O,default:"$prev"},showArrows:{type:[Boolean,String],validator:e=>typeof e=="boolean"||["always","desktop","mobile"].includes(e)},...Q(),...Se({mobile:null}),...Y(),...ue({selectedClass:"v-slide-group-item--active"})},"VSlideGroup"),ce=Z()({name:"VSlideGroup",props:ke(),emits:{"update:modelValue":e=>!0},setup(e,n){let{slots:a}=n;const{isRtl:u}=be(),{displayClasses:o,mobile:y}=Ce(e),c=re(e,e.symbol),g=G(!1),v=G(0),m=G(0),x=G(0),d=k(()=>e.direction==="horizontal"),{resizeRef:f,contentRect:E}=ee(),{resizeRef:p,contentRect:z}=ee(),s=Ve(),S=k(()=>({container:f.el,duration:200,easing:"easeOutQuart"})),$=k(()=>c.selected.value.length?c.items.value.findIndex(l=>l.id===c.selected.value[0]):-1),C=k(()=>c.selected.value.length?c.items.value.findIndex(l=>l.id===c.selected.value[c.selected.value.length-1]):-1);if(le){let l=-1;xe(()=>[c.selected.value,E.value,z.value,d.value],()=>{cancelAnimationFrame(l),l=requestAnimationFrame(()=>{if(E.value&&z.value){const t=d.value?"width":"height";m.value=E.value[t],x.value=z.value[t],g.value=m.value+1<x.value}if($.value>=0&&p.el){const t=p.el.children[C.value];T(t,e.centerActive)}})})}const A=G(!1);function T(l,t){let r=0;t?r=Qe({containerElement:f.el,isHorizontal:d.value,selectedElement:l}):r=Je({containerElement:f.el,isHorizontal:d.value,isRtl:u.value,selectedElement:l}),M(r)}function M(l){if(!le||!f.el)return;const t=D(d.value,f.el),r=ye(d.value,u.value,f.el);if(!(oe(d.value,f.el)<=t||Math.abs(l-r)<16)){if(d.value&&u.value&&f.el){const{scrollWidth:P,offsetWidth:j}=f.el;l=P-j-l}d.value?s.horizontal(l,S.value):s(l,S.value)}}function h(l){const{scrollTop:t,scrollLeft:r}=l.target;v.value=d.value?r:t}function I(l){if(A.value=!0,!(!g.value||!p.el)){for(const t of l.composedPath())for(const r of p.el.children)if(r===t){T(r);return}}}function q(l){A.value=!1}let F=!1;function W(l){var t;!F&&!A.value&&!(l.relatedTarget&&((t=p.el)==null?void 0:t.contains(l.relatedTarget)))&&V(),F=!1}function B(){F=!0}function K(l){if(!p.el)return;function t(r){l.preventDefault(),V(r)}d.value?l.key==="ArrowRight"?t(u.value?"prev":"next"):l.key==="ArrowLeft"&&t(u.value?"next":"prev"):l.key==="ArrowDown"?t("next"):l.key==="ArrowUp"&&t("prev"),l.key==="Home"?t("first"):l.key==="End"&&t("last")}function V(l){var r,b;if(!p.el)return;let t;if(!l)t=Ie(p.el)[0];else if(l==="next"){if(t=(r=p.el.querySelector(":focus"))==null?void 0:r.nextElementSibling,!t)return V("first")}else if(l==="prev"){if(t=(b=p.el.querySelector(":focus"))==null?void 0:b.previousElementSibling,!t)return V("last")}else l==="first"?t=p.el.firstElementChild:l==="last"&&(t=p.el.lastElementChild);t&&t.focus({preventScroll:!0})}function w(l){const t=d.value&&u.value?-1:1,r=(l==="prev"?-t:t)*m.value;let b=v.value+r;if(d.value&&u.value&&f.el){const{scrollWidth:P,offsetWidth:j}=f.el;b+=P-j}M(b)}const R=k(()=>({next:c.next,prev:c.prev,select:c.select,isSelected:c.isSelected})),N=k(()=>{switch(e.showArrows){case"always":return!0;case"desktop":return!y.value;case!0:return g.value||Math.abs(v.value)>0;case"mobile":return y.value||g.value||Math.abs(v.value)>0;default:return!y.value&&(g.value||Math.abs(v.value)>0)}}),U=k(()=>Math.abs(v.value)>1),X=k(()=>{if(!f.value)return!1;const l=oe(d.value,f.el),t=Ye(d.value,f.el);return l-t-Math.abs(v.value)>1});return de(()=>i(e.tag,{class:["v-slide-group",{"v-slide-group--vertical":!d.value,"v-slide-group--has-affixes":N.value,"v-slide-group--is-overflowing":g.value},o.value,e.class],style:e.style,tabindex:A.value||c.selected.value.length?-1:0,onFocus:W},{default:()=>{var l,t,r,b,P;return[N.value&&i("div",{key:"prev",class:["v-slide-group__prev",{"v-slide-group__prev--disabled":!U.value}],onMousedown:B,onClick:()=>U.value&&w("prev")},[(t=(l=a.prev)==null?void 0:l.call(a,R.value))!=null?t:i(te,null,{default:()=>[i(_,{icon:u.value?e.nextIcon:e.prevIcon},null)]})]),i("div",{key:"container",ref:f,class:"v-slide-group__container",onScroll:h},[i("div",{ref:p,class:"v-slide-group__content",onFocusin:I,onFocusout:q,onKeydown:K},[(r=a.default)==null?void 0:r.call(a,R.value)])]),N.value&&i("div",{key:"next",class:["v-slide-group__next",{"v-slide-group__next--disabled":!X.value}],onMousedown:B,onClick:()=>X.value&&w("next")},[(P=(b=a.next)==null?void 0:b.call(a,R.value))!=null?P:i(te,null,{default:()=>[i(_,{icon:u.value?e.prevIcon:e.nextIcon},null)]})])]}})),{selected:c.selected,scrollTo:w,scrollOffset:v,focus:V,hasPrev:U,hasNext:X}}}),me=Symbol.for("vuetify:v-chip-group"),el=J({column:Boolean,filter:Boolean,valueComparator:{type:Function,default:Pe},...ke(),...Q(),...ue({selectedClass:"v-chip--selected"}),...Y(),...ve(),...fe({variant:"tonal"})},"VChipGroup");Z()({name:"VChipGroup",props:el(),emits:{"update:modelValue":e=>!0},setup(e,n){let{slots:a}=n;const{themeClasses:u}=pe(e),{isSelected:o,select:y,next:c,prev:g,selected:v}=re(e,me);return ze({VChip:{color:L(e,"color"),disabled:L(e,"disabled"),filter:L(e,"filter"),variant:L(e,"variant")}}),de(()=>{const m=ce.filterProps(e);return i(ce,he(m,{class:["v-chip-group",{"v-chip-group--column":e.column},u.value,e.class],style:e.style}),{default:()=>{var x;return[(x=a.default)==null?void 0:x.call(a,{isSelected:o,select:y,next:c,prev:g,selected:v.value})]}})}),{}}});const ll=J({activeClass:String,appendAvatar:String,appendIcon:O,closable:Boolean,closeIcon:{type:O,default:"$delete"},closeLabel:{type:String,default:"$vuetify.close"},draggable:Boolean,filter:Boolean,filterIcon:{type:String,default:"$complete"},label:Boolean,link:{type:Boolean,default:void 0},pill:Boolean,prependAvatar:String,prependIcon:O,ripple:{type:[Boolean,Object],default:!0},text:String,modelValue:{type:Boolean,default:!0},onClick:ae(),onClickOnce:ae(),...Ae(),...Q(),...we(),...Re(),..._e(),...Ee(),...Te(),...Fe(),...Y({tag:"span"}),...ve(),...fe({variant:"tonal"})},"VChip"),al=Z()({name:"VChip",directives:{Ripple:Be},props:ll(),emits:{"click:close":e=>!0,"update:modelValue":e=>!0,"group:selected":e=>!0,click:e=>!0},setup(e,n){let{attrs:a,emit:u,slots:o}=n;const{t:y}=Ge(),{borderClasses:c}=Oe(e),{colorClasses:g,colorStyles:v,variantClasses:m}=De(e),{densityClasses:x}=Me(e),{elevationClasses:d}=We(e),{roundedClasses:f}=Le(e),{sizeClasses:E}=He(e),{themeClasses:p}=pe(e),z=$e(e,"modelValue"),s=qe(e,me,!1),S=Ke(e,a),$=k(()=>e.link!==!1&&S.isLink.value),C=k(()=>!e.disabled&&e.link!==!1&&(!!s||e.link||S.isClickable.value)),A=k(()=>({"aria-label":y(e.closeLabel),onClick(h){h.preventDefault(),h.stopPropagation(),z.value=!1,u("click:close",h)}}));function T(h){var I;u("click",h),C.value&&((I=S.navigate)==null||I.call(S,h),s==null||s.toggle())}function M(h){(h.key==="Enter"||h.key===" ")&&(h.preventDefault(),T(h))}return()=>{const h=S.isLink.value?"a":e.tag,I=!!(e.appendIcon||e.appendAvatar),q=!!(I||o.append),F=!!(o.close||e.closable),W=!!(o.filter||e.filter)&&s,B=!!(e.prependIcon||e.prependAvatar),K=!!(B||o.prepend),V=!s||s.isSelected.value;return z.value&&ne(i(h,{class:["v-chip",{"v-chip--disabled":e.disabled,"v-chip--label":e.label,"v-chip--link":C.value,"v-chip--filter":W,"v-chip--pill":e.pill},p.value,c.value,V?g.value:void 0,x.value,d.value,f.value,E.value,m.value,s==null?void 0:s.selectedClass.value,e.class],style:[V?v.value:void 0,e.style],disabled:e.disabled||void 0,draggable:e.draggable,href:S.href.value,tabindex:C.value?0:void 0,onClick:T,onKeydown:C.value&&!$.value&&M},{default:()=>{var w,R;return[Ue(C.value,"v-chip"),W&&i(Xe,{key:"filter"},{default:()=>[ne(i("div",{class:"v-chip__filter"},[o.filter?i(H,{key:"filter-defaults",disabled:!e.filterIcon,defaults:{VIcon:{icon:e.filterIcon}}},o.filter):i(_,{key:"filter-icon",icon:e.filterIcon},null)]),[[je,s.isSelected.value]])]}),K&&i("div",{key:"prepend",class:"v-chip__prepend"},[o.prepend?i(H,{key:"prepend-defaults",disabled:!B,defaults:{VAvatar:{image:e.prependAvatar,start:!0},VIcon:{icon:e.prependIcon,start:!0}}},o.prepend):i(se,null,[e.prependIcon&&i(_,{key:"prepend-icon",icon:e.prependIcon,start:!0},null),e.prependAvatar&&i(ie,{key:"prepend-avatar",image:e.prependAvatar,start:!0},null)])]),i("div",{class:"v-chip__content","data-no-activator":""},[(R=(w=o.default)==null?void 0:w.call(o,{isSelected:s==null?void 0:s.isSelected.value,selectedClass:s==null?void 0:s.selectedClass.value,select:s==null?void 0:s.select,toggle:s==null?void 0:s.toggle,value:s==null?void 0:s.value.value,disabled:e.disabled}))!=null?R:e.text]),q&&i("div",{key:"append",class:"v-chip__append"},[o.append?i(H,{key:"append-defaults",disabled:!I,defaults:{VAvatar:{end:!0,image:e.appendAvatar},VIcon:{end:!0,icon:e.appendIcon}}},o.append):i(se,null,[e.appendIcon&&i(_,{key:"append-icon",end:!0,icon:e.appendIcon},null),e.appendAvatar&&i(ie,{key:"append-avatar",end:!0,image:e.appendAvatar},null)])]),F&&i("button",he({key:"close",class:"v-chip__close",type:"button"},A.value),[o.close?i(H,{key:"close-defaults",defaults:{VIcon:{icon:e.closeIcon,size:"x-small"}}},o.close):i(_,{key:"close-icon",icon:e.closeIcon,size:"x-small"},null)])]}}),[[Ne("ripple"),C.value&&e.ripple,null]])}}});export{al as V};
