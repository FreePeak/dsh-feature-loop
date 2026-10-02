window.__ModuleLoader__.load({
  id: '@freepeak/dsh-feature-loop',
  factory(require) {
"use strict";var __flPlugin=(()=>{var np=Object.create;var Rr=Object.defineProperty;var ap=Object.getOwnPropertyDescriptor;var lp=Object.getOwnPropertyNames;var cp=Object.getPrototypeOf,dp=Object.prototype.hasOwnProperty;var ua=t=>{throw TypeError(t)};var up=(t,e,r)=>e in t?Rr(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r;var $=(t=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(t,{get:(e,r)=>(typeof require<"u"?require:e)[r]}):t)(function(t){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+t+'" is not supported')});var pp=(t,e)=>()=>{try{return e||t((e={exports:{}}).exports,e),e.exports}catch(r){throw e=0,r}},us=(t,e)=>{for(var r in e)Rr(t,r,{get:e[r],enumerable:!0})},To=(t,e,r,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of lp(e))!dp.call(t,i)&&i!==r&&Rr(t,i,{get:()=>e[i],enumerable:!(o=ap(e,i))||o.enumerable});return t},L=(t,e,r)=>(To(t,e,"default"),r&&To(r,e,"default")),Fe=(t,e,r)=>(r=t!=null?np(cp(t)):{},To(e||!t||!t.__esModule?Rr(r,"default",{value:t,enumerable:!0}):r,t)),mp=t=>To(Rr({},"__esModule",{value:!0}),t);var f=(t,e,r)=>up(t,typeof e!="symbol"?e+"":e,r),pa=(t,e,r)=>e.has(t)||ua("Cannot "+r);var lt=(t,e,r)=>(pa(t,e,"read from private field"),r?r.call(t):e.get(t)),$t=(t,e,r)=>e.has(t)?ua("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,r),Lt=(t,e,r,o)=>(pa(t,e,"write to private field"),o?o.call(t,r):e.set(t,r),r);var nn=pp((Ak,vr)=>{"use strict";var Ah=typeof Buffer<"u",Yl=/"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/,Xl=/"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;function Zl(t,e,r){r==null&&e!==null&&typeof e=="object"&&(r=e,e=void 0),Ah&&Buffer.isBuffer(t)&&(t=t.toString()),t&&t.charCodeAt(0)===65279&&(t=t.slice(1));let o=JSON.parse(t,e);if(o===null||typeof o!="object")return o;let i=r&&r.protoAction||"error",s=r&&r.constructorAction||"error";if(i==="ignore"&&s==="ignore")return o;if(i!=="ignore"&&s!=="ignore"){if(Yl.test(t)===!1&&Xl.test(t)===!1)return o}else if(i!=="ignore"&&s==="ignore"){if(Yl.test(t)===!1)return o}else if(Xl.test(t)===!1)return o;return ec(o,{protoAction:i,constructorAction:s,safe:r&&r.safe})}function ec(t,{protoAction:e="error",constructorAction:r="error",safe:o}={}){let i=[t];for(;i.length;){let s=i;i=[];for(let n of s){if(e!=="ignore"&&Object.prototype.hasOwnProperty.call(n,"__proto__")){if(o===!0)return null;if(e==="error")throw new SyntaxError("Object contains forbidden prototype property");delete n.__proto__}if(r!=="ignore"&&Object.prototype.hasOwnProperty.call(n,"constructor")&&n.constructor!==null&&typeof n.constructor=="object"&&Object.prototype.hasOwnProperty.call(n.constructor,"prototype")){if(o===!0)return null;if(r==="error")throw new SyntaxError("Object contains forbidden prototype property");delete n.constructor}for(let a in n){let l=n[a];l&&typeof l=="object"&&i.push(l)}}}return t}function sn(t,e,r){let{stackTraceLimit:o}=Error;Error.stackTraceLimit=0;try{return Zl(t,e,r)}finally{Error.stackTraceLimit=o}}function Mh(t,e){let{stackTraceLimit:r}=Error;Error.stackTraceLimit=0;try{return Zl(t,e,{safe:!0})}catch{return}finally{Error.stackTraceLimit=r}}vr.exports=sn;vr.exports.default=sn;vr.exports.parse=sn;vr.exports.safeParse=Mh;vr.exports.scan=ec});var Mb={};us(Mb,{default:()=>Ab});var ae=$("react");function Te(t){return t==null}function Io(t){return t&&typeof t=="object"&&!Array.isArray(t)}function ha(t,e){return Object.fromEntries(Object.entries(t).filter(([r,o])=>e(r,o)))}function ct(t,e){return Object.fromEntries(Object.entries(t).map(([r,o])=>[r,e(o,r)]))}function fa(t,e,r){if(!e)return{...t};let o={};for(let i of e)(r||t[i]!==void 0)&&(o[i]=t[i]);return o}var ga=Symbol.for("cosmokit.volatile.write");function ps(t,e=new Set){if(typeof t=="function")throw new TypeError("volatile config cannot contain functions");if(t===null||typeof t!="object")return t;if(e.has(t))throw new TypeError("volatile config cannot contain cycles");e.add(t);try{if(Array.isArray(t))return Object.freeze(t.map(r=>ps(r,e)));if(Object.getPrototypeOf(t)!==Object.prototype&&Object.getPrototypeOf(t)!==null)throw new TypeError("volatile config objects must be plain objects or arrays");return Object.freeze(Object.fromEntries(Object.entries(t).map(([r,o])=>[r,ps(o,e)])))}finally{e.delete(t)}}function ms(t){let e=ps(t);return Object.freeze({get:()=>e,[ga]:r=>{e=r}})}function or(t){return typeof t=="object"&&t!==null&&ga in t}function _t(t,e){return arguments.length===1?r=>_t(t,r):t in globalThis&&e instanceof globalThis[t]||Object.prototype.toString.call(e).slice(8,-1)===t}function Co(t){return _t("ArrayBuffer",t)||_t("SharedArrayBuffer",t)}function hp(t){return Co(t)||ArrayBuffer.isView(t)}var Je;(function(t){t.is=Co,t.isSource=hp;function e(n){return ArrayBuffer.isView(n)?n.buffer.slice(n.byteOffset,n.byteOffset+n.byteLength):n}t.fromSource=e;function r(n){if(n=e(n),typeof Buffer<"u")return Buffer.from(n).toString("base64");let a="",l=new Uint8Array(n);for(let c=0;c<l.byteLength;c++)a+=String.fromCharCode(l[c]);return btoa(a)}t.toBase64=r;function o(n){return typeof Buffer<"u"?e(Buffer.from(n,"base64")):Uint8Array.from(atob(n),a=>a.charCodeAt(0))}t.fromBase64=o;function i(n){return n=e(n),typeof Buffer<"u"?Buffer.from(n).toString("hex"):Array.from(new Uint8Array(n),a=>a.toString(16).padStart(2,"0")).join("")}t.toHex=i;function s(n){if(typeof Buffer<"u")return e(Buffer.from(n,"hex"));let a=n.length%2===0?n:n.slice(0,n.length-1),l=[];for(let c=0;c<a.length;c+=2)l.push(parseInt(`${a[c]}${a[c+1]}`,16));return Uint8Array.from(l).buffer}t.fromHex=s})(Je||(Je={}));var Db=Je.fromBase64,Ob=Je.toBase64,Nb=Je.fromHex,Bb=Je.toHex;function ko(t,e=new Map){if(!t||typeof t!="object")return t;if(_t("Date",t))return new Date(t.valueOf());if(_t("RegExp",t))return new RegExp(t.source,t.flags);if(Co(t))return t.slice(0);if(ArrayBuffer.isView(t))return t.buffer.slice(t.byteOffset,t.byteOffset+t.byteLength);let r=e.get(t);if(r)return r;if(Array.isArray(t)){let i=[];return e.set(t,i),t.forEach((s,n)=>{i[n]=Reflect.apply(ko,null,[s,e])}),i}let o=Object.create(Object.getPrototypeOf(t));e.set(t,o);for(let i of Reflect.ownKeys(t)){let s={...Reflect.getOwnPropertyDescriptor(t,i)};"value"in s&&(s.value=Reflect.apply(ko,null,[s.value,e])),Reflect.defineProperty(o,i,s)}return o}function Eo(t,e,r){let o=new Set;function i(s,n){if(s===n)return!0;if(or(s)||or(n))return or(s)&&or(n);if(!r&&Te(s)&&Te(n))return!0;if(typeof s!=typeof n||typeof s!="object"||!s||!n||o.has(s))return!1;function a(l,c){return l(s)?l(n)?c(s,n):!1:l(n)?!1:void 0}o.add(s);try{return a(Array.isArray,(l,c)=>{if(l.length!==c.length)return!1;for(let d=0;d<l.length;d++)if(!i(l[d],c[d]))return!1;return!0})??a(_t("Date"),(l,c)=>l.valueOf()===c.valueOf())??a(_t("URL"),(l,c)=>l.href===c.href)??a(_t("RegExp"),(l,c)=>l.source===c.source&&l.flags===c.flags)??a(Co,(l,c)=>{if(l.byteLength!==c.byteLength)return!1;let d=new Uint8Array(l),h=new Uint8Array(c);for(let u=0;u<d.length;u++)if(d[u]!==h[u])return!1;return!0})??((!r||[s,n].every(l=>Object.getPrototypeOf(l)===Object.prototype||Object.getPrototypeOf(l)===null))&&Object.keys({...s,...n}).every(l=>i(s[l],n[l])))}finally{o.delete(s)}}return i(t,e)}var ma;(function(t){t.millisecond=1,t.second=1e3,t.minute=t.second*60,t.hour=t.minute*60,t.day=t.hour*24,t.week=t.day*7;let e=new Date().getTimezoneOffset();function r(p){e=p}t.setTimezoneOffset=r;function o(){return e}t.getTimezoneOffset=o;function i(p=new Date,m){return typeof p=="number"&&(p=new Date(p)),m===void 0&&(m=e),Math.floor((p.valueOf()/t.minute-m)/1440)}t.getDateNumber=i;function s(p,m){let g=new Date(p*t.day);return m===void 0&&(m=e),new Date(+g+m*t.minute)}t.fromDateNumber=s;let n=/\d+(?:\.\d+)?/.source,a=new RegExp(`^${["w(?:eek(?:s)?)?","d(?:ay(?:s)?)?","h(?:our(?:s)?)?","m(?:in(?:ute)?(?:s)?)?","s(?:ec(?:ond)?(?:s)?)?"].map(p=>`(${n}${p})?`).join("")}$`);function l(p){let m=a.exec(p);return m?(parseFloat(m[1])*t.week||0)+(parseFloat(m[2])*t.day||0)+(parseFloat(m[3])*t.hour||0)+(parseFloat(m[4])*t.minute||0)+(parseFloat(m[5])*t.second||0):0}t.parseTime=l;function c(p){let m=l(p);return m?p=Date.now()+m:/^\d{1,2}(:\d{1,2}){1,2}$/.test(p)?p=`${new Date().toLocaleDateString()}-${p}`:/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(p)&&(p=`${new Date().getFullYear()}-${p}`),p?new Date(p):new Date}t.parseDate=c;function d(p){let m=Math.abs(p);return m>=t.day-t.hour/2?Math.round(p/t.day)+"d":m>=t.hour-t.minute/2?Math.round(p/t.hour)+"h":m>=t.minute-t.second/2?Math.round(p/t.minute)+"m":m>=t.second?Math.round(p/t.second)+"s":p+"ms"}t.format=d;function h(p,m=2){return p.toString().padStart(m,"0")}t.toDigits=h;function u(p,m=new Date){return p.replace("yyyy",m.getFullYear().toString()).replace("yy",m.getFullYear().toString().slice(2)).replace("MM",h(m.getMonth()+1)).replace("dd",h(m.getDate())).replace("hh",h(m.getHours())).replace("mm",h(m.getMinutes())).replace("ss",h(m.getSeconds())).replace("SSS",h(m.getMilliseconds(),3))}t.template=u})(ma||(ma={}));var Mr=Symbol.for("schemastery"),wa=Symbol.for("ValidationError");globalThis.__schemastery_index__??(globalThis.__schemastery_index__=0);globalThis.__schemastery_refs__=void 0;var H=class extends TypeError{constructor(e,r){let o="$";for(let i of r.path||[])typeof i=="string"?o+="."+i:typeof i=="number"?o+="["+i+"]":typeof i=="symbol"&&(o+=`[Symbol(${i.toString()})]`);o.startsWith(".")&&(o=o.slice(1));super((o==="$"?"":`${o} `)+e);f(this,"options");f(this,"name","ValidationError");this.options=r}static is(e){return!!e?.[wa]}};Object.defineProperty(H.prototype,wa,{value:!0});var C=function(t){let e=function(r,o={}){return C.resolve(r,e,o)[0]};if(t.refs){let r=ct(t.refs,i=>new C(i)),o=i=>r[i];for(let i in r){let s=r[i];s.sKey=o(s.sKey),s.inner=o(s.inner),s.list=s.list&&s.list.map(o),s.dict=s.dict&&ct(s.dict,o)}return r[t.uid]}if(Object.assign(e,t),typeof e.callback=="string")try{e.callback=new Function("return "+e.callback)()}catch{}return Object.defineProperty(e,"uid",{value:globalThis.__schemastery_index__++}),Object.setPrototypeOf(e,C.prototype),e.meta||(e.meta={}),e.toString=e.toString.bind(e),e};C.prototype=Object.create(Function.prototype);C.prototype[Mr]=!0;Object.defineProperty(C.prototype,"~standard",{get(){return{version:1,vendor:"schemastery",validate:t=>{try{return{value:C.resolve(t,this,{})[0]}}catch(e){if(H.is(e))return{issues:[{message:e.message,path:e.options.path}]};throw e}}}}});C.ValidationError=H;C.prototype.toJSON=function(){var r,o;if(globalThis.__schemastery_refs__)return(r=globalThis.__schemastery_refs__)[o=this.uid]??(r[o]=JSON.parse(JSON.stringify({...this}))),this.uid;globalThis.__schemastery_refs__={[this.uid]:{...this}},globalThis.__schemastery_refs__[this.uid]=JSON.parse(JSON.stringify({...this}));let e={uid:this.uid,refs:globalThis.__schemastery_refs__};return globalThis.__schemastery_refs__=void 0,e};C.prototype.set=function(e,r){return this.dict[e]=r,this};C.prototype.push=function(e){return this.list.push(e),this};function fp(t,e){let r=typeof t=="string"?{"":t}:{...t};for(let o in e){let i=e[o];i?.$description||i?.$desc?r[o]=i.$description||i.$desc:typeof i=="string"&&(r[o]=i)}return r}function Ar(t){return t?.$value??t?.$inner}function va(t){return ha(t??{},e=>!e.startsWith("$"))}C.prototype.i18n=function(e){let r=C(this),o=fp(r.meta.description,e);return Object.keys(o).length&&(r.meta.description=o),r.dict&&(r.dict=ct(r.dict,(i,s)=>i.i18n(ct(e,n=>Ar(n)?.[s]??n?.[s])))),r.list&&(r.list=r.list.map((i,s)=>i.i18n(ct(e,(n={})=>Array.isArray(Ar(n))?Ar(n)[s]:Array.isArray(n)?n[s]:va(n))))),r.inner&&(r.inner=r.inner.i18n(ct(e,i=>Ar(i)?Ar(i):va(i)))),r.sKey&&(r.sKey=r.sKey.i18n(ct(e,i=>i?.$key))),r};C.prototype.extra=function(e,r){let o=C(this);return o.meta={...o.meta,[e]:r},o};for(let t of["required","disabled","collapse","hidden","loose"])Object.assign(C.prototype,{[t](e=!0){let r=C(this);return r.meta={...r.meta,[t]:e},r}});C.prototype.deprecated=function(){var r;let e=C(this);return(r=e.meta).badges||(r.badges=[]),e.meta.badges.push({text:"deprecated",type:"danger"}),e};C.prototype.experimental=function(){var r;let e=C(this);return(r=e.meta).badges||(r.badges=[]),e.meta.badges.push({text:"experimental",type:"warning"}),e};C.prototype.pattern=function(e){let r=C(this),o=fa(e,["source","flags"]);return r.meta={...r.meta,pattern:o},r};C.prototype.simplify=function(e){if(or(e)&&(e=e.get()),Eo(e,this.meta.default,this.type==="dict"))return null;if(Te(e))return e;if(this.type==="object"||this.type==="dict"){let r={};for(let o in e){let i=(this.type==="object"?this.dict[o]:this.inner)?.simplify(e[o]);(this.type==="dict"||!Te(i))&&(r[o]=i)}return Eo(r,this.meta.default,this.type==="dict")?null:r}else if(this.type==="array"||this.type==="tuple"){let r=[];return e.forEach((o,i)=>{let s=this.type==="array"?this.inner:this.list[i],n=s?s.simplify(o):o;r.push(n)}),r}else if(this.type==="intersect"){let r={};for(let o of this.list)Object.assign(r,o.simplify(e));return r}else if(this.type==="union")for(let r of this.list)try{return C.resolve(e,r,{}),r.simplify(e)}catch{}return e};C.prototype.toString=function(e){return ya[this.type]?.(this,e)??`Schema<${this.type}>`};C.prototype.role=function(t,e){let r=C(this);return r.meta={...r.meta,role:t,extra:e},r};for(let t of["default","link","comment","description","max","min","step"])Object.assign(C.prototype,{[t](e){let r=C(this);return r.meta={...r.meta,[t]:e},r}});C.prototype.volatile=function(){if(this.meta.volatile)throw new TypeError("volatile schema is already wrapped");return this.extra("volatile",!0)};var xa={},ba=Symbol("checked-volatile-schema");function ir(t,e=[],r=!1,o=new Map){let i=o.get(t)??new Set;if(i.has(r))return;if(i.add(r),o.set(t,i),t.meta?.volatile&&r)throw new H("volatile fields require a fixed object path without an enclosing volatile field",{path:e});let s=r||!!t.meta?.volatile;if(t.dict)for(let[n,a]of Object.entries(t.dict))ir(a,[...e,n],s,o);if(t.sKey&&ir(t.sKey,[...e,"<key>"],!0,o),t.inner&&(t.type!=="lazy"||t.inner[Mr])&&ir(t.inner,[...e,"*"],!0,o),t.list)for(let n=0;n<t.list.length;n++)ir(t.list[n],[...e,String(n)],!0,o)}C.extend=function(e,r){xa[e]=r};C.resolve=function(e,r,o={},i=!1){if(!r)return[e];if(o[ba]||(ir(r,o.path),o={...o,[ba]:!0}),r.meta?.volatile){let n=C(r);n.meta={...r.meta,volatile:!1};let[a,l]=C.resolve(e,n,o,i);try{return[ms(a),l]}catch(c){throw new H(c instanceof Error?c.message:String(c),o)}}if(o.ignore?.(e,r))return[e];if(Te(e)&&r.type!=="lazy"){if(r.meta.required)throw new H("missing required value",o);let n=r,a=r.meta.default;for(;n?.type==="intersect"&&Te(a);)n=n.list[0],a=n?.meta.default;if(Te(a))return[e];e=ko(a)}let s=xa[r.type];if(!s)throw new H(`unsupported type "${r.type}"`,o);try{return s(e,r,o,i)}catch(n){if(!r.meta.loose)throw n;return[r.meta.default]}};C.from=function(e){if(Te(e))return C.any();if(["string","number","boolean"].includes(typeof e))return C.const(e).required();if(e[Mr])return e;if(typeof e=="function")switch(e){case String:return C.string().required();case Number:return C.number().required();case Boolean:return C.boolean().required();case Function:return C.function().required();default:return C.is(e).required()}else throw new TypeError(`cannot infer schema from ${e}`)};C.lazy=function(e){let r=()=>(o.inner[Mr]||(o.inner=o.builder(),o.inner.meta={...o.meta,...o.inner.meta}),o.inner.toJSON()),o=new C({type:"lazy",builder:e,inner:{toJSON:r}});return o};C.natural=function(){return C.number().step(1).min(0)};C.percent=function(){return C.number().step(.01).min(0).max(1).role("slider")};C.date=function(){return C.union([C.is(Date),C.transform(C.string().role("datetime"),(e,r)=>{let o=new Date(e);if(isNaN(+o))throw new H(`invalid date "${e}"`,r);return o},!0)])};C.regExp=function(e=""){return C.union([C.is(RegExp),C.transform(C.string().role("regexp",{flag:e}),(r,o)=>{try{return new RegExp(r,e)}catch(i){throw new H(i.message,o)}},!0)])};C.arrayBuffer=function(e){return C.union([C.is(ArrayBuffer),C.is(SharedArrayBuffer),C.transform(C.any(),(r,o)=>{if(Je.isSource(r))return Je.fromSource(r);throw new H(`expected ArrayBufferSource but got ${r}`,o)},!0),...e?[C.transform(C.string(),(r,o)=>{try{return e==="base64"?Je.fromBase64(r):Je.fromHex(r)}catch(i){throw new H(i.message,o)}},!0)]:[]])};C.extend("lazy",(t,e,r,o)=>(e.inner[Mr]||(e.inner=e.builder(),e.inner.meta={...e.meta,...e.inner.meta},ir(e.inner,r.path,!0)),C.resolve(t,e.inner,r,o)));C.extend("any",t=>[t]);C.extend("never",(t,e,r)=>{throw new H(`expected nullable but got ${t}`,r)});C.extend("const",(t,{value:e},r)=>{if(Eo(t,e))return[e];throw new H(`expected ${e} but got ${t}`,r)});function gs(t,e,r,o,i=!1){let{max:s=1/0,min:n=-1/0}=e;if(t>s)throw new H(`expected ${r} <= ${s} but got ${t}`,o);if(t<n&&!i)throw new H(`expected ${r} >= ${n} but got ${t}`,o)}C.extend("string",(t,{meta:e},r)=>{if(typeof t!="string")throw new H(`expected string but got ${t}`,r);if(e.pattern){let o=new RegExp(e.pattern.source,e.pattern.flags);if(!o.test(t))throw new H(`expect string to match regexp ${o}`,r)}return gs(t.length,e,"string length",r),[t]});function hs(t,e){let r=t.toString();if(r.includes("e"))return t*Math.pow(10,e);let o=r.indexOf(".");if(o===-1)return t*Math.pow(10,e);let i=r.slice(o+1),s=r.slice(0,o);return i.length<=e?+(s+i.padEnd(e,"0")):+(s+i.slice(0,e)+"."+i.slice(e))}function gp(t,e,r){if(r=Math.abs(r),!/^\d+\.\d+$/.test(r.toString()))return(t-e)%r===0;let o=r.toString().indexOf("."),i=r.toString().slice(o+1).length;return Math.abs(hs(t,i)-hs(e,i))%hs(r,i)===0}C.extend("number",(t,{meta:e},r)=>{if(typeof t!="number")throw new H(`expected number but got ${t}`,r);gs(t,e,"number",r);let{step:o}=e;if(o&&!gp(t,e.min??0,o))throw new H(`expected number multiple of ${o} but got ${t}`,r);return[t]});C.extend("boolean",(t,e,r)=>{if(typeof t=="boolean")return[t];throw new H(`expected boolean but got ${t}`,r)});C.extend("bitset",(t,{bits:e,meta:r},o)=>{let i=0,s=[];if(typeof t=="number"){i=t;for(let n in e)t&e[n]&&s.push(n)}else if(Array.isArray(t)){s=t;for(let n of s){if(typeof n!="string")throw new H(`expected string but got ${n}`,o);n in e&&(i|=e[n])}}else throw new H(`expected number or array but got ${t}`,o);return i===r.default?[i]:[i,s]});C.extend("function",(t,e,r)=>{if(typeof t=="function")return[t];throw new H(`expected function but got ${t}`,r)});C.extend("is",(t,{constructor:e},r)=>{if(typeof e=="function"){if(t instanceof e)return[t];throw new H(`expected ${e.name} but got ${t}`,r)}else{if(Te(t))throw new H(`expected ${e} but got ${t}`,r);let o=Object.getPrototypeOf(t);for(;o;){if(o.constructor?.name===e)return[t];o=Object.getPrototypeOf(o)}throw new H(`expected ${e} but got ${t}`,r)}});function Ro(t,e,r,o){try{let[i,s]=C.resolve(t[e],r,{...o,path:[...o.path||[],e]});return s!==void 0&&(t[e]=s),i}catch(i){if(!o?.autofix)throw i;return delete t[e],r.meta.volatile?ms(r.meta.default):r.meta.default}}C.extend("array",(t,{inner:e,meta:r},o)=>{if(!Array.isArray(t))throw new H(`expected array but got ${t}`,o);return gs(t.length,r,"array length",o,!Te(e.meta.default)),[t.map((i,s)=>Ro(t,s,e,o))]});C.extend("dict",(t,{inner:e,sKey:r},o,i)=>{if(!Io(t))throw new H(`expected object but got ${t}`,o);let s={};for(let n in t){let a;try{a=C.resolve(n,r,o)[0]}catch(l){if(i)continue;throw l}s[a]=Ro(t,n,e,o),t[a]=t[n],n!==a&&delete t[n]}return[s]});C.extend("tuple",(t,{list:e},r,o)=>{if(!Array.isArray(t))throw new H(`expected array but got ${t}`,r);let i=e.map((s,n)=>Ro(t,n,s,r));return o?[i]:(i.push(...t.slice(e.length)),[i])});function fs(t,e){for(let r in e)r in t||(t[r]=e[r])}C.extend("object",(t,{dict:e},r,o)=>{if(!Io(t))throw new H(`expected object but got ${t}`,r);let i={};for(let s in e){let n=Ro(t,s,e[s],r);(!Te(n)||s in t)&&(i[s]=n)}return o||fs(i,t),[i]});C.extend("union",(t,{list:e,toString:r},o,i)=>{let s=[];for(let n of e)try{return C.resolve(t,n,o,i)}catch(a){s.push(a)}throw new H(`expected ${r()} but got ${JSON.stringify(t)}`,o)});C.extend("intersect",(t,{list:e,toString:r},o,i)=>{if(!e.length)return[t];let s;for(let n of e){let a=C.resolve(t,n,o,!0)[0];if(!Te(a))if(Te(s))s=a;else{if(typeof s!=typeof a)throw new H(`expected ${r()} but got ${JSON.stringify(t)}`,o);if(typeof a=="object")fs(s??(s={}),a);else if(s!==a)throw new H(`expected ${r()} but got ${JSON.stringify(t)}`,o)}}return!i&&Io(t)&&fs(s,t),[s]});C.extend("transform",(t,{inner:e,callback:r,preserve:o},i)=>{let[s,n=t]=C.resolve(t,e,i,!0);return o?[r(s)]:[r(s),r(n)]});var ya={};function pe(t,e,r){ya[t]=r,Object.assign(C,{[t](...o){let i=new C({type:t});return e.forEach((s,n)=>{switch(s){case"sKey":i.sKey=o[n]??C.string();break;case"inner":i.inner=C.from(o[n]);break;case"list":i.list=o[n].map(C.from);break;case"dict":i.dict=ct(o[n],C.from);break;case"bits":i.bits={};for(let a in o[n])typeof o[n][a]=="number"&&(i.bits[a]=o[n][a]);break;case"callback":{let a=i.callback=o[n];a.toJSON||(a.toJSON=()=>a.toString());break}case"constructor":{let a=i.constructor=o[n];typeof a=="function"&&(a.toJSON||(a.toJSON=()=>a.name));break}default:i[s]=o[n]}}),t==="object"||t==="dict"?i.meta.default={}:t==="array"||t==="tuple"?i.meta.default=[]:t==="bitset"&&(i.meta.default=0),i}})}pe("is",["constructor"],({constructor:t})=>typeof t=="function"?t.name:t);pe("any",[],()=>"any");pe("never",[],()=>"never");pe("const",["value"],({value:t})=>typeof t=="string"?JSON.stringify(t):t);pe("string",[],()=>"string");pe("number",[],()=>"number");pe("boolean",[],()=>"boolean");pe("bitset",["bits"],()=>"bitset");pe("function",[],()=>"function");pe("array",["inner"],({inner:t})=>`${t.toString(!0)}[]`);pe("dict",["inner","sKey"],({inner:t,sKey:e})=>`{ [key: ${e.toString()}]: ${t.toString()} }`);pe("tuple",["list"],({list:t})=>`[${t.map(e=>e.toString()).join(", ")}]`);pe("object",["dict"],({dict:t})=>Object.keys(t).length===0?"{}":`{ ${Object.entries(t).map(([e,r])=>`${e}${r.meta.required?"":"?"}: ${r.toString()}`).join(", ")} }`);pe("union",["list"],({list:t},e)=>{let r=t.map(({toString:o})=>o()).join(" | ");return e?`(${r})`:r});pe("intersect",["list"],({list:t})=>`${t.map(e=>e.toString(!0)).join(" & ")}`);pe("transform",["inner","callback","preserve"],({inner:t},e)=>t.toString(e));var K=Fe($("react"),1);var sr=null;function _a(t,e){t.currentIndex=0,t.wipContextDeps=null,t.wipCommitCallbacks=[];let r=sr;sr=t;try{if(e(),t.isFirstRender=!1,t.cells.length!==t.currentIndex)throw new Error(`Rendered ${t.currentIndex} hooks but expected ${t.cells.length}. Hooks must be called in the exact same order in every render.`)}finally{sr=r}}function ie(){if(!sr)throw new Error("No resource fiber available");return sr}function ke(){return sr}var Z=typeof process<"u"&&!1;var Ao=t=>({version:0,committedVersion:0,dispatchUpdate:t,changelog:[],committedLog:[],unsettledCount:0,rollbackCallbacks:[]}),Pr=t=>{t.committedVersion=t.version;for(let e of t.changelog)e.logged=!1,e.settled||(e.settled=!0,t.unsettledCount--),t.committedLog.push(e);t.changelog.length=0,t.unsettledCount===0&&(t.committedLog.length=0),t.rollbackCallbacks.length=0},jt=(t,e)=>{let r=t.version>e;if(t.version=e,r){for(let o=0;o<t.rollbackCallbacks.length;o++)t.rollbackCallbacks[o]();if(t.rollbackCallbacks.length=0,e<=t.committedVersion){let o=[];for(;t.committedVersion-o.length>e;){let i=t.committedLog.pop();if(i===void 0){if(Z)throw new Error("tap: committed history is shorter than the replay base.");break}Mo(i.fiber,i.cell),i.cell.workInProgress=i.prevState,o.push({record:i,prevState:i.prevState,eagerState:i.eagerState,hasEagerState:i.hasEagerState})}if(o.length>0){let i=t.committedVersion;nr(t,()=>{for(let s=o.length-1;s>=0;s--){let n=o[s];n.record.prevState=n.prevState,n.record.eagerState=n.eagerState,n.record.hasEagerState=n.hasEagerState,t.committedLog.push(n.record)}t.committedVersion=i})}t.committedVersion=e;for(let i of t.changelog)i.logged=!1;t.changelog.length=0}else{for(;t.committedVersion+t.changelog.length>e;)t.changelog.pop().logged=!1;for(let o=0;o<t.changelog.length;o++)vs(t.changelog[o]);Pr(t)}}},vs=t=>{var e;Mo(t.fiber,t.cell),t.queued||(t.queued=!0,((e=t.cell).queue??(e.queue=[])).push(t))},St=(t,e)=>{t.wipCommitCallbacks.push(e)},nr=(t,e)=>{t.rollbackCallbacks.push(e)},Mo=(t,e)=>{e.isDirty||(e.isDirty=!0,t.markDirty?.(),nr(t.root,()=>{if(e.queue!==null){for(let r of e.queue)r.queued=!1;e.queue=null}e.workInProgress=e.current,e.isDirty=!1}))};var bs=Symbol.for("react.memo_cache_sentinel"),ws=t=>new Array(t).fill(bs),vp=(t,e)=>{let r=t.memoCache,o=r.workInProgress;if(o===null){let n=r.current;o=n===null?[]:n.map(a=>a.slice()),r.workInProgress=o,nr(t.root,()=>{r.workInProgress=null})}let i=r.index++,s=o[i];return s===void 0?(s=ws(e),o[i]=s):Z&&s.length!==e&&console.error(`Expected a constant size argument for each invocation of c(). The previous cache was allocated with size ${s.length} but size ${e} was requested.`),s},Po=t=>vp(ie(),t);var Do=Fe($("react"),1),bp=Do.default,wp=t=>(0,Do.useMemo)(()=>{let e=ws(t);return e[bs]=!0,e},[]),Sa=bp.__COMPILER_RUNTIME?.c??wp;var xp=()=>ke()!==null,v=t=>xp()?Po(t):Sa(t);var me=(t,...e)=>Object.assign(Object.create(null),t,...e);var S={};us(S,{Children:()=>Np,Fragment:()=>Es,Suspense:()=>Bp,cloneElement:()=>As,createContext:()=>we,createElement:()=>Rs,default:()=>pr.default,forwardRef:()=>re,isValidElement:()=>Br,lazy:()=>Op,memo:()=>te,use:()=>Ut,useCallback:()=>Ct,useContext:()=>ut,useDebugValue:()=>Is,useDeferredValue:()=>$p,useEffect:()=>D,useEffectEvent:()=>Nr,useId:()=>Dp,useImperativeHandle:()=>Cs,useInsertionEffect:()=>Vt,useLayoutEffect:()=>Ue,useMemo:()=>G,useReducer:()=>ks,useRef:()=>F,useState:()=>z,useSyncExternalStore:()=>it});var ar=()=>{throw new Error("Rendered more hooks than during the previous render. Hooks must be called in the exact same order in every render.")},lr=()=>{throw new Error("Hook order changed between renders")};var yp=()=>({type:"effect",setup:void 0,setupDeps:void 0,cleanup:void 0,deps:null,generation:0});function he(t,e){let r=ie(),o=r.currentIndex++,i=r.cells[o],s=i===void 0?yp():i.type==="effect"?i:lr();if(i===void 0&&(r.isFirstRender||ar(),r.cells[o]=s,r.effectCells.push(s)),s.deps!==null&&!!e!=!!s.deps)throw new Error("useEffect called with and without dependencies across re-renders");St(r,()=>{s.setup=t,s.setupDeps=e,s.generation++})}var Tt=(t,e)=>{Z&&t.length!==e.length&&console.error(`The final argument passed to a hook changed size between renders. The order and size of this array must remain constant.

Previous: [${t.join(", ")}]
Incoming: [${e.join(", ")}]`);for(let r=0;r<t.length&&r<e.length;r++)if(!Object.is(t[r],e[r]))return!1;return!0};var Ta=(t,e)=>{St(t,()=>{e.current=e.wip,e.currentDeps=e.wipDeps,e.isDirty=!1})},kt=(t,e)=>{let r=ie(),o=r.currentIndex++,i=r.cells[o];if(i===void 0){r.isFirstRender||ar();let a=t();return Z&&r.devStrictMode&&t(),i={type:"memo",current:a,currentDeps:e,wip:a,wipDeps:e,isDirty:!1},r.cells[o]=i,a}i.type!=="memo"&&lr();let s=i;if(Tt(s.wipDeps,e))return s.isDirty&&Ta(r,s),s.wip;let n=t();return Z&&r.devStrictMode&&t(),s.wip=n,s.wipDeps=e,s.isDirty||(s.isDirty=!0,nr(r.root,()=>{s.wip=s.current,s.wipDeps=s.currentDeps,s.isDirty=!1})),Ta(r,s),n};function Ve(t){return kt(()=>({current:t}),[])}var xs=Symbol("tap.Context.defaultValue"),_p=t=>t,ot=new Map,Ft=new Set,ka=()=>new Map(ot),Oo=(t,e)=>{let r=ot;ot=t;try{return e()}finally{ot=r}},ys=(t,e)=>{t[xs]=e},Ia=t=>typeof t=="object"&&t!==null&&xs in t,Ca=t=>typeof t=="object"&&t!==null&&"$$typeof"in t&&t.$$typeof===Symbol.for("react.context"),_s=t=>Ia(t)||Ca(t),Ea=t=>{if(!Ia(t)){if(Ca(t)){ys(t,t._currentValue??t._currentValue2);return}throw new Error("A tap resource's `use()` only accepts a tap context.")}},dt=(t,e,r)=>{if(typeof t!="object"||t===null)throw new Error("useContextProvider only accepts a React context.");Ea(t);let o=t,i=ie(),s=Ve(void 0),n=s.current===void 0||!Object.is(s.current.value,e);he(()=>{s.current={value:e}},[e]);let a=ot.get(o),l=a!==void 0||ot.has(o);ot.set(o,{value:e,source:i});try{return Sp(o,n,r)}finally{l?ot.set(o,a):ot.delete(o)}},Sp=(t,e,r)=>{let o=Ft.has(t);e?Ft.add(t):Ft.delete(t);try{return r()}finally{o?Ft.add(t):Ft.delete(t)}},No=t=>{Ea(t);let e=t,r=Tp(e,t),o=ie();return(o.wipContextDeps??(o.wipContextDeps=new Map)).set(e,r.source),r.value},Tp=(t,e)=>ot.get(t)??{value:_p(e)[xs],source:null},kp=(t,e,r,o)=>{if(!o)return r;let i=r;for(let[s,n]of o)n===e||n===t||(i??(i=new Map)).set(s,n);return i},Bo=(t,e=t.wipContextDeps)=>{let r=ke();!r||!e||(r.wipContextDeps=kp(r,t,r.wipContextDeps,e))},Ss=()=>Ft.size>0,Dr=t=>{if(!t.contextDeps||!Ss())return!1;for(let e of Ft.keys())if(t.contextDeps.has(e))return!0;return!1};var Ip=(t,e,r)=>{if(t.isNeverMounted)throw new Error("Resource updated before mount");let o=!1,i=!0;t.root.unsettledCount++,t.root.dispatchUpdate(()=>(o||(o=!0,r&&t.root.changelog.length===0&&!e.cell.isDirty&&!e.hasEagerState&&(e.prevState=e.cell.workInProgress,e.eagerState=r(e.cell.workInProgress,e.action),e.hasEagerState=!0,i=!Object.is(e.cell.current,e.eagerState),!i&&!e.settled&&(e.settled=!0,t.root.unsettledCount--))),i),()=>(o=!0,i=!0,vs(e),e.logged||(e.logged=!0,t.root.changelog.push(e)),!0))},Cp=(t,e,r,o,i)=>{let s=o?o(r):r;Z&&t.devStrictMode&&o&&o(r);let n={type:"reducer",workInProgress:s,current:s,isDirty:!1,queue:null,renderQueue:null,reducer:e,dispatch:a=>{let l=ke();if(l!==null){if(l!==t)throw new Error("Cannot update a resource while rendering a different resource.");(t.renderPendingCells??(t.renderPendingCells=new Set)).add(n),(n.renderQueue??(n.renderQueue=[])).push(a)}else{let c={fiber:t,cell:n,action:a,hasEagerState:!1,eagerState:void 0,prevState:n.current,settled:!1,queued:!1,logged:!1};Ip(t,c,i?e:void 0)}}};return n};function Ts(t,e,r,o){let i=ie(),s=i.currentIndex++,n=i.cells[s],a=(()=>{if(n!==void 0)return n.type==="reducer"?n:lr();i.isFirstRender||ar();let c=Cp(i,t,e,r,o);return i.cells[s]=c,c})(),l=a.queue;if(l!==null){let c=t===a.reducer;for(let d=0;d<l.length;d++){let h=l[d];!h.hasEagerState||!c||!Object.is(h.prevState,a.workInProgress)?(h.prevState=a.workInProgress,h.eagerState=t(a.workInProgress,h.action),h.hasEagerState=!0,Z&&i.devStrictMode&&(h.eagerState=t(a.workInProgress,h.action))):Z&&i.devStrictMode&&t(a.workInProgress,h.action),h.queued=!1,a.workInProgress=h.eagerState}a.queue=null}if(a.reducer=t,a.renderQueue!==null){let c=a.workInProgress;for(let d of a.renderQueue)c=t(c,d);a.renderQueue=null,i.renderPendingCells?.delete(a),Object.is(c,a.workInProgress)||(Mo(i,a),a.workInProgress=c)}return a.isDirty&&St(i,()=>{a.current=a.workInProgress,a.isDirty=!1}),[a.workInProgress,a.dispatch]}function cr(t,e,r){return Ts(t,e,r,!1)}var Ep=(t,e)=>typeof e=="function"?e(t):e,Rp=t=>t===void 0?void 0:typeof t=="function"?t():t;function $o(t){return Ts(Ep,t,Rp,!0)}var dr=(t,e)=>kt(()=>t,e);function ur(t){let e=ie(),r=Ve(t);return r.current!==t&&St(e,()=>{r.current=t}),dr(((...o)=>{if(Z&&ke())throw new Error("useEffectEvent cannot be called during render");return r.current(...o)}),[])}var Lo=t=>t!==null&&typeof t=="object"&&typeof t.then=="function",Ra=()=>{},Aa=t=>{let e=t;switch(typeof e.status!="string"?(e.status="pending",t.then(r=>{e.status==="pending"&&(e.status="fulfilled",e.value=r)},r=>{e.status==="pending"&&(e.status="rejected",e.reason=r)})):e.status!=="fulfilled"&&e.status!=="rejected"&&t.then(Ra,Ra),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:throw t}};var Or=t=>Lo(t)?Aa(t):No(t);var Ma=!1,jo=(t,e,r=e)=>{let o=ie().isNeverMounted,i=o?r():e();Z&&!Ma&&(!o||r===e)&&(Object.is(i,e())||(Ma=!0,console.error("The result of getSnapshot should be cached to avoid an infinite loop")));let[,s]=cr(l=>l+1,0),n=Ve(0),a=ur(()=>{try{if(Object.is(i,e()))return n.current=0,!1}catch{}return!0});return he(()=>t(()=>{a()&&s()}),[t]),he(()=>{if(a()){if(++n.current>50)throw n.current=0,new Error("Maximum update depth exceeded. The result of getSnapshot should be cached to avoid an infinite loop.");s()}},[t,i,e]),i};var Fo=(t,e)=>{};var Ap=0,Vo=()=>{let t=Ve(null);return t.current??(t.current=`:tap${Ap++}:`),t.current};var Uo=(t,e,r)=>{let o=()=>{if(!t)return;let i=e();if(typeof t=="function"){let s=t(i);return typeof s=="function"?s:()=>t(null)}return t.current=i,()=>{t.current=null}};r==null?he(o):he(o,[...r,t])};var It=Fe($("react"),1),Mp=It.default;function Pp(t){let e=(0,It.useRef)(t);return(0,It.useInsertionEffect)(()=>{e.current=t}),(0,It.useCallback)(((...r)=>e.current(...r)),[])}var Pa=Mp.useEffectEvent??Pp;var pr=Fe($("react"),1);L(S,$("react"));var be=()=>ke()!==null,ee=pr.default,z=t=>be()?$o(t):ee.useState(t),ks=(t,e,r)=>be()?cr(t,e,r):ee.useReducer(t,e,r),F=t=>be()?Ve(t):ee.useRef(t),G=(t,e)=>be()?kt(t,e):ee.useMemo(t,e),Ct=(t,e)=>be()?dr(t,e):ee.useCallback(t,e),D=(t,e)=>be()?he(t,e):ee.useEffect(t,e),Ue=(t,e)=>be()?he(t,e):ee.useLayoutEffect(t,e),Nr=t=>be()?ur(t):Pa(t),it=(t,e,r)=>be()?jo(t,e,r):ee.useSyncExternalStore(t,e,r),Is=(t,e)=>be()?Fo(t,e):ee.useDebugValue(t,e),Vt=(t,e)=>be()?he(t,e):ee.useInsertionEffect(t,e),Dp=()=>be()?Vo():ee.useId(),Cs=(t,e,r)=>be()?Uo(t,e,r):ee.useImperativeHandle(t,e,r),re=t=>ee.forwardRef(t),te=(t,e)=>ee.memo(t,e),Es=ee.Fragment,Rs=(...t)=>ee.createElement(...t),As=(...t)=>ee.cloneElement(...t),Br=t=>ee.isValidElement(t),Op=t=>ee.lazy(t),Np=ee.Children,Bp=ee.Suspense,$p=(t,e)=>ee.useDeferredValue(t,e),we=t=>{let e=ee.createContext(t);return ys(e,t),e},Ut=t=>be()&&_s(t)?Or(t):ee.use(t),ut=t=>be()&&_s(t)?Or(t):ee.useContext(t);function j(t){return(...e)=>({hook:t,args:e})}function oe(t,e,r){return typeof e=="function"?(...o)=>oe(t,e(...o)):r?{...e,key:t,deps:r}:{...e,key:t}}var pt=(t,e)=>{if(t.length!==0){if(t.length===1)throw t[0];for(let r of t)console.error(r);throw new AggregateError(t,e)}};var Lp=50,ze={schedulers:new Set,isScheduled:!1},st=null,Ms=[],Ds=class{constructor(t){f(this,"_isDirty",!1);f(this,"_task");this._task=t}get isDirty(){return this._isDirty}markDirty(){if(st&&(st.get(this)??0)>=Lp)throw new Error("Maximum update depth exceeded. This can happen when a resource repeatedly calls setState inside useEffect.");this._isDirty=!0,ze.schedulers.add(this),Oa()}runTask(){st?.set(this,(st.get(this)??0)+1),this._isDirty=!1,this._task()}settle(){this._isDirty=!1}},jp=[],yx=new Ds(()=>{let t=jp.splice(0),e=[];for(let r of t)try{r()}catch(o){e.push(o)}pt(e,"Errors occurred while running scheduled tasks")});var Da=t=>{if(st!==null){Ms.push(t);return}t()},Oa=()=>{ze.isScheduled||(ze.isScheduled=!0,Fp())},Ps=()=>{let t=st;st=new Map;let e=[];try{for(let r of ze.schedulers)if(ze.schedulers.delete(r),!!r.isDirty)try{r.runTask()}catch(o){e.push(o)}}finally{if(st=t,ze.schedulers.clear(),ze.isScheduled=!1,st===null)for(;Ms.length>0;)try{Ms.shift()()}catch(r){e.push(r)}}pt(e,"Errors occurred during flushSync")},Fp=(()=>{if(typeof MessageChannel<"u"){let t=null,e;return()=>{if(!t){let r=new MessageChannel;r.port1.onmessage=()=>{t?.unref?.(),Ps()},t=r.port1,e=r.port2}t.ref?.(),e.postMessage(null)}}return()=>setTimeout(Ps,0)})(),Os=t=>{if(st!==null)return Z&&console.warn("flushTapSync was called from inside a render or commit. The flush is deferred until the current pass completes."),t();let e=ze;ze={schedulers:new Set,isScheduled:!0};try{let r=t();return Ps(),r}finally{let r=ze.schedulers;if(ze=e,r.size>0){for(let o of r)ze.schedulers.add(o);Oa()}}};function Na(t){let e=[];for(let r=0;r<t.length;r++)try{t[r]()}catch(o){e.push(o)}pt(e,"Errors during commit")}function Vp(t){let e=t.setup,r=t.setupDeps,o=t.generation,i;try{let s=e();if(s!==void 0&&typeof s!="function")throw new Error(`An effect function must either return a cleanup function or nothing. Received: ${typeof s}`);i=s}finally{t.generation===o?(t.cleanup=i,t.deps=r):i?.()}}var Up=t=>t.setup===void 0?!1:t.deps===null||t.setupDeps===void 0?!0:!Tt(t.deps,t.setupDeps);function Ns(t){let e=[],r=[];for(let o of t.effectCells)Up(o)&&r.push(o);for(let o of r)if(o.deps=null,o.cleanup!==void 0)try{o.cleanup()}catch(i){e.push(i)}finally{o.cleanup=void 0}for(let o of r)try{Vp(o)}catch(i){e.push(i)}pt(e,"Errors during commit")}function Bs(t){let e=[];for(let r of t.effectCells)if(r.deps=null,r.cleanup)try{r.cleanup?.()}catch(o){e.push(o)}finally{r.cleanup=void 0}pt(e,"Errors during cleanup")}var zp={useState:$o,useReducer:cr,useRef:Ve,useMemo:kt,useCallback:dr,useEffect:he,useLayoutEffect:he,useInsertionEffect:he,useEffectEvent:ur,useContext:No,use:Or,useSyncExternalStore:jo,useDebugValue:Fo,useId:Vo,useImperativeHandle:Uo,useMemoCache:Po},Ba=pr.default,zt=Ba.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE??Ba.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,zo=zt==null?null:"H"in zt?{get current(){return zt.H},set current(t){zt.H=t}}:"ReactCurrentDispatcher"in zt?{get current(){return zt.ReactCurrentDispatcher.current},set current(t){zt.ReactCurrentDispatcher.current=t}}:null;function $a(t){if(!zo)return t();let e=zo.current;zo.current=zp;try{return t()}finally{zo.current=e}}function qo(t,e,r=void 0,o){return{hook:t,root:e,markDirty:r,devStrictMode:o,cells:[],effectCells:[],contextDeps:null,wipContextDeps:null,wipCommitCallbacks:null,memoCache:{current:null,workInProgress:null,index:0},renderPendingCells:null,currentIndex:0,isFirstRender:!0,isMounted:!1,isNeverMounted:!0}}function $s(t){t.wipCommitCallbacks=null,t.wipContextDeps=null,t.memoCache.workInProgress=null}function nt(t){t.isMounted&&(t.isMounted=!1,Bs(t))}function qe(t,e){if(t.renderPendingCells!==null){for(let i of t.renderPendingCells)i.renderQueue=null;t.renderPendingCells.clear()}let r=0,o;try{do{if(++r>25)throw new Error("Too many re-renders. tap limits the number of renders to prevent an infinite loop.");t.memoCache.index=0,_a(t,()=>{o=$a(()=>t.hook(...e))})}while((t.renderPendingCells?.size??0)>0)}catch(i){throw $s(t),i}return Bo(t),o}function Qe(t){let e=t.wipCommitCallbacks;t.wipCommitCallbacks=null;let r=Z&&!t.isMounted&&t.devStrictMode==="root";t.isMounted=!0,t.isNeverMounted=!1,e!==null&&(t.contextDeps=t.wipContextDeps,Pr(t.root),t.memoCache.workInProgress!==null&&(t.memoCache.current=t.memoCache.workInProgress,t.memoCache.workInProgress=null),Na(e)),r&&(Ns(t),Bs(t)),Ns(t)}var qp=()=>{let t=ie();return t.devStrictMode?t.isFirstRender?"child":"root":null},Hp=()=>"child",La=()=>null,Gp=()=>{if(!Z)return La;let t=F(0);return z(()=>t.current++),t.current!==2?La:Hp},Ho=()=>ke()?qp:Gp();var Wp=t=>t(),Kp=t=>{let e=[];for(let r of t)try{r()}catch(o){e.push(o)}pt(e,"Errors occurred while notifying Tap root subscribers")},Jp=(t,e,r)=>{let o=new Ds(()=>a.handleUpdate()),i=[],s=Ao((l,c)=>{i.length===0&&!l()||(i.push(c),o.markDirty())}),n=qo(Wp,s,void 0,e),a={scheduler:o,queue:i,fiber:n,subscribers:new Set,pendingHostRender:!1,isMounted:!1,hasRendered:!1,committedRender:t,context:new Map,value:void 0,applyQueue:()=>{jt(s,s.committedVersion);for(let l of i)Z&&n.devStrictMode&&l(),l();return jt(s,s.committedVersion+s.changelog.length),i.length},publish:(l,c)=>{o.isDirty||s.committedVersion!==c||a.value===l||(a.value=l,Da(()=>Kp(a.subscribers)))},finishFlush:(l,c,d)=>{Pr(s),i.splice(0,d),a.pendingHostRender=!1,i.length===0&&o.settle(),a.isMounted&&Qe(n),a.publish(l,c)},handleUpdate:()=>{let l=a.applyQueue(),c;try{Z&&n.devStrictMode&&Oo(a.context,()=>qe(n,[a.committedRender])),c=Oo(a.context,()=>qe(n,[a.committedRender]))}catch(d){if(jt(s,s.committedVersion),Lo(d)){let h=()=>{a.isMounted&&o.markDirty()};d.then(h,h);return}if(a.isMounted){a.pendingHostRender=!0,r(h=>h+1);return}throw d}if(o.isDirty)throw new Error("Scheduler is dirty, this should never happen");a.finishFlush(c,s.version,l)}};return a},Ls=t=>{let[,e]=z(0),r=Ho(),o=F(null),i=o.current??(o.current=Jp(t,r(),e)),s=ka(),n=i.scheduler.isDirty||i.pendingHostRender?i.applyQueue():0,a=Oo(s,()=>qe(i.fiber,[t])),l={render:t,context:s,value:a,drained:n,wip:i.fiber.wipCommitCallbacks,version:i.fiber.root.version,processed:!1};return i.hasRendered||(i.hasRendered=!0,i.committedRender=t,i.context=s,i.value=a),D(()=>(i.isMounted=!0,()=>{i.isMounted=!1,nt(i.fiber)}),[i]),D(()=>{if(l.processed){i.fiber.isMounted||(Qe(i.fiber),i.queue.length&&!i.scheduler.isDirty&&i.scheduler.markDirty());return}if(l.processed=!0,i.committedRender=l.render,i.context=l.context,i.fiber.wipCommitCallbacks!==l.wip){i.scheduler.isDirty||i.handleUpdate();return}if(l.drained>0&&i.fiber.root.version===l.version){i.finishFlush(l.value,l.version,l.drained);return}Qe(i.fiber),i.publish(l.value,l.version)}),G(()=>({getValue:()=>i.value,subscribe:c=>(i.subscribers.add(c),()=>i.subscribers.delete(c))}),[i])};var Qp=()=>{let t=F(0),e=t.current,r=ie();return{version:e,markDirty:G(()=>()=>{t.current++,r.markDirty?.()},[r]),root:r.root}},Yp=()=>{let[t]=z(()=>Ao((i,s)=>{let n=!1;o(a=>(n=!i(),n?a:a+1)),n||r(s)})),[e,r]=ks((i,s)=>(jt(t,i),i+(s()?1:0)),0),[,o]=z(0);return jt(t,e),{root:t,version:e,markDirty:void 0}},mr=()=>{let t=Ho(),{root:e,version:r,markDirty:o}=ke()?Qp():Yp();return{version:r,createFiber:Ct((i,s,n)=>qo(i,e,n?()=>{n(),o?.()}:o,t()),[])}};var Go=(t,e,r)=>{let o=F(null),i=o.current??(o.current={wipDeps:null,wip:null,currentDeps:null,current:null});return i.wipDeps=i.currentDeps,i.wip=i.current,D(()=>{i.currentDeps=i.wipDeps,i.current=i.wip}),!r&&i.currentDeps&&Tt(i.currentDeps,e)?i.current:(i.wipDeps=e,i.wip=t(),i.wip)};function fe(t){let{version:e,createFiber:r}=mr(),o=G(()=>r(t.hook,t.key),[t.hook,t.key,r]),i=Go(()=>({value:qe(o,t.args)}),[o,e,t.args],Dr(o));return D(()=>()=>nt(o),[o]),D(()=>{Qe(o)},[o,i]),i.value}var ja=(t,e)=>{let r=t.get(e);r&&(r.isDirty=!0)},Xp=(t,e)=>!t.isDirty&&!Dr(t.fiber)&&e!==void 0&&t.committedDeps!==void 0&&Tt(t.committedDeps,e),Zp=t=>{if(!Ss())return!1;for(let{fiber:e}of t.values())if(Dr(e))return!0;return!1};function qt(t){let[e]=z(()=>new Map),{version:r,createFiber:o}=mr(),i=Zp(e),s=Go(()=>{let n=new Set,a=[],l=0;for(let c=0;c<t.length;c++){let d=t[c],h=d.key;if(h===void 0)throw new Error(`useResources did not provide a key for array at index ${c}`);if(n.has(h))throw new Error(`Duplicate key ${h} in useResources`);n.add(h);let u=e.get(h);if(u)if(u.fiber.hook!==d.hook){let p=o(d.hook,d.key,()=>ja(e,h)),m=qe(p,d.args);u.next={value:m,deps:d.deps,remount:p}}else if(Xp(u,d.deps))typeof u.next=="object"&&$s(u.fiber),u.fiber.contextDeps&&Bo(u.fiber,u.fiber.contextDeps),u.next="skip";else{let p=qe(u.fiber,d.args);u.next={value:p,deps:d.deps}}else{let p=o(d.hook,d.key,()=>ja(e,h));u={fiber:p,next:{value:qe(p,d.args),deps:d.deps},isDirty:!1,committedDeps:void 0,committedValue:void 0},l++,e.set(h,u)}a.push(typeof u.next=="object"?u.next.value:u.committedValue)}if(e.size>a.length-l)for(let c of e.keys())n.has(c)||(e.get(c).next="delete");return a},[t,e,o,r],i);return D(()=>()=>{for(let n of e.keys())nt(e.get(n).fiber)},[e]),D(()=>{for(let[n,a]of e.entries()){let l=a.next;l==="delete"?(nt(a.fiber),e.delete(n)):l==="skip"?!a.fiber.isNeverMounted&&!a.fiber.isMounted&&Qe(a.fiber):(l.remount&&(nt(a.fiber),a.fiber=l.remount),Qe(a.fiber),a.committedDeps=l.deps,a.committedValue=l.value,a.isDirty=!1,a.next="skip")}},[s,e]),s}var em=t=>t(),Wo=t=>{let{createFiber:e}=mr(),r=G(()=>e(em,void 0),[e]),o=qe(r,[t]);D(()=>()=>{nt(r)},[r]);let i=!1,s=()=>{i&&r.isMounted||(i=!0,Qe(r))};return D(s),{value:o,effects:s}};var tm=()=>{let t=v(4),[e,r]=z(rm),o;t[0]===Symbol.for("react.memo_cache_sentinel")?(o=(l,c)=>(r(d=>{let h=me(d.renderers);return h[l]=[...h[l]??[],c],{...d,renderers:h}}),()=>{r(d=>{let h=me(d.renderers),u=h[l]?.filter(p=>p!==c)??[];return u.length>0?h[l]=u:delete h[l],{...d,renderers:h}})}),t[0]=o):o=t[0];let i=o,s;t[1]===Symbol.for("react.memo_cache_sentinel")?(s=l=>(r(c=>({...c,fallbacks:[...c.fallbacks,l]})),()=>{r(c=>({...c,fallbacks:c.fallbacks.filter(d=>d!==l)}))}),t[1]=s):s=t[1];let n=s,a;return t[2]!==e?(a={getState:()=>e,setDataUI:i,setFallbackDataUI:n},t[2]=e,t[3]=a):a=t[3],a},Fa=j(tm);function rm(){return{renderers:me(),fallbacks:[]}}var js=t=>{if(!t.overwrite)return t;let{overwrite:e,...r}=t;return r},Va=t=>{let e=Array.from(t).map(o=>o.getModelContext()).sort((o,i)=>(i.priority??0)-(o.priority??0)),r=me();return e.reduce((o,i)=>{let s=i.priority??0;if(i.system&&(o.system?o.system+=`

${i.system}`:o.system=i.system),i.tools)for(let[n,a]of Object.entries(i.tools)){let l=o.tools!==void 0&&Object.hasOwn(o.tools,n)?o.tools[n]:void 0;if(l&&l!==a){let c=r[n];if(c===s){if(!a.overwrite)throw new Error(`You tried to define a tool with the name ${n}, but it already exists.`);o.tools[n]=js(a);continue}let d=c>s?l:a,h=c>s?a:l;o.tools[n]=js({...h,...d}),r[n]=Math.max(c,s);continue}o.tools||(o.tools=me()),o.tools[n]=js(a),Object.hasOwn(r,n)||(r[n]=s)}return i.config&&(o.config={...o.config,...i.config}),i.callSettings&&(o.callSettings={...o.callSettings,...i.callSettings}),i.unstable_composerMetadata&&(o.unstable_composerMetadata={...o.unstable_composerMetadata,...i.unstable_composerMetadata}),o},{})};var le=(t,e,r)=>{let o=i=>{console.error(`[assistant-ui] ${r} listener threw an error`,i)};for(let i of t)try{let s=i(typeof e=="function"?e():e);s!==null&&(typeof s=="object"||typeof s=="function")&&"then"in s&&typeof s.then=="function"&&Promise.resolve(s).catch(o)}catch(s){o(s)}};var se=t=>t;var om=new Set(["$$typeof","nodeType","then","__v_raw","__v_isRef","__v_isReactive","__v_isReadonly","__v_isShallow","__v_skip"]),He=(t,e)=>{if(t===Symbol.toStringTag)return e;if(typeof t!="symbol"){if(t==="toJSON")return()=>e;if(!om.has(t))return!1}},mt=class{getOwnPropertyDescriptor(t,e){let r=this.get(t,e);if(r!==void 0)return{value:r,writable:!1,enumerable:!0,configurable:!0}}set(){return!1}setPrototypeOf(){return!1}defineProperty(){return!1}deleteProperty(){return!1}preventExtensions(){return!1}};var Ko=Symbol("assistant-ui.store.clientId"),Jo=Symbol("assistant-ui.store.instanceTag"),Fs=(t,e)=>{let r=new Proxy((()=>{}),{apply:()=>(e(),r),get:(o,i)=>i==="source"?t.source:i==="query"?t.query:i==="name"?t.name:i===Ko?Yo(e()):e()[i],has:(o,i)=>i==="source"||i==="query"||i==="name"||i===Ko||i in e(),ownKeys:()=>Reflect.ownKeys(e()),getOwnPropertyDescriptor:(o,i)=>{if(!(typeof i=="symbol"||!(i in e())))return{value:e()[i],writable:!1,enumerable:!0,configurable:!0}}});return r},Vs=(t,e)=>{let r=()=>{throw new Error(t)};return new Proxy((()=>{}),{apply:r,get:(o,i)=>{if(i==="source"||i==="query")return null;if(i==="name")return e;if(i===Ko)return r();let s=He(i,"AssistantClientAccessor");return s!==!1?s:r()},has:(o,i)=>i==="source"||i==="query"||i==="name",ownKeys:()=>[],getOwnPropertyDescriptor:()=>{}})},Et=t=>t?.source!=null,Qo=t=>t?.source===null,Yo=t=>t[Ko]??t,Ua=t=>t[Jo]??Yo(t);var ht=t=>t==="optional"||t==="subscribe"||t==="on"||t==="__proto__"||typeof t=="symbol",$r=t=>{let e=[];for(let r in t)ht(r)||e.push(r);return e};var Ht,za,im=(za=class extends mt{constructor(e){super();$t(this,Ht);Lt(this,Ht,e)}get(e,r){let o=He(r,"OptionalAssistantClient");if(o!==!1)return o;if(ht(r))return;let i=lt(this,Ht)[r];return Et(i)?i:void 0}ownKeys(){return $r(lt(this,Ht))}has(e,r){return!ht(r)&&r in lt(this,Ht)}},Ht=new WeakMap,za),Xo=t=>new Proxy({},new im(t));var qa=()=>()=>{},sm="You are using a component or hook that requires an AuiProvider. Wrap your component in an <AuiProvider> component.",Lr,jr,Fr,Zo,Ha,nm=(Ha=class extends mt{constructor(e,r,o){super();$t(this,Lr);$t(this,jr);$t(this,Fr);$t(this,Zo);Lt(this,Lr,e),Lt(this,jr,r),Lt(this,Fr,o)}get(e,r){if(r==="subscribe"||r==="on")return qa;if(r==="optional")return lt(this,Zo)??Lt(this,Zo,Xo(lt(this,Fr).call(this)));let o=He(r,lt(this,Lr));return o!==!1?o:Vs(lt(this,jr).call(this,String(r)),String(r))}ownKeys(){return["subscribe","on","optional"]}getOwnPropertyDescriptor(e,r){if(r!=="optional")return super.getOwnPropertyDescriptor(e,r);let o=this.get(e,r);if(o!==void 0)return{value:o,writable:!1,enumerable:!1,configurable:!0}}has(e,r){return r==="subscribe"||r==="on"||r==="optional"}},Lr=new WeakMap,jr=new WeakMap,Fr=new WeakMap,Zo=new WeakMap,Ha),am=(t,e)=>{let r=new Proxy({},new nm(t,e,()=>r));return r},Rt=am("DefaultAssistantClient",()=>sm),Ga=()=>new Proxy({},{get(t,e){let r=He(e,"AssistantClient");return r!==!1?r:Vs(`The current scope does not have a "${String(e)}" property.`,String(e))}}),ei=we(Rt),lm=()=>{},Wa=new WeakMap,Ka=t=>Wa.get(t)??lm,Ja=(t,e)=>{Wa.set(t,e)},Vr=()=>ut(ei),Qa=(t,e)=>dt(ei,t,e);var Us=Symbol("assistant-ui.transform-scopes");function Ur(t,e){let r=t;if(r[Us])throw new Error("transformScopes is already attached to this resource");r[Us]=e}function Ya(t){return t[Us]}var zr=t=>typeof t=="string"?{scope:t.split(".")[0],event:t}:{scope:t.scope,event:t.event};var Xa=t=>{console.error("NotificationManager: event listener error",t)},Za=(t,e,r)=>{try{let o=t(e,r);o!==null&&(typeof o=="object"||typeof o=="function")&&typeof o.then=="function"&&Promise.resolve(o).catch(Xa)}catch(o){Xa(o)}},cm=()=>{let t=new Map,e=new Set,r=new Set;return{on(o,i){let s=i;if(o==="*")return e.add(s),()=>e.delete(s);let n=t.get(o);return n||(n=new Set,t.set(o,n)),n.add(s),()=>{n.delete(s),n.size===0&&t.get(o)===n&&t.delete(o)}},emit(o,i,s){!t.has(o)&&e.size===0||queueMicrotask(()=>{let n=t.get(o);if(n)for(let a of n)Za(a,i,s);if(e.size>0){let a={event:o,payload:i};for(let l of e)Za(l,a,s)}})},subscribe(o){return r.add(o),()=>r.delete(o)},notifySubscribers(){for(let o of r)try{o()}catch(i){console.error("NotificationManager: subscriber callback error",i)}}}},zs=()=>z(cm)[0];var ti=Symbol("assistant-ui.store.clientIndex"),el=t=>t[ti],tl=we([]),qr=()=>Ut(tl),rl=(t,e)=>{let r=v(3),o=qr(),i;return r[0]!==t||r[1]!==o?(i=[...o,t],r[0]=t,r[1]=o,r[2]=i):i=r[2],dt(tl,i,e)};var il=we(null),ol=Symbol("aui.scope-effect-unapplied"),sl=(t,e)=>dt(il,t,e),qs=()=>{let t=Ut(il);if(!t)throw new Error("AssistantTapContext is not available");return t},Hr=()=>qs().clientRef,Gr=(t,e,r)=>{let o=v(8),{clientRef:i}=qs(),s;o[0]!==i||o[1]!==e||o[2]!==t?(s=()=>{let a=i.current;if(a===null)throw new Error("useAssistantScopeEffect ran before the client was committed. This is likely an internal bug in assistant-ui.");let l=()=>{let p=i.current?.[t];return p!==void 0&&Et(p)?Ua(p):void 0},c=ol,d,h=p=>{if(d?.(),d=void 0,c=ol,p!==void 0){let m=e();d=typeof m=="function"?m:void 0}c=p};h(l());let u=a.subscribe(()=>{let p=l();p!==c&&h(p)});return()=>{u(),d?.()}},o[0]=i,o[1]=e,o[2]=t,o[3]=s):s=o[3];let n;o[4]!==i||o[5]!==r||o[6]!==t?(n=[i,t,...r],o[4]=i,o[5]=r,o[6]=t,o[7]=n):n=o[7],D(s,n)},Oe=()=>{let t=v(3),{emit:e}=qs(),r=qr(),o;return t[0]!==r||t[1]!==e?(o=(i,s)=>{e(i,s,r)},t[0]=r,t[1]=e,t[2]=o):o=t[2],Nr(o)};var ri=we(void 0),Hs=(t,e)=>{let r=Ut(ri);return dt(ri,t??r,e)};var oi=()=>{let t=v(3),[e]=z(dm),r,o;return t[0]!==e?(r=()=>()=>queueMicrotask(()=>e.abort()),o=[e],t[0]=e,t[1]=r,t[2]=o):(r=t[1],o=t[2]),Vt(r,o),e.signal};function dm(){return new AbortController}var ii=Symbol("assistant-ui.store.getValue"),Gs=t=>{let e=t[ii];if(!e)throw new Error("Client scope contains a non-client resource. Ensure your Derived get() returns a client created with useClientResource(), not a plain resource.");return e.getState?.()},nl=new Map;function um(t){let e=nl.get(t);return e||(e=function(...r){if(!this||typeof this!="object")throw new Error(`Method "${String(t)}" called without proper context. This may indicate the function was called incorrectly.`);let o=this[ii];if(!o)throw new Error(`Method "${String(t)}" called on invalid client proxy. Ensure you are calling this method on a valid client instance.`);let i=o[t];if(!i)throw new Error(`Method "${String(t)}" is not implemented.`);if(typeof i!="function")throw new Error(`"${String(t)}" is not a function.`);return i(...r)},nl.set(t,e)),e}var pm=class extends mt{constructor(e,r,o){super();f(this,"boundFns");f(this,"cachedReceiver");f(this,"outputRef");f(this,"tagRef");f(this,"index");this.outputRef=e,this.tagRef=r,this.index=o}get(e,r,o){if(r===ii)return this.outputRef.current;if(r===ti)return this.index;if(r===Jo)return this.tagRef.current;let i=He(r,"ClientProxy");if(i!==!1)return i;let s=this.outputRef.current[r];if(typeof s=="function"){if(o===void 0)return s;(!this.boundFns||this.cachedReceiver!==o)&&(this.boundFns=new Map,this.cachedReceiver=o);let n=this.boundFns.get(r);return n||(n=um(r).bind(o),this.boundFns.set(r,n)),n}return s}ownKeys(){return Object.keys(this.outputRef.current)}has(e,r){return r===ii||r===ti||r===Jo?!0:r in this.outputRef.current}},ft=t=>{let e=F(null),r=F(null),o=G(()=>({}),[t.hook,t.key]),i=qr().length,s=G(()=>new Proxy({},new pm(e,r,i)),[i]),n=rl(s,function(){return fe(t)});return e.current||(e.current=n,r.current=o),D(()=>{e.current=n,r.current=o}),{methods:s,state:n.getState?.(),key:t.key}},si=j(ft);var xe=(t,e)=>{if(Array.isArray(t)!==Array.isArray(e))return!1;if(Array.isArray(t)&&Array.isArray(e)){if(t.length!==e.length)return!1;for(let o=0;o<t.length;o++)if(!Object.is(t[o],e[o]))return!1;return!0}let r=Object.keys(t);return r.length===Object.keys(e).length&&r.every(o=>Object.hasOwn(e,o)&&Object.is(t[o],e[o]))};var Wr=t=>{let e=G(()=>({}),[]);return e.v!==void 0&&xe(e.v,t)?e.v:(e.v=t,t)},at=t=>{let e=v(2),r=F(void 0),o;return e[0]!==t?(o=i=>{let s=t(i);return r.current!==void 0&&xe(r.current,s)?r.current:(r.current=s,s)},e[0]=t,e[1]=o):o=e[1],o};var ni=(()=>{try{return!1}catch{return!1}})();var mm=(t,e)=>{let r={...t},o=new Set,i=!0;for(;i;){i=!1;for(let s of Object.values(r)){if(o.has(s.hook))continue;o.add(s.hook);let n=Ya(s.hook);if(n){n(r,e),i=!0;break}}}return r},ai=t=>t.hook===Ks,hm=t=>{if(!ai(t))return{source:"root",query:{}};let e=t.args[0];return{source:e.source,query:e.query??{}}},Ws=Symbol.for("aui.event-receiver-ref"),al=(t,e)=>{let r=t===Rt?Ga():t,o=Object.create(r);Object.assign(o,e);let i;return Object.defineProperty(o,"optional",{get:()=>i??(i=Xo(o)),enumerable:!1}),o},fm=({notifications:t,clientRef:e})=>G(()=>({subscribe:t.subscribe,on:function(r,o){if(!this)throw new Error("const { on } = useAui() is not supported. Use aui.on() instead.");let{scope:i,event:s}=zr(r),n=r[Ws];if(i!=="*"&&!n&&Qo(this[i]))throw new Error(`Scope "${i}" is not available. Use { scope: "*", event: "${s}" } to listen globally.`);let a=t.on(s,(c,d)=>{if(i==="*")return o(c);let h=((n??e).current??this)[i];if(!Et(h))return;let u=Yo(h);if(u===d[el(u)])return o(c)});if(i!=="*"){if(n){if(e.parent===Rt)return a}else if(Qo(e.parent[i]))return a}let l=e.parent.on(r,o);return()=>{a(),l()}}}),[t,e]),ll=t=>{let e=v(5),r;e[0]!==t?(r=hm(t),e[0]=t,e[1]=r):r=e[1];let{source:o,query:i}=r,s=Wr(i),n;return e[2]!==o||e[3]!==s?(n={source:o,query:s},e[2]=o,e[3]=s,e[4]=n):n=e[4],Wr(n)},gm=(t,e)=>{let r=v(3),o;return r[0]!==e||r[1]!==t?(o=e?t:si(t),r[0]=e,r[1]=t,r[2]=o):o=r[2],fe(o)},vm=(t,e)=>{let r=Vr(),o=ai(e),i=gm(e,o),s=o?i:i.methods,n=ll(e),a=G(()=>Fs({name:t,...n},()=>s),[t,n,s]);return r[t]=a,a},bm=j(vm),wm=t=>{let e=v(2),r;return e[0]!==t?(r=t.map(km),e[0]=t,e[1]=r):r=e[1],qt(r)},cl=(t,e)=>{let r=Wr(e),o=G(()=>({}),[]);return o.deps!==r&&(o.deps=r,o.client=t),o.client},dl=({parent:t,entries:e,clientRef:r,notifications:o})=>{let i=fm({notifications:o,clientRef:r}),s=al(t,i),n=sl({clientRef:r,emit:o.emit},function(){return Qa(s,function(){return wm(e)})});return{client:cl(s,[t,...n])}},xm=({parent:t,entries:e,destroySignal:r})=>{let o=F({parent:t,current:null}).current,{value:i,effects:s}=Wo(function(){let a=zs(),{client:l}=Hs(r,function(){return dl({parent:t,entries:e,clientRef:o,notifications:a})});return D(()=>t.subscribe(a.notifySubscribers),[t,a]),D(()=>a.notifySubscribers()),l});return Vt(()=>{o.parent=t,o.current=i},[i,t,o]),{client:i,effects:s}},ym=({parent:t,entries:e,destroySignal:r})=>{let o=F({parent:t,current:null}).current,{value:i,effects:s}=Wo(function(){let a=zs(),l=Ls(function(){return Hs(r,function(){return dl({parent:t,entries:e,clientRef:o,notifications:a})})}),c=it(l.subscribe,()=>l.getValue().client,()=>l.getValue().client);return D(()=>{let d=()=>Os(()=>{o.current=l.getValue().client,a.notifySubscribers()}),h=l.subscribe(d),u=t.subscribe(d);return()=>{h(),u()}},[l,t,a]),c});return Vt(()=>{o.parent=t,o.current=i},[i,t,o]),{client:i,effects:s}},_m=(t,e,r,o)=>{let{get:i}=o.args[0],s=it(t.subscribe,()=>i(t),()=>i(t)),n=ll(o),a=G(()=>Fs({name:r,...n},()=>s),[r,n,s]);return e[r]=a,a},Sm=(t,e)=>{if(ni){let[a]=z(()=>e.map(([d])=>d).join(",")),l=e.find(([,d])=>!ai(d));if(l)throw new Error(`Scope "${l[0]}" is a root scope but this useAui mounted derived-only; remount with a new key to change scope kinds.`);let c=e.map(([d])=>d).join(",");if(c!==a)throw new Error(`A derived-only config mounted scopes [${a}] but now has [${c}]; remount with a new key to change the scope set.`)}let r=F({parent:t,current:null}).current,o=function(a,l){if(!this)throw new Error("const { on } = useAui() is not supported. Use aui.on() instead.");let{scope:c,event:d}=zr(a);if(c==="*")return t.on(a,l);let h=a[Ws];if(!h&&Qo(this[c]))throw new Error(`Scope "${c}" is not available. Use { scope: "*", event: "${d}" } to listen globally.`);return t.on({scope:c,event:d,[Ws]:h??r},l)},i=al(t,{subscribe:t.subscribe,on:o}),s=e.map(([a,l])=>_m(t,i,a,l)),n=cl(i,[t,...s]);return Vt(()=>{r.parent=t,r.current=n},[n,t,r]),n},Tm=(t,e)=>{let r=v(8),o;r[0]!==e||r[1]!==t?(o=Object.entries(mm(e,t)),r[0]=e,r[1]=t,r[2]=o):o=r[2];let i=o,s;r[3]!==i?(s=()=>i.length===0||i.some(Im),r[3]=i,r[4]=s):s=r[4];let[n]=z(s),a;return r[5]!==i||r[6]!==n?(a={entries:i,rooted:n},r[5]=i,r[6]=n,r[7]=a):a=r[7],a},ul=(t,e,r,o)=>{let{entries:i,rooted:s}=Tm(t,e);return s?r({parent:t,entries:i,destroySignal:o}):{client:Sm(t,i)}},pl=(t,e,r)=>ul(t,e,xm,r);function U(t){let e=Vr();if(t){let r=oi(),{client:o,effects:i}=ul(e,t,ym,r);return i&&Ja(o,i),o}return e}function km(t){let[e,r]=t;return oe(e,bm(e,r))}function Im(t){let[,e]=t;return!ai(e)}var Cm=t=>{let e;class r extends mt{get(s,n){let a=He(n,"OptionalAssistantState");if(a!==!1)return a;let l=n;if(!ht(l)&&Et(t[l]))return Gs(t[l]())}ownKeys(){return $r(t)}has(s,n){return!ht(n)&&n in t}}class o extends mt{get(s,n){let a=He(n,"AssistantState");if(a!==!1)return a;if(n==="optional")return e??(e=new Proxy({},new r));let l=n;if(!ht(l))return Gs(t[l]())}ownKeys(){return[...$r(t),"optional"]}has(s,n){return n==="optional"||!ht(n)&&n in t}}return new Proxy({},new o)},ml=new WeakMap,hl=t=>{let e=ml.get(t);return e||(e=Cm(t),ml.set(t,e)),e};var P=t=>{let e=v(6),r=U(),o;e[0]!==r?(o=hl(r),e[0]=r,e[1]=o):o=e[1];let i=o,s,n;e[2]!==i||e[3]!==t?(s=()=>t(i),n=()=>t(i),e[2]=i,e[3]=t,e[4]=s,e[5]=n):(s=e[4],n=e[5]);let a=it(r.subscribe,s,n);if(typeof a=="object"&&a!==null&&(a===i||a===i.optional))throw new Error("You tried to return the entire AssistantState. This is not supported due to technical limitations.");return Is(a),a};var Ks=t=>{let e=v(3),{get:r}=t,o=U(),i;return e[0]!==o||e[1]!==r?(i=()=>r(o),e[0]=o,e[1]=r,e[2]=i):i=e[2],P(i)},ne=j(Ks);var fl=t=>{if(t.key===void 0)throw new Error("useClientLookup: Element has no key");return t.key};function Ie(t){let e=v(12),r;e[0]!==t?(r=t.map(Am),e[0]=t,e[1]=r):r=e[1];let o=qt(r),i;e[2]!==t?(i=t.reduce(Rm,Object.create(null)),e[2]=t,e[3]=i):i=e[3];let s=i,n;e[4]!==o?(n=o.map(Em),e[4]=o,e[5]=n):n=e[5];let a=n,l;e[6]!==s||e[7]!==o?(l=d=>{if("index"in d){if(d.index<0||d.index>=o.length)throw new Error(`useClientLookup: index ${d.index} out of bounds (length: ${o.length}) (ignore if recovered)`);return o[d.index].methods}let h=s[d.key];if(h===void 0)throw new Error(`useClientLookup: key "${d.key}" not found (ignore if recovered)`);return o[h].methods},e[6]=s,e[7]=o,e[8]=l):l=e[8];let c;return e[9]!==a||e[10]!==l?(c={state:a,get:l},e[9]=a,e[10]=l,e[11]=c):c=e[11],c}function Em(t){return t.state}function Rm(t,e,r){return t[fl(e)]=r,t}function Am(t){return oe(fl(t),si(t),t.deps)}var li=(t,e=0)=>e===0?Math.abs(t.scrollHeight-t.scrollTop-t.clientHeight)<=1||t.scrollHeight<=t.clientHeight:t.scrollHeight-e-t.scrollTop-t.clientHeight<=1||t.scrollHeight-e<=t.clientHeight,Js=(t,e=0)=>e===0?t.scrollHeight>t.clientHeight+1:t.scrollHeight-e>t.clientHeight+1,Qs=(t,e)=>t.scrollTop>e.scrollTop&&t.scrollHeight===e.scrollHeight;var ye=Symbol("skip-update"),Ye=(t,...e)=>{let r=[];for(let o of t)try{o(...e)}catch(i){r.push(i)}if(r.length===1)throw r[0];if(r.length>1){for(let o of r)console.error(o);throw new AggregateError(r)}},ci=t=>{Ye(t)},gl=(t,e)=>t===void 0||e===void 0?t===e:xe(t,e),hr=class{constructor(){f(this,"_subscribers",new Set)}subscribe(t){return this._subscribers.add(t),()=>this._subscribers.delete(t)}waitForUpdate(){return new Promise(t=>{let e=this.subscribe(()=>{e(),t()})})}_notifySubscribers(){Ye(this._subscribers)}};var di=class{constructor(){f(this,"_subscriptions",new Set);f(this,"_connection")}get isConnected(){return!!this._connection}notifySubscribers(t,e){if(e){le(this._subscriptions,t,e);return}Ye(this._subscriptions,t)}_updateConnection(){if(this._subscriptions.size>0){if(this._connection)return;this._connection=this._connect()}else{let t=this._connection;this._connection=void 0,t?.()}}subscribe(t){return this._subscriptions.add(t),this._updateConnection(),()=>{this._subscriptions.delete(t),this._updateConnection()}}},_e=class extends di{constructor(e){super();f(this,"binding");f(this,"_previousState");f(this,"getState",()=>(this.isConnected||this._syncState(),this._previousState));this.binding=e;let r=e.getState();if(r===ye)throw new Error("Entry not available in the store");this._previousState=r}get path(){return this.binding.path}_syncState(){let e=this.binding.getState();return e===ye||gl(e,this._previousState)?!1:(this._previousState=e,!0)}_connect(){let e=()=>{this._syncState()&&this.notifySubscribers()},r=this.binding.subscribe(e);return this._syncState(),r}},Kr=class extends di{constructor(e){super();f(this,"binding");f(this,"_previousStateDirty",!0);f(this,"_previousState");f(this,"getState",()=>{if(!this.isConnected||this._previousStateDirty){let e=this.binding.getState();e!==ye&&(this._previousState===void 0||!gl(e,this._previousState))&&(this._previousState=e),this._previousStateDirty=!1}if(this._previousState===void 0)throw new Error("Entry not available in the store");return this._previousState});this.binding=e}get path(){return this.binding.path}_connect(){let e=()=>{this._previousStateDirty=!0,this.notifySubscribers()},r=this.binding.subscribe(e);return this._previousStateDirty=!0,r}},Gt=class extends di{constructor(e){super();f(this,"binding");this.binding=e}get path(){return this.binding.path}getState(){return this.binding.getState()}outerSubscribe(e){return this.binding.subscribe(e)}_connect(){let e=()=>{this.notifySubscribers()},r=this.binding.getState(),o=r?.subscribe(e),i=()=>{let n=this.binding.getState();if(n===r)return;r=n;let a=o;o=void 0;try{a?.()}finally{o=n?.subscribe(e),e()}},s=this.outerSubscribe(i);return()=>ci([()=>s?.(),()=>o?.()])}},ui=class extends di{constructor(e){super();f(this,"config");this.config=e}getState(){return this.config.binding.getState()}outerSubscribe(e){return this.config.binding.subscribe(e)}_connect(){let e=`Runtime event "${this.config.event}"`,r=a=>{this.notifySubscribers(a,e)},o=this.config.binding.getState(),i=o?.unstable_on(this.config.event,r),s=()=>{let a=this.config.binding.getState();if(a===o)return;o=a;let l=i;i=void 0;try{l?.()}finally{i=a?.unstable_on(this.config.event,r)}},n=this.outerSubscribe(s);return()=>ci([()=>n?.(),()=>i?.()])}};var pi=class{constructor(){f(this,"_providers",new Map);f(this,"_providerUnsubscribes",new Map);f(this,"_subscribers",new Set)}getModelContext(){return Va(new Set(this._providers.values()))}registerModelContextProvider(t){let e=Symbol();this._providers.set(e,t);let r;try{r=t.subscribe?.(()=>{this.notifySubscribers()})}catch(i){this._providers.delete(e);try{this.notifySubscribers()}catch(s){console.error(s)}throw i}this._providerUnsubscribes.set(e,r),this.notifySubscribers();let o=!1;return()=>{if(o)return;o=!0,this._providers.delete(e);let i=this._providerUnsubscribes.get(e);this._providerUnsubscribes.delete(e);let s=!1,n,a=l=>{try{l()}catch(c){s?console.error(c):(s=!0,n=c)}};if(i&&a(i),a(()=>this.notifySubscribers()),s)throw n}}notifySubscribers(){Ye(this._subscribers)}subscribe(t){return this._subscribers.add(t),()=>{this._subscribers.delete(t)}}};var Ys=[],Mm={modelName:void 0,toolNames:Ys},Pm=(t,e)=>t===e||xe(t,e),mi=(t,e)=>{let r=t.getModelContext(),o=r.config?.modelName,i=r.tools?Object.keys(r.tools).sort():Ys,s=i.length?i:Ys;return o===e.modelName&&Pm(s,e.toolNames)?e:{modelName:o,toolNames:s}},Dm=()=>{let t=v(11),e;t[0]===Symbol.for("react.memo_cache_sentinel")?(e=new pi,t[0]=e):e=t[0];let r=e,o;t[1]===Symbol.for("react.memo_cache_sentinel")?(o=()=>mi(r,Mm),t[1]=o):o=t[1];let[i,s]=z(o),n,a;t[2]===Symbol.for("react.memo_cache_sentinel")?(n=()=>(s(p=>mi(r,p)),r.subscribe(()=>{s(p=>mi(r,p))})),a=[r],t[2]=n,t[3]=a):(n=t[2],a=t[3]),D(n,a);let l;t[4]!==i?(l=()=>mi(r,i),t[4]=i,t[5]=l):l=t[5];let c,d,h;t[6]===Symbol.for("react.memo_cache_sentinel")?(c=()=>r.getModelContext(),d=p=>r.subscribe(p),h=p=>r.registerModelContextProvider(p),t[6]=c,t[7]=d,t[8]=h):(c=t[6],d=t[7],h=t[8]);let u;return t[9]!==l?(u={getState:l,getModelContext:c,subscribe:d,register:h},t[9]=l,t[10]=u):u=t[10],u},hi=j(Dm);var vl=(t,e)=>{if(!(e.status?.type==="running"||e.status?.type==="requires-action")){let o=t.complete;return typeof o!="function"?o??null:o({args:e.args,result:e.result})}let r=t.running;return typeof r!="function"?r??null:r({args:e.args})};var bl=t=>t.display!==void 0?t.display==="standalone":t.type==="human",wl=t=>function(r){return vl(t,r)};var xl=t=>{let e=v(16),{toolkit:r,mcpApp:o}=t,i;e[0]!==o?(i=o?[oe("mcpApp",o)]:[],e[0]=o,e[1]=i):i=e[1];let s=qt(i)[0],[n,a]=z(Om),l;e[2]!==s||e[3]!==n?(l={toolUIs:n,mcpApp:s},e[2]=s,e[3]=n,e[4]=l):l=e[4];let c=l,d=Hr(),h;e[5]===Symbol.for("react.memo_cache_sentinel")?(h=(x,T,I)=>{let k={render:T,renderText:I?.renderText,standalone:I?.standalone??!1};return a(E=>{let R=me(E);return R[x]=[...R[x]??[],k],R}),()=>{a(E=>{let R=E[x]?.filter(M=>M!==k)??[],y=me(E);return R.length>0?(y[x]=R,y):(delete y[x],y)})}},e[5]=h):h=e[5];let u=h,p,m;e[6]!==r?(p=()=>{if(!r)return;let x=[];for(let[T,I]of Object.entries(r)){let k="render"in I?I.render:void 0,E="renderText"in I?I.renderText:void 0,R=k??(E?wl(E):void 0);R&&x.push(u(T,R,{standalone:bl(I),renderText:E}))}return()=>{x.forEach(Nm)}},m=[r,u],e[6]=r,e[7]=p,e[8]=m):(p=e[7],m=e[8]),D(p,m);let g;e[9]!==d||e[10]!==r?(g=()=>{if(!r)return;let x=Object.entries(r).reduce(Bm,me());return d.current.modelContext().register({getModelContext:()=>({tools:x})})},e[9]=d,e[10]=r,e[11]=g):g=e[11];let w;e[12]!==r?(w=[r],e[12]=r,e[13]=w):w=e[13],Gr("modelContext",g,w);let _;return e[14]!==c?(_={getState:()=>c,setToolUI:u},e[14]=c,e[15]=_):_=e[15],_},yl=j(xl);Ur(xl,(t,e)=>{!t.modelContext&&e.modelContext.source===null&&(t.modelContext=hi())});function Om(){return me()}function Nm(t){return t()}function Bm(t,e){let[r,o]=e;if(o.type==="mcp")return t;let{display:i,render:s,renderText:n,...a}=o;return t[r]=a,t}var Ce=t=>it(t.subscribe,t.getState,t.getServerSnapshot);var $m=Symbol.for("assistant-ui.silent-runtime-action"),_l=t=>typeof t=="object"&&t!==null&&$m in t;var fi=(t,e)=>{let r=e();return r.catch(o=>{_l(o)||console.error(`[assistant-ui] ${t} failed:`,o)}),r};var Lm=t=>{let e=v(9),{runtime:r}=t,o=Ce(r),i;e[0]!==o?(i=()=>o,e[0]=o,e[1]=i):i=e[1];let s,n;e[2]!==r?(s=()=>fi("attachment remove",r.remove),n=()=>r,e[2]=r,e[3]=s,e[4]=n):(s=e[3],n=e[4]);let a;return e[5]!==i||e[6]!==s||e[7]!==n?(a={getState:i,remove:s,__internal_getRuntime:n},e[5]=i,e[6]=s,e[7]=n,e[8]=a):a=e[8],a},gi=j(Lm);var jm=t=>{let e=v(5),{runtime:r,index:o}=t,i;e[0]!==o||e[1]!==r?(i=r.getAttachmentByIndex(o),e[0]=o,e[1]=r,e[2]=i):i=e[2];let s=i,n;return e[3]!==s?(n=gi({runtime:s}),e[3]=s,e[4]=n):n=e[4],fe(n)},Fm=j(jm),Vm=({item:t,onMove:e,onRemove:r})=>({getState:()=>t,steer:()=>e({lane:"steer",insertAfter:null}),move:e,remove:r}),Um=j(Vm),zm=t=>{let e=v(63),{threadIdRef:r,messageIdRef:o,runtime:i,isSuggestion:s}=t,n=Ce(i),a=Oe(),l=F(!1),c,d;e[0]!==a||e[1]!==o||e[2]!==i||e[3]!==r?(c=()=>{let O=[],V=i.unstable_on("send",Q=>{let ge=l.current;l.current=!1,a("composer.send",{threadId:r.current,...o&&{messageId:o.current},chars:Q.chars,attachments:Q.attachments,...ge?{suggestion:!0}:void 0})});O.push(V);let Y=i.unstable_on("attachmentAdd",Q=>{a("composer.attachmentAdd",{threadId:r.current,...o&&{messageId:o.current},...Q.contentType?{contentType:Q.contentType}:void 0})});return O.push(Y),O.push(i.unstable_on("attachmentAddError",Q=>{a("composer.attachmentAddError",{threadId:r.current,...o&&{messageId:o.current},...Q.attachmentId&&{attachmentId:Q.attachmentId},reason:Q.reason,message:Q.message,...Q.contentType?{contentType:Q.contentType}:void 0})})),()=>{for(let Q of O)Q()}},d=[i,a,r,o],e[0]=a,e[1]=o,e[2]=i,e[3]=r,e[4]=c,e[5]=d):(c=e[4],d=e[5]),D(c,d);let h;if(e[6]!==i||e[7]!==n.attachments){let O;e[9]!==i?(O=(V,Y)=>oe(V.id,Fm({runtime:i,index:Y}),[i,Y]),e[9]=i,e[10]=O):O=e[10],h=n.attachments.map(O),e[6]=i,e[7]=n.attachments,e[8]=h}else h=e[8];let u=Ie(h),p=n.queue,m;if(e[11]!==p||e[12]!==i){let O;e[14]!==i?(O=V=>oe(V.id,Um({item:V,onMove:Y=>i.moveQueueItem(V.id,Y),onRemove:()=>i.removeQueueItem(V.id)})),e[14]=i,e[15]=O):O=e[15],m=p.map(O),e[11]=p,e[12]=i,e[13]=m}else m=e[13];let g=Ie(m),w=n.type??"thread",_;e[16]!==u.state||e[17]!==p||e[18]!==n.attachmentAccept||e[19]!==n.canCancel||e[20]!==n.canSend||e[21]!==n.dictation||e[22]!==n.isEditing||e[23]!==n.isEmpty||e[24]!==n.quote||e[25]!==n.role||e[26]!==n.runConfig||e[27]!==n.text||e[28]!==w?(_={text:n.text,role:n.role,attachments:u.state,runConfig:n.runConfig,isEditing:n.isEditing,canCancel:n.canCancel,canSend:n.canSend,attachmentAccept:n.attachmentAccept,isEmpty:n.isEmpty,type:w,dictation:n.dictation,quote:n.quote,queue:p},e[16]=u.state,e[17]=p,e[18]=n.attachmentAccept,e[19]=n.canCancel,e[20]=n.canSend,e[21]=n.dictation,e[22]=n.isEditing,e[23]=n.isEmpty,e[24]=n.quote,e[25]=n.role,e[26]=n.runConfig,e[27]=n.text,e[28]=w,e[29]=_):_=e[29];let x=_,T;e[30]!==x?(T=()=>x,e[30]=x,e[31]=T):T=e[31];let I;e[32]!==s||e[33]!==i?(I=O=>{let V=i.getState();l.current=V.canSend&&(s?.(V.text)??!1),i.send(O)},e[32]=s,e[33]=i,e[34]=I):I=e[34];let k;e[35]!==a||e[36]!==o||e[37]!==i||e[38]!==r?(k=()=>{!o&&i.getState().canCancel&&a("composer.cancel",{threadId:r.current}),i.cancel()},e[35]=a,e[36]=o,e[37]=i,e[38]=r,e[39]=k):k=e[39];let E=i.beginEdit??qm,R;e[40]!==u?(R=O=>"id"in O?u.get({key:O.id}):u.get(O),e[40]=u,e[41]=R):R=e[41];let y;e[42]!==g?(y=O=>"id"in O?g.get({key:O.id}):g.get(O),e[42]=g,e[43]=y):y=e[43];let M;e[44]!==i?(M=()=>i,e[44]=i,e[45]=M):M=e[45];let N;return e[46]!==i.addAttachment||e[47]!==i.clearAttachments||e[48]!==i.reset||e[49]!==i.setQuote||e[50]!==i.setRole||e[51]!==i.setRunConfig||e[52]!==i.setText||e[53]!==i.startDictation||e[54]!==i.stopDictation||e[55]!==E||e[56]!==R||e[57]!==y||e[58]!==M||e[59]!==T||e[60]!==I||e[61]!==k?(N={getState:T,setText:i.setText,setRole:i.setRole,setRunConfig:i.setRunConfig,addAttachment:i.addAttachment,reset:i.reset,clearAttachments:i.clearAttachments,send:I,cancel:k,beginEdit:E,startDictation:i.startDictation,stopDictation:i.stopDictation,setQuote:i.setQuote,attachment:R,queueItem:y,__internal_getRuntime:M},e[46]=i.addAttachment,e[47]=i.clearAttachments,e[48]=i.reset,e[49]=i.setQuote,e[50]=i.setRole,e[51]=i.setRunConfig,e[52]=i.setText,e[53]=i.startDictation,e[54]=i.stopDictation,e[55]=E,e[56]=R,e[57]=y,e[58]=M,e[59]=T,e[60]=I,e[61]=k,e[62]=N):N=e[62],N},vi=j(zm);function qm(){throw new Error("beginEdit is not supported in this runtime")}var bi=t=>({get current(){return t()}});var Hm=t=>{let e=v(13),{runtime:r}=t,o=Ce(r),i;e[0]!==o?(i=()=>o,e[0]=o,e[1]=i):i=e[1];let s,n,a,l;e[2]!==r?(s=d=>r.addToolResult(d),n=d=>r.resumeToolCall(d),a=d=>r.respondToToolApproval(d),l=()=>r,e[2]=r,e[3]=s,e[4]=n,e[5]=a,e[6]=l):(s=e[3],n=e[4],a=e[5],l=e[6]);let c;return e[7]!==i||e[8]!==s||e[9]!==n||e[10]!==a||e[11]!==l?(c={getState:i,addToolResult:s,resumeToolCall:n,respondToToolApproval:a,__internal_getRuntime:l},e[7]=i,e[8]=s,e[9]=n,e[10]=a,e[11]=l,e[12]=c):c=e[12],c},Sl=j(Hm);var Gm=t=>{let e=v(5),{runtime:r,index:o}=t,i;e[0]!==o||e[1]!==r?(i=r.getAttachmentByIndex(o),e[0]=o,e[1]=r,e[2]=i):i=e[2];let s=i,n;return e[3]!==s?(n=gi({runtime:s}),e[3]=s,e[4]=n):n=e[4],fe(n)},Wm=j(Gm),Km=t=>{let e=v(5),{runtime:r,index:o}=t,i;e[0]!==o||e[1]!==r?(i=r.getMessagePartByIndex(o),e[0]=o,e[1]=r,e[2]=i):i=e[2];let s=i,n;return e[3]!==s?(n=Sl({runtime:s}),e[3]=s,e[4]=n):n=e[4],fe(n)},Jm=j(Km),Qm=t=>{let e=v(74),{runtime:r,threadIdRef:o,threadId:i}=t,s=Ce(r),n=Oe(),[a,l]=z(!1),[c,d]=z(!1),h;e[0]!==r?(h=bi(()=>r.getState().id),e[0]=r,e[1]=h):h=e[1];let u=h,p=F(s.status),m;e[2]!==n||e[3]!==r||e[4]!==i?(m=W=>{n(W,{threadId:i,messageId:r.getState().id})},e[2]=n,e[3]=r,e[4]=i,e[5]=m):m=e[5];let g=m,w,_;e[6]!==n||e[7]!==s.id||e[8]!==s.status||e[9]!==i?(w=()=>{let W=s.status,yt=p.current;p.current=W,W?.type==="incomplete"&&W.reason==="error"&&(yt?.type!=="incomplete"||yt.reason!=="error")&&n("message.error",{threadId:i,messageId:s.id,reason:"error"})},_=[s.status,s.id,n,i],e[6]=n,e[7]=s.id,e[8]=s.status,e[9]=i,e[10]=w,e[11]=_):(w=e[10],_=e[11]),D(w,_);let x;e[12]!==u||e[13]!==r.composer||e[14]!==o?(x=vi({runtime:r.composer,threadIdRef:o,messageIdRef:u}),e[12]=u,e[13]=r.composer,e[14]=o,e[15]=x):x=e[15];let T=ft(x),I;if(e[16]!==r||e[17]!==s.content){let W;e[19]!==r?(W=(yt,rr)=>oe("toolCallId"in yt&&yt.toolCallId!=null?`toolCallId-${yt.toolCallId}`:`index-${rr}`,Jm({runtime:r,index:rr}),[r,rr]),e[19]=r,e[20]=W):W=e[20],I=s.content.map(W),e[16]=r,e[17]=s.content,e[18]=I}else I=e[18];let k=Ie(I),E;e[21]!==s.attachments?(E=s.attachments??[],e[21]=s.attachments,e[22]=E):E=e[22];let R;if(e[23]!==r||e[24]!==E){let W;e[26]!==r?(W=(yt,rr)=>oe(yt.id,Wm({runtime:r,index:rr}),[r,rr]),e[26]=r,e[27]=W):W=e[27],R=E.map(W),e[23]=r,e[24]=E,e[25]=R}else R=e[25];let y=Ie(R),M=s,N;e[28]!==T.state||e[29]!==a||e[30]!==c||e[31]!==k.state||e[32]!==M?(N={...M,parts:k.state,composer:T.state,isCopied:a,isHovering:c},e[28]=T.state,e[29]=a,e[30]=c,e[31]=k.state,e[32]=M,e[33]=N):N=e[33];let O=N,V;e[34]!==O?(V=()=>O,e[34]=O,e[35]=V):V=e[35];let Y;e[36]!==T.methods?(Y=()=>T.methods,e[36]=T.methods,e[37]=Y):Y=e[37];let Q;e[38]!==r?(Q=()=>r.delete(),e[38]=r,e[39]=Q):Q=e[39];let ge,Re;e[40]!==g||e[41]!==r?(ge=W=>(g("message.reload"),r.reload(W)),Re=()=>(g("message.speak"),r.speak()),e[40]=g,e[41]=r,e[42]=ge,e[43]=Re):(ge=e[42],Re=e[43]);let Ae,Me;e[44]!==r?(Ae=()=>r.stopSpeaking(),Me=W=>r.submitFeedback(W),e[44]=r,e[45]=Ae,e[46]=Me):(Ae=e[45],Me=e[46]);let Pe;e[47]!==g||e[48]!==r?(Pe=W=>(g("message.branchSwitched"),r.switchToBranch(W)),e[47]=g,e[48]=r,e[49]=Pe):Pe=e[49];let De;e[50]!==r?(De=()=>r.unstable_getCopyText(),e[50]=r,e[51]=De):De=e[51];let Ke;e[52]!==k?(Ke=W=>"index"in W?k.get({index:W.index}):k.get({key:`toolCallId-${W.toolCallId}`}),e[52]=k,e[53]=Ke):Ke=e[53];let q;e[54]!==y?(q=W=>"id"in W?y.get({key:W.id}):y.get(W),e[54]=y,e[55]=q):q=e[55];let X;e[56]!==g?(X=W=>{W&&g("message.copied"),l(W)},e[56]=g,e[57]=X):X=e[57];let ve;e[58]!==r?(ve=()=>r,e[58]=r,e[59]=ve):ve=e[59];let tr;return e[60]!==V||e[61]!==Y||e[62]!==Q||e[63]!==ge||e[64]!==Re||e[65]!==Ae||e[66]!==Me||e[67]!==Pe||e[68]!==De||e[69]!==Ke||e[70]!==q||e[71]!==X||e[72]!==ve?(tr={getState:V,composer:Y,delete:Q,reload:ge,speak:Re,stopSpeaking:Ae,submitFeedback:Me,switchToBranch:Pe,getCopyText:De,part:Ke,attachment:q,setIsCopied:X,setIsHovering:d,__internal_getRuntime:ve},e[60]=V,e[61]=Y,e[62]=Q,e[63]=ge,e[64]=Re,e[65]=Ae,e[66]=Me,e[67]=Pe,e[68]=De,e[69]=Ke,e[70]=q,e[71]=X,e[72]=ve,e[73]=tr):tr=e[73],tr},Tl=j(Qm);var Ym=t=>{let e=G(()=>({}),[]),r=e.state,o=[];t.suggestions.forEach(s=>{let n=r?.suggestions[o.length];o.push(n&&xe(n,s)?n:s)});let i=r&&xe(o,r.suggestions)?r:{suggestions:o};return e.state=i,i},Xm=t=>({getState:()=>t}),Zm=j(Xm),kl=t=>{let e=v(9),r=Ym(t),o;e[0]!==r.suggestions?(o=r.suggestions.map(rh),e[0]=r.suggestions,e[1]=o):o=e[1];let i=Ie(o),s;e[2]!==r?(s=()=>r,e[2]=r,e[3]=s):s=e[3];let n;e[4]!==i?(n=l=>{let{index:c}=l;return i.get({index:c})},e[4]=i,e[5]=n):n=e[5];let a;return e[6]!==s||e[7]!==n?(a={getState:s,suggestion:n},e[6]=s,e[7]=n,e[8]=a):a=e[8],a},eh=t=>{let e=v(6),r;e[0]!==t?(r=t??[],e[0]=t,e[1]=r):r=e[1];let o;e[2]!==r?(o=r.map(oh),e[2]=r,e[3]=o):o=e[3];let i;return e[4]!==o?(i={suggestions:o},e[4]=o,e[5]=i):i=e[5],kl(i)},u1=j(eh),th=t=>{let e=v(4),r;e[0]!==t?(r=t.map(ih),e[0]=t,e[1]=r):r=e[1];let o;return e[2]!==r?(o={suggestions:r},e[2]=r,e[3]=o):o=e[3],kl(o)},Il=j(th);function rh(t,e){return oe(e,Zm(t),[t])}function oh(t){return typeof t=="string"?{title:t,label:"",prompt:t}:{title:t.title,label:t.label,prompt:t.prompt}}function ih(t){return{title:t.title??t.prompt,label:t.label??"",prompt:t.prompt}}var Xe=Object.freeze({type:"complete"}),wi=Object.freeze({type:"running"}),sh=Object.freeze({cancelled:Object.freeze({type:"incomplete",reason:"cancelled"}),length:Object.freeze({type:"incomplete",reason:"length"}),"content-filter":Object.freeze({type:"incomplete",reason:"content-filter"}),other:Object.freeze({type:"incomplete",reason:"other"}),error:Object.freeze({type:"incomplete",reason:"error"})}),nh=t=>{let e=t.status;if(!e||typeof e!="object")return;let{type:r}=e;if(r==="running")return wi;if(r==="complete")return Xe;if(r!=="incomplete")return;let{reason:o}=e;return sh[o==="cancelled"||o==="length"||o==="content-filter"||o==="other"||o==="error"?o:"other"]},xi=(t,e,r)=>{if(t.role!=="assistant")return Xe;if(r.type==="tool-call")return r.result===void 0?t.status:Xe;if(t.status.type==="running"){let i=nh(r);if(i)return i}let o=e===Math.max(0,t.content.length-1);return t.status.type==="requires-action"?Xe:o?t.status:Xe};var ah=t=>"reason"in t?t.reason:void 0,lh=t=>"error"in t?t.error:void 0,ch=32,Cl=new WeakMap,Xs=t=>Cl.get(t)??t.id,dh=(t,e,r)=>"status"in t&&t.status?xi(t,e,r):Xe,El=()=>{let t=[],e=new Map;return r=>{let o=[],i=new Map,s=!0,n=(l,c,d,h)=>{if(!(d>ch))for(let[u,p]of l.entries())for(let[m,g]of p.content.entries()){if(g.type!=="tool-call"||g.messages===void 0)continue;let w=g.messages,_=dh(p,m,g),x=ah(_),T=lh(_),I=`${h}${u}.${m}`,k=e.get(I),E=k?.part===g&&k.statusType===_.type&&k.statusReason===x&&Object.is(k.statusError,T)&&k.messages===w&&k.task.messageId===p.id&&k.task.parentTaskId===c&&k.task.depth===d?k.task:{id:g.toolCallId,toolName:g.toolName,args:g.args,result:g.result,...g.isError===void 0?void 0:{isError:g.isError},status:_,timing:g.timing,messageId:p.id,parentTaskId:c,depth:d,messages:w};E!==k?.task&&(s=!1,Cl.set(E,I)),o.push(E),i.set(I,{task:E,part:g,statusType:_.type,statusReason:x,statusError:T,messages:w}),n(w,E.id,d+1,`${I}.`)}};n(r,null,0,"");let a=s&&o.length===t.length&&o.every((l,c)=>l===t[c])?t:o;return t=a,e=i,a}},uh=({task:t})=>({getState:()=>t}),Rl=j(uh);var ph=t=>{let e=v(7),{runtime:r,id:o,threadIdRef:i,threadId:s}=t,n;e[0]!==o||e[1]!==r?(n=r.getMessageById(o),e[0]=o,e[1]=r,e[2]=n):n=e[2];let a=n,l;return e[3]!==a||e[4]!==s||e[5]!==i?(l=Tl({runtime:a,threadIdRef:i,threadId:s}),e[3]=a,e[4]=s,e[5]=i,e[6]=l):l=e[6],fe(l)},mh=j(ph),hh=t=>{let e=v(93),{runtime:r}=t,o=Ce(r),i=Oe(),s,n;e[0]!==i||e[1]!==r?(s=()=>{let q=[];for(let X of["runStart","runEnd","initialize","modelContextUpdate"]){let ve=r.unstable_on(X,()=>{let tr=r.getState()?.threadId||"unknown";i(`thread.${X}`,{threadId:tr})});q.push(ve)}return q.push(r.unstable_on("toolApprovalAnswered",X=>{let ve=r.getState()?.threadId||"unknown";i("thread.toolApprovalAnswered",{threadId:ve,...X})})),()=>{for(let X of q)X()}},n=[r,i],e[0]=i,e[1]=r,e[2]=s,e[3]=n):(s=e[2],n=e[3]),D(s,n);let a;e[4]!==r?(a=bi(()=>r.getState().threadId),e[4]=r,e[5]=a):a=e[5];let l=a,c;e[6]!==i||e[7]!==r?(c=q=>{i(q,{threadId:r.getState().threadId})},e[6]=i,e[7]=r,e[8]=c):c=e[8];let d=c,h;e[9]!==r?(h=q=>r.getState().suggestions.some(X=>X.prompt===q),e[9]=r,e[10]=h):h=e[10];let u=h,p;e[11]!==u||e[12]!==r.composer||e[13]!==l?(p=vi({runtime:r.composer,threadIdRef:l,isSuggestion:u}),e[11]=u,e[12]=r.composer,e[13]=l,e[14]=p):p=e[14];let m=ft(p),g;e[15]!==o.suggestions?(g=Il(o.suggestions),e[15]=o.suggestions,e[16]=g):g=e[16];let w=ft(g),_;e[17]===Symbol.for("react.memo_cache_sentinel")?(_=El(),e[17]=_):_=e[17];let x=_,T;e[18]!==o.messages?(T=x(o.messages),e[18]=o.messages,e[19]=T):T=e[19];let I=T,k;e[20]!==I?(k=I.map(fh),e[20]=I,e[21]=k):k=e[21];let E=Ie(k),R;if(e[22]!==r||e[23]!==o.messages||e[24]!==o.threadId||e[25]!==l){let q;e[27]!==r||e[28]!==o.threadId||e[29]!==l?(q=X=>oe(X.id,mh({runtime:r,id:X.id,threadIdRef:l,threadId:o.threadId}),[r,X.id,l,o.threadId]),e[27]=r,e[28]=o.threadId,e[29]=l,e[30]=q):q=e[30],R=o.messages.map(q),e[22]=r,e[23]=o.messages,e[24]=o.threadId,e[25]=l,e[26]=R}else R=e[26];let y=Ie(R),M=y.state.length===0&&!o.isLoading,N;e[31]!==m.state||e[32]!==y.state||e[33]!==o.capabilities||e[34]!==o.extras||e[35]!==o.isDisabled||e[36]!==o.isLoading||e[37]!==o.isRunning||e[38]!==o.speech||e[39]!==o.state||e[40]!==o.suggestions||e[41]!==o.voice||e[42]!==M||e[43]!==I?(N={isEmpty:M,isDisabled:o.isDisabled,isLoading:o.isLoading,isRunning:o.isRunning,capabilities:o.capabilities,state:o.state,suggestions:o.suggestions,extras:o.extras,speech:o.speech,voice:o.voice,composer:m.state,messages:y.state,tasks:I},e[31]=m.state,e[32]=y.state,e[33]=o.capabilities,e[34]=o.extras,e[35]=o.isDisabled,e[36]=o.isLoading,e[37]=o.isRunning,e[38]=o.speech,e[39]=o.state,e[40]=o.suggestions,e[41]=o.voice,e[42]=M,e[43]=I,e[44]=N):N=e[44];let O=N,V;e[45]!==O?(V=()=>O,e[45]=O,e[46]=V):V=e[46];let Y;e[47]!==m.methods?(Y=()=>m.methods,e[47]=m.methods,e[48]=Y):Y=e[48];let Q;e[49]!==w?(Q=()=>w.methods,e[49]=w,e[50]=Q):Q=e[50];let ge;e[51]!==E||e[52]!==I?(ge=q=>{if("id"in q){let X=I.find(ve=>ve.id===q.id);return E.get({key:X?Xs(X):q.id})}return E.get(q)},e[51]=E,e[52]=I,e[53]=ge):ge=e[53];let Re;e[54]!==i||e[55]!==u||e[56]!==r?(Re=q=>{let X=typeof q=="string"?{content:[{type:"text",text:q}]}:q;if((X.role??"user")==="user"){let ve=X.content.map(gh).join("");i("composer.send",{threadId:r.getState().threadId,chars:ve.length,attachments:X.attachments?.length??0,...u(ve)?{suggestion:!0}:void 0})}r.append(q)},e[54]=i,e[55]=u,e[56]=r,e[57]=Re):Re=e[57];let Ae;e[58]!==d||e[59]!==r||e[60]!==o.isRunning?(Ae=()=>{o.isRunning&&d("thread.cancelRun"),r.cancelRun()},e[58]=d,e[59]=r,e[60]=o.isRunning,e[61]=Ae):Ae=e[61];let Me;e[62]!==d||e[63]!==r?(Me=()=>{r.connectVoice(),d("thread.voiceStarted")},e[62]=d,e[63]=r,e[64]=Me):Me=e[64];let Pe;e[65]!==y?(Pe=q=>"id"in q?y.get({key:q.id}):y.get(q),e[65]=y,e[66]=Pe):Pe=e[66];let De;e[67]!==r?(De=()=>r,e[67]=r,e[68]=De):De=e[68];let Ke;return e[69]!==r.deleteMessage||e[70]!==r.disconnectVoice||e[71]!==r.export||e[72]!==r.getModelContext||e[73]!==r.getVoiceVolume||e[74]!==r.import||e[75]!==r.importExternalState||e[76]!==r.muteVoice||e[77]!==r.reset||e[78]!==r.resumeRun||e[79]!==r.startRun||e[80]!==r.stopSpeaking||e[81]!==r.subscribeVoiceVolume||e[82]!==r.unmuteVoice||e[83]!==V||e[84]!==Y||e[85]!==Q||e[86]!==ge||e[87]!==Re||e[88]!==Ae||e[89]!==Me||e[90]!==Pe||e[91]!==De?(Ke={getState:V,composer:Y,suggestions:Q,task:ge,append:Re,deleteMessage:r.deleteMessage,startRun:r.startRun,resumeRun:r.resumeRun,importExternalState:r.importExternalState,cancelRun:Ae,getModelContext:r.getModelContext,export:r.export,import:r.import,reset:r.reset,stopSpeaking:r.stopSpeaking,connectVoice:Me,disconnectVoice:r.disconnectVoice,getVoiceVolume:r.getVoiceVolume,subscribeVoiceVolume:r.subscribeVoiceVolume,muteVoice:r.muteVoice,unmuteVoice:r.unmuteVoice,message:Pe,__internal_getRuntime:De},e[69]=r.deleteMessage,e[70]=r.disconnectVoice,e[71]=r.export,e[72]=r.getModelContext,e[73]=r.getVoiceVolume,e[74]=r.import,e[75]=r.importExternalState,e[76]=r.muteVoice,e[77]=r.reset,e[78]=r.resumeRun,e[79]=r.startRun,e[80]=r.stopSpeaking,e[81]=r.subscribeVoiceVolume,e[82]=r.unmuteVoice,e[83]=V,e[84]=Y,e[85]=Q,e[86]=ge,e[87]=Re,e[88]=Ae,e[89]=Me,e[90]=Pe,e[91]=De,e[92]=Ke):Ke=e[92],Ke},Al=j(hh);function fh(t){return oe(Xs(t),Rl({task:t}),[t])}function gh(t){return t.type==="text"?t.text:""}var Ze=(t,e)=>fi(`thread list ${t}`,e);var vh=t=>{let e=v(35),{runtime:r,mainThreadIsRunning:o}=t,i=o===void 0?!1:o,s=Ce(r),n;e:{let M=s.isRunning||s.isMain&&i;if(M===s.isRunning){n=s;break e}let N;e[0]!==M||e[1]!==s?(N={...s,isRunning:M},e[0]=M,e[1]=s,e[2]=N):N=e[2],n=N}let a=n,l=Oe(),{isMain:c,id:d}=s,h;e[3]!==c||e[4]!==d?(h={isMain:c,threadId:d},e[3]=c,e[4]=d,e[5]=h):h=e[5];let u=F(h),p,m;e[6]!==l||e[7]!==c||e[8]!==d?(p=()=>{let M=u.current;M.isMain===c&&M.threadId===d||(u.current={isMain:c,threadId:d},l(c?"threadListItem.switchedTo":"threadListItem.switchedAway",{threadId:d}))},m=[c,d,l],e[6]=l,e[7]=c,e[8]=d,e[9]=p,e[10]=m):(p=e[9],m=e[10]),D(p,m);let g;e[11]!==a?(g=()=>a,e[11]=a,e[12]=g):g=e[12];let w,_,x,T,I,k,E;e[13]!==r?(I=M=>Ze("switch",()=>r.switchTo(M)),k=M=>Ze("rename",()=>r.rename(M)),E=M=>Ze("update custom metadata",()=>r.updateCustom(M)),w=()=>Ze("archive",()=>r.archive()),_=()=>Ze("unarchive",()=>r.unarchive()),x=()=>Ze("delete",()=>r.delete()),T=M=>Ze("generate title",()=>r.generateTitle(M)),e[13]=r,e[14]=w,e[15]=_,e[16]=x,e[17]=T,e[18]=I,e[19]=k,e[20]=E):(w=e[14],_=e[15],x=e[16],T=e[17],I=e[18],k=e[19],E=e[20]);let R;e[21]!==r?(R=()=>r,e[21]=r,e[22]=R):R=e[22];let y;return e[23]!==r.detach||e[24]!==r.initialize||e[25]!==w||e[26]!==_||e[27]!==x||e[28]!==T||e[29]!==R||e[30]!==g||e[31]!==I||e[32]!==k||e[33]!==E?(y={getState:g,switchTo:I,rename:k,updateCustom:E,archive:w,unarchive:_,delete:x,generateTitle:T,initialize:r.initialize,detach:r.detach,__internal_getRuntime:R},e[23]=r.detach,e[24]=r.initialize,e[25]=w,e[26]=_,e[27]=x,e[28]=T,e[29]=R,e[30]=g,e[31]=I,e[32]=k,e[33]=E,e[34]=y):y=e[34],y},Ml=j(vh);var Pl=t=>{let e=v(4),r=Oe(),o=F(t),i,s;e[0]!==r||e[1]!==t?(i=()=>{let n=o.current;n!==t&&(o.current=t,r("threads.selectionChanged",{threadId:t,previousThreadId:n}))},s=[t,r],e[0]=r,e[1]=t,e[2]=i,e[3]=s):(i=e[2],s=e[3]),D(i,s)};var bh=t=>{let e=v(6),{runtime:r,id:o,mainThreadIsRunning:i}=t,s;e[0]!==o||e[1]!==r?(s=r.getItemById(o),e[0]=o,e[1]=r,e[2]=s):s=e[2];let n=s,a;return e[3]!==i||e[4]!==n?(a=Ml({runtime:n,mainThreadIsRunning:i}),e[3]=i,e[4]=n,e[5]=a):a=e[5],fe(a)},wh=j(bh),xh=t=>{let e=v(48),{runtime:r,__internal_assistantRuntime:o}=t,i=Ce(r);Pl(i.mainThreadId);let s=Oe(),n,a;e[0]!==s||e[1]!==r?(n=()=>r.unstable_subscribeThreadEvents(N=>{let{threadId:O,type:V}=N;O!==r.getState().mainThreadId&&s(`thread.${V}`,{threadId:O})}),a=[r,s],e[0]=s,e[1]=r,e[2]=n,e[3]=a):(n=e[2],a=e[3]),D(n,a);let l;e[4]!==r.main?(l=Al({runtime:r.main}),e[4]=r.main,e[5]=l):l=e[5];let c=ft(l),d;e[6]!==c.state||e[7]!==r||e[8]!==i.threadItems?(d=Object.keys(i.threadItems).map(N=>oe(N,wh({runtime:r,id:N,mainThreadIsRunning:c.state.isRunning}),[r,N,c.state.isRunning])),e[6]=c.state,e[7]=r,e[8]=i.threadItems,e[9]=d):d=e[9];let h=Ie(d),u=i.newThreadId??null,p;e[10]!==c.state||e[11]!==i.archivedThreadIds||e[12]!==i.hasMore||e[13]!==i.isLoading||e[14]!==i.isLoadingMore||e[15]!==i.loadError||e[16]!==i.mainThreadId||e[17]!==i.threadIds||e[18]!==u||e[19]!==h.state?(p={mainThreadId:i.mainThreadId,newThreadId:u,isLoading:i.isLoading,loadError:i.loadError,isLoadingMore:i.isLoadingMore,hasMore:i.hasMore,threadIds:i.threadIds,archivedThreadIds:i.archivedThreadIds,threadItems:h.state,main:c.state},e[10]=c.state,e[11]=i.archivedThreadIds,e[12]=i.hasMore,e[13]=i.isLoading,e[14]=i.isLoadingMore,e[15]=i.loadError,e[16]=i.mainThreadId,e[17]=i.threadIds,e[18]=u,e[19]=h.state,e[20]=p):p=e[20];let m=p,g;e[21]!==m?(g=()=>m,e[21]=m,e[22]=g):g=e[22];let w;e[23]!==c.methods?(w=()=>c.methods,e[23]=c.methods,e[24]=w):w=e[24];let _;e[25]!==m||e[26]!==h?(_=N=>{if(N==="main")return h.get({key:m.mainThreadId});if("id"in N)return h.get({key:N.id});let{index:O,archived:V}=N,Y=V!==void 0&&V?m.archivedThreadIds[O]:m.threadIds[O];return h.get({key:Y})},e[25]=m,e[26]=h,e[27]=_):_=e[27];let x,T,I,k,E,R;e[28]!==r?(x=(N,O)=>Ze("switch",()=>r.switchToThread(N,O)),T=()=>Ze("create",()=>r.switchToNewThread()),I=()=>r.getLoadThreadsPromise(),k=()=>r.reload(),E=()=>r.reloadMainThread(),R=()=>r.loadMore(),e[28]=r,e[29]=x,e[30]=T,e[31]=I,e[32]=k,e[33]=E,e[34]=R):(x=e[29],T=e[30],I=e[31],k=e[32],E=e[33],R=e[34]);let y;e[35]!==o?(y=()=>o,e[35]=o,e[36]=y):y=e[36];let M;return e[37]!==x||e[38]!==T||e[39]!==I||e[40]!==k||e[41]!==E||e[42]!==R||e[43]!==y||e[44]!==g||e[45]!==w||e[46]!==_?(M={getState:g,thread:w,item:_,switchToThread:x,switchToNewThread:T,getLoadThreadsPromise:I,reload:k,reloadMainThread:E,loadMore:R,__internal_getAssistantRuntime:y},e[37]=x,e[38]=T,e[39]=I,e[40]=k,e[41]=E,e[42]=R,e[43]=y,e[44]=g,e[45]=w,e[46]=_,e[47]=M):M=e[47],M},Dl=j(xh);var Ol=(t,e)=>{t.thread??(t.thread=ne({source:"threads",query:{type:"main"},get:r=>r.threads.thread("main")})),t.threadListItem??(t.threadListItem=ne({source:"threads",query:{type:"main"},get:r=>r.threads.item("main")})),t.composer??(t.composer=ne({source:"thread",query:{},get:r=>r.threads.thread("main").composer()})),!t.modelContext&&e.modelContext.source===null&&(t.modelContext=hi()),!t.suggestions&&e.suggestions.source===null&&(t.suggestions=ne({source:"thread",query:{},get:r=>r.thread.suggestions()}))};var Nl=t=>{let e=v(7),r=Hr(),o;e[0]!==r||e[1]!==t?(o=()=>t.registerModelContextProvider(r.current.modelContext()),e[0]=r,e[1]=t,e[2]=o):o=e[2];let i;e[3]!==t?(i=[t],e[3]=t,e[4]=i):i=e[4],Gr("modelContext",o,i);let s;return e[5]!==t?(s=Dl({runtime:t.threads,__internal_assistantRuntime:t}),e[5]=t,e[6]=s):s=e[6],fe(s)},Bl=j(Nl),yh=(t,e)=>{Ol(t,e),!t.tools&&e.tools.source===null&&(t.tools=yl({})),!t.dataRenderers&&e.dataRenderers.source===null&&(t.dataRenderers=Fa())};Ur(Nl,yh);var fr=$("react/jsx-runtime"),_h=se({}),$l=({effects:t})=>{"use no memo";return Ue(t),null},ce=re(function(e,r){"use no memo";let{config:o,children:i}=e,s="extends"in e,n="value"in e,a=Vr();if(ni){if(s&&n)throw new Error("AuiProvider: pass either `extends` or `value`, not both.");if(s&&e.extends===void 0)throw new Error("AuiProvider: `extends` must be a client or null, not undefined.");if(s&&!o)throw new Error("AuiProvider: `extends` requires a `config`.");if(n&&o)throw new Error("AuiProvider: pass either `value` or `config`, not both.");if(!n&&!o)throw new Error("AuiProvider: a `config` is required.");if(!s&&!n&&a!==Rt)throw new Error("A parent AuiProvider exists \u2014 pass extends={aui} to inherit it or extends={null} to isolate.")}let l=s?e.extends??Rt:n?e.value??Rt:a,c=oi(),{client:d,effects:h}=pl(l,o??_h,c);return Cs(r,()=>d,[d]),(0,fr.jsx)(ri.Provider,{value:c,children:(0,fr.jsxs)(ei.Provider,{value:d,children:[(0,fr.jsx)($l,{effects:Ka(l)}),h&&(0,fr.jsx)($l,{effects:h}),i]})})});var Sh=t=>{let e=U(),r=F(!1),o=r.current?null:t(e);return P(()=>r.current?t(e):o),()=>(r.current=!0,t(e))},Th=Object.freeze({});function gt(t){let e=v(3),{getItemState:r,children:o}=t,i=Sh(r),s;return e[0]!==o||e[1]!==i?(s=o(i),e[0]=o,e[1]=i,e[2]=s):s=e[2],kh(s)}var kh=t=>{let e=typeof t=="object"&&t!=null&&"type"in t?t:null,r=e?.type,o=e?.key,i=typeof e?.props=="object"&&e.props!=null&&Object.entries(e.props).length===0?Th:e?.props;return G(()=>e,[r,o,i])??t};var yi=(t,e)=>{let r=v(11),o=U(),i=Nr(e),s;r[0]!==t?(s=zr(t),r[0]=t,r[1]=s):s=r[1];let{scope:n,event:a}=s,l;r[2]!==o||r[3]!==i||r[4]!==a||r[5]!==n?(l=()=>o.on({scope:n,event:a},i),r[2]=o,r[3]=i,r[4]=a,r[5]=n,r[6]=l):l=r[6];let c;r[7]!==o||r[8]!==a||r[9]!==n?(c=[o,n,a],r[7]=o,r[8]=a,r[9]=n,r[10]=c):c=r[10],D(l,c)};var Jr=$("react/jsx-runtime"),Ll=t=>t._core?.RenderComponent,Ih=({runtime:t,aui:e,config:r,children:o})=>{"use no memo";let i=Ll(t),s=se({...r,threads:Bl(t)});return(0,Jr.jsxs)(ce,{extends:e,config:s,children:[i&&(0,Jr.jsx)(i,{}),o]})},Zs=te(t=>{let e=v(5),{runtime:r,aui:o,config:i,children:s}=t,n=o===void 0?null:o,a;return e[0]!==n||e[1]!==s||e[2]!==i||e[3]!==r?(a=(0,Jr.jsx)(Ih,{runtime:r,aui:n,config:i,children:s}),e[0]=n,e[1]=s,e[2]=i,e[3]=r,e[4]=a):a=e[4],a});function de(t){return t!=null&&typeof t=="object"&&!Array.isArray(t)}function Qr(t,e=0){return e>100?!1:t===null||typeof t=="string"||typeof t=="boolean"?!0:typeof t=="number"?!Number.isNaN(t)&&Number.isFinite(t):Array.isArray(t)?t.every(r=>Qr(r,e+1)):de(t)?Object.entries(t).every(([r,o])=>typeof r=="string"&&Qr(o,e+1)):!1}var Ch=100,en=(t,e,r)=>{if(t===e)return!0;if(r>Ch||t==null||e==null)return!1;if(Array.isArray(t))return!Array.isArray(e)||t.length!==e.length?!1:t.every((s,n)=>en(s,e[n],r+1));if(Array.isArray(e)||!de(t)||!de(e))return!1;let o=Object.keys(t),i=Object.keys(e);return o.length!==i.length?!1:o.every(s=>Object.hasOwn(e,s)&&en(t[s],e[s],r+1))},Yr=(t,e)=>!Qr(t)||!Qr(e)?!1:en(t,e,0);var jl=Symbol.for("aui.tool-response"),_i="<no result>",Ne=class tn{constructor(e){f(this,"artifact");f(this,"result");f(this,"isError");f(this,"modelContent");f(this,"messages");e.artifact!==void 0&&(this.artifact=e.artifact);let r=e.result;this.result=r===void 0?_i:r,this.isError=e.isError??!1,e.modelContent!==void 0&&(this.modelContent=e.modelContent),e.messages!==void 0&&(this.messages=e.messages)}get[jl](){return!0}static[Symbol.hasInstance](e){return typeof e=="object"&&e!==null&&jl in e}static toResponse(e){return e instanceof tn?e:new tn({result:e===void 0?_i:e})}};var gr=()=>{let t,e,r=new Promise((o,i)=>{t=o,e=i});if(!t||!e)throw new Error("Failed to create promise");return{promise:r,resolve:t,reject:e}};var Fl=()=>{let t=[],e=!1,r=!1,o=!1,i,s,n=0,a,l,c=()=>(s=void 0,l??(l=Promise.all(t.splice(0).map(async g=>{try{await g.reader.cancel().catch(()=>{}),await g.pipeTask}finally{g.reader.releaseLock()}})).then(()=>{})),l),d=g=>{r||o||(o=!0,console.error(g),c(),i.error(g),a?.reject(g),a=void 0)},h=g=>{g.promise||(g.promise=g.reader.read().then(({done:w,value:_})=>{g.promise=void 0,!(r||o)&&(w?(t.splice(t.indexOf(g),1),g.reader.releaseLock(),e&&t.length===0&&n===0&&i.close()):i.enqueue(_),a?.resolve(),a=void 0)}).catch(d))},u=new ReadableStream({start(g){i=g},pull(){return a=gr(),t.forEach(g=>{h(g)}),a.promise},async cancel(){r=!0;let g=c();a?.resolve(),a=void 0,await g}}),p=g=>{if(t.length>0&&(s=void 0),!s){let w=[];s=w,n++,Promise.resolve().then(()=>{if(n--,s===w&&(s=void 0),!(r||o)){for(let _ of w)i.enqueue(_);e&&t.length===0&&n===0&&i.close(),a?.resolve(),a=void 0}}).catch(d)}s.push(g)};return{readable:u,isSealed(){return e},isCancelled(){return r},isErrored(){return o},seal(){e||r||o||(e=!0,t.length===0&&n===0&&i.close())},addStream:(g,w)=>{let _=w?.catch(()=>{});if(r||o){g.cancel().catch(()=>{});return}if(e)throw g.cancel().catch(()=>{}),new Error("Cannot add streams after the run callback has settled.");s=void 0;let x={reader:g.getReader(),pipeTask:_};t.push(x),h(x)},enqueue(g){if(!(r||o)){if(e)throw new Error("Cannot add streams after the run callback has settled.");p(g)}}}};var Vl=t=>t instanceof TypeError,Ee=(t,e,r)=>{try{t.enqueue(e)}catch(o){if(!Vl(o))throw o;r?.(o)}},Si=t=>{try{t.close()}catch(e){if(!Vl(e))throw e}};var Ti=(t,e)=>new ReadableStream({start(r){return t.start?.(e(r))},pull(r){return t.pull?.(e(r))},cancel(r){return t.cancel?.(r)}}),ki=(t,e)=>{let r;return[Ti({start(o){r=o},cancel(o){return e?.(r,o)}},t),r]};var Ul=class{constructor(t,e={}){f(this,"_controller");f(this,"_strict");f(this,"_isClosed",!1);f(this,"_warnedDropped",!1);f(this,"_warnDroppedAfterClose",t=>{this._warnedDropped||(this._warnedDropped=!0,console.error(`Dropped text delta for closed stream: ${String(t)}`))});this._controller=t,this._strict=e.strict??!0}append(t){let e={type:"text-delta",path:[],textDelta:t};if(this._isClosed){if(this._strict)throw new TypeError("Cannot append to a closed TextStreamController");return Ee(this._controller,e,this._warnDroppedAfterClose),this}return Ee(this._controller,e),this}close(){this._isClosed||(this._isClosed=!0,Ee(this._controller,{type:"part-finish",path:[]}),Si(this._controller))}},zl=(t,e={})=>Ti(t,r=>new Ul(r,e)),rn=(t={})=>ki(e=>new Ul(e,t));var Eh=class{constructor(t,e={}){f(this,"_isClosed",!1);f(this,"_mergeTask");f(this,"_controller");f(this,"_argsTextController");this._controller=t;let r=zl({start:i=>{this._argsTextController=i}},e),o=!1;this._mergeTask=r.pipeTo(new WritableStream({write:i=>{switch(i.type){case"text-delta":o=!0,Ee(this._controller,i);break;case"part-finish":o||Ee(this._controller,{type:"text-delta",textDelta:"{}",path:[]}),Ee(this._controller,{type:"tool-call-args-text-finish",path:[]});break;default:throw new Error(`Unexpected chunk type: ${i.type}`)}}}))}get argsText(){return this._argsTextController}async setResponse(t){if(this._isClosed)return;let e=t.result;Ee(this._controller,{type:"result",path:[],...t.artifact!==void 0?{artifact:t.artifact}:{},result:e===void 0?_i:e,isError:t.isError??!1,...t.modelContent!==void 0?{modelContent:t.modelContent}:{},...t.messages!==void 0?{messages:t.messages}:{}}),await this.close()}async close(){this._isClosed||(this._isClosed=!0,this._argsTextController.close(),await this._mergeTask,Ee(this._controller,{type:"part-finish",path:[]}),Si(this._controller))}};var ql=(t={})=>ki(e=>new Eh(e,t));var Ii=class{constructor(){f(this,"value",-1)}up(){return++this.value}};var Hl=class extends TransformStream{constructor(t){super({transform(e,r){r.enqueue({...e,path:[t,...e.path]})}})}},uk=class extends TransformStream{constructor(t){super({transform(e,r){let{path:[o,...i]}=e;if(t!==o)throw new Error(`Path mismatch: expected ${t}, got ${o}`);r.enqueue({...e,path:i})}})}},Gl=class extends TransformStream{constructor(t){let e=new Ii,r=new Map;super({transform(o,i){o.type==="part-start"&&o.path.length===0&&r.set(e.up(),t.up());let[s,...n]=o.path;if(s===void 0){i.enqueue(o);return}let a=r.get(s);if(a===void 0)throw new Error("Path not found");i.enqueue({...o,path:[a,...n]})}})}};var Ci=(t,e=21)=>(r=e)=>{let o="",i=r|0;for(;i-- >0;)o+=t[Math.random()*t.length|0];return o};var Wl=Ci("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",7);var Rh=class Kl{constructor(e,r={}){f(this,"_state");f(this,"_parentId");this._state=e||{strict:r.strict??!0,merger:Fl(),contentCounter:new Ii}}get __internal_isClosed(){return this._state.merger.isSealed()||this._state.merger.isCancelled()||this._state.merger.isErrored()}get __internal_isCancelled(){return this._state.merger.isCancelled()}__internal_getReadable(){return this._state.merger.readable}__internal_subscribeToClose(e){this._state.closeSubscriber=e}_addTransformedStream(e,r){if(e.locked)throw new TypeError("Cannot merge a stream that is already locked to a reader.");let o=e.pipeTo(r.writable).catch(async i=>{throw await r.writable.abort(i).catch(()=>{}),i});this._state.merger.addStream(r.readable,o)}_addPart(e,r){this._state.append&&(this._state.append.controller.close(),this._state.append=void 0),this.enqueue({type:"part-start",part:e,path:[]}),this._addTransformedStream(r,new Hl(this._state.contentCounter.value))}merge(e){this._addTransformedStream(e,new Gl(this._state.contentCounter))}appendText(e){(this._state.append?.kind!=="text"||this._state.append.parentId!==this._parentId)&&(this._state.append={kind:"text",parentId:this._parentId,controller:this.addTextPart()}),this._state.append.controller.append(e)}appendReasoning(e,r){(r!==void 0||this._state.append?.kind!=="reasoning"||this._state.append.parentId!==this._parentId)&&(this._state.append={kind:"reasoning",parentId:this._parentId,controller:this.addReasoningPart(r)}),!(r!==void 0&&e.length===0)&&this._state.append.controller.append(e)}addTextPart(){let[e,r]=rn({strict:this._state.strict});return this._addPart(this._withParentIdOption({type:"text"}),e),r}addReasoningPart(e){let[r,o]=rn({strict:this._state.strict});return this._addPart(this._withParentIdOption({type:"reasoning",...e}),r),o}addToolCallPart(e){let r=typeof e=="string"?{toolName:e}:e,o=r.toolName,i=r.toolCallId??Wl(),[s,n]=ql({strict:this._state.strict});return this._addPart({type:"tool-call",toolName:o,toolCallId:i,...this._parentId&&{parentId:this._parentId}},s),r.argsText!==void 0&&(n.argsText.append(r.argsText),n.argsText.close()),r.args!==void 0&&(n.argsText.append(JSON.stringify(r.args)),n.argsText.close()),r.response!==void 0&&n.setResponse(r.response),n}_finishedPartStream(){return new ReadableStream({start(e){e.enqueue({type:"part-finish",path:[]}),e.close()}})}_withParentIdOption(e){return this._parentId?{...e,parentId:this._parentId}:e}appendSource(e){this._addPart(this._withParentIdOption(e),this._finishedPartStream())}appendFile(e){this._addPart(this._withParentIdOption(e),this._finishedPartStream())}appendData(e){this._addPart(this._withParentIdOption(e),this._finishedPartStream())}enqueue(e){this._state.merger.enqueue(e),e.type==="part-start"&&e.path.length===0&&this._state.contentCounter.up()}withParentId(e){let r=new Kl(this._state);return r._parentId=e,r}close(){this._state.append?.controller?.close(),this._state.merger.seal(),this._state.closeSubscriber?.()}};function Jl(t,e={}){let r=new Rh(void 0,e);return(async()=>{try{await t(r)}catch(i){r.__internal_isClosed?r.__internal_isCancelled||console.error(i):r.enqueue({type:"error",path:[],error:String(i)})}finally{r.__internal_isClosed||r.close()}})(),r.__internal_getReadable()}function on(t={}){let{resolve:e,promise:r}=gr(),o;return[Jl(i=>(o=i,o.__internal_subscribeToClose(e),r),t),o]}var Ql=class extends TransformStream{constructor(t){super();let e=t(super.readable);Object.defineProperty(this,"readable",{value:e,writable:!1})}};var Xr=class extends TransformStream{constructor(){let t=[];super({transform(e,r){if(e.type==="part-start"){if(e.path.length!==0){r.error(new Error("Nested parts are not supported"));return}t.push(e.part),r.enqueue(e);return}if(e.type==="text-delta"||e.type==="result"||e.type==="part-finish"||e.type==="tool-call-args-text-finish"){if(e.path.length!==1){r.error(new Error(`${e.type} chunks must have a path of length 1`));return}let o=e.path[0];if(o<0||o>=t.length){r.error(new Error(`Invalid path index: ${o}`));return}let i=t[o];r.enqueue({...e,meta:i});return}r.enqueue(e)}})}};var Ph=/[0-9a-fA-F]/;function tc(t){let e=["ROOT"],r=-1,o=null,i=0,s=[],n;function a(){n!==void 0&&(s.push(JSON.parse(`"${n}"`)),n=void 0)}function l(u,p,m){switch(u){case'"':r=p,e.pop(),e.push(m),e.push("INSIDE_STRING"),a();break;case"f":case"t":case"n":r=p,o=p,e.pop(),e.push(m),e.push("INSIDE_LITERAL");break;case"-":e.pop(),e.push(m),e.push("INSIDE_NUMBER"),a();break;case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":r=p,e.pop(),e.push(m),e.push("INSIDE_NUMBER"),a();break;case"{":r=p,e.pop(),e.push(m),e.push("INSIDE_OBJECT_START"),a();break;case"[":r=p,e.pop(),e.push(m),e.push("INSIDE_ARRAY_START"),a()}}function c(u,p){switch(u){case",":e.pop(),e.push("INSIDE_OBJECT_AFTER_COMMA");break;case"}":r=p,e.pop(),n=s.pop()}}function d(u,p){switch(u){case",":e.pop(),e.push("INSIDE_ARRAY_AFTER_COMMA"),n=(Number(n)+1).toString();break;case"]":r=p,e.pop(),n=s.pop()}}for(let u=0;u<t.length;u++){let p=t[u];switch(e[e.length-1]){case"ROOT":l(p,u,"FINISH");break;case"INSIDE_OBJECT_START":switch(p){case'"':e.pop(),e.push("INSIDE_OBJECT_KEY"),n="";break;case"}":r=u,e.pop(),n=s.pop()}break;case"INSIDE_OBJECT_AFTER_COMMA":p==='"'&&(e.pop(),e.push("INSIDE_OBJECT_KEY"),n="");break;case"INSIDE_OBJECT_KEY":switch(p){case'"':e.pop(),e.push("INSIDE_OBJECT_AFTER_KEY");break;case"\\":e.push("INSIDE_STRING_ESCAPE"),n+=p;break;default:n+=p}break;case"INSIDE_OBJECT_AFTER_KEY":p===":"&&(e.pop(),e.push("INSIDE_OBJECT_BEFORE_VALUE"));break;case"INSIDE_OBJECT_BEFORE_VALUE":l(p,u,"INSIDE_OBJECT_AFTER_VALUE");break;case"INSIDE_OBJECT_AFTER_VALUE":c(p,u);break;case"INSIDE_STRING":switch(p){case'"':e.pop(),r=u,n=s.pop();break;case"\\":e.push("INSIDE_STRING_ESCAPE");break;default:r=u}break;case"INSIDE_ARRAY_START":p==="]"?(r=u,e.pop(),n=s.pop()):(n="0",l(p,u,"INSIDE_ARRAY_AFTER_VALUE"));break;case"INSIDE_ARRAY_AFTER_VALUE":switch(p){case",":e.pop(),e.push("INSIDE_ARRAY_AFTER_COMMA"),n=(Number(n)+1).toString();break;case"]":r=u,e.pop(),n=s.pop();break;default:r=u}break;case"INSIDE_ARRAY_AFTER_COMMA":l(p,u,"INSIDE_ARRAY_AFTER_VALUE");break;case"INSIDE_STRING_ESCAPE":{e.pop();let m=e[e.length-1];p==="u"?(e.push("INSIDE_STRING_UNICODE_ESCAPE"),i=0):m==="INSIDE_STRING"&&(r=u),m==="INSIDE_OBJECT_KEY"&&(n+=p);break}case"INSIDE_STRING_UNICODE_ESCAPE":{let m=e[e.length-2];if(!Ph.test(p)){e.pop(),u--;break}i++,i===4&&(e.pop(),m==="INSIDE_STRING"&&(r=u)),m==="INSIDE_OBJECT_KEY"&&(n+=p);break}case"INSIDE_NUMBER":switch(p){case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":r=u;break;case"e":case"E":case"-":case"+":case".":break;case",":e.pop(),n=s.pop(),e[e.length-1]==="INSIDE_ARRAY_AFTER_VALUE"&&d(p,u),e[e.length-1]==="INSIDE_OBJECT_AFTER_VALUE"&&c(p,u);break;case"}":e.pop(),n=s.pop(),e[e.length-1]==="INSIDE_OBJECT_AFTER_VALUE"&&c(p,u);break;case"]":e.pop(),n=s.pop(),e[e.length-1]==="INSIDE_ARRAY_AFTER_VALUE"&&d(p,u);break;default:e.pop(),n=s.pop()}break;case"INSIDE_LITERAL":{let m=t.substring(o,u+1);!"false".startsWith(m)&&!"true".startsWith(m)&&!"null".startsWith(m)?(e.pop(),e[e.length-1]==="INSIDE_OBJECT_AFTER_VALUE"?c(p,u):e[e.length-1]==="INSIDE_ARRAY_AFTER_VALUE"&&d(p,u)):r=u;break}}}let h=t.slice(0,r+1);for(let u=e.length-1;u>=0;u--)switch(e[u]){case"INSIDE_STRING":h+='"';break;case"INSIDE_OBJECT_KEY":case"INSIDE_OBJECT_AFTER_KEY":case"INSIDE_OBJECT_AFTER_COMMA":case"INSIDE_OBJECT_START":case"INSIDE_OBJECT_BEFORE_VALUE":case"INSIDE_OBJECT_AFTER_VALUE":h+="}";break;case"INSIDE_ARRAY_START":case"INSIDE_ARRAY_AFTER_COMMA":case"INSIDE_ARRAY_AFTER_VALUE":h+="]";break;case"INSIDE_LITERAL":{let p=t.substring(o,t.length);"true".startsWith(p)?h+="true".slice(p.length):"false".startsWith(p)?h+="false".slice(p.length):"null".startsWith(p)&&(h+="null".slice(p.length))}}return[h,s]}var an=Fe(nn(),1),Ei=Symbol("aui.parse-partial-json-object.meta"),rc=t=>t?.[Ei],br=t=>{if(t.length===0)return{[Ei]:{state:"partial",partialPath:[]}};try{let e=an.default.parse(t);if(typeof e!="object"||e===null)throw new Error("argsText is expected to be an object");return e[Ei]={state:"complete",partialPath:[]},e}catch{try{let[e,r]=tc(t),o=an.default.parse(e);if(typeof o!="object"||o===null)throw new Error("argsText is expected to be an object");return o[Ei]={state:"partial",partialPath:r},o}catch{return}}},oc=(t,e,r)=>{if(typeof t!="object"||t===null)return e.state;if(e.state==="complete")return"complete";if(r.length===0)return e.state;let[o,...i]=r;if(!Object.hasOwn(t,o))return"partial";let[s,...n]=e.partialPath;if(o!==s)return"complete";let a=t[o];return oc(a,{state:"partial",partialPath:n},i)},Wt=(t,e)=>{let r=rc(t);if(!r)throw new Error("unable to determine object state");return oc(t,r,e.map(String))};async function*Dh(){let t=this.getReader(),e=!0;try{for(;;){let r;try{r=await t.read()}catch(i){throw e=!1,i}if(r.done){e=!1;break}let{value:o}=r;yield o}}finally{try{e&&await t.cancel()}finally{t.releaseLock()}}}function Ri(t){var e;return t[e=Symbol.asyncIterator]??(t[e]=Dh),t}function ic(t,e,r){try{let o=t();if(typeof o=="object"&&o!==null&&"then"in o)return o.then(e,r);e(o)}catch(o){r(o)}}function Zr(t,e){let r=t;for(let o of e){if(r==null||!Object.hasOwn(r,o))return;r=r[o]}return r}var Oh=class{constructor(t,e,r){f(this,"resolve");f(this,"reject");f(this,"disposed",!1);f(this,"fieldPath");this.resolve=t,this.reject=e,this.fieldPath=r}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{if(Wt(t,this.fieldPath)==="complete"){let e=Zr(t,this.fieldPath);e!==void 0&&(this.resolve(e),this.dispose())}}catch(e){this.reject(e),this.dispose()}}end(t){if(!this.disposed)try{let e=Zr(t,this.fieldPath);this.resolve(e)}catch(e){this.reject(e)}finally{this.dispose()}}dispose(){this.disposed=!0}},Nh=class{constructor(t,e){f(this,"controller");f(this,"disposed",!1);f(this,"fieldPath");this.controller=t,this.fieldPath=e}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{let e=Zr(t,this.fieldPath);e!==void 0&&this.controller.enqueue(e),Wt(t,this.fieldPath)==="complete"&&(this.controller.close(),this.dispose())}catch(e){this.controller.error(e),this.dispose()}}end(){this.disposed||(this.controller.close(),this.dispose())}dispose(){this.disposed=!0}},Bh=class{constructor(t,e){f(this,"controller");f(this,"disposed",!1);f(this,"fieldPath");f(this,"lastValue");this.controller=t,this.fieldPath=e}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{let e=Zr(t,this.fieldPath);if(e!==void 0&&typeof e=="string"){let r=e.substring(this.lastValue?.length||0);this.lastValue=e,this.controller.enqueue(r)}Wt(t,this.fieldPath)==="complete"&&(this.controller.close(),this.dispose())}catch(e){this.controller.error(e),this.dispose()}}end(){this.disposed||(this.controller.close(),this.dispose())}dispose(){this.disposed=!0}},$h=class{constructor(t,e){f(this,"controller");f(this,"disposed",!1);f(this,"fieldPath");f(this,"nextIndex",0);this.controller=t,this.fieldPath=e}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{let e=Zr(t,this.fieldPath);if(!Array.isArray(e))return;for(;this.nextIndex<e.length;this.nextIndex++){let r=[...this.fieldPath,this.nextIndex];if(Wt(t,r)!=="complete")break;this.controller.enqueue(e[this.nextIndex])}Wt(t,this.fieldPath)==="complete"&&(this.controller.close(),this.dispose())}catch(e){this.controller.error(e),this.dispose()}}end(){this.disposed||(this.controller.close(),this.dispose())}dispose(){this.disposed=!0}},Lh=class{constructor(t){f(this,"argTextDeltas");f(this,"handles",new Set);f(this,"accumulatedText","");f(this,"parsedTextLength",-1);f(this,"args");f(this,"finished",!1);this.argTextDeltas=t,this.processStream()}async processStream(){try{let t=this.argTextDeltas.getReader();for(;;){let{value:e,done:r}=await t.read();if(r)break;this.accumulatedText+=e,this.handles.size!==0&&this.parseCurrentArgs()&&this.updateHandles()}}catch(t){console.error("Error processing argument stream:",t)}finally{this.finished=!0;for(let t of this.handles)t.end(this.args);this.handles.clear()}}parseCurrentArgs(){if(this.parsedTextLength===this.accumulatedText.length)return!1;let t=br(this.accumulatedText);return this.parsedTextLength=this.accumulatedText.length,t===void 0?(this.args??(this.args=br("")),!1):(this.args=t,!0)}updateHandles(){for(let t of this.handles)t.update(this.args),t.isDisposed&&this.handles.delete(t)}activateHandle(t){if(this.parseCurrentArgs(),t.update(this.args),!t.isDisposed){if(this.finished){t.end(this.args);return}this.handles.add(t)}}get(...t){return new Promise((e,r)=>{let o=new Oh(e,r,t);this.activateHandle(o)})}streamValues(...t){let e=t,r,o=new ReadableStream({start:i=>{r=new Nh(i,e),this.activateHandle(r)},cancel:()=>{r&&(r.dispose(),this.handles.delete(r))}});return Ri(o)}streamText(...t){let e=t,r,o=new ReadableStream({start:i=>{r=new Bh(i,e),this.activateHandle(r)},cancel:()=>{r&&(r.dispose(),this.handles.delete(r))}});return Ri(o)}forEach(...t){let e=t,r,o=new ReadableStream({start:i=>{r=new $h(i,e),this.activateHandle(r)},cancel:()=>{r&&(r.dispose(),this.handles.delete(r))}});return Ri(o)}},jh=class{constructor(t){f(this,"promise");this.promise=t}get(){return this.promise}},sc=class{constructor(){f(this,"args");f(this,"response");f(this,"writable");f(this,"resolve");f(this,"argsText","");f(this,"result",{get:async()=>(await this.response.get()).result});let t=new TransformStream;this.writable=t.writable,this.args=new Lh(t.readable);let{promise:e,resolve:r}=gr();this.resolve=r,this.response=new jh(e)}async appendArgsTextDelta(t){let e=this.writable.getWriter();try{await e.write(t)}catch(r){console.warn(r)}finally{e.releaseLock()}this.argsText+=t}async finishArgsText(){let t=this.writable.getWriter();try{await t.close()}catch(e){console.warn(e)}finally{t.releaseLock()}}setResponse(t){this.resolve(t)}};var nc=Fe(nn(),1),Fh=Symbol.for("assistant-stream.tool-execution-id"),ln=(t,e,r,o,i)=>{try{let s=e?.(r,o,i);Promise.resolve(s).catch(n=>{console.error(`[assistant-stream] ${t} callback threw an error`,n)})}catch(s){console.error(`[assistant-stream] ${t} callback threw an error`,s)}},wr=t=>t.join(","),cn=(t,e)=>{let r={...t};return Object.defineProperty(r,Fh,{value:e,enumerable:!0}),r},ac=class extends Ql{constructor(t){let e=t,r=new Map,o=new Map,i=new Set,s=new Map,n=0;super(a=>{let l=new TransformStream({async transform(c,d){let h=s.get(wr(c.path));switch((c.type!=="part-finish"||c.meta.type!=="tool-call")&&d.enqueue(h?cn(c,h):c),c.type){case"part-start":{let u=n;if(n+=1,c.part.type==="tool-call"){let p=new sc,m=Symbol();s.set(String(u),m),o.set(m,p),e.streamCall({reader:p,toolCallId:c.part.toolCallId,toolName:c.part.toolName,executionId:m})}break}case"text-delta":if(c.meta.type==="tool-call"){let u=s.get(wr(c.path)),p=u?o.get(u):void 0;if(!p)throw new Error("No controller found for tool call");await p.appendArgsTextDelta(c.textDelta)}break;case"result":{if(c.meta.type!=="tool-call")break;let u=s.get(wr(c.path)),p=u?o.get(u):void 0;if(!p)throw new Error("No controller found for tool call");p.setResponse(new Ne({result:c.result,artifact:c.artifact,isError:c.isError,modelContent:c.modelContent,messages:c.messages})),i.add(u);break}case"tool-call-args-text-finish":{if(c.meta.type!=="tool-call")break;let{toolCallId:u,toolName:p}=c.meta,m=s.get(wr(c.path)),g=m?o.get(m):void 0;if(!g)throw new Error("No controller found for tool call");if(await g.finishArgsText(),i.has(m))break;let w=!1,_=ic(()=>{let x;try{x=nc.default.parse(g.argsText)}catch(I){throw new Error(`Function parameter parsing failed. ${JSON.stringify(I.message)}`)}let T=e.execute({toolCallId:u,toolName:p,args:x,executionId:m});return T!==void 0&&(w=!0,ln("onExecutionStart",e.onExecutionStart,u,p,m)),T},x=>{if(w&&ln("onExecutionEnd",e.onExecutionEnd,u,p,m),x===void 0)return;let T=new Ne({artifact:x.artifact,result:x.result,isError:x.isError,messages:x.messages,modelContent:x.modelContent});g.setResponse(T),Ee(d,cn({type:"result",path:c.path,...T},m))},x=>{w&&ln("onExecutionEnd",e.onExecutionEnd,u,p,m);let T=new Ne({result:String(x),isError:!0});g.setResponse(T),Ee(d,cn({type:"result",path:c.path,...T},m))});_&&r.set(m,_);break}case"part-finish":{if(c.meta.type!=="tool-call")break;let u=s.get(wr(c.path)),p=u?r.get(u):void 0,m=()=>{u&&(r.delete(u),o.delete(u),i.delete(u),s.delete(wr(c.path)))};p?p.then(()=>{m(),Ee(d,c)}):(m(),d.enqueue(c))}}},async flush(){await Promise.all(r.values())}});return a.pipeThrough(new Xr).pipeThrough(l)})}};var cc=Symbol.for("assistant-stream.tool-execution-id"),Mi=Symbol("assistant-stream.tool-aborted"),Vh=t=>typeof t=="object"&&t!==null&&"~standard"in t&&t["~standard"].version===1,Uh=t=>typeof t?.then=="function",lc=async(t,e,r=!1)=>{let o,i=new Promise(s=>{o=()=>{r?queueMicrotask(()=>queueMicrotask(()=>s(Mi))):s(Mi)},e.aborted?o():e.addEventListener("abort",o,{once:!0})});try{return await Promise.race([t,i])}finally{e.removeEventListener("abort",o)}},Ai=()=>new Ne({result:"Tool execution was cancelled.",isError:!0});function zh(t,e,r,o){let i=t?.[r.toolName];return i?.execute?(async n=>{if(e.aborted)return Ai();let a=n;if(Vh(i.parameters)){let d=i.parameters["~standard"].validate(r.args),h=Uh(d)?await lc(d,e):d;if(h===Mi)return Ai();h.issues&&(a=i.experimental_onSchemaValidationError??(()=>{throw new Error(`Function parameter validation failed. ${JSON.stringify(h.issues)}`)}))}if(e.aborted)return Ai();let l=(async()=>{let d={toolCallId:r.toolCallId,abortSignal:e,human:p=>o(r.toolCallId,p,r.executionId),[cc]:r.executionId},h=await a(r.args,d),u=Ne.toResponse(h);if(i.toModelOutput&&!u.isError&&u.modelContent===void 0)try{let p=await i.toModelOutput({toolCallId:r.toolCallId,input:r.args,output:u.result});return new Ne({result:u.result,artifact:u.artifact,isError:u.isError,messages:u.messages,modelContent:p})}catch(p){console.warn(`[assistant-stream] tool "${r.toolName}" toModelOutput threw; falling back to default projection.`,p)}return u})(),c=await lc(l,e,!0);return c===Mi?Ai():c})(i.execute):void 0}function qh(t,e,r,o,i){let s={toolCallId:o.toolCallId,abortSignal:e,human:n=>i(o.toolCallId,n,o.executionId),[cc]:o.executionId};t?.[o.toolName]?.streamCall?.(r,s)}function dn(t,e,r,o){let i=typeof t=="function"?t:()=>t,s=typeof e=="function"?e:()=>e,n=o,a=r,l={execute:c=>zh(i(),s(),c,a),streamCall:({reader:c,...d})=>qh(i(),s(),c,d,a),onExecutionStart:n?.onExecutionStart,onExecutionEnd:n?.onExecutionEnd};return new ac(l)}function Hh(t){let e=t.metadata;if(!e||typeof e!="object")return;let r=e.custom;if(!r||typeof r!="object")return;let o=r.interactables;return Array.isArray(o)?o:void 0}function Gh(t){return`update_${t.replace(/[^a-zA-Z0-9_-]/g,"_")}`}var un=t=>{if(!de(t))return;let e=t.id;return typeof e=="string"||typeof e=="number"?e:void 0};function Wh(t,e,r){let o=Array.isArray(e.set)?[...e.set]:[...t];if(e.clear===!0&&(o=[]),Array.isArray(e.remove)&&e.remove.length>0){let s=new Set(e.remove);o=o.filter(n=>{let a=un(n);return a!==void 0?!s.has(a):!s.has(n)})}let i=e.update;if(Array.isArray(i)&&i.length>0){let s=new Map;for(let n of i){let a=un(n);a!==void 0&&!Number.isNaN(a)&&!s.has(a)&&s.set(a,n)}o=o.map(n=>{let a=un(n);if(a===void 0||!de(n))return n;let l=s.get(a);return l?{...n,...l}:n})}if(Array.isArray(e.add)&&e.add.length>0){let s=r?e.add.map(n=>{if(!de(n)||n.id!==void 0)return n;let a=r();return a===void 0?n:{...n,id:a}}):e.add;o=[...o,...s]}return o}function pn(t,e,r){if(!de(t)||!de(e))return e;let o=de(r?.arrayBaseline)?r.arrayBaseline:t,i=Object.entries(t);for(let[s,n]of Object.entries(e)){let a=o[s];if(Array.isArray(a)&&de(n)){let l=r?.idFactory&&(r.idKeyedFields===void 0||r.idKeyedFields.has(s))?()=>r.idFactory?.(s):void 0;i.push([s,Wh(a,n,l)])}else i.push([s,n])}return Object.fromEntries(i)}function Kh(t,e){if(!de(t)||!de(e))return;for(let i of Object.keys(t))if(!Object.hasOwn(e,i))return;let r=[];for(let[i,s]of Object.entries(e))(!Object.hasOwn(t,i)||!Yr(t[i],s))&&r.push([i,s]);let o=r.length;if(!(o===0||o===Object.keys(e).length))return Object.fromEntries(r)}var Jh=t=>{if(!t||typeof t!="object")return;let e=t;return e.type==="tool-call"?e:void 0},Qh=(t,e)=>{if(!t.args||typeof t.args!="object")return!1;let r=de(t.result)?t.result:void 0;if(r?.success===!1)return!1;if(typeof r?.id=="string")return r.id===e;let o=t.args.id;return o===e||o===void 0},Yh=t=>{let e=de(t)?t.addedItemIds:void 0;if(!de(e))return;let r=new Map;for(let[o,i]of Object.entries(e)){if(!Array.isArray(i))continue;let s=i.filter(n=>typeof n=="string");s.length>0&&r.set(o,s)}if(r.size!==0)return o=>r.get(o)?.shift()},dc=new WeakMap;function Xh(t,e,r){let o=dc.get(t);o||(o=new Map,dc.set(t,o));let i=o.get(r);i||(i=new Map,o.set(r,i));let s=i.get(e);if(s)return s;let n=Gh(r),a=[],l=()=>a[a.length-1];for(let c of t){if(c.role==="user"){let d=Hh(c)?.find(h=>h.id===e);if(!d)continue;if(d.partial){let h=l();h&&a.push({state:pn(h.state,d.state),origin:"user-edit"})}else a.push({state:d.state,origin:"user-edit"});continue}if(c.role==="assistant")for(let d of c.content??[]){let h=Jh(d);if(h){if(h.toolCallId===e&&h.toolName===r)h.args&&typeof h.args=="object"&&a.push({state:h.args,origin:"create",toolCallId:e});else if(h.toolName===n&&Qh(h,e)){let u=l();if(u){let{id:p,...m}=h.args,g=Yh(h.result);a.push({state:g?pn(u.state,m,{idFactory:g}):pn(u.state,m),origin:"update",toolCallId:h.toolCallId})}}}}}return i.set(e,a),a}function Zh(t,e,r){let o=Xh(t,e,r),i=o[o.length-1];return i?{state:i.state}:void 0}function uc(t,e){if(!t)return;let{interactables:r,...o}=t,i={...o};if(Array.isArray(r)){let s=[];for(let n of r){let a=Zh(e,n.id,n.name);if(!a){s.push({id:n.id,name:n.name,state:n.state});continue}if(Yr(n.state,a.state))continue;let l=Kh(a.state,n.state);s.push(l?{id:n.id,name:n.name,state:l,partial:!0}:{id:n.id,name:n.name,state:n.state})}s.length&&(i.interactables=s)}return Object.keys(i).length?i:void 0}var ef=we(null);var pc=()=>ut(ef);var vt=Symbol("innerMessage"),mn=Symbol("innerMessages"),tf=[],hn=(t,e)=>{vt in t||(t[vt]=e)},mc=t=>{let e="messages"in t?t.messages:t,r=e[mn]||e[vt];return r?Array.isArray(r)?r:(e[mn]=[r],e[mn]):tf},hc="__external_store_fallback_";var Be=Ci("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",7);function fc(t){let e=t.match(/^data:([^;,]+)(?:;[^;,]+)*;base64,(.*)$/i);return e?{mimeType:e[1].toLowerCase(),data:e[2]}:null}var fn=(t,e)=>{if(t.startsWith("data-"))return{type:"data",name:t.substring(5),data:e}},xr=(t,e,r)=>{let{role:o,id:i,createdAt:s,attachments:n,status:a,metadata:l}=t,c={id:i??e,createdAt:s??new Date},d=typeof t.content=="string"?[{type:"text",text:t.content}]:t.content,h=({image:u,...p})=>typeof u!="string"?null:fc(u)?.mimeType.startsWith("image/")?{...p,image:u}:/^(https:\/\/|blob:)/i.test(u)?{...p,image:u}:(console.warn("Invalid image data format detected"),null);if(o!=="user"&&n?.length)throw new Error("attachments are only supported for user messages");if(o!=="assistant"&&a)throw new Error("status is only supported for assistant messages");if(o!=="assistant"&&l?.steps)throw new Error("metadata.steps is only supported for assistant messages");switch(o){case"assistant":return{...c,role:o,content:d.map(u=>{let p=u.type;switch(p){case"text":return u.text?.trim()?u:null;case"reasoning":return!u.text?.trim()&&!u.unstable_summary?.trim()?null:u;case"file":case"source":return u;case"image":return h(u);case"data":return u;case"generative-ui":return u;case"tool-call":{let{parentId:m,messages:g,...w}=u,_={...w,toolCallId:u.toolCallId||`tool-${Be()}`,...m!==void 0&&{parentId:m},...g!==void 0&&{messages:g}};return u.args?{..._,args:u.args,argsText:u.argsText??JSON.stringify(u.args)}:{..._,args:br(u.argsText??"")??{},argsText:u.argsText??""}}default:{let m=fn(p,u.data);if(m)return m;throw new Error(`Unsupported assistant message part type: ${p}`)}}}).filter(u=>!!u),status:a??r,metadata:{unstable_state:l?.unstable_state??null,unstable_annotations:l?.unstable_annotations??[],unstable_data:l?.unstable_data??[],custom:l?.custom??{},steps:l?.steps??[],...l?.timing&&{timing:l.timing},...l?.submittedFeedback&&{submittedFeedback:l.submittedFeedback},...l?.isOptimistic&&{isOptimistic:!0},...l?.modality&&{modality:l.modality}}};case"user":return{...c,role:o,content:d.map(u=>{let p=u.type;switch(p){case"text":case"image":case"audio":case"file":case"data":return u;default:{let m=fn(p,u.data);if(m)return m;throw new Error(`Unsupported user message part type: ${p}`)}}}),attachments:(n??[]).map(u=>({...u,content:u.content.map(p=>fn(p.type,p.data)??p)})),metadata:{custom:l?.custom??{},...l?.isOptimistic&&{isOptimistic:!0},...l?.modality&&{modality:l.modality}}};case"system":if(d.length!==1||d[0].type!=="text")throw new Error("System messages must have exactly one text message part.");return{...c,role:o,content:d,metadata:{custom:l?.custom??{}}};default:throw new Error(`Unknown message role: ${o}`)}};var vc=t=>t.type==="tool-call"&&t.result===void 0,rf=t=>{if(t.type!=="tool-call"||t.result!==void 0)return!1;let e=t.messages?.at(-1);return e?.role==="assistant"&&e.status.type==="running"},bc=t=>t.type!=="tool-call"||t.result!==void 0?!1:t.interrupt!=null||t.approval!=null&&t.approval.approved===void 0&&t.approval.resolution===void 0,Kt=Symbol("autoStatus"),gc=Object.freeze(Object.assign({type:"running"},{[Kt]:!0})),of=Object.freeze(Object.assign({type:"complete",reason:"unknown"},{[Kt]:!0})),sf=Object.freeze(Object.assign({type:"incomplete",reason:"cancelled"},{[Kt]:!0})),nf=Object.freeze(Object.assign({type:"requires-action",reason:"tool-calls"},{[Kt]:!0})),af=Object.freeze(Object.assign({type:"requires-action",reason:"interrupt"},{[Kt]:!0})),wc=t=>t[Kt]===!0,xc=(t,e,r,o,i,s,n)=>t&&i?Object.assign({type:"incomplete",reason:"error",error:i},{[Kt]:!0}):t&&e?gc:r?af:n&&!s?gc:o?nf:s?sf:of,gn=t=>xc(!1,!1,typeof t!="string"&&t.some(bc),typeof t!="string"&&t.some(vc)),vn=(t,e,r)=>xc(e,r,typeof t!="string"&&t.some(bc),typeof t!="string"&&t.some(vc),void 0,void 0,typeof t!="string"&&t.some(rf));var bn=class{constructor(){f(this,"cache",new WeakMap)}convertMessages(t,e){return t.map((r,o)=>{let i=e(this.cache.get(r),r,o);return this.cache.set(r,i),i})}};var wn=(t,e)=>{if(t.length!==e.length)return!1;for(let r=0;r<t.length;r++)if(t[r]!==e[r])return!1;return!0};var yc=$("react/jsx-runtime"),xn=t=>{let e=v(6),{index:r,children:o}=t,i=U(),s;e[0]!==r?(s=se({attachment:ne({source:"message",query:{type:"index",index:r},get:l=>l.message.attachment({index:r})})}),e[0]=r,e[1]=s):s=e[1];let n=s,a;return e[2]!==i||e[3]!==o||e[4]!==n?(a=(0,yc.jsx)(ce,{extends:i,config:n,children:o}),e[2]=i,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var _c=$("react/jsx-runtime"),yn=t=>{let e=v(6),{index:r,children:o}=t,i=U(),s;e[0]!==r?(s=se({message:ne({source:"thread",query:{type:"index",index:r},get:l=>l.thread.message({index:r})}),composer:ne({source:"message",query:{},get:l=>l.thread.message({index:r}).composer()})}),e[0]=r,e[1]=s):s=e[1];let n=s,a;return e[2]!==i||e[3]!==o||e[4]!==n?(a=(0,_c.jsx)(ce,{extends:i,config:n,children:o}),e[2]=i,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var Sc=$("react/jsx-runtime"),Jt=t=>{let e=v(6),{index:r,children:o}=t,i=U(),s;e[0]!==r?(s=se({part:ne({source:"message",query:{type:"index",index:r},get:l=>l.message.part({index:r})})}),e[0]=r,e[1]=s):s=e[1];let n=s,a;return e[2]!==i||e[3]!==o||e[4]!==n?(a=(0,Sc.jsx)(ce,{extends:i,config:n,children:o}),e[2]=i,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var Tc=$("react/jsx-runtime"),lf=t=>{let e=v(7),{text:r,isRunning:o}=t,i;e[0]!==o?(i=o?{type:"running"}:{type:"complete"},e[0]=o,e[1]=i):i=e[1];let s;e[2]!==i||e[3]!==r?(s={type:"text",text:r,status:i},e[2]=i,e[3]=r,e[4]=s):s=e[4];let n=s,a;return e[5]!==n?(a={getState:()=>n,addToolResult:df,resumeToolCall:uf,respondToToolApproval:pf},e[5]=n,e[6]=a):a=e[6],a},cf=j(lf),Qt=t=>{let e=v(7),{text:r,isRunning:o,children:i}=t,s=o===void 0?!1:o,n=U(),a;e[0]!==s||e[1]!==r?(a=se({part:cf({text:r,isRunning:s})}),e[0]=s,e[1]=r,e[2]=a):a=e[2];let l=a,c;return e[3]!==n||e[4]!==i||e[5]!==l?(c=(0,Tc.jsx)(ce,{extends:n,config:l,children:i}),e[3]=n,e[4]=i,e[5]=l,e[6]=c):c=e[6],c};function df(){throw new Error("Not supported")}function uf(){throw new Error("Not supported")}function pf(){throw new Error("Not supported")}var kc=t=>{for(let e of t)if(e?.status.type==="running")return wi;return t.at(-1)?.status??Xe},Ic=(t,e)=>{let r={running:0,complete:0,incomplete:0,requiresAction:0},o=Xe,i=!1;for(let s of e)switch(o=t[s]?.status??Xe,o.type){case"running":r.running++,i=!0;break;case"complete":r.complete++;break;case"incomplete":r.incomplete++;break;case"requires-action":r.requiresAction++}return{status:i?wi:o,counts:r}};var mf=t=>{let e=v(11),{parts:r,getMessagePart:o}=t,[i,s]=z(!0),n;e[0]!==r?(n=kc(r),e[0]=r,e[1]=n):n=e[1];let a=n,l;e[2]!==i||e[3]!==r||e[4]!==a?(l={parts:r,collapsed:i,status:a},e[2]=i,e[3]=r,e[4]=a,e[5]=l):l=e[5];let c=l,d;e[6]!==c?(d=()=>c,e[6]=c,e[7]=d):d=e[7];let h;return e[8]!==o||e[9]!==d?(h={getState:d,setCollapsed:s,part:o},e[8]=o,e[9]=d,e[10]=h):h=e[10],h},Cc=j(mf);var Ec=$("react/jsx-runtime"),Rc=t=>{let e=v(4),{startIndex:r,endIndex:o,children:i}=t,s=P(hf).slice(r,o+1),n=U(),a=se({chainOfThought:Cc({parts:s,getMessagePart:c=>{let{index:d}=c;if(d<0||d>=s.length)throw new Error(`ChainOfThought part index ${d} is out of bounds (0..${s.length-1})`);return n.message.part({index:r+d})}})}),l;return e[0]!==i||e[1]!==a||e[2]!==n?(l=(0,Ec.jsx)(ce,{extends:n,config:a,children:i}),e[0]=i,e[1]=a,e[2]=n,e[3]=l):l=e[3],l};function hf(t){return t.message.parts}var Ac=$("react/jsx-runtime"),_n=t=>{let e=v(6),{index:r,children:o}=t,i=U(),s;e[0]!==r?(s=se({suggestion:ne({source:"suggestions",query:{index:r},get:l=>l.suggestions.suggestion({index:r})})}),e[0]=r,e[1]=s):s=e[1];let n=s,a;return e[2]!==i||e[3]!==o||e[4]!==n?(a=(0,Ac.jsx)(ce,{extends:i,config:n,children:o}),e[2]=i,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var Dc=Symbol.for("assistant-ui.message-not-sent"),Mc,Pc,lC=class extends(Pc=Error,Mc=Dc,Pc){constructor(e="The message was not sent."){super(e);f(this,Mc,!0);this.name="MessageNotSentError"}},Pi=t=>typeof t=="object"&&t!==null&&Dc in t;var Oc=class{constructor(t){f(this,"_core");this._core=t,this.__internal_bindMethods()}get path(){return this._core.path}__internal_bindMethods(){this.getState=this.getState.bind(this),this.remove=this.remove.bind(this),this.subscribe=this.subscribe.bind(this)}getState(){return this._core.getState()}subscribe(t){return this._core.subscribe(t)}},Nc=class extends Oc{constructor(e,r){super(e);f(this,"_composerApi");this._composerApi=r}remove(){let e=this._composerApi.getState();if(!e)throw new Error("Composer is not available");return e.removeAttachment(this.getState().id)}},Bc=class extends Nc{get source(){return"thread-composer"}},$c=class extends Nc{get source(){return"edit-composer"}},Lc=class extends Oc{get source(){return"message"}remove(){throw new Error("Message attachments cannot be removed")}};var Di=Object.freeze([]),jc=Object.freeze({}),ff=t=>Object.freeze({type:"thread",isEditing:t?.isEditing??!1,canCancel:t?.canCancel??!1,canSend:t?.canSend??!1,isEmpty:t?.isEmpty??!0,attachments:t?.attachments??Di,text:t?.text??"",role:t?.role??"user",runConfig:t?.runConfig??jc,attachmentAccept:t?.attachmentAccept??"",dictation:t?.dictation,quote:t?.quote,queue:t?.queue??Di,value:t?.text??""}),gf=t=>Object.freeze({type:"edit",isEditing:t?.isEditing??!1,canCancel:t?.canCancel??!1,canSend:t?.canSend??!1,isEmpty:t?.isEmpty??!0,text:t?.text??"",role:t?.role??"user",attachments:t?.attachments??Di,runConfig:t?.runConfig??jc,attachmentAccept:t?.attachmentAccept??"",dictation:t?.dictation,quote:t?.quote,queue:t?.queue??Di,parentId:t?.parentId??null,sourceId:t?.sourceId??null,value:t?.text??""}),Fc=class{constructor(t){f(this,"_core");f(this,"_eventSubscriptionSubjects",new Map);this._core=t}get path(){return this._core.path}__internal_bindMethods(){this.setText=this.setText.bind(this),this.setRunConfig=this.setRunConfig.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this),this.addAttachment=this.addAttachment.bind(this),this.reset=this.reset.bind(this),this.clearAttachments=this.clearAttachments.bind(this),this.send=this.send.bind(this),this.cancel=this.cancel.bind(this),this.steerQueueItem=this.steerQueueItem.bind(this),this.moveQueueItem=this.moveQueueItem.bind(this),this.removeQueueItem=this.removeQueueItem.bind(this),this.setRole=this.setRole.bind(this),this.getAttachmentByIndex=this.getAttachmentByIndex.bind(this),this.startDictation=this.startDictation.bind(this),this.stopDictation=this.stopDictation.bind(this),this.setQuote=this.setQuote.bind(this),this.unstable_on=this.unstable_on.bind(this)}setText(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setText(t)}setRunConfig(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setRunConfig(t)}addAttachment(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");return e.addAttachment(t)}reset(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");return t.reset()}clearAttachments(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");return t.clearAttachments()}send(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.send(t)}cancel(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");t.cancel()}steerQueueItem(t){this.moveQueueItem(t,{lane:"steer",insertAfter:null})}moveQueueItem(t,e){let r=this._core.getState();if(!r)throw new Error("Composer is not available");r.moveQueueItem(t,e)}removeQueueItem(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.removeQueueItem(t)}setRole(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setRole(t)}startDictation(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");t.startDictation()}stopDictation(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");t.stopDictation()}setQuote(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setQuote(t)}subscribe(t){return this._core.subscribe(t)}unstable_on(t,e){let r=this._eventSubscriptionSubjects.get(t);return r||(r=new ui({event:t,binding:this._core}),this._eventSubscriptionSubjects.set(t,r)),r.subscribe(e)}},Vc=class extends Fc{constructor(e){let r=new Kr({path:e.path,getState:()=>ff(e.getState()),subscribe:o=>e.subscribe(o)});super({path:e.path,getState:()=>e.getState(),subscribe:o=>r.subscribe(o)});f(this,"_getState");this._getState=r.getState.bind(r),this.__internal_bindMethods()}get path(){return this._core.path}get type(){return"thread"}getState(){return this._getState()}getAttachmentByIndex(e){return new Bc(new _e({path:{...this.path,attachmentSource:"thread-composer",attachmentSelector:{type:"index",index:e},ref:`${this.path.ref}.attachments[${e}]`},getState:()=>{let r=this.getState().attachments[e];return r?{...r,source:"thread-composer"}:ye},subscribe:r=>this._core.subscribe(r)}),this._core)}},Uc=class extends Fc{constructor(e,r){let o=new Kr({path:e.path,getState:()=>gf(e.getState()),subscribe:i=>e.subscribe(i)});super({path:e.path,getState:()=>e.getState(),subscribe:i=>o.subscribe(i)});f(this,"_getState");f(this,"_beginEdit");this._beginEdit=r,this._getState=o.getState.bind(o),this.__internal_bindMethods()}get path(){return this._core.path}get type(){return"edit"}__internal_bindMethods(){super.__internal_bindMethods(),this.beginEdit=this.beginEdit.bind(this)}getState(){return this._getState()}beginEdit(){this._beginEdit()}getAttachmentByIndex(e){return new $c(new _e({path:{...this.path,attachmentSource:"edit-composer",attachmentSelector:{type:"index",index:e},ref:`${this.path.ref}.attachments[${e}]`},getState:()=>{let r=this.getState().attachments[e];return r?{...r,source:"edit-composer"}:ye},subscribe:r=>this._core.subscribe(r)}),this._core)}};var At=t=>t.content.filter(e=>e.type==="text").map(e=>e.text).join(`

`);var vf="ui://",zc=t=>!!t?.startsWith(vf),qc=t=>t.display==="text"||t.allowFreeform===!0;var Hc={"allow-once":!0,"allow-always":!0,"reject-once":!1,"reject-always":!1},Gc=(t,e)=>{let r=e.text;if(r!==void 0&&!qc(t))throw new Error(`Tool approval "${t.id}" does not accept a free-form answer; the request must declare display "text" or allowFreeform`);let o,i;if("optionId"in e){let s=t.options?.find(n=>n.id===e.optionId);if(!s)throw new Error(`Tool approval has no option with id "${e.optionId}"`);if("approved"in e)o=e.approved;else{if(!Object.hasOwn(Hc,s.kind))throw new Error(`Tool approval option "${s.id}" has a custom kind "${s.kind}"; respond with an explicit approved value instead`);o=Hc[s.kind]}i=s.id}else if("approved"in e)o=e.approved;else{if(t.display!=="text"&&t.display!=="select")throw new Error(`Tool approval "${t.id}" is a decision, not a question; respond with an explicit approved value, optionally alongside the answer`);o=!0}return{approvalId:t.id,approved:o,...i!==void 0&&{optionId:i},...r!==void 0&&{text:r},...e.reason!=null&&{reason:e.reason}}};var Sn=class{constructor(t,e,r){f(this,"contentBinding");f(this,"messageApi");f(this,"threadApi");this.contentBinding=t,this.messageApi=e,this.threadApi=r,this.__internal_bindMethods()}get path(){return this.contentBinding.path}__internal_bindMethods(){this.addToolResult=this.addToolResult.bind(this),this.resumeToolCall=this.resumeToolCall.bind(this),this.respondToToolApproval=this.respondToToolApproval.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this)}getState(){return this.contentBinding.getState()}addToolResult(t){let e=this.contentBinding.getState();if(!e)throw new Error("Message part is not available");if(e.type!=="tool-call")throw new Error("Tried to add tool result to non-tool message part");if(!this.messageApi)throw new Error("Message API is not available. This is likely a bug in assistant-ui.");if(!this.threadApi)throw new Error("Thread API is not available");let r=this.messageApi.getState();if(!r)throw new Error("Message is not available");let o=e.toolName,i=e.toolCallId,s=Ne.toResponse(t);this.threadApi.getState().addToolResult({messageId:r.id,toolName:o,toolCallId:i,result:s.result,isError:s.isError,...s.artifact!==void 0&&{artifact:s.artifact},...s.modelContent!==void 0&&{modelContent:s.modelContent}})}resumeToolCall(t){let e=this.contentBinding.getState();if(!e)throw new Error("Message part is not available");if(e.type!=="tool-call")throw new Error("Tried to resume tool call on non-tool message part");if(!this.threadApi)throw new Error("Thread API is not available");let r=e.toolCallId;this.threadApi.getState().resumeToolCall({toolCallId:r,payload:t})}respondToToolApproval(t){let e=this.contentBinding.getState();if(!e)throw new Error("Message part is not available");if(e.type!=="tool-call")throw new Error("Tried to respond to tool approval on non-tool message part");if(!e.approval||e.approval.approved!==void 0||e.approval.resolution!==void 0)throw new Error("Tool call has no pending approval");if(!this.threadApi)throw new Error("Thread API is not available");return this.threadApi.getState().respondToToolApproval(Gc(e.approval,t))}subscribe(t){return this.contentBinding.subscribe(t)}};var Wc=(t,e)=>{let r=t.content[e];if(!r)return ye;let o=xi(t,e,r);return Object.freeze({...r,[vt]:r[vt],status:o})},Kc=class{constructor(t,e){f(this,"_core");f(this,"_threadBinding");f(this,"composer");f(this,"_getEditComposerRuntimeCore",()=>this._threadBinding.getState().getEditComposer(this._core.getState().id));this._core=t,this._threadBinding=e,this.composer=new Uc(new Gt({path:{...this.path,ref:`${this.path.ref}.composer`,composerSource:"edit"},getState:this._getEditComposerRuntimeCore,subscribe:r=>this._threadBinding.subscribe(r)}),()=>this._threadBinding.getState().beginEdit(this._core.getState().id)),this.__internal_bindMethods()}get path(){return this._core.path}__internal_bindMethods(){this.reload=this.reload.bind(this),this.delete=this.delete.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this),this.getMessagePartByIndex=this.getMessagePartByIndex.bind(this),this.getMessagePartByToolCallId=this.getMessagePartByToolCallId.bind(this),this.getAttachmentByIndex=this.getAttachmentByIndex.bind(this),this.unstable_getCopyText=this.unstable_getCopyText.bind(this),this.speak=this.speak.bind(this),this.stopSpeaking=this.stopSpeaking.bind(this),this.submitFeedback=this.submitFeedback.bind(this),this.switchToBranch=this.switchToBranch.bind(this)}getState(){return this._core.getState()}delete(){let t=this._core.getState();return this._threadBinding.getState().deleteMessage(t.id)}reload(t={}){let e=this._getEditComposerRuntimeCore(),r=e??this._threadBinding.getState().composer,o=e??r,{runConfig:i=o.runConfig}=t,s=this._core.getState();if(s.role!=="assistant")throw new Error("Can only reload assistant messages");this._threadBinding.getState().startRun({parentId:s.parentId,sourceId:s.id,runConfig:i})}speak(){let t=this._core.getState();return this._threadBinding.getState().speak(t.id)}stopSpeaking(){let t=this._core.getState();if(this._threadBinding.getState().speech?.messageId===t.id)this._threadBinding.getState().stopSpeaking();else throw new Error("Message is not being spoken")}submitFeedback({type:t,comment:e}){let r=this._core.getState();this._threadBinding.getState().submitFeedback({messageId:r.id,type:t,...e!==void 0?{comment:e}:void 0})}switchToBranch({position:t,branchId:e}){let r=this._core.getState();if(e&&t)throw new Error("May not specify both branchId and position");if(!e&&!t)throw new Error("Must specify either branchId or position");let o=this._threadBinding.getState().getBranches(r.id),i=e;if(t==="previous"?i=o[r.branchNumber-2]:t==="next"&&(i=o[r.branchNumber]),!i)throw new Error("Branch not found");this._threadBinding.getState().switchToBranch(i)}unstable_getCopyText(){return At(this.getState())}subscribe(t){return this._core.subscribe(t)}getMessagePartByIndex(t){if(t<0)throw new Error("Message part index must be >= 0");return new Sn(new _e({path:{...this.path,ref:`${this.path.ref}.content[${t}]`,messagePartSelector:{type:"index",index:t}},getState:()=>Wc(this.getState(),t),subscribe:e=>this._core.subscribe(e)}),this._core,this._threadBinding)}getMessagePartByToolCallId(t){return new Sn(new _e({path:{...this.path,ref:`${this.path.ref}.content[toolCallId=${JSON.stringify(t)}]`,messagePartSelector:{type:"toolCallId",toolCallId:t}},getState:()=>{let e=this._core.getState(),r=e.content.findIndex(o=>o.type==="tool-call"&&o.toolCallId===t);return r===-1?ye:Wc(e,r)},subscribe:e=>this._core.subscribe(e)}),this._core,this._threadBinding)}getAttachmentByIndex(t){return new Lc(new _e({path:{...this.path,ref:`${this.path.ref}.attachments[${t}]`,attachmentSource:"message",attachmentSelector:{type:"index",index:t}},getState:()=>{let e=this.getState().attachments?.[t];return e?{...e,source:"message"}:ye},subscribe:e=>this._core.subscribe(e)}))}};var bf=t=>({parentId:t.parentId??null,sourceId:t.sourceId??null,runConfig:t.runConfig??{},...t.stream?{stream:t.stream}:{}}),wf=t=>({parentId:t.parentId??null,sourceId:t.sourceId??null,runConfig:t.runConfig??{}}),xf=(t,e)=>typeof e=="string"?{createdAt:new Date,parentId:t.at(-1)?.id??null,sourceId:null,runConfig:{},role:"user",content:[{type:"text",text:e}],attachments:[],metadata:{custom:{}}}:{createdAt:e.createdAt??new Date,parentId:e.parentId===void 0?t.at(-1)?.id??null:e.parentId,sourceId:e.sourceId??null,role:e.role??"user",content:e.content,attachments:e.attachments??[],metadata:e.metadata??{custom:{}},runConfig:e.runConfig??{},startRun:e.startRun},Tn=t=>{if(t.isRunning!==void 0)return t.isRunning;let e=t.messages.at(-1);return e?.role==="assistant"&&e.status.type==="running"},yf=(t,e)=>Object.freeze({threadId:e.id,metadata:e,capabilities:t.capabilities,isDisabled:t.isDisabled,isLoading:t.isLoading,isRunning:Tn(t),messages:t.messages,state:t.state,suggestions:t.suggestions,extras:t.extras,speech:t.speech,voice:t.voice}),Jc=class{constructor(t,e){f(this,"_threadBinding");f(this,"_stateBinding");f(this,"composer");f(this,"_eventSubscriptionSubjects",new Map);let r=new _e({path:t.path,getState:()=>yf(t.getState(),e.getState()),subscribe:o=>{let i=t.subscribe(o),s=e.subscribe(o);return()=>ci([i,s])}});this._stateBinding=r,this._threadBinding={path:t.path,getState:()=>t.getState(),getStateState:()=>r.getState(),outerSubscribe:o=>t.outerSubscribe(o),subscribe:o=>t.subscribe(o)},this.composer=new Vc(new Gt({path:{...this.path,ref:`${this.path.ref}.composer`,composerSource:"thread"},getState:()=>this._threadBinding.getState().composer,subscribe:o=>this._threadBinding.subscribe(o)})),this.__internal_bindMethods()}get path(){return this._threadBinding.path}get __internal_threadBinding(){return this._threadBinding}__internal_bindMethods(){this.append=this.append.bind(this),this.deleteMessage=this.deleteMessage.bind(this),this.resumeRun=this.resumeRun.bind(this),this.importExternalState=this.importExternalState.bind(this),this.exportExternalState=this.exportExternalState.bind(this),this.startRun=this.startRun.bind(this),this.cancelRun=this.cancelRun.bind(this),this.unstable_notifySessionReset=this.unstable_notifySessionReset.bind(this),this.stopSpeaking=this.stopSpeaking.bind(this),this.connectVoice=this.connectVoice.bind(this),this.disconnectVoice=this.disconnectVoice.bind(this),this.muteVoice=this.muteVoice.bind(this),this.unmuteVoice=this.unmuteVoice.bind(this),this.getVoiceVolume=this.getVoiceVolume.bind(this),this.subscribeVoiceVolume=this.subscribeVoiceVolume.bind(this),this.export=this.export.bind(this),this.import=this.import.bind(this),this.reset=this.reset.bind(this),this.getMessageByIndex=this.getMessageByIndex.bind(this),this.getMessageById=this.getMessageById.bind(this),this.subscribe=this.subscribe.bind(this),this.unstable_on=this.unstable_on.bind(this),this.getModelContext=this.getModelContext.bind(this),this.getState=this.getState.bind(this)}getState(){return this._threadBinding.getStateState()}append(t){let e=this._threadBinding.getState().append(xf(this._threadBinding.getState().messages,t));Promise.resolve(e).catch(r=>{if(!Pi(r))throw r})}deleteMessage(t){return this._threadBinding.getState().deleteMessage(t)}subscribe(t){return this._stateBinding.subscribe(t)}getModelContext(){return this._threadBinding.getState().getModelContext()}startRun(t){return this._threadBinding.getState().startRun(wf(t))}resumeRun(t){return this._threadBinding.getState().resumeRun(bf(t))}exportExternalState(){return this._threadBinding.getState().exportExternalState()}importExternalState(t){this._threadBinding.getState().importExternalState(t)}cancelRun(){this._threadBinding.getState().cancelRun()}unstable_notifySessionReset(){this._threadBinding.getState().unstable_notifySessionReset()}stopSpeaking(){return this._threadBinding.getState().stopSpeaking()}connectVoice(){this._threadBinding.getState().connectVoice()}disconnectVoice(){this._threadBinding.getState().disconnectVoice()}getVoiceVolume(){return this._threadBinding.getState().getVoiceVolume()}subscribeVoiceVolume(t){return this._threadBinding.getState().subscribeVoiceVolume(t)}muteVoice(){this._threadBinding.getState().muteVoice()}unmuteVoice(){this._threadBinding.getState().unmuteVoice()}export(){return this._threadBinding.getState().export()}import(t){this._threadBinding.getState().import(t)}reset(t){this._threadBinding.getState().reset(t)}getMessageByIndex(t){if(t<0)throw new Error("Message index must be >= 0");return this._getMessageRuntime({...this.path,ref:`${this.path.ref}.messages[${t}]`,messageSelector:{type:"index",index:t}},()=>{let e=this._threadBinding.getState().messages,r=e[t];if(r)return{message:r,parentId:e[t-1]?.id??null,index:t}})}getMessageById(t){return this._getMessageRuntime({...this.path,ref:`${this.path.ref}.messages[messageId=${JSON.stringify(t)}]`,messageSelector:{type:"messageId",messageId:t}},()=>this._threadBinding.getState().getMessageById(t))}_getMessageRuntime(t,e){return new Kc(new _e({path:t,getState:()=>{let{message:r,parentId:o,index:i}=e()??{},{messages:s,speech:n}=this._threadBinding.getState();if(!r||o===void 0||i===void 0)return ye;let a=this._threadBinding.getState().getBranches(r.id);return{...r,[vt]:r[vt],index:i,isLast:s.at(-1)?.id===r.id,parentId:o,branchNumber:a.indexOf(r.id)+1,branchCount:a.length,speech:n?.messageId===r.id?n:void 0}},subscribe:r=>this._threadBinding.subscribe(r)}),this._threadBinding)}unstable_on(t,e){let r=this._eventSubscriptionSubjects.get(t);return r||(r=new ui({event:t,binding:this._threadBinding}),this._eventSubscriptionSubjects.set(t,r)),r.subscribe(e)}};var eo=class{constructor(t,e){f(this,"_core");f(this,"_threadListBinding");this._core=t,this._threadListBinding=e,this.__internal_bindMethods()}get path(){return this._core.path}__internal_bindMethods(){this.switchTo=this.switchTo.bind(this),this.rename=this.rename.bind(this),this.updateCustom=this.updateCustom.bind(this),this.archive=this.archive.bind(this),this.unarchive=this.unarchive.bind(this),this.delete=this.delete.bind(this),this.initialize=this.initialize.bind(this),this.generateTitle=this.generateTitle.bind(this),this.subscribe=this.subscribe.bind(this),this.unstable_on=this.unstable_on.bind(this),this.getState=this.getState.bind(this),this.detach=this.detach.bind(this)}getState(){return this._core.getState()}switchTo(t){let e=this._core.getState();return this._threadListBinding.switchToThread(e.id,t)}rename(t){let e=this._core.getState();return this._threadListBinding.rename(e.id,t)}updateCustom(t){let e=this._core.getState();if(!this._threadListBinding.updateCustom)throw new Error("Thread list runtime does not support updating custom metadata");return this._threadListBinding.updateCustom(e.id,t)}archive(){let t=this._core.getState();return this._threadListBinding.archive(t.id)}unarchive(){let t=this._core.getState();return this._threadListBinding.unarchive(t.id)}delete(){let t=this._core.getState();return this._threadListBinding.delete(t.id)}initialize(){let t=this._core.getState();return this._threadListBinding.initialize(t.id)}generateTitle(t){let e=this._core.getState();return this._threadListBinding.generateTitle(e.id,t)}unstable_on(t,e){let r=this._core.getState().isMain,o=this._core.getState().id;return this.subscribe(()=>{let i=this._core.getState(),s=i.isMain,n=i.id;r===s&&o===n||(r=s,o=n,!(t==="switchedTo"&&!s)&&(t==="switchedAway"&&s||le([e],{},`Thread list item "${t}"`)))})}subscribe(t){return this._core.subscribe(t)}detach(){let t=this._core.getState();this._threadListBinding.detach(t.id)}__internal_getRuntime(){return this}};var kn=Promise.resolve(),_f=()=>{},Sf=t=>({mainThreadId:t.mainThreadId,newThreadId:t.newThreadId,threadIds:t.threadIds,archivedThreadIds:t.archivedThreadIds,isLoading:t.isLoading,loadError:t.loadError,isLoadingMore:t.isLoadingMore??!1,hasMore:t.hasMore??!1,threadItems:t.threadItems}),Oi=(t,e)=>{if(e===void 0)return ye;let r=t.getItemById(e);return r?{id:r.id,remoteId:r.remoteId,externalId:r.externalId,title:r.title,status:r.status,lastMessageAt:r.lastMessageAt,custom:r.custom,isMain:r.id===t.mainThreadId,isRunning:t.unstable_isThreadRunning?.(r.id)??!1}:ye},Qc=class{constructor(t,e=Jc){f(this,"_getState");f(this,"_stateBinding");f(this,"_core");f(this,"_runtimeFactory");f(this,"_mainThreadListItemRuntime");f(this,"main");this._core=t,this._runtimeFactory=e;let r=new Kr({path:{},getState:()=>Sf(t),subscribe:o=>t.subscribe(o)});this._getState=r.getState.bind(r),this._stateBinding=r,this._mainThreadListItemRuntime=new eo(new _e({path:{ref:"threadItems[main]",threadSelector:{type:"main"}},getState:()=>Oi(this._core,this._core.mainThreadId),subscribe:o=>this._core.subscribe(o)}),this._core),this.main=new e(new Gt({path:{ref:"threads.main",threadSelector:{type:"main"}},getState:()=>t.getMainThreadRuntimeCore(),subscribe:o=>t.subscribe(o)}),this._mainThreadListItemRuntime),this.__internal_bindMethods()}__internal_bindMethods(){this.switchToThread=this.switchToThread.bind(this),this.switchToNewThread=this.switchToNewThread.bind(this),this.unstable_subscribeThreadEvents=this.unstable_subscribeThreadEvents.bind(this),this.getLoadThreadsPromise=this.getLoadThreadsPromise.bind(this),this.reload=this.reload.bind(this),this.reloadMainThread=this.reloadMainThread.bind(this),this.loadMore=this.loadMore.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this),this.getById=this.getById.bind(this),this.getItemById=this.getItemById.bind(this),this.getItemByIndex=this.getItemByIndex.bind(this),this.getArchivedItemByIndex=this.getArchivedItemByIndex.bind(this)}switchToThread(t,e){return this._core.switchToThread(t,e)}switchToNewThread(){return this._core.switchToNewThread()}unstable_subscribeThreadEvents(t){return this._core.unstable_subscribeThreadEvents?.(t)??_f}getLoadThreadsPromise(){return this._core.getLoadThreadsPromise()}reload(){return this._core.reload?.()??kn}reloadMainThread(){return this._core.reloadMainThread?.()??kn}loadMore(){return this._core.loadMore?.()??kn}getState(){return this._getState()}subscribe(t){return this._stateBinding.subscribe(t)}get mainItem(){return this._mainThreadListItemRuntime}_createItemStateBinding(t){return new _e({path:{ref:`threadItems[threadId=${t}]`,threadSelector:{type:"threadId",threadId:t}},getState:()=>Oi(this._core,t),subscribe:e=>this._core.subscribe(e)})}getById(t){return new this._runtimeFactory(new Gt({path:{ref:`threads[threadId=${JSON.stringify(t)}]`,threadSelector:{type:"threadId",threadId:t}},getState:()=>this._core.getThreadRuntimeCore(t),subscribe:e=>this._core.subscribe(e)}),this._createItemStateBinding(t))}getItemByIndex(t){return new eo(new _e({path:{ref:`threadItems[${t}]`,threadSelector:{type:"index",index:t}},getState:()=>Oi(this._core,this._core.threadIds[t]),subscribe:e=>this._core.subscribe(e)}),this._core)}getArchivedItemByIndex(t){return new eo(new _e({path:{ref:`archivedThreadItems[${t}]`,threadSelector:{type:"archiveIndex",index:t}},getState:()=>Oi(this._core,this._core.archivedThreadIds[t]),subscribe:e=>this._core.subscribe(e)}),this._core)}getItemById(t){return new eo(this._createItemStateBinding(t),this._core)}};var Yc=class{constructor(t){f(this,"threads");f(this,"_thread");f(this,"_core");this._core=t,this.threads=new Qc(t.threads),this._thread=this.threads.main,this.__internal_bindMethods()}__internal_bindMethods(){this.registerModelContextProvider=this.registerModelContextProvider.bind(this)}get thread(){return this._thread}registerModelContextProvider(t){return this._core.registerModelContextProvider(t)}};var Xc=new WeakMap,to=t=>Xc.get(t)??0,Ni=(t,e)=>to(t)===e,Bi=t=>{Xc.set(t,to(t)+1)};var Zc=class{constructor(){f(this,"_contextProvider",new pi)}registerModelContextProvider(t){return this._contextProvider.registerModelContextProvider(t)}getModelContextProvider(){return this._contextProvider}};var Yt=Object.freeze([]),yr="DEFAULT_THREAD_ID",Tf=Object.freeze([yr]),kf=Object.freeze({id:yr,remoteId:void 0,externalId:void 0,status:"regular"}),If=Promise.resolve(),ed=Object.freeze(me({[yr]:kf})),td=class extends hr{constructor(e={},r){super();f(this,"_mainThreadId",yr);f(this,"_threads",Tf);f(this,"_archivedThreads",Yt);f(this,"_threadData",ed);f(this,"adapter",{});f(this,"_mainThread");f(this,"threadFactory");this.threadFactory=r,this.__internal_setAdapter(e,!0)}get isLoading(){return this.adapter.isLoading??!1}get newThreadId(){}get threadIds(){return this._threads}get archivedThreadIds(){return this._archivedThreads}get threadItems(){return this._threadData}getLoadThreadsPromise(){return If}get mainThreadId(){return this._mainThreadId}getMainThreadRuntimeCore(){return this._mainThread}getThreadRuntimeCore(){throw new Error("Method not implemented.")}getItemById(e){return Object.hasOwn(this._threadData,e)?this._threadData[e]:void 0}__internal_setAdapter(e,r=!1){let o=this.adapter;this.adapter=e;let i=e.threadId??yr,s=e.threads??Yt,n=e.archivedThreads??Yt,a=o.threadId??yr,l=o.threads??Yt,c=o.archivedThreads??Yt;!r&&(o.isLoading??!1)===(e.isLoading??!1)&&a===i&&l===s&&c===n||((l!==s||c!==n||a!==i)&&(this._threadData=me(ed,Object.fromEntries(e.threads?.map(d=>[d.id,{...d,remoteId:d.remoteId,externalId:d.externalId,status:"regular"}])??[]),Object.fromEntries(e.archivedThreads?.map(d=>[d.id,{...d,remoteId:d.remoteId,externalId:d.externalId,status:"archived"}])??[]))),l!==s&&(this._threads=this.adapter.threads?.map(d=>d.id)??Yt),c!==n&&(this._archivedThreads=this.adapter.archivedThreads?.map(d=>d.id)??Yt),(r||a!==i)&&(r||Bi(this._mainThread),this._mainThreadId=i,this._mainThread=this.threadFactory()),Object.hasOwn(this._threadData,this._mainThreadId)||(this._threadData=me(this._threadData,{[this._mainThreadId]:{id:this._mainThreadId,remoteId:void 0,externalId:void 0,status:"regular"}})),this._notifySubscribers())}async reloadMainThread(){this._mainThread.unstable_refetchThread&&await this._mainThread.unstable_refetchThread()}async switchToThread(e,r){if(this._mainThreadId===e)return;let o=this.adapter.onSwitchToThread;if(!o)throw new Error("External store adapter does not support switching to thread");await o(e)}async switchToNewThread(){let e=this.adapter.onSwitchToNewThread;if(!e)throw new Error("External store adapter does not support switching to new thread");await e()}async rename(e,r){let o=this.adapter.onRename;if(!o)throw new Error("External store adapter does not support renaming");await o(e,r)}async updateCustom(e,r){let o=this.adapter.onUpdateCustom;if(!o)throw new Error("External store adapter does not support updating custom metadata");await o(e,r)}async detach(){}async archive(e){let r=this.adapter.onArchive;if(!r)throw new Error("External store adapter does not support archiving");await r(e)}async unarchive(e){let r=this.adapter.onUnarchive;if(!r)throw new Error("External store adapter does not support unarchiving");await r(e)}async delete(e){let r=this.adapter.onDelete;if(!r)throw new Error("External store adapter does not support deleting");await r(e)}initialize(e){return Promise.resolve({remoteId:e,externalId:void 0})}generateTitle(){throw new Error("Method not implemented.")}};var Li={fromArray:t=>{let e=t.map(r=>xr(r,Be(),gn(r.content)));return{messages:e.map((r,o)=>({parentId:o>0?e[o-1].id:null,message:r}))}},fromBranchableArray:(t,e)=>({...e?.headId!==void 0?{headId:e.headId}:void 0,messages:t.map(({message:r,parentId:o})=>{if(!r.id)throw new Error("ExportedMessageRepository.fromBranchableArray: Each message must have an 'id' field set.");return{parentId:o,message:xr(r,r.id,gn(r.content))}})})},$i=t=>{let e=t;for(;e.next;)e=e.next;return"current"in e?e:null},Cf=class{constructor(t){f(this,"_value",null);f(this,"func");this.func=t}get value(){return this._value===null&&(this._value=this.func()),this._value}dirty(){this._value=null}},ji=class{constructor(){f(this,"messages",new Map);f(this,"head",null);f(this,"root",{children:[],next:null});f(this,"_messages",new Cf(()=>{let t=new Array((this.head?.level??-1)+1);for(let e=this.head;e;e=e.prev)t[e.level]=e.current;return t}))}updateLevels(t,e){let r=[{message:t,level:e}];for(;r.length>0;){let o=r.pop();o.message.level=o.level;for(let i of o.message.children){let s=this.messages.get(i);s&&r.push({message:s,level:o.level+1})}}}selectPathTo(t){for(let e=t;e;e=e.prev)(e.prev??this.root).next=e}performOp(t,e,r){let o=e.prev??this.root,i=t??this.root;if(!(r==="relink"&&o===i)){if(r==="relink"){for(let s=t;s;s=s.prev)if(s.current.id===e.current.id)throw new Error("MessageRepository(performOp/relink): A message with the same id already exists in the parent tree. This error occurs if the same message id is found multiple times. This is likely an internal bug in assistant-ui.")}if(r!=="link"&&(o.children=o.children.filter(s=>s!==e.current.id),o.next===e)){let s=o.children.at(-1),n=s?this.messages.get(s):null;if(n===void 0)throw new Error("MessageRepository(performOp/cut): Fallback sibling message not found. This is likely an internal bug in assistant-ui.");o.next=n}if(r!=="cut"){i.children=[...i.children,e.current.id],e.prev=t,$i(e)===this.head?this.selectPathTo(e):i.next===null&&(i.next=e,this.head===i&&(this.head=$i(e)));let s=t?t.level+1:0;this.updateLevels(e,s)}}}get headId(){return this.head?.current.id??null}get canonicalHeadId(){let t=this.head;for(;t?.current.metadata?.isOptimistic;)t=t.prev;return t?.current.id??null}getMessages(t){if(t===void 0||t===this.head?.current.id)return this._messages.value;let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(getMessages): Head message not found. This is likely an internal bug in assistant-ui.");let r=new Array(e.level+1);for(let o=e;o;o=o.prev)r[o.level]=o.current;return r}addOrUpdateMessage(t,e){let r=this.messages.get(e.id),o=t?this.messages.get(t):null;if(o===void 0)throw new Error("MessageRepository(addOrUpdateMessage): Parent message not found. This is likely an internal bug in assistant-ui.");if(r){r.current=e,this.performOp(o,r,"relink"),this._messages.dirty();return}let i={prev:o,current:e,next:null,children:[],level:o?o.level+1:0};this.messages.set(e.id,i),this.performOp(o,i,"link"),this.head===o&&(this.head=i),this._messages.dirty()}getMessage(t){let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(updateMessage): Message not found. This is likely an internal bug in assistant-ui.");return{parentId:e.prev?.current.id??null,message:e.current,index:e.level}}deleteMessage(t,e){let r=this.messages.get(t);if(!r)throw new Error("MessageRepository(deleteMessage): Message not found. This is likely an internal bug in assistant-ui.");let o=e===void 0?r.prev:e===null?null:this.messages.get(e);if(o===void 0)throw new Error("MessageRepository(deleteMessage): Replacement not found. This is likely an internal bug in assistant-ui.");for(let i of r.children){let s=this.messages.get(i);if(!s)throw new Error("MessageRepository(deleteMessage): Child message not found. This is likely an internal bug in assistant-ui.");this.performOp(o,s,"relink")}this.performOp(null,r,"cut"),this.messages.delete(t),this.head===r&&(this.head=$i(o??this.root)),this._messages.dirty()}getBranches(t){let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(getBranches): Message not found. This is likely an internal bug in assistant-ui.");let{children:r}=e.prev??this.root;return r}evictOffBranchOptimisticMessages(t,e){if(!t)return;let r=new Set;for(let i=e;i;i=i.prev)r.add(i.current.id);let o=[];for(let i=t;i&&!r.has(i.current.id);i=i.prev)i.current.metadata?.isOptimistic&&o.push(i.current.id);for(let i of o)this.messages.has(i)&&this.deleteMessage(i)}switchToBranch(t){let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(switchToBranch): Branch not found. This is likely an internal bug in assistant-ui.");let r=this.head;this.selectPathTo(e),this.head=$i(e),this.evictOffBranchOptimisticMessages(r,this.head),this._messages.dirty()}resetHead(t){if(t===null){this.clear();return}let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(resetHead): Branch not found. This is likely an internal bug in assistant-ui.");let r=this.head;if(e.children.length>0){let o=[...e.children];for(;o.length>0;){let i=o.pop(),s=this.messages.get(i);if(s){for(let n of s.children)o.push(n);this.messages.delete(i)}}e.children=[],e.next=null}this.head=e,this.selectPathTo(e),this.evictOffBranchOptimisticMessages(r,this.head),this._messages.dirty()}clear(){this.messages.clear(),this.head=null,this.root={children:[],next:null},this._messages.dirty()}export(){let t=[],e=[...this.root.children].reverse();for(;e.length>0;){let r=this.messages.get(e.pop());if(!r)continue;for(let i=r.children.length-1;i>=0;i--)e.push(r.children[i]);if(r.current.metadata?.isOptimistic)continue;let o=r.prev;for(;o&&o.current.metadata?.isOptimistic;)o=o.prev;t.push({message:r.current,parentId:o?.current.id??null})}return{headId:this.canonicalHeadId,messages:t}}import({headId:t,messages:e}){for(let{message:r,parentId:o}of e)this.addOrUpdateMessage(o,r);this.resetHead(t??e.at(-1)?.message.id??null)}};var Mt=Object.freeze([]);function*ro(t){for(let e of t)if(!(e?.role!=="assistant"||!Array.isArray(e.content)))for(let r of e.content)!r||r.type!=="tool-call"||(yield{part:r,messageId:e.id},r.messages?.length&&(yield*ro(r.messages)))}function In(t,e){if(e==="*")return!0;let r=e.split(",").map(s=>s.trim().toLowerCase()),o=t.name.toLowerCase(),i=t.type.split(";",1)[0].trim().toLowerCase();for(let s of r){if(s.startsWith(".")&&o.endsWith(s)||s.includes("/")&&s===i)return!0;if(s.endsWith("/*")){let n=s.split("/")[0];if(i.startsWith(`${n}/`))return!0}}return!1}function Ef(t){let e=Be();return t.type==="image"?{id:e,type:"image",name:t.filename??"image",content:[t],status:{type:"complete"}}:t.type==="file"?{id:e,type:"document",name:t.filename??"document",contentType:t.mimeType,content:[t],status:{type:"complete"}}:t.type==="audio"?{id:e,type:"audio",name:`audio.${t.audio.format}`,contentType:`audio/${t.audio.format}`,content:[t],status:{type:"complete"}}:{id:e,type:"data",name:t.name,content:[t],status:{type:"complete"}}}function rd(t){let e=[];for(let r of t)r.type!=="text"&&e.push(Ef(r));return e}var od=t=>"content"in t&&!("lastModified"in t),oo=t=>t.status.type==="complete";var id=class{constructor(){f(this,"operations",new Set)}start(){let t={cancelled:!1,attachmentIds:new Set};return this.operations.add(t),t}accept(t,e){return t.cancelled?!1:(t.attachmentIds.add(e),!0)}finish(t){this.operations.delete(t)}isCancelled(t){return t.cancelled}cancel(t){for(let e of[...this.operations])e.attachmentIds.has(t)&&(e.cancelled=!0,this.operations.delete(e))}cancelAll(){for(let t of this.operations)t.cancelled=!0;this.operations.clear()}},sd=async(t,e)=>{if(Symbol.asyncIterator in t){for await(let r of t)if(!e(r))break}else e(await t)};var Fi=class extends hr{constructor(){super(...arguments);f(this,"isEditing",!0);f(this,"_attachments",[]);f(this,"_text","");f(this,"_role","user");f(this,"_runConfig",{});f(this,"_quote");f(this,"_isSending",!1);f(this,"_removedDuringSend",new Set);f(this,"_sendGeneration",0);f(this,"_attachmentAddOperations",new id);f(this,"_dictation");f(this,"_dictationSession");f(this,"_dictationUnsubscribes",[]);f(this,"_dictationBaseText","");f(this,"_currentInterimText","");f(this,"_dictationSessionIdCounter",0);f(this,"_activeDictationSessionId");f(this,"_isCleaningDictation",!1);f(this,"_eventSubscribers",new Map)}enrichWithComposerMetadata(e,r){return r?{...e,metadata:{...e.metadata,custom:{...e.metadata?.custom,...r}}}:e}get attachmentAccept(){return this.getAttachmentAdapter()?.accept??"*"}get attachments(){return this._attachments}setAttachments(e){this._attachments=e,this._notifySubscribers()}get isEmpty(){return!this.text.trim()&&!this.attachments.length}get text(){return this._text}get role(){return this._role}get runConfig(){return this._runConfig}get quote(){return this._quote}setQuote(e){this._quote!==e&&(this._quote=e,this._notifySubscribers())}setText(e){this._text!==e&&(this._text=e,this._rebaseDictation(e),this._notifySubscribers())}_rebaseDictation(e){if(!this._dictation)return;this._dictationBaseText=e,this._currentInterimText="";let{status:r,inputDisabled:o}=this._dictation;this._dictation=o?{status:r,inputDisabled:o}:{status:r}}setRole(e){this._role!==e&&(this._role=e,this._notifySubscribers())}setRunConfig(e){this._runConfig!==e&&(this._runConfig=e,this._notifySubscribers())}_cancelAttachmentAdd(e){this._attachmentAddOperations.cancel(e)}_cancelAllAttachmentAdds(){this._attachmentAddOperations.cancelAll()}_emptyTextAndAttachments(){this._attachments=[],this._text="",this._rebaseDictation(""),this._notifySubscribers()}async _onClearAttachments(){let e=this.getAttachmentAdapter();if(e){let r=this._attachments.filter(o=>!oo(o));await Promise.all(r.map(async o=>e.remove(o)))}}async reset(){if(this._cancelAllAttachmentAdds(),this._sendGeneration++,this._isSending=!1,this._removedDuringSend.clear(),this._attachments.length===0&&this._text===""&&this._role==="user"&&Object.keys(this._runConfig).length===0&&this._quote===void 0)return;this._role="user",this._runConfig={},this._quote=void 0;let e=this._onClearAttachments();this._emptyTextAndAttachments(),await e}async clearAttachments(){if(this._cancelAllAttachmentAdds(),this._isSending)for(let r of this._attachments)this._removedDuringSend.add(r.id);let e=this._onClearAttachments();this.setAttachments([]),await e}async send(e){if(!this.canSend||this._isSending)return;if(this._dictationSession)try{this._dictationSession.cancel()}catch(w){console.error("[assistant-ui] Dictation session cancel threw",w)}finally{this._cleanupDictation()}let r=this.getAttachmentAdapter(),o=this.attachments.map(async w=>{if(oo(w))return w;if(!r)throw new Error("Attachments are not supported");return await r.send(w)}),i=this.attachments,s=this.text,n=this._quote,a=this.role,l=this.runConfig;this._quote=void 0,this._text="",this._isSending=!0;let c=++this._sendGeneration;this._notifySubscribers();let d;try{d=await Promise.all(o)}catch(w){throw c===this._sendGeneration&&(!this.text.trim()&&this._quote===void 0&&(this._text=s,this._rebaseDictation(s),this._quote=n,this._notifySubscribers()),Promise.allSettled(o).then(()=>{c===this._sendGeneration&&(this._removedDuringSend.clear(),this._isSending=!1,this._notifySubscribers())})),w}if(c!==this._sendGeneration)return;let h=new Set(i.map(w=>w.id));this._attachments=this._attachments.filter(w=>!h.has(w.id)),this._isSending=!1,this._notifySubscribers();let u=d.filter(w=>!this._removedDuringSend.has(w.id));this._removedDuringSend.clear();let p={createdAt:new Date,role:a,content:s?[{type:"text",text:s}]:[],attachments:u,runConfig:l,metadata:{custom:{...n?{quote:n}:{}}}},m={text:s,quote:n,attachments:u},g;try{g=this.handleSend(p,e)}catch(w){throw this._restoreUnsentDraft(w,c,m),w}g&&g.catch(w=>{this._restoreUnsentDraft(w,c,m)}),this._notifyEventSubscribers("send",{chars:s.length,attachments:u.length})}restoreDraft(e){return this._text.trim()||this._quote!==void 0||this._attachments.length>0?!1:(this._text=e.text,this._rebaseDictation(e.text),this._quote=e.quote,this._attachments=e.attachments??[],this._notifySubscribers(),!0)}retractDraft(e){let r=e.attachments!==void 0?this._attachments===e.attachments:this._attachments.length===0;this._text!==e.text||this._quote!==e.quote||!r||(this._text="",this._rebaseDictation(""),this._quote=void 0,this._attachments=[],this._notifySubscribers())}_restoreUnsentDraft(e,r,o){Pi(e)&&r===this._sendGeneration&&this.restoreDraft(o)}cancel(){this.handleCancel()}get queue(){return Mt}moveQueueItem(e,r){}removeQueueItem(e){}async addAttachment(e){if(od(e)){let n=this.getAttachmentAdapter();if(n&&!In({name:e.name,type:e.contentType??""},n.accept)){let l=`File type ${e.contentType||"unknown"} is not accepted. Accepted types: ${n.accept}`,c=new Error(l);throw this._safeEmitAttachmentAddError("not-accepted",l,void 0,c,e.contentType),c}let a={id:e.id??Be(),type:e.type??"document",name:e.name,contentType:e.contentType,content:e.content,status:{type:"complete"}};this._attachments=[...this._attachments,a],this._notifySubscribers(),this._notifyEventSubscribers("attachmentAdd",{...a.contentType?{contentType:a.contentType}:void 0});return}let r=this.getAttachmentAdapter();if(!r){let n="Attachments are not supported",a=new Error(n);throw this._safeEmitAttachmentAddError("no-adapter",n,void 0,a,e.type),a}if(!In({name:e.name,type:e.type},r.accept)){let n=`File type ${e.type||"unknown"} is not accepted. Accepted types: ${r.accept}`,a=new Error(n);throw this._safeEmitAttachmentAddError("not-accepted",n,void 0,a,e.type),a}let o=this._attachmentAddOperations.start(),i=n=>{if(!this._attachmentAddOperations.accept(o,n.id))return!1;let a=this._attachments.findIndex(l=>l.id===n.id);return a!==-1?this._attachments=[...this._attachments.slice(0,a),n,...this._attachments.slice(a+1)]:this._attachments=[...this._attachments,n],this._notifySubscribers(),!0},s;try{await sd(r.add({file:e}),n=>(s=n,i(n)))}catch(n){if(this._attachmentAddOperations.isCancelled(o))return;throw s&&i({...s,status:{type:"incomplete",reason:"error",message:n instanceof Error?n.message:String(n)}}),this._safeEmitAttachmentAddError("adapter-error",n instanceof Error?n.message:String(n),s?.id,n instanceof Error?n:void 0,s?.contentType||e.type),n}finally{this._attachmentAddOperations.finish(o)}this._attachmentAddOperations.isCancelled(o)||(s?.status.type==="incomplete"&&s.status.reason==="error"?this._safeEmitAttachmentAddError("adapter-error",s.status.message??"Attachment upload did not complete successfully.",s.id,void 0,s.contentType||e.type):this._notifyEventSubscribers("attachmentAdd",{...s?.contentType?{contentType:s.contentType}:e.type?{contentType:e.type}:void 0}))}_safeEmitAttachmentAddError(e,r,o,i,s){try{this._notifyEventSubscribers("attachmentAddError",{reason:e,message:r,...o!==void 0&&{attachmentId:o},...i!==void 0&&{error:i},...s?{contentType:s}:void 0})}catch(n){console.error("[assistant-ui] attachmentAddError subscriber threw:",n)}}async removeAttachment(e){let r=this._attachments.findIndex(i=>i.id===e);if(r===-1)throw new Error("Attachment not found");let o=this._attachments[r];if(this._cancelAttachmentAdd(e),this._isSending&&this._removedDuringSend.add(e),!oo(o)){let i=this.getAttachmentAdapter();if(!i)throw new Error("Attachments are not supported");try{await i.remove(o)}catch(s){let n=s instanceof Error?s.message:String(s);throw this._attachments=this._attachments.map(a=>a.id===e&&!oo(a)?{...a,status:{type:"incomplete",reason:"error",message:n}}:a),this._notifySubscribers(),s}}this._attachments=this._attachments.filter(i=>i.id!==e),this._notifySubscribers()}get dictation(){return this._dictation}_isActiveSession(e,r){return this._activeDictationSessionId===e&&this._dictationSession===r}startDictation(){let e=this.getDictationAdapter();if(!e)throw new Error("Dictation adapter not configured");let r=this._dictationSession!==void 0;if(this._dictationSession){let d=this._dictationSession;this._cleanupDictation({notify:!1}),this._stopDictationSession(d)}let o=e.disableInputDuringDictation??!1;this._dictationBaseText=this._text,this._currentInterimText="";let i;try{i=e.listen()}catch(d){if(r)try{this._notifySubscribers()}catch(h){console.error("[assistant-ui] Dictation replacement rollback notification threw",h)}throw d}this._dictationSession=i;let s=++this._dictationSessionIdCounter;this._activeDictationSessionId=s,this._dictation={status:i.status,inputDisabled:o},this._notifySubscribers();let n=i.onSpeech(d=>{if(!this._isActiveSession(s,i))return;let h=d.isFinal!==!1,u=this._dictationBaseText&&!this._dictationBaseText.endsWith(" ")&&d.transcript?" ":"";if(h){if(this._dictationBaseText=this._dictationBaseText+u+d.transcript,this._currentInterimText="",this._text=this._dictationBaseText,this._dictation){let{transcript:p,...m}=this._dictation;this._dictation=m}this._notifySubscribers()}else this._currentInterimText=u+d.transcript,this._text=this._dictationBaseText+this._currentInterimText,this._dictation&&(this._dictation={...this._dictation,transcript:d.transcript}),this._notifySubscribers()});this._dictationUnsubscribes.push(n);let a=i.onSpeechStart(()=>{this._isActiveSession(s,i)&&(this._dictation={status:{type:"running"},inputDisabled:o,...this._dictation?.transcript&&{transcript:this._dictation.transcript}},this._notifySubscribers())});this._dictationUnsubscribes.push(a);let l=i.onSpeechEnd(()=>{this._cleanupDictation({sessionId:s})});this._dictationUnsubscribes.push(l);let c=setInterval(()=>{this._isActiveSession(s,i)&&i.status.type==="ended"&&this._cleanupDictation({sessionId:s})},100);this._dictationUnsubscribes.push(()=>clearInterval(c))}stopDictation(){if(!this._dictationSession)return;let e=this._dictationSession,r=this._activeDictationSessionId,o=()=>this._cleanupDictation({sessionId:r});this._stopDictationSession(e,o)}_stopDictationSession(e,r=()=>{}){let o;try{o=e.stop()}catch(i){console.error("[assistant-ui] Dictation session stop threw",i),r();return}o.then(r,i=>{console.error("[assistant-ui] Dictation session stop rejected",i),r()})}_cleanupDictation(e){if(e?.sessionId!==void 0&&e.sessionId!==this._activeDictationSessionId||this._isCleaningDictation)return;this._isCleaningDictation=!0;let r=o=>{try{o()}catch(i){console.error("[assistant-ui] Dictation cleanup threw",i)}};try{let o=this._dictationUnsubscribes;this._dictationUnsubscribes=[],this._dictationSession=void 0,this._activeDictationSessionId=void 0,this._dictation=void 0,this._dictationBaseText="",this._currentInterimText="";for(let i of o)r(i);e?.notify!==!1&&r(()=>this._notifySubscribers())}finally{this._isCleaningDictation=!1}}_notifyEventSubscribers(e,r){let o=this._eventSubscribers.get(e);o&&le(o,r,`Composer runtime "${e}"`)}unstable_on(e,r){let o=r,i=this._eventSubscribers.get(e);return i||(i=new Set,this._eventSubscribers.set(e,i)),i.add(o),()=>{this._eventSubscribers.get(e)?.delete(o)}}};var Rf=t=>t.capabilities?.cancel?Tn(t):!1,nd=class extends Fi{constructor(e){super();f(this,"_queueCache");f(this,"runtime");this.runtime=e,this.connect()}get canCancel(){return Rf(this.runtime)}get canSend(){return!this.isEmpty&&!this.runtime.isSendDisabled&&!this.runtime.voice&&!this._isSending}get queue(){let e=this.runtime.getSteerQueueItems?.()??Mt,r=this.runtime.getQueueItems?.()??Mt,o=this._queueCache;if(o&&o.steer===e&&o.queue===r)return o.flat;let i=e.length===0?r:r.length===0?e:[...e,...r];return this._queueCache={steer:e,queue:r,flat:i},i}moveQueueItem(e,r){this.runtime.moveQueueItem?.(e,r)}removeQueueItem(e){this.runtime.removeQueueItem?.(e)}getAttachmentAdapter(){return this.runtime.adapters?.attachments}getDictationAdapter(){return this.runtime.adapters?.dictation}connect(){let e=!1,r=this.runtime.isSendDisabled,o=this.runtime.voice!==void 0,i=this.queue;return this.runtime.subscribe(()=>{let s=!1,n=this.canCancel;e!==n&&(e=n,s=!0),r!==this.runtime.isSendDisabled&&(r=this.runtime.isSendDisabled,s=!0);let a=this.runtime.voice!==void 0;o!==a&&(o=a,s=!0),i!==this.queue&&(i=this.queue,s=!0),s&&this._notifySubscribers()})}async handleSend(e,r){return this.runtime.append({...e,parentId:this.runtime.messages.at(-1)?.id??null,sourceId:null,startRun:r?.startRun,steer:r?.steer})}async handleCancel(){this.runtime.cancelRun()}};var ad=class extends Fi{constructor(e,r,{parentId:o,message:i}){super();f(this,"_nonTextPassthrough");f(this,"_parentId");f(this,"_sourceId");f(this,"runtime");f(this,"endEditCallback");this.runtime=e;let s=e.voice!==void 0,n=e.subscribe(()=>{let l=e.voice!==void 0;l!==s&&(s=l,this._notifySubscribers())});this.endEditCallback=()=>{n(),r()},this._parentId=o,this._sourceId=i.id,this.setText(At(i)),this.setRole(i.role);let a;i.role==="user"?(a=[...i.attachments??[],...rd(i.content)],this._nonTextPassthrough=[]):(a=i.attachments??[],this._nonTextPassthrough=i.content.filter(l=>l.type!=="text")),this.setAttachments(a),this.setRunConfig({...e.composer.runConfig})}get canCancel(){return!0}get canSend(){return!this.isEmpty&&!this.runtime.voice&&!this._isSending}getAttachmentAdapter(){return this.runtime.adapters?.attachments}getDictationAdapter(){return this.runtime.adapters?.dictation}get parentId(){return this._parentId}get sourceId(){return this._sourceId}async handleSend(e,r){let o=this._nonTextPassthrough.length>0?[...e.content,...this._nonTextPassthrough]:e.content,i=this.runtime.append({...e,content:o,parentId:this._parentId,sourceId:this._sourceId,startRun:r?.startRun});return this.handleCancel(),i}handleCancel(){this.endEditCallback(),this._notifySubscribers()}};var ld=class extends hr{constructor(e){super();f(this,"_isInitialized",!1);f(this,"repository",new ji);f(this,"_voiceMessages",[]);f(this,"_voiceGeneration",0);f(this,"_cachedMergedMessages",null);f(this,"_cachedVoiceGeneration",-1);f(this,"_cachedMergedBase",null);f(this,"composer",new nd(this));f(this,"_contextProvider");f(this,"_editComposers",new Map);f(this,"_stopSpeaking");f(this,"speech");f(this,"_voiceSession");f(this,"_voiceUnsubs",[]);f(this,"voice");f(this,"_voiceVolume",0);f(this,"_voiceVolumeSubscribers",new Set);f(this,"getVoiceVolume",()=>this._voiceVolume);f(this,"subscribeVoiceVolume",e=>(this._voiceVolumeSubscribers.add(e),()=>this._voiceVolumeSubscribers.delete(e)));f(this,"_currentAssistantMsg",null);f(this,"_eventSubscribers",new Map);this._contextProvider=e}_markVoiceMessagesDirty(){this._voiceGeneration++,this._cachedMergedMessages=null}_getBaseMessages(){return this.repository.getMessages()}_commitVoiceMessage(e){}get messages(){if(this._voiceMessages.length===0)return this._getBaseMessages();let e=this._getBaseMessages();if(this._cachedVoiceGeneration!==this._voiceGeneration||this._cachedMergedBase!==e){let r=new Set(e.map(o=>o.id));this._cachedMergedMessages=[...e,...this._voiceMessages.filter(o=>!r.has(o.id))],this._cachedVoiceGeneration=this._voiceGeneration,this._cachedMergedBase=e}return this._cachedMergedMessages}get state(){let e;for(let r of this.messages)r.role==="assistant"&&(e=r);return e?.metadata.unstable_state??null}getModelContext(){return this._contextProvider.getModelContext()}enrichAppendMetadata(e,r=e.parentId){if(e.role!=="user")return e;let o=this.messages,i=r===null?-1:o.findIndex(n=>n.id===r),s=uc(this.getModelContext().unstable_composerMetadata,o.slice(0,i+1));return s?{...e,metadata:{...e.metadata,custom:{...e.metadata?.custom,...s}}}:e}getEditComposer(e){return this._editComposers.get(e)}_isVoiceMessage(e){return e!==null&&this._voiceMessages.some(r=>r.id===e)}_resolveAppendParent(e){return this._isVoiceMessage(e)?this._getBaseMessages().at(-1)?.id??null:e}beginEdit(e){if(this.voice)throw new Error("Cannot edit a message while a voice session is connected");if(this._isVoiceMessage(e))throw new Error("Voice transcript messages cannot be edited");if(this._editComposers.has(e))throw new Error("Edit already in progress");this._editComposers.set(e,new ad(this,()=>this._editComposers.delete(e),this.repository.getMessage(e))),this._notifySubscribers()}getMessageById(e){try{return this.repository.getMessage(e)}catch{let r=this.repository.getMessages(),o=this._voiceMessages.findIndex(i=>i.id===e);return o!==-1?{parentId:o>0?this._voiceMessages[o-1].id:r.at(-1)?.id??null,message:this._voiceMessages[o],index:r.length+o}:void 0}}getBranches(e){return this._voiceMessages.some(r=>r.id===e)?[]:this.repository.getBranches(e)}switchToBranch(e){this.repository.switchToBranch(e),this._notifySubscribers()}_notifyEventSubscribers(e,r){let o=this._eventSubscribers.get(e);o&&le(o,r,`Thread runtime "${e}"`)}_notifyToolApprovalAnswered(e,r,o,i){this._notifyEventSubscribers("toolApprovalAnswered",{messageId:e,toolCallId:r,toolName:o,approved:i})}submitFeedback({messageId:e,type:r,comment:o}){let i=this.adapters?.feedback,s=this.getMessageById(e);if(!s)throw new Error(`Message not found: ${e}`);let{message:n,parentId:a}=s,l=o?.trim(),c={type:r,...l?{comment:l}:void 0};if(i?.submit({message:n,...c}),n.role==="assistant"){let d={...n,metadata:{...n.metadata,submittedFeedback:c}},h=this._voiceMessages.findIndex(u=>u.id===e);h===-1?this.repository.addOrUpdateMessage(a,d):(this._voiceMessages[h]=d,this._currentAssistantMsg===n&&(this._currentAssistantMsg=d),this._markVoiceMessagesDirty())}this._notifySubscribers()}speak(e){let r=this.adapters?.speech;if(!r)throw new Error("Speech adapter not configured");let o=this.getMessageById(e);if(!o)throw new Error(`Message not found: ${e}`);let{message:i}=o,s=this._stopSpeaking,n;try{s?.(),n=r.speak(At(i))}catch(h){if(s&&!this._stopSpeaking)try{this._notifySubscribers()}catch(u){console.error("[assistant-ui] Speech rollback notification threw",u)}throw h}let a,l=()=>{this._stopSpeaking=void 0,this.speech=void 0;let h=a;a=void 0,h?.()},c=()=>{if(this._stopSpeaking===c)try{l()}finally{n.cancel()}},d=()=>{this._stopSpeaking===c&&(n.status.type==="ended"?Ye([l,()=>this._notifySubscribers()]):(this.speech={messageId:e,status:n.status},this._notifySubscribers()))};this._stopSpeaking=c;try{if(a=n.subscribe(d),this._stopSpeaking!==c){a();return}d()}catch(h){if(this._stopSpeaking===c)try{Ye([c,()=>this._notifySubscribers()])}catch(u){console.error("[assistant-ui] Speech rollback cleanup threw",u)}throw h}}stopSpeaking(){if(!this._stopSpeaking)throw new Error("No message is being spoken");Ye([this._stopSpeaking,()=>this._notifySubscribers()])}_onVoiceConnected(){}_onVoiceDisconnected(){}_isRunActive(){if(this.isRunning)return!0;let e=this._getBaseMessages().at(-1);return e?.role==="assistant"&&(e.status.type==="running"||e.status.type==="requires-action")}connectVoice(){let e=this.adapters?.voice;if(!e)throw new Error("Voice adapter not configured");if(this._isRunActive())throw new Error("Cannot start a voice session while a run is in progress or paused on a pending tool action");let r=this._voiceSession!==void 0;try{this._disconnectVoice(!1)}catch(n){console.error("[assistant-ui] Voice cleanup threw before reconnect",n)}let o;try{o=e.connect({})}catch(n){throw r&&this._voiceSession===void 0&&this._onVoiceDisconnected(),n}this._voiceSession=o;let i=[];this._voiceUnsubs=i;let s=()=>{if(this._voiceSession===o&&this._voiceUnsubs===i)return!1;try{Ye(i.splice(0))}catch(n){console.error("[assistant-ui] Detached voice setup cleanup threw",n)}return!0};try{let n="listening";if(this.voice={status:o.status,isMuted:o.isMuted,mode:n},this._voiceVolume=0,this._notifySubscribers(),s()||(i.push(o.onStatusChange(a=>{this._voiceSession===o&&(a.type==="ended"?(this._finishVoiceAssistantMessage(),this._voiceSession=void 0,this.voice=void 0,this._onVoiceDisconnected()):this.voice={status:a,isMuted:o.isMuted,mode:n},this._notifySubscribers())})),s())||(i.push(o.onModeChange(a=>{n=a,this.voice&&(this.voice={...this.voice,mode:a},this._notifySubscribers())})),s())||(i.push(o.onVolumeChange(a=>{this._voiceVolume=a,le(this._voiceVolumeSubscribers,void 0,"Voice volume")})),s()))return;i.push(o.onTranscript(a=>{this._handleVoiceTranscript(a)})),s()||this._onVoiceConnected()}catch(n){if(this._voiceSession===o&&this._voiceUnsubs===i){try{this._disconnectVoice(!1)}catch(a){console.error("[assistant-ui] Voice rollback cleanup threw",a)}r&&this._voiceSession===void 0&&this._onVoiceDisconnected()}else s();throw n}}_handleVoiceTranscript(e){if(this.ensureInitialized(),e.role==="user"){if(this._finishVoiceAssistantMessage(),this._currentAssistantMsg=null,e.isFinal){let r={id:Be(),role:"user",content:[{type:"text",text:e.text}],metadata:{modality:"voice",custom:{}},createdAt:new Date,status:{type:"complete",reason:"unknown"},attachments:[]};this._voiceMessages.push(r),this._commitVoiceMessage(r),this._markVoiceMessagesDirty(),this._notifySubscribers()}}else{let r=e.isFinal?{type:"complete",reason:"stop"}:{type:"running"};if(!this._currentAssistantMsg)this._currentAssistantMsg={id:Be(),role:"assistant",content:[{type:"text",text:e.text}],metadata:{unstable_state:this.state,unstable_annotations:[],unstable_data:[],steps:[],modality:"voice",custom:{}},status:r,createdAt:new Date},this._voiceMessages.push(this._currentAssistantMsg);else{let o=this._voiceMessages.indexOf(this._currentAssistantMsg);if(o===-1)return;let i={...this._currentAssistantMsg,content:[{type:"text",text:e.text}],status:r};this._voiceMessages[o]=i,this._currentAssistantMsg=i}e.isFinal&&(this._commitVoiceMessage(this._currentAssistantMsg),this._currentAssistantMsg=null),this._markVoiceMessagesDirty(),this._notifySubscribers()}}_finishVoiceAssistantMessage(e=!0){let r=this._voiceMessages.at(-1);if(r?.role==="assistant"&&r.status.type==="running"){let o=this._voiceMessages.length-1;this._voiceMessages[o]={...r,status:{type:"complete",reason:"stop"}},this._commitVoiceMessage(this._voiceMessages[o]),this._currentAssistantMsg=null,this._markVoiceMessagesDirty(),e&&this._notifySubscribers()}}disconnectVoice(){this._disconnectVoice(!0)}_disconnectVoice(e){this._finishVoiceAssistantMessage(!1),this._currentAssistantMsg=null;let r=this._voiceUnsubs.splice(0);this._voiceUnsubs=[];let o=this._voiceSession;this._voiceSession=void 0,this.voice=void 0,this._voiceVolume=0;let i=this.speech&&this._isVoiceMessage(this.speech.messageId)?this._stopSpeaking:void 0;this._voiceMessages=[],this._markVoiceMessagesDirty();try{Ye([...r,...i?[i]:[],...o?[()=>o.disconnect()]:[],()=>le(this._voiceVolumeSubscribers,void 0,"Voice volume"),()=>this._notifySubscribers()])}finally{e&&o&&this._voiceSession===void 0&&this._onVoiceDisconnected()}}muteVoice(){if(!this._voiceSession)throw new Error("No active voice session");this._voiceSession.mute(),this.voice={...this.voice,isMuted:!0},this._notifySubscribers()}unmuteVoice(){if(!this._voiceSession)throw new Error("No active voice session");this._voiceSession.unmute(),this.voice={...this.voice,isMuted:!1},this._notifySubscribers()}ensureInitialized(){this._isInitialized||(this._isInitialized=!0,this._notifyEventSubscribers("initialize",{}))}export(){return this.repository.export()}import(e){this.ensureInitialized(),this.repository.clear(),this.repository.import(e),this._notifySubscribers()}reset(e){this.import(Li.fromArray(e??[]))}unstable_on(e,r){let o=r;if(e==="modelContextUpdate")return this._contextProvider.subscribe?.(()=>le([o],{},`Thread runtime "${e}"`))??(()=>{});let i=this._eventSubscribers.get(e);return i||(i=new Set,this._eventSubscribers.set(e,i)),i.add(o),e==="initialize"&&this._isInitialized&&queueMicrotask(()=>{i.has(o)&&le([o],{},`Thread runtime "${e}"`)}),()=>{this._eventSubscribers.get(e)?.delete(o)}}};var Af=Symbol.for("assistant-stream.tool-execution-id"),io=t=>{try{return JSON.parse(t),!0}catch{return!1}},cd=t=>{try{return JSON.parse(t)}catch{return}},Cn=(t,e)=>{let r=cd(t),o=cd(e);return r===void 0||o===void 0?!1:Yr(r,o)},En=t=>t[Af],dd=class{constructor(t,e,r){f(this,"_getTools");f(this,"_callbacks");f(this,"_isClientToolCall");f(this,"_entries",new Map);f(this,"_humanInput",new Map);f(this,"_executing",new Set);f(this,"_discardedToolCallIds",new Set);f(this,"_settledResolvers",[]);f(this,"_statuses",new Map);f(this,"_ac",new AbortController);f(this,"_pendingRestore",!0);f(this,"_lastSnapshot",null);f(this,"_isRunning",!1);f(this,"_controller");f(this,"_pipelineDead",!1);f(this,"_pipelineRestartUsed",!1);this._getTools=t,this._callbacks=e,this._isClientToolCall=r,this._initPipeline()}_initPipeline(){let[t,e]=on();this._controller=e;let o=dn(()=>this._getWrappedTools(),()=>this._ac.signal,(i,s,n)=>this._onHumanInput(i,s,n),{onExecutionStart:(i,s,n)=>this._onExecutionStart(i,n),onExecutionEnd:(i,s,n)=>this._onExecutionEnd(i,n)});t.pipeThrough(o).pipeThrough(new Xr).pipeTo(new WritableStream({write:i=>{try{if(i.type!=="result")return;this._handleResultChunk(i)}catch(s){console.error("[ToolInvocationTracker] result chunk handling failed",s)}}})).catch(i=>{console.error("[ToolInvocationTracker] stream pipeline failed; will attempt single restart on next setState",i),this._pipelineDead=!0})}setState(t){try{if(this._pipelineDead){if(this._pipelineRestartUsed)return;this._pipelineRestartUsed=!0,this._pipelineDead=!1,this._demoteEntriesToRestored(),this._executing.clear(),this._ac=new AbortController,this._initPipeline()}if(this._lastSnapshot&&this._lastSnapshot.messages===t.messages&&this._lastSnapshot.isRunning===t.isRunning&&this._lastSnapshot.isLoading===t.isLoading)return;t.isLoading===!0&&(this._pendingRestore=!0);let e=this._isRunning;this._isRunning=t.isRunning;try{this._processMessages(t.messages)}catch(r){throw this._isRunning=e,r}this._lastSnapshot=t,this._pendingRestore=!1}catch(e){console.error("[ToolInvocationTracker] setState failed; snapshot dropped",e)}}reset(){try{this._pendingRestore=!0,this._entries.clear(),this._discardedToolCallIds.clear(),this._lastSnapshot=null,this.abort(),this._statuses.size>0&&(this._statuses=new Map,this._invokeOnStatusesChange())}catch(t){console.error("[ToolInvocationTracker] reset failed",t)}}abort(t){try{if(this._humanInput.forEach(({reject:r})=>{try{r(new Error("Tool execution aborted"))}catch{}}),this._humanInput.clear(),t?.discardPending)for(let[r,o]of this._entries)o.controller&&(o.argsComplete||o.hasResult||(this._discardedToolCallIds.add(r),o.skipExecute=!0));if(this._ac.abort(),this._ac=new AbortController,this._executing.size===0)return Promise.resolve();let e=new Set(this._executing);return new Promise(r=>{this._settledResolvers.push({executionIds:e,resolve:r})})}catch(e){return console.error("[ToolInvocationTracker] abort failed",e),Promise.resolve()}}resume(t,e){try{let r=this._humanInput.get(t);return r?(this._humanInput.delete(t),this._setStatus(t,{type:"executing"}),r.resolve(e),!0):!1}catch(r){return console.error("[ToolInvocationTracker] resume failed",r),!1}}getStatuses(){return this._statuses}_getWrappedTools(){let t=this._getTools();if(t)return Object.fromEntries(Object.entries(t).map(([e,r])=>{let o=r.execute,i=r.streamCall;return o===void 0&&i===void 0?[e,r]:[e,{...r,...o!==void 0&&{execute:(...[s,n])=>{let a=En(n),l=this._captureExecution(n.toolCallId,a);return!l||l.skipExecute?new Promise(()=>{}):o(s,n)}},...i!==void 0&&{streamCall:(...[s,n])=>{let a=En(n);if(this._captureExecution(n.toolCallId,a))return i(s,n)}}}]}))}_captureExecution(t,e){if(e===void 0)return;let r=this._entries.get(t);if(r?.controller)return r.executionId===void 0&&(r.executionId=e),r.executionId===e?r:void 0}_onHumanInput(t,e,r){return new Promise((o,i)=>{let s=this._entries.get(t);if(!s?.controller||s.executionId!==r){i(new Error("Tool execution aborted"));return}let n=this._humanInput.get(t);if(n)try{n.reject(new Error("Human input request was superseded by a new request"))}catch{}this._humanInput.set(t,{executionId:r,resolve:o,reject:i}),this._setStatus(t,{type:"interrupt",payload:{type:"human",payload:e}})})}_onExecutionStart(t,e){this._captureExecution(t,e)&&(this._entries.get(t).skipExecute||(this._executing.add(e),this._humanInput.get(t)?.executionId!==e&&this._setStatus(t,{type:"executing"})))}_onExecutionEnd(t,e){if(e===void 0||!this._executing.delete(e))return;this._entries.get(t)?.executionId===e&&this._deleteStatus(t);let r=[];this._settledResolvers.forEach(({executionIds:o,resolve:i})=>{if([...o].some(s=>this._executing.has(s))){r.push({executionIds:o,resolve:i});return}try{i()}catch{}}),this._settledResolvers.length=0,this._settledResolvers.push(...r)}_handleResultChunk(t){let e=t.meta.toolCallId,r=En(t),o=this._entries.get(e);!o||o.executionId!==r||o?.hasResult||o.skipExecute||this._invokeOnResult({type:"add-tool-result",toolCallId:e,toolName:t.meta.toolName,result:t.result,isError:t.isError,...t.artifact!==void 0&&{artifact:t.artifact},...t.modelContent!==void 0&&{modelContent:t.modelContent}})}_invokeOnResult(t){try{this._callbacks.onResult(t)}catch(e){console.error("[ToolInvocationTracker] onResult callback threw; result dropped",e)}}_invokeOnStatusesChange(){try{this._callbacks.onStatusesChange(this._statuses)}catch(t){console.error("[ToolInvocationTracker] onStatusesChange callback threw; status change not propagated",t)}}_setStatus(t,e){let r=new Map(this._statuses);r.set(t,e),this._statuses=r,this._invokeOnStatusesChange()}_deleteStatus(t){if(!this._statuses.has(t))return;let e=new Map(this._statuses);e.delete(t),this._statuses=e,this._invokeOnStatusesChange()}_warnProviderOwnedSkip(t,e){}_shouldCloseArgsStream({argsText:t,hasResult:e,clientOwned:r}){return e?!0:io(t)?r||!this._isRunning:!1}_startActiveEntry(t,e,r,o){let i={toolName:e,controller:this._controller.addToolCallPart({toolName:e,toolCallId:t}),argsText:"",hasResult:!1,skipExecute:r,argsComplete:!1,clientOwned:o};return this._entries.set(t,i),i}_demoteEntriesToRestored(){for(let[t,e]of this._entries)if(e.controller){if(!e.argsComplete&&!e.hasResult){this._entries.delete(t);continue}this._entries.set(t,{toolName:e.toolName,argsText:e.argsText,hasResult:e.hasResult})}}_processArgsText(t,e){if(!t.controller)return;let r=e.result!==void 0;if(e.argsText!==t.argsText){let o=!0;if(t.argsComplete)Cn(t.argsText,e.argsText)&&(t.argsText=e.argsText),o=!1;else if(!e.argsText.startsWith(t.argsText))if(io(t.argsText)&&io(e.argsText)&&Cn(t.argsText,e.argsText)){let i=this._shouldCloseArgsStream({argsText:e.argsText,hasResult:r,clientOwned:t.clientOwned});i&&t.controller.argsText.close(),t.argsText=e.argsText,t.argsComplete=i,o=!1}else o=!1;if(o&&t.controller){let i=e.argsText.slice(t.argsText.length);t.controller.argsText.append(i);let s=this._shouldCloseArgsStream({argsText:e.argsText,hasResult:r,clientOwned:t.clientOwned});s&&t.controller.argsText.close(),t.argsText=e.argsText,t.argsComplete=s}}!t.argsComplete&&t.controller&&this._shouldCloseArgsStream({argsText:t.argsText,hasResult:r,clientOwned:t.clientOwned})&&(t.controller.argsText.close(),t.argsComplete=!0)}_processMessages(t){let e=this._pendingRestore;for(let{part:r}of ro(t)){let o=this._entries.get(r.toolCallId);if(e){o?.controller||this._entries.set(r.toolCallId,{toolName:r.toolName,argsText:r.argsText,hasResult:r.result!==void 0});continue}let i=o;if(r.result!==void 0&&this._discardedToolCallIds.delete(r.toolCallId),i&&!i.controller){if(i.hasResult||!(r.argsText!==i.argsText&&!(io(i.argsText)&&io(r.argsText)&&Cn(i.argsText,r.argsText)))&&r.result===void 0)continue;this._entries.delete(r.toolCallId),i=void 0}if(!i){let s=this._isClientToolCall?.(r),n=r.result===void 0&&s===!1;n&&this._warnProviderOwnedSkip(r.toolName,r.toolCallId),i=this._startActiveEntry(r.toolCallId,r.toolName,r.result!==void 0||n||this._discardedToolCallIds.has(r.toolCallId),s===!0)}if(r.approval!==void 0&&(i.skipExecute=!0),this._processArgsText(i,r),r.result!==void 0&&!i.hasResult){let{controller:s}=i;if(!s)continue;i.hasResult=!0,i.argsComplete=!0,s.setResponse(new Ne({result:r.result,artifact:r.artifact,isError:r.isError,...r.modelContent!==void 0?{modelContent:r.modelContent}:{}})),s.close()}}}};var Mf=Object.freeze([]),Rn=(t,e)=>{Promise.resolve(e).catch(r=>{console.error(`[ExternalStoreThreadRuntimeCore] ${t} callback rejected`,r)})},Pf=(t,e)=>t&&e[e.length-1]?.role!=="assistant",ud=class extends ld{constructor(e,r){super(e);f(this,"_capabilities",{switchToBranch:!1,switchBranchDuringRun:!1,edit:!1,delete:!1,reload:!1,refetchThread:!1,cancel:!1,unstable_copy:!1,speech:!1,dictation:!1,voice:!1,attachments:!1,feedback:!1,queue:!1});f(this,"_messages");f(this,"isDisabled");f(this,"isSendDisabled");f(this,"suggestions",[]);f(this,"extras");f(this,"_converter",new bn);f(this,"_pendingDeleteEvictions",new Set);f(this,"_optimistic",null);f(this,"_store");f(this,"_getInitializePromise");f(this,"_transformedQueue");f(this,"_toolInvocations",null);f(this,"_toolStatuses",new Map);f(this,"_effectiveIsRunning",!1);f(this,"_inTrackerUpdate",!1);f(this,"_pendingRunningRefresh",!1);f(this,"_toolCallToMessageId",new Map);f(this,"_messagesForToolCallIndex",null);f(this,"updateMessages",e=>{this._store.convertMessage!==void 0?this._store.setMessages?.(e.flatMap(mc)):this._store.setMessages?.(e)});this.__internal_setAdapter(r)}get capabilities(){return this._capabilities}get isLoading(){return this._store.isLoading??!1}get isRunning(){return this._hasExecutingTools(this._store)?!0:this._store.isRunning}_getBaseMessages(){return this._messages}get state(){return this._store.state??super.state}get adapters(){return this._store.adapters}get unstable_refetchThread(){if(this._store.onRefetchThread)return()=>this._store.onRefetchThread()}__internal_setGetInitializePromise(e){this._getInitializePromise=e}_runTrackerUpdate(e){this._inTrackerUpdate=!0;try{e()}finally{this._inTrackerUpdate=!1}this._pendingRunningRefresh&&(this._pendingRunningRefresh=!1,this._refreshEffectiveIsRunning())}_refreshEffectiveIsRunning(){let e=this._getEffectiveIsRunning(this._store);this._effectiveIsRunning!==e&&(this._effectiveIsRunning=e,this._notifyEventSubscribers(e?"runStart":"runEnd",{}),this._notifySubscribers())}_hasExecutingTools(e){if(e.unstable_enableToolInvocations!==!0||this._toolInvocations===null)return!1;for(let r of this._toolStatuses.values())if(r.type==="executing")return!0;return!1}_getEffectiveIsRunning(e){return(e.isRunning??!1)||this._hasExecutingTools(e)}beginEdit(e){if(!this._store.onEdit)throw new Error("Runtime does not support editing.");super.beginEdit(e)}__internal_setAdapter(e){this._store!==e&&this._updateStoreSnapshot(e)}_updateStoreSnapshot(e){let r=this._effectiveIsRunning;this.isDisabled=e.isDisabled??!1,this.isSendDisabled=e.isSendDisabled??!1;let o=this._store;this._store=e;let i=this._getEffectiveIsRunning(e),s=e.unstable_messageRepositoryInstance,n=s!==void 0&&s!==this.repository;n&&(this.repository=s,this._pendingDeleteEvictions.clear()),o?.queue!==e.queue&&(this._transformedQueue=void 0,e.queue?.__internal_setDispatchTransform?.(u=>{let p=this.messages.at(-1)?.id??null;return this.enrichAppendMetadata({...u,parentId:p},p)}),e.queue?.__internal_setDispatchTransform&&(this._transformedQueue=e.queue)),this.extras!==e.extras&&(this.extras=e.extras);let a=e.suggestions??Mf;xe(this.suggestions,a)||(this.suggestions=a);let l={switchToBranch:this._store.setMessages!==void 0,switchBranchDuringRun:!1,edit:this._store.onEdit!==void 0,delete:this._store.onDelete!==void 0||this._store.setMessages!==void 0,reload:this._store.onReload!==void 0,refetchThread:this._store.onRefetchThread!==void 0,cancel:this._store.onCancel!==void 0,speech:this._store.adapters?.speech!==void 0,dictation:this._store.adapters?.dictation!==void 0,voice:this._store.adapters?.voice!==void 0,unstable_copy:this._store.unstable_capabilities?.copy!==!1,attachments:!!this._store.adapters?.attachments,feedback:!!this._store.adapters?.feedback,queue:this._store.queue!==void 0};xe(this._capabilities,l)||(this._capabilities=l);let c;if(e.messageRepository){if(o&&!n&&o.isRunning===e.isRunning&&o.messageRepository===e.messageRepository&&r===i){this._notifySubscribers();return}let u=e.messageRepository.messages,p=e.messageRepository.headId??u.at(-1)?.message.id??null;if(o&&!n&&o.messageRepository===e.messageRepository)this.repository.resetHead(p),c=this.repository.getMessages();else{let m=new Set(u.map(({message:g})=>g.id));for(let{message:g,parentId:w}of u)this.repository.addOrUpdateMessage(w,g);for(let{message:g}of this.repository.export().messages)m.has(g.id)||this.repository.deleteMessage(g.id);this._pendingDeleteEvictions.clear(),this.repository.resetHead(p),c=this.repository.getMessages()}}else if(e.messages){if(o){if(o.convertMessage!==e.convertMessage)this._converter=new bn;else if(!n&&o.isRunning===e.isRunning&&o.messages===e.messages&&r===i){this._notifySubscribers();return}}c=e.convertMessage?this._converter.convertMessages(e.messages,(m,g,w)=>{if(!e.convertMessage)return g;let _=w===(e.messages?.length??0)-1,x=`${hc}${w}`;if(m&&(m.role!=="assistant"||!wc(m.status)||m.status===vn(m.content,_,i))){if(m.id.startsWith("__external_store_fallback_")&&m.id!==x){let k={...m,id:x};return hn(k,g),k}return m}let T=e.convertMessage(g,w),I=xr(T,x,vn(T.content,_,i));return hn(I,g),I}):e.messages;let u=new Set,p=[];for(let m=c.length-1;m>=0;m--){let g=c[m];if(u.has(g.id)){console.warn(`ExternalStoreThreadRuntimeCore: duplicate message id "${g.id}" in the provided messages array; keeping the last occurrence.`);continue}u.add(g.id),p.push(g)}p.length!==c.length&&(c=p.reverse());for(let m=0;m<c.length;m++){let g=c[m],w=c[m-1];this.repository.addOrUpdateMessage(w?.id??null,g)}if(this._pendingDeleteEvictions.size>0){let m=new Set(c.map(g=>g.id));for(let g of this._pendingDeleteEvictions)if(this._pendingDeleteEvictions.delete(g),!m.has(g)){try{this.repository.getMessage(g)}catch{continue}this.repository.deleteMessage(g)}}}else throw new Error("ExternalStoreAdapter must provide either 'messages' or 'messageRepository'");c.length>0&&this.ensureInitialized(),this._effectiveIsRunning=i,r!==i&&(i?this._notifyEventSubscribers("runStart",{}):this._notifyEventSubscribers("runEnd",{}));let d=null;if(Pf(i,c)){let u=c.at(-1)?.id??null;this._optimistic?.parentId!==u&&(this._optimistic={id:Be(),parentId:u}),d=this._optimistic.id,this.repository.addOrUpdateMessage(u,xr({role:"assistant",content:[],metadata:{isOptimistic:!0}},d,{type:"running"}))}d===null&&(this._optimistic=null),this.repository.resetHead(d??c.at(-1)?.id??null);let h=this.repository.getMessages();if((!this._messages||!wn(this._messages,h))&&(this._messages=h),this._voiceMessages.length>0){let u=new Set(this._messages.map(m=>m.id)),p=this._voiceMessages.filter(m=>!u.has(m.id));p.length!==this._voiceMessages.length&&(this._voiceMessages=p,this._markVoiceMessagesDirty())}n&&this._runTrackerUpdate(()=>this._toolInvocations?.reset()),this._runTrackerUpdate(()=>this._driveToolInvocations()),this._notifySubscribers()}_driveToolInvocations(){if(!this._store.unstable_enableToolInvocations){this._toolInvocations&&(this._toolInvocations.reset(),this._toolInvocations=null,this._toolStatuses=new Map,this._store.setToolStatuses?.({}));return}this._toolInvocations||(this._toolInvocations=new dd(()=>this.getModelContext().tools,{onResult:e=>{try{let r=this._findMessageIdForToolCall(e.toolCallId);if(r===void 0)return;Rn("onAddToolResult",this._store.onAddToolResult?.({messageId:r,toolCallId:e.toolCallId,toolName:e.toolName,result:e.result,isError:e.isError,...e.artifact!==void 0&&{artifact:e.artifact},...e.modelContent!==void 0&&{modelContent:e.modelContent}}))}catch(r){console.error("[ExternalStoreThreadRuntimeCore] onAddToolResult dispatch failed",r)}},onStatusesChange:e=>{let r=this._hasExecutingTools(this._store);this._toolStatuses=e;try{this._store.setToolStatuses?.(Object.fromEntries(e))}finally{r!==this._hasExecutingTools(this._store)&&(this._inTrackerUpdate?this._pendingRunningRefresh=!0:this._updateStoreSnapshot(this._store))}}},e=>this._store.unstable_isClientToolCall?.(e))),this._toolInvocations.setState({messages:this._messages,isRunning:this._getEffectiveIsRunning(this._store),...this._store.isLoading!==void 0&&{isLoading:this._store.isLoading}})}_findMessageIdForToolCall(e){if(this._messagesForToolCallIndex!==this._messages){this._toolCallToMessageId.clear();for(let{part:r,messageId:o}of ro(this._messages))this._toolCallToMessageId.set(r.toolCallId,o);this._messagesForToolCallIndex=this._messages}return this._toolCallToMessageId.get(e)}switchToBranch(e){if(!this._store.setMessages)throw new Error("Runtime does not support switching branches.");if(this._getEffectiveIsRunning(this._store))return;let r=this._store.unstable_onBranchChange,o=r?this.repository.canonicalHeadId:null;this.repository.switchToBranch(e),this._pendingDeleteEvictions.clear(),this.updateMessages(this.repository.getMessages()),r&&this._notifyBranchChange(o,r)}_notifyBranchChange(e,r){let o=this.repository.canonicalHeadId;o!==e&&r({headId:o,visibleMessageIds:this.repository.getMessages().map(i=>i.id)})}async append(e){let r={...e,parentId:this._resolveAppendParent(e.parentId)};if(this.voice)throw new Error("Cannot send a text message while a voice session is connected");if(this._isVoiceMessage(r.sourceId))throw new Error("Voice transcript messages cannot be edited");let o=r.sourceId!=null||r.parentId!==(this._getBaseMessages().at(-1)?.id??null);r=!o&&this._store.queue&&this._store.queue===this._transformedQueue?r:this.enrichAppendMetadata(r);let i=to(this);this.ensureInitialized();let s=this._getInitializePromise?.();if(!o&&this._store.queue){if(s&&await s,!Ni(this,i))return;r.steer??this._getEffectiveIsRunning(this._store)?this._store.queue.steer(r):this._store.queue.enqueue(r);return}if(s?.catch(()=>{}),(r.startRun??r.role==="user")&&await this._toolInvocations?.abort({discardPending:!0}),!!Ni(this,i))if(o){if(!this._store.onEdit)throw new Error("Runtime does not support editing messages.");this._pendingDeleteEvictions.clear(),await this._store.onEdit(r)}else await this._store.onNew(r)}_commitVoiceMessage(e){this._store.onVoiceTranscript?.(e)}async deleteMessage(e){if(this._store.onDelete){this.repository.getMessages().some(o=>o.id===e)&&this._pendingDeleteEvictions.add(e);try{await this._store.onDelete(e)}catch(o){throw this._pendingDeleteEvictions.delete(e),o}return}if(!this._store.setMessages)throw new Error("Runtime does not support deleting messages.");this._getEffectiveIsRunning(this._store)&&await this._toolInvocations?.abort();let r=this.repository.getMessages();if(r.findIndex(o=>o.id===e)===-1)throw new Error("Message not found.");this._pendingDeleteEvictions.clear(),this.updateMessages(r.filter(o=>o.id!==e)),this._evictDeletedMessage(e)}_evictDeletedMessage(e){if(!e.startsWith("__external_store_fallback_")){try{this.repository.getMessage(e)}catch{return}this.repository.deleteMessage(e),this._publishRepositoryMessages()}}_publishRepositoryMessages(){let e=this.repository.getMessages();wn(this._messages,e)||(this._messages=e),this._notifySubscribers()}getQueueItems(){return this._store?.queue?.items??Mt}getSteerQueueItems(){return this._store?.queue?.steerItems??Mt}moveQueueItem(e,r){this._store?.queue?.move(e,r)}removeQueueItem(e){this._store?.queue?.remove(e)}async startRun(e){if(!this._store.onReload)throw new Error("Runtime does not support reloading messages.");if(this.voice)throw new Error("Cannot start a run while a voice session is connected");if(this._isVoiceMessage(e.sourceId))throw new Error("Voice transcript messages cannot be reloaded");this._pendingDeleteEvictions.clear(),await this._toolInvocations?.abort({discardPending:!0}),await this._store.onReload(e.parentId,e)}async resumeRun(e){if(!this._store.onResume)throw new Error("Runtime does not support resuming runs.");if(this.voice)throw new Error("Cannot start a run while a voice session is connected");if(this._isVoiceMessage(e.sourceId))throw new Error("Voice transcript messages cannot be reloaded");await this._store.onResume(e)}exportExternalState(){if(!this._store.onExportExternalState)throw new Error("Runtime does not support exporting external states.");return this._store.onExportExternalState()}importExternalState(e){if(!this._store.onLoadExternalState)throw new Error("Runtime does not support importing external states.");this._runTrackerUpdate(()=>this._toolInvocations?.reset()),this._store.onLoadExternalState(e)}unstable_notifySessionReset(){this._runTrackerUpdate(()=>this._toolInvocations?.reset()),this._store.queue?.__internal_notifyCancelled?.()}cancelRun(){if(!this._store.onCancel)throw new Error("Runtime does not support cancelling runs.");let e=to(this);this._toolInvocations?.abort({discardPending:!0}),this._store.queue?.__internal_notifyCancelled?.(),Rn("onCancel",this._store.onCancel()),this.dropEmptyOptimisticHead();let r=this.repository.getMessages(),o=r[r.length-1],i=this._store.setMessages!==void 0&&o?.role==="user"&&o.id===r.at(-1)?.id&&o.content.every(n=>n.type==="text")?o:void 0,s;if(i){let n={text:At(i),attachments:i.attachments,quote:i.metadata.custom.quote};this.composer.restoreDraft(n)&&(this.repository.deleteMessage(i.id),s={id:i.id,draft:n})}this._publishRepositoryMessages(),setTimeout(()=>{if(Ni(this,e)){if(this.dropEmptyOptimisticHead(),s){let n=this.repository.getMessages();n.at(-1)?.id===s.id?this.repository.deleteMessage(s.id):n.some(a=>a.id===s.id)&&this.composer.retractDraft(s.draft)}this._publishRepositoryMessages(),this.updateMessages(this._messages)}},0)}dropEmptyOptimisticHead(){let e=this.repository.getMessages().at(-1);e&&e.metadata.isOptimistic&&e.content.length===0&&this.repository.deleteMessage(e.id)}addToolResult(e){if(!this._store.onAddToolResult)throw new Error("Runtime does not support tool results.");Rn("onAddToolResult",this._store.onAddToolResult(e))}resumeToolCall(e){if(!(this._toolInvocations?.resume(e.toolCallId,e.payload)??!1)){if(this._store.onResumeToolCall){this._store.onResumeToolCall(e);return}throw new Error(`Tool call ${e.toolCallId} is not waiting for resume.`)}}respondToToolApproval(e){if(!this._store.onRespondToToolApproval)throw new Error("Runtime does not support tool approvals.");let r=this.messages.findLast(i=>i.role==="assistant"&&i.content.some(s=>s.type==="tool-call"&&s.approval?.id===e.approvalId)),o=r?.content.find(i=>i.type==="tool-call"&&i.approval?.id===e.approvalId);try{return Promise.resolve(this._store.onRespondToToolApproval(e)).then(()=>{r&&o?.type==="tool-call"&&this._notifyToolApprovalAnswered(r.id,o.toolCallId,o.toolName,e.approved)})}catch(i){return Promise.reject(i)}}reset(e){let r=new ji;r.import(Li.fromArray(e??[])),this.updateMessages(r.getMessages())}import(e){super.import(e),this._store.onImport&&this._store.onImport(this.repository.getMessages())}};var pd=t=>t.adapters?.threadList??{},md=class extends Zc{constructor(e){super();f(this,"threads");this.threads=new td(pd(e),()=>new ud(this._contextProvider,e))}setAdapter(e){this.threads.__internal_setAdapter(pd(e)),this.threads.getMainThreadRuntimeCore().__internal_setAdapter(e)}};var so=t=>{let e=v(21),{modelContext:r,feedback:o}=pc()??{},i;e:{if(!o||t.adapters?.feedback){i=t;break e}let m;e[0]!==o||e[1]!==t.adapters?(m={...t.adapters,feedback:o},e[0]=o,e[1]=t.adapters,e[2]=m):m=e[2];let g;e[3]!==t||e[4]!==m?(g={...t,adapters:m},e[3]=t,e[4]=m,e[5]=g):g=e[5],i=g}let s=i,n;e[6]!==s?(n=()=>new md(s),e[6]=s,e[7]=n):n=e[7];let[a]=z(n),l;e[8]!==a.threads?(l=()=>()=>{Bi(a.threads.getMainThreadRuntimeCore())},e[8]=a.threads,e[9]=l):l=e[9];let c;e[10]!==a?(c=[a],e[10]=a,e[11]=c):c=e[11],D(l,c);let d;e[12]!==s||e[13]!==a?(d=()=>{a.setAdapter(s)},e[12]=s,e[13]=a,e[14]=d):d=e[14],D(d);let h,u;e[15]!==r||e[16]!==a?(h=()=>{if(r)return a.registerModelContextProvider(r)},u=[r,a],e[15]=r,e[16]=a,e[17]=h,e[18]=u):(h=e[17],u=e[18]),D(h,u);let p;return e[19]!==a?(p=new Yc(a),e[19]=a,e[20]=p):p=e[20],p};var hd=$("react/jsx-runtime"),fd=t=>{let e=v(6),{id:r,children:o}=t,i=U(),s;e[0]!==r?(s=se({message:ne({source:"thread",query:{type:"id",id:r},get:l=>l.thread.message({id:r})}),composer:ne({source:"message",query:{},get:l=>l.thread.message({id:r}).composer()})}),e[0]=r,e[1]=s):s=e[1];let n=s,a;return e[2]!==i||e[3]!==o||e[4]!==n?(a=(0,hd.jsx)(ce,{extends:i,config:n,children:o}),e[2]=i,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var et=$("react/jsx-runtime"),An=(t,e)=>t.Message===e.Message&&t.EditComposer===e.EditComposer&&t.UserEditComposer===e.UserEditComposer&&t.AssistantEditComposer===e.AssistantEditComposer&&t.SystemEditComposer===e.SystemEditComposer&&t.UserMessage===e.UserMessage&&t.AssistantMessage===e.AssistantMessage&&t.SystemMessage===e.SystemMessage,gd=()=>null,vd=new WeakMap,Df=(t,e)=>{let r=vd.get(t);return r||(r=new Set(t.map(o=>o.id)),vd.set(t,r)),r.has(e)},Of=(t,e,r)=>{switch(e){case"user":return r?t.UserEditComposer??t.EditComposer??t.UserMessage??t.Message:t.UserMessage??t.Message;case"assistant":return r?t.AssistantEditComposer??t.EditComposer??t.AssistantMessage??t.Message:t.AssistantMessage??t.Message;case"system":return r?t.SystemEditComposer??t.EditComposer??t.SystemMessage??t.Message??gd:t.SystemMessage??t.Message??gd;default:throw new Error(`Unknown message role: ${e}`)}},Mn=t=>{let e=v(6),{components:r}=t,o=P(Nf),i=P(Bf),s;e[0]!==r||e[1]!==i||e[2]!==o?(s=Of(r,o,i),e[0]=r,e[1]=i,e[2]=o,e[3]=s):s=e[3];let n=s,a;return e[4]!==n?(a=(0,et.jsx)(n,{}),e[4]=n,e[5]=a):a=e[5],a},no=te(t=>{let e=v(5),{index:r,components:o}=t,i;e[0]!==o?(i=(0,et.jsx)(Mn,{components:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,et.jsx)(yn,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},(t,e)=>t.index===e.index&&An(t.components,e.components));no.displayName="ThreadPrimitive.MessageByIndex";var ao=te(t=>{let e=v(7),{messageId:r,components:o}=t,i;if(e[0]!==r?(i=a=>Df(a.thread.messages,r),e[0]=r,e[1]=i):i=e[1],!P(i))return null;let s;e[2]!==o?(s=(0,et.jsx)(Mn,{components:o}),e[2]=o,e[3]=s):s=e[3];let n;return e[4]!==r||e[5]!==s?(n=(0,et.jsx)(fd,{id:r,children:s}),e[4]=r,e[5]=s,e[6]=n):n=e[6],n},(t,e)=>t.messageId===e.messageId&&An(t.components,e.components));ao.displayName="ThreadPrimitive.Unstable_MessageById";var bd=({children:t})=>{let e=P(at(r=>r.thread.messages.map(o=>o.id)));return G(()=>e.length===0?null:e.map((r,o)=>(0,et.jsx)(yn,{index:o,children:(0,et.jsx)(gt,{getItemState:i=>i.thread.message({index:o}).getState(),children:i=>t({get message(){return i()}})})},r)),[e,t])},Vi=t=>{let e=v(4),{components:r,children:o}=t;if(r){let s;return e[0]!==r?(s=(0,et.jsx)(bd,{children:()=>(0,et.jsx)(Mn,{components:r})}),e[0]=r,e[1]=s):s=e[1],s}let i;return e[2]!==o?(i=(0,et.jsx)(bd,{children:o}),e[2]=o,e[3]=i):i=e[3],i};Vi.displayName="ThreadPrimitive.Messages";var Ui=te(Vi,(t,e)=>t.children||e.children?t.children===e.children:An(t.components,e.components));function Nf(t){return t.message.role}function Bf(t){return t.message.composer.isEditing}var zi=t=>{let e=t.message.metadata;if(!(!e||typeof e!="object"))return e.custom?.quote};var _r=$("react/jsx-runtime");var wd=class extends Error{constructor(e,r=`Component "${e}" is not in the generative-ui allowlist.`){super(r);f(this,"componentName");this.name="GenerativeUIRenderError",this.componentName=e}},$f=t=>typeof t=="object"&&t!==null,xd=t=>t==null?[]:Array.isArray(t)?t:[t],yd=(t,e,r,o)=>{if(t==null)return null;if(typeof t=="string")return t;if(!$f(t)||!("component"in t)||typeof t.component!="string")return typeof process<"u",null;let{component:i,props:s,children:n,key:a}=t,l=e[i];if(!l){if(r)return(0,_r.jsx)(r,{component:i,props:s},a??o);throw new wd(i)}return Rs(l,{...s??{},key:a??o},...xd(n).map((c,d)=>yd(c,e,r,`${o}/${d}`)))},lo=t=>{let e=v(11),{spec:r,components:o,Fallback:i}=t,s=r?.root,n;e[0]!==s?(n=xd(s),e[0]=s,e[1]=n):n=e[1];let a=n,l;if(e[2]!==i||e[3]!==o||e[4]!==a){let d;e[6]!==i||e[7]!==o?(d=(h,u)=>yd(h,o,i,`${u}`),e[6]=i,e[7]=o,e[8]=d):d=e[8],l=a.map(d),e[2]=i,e[3]=o,e[4]=a,e[5]=l}else l=e[5];let c;return e[9]!==l?(c=(0,_r.jsx)(_r.Fragment,{children:l}),e[9]=l,e[10]=c):c=e[10],c};lo.displayName="GenerativeUIRender";var qi=t=>{let e=v(4),{components:r,spec:o,Fallback:i}=t,s=P(Lf),n=o??s;if(!n)return null;let a;return e[0]!==i||e[1]!==r||e[2]!==n?(a=(0,_r.jsx)(lo,{spec:n,components:r,Fallback:i}),e[0]=i,e[1]=r,e[2]=n,e[3]=a):a=e[3],a};qi.displayName="MessagePrimitive.GenerativeUI";function Lf(t){let e=t.part;return e?.type==="generative-ui"?e.spec:void 0}var B=$("react/jsx-runtime"),Pn=t=>{let e=-1;return{startGroup:r=>{e===-1&&(e=r)},endGroup:(r,o)=>{e!==-1&&(o.push({type:t,startIndex:e,endIndex:r}),e=-1)},finalize:(r,o)=>{e!==-1&&o.push({type:t,startIndex:e,endIndex:r})}}},jf=(t,e,r)=>{let o=[];if(e){let i=Pn("chainOfThoughtGroup");for(let s=0;s<t.length;s++){let n=t[s];n==="tool-call"||n==="reasoning"?i.startGroup(s):(i.endGroup(s-1,o),o.push({type:"single",index:s}))}i.finalize(t.length-1,o)}else{let i=Pn("toolGroup"),s=Pn("reasoningGroup");for(let n=0;n<t.length;n++){let a=t[n];a==="tool-call"?(s.endGroup(n-1,o),i.startGroup(n)):a==="reasoning"?(i.endGroup(n-1,o),s.startGroup(n)):(i.endGroup(n-1,o),s.endGroup(n-1,o),o.push({type:"single",index:n}))}i.finalize(t.length-1,o),s.finalize(t.length-1,o)}if(r){let i=new Set;for(let s of o){if(s.type==="single")continue;let n=r[s.startIndex];n!==void 0&&!i.has(n)&&(i.add(n),s.idKey=`id:${n}`)}}return o},Ff=t=>{let e=v(10),r=P(at(og)),o=P(at(sg)),i;e:{if(r.length===0){let a;e[0]===Symbol.for("react.memo_cache_sentinel")?(a=[],e[0]=a):a=e[0];let l;e[1]!==o?(l={ranges:a,partIds:o},e[1]=o,e[2]=l):l=e[2],i=l;break e}let s;e[3]!==r||e[4]!==o||e[5]!==t?(s=jf(r,t,o),e[3]=r,e[4]=o,e[5]=t,e[6]=s):s=e[6];let n;e[7]!==o||e[8]!==s?(n={ranges:s,partIds:o},e[7]=o,e[8]=s,e[9]=n):n=e[9],i=n}return i},Vf=t=>{let e=v(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i;e[3]!==r||e[4]!==o.toolName?(i=a=>a.tools.toolUIs[o.toolName]?.[0]?.render??r,e[3]=r,e[4]=o.toolName,e[5]=i):i=e[5];let s=P(i);if(!s)return null;let n;return e[6]!==s||e[7]!==o?(n=(0,B.jsx)(s,{...o}),e[6]=s,e[7]=o,e[8]=n):n=e[8],n},Dn=(t,e,r)=>{let o=t.renderers[e]?.[0];return o||(t.fallbacks[0]??r)},Uf=t=>{let e=v(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i;e[3]!==r||e[4]!==o.name?(i=a=>Dn(a.dataRenderers,o.name,r),e[3]=r,e[4]=o.name,e[5]=i):i=e[5];let s=P(i);if(!s)return null;let n;return e[6]!==s||e[7]!==o?(n=(0,B.jsx)(s,{...o}),e[6]=s,e[7]=o,e[8]=n):n=e[8],n},Ge={Text:()=>null,Reasoning:()=>null,Source:()=>null,Image:()=>null,File:()=>null,Unstable_Audio:()=>null,ToolGroup:({children:t})=>t,ReasoningGroup:({children:t})=>t},On=t=>{let e=v(41),{components:r}=t,o;e[0]!==r?(o=r===void 0?{}:r,e[0]=r,e[1]=o):o=e[1];let{Text:i,Reasoning:s,Image:n,Source:a,File:l,Unstable_Audio:c,tools:d,data:h,generativeUI:u}=o,p=i===void 0?Ge.Text:i,m=s===void 0?Ge.Reasoning:s,g=n===void 0?Ge.Image:n,w=a===void 0?Ge.Source:a,_=l===void 0?Ge.File:l,x=c===void 0?Ge.Unstable_Audio:c,T;e[2]!==d?(T=d===void 0?{}:d,e[2]=d,e[3]=T):T=e[3];let I=T,k=U(),E=P(ng),R=E.type;if(R==="tool-call"){let y=k.part.addToolResult,M=k.part.resumeToolCall,N=k.part.respondToToolApproval;if("Override"in I){let Y;return e[4]!==y||e[5]!==E||e[6]!==N||e[7]!==M||e[8]!==I.Override?(Y=(0,B.jsx)(I.Override,{...E,addResult:y,resume:M,respondToApproval:N}),e[4]=y,e[5]=E,e[6]=N,e[7]=M,e[8]=I.Override,e[9]=Y):Y=e[9],Y}let O=I.by_name?.[E.toolName]??I.Fallback,V;return e[10]!==O||e[11]!==y||e[12]!==E||e[13]!==N||e[14]!==M?(V=(0,B.jsx)(Vf,{...E,Fallback:O,addResult:y,resume:M,respondToApproval:N}),e[10]=O,e[11]=y,e[12]=E,e[13]=N,e[14]=M,e[15]=V):V=e[15],V}if(E.status?.type==="requires-action")throw new Error("Encountered unexpected requires-action status");switch(R){case"text":{let y;return e[16]!==p||e[17]!==E?(y=(0,B.jsx)(p,{...E}),e[16]=p,e[17]=E,e[18]=y):y=e[18],y}case"reasoning":{let y;return e[19]!==m||e[20]!==E?(y=(0,B.jsx)(m,{...E}),e[19]=m,e[20]=E,e[21]=y):y=e[21],y}case"source":{let y;return e[22]!==w||e[23]!==E?(y=(0,B.jsx)(w,{...E}),e[22]=w,e[23]=E,e[24]=y):y=e[24],y}case"image":{let y;return e[25]!==g||e[26]!==E?(y=(0,B.jsx)(g,{...E}),e[25]=g,e[26]=E,e[27]=y):y=e[27],y}case"file":{let y;return e[28]!==_||e[29]!==E?(y=(0,B.jsx)(_,{...E}),e[28]=_,e[29]=E,e[30]=y):y=e[30],y}case"audio":{let y;return e[31]!==x||e[32]!==E?(y=(0,B.jsx)(x,{...E}),e[31]=x,e[32]=E,e[33]=y):y=e[33],y}case"data":{let y=h?.by_name?.[E.name]??h?.Fallback,M;return e[34]!==y||e[35]!==E?(M=(0,B.jsx)(Uf,{...E,Fallback:y}),e[34]=y,e[35]=E,e[36]=M):M=e[36],M}case"generative-ui":{if(!u?.components)return typeof process<"u",null;let y=E,M;return e[37]!==u.Fallback||e[38]!==u.components||e[39]!==y.spec?(M=(0,B.jsx)(lo,{spec:y.spec,components:u.components,Fallback:u.Fallback}),e[37]=u.Fallback,e[38]=u.components,e[39]=y.spec,e[40]=M):M=e[40],M}default:return console.warn(`Unknown message part type: ${R}`),null}},Pt=te(t=>{let e=v(5),{index:r,components:o}=t,i;e[0]!==o?(i=(0,B.jsx)(On,{components:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,B.jsx)(Jt,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},(t,e)=>t.index===e.index&&t.components?.Text===e.components?.Text&&t.components?.Reasoning===e.components?.Reasoning&&t.components?.Source===e.components?.Source&&t.components?.Image===e.components?.Image&&t.components?.File===e.components?.File&&t.components?.Unstable_Audio===e.components?.Unstable_Audio&&t.components?.tools===e.components?.tools&&t.components?.data===e.components?.data&&t.components?.generativeUI===e.components?.generativeUI&&t.components?.ToolGroup===e.components?.ToolGroup&&t.components?.ReasoningGroup===e.components?.ReasoningGroup);Pt.displayName="MessagePrimitive.PartByIndex";var zf=t=>{let e=v(6),{status:r,component:o}=t,i=r.type==="running",s;e[0]!==o||e[1]!==r?(s=(0,B.jsx)(o,{type:"text",text:"",status:r}),e[0]=o,e[1]=r,e[2]=s):s=e[2];let n;return e[3]!==i||e[4]!==s?(n=(0,B.jsx)(Qt,{text:"",isRunning:i,children:s}),e[3]=i,e[4]=s,e[5]=n):n=e[5],n},qf=Object.freeze({type:"complete"}),Hf=Object.freeze({type:"running"}),Gf=t=>{let e=v(6),{components:r}=t,o=P(ag);if(r?.Empty){let n;return e[0]!==r.Empty||e[1]!==o?(n=(0,B.jsx)(r.Empty,{status:o}),e[0]=r.Empty,e[1]=o,e[2]=n):n=e[2],n}if(o.type!=="running")return null;let i=r?.Text??Ge.Text,s;return e[3]!==o||e[4]!==i?(s=(0,B.jsx)(zf,{status:o,component:i}),e[3]=o,e[4]=i,e[5]=s):s=e[5],s},_d=te(Gf,(t,e)=>t.components?.Empty===e.components?.Empty&&t.components?.Text===e.components?.Text),Wf=t=>{let e=v(4),{components:r,enabled:o}=t,i;if(e[0]!==o?(i=n=>{if(!o||n.message.parts.length===0)return!1;let a=n.message.parts[n.message.parts.length-1];return a?.type!=="text"&&a?.type!=="reasoning"},e[0]=o,e[1]=i):i=e[1],!P(i))return null;let s;return e[2]!==r?(s=(0,B.jsx)(_d,{components:r}),e[2]=r,e[3]=s):s=e[3],s},Kf=te(Wf,(t,e)=>t.enabled===e.enabled&&t.components?.Empty===e.components?.Empty&&t.components?.Text===e.components?.Text),Jf=t=>{let e=v(4),{Quote:r}=t,o=P(zi);if(!o)return null;let i;return e[0]!==r||e[1]!==o.messageId||e[2]!==o.text?(i=(0,B.jsx)(r,{text:o.text,messageId:o.messageId}),e[0]=r,e[1]=o.messageId,e[2]=o.text,e[3]=i):i=e[3],i},Qf=te(Jf);function Sd(t,e){let r=t.toolUIs[e.toolName]?.[0]?.render??null;return r||(zc(e.mcp?.app?.resourceUri)&&t.mcpApp?t.mcpApp.render:null)}var Td=()=>{let t=v(6),e=U(),r=P(lg),o=P(cg);if(!o||r.type!=="tool-call")return null;let i;return t[0]!==o||t[1]!==e.part.addToolResult||t[2]!==e.part.respondToToolApproval||t[3]!==e.part.resumeToolCall||t[4]!==r?(i=(0,B.jsx)(o,{...r,addResult:e.part.addToolResult,resume:e.part.resumeToolCall,respondToApproval:e.part.respondToToolApproval}),t[0]=o,t[1]=e.part.addToolResult,t[2]=e.part.respondToToolApproval,t[3]=e.part.resumeToolCall,t[4]=r,t[5]=i):i=t[5],i},kd=()=>{let t=v(3),e=P(dg),r=P(ug);if(!r||e.type!=="data")return null;let o=e,i;return t[0]!==r||t[1]!==o?(i=(0,B.jsx)(r,{...o}),t[0]=r,t[1]=o,t[2]=i):i=t[2],i},Yf=()=>{let t=v(2),e=P(pg);if(e==="tool-call"){let r;return t[0]===Symbol.for("react.memo_cache_sentinel")?(r=(0,B.jsx)(Td,{}),t[0]=r):r=t[0],r}if(e==="data"){let r;return t[1]===Symbol.for("react.memo_cache_sentinel")?(r=(0,B.jsx)(kd,{}),t[1]=r):r=t[1],r}return null},Xf=Object.freeze({type:"text",text:"",status:Hf}),Zf=({children:t})=>{let e=U(),r=P(o=>o.dataRenderers);return(0,B.jsx)(gt,{getItemState:o=>o.part.getState(),children:o=>t({get part(){let i=o();if(i.type==="tool-call"){let s=Sd(e.tools.getState(),i)!==null,n=e.part;return{...i,toolUI:s?(0,B.jsx)(Td,{}):null,addResult:n.addToolResult,resume:n.resumeToolCall,respondToApproval:n.respondToToolApproval}}if(i.type==="data"){let s=Dn(r,i.name,void 0)!==void 0;return{...i,dataRendererUI:s?(0,B.jsx)(kd,{}):null}}return i}})})},Nn=t=>{let e=v(5),{index:r,children:o}=t,i;e[0]!==o?(i=(0,B.jsx)(Zf,{children:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,B.jsx)(Jt,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},eg=t=>{let e=v(9),{children:r}=t,o=P(mg),i=P(hg),s=o===0&&i;if(o===0){if(!s)return null;let a;e[0]!==r?(a=r({part:Xf}),e[0]=r,e[1]=a):a=e[1];let l;return e[2]!==a?(l=(0,B.jsx)(Qt,{text:"",isRunning:!0,children:a}),e[2]=a,e[3]=l):l=e[3],l}let n;if(e[4]!==r||e[5]!==o){let a;e[7]!==r?(a=(l,c)=>(0,B.jsx)(Nn,{index:c,children:d=>r(d)??(0,B.jsx)(Yf,{})},c),e[7]=r,e[8]=a):a=e[8],n=(0,B.jsx)(B.Fragment,{children:Array.from({length:o},a)}),e[4]=r,e[5]=o,e[6]=n}else n=e[6];return n},co=t=>{let e=v(5),{components:r,unstable_showEmptyOnNonTextEnd:o,children:i}=t,s=o===void 0?!0:o;if(i){let a;return e[0]!==i?(a=(0,B.jsx)(eg,{children:i}),e[0]=i,e[1]=a):a=e[1],a}let n;return e[2]!==r||e[3]!==s?(n=(0,B.jsx)(tg,{components:r,unstable_showEmptyOnNonTextEnd:s}),e[2]=r,e[3]=s,e[4]=n):n=e[4],n};co.displayName="MessagePrimitive.Parts";var tg=t=>{let e=v(15),{components:r,unstable_showEmptyOnNonTextEnd:o}=t,i=P(fg),s=!!r?.ChainOfThought,{ranges:n,partIds:a}=Ff(s),l;e:{if(i===0){let m;e[0]!==r?(m=(0,B.jsx)(_d,{components:r}),e[0]=r,e[1]=m):m=e[1],l=m;break e}let p;if(e[2]!==r||e[3]!==n||e[4]!==a){let m=new Set,g=w=>{let _=a[w];return _!==void 0&&!m.has(_)?(m.add(_),`part-id:${_}`):`part-${w}`};p=n.map(w=>{if(w.type==="single")return(0,B.jsx)(Pt,{index:w.index,components:r},w.index);if(w.type==="chainOfThoughtGroup"){let _=r?.ChainOfThought;return _?(0,B.jsx)(Rc,{startIndex:w.startIndex,endIndex:w.endIndex,children:(0,B.jsx)(_,{})},`chainOfThought-${w.idKey??w.startIndex}`):null}else if(w.type==="toolGroup"){let _=r?.ToolGroup??Ge.ToolGroup;return(0,B.jsx)(_,{startIndex:w.startIndex,endIndex:w.endIndex,children:Array.from({length:w.endIndex-w.startIndex+1},(x,T)=>{let I=w.startIndex+T;return(0,B.jsx)(Pt,{index:I,components:r},g(I))})},`tool-${w.idKey??w.startIndex}`)}else{let _=r?.ReasoningGroup??Ge.ReasoningGroup;return(0,B.jsx)(_,{startIndex:w.startIndex,endIndex:w.endIndex,children:Array.from({length:w.endIndex-w.startIndex+1},(x,T)=>{let I=w.startIndex+T;return(0,B.jsx)(Pt,{index:I,components:r},`part-${I}`)})},`reasoning-${w.startIndex}`)}}),e[2]=r,e[3]=n,e[4]=a,e[5]=p}else p=e[5];l=p}let c=l,d;e[6]!==r?(d=r?.Quote&&(0,B.jsx)(Qf,{Quote:r.Quote}),e[6]=r,e[7]=d):d=e[7];let h;e[8]!==r||e[9]!==o?(h=(0,B.jsx)(Kf,{components:r,enabled:o}),e[8]=r,e[9]=o,e[10]=h):h=e[10];let u;return e[11]!==c||e[12]!==d||e[13]!==h?(u=(0,B.jsxs)(B.Fragment,{children:[d,c,h]}),e[11]=c,e[12]=d,e[13]=h,e[14]=u):u=e[14],u};function rg(t){return t.type}function og(t){return t.message.parts.map(rg)}function ig(t){return t.type==="tool-call"?t.toolCallId:void 0}function sg(t){return t.message.parts.map(ig)}function ng(t){return t.part}function ag(t){return t.message.status??qf}function lg(t){return t.part}function cg(t){return t.part.type==="tool-call"?Sd(t.tools,t.part):null}function dg(t){return t.part}function ug(t){return t.part.type==="data"?Dn(t.dataRenderers,t.part.name,void 0)??null:null}function pg(t){return t.part.type}function mg(t){return t.message.parts.length}function hg(t){return(t.message.status?.type??"complete")==="running"}function fg(t){return t.message.parts.length}var Ed=Symbol.for("@assistant-ui/groupBy.memoKey");var Id=t=>{let e=t.nextChildIdx++;return t.nodeKey===""?String(e):`${t.nodeKey}.${e}`},Cd=(t,e)=>{if(!(e===void 0||t.claimed.has(e)))return t.claimed.add(e),`id:${e}`},Rd=(t,e)=>{let r={key:"",nodeKey:"",indices:[],children:[],nextChildIdx:0,claimed:new Set},o=[r],i=()=>{let s=o.pop(),n=o[o.length-1];n.children.push({type:"group",key:s.key,nodeKey:s.nodeKey,idKey:Cd(n,e?.[s.indices[0]]),indices:s.indices,children:s.children})};for(let s=0;s<t.length;s++){let n=t[s],a=0;for(;a<o.length-1&&a<n.length&&o[a+1].key===n[a];)a++;for(;o.length-1>a;)i();for(;o.length-1<n.length;){let c=o[o.length-1];o.push({key:n[o.length-1],nodeKey:Id(c),indices:[],children:[],nextChildIdx:0,claimed:new Set})}let l=o[o.length-1];l.children.push({type:"part",index:s,nodeKey:Id(l),idKey:Cd(l,e?.[s])});for(let c=1;c<o.length;c++)o[c].indices.push(s)}for(;o.length>1;)i();return r.children};var tt=$("react/jsx-runtime"),gg=(t,e,r)=>{if(!r)return!1;switch(t){case"never":return!1;case"always":return!0;case"empty":return e.length===0;case"no-text":{let o=e[e.length-1];return o===void 0||o.type!=="text"&&o.type!=="reasoning"}}},Ad=()=>{throw new Error("MessagePrimitive.GroupedParts: rendered `children` under a leaf part. `children` is only meaningful for `group-\u2026` cases \u2014 add a matching case for the part type or return `null` to skip it.")},Md=(t,e,r)=>{if(t.type==="part")return(0,tt.jsx)(Nn,{index:t.index,children:({part:n})=>r({part:n,children:(0,tt.jsx)(Ad,{})})},t.idKey?`part-${t.idKey}`:`part-${t.index}`);let{status:o,counts:i}=Ic(e,t.indices),s={type:t.key,status:o,counts:i,indices:t.indices};return(0,tt.jsx)(Es,{children:r({part:s,children:(0,tt.jsx)(tt.Fragment,{children:t.children.map(n=>Md(n,e,r))})})},t.idKey??t.nodeKey)},Hi=({groupBy:t,indicator:e="no-text",children:r})=>{let o=P(at(l=>l.message.parts)),i=P(l=>l.tools.toolUIs),s=P(l=>e==="never"?!1:l.message.status?.type==="running"),n=t[Ed]??t,a=G(()=>{let l={toolUIs:i};return Rd(o.map(c=>t(c,l)??[]),o.map(c=>c.type==="tool-call"?c.toolCallId:void 0))},[o,n,i]);return(0,tt.jsxs)(tt.Fragment,{children:[a.map(l=>Md(l,o,r)),gg(e,o,s)&&r({part:{type:"indicator"},children:(0,tt.jsx)(Ad,{})})]})};Hi.displayName="MessagePrimitive.GroupedParts";var Gi=$("react/jsx-runtime"),vg=t=>{let e=v(5),{children:r}=t,o=P(zi);if(!o)return null;let i;e[0]!==r||e[1]!==o?(i=r(o),e[0]=r,e[1]=o,e[2]=i):i=e[2];let s;return e[3]!==i?(s=(0,Gi.jsx)(Gi.Fragment,{children:i}),e[3]=i,e[4]=s):s=e[4],s},Wi=te(vg);Wi.displayName="MessagePrimitive.Quote";var bt=$("react/jsx-runtime"),Dd=(t,e)=>{switch(e.type){case"image":return t?.Image??t?.Attachment;case"document":return t?.Document??t?.Attachment;case"file":return t?.File??t?.Attachment;default:return t?.Attachment}},bg=t=>{let e=v(5),{components:r}=t,o=P(wg);if(!o)return null;let i=o,s;e[0]!==r||e[1]!==i?(s=Dd(r,i),e[0]=r,e[1]=i,e[2]=s):s=e[2];let n=s;if(!n)return null;let a;return e[3]!==n?(a=(0,bt.jsx)(n,{}),e[3]=n,e[4]=a):a=e[4],a},uo=te(t=>{let e=v(5),{index:r,components:o}=t,i;e[0]!==o?(i=(0,bt.jsx)(bg,{components:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,bt.jsx)(xn,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},(t,e)=>t.index===e.index&&t.components?.Image===e.components?.Image&&t.components?.Document===e.components?.Document&&t.components?.File===e.components?.File&&t.components?.Attachment===e.components?.Attachment);uo.displayName="MessagePrimitive.AttachmentByIndex";var Pd=({children:t})=>{let e=P(at(r=>r.message.role!=="user"?[]:(r.message.attachments??[]).map(o=>o.id)));return G(()=>e.map((r,o)=>(0,bt.jsx)(xn,{index:o,children:(0,bt.jsx)(gt,{getItemState:i=>i.message.attachment({index:o}).getState(),children:i=>t({get attachment(){return i()}})})},r)),[e,t])},po=t=>{let e=v(4),{components:r,children:o}=t;if(r){let s;return e[0]!==r?(s=(0,bt.jsx)(Pd,{children:n=>{let{attachment:a}=n,l=Dd(r,a);return l?(0,bt.jsx)(l,{}):null}}),e[0]=r,e[1]=s):s=e[1],s}let i;return e[2]!==o?(i=(0,bt.jsx)(Pd,{children:o}),e[2]=o,e[3]=i):i=e[3],i};po.displayName="MessagePrimitive.Attachments";function wg(t){return t.attachment}var Xt=t=>{let{children:e}=t;return P(xg)?e:null};Xt.displayName="MessagePartPrimitive.InProgress";function xg(t){return t.part.status.type==="running"}var wt=$("react/jsx-runtime"),Nd=t=>{let e=v(2),{components:r}=t,o=r.Suggestion,i;return e[0]!==o?(i=(0,wt.jsx)(o,{}),e[0]=o,e[1]=i):i=e[1],i},mo=te(t=>{let e=v(5),{index:r,components:o}=t,i;e[0]!==o?(i=(0,wt.jsx)(Nd,{components:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,wt.jsx)(_n,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},(t,e)=>t.index===e.index&&t.components.Suggestion===e.components.Suggestion);mo.displayName="ThreadPrimitive.SuggestionByIndex";var Od=({children:t})=>{let e=P(r=>r.suggestions.suggestions.length);return G(()=>e===0?null:Array.from({length:e},(r,o)=>(0,wt.jsx)(_n,{index:o,children:(0,wt.jsx)(gt,{getItemState:i=>i.suggestions.suggestion({index:o}).getState(),children:i=>t({get suggestion(){return i()}})})},o)),[e,t])},Ki=t=>{let e=v(4),{components:r,children:o}=t;if(r){let s;return e[0]!==r?(s=(0,wt.jsx)(Od,{children:()=>(0,wt.jsx)(Nd,{components:r})}),e[0]=r,e[1]=s):s=e[1],s}let i;return e[2]!==o?(i=(0,wt.jsx)(Od,{children:o}),e[2]=o,e[3]=i):i=e[3],i};Ki.displayName="ThreadPrimitive.Suggestions";var Ji=te(Ki,(t,e)=>t.children||e.children?t.children===e.children:t.components.Suggestion===e.components.Suggestion);var Bd=(t,e)=>t.thread.isDisabled||e&&t.thread.isRunning&&!t.thread.capabilities.queue,$d=t=>{if(t.message.status?.type!=="incomplete"||t.message.status.reason!=="error")return;let e=t.message.status.error;return typeof e=="string"?e:typeof e=="object"&&e!==null&&"message"in e&&typeof e.message=="string"?e.message:e??"An error occurred"};var Bn=t=>{let e=v(10),{prompt:r,send:o,clearComposer:i}=t,s=i===void 0?!0:i,n=U(),a=o??!1,l;e[0]!==a?(l=p=>Bd(p,a),e[0]=a,e[1]=l):l=e[1];let c=P(l),d;e[2]!==n||e[3]!==s||e[4]!==r||e[5]!==a?(d=()=>{if(a){let{isRunning:p,capabilities:m}=n.thread.getState();if(p&&!m.queue)return;n.thread.append({content:[{type:"text",text:r}],runConfig:n.composer.getState().runConfig}),s&&!p&&n.composer.setText("")}else if(s)n.composer.setText(r);else{let p=n.composer.getState().text;n.composer.setText([p,r].filter(yg).join(" "))}},e[2]=n,e[3]=s,e[4]=r,e[5]=a,e[6]=d):d=e[6];let h=d,u;return e[7]!==c||e[8]!==h?(u={trigger:h,disabled:c},e[7]=c,e[8]=h,e[9]=u):u=e[9],u};function yg(t){return t.trim()}var $n=()=>P($d);function Ld(t,e){function r(o){let i=ut(t);if(!o?.optional&&!i)throw new Error(`This component must be used within ${e}.`);return i}return r}function Qi(t,e){function r(i){let s=t(i);return s?s[e]:null}function o(i){let s=!1,n;typeof i=="function"?n=i:i&&typeof i=="object"&&(s=!!i.optional,n=i.selector);let a=r({optional:s});return a?n?a(n):a():null}return{[e]:o,[`${e}Store`]:r}}var Ln=we(null),_g=Ld(Ln,"ThreadPrimitive.Viewport"),{useThreadViewport:$e,useThreadViewportStore:Le}=Qi(_g,"useThreadViewport");var Sr,jn=()=>{if(Sr)return Sr;let t=()=>({apis:new Map,nextId:0,listeners:new Set});if(typeof window>"u")return Sr=t(),Sr;let e=window.__ASSISTANT_UI_DEVTOOLS_HOOK__;if(e)return Sr=e,e;let r=t();return window.__ASSISTANT_UI_DEVTOOLS_HOOK__=r,Sr=r,r},Yi=t=>{le(jn().listeners,t,"DevTools")};var Dt,jd=(Dt=class{static register(e){let r=jn();for(let a of r.apis.values())if(a.api===e)return()=>{};let o=r.nextId++,i={api:e,logs:[]},s=e.on?.("*",a=>{let l=r.apis.get(o);l&&(l.logs.push({time:new Date,event:a.event,data:a.payload}),l.logs.length>Dt.MAX_EVENT_LOGS_PER_API&&(l.logs=l.logs.slice(-Dt.MAX_EVENT_LOGS_PER_API)),Yi(o))}),n=e.subscribe?.(()=>{Yi(o)});return r.apis.set(o,i),Yi(o),()=>{let a=jn();a.apis.get(o)&&(s?.(),n?.(),a.apis.delete(o),Yi(o))}}},f(Dt,"MAX_EVENT_LOGS_PER_API",200),Dt);var Fd=t=>{let e,r=new Set,o=(c,d)=>{let h=typeof c=="function"?c(e):c;if(!Object.is(h,e)){let u=e;e=d??(typeof h!="object"||h===null)?h:Object.assign({},e,h),r.forEach(p=>p(e,u))}},i=()=>e,a={setState:o,getState:i,getInitialState:()=>l,subscribe:c=>(r.add(c),()=>r.delete(c))},l=e=t(o,i,a);return a},Vd=(t=>t?Fd(t):Fd);var ho=Fe($("react"),1);var Sg=t=>t;function Tg(t,e=Sg){let r=ho.default.useSyncExternalStore(t.subscribe,ho.default.useCallback(()=>e(t.getState()),[t,e]),ho.default.useCallback(()=>e(t.getInitialState()),[t,e]));return ho.default.useDebugValue(r),r}var Ud=t=>{let e=Vd(t),r=o=>Tg(e,o);return Object.assign(r,e),r},zd=(t=>t?Ud(t):Ud);var qd=t=>{let e=new Map,r=()=>{let o=0;for(let i of e.values())o+=i;t(o)};return{register:()=>{let o=Symbol();return e.set(o,0),{setHeight:i=>{e.get(o)!==i&&(e.set(o,i),r())},unregister:()=>{e.delete(o),r()}}}}},Hd=(t={})=>{let e=new Set,r=qd(n=>{s.setState({height:{...s.getState().height,viewport:n}})}),o=qd(n=>{s.setState({height:{...s.getState().height,inset:n}})}),i=(n,a)=>(s.setState({element:{...s.getState().element,[n]:a}}),()=>{s.getState().element[n]===a&&s.setState({element:{...s.getState().element,[n]:null}})}),s=zd(()=>({isAtBottom:!0,scrollToBottom:({behavior:n="auto"}={})=>{le(e,()=>({behavior:n}),"Thread viewport")},onScrollToBottom:n=>(e.add(n),()=>{e.delete(n)}),turnAnchor:t.turnAnchor??"bottom",topAnchorMessageClamp:{tallerThan:t.topAnchorMessageClamp?.tallerThan??"10em",visibleHeight:t.topAnchorMessageClamp?.visibleHeight??"6em"},height:{viewport:0,inset:0},element:{viewport:null,anchor:null,target:null},targetConfig:null,topAnchorTurn:null,registerViewport:r.register,registerContentInset:o.register,registerViewportElement:n=>i("viewport",n),registerAnchorElement:n=>i("anchor",n),registerAnchorTargetElement:(n,a)=>(s.setState({element:{...s.getState().element,target:n},targetConfig:n&&a?a:null}),()=>{s.getState().element.target===n&&s.setState({element:{...s.getState().element,target:null},targetConfig:null})}),setTopAnchorTurn:n=>{s.setState({topAnchorTurn:n})}}));return s};var Zt=t=>t;var Gd=$("react/jsx-runtime"),kg=t=>{let e=v(11),r;e[0]===Symbol.for("react.memo_cache_sentinel")?(r={optional:!0},e[0]=r):r=e[0];let o=Le(r),i;e[1]!==t?(i=()=>Hd(t),e[1]=t,e[2]=i):i=e[2];let[s]=z(i),n,a;e[3]!==o||e[4]!==s?(n=()=>o?.getState().onScrollToBottom(d=>{s.getState().scrollToBottom(d)}),a=[o,s],e[3]=o,e[4]=s,e[5]=n,e[6]=a):(n=e[5],a=e[6]),D(n,a);let l,c;return e[7]!==o||e[8]!==s?(l=()=>{if(o)return s.subscribe(d=>{o.getState().isAtBottom!==d.isAtBottom&&Zt(o).setState({isAtBottom:d.isAtBottom})})},c=[s,o],e[7]=o,e[8]=s,e[9]=l,e[10]=c):(l=e[9],c=e[10]),D(l,c),s},Tr=t=>{let e=v(7),{children:r,options:o}=t,i;e[0]!==o?(i=o===void 0?{}:o,e[0]=o,e[1]=i):i=e[1];let s=kg(i),n;e[2]!==s?(n=()=>({useThreadViewport:s}),e[2]=s,e[3]=n):n=e[3];let[a]=z(n),l;return e[4]!==r||e[5]!==a?(l=(0,Gd.jsx)(Ln.Provider,{value:a,children:r}),e[4]=r,e[5]=a,e[6]=l):l=e[6],l};var fo=$("react/jsx-runtime"),Ig=()=>{let t=v(3),e=U(),r,o;return t[0]!==e?(r=()=>{typeof process>"u"},o=[e],t[0]=e,t[1]=r,t[2]=o):(r=t[1],o=t[2]),D(r,o),null},Cg=t=>{let e=v(8),{children:r,aui:o,config:i,runtime:s}=t,n=o??null,a;e[0]===Symbol.for("react.memo_cache_sentinel")?(a=(0,fo.jsx)(Ig,{}),e[0]=a):a=e[0];let l;e[1]!==r?(l=(0,fo.jsx)(Tr,{children:r}),e[1]=r,e[2]=l):l=e[2];let c;return e[3]!==i||e[4]!==s||e[5]!==n||e[6]!==l?(c=(0,fo.jsxs)(Zs,{runtime:s,aui:n,config:i,children:[a,l]}),e[3]=i,e[4]=s,e[5]=n,e[6]=l,e[7]=c):c=e[7],c},Fn=te(Cg);var Zd=Fe($("react"),1),eu=Fe($("react-dom"),1);var Zi={};us(Zi,{Root:()=>Ag,Slot:()=>Ag,Slottable:()=>Mg,createSlot:()=>go,createSlottable:()=>Hn});var ue=Fe($("react"),1);var Wd=Fe($("react"),1),Eg=Object.defineProperty,Un=(t,e)=>Eg(t,"name",{value:e,configurable:!0});function Vn(t,e){if(typeof t=="function")return t(e);t!=null&&(t.current=e)}Un(Vn,"setRef");function zn(...t){return e=>{let r=!1,o=t.map(i=>{let s=Vn(i,e);return!r&&typeof s=="function"&&(r=!0),s});if(r)return()=>{for(let i=0;i<o.length;i++){let s=o[i];typeof s=="function"?s():Vn(t[i],null)}}}}Un(zn,"composeRefs");function je(...t){return Wd.useCallback(zn(...t),t)}Un(je,"useComposedRefs");var Rg=Object.defineProperty,rt=(t,e)=>Rg(t,"name",{value:e,configurable:!0});function go(t){let e=ue.forwardRef((r,o)=>{let{children:i,...s}=r,n=null,a=!1,l=[];qn(i)&&typeof Xi=="function"&&(i=Xi(i._payload)),ue.Children.forEach(i,u=>{if(Yd(u)){a=!0;let p=u,m="child"in p.props?p.props.child:p.props.children;qn(m)&&typeof Xi=="function"&&(m=Xi(m._payload)),n=Pg(p,m),l.push(n?.props?.children)}else l.push(u)}),n?n=ue.cloneElement(n,void 0,l):!a&&ue.Children.count(i)===1&&ue.isValidElement(i)&&(n=i);let c=n?Qd(n):void 0,d=je(o,c);if(!n){if(i||i===0)throw new Error(a?Ng(t):Og(t));return i}let h=Jd(s,n.props??{});return n.type!==ue.Fragment&&(h.ref=o?d:c),ue.cloneElement(n,h)});return e.displayName=`${t}.Slot`,e}rt(go,"createSlot");var Ag=go("Slot"),Kd=Symbol.for("radix.slottable");function Hn(t){let e=rt(r=>"child"in r?r.children(r.child):r.children,"Slottable");return e.displayName=`${t}.Slottable`,e.__radixId=Kd,e}rt(Hn,"createSlottable");var Mg=Hn("Slottable"),Pg=rt((t,e)=>{if("child"in t.props){let r=t.props.child;return ue.isValidElement(r)?ue.cloneElement(r,void 0,t.props.children(r.props.children)):null}return ue.isValidElement(e)?e:null},"getSlottableElementFromSlottable");function Jd(t,e){let r={...e};for(let o in e){let i=t[o],s=e[o];/^on[A-Z]/.test(o)?i&&s?r[o]=(...a)=>{let l=s(...a);return i(...a),l}:i&&(r[o]=i):o==="style"?r[o]={...i,...s}:o==="className"&&(r[o]=[i,s].filter(Boolean).join(" "))}return{...t,...r}}rt(Jd,"mergeProps");function Qd(t){let e=Object.getOwnPropertyDescriptor(t.props,"ref")?.get,r=e&&"isReactWarning"in e&&e.isReactWarning;return r?t.ref:(e=Object.getOwnPropertyDescriptor(t,"ref")?.get,r=e&&"isReactWarning"in e&&e.isReactWarning,r?t.props.ref:t.props.ref||t.ref)}rt(Qd,"getElementRef");function Yd(t){return ue.isValidElement(t)&&typeof t.type=="function"&&"__radixId"in t.type&&t.type.__radixId===Kd}rt(Yd,"isSlottable");var Dg=Symbol.for("react.lazy");function qn(t){return t!=null&&typeof t=="object"&&"$$typeof"in t&&t.$$typeof===Dg&&"_payload"in t&&Xd(t._payload)}rt(qn,"isLazyComponent");function Xd(t){return typeof t=="object"&&t!==null&&"then"in t}rt(Xd,"isPromiseLike");var Og=rt(t=>`${t} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,"createSlotError"),Ng=rt(t=>`${t} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,"createSlottableError"),Xi=ue[" use ".trim().toString()];var tu=$("react/jsx-runtime"),Bg=Object.defineProperty,$g=(t,e)=>Bg(t,"name",{value:e,configurable:!0}),Lg=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],Gn=Lg.reduce((t,e)=>{let r=go(`Primitive.${e}`),o=Zd.forwardRef((i,s)=>{let{asChild:n,...a}=i,l=n?r:e;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),(0,tu.jsx)(l,{...a,ref:s})});return o.displayName=`Primitive.${e}`,{...t,[e]:o}},{});function Wn(t,e){t&&eu.flushSync(()=>t.dispatchEvent(e))}$g(Wn,"dispatchDiscreteCustomEvent");var jg=Object.defineProperty,kr=(t,e)=>jg(t,"name",{value:e,configurable:!0}),ru=!!(typeof window<"u"&&window.document&&window.document.createElement);function es(t,e,{checkForDefaultPrevented:r=!0}={}){return kr(function(i){if(t?.(i),r===!1||!i||!i.defaultPrevented)return e?.(i)},"handleEvent")}kr(es,"composeEventHandlers");function Fg(t){if(!ru)throw new Error("Cannot access window outside of the DOM");return t?.ownerDocument?.defaultView??window}kr(Fg,"getOwnerWindow");function Kn(t){if(!ru)throw new Error("Cannot access document outside of the DOM");return t?.ownerDocument??document}kr(Kn,"getOwnerDocument");function ou(t,e=!1){let{activeElement:r}=Kn(t);if(!r?.nodeName)return null;if(iu(r)&&r.contentDocument)return ou(r.contentDocument.body,e);if(e){let o=r.getAttribute("aria-activedescendant");if(o){let i=Kn(r).getElementById(o);if(i)return i}}return r}kr(ou,"getActiveElement");function iu(t){return t.tagName==="IFRAME"}kr(iu,"isFrame");var Ir=Fe($("react"),1),Vg=Object.defineProperty,Ug=(t,e)=>Vg(t,"name",{value:e,configurable:!0});function Ot(t){let e=Ir.useRef(t);return Ir.useEffect(()=>{e.current=t}),Ir.useMemo(()=>((...r)=>e.current?.(...r)),[])}Ug(Ot,"useCallbackRef");var ts=Gn;ts.dispatchDiscreteCustomEvent=Wn;ts.Root=Gn;var su=Object.defineProperty,rs=(t,e)=>{let r={};for(var o in t)su(r,o,{get:t[o],enumerable:!0});return e||su(r,Symbol.toStringTag,{value:"Module"}),r};var os=$("react/jsx-runtime");var zg=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"];function nu(t,e){return As(t,void 0,e!==void 0?e:t.props.children)}function au(t,e,r){return(0,os.jsx)(Zi.Root,{...r,children:nu(t,e)})}function qg(t){let e=re((r,o)=>{let i=v(17),s,n,a,l;i[0]!==r?({render:a,asChild:s,children:n,...l}=r,i[0]=r,i[1]=s,i[2]=n,i[3]=a,i[4]=l):(s=i[1],n=i[2],a=i[3],l=i[4]);let c=t;if(a&&Br(a)){let u=l,p;i[5]!==n||i[6]!==a?(p=nu(a,n),i[5]=n,i[6]=a,i[7]=p):p=i[7];let m;return i[8]!==o||i[9]!==u||i[10]!==p?(m=(0,os.jsx)(c,{...u,asChild:!0,ref:o,children:p}),i[8]=o,i[9]=u,i[10]=p,i[11]=m):m=i[11],m}let d=l,h;return i[12]!==s||i[13]!==n||i[14]!==o||i[15]!==d?(h=(0,os.jsx)(c,{...d,asChild:s,ref:o,children:n}),i[12]=s,i[13]=n,i[14]=o,i[15]=d,i[16]=h):h=i[16],h});return e.displayName=typeof t=="string"?t:t.displayName??t.name??"Component",e}function Hg(t){let e=ts[t],r=qg(e);return r.displayName=`Primitive.${t}`,r}var Se=zg.reduce((t,e)=>(t[e]=Hg(e),t),{});var lu=$("react/jsx-runtime");var is=(t,e,r=[])=>{let o=re((i,s)=>{let n=v(6),a={},l={};Object.keys(i).forEach(g=>{r.includes(g)?a[g]=i[g]:l[g]=i[g]});let c=e(a)??void 0,d=Se,h="button",u=l.disabled||!c,p=es(l.onClick,c),m;return n[0]!==s||n[1]!==l||n[2]!==d.button||n[3]!==u||n[4]!==p?(m=(0,lu.jsx)(d.button,{type:h,...l,ref:s,disabled:u,onClick:p}),n[0]=s,n[1]=l,n[2]=d.button,n[3]=u,n[4]=p,n[5]=m):m=n[5],m});return o.displayName=t,o};var cu=t=>{let e=v(4),r=Ot(t),o=$e(Gg),i,s;e[0]!==r||e[1]!==o?(i=()=>o(r),s=[o,r],e[0]=r,e[1]=o,e[2]=i,e[3]=s):(i=e[2],s=e[3]),D(i,s)};function Gg(t){return t.onScrollToBottom}var Wg=()=>!1,Kg=()=>{},du=t=>{let e=v(4),r;e[0]!==t?(r=s=>{if(typeof window>"u"||t===null||!window.matchMedia)return Kg;let n=window.matchMedia(t);return n.addEventListener("change",s),()=>n.removeEventListener("change",s)},e[0]=t,e[1]=r):r=e[1];let o=r,i;return e[2]!==t?(i=()=>typeof window>"u"||t===null||!window.matchMedia?!1:window.matchMedia(t).matches,e[2]=t,e[3]=i):i=e[3],it(o,i,Wg)};var Jg=Object.freeze({type:"complete"}),Qg=Object.freeze({type:"text",text:"",status:Jg}),uu=()=>P(Yg);function Yg(t){return t.part.type!=="text"&&t.part.type!=="reasoning"?Qg:t.part}var Xg=$("react/jsx-runtime"),Zg=we(null);function ev(t){let e=ut(Zg);if(!t?.optional&&!e)throw new Error("This component must be used within a SmoothContextProvider.");return e}var{useSmoothStatus:H2,useSmoothStatusStore:pu}=Qi(ev,"useSmoothStatus");var mu=250,hu=5,tv=class{constructor(t,e){f(this,"animationFrameId",null);f(this,"lastUpdateTime",Date.now());f(this,"lastCommitTime",0);f(this,"targetText","");f(this,"drainMs",mu);f(this,"maxCharIntervalMs",hu);f(this,"maxCharsPerFrame",1/0);f(this,"minCommitMs",0);f(this,"currentText");f(this,"setText");f(this,"animate",()=>{let t=Date.now(),e=t-this.lastUpdateTime,r=this.targetText.length-this.currentText.length,o=Math.min(this.maxCharIntervalMs,this.drainMs/r),i=Math.min(r,this.maxCharsPerFrame),s=0;for(;e>=o&&s<i;)s++,e-=o;s===i&&i===this.maxCharsPerFrame&&(e=0),s!==r?this.animationFrameId=requestAnimationFrame(this.animate):this.animationFrameId=null,s!==0&&(this.currentText=this.targetText.slice(0,this.currentText.length+s),this.lastUpdateTime=t-e,(s===r||t-this.lastCommitTime>=this.minCommitMs)&&(this.lastCommitTime=t,this.setText(this.currentText)))});this.currentText=t,this.setText=e}start(){this.animationFrameId===null&&(this.lastUpdateTime=Date.now(),this.animate())}stop(){this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}},Jn=Object.freeze({type:"running"}),ss=(t,e)=>t!==void 0&&t>0?t:e,fu=(t,e=!1)=>{let{text:r}=t,o=du("(prefers-reduced-motion: reduce)"),i=typeof e=="object"&&e!==null?e:void 0,s=e!==!1&&e!==null&&!o,n=ss(i?.drainMs,mu),a=ss(i?.maxCharIntervalMs,hu),l=ss(i?.maxCharsPerFrame,1/0),c=ss(i?.minCommitMs,0),[d,h]=z(t.status.type==="running"?"":r),u=U(),p=P(()=>u.part),[m,g]=z(p);(p!==m||!r.startsWith(d))&&(g(p),h(t.status.type==="running"?"":r));let w=pu({optional:!0}),_=Ot(I=>{if(h(I),w){let k=d!==I||t.status.type==="running"?Jn:t.status;Zt(w).setState(k,!0)}});D(()=>{if(w){let I=s&&(d!==r||t.status.type==="running")?Jn:t.status;Zt(w).setState(I,!0)}},[w,s,r,d,t.status]);let[x]=z(new tv(d,_));D(()=>{x.drainMs=n,x.maxCharIntervalMs=a,x.maxCharsPerFrame=l,x.minCommitMs=c},[x,n,a,l,c]);let T=F(p);return D(()=>{if(!s){x.stop();return}let I=T.current!==p;if(T.current=p,I||!r.startsWith(x.targetText)){t.status.type==="running"?(x.currentText="",x.targetText=r,x.lastCommitTime=0,x.start()):(x.currentText=r,x.targetText=r,x.stop(),_(r));return}if(x.targetText=r,t.status.type!=="running"){if(x.currentText===""){x.currentText=r,x.stop(),_(r);return}x.start();return}x.start()},[x,s,r,t.status.type,p,_]),D(()=>()=>{x.stop()},[x]),G(()=>s?{...t,text:d,status:r===d?t.status:Jn}:t,[s,d,t,r])};var rv=Object.freeze({type:"complete"}),ov=Object.freeze({type:"image",image:"",status:rv}),gu=()=>P(iv);function iv(t){return t.part.type!=="image"?ov:t.part}var vu=$("react/jsx-runtime"),vo=re(({smooth:t=!0,component:e=Se.span,render:r,...o},i)=>{let{text:s,status:n}=fu(uu(),t),a={"data-status":n.type,...o,ref:i};return r&&Br(r)?au(r,s,a):(0,vu.jsx)(e,{...a,children:s})});vo.displayName="MessagePartPrimitive.Text";var bu=$("react/jsx-runtime"),bo=re((t,e)=>{let r=v(4),{image:o}=gu(),i;return r[0]!==e||r[1]!==o||r[2]!==t?(i=(0,bu.jsx)(Se.img,{src:o,...t,ref:e}),r[0]=e,r[1]=o,r[2]=t,r[3]=i):i=r[3],i});bo.displayName="MessagePartPrimitive.Image";var We=t=>{let e=v(2),r=F(void 0),o;return e[0]!==t?(o=i=>{r.current&&(r.current(),r.current=void 0),i&&(r.current=t(i))},e[0]=t,e[1]=o):o=e[1],o};var Qn=(t,e)=>{let r=t.trim().match(/^(\d+(?:\.\d+)?|\.\d+)(em|px|rem)$/);if(!r)return Number.POSITIVE_INFINITY;let o=Number(r[1]),i=r[2];return i==="px"?o:i==="em"?o*(parseFloat(getComputedStyle(e).fontSize)||16):i==="rem"?o*(parseFloat(getComputedStyle(document.documentElement).fontSize)||16):Number.POSITIVE_INFINITY},wu=t=>t.dataset.messageId,xu=()=>{let t=document.createElement("div");return t.dataset.auiTopAnchorReserve="",t.style.height="0px",t.style.flexShrink="0",t.style.pointerEvents="none",t.setAttribute("aria-hidden","true"),t},ns=(t,e)=>{let r=`${e}px`;return t.style.height!==r?(t.style.height=r,!0):!1},yu=t=>{let e=window.devicePixelRatio||1;return Math.round(t*e)/e};var wo=$("react/jsx-runtime");var _u=()=>{let t=v(4),e=U(),r;t[0]!==e.message?(r=()=>e.message,t[0]=e.message,t[1]=r):r=t[1];let o=P(r),i;return t[2]!==o?(i=s=>{let n=()=>{o.setIsHovering(!0)},a=()=>{o.setIsHovering(!1)};return s.addEventListener("mouseenter",n),s.addEventListener("mouseleave",a),s.matches(":hover")&&queueMicrotask(()=>o.setIsHovering(!0)),()=>{s.removeEventListener("mouseenter",n),s.removeEventListener("mouseleave",a),o.setIsHovering(!1)}},t[2]=o,t[3]=i):i=t[3],We(i)},sv=()=>{let t=v(2),e=$e(uv),r;return t[0]!==e?(r=o=>o.message.role==="user"&&o.message.index>0&&o.message.index===o.thread.messages.length-2&&o.thread.messages.at(-1)?.role==="assistant"&&(o.message.id===e||o.thread.isRunning),t[0]=e,t[1]=r):r=t[1],P(r)},nv=()=>{let t=v(2),e=$e(pv),r;return t[0]!==e?(r=o=>o.message.isLast&&o.message.role==="assistant"&&o.message.index>=1&&o.thread.messages.at(o.message.index-1)?.role==="user"&&(o.message.id===e||o.thread.isRunning),t[0]=e,t[1]=r):r=t[1],P(r)},av=(t,e)=>{let r=v(3),o;return r[0]!==t||r[1]!==e?(o=i=>{if(t)return e.getState().registerAnchorElement(i)},r[0]=t,r[1]=e,r[2]=o):o=r[2],We(o)},lv=t=>{let e=v(3),{active:r,threadViewportStore:o}=t,i;return e[0]!==r||e[1]!==o?(i=s=>{if(!r)return;let n=o.getState(),a=n.topAnchorMessageClamp;return n.registerAnchorTargetElement(s,{tallerThan:Qn(a.tallerThan,s),visibleHeight:Qn(a.visibleHeight,s)})},e[0]=r,e[1]=o,e[2]=i):i=e[2],We(i)},cv=t=>{let e=v(7),r,o;e[0]!==t?({forwardedRef:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i=_u(),s=je(r,i),n=P(mv),a;return e[3]!==n||e[4]!==o||e[5]!==s?(a=(0,wo.jsx)(Se.div,{...o,ref:s,"data-message-id":n}),e[3]=n,e[4]=o,e[5]=s,e[6]=a):a=e[6],a},dv=t=>{let e=v(13),r,o,i;e[0]!==t?({forwardedRef:r,threadViewportStore:i,...o}=t,e[0]=t,e[1]=r,e[2]=o,e[3]=i):(r=e[1],o=e[2],i=e[3]);let s=_u(),n=sv(),a=nv(),l=av(n,i),c;e[4]!==a||e[5]!==i?(c={active:a,threadViewportStore:i},e[4]=a,e[5]=i,e[6]=c):c=e[6];let d=lv(c),h=je(r,s,l,d),u=P(hv),p=n?"":void 0,m=a?"":void 0,g;return e[7]!==u||e[8]!==o||e[9]!==h||e[10]!==p||e[11]!==m?(g=(0,wo.jsx)(Se.div,{...o,ref:h,"data-message-id":u,"data-aui-top-anchor-user":p,"data-aui-top-anchor-target":m}),e[7]=u,e[8]=o,e[9]=h,e[10]=p,e[11]=m,e[12]=g):g=e[12],g},Yn=re((t,e)=>{let r=v(7),o=Le();if(o.getState().turnAnchor==="top"){let s;return r[0]!==e||r[1]!==t||r[2]!==o?(s=(0,wo.jsx)(dv,{...t,forwardedRef:e,threadViewportStore:o}),r[0]=e,r[1]=t,r[2]=o,r[3]=s):s=r[3],s}let i;return r[4]!==e||r[5]!==t?(i=(0,wo.jsx)(cv,{...t,forwardedRef:e}),r[4]=e,r[5]=t,r[6]=i):i=r[6],i});Yn.displayName="MessagePrimitive.Root";function uv(t){return t.topAnchorTurn?.anchorId}function pv(t){return t.topAnchorTurn?.targetId}function mv(t){return t.message.id}function hv(t){return t.message.id}var xt=$("react/jsx-runtime"),Xn={...Ge,Text:()=>(0,xt.jsxs)("p",{style:{whiteSpace:"pre-line"},children:[(0,xt.jsx)(vo,{}),(0,xt.jsx)(Xt,{children:(0,xt.jsx)("span",{style:{fontFamily:"revert"},children:" \u25CF"})})]}),Image:()=>(0,xt.jsx)(bo,{})},as=t=>{let e=v(10);if("children"in t){let a;return e[0]!==t.children?(a=(0,xt.jsx)(co,{children:t.children}),e[0]=t.children,e[1]=a):a=e[1],a}let r,o;e[2]!==t?({components:r,...o}=t,e[2]=t,e[3]=r,e[4]=o):(r=e[3],o=e[4]);let i;e[5]!==r?(i=r?{...r,Text:r.Text??Xn.Text,Image:r.Image??Xn.Image}:Xn,e[5]=r,e[6]=i):i=e[6];let s=i,n;return e[7]!==o||e[8]!==s?(n=(0,xt.jsx)(co,{components:s,...o}),e[7]=o,e[8]=s,e[9]=n):n=e[9],n};as.displayName="MessagePrimitive.Parts";var fv=t=>{let e=v(12),r;return e[0]!==t.assistant||e[1]!==t.copied||e[2]!==t.hasAttachments||e[3]!==t.hasBranches||e[4]!==t.hasContent||e[5]!==t.last||e[6]!==t.lastOrHover||e[7]!==t.speaking||e[8]!==t.submittedFeedback||e[9]!==t.system||e[10]!==t.user?(r=o=>{let{role:i,attachments:s,parts:n,branchCount:a,isLast:l,speech:c,isCopied:d,isHovering:h}=o.message;return!(t.hasBranches===!0&&a<2||t.user&&i!=="user"||t.assistant&&i!=="assistant"||t.system&&i!=="system"||t.lastOrHover===!0&&!h&&!l||t.last!==void 0&&t.last!==l||t.copied===!0&&!d||t.copied===!1&&d||t.speaking===!0&&c==null||t.speaking===!1&&c!=null||t.hasAttachments===!0&&(i!=="user"||!s?.length)||t.hasAttachments===!1&&i==="user"&&s?.length||t.hasContent===!0&&n.length===0||t.hasContent===!1&&n.length>0||t.submittedFeedback!==void 0&&(o.message.metadata.submittedFeedback?.type??null)!==t.submittedFeedback)},e[0]=t.assistant,e[1]=t.copied,e[2]=t.hasAttachments,e[3]=t.hasBranches,e[4]=t.hasContent,e[5]=t.last,e[6]=t.lastOrHover,e[7]=t.speaking,e[8]=t.submittedFeedback,e[9]=t.system,e[10]=t.user,e[11]=r):r=e[11],P(r)},Zn=t=>{let e=v(3),r,o;return e[0]!==t?({children:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]),fv(o)?r:null};Zn.displayName="MessagePrimitive.If";var ea=t=>{let{children:e}=t;return $n()!==void 0?e:null};ea.displayName="MessagePrimitive.Error";var J=$("react/jsx-runtime"),gv=t=>{let e=new Map;for(let o=0;o<t.length;o++){let i=t[o]?.parentId??o,s=e.get(i)??[];s.push(o),e.set(i,s)}let r=[];for(let[o,i]of e){let s=typeof o=="string"?o:void 0;r.push({groupKey:s,indices:i})}return r},vv=t=>{let e=v(4),r=P(Cv),o;e:{if(r.length===0){let s;e[0]===Symbol.for("react.memo_cache_sentinel")?(s=[],e[0]=s):s=e[0],o=s;break e}let i;e[1]!==t||e[2]!==r?(i=t(r),e[1]=t,e[2]=r,e[3]=i):i=e[3],o=i}return o},bv=t=>{let e=v(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i;e[3]!==r||e[4]!==o.toolName?(i=a=>a.tools.toolUIs[o.toolName]?.[0]?.render??r,e[3]=r,e[4]=o.toolName,e[5]=i):i=e[5];let s=P(i);if(!s)return null;let n;return e[6]!==s||e[7]!==o?(n=(0,J.jsx)(s,{...o}),e[6]=s,e[7]=o,e[8]=n):n=e[8],n},wv=t=>{let e=v(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i;e[3]!==r||e[4]!==o.name?(i=a=>{let l=a.dataRenderers.renderers[o.name]??r;return Array.isArray(l)?l[0]??r:l},e[3]=r,e[4]=o.name,e[5]=i):i=e[5];let s=P(i);if(!s)return null;let n;return e[6]!==s||e[7]!==o?(n=(0,J.jsx)(s,{...o}),e[6]=s,e[7]=o,e[8]=n):n=e[8],n},Nt={Text:()=>(0,J.jsxs)("p",{style:{whiteSpace:"pre-line"},children:[(0,J.jsx)(vo,{}),(0,J.jsx)(Xt,{children:(0,J.jsx)("span",{style:{fontFamily:"revert"},children:" \u25CF"})})]}),Reasoning:()=>null,Source:()=>null,Image:()=>(0,J.jsx)(bo,{}),File:()=>null,Unstable_Audio:()=>null,Group:({children:t})=>t},xv=t=>{let e=v(37),{components:r}=t,o;e[0]!==r?(o=r===void 0?{}:r,e[0]=r,e[1]=o):o=e[1];let{Text:i,Reasoning:s,Image:n,Source:a,File:l,Unstable_Audio:c,tools:d,data:h}=o,u=i===void 0?Nt.Text:i,p=s===void 0?Nt.Reasoning:s,m=n===void 0?Nt.Image:n,g=a===void 0?Nt.Source:a,w=l===void 0?Nt.File:l,_=c===void 0?Nt.Unstable_Audio:c,x;e[2]!==d?(x=d===void 0?{}:d,e[2]=d,e[3]=x):x=e[3];let T=x,I=U(),k=P(Ev),E=k.type;if(E==="tool-call"){let R=I.part.addToolResult,y=I.part.resumeToolCall,M=I.part.respondToToolApproval;if("Override"in T){let V;return e[4]!==R||e[5]!==k||e[6]!==M||e[7]!==y||e[8]!==T.Override?(V=(0,J.jsx)(T.Override,{...k,addResult:R,resume:y,respondToApproval:M}),e[4]=R,e[5]=k,e[6]=M,e[7]=y,e[8]=T.Override,e[9]=V):V=e[9],V}let N=T.by_name?.[k.toolName]??T.Fallback,O;return e[10]!==N||e[11]!==R||e[12]!==k||e[13]!==M||e[14]!==y?(O=(0,J.jsx)(bv,{...k,Fallback:N,addResult:R,resume:y,respondToApproval:M}),e[10]=N,e[11]=R,e[12]=k,e[13]=M,e[14]=y,e[15]=O):O=e[15],O}if(k.status?.type==="requires-action")throw new Error("Encountered unexpected requires-action status");switch(E){case"text":{let R;return e[16]!==u||e[17]!==k?(R=(0,J.jsx)(u,{...k}),e[16]=u,e[17]=k,e[18]=R):R=e[18],R}case"reasoning":{let R;return e[19]!==p||e[20]!==k?(R=(0,J.jsx)(p,{...k}),e[19]=p,e[20]=k,e[21]=R):R=e[21],R}case"source":{let R;return e[22]!==g||e[23]!==k?(R=(0,J.jsx)(g,{...k}),e[22]=g,e[23]=k,e[24]=R):R=e[24],R}case"image":{let R;return e[25]!==m||e[26]!==k?(R=(0,J.jsx)(m,{...k}),e[25]=m,e[26]=k,e[27]=R):R=e[27],R}case"file":{let R;return e[28]!==w||e[29]!==k?(R=(0,J.jsx)(w,{...k}),e[28]=w,e[29]=k,e[30]=R):R=e[30],R}case"audio":{let R;return e[31]!==_||e[32]!==k?(R=(0,J.jsx)(_,{...k}),e[31]=_,e[32]=k,e[33]=R):R=e[33],R}case"data":{let R=h?.by_name?.[k.name]??h?.Fallback,y;return e[34]!==R||e[35]!==k?(y=(0,J.jsx)(wv,{...k,Fallback:R}),e[34]=R,e[35]=k,e[36]=y):y=e[36],y}default:return console.warn(`Unknown message part type: ${E}`),null}},yv=t=>{let e=v(5),{partIndex:r,components:o}=t,i;e[0]!==o?(i=(0,J.jsx)(xv,{components:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,J.jsx)(Jt,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},_v=te(yv,(t,e)=>t.partIndex===e.partIndex&&t.components?.Text===e.components?.Text&&t.components?.Reasoning===e.components?.Reasoning&&t.components?.Source===e.components?.Source&&t.components?.Image===e.components?.Image&&t.components?.File===e.components?.File&&t.components?.Unstable_Audio===e.components?.Unstable_Audio&&t.components?.tools===e.components?.tools&&t.components?.data===e.components?.data&&t.components?.Group===e.components?.Group),Sv=t=>{let e=v(6),{status:r,component:o}=t,i=r.type==="running",s;e[0]!==o||e[1]!==r?(s=(0,J.jsx)(o,{type:"text",text:"",status:r}),e[0]=o,e[1]=r,e[2]=s):s=e[2];let n;return e[3]!==i||e[4]!==s?(n=(0,J.jsx)(Qt,{text:"",isRunning:i,children:s}),e[3]=i,e[4]=s,e[5]=n):n=e[5],n},Tv=Object.freeze({type:"complete"}),kv=t=>{let e=v(6),{components:r}=t,o=P(Rv);if(r?.Empty){let n;return e[0]!==r.Empty||e[1]!==o?(n=(0,J.jsx)(r.Empty,{status:o}),e[0]=r.Empty,e[1]=o,e[2]=n):n=e[2],n}let i=r?.Text??Nt.Text,s;return e[3]!==o||e[4]!==i?(s=(0,J.jsx)(Sv,{status:o,component:i}),e[3]=o,e[4]=i,e[5]=s):s=e[5],s},Iv=te(kv,(t,e)=>t.components?.Empty===e.components?.Empty&&t.components?.Text===e.components?.Text),ls=t=>{let e=v(9),{groupingFunction:r,components:o}=t,i=P(Av),s=vv(r),n;e:{if(i===0){let d;e[0]!==o?(d=(0,J.jsx)(Iv,{components:o}),e[0]=o,e[1]=d):d=e[1],n=d;break e}let c;if(e[2]!==o||e[3]!==s){let d;e[5]!==o?(d=(h,u)=>{let p=o?.Group??Nt.Group;return(0,J.jsx)(p,{groupKey:h.groupKey,indices:h.indices,children:h.indices.map(m=>(0,J.jsx)(_v,{partIndex:m,components:o},m))},`group-${u}-${h.groupKey??"ungrouped"}`)},e[5]=o,e[6]=d):d=e[6],c=s.map(d),e[2]=o,e[3]=s,e[4]=c}else c=e[4];n=c}let a=n,l;return e[7]!==a?(l=(0,J.jsx)(J.Fragment,{children:a}),e[7]=a,e[8]=l):l=e[8],l};ls.displayName="MessagePrimitive.Unstable_PartsGrouped";var ta=t=>{let e=v(6),r,o;e[0]!==t?({components:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i;return e[3]!==r||e[4]!==o?(i=(0,J.jsx)(ls,{...o,components:r,groupingFunction:gv}),e[3]=r,e[4]=o,e[5]=i):i=e[5],i};ta.displayName="MessagePrimitive.Unstable_PartsGroupedByParentId";function Cv(t){return t.message.parts}function Ev(t){return t.part}function Rv(t){return t.message.status??Tv}function Av(t){return t.message.parts.length}var Cr=rs({AttachmentByIndex:()=>uo,Attachments:()=>po,Content:()=>as,Error:()=>ea,GenerativeUI:()=>qi,GroupedParts:()=>Hi,If:()=>Zn,PartByIndex:()=>Pt,Parts:()=>as,Quote:()=>Wi,Root:()=>Yn,Unstable_PartsGrouped:()=>ls,Unstable_PartsGroupedByParentId:()=>ta});var Su=t=>{let e=v(2),r=Ot(t),o;return e[0]!==r?(o=i=>{let s=new ResizeObserver(()=>{r()}),n=new MutationObserver(a=>{a.some(Mv)&&r()});return s.observe(i),n.observe(i,{childList:!0,subtree:!0,attributes:!0,characterData:!0}),()=>{s.disconnect(),n.disconnect()}},e[0]=r,e[1]=o):o=e[1],We(o)};function Mv(t){return t.type!=="attributes"||t.attributeName!=="style"}var Tu=({autoScroll:t,scrollToBottomOnRunStart:e=!0,scrollToBottomOnInitialize:r=!0,scrollToBottomOnThreadSwitch:o=!0})=>{let i=F(null),s=P(y=>y.thread.messages.length>0),n=P(y=>y.thread.isRunning),a=F(!1),l=F(null),c=Le();t===void 0&&(t=c.getState().turnAnchor!=="top");let d=F(0),h=F(0),u=F(0),p=F(0),m=F(null),g=F(t),w=F(t);Ue(()=>{let y=w.current;if(w.current=t,y||!t)return;let M=i.current;g.current=M!==null&&li(M)},[t]);let _=Ct(y=>{let M=i.current;M&&(g.current=!0,m.current=y,M.scrollTo({top:M.scrollHeight,behavior:y}))},[]),x=Ct(()=>{l.current!==null&&(cancelAnimationFrame(l.current),l.current=null)},[]),T=Ct(y=>{m.current=y,x(),l.current=requestAnimationFrame(()=>{l.current=null,_(y)})},[x,_]);Ue(()=>()=>x(),[x]);let I=Ct(()=>{let y=c.getState();return y.turnAnchor==="top"&&y.element.viewport===i.current&&y.element.anchor!==null},[c]),k=()=>{let y=i.current;if(!y)return;let M=c.getState().isAtBottom,N=li(y);if(!(!N&&d.current<y.scrollTop)){let O=Qs({scrollTop:d.current,scrollHeight:h.current},y);N?(Js(y)&&(m.current=null),t&&(g.current=!0)):O&&(x(),m.current=null,g.current=!1),(N||m.current===null)&&N!==M&&Zt(c).setState({isAtBottom:N})}d.current=y.scrollTop,h.current=y.scrollHeight},E=Su(()=>{let y=i.current;if(!y)return;let{scrollHeight:M,clientHeight:N}=y;if(M===u.current&&N===p.current)return;u.current=M,p.current=N;let O=m.current;O&&I()?m.current=null:O?_(O):t&&!(n&&I())&&g.current&&_("instant"),k()}),R=We(y=>{let M=()=>{m.current=null};return y.addEventListener("scroll",k),y.addEventListener("pointerdown",M),()=>{y.removeEventListener("scroll",k),y.removeEventListener("pointerdown",M)}});return Ue(()=>{if(r){if(!s){a.current=!1;return}a.current||(a.current=!0,m.current===null&&T("instant"))}},[s,T,r]),cu(({behavior:y})=>{_(y)}),yi("thread.runStart",()=>{e&&c.getState().turnAnchor!=="top"&&T("auto")}),yi("threads.selectionChanged",()=>{o&&T("instant")}),je(E,R,i)};var ku=$("react/jsx-runtime"),ra=re((t,e)=>{let r=v(6),o=U(),i,s;r[0]!==o?(i=()=>{let a=l=>{if(l.key==="Escape"&&!(l.defaultPrevented||o.thread.source===null)&&o.thread.getState().speech!=null){l.preventDefault();try{o.thread.stopSpeaking()}catch(c){let d=c;if(!(d instanceof Error)||d.message!=="No message is being spoken")throw d}}};return document.addEventListener("keydown",a),()=>{document.removeEventListener("keydown",a)}},s=[o],r[0]=o,r[1]=i,r[2]=s):(i=r[1],s=r[2]),D(i,s);let n;return r[3]!==t||r[4]!==e?(n=(0,ku.jsx)(Se.div,{...t,ref:e}),r[3]=t,r[4]=e,r[5]=n):n=r[5],n});ra.displayName="ThreadPrimitive.Root";var oa=t=>{let{children:e}=t;return P(Pv)?e:null};oa.displayName="ThreadPrimitive.Empty";function Pv(t){return t.thread.isEmpty}var Dv=t=>{let e=v(4),r;return e[0]!==t.disabled||e[1]!==t.empty||e[2]!==t.running?(r=o=>!(t.empty===!0&&!o.thread.isEmpty||t.empty===!1&&o.thread.isEmpty||t.running===!0&&!o.thread.isRunning||t.running===!1&&o.thread.isRunning||t.disabled===!0&&!o.thread.isDisabled||t.disabled===!1&&o.thread.isDisabled),e[0]=t.disabled,e[1]=t.empty,e[2]=t.running,e[3]=r):r=e[3],P(r)},ia=t=>{let e=v(3),r,o;return e[0]!==t?({children:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]),Dv(o)?r:null};ia.displayName="ThreadPrimitive.If";var cs=(t,e)=>{let r=v(3),o;return r[0]!==e||r[1]!==t?(o=i=>{if(!t)return;let s=t(),n=()=>{let l=e?e(i):i.offsetHeight;s.setHeight(l)},a=new ResizeObserver(n);return a.observe(i),n(),()=>{a.disconnect(),s.unregister()}},r[0]=e,r[1]=t,r[2]=o):o=r[2],We(o)};var Iu=t=>{let e=0,r=t;for(;r;)e+=r.offsetTop,r=r.offsetParent;return e},Ov=(t,e)=>{let r=0,o=t;for(;o&&o!==e;)r+=o.offsetTop,o=o.offsetParent;return o===e?r:Iu(t)-Iu(e)},sa=({viewport:t,anchor:e,tallerThan:r,visibleHeight:o})=>{let i=Ov(e,t),s=e.offsetHeight;return i+Math.max(0,s-(s<=r?s:o))},Nv=({scrollHeight:t,...e})=>{let{viewport:r}=e,o=sa(e)+r.clientHeight;return Math.max(0,o-t)},Cu=({viewport:t,reserve:e,...r})=>Nv({viewport:t,...r,scrollHeight:t.scrollHeight-e.offsetHeight});var Eu=t=>{let e=new ResizeObserver(t),r=new MutationObserver(t),o=null,i=null,s=null,n=()=>{e.disconnect(),r.disconnect(),o=null,i=null,s=null};return{target:(a,l,c)=>{o===a&&i===l&&s===c||(n(),e.observe(a),e.observe(l),e.observe(c),r.observe(c,{childList:!0,subtree:!0,characterData:!0}),o=a,i=l,s=c)},disconnect:n}};var Bv=t=>{let e=null;return{schedule:()=>{e===null&&(e=requestAnimationFrame(()=>{e=null,t()}))},cancel:()=>{e!==null&&(cancelAnimationFrame(e),e=null)}}},Ru=t=>{let e=null,r;function o(){let a=t.getState(),{viewport:l,anchor:c,target:d}=a.element,h=a.targetConfig;if(a.turnAnchor!=="top"||!l){s.disconnect(),e&&(ns(e,0),e.remove());return}if(!c&&!d&&!h&&a.topAnchorTurn){s.disconnect(),e?.parentElement&&e.parentElement.lastElementChild!==e&&e.parentElement.append(e);return}if(!c||!d||!h){s.disconnect(),e&&(ns(e,0),e.remove());return}if(e??(e=xu()),(e.parentElement!==d.parentElement||e.previousElementSibling!==d)&&d.after(e),s.target(l,c,d),ns(e,Cu({viewport:l,anchor:c,reserve:e,...h}))){i.schedule();return}let u=wu(c);if(u!==void 0&&r===u)return;let p=yu(sa({viewport:l,anchor:c,...h}));Math.abs(l.scrollTop-p)>1&&l.scrollTo({top:p,behavior:"smooth"}),u!==void 0&&(r=u)}let i=Bv(o),s=Eu(i.schedule);i.schedule();let n=t.subscribe(i.schedule);return()=>{i.cancel(),n(),s.disconnect(),e?.remove()}};var Au=t=>{let e=v(4),r=Le(),o,i;e[0]!==t||e[1]!==r?(o=()=>{if(t)return Ru(r)},i=[t,r],e[0]=t,e[1]=r,e[2]=o,e[3]=i):(o=e[2],i=e[3]),Ue(o,i)};var Mu=(t,e)=>{if(!t)return!1;let r=e.findIndex(o=>o.id===t.targetId);return r<1?!1:e[r-1]?.id===t.anchorId&&e.slice(r+1).every(o=>o.role==="user")},Pu=({isRunning:t,messages:e})=>{if(!t)return null;let r=e.at(-1),o=e.at(-2);return o?.role!=="user"||r?.role!=="assistant"?null:{anchorId:o.id,targetId:r.id}},Du=t=>Pu(t)?.anchorId,Ou=t=>Pu(t)?.targetId;var ds=$("react/jsx-runtime");var $v=()=>{let t=$e(Fv);return cs(t,Vv)},Lv=()=>{let t=$e(Uv);return We(t)},jv=t=>{let e=v(19),r=Le(),o;e[0]!==t?(o=w=>{if(t)return Du(w.thread)},e[0]=t,e[1]=o):o=e[1];let i=P(o),s;e[2]!==t?(s=w=>{if(t)return Ou(w.thread)},e[2]=t,e[3]=s):s=e[3];let n=P(s),a=$e(zv),l;e:{if(!i||!n){l=null;break e}let w;e[4]!==i||e[5]!==n?(w={anchorId:i,targetId:n},e[4]=i,e[5]=n,e[6]=w):w=e[6],l=w}let c=l,d;e[7]!==t||e[8]!==a?(d=w=>t&&!!a&&Mu(a,w.thread.messages),e[7]=t,e[8]=a,e[9]=d):d=e[9];let h=P(d),u,p;e[10]!==r||e[11]!==a||e[12]!==h?(u=()=>{!a||h||r.getState().setTopAnchorTurn(null)},p=[r,a,h],e[10]=r,e[11]=a,e[12]=h,e[13]=u,e[14]=p):(u=e[13],p=e[14]),Ue(u,p);let m,g;e[15]!==c||e[16]!==r?(m=()=>{if(!c)return;let w=r.getState(),_=w.topAnchorTurn;_?.anchorId===c.anchorId&&_.targetId===c.targetId||w.setTopAnchorTurn(c)},g=[c,r],e[15]=c,e[16]=r,e[17]=m,e[18]=g):(m=e[17],g=e[18]),Ue(m,g)},Nu=re((t,e)=>{let r=v(18),o,i,s,n,a,l;r[0]!==t?({autoScroll:o,scrollToBottomOnRunStart:a,scrollToBottomOnInitialize:n,scrollToBottomOnThreadSwitch:l,children:i,...s}=t,r[0]=t,r[1]=o,r[2]=i,r[3]=s,r[4]=n,r[5]=a,r[6]=l):(o=r[1],i=r[2],s=r[3],n=r[4],a=r[5],l=r[6]);let c;r[7]!==o||r[8]!==n||r[9]!==a||r[10]!==l?(c={autoScroll:o,scrollToBottomOnRunStart:a,scrollToBottomOnInitialize:n,scrollToBottomOnThreadSwitch:l},r[7]=o,r[8]=n,r[9]=a,r[10]=l,r[11]=c):c=r[11];let d=Tu(c),h=$v(),u=Lv(),p=Le(),m;r[12]!==p?(m=p.getState(),r[12]=p,r[13]=m):m=r[13];let g=m.turnAnchor==="top";jv(g),Au(g);let w=je(e,d,h,u),_;return r[14]!==i||r[15]!==w||r[16]!==s?(_=(0,ds.jsx)(Se.div,{...s,ref:w,children:i}),r[14]=i,r[15]=w,r[16]=s,r[17]=_):_=r[17],_});Nu.displayName="ThreadPrimitive.ViewportScrollable";var na=re((t,e)=>{let r=v(13),o,i,s;r[0]!==t?({turnAnchor:s,topAnchorMessageClamp:i,...o}=t,r[0]=t,r[1]=o,r[2]=i,r[3]=s):(o=r[1],i=r[2],s=r[3]);let n;r[4]!==i||r[5]!==s?(n={turnAnchor:s,topAnchorMessageClamp:i},r[4]=i,r[5]=s,r[6]=n):n=r[6];let a;r[7]!==o||r[8]!==e?(a=(0,ds.jsx)(Nu,{...o,ref:e}),r[7]=o,r[8]=e,r[9]=a):a=r[9];let l;return r[10]!==n||r[11]!==a?(l=(0,ds.jsx)(Tr,{options:n,children:a}),r[10]=n,r[11]=a,r[12]=l):l=r[12],l});na.displayName="ThreadPrimitive.Viewport";function Fv(t){return t.registerViewport}function Vv(t){return t.clientHeight}function Uv(t){return t.registerViewportElement}function zv(t){return t.topAnchorTurn}var Bu=$("react/jsx-runtime");var aa=re((t,e)=>{let r=v(3),o=$e(qv),i=cs(o,Hv),s=je(e,i),n;return r[0]!==t||r[1]!==s?(n=(0,Bu.jsx)(Se.div,{...t,ref:s}),r[0]=t,r[1]=s,r[2]=n):n=r[2],n});aa.displayName="ThreadPrimitive.ViewportFooter";function qv(t){return t.registerContentInset}function Hv(t){let e=parseFloat(getComputedStyle(t).marginTop)||0;return t.offsetHeight+e}var Gv=t=>{let e=v(5),r;e[0]!==t?(r=t===void 0?{}:t,e[0]=t,e[1]=r):r=e[1];let{behavior:o}=r,i=$e(Wv),s=Le(),n;e[2]!==o||e[3]!==s?(n=()=>{s.getState().scrollToBottom({behavior:o})},e[2]=o,e[3]=s,e[4]=n):n=e[4];let a=n;return i?null:a},$u=is("ThreadPrimitive.ScrollToBottom",Gv,["behavior"]);function Wv(t){return t.isAtBottom}var Kv=t=>{let e=v(4),{prompt:r,send:o,clearComposer:i,autoSend:s}=t,n=o??s??!1,a;e[0]!==i||e[1]!==r||e[2]!==n?(a={prompt:r,send:n,clearComposer:i},e[0]=i,e[1]=r,e[2]=n,e[3]=a):a=e[3];let{disabled:l,trigger:c}=Bn(a);return l?null:c},Lu=is("ThreadPrimitive.Suggestion",Kv,["prompt","send","clearComposer","autoSend","method"]);var Er=rs({Empty:()=>oa,If:()=>ia,MessageByIndex:()=>no,Messages:()=>Ui,Root:()=>ra,ScrollToBottom:()=>$u,Suggestion:()=>Lu,SuggestionByIndex:()=>mo,Suggestions:()=>Ji,Unstable_MessageById:()=>ao,Viewport:()=>na,ViewportFooter:()=>aa,ViewportProvider:()=>Tr});var la=[{id:"allow-once",kind:"allow-once",label:"Allow once"},{id:"reject-once",kind:"reject-once",label:"Reject"}];function Fu(t){let e=t.reason===void 0||t.reason===""?`${t.toolName} needs approval`:t.reason;return{id:t.id,prompt:e,display:"decision",options:la.map(r=>({...r}))}}function Vu(t){if(t.optionId!==void 0){let e=la.find(r=>r.id===t.optionId);if(e===void 0)throw new Error(`unknown approval option ${JSON.stringify(t.optionId)} \u2014 this dashboard offers ${la.map(r=>r.id).join(", ")}`);return e.kind==="allow-once"?"allowed-once":"rejected"}if(t.approved===void 0)throw new Error("approval response carried neither an optionId nor an approved flag");return t.approved?"allowed-once":"rejected"}function Uu(t){if(t==="unavailable")return"expired";if(t==="cancelled")return"cancelled"}function zu(t){if(!t.ok)throw new Error(t.error.message)}var xo={"review-risky":{label:"Review at risky steps",detail:"Reads never interrupt. A write is reviewed when the loop has no confidence to judge it.",policies:{read:"auto",glob:"auto",grep:"auto",edit:"auto-if-confident",write:"auto-if-confident",bash:"auto-if-confident"}},"approve-every-step":{label:"Approve every step",detail:"Every write, edit and shell command waits for you. Nothing changes without a click.",policies:{read:"auto",glob:"auto",grep:"auto",edit:"always-approve",write:"always-approve",bash:"always-approve"}}};function qu(t){let e=ju.filter(o=>o!=="read"&&o!=="glob"&&o!=="grep"&&t?.[o]==="always-approve").length,r=ju.filter(o=>o!=="read"&&o!=="glob"&&o!=="grep");return e===r.length?"approve-every-step":"review-risky"}var ju=["read","glob","grep","edit","write","bash"];var Jv={"allowed once":"allowed-once",rejected:"rejected",cancelled:"cancelled",expired:"unavailable"};function Hu(t){let e=new Map;for(let r of t){if(r.text===void 0||typeof r.text!="string")continue;let o=/^(allowed once|rejected|cancelled|expired): .+ \[([0-9a-f-]{36})\]$/.exec(r.text);if(o===null)continue;let i=Jv[o[1]];i!==void 0&&e.set(o[2],i)}return e}var b=$("react/jsx-runtime");function Gu(t,e){let r=Fu({id:t.id,toolName:t.toolName,...t.callId===void 0?{}:{callId:t.callId},...t.reason===void 0?{}:{reason:t.reason},...t.runId===void 0?{}:{runId:t.runId},askedAt:t.askedAt});if(e!==void 0){let o=Uu(e);o!==void 0?r.resolution=o:r.approved=e==="allowed-once"}return{id:`ask-${t.id}`,role:"assistant",createdAt:new Date(t.askedAt),content:[{type:"tool-call",toolCallId:t.id,toolName:t.toolName,args:{},argsText:"{}",approval:r}]}}function Yv(t){let[e,r]=(0,K.useState)(void 0);return(0,K.useEffect)(()=>{let o=!0;return t.status===void 0?()=>{}:(t.status().then(i=>{let s=i.config?.dashboard;o&&r(s?.brief?.enabled===!0)}).catch(()=>{}),()=>{o=!1})},[t]),e}function Wu(t,e,r=Date.now()){return{id:t,role:"user",createdAt:new Date(r),content:[{type:"text",text:e}]}}async function Xv(t,e){let r=Vu(e),o=e.feedback?.trim()??"";await t.respond(e.approvalId,r,o)}function Zv({node:t}){return t.kind==="heading"?(0,b.jsx)("h3",{className:"brief-heading",children:t.text}):t.kind==="list"?(0,b.jsx)("ul",{className:"brief-list",children:t.items.map((e,r)=>(0,b.jsx)("li",{children:e},r))}):t.kind==="code"?(0,b.jsx)("pre",{className:"brief-code","data-language":t.language,children:t.code}):(0,b.jsx)("p",{className:"brief-para",children:t.text})}function eb({ask:t,briefsOn:e}){return t.briefState==="none"||!e?null:t.briefState==="failed"?(0,b.jsx)("div",{className:"brief-note error",children:"Review brief unavailable \u2014 the approval itself is unaffected."}):t.briefState==="pending"?(0,b.jsx)("div",{className:"brief-note",children:"Writing review brief\u2026"}):(0,b.jsx)("div",{className:"brief",children:(t.brief??[]).map((r,o)=>(0,b.jsx)(Zv,{node:r},o))})}function tb(t){return new Date(t).toLocaleTimeString()}var Ku=K.default.createContext({text:"",setText:()=>{},clear:()=>{},commitLocal:()=>{}});function Ju(){return K.default.useContext(Ku)}var Qu;function rb(t){let[e,r]=(0,K.useState)(null),[o,i]=(0,K.useState)(!1),s=er.get(t.toolCallId),n=t.approval,a=n?.options??[],l=Ju(),c=(0,K.useCallback)(u=>{i(!0),r(null),t.respondToApproval({optionId:u}).catch(p=>{r(p instanceof Error?p.message:String(p))}).finally(()=>i(!1))},[t]),d=n?.approved!==void 0||n?.resolution!==void 0,h=l.text.trim();return(0,b.jsxs)("div",{className:"card","aria-busy":o,children:[(0,b.jsxs)("div",{className:"card-top",children:[(0,b.jsx)("span",{className:"eyebrow",children:"Approval required"}),s!==void 0&&(0,b.jsxs)("span",{className:"asked",children:["asked ",tb(s.askedAt)]})]}),(0,b.jsx)("div",{className:"tool",children:t.toolName}),s!==void 0&&(0,b.jsxs)("div",{className:"meta",children:[(0,b.jsx)("span",{className:"meta-k",children:"run"}),(0,b.jsx)("span",{className:"meta-v",children:s.runId??"agentless"}),s.callId!==void 0&&(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("span",{className:"meta-k",children:"call"}),(0,b.jsx)("span",{className:"meta-v",children:s.callId})]})]}),n?.prompt!==void 0&&(0,b.jsx)("div",{className:"reason",children:n.prompt}),s!==void 0&&(0,b.jsx)(eb,{ask:s,briefsOn:Qu}),n?.resolution!==void 0&&(0,b.jsx)("div",{className:"brief-note settled",children:n.resolution==="expired"?"Expired \u2014 no answer in time.":"Cancelled \u2014 the ask was withdrawn."}),!d&&(0,b.jsxs)("div",{className:"row actions",children:[a.map(u=>(0,b.jsx)("button",{type:"button",className:u.kind==="allow-once"?"allow":"reject",disabled:o,"aria-busy":o,onClick:()=>c(u.id),children:u.label},u.id)),o&&(0,b.jsx)("span",{className:"busy-note",children:"Submitting\u2026"})]}),!d&&h!==""&&(0,b.jsxs)("div",{className:"feedback-preview","aria-live":"polite",children:["Feedback will be sent with your decision: ",(0,b.jsx)("em",{children:h})]}),e!==null&&(0,b.jsx)("div",{className:"brief-note error",role:"alert",children:e})]})}var er=new Map,ob=Math.round(15e3/3);function ib(t){let[e,r]=(0,K.useState)(()=>window.__FL_DASHBOARD_SNAPSHOT__??null);return(0,K.useEffect)(()=>{let o=!0,i=()=>{t.load().then(a=>{o&&r(a)}).catch(()=>{})};i();let s=t.onChange?.(i)??(()=>{}),n=setInterval(i,ob);return()=>{o=!1,clearInterval(n),s()}},[t]),e}function sb(t){(0,K.useEffect)(()=>{let e=document.getElementById("pending-count");e!==null&&(e.textContent=t===0?"idle":`${String(t)} pending`,e.setAttribute("data-count",String(t)))},[t])}function nb({disabled:t}){let e=Ju();return(0,b.jsx)("form",{className:"hitl-composer-root",onSubmit:o=>{o.preventDefault(),!(t||e.text.trim()==="")&&e.commitLocal()},children:(0,b.jsxs)("div",{className:`hitl-composer-shell${t?" is-disabled":""}`,children:[(0,b.jsx)("textarea",{className:"hitl-composer-input",placeholder:t?"No pending approval \u2014 waiting for the next gate\u2026":"Add response or feedback, then Allow once / Reject \u2014 or send to post feedback into the thread\u2026",rows:2,"aria-label":"Approval response and feedback",disabled:t,value:e.text,onChange:o=>e.setText(o.target.value),onKeyDown:o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),!t&&e.text.trim()!==""&&e.commitLocal())}}),(0,b.jsxs)("div",{className:"hitl-composer-actions",children:[(0,b.jsx)("span",{className:"hitl-composer-hint",children:t?"Composer idle":"Enter posts feedback \xB7 Shift+Enter newline \xB7 buttons decide"}),(0,b.jsx)("button",{type:"submit",className:"hitl-composer-send",disabled:t||e.text.trim()==="","aria-label":"Send feedback",children:(0,b.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none","aria-hidden":"true",children:(0,b.jsx)("path",{d:"M12 19V5M12 5l-6 6M12 5l6 6",stroke:"currentColor",strokeWidth:"2.2",strokeLinecap:"round",strokeLinejoin:"round"})})})]})]})})}function ab(){return(0,b.jsx)(Cr.Root,{className:"hitl-user-msg","data-role":"user",children:(0,b.jsx)("div",{className:"hitl-user-bubble",children:(0,b.jsx)(Cr.Parts,{})})})}function lb(){return(0,b.jsx)(Cr.Root,{className:"hitl-assistant-msg","data-role":"assistant",children:(0,b.jsx)(Cr.Parts,{components:{tools:{Override:rb}}})})}function cb({pending:t,feed:e,source:r,briefsOn:o}){for(let _ of t)er.set(_.id,_);let i=new Set(t.map(_=>_.id));Qu=o;let s=(0,K.useMemo)(()=>{let _=[];for(let T of e){if(T.kind!=="approval")continue;let I=/^(allowed once|rejected|cancelled|expired): ([\w./-]+)(?: — (.*?))? \[([0-9a-f-]{36})\]$/.exec(T.text);if(I===null)continue;let[,,k,E,R]=I;if(i.has(R))continue;let y=er.get(R);_.push({id:R,toolName:y?.toolName??k,...E===void 0?{}:{reason:`${k}: ${E}`},...y?.runId===void 0?{}:{runId:y.runId},askedAt:T.t})}let x=_.slice(-12);for(let T of x){let I={id:T.id,toolName:T.toolName,...T.callId===void 0?{}:{callId:T.callId},...T.reason===void 0?{}:{reason:T.reason},...T.runId===void 0?{}:{runId:T.runId},askedAt:T.askedAt,briefState:"none"};er.has(T.id)||er.set(T.id,I)}for(let T of[...er.keys()])!i.has(T)&&!x.some(I=>I.id===T)&&er.delete(T);return x},[e,i]),[n,a]=(0,K.useState)([]),[l,c]=(0,K.useState)(""),d=(0,K.useRef)(l);d.current=l;let[h,u]=(0,K.useState)(()=>new Map);(0,K.useEffect)(()=>{let _=Hu(e);_.size!==0&&u(x=>{let T=new Map;for(let[I,k]of _)T.set(I,k);return T.size===x.size&&[...T].every(([I,k])=>x.get(I)===k)?x:T})},[e]);let p=(0,K.useMemo)(()=>[...[...t.map(x=>Gu(x,h.get(x.id))),...s.map(x=>Gu(x,h.get(x.id)))],...n].slice(-48),[t,s,n,h]),m=(0,K.useCallback)(()=>{let _=d.current.trim();_!==""&&a(x=>[...x,Wu(`feedback-${String(Date.now())}`,_)])},[]),g=(0,K.useMemo)(()=>({text:l,setText:c,clear:()=>{c(""),d.current=""},commitLocal:m}),[l,m]),w=so({messages:p,isRunning:!1,convertMessage:_=>_,onNew:async()=>{},onRespondToToolApproval:async _=>{let x=d.current.trim();await Xv(r,{..._,approvalId:_.approvalId,...x===""?{}:{feedback:x}}),x!==""&&a(T=>{let I=T[T.length-1];return I!==void 0&&I.role==="user"&&Array.isArray(I.content)&&I.content.some(E=>typeof E=="object"&&E!==null&&"text"in E&&E.text===x)?T:[...T,Wu(`feedback-${String(Date.now())}`,x)]}),c(""),d.current=""}});return(0,b.jsx)(Ku.Provider,{value:g,children:(0,b.jsx)(Fn,{runtime:w,children:(0,b.jsx)(Er.Root,{className:"hitl-thread-root",style:{"--thread-max-width":"44rem"},children:(0,b.jsxs)(Er.Viewport,{className:"hitl-thread-viewport",turnAnchor:"top",children:[t.length===0&&n.length===0?(0,b.jsxs)("div",{className:"empty empty-plate hitl-welcome",children:[(0,b.jsx)("p",{className:"empty-title",children:"No pending approval requests."}),(0,b.jsx)("p",{className:"hint",children:"When a run reaches a review gate, the ask appears in this thread. Use the composer for response/feedback, then Allow once or Reject."})]}):null,(0,b.jsx)(Er.Messages,{components:{UserMessage:ab,AssistantMessage:lb}}),(0,b.jsx)(Er.ViewportFooter,{className:"hitl-thread-footer",children:(0,b.jsx)(nb,{disabled:t.length===0})})]})})})})}function db(t){return t>=.9?"bad":t>=.7?"warn":"ok"}function ca({value:t,max:e,label:r,className:o}){if(!(e>0)||!Number.isFinite(t)||!Number.isFinite(e))return null;let i=Math.max(0,Math.min(1,t/e)),s=db(i),n=Math.round(i*1e3)/10;return(0,b.jsx)("div",{className:`meter ${s}${o?` ${o}`:""}`,role:"progressbar","aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":Math.round(i*100),"aria-label":r,children:(0,b.jsx)("i",{style:{width:`${n}%`}})})}function ub(t){return t==="critical"?"tag tag-bad sig-tag":t==="warning"?"tag tag-warn sig-tag":t==="info"||t==="notice"?"tag tag-cyan sig-tag":"tag tag-ghost sig-tag"}function pb(t){return t==="approval"?"tag tag-warn feed-k":t==="gate"?"tag tag-bad feed-k":t==="judge"?"tag tag-ok feed-k":t==="signals"?"tag tag-cyan feed-k":t==="route"||t==="step"?"tag tag-accent feed-k":"tag tag-ghost feed-k"}var yo="Ungrouped";function da(t){return t.length<=12?t:`${t.slice(0,8)}\u2026`}function Yu(t){let e=new Map;for(let o of t){let i=o.workspaceLabel?.trim()||yo,s=o.cwd&&o.cwd!==""?o.cwd:i,n=e.get(s);n===void 0&&(n={key:s,label:i,...o.cwd===void 0||o.cwd===""?{}:{cwd:o.cwd},sessions:[]},e.set(s,n)),n.sessions.push(o)}let r=[...e.values()];for(let o of r)o.sessions.sort((i,s)=>(s.updatedAt??0)-(i.updatedAt??0));return r.sort((o,i)=>o.label===yo&&i.label!==yo?1:i.label===yo&&o.label!==yo?-1:o.label.localeCompare(i.label)),r}function mb({snapshot:t,filter:e,onSelect:r}){let o=(0,K.useMemo)(()=>{let a=new Map;for(let l of t.pending)l.runId===void 0||l.runId===""||a.set(l.runId,(a.get(l.runId)??0)+1);return a},[t.pending]),i=(0,K.useMemo)(()=>Yu(t.runs),[t.runs]),[s,n]=(0,K.useState)({});return(0,K.useEffect)(()=>{n(a=>{let l={...a};for(let c of i){let d=c.sessions.some(u=>(o.get(u.runId)??0)>0),h=e!=="all"&&c.sessions.some(u=>u.runId===e);(d||h||l[c.key]===void 0)&&(l[c.key]=!1)}return l})},[i,e,o]),t.runs.length===0?(0,b.jsxs)("section",{id:"workspaces","aria-label":"Workspaces",children:[(0,b.jsxs)("div",{className:"section-head",children:[(0,b.jsx)("h2",{children:"Workspaces"}),(0,b.jsx)("span",{className:"section-count",children:"0"})]}),(0,b.jsx)("p",{className:"empty",children:"No live sessions yet."})]}):(0,b.jsxs)("section",{id:"workspaces","aria-label":"Workspaces",children:[(0,b.jsxs)("div",{className:"section-head",children:[(0,b.jsx)("h2",{children:"Workspaces"}),(0,b.jsx)("span",{className:"section-count",children:i.length})]}),(0,b.jsxs)("div",{className:"ws-tree scroll-beauty",role:"tree",children:[(0,b.jsxs)("button",{type:"button",className:`ws-all${e==="all"?" is-active":""}`,role:"treeitem","aria-current":e==="all"?"true":void 0,onClick:()=>r("all"),children:["All sessions",(0,b.jsx)("span",{className:"tag tag-ghost",children:t.runs.length})]}),i.map(a=>{let l=s[a.key]===!0,c=a.sessions.reduce((d,h)=>d+(o.get(h.runId)??0),0);return(0,b.jsxs)("div",{className:"ws-group",role:"group",children:[(0,b.jsxs)("button",{type:"button",className:"ws-group-head","aria-expanded":!l,onClick:()=>n(d=>({...d,[a.key]:!l})),title:a.cwd??a.label,children:[(0,b.jsx)("span",{className:"ws-chevron","aria-hidden":"true",children:l?"\u25B8":"\u25BE"}),(0,b.jsx)("span",{className:"ws-group-label",children:a.label}),(0,b.jsx)("span",{className:"tag tag-ghost",children:a.sessions.length}),c>0&&(0,b.jsx)("span",{className:"tag tag-warn",children:c})]}),!l&&(0,b.jsx)("ul",{className:"ws-sessions",children:a.sessions.map(d=>{let h=o.get(d.runId)??0,u=e===d.runId,p=d.label??d.sessionId??d.runId;return(0,b.jsx)("li",{children:(0,b.jsxs)("button",{type:"button",className:`ws-session${u?" is-active":""}${h>0?" is-pending":""}`,role:"treeitem","aria-current":u?"true":void 0,title:`${p}
${d.runId}${d.cwd===void 0?"":`
${d.cwd}`}`,onClick:()=>r(d.runId),children:[(0,b.jsx)("span",{className:"ws-session-id mono",children:da(p)}),d.step!==void 0&&(0,b.jsxs)("span",{className:"tag tag-ghost",children:["s",d.step]}),h>0&&(0,b.jsx)("span",{className:"tag tag-warn",children:h})]})},d.runId)})})]},a.key)})]})]})}function hb({run:t}){return(0,b.jsxs)("div",{className:"run-card",children:[(0,b.jsxs)("div",{className:"run-grid",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("div",{className:"k",children:"run"}),(0,b.jsx)("div",{className:"v mono",title:t.runId,children:da(t.sessionId??t.runId)})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("div",{className:"k",children:"steps"}),(0,b.jsxs)("div",{className:"v",children:[t.step??"\u2014",t.maxSteps===void 0?"":` / ${t.maxSteps}`]}),t.step!==void 0&&t.maxSteps!==void 0&&(0,b.jsx)(ca,{value:t.step,max:t.maxSteps,label:`Step ${t.step} of ${t.maxSteps}`})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("div",{className:"k",children:"spend"}),(0,b.jsxs)("div",{className:"v",children:[t.spentUSD===void 0?"\u2014":`$${t.spentUSD.toFixed(4)}`,t.budgetUSD===void 0?"":` / $${t.budgetUSD.toFixed(2)}`]}),t.spentUSD!==void 0&&t.budgetUSD!==void 0&&(0,b.jsx)(ca,{value:t.spentUSD,max:t.budgetUSD,label:`Spend $${t.spentUSD.toFixed(4)} of $${t.budgetUSD.toFixed(2)}`})]}),t.route!==void 0&&(0,b.jsxs)("div",{children:[(0,b.jsx)("div",{className:"k",children:"route"}),(0,b.jsx)("div",{className:"v",children:(0,b.jsx)("span",{className:"tag tag-accent",title:t.route,children:t.route})})]}),t.judgeScore!==void 0&&(0,b.jsxs)("div",{children:[(0,b.jsx)("div",{className:"k",children:"judge"}),(0,b.jsx)("div",{className:"v",children:(0,b.jsxs)("span",{className:`tag ${t.judgeScore>=2?"tag-ok":t.judgeScore>=1?"tag-warn":"tag-bad"}`,children:[t.judgeScore," / 3"]})}),(0,b.jsx)(ca,{value:t.judgeScore,max:3,label:`Judge score ${t.judgeScore} of 3`,className:"accent"})]})]}),(t.signals??[]).map((e,r)=>(0,b.jsxs)("div",{className:`sig ${e.severity}`,children:[(0,b.jsx)("span",{className:ub(e.severity),children:e.severity}),(0,b.jsx)("span",{className:"tag tag-ghost",children:e.kind}),(0,b.jsxs)("span",{children:["@ step ",e.step," \u2014 ",e.detail]})]},r))]})}function fb({snapshot:t,filter:e}){let r=e==="all"?t.runs:t.runs.filter(i=>i.runId===e),o=(0,K.useMemo)(()=>Yu(r),[r]);return(0,b.jsxs)("section",{id:"run-state",className:"pane pane-runs",children:[(0,b.jsxs)("div",{className:"section-head pane-head",children:[(0,b.jsx)("h2",{children:"Runs"}),(0,b.jsx)("span",{className:"section-count",children:r.length}),e!=="all"&&(0,b.jsx)("span",{className:"tag tag-accent",title:e,children:da(e)})]}),(0,b.jsx)("div",{className:"pane-scroll scroll-beauty",children:r.length===0?(0,b.jsx)("p",{className:"empty",children:e==="all"?"No run has reported yet.":"No run state for this session."}):o.map(i=>(0,b.jsxs)("div",{className:"run-group",children:[(0,b.jsxs)("div",{className:"run-group-head",title:i.cwd??i.label,children:[(0,b.jsx)("span",{className:"run-group-label",children:i.label}),(0,b.jsx)("span",{className:"tag tag-ghost",children:i.sessions.length})]}),(0,b.jsx)("div",{className:"run-group-body",children:i.sessions.map(s=>(0,b.jsx)(hb,{run:s},s.runId))})]},i.key))})]})}function gb({snapshot:t,filter:e}){let r=e==="all"?t.feed:t.feed.filter(o=>o.runId===e);return(0,b.jsxs)("section",{id:"activity",className:"pane pane-activity",children:[(0,b.jsxs)("div",{className:"section-head pane-head",children:[(0,b.jsx)("h2",{children:"Activity"}),(0,b.jsx)("span",{className:"section-count",children:r.length})]}),(0,b.jsx)("div",{className:"pane-scroll scroll-beauty",children:r.length===0?(0,b.jsx)("p",{className:"empty",children:e==="all"?"No activity yet.":"No activity for this session."}):(0,b.jsx)("ul",{className:"feed",children:[...r].reverse().map((o,i)=>(0,b.jsxs)("li",{className:"feed-item",children:[(0,b.jsx)("span",{className:"feed-t t",children:new Date(o.t).toLocaleTimeString()}),(0,b.jsx)("span",{className:pb(o.kind),children:o.kind}),(0,b.jsx)("span",{className:"feed-text text",children:o.text})]},`${String(o.t)}-${String(i)}`))})})]})}function Xu({source:t}){let e=ib(t),r=Yv(t),[o,i]=(0,K.useState)("all");return sb(e?.pending.length??0),(0,K.useEffect)(()=>{o==="all"||e===null||e.runs.some(s=>s.runId===o)||i("all")},[e,o]),e===null?(0,b.jsx)("p",{className:"empty",children:"Loading\u2026"}):(0,b.jsxs)("div",{className:"dashboard-shell",children:[(0,b.jsxs)("aside",{className:"sidebar","aria-label":"Workspaces and activity",children:[(0,b.jsx)("div",{className:"sidebar-top",children:(0,b.jsx)(mb,{snapshot:e,filter:o,onSelect:i})}),(0,b.jsx)(gb,{snapshot:e,filter:o})]}),(0,b.jsxs)("section",{className:"stage",id:"approvals","aria-label":"Approvals thread",children:[(0,b.jsxs)("div",{className:"section-head",children:[(0,b.jsx)("h2",{children:"Approval thread"}),(0,b.jsx)("span",{className:`section-count${e.pending.length>0?" hot":""}`,children:e.pending.length})]}),(0,b.jsx)(cb,{pending:e.pending,feed:e.feed,source:t,briefsOn:r})]}),(0,b.jsx)("aside",{className:"rail","aria-label":"Grouped runs",children:(0,b.jsx)(fb,{snapshot:e,filter:o})})]})}function Zu(t,e){let r=e.find(o=>(o.retainedBy.mainView??0)>0);if(r!==void 0)return t.find(o=>o.sessionIds.includes(r.id))?.id}function ep(t,e,r,o){if(t.length===0)return{target:void 0,ambiguous:!1,blocked:"no-workspace",note:"No workspace is registered yet \u2014 open a project folder, then start the loop."};let i=new Map(t.map(l=>[l.id,l])),s=(r!==void 0?i.get(r):void 0)??(e!==void 0?i.get(e):void 0)??(t.length===1?t[0]:void 0),n=t.length>1;if(s===void 0)return{target:void 0,ambiguous:n,blocked:"choose-workspace",note:"Pick the workspace to run in \u2014 a loop writes files, so it is never guessed."};let a=o.trim()==="";return{target:s,ambiguous:n,blocked:a?"empty-task":void 0,note:`Runs in \u201C${s.title}\u201D \u2014 ${s.path}`}}var tp=`/*! tailwindcss v4.1.18 | MIT License | https://tailwindcss.com */
@layer properties;
@property --tw-animation-delay {
  syntax: "*";
  inherits: false;
  initial-value: 0s;
}
@property --tw-animation-direction {
  syntax: "*";
  inherits: false;
  initial-value: normal;
}
@property --tw-animation-duration {
  syntax: "*";
  inherits: false;
}
@property --tw-animation-fill-mode {
  syntax: "*";
  inherits: false;
  initial-value: none;
}
@property --tw-animation-iteration-count {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-enter-blur {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-enter-opacity {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-enter-rotate {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-enter-scale {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-enter-translate-x {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-enter-translate-y {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-exit-blur {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-exit-opacity {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-exit-rotate {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-exit-scale {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-exit-translate-x {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-exit-translate-y {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --shimmer-track-height {
  syntax: '<length>';
  inherits: true;
  initial-value: 200px;
}
@property --shimmer-angle {
  syntax: '<angle>';
  inherits: true;
  initial-value: 15deg;
}
@layer theme;
@layer base {
  :where(.aui-thread-root, .aui-modal-content) *, :where(.aui-thread-root, .aui-modal-content) ::after, :where(.aui-thread-root, .aui-modal-content) ::before, :where(.aui-thread-root, .aui-modal-content) ::backdrop, :where(.aui-thread-root, .aui-modal-content) ::file-selector-button {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
  }
  :where(.aui-thread-root, .aui-modal-content) html, :where(.aui-thread-root, .aui-modal-content) :host {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    tab-size: 4;
    font-family: var(--default-font-family, ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji');
    font-feature-settings: var(--default-font-feature-settings, normal);
    font-variation-settings: var(--default-font-variation-settings, normal);
    -webkit-tap-highlight-color: transparent;
  }
  :where(.aui-thread-root, .aui-modal-content) hr {
    height: 0;
    color: inherit;
    border-top-width: 1px;
  }
  :where(.aui-thread-root, .aui-modal-content) abbr:where([title]) {
    -webkit-text-decoration: underline dotted;
    text-decoration: underline dotted;
  }
  :where(.aui-thread-root, .aui-modal-content) h1, :where(.aui-thread-root, .aui-modal-content) h2, :where(.aui-thread-root, .aui-modal-content) h3, :where(.aui-thread-root, .aui-modal-content) h4, :where(.aui-thread-root, .aui-modal-content) h5, :where(.aui-thread-root, .aui-modal-content) h6 {
    font-size: inherit;
    font-weight: inherit;
  }
  :where(.aui-thread-root, .aui-modal-content) a {
    color: inherit;
    -webkit-text-decoration: inherit;
    text-decoration: inherit;
  }
  :where(.aui-thread-root, .aui-modal-content) b, :where(.aui-thread-root, .aui-modal-content) strong {
    font-weight: bolder;
  }
  :where(.aui-thread-root, .aui-modal-content) code, :where(.aui-thread-root, .aui-modal-content) kbd, :where(.aui-thread-root, .aui-modal-content) samp, :where(.aui-thread-root, .aui-modal-content) pre {
    font-family: var(--default-mono-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace);
    font-feature-settings: var(--default-mono-font-feature-settings, normal);
    font-variation-settings: var(--default-mono-font-variation-settings, normal);
    font-size: 1em;
  }
  :where(.aui-thread-root, .aui-modal-content) small {
    font-size: 80%;
  }
  :where(.aui-thread-root, .aui-modal-content) sub, :where(.aui-thread-root, .aui-modal-content) sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }
  :where(.aui-thread-root, .aui-modal-content) sub {
    bottom: -0.25em;
  }
  :where(.aui-thread-root, .aui-modal-content) sup {
    top: -0.5em;
  }
  :where(.aui-thread-root, .aui-modal-content) table {
    text-indent: 0;
    border-color: inherit;
    border-collapse: collapse;
  }
  :where(.aui-thread-root, .aui-modal-content) :-moz-focusring {
    outline: auto;
  }
  :where(.aui-thread-root, .aui-modal-content) progress {
    vertical-align: baseline;
  }
  :where(.aui-thread-root, .aui-modal-content) summary {
    display: list-item;
  }
  :where(.aui-thread-root, .aui-modal-content) ol, :where(.aui-thread-root, .aui-modal-content) ul, :where(.aui-thread-root, .aui-modal-content) menu {
    list-style: none;
  }
  :where(.aui-thread-root, .aui-modal-content) img, :where(.aui-thread-root, .aui-modal-content) svg, :where(.aui-thread-root, .aui-modal-content) video, :where(.aui-thread-root, .aui-modal-content) canvas, :where(.aui-thread-root, .aui-modal-content) audio, :where(.aui-thread-root, .aui-modal-content) iframe, :where(.aui-thread-root, .aui-modal-content) embed, :where(.aui-thread-root, .aui-modal-content) object {
    display: block;
    vertical-align: middle;
  }
  :where(.aui-thread-root, .aui-modal-content) img, :where(.aui-thread-root, .aui-modal-content) video {
    max-width: 100%;
    height: auto;
  }
  :where(.aui-thread-root, .aui-modal-content) button, :where(.aui-thread-root, .aui-modal-content) input, :where(.aui-thread-root, .aui-modal-content) select, :where(.aui-thread-root, .aui-modal-content) optgroup, :where(.aui-thread-root, .aui-modal-content) textarea, :where(.aui-thread-root, .aui-modal-content) ::file-selector-button {
    font: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    letter-spacing: inherit;
    color: inherit;
    border-radius: 0;
    background-color: transparent;
    opacity: 1;
  }
  :where(.aui-thread-root, .aui-modal-content) :where(select:is([multiple], [size])) optgroup {
    font-weight: bolder;
  }
  :where(.aui-thread-root, .aui-modal-content) :where(select:is([multiple], [size])) optgroup option {
    padding-inline-start: 20px;
  }
  :where(.aui-thread-root, .aui-modal-content) ::file-selector-button {
    margin-inline-end: 4px;
  }
  :where(.aui-thread-root, .aui-modal-content) ::placeholder {
    opacity: 1;
  }
  @supports (not (-webkit-appearance: -apple-pay-button))  or (contain-intrinsic-size: 1px) {
    :where(.aui-thread-root, .aui-modal-content) ::placeholder {
      color: currentcolor;
    }
    @supports (color: color-mix(in lab, red, red)) {
      :where(.aui-thread-root, .aui-modal-content) ::placeholder {
        color: color-mix(in oklab, currentcolor 50%, transparent);
      }
    }
  }
  :where(.aui-thread-root, .aui-modal-content) textarea {
    resize: vertical;
  }
  :where(.aui-thread-root, .aui-modal-content) ::-webkit-search-decoration {
    -webkit-appearance: none;
  }
  :where(.aui-thread-root, .aui-modal-content) ::-webkit-date-and-time-value {
    min-height: 1lh;
    text-align: inherit;
  }
  :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit {
    display: inline-flex;
  }
  :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }
  :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit, :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit-year-field, :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit-month-field, :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit-day-field, :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit-hour-field, :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit-minute-field, :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit-second-field, :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit-millisecond-field, :where(.aui-thread-root, .aui-modal-content) ::-webkit-datetime-edit-meridiem-field {
    padding-block: 0;
  }
  :where(.aui-thread-root, .aui-modal-content) ::-webkit-calendar-picker-indicator {
    line-height: 1;
  }
  :where(.aui-thread-root, .aui-modal-content) :-moz-ui-invalid {
    box-shadow: none;
  }
  :where(.aui-thread-root, .aui-modal-content) button, :where(.aui-thread-root, .aui-modal-content) input:where([type='button'], [type='reset'], [type='submit']), :where(.aui-thread-root, .aui-modal-content) ::file-selector-button {
    appearance: button;
  }
  :where(.aui-thread-root, .aui-modal-content) ::-webkit-inner-spin-button, :where(.aui-thread-root, .aui-modal-content) ::-webkit-outer-spin-button {
    height: auto;
  }
  :where(.aui-thread-root, .aui-modal-content) [hidden]:where(:not([hidden='until-found'])) {
    display: none !important;
  }
}
:where(.aui-thread-root, .aui-modal-content) :where(.aui-thread-root, .aui-modal-content) :root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 10% 3.9%;
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
  --sidebar: 0 0% 100%;
  --sidebar-foreground: 240 10% 3.9%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 240 5.9% 90%;
  --sidebar-ring: 240 10% 3.9%;
  --radius: 0.5rem;
}
:where(.aui-thread-root, .aui-modal-content) .dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
  --sidebar: 240 10% 3.9%;
  --sidebar-foreground: 0 0% 98%;
  --sidebar-primary: 220 70% 50%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 3.7% 15.9%;
  --sidebar-accent-foreground: 0 0% 98%;
  --sidebar-border: 240 3.7% 15.9%;
  --sidebar-ring: 240 4.9% 83.9%;
}
:where(.aui-thread-root, .aui-modal-content) :where(.aui-thread-root, .aui-modal-content) {
  color: var(--color-foreground);
}
:where(.aui-thread-root, .aui-modal-content) :where(.aui-thread-root, .aui-modal-content) * {
  border-color: var(--color-border);
  outline-color: color-mix(in srgb, hsl(var(--ring)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  :where(.aui-thread-root, .aui-modal-content) :where(.aui-thread-root, .aui-modal-content) * {
    outline-color: color-mix(in oklab, var(--color-ring) 50%, transparent);
  }
}
.aui-accordion-content {
  overflow: hidden;
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
}
.aui-accordion-content[data-state="closed"] {
  animation: accordion-up var(--tw-animation-duration,var(--tw-duration,.2s))var(--tw-ease,ease-out)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-accordion-content[data-state="open"] {
  animation: accordion-down var(--tw-animation-duration,var(--tw-duration,.2s))var(--tw-ease,ease-out)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-accordion-content:is(:where(.group\\/accordion)[data-variant="default"] *) {
  padding-bottom: calc(var(--spacing) * 4);
}
.aui-accordion-content:is(:where(.group\\/accordion)[data-variant="outline"] *) {
  border-top-style: var(--tw-border-style);
  border-top-width: 1px;
}
.aui-accordion-content:is(:where(.group\\/accordion)[data-variant="outline"] *) {
  padding-inline: calc(var(--spacing) * 4);
}
.aui-accordion-content:is(:where(.group\\/accordion)[data-variant="outline"] *) {
  padding-block: calc(var(--spacing) * 3);
}
.aui-accordion-content:is(:where(.group\\/accordion)[data-variant="ghost"] *) {
  padding-inline: calc(var(--spacing) * 4);
}
.aui-accordion-content:is(:where(.group\\/accordion)[data-variant="ghost"] *) {
  padding-block: calc(var(--spacing) * 3);
}
.aui-accordion-item:is(:where(.group\\/accordion)[data-variant="default"] *) {
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 1px;
}
.aui-accordion-item:is(:where(.group\\/accordion)[data-variant="default"] *):last-child {
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 0px;
}
.aui-accordion-item:is(:where(.group\\/accordion)[data-variant="outline"] *) {
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 1px;
}
.aui-accordion-item:is(:where(.group\\/accordion)[data-variant="outline"] *):last-child {
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 0px;
}
.aui-accordion-item:is(:where(.group\\/accordion)[data-variant="ghost"] *) {
  border-radius: var(--radius-lg);
}
.aui-accordion-item:is(:where(.group\\/accordion)[data-variant="ghost"] *)[data-state="open"] {
  background-color: color-mix(in srgb, hsl(var(--muted)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-accordion-item:is(:where(.group\\/accordion)[data-variant="ghost"] *)[data-state="open"] {
    background-color: color-mix(in oklab, var(--color-muted) 50%, transparent);
  }
}
.aui-accordion-item {
  display: flex;
}
.aui-accordion-trigger {
  display: flex;
  width: 100%;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--spacing) * 4);
  text-align: left;
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
  transition-property: all;
  --tw-outline-style: none;
  outline-style: none;
}
.aui-accordion-trigger:disabled {
  pointer-events: none;
}
.aui-accordion-trigger:disabled {
  opacity: 50%;
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="default"] *) {
  padding-block: calc(var(--spacing) * 4);
}
@media (hover: hover) {
  .aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="default"] *):hover {
    text-decoration-line: underline;
  }
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="default"] *):focus-visible {
  --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="default"] *):focus-visible {
  --tw-ring-color: color-mix(in srgb, hsl(var(--ring)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="default"] *):focus-visible {
    --tw-ring-color: color-mix(in oklab, var(--color-ring) 50%, transparent);
  }
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="outline"] *) {
  padding-inline: calc(var(--spacing) * 4);
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="outline"] *) {
  padding-block: calc(var(--spacing) * 3);
}
@media (hover: hover) {
  .aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="outline"] *):hover {
    background-color: color-mix(in srgb, hsl(var(--muted)) 50%, transparent);
  }
  @supports (color: color-mix(in lab, red, red)) {
    .aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="outline"] *):hover {
      background-color: color-mix(in oklab, var(--color-muted) 50%, transparent);
    }
  }
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="outline"] *):focus-visible {
  --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="outline"] *):focus-visible {
  --tw-ring-color: color-mix(in srgb, hsl(var(--ring)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="outline"] *):focus-visible {
    --tw-ring-color: color-mix(in oklab, var(--color-ring) 50%, transparent);
  }
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="outline"] *):focus-visible {
  --tw-ring-inset: inset;
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="ghost"] *) {
  border-radius: var(--radius-lg);
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="ghost"] *) {
  padding-inline: calc(var(--spacing) * 4);
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="ghost"] *) {
  padding-block: calc(var(--spacing) * 2);
}
@media (hover: hover) {
  .aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="ghost"] *):hover {
    background-color: color-mix(in srgb, hsl(var(--muted)) 50%, transparent);
  }
  @supports (color: color-mix(in lab, red, red)) {
    .aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="ghost"] *):hover {
      background-color: color-mix(in oklab, var(--color-muted) 50%, transparent);
    }
  }
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="ghost"] *):focus-visible {
  --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
.aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="ghost"] *):focus-visible {
  --tw-ring-color: color-mix(in srgb, hsl(var(--ring)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-accordion-trigger:is(:where(.group\\/accordion)[data-variant="ghost"] *):focus-visible {
    --tw-ring-color: color-mix(in oklab, var(--color-ring) 50%, transparent);
  }
}
.aui-accordion-trigger {
  pointer-events: none;
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
  flex-shrink: 0;
  color: var(--color-muted-foreground);
  transition-property: transform, translate, scale, rotate;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-duration: 200ms;
  transition-duration: 200ms;
  --tw-ease: var(--ease-out);
  transition-timing-function: var(--ease-out);
}
.aui-accordion-trigger:is(:where(.group\\/accordion-trigger)[data-state="open"] *) {
  rotate: 180deg;
}
.aui-action-bar-more-content {
  z-index: 50;
  min-width: calc(var(--spacing) * 32);
  overflow: hidden;
  border-radius: var(--radius-md);
  border-style: var(--tw-border-style);
  border-width: 1px;
  background-color: var(--color-popover);
  padding: calc(var(--spacing) * 1);
  color: var(--color-popover-foreground);
  --tw-shadow: 0 4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
.aui-action-bar-more-item {
  display: flex;
  cursor: pointer;
  align-items: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--radius-sm);
  padding-inline: calc(var(--spacing) * 2);
  padding-block: calc(var(--spacing) * 1.5);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-outline-style: none;
  outline-style: none;
  -webkit-user-select: none;
  user-select: none;
}
@media (hover: hover) {
  .aui-action-bar-more-item:hover {
    background-color: var(--color-accent);
  }
}
@media (hover: hover) {
  .aui-action-bar-more-item:hover {
    color: var(--color-accent-foreground);
  }
}
.aui-action-bar-more-item:focus {
  background-color: var(--color-accent);
}
.aui-action-bar-more-item:focus {
  color: var(--color-accent-foreground);
}
.aui-action-bar-more-item {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
}
.aui-assistant-action-bar-root {
  grid-column-start: 3;
  grid-row-start: 2;
  margin-left: calc(var(--spacing) * -1);
  display: flex;
  gap: calc(var(--spacing) * 1);
  color: var(--color-muted-foreground);
}
.aui-assistant-action-bar-root[data-floating] {
  position: absolute;
}
.aui-assistant-action-bar-root[data-floating] {
  border-radius: var(--radius-md);
}
.aui-assistant-action-bar-root[data-floating] {
  border-style: var(--tw-border-style);
  border-width: 1px;
}
.aui-assistant-action-bar-root[data-floating] {
  background-color: var(--color-background);
}
.aui-assistant-action-bar-root[data-floating] {
  padding: calc(var(--spacing) * 1);
}
.aui-assistant-action-bar-root[data-floating] {
  --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
.aui-assistant-action-bar-root[data-state="open"] {
  background-color: var(--color-accent);
}
.aui-assistant-message-content {
  padding-inline: calc(var(--spacing) * 2);
  --tw-leading: var(--leading-relaxed);
  line-height: var(--leading-relaxed);
  overflow-wrap: break-word;
  color: var(--color-foreground);
}
.aui-assistant-message-footer {
  margin-top: calc(var(--spacing) * 1);
  margin-left: calc(var(--spacing) * 2);
  display: flex;
}
.aui-assistant-message-root {
  position: relative;
  margin-inline: auto;
  width: 100%;
  max-width: var(--thread-max-width);
  animation: enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
  padding-block: calc(var(--spacing) * 3);
  --tw-duration: 150ms;
  transition-duration: 150ms;
  --tw-enter-opacity: 0;
  --tw-enter-translate-y: calc(1*var(--spacing));
}
.aui-attachment-add-icon {
  width: calc(var(--spacing) * 5);
  height: calc(var(--spacing) * 5);
  stroke-width: 1.5px;
}
.aui-attachment-preview {
  position: relative;
  margin-inline: auto;
  display: flex;
  max-height: 80dvh;
  width: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--color-background);
}
.aui-attachment-preview-dialog-content {
  padding: calc(var(--spacing) * 2);
}
@media (width >= 40rem) {
  .aui-attachment-preview-dialog-content {
    max-width: var(--container-3xl);
  }
}
.aui-attachment-preview-dialog-content svg {
  color: var(--color-background);
}
.aui-attachment-preview-dialog-content>button {
  border-radius: calc(infinity * 1px);
}
.aui-attachment-preview-dialog-content>button {
  background-color: color-mix(in srgb, hsl(var(--foreground)) 60%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-attachment-preview-dialog-content>button {
    background-color: color-mix(in oklab, var(--color-foreground) 60%, transparent);
  }
}
.aui-attachment-preview-dialog-content>button {
  padding: calc(var(--spacing) * 1);
}
.aui-attachment-preview-dialog-content>button {
  opacity: 100%;
}
.aui-attachment-preview-dialog-content>button {
  --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor) !important;
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow) !important;
}
@media (hover: hover) {
  .aui-attachment-preview-dialog-content>button:hover svg {
    color: var(--color-destructive);
  }
}
.aui-attachment-preview-dialog-content {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border-width: 0;
}
.aui-attachment-preview-image-loading {
  visibility: hidden;
}
.aui-attachment-preview-trigger {
  cursor: pointer;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
@media (hover: hover) {
  .aui-attachment-preview-trigger:hover {
    background-color: color-mix(in srgb, hsl(var(--accent)) 50%, transparent);
  }
  @supports (color: color-mix(in lab, red, red)) {
    .aui-attachment-preview-trigger:hover {
      background-color: color-mix(in oklab, var(--color-accent) 50%, transparent);
    }
  }
}
.aui-attachment-remove-icon {
  width: calc(var(--spacing) * 3);
  height: calc(var(--spacing) * 3);
}
.aui-attachment-remove-icon:where(.dark, .dark *) {
  stroke-width: 2.5px;
}
.aui-attachment-root {
  position: relative;
}
.aui-attachment-root-composer:only-child>#attachment-tile {
  width: calc(var(--spacing) * 24);
  height: calc(var(--spacing) * 24);
}
.aui-attachment-tile {
  width: calc(var(--spacing) * 14);
  height: calc(var(--spacing) * 14);
  cursor: pointer;
  overflow: hidden;
  border-radius: 14px;
  border-style: var(--tw-border-style);
  border-width: 1px;
  background-color: var(--color-muted);
  transition-property: opacity;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
@media (hover: hover) {
  .aui-attachment-tile:hover {
    opacity: 75%;
  }
}
.aui-attachment-tile-avatar {
  height: 100%;
  width: 100%;
  border-radius: 0;
}
.aui-attachment-tile-composer {
  border-color: color-mix(in srgb, hsl(var(--foreground)) 20%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-attachment-tile-composer {
    border-color: color-mix(in oklab, var(--color-foreground) 20%, transparent);
  }
}
.aui-attachment-tile-fallback-icon {
  width: calc(var(--spacing) * 8);
  height: calc(var(--spacing) * 8);
  color: var(--color-muted-foreground);
}
.aui-attachment-tile-image {
  object-fit: cover;
}
.aui-attachment-tile-remove {
  position: absolute;
  top: calc(var(--spacing) * 1.5);
  right: calc(var(--spacing) * 1.5);
  width: calc(var(--spacing) * 3.5);
  height: calc(var(--spacing) * 3.5);
  border-radius: calc(infinity * 1px);
  background-color: var(--color-white);
  color: var(--color-muted-foreground);
  opacity: 100%;
  --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
@media (hover: hover) {
  .aui-attachment-tile-remove:hover {
    background-color: var(--color-white) !important;
  }
}
.aui-attachment-tile-remove svg {
  color: var(--color-black);
}
@media (hover: hover) {
  .aui-attachment-tile-remove:hover svg {
    color: var(--color-destructive);
  }
}
.aui-branch-picker-root {
  margin-right: calc(var(--spacing) * 2);
  margin-left: calc(var(--spacing) * -2);
  display: inline-flex;
  align-items: center;
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
  color: var(--color-muted-foreground);
}
.aui-branch-picker-state {
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
}
.aui-button-icon {
  width: calc(var(--spacing) * 6);
  height: calc(var(--spacing) * 6);
  padding: calc(var(--spacing) * 1);
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border-width: 0;
}
.aui-code-header-language {
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
  color: var(--color-muted-foreground);
  text-transform: lowercase;
}
.aui-code-header-root {
  margin-top: calc(var(--spacing) * 2.5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 0px;
  border-color: color-mix(in srgb, hsl(var(--border)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-code-header-root {
    border-color: color-mix(in oklab, var(--color-border) 50%, transparent);
  }
}
.aui-code-header-root {
  background-color: color-mix(in srgb, hsl(var(--muted)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-code-header-root {
    background-color: color-mix(in oklab, var(--color-muted) 50%, transparent);
  }
}
.aui-code-header-root {
  padding-inline: calc(var(--spacing) * 3);
  padding-block: calc(var(--spacing) * 1.5);
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
}
.aui-composer-action-wrapper {
  position: relative;
  margin-inline: calc(var(--spacing) * 2);
  margin-bottom: calc(var(--spacing) * 2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.aui-composer-add-attachment {
  width: calc(var(--spacing) * 8.5);
  height: calc(var(--spacing) * 8.5);
  border-radius: calc(infinity * 1px);
  padding: calc(var(--spacing) * 1);
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
  --tw-font-weight: var(--font-weight-semibold);
  font-weight: var(--font-weight-semibold);
}
@media (hover: hover) {
  .aui-composer-add-attachment:hover {
    background-color: color-mix(in srgb, hsl(var(--muted-foreground)) 15%, transparent);
  }
  @supports (color: color-mix(in lab, red, red)) {
    .aui-composer-add-attachment:hover {
      background-color: color-mix(in oklab, var(--color-muted-foreground) 15%, transparent);
    }
  }
}
.aui-composer-add-attachment:where(.dark, .dark *) {
  border-color: color-mix(in srgb, hsl(var(--muted-foreground)) 15%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-composer-add-attachment:where(.dark, .dark *) {
    border-color: color-mix(in oklab, var(--color-muted-foreground) 15%, transparent);
  }
}
@media (hover: hover) {
  .aui-composer-add-attachment:where(.dark, .dark *):hover {
    background-color: color-mix(in srgb, hsl(var(--muted-foreground)) 30%, transparent);
  }
  @supports (color: color-mix(in lab, red, red)) {
    .aui-composer-add-attachment:where(.dark, .dark *):hover {
      background-color: color-mix(in oklab, var(--color-muted-foreground) 30%, transparent);
    }
  }
}
.aui-composer-attachment-dropzone {
  display: flex;
  width: 100%;
  flex-direction: column;
  border-radius: var(--radius-2xl);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--color-input);
  background-color: var(--color-background);
  padding-inline: calc(var(--spacing) * 1);
  padding-top: calc(var(--spacing) * 2);
  transition-property: box-shadow;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-outline-style: none;
  outline-style: none;
}
.aui-composer-attachment-dropzone:has(*:is(textarea:focus-visible)) {
  border-color: var(--color-ring);
}
.aui-composer-attachment-dropzone:has(*:is(textarea:focus-visible)) {
  --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
.aui-composer-attachment-dropzone:has(*:is(textarea:focus-visible)) {
  --tw-ring-color: color-mix(in srgb, hsl(var(--ring)) 20%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-composer-attachment-dropzone:has(*:is(textarea:focus-visible)) {
    --tw-ring-color: color-mix(in oklab, var(--color-ring) 20%, transparent);
  }
}
.aui-composer-attachment-dropzone[data-dragging="true"] {
  --tw-border-style: dashed;
  border-style: dashed;
}
.aui-composer-attachment-dropzone[data-dragging="true"] {
  border-color: var(--color-ring);
}
.aui-composer-attachment-dropzone[data-dragging="true"] {
  background-color: color-mix(in srgb, hsl(var(--accent)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-composer-attachment-dropzone[data-dragging="true"] {
    background-color: color-mix(in oklab, var(--color-accent) 50%, transparent);
  }
}
.aui-composer-attachments {
  margin-bottom: calc(var(--spacing) * 2);
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  gap: calc(var(--spacing) * 2);
  overflow-x: auto;
  padding-inline: calc(var(--spacing) * 1.5);
  padding-top: calc(var(--spacing) * 0.5);
  padding-bottom: calc(var(--spacing) * 1);
}
.aui-composer-attachments:empty {
  display: none;
}
.aui-composer-cancel {
  width: calc(var(--spacing) * 8);
  height: calc(var(--spacing) * 8);
  border-radius: calc(infinity * 1px);
}
.aui-composer-cancel-icon {
  width: calc(var(--spacing) * 3);
  height: calc(var(--spacing) * 3);
  fill: currentcolor;
}
.aui-composer-input {
  margin-bottom: calc(var(--spacing) * 1);
  max-height: calc(var(--spacing) * 32);
  min-height: calc(var(--spacing) * 14);
  width: 100%;
  resize: none;
  background-color: transparent;
  padding-inline: calc(var(--spacing) * 4);
  padding-top: calc(var(--spacing) * 2);
  padding-bottom: calc(var(--spacing) * 3);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-outline-style: none;
  outline-style: none;
}
.aui-composer-input::placeholder {
  color: var(--color-muted-foreground);
}
.aui-composer-input:focus-visible {
  --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
.aui-composer-root {
  position: relative;
  display: flex;
  width: 100%;
  flex-direction: column;
}
.aui-composer-send {
  width: calc(var(--spacing) * 8);
  height: calc(var(--spacing) * 8);
  border-radius: calc(infinity * 1px);
}
.aui-composer-send-icon {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
}
.aui-edit-composer-footer {
  margin-inline: calc(var(--spacing) * 3);
  margin-bottom: calc(var(--spacing) * 3);
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) * 2);
  align-self: flex-end;
}
.aui-edit-composer-input {
  min-height: calc(var(--spacing) * 14);
  width: 100%;
  resize: none;
  background-color: transparent;
  padding: calc(var(--spacing) * 4);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  color: var(--color-foreground);
  --tw-outline-style: none;
  outline-style: none;
}
.aui-edit-composer-root {
  margin-left: auto;
  display: flex;
  width: 100%;
  max-width: 85%;
  flex-direction: column;
  border-radius: var(--radius-2xl);
  background-color: var(--color-muted);
}
.aui-edit-composer-wrapper {
  margin-inline: auto;
  display: flex;
  width: 100%;
  max-width: var(--thread-max-width);
  flex-direction: column;
  padding-inline: calc(var(--spacing) * 2);
  padding-block: calc(var(--spacing) * 3);
}
.aui-image-zoom-content {
  max-height: 90vh;
  max-width: 90vw;
  animation: enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
  cursor: zoom-out;
  object-fit: contain;
  --tw-duration: 200ms;
  transition-duration: 200ms;
  --tw-enter-scale: calc(95*1%);
  --tw-enter-scale: .95;
  --tw-enter-opacity: 0;
}
.aui-image-zoom-overlay {
  position: fixed;
  inset: calc(var(--spacing) * 0);
  z-index: 50;
  display: flex;
  animation: enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
  align-items: center;
  justify-content: center;
  background-color: color-mix(in srgb, #000 80%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-image-zoom-overlay {
    background-color: color-mix(in oklab, var(--color-black) 80%, transparent);
  }
}
.aui-image-zoom-overlay {
  --tw-duration: 200ms;
  transition-duration: 200ms;
  --tw-enter-opacity: 0;
}
.aui-image-zoom-trigger {
  cursor: zoom-in;
}
.aui-md-a {
  color: var(--color-primary);
  text-decoration-line: underline;
  text-underline-offset: 2px;
}
@media (hover: hover) {
  .aui-md-a:hover {
    color: color-mix(in srgb, hsl(var(--primary)) 80%, transparent);
  }
  @supports (color: color-mix(in lab, red, red)) {
    .aui-md-a:hover {
      color: color-mix(in oklab, var(--color-primary) 80%, transparent);
    }
  }
}
.aui-md-blockquote {
  margin-block: calc(var(--spacing) * 2.5);
  border-left-style: var(--tw-border-style);
  border-left-width: 2px;
  border-color: color-mix(in srgb, hsl(var(--muted-foreground)) 30%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-md-blockquote {
    border-color: color-mix(in oklab, var(--color-muted-foreground) 30%, transparent);
  }
}
.aui-md-blockquote {
  padding-left: calc(var(--spacing) * 3);
  color: var(--color-muted-foreground);
  font-style: italic;
}
.aui-md-h1 {
  margin-bottom: calc(var(--spacing) * 2);
  scroll-margin: calc(var(--spacing) * 20);
  font-size: var(--text-base);
  line-height: var(--tw-leading, var(--text-base--line-height));
  --tw-font-weight: var(--font-weight-semibold);
  font-weight: var(--font-weight-semibold);
}
.aui-md-h1:first-child {
  margin-top: calc(var(--spacing) * 0);
}
.aui-md-h1:last-child {
  margin-bottom: calc(var(--spacing) * 0);
}
.aui-md-h2 {
  margin-top: calc(var(--spacing) * 3);
  margin-bottom: calc(var(--spacing) * 1.5);
  scroll-margin: calc(var(--spacing) * 20);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-font-weight: var(--font-weight-semibold);
  font-weight: var(--font-weight-semibold);
}
.aui-md-h2:first-child {
  margin-top: calc(var(--spacing) * 0);
}
.aui-md-h2:last-child {
  margin-bottom: calc(var(--spacing) * 0);
}
.aui-md-h3 {
  margin-top: calc(var(--spacing) * 2.5);
  margin-bottom: calc(var(--spacing) * 1);
  scroll-margin: calc(var(--spacing) * 20);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-font-weight: var(--font-weight-semibold);
  font-weight: var(--font-weight-semibold);
}
.aui-md-h3:first-child {
  margin-top: calc(var(--spacing) * 0);
}
.aui-md-h3:last-child {
  margin-bottom: calc(var(--spacing) * 0);
}
.aui-md-h4 {
  margin-top: calc(var(--spacing) * 2);
  margin-bottom: calc(var(--spacing) * 1);
  scroll-margin: calc(var(--spacing) * 20);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
}
.aui-md-h4:first-child {
  margin-top: calc(var(--spacing) * 0);
}
.aui-md-h4:last-child {
  margin-bottom: calc(var(--spacing) * 0);
}
.aui-md-h5 {
  margin-top: calc(var(--spacing) * 2);
  margin-bottom: calc(var(--spacing) * 1);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
}
.aui-md-h5:first-child {
  margin-top: calc(var(--spacing) * 0);
}
.aui-md-h5:last-child {
  margin-bottom: calc(var(--spacing) * 0);
}
.aui-md-h6 {
  margin-top: calc(var(--spacing) * 2);
  margin-bottom: calc(var(--spacing) * 1);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
}
.aui-md-h6:first-child {
  margin-top: calc(var(--spacing) * 0);
}
.aui-md-h6:last-child {
  margin-bottom: calc(var(--spacing) * 0);
}
.aui-md-hr {
  margin-block: calc(var(--spacing) * 2);
  border-color: color-mix(in srgb, hsl(var(--muted-foreground)) 20%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-md-hr {
    border-color: color-mix(in oklab, var(--color-muted-foreground) 20%, transparent);
  }
}
.aui-md-inline-code {
  border-radius: var(--radius-md);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: color-mix(in srgb, hsl(var(--border)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-md-inline-code {
    border-color: color-mix(in oklab, var(--color-border) 50%, transparent);
  }
}
.aui-md-inline-code {
  background-color: color-mix(in srgb, hsl(var(--muted)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-md-inline-code {
    background-color: color-mix(in oklab, var(--color-muted) 50%, transparent);
  }
}
.aui-md-inline-code {
  padding-inline: calc(var(--spacing) * 1.5);
  padding-block: calc(var(--spacing) * 0.5);
  font-family: var(--font-mono);
  font-size: 0.85em;
}
.aui-md-li {
  --tw-leading: var(--leading-normal);
  line-height: var(--leading-normal);
}
.aui-md-ol {
  margin-block: calc(var(--spacing) * 2);
  margin-left: calc(var(--spacing) * 4);
  list-style-type: decimal;
}
.aui-md-ol *::marker {
  color: var(--color-muted-foreground);
}
.aui-md-ol::marker {
  color: var(--color-muted-foreground);
}
.aui-md-ol *::-webkit-details-marker {
  color: var(--color-muted-foreground);
}
.aui-md-ol::-webkit-details-marker {
  color: var(--color-muted-foreground);
}
.aui-md-ol>li {
  margin-top: calc(var(--spacing) * 1);
}
.aui-md-p {
  margin-block: calc(var(--spacing) * 2.5);
  --tw-leading: var(--leading-normal);
  line-height: var(--leading-normal);
}
.aui-md-p:first-child {
  margin-top: calc(var(--spacing) * 0);
}
.aui-md-p:last-child {
  margin-bottom: calc(var(--spacing) * 0);
}
.aui-md-pre {
  overflow-x: auto;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-lg);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-top-style: var(--tw-border-style);
  border-top-width: 0px;
  border-color: color-mix(in srgb, hsl(var(--border)) 50%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-md-pre {
    border-color: color-mix(in oklab, var(--color-border) 50%, transparent);
  }
}
.aui-md-pre {
  background-color: color-mix(in srgb, hsl(var(--muted)) 30%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-md-pre {
    background-color: color-mix(in oklab, var(--color-muted) 30%, transparent);
  }
}
.aui-md-pre {
  padding: calc(var(--spacing) * 3);
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
  --tw-leading: var(--leading-relaxed);
  line-height: var(--leading-relaxed);
}
.aui-md-sup>a {
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
}
.aui-md-sup>a {
  text-decoration-line: none;
}
.aui-md-table {
  margin-block: calc(var(--spacing) * 2);
  width: 100%;
  border-collapse: separate;
  --tw-border-spacing-x: calc(var(--spacing) * 0);
  --tw-border-spacing-y: calc(var(--spacing) * 0);
  border-spacing: var(--tw-border-spacing-x) var(--tw-border-spacing-y);
  overflow-y: auto;
}
.aui-md-td {
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 1px;
  border-left-style: var(--tw-border-style);
  border-left-width: 1px;
  border-color: color-mix(in srgb, hsl(var(--muted-foreground)) 20%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-md-td {
    border-color: color-mix(in oklab, var(--color-muted-foreground) 20%, transparent);
  }
}
.aui-md-td {
  padding-inline: calc(var(--spacing) * 2);
  padding-block: calc(var(--spacing) * 1);
  text-align: left;
}
.aui-md-td:last-child {
  border-right-style: var(--tw-border-style);
  border-right-width: 1px;
}
.aui-md-td:is([align=center]) {
  text-align: center;
}
.aui-md-td:is([align=right]) {
  text-align: right;
}
.aui-md-th {
  background-color: var(--color-muted);
  padding-inline: calc(var(--spacing) * 2);
  padding-block: calc(var(--spacing) * 1);
  text-align: left;
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
}
.aui-md-th:first-child {
  border-top-left-radius: var(--radius-lg);
}
.aui-md-th:last-child {
  border-top-right-radius: var(--radius-lg);
}
.aui-md-th:is([align=center]) {
  text-align: center;
}
.aui-md-th:is([align=right]) {
  text-align: right;
}
.aui-md-tr {
  margin: calc(var(--spacing) * 0);
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 1px;
  padding: calc(var(--spacing) * 0);
}
.aui-md-tr:first-child {
  border-top-style: var(--tw-border-style);
  border-top-width: 1px;
}
.aui-md-tr:last-child>td:first-child {
  border-bottom-left-radius: var(--radius-lg);
}
.aui-md-tr:last-child>td:last-child {
  border-bottom-right-radius: var(--radius-lg);
}
.aui-md-ul {
  margin-block: calc(var(--spacing) * 2);
  margin-left: calc(var(--spacing) * 4);
  list-style-type: disc;
}
.aui-md-ul *::marker {
  color: var(--color-muted-foreground);
}
.aui-md-ul::marker {
  color: var(--color-muted-foreground);
}
.aui-md-ul *::-webkit-details-marker {
  color: var(--color-muted-foreground);
}
.aui-md-ul::-webkit-details-marker {
  color: var(--color-muted-foreground);
}
.aui-md-ul>li {
  margin-top: calc(var(--spacing) * 1);
}
.aui-mermaid-diagram {
  border-bottom-right-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-lg);
  background-color: var(--color-muted);
  padding: calc(var(--spacing) * 2);
  text-align: center;
}
.aui-mermaid-diagram svg {
  margin-inline: auto;
}
.aui-message-error-message {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.aui-message-error-root {
  margin-top: calc(var(--spacing) * 2);
  border-radius: var(--radius-md);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-color: var(--color-destructive);
  background-color: color-mix(in srgb, hsl(var(--destructive)) 10%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-message-error-root {
    background-color: color-mix(in oklab, var(--color-destructive) 10%, transparent);
  }
}
.aui-message-error-root {
  padding: calc(var(--spacing) * 3);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  color: var(--color-destructive);
}
.aui-message-error-root:where(.dark, .dark *) {
  background-color: color-mix(in srgb, hsl(var(--destructive)) 5%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-message-error-root:where(.dark, .dark *) {
    background-color: color-mix(in oklab, var(--color-destructive) 5%, transparent);
  }
}
.aui-message-error-root:where(.dark, .dark *) {
  color: var(--color-red-200);
}
.aui-modal-button {
  width: 100%;
  height: 100%;
  border-radius: calc(infinity * 1px);
  --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 1px 2px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  transition-property: transform, translate, scale, rotate;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
@media (hover: hover) {
  .aui-modal-button:hover {
    --tw-scale-x: 110%;
    --tw-scale-y: 110%;
    --tw-scale-z: 110%;
    scale: var(--tw-scale-x) var(--tw-scale-y);
  }
}
.aui-modal-button:active {
  --tw-scale-x: 90%;
  --tw-scale-y: 90%;
  --tw-scale-z: 90%;
  scale: var(--tw-scale-x) var(--tw-scale-y);
}
.aui-modal-button-closed-icon {
  position: absolute;
  width: calc(var(--spacing) * 6);
  height: calc(var(--spacing) * 6);
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
.aui-modal-button-closed-icon[data-state="closed"] {
  --tw-scale-x: 100%;
  --tw-scale-y: 100%;
  --tw-scale-z: 100%;
  scale: var(--tw-scale-x) var(--tw-scale-y);
}
.aui-modal-button-closed-icon[data-state="closed"] {
  rotate: 0deg;
}
.aui-modal-button-closed-icon[data-state="open"] {
  --tw-scale-x: 0%;
  --tw-scale-y: 0%;
  --tw-scale-z: 0%;
  scale: var(--tw-scale-x) var(--tw-scale-y);
}
.aui-modal-button-closed-icon[data-state="open"] {
  rotate: 90deg;
}
.aui-modal-button-open-icon {
  width: calc(var(--spacing) * 6);
  height: calc(var(--spacing) * 6);
  transition-property: all;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
.aui-modal-button-open-icon[data-state="closed"] {
  --tw-scale-x: 0%;
  --tw-scale-y: 0%;
  --tw-scale-z: 0%;
  scale: var(--tw-scale-x) var(--tw-scale-y);
}
.aui-modal-button-open-icon[data-state="closed"] {
  rotate: calc(90deg * -1);
}
.aui-modal-button-open-icon[data-state="open"] {
  --tw-scale-x: 100%;
  --tw-scale-y: 100%;
  --tw-scale-z: 100%;
  scale: var(--tw-scale-x) var(--tw-scale-y);
}
.aui-modal-button-open-icon[data-state="open"] {
  rotate: 0deg;
}
.aui-modal-button-open-icon {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border-width: 0;
}
.aui-model-selector-trigger {
  min-width: 180px;
  position: relative;
  width: 100%;
  cursor: default;
  border-radius: var(--radius-lg);
  padding-block: calc(var(--spacing) * 2);
  padding-right: calc(var(--spacing) * 9);
  padding-left: calc(var(--spacing) * 3);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-outline-style: none;
  outline-style: none;
  -webkit-user-select: none;
  user-select: none;
}
.aui-model-selector-trigger:focus {
  background-color: var(--color-accent);
}
.aui-model-selector-trigger:focus {
  color: var(--color-accent-foreground);
}
.aui-model-selector-trigger[data-disabled] {
  pointer-events: none;
}
.aui-model-selector-trigger[data-disabled] {
  opacity: 50%;
}
.aui-model-selector-trigger {
  position: absolute;
  right: calc(var(--spacing) * 3);
  gap: calc(var(--spacing) * 2);
  display: flex;
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}
.aui-model-selector-trigger svg {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
}
.aui-model-selector-trigger {
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-xs);
  line-height: var(--tw-leading, var(--text-xs--line-height));
  color: var(--color-muted-foreground);
}
.aui-reasoning-content {
  position: relative;
  overflow: hidden;
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  color: var(--color-muted-foreground);
  --tw-outline-style: none;
  outline-style: none;
  --tw-ease: var(--ease-out);
  transition-timing-function: var(--ease-out);
}
.aui-reasoning-content[data-state="closed"] {
  animation: collapsible-up var(--tw-animation-duration,var(--tw-duration,.2s))var(--tw-ease,ease-out)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-reasoning-content[data-state="open"] {
  animation: collapsible-down var(--tw-animation-duration,var(--tw-duration,.2s))var(--tw-ease,ease-out)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-reasoning-content[data-state="closed"] {
  animation-fill-mode: forwards;
  --tw-animation-fill-mode: forwards;
}
.aui-reasoning-content[data-state="closed"] {
  pointer-events: none;
}
.aui-reasoning-content[data-state="open"] {
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
}
.aui-reasoning-content[data-state="closed"] {
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
}
.aui-reasoning-fade {
  pointer-events: none;
  position: absolute;
  inset-inline: calc(var(--spacing) * 0);
  bottom: calc(var(--spacing) * 0);
  z-index: 10;
  height: calc(var(--spacing) * 8);
  background-image: linear-gradient(to top,var(--color-background),transparent);
}
.aui-reasoning-fade:is(:where(.group\\/reasoning-root)[data-variant="muted"] *) {
  background-image: linear-gradient(to top,hsl(var(--muted)/0.5),transparent);
}
.aui-reasoning-fade {
  animation: enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
  --tw-enter-opacity: calc(0/100);
  --tw-enter-opacity: 0;
}
.aui-reasoning-fade:is(:where(.group\\/collapsible-content)[data-state="open"] *) {
  animation: exit var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-reasoning-fade:is(:where(.group\\/collapsible-content)[data-state="open"] *) {
  --tw-exit-opacity: calc(0/100);
  --tw-exit-opacity: 0;
}
.aui-reasoning-fade:is(:where(.group\\/collapsible-content)[data-state="open"] *) {
  transition-delay: calc(var(--animation-duration) * 0.75);
}
.aui-reasoning-fade:is(:where(.group\\/collapsible-content)[data-state="open"] *) {
  animation-delay: calc(var(--animation-duration) * 0.75);
  --tw-animation-delay: calc(var(--animation-duration) * 0.75);
}
.aui-reasoning-fade:is(:where(.group\\/collapsible-content)[data-state="open"] *) {
  animation-fill-mode: forwards;
  --tw-animation-fill-mode: forwards;
}
.aui-reasoning-fade {
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
}
.aui-reasoning-fade:is(:where(.group\\/collapsible-content)[data-state="open"] *) {
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
}
.aui-reasoning-text {
  position: relative;
  z-index: 0;
  max-height: calc(var(--spacing) * 64);
  overflow-y: auto;
  padding-top: calc(var(--spacing) * 2);
  padding-bottom: calc(var(--spacing) * 2);
  padding-left: calc(var(--spacing) * 6);
  --tw-leading: var(--leading-relaxed);
  line-height: var(--leading-relaxed);
  transform: translateZ(0) var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,);
  transition-property: transform,opacity;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
.aui-reasoning-text:is(:where(.group\\/collapsible-content)[data-state="open"] *) {
  animation: enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-reasoning-text:is(:where(.group\\/collapsible-content)[data-state="closed"] *) {
  animation: exit var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-reasoning-text:is(:where(.group\\/collapsible-content)[data-state="open"] *) {
  --tw-enter-opacity: calc(0/100);
  --tw-enter-opacity: 0;
}
.aui-reasoning-text:is(:where(.group\\/collapsible-content)[data-state="closed"] *) {
  --tw-exit-opacity: calc(0/100);
  --tw-exit-opacity: 0;
}
.aui-reasoning-text:is(:where(.group\\/collapsible-content)[data-state="open"] *) {
  --tw-enter-translate-y: calc(4*var(--spacing)*-1);
}
.aui-reasoning-text:is(:where(.group\\/collapsible-content)[data-state="closed"] *) {
  --tw-exit-translate-y: calc(4*var(--spacing)*-1);
}
.aui-reasoning-text:is(:where(.group\\/collapsible-content)[data-state="open"] *) {
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
}
.aui-reasoning-text:is(:where(.group\\/collapsible-content)[data-state="closed"] *) {
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
}
.aui-reasoning-trigger {
  display: flex;
  max-width: 75%;
  align-items: center;
  gap: calc(var(--spacing) * 2);
  padding-block: calc(var(--spacing) * 1);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  color: var(--color-muted-foreground);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
@media (hover: hover) {
  .aui-reasoning-trigger:hover {
    color: var(--color-foreground);
  }
}
.aui-reasoning-trigger-chevron {
  margin-top: calc(var(--spacing) * 0.5);
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
  flex-shrink: 0;
  transition-property: transform, translate, scale, rotate;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
  --tw-ease: var(--ease-out);
  transition-timing-function: var(--ease-out);
}
.aui-reasoning-trigger-chevron:is(:where(.group\\/trigger)[data-state="closed"] *) {
  rotate: calc(90deg * -1);
}
.aui-reasoning-trigger-chevron:is(:where(.group\\/trigger)[data-state="open"] *) {
  rotate: 0deg;
}
.aui-reasoning-trigger-icon {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
  flex-shrink: 0;
}
.aui-reasoning-trigger-label-wrapper {
  position: relative;
  display: inline-block;
  --tw-leading: 1;
  line-height: 1;
}
.aui-reasoning-trigger-shimmer {
  pointer-events: none;
  position: absolute;
  inset: calc(var(--spacing) * 0);
  --_gradient-width: calc(var(--_spread) + var(--shimmer-track-height) * tan(var(--shimmer-angle)));
  --_active-distance: calc(var(--shimmer-track-width, 200px) + var(--_gradient-width));
  --_duration: var(--shimmer-duration, calc(var(--_active-distance) / var(--_speed) / 1px * 1000));
  --_repeat-delay: var(--shimmer-repeat-delay, calc(20000 / var(--_speed)));
  --_repeat-delay-px: calc(var(--_repeat-delay) * var(--_active-distance) / var(--_duration));
  --_xy-offset-px: calc((var(--shimmer-x, 0) + var(--shimmer-y, 0) * tan(var(--shimmer-angle))) * 1px);
  --_bg-width: calc(
    100% +
    var(--shimmer-track-width, 100%) +
    var(--_gradient-width) +
    var(--_repeat-delay-px)
  );
  --_position: calc(
    var(--shimmer-track-width, (100% - var(--_gradient-width) - var(--_repeat-delay-px)) / 2)
    + var(--_gradient-width) / 2
    + var(--_repeat-delay-px)
    - var(--_xy-offset-px)
  );
}
.aui-reasoning-trigger-shimmer:not(.shimmer-bg) {
  --_speed: var(--shimmer-speed, 200);
  --_spread: var(--shimmer-spread, calc(4ch + 80px));
  --_bg: currentColor;
  --_fg: var(--shimmer-color, oklch(from currentColor l c h / calc(alpha * 0.2)));
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.aui-reasoning-trigger-shimmer.shimmer-bg {
  --_speed: var(--shimmer-speed, 1000);
  --_spread: var(--shimmer-spread, 480px);
  --_bg: transparent;
  --_fg: var(--shimmer-color, oklch(from currentColor 0 c h / 0.06));
}
.aui-reasoning-trigger-shimmer:where(.dark, .dark *):not(.shimmer-bg) {
  --_fg: var(--shimmer-color, oklch(from currentColor max(0.8, calc(l + 0.4)) c h / calc(alpha + 0.4)));
}
.aui-reasoning-trigger-shimmer:where(.dark, .dark *).shimmer-bg {
  --_fg: var(--shimmer-color, oklch(from currentColor 0 c h / 0.30));
}
.aui-reasoning-trigger-shimmer {
  @-moz-document url-prefix() {
    --_duration: var(--shimmer-duration, calc(375000 / var(--_speed)));
  }
  --_mix-96: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-reasoning-trigger-shimmer {
    --_mix-96: color-mix(in oklch, var(--_fg), var(--_bg) 96%);
  }
}
.aui-reasoning-trigger-shimmer {
  --_mix-83: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-reasoning-trigger-shimmer {
    --_mix-83: color-mix(in oklch, var(--_fg), var(--_bg) 83%);
  }
}
.aui-reasoning-trigger-shimmer {
  --_mix-67: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-reasoning-trigger-shimmer {
    --_mix-67: color-mix(in oklch, var(--_fg), var(--_bg) 67%);
  }
}
.aui-reasoning-trigger-shimmer {
  --_mix-50: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-reasoning-trigger-shimmer {
    --_mix-50: color-mix(in oklch, var(--_fg), var(--_bg) 50%);
  }
}
.aui-reasoning-trigger-shimmer {
  --_mix-33: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-reasoning-trigger-shimmer {
    --_mix-33: color-mix(in oklch, var(--_fg), var(--_bg) 33%);
  }
}
.aui-reasoning-trigger-shimmer {
  --_mix-17: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-reasoning-trigger-shimmer {
    --_mix-17: color-mix(in oklch, var(--_fg), var(--_bg) 17%);
  }
}
.aui-reasoning-trigger-shimmer {
  --_mix-4: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-reasoning-trigger-shimmer {
    --_mix-4: color-mix(in oklch, var(--_fg), var(--_bg) 4%);
  }
}
.aui-reasoning-trigger-shimmer {
  background: linear-gradient( calc(90deg + var(--shimmer-angle)), var(--_bg) calc(var(--_position) - var(--_spread) * 0.5), var(--_mix-96) calc(var(--_position) - var(--_spread) * 0.44), var(--_mix-83) calc(var(--_position) - var(--_spread) * 0.37), var(--_mix-67) calc(var(--_position) - var(--_spread) * 0.31), var(--_mix-50) calc(var(--_position) - var(--_spread) * 0.25), var(--_mix-33) calc(var(--_position) - var(--_spread) * 0.19), var(--_mix-17) calc(var(--_position) - var(--_spread) * 0.12), var(--_mix-4) calc(var(--_position) - var(--_spread) * 0.06), var(--_fg) var(--_position), var(--_mix-4) calc(var(--_position) + var(--_spread) * 0.06), var(--_mix-17) calc(var(--_position) + var(--_spread) * 0.12), var(--_mix-33) calc(var(--_position) + var(--_spread) * 0.19), var(--_mix-50) calc(var(--_position) + var(--_spread) * 0.25), var(--_mix-67) calc(var(--_position) + var(--_spread) * 0.31), var(--_mix-83) calc(var(--_position) + var(--_spread) * 0.37), var(--_mix-96) calc(var(--_position) + var(--_spread) * 0.44), var(--_bg) calc(var(--_position) + var(--_spread) * 0.5) ) 0 0 / var(--_bg-width) 100% no-repeat;
  animation: tw-shimmer 1s linear 0s infinite backwards;
  animation-duration: calc((var(--_duration) + var(--_repeat-delay)) * 1ms);
}
@media (prefers-reduced-motion: reduce) {
  .aui-reasoning-trigger-shimmer {
    animation: none;
  }
}
.aui-root {
  position: fixed;
  right: calc(var(--spacing) * 4);
  bottom: calc(var(--spacing) * 4);
  width: calc(var(--spacing) * 11);
  height: calc(var(--spacing) * 11);
  z-index: 50;
  height: calc(var(--spacing) * 125);
  width: calc(var(--spacing) * 100);
  overflow: clip;
  overscroll-behavior: contain;
  border-radius: var(--radius-xl);
  border-style: var(--tw-border-style);
  border-width: 1px;
  background-color: var(--color-popover);
  padding: calc(var(--spacing) * 0);
  color: var(--color-popover-foreground);
  --tw-shadow: 0 4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-outline-style: none;
  outline-style: none;
}
.aui-root[data-state="closed"] {
  animation: exit var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-root[data-state="closed"] {
  --tw-exit-opacity: calc(0/100);
  --tw-exit-opacity: 0;
}
.aui-root[data-state="closed"] {
  --tw-exit-translate-y: calc(1/2*100%);
}
.aui-root[data-state="closed"] {
  --tw-exit-translate-x: calc(1/2*100%);
}
.aui-root[data-state="closed"] {
  --tw-exit-scale: 0;
}
.aui-root[data-state="open"] {
  animation: enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-root[data-state="open"] {
  --tw-enter-opacity: calc(0/100);
  --tw-enter-opacity: 0;
}
.aui-root[data-state="open"] {
  --tw-enter-translate-y: calc(1/2*100%);
}
.aui-root[data-state="open"] {
  --tw-enter-translate-x: calc(1/2*100%);
}
.aui-root[data-state="open"] {
  --tw-enter-scale: 0;
}
.aui-root>.aui-thread-root {
  background-color: inherit;
}
.aui-root {
  gap: calc(var(--spacing) * 1);
  container-type: inline-size;
  display: flex;
  height: 100%;
  flex-direction: column;
  background-color: var(--color-background);
}
.aui-shiki-base pre {
  overflow-x: auto;
}
.aui-shiki-base pre {
  border-bottom-right-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-lg);
}
.aui-shiki-base pre {
  background-color: color-mix(in srgb, hsl(var(--muted)) 75%, transparent) !important;
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-shiki-base pre {
    background-color: color-mix(in oklab, var(--color-muted) 75%, transparent) !important;
  }
}
.aui-shiki-base pre {
  padding: calc(var(--spacing) * 4);
}
.aui-sidebar-content {
  padding-inline: calc(var(--spacing) * 2);
}
.aui-sidebar-footer {
  border-top-style: var(--tw-border-style);
  border-top-width: 1px;
}
.aui-sidebar-footer-heading {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.5);
  --tw-leading: 1;
  line-height: 1;
}
.aui-sidebar-footer-icon {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
}
.aui-sidebar-footer-icon-wrapper {
  display: flex;
  aspect-ratio: 1 / 1;
  width: calc(var(--spacing) * 8);
  height: calc(var(--spacing) * 8);
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  background-color: var(--color-sidebar-primary);
  color: var(--color-sidebar-primary-foreground);
}
.aui-sidebar-footer-title {
  --tw-font-weight: var(--font-weight-semibold);
  font-weight: var(--font-weight-semibold);
}
.aui-sidebar-header {
  margin-bottom: calc(var(--spacing) * 2);
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 1px;
}
.aui-sidebar-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.aui-sidebar-header-heading {
  margin-right: calc(var(--spacing) * 6);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 0.5);
  --tw-leading: 1;
  line-height: 1;
}
.aui-sidebar-header-icon {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
}
.aui-sidebar-header-icon-wrapper {
  display: flex;
  aspect-ratio: 1 / 1;
  width: calc(var(--spacing) * 8);
  height: calc(var(--spacing) * 8);
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  background-color: var(--color-sidebar-primary);
  color: var(--color-sidebar-primary-foreground);
}
.aui-sidebar-header-title {
  --tw-font-weight: var(--font-weight-semibold);
  font-weight: var(--font-weight-semibold);
}
.aui-thread-followup-suggestion {
  border-radius: calc(infinity * 1px);
  border-style: var(--tw-border-style);
  border-width: 1px;
  background-color: var(--color-background);
  padding-inline: calc(var(--spacing) * 3);
  padding-block: calc(var(--spacing) * 1);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-ease: var(--ease-in);
  transition-timing-function: var(--ease-in);
}
@media (hover: hover) {
  .aui-thread-followup-suggestion:hover {
    background-color: color-mix(in srgb, hsl(var(--muted)) 80%, transparent);
  }
  @supports (color: color-mix(in lab, red, red)) {
    .aui-thread-followup-suggestion:hover {
      background-color: color-mix(in oklab, var(--color-muted) 80%, transparent);
    }
  }
}
.aui-thread-followup-suggestions {
  display: flex;
  min-height: calc(var(--spacing) * 8);
  align-items: center;
  justify-content: center;
  gap: calc(var(--spacing) * 2);
}
.aui-thread-list-item {
  display: flex;
  height: calc(var(--spacing) * 9);
  align-items: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--radius-lg);
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
@media (hover: hover) {
  .aui-thread-list-item:hover {
    background-color: var(--color-muted);
  }
}
.aui-thread-list-item:focus-visible {
  background-color: var(--color-muted);
}
.aui-thread-list-item:focus-visible {
  --tw-outline-style: none;
  outline-style: none;
}
.aui-thread-list-item[data-active] {
  background-color: var(--color-muted);
}
.aui-thread-list-item-more {
  margin-right: calc(var(--spacing) * 2);
  width: calc(var(--spacing) * 7);
  height: calc(var(--spacing) * 7);
  padding: calc(var(--spacing) * 0);
  opacity: 0%;
  transition-property: opacity;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
@media (hover: hover) {
  .aui-thread-list-item-more:is(:where(.group):hover *) {
    opacity: 100%;
  }
}
.aui-thread-list-item-more:is(:where(.group)[data-active] *) {
  opacity: 100%;
}
.aui-thread-list-item-more[data-state="open"] {
  background-color: var(--color-accent);
}
.aui-thread-list-item-more[data-state="open"] {
  opacity: 100%;
}
.aui-thread-list-item-more {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border-width: 0;
}
.aui-thread-list-item-more-content {
  z-index: 50;
  min-width: calc(var(--spacing) * 32);
  overflow: hidden;
  border-radius: var(--radius-md);
  border-style: var(--tw-border-style);
  border-width: 1px;
  background-color: var(--color-popover);
  padding: calc(var(--spacing) * 1);
  color: var(--color-popover-foreground);
  --tw-shadow: 0 4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
  box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
}
@media (hover: hover) {
  .aui-thread-list-item-more-item:hover {
    background-color: var(--color-accent);
  }
}
@media (hover: hover) {
  .aui-thread-list-item-more-item:hover {
    color: var(--color-accent-foreground);
  }
}
.aui-thread-list-item-more-item:focus {
  background-color: var(--color-accent);
}
.aui-thread-list-item-more-item:focus {
  color: var(--color-accent-foreground);
}
.aui-thread-list-item-more-item {
  display: flex;
  cursor: pointer;
  align-items: center;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--radius-sm);
  padding-inline: calc(var(--spacing) * 2);
  padding-block: calc(var(--spacing) * 1.5);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  color: var(--color-destructive);
  --tw-outline-style: none;
  outline-style: none;
  -webkit-user-select: none;
  user-select: none;
}
@media (hover: hover) {
  .aui-thread-list-item-more-item:hover {
    background-color: color-mix(in srgb, hsl(var(--destructive)) 10%, transparent);
  }
  @supports (color: color-mix(in lab, red, red)) {
    .aui-thread-list-item-more-item:hover {
      background-color: color-mix(in oklab, var(--color-destructive) 10%, transparent);
    }
  }
}
@media (hover: hover) {
  .aui-thread-list-item-more-item:hover {
    color: var(--color-destructive);
  }
}
.aui-thread-list-item-more-item:focus {
  background-color: color-mix(in srgb, hsl(var(--destructive)) 10%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-thread-list-item-more-item:focus {
    background-color: color-mix(in oklab, var(--color-destructive) 10%, transparent);
  }
}
.aui-thread-list-item-more-item:focus {
  color: var(--color-destructive);
}
.aui-thread-list-item-more-item {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
}
.aui-thread-list-item-trigger {
  display: flex;
  height: 100%;
  min-width: calc(var(--spacing) * 0);
  flex: 1;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-inline: calc(var(--spacing) * 3);
  text-align: start;
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
}
.aui-thread-list-new {
  height: calc(var(--spacing) * 9);
  justify-content: flex-start;
  gap: calc(var(--spacing) * 2);
  border-radius: var(--radius-lg);
  padding-inline: calc(var(--spacing) * 3);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
}
@media (hover: hover) {
  .aui-thread-list-new:hover {
    background-color: var(--color-muted);
  }
}
.aui-thread-list-new[data-active] {
  background-color: var(--color-muted);
}
.aui-thread-list-new {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 1);
}
.aui-thread-list-skeleton {
  height: calc(var(--spacing) * 4);
  width: 100%;
}
.aui-thread-list-skeleton-wrapper {
  display: flex;
  height: calc(var(--spacing) * 9);
  align-items: center;
  padding-inline: calc(var(--spacing) * 3);
}
.aui-thread-scroll-to-bottom {
  position: absolute;
  top: calc(var(--spacing) * -12);
  z-index: 10;
  align-self: center;
  border-radius: calc(infinity * 1px);
  padding: calc(var(--spacing) * 4);
}
.aui-thread-scroll-to-bottom:disabled {
  visibility: hidden;
}
.aui-thread-scroll-to-bottom:where(.dark, .dark *) {
  background-color: var(--color-background);
}
@media (hover: hover) {
  .aui-thread-scroll-to-bottom:where(.dark, .dark *):hover {
    background-color: var(--color-accent);
  }
}
.aui-thread-viewport {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: scroll;
  scroll-behavior: smooth;
  padding-inline: calc(var(--spacing) * 4);
  padding-top: calc(var(--spacing) * 4);
}
.aui-thread-viewport-footer {
  position: sticky;
  bottom: calc(var(--spacing) * 0);
  margin-inline: auto;
  margin-top: auto;
  display: flex;
  width: 100%;
  max-width: var(--thread-max-width);
  flex-direction: column;
  gap: calc(var(--spacing) * 4);
  overflow: visible;
  border-top-left-radius: var(--radius-3xl);
  border-top-right-radius: var(--radius-3xl);
  padding-bottom: calc(var(--spacing) * 4);
}
@media (width >= 48rem) {
  .aui-thread-viewport-footer {
    padding-bottom: calc(var(--spacing) * 6);
  }
}
.aui-thread-welcome-center {
  display: flex;
  width: 100%;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.aui-thread-welcome-message {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  padding-inline: calc(var(--spacing) * 4);
}
.aui-thread-welcome-message-inner {
  font-size: var(--text-2xl);
  line-height: var(--tw-leading, var(--text-2xl--line-height));
  --tw-font-weight: var(--font-weight-semibold);
  font-weight: var(--font-weight-semibold);
  animation: enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
  font-size: var(--text-xl);
  line-height: var(--tw-leading, var(--text-xl--line-height));
  color: var(--color-muted-foreground);
  transition-delay: 75ms;
  --tw-duration: 200ms;
  transition-duration: 200ms;
  animation-delay: calc(75*1ms);
  animation-delay: 75ms;
  --tw-animation-delay: calc(75*1ms);
  --tw-animation-delay: 75ms;
  --tw-enter-opacity: 0;
  --tw-enter-translate-y: calc(1*var(--spacing));
}
.aui-thread-welcome-root {
  margin-inline: auto;
  margin-block: auto;
  display: flex;
  width: 100%;
  max-width: var(--thread-max-width);
  flex-grow: 1;
  flex-direction: column;
}
.aui-thread-welcome-suggestion {
  height: auto;
  width: 100%;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
  gap: calc(var(--spacing) * 1);
  border-radius: var(--radius-2xl);
  border-style: var(--tw-border-style);
  border-width: 1px;
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 3);
  text-align: left;
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
@media (hover: hover) {
  .aui-thread-welcome-suggestion:hover {
    background-color: var(--color-muted);
  }
}
@container (width >= 28rem) {
  .aui-thread-welcome-suggestion {
    flex-direction: column;
  }
}
.aui-thread-welcome-suggestion-display {
  animation: enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
  --tw-duration: 200ms;
  transition-duration: 200ms;
  animation-fill-mode: both;
  --tw-animation-fill-mode: both;
  --tw-enter-opacity: 0;
  --tw-enter-translate-y: calc(2*var(--spacing));
}
.aui-thread-welcome-suggestion-display:nth-child(n+3) {
  display: none;
}
@container (width >= 28rem) {
  .aui-thread-welcome-suggestion-display:nth-child(n+3) {
    display: block;
  }
}
.aui-thread-welcome-suggestion-text-1 {
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
}
.aui-thread-welcome-suggestion-text-2 {
  color: var(--color-muted-foreground);
}
.aui-thread-welcome-suggestions {
  display: grid;
  width: 100%;
  gap: calc(var(--spacing) * 2);
  padding-bottom: calc(var(--spacing) * 4);
}
@container (width >= 28rem) {
  .aui-thread-welcome-suggestions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.aui-tool-fallback-args {
  padding-inline: calc(var(--spacing) * 4);
}
.aui-tool-fallback-args-value {
  white-space: pre-wrap;
}
.aui-tool-fallback-content {
  position: relative;
  overflow: hidden;
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-outline-style: none;
  outline-style: none;
  --tw-ease: var(--ease-out);
  transition-timing-function: var(--ease-out);
}
.aui-tool-fallback-content[data-state="closed"] {
  animation: collapsible-up var(--tw-animation-duration,var(--tw-duration,.2s))var(--tw-ease,ease-out)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-tool-fallback-content[data-state="open"] {
  animation: collapsible-down var(--tw-animation-duration,var(--tw-duration,.2s))var(--tw-ease,ease-out)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-tool-fallback-content[data-state="closed"] {
  animation-fill-mode: forwards;
  --tw-animation-fill-mode: forwards;
}
.aui-tool-fallback-content[data-state="closed"] {
  pointer-events: none;
}
.aui-tool-fallback-content[data-state="open"] {
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
}
.aui-tool-fallback-content[data-state="closed"] {
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
}
.aui-tool-fallback-content {
  margin-top: calc(var(--spacing) * 3);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 2);
  border-top-style: var(--tw-border-style);
  border-top-width: 1px;
  padding-top: calc(var(--spacing) * 2);
}
.aui-tool-fallback-error {
  padding-inline: calc(var(--spacing) * 4);
}
.aui-tool-fallback-error-header {
  --tw-font-weight: var(--font-weight-semibold);
  font-weight: var(--font-weight-semibold);
  color: var(--color-muted-foreground);
}
.aui-tool-fallback-error-reason {
  color: var(--color-muted-foreground);
  border-color: color-mix(in srgb, hsl(var(--muted-foreground)) 30%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-fallback-error-reason {
    border-color: color-mix(in oklab, var(--color-muted-foreground) 30%, transparent);
  }
}
.aui-tool-fallback-error-reason {
  background-color: color-mix(in srgb, hsl(var(--muted)) 30%, transparent);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-fallback-error-reason {
    background-color: color-mix(in oklab, var(--color-muted) 30%, transparent);
  }
}
.aui-tool-fallback-error-reason {
  opacity: 60%;
}
.aui-tool-fallback-result {
  border-top-style: var(--tw-border-style);
  border-top-width: 1px;
  --tw-border-style: dashed;
  border-style: dashed;
  padding-inline: calc(var(--spacing) * 4);
  padding-top: calc(var(--spacing) * 2);
}
.aui-tool-fallback-result-content {
  white-space: pre-wrap;
}
.aui-tool-fallback-result-header {
  --tw-font-weight: var(--font-weight-semibold);
  font-weight: var(--font-weight-semibold);
}
.aui-tool-fallback-root {
  width: 100%;
  border-radius: var(--radius-lg);
  border-style: var(--tw-border-style);
  border-width: 1px;
  padding-block: calc(var(--spacing) * 3);
}
.aui-tool-fallback-trigger {
  display: flex;
  width: 100%;
  align-items: center;
  gap: calc(var(--spacing) * 2);
  padding-inline: calc(var(--spacing) * 4);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
.aui-tool-fallback-trigger-chevron {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
  flex-shrink: 0;
  transition-property: transform, translate, scale, rotate;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
  --tw-ease: var(--ease-out);
  transition-timing-function: var(--ease-out);
}
.aui-tool-fallback-trigger-chevron:is(:where(.group\\/trigger)[data-state="closed"] *) {
  rotate: calc(90deg * -1);
}
.aui-tool-fallback-trigger-chevron:is(:where(.group\\/trigger)[data-state="open"] *) {
  rotate: 0deg;
}
.aui-tool-fallback-trigger-icon {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
  flex-shrink: 0;
  color: var(--color-muted-foreground);
  animation: var(--animate-spin);
}
.aui-tool-fallback-trigger-label-wrapper {
  position: relative;
  display: inline-block;
  flex-grow: 1;
  text-align: left;
  --tw-leading: 1;
  line-height: 1;
  color: var(--color-muted-foreground);
  text-decoration-line: line-through;
}
.aui-tool-fallback-trigger-shimmer {
  pointer-events: none;
  position: absolute;
  inset: calc(var(--spacing) * 0);
  --_gradient-width: calc(var(--_spread) + var(--shimmer-track-height) * tan(var(--shimmer-angle)));
  --_active-distance: calc(var(--shimmer-track-width, 200px) + var(--_gradient-width));
  --_duration: var(--shimmer-duration, calc(var(--_active-distance) / var(--_speed) / 1px * 1000));
  --_repeat-delay: var(--shimmer-repeat-delay, calc(20000 / var(--_speed)));
  --_repeat-delay-px: calc(var(--_repeat-delay) * var(--_active-distance) / var(--_duration));
  --_xy-offset-px: calc((var(--shimmer-x, 0) + var(--shimmer-y, 0) * tan(var(--shimmer-angle))) * 1px);
  --_bg-width: calc(
    100% +
    var(--shimmer-track-width, 100%) +
    var(--_gradient-width) +
    var(--_repeat-delay-px)
  );
  --_position: calc(
    var(--shimmer-track-width, (100% - var(--_gradient-width) - var(--_repeat-delay-px)) / 2)
    + var(--_gradient-width) / 2
    + var(--_repeat-delay-px)
    - var(--_xy-offset-px)
  );
}
.aui-tool-fallback-trigger-shimmer:not(.shimmer-bg) {
  --_speed: var(--shimmer-speed, 200);
  --_spread: var(--shimmer-spread, calc(4ch + 80px));
  --_bg: currentColor;
  --_fg: var(--shimmer-color, oklch(from currentColor l c h / calc(alpha * 0.2)));
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.aui-tool-fallback-trigger-shimmer.shimmer-bg {
  --_speed: var(--shimmer-speed, 1000);
  --_spread: var(--shimmer-spread, 480px);
  --_bg: transparent;
  --_fg: var(--shimmer-color, oklch(from currentColor 0 c h / 0.06));
}
.aui-tool-fallback-trigger-shimmer:where(.dark, .dark *):not(.shimmer-bg) {
  --_fg: var(--shimmer-color, oklch(from currentColor max(0.8, calc(l + 0.4)) c h / calc(alpha + 0.4)));
}
.aui-tool-fallback-trigger-shimmer:where(.dark, .dark *).shimmer-bg {
  --_fg: var(--shimmer-color, oklch(from currentColor 0 c h / 0.30));
}
.aui-tool-fallback-trigger-shimmer {
  @-moz-document url-prefix() {
    --_duration: var(--shimmer-duration, calc(375000 / var(--_speed)));
  }
  --_mix-96: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-fallback-trigger-shimmer {
    --_mix-96: color-mix(in oklch, var(--_fg), var(--_bg) 96%);
  }
}
.aui-tool-fallback-trigger-shimmer {
  --_mix-83: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-fallback-trigger-shimmer {
    --_mix-83: color-mix(in oklch, var(--_fg), var(--_bg) 83%);
  }
}
.aui-tool-fallback-trigger-shimmer {
  --_mix-67: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-fallback-trigger-shimmer {
    --_mix-67: color-mix(in oklch, var(--_fg), var(--_bg) 67%);
  }
}
.aui-tool-fallback-trigger-shimmer {
  --_mix-50: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-fallback-trigger-shimmer {
    --_mix-50: color-mix(in oklch, var(--_fg), var(--_bg) 50%);
  }
}
.aui-tool-fallback-trigger-shimmer {
  --_mix-33: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-fallback-trigger-shimmer {
    --_mix-33: color-mix(in oklch, var(--_fg), var(--_bg) 33%);
  }
}
.aui-tool-fallback-trigger-shimmer {
  --_mix-17: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-fallback-trigger-shimmer {
    --_mix-17: color-mix(in oklch, var(--_fg), var(--_bg) 17%);
  }
}
.aui-tool-fallback-trigger-shimmer {
  --_mix-4: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-fallback-trigger-shimmer {
    --_mix-4: color-mix(in oklch, var(--_fg), var(--_bg) 4%);
  }
}
.aui-tool-fallback-trigger-shimmer {
  background: linear-gradient( calc(90deg + var(--shimmer-angle)), var(--_bg) calc(var(--_position) - var(--_spread) * 0.5), var(--_mix-96) calc(var(--_position) - var(--_spread) * 0.44), var(--_mix-83) calc(var(--_position) - var(--_spread) * 0.37), var(--_mix-67) calc(var(--_position) - var(--_spread) * 0.31), var(--_mix-50) calc(var(--_position) - var(--_spread) * 0.25), var(--_mix-33) calc(var(--_position) - var(--_spread) * 0.19), var(--_mix-17) calc(var(--_position) - var(--_spread) * 0.12), var(--_mix-4) calc(var(--_position) - var(--_spread) * 0.06), var(--_fg) var(--_position), var(--_mix-4) calc(var(--_position) + var(--_spread) * 0.06), var(--_mix-17) calc(var(--_position) + var(--_spread) * 0.12), var(--_mix-33) calc(var(--_position) + var(--_spread) * 0.19), var(--_mix-50) calc(var(--_position) + var(--_spread) * 0.25), var(--_mix-67) calc(var(--_position) + var(--_spread) * 0.31), var(--_mix-83) calc(var(--_position) + var(--_spread) * 0.37), var(--_mix-96) calc(var(--_position) + var(--_spread) * 0.44), var(--_bg) calc(var(--_position) + var(--_spread) * 0.5) ) 0 0 / var(--_bg-width) 100% no-repeat;
  animation: tw-shimmer 1s linear 0s infinite backwards;
  animation-duration: calc((var(--_duration) + var(--_repeat-delay)) * 1ms);
}
@media (prefers-reduced-motion: reduce) {
  .aui-tool-fallback-trigger-shimmer {
    animation: none;
  }
}
.aui-tool-group-content {
  position: relative;
  overflow: hidden;
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  --tw-outline-style: none;
  outline-style: none;
  --tw-ease: var(--ease-out);
  transition-timing-function: var(--ease-out);
}
.aui-tool-group-content[data-state="closed"] {
  animation: collapsible-up var(--tw-animation-duration,var(--tw-duration,.2s))var(--tw-ease,ease-out)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-tool-group-content[data-state="open"] {
  animation: collapsible-down var(--tw-animation-duration,var(--tw-duration,.2s))var(--tw-ease,ease-out)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
}
.aui-tool-group-content[data-state="closed"] {
  animation-fill-mode: forwards;
  --tw-animation-fill-mode: forwards;
}
.aui-tool-group-content[data-state="closed"] {
  pointer-events: none;
}
.aui-tool-group-content[data-state="open"] {
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
}
.aui-tool-group-content[data-state="closed"] {
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
}
.aui-tool-group-content {
  margin-top: calc(var(--spacing) * 2);
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 2);
}
.aui-tool-group-content:is(:where(.group\\/tool-group-root)[data-variant="outline"] *) {
  margin-top: calc(var(--spacing) * 3);
}
.aui-tool-group-content:is(:where(.group\\/tool-group-root)[data-variant="outline"] *) {
  border-top-style: var(--tw-border-style);
  border-top-width: 1px;
}
.aui-tool-group-content:is(:where(.group\\/tool-group-root)[data-variant="outline"] *) {
  padding-inline: calc(var(--spacing) * 4);
}
.aui-tool-group-content:is(:where(.group\\/tool-group-root)[data-variant="outline"] *) {
  padding-top: calc(var(--spacing) * 3);
}
.aui-tool-group-content:is(:where(.group\\/tool-group-root)[data-variant="muted"] *) {
  margin-top: calc(var(--spacing) * 3);
}
.aui-tool-group-content:is(:where(.group\\/tool-group-root)[data-variant="muted"] *) {
  border-top-style: var(--tw-border-style);
  border-top-width: 1px;
}
.aui-tool-group-content:is(:where(.group\\/tool-group-root)[data-variant="muted"] *) {
  padding-inline: calc(var(--spacing) * 4);
}
.aui-tool-group-content:is(:where(.group\\/tool-group-root)[data-variant="muted"] *) {
  padding-top: calc(var(--spacing) * 3);
}
.aui-tool-group-trigger {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) * 2);
  font-size: var(--text-sm);
  line-height: var(--tw-leading, var(--text-sm--line-height));
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
}
.aui-tool-group-trigger:is(:where(.group\\/tool-group-root)[data-variant="outline"] *) {
  width: 100%;
}
.aui-tool-group-trigger:is(:where(.group\\/tool-group-root)[data-variant="outline"] *) {
  padding-inline: calc(var(--spacing) * 4);
}
.aui-tool-group-trigger:is(:where(.group\\/tool-group-root)[data-variant="muted"] *) {
  width: 100%;
}
.aui-tool-group-trigger:is(:where(.group\\/tool-group-root)[data-variant="muted"] *) {
  padding-inline: calc(var(--spacing) * 4);
}
.aui-tool-group-trigger-chevron {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
  flex-shrink: 0;
  transition-property: transform, translate, scale, rotate;
  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
  transition-duration: var(--tw-duration, var(--default-transition-duration));
  --tw-duration: var(--animation-duration);
  transition-duration: var(--animation-duration);
  --tw-ease: var(--ease-out);
  transition-timing-function: var(--ease-out);
}
.aui-tool-group-trigger-chevron:is(:where(.group\\/trigger)[data-state="closed"] *) {
  rotate: calc(90deg * -1);
}
.aui-tool-group-trigger-chevron:is(:where(.group\\/trigger)[data-state="open"] *) {
  rotate: 0deg;
}
.aui-tool-group-trigger-label-wrapper {
  position: relative;
  display: inline-block;
  text-align: left;
  --tw-leading: 1;
  line-height: 1;
  --tw-font-weight: var(--font-weight-medium);
  font-weight: var(--font-weight-medium);
}
.aui-tool-group-trigger-label-wrapper:is(:where(.group\\/tool-group-root)[data-variant="outline"] *) {
  flex-grow: 1;
}
.aui-tool-group-trigger-label-wrapper:is(:where(.group\\/tool-group-root)[data-variant="muted"] *) {
  flex-grow: 1;
}
.aui-tool-group-trigger-loader {
  width: calc(var(--spacing) * 4);
  height: calc(var(--spacing) * 4);
  flex-shrink: 0;
  animation: var(--animate-spin);
}
.aui-tool-group-trigger-shimmer {
  pointer-events: none;
  position: absolute;
  inset: calc(var(--spacing) * 0);
  --_gradient-width: calc(var(--_spread) + var(--shimmer-track-height) * tan(var(--shimmer-angle)));
  --_active-distance: calc(var(--shimmer-track-width, 200px) + var(--_gradient-width));
  --_duration: var(--shimmer-duration, calc(var(--_active-distance) / var(--_speed) / 1px * 1000));
  --_repeat-delay: var(--shimmer-repeat-delay, calc(20000 / var(--_speed)));
  --_repeat-delay-px: calc(var(--_repeat-delay) * var(--_active-distance) / var(--_duration));
  --_xy-offset-px: calc((var(--shimmer-x, 0) + var(--shimmer-y, 0) * tan(var(--shimmer-angle))) * 1px);
  --_bg-width: calc(
    100% +
    var(--shimmer-track-width, 100%) +
    var(--_gradient-width) +
    var(--_repeat-delay-px)
  );
  --_position: calc(
    var(--shimmer-track-width, (100% - var(--_gradient-width) - var(--_repeat-delay-px)) / 2)
    + var(--_gradient-width) / 2
    + var(--_repeat-delay-px)
    - var(--_xy-offset-px)
  );
}
.aui-tool-group-trigger-shimmer:not(.shimmer-bg) {
  --_speed: var(--shimmer-speed, 200);
  --_spread: var(--shimmer-spread, calc(4ch + 80px));
  --_bg: currentColor;
  --_fg: var(--shimmer-color, oklch(from currentColor l c h / calc(alpha * 0.2)));
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.aui-tool-group-trigger-shimmer.shimmer-bg {
  --_speed: var(--shimmer-speed, 1000);
  --_spread: var(--shimmer-spread, 480px);
  --_bg: transparent;
  --_fg: var(--shimmer-color, oklch(from currentColor 0 c h / 0.06));
}
.aui-tool-group-trigger-shimmer:where(.dark, .dark *):not(.shimmer-bg) {
  --_fg: var(--shimmer-color, oklch(from currentColor max(0.8, calc(l + 0.4)) c h / calc(alpha + 0.4)));
}
.aui-tool-group-trigger-shimmer:where(.dark, .dark *).shimmer-bg {
  --_fg: var(--shimmer-color, oklch(from currentColor 0 c h / 0.30));
}
.aui-tool-group-trigger-shimmer {
  @-moz-document url-prefix() {
    --_duration: var(--shimmer-duration, calc(375000 / var(--_speed)));
  }
  --_mix-96: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-group-trigger-shimmer {
    --_mix-96: color-mix(in oklch, var(--_fg), var(--_bg) 96%);
  }
}
.aui-tool-group-trigger-shimmer {
  --_mix-83: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-group-trigger-shimmer {
    --_mix-83: color-mix(in oklch, var(--_fg), var(--_bg) 83%);
  }
}
.aui-tool-group-trigger-shimmer {
  --_mix-67: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-group-trigger-shimmer {
    --_mix-67: color-mix(in oklch, var(--_fg), var(--_bg) 67%);
  }
}
.aui-tool-group-trigger-shimmer {
  --_mix-50: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-group-trigger-shimmer {
    --_mix-50: color-mix(in oklch, var(--_fg), var(--_bg) 50%);
  }
}
.aui-tool-group-trigger-shimmer {
  --_mix-33: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-group-trigger-shimmer {
    --_mix-33: color-mix(in oklch, var(--_fg), var(--_bg) 33%);
  }
}
.aui-tool-group-trigger-shimmer {
  --_mix-17: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-group-trigger-shimmer {
    --_mix-17: color-mix(in oklch, var(--_fg), var(--_bg) 17%);
  }
}
.aui-tool-group-trigger-shimmer {
  --_mix-4: var(--_fg);
}
@supports (color: color-mix(in lab, red, red)) {
  .aui-tool-group-trigger-shimmer {
    --_mix-4: color-mix(in oklch, var(--_fg), var(--_bg) 4%);
  }
}
.aui-tool-group-trigger-shimmer {
  background: linear-gradient( calc(90deg + var(--shimmer-angle)), var(--_bg) calc(var(--_position) - var(--_spread) * 0.5), var(--_mix-96) calc(var(--_position) - var(--_spread) * 0.44), var(--_mix-83) calc(var(--_position) - var(--_spread) * 0.37), var(--_mix-67) calc(var(--_position) - var(--_spread) * 0.31), var(--_mix-50) calc(var(--_position) - var(--_spread) * 0.25), var(--_mix-33) calc(var(--_position) - var(--_spread) * 0.19), var(--_mix-17) calc(var(--_position) - var(--_spread) * 0.12), var(--_mix-4) calc(var(--_position) - var(--_spread) * 0.06), var(--_fg) var(--_position), var(--_mix-4) calc(var(--_position) + var(--_spread) * 0.06), var(--_mix-17) calc(var(--_position) + var(--_spread) * 0.12), var(--_mix-33) calc(var(--_position) + var(--_spread) * 0.19), var(--_mix-50) calc(var(--_position) + var(--_spread) * 0.25), var(--_mix-67) calc(var(--_position) + var(--_spread) * 0.31), var(--_mix-83) calc(var(--_position) + var(--_spread) * 0.37), var(--_mix-96) calc(var(--_position) + var(--_spread) * 0.44), var(--_bg) calc(var(--_position) + var(--_spread) * 0.5) ) 0 0 / var(--_bg-width) 100% no-repeat;
  animation: tw-shimmer 1s linear 0s infinite backwards;
  animation-duration: calc((var(--_duration) + var(--_repeat-delay)) * 1ms);
}
@media (prefers-reduced-motion: reduce) {
  .aui-tool-group-trigger-shimmer {
    animation: none;
  }
}
.aui-user-action-bar-root {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.aui-user-action-bar-wrapper {
  position: absolute;
  top: calc(1/2 * 100%);
  left: calc(var(--spacing) * 0);
  --tw-translate-x: -100%;
  --tw-translate-y: calc(calc(1/2 * 100%) * -1);
  translate: var(--tw-translate-x) var(--tw-translate-y);
  padding-right: calc(var(--spacing) * 2);
}
.aui-user-action-edit {
  padding: calc(var(--spacing) * 4);
}
.aui-user-branch-picker {
  grid-column: 1 / -1;
  grid-column-start: 1;
  grid-row-start: 3;
  margin-right: calc(var(--spacing) * -1);
  justify-content: flex-end;
}
.aui-user-message-attachments-end {
  grid-column: 1 / -1;
  grid-column-start: 1;
  grid-row-start: 1;
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: flex-end;
  gap: calc(var(--spacing) * 2);
}
.aui-user-message-content {
  border-radius: var(--radius-2xl);
  background-color: var(--color-muted);
  padding-inline: calc(var(--spacing) * 4);
  padding-block: calc(var(--spacing) * 2.5);
  overflow-wrap: break-word;
  color: var(--color-foreground);
}
.aui-user-message-content-wrapper {
  position: relative;
  grid-column-start: 2;
  min-width: calc(var(--spacing) * 0);
}
.aui-user-message-root {
  margin-inline: auto;
  display: grid;
  width: 100%;
  max-width: var(--thread-max-width);
  animation: enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
  grid-auto-rows: auto;
  grid-template-columns: minmax(72px,1fr) auto;
  align-content: flex-start;
  row-gap: calc(var(--spacing) * 2);
  padding-inline: calc(var(--spacing) * 2);
  padding-block: calc(var(--spacing) * 3);
  --tw-duration: 150ms;
  transition-duration: 150ms;
  --tw-enter-opacity: 0;
  --tw-enter-translate-y: calc(1*var(--spacing));
}
.aui-user-message-root:where(>*) {
  grid-column-start: 2;
}
@property --tw-border-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}
@property --tw-font-weight {
  syntax: "*";
  inherits: false;
}
@property --tw-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-inset-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-inset-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-inset-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-ring-color {
  syntax: "*";
  inherits: false;
}
@property --tw-ring-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-inset-ring-color {
  syntax: "*";
  inherits: false;
}
@property --tw-inset-ring-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-ring-inset {
  syntax: "*";
  inherits: false;
}
@property --tw-ring-offset-width {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}
@property --tw-ring-offset-color {
  syntax: "*";
  inherits: false;
  initial-value: #fff;
}
@property --tw-ring-offset-shadow {
  syntax: "*";
  inherits: false;
  initial-value: 0 0 #0000;
}
@property --tw-duration {
  syntax: "*";
  inherits: false;
}
@property --tw-ease {
  syntax: "*";
  inherits: false;
}
@property --tw-leading {
  syntax: "*";
  inherits: false;
}
@property --tw-border-spacing-x {
  syntax: "<length>";
  inherits: false;
  initial-value: 0;
}
@property --tw-border-spacing-y {
  syntax: "<length>";
  inherits: false;
  initial-value: 0;
}
@property --tw-scale-x {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-scale-y {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-scale-z {
  syntax: "*";
  inherits: false;
  initial-value: 1;
}
@property --tw-translate-x {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-translate-y {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-translate-z {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@keyframes enter {
  from {
    opacity: var(--tw-enter-opacity,1);
    transform: translate3d(var(--tw-enter-translate-x,0),var(--tw-enter-translate-y,0),0)scale3d(var(--tw-enter-scale,1),var(--tw-enter-scale,1),var(--tw-enter-scale,1))rotate(var(--tw-enter-rotate,0));
    filter: blur(var(--tw-enter-blur,0));
  }
}
@keyframes exit {
  to {
    opacity: var(--tw-exit-opacity,1);
    transform: translate3d(var(--tw-exit-translate-x,0),var(--tw-exit-translate-y,0),0)scale3d(var(--tw-exit-scale,1),var(--tw-exit-scale,1),var(--tw-exit-scale,1))rotate(var(--tw-exit-rotate,0));
    filter: blur(var(--tw-exit-blur,0));
  }
}
@keyframes accordion-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height,var(--bits-accordion-content-height,var(--reka-accordion-content-height,var(--kb-accordion-content-height,var(--ngp-accordion-content-height,auto)))));
  }
}
@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height,var(--bits-accordion-content-height,var(--reka-accordion-content-height,var(--kb-accordion-content-height,var(--ngp-accordion-content-height,auto)))));
  }
  to {
    height: 0;
  }
}
@keyframes collapsible-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-collapsible-content-height,var(--bits-collapsible-content-height,var(--reka-collapsible-content-height,var(--kb-collapsible-content-height,auto))));
  }
}
@keyframes collapsible-up {
  from {
    height: var(--radix-collapsible-content-height,var(--bits-collapsible-content-height,var(--reka-collapsible-content-height,var(--kb-collapsible-content-height,auto))));
  }
  to {
    height: 0;
  }
}
@keyframes tw-shimmer {
  from {
    background-position: 100% 0;
  }
}
@layer properties {
  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
    :root, :host {
      --shimmer-track-height: 200px;
      --shimmer-angle: 15deg;
    }
    *, ::before, ::after, ::backdrop {
      --tw-animation-delay: 0s;
      --tw-animation-direction: normal;
      --tw-animation-duration: initial;
      --tw-animation-fill-mode: none;
      --tw-animation-iteration-count: 1;
      --tw-enter-blur: 0;
      --tw-enter-opacity: 1;
      --tw-enter-rotate: 0;
      --tw-enter-scale: 1;
      --tw-enter-translate-x: 0;
      --tw-enter-translate-y: 0;
      --tw-exit-blur: 0;
      --tw-exit-opacity: 1;
      --tw-exit-rotate: 0;
      --tw-exit-scale: 1;
      --tw-exit-translate-x: 0;
      --tw-exit-translate-y: 0;
      --tw-border-style: solid;
      --tw-font-weight: initial;
      --tw-shadow: 0 0 #0000;
      --tw-shadow-color: initial;
      --tw-shadow-alpha: 100%;
      --tw-inset-shadow: 0 0 #0000;
      --tw-inset-shadow-color: initial;
      --tw-inset-shadow-alpha: 100%;
      --tw-ring-color: initial;
      --tw-ring-shadow: 0 0 #0000;
      --tw-inset-ring-color: initial;
      --tw-inset-ring-shadow: 0 0 #0000;
      --tw-ring-inset: initial;
      --tw-ring-offset-width: 0px;
      --tw-ring-offset-color: #fff;
      --tw-ring-offset-shadow: 0 0 #0000;
      --tw-duration: initial;
      --tw-ease: initial;
      --tw-leading: initial;
      --tw-border-spacing-x: 0;
      --tw-border-spacing-y: 0;
      --tw-scale-x: 1;
      --tw-scale-y: 1;
      --tw-scale-z: 1;
      --tw-translate-x: 0;
      --tw-translate-y: 0;
      --tw-translate-z: 0;
    }
  }
}
`;var rp=`/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   HITL dashboard shell \u2014 stockbroker chat chrome.

   PALETTE: the DeepSeek Harness design tokens (\`--dsw-alias-*\`).

   The dashboard is a page inside the DSH web UI, so it must look like part
   of that UI rather than a guest in it. Those tokens are live on the host
   page and resolve per theme, so binding to them is what makes this shell
   follow light/dark, density and any future palette change automatically.
   Every hex that used to be hardcoded here (a Cursor Dark palette) is now a
   token; the fallbacks only matter if this file is ever rendered outside the
   harness, which is what keeps the standalone path honest.

   Layout still stockbroker-like: sticky composer, ~44rem thread, pill ctls.
   CSP-safe: system fonts only (no Google Fonts).
   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

/* SCOPE. This file is injected into the HOST's <head>, so every rule that can
   match something has to be anchored to a root we own. There are exactly two
   mount paths, and two roots between them:

     .fl-page        the page inside the DSH UI (web/entry.tsx)
     .fl-standalone  the standalone page, which owns <html>/<body> outright
                     (src/dashboard-page.ts puts the class on <html>)

   The aliases used to be declared on \`body\` \u2014 correct only while this file
   lived on its own origin, where \`body\` WAS the dashboard. Folded into the
   host, that same block restyled the harness: its background, its text ramp,
   its 15 generic custom properties. Declared on the roots instead, the
   declarations still resolve per theme (the harness keeps \`--dsw-alias-*\` on
   \`body\`, an ancestor of \`.fl-page\`, so it inherits them) and still carry
   their fallbacks on the standalone page.

   \`:where()\` is the scope prefix throughout because it adds ZERO specificity:
   \`.fl-page button\` would outrank the plugin's own \`.fl-actions button\`
   rules, while \`:where(.fl-page) button\` keeps the original \`button\`
   specificity and changes nothing about the cascade inside the page. */
:where(.fl-page, .fl-standalone) {
  /* Harness surfaces. Layer 1 is the page, 2/3 are raised strips. */
  --bg: var(--dsw-alias-bg-base, #101114);
  --panel: var(--dsw-alias-bg-layer-1, #15161a);
  --panel-2: var(--dsw-alias-bg-layer-2, #1b1c21);
  --border: var(--dsw-alias-border-l2, #2f3035);
  --border-soft: var(--dsw-alias-border-l1, #26272b);

  /* Harness text ramp. */
  --text: var(--dsw-alias-label-primary, #e6e6e6);
  --muted: var(--dsw-alias-label-secondary, #b9b9c0);
  --faint: var(--dsw-alias-label-tertiary, #9a9aa0);

  /* Accent + interactive states, from the same vocabulary the sidebar and
     composer buttons already use. */
  --accent: var(--dsw-alias-link, #7fb0ff);
  --accent-bright: var(--dsw-alias-brand-primary, #9fc4ff);
  --badge: var(--dsw-alias-label-secondary, #b9b9c0);
  --hover: var(--dsw-alias-interactive-bg-hover, rgba(127, 176, 255, 0.08));
  --selection: var(--dsw-alias-interactive-bg-active, rgba(127, 176, 255, 0.14));
  --user-bubble: var(--dsw-alias-bg-layer-3, #202127);

  /* Status colors \u2014 the harness has one token per state, so a run's health
     reads the same here as it does everywhere else. */
  --ok: var(--dsw-alias-state-success-primary, #70b489);
  --ok-deep: var(--dsw-alias-state-success-primary, #3fa266);
  --bad: var(--dsw-alias-state-error-primary, #fc6b83);
  --bad-deep: var(--dsw-alias-state-error-primary, #e34671);
  --warn: var(--dsw-alias-state-warn-primary, #f1b467);
  --warn-deep: var(--dsw-alias-state-warn-primary, #d2943e);

  --composer: var(--dsw-alias-bg-layer-2, #1b1c21);
  --header-h: 56px;
  --radius-doc: 8px;
  --radius-ctl: 999px;
  --radius-chat: 1.25rem;
  --thread-max-width: 44rem;
  --font-sans: var(--dsw-font-family, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

/* The universal reset, anchored: the host runs its own, and a plugin-wide
   \`*\` would silently redefine box-sizing for the whole product. */
:where(.fl-page, .fl-standalone),
:where(.fl-page, .fl-standalone) * { box-sizing: border-box; }

/* Page furniture. These three are the standalone page's own document, and are
   exactly the rules that restyled the host when they were unscoped. */
html.fl-standalone { scroll-padding-top: calc(var(--header-h) + 12px); }

html.fl-standalone body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 14px/1.5 var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* \u2500\u2500 skip link \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.skip-link {
  position: absolute;
  left: 12px;
  top: -48px;
  z-index: 5;
  padding: 8px 14px;
  background: var(--panel);
  border: 1px solid var(--accent);
  border-radius: var(--radius-ctl);
  color: var(--text);
  text-decoration: none;
  transition: top 120ms ease;
}
.skip-link:focus { top: 8px; }

/* \u2500\u2500 header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fl-standalone header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  min-height: var(--header-h);
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  position: sticky;
  top: 0;
  z-index: 10;
}
.fl-standalone header .brand {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.fl-standalone header h1 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
}
.fl-standalone header .sep { color: var(--faint); }
.fl-standalone header .product {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--muted);
}
.fl-standalone header .header-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
  background: var(--bad);
  flex: none;
}
.dot.on { background: var(--ok); }
.conn-wrap {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.badge {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--muted);
  background: transparent;
  white-space: nowrap;
}
.badge.answer {
  color: var(--text);
  background: color-mix(in srgb, var(--ok-deep) 20%, var(--panel));
  border-color: color-mix(in srgb, var(--ok-deep) 45%, var(--border));
  font-weight: 650;
}
.badge.badge-pending {
  color: var(--text);
  background: color-mix(in srgb, var(--warn) 14%, var(--panel));
  border-color: color-mix(in srgb, var(--warn) 40%, var(--border));
  font-weight: 650;
}
.badge.badge-pending[data-count="0"] {
  color: var(--muted);
  background: transparent;
  border-color: var(--border);
  font-weight: 500;
}

/* Cursor-like tags (run route / judge / feed kinds / signal severity) */
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.3;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  /* A run's route/judge tag carries information a human reads, so it uses the
     primary label: tertiary measured 3.7:1 at this size, under the 4.5 floor. */
  color: var(--text);
  background: var(--hover);
  white-space: nowrap;
  vertical-align: middle;
}
.tag-accent {
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 20%, var(--panel));
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
}
.tag-ok {
  color: var(--text);
  background: color-mix(in srgb, var(--ok-deep) 20%, var(--panel));
  border-color: color-mix(in srgb, var(--ok-deep) 45%, var(--border));
}
.tag-bad {
  color: var(--text);
  background: color-mix(in srgb, var(--bad-deep) 20%, var(--panel));
  border-color: color-mix(in srgb, var(--bad-deep) 45%, var(--border));
}
.tag-warn {
  color: var(--text);
  background: color-mix(in srgb, var(--warn-deep) 20%, var(--panel));
  border-color: color-mix(in srgb, var(--warn-deep) 45%, var(--border));
}
.tag-cyan {
  color: var(--text);
  background: color-mix(in srgb, var(--badge) 20%, var(--panel));
  border-color: color-mix(in srgb, var(--badge) 45%, var(--border));
}
.tag-ghost {
  color: var(--muted);
  background: transparent;
  border-color: var(--border);
}

/* \u2500\u2500 main frame \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fl-standalone main {
  max-width: 1480px;
  margin: 0 auto;
  padding: 16px 20px 48px;
}

/* Responsive by CONTAINER, not by viewport.
   The dashboard is a main-column page, so its width is the viewport minus the
   harness sidebar and right bar \u2014 a viewport query answered a question nobody
   asked, and on a 1600px window the three columns were crammed into ~1000px
   and never collapsed. \`@container\` asks the question that matters: how wide is
   THIS page. Same pattern as \`ui-deliverables\` and \`ui-trajectory\`, which set
   \`container-type: inline-size\` on their page root for exactly this reason. */
/* The page root is the container, and that placement is load-bearing. Declared
   on the dashboard alone, the container described only the approval thread \u2014 the
   start control and the settings form sit outside it, so their own responsive
   rules (\`@container fl-dashboard (max-width: 520px)\`) could never match and the
   narrow layout silently never applied. One page, one container. */
/* \`size\`, not \`inline-size\`: the thread's height floor below is a \`cqh\` query,
   and \`inline-size\` publishes no height to resolve it against, so the floor
   would be invalid and the thread would size to its content. The usual risk of
   a size container \u2014 height growing with content \u2014 cannot apply here: the page
   is \`height: 100%\` (plugin.css) and scrolls internally, so its height is
   decided by the window and never by what is in it. */
.fl-page {
  container-type: size;
  container-name: fl-dashboard;
}

/* The STANDALONE page is the other front end onto this sheet, and it needed the
   same treatment for the same reason. Its thread is a direct child of \`#root\`,
   not of \`.fl-page\`, so nothing above it was a query container at all \u2014 and an
   uncontained \`cqh\` resolves against the SMALLEST container, which is the
   viewport. So the standalone thread's floor was still measuring the WINDOW on
   the second front end, long after the host page had stopped: at a 1280x300
   window it came out 180px, exactly 60% of the window, and the composer \u2014 the
   reason anybody opens this page \u2014 sat 115px below the fold.
   Two things make it real, and both are load-bearing:

   - the height has to be on the CONTAINER element, not on \`<html>\`. \`size\`
     containment means the box's size cannot come from its content, and the root
     has no content to take a size from: measured, \`html\` came out **0px** tall
     and every \`cqh\` on the page resolved to 0, which silently deleted the
     thread's floor entirely rather than merely mis-sizing it.
   - \`html.fl-standalone body\`, not \`body.fl-standalone\`. The class is on \`<html>\`
     (src/dashboard-page.ts), so the short selector matches nothing and every rule
     written that way is dead with no diagnostic at all \u2014 measured
     \`body containerType=normal\` against a stylesheet that plainly declared it.

   \`100dvh\` rather than \`vh\`: this page is a browser tab a person can resize
   mid-read. */
html.fl-standalone body {
  container-type: size;
  container-name: fl-dashboard;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* \`main\` is the scroller, and that is the honest answer for this page: three
   panes of real content do not fit in a 300px window, and squeezing the thread to
   fit would hide the composer rather than move it. Measured at a 1280x300 window
   after this: \`main\` scrolls 130px and scrolling it puts the composer at
   bottom=285 in a 300px window.
   \u2026and the page scrolls rather than each pane trying to scroll itself, because
   the panes have no height to scroll within: the shell is \`display: grid\` with
   auto rows, so it is 358px of content inside a 112px page. The content boxes are
   left as they are; what this fixes is that the SCROLLER is one, reachable, and
   not the document's. */
html.fl-standalone main {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
html.fl-standalone #root {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dashboard-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  /* min-width: 0 is the harness's own grid rule (see AppFrame): without it a
     grid item refuses to shrink below its content and pushes the page wide. */
  min-width: 0;
}

/* Two columns: workspaces stay beside the thread, the run rail moves below it. */
@container fl-dashboard (min-width: 760px) {
  .dashboard-shell {
    grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
    gap: 20px;
  }
  /* \`cqh\`, not \`vh\`: a sticky column fills the height of the thing it is
     sticky within, and that thing is the PAGE, not the window. \`100vh\` here
     made a column taller than its own scroll container by the height of the
     host's sidebar rail and the frame's top clearance \u2014 which is the page
     growing a scrollbar it did not have. \`top\` keeps \`var(--header-h)\`: sticky
     is genuinely a window concept, and on this page the header is the
     standalone page's own bar. */
  .sidebar {
    position: sticky;
    top: calc(var(--header-h) + 12px);
    height: calc(100cqh - var(--header-h) - 28px);
    max-height: calc(100cqh - var(--header-h) - 28px);
    overflow: hidden;
  }
  /* No \`70vh\` here: a viewport unit capping a page-height element is wrong at
     every width, and at this one the rail is a full-width row under the thread
     rather than a column beside it. The pane scrolls inside itself instead
     (\`min-height: 0\` + the pane's own scroller). */
  .rail { grid-column: 1 / -1; max-height: none; overflow: hidden; }
}

/* Three columns: workspaces \xB7 thread \xB7 runs, each in its own track. */
@container fl-dashboard (min-width: 1100px) {
  .dashboard-shell {
    grid-template-columns: minmax(220px, 260px) minmax(0, 1.5fr) minmax(280px, 340px);
    gap: 24px;
  }
  .rail {
    grid-column: auto;
    position: sticky;
    top: calc(var(--header-h) + 12px);
    height: calc(100cqh - var(--header-h) - 28px);
    max-height: calc(100cqh - var(--header-h) - 28px);
    overflow: hidden;
  }
}

/* Below 760px the reading order is the argument order \u2014 thread, then runs, then
   workspaces. The source order is workspaces-first, so placement is explicit
   rather than left to grid auto-placement. Sticky columns are also meaningless
   once everything is one scroll, so they are released here. */
@container fl-dashboard (max-width: 759px) {
  .dashboard-shell { gap: 16px; }
  .stage { order: 1; }
  .rail { order: 2; grid-column: auto; max-height: none; overflow: visible; }
  .sidebar { order: 3; }
  .sidebar,
  .rail { position: static; height: auto; max-height: none; overflow: visible; }
  /* \`overflow: visible\` on the column is what released the PANES' own height
     too, and a pane with \`overflow: hidden\` and no height cap then grows to
     its content: the activity feed was 941px tall (11 entries) inside a 744px
     page, and the page scrolled 1483px past the thread to reach it. The panes
     keep their own scrollers \u2014 they are lists, and a list that scrolls inside
     its card is what the two-column layout does too (\`max-height: 70vh\` there,
     \`calc(100cqh - \u2026)\` for the sticky columns). At this width the page scrolls;
     the pane does not need to. */
  .sidebar .pane-activity,
  .rail .pane-runs {
    max-height: calc(100cqh - var(--header-h) - 28px);
    overflow: hidden;
  }
}

.stage { min-width: 0; }
.sidebar,
.rail {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}
.sidebar section,
.rail section,
.stage section { min-width: 0; }

/* Left column: workspace tree on top, activity fills remaining height */
.sidebar-top {
  flex: 0 0 auto;
  max-height: 42%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.sidebar-top #workspaces {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sidebar-top #workspaces .section-head {
  flex: 0 0 auto;
}
.sidebar-top .ws-tree {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  scrollbar-gutter: stable;
}
.sidebar .pane-activity {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.rail .pane-runs {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Pane chrome: sticky head + scroll body */
.pane {
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-doc);
  min-height: 0;
  overflow: hidden;
}
.pane-head {
  flex: 0 0 auto;
  margin: 0 !important;
  padding: 10px 12px 8px !important;
  border-bottom: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--panel-2) 55%, var(--panel));
  position: sticky;
  top: 0;
  z-index: 1;
  gap: 8px;
}
.pane-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 8px 10px 14px;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  scrollbar-gutter: stable;
}

/* The harness's scrollbar skin, not a second one. \`ui-theme\`'s
   \`scrollbar.css\` already styles every \`::-webkit-scrollbar*\` pseudo-element
   in the document; that sheet is what the host's own panes scroll with. This
   file's copy drew an 8px accent-gradient thumb with its own hover \u2014 the same
   scroll, visibly a different widget, in a page sitting beside the host's.
   The one thing the plugin's panes own is elevation, so the thumb pair is
   rebound to the l2 tokens and the geometry is left to the host's sheet. */
:where(.fl-page, .fl-standalone) .scroll-beauty,
:where(.fl-page, .fl-standalone) .pane-scroll {
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
}

/* Compact left chrome \u2014 Cursor-style activity bar feel */
.sidebar #workspaces .section-head {
  margin-bottom: 8px;
  padding-bottom: 6px;
}
.sidebar .ws-tree {
  border-color: var(--border-soft);
  background: color-mix(in srgb, var(--panel) 88%, transparent);
}
.sidebar .feed-item {
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px 8px;
  padding: 7px 6px;
  font-size: 12.5px;
}
.sidebar .feed-item .feed-t { grid-column: 1 / -1; padding-top: 0; }
.sidebar .feed-item .feed-k { justify-self: start; }
.sidebar .feed-text { grid-column: 1 / -1; }

/* \u2500\u2500 section heads \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-soft);
}
/* The shell's own section heads (its bare <h2>s). Scoped by class as well as
   by type: an h2 that is a PAGE title \u2014 \`.fl-title\` in plugin.css \u2014 matched
   this rule, and since both are class-level, the sheet order decided it. That
   put \`text-transform: uppercase\` on a 20px title the plugin's own rule never
   asked for, and a live instance measured the page title as "START A LOOP" at
   weight 500. The page title now carries its own text-transform. */
:where(.fl-page, .fl-standalone) .section-head h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted);
}
.section-count {
  font-family: var(--font-mono);
  font-size: 12px;
  /* --faint (label-tertiary) measured 3.7:1 on the light surface \u2014 below
     AA for 12px body text. The count is scanned for, so it takes the
     secondary label, which clears 4.5:1 in both themes. */
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.section-count.hot {
  color: var(--text);
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, var(--badge)) 20%, var(--panel));
  border-radius: 999px;
  padding: 1px 8px;
  font-weight: 650;
}

/* \u2500\u2500 empty / loading / help \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.empty {
  color: var(--muted);
  font-size: 13.5px;
  margin: 0;
}
.empty-plate {
  border: 1px dashed var(--border);
  border-radius: var(--radius-doc);
  background: var(--panel);
  padding: 28px 24px;
  text-align: center;
}
.empty-plate .empty-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.empty-plate .hint { margin: 0; }
.hint {
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.55;
}
details.help {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--border-soft);
}
.fl-standalone details summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 12.5px;
  outline-offset: 3px;
}
.fl-standalone details summary:hover { color: var(--text); }
.fl-standalone details .hint { margin-top: 10px; max-width: 72ch; }

:where(.fl-page, .fl-standalone) code {
  font-family: var(--font-mono);
  font-size: 0.92em;
  background: var(--panel-2);
  border: 1px solid var(--border-soft);
  padding: 1px 5px;
  border-radius: 4px;
}

#auth {
  display: none;
  background: color-mix(in srgb, var(--bad-deep) 12%, var(--panel));
  border: 1px solid color-mix(in srgb, var(--bad) 55%, var(--border));
  color: var(--text);
  padding: 14px 16px;
  border-radius: var(--radius-doc);
  margin-bottom: 18px;
  font-size: 13.5px;
  line-height: 1.55;
}

/* \u2500\u2500 decision cards (the primary surface) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-doc);
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.03) inset;
}
.card + .card { margin-top: 0; }

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}
.asked {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.card .tool {
  font-family: var(--font-mono);
  font-weight: 650;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: var(--text);
  margin: 0 0 4px;
  overflow-wrap: anywhere;
}
.card .meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  color: var(--muted);
  font-size: 12px;
  font-family: var(--font-mono);
  margin: 0 0 12px;
}
.card .meta .meta-k {
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10.5px;
  align-self: center;
}
.card .meta .meta-v { overflow-wrap: anywhere; }

.card .reason {
  white-space: pre-wrap;
  background: var(--panel-2);
  border: 1px solid var(--border-soft);
  border-left: 3px solid var(--warn);
  border-radius: var(--radius-doc);
  padding: 10px 12px;
  font-size: 13.5px;
  line-height: 1.55;
  margin: 0 0 12px;
  max-height: 180px;
  overflow: auto;
}

.row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.actions {
  margin-top: 4px;
  gap: 10px;
}

.busy-note {
  font-size: 12.5px;
  color: var(--muted);
}

/* The two decision buttons on an approval card. Deliberately NOT a bare
   \`button\` rule: that one matched every button the plugin renders inside the
   page, so its \`min-height: 40px\` and \`padding: 9px 18px\` decided the start
   control's and the tab row's geometry by cascade instead of by the class that
   describes them. A live instance measured the 32px start button at 40px and
   the 28px tab at 40px, because a min-height cannot be beaten by a smaller
   height. Harness metrics, not 40px: 36px tall, 14px/22px, \`radius-md\`
   (\`ui-primitives\` \`Button.module.css\`, \`md\`). */
.allow,
.reject {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: var(--dsw-radius-md);
  font: inherit;
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, opacity 150ms ease;
}
.allow:hover:not(:disabled) { background: var(--ok); }
.reject:hover:not(:disabled) { background: color-mix(in srgb, var(--bad-deep) 14%, transparent); }
.allow:focus-visible,
.reject:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
.allow:disabled,
.reject:disabled { opacity: 0.4; cursor: not-allowed; }
/* Allow is a filled success action; Reject is the quiet destructive one, a
   tinted fill rather than a solid red \u2014 a solid red beside a solid green reads
   as two equally-weighted outcomes, and refusing is the rarer, safer default. */
.allow {
  background: var(--ok-deep);
  /* A mid-tone fill takes the page's own primary label, not the dark-fill
     foreground: that token is white in the light theme and measured 2.3:1 here. */
  color: var(--text);
}
.reject {
  background: color-mix(in srgb, var(--bad) 10%, var(--panel));
  color: color-mix(in srgb, var(--bad) 62%, var(--text));
}

/* \u2500\u2500 stockbroker-like approval thread \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hitl-thread-root {
  display: flex;
  flex-direction: column;
  /* A floor, in CONTAINER height, and deliberately small.
     \`min(70vh, 720px)\` was three things wrong at once, and they compound:
       1. \`vh\` describes the WINDOW; this page is the CENTRE COLUMN, so the
          window's height overstates the space available by the host's sidebar
          rail and the frame's top clearance \u2014 a margin that grows as the window
          narrows, which is exactly backwards;
       2. it is a FLOOR, so on a short window the thread claimed its height
          before the start control and the tab row were given any. Measured at
          480x560: the thread was 334px tall with 176px above the fold, and the
          approval card \u2014 the reason a person is on this page \u2014 sat under it;
       3. \`min()\` takes the SMALLER of its arguments, so \`min(70vh, 720px)\` was
          720px on every window taller than 1029px and \`70vh\` below that: the
          ceiling the author wrote existed only in the range where it was least
          needed, and the floor dominated everywhere else.
     A floor is still wanted \u2014 an empty thread with no composer is not a usable
     dashboard \u2014 but it has to yield to the page. \`min(420px, 60cqh)\` is at most
     420px, and at most 60% of the page's OWN height, which leaves the rest to
     the start control, the tab row and the page's scroll.
     The host's conversation page needs no floor at all: its column is
     \`height: 100%\` and its scroller is \`flex: 1; min-height: 0\`
     (\`ui-conversation/src/client/skeleton/ConversationRoot.module.css\`). This
     page cannot use that shape while the start control, the tab row and the
     settings form share the same column, so the floor is explicit here \u2014 and
     explicit, small, and container-relative is the whole contract.
     \`max-height: none\` was \`calc(100vh - \u2026)\`, the same window-versus-column
     error on the other side: a ceiling in viewport units is not a ceiling on
     anything on this page. */
  min-height: min(420px, 60cqh);
  max-height: none;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: calc(var(--radius-chat) + 4px);
  overflow: hidden;
}
.hitl-thread-viewport {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  scroll-behavior: smooth;
  /* Horizontal padding belongs to the THREAD's own edges, not to a scroll
     container that then holds the composer as a sticky child \u2014 and the child
     brings its own. Four layers were stacking: this 32px, the footer's 24px,
     the composer's 24px, the textarea's 8px. The textarea lost 88px to padding
     before it typed a character, and in a 384px column (a 440px window) that
     left it 23px wide \u2014 unusable, with a 36px send button beside it. The host's
     own composer stacks two layers (54px) and is still 341px wide in the same
     column. Vertical padding is unchanged; the horizontal inset is the card's
     own, one layer down. */
  padding: 16px 0 0;
}
.hitl-thread-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  margin-top: auto;
  /* No horizontal padding: it is a sticky wrapper around the composer's own
     card, and the card carries the inset (see \`.hitl-composer-shell\`). */
  padding: 0 0 14px;
  background: linear-gradient(180deg, transparent, var(--panel) 28%);
}
.hitl-welcome {
  /* \`width: 100%\` of a container with no padding does NOT inset the box: 100% is
     the parent's CONTENT width and a margin is added outside it, so the card's
     border lands 16px beyond the thread's own edge (measured: viewport right 1226,
     welcome right 1242). \`auto\` sides with a definite \`max-width\` is what
     actually centres and insets a block, which is what the message rule below
     already does. */
  margin: 24px auto;
  max-width: var(--thread-max-width);
}

.hitl-assistant-msg,
.hitl-user-msg {
  max-width: var(--thread-max-width);
  /* The viewport no longer insets its content (the sticky composer is a child of
     it and brings its own), so the messages carry the thread's edge inset
     themselves. \`max-width\` with \`auto\` sides is what does it: it centres the
     message under the thread's \`--thread-max-width\` and clamps to the container
     when that is narrower, which is exactly the inset. \`width: 100%\` did not \u2014
     100% is the parent's full content width, so a margin went outside the box
     and a \`padding\` took 32px out of the content instead. */
  margin: 0 auto 14px;
}

.hitl-user-msg {
  display: flex;
  justify-content: flex-end;
}
.hitl-user-bubble {
  max-width: min(100%, 34rem);
  background: var(--user-bubble);
  border: 1px solid var(--border);
  border-radius: 1.1rem 1.1rem 0.35rem 1.1rem;
  padding: 10px 14px;
  font-size: 13.5px;
  line-height: 1.55;
  white-space: pre-wrap;
  color: var(--text);
}

/* Composer \u2014 rounded chat dock like the stockbroker example */
.hitl-composer-root {
  width: 100%;
  max-width: var(--thread-max-width);
  margin: 0 auto;
}
.hitl-composer-shell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--composer);
  border: 1px solid var(--border);
  border-radius: var(--radius-chat);
  padding: 10px 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.hitl-composer-shell:focus-within {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent),
    0 10px 30px rgba(0, 0, 0, 0.28);
}
.hitl-composer-shell.is-disabled {
  opacity: 0.72;
}
.hitl-composer-input {
  width: 100%;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  min-height: 3.2rem;
  max-height: 8rem;
  /* The card insets; the field does not. It had \`4px 4px 0\` \u2014 four px of inset
     on a control inside a card that already had twelve, so the text started 16px
     in and the field itself was 8px narrower than the card's content box, for
     nothing. The host's own composer editor is \`padding: 0 4px\`
     (\`ui-conversation/src/client/input/editor/composer-editor.module.css\`) on a
     card that insets 16px; same two layers, and the top padding moves to the
     card's own row gap. */
  padding: 0;
}
.hitl-composer-input::placeholder { color: var(--faint); }
.hitl-composer-input:disabled { cursor: default; }
.hitl-composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.hitl-composer-hint {
  font-size: 11.5px;
  color: var(--muted);
  min-width: 0;
}
.hitl-composer-send {
  flex: none;
  width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 0;
  background: var(--text);
  color: var(--bg);
}
.hitl-composer-send:hover:not(:disabled) {
  background: var(--dsw-alias-label-primary, #fff);
  border-color: transparent;
}
.hitl-composer-send:disabled {
  opacity: 0.35;
}

.feedback-preview {
  margin-top: 10px;
  font-size: 12.5px;
  color: var(--muted);
  background: color-mix(in srgb, var(--accent) 10%, var(--panel-2));
  border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
  border-radius: var(--radius-doc);
  padding: 8px 10px;
  line-height: 1.45;
}
.feedback-preview em {
  font-style: normal;
  color: var(--text);
  font-weight: 500;
}

/* vendor message chrome inside our thread */
.stage .aui-assistant-message-root,
.stage [data-message-id] {
  max-width: none;
  width: 100%;
  margin: 0;
  padding: 0;
  animation: none;
}

/* \u2500\u2500 workspaces / sessions tree \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.ws-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-doc);
  padding: 8px;
}
.ws-all,
.ws-group-head,
.ws-session {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  border-radius: 6px;
  padding: 8px 10px;
  min-height: 36px;
  font: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.ws-all:hover,
.ws-group-head:hover,
.ws-session:hover {
  background: var(--hover);
  border-color: var(--border-soft);
}
.ws-all.is-active,
.ws-session.is-active {
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  color: var(--text);
}
.ws-session.is-pending:not(.is-active) {
  border-color: color-mix(in srgb, var(--warn) 40%, var(--border));
}
.ws-group { display: flex; flex-direction: column; gap: 2px; }
.ws-group-head {
  font-weight: 650;
  color: var(--muted);
}
.ws-chevron {
  width: 12px;
  color: var(--muted);
  font-size: 11px;
  flex: 0 0 auto;
}
.ws-group-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
}
.ws-sessions {
  list-style: none;
  margin: 0;
  padding: 0 0 4px 18px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ws-session-id {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
  font-size: 12.5px;
}
.ws-all .tag,
.ws-group-head .tag,
.ws-session .tag {
  flex: 0 0 auto;
  margin-left: auto;
}
.ws-group-head .tag + .tag,
.ws-session .tag + .tag {
  margin-left: 0;
}

/* \u2500\u2500 run state rail (grouped) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.run-group {
  margin-bottom: 14px;
}
.run-group:last-child { margin-bottom: 4px; }
.run-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 8px;
  position: sticky;
  top: 0;
  z-index: 1;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--panel) 96%, transparent) 70%,
    transparent
  );
}
.run-group-label {
  font-size: 11.5px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
}
.run-group-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.run-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-doc);
  padding: 12px 14px;
  margin-bottom: 0;
  box-shadow: 0 1px 0 var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.06));
}
.run-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px 14px;
}
.run-grid .k {
  color: var(--muted);
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 3px;
}
.run-grid .v {
  font-weight: 650;
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.run-grid .v.mono { font-family: var(--font-mono); font-weight: 600; }

/* The meter fill tints by headroom, off the harness success token. */
.meter {
  width: 100%;
  max-width: 220px;
  height: 6px;
  background: var(--dsw-alias-bg-layer-3, #F0F0F011);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  margin-top: 6px;
}
.meter > i {
  display: block;
  height: 100%;
  width: 0%;
  background: var(--ok-deep);
  border-radius: 2px;
  transition: width 160ms ease, background-color 160ms ease;
}
.meter.ok > i { background: var(--ok-deep); }
.meter.warn > i { background: var(--warn); }
.meter.bad > i { background: var(--bad-deep); }
.meter.accent > i { background: var(--accent); }

.sig {
  font-size: 12.5px;
  line-height: 1.5;
  margin: 6px 0 0;
  padding: 7px 10px;
  border-radius: var(--radius-doc);
  background: var(--panel-2);
  border-left: 3px solid var(--border);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 8px;
}
.sig + .sig { margin-top: 6px; }
.sig .sig-tag {
  /* uses .tag + severity class from markup */
  margin-right: 0;
  flex: none;
}
.sig.critical {
  color: var(--text);
  border-left-color: var(--bad);
  background: color-mix(in srgb, var(--bad-deep) 12%, var(--panel-2));
}
.sig.warning {
  color: var(--text);
  border-left-color: var(--warn);
  background: color-mix(in srgb, var(--warn) 10%, var(--panel-2));
}
.sig.info,
.sig.notice {
  color: var(--muted);
  border-left-color: var(--accent);
}

.rail-honesty {
  margin: 10px 0 0;
}

/* \u2500\u2500 activity ledger \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.feed {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.feed-item {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 6px 10px;
  align-items: start;
  padding: 8px 8px;
  font-size: 13px;
  line-height: 1.45;
  border-radius: 4px;
}
.feed-item:hover { background: var(--hover); }
.feed-item .t,
.feed-t {
  color: var(--muted);
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  padding-top: 3px;
}
.feed-item .kind,
.feed-k {
  white-space: nowrap;
  min-width: 0;
  justify-self: start;
}
.feed-item .text,
.feed-text {
  min-width: 0;
  overflow-wrap: anywhere;
  padding-top: 2px;
}

/* \u2500\u2500 review brief \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.brief {
  margin: 0 0 12px;
  padding: 12px 14px;
  background: var(--panel-2);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-doc);
}
.brief-heading {
  margin: 0 0 8px;
  font-size: 13.5px;
  font-weight: 650;
}
.brief-para {
  margin: 0 0 8px;
  font-size: 13.5px;
  line-height: 1.55;
}
.brief-list {
  margin: 0 0 8px;
  padding-left: 20px;
  font-size: 13.5px;
}
.brief-list li { margin: 3px 0; }
.brief-code {
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.5;
  background: var(--bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-doc);
  padding: 10px 12px;
  overflow: auto;
  margin: 0 0 8px;
  white-space: pre;
}
.brief-code:last-child,
.brief-para:last-child,
.brief-list:last-child { margin-bottom: 0; }
.brief-note {
  color: var(--muted);
  font-size: 12.5px;
  margin: 0 0 10px;
}
.brief-note.error {
  color: var(--bad);
  font-weight: 500;
}
.brief-note.settled {
  color: var(--muted);
  background: var(--panel-2);
  border: 1px dashed var(--border);
  border-radius: var(--radius-doc);
  padding: 10px 12px;
  margin: 0;
}

/* \u2500\u2500 reduced motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;var op=`/*
 * The plugin's own chrome \u2014 the part that is NOT the designed dashboard shell.
 *
 * The shell's stylesheet binds to the DeepSeek Harness design tokens
 * (\`--dsw-alias-*\`), so this file does too: the same tokens the sidebar rows,
 * settings rows and composer buttons already use. Binding to them is what
 * makes this page follow the host's light/dark theme and palette instead of
 * carrying a second, hand-picked set of colors.
 *
 * The assistant-ui stylesheet that renders the approval thread ships its own
 * (Tailwind) variables. The bridge at the bottom maps the handful that show
 * through onto the same harness tokens, so the thread and the page furniture
 * read as one surface rather than two pasted together.
 */

/* \u2500\u2500 page geometry \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   Taken from the harness's own main-slot pages
   (\`ui-plugin-manager/src/client/PluginManagerPage.module.css\`): a centred
   column capped at 960px, the same side gutter, the same bottom inset. Measured
   on a live instance this page sat flush against the frame with no gutter at
   all, so it read as a different application sitting beside the host's own
   pages. The insets live here rather than on each section, so the start
   control, the header, the dashboard and the settings form all align on one
   column \u2014 the one property a stacked page needs and cannot get per-section. */
.fl-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 clamp(24px, 4vw, 48px) 48px;
  overflow: auto;
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  /* The host's content scale, not a hand-picked 13px: the harness writes
     \`--dsh-content-font-size\` (12\u201317, default 14) on \`body\` and sizes page
     furniture from it, so a fixed 13px here was the one place on the page that
     ignored the user's own type-size setting. */
  font-size: var(--dsh-content-font-size, 14px);
}

.fl-page > * {
  width: 100%;
  max-width: 960px;
  min-width: 0;
}

.fl-pagehead {
  padding: 16px 0 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  flex: 0 0 auto;
}

/* The page title follows the harness's own page titles \u2014 20px, weight 500,
   28px line (\`PluginManagerPage.pageTitle\`). The uppercase 12px micro-label
   belongs to a section head, and a page title wearing it read as a section
   heading above a section with no body. */
.fl-title {
  /* The host's page-title ramp: 20px plus the user's own type-size delta, which
     is the same expression \`ui-theme\` uses for its headings. A fixed 20px was
     the only heading on the page that ignored the setting. */
  font-size: calc(20px + var(--dsh-content-font-delta, 0px));
  font-weight: 500;
  line-height: calc(28px + var(--dsh-content-font-delta, 0px));
  text-transform: none;
  margin: 0 0 4px;
  color: var(--dsw-alias-label-primary);
}

.fl-sub {
  color: var(--dsw-alias-label-secondary);
  line-height: 20px;
  margin: 0;
}

/* Tabs ARE the harness's segmented control (\`ui-primitives\`
   \`SegmentedControl.module.css\`): 28px tall, 13px/20px, \`radius-sm\`, on the
   same translucent track the hover state uses, with the selected segment raised
   on \`bg-layer-1\` under the soft elevation shadow. The previous 24px/12px
   pill measured 13px taller in the cascade \u2014 a bare \`button\` rule in
   shell.css sets \`min-height: 40px\` and won on specificity \u2014 so the tab row was
   twice the height it asked for, next to a 28px row beside it in the sidebar. */
.fl-tabs {
  display: inline-flex;
  gap: 2px;
  margin-top: 12px;
  padding: 4px;
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-interactive-bg-hover);
}

.fl-tabs button {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 16px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}

.fl-tabs button:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }

.fl-tabs button[data-active="true"] {
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: var(--dsw-elevation-soft);
}

/* The designed dashboard fills the rest of the column. It is NOT a scroll
   container: \`.fl-page\` is, and it owns the insets. Two nested scrollers gave
   the page two scrollbars and a header that scrolled away from its content. */
.fl-dashboard {
  flex: 1 1 auto;
  min-height: 0;
  background: var(--dsw-alias-bg-base);
  min-width: 0;
}

.fl-panel { display: flex; flex-direction: column; overflow-y: auto; }

.fl-section {
  padding: 16px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}

.fl-section-title {
  font-size: var(--dsh-content-font-size-secondary, 13px);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--dsw-alias-label-tertiary);
  margin: 0 0 12px;
}

.fl-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  min-height: 24px;
}

.fl-label {
  flex: 0 0 150px;
  color: var(--dsw-alias-label-secondary);
}

.fl-row input[type="text"],
.fl-row input[type="number"],
.fl-row select {
  flex: 1;
  min-width: 0;
  height: 32px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-md);
  padding: 0 8px;
  font: inherit;
  font-size: 14px;
  line-height: 22px;
}

.fl-row input::placeholder { color: var(--dsw-alias-label-dimmed); }

.fl-row input:focus-visible,
.fl-row select:focus-visible {
  border-color: var(--dsw-alias-state-business-primary);
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}

.fl-row input:disabled,
.fl-row select:disabled { opacity: 0.5; }

.fl-hint {
  color: var(--dsw-alias-label-tertiary);
  font-size: var(--dsh-content-font-size-secondary, 13px);
  line-height: 1.5;
  margin: -4px 0 12px 160px;
}

.fl-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--dsw-radius-sm);
  border: 0.5px solid var(--dsw-alias-border-l3);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  /* A pill label, not a control: the host's \`sm\` scale, which is one step down
     from the content size and tracks it. */
  font-size: var(--dsh-content-font-size-secondary, 13px);
  line-height: 18px;
}
.fl-badge[data-ok="true"] {
  border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent);
  color: var(--dsw-alias-state-success-primary);
}
.fl-badge[data-ok="false"] {
  border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.fl-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.fl-actions { display: flex; align-items: center; gap: 10px; padding: 14px 18px; }

/* Harness button metrics (\`ui-primitives\` \`Button.module.css\`, \`md\` size):
   36px tall, 14px/22px, \`radius-md\`, no border, 0.4 disabled opacity. The
   explicit \`height\` is load-bearing: shell.css carries a bare \`button\` rule
   with \`min-height: 40px\`, and a min-height cannot be beaten by a smaller
   height without this. */
.fl-actions button,
.hitl-composer-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
  font: inherit;
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
  cursor: pointer;
}
.fl-actions button[data-kind="ghost"] {
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  box-shadow: 0 0 0 0.5px var(--dsw-alias-border-l3);
  font-weight: 400;
}
.fl-actions button[data-kind="ghost"]:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}
.fl-actions button:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
.fl-actions button:disabled { opacity: 0.4; cursor: not-allowed; }

.fl-actions button:focus-visible,
.hitl-composer-send:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}

.fl-notice {
  padding: 10px 0;
  font-size: var(--dsh-content-font-size-secondary, 13px);
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.fl-notice[data-kind="error"] {
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);
  color: var(--dsw-alias-state-error-primary);
}
.fl-notice[data-kind="ok"] {
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);
  color: var(--dsw-alias-state-success-primary);
}
/* \`info\` is the STANDING notice on the settings page \u2014 the fields are stored,
   the patch row decides. It sits above the form rather than appearing only
   after a save, because the person who needs to know is the one about to type. */
.fl-notice[data-kind="info"] {
  /* Every token here is in the host's own published set, which
     \`test/css-parity.test.ts\` enforces: the first draft reached for
     \`--dsw-alias-accent-default\`, which is not one of them, and that check
     failed the build for it. That check has now earned its fourth keep. */
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, transparent);
  color: var(--dsw-alias-label-secondary);
  border-left: 2px solid var(--dsw-alias-state-warn-primary);
  padding: 10px 12px;
  margin-bottom: 4px;
}
.fl-notice[data-kind="info"] strong {
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
}
.fl-notice[data-kind="info"] code {
  font-size: 0.92em;
  color: var(--dsw-alias-label-primary);
}

.fl-pre {
  background: var(--dsw-alias-bg-layer-1);
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-md);
  padding: 9px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--dsh-content-font-size-secondary, 13px);
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--dsw-alias-label-secondary);
  margin: 0 0 10px;
}

.fl-empty {
  color: var(--dsw-alias-label-tertiary);
  margin: auto;
  text-align: center;
  padding: 30px;
}

.fl-link { color: var(--dsw-alias-link); text-decoration: none; word-break: break-all; }
.fl-link:hover { text-decoration: underline; }

/* \u2500\u2500 bridge: the assistant-ui thread, onto the harness palette \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   The vendored stylesheet sets its own (Tailwind) variables. These are the
   surfaces that actually show through between the card, the thread and the
   page, remapped so one run reads as one surface. Everything else the
   assistant-ui bundle ships is left alone \u2014 this is a bridge, not a rewrite. */
.fl-dashboard {
  --background: var(--dsw-alias-bg-base);
  --foreground: var(--dsw-alias-label-primary);
  --card: var(--dsw-alias-bg-layer-1);
  --card-foreground: var(--dsw-alias-label-primary);
  --card-border: var(--dsw-alias-border-l1);
  --popover: var(--dsw-alias-bg-layer-2);
  --popover-foreground: var(--dsw-alias-label-primary);
  --primary: var(--dsw-alias-brand-primary);
  --primary-foreground: var(--dsw-alias-label-primary-foreground);
  --accent: var(--dsw-alias-interactive-bg-hover);
  --accent-foreground: var(--dsw-alias-label-primary);
  --border: var(--dsw-alias-border-l1);
  --input: var(--dsw-alias-border-l2);
  --muted: var(--dsw-alias-label-secondary);
  --muted-foreground: var(--dsw-alias-label-tertiary);
  --destructive: var(--dsw-alias-state-error-primary);
  --destructive-foreground: var(--dsw-alias-label-primary-foreground);
  --success: var(--dsw-alias-state-success-primary);
  --warning: var(--dsw-alias-state-warn-primary);
  --radius: 0.5rem;
}

/* \u2500\u2500 start a loop \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.fl-start {
  padding: 16px 0 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.fl-start-head { min-width: 0; }

.fl-start-row {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

/* Harness input metrics (\`ui-primitives\` \`Input.module.css\`). */
.fl-start-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 36px;
  padding: 0 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-md);
  font: inherit;
  font-size: 14px;
  line-height: 22px;
}

.fl-start-input::placeholder { color: var(--dsw-alias-label-dimmed); }

.fl-start-input:focus-visible {
  border-color: var(--dsw-alias-state-business-primary);
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}

.fl-start-button {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
  font: inherit;
  font-size: 14px;
  line-height: 22px;
  cursor: pointer;
}
.fl-start-button:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
.fl-start-button:disabled { opacity: 0.4; cursor: not-allowed; }
.fl-start-button:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}

.fl-start-workspace {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.fl-start-wspacelabel { color: var(--dsw-alias-label-secondary); }
.fl-start-workspace select {
  flex: 1 1 auto;
  min-width: 0;
  height: 36px;
  padding: 0 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-md);
  font: inherit;
  font-size: 14px;
  line-height: 22px;
}

.fl-start-note {
  margin: 0;
  color: var(--dsw-alias-label-secondary);
  font-size: var(--dsh-content-font-size-secondary, 13px);
}
.fl-start-result {
  margin: 0;
  font-size: var(--dsh-content-font-size-secondary, 13px);
}
.fl-start-result[data-kind="ok"] { color: var(--dsw-alias-state-success-primary); }
.fl-start-result[data-kind="error"] { color: var(--dsw-alias-state-error-primary); }

/* The settings form is a two-column grid with a fixed label track. On a narrow
   page that track is most of the width and the field is left a sliver, so the
   label goes above its field instead. */
@container fl-dashboard (max-width: 520px) {
  .fl-row { flex-direction: column; align-items: stretch; gap: 4px; margin-bottom: 12px; }
  .fl-label { flex: 0 0 auto; }
  .fl-hint { margin: 0 0 0 0; }
  .fl-start-row { flex-direction: column; align-items: stretch; }
  .fl-start-button { width: 100%; }
}
`;var A=$("react/jsx-runtime");function xb(t){return{onChange(e){let r=t.get("remote");return r?.$on===void 0?()=>{}:r.$on("featureLoop/changed",e)},async load(){let e=t.get("remote.featureLoop");if(e===void 0)throw new Error("feature-loop host remote is not mounted");let r=await e.live();if(!r.ok)throw new Error(r.error.message);return r.value},async respond(e,r,o){let i=t.get("remote.featureLoop");if(i===void 0)throw new Error("feature-loop host remote is not mounted");zu(await i.answer(e,r,o))}}}function yb({size:t}){let e=t??16;return(0,A.jsxs)("svg",{width:e,height:e,viewBox:"0 0 16 16",fill:"none",stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round","aria-hidden":!0,children:[(0,A.jsx)("path",{d:"M13.5 8a5.5 5.5 0 1 1-1.6-3.9"}),(0,A.jsx)("path",{d:"M13.5 1.8V5h-3.2"}),(0,A.jsx)("path",{d:"M8 5.6v4.8"})]})}function Bt({label:t,hint:e,children:r}){return(0,A.jsxs)("div",{children:[(0,A.jsxs)("div",{className:"fl-row",children:[(0,A.jsx)("label",{className:"fl-label",children:t}),r]}),e!==void 0?(0,A.jsx)("div",{className:"fl-hint",children:e}):null]})}var _b=Object.keys(xo);function Sb({host:t}){let[e,r]=(0,ae.useState)(null),[o,i]=(0,ae.useState)(null),[s,n]=(0,ae.useState)(!1),[a,l]=(0,ae.useState)(null),c=(0,ae.useCallback)(async()=>{try{let m=t.get("remote.featureLoop");if(m===void 0){i({kind:"error",text:"feature-loop host remote is not mounted."});return}let g=await m.status();if(!g.ok){i({kind:"error",text:`status: ${g.error.message}`});return}r(g.value),l({judge:g.value.judge.kind,judgeBaseURL:g.value.judge.baseURL,systemOneModel:g.value.judge.model,judgeThreshold:Number(g.value.config.judgeThreshold??2),reviewBudget:Number(g.value.config.reviewBudget??.1),gateMode:String(g.value.config.gateMode??"ask"),gatePolicies:g.value.config.gatePolicies,checkpointAtStep:Number(g.value.config.checkpointAtStep??0)||""})}catch(m){i({kind:"error",text:`status failed: ${m.message}`})}},[t]);(0,ae.useEffect)(()=>{c()},[c]);let d=(0,ae.useCallback)(async()=>{if(a!==null){n(!0),i(null);try{let m=t.get("remote.featureLoop");if(m===void 0)return;let g=await m.save(a);if(!g.ok){i({kind:"error",text:`save: ${g.error.message}`});return}i({kind:"ok",text:"Saved to config.yaml. The running gate is built from the profile patch row, so this takes effect only after the plugin is wired to read it \u2014 the Status tab shows what is stored."}),await c()}catch(m){i({kind:"error",text:`save failed: ${m.message}`})}finally{n(!1)}}},[a,t,c]);if(e===null||a===null)return(0,A.jsx)("div",{className:"fl-panel",children:(0,A.jsx)("div",{className:"fl-empty",children:o?.text??"Loading feature loop status\u2026"})});let h=(m,g)=>l(w=>({...w,[m]:g})),u=a.judge!=="laya",p=qu(a.gatePolicies);return(0,A.jsxs)("div",{className:"fl-panel",children:[o===null?null:(0,A.jsx)("div",{className:"fl-notice","data-kind":o.kind,children:o.text}),(0,A.jsxs)("div",{className:"fl-notice","data-kind":"info",role:"note",children:["These fields are ",(0,A.jsx)("strong",{children:"stored, not applied"}),". The gate is built from your profile\u2019s ",(0,A.jsx)("code",{children:"cordis.patch.yml"})," row, which is the only place a setting changes behaviour today. The Status section below shows what is stored and which of it the row overrides."]}),(0,A.jsxs)("div",{className:"fl-section",children:[(0,A.jsx)("h3",{className:"fl-section-title",children:"Status"}),(0,A.jsxs)("div",{className:"fl-row",children:[(0,A.jsx)("span",{className:"fl-label",children:"Policies"}),(0,A.jsxs)("span",{className:"fl-badge","data-ok":e.enabled,children:[(0,A.jsx)("span",{className:"fl-dot"}),e.enabled?"on \u2014 spec configured":"off \u2014 no spec, detectors inactive"]})]}),(0,A.jsxs)("div",{className:"fl-row",children:[(0,A.jsx)("span",{className:"fl-label",children:"Judge"}),(0,A.jsxs)("span",{className:"fl-badge","data-ok":e.judge.kind==="none"?void 0:e.judge.reachable,children:[(0,A.jsx)("span",{className:"fl-dot"}),e.judge.kind,e.judge.kind==="laya"?` \xB7 ${e.judge.model} @ ${e.judge.baseURL}`:""]})]}),e.judge.detail===""?null:(0,A.jsx)("pre",{className:"fl-pre",children:e.judge.detail}),(0,A.jsxs)("div",{className:"fl-row",children:[(0,A.jsx)("span",{className:"fl-label",children:"Standalone page"}),e.dashboardURL===""?(0,A.jsxs)("span",{className:"fl-hint",style:{margin:0},children:["off \u2014 this page is the dashboard; set ",(0,A.jsx)("code",{children:"dashboard.standalone: true"})," to also serve it on loopback"]}):(0,A.jsx)("a",{className:"fl-link",href:e.dashboardURL,target:"_blank",rel:"noreferrer",children:e.dashboardURL})]}),(0,A.jsxs)("div",{className:"fl-row",children:[(0,A.jsx)("span",{className:"fl-label",children:"Settings file"}),(0,A.jsx)("code",{className:"fl-pre",style:{flex:1},children:e.configPath})]})]}),(0,A.jsxs)("div",{className:"fl-section",children:[(0,A.jsx)("h3",{className:"fl-section-title",children:"Judge"}),(0,A.jsx)(Bt,{label:"Kind",hint:"laya is local, free and needs no key. chat is metered and needs a gateway key. none leaves the detectors alone.",children:(0,A.jsxs)("select",{value:String(a.judge),onChange:m=>h("judge",m.target.value),children:[(0,A.jsx)("option",{value:"laya",children:"laya \u2014 local System One"}),(0,A.jsx)("option",{value:"none",children:"none \u2014 detectors only"}),(0,A.jsx)("option",{value:"chat",children:"chat \u2014 metered model"})]})}),(0,A.jsx)(Bt,{label:"Base URL",hint:"Same wire for Laya, Jev and TypeSafe \u2014 swapping providers changes only this URL and the model alias.",children:(0,A.jsx)("input",{type:"text",value:String(a.judgeBaseURL),disabled:u,onChange:m=>h("judgeBaseURL",m.target.value)})}),(0,A.jsx)(Bt,{label:"Model alias",children:(0,A.jsx)("input",{type:"text",value:String(a.systemOneModel),disabled:u,onChange:m=>h("systemOneModel",m.target.value)})}),(0,A.jsx)(Bt,{label:"Threshold",hint:"Score (0\u20133) that earns a human look. Laya scores ~0.5\u20131.4 in practice, so a value at or above 2 means the advisor never fires on its own.",children:(0,A.jsx)("input",{type:"number",step:"0.1",min:"0",max:"3",value:Number(a.judgeThreshold),onChange:m=>h("judgeThreshold",Number(m.target.value))})})]}),(0,A.jsxs)("div",{className:"fl-section",children:[(0,A.jsx)("h3",{className:"fl-section-title",children:"Attention"}),(0,A.jsx)(Bt,{label:"Review budget",hint:"Fraction of steps a human may be asked about, in (0, 1].",children:(0,A.jsx)("input",{type:"number",step:"0.05",min:"0.01",max:"1",value:Number(a.reviewBudget),onChange:m=>h("reviewBudget",Number(m.target.value))})}),(0,A.jsx)(Bt,{label:"Gate mode",hint:"ask prompts you in the composer and here. deny refuses outright \u2014 for unattended and CI runs.",children:(0,A.jsxs)("select",{value:String(a.gateMode),onChange:m=>h("gateMode",m.target.value),children:[(0,A.jsx)("option",{value:"ask",children:"ask \u2014 prompt a human"}),(0,A.jsx)("option",{value:"deny",children:"deny \u2014 refuse, never prompt"})]})})]}),(0,A.jsxs)("div",{className:"fl-section",children:[(0,A.jsx)("h3",{className:"fl-section-title",children:"Approval"}),(0,A.jsx)(Bt,{label:"When to stop and ask",hint:xo[p].detail,children:(0,A.jsx)("select",{value:p,onChange:m=>{let g=m.target.value;h("gatePolicies",{...xo[g].policies})},children:_b.map(m=>(0,A.jsx)("option",{value:m,children:xo[m].label},m))})}),(0,A.jsx)(Bt,{label:"Review checkpoint at step",hint:"The run pauses once at this step and waits for you \u2014 the 'built and tested, now look at it' moment. Approve to let it continue. Empty disables it.",children:(0,A.jsx)("input",{type:"number",min:"1",value:String(a.checkpointAtStep??""),placeholder:"none",onChange:m=>{let g=m.target.value;h("checkpointAtStep",g===""?void 0:Number(g))}})})]}),(0,A.jsxs)("div",{className:"fl-actions",children:[(0,A.jsx)("button",{type:"button",disabled:s,onClick:()=>{d()},children:s?"Saving\u2026":"Save"}),(0,A.jsx)("button",{type:"button","data-kind":"ghost",disabled:s,onClick:()=>{c()},children:"Reload"})]})]})}function Tb({host:t}){let[e,r]=(0,ae.useState)("dashboard"),o=(0,ae.useMemo)(()=>xb(t),[t]);return(0,A.jsxs)("div",{className:"fl-page",children:[(0,A.jsx)(kb,{host:t}),(0,A.jsx)("div",{className:"fl-pagehead",children:(0,A.jsxs)("div",{className:"fl-tabs",role:"tablist",children:[(0,A.jsx)("button",{type:"button",role:"tab","aria-selected":e==="dashboard","data-active":e==="dashboard",onClick:()=>r("dashboard"),children:"Dashboard"}),(0,A.jsx)("button",{type:"button",role:"tab","aria-selected":e==="settings","data-active":e==="settings",onClick:()=>r("settings"),children:"Settings"})]})}),e==="dashboard"?(0,A.jsx)("div",{className:"fl-dashboard",children:(0,A.jsx)(Xu,{source:o})}):(0,A.jsx)(Sb,{host:t})]})}function kb({host:t}){let[e,r]=(0,ae.useState)(""),[o,i]=(0,ae.useState)(!1),[s,n]=(0,ae.useState)(null),[a,l]=(0,ae.useState)(void 0),{workspaces:c,opened:d}=(0,ae.useMemo)(()=>{let I=(t.get("workspaces")?.list.getSnapshot().items??[]).map(M=>({id:M.workspaceId,title:M.title,path:M.path,sessionIds:M.sessionIds})),k=t.get("sessions"),{ids:E,byId:R}=k?.list.getSnapshot()??{ids:[],byId:{}},y=E.map(M=>R[M]).filter(M=>M!==void 0);return{workspaces:I,opened:Zu(I,y)}},[t,a]),h=ep(c,d,a,e),{target:u,ambiguous:p,note:m,blocked:g}=h,w=o||g!==void 0,_=(0,ae.useCallback)(async()=>{if(!(u===void 0||e.trim()==="")){i(!0),n(null);try{let x=t.get("remote.session");if(x===void 0){n({kind:"error",text:"the session controller is not available"});return}let T=t.get("uiWorkspace");if(T===void 0){n({kind:"error",text:"the workspace controller is not available"});return}let I=await T.connectWorkspace(u.id),k=t.get("remote.featureLoop");try{await k?.labelRun(I,e.trim())}catch{}let E=await x.prompt({requestId:globalThis.crypto.randomUUID(),sessionId:I,mode:"queue",content:[{type:"text",text:e.trim()}]});if(!E.ok){n({kind:"error",text:E.error.message});return}n({kind:"ok",text:`Running in \u201C${u.title}\u201D \u2014 the composer has the transcript.`}),r("")}catch(x){n({kind:"error",text:x.message})}finally{i(!1)}}},[t,u,e]);return(0,A.jsxs)("div",{className:"fl-start",children:[(0,A.jsxs)("div",{className:"fl-start-head",children:[(0,A.jsx)("h2",{className:"fl-title",children:"Start a loop"}),(0,A.jsx)("p",{className:"fl-sub",children:"Describe the task. It runs as a normal turn, so the step and cost ceilings, the detectors and the review gate all apply \u2014 and approvals arrive on this page."})]}),p?(0,A.jsxs)("label",{className:"fl-start-workspace",children:[(0,A.jsx)("span",{className:"fl-start-wspacelabel",children:"Workspace"}),(0,A.jsx)("select",{value:u?.id??"",onChange:x=>l(x.target.value),children:c.map(x=>(0,A.jsx)("option",{value:x.id,children:x.title===""?x.path:`${x.title} \u2014 ${x.path}`},x.id))})]}):null,(0,A.jsxs)("div",{className:"fl-start-row",children:[(0,A.jsx)("input",{className:"fl-start-input",type:"text",value:e,placeholder:"e.g. fix the failing test in test/budget.test.ts","aria-label":"Task to run through the feature loop",onChange:x=>r(x.target.value),onKeyDown:x=>{x.key==="Enter"&&!x.shiftKey&&(x.preventDefault(),_())}}),(0,A.jsx)("button",{type:"button",className:"fl-start-button",disabled:w,onClick:()=>{_()},children:o?"Starting\u2026":"Start loop"})]}),(0,A.jsx)("p",{className:"fl-start-note",children:m}),s===null?null:(0,A.jsx)("p",{className:"fl-start-result","data-kind":s.kind,role:"status",children:s.text})]})}var ip,Ib=()=>ip??(ip=C.string()),sp,Cb=()=>sp??(sp=C.any()),_o=(t,e)=>({name:t,wire:t,source:"json",codec:{mode:"strict",typeSymbol:e,create:Ib}}),Eb=(t,e)=>({name:t,wire:t,source:"json",codec:{mode:"strict",typeSymbol:e,create:Cb}}),So={mode:"src-json"},Rb={package:"@freepeak/dsh-feature-loop",descriptors:[{id:"@freepeak/dsh-feature-loop#featureLoop/status",service:"featureLoop",namespace:"featureLoop",method:"status",invocation:{kind:"direct"},parameters:[],result:So},{id:"@freepeak/dsh-feature-loop#featureLoop/live",service:"featureLoop",namespace:"featureLoop",method:"live",invocation:{kind:"direct"},parameters:[],result:So},{id:"@freepeak/dsh-feature-loop#featureLoop/answer",service:"featureLoop",namespace:"featureLoop",method:"answer",invocation:{kind:"direct"},parameters:[_o("id","string"),_o("outcome","string"),_o("feedback","string")],result:So},{id:"@freepeak/dsh-feature-loop#featureLoop/save",service:"featureLoop",namespace:"featureLoop",method:"save",invocation:{kind:"direct"},parameters:[Eb("settings","object")],result:So},{id:"@freepeak/dsh-feature-loop#featureLoop/labelRun",service:"featureLoop",namespace:"featureLoop",method:"labelRun",invocation:{kind:"direct"},parameters:[_o("sessionId","string"),_o("task","string")],result:So}]},Ab={inject:["slots","locale","remote","workspaces","uiWorkspace"],apply(t){t.effect(()=>{let r=document.createElement("style");return r.dataset.plugin="@freepeak/dsh-feature-loop",r.dataset.pluginCss="@freepeak/dsh-feature-loop/dashboard",r.textContent=`${rp}
${tp}
${op}`,document.head.append(r),()=>{r.remove()}},"dsh-feature-loop: dashboard stylesheet"),t.effect(()=>t.locale.register("featureLoop",{zh:{"featureLoop.panel":"Feature Loop"},en:{"featureLoop.panel":"Feature Loop"}}),"dsh-feature-loop: dictionaries");let e=t.remote.$mount(Rb).then(r=>r).catch(r=>{console.error("dsh-feature-loop: remote mount failed",r)});return window.__dshFeatureLoop=Object.freeze({ready:e,call:(r,o,...i)=>{let s=t.get(`remote.${r}`);if(s===void 0)throw new Error(`remote.${r}.${o} not available`);return s[o]?.(...i)}}),t.slots.inject("sidebar.panellist",()=>t.slots.register({name:"sidebar.panellist",id:"feature-loop",order:11,label:"Feature Loop",locale:"featureLoop"},yb)),t.slots.inject("main",()=>t.slots.register({name:"main",key:"feature-loop",locale:"featureLoop"},()=>(0,A.jsx)(Tb,{host:t}))),()=>{e.then(r=>r?.()).catch(()=>{})}}};return mp(Mb);})();

    return __flPlugin.default || __flPlugin;
  },
});
