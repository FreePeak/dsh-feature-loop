window.__ModuleLoader__.load({
  id: '@freepeak/dsh-feature-loop',
  factory(require) {
"use strict";var __flPlugin=(()=>{var Yu=Object.create;var Er=Object.defineProperty;var Xu=Object.getOwnPropertyDescriptor;var Zu=Object.getOwnPropertyNames;var ep=Object.getPrototypeOf,tp=Object.prototype.hasOwnProperty;var da=t=>{throw TypeError(t)};var rp=(t,e,r)=>e in t?Er(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r;var $=(t=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(t,{get:(e,r)=>(typeof require<"u"?require:e)[r]}):t)(function(t){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+t+'" is not supported')});var op=(t,e)=>()=>{try{return e||t((e={exports:{}}).exports,e),e.exports}catch(r){throw e=0,r}},ls=(t,e)=>{for(var r in e)Er(t,r,{get:e[r],enumerable:!0})},_o=(t,e,r,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of Zu(e))!tp.call(t,i)&&i!==r&&Er(t,i,{get:()=>e[i],enumerable:!(o=Xu(e,i))||o.enumerable});return t},j=(t,e,r)=>(_o(t,e,"default"),r&&_o(r,e,"default")),Fe=(t,e,r)=>(r=t!=null?Yu(ep(t)):{},_o(e||!t||!t.__esModule?Er(r,"default",{value:t,enumerable:!0}):r,t)),ip=t=>_o(Er({},"__esModule",{value:!0}),t);var f=(t,e,r)=>rp(t,typeof e!="symbol"?e+"":e,r),ua=(t,e,r)=>e.has(t)||da("Cannot "+r);var ct=(t,e,r)=>(ua(t,e,"read from private field"),r?r.call(t):e.get(t)),Bt=(t,e,r)=>e.has(t)?da("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,r),$t=(t,e,r,o)=>(ua(t,e,"write to private field"),o?o.call(t,r):e.set(t,r),r);var on=op((vk,fr)=>{"use strict";var yh=typeof Buffer<"u",Qc=/"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/,Yc=/"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;function Xc(t,e,r){r==null&&e!==null&&typeof e=="object"&&(r=e,e=void 0),yh&&Buffer.isBuffer(t)&&(t=t.toString()),t&&t.charCodeAt(0)===65279&&(t=t.slice(1));let o=JSON.parse(t,e);if(o===null||typeof o!="object")return o;let i=r&&r.protoAction||"error",s=r&&r.constructorAction||"error";if(i==="ignore"&&s==="ignore")return o;if(i!=="ignore"&&s!=="ignore"){if(Qc.test(t)===!1&&Yc.test(t)===!1)return o}else if(i!=="ignore"&&s==="ignore"){if(Qc.test(t)===!1)return o}else if(Yc.test(t)===!1)return o;return Zc(o,{protoAction:i,constructorAction:s,safe:r&&r.safe})}function Zc(t,{protoAction:e="error",constructorAction:r="error",safe:o}={}){let i=[t];for(;i.length;){let s=i;i=[];for(let n of s){if(e!=="ignore"&&Object.prototype.hasOwnProperty.call(n,"__proto__")){if(o===!0)return null;if(e==="error")throw new SyntaxError("Object contains forbidden prototype property");delete n.__proto__}if(r!=="ignore"&&Object.prototype.hasOwnProperty.call(n,"constructor")&&n.constructor!==null&&typeof n.constructor=="object"&&Object.prototype.hasOwnProperty.call(n.constructor,"prototype")){if(o===!0)return null;if(r==="error")throw new SyntaxError("Object contains forbidden prototype property");delete n.constructor}for(let a in n){let c=n[a];c&&typeof c=="object"&&i.push(c)}}}return t}function rn(t,e,r){let{stackTraceLimit:o}=Error;Error.stackTraceLimit=0;try{return Xc(t,e,r)}finally{Error.stackTraceLimit=o}}function _h(t,e){let{stackTraceLimit:r}=Error;Error.stackTraceLimit=0;try{return Xc(t,e,{safe:!0})}catch{return}finally{Error.stackTraceLimit=r}}fr.exports=rn;fr.exports.default=rn;fr.exports.parse=rn;fr.exports.safeParse=_h;fr.exports.scan=Zc});var bb={};ls(bb,{default:()=>vb});var ae=$("react");function Te(t){return t==null}function To(t){return t&&typeof t=="object"&&!Array.isArray(t)}function ma(t,e){return Object.fromEntries(Object.entries(t).filter(([r,o])=>e(r,o)))}function lt(t,e){return Object.fromEntries(Object.entries(t).map(([r,o])=>[r,e(o,r)]))}function ha(t,e,r){if(!e)return{...t};let o={};for(let i of e)(r||t[i]!==void 0)&&(o[i]=t[i]);return o}var fa=Symbol.for("cosmokit.volatile.write");function ds(t,e=new Set){if(typeof t=="function")throw new TypeError("volatile config cannot contain functions");if(t===null||typeof t!="object")return t;if(e.has(t))throw new TypeError("volatile config cannot contain cycles");e.add(t);try{if(Array.isArray(t))return Object.freeze(t.map(r=>ds(r,e)));if(Object.getPrototypeOf(t)!==Object.prototype&&Object.getPrototypeOf(t)!==null)throw new TypeError("volatile config objects must be plain objects or arrays");return Object.freeze(Object.fromEntries(Object.entries(t).map(([r,o])=>[r,ds(o,e)])))}finally{e.delete(t)}}function us(t){let e=ds(t);return Object.freeze({get:()=>e,[fa]:r=>{e=r}})}function tr(t){return typeof t=="object"&&t!==null&&fa in t}function _t(t,e){return arguments.length===1?r=>_t(t,r):t in globalThis&&e instanceof globalThis[t]||Object.prototype.toString.call(e).slice(8,-1)===t}function ko(t){return _t("ArrayBuffer",t)||_t("SharedArrayBuffer",t)}function sp(t){return ko(t)||ArrayBuffer.isView(t)}var Je;(function(t){t.is=ko,t.isSource=sp;function e(n){return ArrayBuffer.isView(n)?n.buffer.slice(n.byteOffset,n.byteOffset+n.byteLength):n}t.fromSource=e;function r(n){if(n=e(n),typeof Buffer<"u")return Buffer.from(n).toString("base64");let a="",c=new Uint8Array(n);for(let l=0;l<c.byteLength;l++)a+=String.fromCharCode(c[l]);return btoa(a)}t.toBase64=r;function o(n){return typeof Buffer<"u"?e(Buffer.from(n,"base64")):Uint8Array.from(atob(n),a=>a.charCodeAt(0))}t.fromBase64=o;function i(n){return n=e(n),typeof Buffer<"u"?Buffer.from(n).toString("hex"):Array.from(new Uint8Array(n),a=>a.toString(16).padStart(2,"0")).join("")}t.toHex=i;function s(n){if(typeof Buffer<"u")return e(Buffer.from(n,"hex"));let a=n.length%2===0?n:n.slice(0,n.length-1),c=[];for(let l=0;l<a.length;l+=2)c.push(parseInt(`${a[l]}${a[l+1]}`,16));return Uint8Array.from(c).buffer}t.fromHex=s})(Je||(Je={}));var xb=Je.fromBase64,yb=Je.toBase64,_b=Je.fromHex,Sb=Je.toHex;function So(t,e=new Map){if(!t||typeof t!="object")return t;if(_t("Date",t))return new Date(t.valueOf());if(_t("RegExp",t))return new RegExp(t.source,t.flags);if(ko(t))return t.slice(0);if(ArrayBuffer.isView(t))return t.buffer.slice(t.byteOffset,t.byteOffset+t.byteLength);let r=e.get(t);if(r)return r;if(Array.isArray(t)){let i=[];return e.set(t,i),t.forEach((s,n)=>{i[n]=Reflect.apply(So,null,[s,e])}),i}let o=Object.create(Object.getPrototypeOf(t));e.set(t,o);for(let i of Reflect.ownKeys(t)){let s={...Reflect.getOwnPropertyDescriptor(t,i)};"value"in s&&(s.value=Reflect.apply(So,null,[s.value,e])),Reflect.defineProperty(o,i,s)}return o}function Co(t,e,r){let o=new Set;function i(s,n){if(s===n)return!0;if(tr(s)||tr(n))return tr(s)&&tr(n);if(!r&&Te(s)&&Te(n))return!0;if(typeof s!=typeof n||typeof s!="object"||!s||!n||o.has(s))return!1;function a(c,l){return c(s)?c(n)?l(s,n):!1:c(n)?!1:void 0}o.add(s);try{return a(Array.isArray,(c,l)=>{if(c.length!==l.length)return!1;for(let d=0;d<c.length;d++)if(!i(c[d],l[d]))return!1;return!0})??a(_t("Date"),(c,l)=>c.valueOf()===l.valueOf())??a(_t("URL"),(c,l)=>c.href===l.href)??a(_t("RegExp"),(c,l)=>c.source===l.source&&c.flags===l.flags)??a(ko,(c,l)=>{if(c.byteLength!==l.byteLength)return!1;let d=new Uint8Array(c),m=new Uint8Array(l);for(let p=0;p<d.length;p++)if(d[p]!==m[p])return!1;return!0})??((!r||[s,n].every(c=>Object.getPrototypeOf(c)===Object.prototype||Object.getPrototypeOf(c)===null))&&Object.keys({...s,...n}).every(c=>i(s[c],n[c])))}finally{o.delete(s)}}return i(t,e)}var pa;(function(t){t.millisecond=1,t.second=1e3,t.minute=t.second*60,t.hour=t.minute*60,t.day=t.hour*24,t.week=t.day*7;let e=new Date().getTimezoneOffset();function r(u){e=u}t.setTimezoneOffset=r;function o(){return e}t.getTimezoneOffset=o;function i(u=new Date,h){return typeof u=="number"&&(u=new Date(u)),h===void 0&&(h=e),Math.floor((u.valueOf()/t.minute-h)/1440)}t.getDateNumber=i;function s(u,h){let v=new Date(u*t.day);return h===void 0&&(h=e),new Date(+v+h*t.minute)}t.fromDateNumber=s;let n=/\d+(?:\.\d+)?/.source,a=new RegExp(`^${["w(?:eek(?:s)?)?","d(?:ay(?:s)?)?","h(?:our(?:s)?)?","m(?:in(?:ute)?(?:s)?)?","s(?:ec(?:ond)?(?:s)?)?"].map(u=>`(${n}${u})?`).join("")}$`);function c(u){let h=a.exec(u);return h?(parseFloat(h[1])*t.week||0)+(parseFloat(h[2])*t.day||0)+(parseFloat(h[3])*t.hour||0)+(parseFloat(h[4])*t.minute||0)+(parseFloat(h[5])*t.second||0):0}t.parseTime=c;function l(u){let h=c(u);return h?u=Date.now()+h:/^\d{1,2}(:\d{1,2}){1,2}$/.test(u)?u=`${new Date().toLocaleDateString()}-${u}`:/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(u)&&(u=`${new Date().getFullYear()}-${u}`),u?new Date(u):new Date}t.parseDate=l;function d(u){let h=Math.abs(u);return h>=t.day-t.hour/2?Math.round(u/t.day)+"d":h>=t.hour-t.minute/2?Math.round(u/t.hour)+"h":h>=t.minute-t.second/2?Math.round(u/t.minute)+"m":h>=t.second?Math.round(u/t.second)+"s":u+"ms"}t.format=d;function m(u,h=2){return u.toString().padStart(h,"0")}t.toDigits=m;function p(u,h=new Date){return u.replace("yyyy",h.getFullYear().toString()).replace("yy",h.getFullYear().toString().slice(2)).replace("MM",m(h.getMonth()+1)).replace("dd",m(h.getDate())).replace("hh",m(h.getHours())).replace("mm",m(h.getMinutes())).replace("ss",m(h.getSeconds())).replace("SSS",m(h.getMilliseconds(),3))}t.template=p})(pa||(pa={}));var Ar=Symbol.for("schemastery"),ba=Symbol.for("ValidationError");globalThis.__schemastery_index__??(globalThis.__schemastery_index__=0);globalThis.__schemastery_refs__=void 0;var q=class extends TypeError{constructor(e,r){let o="$";for(let i of r.path||[])typeof i=="string"?o+="."+i:typeof i=="number"?o+="["+i+"]":typeof i=="symbol"&&(o+=`[Symbol(${i.toString()})]`);o.startsWith(".")&&(o=o.slice(1));super((o==="$"?"":`${o} `)+e);f(this,"options");f(this,"name","ValidationError");this.options=r}static is(e){return!!e?.[ba]}};Object.defineProperty(q.prototype,ba,{value:!0});var T=function(t){let e=function(r,o={}){return T.resolve(r,e,o)[0]};if(t.refs){let r=lt(t.refs,i=>new T(i)),o=i=>r[i];for(let i in r){let s=r[i];s.sKey=o(s.sKey),s.inner=o(s.inner),s.list=s.list&&s.list.map(o),s.dict=s.dict&&lt(s.dict,o)}return r[t.uid]}if(Object.assign(e,t),typeof e.callback=="string")try{e.callback=new Function("return "+e.callback)()}catch{}return Object.defineProperty(e,"uid",{value:globalThis.__schemastery_index__++}),Object.setPrototypeOf(e,T.prototype),e.meta||(e.meta={}),e.toString=e.toString.bind(e),e};T.prototype=Object.create(Function.prototype);T.prototype[Ar]=!0;Object.defineProperty(T.prototype,"~standard",{get(){return{version:1,vendor:"schemastery",validate:t=>{try{return{value:T.resolve(t,this,{})[0]}}catch(e){if(q.is(e))return{issues:[{message:e.message,path:e.options.path}]};throw e}}}}});T.ValidationError=q;T.prototype.toJSON=function(){var r,o;if(globalThis.__schemastery_refs__)return(r=globalThis.__schemastery_refs__)[o=this.uid]??(r[o]=JSON.parse(JSON.stringify({...this}))),this.uid;globalThis.__schemastery_refs__={[this.uid]:{...this}},globalThis.__schemastery_refs__[this.uid]=JSON.parse(JSON.stringify({...this}));let e={uid:this.uid,refs:globalThis.__schemastery_refs__};return globalThis.__schemastery_refs__=void 0,e};T.prototype.set=function(e,r){return this.dict[e]=r,this};T.prototype.push=function(e){return this.list.push(e),this};function np(t,e){let r=typeof t=="string"?{"":t}:{...t};for(let o in e){let i=e[o];i?.$description||i?.$desc?r[o]=i.$description||i.$desc:typeof i=="string"&&(r[o]=i)}return r}function Rr(t){return t?.$value??t?.$inner}function ga(t){return ma(t??{},e=>!e.startsWith("$"))}T.prototype.i18n=function(e){let r=T(this),o=np(r.meta.description,e);return Object.keys(o).length&&(r.meta.description=o),r.dict&&(r.dict=lt(r.dict,(i,s)=>i.i18n(lt(e,n=>Rr(n)?.[s]??n?.[s])))),r.list&&(r.list=r.list.map((i,s)=>i.i18n(lt(e,(n={})=>Array.isArray(Rr(n))?Rr(n)[s]:Array.isArray(n)?n[s]:ga(n))))),r.inner&&(r.inner=r.inner.i18n(lt(e,i=>Rr(i)?Rr(i):ga(i)))),r.sKey&&(r.sKey=r.sKey.i18n(lt(e,i=>i?.$key))),r};T.prototype.extra=function(e,r){let o=T(this);return o.meta={...o.meta,[e]:r},o};for(let t of["required","disabled","collapse","hidden","loose"])Object.assign(T.prototype,{[t](e=!0){let r=T(this);return r.meta={...r.meta,[t]:e},r}});T.prototype.deprecated=function(){var r;let e=T(this);return(r=e.meta).badges||(r.badges=[]),e.meta.badges.push({text:"deprecated",type:"danger"}),e};T.prototype.experimental=function(){var r;let e=T(this);return(r=e.meta).badges||(r.badges=[]),e.meta.badges.push({text:"experimental",type:"warning"}),e};T.prototype.pattern=function(e){let r=T(this),o=ha(e,["source","flags"]);return r.meta={...r.meta,pattern:o},r};T.prototype.simplify=function(e){if(tr(e)&&(e=e.get()),Co(e,this.meta.default,this.type==="dict"))return null;if(Te(e))return e;if(this.type==="object"||this.type==="dict"){let r={};for(let o in e){let i=(this.type==="object"?this.dict[o]:this.inner)?.simplify(e[o]);(this.type==="dict"||!Te(i))&&(r[o]=i)}return Co(r,this.meta.default,this.type==="dict")?null:r}else if(this.type==="array"||this.type==="tuple"){let r=[];return e.forEach((o,i)=>{let s=this.type==="array"?this.inner:this.list[i],n=s?s.simplify(o):o;r.push(n)}),r}else if(this.type==="intersect"){let r={};for(let o of this.list)Object.assign(r,o.simplify(e));return r}else if(this.type==="union")for(let r of this.list)try{return T.resolve(e,r,{}),r.simplify(e)}catch{}return e};T.prototype.toString=function(e){return xa[this.type]?.(this,e)??`Schema<${this.type}>`};T.prototype.role=function(t,e){let r=T(this);return r.meta={...r.meta,role:t,extra:e},r};for(let t of["default","link","comment","description","max","min","step"])Object.assign(T.prototype,{[t](e){let r=T(this);return r.meta={...r.meta,[t]:e},r}});T.prototype.volatile=function(){if(this.meta.volatile)throw new TypeError("volatile schema is already wrapped");return this.extra("volatile",!0)};var wa={},va=Symbol("checked-volatile-schema");function rr(t,e=[],r=!1,o=new Map){let i=o.get(t)??new Set;if(i.has(r))return;if(i.add(r),o.set(t,i),t.meta?.volatile&&r)throw new q("volatile fields require a fixed object path without an enclosing volatile field",{path:e});let s=r||!!t.meta?.volatile;if(t.dict)for(let[n,a]of Object.entries(t.dict))rr(a,[...e,n],s,o);if(t.sKey&&rr(t.sKey,[...e,"<key>"],!0,o),t.inner&&(t.type!=="lazy"||t.inner[Ar])&&rr(t.inner,[...e,"*"],!0,o),t.list)for(let n=0;n<t.list.length;n++)rr(t.list[n],[...e,String(n)],!0,o)}T.extend=function(e,r){wa[e]=r};T.resolve=function(e,r,o={},i=!1){if(!r)return[e];if(o[va]||(rr(r,o.path),o={...o,[va]:!0}),r.meta?.volatile){let n=T(r);n.meta={...r.meta,volatile:!1};let[a,c]=T.resolve(e,n,o,i);try{return[us(a),c]}catch(l){throw new q(l instanceof Error?l.message:String(l),o)}}if(o.ignore?.(e,r))return[e];if(Te(e)&&r.type!=="lazy"){if(r.meta.required)throw new q("missing required value",o);let n=r,a=r.meta.default;for(;n?.type==="intersect"&&Te(a);)n=n.list[0],a=n?.meta.default;if(Te(a))return[e];e=So(a)}let s=wa[r.type];if(!s)throw new q(`unsupported type "${r.type}"`,o);try{return s(e,r,o,i)}catch(n){if(!r.meta.loose)throw n;return[r.meta.default]}};T.from=function(e){if(Te(e))return T.any();if(["string","number","boolean"].includes(typeof e))return T.const(e).required();if(e[Ar])return e;if(typeof e=="function")switch(e){case String:return T.string().required();case Number:return T.number().required();case Boolean:return T.boolean().required();case Function:return T.function().required();default:return T.is(e).required()}else throw new TypeError(`cannot infer schema from ${e}`)};T.lazy=function(e){let r=()=>(o.inner[Ar]||(o.inner=o.builder(),o.inner.meta={...o.meta,...o.inner.meta}),o.inner.toJSON()),o=new T({type:"lazy",builder:e,inner:{toJSON:r}});return o};T.natural=function(){return T.number().step(1).min(0)};T.percent=function(){return T.number().step(.01).min(0).max(1).role("slider")};T.date=function(){return T.union([T.is(Date),T.transform(T.string().role("datetime"),(e,r)=>{let o=new Date(e);if(isNaN(+o))throw new q(`invalid date "${e}"`,r);return o},!0)])};T.regExp=function(e=""){return T.union([T.is(RegExp),T.transform(T.string().role("regexp",{flag:e}),(r,o)=>{try{return new RegExp(r,e)}catch(i){throw new q(i.message,o)}},!0)])};T.arrayBuffer=function(e){return T.union([T.is(ArrayBuffer),T.is(SharedArrayBuffer),T.transform(T.any(),(r,o)=>{if(Je.isSource(r))return Je.fromSource(r);throw new q(`expected ArrayBufferSource but got ${r}`,o)},!0),...e?[T.transform(T.string(),(r,o)=>{try{return e==="base64"?Je.fromBase64(r):Je.fromHex(r)}catch(i){throw new q(i.message,o)}},!0)]:[]])};T.extend("lazy",(t,e,r,o)=>(e.inner[Ar]||(e.inner=e.builder(),e.inner.meta={...e.meta,...e.inner.meta},rr(e.inner,r.path,!0)),T.resolve(t,e.inner,r,o)));T.extend("any",t=>[t]);T.extend("never",(t,e,r)=>{throw new q(`expected nullable but got ${t}`,r)});T.extend("const",(t,{value:e},r)=>{if(Co(t,e))return[e];throw new q(`expected ${e} but got ${t}`,r)});function hs(t,e,r,o,i=!1){let{max:s=1/0,min:n=-1/0}=e;if(t>s)throw new q(`expected ${r} <= ${s} but got ${t}`,o);if(t<n&&!i)throw new q(`expected ${r} >= ${n} but got ${t}`,o)}T.extend("string",(t,{meta:e},r)=>{if(typeof t!="string")throw new q(`expected string but got ${t}`,r);if(e.pattern){let o=new RegExp(e.pattern.source,e.pattern.flags);if(!o.test(t))throw new q(`expect string to match regexp ${o}`,r)}return hs(t.length,e,"string length",r),[t]});function ps(t,e){let r=t.toString();if(r.includes("e"))return t*Math.pow(10,e);let o=r.indexOf(".");if(o===-1)return t*Math.pow(10,e);let i=r.slice(o+1),s=r.slice(0,o);return i.length<=e?+(s+i.padEnd(e,"0")):+(s+i.slice(0,e)+"."+i.slice(e))}function ap(t,e,r){if(r=Math.abs(r),!/^\d+\.\d+$/.test(r.toString()))return(t-e)%r===0;let o=r.toString().indexOf("."),i=r.toString().slice(o+1).length;return Math.abs(ps(t,i)-ps(e,i))%ps(r,i)===0}T.extend("number",(t,{meta:e},r)=>{if(typeof t!="number")throw new q(`expected number but got ${t}`,r);hs(t,e,"number",r);let{step:o}=e;if(o&&!ap(t,e.min??0,o))throw new q(`expected number multiple of ${o} but got ${t}`,r);return[t]});T.extend("boolean",(t,e,r)=>{if(typeof t=="boolean")return[t];throw new q(`expected boolean but got ${t}`,r)});T.extend("bitset",(t,{bits:e,meta:r},o)=>{let i=0,s=[];if(typeof t=="number"){i=t;for(let n in e)t&e[n]&&s.push(n)}else if(Array.isArray(t)){s=t;for(let n of s){if(typeof n!="string")throw new q(`expected string but got ${n}`,o);n in e&&(i|=e[n])}}else throw new q(`expected number or array but got ${t}`,o);return i===r.default?[i]:[i,s]});T.extend("function",(t,e,r)=>{if(typeof t=="function")return[t];throw new q(`expected function but got ${t}`,r)});T.extend("is",(t,{constructor:e},r)=>{if(typeof e=="function"){if(t instanceof e)return[t];throw new q(`expected ${e.name} but got ${t}`,r)}else{if(Te(t))throw new q(`expected ${e} but got ${t}`,r);let o=Object.getPrototypeOf(t);for(;o;){if(o.constructor?.name===e)return[t];o=Object.getPrototypeOf(o)}throw new q(`expected ${e} but got ${t}`,r)}});function Io(t,e,r,o){try{let[i,s]=T.resolve(t[e],r,{...o,path:[...o.path||[],e]});return s!==void 0&&(t[e]=s),i}catch(i){if(!o?.autofix)throw i;return delete t[e],r.meta.volatile?us(r.meta.default):r.meta.default}}T.extend("array",(t,{inner:e,meta:r},o)=>{if(!Array.isArray(t))throw new q(`expected array but got ${t}`,o);return hs(t.length,r,"array length",o,!Te(e.meta.default)),[t.map((i,s)=>Io(t,s,e,o))]});T.extend("dict",(t,{inner:e,sKey:r},o,i)=>{if(!To(t))throw new q(`expected object but got ${t}`,o);let s={};for(let n in t){let a;try{a=T.resolve(n,r,o)[0]}catch(c){if(i)continue;throw c}s[a]=Io(t,n,e,o),t[a]=t[n],n!==a&&delete t[n]}return[s]});T.extend("tuple",(t,{list:e},r,o)=>{if(!Array.isArray(t))throw new q(`expected array but got ${t}`,r);let i=e.map((s,n)=>Io(t,n,s,r));return o?[i]:(i.push(...t.slice(e.length)),[i])});function ms(t,e){for(let r in e)r in t||(t[r]=e[r])}T.extend("object",(t,{dict:e},r,o)=>{if(!To(t))throw new q(`expected object but got ${t}`,r);let i={};for(let s in e){let n=Io(t,s,e[s],r);(!Te(n)||s in t)&&(i[s]=n)}return o||ms(i,t),[i]});T.extend("union",(t,{list:e,toString:r},o,i)=>{let s=[];for(let n of e)try{return T.resolve(t,n,o,i)}catch(a){s.push(a)}throw new q(`expected ${r()} but got ${JSON.stringify(t)}`,o)});T.extend("intersect",(t,{list:e,toString:r},o,i)=>{if(!e.length)return[t];let s;for(let n of e){let a=T.resolve(t,n,o,!0)[0];if(!Te(a))if(Te(s))s=a;else{if(typeof s!=typeof a)throw new q(`expected ${r()} but got ${JSON.stringify(t)}`,o);if(typeof a=="object")ms(s??(s={}),a);else if(s!==a)throw new q(`expected ${r()} but got ${JSON.stringify(t)}`,o)}}return!i&&To(t)&&ms(s,t),[s]});T.extend("transform",(t,{inner:e,callback:r,preserve:o},i)=>{let[s,n=t]=T.resolve(t,e,i,!0);return o?[r(s)]:[r(s),r(n)]});var xa={};function pe(t,e,r){xa[t]=r,Object.assign(T,{[t](...o){let i=new T({type:t});return e.forEach((s,n)=>{switch(s){case"sKey":i.sKey=o[n]??T.string();break;case"inner":i.inner=T.from(o[n]);break;case"list":i.list=o[n].map(T.from);break;case"dict":i.dict=lt(o[n],T.from);break;case"bits":i.bits={};for(let a in o[n])typeof o[n][a]=="number"&&(i.bits[a]=o[n][a]);break;case"callback":{let a=i.callback=o[n];a.toJSON||(a.toJSON=()=>a.toString());break}case"constructor":{let a=i.constructor=o[n];typeof a=="function"&&(a.toJSON||(a.toJSON=()=>a.name));break}default:i[s]=o[n]}}),t==="object"||t==="dict"?i.meta.default={}:t==="array"||t==="tuple"?i.meta.default=[]:t==="bitset"&&(i.meta.default=0),i}})}pe("is",["constructor"],({constructor:t})=>typeof t=="function"?t.name:t);pe("any",[],()=>"any");pe("never",[],()=>"never");pe("const",["value"],({value:t})=>typeof t=="string"?JSON.stringify(t):t);pe("string",[],()=>"string");pe("number",[],()=>"number");pe("boolean",[],()=>"boolean");pe("bitset",["bits"],()=>"bitset");pe("function",[],()=>"function");pe("array",["inner"],({inner:t})=>`${t.toString(!0)}[]`);pe("dict",["inner","sKey"],({inner:t,sKey:e})=>`{ [key: ${e.toString()}]: ${t.toString()} }`);pe("tuple",["list"],({list:t})=>`[${t.map(e=>e.toString()).join(", ")}]`);pe("object",["dict"],({dict:t})=>Object.keys(t).length===0?"{}":`{ ${Object.entries(t).map(([e,r])=>`${e}${r.meta.required?"":"?"}: ${r.toString()}`).join(", ")} }`);pe("union",["list"],({list:t},e)=>{let r=t.map(({toString:o})=>o()).join(" | ");return e?`(${r})`:r});pe("intersect",["list"],({list:t})=>`${t.map(e=>e.toString(!0)).join(" & ")}`);pe("transform",["inner","callback","preserve"],({inner:t},e)=>t.toString(e));var Y=Fe($("react"),1);var or=null;function ya(t,e){t.currentIndex=0,t.wipContextDeps=null,t.wipCommitCallbacks=[];let r=or;or=t;try{if(e(),t.isFirstRender=!1,t.cells.length!==t.currentIndex)throw new Error(`Rendered ${t.currentIndex} hooks but expected ${t.cells.length}. Hooks must be called in the exact same order in every render.`)}finally{or=r}}function ie(){if(!or)throw new Error("No resource fiber available");return or}function ke(){return or}var Z=typeof process<"u"&&!1;var Eo=t=>({version:0,committedVersion:0,dispatchUpdate:t,changelog:[],committedLog:[],unsettledCount:0,rollbackCallbacks:[]}),Mr=t=>{t.committedVersion=t.version;for(let e of t.changelog)e.logged=!1,e.settled||(e.settled=!0,t.unsettledCount--),t.committedLog.push(e);t.changelog.length=0,t.unsettledCount===0&&(t.committedLog.length=0),t.rollbackCallbacks.length=0},jt=(t,e)=>{let r=t.version>e;if(t.version=e,r){for(let o=0;o<t.rollbackCallbacks.length;o++)t.rollbackCallbacks[o]();if(t.rollbackCallbacks.length=0,e<=t.committedVersion){let o=[];for(;t.committedVersion-o.length>e;){let i=t.committedLog.pop();if(i===void 0){if(Z)throw new Error("tap: committed history is shorter than the replay base.");break}Ro(i.fiber,i.cell),i.cell.workInProgress=i.prevState,o.push({record:i,prevState:i.prevState,eagerState:i.eagerState,hasEagerState:i.hasEagerState})}if(o.length>0){let i=t.committedVersion;ir(t,()=>{for(let s=o.length-1;s>=0;s--){let n=o[s];n.record.prevState=n.prevState,n.record.eagerState=n.eagerState,n.record.hasEagerState=n.hasEagerState,t.committedLog.push(n.record)}t.committedVersion=i})}t.committedVersion=e;for(let i of t.changelog)i.logged=!1;t.changelog.length=0}else{for(;t.committedVersion+t.changelog.length>e;)t.changelog.pop().logged=!1;for(let o=0;o<t.changelog.length;o++)fs(t.changelog[o]);Mr(t)}}},fs=t=>{var e;Ro(t.fiber,t.cell),t.queued||(t.queued=!0,((e=t.cell).queue??(e.queue=[])).push(t))},St=(t,e)=>{t.wipCommitCallbacks.push(e)},ir=(t,e)=>{t.rollbackCallbacks.push(e)},Ro=(t,e)=>{e.isDirty||(e.isDirty=!0,t.markDirty?.(),ir(t.root,()=>{if(e.queue!==null){for(let r of e.queue)r.queued=!1;e.queue=null}e.workInProgress=e.current,e.isDirty=!1}))};var gs=Symbol.for("react.memo_cache_sentinel"),vs=t=>new Array(t).fill(gs),cp=(t,e)=>{let r=t.memoCache,o=r.workInProgress;if(o===null){let n=r.current;o=n===null?[]:n.map(a=>a.slice()),r.workInProgress=o,ir(t.root,()=>{r.workInProgress=null})}let i=r.index++,s=o[i];return s===void 0?(s=vs(e),o[i]=s):Z&&s.length!==e&&console.error(`Expected a constant size argument for each invocation of c(). The previous cache was allocated with size ${s.length} but size ${e} was requested.`),s},Ao=t=>cp(ie(),t);var Mo=Fe($("react"),1),lp=Mo.default,dp=t=>(0,Mo.useMemo)(()=>{let e=vs(t);return e[gs]=!0,e},[]),_a=lp.__COMPILER_RUNTIME?.c??dp;var up=()=>ke()!==null,g=t=>up()?Ao(t):_a(t);var me=(t,...e)=>Object.assign(Object.create(null),t,...e);var _={};ls(_,{Children:()=>Cp,Fragment:()=>Cs,Suspense:()=>Ip,cloneElement:()=>Es,createContext:()=>we,createElement:()=>Is,default:()=>dr.default,forwardRef:()=>re,isValidElement:()=>Nr,lazy:()=>kp,memo:()=>te,use:()=>Vt,useCallback:()=>It,useContext:()=>ut,useDebugValue:()=>Ts,useDeferredValue:()=>Ep,useEffect:()=>D,useEffectEvent:()=>Or,useId:()=>Tp,useImperativeHandle:()=>ks,useInsertionEffect:()=>Ft,useLayoutEffect:()=>Ue,useMemo:()=>G,useReducer:()=>Ss,useRef:()=>F,useState:()=>z,useSyncExternalStore:()=>it});var sr=()=>{throw new Error("Rendered more hooks than during the previous render. Hooks must be called in the exact same order in every render.")},nr=()=>{throw new Error("Hook order changed between renders")};var pp=()=>({type:"effect",setup:void 0,setupDeps:void 0,cleanup:void 0,deps:null,generation:0});function he(t,e){let r=ie(),o=r.currentIndex++,i=r.cells[o],s=i===void 0?pp():i.type==="effect"?i:nr();if(i===void 0&&(r.isFirstRender||sr(),r.cells[o]=s,r.effectCells.push(s)),s.deps!==null&&!!e!=!!s.deps)throw new Error("useEffect called with and without dependencies across re-renders");St(r,()=>{s.setup=t,s.setupDeps=e,s.generation++})}var Tt=(t,e)=>{Z&&t.length!==e.length&&console.error(`The final argument passed to a hook changed size between renders. The order and size of this array must remain constant.

Previous: [${t.join(", ")}]
Incoming: [${e.join(", ")}]`);for(let r=0;r<t.length&&r<e.length;r++)if(!Object.is(t[r],e[r]))return!1;return!0};var Sa=(t,e)=>{St(t,()=>{e.current=e.wip,e.currentDeps=e.wipDeps,e.isDirty=!1})},kt=(t,e)=>{let r=ie(),o=r.currentIndex++,i=r.cells[o];if(i===void 0){r.isFirstRender||sr();let a=t();return Z&&r.devStrictMode&&t(),i={type:"memo",current:a,currentDeps:e,wip:a,wipDeps:e,isDirty:!1},r.cells[o]=i,a}i.type!=="memo"&&nr();let s=i;if(Tt(s.wipDeps,e))return s.isDirty&&Sa(r,s),s.wip;let n=t();return Z&&r.devStrictMode&&t(),s.wip=n,s.wipDeps=e,s.isDirty||(s.isDirty=!0,ir(r.root,()=>{s.wip=s.current,s.wipDeps=s.currentDeps,s.isDirty=!1})),Sa(r,s),n};function Ve(t){return kt(()=>({current:t}),[])}var bs=Symbol("tap.Context.defaultValue"),mp=t=>t,ot=new Map,Lt=new Set,Ta=()=>new Map(ot),Po=(t,e)=>{let r=ot;ot=t;try{return e()}finally{ot=r}},ws=(t,e)=>{t[bs]=e},ka=t=>typeof t=="object"&&t!==null&&bs in t,Ca=t=>typeof t=="object"&&t!==null&&"$$typeof"in t&&t.$$typeof===Symbol.for("react.context"),xs=t=>ka(t)||Ca(t),Ia=t=>{if(!ka(t)){if(Ca(t)){ws(t,t._currentValue??t._currentValue2);return}throw new Error("A tap resource's `use()` only accepts a tap context.")}},dt=(t,e,r)=>{if(typeof t!="object"||t===null)throw new Error("useContextProvider only accepts a React context.");Ia(t);let o=t,i=ie(),s=Ve(void 0),n=s.current===void 0||!Object.is(s.current.value,e);he(()=>{s.current={value:e}},[e]);let a=ot.get(o),c=a!==void 0||ot.has(o);ot.set(o,{value:e,source:i});try{return hp(o,n,r)}finally{c?ot.set(o,a):ot.delete(o)}},hp=(t,e,r)=>{let o=Lt.has(t);e?Lt.add(t):Lt.delete(t);try{return r()}finally{o?Lt.add(t):Lt.delete(t)}},Do=t=>{Ia(t);let e=t,r=fp(e,t),o=ie();return(o.wipContextDeps??(o.wipContextDeps=new Map)).set(e,r.source),r.value},fp=(t,e)=>ot.get(t)??{value:mp(e)[bs],source:null},gp=(t,e,r,o)=>{if(!o)return r;let i=r;for(let[s,n]of o)n===e||n===t||(i??(i=new Map)).set(s,n);return i},Oo=(t,e=t.wipContextDeps)=>{let r=ke();!r||!e||(r.wipContextDeps=gp(r,t,r.wipContextDeps,e))},ys=()=>Lt.size>0,Pr=t=>{if(!t.contextDeps||!ys())return!1;for(let e of Lt.keys())if(t.contextDeps.has(e))return!0;return!1};var vp=(t,e,r)=>{if(t.isNeverMounted)throw new Error("Resource updated before mount");let o=!1,i=!0;t.root.unsettledCount++,t.root.dispatchUpdate(()=>(o||(o=!0,r&&t.root.changelog.length===0&&!e.cell.isDirty&&!e.hasEagerState&&(e.prevState=e.cell.workInProgress,e.eagerState=r(e.cell.workInProgress,e.action),e.hasEagerState=!0,i=!Object.is(e.cell.current,e.eagerState),!i&&!e.settled&&(e.settled=!0,t.root.unsettledCount--))),i),()=>(o=!0,i=!0,fs(e),e.logged||(e.logged=!0,t.root.changelog.push(e)),!0))},bp=(t,e,r,o,i)=>{let s=o?o(r):r;Z&&t.devStrictMode&&o&&o(r);let n={type:"reducer",workInProgress:s,current:s,isDirty:!1,queue:null,renderQueue:null,reducer:e,dispatch:a=>{let c=ke();if(c!==null){if(c!==t)throw new Error("Cannot update a resource while rendering a different resource.");(t.renderPendingCells??(t.renderPendingCells=new Set)).add(n),(n.renderQueue??(n.renderQueue=[])).push(a)}else{let l={fiber:t,cell:n,action:a,hasEagerState:!1,eagerState:void 0,prevState:n.current,settled:!1,queued:!1,logged:!1};vp(t,l,i?e:void 0)}}};return n};function _s(t,e,r,o){let i=ie(),s=i.currentIndex++,n=i.cells[s],a=(()=>{if(n!==void 0)return n.type==="reducer"?n:nr();i.isFirstRender||sr();let l=bp(i,t,e,r,o);return i.cells[s]=l,l})(),c=a.queue;if(c!==null){let l=t===a.reducer;for(let d=0;d<c.length;d++){let m=c[d];!m.hasEagerState||!l||!Object.is(m.prevState,a.workInProgress)?(m.prevState=a.workInProgress,m.eagerState=t(a.workInProgress,m.action),m.hasEagerState=!0,Z&&i.devStrictMode&&(m.eagerState=t(a.workInProgress,m.action))):Z&&i.devStrictMode&&t(a.workInProgress,m.action),m.queued=!1,a.workInProgress=m.eagerState}a.queue=null}if(a.reducer=t,a.renderQueue!==null){let l=a.workInProgress;for(let d of a.renderQueue)l=t(l,d);a.renderQueue=null,i.renderPendingCells?.delete(a),Object.is(l,a.workInProgress)||(Ro(i,a),a.workInProgress=l)}return a.isDirty&&St(i,()=>{a.current=a.workInProgress,a.isDirty=!1}),[a.workInProgress,a.dispatch]}function ar(t,e,r){return _s(t,e,r,!1)}var wp=(t,e)=>typeof e=="function"?e(t):e,xp=t=>t===void 0?void 0:typeof t=="function"?t():t;function No(t){return _s(wp,t,xp,!0)}var cr=(t,e)=>kt(()=>t,e);function lr(t){let e=ie(),r=Ve(t);return r.current!==t&&St(e,()=>{r.current=t}),cr(((...o)=>{if(Z&&ke())throw new Error("useEffectEvent cannot be called during render");return r.current(...o)}),[])}var Bo=t=>t!==null&&typeof t=="object"&&typeof t.then=="function",Ea=()=>{},Ra=t=>{let e=t;switch(typeof e.status!="string"?(e.status="pending",t.then(r=>{e.status==="pending"&&(e.status="fulfilled",e.value=r)},r=>{e.status==="pending"&&(e.status="rejected",e.reason=r)})):e.status!=="fulfilled"&&e.status!=="rejected"&&t.then(Ea,Ea),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:throw t}};var Dr=t=>Bo(t)?Ra(t):Do(t);var Aa=!1,$o=(t,e,r=e)=>{let o=ie().isNeverMounted,i=o?r():e();Z&&!Aa&&(!o||r===e)&&(Object.is(i,e())||(Aa=!0,console.error("The result of getSnapshot should be cached to avoid an infinite loop")));let[,s]=ar(c=>c+1,0),n=Ve(0),a=lr(()=>{try{if(Object.is(i,e()))return n.current=0,!1}catch{}return!0});return he(()=>t(()=>{a()&&s()}),[t]),he(()=>{if(a()){if(++n.current>50)throw n.current=0,new Error("Maximum update depth exceeded. The result of getSnapshot should be cached to avoid an infinite loop.");s()}},[t,i,e]),i};var jo=(t,e)=>{};var yp=0,Lo=()=>{let t=Ve(null);return t.current??(t.current=`:tap${yp++}:`),t.current};var Fo=(t,e,r)=>{let o=()=>{if(!t)return;let i=e();if(typeof t=="function"){let s=t(i);return typeof s=="function"?s:()=>t(null)}return t.current=i,()=>{t.current=null}};r==null?he(o):he(o,[...r,t])};var Ct=Fe($("react"),1),_p=Ct.default;function Sp(t){let e=(0,Ct.useRef)(t);return(0,Ct.useInsertionEffect)(()=>{e.current=t}),(0,Ct.useCallback)(((...r)=>e.current(...r)),[])}var Ma=_p.useEffectEvent??Sp;var dr=Fe($("react"),1);j(_,$("react"));var be=()=>ke()!==null,ee=dr.default,z=t=>be()?No(t):ee.useState(t),Ss=(t,e,r)=>be()?ar(t,e,r):ee.useReducer(t,e,r),F=t=>be()?Ve(t):ee.useRef(t),G=(t,e)=>be()?kt(t,e):ee.useMemo(t,e),It=(t,e)=>be()?cr(t,e):ee.useCallback(t,e),D=(t,e)=>be()?he(t,e):ee.useEffect(t,e),Ue=(t,e)=>be()?he(t,e):ee.useLayoutEffect(t,e),Or=t=>be()?lr(t):Ma(t),it=(t,e,r)=>be()?$o(t,e,r):ee.useSyncExternalStore(t,e,r),Ts=(t,e)=>be()?jo(t,e):ee.useDebugValue(t,e),Ft=(t,e)=>be()?he(t,e):ee.useInsertionEffect(t,e),Tp=()=>be()?Lo():ee.useId(),ks=(t,e,r)=>be()?Fo(t,e,r):ee.useImperativeHandle(t,e,r),re=t=>ee.forwardRef(t),te=(t,e)=>ee.memo(t,e),Cs=ee.Fragment,Is=(...t)=>ee.createElement(...t),Es=(...t)=>ee.cloneElement(...t),Nr=t=>ee.isValidElement(t),kp=t=>ee.lazy(t),Cp=ee.Children,Ip=ee.Suspense,Ep=(t,e)=>ee.useDeferredValue(t,e),we=t=>{let e=ee.createContext(t);return ws(e,t),e},Vt=t=>be()&&xs(t)?Dr(t):ee.use(t),ut=t=>be()&&xs(t)?Dr(t):ee.useContext(t);function L(t){return(...e)=>({hook:t,args:e})}function oe(t,e,r){return typeof e=="function"?(...o)=>oe(t,e(...o)):r?{...e,key:t,deps:r}:{...e,key:t}}var pt=(t,e)=>{if(t.length!==0){if(t.length===1)throw t[0];for(let r of t)console.error(r);throw new AggregateError(t,e)}};var Rp=50,ze={schedulers:new Set,isScheduled:!1},st=null,Rs=[],Ms=class{constructor(t){f(this,"_isDirty",!1);f(this,"_task");this._task=t}get isDirty(){return this._isDirty}markDirty(){if(st&&(st.get(this)??0)>=Rp)throw new Error("Maximum update depth exceeded. This can happen when a resource repeatedly calls setState inside useEffect.");this._isDirty=!0,ze.schedulers.add(this),Da()}runTask(){st?.set(this,(st.get(this)??0)+1),this._isDirty=!1,this._task()}settle(){this._isDirty=!1}},Ap=[],cx=new Ms(()=>{let t=Ap.splice(0),e=[];for(let r of t)try{r()}catch(o){e.push(o)}pt(e,"Errors occurred while running scheduled tasks")});var Pa=t=>{if(st!==null){Rs.push(t);return}t()},Da=()=>{ze.isScheduled||(ze.isScheduled=!0,Mp())},As=()=>{let t=st;st=new Map;let e=[];try{for(let r of ze.schedulers)if(ze.schedulers.delete(r),!!r.isDirty)try{r.runTask()}catch(o){e.push(o)}}finally{if(st=t,ze.schedulers.clear(),ze.isScheduled=!1,st===null)for(;Rs.length>0;)try{Rs.shift()()}catch(r){e.push(r)}}pt(e,"Errors occurred during flushSync")},Mp=(()=>{if(typeof MessageChannel<"u"){let t=null,e;return()=>{if(!t){let r=new MessageChannel;r.port1.onmessage=()=>{t?.unref?.(),As()},t=r.port1,e=r.port2}t.ref?.(),e.postMessage(null)}}return()=>setTimeout(As,0)})(),Ps=t=>{if(st!==null)return Z&&console.warn("flushTapSync was called from inside a render or commit. The flush is deferred until the current pass completes."),t();let e=ze;ze={schedulers:new Set,isScheduled:!0};try{let r=t();return As(),r}finally{let r=ze.schedulers;if(ze=e,r.size>0){for(let o of r)ze.schedulers.add(o);Da()}}};function Oa(t){let e=[];for(let r=0;r<t.length;r++)try{t[r]()}catch(o){e.push(o)}pt(e,"Errors during commit")}function Pp(t){let e=t.setup,r=t.setupDeps,o=t.generation,i;try{let s=e();if(s!==void 0&&typeof s!="function")throw new Error(`An effect function must either return a cleanup function or nothing. Received: ${typeof s}`);i=s}finally{t.generation===o?(t.cleanup=i,t.deps=r):i?.()}}var Dp=t=>t.setup===void 0?!1:t.deps===null||t.setupDeps===void 0?!0:!Tt(t.deps,t.setupDeps);function Ds(t){let e=[],r=[];for(let o of t.effectCells)Dp(o)&&r.push(o);for(let o of r)if(o.deps=null,o.cleanup!==void 0)try{o.cleanup()}catch(i){e.push(i)}finally{o.cleanup=void 0}for(let o of r)try{Pp(o)}catch(i){e.push(i)}pt(e,"Errors during commit")}function Os(t){let e=[];for(let r of t.effectCells)if(r.deps=null,r.cleanup)try{r.cleanup?.()}catch(o){e.push(o)}finally{r.cleanup=void 0}pt(e,"Errors during cleanup")}var Op={useState:No,useReducer:ar,useRef:Ve,useMemo:kt,useCallback:cr,useEffect:he,useLayoutEffect:he,useInsertionEffect:he,useEffectEvent:lr,useContext:Do,use:Dr,useSyncExternalStore:$o,useDebugValue:jo,useId:Lo,useImperativeHandle:Fo,useMemoCache:Ao},Na=dr.default,Ut=Na.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE??Na.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,Vo=Ut==null?null:"H"in Ut?{get current(){return Ut.H},set current(t){Ut.H=t}}:"ReactCurrentDispatcher"in Ut?{get current(){return Ut.ReactCurrentDispatcher.current},set current(t){Ut.ReactCurrentDispatcher.current=t}}:null;function Ba(t){if(!Vo)return t();let e=Vo.current;Vo.current=Op;try{return t()}finally{Vo.current=e}}function Uo(t,e,r=void 0,o){return{hook:t,root:e,markDirty:r,devStrictMode:o,cells:[],effectCells:[],contextDeps:null,wipContextDeps:null,wipCommitCallbacks:null,memoCache:{current:null,workInProgress:null,index:0},renderPendingCells:null,currentIndex:0,isFirstRender:!0,isMounted:!1,isNeverMounted:!0}}function Ns(t){t.wipCommitCallbacks=null,t.wipContextDeps=null,t.memoCache.workInProgress=null}function nt(t){t.isMounted&&(t.isMounted=!1,Os(t))}function He(t,e){if(t.renderPendingCells!==null){for(let i of t.renderPendingCells)i.renderQueue=null;t.renderPendingCells.clear()}let r=0,o;try{do{if(++r>25)throw new Error("Too many re-renders. tap limits the number of renders to prevent an infinite loop.");t.memoCache.index=0,ya(t,()=>{o=Ba(()=>t.hook(...e))})}while((t.renderPendingCells?.size??0)>0)}catch(i){throw Ns(t),i}return Oo(t),o}function Qe(t){let e=t.wipCommitCallbacks;t.wipCommitCallbacks=null;let r=Z&&!t.isMounted&&t.devStrictMode==="root";t.isMounted=!0,t.isNeverMounted=!1,e!==null&&(t.contextDeps=t.wipContextDeps,Mr(t.root),t.memoCache.workInProgress!==null&&(t.memoCache.current=t.memoCache.workInProgress,t.memoCache.workInProgress=null),Oa(e)),r&&(Ds(t),Os(t)),Ds(t)}var Np=()=>{let t=ie();return t.devStrictMode?t.isFirstRender?"child":"root":null},Bp=()=>"child",$a=()=>null,$p=()=>{if(!Z)return $a;let t=F(0);return z(()=>t.current++),t.current!==2?$a:Bp},zo=()=>ke()?Np:$p();var jp=t=>t(),Lp=t=>{let e=[];for(let r of t)try{r()}catch(o){e.push(o)}pt(e,"Errors occurred while notifying Tap root subscribers")},Fp=(t,e,r)=>{let o=new Ms(()=>a.handleUpdate()),i=[],s=Eo((c,l)=>{i.length===0&&!c()||(i.push(l),o.markDirty())}),n=Uo(jp,s,void 0,e),a={scheduler:o,queue:i,fiber:n,subscribers:new Set,pendingHostRender:!1,isMounted:!1,hasRendered:!1,committedRender:t,context:new Map,value:void 0,applyQueue:()=>{jt(s,s.committedVersion);for(let c of i)Z&&n.devStrictMode&&c(),c();return jt(s,s.committedVersion+s.changelog.length),i.length},publish:(c,l)=>{o.isDirty||s.committedVersion!==l||a.value===c||(a.value=c,Pa(()=>Lp(a.subscribers)))},finishFlush:(c,l,d)=>{Mr(s),i.splice(0,d),a.pendingHostRender=!1,i.length===0&&o.settle(),a.isMounted&&Qe(n),a.publish(c,l)},handleUpdate:()=>{let c=a.applyQueue(),l;try{Z&&n.devStrictMode&&Po(a.context,()=>He(n,[a.committedRender])),l=Po(a.context,()=>He(n,[a.committedRender]))}catch(d){if(jt(s,s.committedVersion),Bo(d)){let m=()=>{a.isMounted&&o.markDirty()};d.then(m,m);return}if(a.isMounted){a.pendingHostRender=!0,r(m=>m+1);return}throw d}if(o.isDirty)throw new Error("Scheduler is dirty, this should never happen");a.finishFlush(l,s.version,c)}};return a},Bs=t=>{let[,e]=z(0),r=zo(),o=F(null),i=o.current??(o.current=Fp(t,r(),e)),s=Ta(),n=i.scheduler.isDirty||i.pendingHostRender?i.applyQueue():0,a=Po(s,()=>He(i.fiber,[t])),c={render:t,context:s,value:a,drained:n,wip:i.fiber.wipCommitCallbacks,version:i.fiber.root.version,processed:!1};return i.hasRendered||(i.hasRendered=!0,i.committedRender=t,i.context=s,i.value=a),D(()=>(i.isMounted=!0,()=>{i.isMounted=!1,nt(i.fiber)}),[i]),D(()=>{if(c.processed){i.fiber.isMounted||(Qe(i.fiber),i.queue.length&&!i.scheduler.isDirty&&i.scheduler.markDirty());return}if(c.processed=!0,i.committedRender=c.render,i.context=c.context,i.fiber.wipCommitCallbacks!==c.wip){i.scheduler.isDirty||i.handleUpdate();return}if(c.drained>0&&i.fiber.root.version===c.version){i.finishFlush(c.value,c.version,c.drained);return}Qe(i.fiber),i.publish(c.value,c.version)}),G(()=>({getValue:()=>i.value,subscribe:l=>(i.subscribers.add(l),()=>i.subscribers.delete(l))}),[i])};var Vp=()=>{let t=F(0),e=t.current,r=ie();return{version:e,markDirty:G(()=>()=>{t.current++,r.markDirty?.()},[r]),root:r.root}},Up=()=>{let[t]=z(()=>Eo((i,s)=>{let n=!1;o(a=>(n=!i(),n?a:a+1)),n||r(s)})),[e,r]=Ss((i,s)=>(jt(t,i),i+(s()?1:0)),0),[,o]=z(0);return jt(t,e),{root:t,version:e,markDirty:void 0}},ur=()=>{let t=zo(),{root:e,version:r,markDirty:o}=ke()?Vp():Up();return{version:r,createFiber:It((i,s,n)=>Uo(i,e,n?()=>{n(),o?.()}:o,t()),[])}};var Ho=(t,e,r)=>{let o=F(null),i=o.current??(o.current={wipDeps:null,wip:null,currentDeps:null,current:null});return i.wipDeps=i.currentDeps,i.wip=i.current,D(()=>{i.currentDeps=i.wipDeps,i.current=i.wip}),!r&&i.currentDeps&&Tt(i.currentDeps,e)?i.current:(i.wipDeps=e,i.wip=t(),i.wip)};function fe(t){let{version:e,createFiber:r}=ur(),o=G(()=>r(t.hook,t.key),[t.hook,t.key,r]),i=Ho(()=>({value:He(o,t.args)}),[o,e,t.args],Pr(o));return D(()=>()=>nt(o),[o]),D(()=>{Qe(o)},[o,i]),i.value}var ja=(t,e)=>{let r=t.get(e);r&&(r.isDirty=!0)},zp=(t,e)=>!t.isDirty&&!Pr(t.fiber)&&e!==void 0&&t.committedDeps!==void 0&&Tt(t.committedDeps,e),Hp=t=>{if(!ys())return!1;for(let{fiber:e}of t.values())if(Pr(e))return!0;return!1};function zt(t){let[e]=z(()=>new Map),{version:r,createFiber:o}=ur(),i=Hp(e),s=Ho(()=>{let n=new Set,a=[],c=0;for(let l=0;l<t.length;l++){let d=t[l],m=d.key;if(m===void 0)throw new Error(`useResources did not provide a key for array at index ${l}`);if(n.has(m))throw new Error(`Duplicate key ${m} in useResources`);n.add(m);let p=e.get(m);if(p)if(p.fiber.hook!==d.hook){let u=o(d.hook,d.key,()=>ja(e,m)),h=He(u,d.args);p.next={value:h,deps:d.deps,remount:u}}else if(zp(p,d.deps))typeof p.next=="object"&&Ns(p.fiber),p.fiber.contextDeps&&Oo(p.fiber,p.fiber.contextDeps),p.next="skip";else{let u=He(p.fiber,d.args);p.next={value:u,deps:d.deps}}else{let u=o(d.hook,d.key,()=>ja(e,m));p={fiber:u,next:{value:He(u,d.args),deps:d.deps},isDirty:!1,committedDeps:void 0,committedValue:void 0},c++,e.set(m,p)}a.push(typeof p.next=="object"?p.next.value:p.committedValue)}if(e.size>a.length-c)for(let l of e.keys())n.has(l)||(e.get(l).next="delete");return a},[t,e,o,r],i);return D(()=>()=>{for(let n of e.keys())nt(e.get(n).fiber)},[e]),D(()=>{for(let[n,a]of e.entries()){let c=a.next;c==="delete"?(nt(a.fiber),e.delete(n)):c==="skip"?!a.fiber.isNeverMounted&&!a.fiber.isMounted&&Qe(a.fiber):(c.remount&&(nt(a.fiber),a.fiber=c.remount),Qe(a.fiber),a.committedDeps=c.deps,a.committedValue=c.value,a.isDirty=!1,a.next="skip")}},[s,e]),s}var qp=t=>t(),qo=t=>{let{createFiber:e}=ur(),r=G(()=>e(qp,void 0),[e]),o=He(r,[t]);D(()=>()=>{nt(r)},[r]);let i=!1,s=()=>{i&&r.isMounted||(i=!0,Qe(r))};return D(s),{value:o,effects:s}};var Gp=()=>{let t=g(4),[e,r]=z(Kp),o;t[0]===Symbol.for("react.memo_cache_sentinel")?(o=(c,l)=>(r(d=>{let m=me(d.renderers);return m[c]=[...m[c]??[],l],{...d,renderers:m}}),()=>{r(d=>{let m=me(d.renderers),p=m[c]?.filter(u=>u!==l)??[];return p.length>0?m[c]=p:delete m[c],{...d,renderers:m}})}),t[0]=o):o=t[0];let i=o,s;t[1]===Symbol.for("react.memo_cache_sentinel")?(s=c=>(r(l=>({...l,fallbacks:[...l.fallbacks,c]})),()=>{r(l=>({...l,fallbacks:l.fallbacks.filter(d=>d!==c)}))}),t[1]=s):s=t[1];let n=s,a;return t[2]!==e?(a={getState:()=>e,setDataUI:i,setFallbackDataUI:n},t[2]=e,t[3]=a):a=t[3],a},La=L(Gp);function Kp(){return{renderers:me(),fallbacks:[]}}var $s=t=>{if(!t.overwrite)return t;let{overwrite:e,...r}=t;return r},Fa=t=>{let e=Array.from(t).map(o=>o.getModelContext()).sort((o,i)=>(i.priority??0)-(o.priority??0)),r=me();return e.reduce((o,i)=>{let s=i.priority??0;if(i.system&&(o.system?o.system+=`

${i.system}`:o.system=i.system),i.tools)for(let[n,a]of Object.entries(i.tools)){let c=o.tools!==void 0&&Object.hasOwn(o.tools,n)?o.tools[n]:void 0;if(c&&c!==a){let l=r[n];if(l===s){if(!a.overwrite)throw new Error(`You tried to define a tool with the name ${n}, but it already exists.`);o.tools[n]=$s(a);continue}let d=l>s?c:a,m=l>s?a:c;o.tools[n]=$s({...m,...d}),r[n]=Math.max(l,s);continue}o.tools||(o.tools=me()),o.tools[n]=$s(a),Object.hasOwn(r,n)||(r[n]=s)}return i.config&&(o.config={...o.config,...i.config}),i.callSettings&&(o.callSettings={...o.callSettings,...i.callSettings}),i.unstable_composerMetadata&&(o.unstable_composerMetadata={...o.unstable_composerMetadata,...i.unstable_composerMetadata}),o},{})};var ce=(t,e,r)=>{let o=i=>{console.error(`[assistant-ui] ${r} listener threw an error`,i)};for(let i of t)try{let s=i(typeof e=="function"?e():e);s!==null&&(typeof s=="object"||typeof s=="function")&&"then"in s&&typeof s.then=="function"&&Promise.resolve(s).catch(o)}catch(s){o(s)}};var se=t=>t;var Wp=new Set(["$$typeof","nodeType","then","__v_raw","__v_isRef","__v_isReactive","__v_isReadonly","__v_isShallow","__v_skip"]),qe=(t,e)=>{if(t===Symbol.toStringTag)return e;if(typeof t!="symbol"){if(t==="toJSON")return()=>e;if(!Wp.has(t))return!1}},mt=class{getOwnPropertyDescriptor(t,e){let r=this.get(t,e);if(r!==void 0)return{value:r,writable:!1,enumerable:!0,configurable:!0}}set(){return!1}setPrototypeOf(){return!1}defineProperty(){return!1}deleteProperty(){return!1}preventExtensions(){return!1}};var Go=Symbol("assistant-ui.store.clientId"),Ko=Symbol("assistant-ui.store.instanceTag"),js=(t,e)=>{let r=new Proxy((()=>{}),{apply:()=>(e(),r),get:(o,i)=>i==="source"?t.source:i==="query"?t.query:i==="name"?t.name:i===Go?Jo(e()):e()[i],has:(o,i)=>i==="source"||i==="query"||i==="name"||i===Go||i in e(),ownKeys:()=>Reflect.ownKeys(e()),getOwnPropertyDescriptor:(o,i)=>{if(!(typeof i=="symbol"||!(i in e())))return{value:e()[i],writable:!1,enumerable:!0,configurable:!0}}});return r},Ls=(t,e)=>{let r=()=>{throw new Error(t)};return new Proxy((()=>{}),{apply:r,get:(o,i)=>{if(i==="source"||i==="query")return null;if(i==="name")return e;if(i===Go)return r();let s=qe(i,"AssistantClientAccessor");return s!==!1?s:r()},has:(o,i)=>i==="source"||i==="query"||i==="name",ownKeys:()=>[],getOwnPropertyDescriptor:()=>{}})},Et=t=>t?.source!=null,Wo=t=>t?.source===null,Jo=t=>t[Go]??t,Va=t=>t[Ko]??Jo(t);var ht=t=>t==="optional"||t==="subscribe"||t==="on"||t==="__proto__"||typeof t=="symbol",Br=t=>{let e=[];for(let r in t)ht(r)||e.push(r);return e};var Ht,Ua,Jp=(Ua=class extends mt{constructor(e){super();Bt(this,Ht);$t(this,Ht,e)}get(e,r){let o=qe(r,"OptionalAssistantClient");if(o!==!1)return o;if(ht(r))return;let i=ct(this,Ht)[r];return Et(i)?i:void 0}ownKeys(){return Br(ct(this,Ht))}has(e,r){return!ht(r)&&r in ct(this,Ht)}},Ht=new WeakMap,Ua),Qo=t=>new Proxy({},new Jp(t));var za=()=>()=>{},Qp="You are using a component or hook that requires an AuiProvider. Wrap your component in an <AuiProvider> component.",$r,jr,Lr,Yo,Ha,Yp=(Ha=class extends mt{constructor(e,r,o){super();Bt(this,$r);Bt(this,jr);Bt(this,Lr);Bt(this,Yo);$t(this,$r,e),$t(this,jr,r),$t(this,Lr,o)}get(e,r){if(r==="subscribe"||r==="on")return za;if(r==="optional")return ct(this,Yo)??$t(this,Yo,Qo(ct(this,Lr).call(this)));let o=qe(r,ct(this,$r));return o!==!1?o:Ls(ct(this,jr).call(this,String(r)),String(r))}ownKeys(){return["subscribe","on","optional"]}getOwnPropertyDescriptor(e,r){if(r!=="optional")return super.getOwnPropertyDescriptor(e,r);let o=this.get(e,r);if(o!==void 0)return{value:o,writable:!1,enumerable:!1,configurable:!0}}has(e,r){return r==="subscribe"||r==="on"||r==="optional"}},$r=new WeakMap,jr=new WeakMap,Lr=new WeakMap,Yo=new WeakMap,Ha),Xp=(t,e)=>{let r=new Proxy({},new Yp(t,e,()=>r));return r},Rt=Xp("DefaultAssistantClient",()=>Qp),qa=()=>new Proxy({},{get(t,e){let r=qe(e,"AssistantClient");return r!==!1?r:Ls(`The current scope does not have a "${String(e)}" property.`,String(e))}}),Xo=we(Rt),Zp=()=>{},Ga=new WeakMap,Ka=t=>Ga.get(t)??Zp,Wa=(t,e)=>{Ga.set(t,e)},Fr=()=>ut(Xo),Ja=(t,e)=>dt(Xo,t,e);var Fs=Symbol("assistant-ui.transform-scopes");function Vr(t,e){let r=t;if(r[Fs])throw new Error("transformScopes is already attached to this resource");r[Fs]=e}function Qa(t){return t[Fs]}var Ur=t=>typeof t=="string"?{scope:t.split(".")[0],event:t}:{scope:t.scope,event:t.event};var Ya=t=>{console.error("NotificationManager: event listener error",t)},Xa=(t,e,r)=>{try{let o=t(e,r);o!==null&&(typeof o=="object"||typeof o=="function")&&typeof o.then=="function"&&Promise.resolve(o).catch(Ya)}catch(o){Ya(o)}},em=()=>{let t=new Map,e=new Set,r=new Set;return{on(o,i){let s=i;if(o==="*")return e.add(s),()=>e.delete(s);let n=t.get(o);return n||(n=new Set,t.set(o,n)),n.add(s),()=>{n.delete(s),n.size===0&&t.get(o)===n&&t.delete(o)}},emit(o,i,s){!t.has(o)&&e.size===0||queueMicrotask(()=>{let n=t.get(o);if(n)for(let a of n)Xa(a,i,s);if(e.size>0){let a={event:o,payload:i};for(let c of e)Xa(c,a,s)}})},subscribe(o){return r.add(o),()=>r.delete(o)},notifySubscribers(){for(let o of r)try{o()}catch(i){console.error("NotificationManager: subscriber callback error",i)}}}},Vs=()=>z(em)[0];var Zo=Symbol("assistant-ui.store.clientIndex"),Za=t=>t[Zo],ec=we([]),zr=()=>Vt(ec),tc=(t,e)=>{let r=g(3),o=zr(),i;return r[0]!==t||r[1]!==o?(i=[...o,t],r[0]=t,r[1]=o,r[2]=i):i=r[2],dt(ec,i,e)};var oc=we(null),rc=Symbol("aui.scope-effect-unapplied"),ic=(t,e)=>dt(oc,t,e),Us=()=>{let t=Vt(oc);if(!t)throw new Error("AssistantTapContext is not available");return t},Hr=()=>Us().clientRef,qr=(t,e,r)=>{let o=g(8),{clientRef:i}=Us(),s;o[0]!==i||o[1]!==e||o[2]!==t?(s=()=>{let a=i.current;if(a===null)throw new Error("useAssistantScopeEffect ran before the client was committed. This is likely an internal bug in assistant-ui.");let c=()=>{let u=i.current?.[t];return u!==void 0&&Et(u)?Va(u):void 0},l=rc,d,m=u=>{if(d?.(),d=void 0,l=rc,u!==void 0){let h=e();d=typeof h=="function"?h:void 0}l=u};m(c());let p=a.subscribe(()=>{let u=c();u!==l&&m(u)});return()=>{p(),d?.()}},o[0]=i,o[1]=e,o[2]=t,o[3]=s):s=o[3];let n;o[4]!==i||o[5]!==r||o[6]!==t?(n=[i,t,...r],o[4]=i,o[5]=r,o[6]=t,o[7]=n):n=o[7],D(s,n)},Oe=()=>{let t=g(3),{emit:e}=Us(),r=zr(),o;return t[0]!==r||t[1]!==e?(o=(i,s)=>{e(i,s,r)},t[0]=r,t[1]=e,t[2]=o):o=t[2],Or(o)};var ei=we(void 0),zs=(t,e)=>{let r=Vt(ei);return dt(ei,t??r,e)};var ti=()=>{let t=g(3),[e]=z(tm),r,o;return t[0]!==e?(r=()=>()=>queueMicrotask(()=>e.abort()),o=[e],t[0]=e,t[1]=r,t[2]=o):(r=t[1],o=t[2]),Ft(r,o),e.signal};function tm(){return new AbortController}var ri=Symbol("assistant-ui.store.getValue"),Hs=t=>{let e=t[ri];if(!e)throw new Error("Client scope contains a non-client resource. Ensure your Derived get() returns a client created with useClientResource(), not a plain resource.");return e.getState?.()},sc=new Map;function rm(t){let e=sc.get(t);return e||(e=function(...r){if(!this||typeof this!="object")throw new Error(`Method "${String(t)}" called without proper context. This may indicate the function was called incorrectly.`);let o=this[ri];if(!o)throw new Error(`Method "${String(t)}" called on invalid client proxy. Ensure you are calling this method on a valid client instance.`);let i=o[t];if(!i)throw new Error(`Method "${String(t)}" is not implemented.`);if(typeof i!="function")throw new Error(`"${String(t)}" is not a function.`);return i(...r)},sc.set(t,e)),e}var om=class extends mt{constructor(e,r,o){super();f(this,"boundFns");f(this,"cachedReceiver");f(this,"outputRef");f(this,"tagRef");f(this,"index");this.outputRef=e,this.tagRef=r,this.index=o}get(e,r,o){if(r===ri)return this.outputRef.current;if(r===Zo)return this.index;if(r===Ko)return this.tagRef.current;let i=qe(r,"ClientProxy");if(i!==!1)return i;let s=this.outputRef.current[r];if(typeof s=="function"){if(o===void 0)return s;(!this.boundFns||this.cachedReceiver!==o)&&(this.boundFns=new Map,this.cachedReceiver=o);let n=this.boundFns.get(r);return n||(n=rm(r).bind(o),this.boundFns.set(r,n)),n}return s}ownKeys(){return Object.keys(this.outputRef.current)}has(e,r){return r===ri||r===Zo||r===Ko?!0:r in this.outputRef.current}},ft=t=>{let e=F(null),r=F(null),o=G(()=>({}),[t.hook,t.key]),i=zr().length,s=G(()=>new Proxy({},new om(e,r,i)),[i]),n=tc(s,function(){return fe(t)});return e.current||(e.current=n,r.current=o),D(()=>{e.current=n,r.current=o}),{methods:s,state:n.getState?.(),key:t.key}},oi=L(ft);var xe=(t,e)=>{if(Array.isArray(t)!==Array.isArray(e))return!1;if(Array.isArray(t)&&Array.isArray(e)){if(t.length!==e.length)return!1;for(let o=0;o<t.length;o++)if(!Object.is(t[o],e[o]))return!1;return!0}let r=Object.keys(t);return r.length===Object.keys(e).length&&r.every(o=>Object.hasOwn(e,o)&&Object.is(t[o],e[o]))};var Gr=t=>{let e=G(()=>({}),[]);return e.v!==void 0&&xe(e.v,t)?e.v:(e.v=t,t)},at=t=>{let e=g(2),r=F(void 0),o;return e[0]!==t?(o=i=>{let s=t(i);return r.current!==void 0&&xe(r.current,s)?r.current:(r.current=s,s)},e[0]=t,e[1]=o):o=e[1],o};var ii=(()=>{try{return!1}catch{return!1}})();var im=(t,e)=>{let r={...t},o=new Set,i=!0;for(;i;){i=!1;for(let s of Object.values(r)){if(o.has(s.hook))continue;o.add(s.hook);let n=Qa(s.hook);if(n){n(r,e),i=!0;break}}}return r},si=t=>t.hook===Gs,sm=t=>{if(!si(t))return{source:"root",query:{}};let e=t.args[0];return{source:e.source,query:e.query??{}}},qs=Symbol.for("aui.event-receiver-ref"),nc=(t,e)=>{let r=t===Rt?qa():t,o=Object.create(r);Object.assign(o,e);let i;return Object.defineProperty(o,"optional",{get:()=>i??(i=Qo(o)),enumerable:!1}),o},nm=({notifications:t,clientRef:e})=>G(()=>({subscribe:t.subscribe,on:function(r,o){if(!this)throw new Error("const { on } = useAui() is not supported. Use aui.on() instead.");let{scope:i,event:s}=Ur(r),n=r[qs];if(i!=="*"&&!n&&Wo(this[i]))throw new Error(`Scope "${i}" is not available. Use { scope: "*", event: "${s}" } to listen globally.`);let a=t.on(s,(l,d)=>{if(i==="*")return o(l);let m=((n??e).current??this)[i];if(!Et(m))return;let p=Jo(m);if(p===d[Za(p)])return o(l)});if(i!=="*"){if(n){if(e.parent===Rt)return a}else if(Wo(e.parent[i]))return a}let c=e.parent.on(r,o);return()=>{a(),c()}}}),[t,e]),ac=t=>{let e=g(5),r;e[0]!==t?(r=sm(t),e[0]=t,e[1]=r):r=e[1];let{source:o,query:i}=r,s=Gr(i),n;return e[2]!==o||e[3]!==s?(n={source:o,query:s},e[2]=o,e[3]=s,e[4]=n):n=e[4],Gr(n)},am=(t,e)=>{let r=g(3),o;return r[0]!==e||r[1]!==t?(o=e?t:oi(t),r[0]=e,r[1]=t,r[2]=o):o=r[2],fe(o)},cm=(t,e)=>{let r=Fr(),o=si(e),i=am(e,o),s=o?i:i.methods,n=ac(e),a=G(()=>js({name:t,...n},()=>s),[t,n,s]);return r[t]=a,a},lm=L(cm),dm=t=>{let e=g(2),r;return e[0]!==t?(r=t.map(gm),e[0]=t,e[1]=r):r=e[1],zt(r)},cc=(t,e)=>{let r=Gr(e),o=G(()=>({}),[]);return o.deps!==r&&(o.deps=r,o.client=t),o.client},lc=({parent:t,entries:e,clientRef:r,notifications:o})=>{let i=nm({notifications:o,clientRef:r}),s=nc(t,i),n=ic({clientRef:r,emit:o.emit},function(){return Ja(s,function(){return dm(e)})});return{client:cc(s,[t,...n])}},um=({parent:t,entries:e,destroySignal:r})=>{let o=F({parent:t,current:null}).current,{value:i,effects:s}=qo(function(){let a=Vs(),{client:c}=zs(r,function(){return lc({parent:t,entries:e,clientRef:o,notifications:a})});return D(()=>t.subscribe(a.notifySubscribers),[t,a]),D(()=>a.notifySubscribers()),c});return Ft(()=>{o.parent=t,o.current=i},[i,t,o]),{client:i,effects:s}},pm=({parent:t,entries:e,destroySignal:r})=>{let o=F({parent:t,current:null}).current,{value:i,effects:s}=qo(function(){let a=Vs(),c=Bs(function(){return zs(r,function(){return lc({parent:t,entries:e,clientRef:o,notifications:a})})}),l=it(c.subscribe,()=>c.getValue().client,()=>c.getValue().client);return D(()=>{let d=()=>Ps(()=>{o.current=c.getValue().client,a.notifySubscribers()}),m=c.subscribe(d),p=t.subscribe(d);return()=>{m(),p()}},[c,t,a]),l});return Ft(()=>{o.parent=t,o.current=i},[i,t,o]),{client:i,effects:s}},mm=(t,e,r,o)=>{let{get:i}=o.args[0],s=it(t.subscribe,()=>i(t),()=>i(t)),n=ac(o),a=G(()=>js({name:r,...n},()=>s),[r,n,s]);return e[r]=a,a},hm=(t,e)=>{if(ii){let[a]=z(()=>e.map(([d])=>d).join(",")),c=e.find(([,d])=>!si(d));if(c)throw new Error(`Scope "${c[0]}" is a root scope but this useAui mounted derived-only; remount with a new key to change scope kinds.`);let l=e.map(([d])=>d).join(",");if(l!==a)throw new Error(`A derived-only config mounted scopes [${a}] but now has [${l}]; remount with a new key to change the scope set.`)}let r=F({parent:t,current:null}).current,o=function(a,c){if(!this)throw new Error("const { on } = useAui() is not supported. Use aui.on() instead.");let{scope:l,event:d}=Ur(a);if(l==="*")return t.on(a,c);let m=a[qs];if(!m&&Wo(this[l]))throw new Error(`Scope "${l}" is not available. Use { scope: "*", event: "${d}" } to listen globally.`);return t.on({scope:l,event:d,[qs]:m??r},c)},i=nc(t,{subscribe:t.subscribe,on:o}),s=e.map(([a,c])=>mm(t,i,a,c)),n=cc(i,[t,...s]);return Ft(()=>{r.parent=t,r.current=n},[n,t,r]),n},fm=(t,e)=>{let r=g(8),o;r[0]!==e||r[1]!==t?(o=Object.entries(im(e,t)),r[0]=e,r[1]=t,r[2]=o):o=r[2];let i=o,s;r[3]!==i?(s=()=>i.length===0||i.some(vm),r[3]=i,r[4]=s):s=r[4];let[n]=z(s),a;return r[5]!==i||r[6]!==n?(a={entries:i,rooted:n},r[5]=i,r[6]=n,r[7]=a):a=r[7],a},dc=(t,e,r,o)=>{let{entries:i,rooted:s}=fm(t,e);return s?r({parent:t,entries:i,destroySignal:o}):{client:hm(t,i)}},uc=(t,e,r)=>dc(t,e,um,r);function U(t){let e=Fr();if(t){let r=ti(),{client:o,effects:i}=dc(e,t,pm,r);return i&&Wa(o,i),o}return e}function gm(t){let[e,r]=t;return oe(e,lm(e,r))}function vm(t){let[,e]=t;return!si(e)}var bm=t=>{let e;class r extends mt{get(s,n){let a=qe(n,"OptionalAssistantState");if(a!==!1)return a;let c=n;if(!ht(c)&&Et(t[c]))return Hs(t[c]())}ownKeys(){return Br(t)}has(s,n){return!ht(n)&&n in t}}class o extends mt{get(s,n){let a=qe(n,"AssistantState");if(a!==!1)return a;if(n==="optional")return e??(e=new Proxy({},new r));let c=n;if(!ht(c))return Hs(t[c]())}ownKeys(){return[...Br(t),"optional"]}has(s,n){return n==="optional"||!ht(n)&&n in t}}return new Proxy({},new o)},pc=new WeakMap,mc=t=>{let e=pc.get(t);return e||(e=bm(t),pc.set(t,e)),e};var R=t=>{let e=g(6),r=U(),o;e[0]!==r?(o=mc(r),e[0]=r,e[1]=o):o=e[1];let i=o,s,n;e[2]!==i||e[3]!==t?(s=()=>t(i),n=()=>t(i),e[2]=i,e[3]=t,e[4]=s,e[5]=n):(s=e[4],n=e[5]);let a=it(r.subscribe,s,n);if(typeof a=="object"&&a!==null&&(a===i||a===i.optional))throw new Error("You tried to return the entire AssistantState. This is not supported due to technical limitations.");return Ts(a),a};var Gs=t=>{let e=g(3),{get:r}=t,o=U(),i;return e[0]!==o||e[1]!==r?(i=()=>r(o),e[0]=o,e[1]=r,e[2]=i):i=e[2],R(i)},ne=L(Gs);var hc=t=>{if(t.key===void 0)throw new Error("useClientLookup: Element has no key");return t.key};function Ce(t){let e=g(12),r;e[0]!==t?(r=t.map(ym),e[0]=t,e[1]=r):r=e[1];let o=zt(r),i;e[2]!==t?(i=t.reduce(xm,Object.create(null)),e[2]=t,e[3]=i):i=e[3];let s=i,n;e[4]!==o?(n=o.map(wm),e[4]=o,e[5]=n):n=e[5];let a=n,c;e[6]!==s||e[7]!==o?(c=d=>{if("index"in d){if(d.index<0||d.index>=o.length)throw new Error(`useClientLookup: index ${d.index} out of bounds (length: ${o.length}) (ignore if recovered)`);return o[d.index].methods}let m=s[d.key];if(m===void 0)throw new Error(`useClientLookup: key "${d.key}" not found (ignore if recovered)`);return o[m].methods},e[6]=s,e[7]=o,e[8]=c):c=e[8];let l;return e[9]!==a||e[10]!==c?(l={state:a,get:c},e[9]=a,e[10]=c,e[11]=l):l=e[11],l}function wm(t){return t.state}function xm(t,e,r){return t[hc(e)]=r,t}function ym(t){return oe(hc(t),oi(t),t.deps)}var ni=(t,e=0)=>e===0?Math.abs(t.scrollHeight-t.scrollTop-t.clientHeight)<=1||t.scrollHeight<=t.clientHeight:t.scrollHeight-e-t.scrollTop-t.clientHeight<=1||t.scrollHeight-e<=t.clientHeight,Ks=(t,e=0)=>e===0?t.scrollHeight>t.clientHeight+1:t.scrollHeight-e>t.clientHeight+1,Ws=(t,e)=>t.scrollTop>e.scrollTop&&t.scrollHeight===e.scrollHeight;var ye=Symbol("skip-update"),Ye=(t,...e)=>{let r=[];for(let o of t)try{o(...e)}catch(i){r.push(i)}if(r.length===1)throw r[0];if(r.length>1){for(let o of r)console.error(o);throw new AggregateError(r)}},ai=t=>{Ye(t)},fc=(t,e)=>t===void 0||e===void 0?t===e:xe(t,e),pr=class{constructor(){f(this,"_subscribers",new Set)}subscribe(t){return this._subscribers.add(t),()=>this._subscribers.delete(t)}waitForUpdate(){return new Promise(t=>{let e=this.subscribe(()=>{e(),t()})})}_notifySubscribers(){Ye(this._subscribers)}};var ci=class{constructor(){f(this,"_subscriptions",new Set);f(this,"_connection")}get isConnected(){return!!this._connection}notifySubscribers(t,e){if(e){ce(this._subscriptions,t,e);return}Ye(this._subscriptions,t)}_updateConnection(){if(this._subscriptions.size>0){if(this._connection)return;this._connection=this._connect()}else{let t=this._connection;this._connection=void 0,t?.()}}subscribe(t){return this._subscriptions.add(t),this._updateConnection(),()=>{this._subscriptions.delete(t),this._updateConnection()}}},_e=class extends ci{constructor(e){super();f(this,"binding");f(this,"_previousState");f(this,"getState",()=>(this.isConnected||this._syncState(),this._previousState));this.binding=e;let r=e.getState();if(r===ye)throw new Error("Entry not available in the store");this._previousState=r}get path(){return this.binding.path}_syncState(){let e=this.binding.getState();return e===ye||fc(e,this._previousState)?!1:(this._previousState=e,!0)}_connect(){let e=()=>{this._syncState()&&this.notifySubscribers()},r=this.binding.subscribe(e);return this._syncState(),r}},Kr=class extends ci{constructor(e){super();f(this,"binding");f(this,"_previousStateDirty",!0);f(this,"_previousState");f(this,"getState",()=>{if(!this.isConnected||this._previousStateDirty){let e=this.binding.getState();e!==ye&&(this._previousState===void 0||!fc(e,this._previousState))&&(this._previousState=e),this._previousStateDirty=!1}if(this._previousState===void 0)throw new Error("Entry not available in the store");return this._previousState});this.binding=e}get path(){return this.binding.path}_connect(){let e=()=>{this._previousStateDirty=!0,this.notifySubscribers()},r=this.binding.subscribe(e);return this._previousStateDirty=!0,r}},qt=class extends ci{constructor(e){super();f(this,"binding");this.binding=e}get path(){return this.binding.path}getState(){return this.binding.getState()}outerSubscribe(e){return this.binding.subscribe(e)}_connect(){let e=()=>{this.notifySubscribers()},r=this.binding.getState(),o=r?.subscribe(e),i=()=>{let n=this.binding.getState();if(n===r)return;r=n;let a=o;o=void 0;try{a?.()}finally{o=n?.subscribe(e),e()}},s=this.outerSubscribe(i);return()=>ai([()=>s?.(),()=>o?.()])}},li=class extends ci{constructor(e){super();f(this,"config");this.config=e}getState(){return this.config.binding.getState()}outerSubscribe(e){return this.config.binding.subscribe(e)}_connect(){let e=`Runtime event "${this.config.event}"`,r=a=>{this.notifySubscribers(a,e)},o=this.config.binding.getState(),i=o?.unstable_on(this.config.event,r),s=()=>{let a=this.config.binding.getState();if(a===o)return;o=a;let c=i;i=void 0;try{c?.()}finally{i=a?.unstable_on(this.config.event,r)}},n=this.outerSubscribe(s);return()=>ai([()=>n?.(),()=>i?.()])}};var di=class{constructor(){f(this,"_providers",new Map);f(this,"_providerUnsubscribes",new Map);f(this,"_subscribers",new Set)}getModelContext(){return Fa(new Set(this._providers.values()))}registerModelContextProvider(t){let e=Symbol();this._providers.set(e,t);let r;try{r=t.subscribe?.(()=>{this.notifySubscribers()})}catch(i){this._providers.delete(e);try{this.notifySubscribers()}catch(s){console.error(s)}throw i}this._providerUnsubscribes.set(e,r),this.notifySubscribers();let o=!1;return()=>{if(o)return;o=!0,this._providers.delete(e);let i=this._providerUnsubscribes.get(e);this._providerUnsubscribes.delete(e);let s=!1,n,a=c=>{try{c()}catch(l){s?console.error(l):(s=!0,n=l)}};if(i&&a(i),a(()=>this.notifySubscribers()),s)throw n}}notifySubscribers(){Ye(this._subscribers)}subscribe(t){return this._subscribers.add(t),()=>{this._subscribers.delete(t)}}};var Js=[],_m={modelName:void 0,toolNames:Js},Sm=(t,e)=>t===e||xe(t,e),ui=(t,e)=>{let r=t.getModelContext(),o=r.config?.modelName,i=r.tools?Object.keys(r.tools).sort():Js,s=i.length?i:Js;return o===e.modelName&&Sm(s,e.toolNames)?e:{modelName:o,toolNames:s}},Tm=()=>{let t=g(11),e;t[0]===Symbol.for("react.memo_cache_sentinel")?(e=new di,t[0]=e):e=t[0];let r=e,o;t[1]===Symbol.for("react.memo_cache_sentinel")?(o=()=>ui(r,_m),t[1]=o):o=t[1];let[i,s]=z(o),n,a;t[2]===Symbol.for("react.memo_cache_sentinel")?(n=()=>(s(u=>ui(r,u)),r.subscribe(()=>{s(u=>ui(r,u))})),a=[r],t[2]=n,t[3]=a):(n=t[2],a=t[3]),D(n,a);let c;t[4]!==i?(c=()=>ui(r,i),t[4]=i,t[5]=c):c=t[5];let l,d,m;t[6]===Symbol.for("react.memo_cache_sentinel")?(l=()=>r.getModelContext(),d=u=>r.subscribe(u),m=u=>r.registerModelContextProvider(u),t[6]=l,t[7]=d,t[8]=m):(l=t[6],d=t[7],m=t[8]);let p;return t[9]!==c?(p={getState:c,getModelContext:l,subscribe:d,register:m},t[9]=c,t[10]=p):p=t[10],p},pi=L(Tm);var gc=(t,e)=>{if(!(e.status?.type==="running"||e.status?.type==="requires-action")){let o=t.complete;return typeof o!="function"?o??null:o({args:e.args,result:e.result})}let r=t.running;return typeof r!="function"?r??null:r({args:e.args})};var vc=t=>t.display!==void 0?t.display==="standalone":t.type==="human",bc=t=>function(r){return gc(t,r)};var wc=t=>{let e=g(16),{toolkit:r,mcpApp:o}=t,i;e[0]!==o?(i=o?[oe("mcpApp",o)]:[],e[0]=o,e[1]=i):i=e[1];let s=zt(i)[0],[n,a]=z(km),c;e[2]!==s||e[3]!==n?(c={toolUIs:n,mcpApp:s},e[2]=s,e[3]=n,e[4]=c):c=e[4];let l=c,d=Hr(),m;e[5]===Symbol.for("react.memo_cache_sentinel")?(m=(S,A,I)=>{let k={render:A,renderText:I?.renderText,standalone:I?.standalone??!1};return a(E=>{let C=me(E);return C[S]=[...C[S]??[],k],C}),()=>{a(E=>{let C=E[S]?.filter(P=>P!==k)??[],x=me(E);return C.length>0?(x[S]=C,x):(delete x[S],x)})}},e[5]=m):m=e[5];let p=m,u,h;e[6]!==r?(u=()=>{if(!r)return;let S=[];for(let[A,I]of Object.entries(r)){let k="render"in I?I.render:void 0,E="renderText"in I?I.renderText:void 0,C=k??(E?bc(E):void 0);C&&S.push(p(A,C,{standalone:vc(I),renderText:E}))}return()=>{S.forEach(Cm)}},h=[r,p],e[6]=r,e[7]=u,e[8]=h):(u=e[7],h=e[8]),D(u,h);let v;e[9]!==d||e[10]!==r?(v=()=>{if(!r)return;let S=Object.entries(r).reduce(Im,me());return d.current.modelContext().register({getModelContext:()=>({tools:S})})},e[9]=d,e[10]=r,e[11]=v):v=e[11];let b;e[12]!==r?(b=[r],e[12]=r,e[13]=b):b=e[13],qr("modelContext",v,b);let y;return e[14]!==l?(y={getState:()=>l,setToolUI:p},e[14]=l,e[15]=y):y=e[15],y},xc=L(wc);Vr(wc,(t,e)=>{!t.modelContext&&e.modelContext.source===null&&(t.modelContext=pi())});function km(){return me()}function Cm(t){return t()}function Im(t,e){let[r,o]=e;if(o.type==="mcp")return t;let{display:i,render:s,renderText:n,...a}=o;return t[r]=a,t}var Ie=t=>it(t.subscribe,t.getState,t.getServerSnapshot);var Em=Symbol.for("assistant-ui.silent-runtime-action"),yc=t=>typeof t=="object"&&t!==null&&Em in t;var mi=(t,e)=>{let r=e();return r.catch(o=>{yc(o)||console.error(`[assistant-ui] ${t} failed:`,o)}),r};var Rm=t=>{let e=g(9),{runtime:r}=t,o=Ie(r),i;e[0]!==o?(i=()=>o,e[0]=o,e[1]=i):i=e[1];let s,n;e[2]!==r?(s=()=>mi("attachment remove",r.remove),n=()=>r,e[2]=r,e[3]=s,e[4]=n):(s=e[3],n=e[4]);let a;return e[5]!==i||e[6]!==s||e[7]!==n?(a={getState:i,remove:s,__internal_getRuntime:n},e[5]=i,e[6]=s,e[7]=n,e[8]=a):a=e[8],a},hi=L(Rm);var Am=t=>{let e=g(5),{runtime:r,index:o}=t,i;e[0]!==o||e[1]!==r?(i=r.getAttachmentByIndex(o),e[0]=o,e[1]=r,e[2]=i):i=e[2];let s=i,n;return e[3]!==s?(n=hi({runtime:s}),e[3]=s,e[4]=n):n=e[4],fe(n)},Mm=L(Am),Pm=({item:t,onMove:e,onRemove:r})=>({getState:()=>t,steer:()=>e({lane:"steer",insertAfter:null}),move:e,remove:r}),Dm=L(Pm),Om=t=>{let e=g(63),{threadIdRef:r,messageIdRef:o,runtime:i,isSuggestion:s}=t,n=Ie(i),a=Oe(),c=F(!1),l,d;e[0]!==a||e[1]!==o||e[2]!==i||e[3]!==r?(l=()=>{let O=[],V=i.unstable_on("send",J=>{let ge=c.current;c.current=!1,a("composer.send",{threadId:r.current,...o&&{messageId:o.current},chars:J.chars,attachments:J.attachments,...ge?{suggestion:!0}:void 0})});O.push(V);let Q=i.unstable_on("attachmentAdd",J=>{a("composer.attachmentAdd",{threadId:r.current,...o&&{messageId:o.current},...J.contentType?{contentType:J.contentType}:void 0})});return O.push(Q),O.push(i.unstable_on("attachmentAddError",J=>{a("composer.attachmentAddError",{threadId:r.current,...o&&{messageId:o.current},...J.attachmentId&&{attachmentId:J.attachmentId},reason:J.reason,message:J.message,...J.contentType?{contentType:J.contentType}:void 0})})),()=>{for(let J of O)J()}},d=[i,a,r,o],e[0]=a,e[1]=o,e[2]=i,e[3]=r,e[4]=l,e[5]=d):(l=e[4],d=e[5]),D(l,d);let m;if(e[6]!==i||e[7]!==n.attachments){let O;e[9]!==i?(O=(V,Q)=>oe(V.id,Mm({runtime:i,index:Q}),[i,Q]),e[9]=i,e[10]=O):O=e[10],m=n.attachments.map(O),e[6]=i,e[7]=n.attachments,e[8]=m}else m=e[8];let p=Ce(m),u=n.queue,h;if(e[11]!==u||e[12]!==i){let O;e[14]!==i?(O=V=>oe(V.id,Dm({item:V,onMove:Q=>i.moveQueueItem(V.id,Q),onRemove:()=>i.removeQueueItem(V.id)})),e[14]=i,e[15]=O):O=e[15],h=u.map(O),e[11]=u,e[12]=i,e[13]=h}else h=e[13];let v=Ce(h),b=n.type??"thread",y;e[16]!==p.state||e[17]!==u||e[18]!==n.attachmentAccept||e[19]!==n.canCancel||e[20]!==n.canSend||e[21]!==n.dictation||e[22]!==n.isEditing||e[23]!==n.isEmpty||e[24]!==n.quote||e[25]!==n.role||e[26]!==n.runConfig||e[27]!==n.text||e[28]!==b?(y={text:n.text,role:n.role,attachments:p.state,runConfig:n.runConfig,isEditing:n.isEditing,canCancel:n.canCancel,canSend:n.canSend,attachmentAccept:n.attachmentAccept,isEmpty:n.isEmpty,type:b,dictation:n.dictation,quote:n.quote,queue:u},e[16]=p.state,e[17]=u,e[18]=n.attachmentAccept,e[19]=n.canCancel,e[20]=n.canSend,e[21]=n.dictation,e[22]=n.isEditing,e[23]=n.isEmpty,e[24]=n.quote,e[25]=n.role,e[26]=n.runConfig,e[27]=n.text,e[28]=b,e[29]=y):y=e[29];let S=y,A;e[30]!==S?(A=()=>S,e[30]=S,e[31]=A):A=e[31];let I;e[32]!==s||e[33]!==i?(I=O=>{let V=i.getState();c.current=V.canSend&&(s?.(V.text)??!1),i.send(O)},e[32]=s,e[33]=i,e[34]=I):I=e[34];let k;e[35]!==a||e[36]!==o||e[37]!==i||e[38]!==r?(k=()=>{!o&&i.getState().canCancel&&a("composer.cancel",{threadId:r.current}),i.cancel()},e[35]=a,e[36]=o,e[37]=i,e[38]=r,e[39]=k):k=e[39];let E=i.beginEdit??Nm,C;e[40]!==p?(C=O=>"id"in O?p.get({key:O.id}):p.get(O),e[40]=p,e[41]=C):C=e[41];let x;e[42]!==v?(x=O=>"id"in O?v.get({key:O.id}):v.get(O),e[42]=v,e[43]=x):x=e[43];let P;e[44]!==i?(P=()=>i,e[44]=i,e[45]=P):P=e[45];let N;return e[46]!==i.addAttachment||e[47]!==i.clearAttachments||e[48]!==i.reset||e[49]!==i.setQuote||e[50]!==i.setRole||e[51]!==i.setRunConfig||e[52]!==i.setText||e[53]!==i.startDictation||e[54]!==i.stopDictation||e[55]!==E||e[56]!==C||e[57]!==x||e[58]!==P||e[59]!==A||e[60]!==I||e[61]!==k?(N={getState:A,setText:i.setText,setRole:i.setRole,setRunConfig:i.setRunConfig,addAttachment:i.addAttachment,reset:i.reset,clearAttachments:i.clearAttachments,send:I,cancel:k,beginEdit:E,startDictation:i.startDictation,stopDictation:i.stopDictation,setQuote:i.setQuote,attachment:C,queueItem:x,__internal_getRuntime:P},e[46]=i.addAttachment,e[47]=i.clearAttachments,e[48]=i.reset,e[49]=i.setQuote,e[50]=i.setRole,e[51]=i.setRunConfig,e[52]=i.setText,e[53]=i.startDictation,e[54]=i.stopDictation,e[55]=E,e[56]=C,e[57]=x,e[58]=P,e[59]=A,e[60]=I,e[61]=k,e[62]=N):N=e[62],N},fi=L(Om);function Nm(){throw new Error("beginEdit is not supported in this runtime")}var gi=t=>({get current(){return t()}});var Bm=t=>{let e=g(13),{runtime:r}=t,o=Ie(r),i;e[0]!==o?(i=()=>o,e[0]=o,e[1]=i):i=e[1];let s,n,a,c;e[2]!==r?(s=d=>r.addToolResult(d),n=d=>r.resumeToolCall(d),a=d=>r.respondToToolApproval(d),c=()=>r,e[2]=r,e[3]=s,e[4]=n,e[5]=a,e[6]=c):(s=e[3],n=e[4],a=e[5],c=e[6]);let l;return e[7]!==i||e[8]!==s||e[9]!==n||e[10]!==a||e[11]!==c?(l={getState:i,addToolResult:s,resumeToolCall:n,respondToToolApproval:a,__internal_getRuntime:c},e[7]=i,e[8]=s,e[9]=n,e[10]=a,e[11]=c,e[12]=l):l=e[12],l},_c=L(Bm);var $m=t=>{let e=g(5),{runtime:r,index:o}=t,i;e[0]!==o||e[1]!==r?(i=r.getAttachmentByIndex(o),e[0]=o,e[1]=r,e[2]=i):i=e[2];let s=i,n;return e[3]!==s?(n=hi({runtime:s}),e[3]=s,e[4]=n):n=e[4],fe(n)},jm=L($m),Lm=t=>{let e=g(5),{runtime:r,index:o}=t,i;e[0]!==o||e[1]!==r?(i=r.getMessagePartByIndex(o),e[0]=o,e[1]=r,e[2]=i):i=e[2];let s=i,n;return e[3]!==s?(n=_c({runtime:s}),e[3]=s,e[4]=n):n=e[4],fe(n)},Fm=L(Lm),Vm=t=>{let e=g(74),{runtime:r,threadIdRef:o,threadId:i}=t,s=Ie(r),n=Oe(),[a,c]=z(!1),[l,d]=z(!1),m;e[0]!==r?(m=gi(()=>r.getState().id),e[0]=r,e[1]=m):m=e[1];let p=m,u=F(s.status),h;e[2]!==n||e[3]!==r||e[4]!==i?(h=K=>{n(K,{threadId:i,messageId:r.getState().id})},e[2]=n,e[3]=r,e[4]=i,e[5]=h):h=e[5];let v=h,b,y;e[6]!==n||e[7]!==s.id||e[8]!==s.status||e[9]!==i?(b=()=>{let K=s.status,yt=u.current;u.current=K,K?.type==="incomplete"&&K.reason==="error"&&(yt?.type!=="incomplete"||yt.reason!=="error")&&n("message.error",{threadId:i,messageId:s.id,reason:"error"})},y=[s.status,s.id,n,i],e[6]=n,e[7]=s.id,e[8]=s.status,e[9]=i,e[10]=b,e[11]=y):(b=e[10],y=e[11]),D(b,y);let S;e[12]!==p||e[13]!==r.composer||e[14]!==o?(S=fi({runtime:r.composer,threadIdRef:o,messageIdRef:p}),e[12]=p,e[13]=r.composer,e[14]=o,e[15]=S):S=e[15];let A=ft(S),I;if(e[16]!==r||e[17]!==s.content){let K;e[19]!==r?(K=(yt,er)=>oe("toolCallId"in yt&&yt.toolCallId!=null?`toolCallId-${yt.toolCallId}`:`index-${er}`,Fm({runtime:r,index:er}),[r,er]),e[19]=r,e[20]=K):K=e[20],I=s.content.map(K),e[16]=r,e[17]=s.content,e[18]=I}else I=e[18];let k=Ce(I),E;e[21]!==s.attachments?(E=s.attachments??[],e[21]=s.attachments,e[22]=E):E=e[22];let C;if(e[23]!==r||e[24]!==E){let K;e[26]!==r?(K=(yt,er)=>oe(yt.id,jm({runtime:r,index:er}),[r,er]),e[26]=r,e[27]=K):K=e[27],C=E.map(K),e[23]=r,e[24]=E,e[25]=C}else C=e[25];let x=Ce(C),P=s,N;e[28]!==A.state||e[29]!==a||e[30]!==l||e[31]!==k.state||e[32]!==P?(N={...P,parts:k.state,composer:A.state,isCopied:a,isHovering:l},e[28]=A.state,e[29]=a,e[30]=l,e[31]=k.state,e[32]=P,e[33]=N):N=e[33];let O=N,V;e[34]!==O?(V=()=>O,e[34]=O,e[35]=V):V=e[35];let Q;e[36]!==A.methods?(Q=()=>A.methods,e[36]=A.methods,e[37]=Q):Q=e[37];let J;e[38]!==r?(J=()=>r.delete(),e[38]=r,e[39]=J):J=e[39];let ge,Re;e[40]!==v||e[41]!==r?(ge=K=>(v("message.reload"),r.reload(K)),Re=()=>(v("message.speak"),r.speak()),e[40]=v,e[41]=r,e[42]=ge,e[43]=Re):(ge=e[42],Re=e[43]);let Ae,Me;e[44]!==r?(Ae=()=>r.stopSpeaking(),Me=K=>r.submitFeedback(K),e[44]=r,e[45]=Ae,e[46]=Me):(Ae=e[45],Me=e[46]);let Pe;e[47]!==v||e[48]!==r?(Pe=K=>(v("message.branchSwitched"),r.switchToBranch(K)),e[47]=v,e[48]=r,e[49]=Pe):Pe=e[49];let De;e[50]!==r?(De=()=>r.unstable_getCopyText(),e[50]=r,e[51]=De):De=e[51];let We;e[52]!==k?(We=K=>"index"in K?k.get({index:K.index}):k.get({key:`toolCallId-${K.toolCallId}`}),e[52]=k,e[53]=We):We=e[53];let H;e[54]!==x?(H=K=>"id"in K?x.get({key:K.id}):x.get(K),e[54]=x,e[55]=H):H=e[55];let X;e[56]!==v?(X=K=>{K&&v("message.copied"),c(K)},e[56]=v,e[57]=X):X=e[57];let ve;e[58]!==r?(ve=()=>r,e[58]=r,e[59]=ve):ve=e[59];let Zt;return e[60]!==V||e[61]!==Q||e[62]!==J||e[63]!==ge||e[64]!==Re||e[65]!==Ae||e[66]!==Me||e[67]!==Pe||e[68]!==De||e[69]!==We||e[70]!==H||e[71]!==X||e[72]!==ve?(Zt={getState:V,composer:Q,delete:J,reload:ge,speak:Re,stopSpeaking:Ae,submitFeedback:Me,switchToBranch:Pe,getCopyText:De,part:We,attachment:H,setIsCopied:X,setIsHovering:d,__internal_getRuntime:ve},e[60]=V,e[61]=Q,e[62]=J,e[63]=ge,e[64]=Re,e[65]=Ae,e[66]=Me,e[67]=Pe,e[68]=De,e[69]=We,e[70]=H,e[71]=X,e[72]=ve,e[73]=Zt):Zt=e[73],Zt},Sc=L(Vm);var Um=t=>{let e=G(()=>({}),[]),r=e.state,o=[];t.suggestions.forEach(s=>{let n=r?.suggestions[o.length];o.push(n&&xe(n,s)?n:s)});let i=r&&xe(o,r.suggestions)?r:{suggestions:o};return e.state=i,i},zm=t=>({getState:()=>t}),Hm=L(zm),Tc=t=>{let e=g(9),r=Um(t),o;e[0]!==r.suggestions?(o=r.suggestions.map(Km),e[0]=r.suggestions,e[1]=o):o=e[1];let i=Ce(o),s;e[2]!==r?(s=()=>r,e[2]=r,e[3]=s):s=e[3];let n;e[4]!==i?(n=c=>{let{index:l}=c;return i.get({index:l})},e[4]=i,e[5]=n):n=e[5];let a;return e[6]!==s||e[7]!==n?(a={getState:s,suggestion:n},e[6]=s,e[7]=n,e[8]=a):a=e[8],a},qm=t=>{let e=g(6),r;e[0]!==t?(r=t??[],e[0]=t,e[1]=r):r=e[1];let o;e[2]!==r?(o=r.map(Wm),e[2]=r,e[3]=o):o=e[3];let i;return e[4]!==o?(i={suggestions:o},e[4]=o,e[5]=i):i=e[5],Tc(i)},XS=L(qm),Gm=t=>{let e=g(4),r;e[0]!==t?(r=t.map(Jm),e[0]=t,e[1]=r):r=e[1];let o;return e[2]!==r?(o={suggestions:r},e[2]=r,e[3]=o):o=e[3],Tc(o)},kc=L(Gm);function Km(t,e){return oe(e,Hm(t),[t])}function Wm(t){return typeof t=="string"?{title:t,label:"",prompt:t}:{title:t.title,label:t.label,prompt:t.prompt}}function Jm(t){return{title:t.title??t.prompt,label:t.label??"",prompt:t.prompt}}var Xe=Object.freeze({type:"complete"}),vi=Object.freeze({type:"running"}),Qm=Object.freeze({cancelled:Object.freeze({type:"incomplete",reason:"cancelled"}),length:Object.freeze({type:"incomplete",reason:"length"}),"content-filter":Object.freeze({type:"incomplete",reason:"content-filter"}),other:Object.freeze({type:"incomplete",reason:"other"}),error:Object.freeze({type:"incomplete",reason:"error"})}),Ym=t=>{let e=t.status;if(!e||typeof e!="object")return;let{type:r}=e;if(r==="running")return vi;if(r==="complete")return Xe;if(r!=="incomplete")return;let{reason:o}=e;return Qm[o==="cancelled"||o==="length"||o==="content-filter"||o==="other"||o==="error"?o:"other"]},bi=(t,e,r)=>{if(t.role!=="assistant")return Xe;if(r.type==="tool-call")return r.result===void 0?t.status:Xe;if(t.status.type==="running"){let i=Ym(r);if(i)return i}let o=e===Math.max(0,t.content.length-1);return t.status.type==="requires-action"?Xe:o?t.status:Xe};var Xm=t=>"reason"in t?t.reason:void 0,Zm=t=>"error"in t?t.error:void 0,eh=32,Cc=new WeakMap,Qs=t=>Cc.get(t)??t.id,th=(t,e,r)=>"status"in t&&t.status?bi(t,e,r):Xe,Ic=()=>{let t=[],e=new Map;return r=>{let o=[],i=new Map,s=!0,n=(c,l,d,m)=>{if(!(d>eh))for(let[p,u]of c.entries())for(let[h,v]of u.content.entries()){if(v.type!=="tool-call"||v.messages===void 0)continue;let b=v.messages,y=th(u,h,v),S=Xm(y),A=Zm(y),I=`${m}${p}.${h}`,k=e.get(I),E=k?.part===v&&k.statusType===y.type&&k.statusReason===S&&Object.is(k.statusError,A)&&k.messages===b&&k.task.messageId===u.id&&k.task.parentTaskId===l&&k.task.depth===d?k.task:{id:v.toolCallId,toolName:v.toolName,args:v.args,result:v.result,...v.isError===void 0?void 0:{isError:v.isError},status:y,timing:v.timing,messageId:u.id,parentTaskId:l,depth:d,messages:b};E!==k?.task&&(s=!1,Cc.set(E,I)),o.push(E),i.set(I,{task:E,part:v,statusType:y.type,statusReason:S,statusError:A,messages:b}),n(b,E.id,d+1,`${I}.`)}};n(r,null,0,"");let a=s&&o.length===t.length&&o.every((c,l)=>c===t[l])?t:o;return t=a,e=i,a}},rh=({task:t})=>({getState:()=>t}),Ec=L(rh);var oh=t=>{let e=g(7),{runtime:r,id:o,threadIdRef:i,threadId:s}=t,n;e[0]!==o||e[1]!==r?(n=r.getMessageById(o),e[0]=o,e[1]=r,e[2]=n):n=e[2];let a=n,c;return e[3]!==a||e[4]!==s||e[5]!==i?(c=Sc({runtime:a,threadIdRef:i,threadId:s}),e[3]=a,e[4]=s,e[5]=i,e[6]=c):c=e[6],fe(c)},ih=L(oh),sh=t=>{let e=g(93),{runtime:r}=t,o=Ie(r),i=Oe(),s,n;e[0]!==i||e[1]!==r?(s=()=>{let H=[];for(let X of["runStart","runEnd","initialize","modelContextUpdate"]){let ve=r.unstable_on(X,()=>{let Zt=r.getState()?.threadId||"unknown";i(`thread.${X}`,{threadId:Zt})});H.push(ve)}return H.push(r.unstable_on("toolApprovalAnswered",X=>{let ve=r.getState()?.threadId||"unknown";i("thread.toolApprovalAnswered",{threadId:ve,...X})})),()=>{for(let X of H)X()}},n=[r,i],e[0]=i,e[1]=r,e[2]=s,e[3]=n):(s=e[2],n=e[3]),D(s,n);let a;e[4]!==r?(a=gi(()=>r.getState().threadId),e[4]=r,e[5]=a):a=e[5];let c=a,l;e[6]!==i||e[7]!==r?(l=H=>{i(H,{threadId:r.getState().threadId})},e[6]=i,e[7]=r,e[8]=l):l=e[8];let d=l,m;e[9]!==r?(m=H=>r.getState().suggestions.some(X=>X.prompt===H),e[9]=r,e[10]=m):m=e[10];let p=m,u;e[11]!==p||e[12]!==r.composer||e[13]!==c?(u=fi({runtime:r.composer,threadIdRef:c,isSuggestion:p}),e[11]=p,e[12]=r.composer,e[13]=c,e[14]=u):u=e[14];let h=ft(u),v;e[15]!==o.suggestions?(v=kc(o.suggestions),e[15]=o.suggestions,e[16]=v):v=e[16];let b=ft(v),y;e[17]===Symbol.for("react.memo_cache_sentinel")?(y=Ic(),e[17]=y):y=e[17];let S=y,A;e[18]!==o.messages?(A=S(o.messages),e[18]=o.messages,e[19]=A):A=e[19];let I=A,k;e[20]!==I?(k=I.map(nh),e[20]=I,e[21]=k):k=e[21];let E=Ce(k),C;if(e[22]!==r||e[23]!==o.messages||e[24]!==o.threadId||e[25]!==c){let H;e[27]!==r||e[28]!==o.threadId||e[29]!==c?(H=X=>oe(X.id,ih({runtime:r,id:X.id,threadIdRef:c,threadId:o.threadId}),[r,X.id,c,o.threadId]),e[27]=r,e[28]=o.threadId,e[29]=c,e[30]=H):H=e[30],C=o.messages.map(H),e[22]=r,e[23]=o.messages,e[24]=o.threadId,e[25]=c,e[26]=C}else C=e[26];let x=Ce(C),P=x.state.length===0&&!o.isLoading,N;e[31]!==h.state||e[32]!==x.state||e[33]!==o.capabilities||e[34]!==o.extras||e[35]!==o.isDisabled||e[36]!==o.isLoading||e[37]!==o.isRunning||e[38]!==o.speech||e[39]!==o.state||e[40]!==o.suggestions||e[41]!==o.voice||e[42]!==P||e[43]!==I?(N={isEmpty:P,isDisabled:o.isDisabled,isLoading:o.isLoading,isRunning:o.isRunning,capabilities:o.capabilities,state:o.state,suggestions:o.suggestions,extras:o.extras,speech:o.speech,voice:o.voice,composer:h.state,messages:x.state,tasks:I},e[31]=h.state,e[32]=x.state,e[33]=o.capabilities,e[34]=o.extras,e[35]=o.isDisabled,e[36]=o.isLoading,e[37]=o.isRunning,e[38]=o.speech,e[39]=o.state,e[40]=o.suggestions,e[41]=o.voice,e[42]=P,e[43]=I,e[44]=N):N=e[44];let O=N,V;e[45]!==O?(V=()=>O,e[45]=O,e[46]=V):V=e[46];let Q;e[47]!==h.methods?(Q=()=>h.methods,e[47]=h.methods,e[48]=Q):Q=e[48];let J;e[49]!==b?(J=()=>b.methods,e[49]=b,e[50]=J):J=e[50];let ge;e[51]!==E||e[52]!==I?(ge=H=>{if("id"in H){let X=I.find(ve=>ve.id===H.id);return E.get({key:X?Qs(X):H.id})}return E.get(H)},e[51]=E,e[52]=I,e[53]=ge):ge=e[53];let Re;e[54]!==i||e[55]!==p||e[56]!==r?(Re=H=>{let X=typeof H=="string"?{content:[{type:"text",text:H}]}:H;if((X.role??"user")==="user"){let ve=X.content.map(ah).join("");i("composer.send",{threadId:r.getState().threadId,chars:ve.length,attachments:X.attachments?.length??0,...p(ve)?{suggestion:!0}:void 0})}r.append(H)},e[54]=i,e[55]=p,e[56]=r,e[57]=Re):Re=e[57];let Ae;e[58]!==d||e[59]!==r||e[60]!==o.isRunning?(Ae=()=>{o.isRunning&&d("thread.cancelRun"),r.cancelRun()},e[58]=d,e[59]=r,e[60]=o.isRunning,e[61]=Ae):Ae=e[61];let Me;e[62]!==d||e[63]!==r?(Me=()=>{r.connectVoice(),d("thread.voiceStarted")},e[62]=d,e[63]=r,e[64]=Me):Me=e[64];let Pe;e[65]!==x?(Pe=H=>"id"in H?x.get({key:H.id}):x.get(H),e[65]=x,e[66]=Pe):Pe=e[66];let De;e[67]!==r?(De=()=>r,e[67]=r,e[68]=De):De=e[68];let We;return e[69]!==r.deleteMessage||e[70]!==r.disconnectVoice||e[71]!==r.export||e[72]!==r.getModelContext||e[73]!==r.getVoiceVolume||e[74]!==r.import||e[75]!==r.importExternalState||e[76]!==r.muteVoice||e[77]!==r.reset||e[78]!==r.resumeRun||e[79]!==r.startRun||e[80]!==r.stopSpeaking||e[81]!==r.subscribeVoiceVolume||e[82]!==r.unmuteVoice||e[83]!==V||e[84]!==Q||e[85]!==J||e[86]!==ge||e[87]!==Re||e[88]!==Ae||e[89]!==Me||e[90]!==Pe||e[91]!==De?(We={getState:V,composer:Q,suggestions:J,task:ge,append:Re,deleteMessage:r.deleteMessage,startRun:r.startRun,resumeRun:r.resumeRun,importExternalState:r.importExternalState,cancelRun:Ae,getModelContext:r.getModelContext,export:r.export,import:r.import,reset:r.reset,stopSpeaking:r.stopSpeaking,connectVoice:Me,disconnectVoice:r.disconnectVoice,getVoiceVolume:r.getVoiceVolume,subscribeVoiceVolume:r.subscribeVoiceVolume,muteVoice:r.muteVoice,unmuteVoice:r.unmuteVoice,message:Pe,__internal_getRuntime:De},e[69]=r.deleteMessage,e[70]=r.disconnectVoice,e[71]=r.export,e[72]=r.getModelContext,e[73]=r.getVoiceVolume,e[74]=r.import,e[75]=r.importExternalState,e[76]=r.muteVoice,e[77]=r.reset,e[78]=r.resumeRun,e[79]=r.startRun,e[80]=r.stopSpeaking,e[81]=r.subscribeVoiceVolume,e[82]=r.unmuteVoice,e[83]=V,e[84]=Q,e[85]=J,e[86]=ge,e[87]=Re,e[88]=Ae,e[89]=Me,e[90]=Pe,e[91]=De,e[92]=We):We=e[92],We},Rc=L(sh);function nh(t){return oe(Qs(t),Ec({task:t}),[t])}function ah(t){return t.type==="text"?t.text:""}var Ze=(t,e)=>mi(`thread list ${t}`,e);var ch=t=>{let e=g(35),{runtime:r,mainThreadIsRunning:o}=t,i=o===void 0?!1:o,s=Ie(r),n;e:{let P=s.isRunning||s.isMain&&i;if(P===s.isRunning){n=s;break e}let N;e[0]!==P||e[1]!==s?(N={...s,isRunning:P},e[0]=P,e[1]=s,e[2]=N):N=e[2],n=N}let a=n,c=Oe(),{isMain:l,id:d}=s,m;e[3]!==l||e[4]!==d?(m={isMain:l,threadId:d},e[3]=l,e[4]=d,e[5]=m):m=e[5];let p=F(m),u,h;e[6]!==c||e[7]!==l||e[8]!==d?(u=()=>{let P=p.current;P.isMain===l&&P.threadId===d||(p.current={isMain:l,threadId:d},c(l?"threadListItem.switchedTo":"threadListItem.switchedAway",{threadId:d}))},h=[l,d,c],e[6]=c,e[7]=l,e[8]=d,e[9]=u,e[10]=h):(u=e[9],h=e[10]),D(u,h);let v;e[11]!==a?(v=()=>a,e[11]=a,e[12]=v):v=e[12];let b,y,S,A,I,k,E;e[13]!==r?(I=P=>Ze("switch",()=>r.switchTo(P)),k=P=>Ze("rename",()=>r.rename(P)),E=P=>Ze("update custom metadata",()=>r.updateCustom(P)),b=()=>Ze("archive",()=>r.archive()),y=()=>Ze("unarchive",()=>r.unarchive()),S=()=>Ze("delete",()=>r.delete()),A=P=>Ze("generate title",()=>r.generateTitle(P)),e[13]=r,e[14]=b,e[15]=y,e[16]=S,e[17]=A,e[18]=I,e[19]=k,e[20]=E):(b=e[14],y=e[15],S=e[16],A=e[17],I=e[18],k=e[19],E=e[20]);let C;e[21]!==r?(C=()=>r,e[21]=r,e[22]=C):C=e[22];let x;return e[23]!==r.detach||e[24]!==r.initialize||e[25]!==b||e[26]!==y||e[27]!==S||e[28]!==A||e[29]!==C||e[30]!==v||e[31]!==I||e[32]!==k||e[33]!==E?(x={getState:v,switchTo:I,rename:k,updateCustom:E,archive:b,unarchive:y,delete:S,generateTitle:A,initialize:r.initialize,detach:r.detach,__internal_getRuntime:C},e[23]=r.detach,e[24]=r.initialize,e[25]=b,e[26]=y,e[27]=S,e[28]=A,e[29]=C,e[30]=v,e[31]=I,e[32]=k,e[33]=E,e[34]=x):x=e[34],x},Ac=L(ch);var Mc=t=>{let e=g(4),r=Oe(),o=F(t),i,s;e[0]!==r||e[1]!==t?(i=()=>{let n=o.current;n!==t&&(o.current=t,r("threads.selectionChanged",{threadId:t,previousThreadId:n}))},s=[t,r],e[0]=r,e[1]=t,e[2]=i,e[3]=s):(i=e[2],s=e[3]),D(i,s)};var lh=t=>{let e=g(6),{runtime:r,id:o,mainThreadIsRunning:i}=t,s;e[0]!==o||e[1]!==r?(s=r.getItemById(o),e[0]=o,e[1]=r,e[2]=s):s=e[2];let n=s,a;return e[3]!==i||e[4]!==n?(a=Ac({runtime:n,mainThreadIsRunning:i}),e[3]=i,e[4]=n,e[5]=a):a=e[5],fe(a)},dh=L(lh),uh=t=>{let e=g(48),{runtime:r,__internal_assistantRuntime:o}=t,i=Ie(r);Mc(i.mainThreadId);let s=Oe(),n,a;e[0]!==s||e[1]!==r?(n=()=>r.unstable_subscribeThreadEvents(N=>{let{threadId:O,type:V}=N;O!==r.getState().mainThreadId&&s(`thread.${V}`,{threadId:O})}),a=[r,s],e[0]=s,e[1]=r,e[2]=n,e[3]=a):(n=e[2],a=e[3]),D(n,a);let c;e[4]!==r.main?(c=Rc({runtime:r.main}),e[4]=r.main,e[5]=c):c=e[5];let l=ft(c),d;e[6]!==l.state||e[7]!==r||e[8]!==i.threadItems?(d=Object.keys(i.threadItems).map(N=>oe(N,dh({runtime:r,id:N,mainThreadIsRunning:l.state.isRunning}),[r,N,l.state.isRunning])),e[6]=l.state,e[7]=r,e[8]=i.threadItems,e[9]=d):d=e[9];let m=Ce(d),p=i.newThreadId??null,u;e[10]!==l.state||e[11]!==i.archivedThreadIds||e[12]!==i.hasMore||e[13]!==i.isLoading||e[14]!==i.isLoadingMore||e[15]!==i.loadError||e[16]!==i.mainThreadId||e[17]!==i.threadIds||e[18]!==p||e[19]!==m.state?(u={mainThreadId:i.mainThreadId,newThreadId:p,isLoading:i.isLoading,loadError:i.loadError,isLoadingMore:i.isLoadingMore,hasMore:i.hasMore,threadIds:i.threadIds,archivedThreadIds:i.archivedThreadIds,threadItems:m.state,main:l.state},e[10]=l.state,e[11]=i.archivedThreadIds,e[12]=i.hasMore,e[13]=i.isLoading,e[14]=i.isLoadingMore,e[15]=i.loadError,e[16]=i.mainThreadId,e[17]=i.threadIds,e[18]=p,e[19]=m.state,e[20]=u):u=e[20];let h=u,v;e[21]!==h?(v=()=>h,e[21]=h,e[22]=v):v=e[22];let b;e[23]!==l.methods?(b=()=>l.methods,e[23]=l.methods,e[24]=b):b=e[24];let y;e[25]!==h||e[26]!==m?(y=N=>{if(N==="main")return m.get({key:h.mainThreadId});if("id"in N)return m.get({key:N.id});let{index:O,archived:V}=N,Q=V!==void 0&&V?h.archivedThreadIds[O]:h.threadIds[O];return m.get({key:Q})},e[25]=h,e[26]=m,e[27]=y):y=e[27];let S,A,I,k,E,C;e[28]!==r?(S=(N,O)=>Ze("switch",()=>r.switchToThread(N,O)),A=()=>Ze("create",()=>r.switchToNewThread()),I=()=>r.getLoadThreadsPromise(),k=()=>r.reload(),E=()=>r.reloadMainThread(),C=()=>r.loadMore(),e[28]=r,e[29]=S,e[30]=A,e[31]=I,e[32]=k,e[33]=E,e[34]=C):(S=e[29],A=e[30],I=e[31],k=e[32],E=e[33],C=e[34]);let x;e[35]!==o?(x=()=>o,e[35]=o,e[36]=x):x=e[36];let P;return e[37]!==S||e[38]!==A||e[39]!==I||e[40]!==k||e[41]!==E||e[42]!==C||e[43]!==x||e[44]!==v||e[45]!==b||e[46]!==y?(P={getState:v,thread:b,item:y,switchToThread:S,switchToNewThread:A,getLoadThreadsPromise:I,reload:k,reloadMainThread:E,loadMore:C,__internal_getAssistantRuntime:x},e[37]=S,e[38]=A,e[39]=I,e[40]=k,e[41]=E,e[42]=C,e[43]=x,e[44]=v,e[45]=b,e[46]=y,e[47]=P):P=e[47],P},Pc=L(uh);var Dc=(t,e)=>{t.thread??(t.thread=ne({source:"threads",query:{type:"main"},get:r=>r.threads.thread("main")})),t.threadListItem??(t.threadListItem=ne({source:"threads",query:{type:"main"},get:r=>r.threads.item("main")})),t.composer??(t.composer=ne({source:"thread",query:{},get:r=>r.threads.thread("main").composer()})),!t.modelContext&&e.modelContext.source===null&&(t.modelContext=pi()),!t.suggestions&&e.suggestions.source===null&&(t.suggestions=ne({source:"thread",query:{},get:r=>r.thread.suggestions()}))};var Oc=t=>{let e=g(7),r=Hr(),o;e[0]!==r||e[1]!==t?(o=()=>t.registerModelContextProvider(r.current.modelContext()),e[0]=r,e[1]=t,e[2]=o):o=e[2];let i;e[3]!==t?(i=[t],e[3]=t,e[4]=i):i=e[4],qr("modelContext",o,i);let s;return e[5]!==t?(s=Pc({runtime:t.threads,__internal_assistantRuntime:t}),e[5]=t,e[6]=s):s=e[6],fe(s)},Nc=L(Oc),ph=(t,e)=>{Dc(t,e),!t.tools&&e.tools.source===null&&(t.tools=xc({})),!t.dataRenderers&&e.dataRenderers.source===null&&(t.dataRenderers=La())};Vr(Oc,ph);var mr=$("react/jsx-runtime"),mh=se({}),Bc=({effects:t})=>{"use no memo";return Ue(t),null},le=re(function(e,r){"use no memo";let{config:o,children:i}=e,s="extends"in e,n="value"in e,a=Fr();if(ii){if(s&&n)throw new Error("AuiProvider: pass either `extends` or `value`, not both.");if(s&&e.extends===void 0)throw new Error("AuiProvider: `extends` must be a client or null, not undefined.");if(s&&!o)throw new Error("AuiProvider: `extends` requires a `config`.");if(n&&o)throw new Error("AuiProvider: pass either `value` or `config`, not both.");if(!n&&!o)throw new Error("AuiProvider: a `config` is required.");if(!s&&!n&&a!==Rt)throw new Error("A parent AuiProvider exists \u2014 pass extends={aui} to inherit it or extends={null} to isolate.")}let c=s?e.extends??Rt:n?e.value??Rt:a,l=ti(),{client:d,effects:m}=uc(c,o??mh,l);return ks(r,()=>d,[d]),(0,mr.jsx)(ei.Provider,{value:l,children:(0,mr.jsxs)(Xo.Provider,{value:d,children:[(0,mr.jsx)(Bc,{effects:Ka(c)}),m&&(0,mr.jsx)(Bc,{effects:m}),i]})})});var hh=t=>{let e=U(),r=F(!1),o=r.current?null:t(e);return R(()=>r.current?t(e):o),()=>(r.current=!0,t(e))},fh=Object.freeze({});function gt(t){let e=g(3),{getItemState:r,children:o}=t,i=hh(r),s;return e[0]!==o||e[1]!==i?(s=o(i),e[0]=o,e[1]=i,e[2]=s):s=e[2],gh(s)}var gh=t=>{let e=typeof t=="object"&&t!=null&&"type"in t?t:null,r=e?.type,o=e?.key,i=typeof e?.props=="object"&&e.props!=null&&Object.entries(e.props).length===0?fh:e?.props;return G(()=>e,[r,o,i])??t};var wi=(t,e)=>{let r=g(11),o=U(),i=Or(e),s;r[0]!==t?(s=Ur(t),r[0]=t,r[1]=s):s=r[1];let{scope:n,event:a}=s,c;r[2]!==o||r[3]!==i||r[4]!==a||r[5]!==n?(c=()=>o.on({scope:n,event:a},i),r[2]=o,r[3]=i,r[4]=a,r[5]=n,r[6]=c):c=r[6];let l;r[7]!==o||r[8]!==a||r[9]!==n?(l=[o,n,a],r[7]=o,r[8]=a,r[9]=n,r[10]=l):l=r[10],D(c,l)};var Wr=$("react/jsx-runtime"),$c=t=>t._core?.RenderComponent,vh=({runtime:t,aui:e,config:r,children:o})=>{"use no memo";let i=$c(t),s=se({...r,threads:Nc(t)});return(0,Wr.jsxs)(le,{extends:e,config:s,children:[i&&(0,Wr.jsx)(i,{}),o]})},Ys=te(t=>{let e=g(5),{runtime:r,aui:o,config:i,children:s}=t,n=o===void 0?null:o,a;return e[0]!==n||e[1]!==s||e[2]!==i||e[3]!==r?(a=(0,Wr.jsx)(vh,{runtime:r,aui:n,config:i,children:s}),e[0]=n,e[1]=s,e[2]=i,e[3]=r,e[4]=a):a=e[4],a});function de(t){return t!=null&&typeof t=="object"&&!Array.isArray(t)}function Jr(t,e=0){return e>100?!1:t===null||typeof t=="string"||typeof t=="boolean"?!0:typeof t=="number"?!Number.isNaN(t)&&Number.isFinite(t):Array.isArray(t)?t.every(r=>Jr(r,e+1)):de(t)?Object.entries(t).every(([r,o])=>typeof r=="string"&&Jr(o,e+1)):!1}var bh=100,Xs=(t,e,r)=>{if(t===e)return!0;if(r>bh||t==null||e==null)return!1;if(Array.isArray(t))return!Array.isArray(e)||t.length!==e.length?!1:t.every((s,n)=>Xs(s,e[n],r+1));if(Array.isArray(e)||!de(t)||!de(e))return!1;let o=Object.keys(t),i=Object.keys(e);return o.length!==i.length?!1:o.every(s=>Object.hasOwn(e,s)&&Xs(t[s],e[s],r+1))},Qr=(t,e)=>!Jr(t)||!Jr(e)?!1:Xs(t,e,0);var jc=Symbol.for("aui.tool-response"),xi="<no result>",Ne=class Zs{constructor(e){f(this,"artifact");f(this,"result");f(this,"isError");f(this,"modelContent");f(this,"messages");e.artifact!==void 0&&(this.artifact=e.artifact);let r=e.result;this.result=r===void 0?xi:r,this.isError=e.isError??!1,e.modelContent!==void 0&&(this.modelContent=e.modelContent),e.messages!==void 0&&(this.messages=e.messages)}get[jc](){return!0}static[Symbol.hasInstance](e){return typeof e=="object"&&e!==null&&jc in e}static toResponse(e){return e instanceof Zs?e:new Zs({result:e===void 0?xi:e})}};var hr=()=>{let t,e,r=new Promise((o,i)=>{t=o,e=i});if(!t||!e)throw new Error("Failed to create promise");return{promise:r,resolve:t,reject:e}};var Lc=()=>{let t=[],e=!1,r=!1,o=!1,i,s,n=0,a,c,l=()=>(s=void 0,c??(c=Promise.all(t.splice(0).map(async v=>{try{await v.reader.cancel().catch(()=>{}),await v.pipeTask}finally{v.reader.releaseLock()}})).then(()=>{})),c),d=v=>{r||o||(o=!0,console.error(v),l(),i.error(v),a?.reject(v),a=void 0)},m=v=>{v.promise||(v.promise=v.reader.read().then(({done:b,value:y})=>{v.promise=void 0,!(r||o)&&(b?(t.splice(t.indexOf(v),1),v.reader.releaseLock(),e&&t.length===0&&n===0&&i.close()):i.enqueue(y),a?.resolve(),a=void 0)}).catch(d))},p=new ReadableStream({start(v){i=v},pull(){return a=hr(),t.forEach(v=>{m(v)}),a.promise},async cancel(){r=!0;let v=l();a?.resolve(),a=void 0,await v}}),u=v=>{if(t.length>0&&(s=void 0),!s){let b=[];s=b,n++,Promise.resolve().then(()=>{if(n--,s===b&&(s=void 0),!(r||o)){for(let y of b)i.enqueue(y);e&&t.length===0&&n===0&&i.close(),a?.resolve(),a=void 0}}).catch(d)}s.push(v)};return{readable:p,isSealed(){return e},isCancelled(){return r},isErrored(){return o},seal(){e||r||o||(e=!0,t.length===0&&n===0&&i.close())},addStream:(v,b)=>{let y=b?.catch(()=>{});if(r||o){v.cancel().catch(()=>{});return}if(e)throw v.cancel().catch(()=>{}),new Error("Cannot add streams after the run callback has settled.");s=void 0;let S={reader:v.getReader(),pipeTask:y};t.push(S),m(S)},enqueue(v){if(!(r||o)){if(e)throw new Error("Cannot add streams after the run callback has settled.");u(v)}}}};var Fc=t=>t instanceof TypeError,Ee=(t,e,r)=>{try{t.enqueue(e)}catch(o){if(!Fc(o))throw o;r?.(o)}},yi=t=>{try{t.close()}catch(e){if(!Fc(e))throw e}};var _i=(t,e)=>new ReadableStream({start(r){return t.start?.(e(r))},pull(r){return t.pull?.(e(r))},cancel(r){return t.cancel?.(r)}}),Si=(t,e)=>{let r;return[_i({start(o){r=o},cancel(o){return e?.(r,o)}},t),r]};var Vc=class{constructor(t,e={}){f(this,"_controller");f(this,"_strict");f(this,"_isClosed",!1);f(this,"_warnedDropped",!1);f(this,"_warnDroppedAfterClose",t=>{this._warnedDropped||(this._warnedDropped=!0,console.error(`Dropped text delta for closed stream: ${String(t)}`))});this._controller=t,this._strict=e.strict??!0}append(t){let e={type:"text-delta",path:[],textDelta:t};if(this._isClosed){if(this._strict)throw new TypeError("Cannot append to a closed TextStreamController");return Ee(this._controller,e,this._warnDroppedAfterClose),this}return Ee(this._controller,e),this}close(){this._isClosed||(this._isClosed=!0,Ee(this._controller,{type:"part-finish",path:[]}),yi(this._controller))}},Uc=(t,e={})=>_i(t,r=>new Vc(r,e)),en=(t={})=>Si(e=>new Vc(e,t));var wh=class{constructor(t,e={}){f(this,"_isClosed",!1);f(this,"_mergeTask");f(this,"_controller");f(this,"_argsTextController");this._controller=t;let r=Uc({start:i=>{this._argsTextController=i}},e),o=!1;this._mergeTask=r.pipeTo(new WritableStream({write:i=>{switch(i.type){case"text-delta":o=!0,Ee(this._controller,i);break;case"part-finish":o||Ee(this._controller,{type:"text-delta",textDelta:"{}",path:[]}),Ee(this._controller,{type:"tool-call-args-text-finish",path:[]});break;default:throw new Error(`Unexpected chunk type: ${i.type}`)}}}))}get argsText(){return this._argsTextController}async setResponse(t){if(this._isClosed)return;let e=t.result;Ee(this._controller,{type:"result",path:[],...t.artifact!==void 0?{artifact:t.artifact}:{},result:e===void 0?xi:e,isError:t.isError??!1,...t.modelContent!==void 0?{modelContent:t.modelContent}:{},...t.messages!==void 0?{messages:t.messages}:{}}),await this.close()}async close(){this._isClosed||(this._isClosed=!0,this._argsTextController.close(),await this._mergeTask,Ee(this._controller,{type:"part-finish",path:[]}),yi(this._controller))}};var zc=(t={})=>Si(e=>new wh(e,t));var Ti=class{constructor(){f(this,"value",-1)}up(){return++this.value}};var Hc=class extends TransformStream{constructor(t){super({transform(e,r){r.enqueue({...e,path:[t,...e.path]})}})}},XT=class extends TransformStream{constructor(t){super({transform(e,r){let{path:[o,...i]}=e;if(t!==o)throw new Error(`Path mismatch: expected ${t}, got ${o}`);r.enqueue({...e,path:i})}})}},qc=class extends TransformStream{constructor(t){let e=new Ti,r=new Map;super({transform(o,i){o.type==="part-start"&&o.path.length===0&&r.set(e.up(),t.up());let[s,...n]=o.path;if(s===void 0){i.enqueue(o);return}let a=r.get(s);if(a===void 0)throw new Error("Path not found");i.enqueue({...o,path:[a,...n]})}})}};var ki=(t,e=21)=>(r=e)=>{let o="",i=r|0;for(;i-- >0;)o+=t[Math.random()*t.length|0];return o};var Gc=ki("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",7);var xh=class Kc{constructor(e,r={}){f(this,"_state");f(this,"_parentId");this._state=e||{strict:r.strict??!0,merger:Lc(),contentCounter:new Ti}}get __internal_isClosed(){return this._state.merger.isSealed()||this._state.merger.isCancelled()||this._state.merger.isErrored()}get __internal_isCancelled(){return this._state.merger.isCancelled()}__internal_getReadable(){return this._state.merger.readable}__internal_subscribeToClose(e){this._state.closeSubscriber=e}_addTransformedStream(e,r){if(e.locked)throw new TypeError("Cannot merge a stream that is already locked to a reader.");let o=e.pipeTo(r.writable).catch(async i=>{throw await r.writable.abort(i).catch(()=>{}),i});this._state.merger.addStream(r.readable,o)}_addPart(e,r){this._state.append&&(this._state.append.controller.close(),this._state.append=void 0),this.enqueue({type:"part-start",part:e,path:[]}),this._addTransformedStream(r,new Hc(this._state.contentCounter.value))}merge(e){this._addTransformedStream(e,new qc(this._state.contentCounter))}appendText(e){(this._state.append?.kind!=="text"||this._state.append.parentId!==this._parentId)&&(this._state.append={kind:"text",parentId:this._parentId,controller:this.addTextPart()}),this._state.append.controller.append(e)}appendReasoning(e,r){(r!==void 0||this._state.append?.kind!=="reasoning"||this._state.append.parentId!==this._parentId)&&(this._state.append={kind:"reasoning",parentId:this._parentId,controller:this.addReasoningPart(r)}),!(r!==void 0&&e.length===0)&&this._state.append.controller.append(e)}addTextPart(){let[e,r]=en({strict:this._state.strict});return this._addPart(this._withParentIdOption({type:"text"}),e),r}addReasoningPart(e){let[r,o]=en({strict:this._state.strict});return this._addPart(this._withParentIdOption({type:"reasoning",...e}),r),o}addToolCallPart(e){let r=typeof e=="string"?{toolName:e}:e,o=r.toolName,i=r.toolCallId??Gc(),[s,n]=zc({strict:this._state.strict});return this._addPart({type:"tool-call",toolName:o,toolCallId:i,...this._parentId&&{parentId:this._parentId}},s),r.argsText!==void 0&&(n.argsText.append(r.argsText),n.argsText.close()),r.args!==void 0&&(n.argsText.append(JSON.stringify(r.args)),n.argsText.close()),r.response!==void 0&&n.setResponse(r.response),n}_finishedPartStream(){return new ReadableStream({start(e){e.enqueue({type:"part-finish",path:[]}),e.close()}})}_withParentIdOption(e){return this._parentId?{...e,parentId:this._parentId}:e}appendSource(e){this._addPart(this._withParentIdOption(e),this._finishedPartStream())}appendFile(e){this._addPart(this._withParentIdOption(e),this._finishedPartStream())}appendData(e){this._addPart(this._withParentIdOption(e),this._finishedPartStream())}enqueue(e){this._state.merger.enqueue(e),e.type==="part-start"&&e.path.length===0&&this._state.contentCounter.up()}withParentId(e){let r=new Kc(this._state);return r._parentId=e,r}close(){this._state.append?.controller?.close(),this._state.merger.seal(),this._state.closeSubscriber?.()}};function Wc(t,e={}){let r=new xh(void 0,e);return(async()=>{try{await t(r)}catch(i){r.__internal_isClosed?r.__internal_isCancelled||console.error(i):r.enqueue({type:"error",path:[],error:String(i)})}finally{r.__internal_isClosed||r.close()}})(),r.__internal_getReadable()}function tn(t={}){let{resolve:e,promise:r}=hr(),o;return[Wc(i=>(o=i,o.__internal_subscribeToClose(e),r),t),o]}var Jc=class extends TransformStream{constructor(t){super();let e=t(super.readable);Object.defineProperty(this,"readable",{value:e,writable:!1})}};var Yr=class extends TransformStream{constructor(){let t=[];super({transform(e,r){if(e.type==="part-start"){if(e.path.length!==0){r.error(new Error("Nested parts are not supported"));return}t.push(e.part),r.enqueue(e);return}if(e.type==="text-delta"||e.type==="result"||e.type==="part-finish"||e.type==="tool-call-args-text-finish"){if(e.path.length!==1){r.error(new Error(`${e.type} chunks must have a path of length 1`));return}let o=e.path[0];if(o<0||o>=t.length){r.error(new Error(`Invalid path index: ${o}`));return}let i=t[o];r.enqueue({...e,meta:i});return}r.enqueue(e)}})}};var Sh=/[0-9a-fA-F]/;function el(t){let e=["ROOT"],r=-1,o=null,i=0,s=[],n;function a(){n!==void 0&&(s.push(JSON.parse(`"${n}"`)),n=void 0)}function c(p,u,h){switch(p){case'"':r=u,e.pop(),e.push(h),e.push("INSIDE_STRING"),a();break;case"f":case"t":case"n":r=u,o=u,e.pop(),e.push(h),e.push("INSIDE_LITERAL");break;case"-":e.pop(),e.push(h),e.push("INSIDE_NUMBER"),a();break;case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":r=u,e.pop(),e.push(h),e.push("INSIDE_NUMBER"),a();break;case"{":r=u,e.pop(),e.push(h),e.push("INSIDE_OBJECT_START"),a();break;case"[":r=u,e.pop(),e.push(h),e.push("INSIDE_ARRAY_START"),a()}}function l(p,u){switch(p){case",":e.pop(),e.push("INSIDE_OBJECT_AFTER_COMMA");break;case"}":r=u,e.pop(),n=s.pop()}}function d(p,u){switch(p){case",":e.pop(),e.push("INSIDE_ARRAY_AFTER_COMMA"),n=(Number(n)+1).toString();break;case"]":r=u,e.pop(),n=s.pop()}}for(let p=0;p<t.length;p++){let u=t[p];switch(e[e.length-1]){case"ROOT":c(u,p,"FINISH");break;case"INSIDE_OBJECT_START":switch(u){case'"':e.pop(),e.push("INSIDE_OBJECT_KEY"),n="";break;case"}":r=p,e.pop(),n=s.pop()}break;case"INSIDE_OBJECT_AFTER_COMMA":u==='"'&&(e.pop(),e.push("INSIDE_OBJECT_KEY"),n="");break;case"INSIDE_OBJECT_KEY":switch(u){case'"':e.pop(),e.push("INSIDE_OBJECT_AFTER_KEY");break;case"\\":e.push("INSIDE_STRING_ESCAPE"),n+=u;break;default:n+=u}break;case"INSIDE_OBJECT_AFTER_KEY":u===":"&&(e.pop(),e.push("INSIDE_OBJECT_BEFORE_VALUE"));break;case"INSIDE_OBJECT_BEFORE_VALUE":c(u,p,"INSIDE_OBJECT_AFTER_VALUE");break;case"INSIDE_OBJECT_AFTER_VALUE":l(u,p);break;case"INSIDE_STRING":switch(u){case'"':e.pop(),r=p,n=s.pop();break;case"\\":e.push("INSIDE_STRING_ESCAPE");break;default:r=p}break;case"INSIDE_ARRAY_START":u==="]"?(r=p,e.pop(),n=s.pop()):(n="0",c(u,p,"INSIDE_ARRAY_AFTER_VALUE"));break;case"INSIDE_ARRAY_AFTER_VALUE":switch(u){case",":e.pop(),e.push("INSIDE_ARRAY_AFTER_COMMA"),n=(Number(n)+1).toString();break;case"]":r=p,e.pop(),n=s.pop();break;default:r=p}break;case"INSIDE_ARRAY_AFTER_COMMA":c(u,p,"INSIDE_ARRAY_AFTER_VALUE");break;case"INSIDE_STRING_ESCAPE":{e.pop();let h=e[e.length-1];u==="u"?(e.push("INSIDE_STRING_UNICODE_ESCAPE"),i=0):h==="INSIDE_STRING"&&(r=p),h==="INSIDE_OBJECT_KEY"&&(n+=u);break}case"INSIDE_STRING_UNICODE_ESCAPE":{let h=e[e.length-2];if(!Sh.test(u)){e.pop(),p--;break}i++,i===4&&(e.pop(),h==="INSIDE_STRING"&&(r=p)),h==="INSIDE_OBJECT_KEY"&&(n+=u);break}case"INSIDE_NUMBER":switch(u){case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":r=p;break;case"e":case"E":case"-":case"+":case".":break;case",":e.pop(),n=s.pop(),e[e.length-1]==="INSIDE_ARRAY_AFTER_VALUE"&&d(u,p),e[e.length-1]==="INSIDE_OBJECT_AFTER_VALUE"&&l(u,p);break;case"}":e.pop(),n=s.pop(),e[e.length-1]==="INSIDE_OBJECT_AFTER_VALUE"&&l(u,p);break;case"]":e.pop(),n=s.pop(),e[e.length-1]==="INSIDE_ARRAY_AFTER_VALUE"&&d(u,p);break;default:e.pop(),n=s.pop()}break;case"INSIDE_LITERAL":{let h=t.substring(o,p+1);!"false".startsWith(h)&&!"true".startsWith(h)&&!"null".startsWith(h)?(e.pop(),e[e.length-1]==="INSIDE_OBJECT_AFTER_VALUE"?l(u,p):e[e.length-1]==="INSIDE_ARRAY_AFTER_VALUE"&&d(u,p)):r=p;break}}}let m=t.slice(0,r+1);for(let p=e.length-1;p>=0;p--)switch(e[p]){case"INSIDE_STRING":m+='"';break;case"INSIDE_OBJECT_KEY":case"INSIDE_OBJECT_AFTER_KEY":case"INSIDE_OBJECT_AFTER_COMMA":case"INSIDE_OBJECT_START":case"INSIDE_OBJECT_BEFORE_VALUE":case"INSIDE_OBJECT_AFTER_VALUE":m+="}";break;case"INSIDE_ARRAY_START":case"INSIDE_ARRAY_AFTER_COMMA":case"INSIDE_ARRAY_AFTER_VALUE":m+="]";break;case"INSIDE_LITERAL":{let u=t.substring(o,t.length);"true".startsWith(u)?m+="true".slice(u.length):"false".startsWith(u)?m+="false".slice(u.length):"null".startsWith(u)&&(m+="null".slice(u.length))}}return[m,s]}var sn=Fe(on(),1),Ci=Symbol("aui.parse-partial-json-object.meta"),tl=t=>t?.[Ci],gr=t=>{if(t.length===0)return{[Ci]:{state:"partial",partialPath:[]}};try{let e=sn.default.parse(t);if(typeof e!="object"||e===null)throw new Error("argsText is expected to be an object");return e[Ci]={state:"complete",partialPath:[]},e}catch{try{let[e,r]=el(t),o=sn.default.parse(e);if(typeof o!="object"||o===null)throw new Error("argsText is expected to be an object");return o[Ci]={state:"partial",partialPath:r},o}catch{return}}},rl=(t,e,r)=>{if(typeof t!="object"||t===null)return e.state;if(e.state==="complete")return"complete";if(r.length===0)return e.state;let[o,...i]=r;if(!Object.hasOwn(t,o))return"partial";let[s,...n]=e.partialPath;if(o!==s)return"complete";let a=t[o];return rl(a,{state:"partial",partialPath:n},i)},Gt=(t,e)=>{let r=tl(t);if(!r)throw new Error("unable to determine object state");return rl(t,r,e.map(String))};async function*Th(){let t=this.getReader(),e=!0;try{for(;;){let r;try{r=await t.read()}catch(i){throw e=!1,i}if(r.done){e=!1;break}let{value:o}=r;yield o}}finally{try{e&&await t.cancel()}finally{t.releaseLock()}}}function Ii(t){var e;return t[e=Symbol.asyncIterator]??(t[e]=Th),t}function ol(t,e,r){try{let o=t();if(typeof o=="object"&&o!==null&&"then"in o)return o.then(e,r);e(o)}catch(o){r(o)}}function Xr(t,e){let r=t;for(let o of e){if(r==null||!Object.hasOwn(r,o))return;r=r[o]}return r}var kh=class{constructor(t,e,r){f(this,"resolve");f(this,"reject");f(this,"disposed",!1);f(this,"fieldPath");this.resolve=t,this.reject=e,this.fieldPath=r}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{if(Gt(t,this.fieldPath)==="complete"){let e=Xr(t,this.fieldPath);e!==void 0&&(this.resolve(e),this.dispose())}}catch(e){this.reject(e),this.dispose()}}end(t){if(!this.disposed)try{let e=Xr(t,this.fieldPath);this.resolve(e)}catch(e){this.reject(e)}finally{this.dispose()}}dispose(){this.disposed=!0}},Ch=class{constructor(t,e){f(this,"controller");f(this,"disposed",!1);f(this,"fieldPath");this.controller=t,this.fieldPath=e}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{let e=Xr(t,this.fieldPath);e!==void 0&&this.controller.enqueue(e),Gt(t,this.fieldPath)==="complete"&&(this.controller.close(),this.dispose())}catch(e){this.controller.error(e),this.dispose()}}end(){this.disposed||(this.controller.close(),this.dispose())}dispose(){this.disposed=!0}},Ih=class{constructor(t,e){f(this,"controller");f(this,"disposed",!1);f(this,"fieldPath");f(this,"lastValue");this.controller=t,this.fieldPath=e}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{let e=Xr(t,this.fieldPath);if(e!==void 0&&typeof e=="string"){let r=e.substring(this.lastValue?.length||0);this.lastValue=e,this.controller.enqueue(r)}Gt(t,this.fieldPath)==="complete"&&(this.controller.close(),this.dispose())}catch(e){this.controller.error(e),this.dispose()}}end(){this.disposed||(this.controller.close(),this.dispose())}dispose(){this.disposed=!0}},Eh=class{constructor(t,e){f(this,"controller");f(this,"disposed",!1);f(this,"fieldPath");f(this,"nextIndex",0);this.controller=t,this.fieldPath=e}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{let e=Xr(t,this.fieldPath);if(!Array.isArray(e))return;for(;this.nextIndex<e.length;this.nextIndex++){let r=[...this.fieldPath,this.nextIndex];if(Gt(t,r)!=="complete")break;this.controller.enqueue(e[this.nextIndex])}Gt(t,this.fieldPath)==="complete"&&(this.controller.close(),this.dispose())}catch(e){this.controller.error(e),this.dispose()}}end(){this.disposed||(this.controller.close(),this.dispose())}dispose(){this.disposed=!0}},Rh=class{constructor(t){f(this,"argTextDeltas");f(this,"handles",new Set);f(this,"accumulatedText","");f(this,"parsedTextLength",-1);f(this,"args");f(this,"finished",!1);this.argTextDeltas=t,this.processStream()}async processStream(){try{let t=this.argTextDeltas.getReader();for(;;){let{value:e,done:r}=await t.read();if(r)break;this.accumulatedText+=e,this.handles.size!==0&&this.parseCurrentArgs()&&this.updateHandles()}}catch(t){console.error("Error processing argument stream:",t)}finally{this.finished=!0;for(let t of this.handles)t.end(this.args);this.handles.clear()}}parseCurrentArgs(){if(this.parsedTextLength===this.accumulatedText.length)return!1;let t=gr(this.accumulatedText);return this.parsedTextLength=this.accumulatedText.length,t===void 0?(this.args??(this.args=gr("")),!1):(this.args=t,!0)}updateHandles(){for(let t of this.handles)t.update(this.args),t.isDisposed&&this.handles.delete(t)}activateHandle(t){if(this.parseCurrentArgs(),t.update(this.args),!t.isDisposed){if(this.finished){t.end(this.args);return}this.handles.add(t)}}get(...t){return new Promise((e,r)=>{let o=new kh(e,r,t);this.activateHandle(o)})}streamValues(...t){let e=t,r,o=new ReadableStream({start:i=>{r=new Ch(i,e),this.activateHandle(r)},cancel:()=>{r&&(r.dispose(),this.handles.delete(r))}});return Ii(o)}streamText(...t){let e=t,r,o=new ReadableStream({start:i=>{r=new Ih(i,e),this.activateHandle(r)},cancel:()=>{r&&(r.dispose(),this.handles.delete(r))}});return Ii(o)}forEach(...t){let e=t,r,o=new ReadableStream({start:i=>{r=new Eh(i,e),this.activateHandle(r)},cancel:()=>{r&&(r.dispose(),this.handles.delete(r))}});return Ii(o)}},Ah=class{constructor(t){f(this,"promise");this.promise=t}get(){return this.promise}},il=class{constructor(){f(this,"args");f(this,"response");f(this,"writable");f(this,"resolve");f(this,"argsText","");f(this,"result",{get:async()=>(await this.response.get()).result});let t=new TransformStream;this.writable=t.writable,this.args=new Rh(t.readable);let{promise:e,resolve:r}=hr();this.resolve=r,this.response=new Ah(e)}async appendArgsTextDelta(t){let e=this.writable.getWriter();try{await e.write(t)}catch(r){console.warn(r)}finally{e.releaseLock()}this.argsText+=t}async finishArgsText(){let t=this.writable.getWriter();try{await t.close()}catch(e){console.warn(e)}finally{t.releaseLock()}}setResponse(t){this.resolve(t)}};var sl=Fe(on(),1),Mh=Symbol.for("assistant-stream.tool-execution-id"),nn=(t,e,r,o,i)=>{try{let s=e?.(r,o,i);Promise.resolve(s).catch(n=>{console.error(`[assistant-stream] ${t} callback threw an error`,n)})}catch(s){console.error(`[assistant-stream] ${t} callback threw an error`,s)}},vr=t=>t.join(","),an=(t,e)=>{let r={...t};return Object.defineProperty(r,Mh,{value:e,enumerable:!0}),r},nl=class extends Jc{constructor(t){let e=t,r=new Map,o=new Map,i=new Set,s=new Map,n=0;super(a=>{let c=new TransformStream({async transform(l,d){let m=s.get(vr(l.path));switch((l.type!=="part-finish"||l.meta.type!=="tool-call")&&d.enqueue(m?an(l,m):l),l.type){case"part-start":{let p=n;if(n+=1,l.part.type==="tool-call"){let u=new il,h=Symbol();s.set(String(p),h),o.set(h,u),e.streamCall({reader:u,toolCallId:l.part.toolCallId,toolName:l.part.toolName,executionId:h})}break}case"text-delta":if(l.meta.type==="tool-call"){let p=s.get(vr(l.path)),u=p?o.get(p):void 0;if(!u)throw new Error("No controller found for tool call");await u.appendArgsTextDelta(l.textDelta)}break;case"result":{if(l.meta.type!=="tool-call")break;let p=s.get(vr(l.path)),u=p?o.get(p):void 0;if(!u)throw new Error("No controller found for tool call");u.setResponse(new Ne({result:l.result,artifact:l.artifact,isError:l.isError,modelContent:l.modelContent,messages:l.messages})),i.add(p);break}case"tool-call-args-text-finish":{if(l.meta.type!=="tool-call")break;let{toolCallId:p,toolName:u}=l.meta,h=s.get(vr(l.path)),v=h?o.get(h):void 0;if(!v)throw new Error("No controller found for tool call");if(await v.finishArgsText(),i.has(h))break;let b=!1,y=ol(()=>{let S;try{S=sl.default.parse(v.argsText)}catch(I){throw new Error(`Function parameter parsing failed. ${JSON.stringify(I.message)}`)}let A=e.execute({toolCallId:p,toolName:u,args:S,executionId:h});return A!==void 0&&(b=!0,nn("onExecutionStart",e.onExecutionStart,p,u,h)),A},S=>{if(b&&nn("onExecutionEnd",e.onExecutionEnd,p,u,h),S===void 0)return;let A=new Ne({artifact:S.artifact,result:S.result,isError:S.isError,messages:S.messages,modelContent:S.modelContent});v.setResponse(A),Ee(d,an({type:"result",path:l.path,...A},h))},S=>{b&&nn("onExecutionEnd",e.onExecutionEnd,p,u,h);let A=new Ne({result:String(S),isError:!0});v.setResponse(A),Ee(d,an({type:"result",path:l.path,...A},h))});y&&r.set(h,y);break}case"part-finish":{if(l.meta.type!=="tool-call")break;let p=s.get(vr(l.path)),u=p?r.get(p):void 0,h=()=>{p&&(r.delete(p),o.delete(p),i.delete(p),s.delete(vr(l.path)))};u?u.then(()=>{h(),Ee(d,l)}):(h(),d.enqueue(l))}}},async flush(){await Promise.all(r.values())}});return a.pipeThrough(new Yr).pipeThrough(c)})}};var cl=Symbol.for("assistant-stream.tool-execution-id"),Ri=Symbol("assistant-stream.tool-aborted"),Ph=t=>typeof t=="object"&&t!==null&&"~standard"in t&&t["~standard"].version===1,Dh=t=>typeof t?.then=="function",al=async(t,e,r=!1)=>{let o,i=new Promise(s=>{o=()=>{r?queueMicrotask(()=>queueMicrotask(()=>s(Ri))):s(Ri)},e.aborted?o():e.addEventListener("abort",o,{once:!0})});try{return await Promise.race([t,i])}finally{e.removeEventListener("abort",o)}},Ei=()=>new Ne({result:"Tool execution was cancelled.",isError:!0});function Oh(t,e,r,o){let i=t?.[r.toolName];return i?.execute?(async n=>{if(e.aborted)return Ei();let a=n;if(Ph(i.parameters)){let d=i.parameters["~standard"].validate(r.args),m=Dh(d)?await al(d,e):d;if(m===Ri)return Ei();m.issues&&(a=i.experimental_onSchemaValidationError??(()=>{throw new Error(`Function parameter validation failed. ${JSON.stringify(m.issues)}`)}))}if(e.aborted)return Ei();let c=(async()=>{let d={toolCallId:r.toolCallId,abortSignal:e,human:u=>o(r.toolCallId,u,r.executionId),[cl]:r.executionId},m=await a(r.args,d),p=Ne.toResponse(m);if(i.toModelOutput&&!p.isError&&p.modelContent===void 0)try{let u=await i.toModelOutput({toolCallId:r.toolCallId,input:r.args,output:p.result});return new Ne({result:p.result,artifact:p.artifact,isError:p.isError,messages:p.messages,modelContent:u})}catch(u){console.warn(`[assistant-stream] tool "${r.toolName}" toModelOutput threw; falling back to default projection.`,u)}return p})(),l=await al(c,e,!0);return l===Ri?Ei():l})(i.execute):void 0}function Nh(t,e,r,o,i){let s={toolCallId:o.toolCallId,abortSignal:e,human:n=>i(o.toolCallId,n,o.executionId),[cl]:o.executionId};t?.[o.toolName]?.streamCall?.(r,s)}function cn(t,e,r,o){let i=typeof t=="function"?t:()=>t,s=typeof e=="function"?e:()=>e,n=o,a=r,c={execute:l=>Oh(i(),s(),l,a),streamCall:({reader:l,...d})=>Nh(i(),s(),l,d,a),onExecutionStart:n?.onExecutionStart,onExecutionEnd:n?.onExecutionEnd};return new nl(c)}function Bh(t){let e=t.metadata;if(!e||typeof e!="object")return;let r=e.custom;if(!r||typeof r!="object")return;let o=r.interactables;return Array.isArray(o)?o:void 0}function $h(t){return`update_${t.replace(/[^a-zA-Z0-9_-]/g,"_")}`}var ln=t=>{if(!de(t))return;let e=t.id;return typeof e=="string"||typeof e=="number"?e:void 0};function jh(t,e,r){let o=Array.isArray(e.set)?[...e.set]:[...t];if(e.clear===!0&&(o=[]),Array.isArray(e.remove)&&e.remove.length>0){let s=new Set(e.remove);o=o.filter(n=>{let a=ln(n);return a!==void 0?!s.has(a):!s.has(n)})}let i=e.update;if(Array.isArray(i)&&i.length>0){let s=new Map;for(let n of i){let a=ln(n);a!==void 0&&!Number.isNaN(a)&&!s.has(a)&&s.set(a,n)}o=o.map(n=>{let a=ln(n);if(a===void 0||!de(n))return n;let c=s.get(a);return c?{...n,...c}:n})}if(Array.isArray(e.add)&&e.add.length>0){let s=r?e.add.map(n=>{if(!de(n)||n.id!==void 0)return n;let a=r();return a===void 0?n:{...n,id:a}}):e.add;o=[...o,...s]}return o}function dn(t,e,r){if(!de(t)||!de(e))return e;let o=de(r?.arrayBaseline)?r.arrayBaseline:t,i=Object.entries(t);for(let[s,n]of Object.entries(e)){let a=o[s];if(Array.isArray(a)&&de(n)){let c=r?.idFactory&&(r.idKeyedFields===void 0||r.idKeyedFields.has(s))?()=>r.idFactory?.(s):void 0;i.push([s,jh(a,n,c)])}else i.push([s,n])}return Object.fromEntries(i)}function Lh(t,e){if(!de(t)||!de(e))return;for(let i of Object.keys(t))if(!Object.hasOwn(e,i))return;let r=[];for(let[i,s]of Object.entries(e))(!Object.hasOwn(t,i)||!Qr(t[i],s))&&r.push([i,s]);let o=r.length;if(!(o===0||o===Object.keys(e).length))return Object.fromEntries(r)}var Fh=t=>{if(!t||typeof t!="object")return;let e=t;return e.type==="tool-call"?e:void 0},Vh=(t,e)=>{if(!t.args||typeof t.args!="object")return!1;let r=de(t.result)?t.result:void 0;if(r?.success===!1)return!1;if(typeof r?.id=="string")return r.id===e;let o=t.args.id;return o===e||o===void 0},Uh=t=>{let e=de(t)?t.addedItemIds:void 0;if(!de(e))return;let r=new Map;for(let[o,i]of Object.entries(e)){if(!Array.isArray(i))continue;let s=i.filter(n=>typeof n=="string");s.length>0&&r.set(o,s)}if(r.size!==0)return o=>r.get(o)?.shift()},ll=new WeakMap;function zh(t,e,r){let o=ll.get(t);o||(o=new Map,ll.set(t,o));let i=o.get(r);i||(i=new Map,o.set(r,i));let s=i.get(e);if(s)return s;let n=$h(r),a=[],c=()=>a[a.length-1];for(let l of t){if(l.role==="user"){let d=Bh(l)?.find(m=>m.id===e);if(!d)continue;if(d.partial){let m=c();m&&a.push({state:dn(m.state,d.state),origin:"user-edit"})}else a.push({state:d.state,origin:"user-edit"});continue}if(l.role==="assistant")for(let d of l.content??[]){let m=Fh(d);if(m){if(m.toolCallId===e&&m.toolName===r)m.args&&typeof m.args=="object"&&a.push({state:m.args,origin:"create",toolCallId:e});else if(m.toolName===n&&Vh(m,e)){let p=c();if(p){let{id:u,...h}=m.args,v=Uh(m.result);a.push({state:v?dn(p.state,h,{idFactory:v}):dn(p.state,h),origin:"update",toolCallId:m.toolCallId})}}}}}return i.set(e,a),a}function Hh(t,e,r){let o=zh(t,e,r),i=o[o.length-1];return i?{state:i.state}:void 0}function dl(t,e){if(!t)return;let{interactables:r,...o}=t,i={...o};if(Array.isArray(r)){let s=[];for(let n of r){let a=Hh(e,n.id,n.name);if(!a){s.push({id:n.id,name:n.name,state:n.state});continue}if(Qr(n.state,a.state))continue;let c=Lh(a.state,n.state);s.push(c?{id:n.id,name:n.name,state:c,partial:!0}:{id:n.id,name:n.name,state:n.state})}s.length&&(i.interactables=s)}return Object.keys(i).length?i:void 0}var qh=we(null);var ul=()=>ut(qh);var vt=Symbol("innerMessage"),un=Symbol("innerMessages"),Gh=[],pn=(t,e)=>{vt in t||(t[vt]=e)},pl=t=>{let e="messages"in t?t.messages:t,r=e[un]||e[vt];return r?Array.isArray(r)?r:(e[un]=[r],e[un]):Gh},ml="__external_store_fallback_";var Be=ki("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",7);function hl(t){let e=t.match(/^data:([^;,]+)(?:;[^;,]+)*;base64,(.*)$/i);return e?{mimeType:e[1].toLowerCase(),data:e[2]}:null}var mn=(t,e)=>{if(t.startsWith("data-"))return{type:"data",name:t.substring(5),data:e}},br=(t,e,r)=>{let{role:o,id:i,createdAt:s,attachments:n,status:a,metadata:c}=t,l={id:i??e,createdAt:s??new Date},d=typeof t.content=="string"?[{type:"text",text:t.content}]:t.content,m=({image:p,...u})=>typeof p!="string"?null:hl(p)?.mimeType.startsWith("image/")?{...u,image:p}:/^(https:\/\/|blob:)/i.test(p)?{...u,image:p}:(console.warn("Invalid image data format detected"),null);if(o!=="user"&&n?.length)throw new Error("attachments are only supported for user messages");if(o!=="assistant"&&a)throw new Error("status is only supported for assistant messages");if(o!=="assistant"&&c?.steps)throw new Error("metadata.steps is only supported for assistant messages");switch(o){case"assistant":return{...l,role:o,content:d.map(p=>{let u=p.type;switch(u){case"text":return p.text?.trim()?p:null;case"reasoning":return!p.text?.trim()&&!p.unstable_summary?.trim()?null:p;case"file":case"source":return p;case"image":return m(p);case"data":return p;case"generative-ui":return p;case"tool-call":{let{parentId:h,messages:v,...b}=p,y={...b,toolCallId:p.toolCallId||`tool-${Be()}`,...h!==void 0&&{parentId:h},...v!==void 0&&{messages:v}};return p.args?{...y,args:p.args,argsText:p.argsText??JSON.stringify(p.args)}:{...y,args:gr(p.argsText??"")??{},argsText:p.argsText??""}}default:{let h=mn(u,p.data);if(h)return h;throw new Error(`Unsupported assistant message part type: ${u}`)}}}).filter(p=>!!p),status:a??r,metadata:{unstable_state:c?.unstable_state??null,unstable_annotations:c?.unstable_annotations??[],unstable_data:c?.unstable_data??[],custom:c?.custom??{},steps:c?.steps??[],...c?.timing&&{timing:c.timing},...c?.submittedFeedback&&{submittedFeedback:c.submittedFeedback},...c?.isOptimistic&&{isOptimistic:!0},...c?.modality&&{modality:c.modality}}};case"user":return{...l,role:o,content:d.map(p=>{let u=p.type;switch(u){case"text":case"image":case"audio":case"file":case"data":return p;default:{let h=mn(u,p.data);if(h)return h;throw new Error(`Unsupported user message part type: ${u}`)}}}),attachments:(n??[]).map(p=>({...p,content:p.content.map(u=>mn(u.type,u.data)??u)})),metadata:{custom:c?.custom??{},...c?.isOptimistic&&{isOptimistic:!0},...c?.modality&&{modality:c.modality}}};case"system":if(d.length!==1||d[0].type!=="text")throw new Error("System messages must have exactly one text message part.");return{...l,role:o,content:d,metadata:{custom:c?.custom??{}}};default:throw new Error(`Unknown message role: ${o}`)}};var gl=t=>t.type==="tool-call"&&t.result===void 0,Kh=t=>{if(t.type!=="tool-call"||t.result!==void 0)return!1;let e=t.messages?.at(-1);return e?.role==="assistant"&&e.status.type==="running"},vl=t=>t.type!=="tool-call"||t.result!==void 0?!1:t.interrupt!=null||t.approval!=null&&t.approval.approved===void 0&&t.approval.resolution===void 0,Kt=Symbol("autoStatus"),fl=Object.freeze(Object.assign({type:"running"},{[Kt]:!0})),Wh=Object.freeze(Object.assign({type:"complete",reason:"unknown"},{[Kt]:!0})),Jh=Object.freeze(Object.assign({type:"incomplete",reason:"cancelled"},{[Kt]:!0})),Qh=Object.freeze(Object.assign({type:"requires-action",reason:"tool-calls"},{[Kt]:!0})),Yh=Object.freeze(Object.assign({type:"requires-action",reason:"interrupt"},{[Kt]:!0})),bl=t=>t[Kt]===!0,wl=(t,e,r,o,i,s,n)=>t&&i?Object.assign({type:"incomplete",reason:"error",error:i},{[Kt]:!0}):t&&e?fl:r?Yh:n&&!s?fl:o?Qh:s?Jh:Wh,hn=t=>wl(!1,!1,typeof t!="string"&&t.some(vl),typeof t!="string"&&t.some(gl)),fn=(t,e,r)=>wl(e,r,typeof t!="string"&&t.some(vl),typeof t!="string"&&t.some(gl),void 0,void 0,typeof t!="string"&&t.some(Kh));var gn=class{constructor(){f(this,"cache",new WeakMap)}convertMessages(t,e){return t.map((r,o)=>{let i=e(this.cache.get(r),r,o);return this.cache.set(r,i),i})}};var vn=(t,e)=>{if(t.length!==e.length)return!1;for(let r=0;r<t.length;r++)if(t[r]!==e[r])return!1;return!0};var xl=$("react/jsx-runtime"),bn=t=>{let e=g(6),{index:r,children:o}=t,i=U(),s;e[0]!==r?(s=se({attachment:ne({source:"message",query:{type:"index",index:r},get:c=>c.message.attachment({index:r})})}),e[0]=r,e[1]=s):s=e[1];let n=s,a;return e[2]!==i||e[3]!==o||e[4]!==n?(a=(0,xl.jsx)(le,{extends:i,config:n,children:o}),e[2]=i,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var yl=$("react/jsx-runtime"),wn=t=>{let e=g(6),{index:r,children:o}=t,i=U(),s;e[0]!==r?(s=se({message:ne({source:"thread",query:{type:"index",index:r},get:c=>c.thread.message({index:r})}),composer:ne({source:"message",query:{},get:c=>c.thread.message({index:r}).composer()})}),e[0]=r,e[1]=s):s=e[1];let n=s,a;return e[2]!==i||e[3]!==o||e[4]!==n?(a=(0,yl.jsx)(le,{extends:i,config:n,children:o}),e[2]=i,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var _l=$("react/jsx-runtime"),Wt=t=>{let e=g(6),{index:r,children:o}=t,i=U(),s;e[0]!==r?(s=se({part:ne({source:"message",query:{type:"index",index:r},get:c=>c.message.part({index:r})})}),e[0]=r,e[1]=s):s=e[1];let n=s,a;return e[2]!==i||e[3]!==o||e[4]!==n?(a=(0,_l.jsx)(le,{extends:i,config:n,children:o}),e[2]=i,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var Sl=$("react/jsx-runtime"),Xh=t=>{let e=g(7),{text:r,isRunning:o}=t,i;e[0]!==o?(i=o?{type:"running"}:{type:"complete"},e[0]=o,e[1]=i):i=e[1];let s;e[2]!==i||e[3]!==r?(s={type:"text",text:r,status:i},e[2]=i,e[3]=r,e[4]=s):s=e[4];let n=s,a;return e[5]!==n?(a={getState:()=>n,addToolResult:ef,resumeToolCall:tf,respondToToolApproval:rf},e[5]=n,e[6]=a):a=e[6],a},Zh=L(Xh),Jt=t=>{let e=g(7),{text:r,isRunning:o,children:i}=t,s=o===void 0?!1:o,n=U(),a;e[0]!==s||e[1]!==r?(a=se({part:Zh({text:r,isRunning:s})}),e[0]=s,e[1]=r,e[2]=a):a=e[2];let c=a,l;return e[3]!==n||e[4]!==i||e[5]!==c?(l=(0,Sl.jsx)(le,{extends:n,config:c,children:i}),e[3]=n,e[4]=i,e[5]=c,e[6]=l):l=e[6],l};function ef(){throw new Error("Not supported")}function tf(){throw new Error("Not supported")}function rf(){throw new Error("Not supported")}var Tl=t=>{for(let e of t)if(e?.status.type==="running")return vi;return t.at(-1)?.status??Xe},kl=(t,e)=>{let r={running:0,complete:0,incomplete:0,requiresAction:0},o=Xe,i=!1;for(let s of e)switch(o=t[s]?.status??Xe,o.type){case"running":r.running++,i=!0;break;case"complete":r.complete++;break;case"incomplete":r.incomplete++;break;case"requires-action":r.requiresAction++}return{status:i?vi:o,counts:r}};var of=t=>{let e=g(11),{parts:r,getMessagePart:o}=t,[i,s]=z(!0),n;e[0]!==r?(n=Tl(r),e[0]=r,e[1]=n):n=e[1];let a=n,c;e[2]!==i||e[3]!==r||e[4]!==a?(c={parts:r,collapsed:i,status:a},e[2]=i,e[3]=r,e[4]=a,e[5]=c):c=e[5];let l=c,d;e[6]!==l?(d=()=>l,e[6]=l,e[7]=d):d=e[7];let m;return e[8]!==o||e[9]!==d?(m={getState:d,setCollapsed:s,part:o},e[8]=o,e[9]=d,e[10]=m):m=e[10],m},Cl=L(of);var Il=$("react/jsx-runtime"),El=t=>{let e=g(4),{startIndex:r,endIndex:o,children:i}=t,s=R(sf).slice(r,o+1),n=U(),a=se({chainOfThought:Cl({parts:s,getMessagePart:l=>{let{index:d}=l;if(d<0||d>=s.length)throw new Error(`ChainOfThought part index ${d} is out of bounds (0..${s.length-1})`);return n.message.part({index:r+d})}})}),c;return e[0]!==i||e[1]!==a||e[2]!==n?(c=(0,Il.jsx)(le,{extends:n,config:a,children:i}),e[0]=i,e[1]=a,e[2]=n,e[3]=c):c=e[3],c};function sf(t){return t.message.parts}var Rl=$("react/jsx-runtime"),xn=t=>{let e=g(6),{index:r,children:o}=t,i=U(),s;e[0]!==r?(s=se({suggestion:ne({source:"suggestions",query:{index:r},get:c=>c.suggestions.suggestion({index:r})})}),e[0]=r,e[1]=s):s=e[1];let n=s,a;return e[2]!==i||e[3]!==o||e[4]!==n?(a=(0,Rl.jsx)(le,{extends:i,config:n,children:o}),e[2]=i,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var Pl=Symbol.for("assistant-ui.message-not-sent"),Al,Ml,JC=class extends(Ml=Error,Al=Pl,Ml){constructor(e="The message was not sent."){super(e);f(this,Al,!0);this.name="MessageNotSentError"}},Ai=t=>typeof t=="object"&&t!==null&&Pl in t;var Dl=class{constructor(t){f(this,"_core");this._core=t,this.__internal_bindMethods()}get path(){return this._core.path}__internal_bindMethods(){this.getState=this.getState.bind(this),this.remove=this.remove.bind(this),this.subscribe=this.subscribe.bind(this)}getState(){return this._core.getState()}subscribe(t){return this._core.subscribe(t)}},Ol=class extends Dl{constructor(e,r){super(e);f(this,"_composerApi");this._composerApi=r}remove(){let e=this._composerApi.getState();if(!e)throw new Error("Composer is not available");return e.removeAttachment(this.getState().id)}},Nl=class extends Ol{get source(){return"thread-composer"}},Bl=class extends Ol{get source(){return"edit-composer"}},$l=class extends Dl{get source(){return"message"}remove(){throw new Error("Message attachments cannot be removed")}};var Mi=Object.freeze([]),jl=Object.freeze({}),nf=t=>Object.freeze({type:"thread",isEditing:t?.isEditing??!1,canCancel:t?.canCancel??!1,canSend:t?.canSend??!1,isEmpty:t?.isEmpty??!0,attachments:t?.attachments??Mi,text:t?.text??"",role:t?.role??"user",runConfig:t?.runConfig??jl,attachmentAccept:t?.attachmentAccept??"",dictation:t?.dictation,quote:t?.quote,queue:t?.queue??Mi,value:t?.text??""}),af=t=>Object.freeze({type:"edit",isEditing:t?.isEditing??!1,canCancel:t?.canCancel??!1,canSend:t?.canSend??!1,isEmpty:t?.isEmpty??!0,text:t?.text??"",role:t?.role??"user",attachments:t?.attachments??Mi,runConfig:t?.runConfig??jl,attachmentAccept:t?.attachmentAccept??"",dictation:t?.dictation,quote:t?.quote,queue:t?.queue??Mi,parentId:t?.parentId??null,sourceId:t?.sourceId??null,value:t?.text??""}),Ll=class{constructor(t){f(this,"_core");f(this,"_eventSubscriptionSubjects",new Map);this._core=t}get path(){return this._core.path}__internal_bindMethods(){this.setText=this.setText.bind(this),this.setRunConfig=this.setRunConfig.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this),this.addAttachment=this.addAttachment.bind(this),this.reset=this.reset.bind(this),this.clearAttachments=this.clearAttachments.bind(this),this.send=this.send.bind(this),this.cancel=this.cancel.bind(this),this.steerQueueItem=this.steerQueueItem.bind(this),this.moveQueueItem=this.moveQueueItem.bind(this),this.removeQueueItem=this.removeQueueItem.bind(this),this.setRole=this.setRole.bind(this),this.getAttachmentByIndex=this.getAttachmentByIndex.bind(this),this.startDictation=this.startDictation.bind(this),this.stopDictation=this.stopDictation.bind(this),this.setQuote=this.setQuote.bind(this),this.unstable_on=this.unstable_on.bind(this)}setText(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setText(t)}setRunConfig(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setRunConfig(t)}addAttachment(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");return e.addAttachment(t)}reset(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");return t.reset()}clearAttachments(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");return t.clearAttachments()}send(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.send(t)}cancel(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");t.cancel()}steerQueueItem(t){this.moveQueueItem(t,{lane:"steer",insertAfter:null})}moveQueueItem(t,e){let r=this._core.getState();if(!r)throw new Error("Composer is not available");r.moveQueueItem(t,e)}removeQueueItem(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.removeQueueItem(t)}setRole(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setRole(t)}startDictation(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");t.startDictation()}stopDictation(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");t.stopDictation()}setQuote(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setQuote(t)}subscribe(t){return this._core.subscribe(t)}unstable_on(t,e){let r=this._eventSubscriptionSubjects.get(t);return r||(r=new li({event:t,binding:this._core}),this._eventSubscriptionSubjects.set(t,r)),r.subscribe(e)}},Fl=class extends Ll{constructor(e){let r=new Kr({path:e.path,getState:()=>nf(e.getState()),subscribe:o=>e.subscribe(o)});super({path:e.path,getState:()=>e.getState(),subscribe:o=>r.subscribe(o)});f(this,"_getState");this._getState=r.getState.bind(r),this.__internal_bindMethods()}get path(){return this._core.path}get type(){return"thread"}getState(){return this._getState()}getAttachmentByIndex(e){return new Nl(new _e({path:{...this.path,attachmentSource:"thread-composer",attachmentSelector:{type:"index",index:e},ref:`${this.path.ref}.attachments[${e}]`},getState:()=>{let r=this.getState().attachments[e];return r?{...r,source:"thread-composer"}:ye},subscribe:r=>this._core.subscribe(r)}),this._core)}},Vl=class extends Ll{constructor(e,r){let o=new Kr({path:e.path,getState:()=>af(e.getState()),subscribe:i=>e.subscribe(i)});super({path:e.path,getState:()=>e.getState(),subscribe:i=>o.subscribe(i)});f(this,"_getState");f(this,"_beginEdit");this._beginEdit=r,this._getState=o.getState.bind(o),this.__internal_bindMethods()}get path(){return this._core.path}get type(){return"edit"}__internal_bindMethods(){super.__internal_bindMethods(),this.beginEdit=this.beginEdit.bind(this)}getState(){return this._getState()}beginEdit(){this._beginEdit()}getAttachmentByIndex(e){return new Bl(new _e({path:{...this.path,attachmentSource:"edit-composer",attachmentSelector:{type:"index",index:e},ref:`${this.path.ref}.attachments[${e}]`},getState:()=>{let r=this.getState().attachments[e];return r?{...r,source:"edit-composer"}:ye},subscribe:r=>this._core.subscribe(r)}),this._core)}};var At=t=>t.content.filter(e=>e.type==="text").map(e=>e.text).join(`

`);var cf="ui://",Ul=t=>!!t?.startsWith(cf),zl=t=>t.display==="text"||t.allowFreeform===!0;var Hl={"allow-once":!0,"allow-always":!0,"reject-once":!1,"reject-always":!1},ql=(t,e)=>{let r=e.text;if(r!==void 0&&!zl(t))throw new Error(`Tool approval "${t.id}" does not accept a free-form answer; the request must declare display "text" or allowFreeform`);let o,i;if("optionId"in e){let s=t.options?.find(n=>n.id===e.optionId);if(!s)throw new Error(`Tool approval has no option with id "${e.optionId}"`);if("approved"in e)o=e.approved;else{if(!Object.hasOwn(Hl,s.kind))throw new Error(`Tool approval option "${s.id}" has a custom kind "${s.kind}"; respond with an explicit approved value instead`);o=Hl[s.kind]}i=s.id}else if("approved"in e)o=e.approved;else{if(t.display!=="text"&&t.display!=="select")throw new Error(`Tool approval "${t.id}" is a decision, not a question; respond with an explicit approved value, optionally alongside the answer`);o=!0}return{approvalId:t.id,approved:o,...i!==void 0&&{optionId:i},...r!==void 0&&{text:r},...e.reason!=null&&{reason:e.reason}}};var yn=class{constructor(t,e,r){f(this,"contentBinding");f(this,"messageApi");f(this,"threadApi");this.contentBinding=t,this.messageApi=e,this.threadApi=r,this.__internal_bindMethods()}get path(){return this.contentBinding.path}__internal_bindMethods(){this.addToolResult=this.addToolResult.bind(this),this.resumeToolCall=this.resumeToolCall.bind(this),this.respondToToolApproval=this.respondToToolApproval.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this)}getState(){return this.contentBinding.getState()}addToolResult(t){let e=this.contentBinding.getState();if(!e)throw new Error("Message part is not available");if(e.type!=="tool-call")throw new Error("Tried to add tool result to non-tool message part");if(!this.messageApi)throw new Error("Message API is not available. This is likely a bug in assistant-ui.");if(!this.threadApi)throw new Error("Thread API is not available");let r=this.messageApi.getState();if(!r)throw new Error("Message is not available");let o=e.toolName,i=e.toolCallId,s=Ne.toResponse(t);this.threadApi.getState().addToolResult({messageId:r.id,toolName:o,toolCallId:i,result:s.result,isError:s.isError,...s.artifact!==void 0&&{artifact:s.artifact},...s.modelContent!==void 0&&{modelContent:s.modelContent}})}resumeToolCall(t){let e=this.contentBinding.getState();if(!e)throw new Error("Message part is not available");if(e.type!=="tool-call")throw new Error("Tried to resume tool call on non-tool message part");if(!this.threadApi)throw new Error("Thread API is not available");let r=e.toolCallId;this.threadApi.getState().resumeToolCall({toolCallId:r,payload:t})}respondToToolApproval(t){let e=this.contentBinding.getState();if(!e)throw new Error("Message part is not available");if(e.type!=="tool-call")throw new Error("Tried to respond to tool approval on non-tool message part");if(!e.approval||e.approval.approved!==void 0||e.approval.resolution!==void 0)throw new Error("Tool call has no pending approval");if(!this.threadApi)throw new Error("Thread API is not available");return this.threadApi.getState().respondToToolApproval(ql(e.approval,t))}subscribe(t){return this.contentBinding.subscribe(t)}};var Gl=(t,e)=>{let r=t.content[e];if(!r)return ye;let o=bi(t,e,r);return Object.freeze({...r,[vt]:r[vt],status:o})},Kl=class{constructor(t,e){f(this,"_core");f(this,"_threadBinding");f(this,"composer");f(this,"_getEditComposerRuntimeCore",()=>this._threadBinding.getState().getEditComposer(this._core.getState().id));this._core=t,this._threadBinding=e,this.composer=new Vl(new qt({path:{...this.path,ref:`${this.path.ref}.composer`,composerSource:"edit"},getState:this._getEditComposerRuntimeCore,subscribe:r=>this._threadBinding.subscribe(r)}),()=>this._threadBinding.getState().beginEdit(this._core.getState().id)),this.__internal_bindMethods()}get path(){return this._core.path}__internal_bindMethods(){this.reload=this.reload.bind(this),this.delete=this.delete.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this),this.getMessagePartByIndex=this.getMessagePartByIndex.bind(this),this.getMessagePartByToolCallId=this.getMessagePartByToolCallId.bind(this),this.getAttachmentByIndex=this.getAttachmentByIndex.bind(this),this.unstable_getCopyText=this.unstable_getCopyText.bind(this),this.speak=this.speak.bind(this),this.stopSpeaking=this.stopSpeaking.bind(this),this.submitFeedback=this.submitFeedback.bind(this),this.switchToBranch=this.switchToBranch.bind(this)}getState(){return this._core.getState()}delete(){let t=this._core.getState();return this._threadBinding.getState().deleteMessage(t.id)}reload(t={}){let e=this._getEditComposerRuntimeCore(),r=e??this._threadBinding.getState().composer,o=e??r,{runConfig:i=o.runConfig}=t,s=this._core.getState();if(s.role!=="assistant")throw new Error("Can only reload assistant messages");this._threadBinding.getState().startRun({parentId:s.parentId,sourceId:s.id,runConfig:i})}speak(){let t=this._core.getState();return this._threadBinding.getState().speak(t.id)}stopSpeaking(){let t=this._core.getState();if(this._threadBinding.getState().speech?.messageId===t.id)this._threadBinding.getState().stopSpeaking();else throw new Error("Message is not being spoken")}submitFeedback({type:t,comment:e}){let r=this._core.getState();this._threadBinding.getState().submitFeedback({messageId:r.id,type:t,...e!==void 0?{comment:e}:void 0})}switchToBranch({position:t,branchId:e}){let r=this._core.getState();if(e&&t)throw new Error("May not specify both branchId and position");if(!e&&!t)throw new Error("Must specify either branchId or position");let o=this._threadBinding.getState().getBranches(r.id),i=e;if(t==="previous"?i=o[r.branchNumber-2]:t==="next"&&(i=o[r.branchNumber]),!i)throw new Error("Branch not found");this._threadBinding.getState().switchToBranch(i)}unstable_getCopyText(){return At(this.getState())}subscribe(t){return this._core.subscribe(t)}getMessagePartByIndex(t){if(t<0)throw new Error("Message part index must be >= 0");return new yn(new _e({path:{...this.path,ref:`${this.path.ref}.content[${t}]`,messagePartSelector:{type:"index",index:t}},getState:()=>Gl(this.getState(),t),subscribe:e=>this._core.subscribe(e)}),this._core,this._threadBinding)}getMessagePartByToolCallId(t){return new yn(new _e({path:{...this.path,ref:`${this.path.ref}.content[toolCallId=${JSON.stringify(t)}]`,messagePartSelector:{type:"toolCallId",toolCallId:t}},getState:()=>{let e=this._core.getState(),r=e.content.findIndex(o=>o.type==="tool-call"&&o.toolCallId===t);return r===-1?ye:Gl(e,r)},subscribe:e=>this._core.subscribe(e)}),this._core,this._threadBinding)}getAttachmentByIndex(t){return new $l(new _e({path:{...this.path,ref:`${this.path.ref}.attachments[${t}]`,attachmentSource:"message",attachmentSelector:{type:"index",index:t}},getState:()=>{let e=this.getState().attachments?.[t];return e?{...e,source:"message"}:ye},subscribe:e=>this._core.subscribe(e)}))}};var lf=t=>({parentId:t.parentId??null,sourceId:t.sourceId??null,runConfig:t.runConfig??{},...t.stream?{stream:t.stream}:{}}),df=t=>({parentId:t.parentId??null,sourceId:t.sourceId??null,runConfig:t.runConfig??{}}),uf=(t,e)=>typeof e=="string"?{createdAt:new Date,parentId:t.at(-1)?.id??null,sourceId:null,runConfig:{},role:"user",content:[{type:"text",text:e}],attachments:[],metadata:{custom:{}}}:{createdAt:e.createdAt??new Date,parentId:e.parentId===void 0?t.at(-1)?.id??null:e.parentId,sourceId:e.sourceId??null,role:e.role??"user",content:e.content,attachments:e.attachments??[],metadata:e.metadata??{custom:{}},runConfig:e.runConfig??{},startRun:e.startRun},_n=t=>{if(t.isRunning!==void 0)return t.isRunning;let e=t.messages.at(-1);return e?.role==="assistant"&&e.status.type==="running"},pf=(t,e)=>Object.freeze({threadId:e.id,metadata:e,capabilities:t.capabilities,isDisabled:t.isDisabled,isLoading:t.isLoading,isRunning:_n(t),messages:t.messages,state:t.state,suggestions:t.suggestions,extras:t.extras,speech:t.speech,voice:t.voice}),Wl=class{constructor(t,e){f(this,"_threadBinding");f(this,"_stateBinding");f(this,"composer");f(this,"_eventSubscriptionSubjects",new Map);let r=new _e({path:t.path,getState:()=>pf(t.getState(),e.getState()),subscribe:o=>{let i=t.subscribe(o),s=e.subscribe(o);return()=>ai([i,s])}});this._stateBinding=r,this._threadBinding={path:t.path,getState:()=>t.getState(),getStateState:()=>r.getState(),outerSubscribe:o=>t.outerSubscribe(o),subscribe:o=>t.subscribe(o)},this.composer=new Fl(new qt({path:{...this.path,ref:`${this.path.ref}.composer`,composerSource:"thread"},getState:()=>this._threadBinding.getState().composer,subscribe:o=>this._threadBinding.subscribe(o)})),this.__internal_bindMethods()}get path(){return this._threadBinding.path}get __internal_threadBinding(){return this._threadBinding}__internal_bindMethods(){this.append=this.append.bind(this),this.deleteMessage=this.deleteMessage.bind(this),this.resumeRun=this.resumeRun.bind(this),this.importExternalState=this.importExternalState.bind(this),this.exportExternalState=this.exportExternalState.bind(this),this.startRun=this.startRun.bind(this),this.cancelRun=this.cancelRun.bind(this),this.unstable_notifySessionReset=this.unstable_notifySessionReset.bind(this),this.stopSpeaking=this.stopSpeaking.bind(this),this.connectVoice=this.connectVoice.bind(this),this.disconnectVoice=this.disconnectVoice.bind(this),this.muteVoice=this.muteVoice.bind(this),this.unmuteVoice=this.unmuteVoice.bind(this),this.getVoiceVolume=this.getVoiceVolume.bind(this),this.subscribeVoiceVolume=this.subscribeVoiceVolume.bind(this),this.export=this.export.bind(this),this.import=this.import.bind(this),this.reset=this.reset.bind(this),this.getMessageByIndex=this.getMessageByIndex.bind(this),this.getMessageById=this.getMessageById.bind(this),this.subscribe=this.subscribe.bind(this),this.unstable_on=this.unstable_on.bind(this),this.getModelContext=this.getModelContext.bind(this),this.getState=this.getState.bind(this)}getState(){return this._threadBinding.getStateState()}append(t){let e=this._threadBinding.getState().append(uf(this._threadBinding.getState().messages,t));Promise.resolve(e).catch(r=>{if(!Ai(r))throw r})}deleteMessage(t){return this._threadBinding.getState().deleteMessage(t)}subscribe(t){return this._stateBinding.subscribe(t)}getModelContext(){return this._threadBinding.getState().getModelContext()}startRun(t){return this._threadBinding.getState().startRun(df(t))}resumeRun(t){return this._threadBinding.getState().resumeRun(lf(t))}exportExternalState(){return this._threadBinding.getState().exportExternalState()}importExternalState(t){this._threadBinding.getState().importExternalState(t)}cancelRun(){this._threadBinding.getState().cancelRun()}unstable_notifySessionReset(){this._threadBinding.getState().unstable_notifySessionReset()}stopSpeaking(){return this._threadBinding.getState().stopSpeaking()}connectVoice(){this._threadBinding.getState().connectVoice()}disconnectVoice(){this._threadBinding.getState().disconnectVoice()}getVoiceVolume(){return this._threadBinding.getState().getVoiceVolume()}subscribeVoiceVolume(t){return this._threadBinding.getState().subscribeVoiceVolume(t)}muteVoice(){this._threadBinding.getState().muteVoice()}unmuteVoice(){this._threadBinding.getState().unmuteVoice()}export(){return this._threadBinding.getState().export()}import(t){this._threadBinding.getState().import(t)}reset(t){this._threadBinding.getState().reset(t)}getMessageByIndex(t){if(t<0)throw new Error("Message index must be >= 0");return this._getMessageRuntime({...this.path,ref:`${this.path.ref}.messages[${t}]`,messageSelector:{type:"index",index:t}},()=>{let e=this._threadBinding.getState().messages,r=e[t];if(r)return{message:r,parentId:e[t-1]?.id??null,index:t}})}getMessageById(t){return this._getMessageRuntime({...this.path,ref:`${this.path.ref}.messages[messageId=${JSON.stringify(t)}]`,messageSelector:{type:"messageId",messageId:t}},()=>this._threadBinding.getState().getMessageById(t))}_getMessageRuntime(t,e){return new Kl(new _e({path:t,getState:()=>{let{message:r,parentId:o,index:i}=e()??{},{messages:s,speech:n}=this._threadBinding.getState();if(!r||o===void 0||i===void 0)return ye;let a=this._threadBinding.getState().getBranches(r.id);return{...r,[vt]:r[vt],index:i,isLast:s.at(-1)?.id===r.id,parentId:o,branchNumber:a.indexOf(r.id)+1,branchCount:a.length,speech:n?.messageId===r.id?n:void 0}},subscribe:r=>this._threadBinding.subscribe(r)}),this._threadBinding)}unstable_on(t,e){let r=this._eventSubscriptionSubjects.get(t);return r||(r=new li({event:t,binding:this._threadBinding}),this._eventSubscriptionSubjects.set(t,r)),r.subscribe(e)}};var Zr=class{constructor(t,e){f(this,"_core");f(this,"_threadListBinding");this._core=t,this._threadListBinding=e,this.__internal_bindMethods()}get path(){return this._core.path}__internal_bindMethods(){this.switchTo=this.switchTo.bind(this),this.rename=this.rename.bind(this),this.updateCustom=this.updateCustom.bind(this),this.archive=this.archive.bind(this),this.unarchive=this.unarchive.bind(this),this.delete=this.delete.bind(this),this.initialize=this.initialize.bind(this),this.generateTitle=this.generateTitle.bind(this),this.subscribe=this.subscribe.bind(this),this.unstable_on=this.unstable_on.bind(this),this.getState=this.getState.bind(this),this.detach=this.detach.bind(this)}getState(){return this._core.getState()}switchTo(t){let e=this._core.getState();return this._threadListBinding.switchToThread(e.id,t)}rename(t){let e=this._core.getState();return this._threadListBinding.rename(e.id,t)}updateCustom(t){let e=this._core.getState();if(!this._threadListBinding.updateCustom)throw new Error("Thread list runtime does not support updating custom metadata");return this._threadListBinding.updateCustom(e.id,t)}archive(){let t=this._core.getState();return this._threadListBinding.archive(t.id)}unarchive(){let t=this._core.getState();return this._threadListBinding.unarchive(t.id)}delete(){let t=this._core.getState();return this._threadListBinding.delete(t.id)}initialize(){let t=this._core.getState();return this._threadListBinding.initialize(t.id)}generateTitle(t){let e=this._core.getState();return this._threadListBinding.generateTitle(e.id,t)}unstable_on(t,e){let r=this._core.getState().isMain,o=this._core.getState().id;return this.subscribe(()=>{let i=this._core.getState(),s=i.isMain,n=i.id;r===s&&o===n||(r=s,o=n,!(t==="switchedTo"&&!s)&&(t==="switchedAway"&&s||ce([e],{},`Thread list item "${t}"`)))})}subscribe(t){return this._core.subscribe(t)}detach(){let t=this._core.getState();this._threadListBinding.detach(t.id)}__internal_getRuntime(){return this}};var Sn=Promise.resolve(),mf=()=>{},hf=t=>({mainThreadId:t.mainThreadId,newThreadId:t.newThreadId,threadIds:t.threadIds,archivedThreadIds:t.archivedThreadIds,isLoading:t.isLoading,loadError:t.loadError,isLoadingMore:t.isLoadingMore??!1,hasMore:t.hasMore??!1,threadItems:t.threadItems}),Pi=(t,e)=>{if(e===void 0)return ye;let r=t.getItemById(e);return r?{id:r.id,remoteId:r.remoteId,externalId:r.externalId,title:r.title,status:r.status,lastMessageAt:r.lastMessageAt,custom:r.custom,isMain:r.id===t.mainThreadId,isRunning:t.unstable_isThreadRunning?.(r.id)??!1}:ye},Jl=class{constructor(t,e=Wl){f(this,"_getState");f(this,"_stateBinding");f(this,"_core");f(this,"_runtimeFactory");f(this,"_mainThreadListItemRuntime");f(this,"main");this._core=t,this._runtimeFactory=e;let r=new Kr({path:{},getState:()=>hf(t),subscribe:o=>t.subscribe(o)});this._getState=r.getState.bind(r),this._stateBinding=r,this._mainThreadListItemRuntime=new Zr(new _e({path:{ref:"threadItems[main]",threadSelector:{type:"main"}},getState:()=>Pi(this._core,this._core.mainThreadId),subscribe:o=>this._core.subscribe(o)}),this._core),this.main=new e(new qt({path:{ref:"threads.main",threadSelector:{type:"main"}},getState:()=>t.getMainThreadRuntimeCore(),subscribe:o=>t.subscribe(o)}),this._mainThreadListItemRuntime),this.__internal_bindMethods()}__internal_bindMethods(){this.switchToThread=this.switchToThread.bind(this),this.switchToNewThread=this.switchToNewThread.bind(this),this.unstable_subscribeThreadEvents=this.unstable_subscribeThreadEvents.bind(this),this.getLoadThreadsPromise=this.getLoadThreadsPromise.bind(this),this.reload=this.reload.bind(this),this.reloadMainThread=this.reloadMainThread.bind(this),this.loadMore=this.loadMore.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this),this.getById=this.getById.bind(this),this.getItemById=this.getItemById.bind(this),this.getItemByIndex=this.getItemByIndex.bind(this),this.getArchivedItemByIndex=this.getArchivedItemByIndex.bind(this)}switchToThread(t,e){return this._core.switchToThread(t,e)}switchToNewThread(){return this._core.switchToNewThread()}unstable_subscribeThreadEvents(t){return this._core.unstable_subscribeThreadEvents?.(t)??mf}getLoadThreadsPromise(){return this._core.getLoadThreadsPromise()}reload(){return this._core.reload?.()??Sn}reloadMainThread(){return this._core.reloadMainThread?.()??Sn}loadMore(){return this._core.loadMore?.()??Sn}getState(){return this._getState()}subscribe(t){return this._stateBinding.subscribe(t)}get mainItem(){return this._mainThreadListItemRuntime}_createItemStateBinding(t){return new _e({path:{ref:`threadItems[threadId=${t}]`,threadSelector:{type:"threadId",threadId:t}},getState:()=>Pi(this._core,t),subscribe:e=>this._core.subscribe(e)})}getById(t){return new this._runtimeFactory(new qt({path:{ref:`threads[threadId=${JSON.stringify(t)}]`,threadSelector:{type:"threadId",threadId:t}},getState:()=>this._core.getThreadRuntimeCore(t),subscribe:e=>this._core.subscribe(e)}),this._createItemStateBinding(t))}getItemByIndex(t){return new Zr(new _e({path:{ref:`threadItems[${t}]`,threadSelector:{type:"index",index:t}},getState:()=>Pi(this._core,this._core.threadIds[t]),subscribe:e=>this._core.subscribe(e)}),this._core)}getArchivedItemByIndex(t){return new Zr(new _e({path:{ref:`archivedThreadItems[${t}]`,threadSelector:{type:"archiveIndex",index:t}},getState:()=>Pi(this._core,this._core.archivedThreadIds[t]),subscribe:e=>this._core.subscribe(e)}),this._core)}getItemById(t){return new Zr(this._createItemStateBinding(t),this._core)}};var Ql=class{constructor(t){f(this,"threads");f(this,"_thread");f(this,"_core");this._core=t,this.threads=new Jl(t.threads),this._thread=this.threads.main,this.__internal_bindMethods()}__internal_bindMethods(){this.registerModelContextProvider=this.registerModelContextProvider.bind(this)}get thread(){return this._thread}registerModelContextProvider(t){return this._core.registerModelContextProvider(t)}};var Yl=new WeakMap,eo=t=>Yl.get(t)??0,Di=(t,e)=>eo(t)===e,Oi=t=>{Yl.set(t,eo(t)+1)};var Xl=class{constructor(){f(this,"_contextProvider",new di)}registerModelContextProvider(t){return this._contextProvider.registerModelContextProvider(t)}getModelContextProvider(){return this._contextProvider}};var Qt=Object.freeze([]),wr="DEFAULT_THREAD_ID",ff=Object.freeze([wr]),gf=Object.freeze({id:wr,remoteId:void 0,externalId:void 0,status:"regular"}),vf=Promise.resolve(),Zl=Object.freeze(me({[wr]:gf})),ed=class extends pr{constructor(e={},r){super();f(this,"_mainThreadId",wr);f(this,"_threads",ff);f(this,"_archivedThreads",Qt);f(this,"_threadData",Zl);f(this,"adapter",{});f(this,"_mainThread");f(this,"threadFactory");this.threadFactory=r,this.__internal_setAdapter(e,!0)}get isLoading(){return this.adapter.isLoading??!1}get newThreadId(){}get threadIds(){return this._threads}get archivedThreadIds(){return this._archivedThreads}get threadItems(){return this._threadData}getLoadThreadsPromise(){return vf}get mainThreadId(){return this._mainThreadId}getMainThreadRuntimeCore(){return this._mainThread}getThreadRuntimeCore(){throw new Error("Method not implemented.")}getItemById(e){return Object.hasOwn(this._threadData,e)?this._threadData[e]:void 0}__internal_setAdapter(e,r=!1){let o=this.adapter;this.adapter=e;let i=e.threadId??wr,s=e.threads??Qt,n=e.archivedThreads??Qt,a=o.threadId??wr,c=o.threads??Qt,l=o.archivedThreads??Qt;!r&&(o.isLoading??!1)===(e.isLoading??!1)&&a===i&&c===s&&l===n||((c!==s||l!==n||a!==i)&&(this._threadData=me(Zl,Object.fromEntries(e.threads?.map(d=>[d.id,{...d,remoteId:d.remoteId,externalId:d.externalId,status:"regular"}])??[]),Object.fromEntries(e.archivedThreads?.map(d=>[d.id,{...d,remoteId:d.remoteId,externalId:d.externalId,status:"archived"}])??[]))),c!==s&&(this._threads=this.adapter.threads?.map(d=>d.id)??Qt),l!==n&&(this._archivedThreads=this.adapter.archivedThreads?.map(d=>d.id)??Qt),(r||a!==i)&&(r||Oi(this._mainThread),this._mainThreadId=i,this._mainThread=this.threadFactory()),Object.hasOwn(this._threadData,this._mainThreadId)||(this._threadData=me(this._threadData,{[this._mainThreadId]:{id:this._mainThreadId,remoteId:void 0,externalId:void 0,status:"regular"}})),this._notifySubscribers())}async reloadMainThread(){this._mainThread.unstable_refetchThread&&await this._mainThread.unstable_refetchThread()}async switchToThread(e,r){if(this._mainThreadId===e)return;let o=this.adapter.onSwitchToThread;if(!o)throw new Error("External store adapter does not support switching to thread");await o(e)}async switchToNewThread(){let e=this.adapter.onSwitchToNewThread;if(!e)throw new Error("External store adapter does not support switching to new thread");await e()}async rename(e,r){let o=this.adapter.onRename;if(!o)throw new Error("External store adapter does not support renaming");await o(e,r)}async updateCustom(e,r){let o=this.adapter.onUpdateCustom;if(!o)throw new Error("External store adapter does not support updating custom metadata");await o(e,r)}async detach(){}async archive(e){let r=this.adapter.onArchive;if(!r)throw new Error("External store adapter does not support archiving");await r(e)}async unarchive(e){let r=this.adapter.onUnarchive;if(!r)throw new Error("External store adapter does not support unarchiving");await r(e)}async delete(e){let r=this.adapter.onDelete;if(!r)throw new Error("External store adapter does not support deleting");await r(e)}initialize(e){return Promise.resolve({remoteId:e,externalId:void 0})}generateTitle(){throw new Error("Method not implemented.")}};var Bi={fromArray:t=>{let e=t.map(r=>br(r,Be(),hn(r.content)));return{messages:e.map((r,o)=>({parentId:o>0?e[o-1].id:null,message:r}))}},fromBranchableArray:(t,e)=>({...e?.headId!==void 0?{headId:e.headId}:void 0,messages:t.map(({message:r,parentId:o})=>{if(!r.id)throw new Error("ExportedMessageRepository.fromBranchableArray: Each message must have an 'id' field set.");return{parentId:o,message:br(r,r.id,hn(r.content))}})})},Ni=t=>{let e=t;for(;e.next;)e=e.next;return"current"in e?e:null},bf=class{constructor(t){f(this,"_value",null);f(this,"func");this.func=t}get value(){return this._value===null&&(this._value=this.func()),this._value}dirty(){this._value=null}},$i=class{constructor(){f(this,"messages",new Map);f(this,"head",null);f(this,"root",{children:[],next:null});f(this,"_messages",new bf(()=>{let t=new Array((this.head?.level??-1)+1);for(let e=this.head;e;e=e.prev)t[e.level]=e.current;return t}))}updateLevels(t,e){let r=[{message:t,level:e}];for(;r.length>0;){let o=r.pop();o.message.level=o.level;for(let i of o.message.children){let s=this.messages.get(i);s&&r.push({message:s,level:o.level+1})}}}selectPathTo(t){for(let e=t;e;e=e.prev)(e.prev??this.root).next=e}performOp(t,e,r){let o=e.prev??this.root,i=t??this.root;if(!(r==="relink"&&o===i)){if(r==="relink"){for(let s=t;s;s=s.prev)if(s.current.id===e.current.id)throw new Error("MessageRepository(performOp/relink): A message with the same id already exists in the parent tree. This error occurs if the same message id is found multiple times. This is likely an internal bug in assistant-ui.")}if(r!=="link"&&(o.children=o.children.filter(s=>s!==e.current.id),o.next===e)){let s=o.children.at(-1),n=s?this.messages.get(s):null;if(n===void 0)throw new Error("MessageRepository(performOp/cut): Fallback sibling message not found. This is likely an internal bug in assistant-ui.");o.next=n}if(r!=="cut"){i.children=[...i.children,e.current.id],e.prev=t,Ni(e)===this.head?this.selectPathTo(e):i.next===null&&(i.next=e,this.head===i&&(this.head=Ni(e)));let s=t?t.level+1:0;this.updateLevels(e,s)}}}get headId(){return this.head?.current.id??null}get canonicalHeadId(){let t=this.head;for(;t?.current.metadata?.isOptimistic;)t=t.prev;return t?.current.id??null}getMessages(t){if(t===void 0||t===this.head?.current.id)return this._messages.value;let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(getMessages): Head message not found. This is likely an internal bug in assistant-ui.");let r=new Array(e.level+1);for(let o=e;o;o=o.prev)r[o.level]=o.current;return r}addOrUpdateMessage(t,e){let r=this.messages.get(e.id),o=t?this.messages.get(t):null;if(o===void 0)throw new Error("MessageRepository(addOrUpdateMessage): Parent message not found. This is likely an internal bug in assistant-ui.");if(r){r.current=e,this.performOp(o,r,"relink"),this._messages.dirty();return}let i={prev:o,current:e,next:null,children:[],level:o?o.level+1:0};this.messages.set(e.id,i),this.performOp(o,i,"link"),this.head===o&&(this.head=i),this._messages.dirty()}getMessage(t){let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(updateMessage): Message not found. This is likely an internal bug in assistant-ui.");return{parentId:e.prev?.current.id??null,message:e.current,index:e.level}}deleteMessage(t,e){let r=this.messages.get(t);if(!r)throw new Error("MessageRepository(deleteMessage): Message not found. This is likely an internal bug in assistant-ui.");let o=e===void 0?r.prev:e===null?null:this.messages.get(e);if(o===void 0)throw new Error("MessageRepository(deleteMessage): Replacement not found. This is likely an internal bug in assistant-ui.");for(let i of r.children){let s=this.messages.get(i);if(!s)throw new Error("MessageRepository(deleteMessage): Child message not found. This is likely an internal bug in assistant-ui.");this.performOp(o,s,"relink")}this.performOp(null,r,"cut"),this.messages.delete(t),this.head===r&&(this.head=Ni(o??this.root)),this._messages.dirty()}getBranches(t){let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(getBranches): Message not found. This is likely an internal bug in assistant-ui.");let{children:r}=e.prev??this.root;return r}evictOffBranchOptimisticMessages(t,e){if(!t)return;let r=new Set;for(let i=e;i;i=i.prev)r.add(i.current.id);let o=[];for(let i=t;i&&!r.has(i.current.id);i=i.prev)i.current.metadata?.isOptimistic&&o.push(i.current.id);for(let i of o)this.messages.has(i)&&this.deleteMessage(i)}switchToBranch(t){let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(switchToBranch): Branch not found. This is likely an internal bug in assistant-ui.");let r=this.head;this.selectPathTo(e),this.head=Ni(e),this.evictOffBranchOptimisticMessages(r,this.head),this._messages.dirty()}resetHead(t){if(t===null){this.clear();return}let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(resetHead): Branch not found. This is likely an internal bug in assistant-ui.");let r=this.head;if(e.children.length>0){let o=[...e.children];for(;o.length>0;){let i=o.pop(),s=this.messages.get(i);if(s){for(let n of s.children)o.push(n);this.messages.delete(i)}}e.children=[],e.next=null}this.head=e,this.selectPathTo(e),this.evictOffBranchOptimisticMessages(r,this.head),this._messages.dirty()}clear(){this.messages.clear(),this.head=null,this.root={children:[],next:null},this._messages.dirty()}export(){let t=[],e=[...this.root.children].reverse();for(;e.length>0;){let r=this.messages.get(e.pop());if(!r)continue;for(let i=r.children.length-1;i>=0;i--)e.push(r.children[i]);if(r.current.metadata?.isOptimistic)continue;let o=r.prev;for(;o&&o.current.metadata?.isOptimistic;)o=o.prev;t.push({message:r.current,parentId:o?.current.id??null})}return{headId:this.canonicalHeadId,messages:t}}import({headId:t,messages:e}){for(let{message:r,parentId:o}of e)this.addOrUpdateMessage(o,r);this.resetHead(t??e.at(-1)?.message.id??null)}};var Mt=Object.freeze([]);function*to(t){for(let e of t)if(!(e?.role!=="assistant"||!Array.isArray(e.content)))for(let r of e.content)!r||r.type!=="tool-call"||(yield{part:r,messageId:e.id},r.messages?.length&&(yield*to(r.messages)))}function Tn(t,e){if(e==="*")return!0;let r=e.split(",").map(s=>s.trim().toLowerCase()),o=t.name.toLowerCase(),i=t.type.split(";",1)[0].trim().toLowerCase();for(let s of r){if(s.startsWith(".")&&o.endsWith(s)||s.includes("/")&&s===i)return!0;if(s.endsWith("/*")){let n=s.split("/")[0];if(i.startsWith(`${n}/`))return!0}}return!1}function wf(t){let e=Be();return t.type==="image"?{id:e,type:"image",name:t.filename??"image",content:[t],status:{type:"complete"}}:t.type==="file"?{id:e,type:"document",name:t.filename??"document",contentType:t.mimeType,content:[t],status:{type:"complete"}}:t.type==="audio"?{id:e,type:"audio",name:`audio.${t.audio.format}`,contentType:`audio/${t.audio.format}`,content:[t],status:{type:"complete"}}:{id:e,type:"data",name:t.name,content:[t],status:{type:"complete"}}}function td(t){let e=[];for(let r of t)r.type!=="text"&&e.push(wf(r));return e}var rd=t=>"content"in t&&!("lastModified"in t),ro=t=>t.status.type==="complete";var od=class{constructor(){f(this,"operations",new Set)}start(){let t={cancelled:!1,attachmentIds:new Set};return this.operations.add(t),t}accept(t,e){return t.cancelled?!1:(t.attachmentIds.add(e),!0)}finish(t){this.operations.delete(t)}isCancelled(t){return t.cancelled}cancel(t){for(let e of[...this.operations])e.attachmentIds.has(t)&&(e.cancelled=!0,this.operations.delete(e))}cancelAll(){for(let t of this.operations)t.cancelled=!0;this.operations.clear()}},id=async(t,e)=>{if(Symbol.asyncIterator in t){for await(let r of t)if(!e(r))break}else e(await t)};var ji=class extends pr{constructor(){super(...arguments);f(this,"isEditing",!0);f(this,"_attachments",[]);f(this,"_text","");f(this,"_role","user");f(this,"_runConfig",{});f(this,"_quote");f(this,"_isSending",!1);f(this,"_removedDuringSend",new Set);f(this,"_sendGeneration",0);f(this,"_attachmentAddOperations",new od);f(this,"_dictation");f(this,"_dictationSession");f(this,"_dictationUnsubscribes",[]);f(this,"_dictationBaseText","");f(this,"_currentInterimText","");f(this,"_dictationSessionIdCounter",0);f(this,"_activeDictationSessionId");f(this,"_isCleaningDictation",!1);f(this,"_eventSubscribers",new Map)}enrichWithComposerMetadata(e,r){return r?{...e,metadata:{...e.metadata,custom:{...e.metadata?.custom,...r}}}:e}get attachmentAccept(){return this.getAttachmentAdapter()?.accept??"*"}get attachments(){return this._attachments}setAttachments(e){this._attachments=e,this._notifySubscribers()}get isEmpty(){return!this.text.trim()&&!this.attachments.length}get text(){return this._text}get role(){return this._role}get runConfig(){return this._runConfig}get quote(){return this._quote}setQuote(e){this._quote!==e&&(this._quote=e,this._notifySubscribers())}setText(e){this._text!==e&&(this._text=e,this._rebaseDictation(e),this._notifySubscribers())}_rebaseDictation(e){if(!this._dictation)return;this._dictationBaseText=e,this._currentInterimText="";let{status:r,inputDisabled:o}=this._dictation;this._dictation=o?{status:r,inputDisabled:o}:{status:r}}setRole(e){this._role!==e&&(this._role=e,this._notifySubscribers())}setRunConfig(e){this._runConfig!==e&&(this._runConfig=e,this._notifySubscribers())}_cancelAttachmentAdd(e){this._attachmentAddOperations.cancel(e)}_cancelAllAttachmentAdds(){this._attachmentAddOperations.cancelAll()}_emptyTextAndAttachments(){this._attachments=[],this._text="",this._rebaseDictation(""),this._notifySubscribers()}async _onClearAttachments(){let e=this.getAttachmentAdapter();if(e){let r=this._attachments.filter(o=>!ro(o));await Promise.all(r.map(async o=>e.remove(o)))}}async reset(){if(this._cancelAllAttachmentAdds(),this._sendGeneration++,this._isSending=!1,this._removedDuringSend.clear(),this._attachments.length===0&&this._text===""&&this._role==="user"&&Object.keys(this._runConfig).length===0&&this._quote===void 0)return;this._role="user",this._runConfig={},this._quote=void 0;let e=this._onClearAttachments();this._emptyTextAndAttachments(),await e}async clearAttachments(){if(this._cancelAllAttachmentAdds(),this._isSending)for(let r of this._attachments)this._removedDuringSend.add(r.id);let e=this._onClearAttachments();this.setAttachments([]),await e}async send(e){if(!this.canSend||this._isSending)return;if(this._dictationSession)try{this._dictationSession.cancel()}catch(b){console.error("[assistant-ui] Dictation session cancel threw",b)}finally{this._cleanupDictation()}let r=this.getAttachmentAdapter(),o=this.attachments.map(async b=>{if(ro(b))return b;if(!r)throw new Error("Attachments are not supported");return await r.send(b)}),i=this.attachments,s=this.text,n=this._quote,a=this.role,c=this.runConfig;this._quote=void 0,this._text="",this._isSending=!0;let l=++this._sendGeneration;this._notifySubscribers();let d;try{d=await Promise.all(o)}catch(b){throw l===this._sendGeneration&&(!this.text.trim()&&this._quote===void 0&&(this._text=s,this._rebaseDictation(s),this._quote=n,this._notifySubscribers()),Promise.allSettled(o).then(()=>{l===this._sendGeneration&&(this._removedDuringSend.clear(),this._isSending=!1,this._notifySubscribers())})),b}if(l!==this._sendGeneration)return;let m=new Set(i.map(b=>b.id));this._attachments=this._attachments.filter(b=>!m.has(b.id)),this._isSending=!1,this._notifySubscribers();let p=d.filter(b=>!this._removedDuringSend.has(b.id));this._removedDuringSend.clear();let u={createdAt:new Date,role:a,content:s?[{type:"text",text:s}]:[],attachments:p,runConfig:c,metadata:{custom:{...n?{quote:n}:{}}}},h={text:s,quote:n,attachments:p},v;try{v=this.handleSend(u,e)}catch(b){throw this._restoreUnsentDraft(b,l,h),b}v&&v.catch(b=>{this._restoreUnsentDraft(b,l,h)}),this._notifyEventSubscribers("send",{chars:s.length,attachments:p.length})}restoreDraft(e){return this._text.trim()||this._quote!==void 0||this._attachments.length>0?!1:(this._text=e.text,this._rebaseDictation(e.text),this._quote=e.quote,this._attachments=e.attachments??[],this._notifySubscribers(),!0)}retractDraft(e){let r=e.attachments!==void 0?this._attachments===e.attachments:this._attachments.length===0;this._text!==e.text||this._quote!==e.quote||!r||(this._text="",this._rebaseDictation(""),this._quote=void 0,this._attachments=[],this._notifySubscribers())}_restoreUnsentDraft(e,r,o){Ai(e)&&r===this._sendGeneration&&this.restoreDraft(o)}cancel(){this.handleCancel()}get queue(){return Mt}moveQueueItem(e,r){}removeQueueItem(e){}async addAttachment(e){if(rd(e)){let n=this.getAttachmentAdapter();if(n&&!Tn({name:e.name,type:e.contentType??""},n.accept)){let c=`File type ${e.contentType||"unknown"} is not accepted. Accepted types: ${n.accept}`,l=new Error(c);throw this._safeEmitAttachmentAddError("not-accepted",c,void 0,l,e.contentType),l}let a={id:e.id??Be(),type:e.type??"document",name:e.name,contentType:e.contentType,content:e.content,status:{type:"complete"}};this._attachments=[...this._attachments,a],this._notifySubscribers(),this._notifyEventSubscribers("attachmentAdd",{...a.contentType?{contentType:a.contentType}:void 0});return}let r=this.getAttachmentAdapter();if(!r){let n="Attachments are not supported",a=new Error(n);throw this._safeEmitAttachmentAddError("no-adapter",n,void 0,a,e.type),a}if(!Tn({name:e.name,type:e.type},r.accept)){let n=`File type ${e.type||"unknown"} is not accepted. Accepted types: ${r.accept}`,a=new Error(n);throw this._safeEmitAttachmentAddError("not-accepted",n,void 0,a,e.type),a}let o=this._attachmentAddOperations.start(),i=n=>{if(!this._attachmentAddOperations.accept(o,n.id))return!1;let a=this._attachments.findIndex(c=>c.id===n.id);return a!==-1?this._attachments=[...this._attachments.slice(0,a),n,...this._attachments.slice(a+1)]:this._attachments=[...this._attachments,n],this._notifySubscribers(),!0},s;try{await id(r.add({file:e}),n=>(s=n,i(n)))}catch(n){if(this._attachmentAddOperations.isCancelled(o))return;throw s&&i({...s,status:{type:"incomplete",reason:"error",message:n instanceof Error?n.message:String(n)}}),this._safeEmitAttachmentAddError("adapter-error",n instanceof Error?n.message:String(n),s?.id,n instanceof Error?n:void 0,s?.contentType||e.type),n}finally{this._attachmentAddOperations.finish(o)}this._attachmentAddOperations.isCancelled(o)||(s?.status.type==="incomplete"&&s.status.reason==="error"?this._safeEmitAttachmentAddError("adapter-error",s.status.message??"Attachment upload did not complete successfully.",s.id,void 0,s.contentType||e.type):this._notifyEventSubscribers("attachmentAdd",{...s?.contentType?{contentType:s.contentType}:e.type?{contentType:e.type}:void 0}))}_safeEmitAttachmentAddError(e,r,o,i,s){try{this._notifyEventSubscribers("attachmentAddError",{reason:e,message:r,...o!==void 0&&{attachmentId:o},...i!==void 0&&{error:i},...s?{contentType:s}:void 0})}catch(n){console.error("[assistant-ui] attachmentAddError subscriber threw:",n)}}async removeAttachment(e){let r=this._attachments.findIndex(i=>i.id===e);if(r===-1)throw new Error("Attachment not found");let o=this._attachments[r];if(this._cancelAttachmentAdd(e),this._isSending&&this._removedDuringSend.add(e),!ro(o)){let i=this.getAttachmentAdapter();if(!i)throw new Error("Attachments are not supported");try{await i.remove(o)}catch(s){let n=s instanceof Error?s.message:String(s);throw this._attachments=this._attachments.map(a=>a.id===e&&!ro(a)?{...a,status:{type:"incomplete",reason:"error",message:n}}:a),this._notifySubscribers(),s}}this._attachments=this._attachments.filter(i=>i.id!==e),this._notifySubscribers()}get dictation(){return this._dictation}_isActiveSession(e,r){return this._activeDictationSessionId===e&&this._dictationSession===r}startDictation(){let e=this.getDictationAdapter();if(!e)throw new Error("Dictation adapter not configured");let r=this._dictationSession!==void 0;if(this._dictationSession){let d=this._dictationSession;this._cleanupDictation({notify:!1}),this._stopDictationSession(d)}let o=e.disableInputDuringDictation??!1;this._dictationBaseText=this._text,this._currentInterimText="";let i;try{i=e.listen()}catch(d){if(r)try{this._notifySubscribers()}catch(m){console.error("[assistant-ui] Dictation replacement rollback notification threw",m)}throw d}this._dictationSession=i;let s=++this._dictationSessionIdCounter;this._activeDictationSessionId=s,this._dictation={status:i.status,inputDisabled:o},this._notifySubscribers();let n=i.onSpeech(d=>{if(!this._isActiveSession(s,i))return;let m=d.isFinal!==!1,p=this._dictationBaseText&&!this._dictationBaseText.endsWith(" ")&&d.transcript?" ":"";if(m){if(this._dictationBaseText=this._dictationBaseText+p+d.transcript,this._currentInterimText="",this._text=this._dictationBaseText,this._dictation){let{transcript:u,...h}=this._dictation;this._dictation=h}this._notifySubscribers()}else this._currentInterimText=p+d.transcript,this._text=this._dictationBaseText+this._currentInterimText,this._dictation&&(this._dictation={...this._dictation,transcript:d.transcript}),this._notifySubscribers()});this._dictationUnsubscribes.push(n);let a=i.onSpeechStart(()=>{this._isActiveSession(s,i)&&(this._dictation={status:{type:"running"},inputDisabled:o,...this._dictation?.transcript&&{transcript:this._dictation.transcript}},this._notifySubscribers())});this._dictationUnsubscribes.push(a);let c=i.onSpeechEnd(()=>{this._cleanupDictation({sessionId:s})});this._dictationUnsubscribes.push(c);let l=setInterval(()=>{this._isActiveSession(s,i)&&i.status.type==="ended"&&this._cleanupDictation({sessionId:s})},100);this._dictationUnsubscribes.push(()=>clearInterval(l))}stopDictation(){if(!this._dictationSession)return;let e=this._dictationSession,r=this._activeDictationSessionId,o=()=>this._cleanupDictation({sessionId:r});this._stopDictationSession(e,o)}_stopDictationSession(e,r=()=>{}){let o;try{o=e.stop()}catch(i){console.error("[assistant-ui] Dictation session stop threw",i),r();return}o.then(r,i=>{console.error("[assistant-ui] Dictation session stop rejected",i),r()})}_cleanupDictation(e){if(e?.sessionId!==void 0&&e.sessionId!==this._activeDictationSessionId||this._isCleaningDictation)return;this._isCleaningDictation=!0;let r=o=>{try{o()}catch(i){console.error("[assistant-ui] Dictation cleanup threw",i)}};try{let o=this._dictationUnsubscribes;this._dictationUnsubscribes=[],this._dictationSession=void 0,this._activeDictationSessionId=void 0,this._dictation=void 0,this._dictationBaseText="",this._currentInterimText="";for(let i of o)r(i);e?.notify!==!1&&r(()=>this._notifySubscribers())}finally{this._isCleaningDictation=!1}}_notifyEventSubscribers(e,r){let o=this._eventSubscribers.get(e);o&&ce(o,r,`Composer runtime "${e}"`)}unstable_on(e,r){let o=r,i=this._eventSubscribers.get(e);return i||(i=new Set,this._eventSubscribers.set(e,i)),i.add(o),()=>{this._eventSubscribers.get(e)?.delete(o)}}};var xf=t=>t.capabilities?.cancel?_n(t):!1,sd=class extends ji{constructor(e){super();f(this,"_queueCache");f(this,"runtime");this.runtime=e,this.connect()}get canCancel(){return xf(this.runtime)}get canSend(){return!this.isEmpty&&!this.runtime.isSendDisabled&&!this.runtime.voice&&!this._isSending}get queue(){let e=this.runtime.getSteerQueueItems?.()??Mt,r=this.runtime.getQueueItems?.()??Mt,o=this._queueCache;if(o&&o.steer===e&&o.queue===r)return o.flat;let i=e.length===0?r:r.length===0?e:[...e,...r];return this._queueCache={steer:e,queue:r,flat:i},i}moveQueueItem(e,r){this.runtime.moveQueueItem?.(e,r)}removeQueueItem(e){this.runtime.removeQueueItem?.(e)}getAttachmentAdapter(){return this.runtime.adapters?.attachments}getDictationAdapter(){return this.runtime.adapters?.dictation}connect(){let e=!1,r=this.runtime.isSendDisabled,o=this.runtime.voice!==void 0,i=this.queue;return this.runtime.subscribe(()=>{let s=!1,n=this.canCancel;e!==n&&(e=n,s=!0),r!==this.runtime.isSendDisabled&&(r=this.runtime.isSendDisabled,s=!0);let a=this.runtime.voice!==void 0;o!==a&&(o=a,s=!0),i!==this.queue&&(i=this.queue,s=!0),s&&this._notifySubscribers()})}async handleSend(e,r){return this.runtime.append({...e,parentId:this.runtime.messages.at(-1)?.id??null,sourceId:null,startRun:r?.startRun,steer:r?.steer})}async handleCancel(){this.runtime.cancelRun()}};var nd=class extends ji{constructor(e,r,{parentId:o,message:i}){super();f(this,"_nonTextPassthrough");f(this,"_parentId");f(this,"_sourceId");f(this,"runtime");f(this,"endEditCallback");this.runtime=e;let s=e.voice!==void 0,n=e.subscribe(()=>{let c=e.voice!==void 0;c!==s&&(s=c,this._notifySubscribers())});this.endEditCallback=()=>{n(),r()},this._parentId=o,this._sourceId=i.id,this.setText(At(i)),this.setRole(i.role);let a;i.role==="user"?(a=[...i.attachments??[],...td(i.content)],this._nonTextPassthrough=[]):(a=i.attachments??[],this._nonTextPassthrough=i.content.filter(c=>c.type!=="text")),this.setAttachments(a),this.setRunConfig({...e.composer.runConfig})}get canCancel(){return!0}get canSend(){return!this.isEmpty&&!this.runtime.voice&&!this._isSending}getAttachmentAdapter(){return this.runtime.adapters?.attachments}getDictationAdapter(){return this.runtime.adapters?.dictation}get parentId(){return this._parentId}get sourceId(){return this._sourceId}async handleSend(e,r){let o=this._nonTextPassthrough.length>0?[...e.content,...this._nonTextPassthrough]:e.content,i=this.runtime.append({...e,content:o,parentId:this._parentId,sourceId:this._sourceId,startRun:r?.startRun});return this.handleCancel(),i}handleCancel(){this.endEditCallback(),this._notifySubscribers()}};var ad=class extends pr{constructor(e){super();f(this,"_isInitialized",!1);f(this,"repository",new $i);f(this,"_voiceMessages",[]);f(this,"_voiceGeneration",0);f(this,"_cachedMergedMessages",null);f(this,"_cachedVoiceGeneration",-1);f(this,"_cachedMergedBase",null);f(this,"composer",new sd(this));f(this,"_contextProvider");f(this,"_editComposers",new Map);f(this,"_stopSpeaking");f(this,"speech");f(this,"_voiceSession");f(this,"_voiceUnsubs",[]);f(this,"voice");f(this,"_voiceVolume",0);f(this,"_voiceVolumeSubscribers",new Set);f(this,"getVoiceVolume",()=>this._voiceVolume);f(this,"subscribeVoiceVolume",e=>(this._voiceVolumeSubscribers.add(e),()=>this._voiceVolumeSubscribers.delete(e)));f(this,"_currentAssistantMsg",null);f(this,"_eventSubscribers",new Map);this._contextProvider=e}_markVoiceMessagesDirty(){this._voiceGeneration++,this._cachedMergedMessages=null}_getBaseMessages(){return this.repository.getMessages()}_commitVoiceMessage(e){}get messages(){if(this._voiceMessages.length===0)return this._getBaseMessages();let e=this._getBaseMessages();if(this._cachedVoiceGeneration!==this._voiceGeneration||this._cachedMergedBase!==e){let r=new Set(e.map(o=>o.id));this._cachedMergedMessages=[...e,...this._voiceMessages.filter(o=>!r.has(o.id))],this._cachedVoiceGeneration=this._voiceGeneration,this._cachedMergedBase=e}return this._cachedMergedMessages}get state(){let e;for(let r of this.messages)r.role==="assistant"&&(e=r);return e?.metadata.unstable_state??null}getModelContext(){return this._contextProvider.getModelContext()}enrichAppendMetadata(e,r=e.parentId){if(e.role!=="user")return e;let o=this.messages,i=r===null?-1:o.findIndex(n=>n.id===r),s=dl(this.getModelContext().unstable_composerMetadata,o.slice(0,i+1));return s?{...e,metadata:{...e.metadata,custom:{...e.metadata?.custom,...s}}}:e}getEditComposer(e){return this._editComposers.get(e)}_isVoiceMessage(e){return e!==null&&this._voiceMessages.some(r=>r.id===e)}_resolveAppendParent(e){return this._isVoiceMessage(e)?this._getBaseMessages().at(-1)?.id??null:e}beginEdit(e){if(this.voice)throw new Error("Cannot edit a message while a voice session is connected");if(this._isVoiceMessage(e))throw new Error("Voice transcript messages cannot be edited");if(this._editComposers.has(e))throw new Error("Edit already in progress");this._editComposers.set(e,new nd(this,()=>this._editComposers.delete(e),this.repository.getMessage(e))),this._notifySubscribers()}getMessageById(e){try{return this.repository.getMessage(e)}catch{let r=this.repository.getMessages(),o=this._voiceMessages.findIndex(i=>i.id===e);return o!==-1?{parentId:o>0?this._voiceMessages[o-1].id:r.at(-1)?.id??null,message:this._voiceMessages[o],index:r.length+o}:void 0}}getBranches(e){return this._voiceMessages.some(r=>r.id===e)?[]:this.repository.getBranches(e)}switchToBranch(e){this.repository.switchToBranch(e),this._notifySubscribers()}_notifyEventSubscribers(e,r){let o=this._eventSubscribers.get(e);o&&ce(o,r,`Thread runtime "${e}"`)}_notifyToolApprovalAnswered(e,r,o,i){this._notifyEventSubscribers("toolApprovalAnswered",{messageId:e,toolCallId:r,toolName:o,approved:i})}submitFeedback({messageId:e,type:r,comment:o}){let i=this.adapters?.feedback,s=this.getMessageById(e);if(!s)throw new Error(`Message not found: ${e}`);let{message:n,parentId:a}=s,c=o?.trim(),l={type:r,...c?{comment:c}:void 0};if(i?.submit({message:n,...l}),n.role==="assistant"){let d={...n,metadata:{...n.metadata,submittedFeedback:l}},m=this._voiceMessages.findIndex(p=>p.id===e);m===-1?this.repository.addOrUpdateMessage(a,d):(this._voiceMessages[m]=d,this._currentAssistantMsg===n&&(this._currentAssistantMsg=d),this._markVoiceMessagesDirty())}this._notifySubscribers()}speak(e){let r=this.adapters?.speech;if(!r)throw new Error("Speech adapter not configured");let o=this.getMessageById(e);if(!o)throw new Error(`Message not found: ${e}`);let{message:i}=o,s=this._stopSpeaking,n;try{s?.(),n=r.speak(At(i))}catch(m){if(s&&!this._stopSpeaking)try{this._notifySubscribers()}catch(p){console.error("[assistant-ui] Speech rollback notification threw",p)}throw m}let a,c=()=>{this._stopSpeaking=void 0,this.speech=void 0;let m=a;a=void 0,m?.()},l=()=>{if(this._stopSpeaking===l)try{c()}finally{n.cancel()}},d=()=>{this._stopSpeaking===l&&(n.status.type==="ended"?Ye([c,()=>this._notifySubscribers()]):(this.speech={messageId:e,status:n.status},this._notifySubscribers()))};this._stopSpeaking=l;try{if(a=n.subscribe(d),this._stopSpeaking!==l){a();return}d()}catch(m){if(this._stopSpeaking===l)try{Ye([l,()=>this._notifySubscribers()])}catch(p){console.error("[assistant-ui] Speech rollback cleanup threw",p)}throw m}}stopSpeaking(){if(!this._stopSpeaking)throw new Error("No message is being spoken");Ye([this._stopSpeaking,()=>this._notifySubscribers()])}_onVoiceConnected(){}_onVoiceDisconnected(){}_isRunActive(){if(this.isRunning)return!0;let e=this._getBaseMessages().at(-1);return e?.role==="assistant"&&(e.status.type==="running"||e.status.type==="requires-action")}connectVoice(){let e=this.adapters?.voice;if(!e)throw new Error("Voice adapter not configured");if(this._isRunActive())throw new Error("Cannot start a voice session while a run is in progress or paused on a pending tool action");let r=this._voiceSession!==void 0;try{this._disconnectVoice(!1)}catch(n){console.error("[assistant-ui] Voice cleanup threw before reconnect",n)}let o;try{o=e.connect({})}catch(n){throw r&&this._voiceSession===void 0&&this._onVoiceDisconnected(),n}this._voiceSession=o;let i=[];this._voiceUnsubs=i;let s=()=>{if(this._voiceSession===o&&this._voiceUnsubs===i)return!1;try{Ye(i.splice(0))}catch(n){console.error("[assistant-ui] Detached voice setup cleanup threw",n)}return!0};try{let n="listening";if(this.voice={status:o.status,isMuted:o.isMuted,mode:n},this._voiceVolume=0,this._notifySubscribers(),s()||(i.push(o.onStatusChange(a=>{this._voiceSession===o&&(a.type==="ended"?(this._finishVoiceAssistantMessage(),this._voiceSession=void 0,this.voice=void 0,this._onVoiceDisconnected()):this.voice={status:a,isMuted:o.isMuted,mode:n},this._notifySubscribers())})),s())||(i.push(o.onModeChange(a=>{n=a,this.voice&&(this.voice={...this.voice,mode:a},this._notifySubscribers())})),s())||(i.push(o.onVolumeChange(a=>{this._voiceVolume=a,ce(this._voiceVolumeSubscribers,void 0,"Voice volume")})),s()))return;i.push(o.onTranscript(a=>{this._handleVoiceTranscript(a)})),s()||this._onVoiceConnected()}catch(n){if(this._voiceSession===o&&this._voiceUnsubs===i){try{this._disconnectVoice(!1)}catch(a){console.error("[assistant-ui] Voice rollback cleanup threw",a)}r&&this._voiceSession===void 0&&this._onVoiceDisconnected()}else s();throw n}}_handleVoiceTranscript(e){if(this.ensureInitialized(),e.role==="user"){if(this._finishVoiceAssistantMessage(),this._currentAssistantMsg=null,e.isFinal){let r={id:Be(),role:"user",content:[{type:"text",text:e.text}],metadata:{modality:"voice",custom:{}},createdAt:new Date,status:{type:"complete",reason:"unknown"},attachments:[]};this._voiceMessages.push(r),this._commitVoiceMessage(r),this._markVoiceMessagesDirty(),this._notifySubscribers()}}else{let r=e.isFinal?{type:"complete",reason:"stop"}:{type:"running"};if(!this._currentAssistantMsg)this._currentAssistantMsg={id:Be(),role:"assistant",content:[{type:"text",text:e.text}],metadata:{unstable_state:this.state,unstable_annotations:[],unstable_data:[],steps:[],modality:"voice",custom:{}},status:r,createdAt:new Date},this._voiceMessages.push(this._currentAssistantMsg);else{let o=this._voiceMessages.indexOf(this._currentAssistantMsg);if(o===-1)return;let i={...this._currentAssistantMsg,content:[{type:"text",text:e.text}],status:r};this._voiceMessages[o]=i,this._currentAssistantMsg=i}e.isFinal&&(this._commitVoiceMessage(this._currentAssistantMsg),this._currentAssistantMsg=null),this._markVoiceMessagesDirty(),this._notifySubscribers()}}_finishVoiceAssistantMessage(e=!0){let r=this._voiceMessages.at(-1);if(r?.role==="assistant"&&r.status.type==="running"){let o=this._voiceMessages.length-1;this._voiceMessages[o]={...r,status:{type:"complete",reason:"stop"}},this._commitVoiceMessage(this._voiceMessages[o]),this._currentAssistantMsg=null,this._markVoiceMessagesDirty(),e&&this._notifySubscribers()}}disconnectVoice(){this._disconnectVoice(!0)}_disconnectVoice(e){this._finishVoiceAssistantMessage(!1),this._currentAssistantMsg=null;let r=this._voiceUnsubs.splice(0);this._voiceUnsubs=[];let o=this._voiceSession;this._voiceSession=void 0,this.voice=void 0,this._voiceVolume=0;let i=this.speech&&this._isVoiceMessage(this.speech.messageId)?this._stopSpeaking:void 0;this._voiceMessages=[],this._markVoiceMessagesDirty();try{Ye([...r,...i?[i]:[],...o?[()=>o.disconnect()]:[],()=>ce(this._voiceVolumeSubscribers,void 0,"Voice volume"),()=>this._notifySubscribers()])}finally{e&&o&&this._voiceSession===void 0&&this._onVoiceDisconnected()}}muteVoice(){if(!this._voiceSession)throw new Error("No active voice session");this._voiceSession.mute(),this.voice={...this.voice,isMuted:!0},this._notifySubscribers()}unmuteVoice(){if(!this._voiceSession)throw new Error("No active voice session");this._voiceSession.unmute(),this.voice={...this.voice,isMuted:!1},this._notifySubscribers()}ensureInitialized(){this._isInitialized||(this._isInitialized=!0,this._notifyEventSubscribers("initialize",{}))}export(){return this.repository.export()}import(e){this.ensureInitialized(),this.repository.clear(),this.repository.import(e),this._notifySubscribers()}reset(e){this.import(Bi.fromArray(e??[]))}unstable_on(e,r){let o=r;if(e==="modelContextUpdate")return this._contextProvider.subscribe?.(()=>ce([o],{},`Thread runtime "${e}"`))??(()=>{});let i=this._eventSubscribers.get(e);return i||(i=new Set,this._eventSubscribers.set(e,i)),i.add(o),e==="initialize"&&this._isInitialized&&queueMicrotask(()=>{i.has(o)&&ce([o],{},`Thread runtime "${e}"`)}),()=>{this._eventSubscribers.get(e)?.delete(o)}}};var yf=Symbol.for("assistant-stream.tool-execution-id"),oo=t=>{try{return JSON.parse(t),!0}catch{return!1}},cd=t=>{try{return JSON.parse(t)}catch{return}},kn=(t,e)=>{let r=cd(t),o=cd(e);return r===void 0||o===void 0?!1:Qr(r,o)},Cn=t=>t[yf],ld=class{constructor(t,e,r){f(this,"_getTools");f(this,"_callbacks");f(this,"_isClientToolCall");f(this,"_entries",new Map);f(this,"_humanInput",new Map);f(this,"_executing",new Set);f(this,"_discardedToolCallIds",new Set);f(this,"_settledResolvers",[]);f(this,"_statuses",new Map);f(this,"_ac",new AbortController);f(this,"_pendingRestore",!0);f(this,"_lastSnapshot",null);f(this,"_isRunning",!1);f(this,"_controller");f(this,"_pipelineDead",!1);f(this,"_pipelineRestartUsed",!1);this._getTools=t,this._callbacks=e,this._isClientToolCall=r,this._initPipeline()}_initPipeline(){let[t,e]=tn();this._controller=e;let o=cn(()=>this._getWrappedTools(),()=>this._ac.signal,(i,s,n)=>this._onHumanInput(i,s,n),{onExecutionStart:(i,s,n)=>this._onExecutionStart(i,n),onExecutionEnd:(i,s,n)=>this._onExecutionEnd(i,n)});t.pipeThrough(o).pipeThrough(new Yr).pipeTo(new WritableStream({write:i=>{try{if(i.type!=="result")return;this._handleResultChunk(i)}catch(s){console.error("[ToolInvocationTracker] result chunk handling failed",s)}}})).catch(i=>{console.error("[ToolInvocationTracker] stream pipeline failed; will attempt single restart on next setState",i),this._pipelineDead=!0})}setState(t){try{if(this._pipelineDead){if(this._pipelineRestartUsed)return;this._pipelineRestartUsed=!0,this._pipelineDead=!1,this._demoteEntriesToRestored(),this._executing.clear(),this._ac=new AbortController,this._initPipeline()}if(this._lastSnapshot&&this._lastSnapshot.messages===t.messages&&this._lastSnapshot.isRunning===t.isRunning&&this._lastSnapshot.isLoading===t.isLoading)return;t.isLoading===!0&&(this._pendingRestore=!0);let e=this._isRunning;this._isRunning=t.isRunning;try{this._processMessages(t.messages)}catch(r){throw this._isRunning=e,r}this._lastSnapshot=t,this._pendingRestore=!1}catch(e){console.error("[ToolInvocationTracker] setState failed; snapshot dropped",e)}}reset(){try{this._pendingRestore=!0,this._entries.clear(),this._discardedToolCallIds.clear(),this._lastSnapshot=null,this.abort(),this._statuses.size>0&&(this._statuses=new Map,this._invokeOnStatusesChange())}catch(t){console.error("[ToolInvocationTracker] reset failed",t)}}abort(t){try{if(this._humanInput.forEach(({reject:r})=>{try{r(new Error("Tool execution aborted"))}catch{}}),this._humanInput.clear(),t?.discardPending)for(let[r,o]of this._entries)o.controller&&(o.argsComplete||o.hasResult||(this._discardedToolCallIds.add(r),o.skipExecute=!0));if(this._ac.abort(),this._ac=new AbortController,this._executing.size===0)return Promise.resolve();let e=new Set(this._executing);return new Promise(r=>{this._settledResolvers.push({executionIds:e,resolve:r})})}catch(e){return console.error("[ToolInvocationTracker] abort failed",e),Promise.resolve()}}resume(t,e){try{let r=this._humanInput.get(t);return r?(this._humanInput.delete(t),this._setStatus(t,{type:"executing"}),r.resolve(e),!0):!1}catch(r){return console.error("[ToolInvocationTracker] resume failed",r),!1}}getStatuses(){return this._statuses}_getWrappedTools(){let t=this._getTools();if(t)return Object.fromEntries(Object.entries(t).map(([e,r])=>{let o=r.execute,i=r.streamCall;return o===void 0&&i===void 0?[e,r]:[e,{...r,...o!==void 0&&{execute:(...[s,n])=>{let a=Cn(n),c=this._captureExecution(n.toolCallId,a);return!c||c.skipExecute?new Promise(()=>{}):o(s,n)}},...i!==void 0&&{streamCall:(...[s,n])=>{let a=Cn(n);if(this._captureExecution(n.toolCallId,a))return i(s,n)}}}]}))}_captureExecution(t,e){if(e===void 0)return;let r=this._entries.get(t);if(r?.controller)return r.executionId===void 0&&(r.executionId=e),r.executionId===e?r:void 0}_onHumanInput(t,e,r){return new Promise((o,i)=>{let s=this._entries.get(t);if(!s?.controller||s.executionId!==r){i(new Error("Tool execution aborted"));return}let n=this._humanInput.get(t);if(n)try{n.reject(new Error("Human input request was superseded by a new request"))}catch{}this._humanInput.set(t,{executionId:r,resolve:o,reject:i}),this._setStatus(t,{type:"interrupt",payload:{type:"human",payload:e}})})}_onExecutionStart(t,e){this._captureExecution(t,e)&&(this._entries.get(t).skipExecute||(this._executing.add(e),this._humanInput.get(t)?.executionId!==e&&this._setStatus(t,{type:"executing"})))}_onExecutionEnd(t,e){if(e===void 0||!this._executing.delete(e))return;this._entries.get(t)?.executionId===e&&this._deleteStatus(t);let r=[];this._settledResolvers.forEach(({executionIds:o,resolve:i})=>{if([...o].some(s=>this._executing.has(s))){r.push({executionIds:o,resolve:i});return}try{i()}catch{}}),this._settledResolvers.length=0,this._settledResolvers.push(...r)}_handleResultChunk(t){let e=t.meta.toolCallId,r=Cn(t),o=this._entries.get(e);!o||o.executionId!==r||o?.hasResult||o.skipExecute||this._invokeOnResult({type:"add-tool-result",toolCallId:e,toolName:t.meta.toolName,result:t.result,isError:t.isError,...t.artifact!==void 0&&{artifact:t.artifact},...t.modelContent!==void 0&&{modelContent:t.modelContent}})}_invokeOnResult(t){try{this._callbacks.onResult(t)}catch(e){console.error("[ToolInvocationTracker] onResult callback threw; result dropped",e)}}_invokeOnStatusesChange(){try{this._callbacks.onStatusesChange(this._statuses)}catch(t){console.error("[ToolInvocationTracker] onStatusesChange callback threw; status change not propagated",t)}}_setStatus(t,e){let r=new Map(this._statuses);r.set(t,e),this._statuses=r,this._invokeOnStatusesChange()}_deleteStatus(t){if(!this._statuses.has(t))return;let e=new Map(this._statuses);e.delete(t),this._statuses=e,this._invokeOnStatusesChange()}_warnProviderOwnedSkip(t,e){}_shouldCloseArgsStream({argsText:t,hasResult:e,clientOwned:r}){return e?!0:oo(t)?r||!this._isRunning:!1}_startActiveEntry(t,e,r,o){let i={toolName:e,controller:this._controller.addToolCallPart({toolName:e,toolCallId:t}),argsText:"",hasResult:!1,skipExecute:r,argsComplete:!1,clientOwned:o};return this._entries.set(t,i),i}_demoteEntriesToRestored(){for(let[t,e]of this._entries)if(e.controller){if(!e.argsComplete&&!e.hasResult){this._entries.delete(t);continue}this._entries.set(t,{toolName:e.toolName,argsText:e.argsText,hasResult:e.hasResult})}}_processArgsText(t,e){if(!t.controller)return;let r=e.result!==void 0;if(e.argsText!==t.argsText){let o=!0;if(t.argsComplete)kn(t.argsText,e.argsText)&&(t.argsText=e.argsText),o=!1;else if(!e.argsText.startsWith(t.argsText))if(oo(t.argsText)&&oo(e.argsText)&&kn(t.argsText,e.argsText)){let i=this._shouldCloseArgsStream({argsText:e.argsText,hasResult:r,clientOwned:t.clientOwned});i&&t.controller.argsText.close(),t.argsText=e.argsText,t.argsComplete=i,o=!1}else o=!1;if(o&&t.controller){let i=e.argsText.slice(t.argsText.length);t.controller.argsText.append(i);let s=this._shouldCloseArgsStream({argsText:e.argsText,hasResult:r,clientOwned:t.clientOwned});s&&t.controller.argsText.close(),t.argsText=e.argsText,t.argsComplete=s}}!t.argsComplete&&t.controller&&this._shouldCloseArgsStream({argsText:t.argsText,hasResult:r,clientOwned:t.clientOwned})&&(t.controller.argsText.close(),t.argsComplete=!0)}_processMessages(t){let e=this._pendingRestore;for(let{part:r}of to(t)){let o=this._entries.get(r.toolCallId);if(e){o?.controller||this._entries.set(r.toolCallId,{toolName:r.toolName,argsText:r.argsText,hasResult:r.result!==void 0});continue}let i=o;if(r.result!==void 0&&this._discardedToolCallIds.delete(r.toolCallId),i&&!i.controller){if(i.hasResult||!(r.argsText!==i.argsText&&!(oo(i.argsText)&&oo(r.argsText)&&kn(i.argsText,r.argsText)))&&r.result===void 0)continue;this._entries.delete(r.toolCallId),i=void 0}if(!i){let s=this._isClientToolCall?.(r),n=r.result===void 0&&s===!1;n&&this._warnProviderOwnedSkip(r.toolName,r.toolCallId),i=this._startActiveEntry(r.toolCallId,r.toolName,r.result!==void 0||n||this._discardedToolCallIds.has(r.toolCallId),s===!0)}if(r.approval!==void 0&&(i.skipExecute=!0),this._processArgsText(i,r),r.result!==void 0&&!i.hasResult){let{controller:s}=i;if(!s)continue;i.hasResult=!0,i.argsComplete=!0,s.setResponse(new Ne({result:r.result,artifact:r.artifact,isError:r.isError,...r.modelContent!==void 0?{modelContent:r.modelContent}:{}})),s.close()}}}};var _f=Object.freeze([]),In=(t,e)=>{Promise.resolve(e).catch(r=>{console.error(`[ExternalStoreThreadRuntimeCore] ${t} callback rejected`,r)})},Sf=(t,e)=>t&&e[e.length-1]?.role!=="assistant",dd=class extends ad{constructor(e,r){super(e);f(this,"_capabilities",{switchToBranch:!1,switchBranchDuringRun:!1,edit:!1,delete:!1,reload:!1,refetchThread:!1,cancel:!1,unstable_copy:!1,speech:!1,dictation:!1,voice:!1,attachments:!1,feedback:!1,queue:!1});f(this,"_messages");f(this,"isDisabled");f(this,"isSendDisabled");f(this,"suggestions",[]);f(this,"extras");f(this,"_converter",new gn);f(this,"_pendingDeleteEvictions",new Set);f(this,"_optimistic",null);f(this,"_store");f(this,"_getInitializePromise");f(this,"_transformedQueue");f(this,"_toolInvocations",null);f(this,"_toolStatuses",new Map);f(this,"_effectiveIsRunning",!1);f(this,"_inTrackerUpdate",!1);f(this,"_pendingRunningRefresh",!1);f(this,"_toolCallToMessageId",new Map);f(this,"_messagesForToolCallIndex",null);f(this,"updateMessages",e=>{this._store.convertMessage!==void 0?this._store.setMessages?.(e.flatMap(pl)):this._store.setMessages?.(e)});this.__internal_setAdapter(r)}get capabilities(){return this._capabilities}get isLoading(){return this._store.isLoading??!1}get isRunning(){return this._hasExecutingTools(this._store)?!0:this._store.isRunning}_getBaseMessages(){return this._messages}get state(){return this._store.state??super.state}get adapters(){return this._store.adapters}get unstable_refetchThread(){if(this._store.onRefetchThread)return()=>this._store.onRefetchThread()}__internal_setGetInitializePromise(e){this._getInitializePromise=e}_runTrackerUpdate(e){this._inTrackerUpdate=!0;try{e()}finally{this._inTrackerUpdate=!1}this._pendingRunningRefresh&&(this._pendingRunningRefresh=!1,this._refreshEffectiveIsRunning())}_refreshEffectiveIsRunning(){let e=this._getEffectiveIsRunning(this._store);this._effectiveIsRunning!==e&&(this._effectiveIsRunning=e,this._notifyEventSubscribers(e?"runStart":"runEnd",{}),this._notifySubscribers())}_hasExecutingTools(e){if(e.unstable_enableToolInvocations!==!0||this._toolInvocations===null)return!1;for(let r of this._toolStatuses.values())if(r.type==="executing")return!0;return!1}_getEffectiveIsRunning(e){return(e.isRunning??!1)||this._hasExecutingTools(e)}beginEdit(e){if(!this._store.onEdit)throw new Error("Runtime does not support editing.");super.beginEdit(e)}__internal_setAdapter(e){this._store!==e&&this._updateStoreSnapshot(e)}_updateStoreSnapshot(e){let r=this._effectiveIsRunning;this.isDisabled=e.isDisabled??!1,this.isSendDisabled=e.isSendDisabled??!1;let o=this._store;this._store=e;let i=this._getEffectiveIsRunning(e),s=e.unstable_messageRepositoryInstance,n=s!==void 0&&s!==this.repository;n&&(this.repository=s,this._pendingDeleteEvictions.clear()),o?.queue!==e.queue&&(this._transformedQueue=void 0,e.queue?.__internal_setDispatchTransform?.(p=>{let u=this.messages.at(-1)?.id??null;return this.enrichAppendMetadata({...p,parentId:u},u)}),e.queue?.__internal_setDispatchTransform&&(this._transformedQueue=e.queue)),this.extras!==e.extras&&(this.extras=e.extras);let a=e.suggestions??_f;xe(this.suggestions,a)||(this.suggestions=a);let c={switchToBranch:this._store.setMessages!==void 0,switchBranchDuringRun:!1,edit:this._store.onEdit!==void 0,delete:this._store.onDelete!==void 0||this._store.setMessages!==void 0,reload:this._store.onReload!==void 0,refetchThread:this._store.onRefetchThread!==void 0,cancel:this._store.onCancel!==void 0,speech:this._store.adapters?.speech!==void 0,dictation:this._store.adapters?.dictation!==void 0,voice:this._store.adapters?.voice!==void 0,unstable_copy:this._store.unstable_capabilities?.copy!==!1,attachments:!!this._store.adapters?.attachments,feedback:!!this._store.adapters?.feedback,queue:this._store.queue!==void 0};xe(this._capabilities,c)||(this._capabilities=c);let l;if(e.messageRepository){if(o&&!n&&o.isRunning===e.isRunning&&o.messageRepository===e.messageRepository&&r===i){this._notifySubscribers();return}let p=e.messageRepository.messages,u=e.messageRepository.headId??p.at(-1)?.message.id??null;if(o&&!n&&o.messageRepository===e.messageRepository)this.repository.resetHead(u),l=this.repository.getMessages();else{let h=new Set(p.map(({message:v})=>v.id));for(let{message:v,parentId:b}of p)this.repository.addOrUpdateMessage(b,v);for(let{message:v}of this.repository.export().messages)h.has(v.id)||this.repository.deleteMessage(v.id);this._pendingDeleteEvictions.clear(),this.repository.resetHead(u),l=this.repository.getMessages()}}else if(e.messages){if(o){if(o.convertMessage!==e.convertMessage)this._converter=new gn;else if(!n&&o.isRunning===e.isRunning&&o.messages===e.messages&&r===i){this._notifySubscribers();return}}l=e.convertMessage?this._converter.convertMessages(e.messages,(h,v,b)=>{if(!e.convertMessage)return v;let y=b===(e.messages?.length??0)-1,S=`${ml}${b}`;if(h&&(h.role!=="assistant"||!bl(h.status)||h.status===fn(h.content,y,i))){if(h.id.startsWith("__external_store_fallback_")&&h.id!==S){let k={...h,id:S};return pn(k,v),k}return h}let A=e.convertMessage(v,b),I=br(A,S,fn(A.content,y,i));return pn(I,v),I}):e.messages;let p=new Set,u=[];for(let h=l.length-1;h>=0;h--){let v=l[h];if(p.has(v.id)){console.warn(`ExternalStoreThreadRuntimeCore: duplicate message id "${v.id}" in the provided messages array; keeping the last occurrence.`);continue}p.add(v.id),u.push(v)}u.length!==l.length&&(l=u.reverse());for(let h=0;h<l.length;h++){let v=l[h],b=l[h-1];this.repository.addOrUpdateMessage(b?.id??null,v)}if(this._pendingDeleteEvictions.size>0){let h=new Set(l.map(v=>v.id));for(let v of this._pendingDeleteEvictions)if(this._pendingDeleteEvictions.delete(v),!h.has(v)){try{this.repository.getMessage(v)}catch{continue}this.repository.deleteMessage(v)}}}else throw new Error("ExternalStoreAdapter must provide either 'messages' or 'messageRepository'");l.length>0&&this.ensureInitialized(),this._effectiveIsRunning=i,r!==i&&(i?this._notifyEventSubscribers("runStart",{}):this._notifyEventSubscribers("runEnd",{}));let d=null;if(Sf(i,l)){let p=l.at(-1)?.id??null;this._optimistic?.parentId!==p&&(this._optimistic={id:Be(),parentId:p}),d=this._optimistic.id,this.repository.addOrUpdateMessage(p,br({role:"assistant",content:[],metadata:{isOptimistic:!0}},d,{type:"running"}))}d===null&&(this._optimistic=null),this.repository.resetHead(d??l.at(-1)?.id??null);let m=this.repository.getMessages();if((!this._messages||!vn(this._messages,m))&&(this._messages=m),this._voiceMessages.length>0){let p=new Set(this._messages.map(h=>h.id)),u=this._voiceMessages.filter(h=>!p.has(h.id));u.length!==this._voiceMessages.length&&(this._voiceMessages=u,this._markVoiceMessagesDirty())}n&&this._runTrackerUpdate(()=>this._toolInvocations?.reset()),this._runTrackerUpdate(()=>this._driveToolInvocations()),this._notifySubscribers()}_driveToolInvocations(){if(!this._store.unstable_enableToolInvocations){this._toolInvocations&&(this._toolInvocations.reset(),this._toolInvocations=null,this._toolStatuses=new Map,this._store.setToolStatuses?.({}));return}this._toolInvocations||(this._toolInvocations=new ld(()=>this.getModelContext().tools,{onResult:e=>{try{let r=this._findMessageIdForToolCall(e.toolCallId);if(r===void 0)return;In("onAddToolResult",this._store.onAddToolResult?.({messageId:r,toolCallId:e.toolCallId,toolName:e.toolName,result:e.result,isError:e.isError,...e.artifact!==void 0&&{artifact:e.artifact},...e.modelContent!==void 0&&{modelContent:e.modelContent}}))}catch(r){console.error("[ExternalStoreThreadRuntimeCore] onAddToolResult dispatch failed",r)}},onStatusesChange:e=>{let r=this._hasExecutingTools(this._store);this._toolStatuses=e;try{this._store.setToolStatuses?.(Object.fromEntries(e))}finally{r!==this._hasExecutingTools(this._store)&&(this._inTrackerUpdate?this._pendingRunningRefresh=!0:this._updateStoreSnapshot(this._store))}}},e=>this._store.unstable_isClientToolCall?.(e))),this._toolInvocations.setState({messages:this._messages,isRunning:this._getEffectiveIsRunning(this._store),...this._store.isLoading!==void 0&&{isLoading:this._store.isLoading}})}_findMessageIdForToolCall(e){if(this._messagesForToolCallIndex!==this._messages){this._toolCallToMessageId.clear();for(let{part:r,messageId:o}of to(this._messages))this._toolCallToMessageId.set(r.toolCallId,o);this._messagesForToolCallIndex=this._messages}return this._toolCallToMessageId.get(e)}switchToBranch(e){if(!this._store.setMessages)throw new Error("Runtime does not support switching branches.");if(this._getEffectiveIsRunning(this._store))return;let r=this._store.unstable_onBranchChange,o=r?this.repository.canonicalHeadId:null;this.repository.switchToBranch(e),this._pendingDeleteEvictions.clear(),this.updateMessages(this.repository.getMessages()),r&&this._notifyBranchChange(o,r)}_notifyBranchChange(e,r){let o=this.repository.canonicalHeadId;o!==e&&r({headId:o,visibleMessageIds:this.repository.getMessages().map(i=>i.id)})}async append(e){let r={...e,parentId:this._resolveAppendParent(e.parentId)};if(this.voice)throw new Error("Cannot send a text message while a voice session is connected");if(this._isVoiceMessage(r.sourceId))throw new Error("Voice transcript messages cannot be edited");let o=r.sourceId!=null||r.parentId!==(this._getBaseMessages().at(-1)?.id??null);r=!o&&this._store.queue&&this._store.queue===this._transformedQueue?r:this.enrichAppendMetadata(r);let i=eo(this);this.ensureInitialized();let s=this._getInitializePromise?.();if(!o&&this._store.queue){if(s&&await s,!Di(this,i))return;r.steer??this._getEffectiveIsRunning(this._store)?this._store.queue.steer(r):this._store.queue.enqueue(r);return}if(s?.catch(()=>{}),(r.startRun??r.role==="user")&&await this._toolInvocations?.abort({discardPending:!0}),!!Di(this,i))if(o){if(!this._store.onEdit)throw new Error("Runtime does not support editing messages.");this._pendingDeleteEvictions.clear(),await this._store.onEdit(r)}else await this._store.onNew(r)}_commitVoiceMessage(e){this._store.onVoiceTranscript?.(e)}async deleteMessage(e){if(this._store.onDelete){this.repository.getMessages().some(o=>o.id===e)&&this._pendingDeleteEvictions.add(e);try{await this._store.onDelete(e)}catch(o){throw this._pendingDeleteEvictions.delete(e),o}return}if(!this._store.setMessages)throw new Error("Runtime does not support deleting messages.");this._getEffectiveIsRunning(this._store)&&await this._toolInvocations?.abort();let r=this.repository.getMessages();if(r.findIndex(o=>o.id===e)===-1)throw new Error("Message not found.");this._pendingDeleteEvictions.clear(),this.updateMessages(r.filter(o=>o.id!==e)),this._evictDeletedMessage(e)}_evictDeletedMessage(e){if(!e.startsWith("__external_store_fallback_")){try{this.repository.getMessage(e)}catch{return}this.repository.deleteMessage(e),this._publishRepositoryMessages()}}_publishRepositoryMessages(){let e=this.repository.getMessages();vn(this._messages,e)||(this._messages=e),this._notifySubscribers()}getQueueItems(){return this._store?.queue?.items??Mt}getSteerQueueItems(){return this._store?.queue?.steerItems??Mt}moveQueueItem(e,r){this._store?.queue?.move(e,r)}removeQueueItem(e){this._store?.queue?.remove(e)}async startRun(e){if(!this._store.onReload)throw new Error("Runtime does not support reloading messages.");if(this.voice)throw new Error("Cannot start a run while a voice session is connected");if(this._isVoiceMessage(e.sourceId))throw new Error("Voice transcript messages cannot be reloaded");this._pendingDeleteEvictions.clear(),await this._toolInvocations?.abort({discardPending:!0}),await this._store.onReload(e.parentId,e)}async resumeRun(e){if(!this._store.onResume)throw new Error("Runtime does not support resuming runs.");if(this.voice)throw new Error("Cannot start a run while a voice session is connected");if(this._isVoiceMessage(e.sourceId))throw new Error("Voice transcript messages cannot be reloaded");await this._store.onResume(e)}exportExternalState(){if(!this._store.onExportExternalState)throw new Error("Runtime does not support exporting external states.");return this._store.onExportExternalState()}importExternalState(e){if(!this._store.onLoadExternalState)throw new Error("Runtime does not support importing external states.");this._runTrackerUpdate(()=>this._toolInvocations?.reset()),this._store.onLoadExternalState(e)}unstable_notifySessionReset(){this._runTrackerUpdate(()=>this._toolInvocations?.reset()),this._store.queue?.__internal_notifyCancelled?.()}cancelRun(){if(!this._store.onCancel)throw new Error("Runtime does not support cancelling runs.");let e=eo(this);this._toolInvocations?.abort({discardPending:!0}),this._store.queue?.__internal_notifyCancelled?.(),In("onCancel",this._store.onCancel()),this.dropEmptyOptimisticHead();let r=this.repository.getMessages(),o=r[r.length-1],i=this._store.setMessages!==void 0&&o?.role==="user"&&o.id===r.at(-1)?.id&&o.content.every(n=>n.type==="text")?o:void 0,s;if(i){let n={text:At(i),attachments:i.attachments,quote:i.metadata.custom.quote};this.composer.restoreDraft(n)&&(this.repository.deleteMessage(i.id),s={id:i.id,draft:n})}this._publishRepositoryMessages(),setTimeout(()=>{if(Di(this,e)){if(this.dropEmptyOptimisticHead(),s){let n=this.repository.getMessages();n.at(-1)?.id===s.id?this.repository.deleteMessage(s.id):n.some(a=>a.id===s.id)&&this.composer.retractDraft(s.draft)}this._publishRepositoryMessages(),this.updateMessages(this._messages)}},0)}dropEmptyOptimisticHead(){let e=this.repository.getMessages().at(-1);e&&e.metadata.isOptimistic&&e.content.length===0&&this.repository.deleteMessage(e.id)}addToolResult(e){if(!this._store.onAddToolResult)throw new Error("Runtime does not support tool results.");In("onAddToolResult",this._store.onAddToolResult(e))}resumeToolCall(e){if(!(this._toolInvocations?.resume(e.toolCallId,e.payload)??!1)){if(this._store.onResumeToolCall){this._store.onResumeToolCall(e);return}throw new Error(`Tool call ${e.toolCallId} is not waiting for resume.`)}}respondToToolApproval(e){if(!this._store.onRespondToToolApproval)throw new Error("Runtime does not support tool approvals.");let r=this.messages.findLast(i=>i.role==="assistant"&&i.content.some(s=>s.type==="tool-call"&&s.approval?.id===e.approvalId)),o=r?.content.find(i=>i.type==="tool-call"&&i.approval?.id===e.approvalId);try{return Promise.resolve(this._store.onRespondToToolApproval(e)).then(()=>{r&&o?.type==="tool-call"&&this._notifyToolApprovalAnswered(r.id,o.toolCallId,o.toolName,e.approved)})}catch(i){return Promise.reject(i)}}reset(e){let r=new $i;r.import(Bi.fromArray(e??[])),this.updateMessages(r.getMessages())}import(e){super.import(e),this._store.onImport&&this._store.onImport(this.repository.getMessages())}};var ud=t=>t.adapters?.threadList??{},pd=class extends Xl{constructor(e){super();f(this,"threads");this.threads=new ed(ud(e),()=>new dd(this._contextProvider,e))}setAdapter(e){this.threads.__internal_setAdapter(ud(e)),this.threads.getMainThreadRuntimeCore().__internal_setAdapter(e)}};var io=t=>{let e=g(21),{modelContext:r,feedback:o}=ul()??{},i;e:{if(!o||t.adapters?.feedback){i=t;break e}let h;e[0]!==o||e[1]!==t.adapters?(h={...t.adapters,feedback:o},e[0]=o,e[1]=t.adapters,e[2]=h):h=e[2];let v;e[3]!==t||e[4]!==h?(v={...t,adapters:h},e[3]=t,e[4]=h,e[5]=v):v=e[5],i=v}let s=i,n;e[6]!==s?(n=()=>new pd(s),e[6]=s,e[7]=n):n=e[7];let[a]=z(n),c;e[8]!==a.threads?(c=()=>()=>{Oi(a.threads.getMainThreadRuntimeCore())},e[8]=a.threads,e[9]=c):c=e[9];let l;e[10]!==a?(l=[a],e[10]=a,e[11]=l):l=e[11],D(c,l);let d;e[12]!==s||e[13]!==a?(d=()=>{a.setAdapter(s)},e[12]=s,e[13]=a,e[14]=d):d=e[14],D(d);let m,p;e[15]!==r||e[16]!==a?(m=()=>{if(r)return a.registerModelContextProvider(r)},p=[r,a],e[15]=r,e[16]=a,e[17]=m,e[18]=p):(m=e[17],p=e[18]),D(m,p);let u;return e[19]!==a?(u=new Ql(a),e[19]=a,e[20]=u):u=e[20],u};var md=$("react/jsx-runtime"),hd=t=>{let e=g(6),{id:r,children:o}=t,i=U(),s;e[0]!==r?(s=se({message:ne({source:"thread",query:{type:"id",id:r},get:c=>c.thread.message({id:r})}),composer:ne({source:"message",query:{},get:c=>c.thread.message({id:r}).composer()})}),e[0]=r,e[1]=s):s=e[1];let n=s,a;return e[2]!==i||e[3]!==o||e[4]!==n?(a=(0,md.jsx)(le,{extends:i,config:n,children:o}),e[2]=i,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var et=$("react/jsx-runtime"),En=(t,e)=>t.Message===e.Message&&t.EditComposer===e.EditComposer&&t.UserEditComposer===e.UserEditComposer&&t.AssistantEditComposer===e.AssistantEditComposer&&t.SystemEditComposer===e.SystemEditComposer&&t.UserMessage===e.UserMessage&&t.AssistantMessage===e.AssistantMessage&&t.SystemMessage===e.SystemMessage,fd=()=>null,gd=new WeakMap,Tf=(t,e)=>{let r=gd.get(t);return r||(r=new Set(t.map(o=>o.id)),gd.set(t,r)),r.has(e)},kf=(t,e,r)=>{switch(e){case"user":return r?t.UserEditComposer??t.EditComposer??t.UserMessage??t.Message:t.UserMessage??t.Message;case"assistant":return r?t.AssistantEditComposer??t.EditComposer??t.AssistantMessage??t.Message:t.AssistantMessage??t.Message;case"system":return r?t.SystemEditComposer??t.EditComposer??t.SystemMessage??t.Message??fd:t.SystemMessage??t.Message??fd;default:throw new Error(`Unknown message role: ${e}`)}},Rn=t=>{let e=g(6),{components:r}=t,o=R(Cf),i=R(If),s;e[0]!==r||e[1]!==i||e[2]!==o?(s=kf(r,o,i),e[0]=r,e[1]=i,e[2]=o,e[3]=s):s=e[3];let n=s,a;return e[4]!==n?(a=(0,et.jsx)(n,{}),e[4]=n,e[5]=a):a=e[5],a},so=te(t=>{let e=g(5),{index:r,components:o}=t,i;e[0]!==o?(i=(0,et.jsx)(Rn,{components:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,et.jsx)(wn,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},(t,e)=>t.index===e.index&&En(t.components,e.components));so.displayName="ThreadPrimitive.MessageByIndex";var no=te(t=>{let e=g(7),{messageId:r,components:o}=t,i;if(e[0]!==r?(i=a=>Tf(a.thread.messages,r),e[0]=r,e[1]=i):i=e[1],!R(i))return null;let s;e[2]!==o?(s=(0,et.jsx)(Rn,{components:o}),e[2]=o,e[3]=s):s=e[3];let n;return e[4]!==r||e[5]!==s?(n=(0,et.jsx)(hd,{id:r,children:s}),e[4]=r,e[5]=s,e[6]=n):n=e[6],n},(t,e)=>t.messageId===e.messageId&&En(t.components,e.components));no.displayName="ThreadPrimitive.Unstable_MessageById";var vd=({children:t})=>{let e=R(at(r=>r.thread.messages.map(o=>o.id)));return G(()=>e.length===0?null:e.map((r,o)=>(0,et.jsx)(wn,{index:o,children:(0,et.jsx)(gt,{getItemState:i=>i.thread.message({index:o}).getState(),children:i=>t({get message(){return i()}})})},r)),[e,t])},Li=t=>{let e=g(4),{components:r,children:o}=t;if(r){let s;return e[0]!==r?(s=(0,et.jsx)(vd,{children:()=>(0,et.jsx)(Rn,{components:r})}),e[0]=r,e[1]=s):s=e[1],s}let i;return e[2]!==o?(i=(0,et.jsx)(vd,{children:o}),e[2]=o,e[3]=i):i=e[3],i};Li.displayName="ThreadPrimitive.Messages";var Fi=te(Li,(t,e)=>t.children||e.children?t.children===e.children:En(t.components,e.components));function Cf(t){return t.message.role}function If(t){return t.message.composer.isEditing}var Vi=t=>{let e=t.message.metadata;if(!(!e||typeof e!="object"))return e.custom?.quote};var xr=$("react/jsx-runtime");var bd=class extends Error{constructor(e,r=`Component "${e}" is not in the generative-ui allowlist.`){super(r);f(this,"componentName");this.name="GenerativeUIRenderError",this.componentName=e}},Ef=t=>typeof t=="object"&&t!==null,wd=t=>t==null?[]:Array.isArray(t)?t:[t],xd=(t,e,r,o)=>{if(t==null)return null;if(typeof t=="string")return t;if(!Ef(t)||!("component"in t)||typeof t.component!="string")return typeof process<"u",null;let{component:i,props:s,children:n,key:a}=t,c=e[i];if(!c){if(r)return(0,xr.jsx)(r,{component:i,props:s},a??o);throw new bd(i)}return Is(c,{...s??{},key:a??o},...wd(n).map((l,d)=>xd(l,e,r,`${o}/${d}`)))},ao=t=>{let e=g(11),{spec:r,components:o,Fallback:i}=t,s=r?.root,n;e[0]!==s?(n=wd(s),e[0]=s,e[1]=n):n=e[1];let a=n,c;if(e[2]!==i||e[3]!==o||e[4]!==a){let d;e[6]!==i||e[7]!==o?(d=(m,p)=>xd(m,o,i,`${p}`),e[6]=i,e[7]=o,e[8]=d):d=e[8],c=a.map(d),e[2]=i,e[3]=o,e[4]=a,e[5]=c}else c=e[5];let l;return e[9]!==c?(l=(0,xr.jsx)(xr.Fragment,{children:c}),e[9]=c,e[10]=l):l=e[10],l};ao.displayName="GenerativeUIRender";var Ui=t=>{let e=g(4),{components:r,spec:o,Fallback:i}=t,s=R(Rf),n=o??s;if(!n)return null;let a;return e[0]!==i||e[1]!==r||e[2]!==n?(a=(0,xr.jsx)(ao,{spec:n,components:r,Fallback:i}),e[0]=i,e[1]=r,e[2]=n,e[3]=a):a=e[3],a};Ui.displayName="MessagePrimitive.GenerativeUI";function Rf(t){let e=t.part;return e?.type==="generative-ui"?e.spec:void 0}var B=$("react/jsx-runtime"),An=t=>{let e=-1;return{startGroup:r=>{e===-1&&(e=r)},endGroup:(r,o)=>{e!==-1&&(o.push({type:t,startIndex:e,endIndex:r}),e=-1)},finalize:(r,o)=>{e!==-1&&o.push({type:t,startIndex:e,endIndex:r})}}},Af=(t,e,r)=>{let o=[];if(e){let i=An("chainOfThoughtGroup");for(let s=0;s<t.length;s++){let n=t[s];n==="tool-call"||n==="reasoning"?i.startGroup(s):(i.endGroup(s-1,o),o.push({type:"single",index:s}))}i.finalize(t.length-1,o)}else{let i=An("toolGroup"),s=An("reasoningGroup");for(let n=0;n<t.length;n++){let a=t[n];a==="tool-call"?(s.endGroup(n-1,o),i.startGroup(n)):a==="reasoning"?(i.endGroup(n-1,o),s.startGroup(n)):(i.endGroup(n-1,o),s.endGroup(n-1,o),o.push({type:"single",index:n}))}i.finalize(t.length-1,o),s.finalize(t.length-1,o)}if(r){let i=new Set;for(let s of o){if(s.type==="single")continue;let n=r[s.startIndex];n!==void 0&&!i.has(n)&&(i.add(n),s.idKey=`id:${n}`)}}return o},Mf=t=>{let e=g(10),r=R(at(Wf)),o=R(at(Qf)),i;e:{if(r.length===0){let a;e[0]===Symbol.for("react.memo_cache_sentinel")?(a=[],e[0]=a):a=e[0];let c;e[1]!==o?(c={ranges:a,partIds:o},e[1]=o,e[2]=c):c=e[2],i=c;break e}let s;e[3]!==r||e[4]!==o||e[5]!==t?(s=Af(r,t,o),e[3]=r,e[4]=o,e[5]=t,e[6]=s):s=e[6];let n;e[7]!==o||e[8]!==s?(n={ranges:s,partIds:o},e[7]=o,e[8]=s,e[9]=n):n=e[9],i=n}return i},Pf=t=>{let e=g(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i;e[3]!==r||e[4]!==o.toolName?(i=a=>a.tools.toolUIs[o.toolName]?.[0]?.render??r,e[3]=r,e[4]=o.toolName,e[5]=i):i=e[5];let s=R(i);if(!s)return null;let n;return e[6]!==s||e[7]!==o?(n=(0,B.jsx)(s,{...o}),e[6]=s,e[7]=o,e[8]=n):n=e[8],n},Mn=(t,e,r)=>{let o=t.renderers[e]?.[0];return o||(t.fallbacks[0]??r)},Df=t=>{let e=g(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i;e[3]!==r||e[4]!==o.name?(i=a=>Mn(a.dataRenderers,o.name,r),e[3]=r,e[4]=o.name,e[5]=i):i=e[5];let s=R(i);if(!s)return null;let n;return e[6]!==s||e[7]!==o?(n=(0,B.jsx)(s,{...o}),e[6]=s,e[7]=o,e[8]=n):n=e[8],n},Ge={Text:()=>null,Reasoning:()=>null,Source:()=>null,Image:()=>null,File:()=>null,Unstable_Audio:()=>null,ToolGroup:({children:t})=>t,ReasoningGroup:({children:t})=>t},Pn=t=>{let e=g(41),{components:r}=t,o;e[0]!==r?(o=r===void 0?{}:r,e[0]=r,e[1]=o):o=e[1];let{Text:i,Reasoning:s,Image:n,Source:a,File:c,Unstable_Audio:l,tools:d,data:m,generativeUI:p}=o,u=i===void 0?Ge.Text:i,h=s===void 0?Ge.Reasoning:s,v=n===void 0?Ge.Image:n,b=a===void 0?Ge.Source:a,y=c===void 0?Ge.File:c,S=l===void 0?Ge.Unstable_Audio:l,A;e[2]!==d?(A=d===void 0?{}:d,e[2]=d,e[3]=A):A=e[3];let I=A,k=U(),E=R(Yf),C=E.type;if(C==="tool-call"){let x=k.part.addToolResult,P=k.part.resumeToolCall,N=k.part.respondToToolApproval;if("Override"in I){let Q;return e[4]!==x||e[5]!==E||e[6]!==N||e[7]!==P||e[8]!==I.Override?(Q=(0,B.jsx)(I.Override,{...E,addResult:x,resume:P,respondToApproval:N}),e[4]=x,e[5]=E,e[6]=N,e[7]=P,e[8]=I.Override,e[9]=Q):Q=e[9],Q}let O=I.by_name?.[E.toolName]??I.Fallback,V;return e[10]!==O||e[11]!==x||e[12]!==E||e[13]!==N||e[14]!==P?(V=(0,B.jsx)(Pf,{...E,Fallback:O,addResult:x,resume:P,respondToApproval:N}),e[10]=O,e[11]=x,e[12]=E,e[13]=N,e[14]=P,e[15]=V):V=e[15],V}if(E.status?.type==="requires-action")throw new Error("Encountered unexpected requires-action status");switch(C){case"text":{let x;return e[16]!==u||e[17]!==E?(x=(0,B.jsx)(u,{...E}),e[16]=u,e[17]=E,e[18]=x):x=e[18],x}case"reasoning":{let x;return e[19]!==h||e[20]!==E?(x=(0,B.jsx)(h,{...E}),e[19]=h,e[20]=E,e[21]=x):x=e[21],x}case"source":{let x;return e[22]!==b||e[23]!==E?(x=(0,B.jsx)(b,{...E}),e[22]=b,e[23]=E,e[24]=x):x=e[24],x}case"image":{let x;return e[25]!==v||e[26]!==E?(x=(0,B.jsx)(v,{...E}),e[25]=v,e[26]=E,e[27]=x):x=e[27],x}case"file":{let x;return e[28]!==y||e[29]!==E?(x=(0,B.jsx)(y,{...E}),e[28]=y,e[29]=E,e[30]=x):x=e[30],x}case"audio":{let x;return e[31]!==S||e[32]!==E?(x=(0,B.jsx)(S,{...E}),e[31]=S,e[32]=E,e[33]=x):x=e[33],x}case"data":{let x=m?.by_name?.[E.name]??m?.Fallback,P;return e[34]!==x||e[35]!==E?(P=(0,B.jsx)(Df,{...E,Fallback:x}),e[34]=x,e[35]=E,e[36]=P):P=e[36],P}case"generative-ui":{if(!p?.components)return typeof process<"u",null;let x=E,P;return e[37]!==p.Fallback||e[38]!==p.components||e[39]!==x.spec?(P=(0,B.jsx)(ao,{spec:x.spec,components:p.components,Fallback:p.Fallback}),e[37]=p.Fallback,e[38]=p.components,e[39]=x.spec,e[40]=P):P=e[40],P}default:return console.warn(`Unknown message part type: ${C}`),null}},Pt=te(t=>{let e=g(5),{index:r,components:o}=t,i;e[0]!==o?(i=(0,B.jsx)(Pn,{components:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,B.jsx)(Wt,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},(t,e)=>t.index===e.index&&t.components?.Text===e.components?.Text&&t.components?.Reasoning===e.components?.Reasoning&&t.components?.Source===e.components?.Source&&t.components?.Image===e.components?.Image&&t.components?.File===e.components?.File&&t.components?.Unstable_Audio===e.components?.Unstable_Audio&&t.components?.tools===e.components?.tools&&t.components?.data===e.components?.data&&t.components?.generativeUI===e.components?.generativeUI&&t.components?.ToolGroup===e.components?.ToolGroup&&t.components?.ReasoningGroup===e.components?.ReasoningGroup);Pt.displayName="MessagePrimitive.PartByIndex";var Of=t=>{let e=g(6),{status:r,component:o}=t,i=r.type==="running",s;e[0]!==o||e[1]!==r?(s=(0,B.jsx)(o,{type:"text",text:"",status:r}),e[0]=o,e[1]=r,e[2]=s):s=e[2];let n;return e[3]!==i||e[4]!==s?(n=(0,B.jsx)(Jt,{text:"",isRunning:i,children:s}),e[3]=i,e[4]=s,e[5]=n):n=e[5],n},Nf=Object.freeze({type:"complete"}),Bf=Object.freeze({type:"running"}),$f=t=>{let e=g(6),{components:r}=t,o=R(Xf);if(r?.Empty){let n;return e[0]!==r.Empty||e[1]!==o?(n=(0,B.jsx)(r.Empty,{status:o}),e[0]=r.Empty,e[1]=o,e[2]=n):n=e[2],n}if(o.type!=="running")return null;let i=r?.Text??Ge.Text,s;return e[3]!==o||e[4]!==i?(s=(0,B.jsx)(Of,{status:o,component:i}),e[3]=o,e[4]=i,e[5]=s):s=e[5],s},yd=te($f,(t,e)=>t.components?.Empty===e.components?.Empty&&t.components?.Text===e.components?.Text),jf=t=>{let e=g(4),{components:r,enabled:o}=t,i;if(e[0]!==o?(i=n=>{if(!o||n.message.parts.length===0)return!1;let a=n.message.parts[n.message.parts.length-1];return a?.type!=="text"&&a?.type!=="reasoning"},e[0]=o,e[1]=i):i=e[1],!R(i))return null;let s;return e[2]!==r?(s=(0,B.jsx)(yd,{components:r}),e[2]=r,e[3]=s):s=e[3],s},Lf=te(jf,(t,e)=>t.enabled===e.enabled&&t.components?.Empty===e.components?.Empty&&t.components?.Text===e.components?.Text),Ff=t=>{let e=g(4),{Quote:r}=t,o=R(Vi);if(!o)return null;let i;return e[0]!==r||e[1]!==o.messageId||e[2]!==o.text?(i=(0,B.jsx)(r,{text:o.text,messageId:o.messageId}),e[0]=r,e[1]=o.messageId,e[2]=o.text,e[3]=i):i=e[3],i},Vf=te(Ff);function _d(t,e){let r=t.toolUIs[e.toolName]?.[0]?.render??null;return r||(Ul(e.mcp?.app?.resourceUri)&&t.mcpApp?t.mcpApp.render:null)}var Sd=()=>{let t=g(6),e=U(),r=R(Zf),o=R(eg);if(!o||r.type!=="tool-call")return null;let i;return t[0]!==o||t[1]!==e.part.addToolResult||t[2]!==e.part.respondToToolApproval||t[3]!==e.part.resumeToolCall||t[4]!==r?(i=(0,B.jsx)(o,{...r,addResult:e.part.addToolResult,resume:e.part.resumeToolCall,respondToApproval:e.part.respondToToolApproval}),t[0]=o,t[1]=e.part.addToolResult,t[2]=e.part.respondToToolApproval,t[3]=e.part.resumeToolCall,t[4]=r,t[5]=i):i=t[5],i},Td=()=>{let t=g(3),e=R(tg),r=R(rg);if(!r||e.type!=="data")return null;let o=e,i;return t[0]!==r||t[1]!==o?(i=(0,B.jsx)(r,{...o}),t[0]=r,t[1]=o,t[2]=i):i=t[2],i},Uf=()=>{let t=g(2),e=R(og);if(e==="tool-call"){let r;return t[0]===Symbol.for("react.memo_cache_sentinel")?(r=(0,B.jsx)(Sd,{}),t[0]=r):r=t[0],r}if(e==="data"){let r;return t[1]===Symbol.for("react.memo_cache_sentinel")?(r=(0,B.jsx)(Td,{}),t[1]=r):r=t[1],r}return null},zf=Object.freeze({type:"text",text:"",status:Bf}),Hf=({children:t})=>{let e=U(),r=R(o=>o.dataRenderers);return(0,B.jsx)(gt,{getItemState:o=>o.part.getState(),children:o=>t({get part(){let i=o();if(i.type==="tool-call"){let s=_d(e.tools.getState(),i)!==null,n=e.part;return{...i,toolUI:s?(0,B.jsx)(Sd,{}):null,addResult:n.addToolResult,resume:n.resumeToolCall,respondToApproval:n.respondToToolApproval}}if(i.type==="data"){let s=Mn(r,i.name,void 0)!==void 0;return{...i,dataRendererUI:s?(0,B.jsx)(Td,{}):null}}return i}})})},Dn=t=>{let e=g(5),{index:r,children:o}=t,i;e[0]!==o?(i=(0,B.jsx)(Hf,{children:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,B.jsx)(Wt,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},qf=t=>{let e=g(9),{children:r}=t,o=R(ig),i=R(sg),s=o===0&&i;if(o===0){if(!s)return null;let a;e[0]!==r?(a=r({part:zf}),e[0]=r,e[1]=a):a=e[1];let c;return e[2]!==a?(c=(0,B.jsx)(Jt,{text:"",isRunning:!0,children:a}),e[2]=a,e[3]=c):c=e[3],c}let n;if(e[4]!==r||e[5]!==o){let a;e[7]!==r?(a=(c,l)=>(0,B.jsx)(Dn,{index:l,children:d=>r(d)??(0,B.jsx)(Uf,{})},l),e[7]=r,e[8]=a):a=e[8],n=(0,B.jsx)(B.Fragment,{children:Array.from({length:o},a)}),e[4]=r,e[5]=o,e[6]=n}else n=e[6];return n},co=t=>{let e=g(5),{components:r,unstable_showEmptyOnNonTextEnd:o,children:i}=t,s=o===void 0?!0:o;if(i){let a;return e[0]!==i?(a=(0,B.jsx)(qf,{children:i}),e[0]=i,e[1]=a):a=e[1],a}let n;return e[2]!==r||e[3]!==s?(n=(0,B.jsx)(Gf,{components:r,unstable_showEmptyOnNonTextEnd:s}),e[2]=r,e[3]=s,e[4]=n):n=e[4],n};co.displayName="MessagePrimitive.Parts";var Gf=t=>{let e=g(15),{components:r,unstable_showEmptyOnNonTextEnd:o}=t,i=R(ng),s=!!r?.ChainOfThought,{ranges:n,partIds:a}=Mf(s),c;e:{if(i===0){let h;e[0]!==r?(h=(0,B.jsx)(yd,{components:r}),e[0]=r,e[1]=h):h=e[1],c=h;break e}let u;if(e[2]!==r||e[3]!==n||e[4]!==a){let h=new Set,v=b=>{let y=a[b];return y!==void 0&&!h.has(y)?(h.add(y),`part-id:${y}`):`part-${b}`};u=n.map(b=>{if(b.type==="single")return(0,B.jsx)(Pt,{index:b.index,components:r},b.index);if(b.type==="chainOfThoughtGroup"){let y=r?.ChainOfThought;return y?(0,B.jsx)(El,{startIndex:b.startIndex,endIndex:b.endIndex,children:(0,B.jsx)(y,{})},`chainOfThought-${b.idKey??b.startIndex}`):null}else if(b.type==="toolGroup"){let y=r?.ToolGroup??Ge.ToolGroup;return(0,B.jsx)(y,{startIndex:b.startIndex,endIndex:b.endIndex,children:Array.from({length:b.endIndex-b.startIndex+1},(S,A)=>{let I=b.startIndex+A;return(0,B.jsx)(Pt,{index:I,components:r},v(I))})},`tool-${b.idKey??b.startIndex}`)}else{let y=r?.ReasoningGroup??Ge.ReasoningGroup;return(0,B.jsx)(y,{startIndex:b.startIndex,endIndex:b.endIndex,children:Array.from({length:b.endIndex-b.startIndex+1},(S,A)=>{let I=b.startIndex+A;return(0,B.jsx)(Pt,{index:I,components:r},`part-${I}`)})},`reasoning-${b.startIndex}`)}}),e[2]=r,e[3]=n,e[4]=a,e[5]=u}else u=e[5];c=u}let l=c,d;e[6]!==r?(d=r?.Quote&&(0,B.jsx)(Vf,{Quote:r.Quote}),e[6]=r,e[7]=d):d=e[7];let m;e[8]!==r||e[9]!==o?(m=(0,B.jsx)(Lf,{components:r,enabled:o}),e[8]=r,e[9]=o,e[10]=m):m=e[10];let p;return e[11]!==l||e[12]!==d||e[13]!==m?(p=(0,B.jsxs)(B.Fragment,{children:[d,l,m]}),e[11]=l,e[12]=d,e[13]=m,e[14]=p):p=e[14],p};function Kf(t){return t.type}function Wf(t){return t.message.parts.map(Kf)}function Jf(t){return t.type==="tool-call"?t.toolCallId:void 0}function Qf(t){return t.message.parts.map(Jf)}function Yf(t){return t.part}function Xf(t){return t.message.status??Nf}function Zf(t){return t.part}function eg(t){return t.part.type==="tool-call"?_d(t.tools,t.part):null}function tg(t){return t.part}function rg(t){return t.part.type==="data"?Mn(t.dataRenderers,t.part.name,void 0)??null:null}function og(t){return t.part.type}function ig(t){return t.message.parts.length}function sg(t){return(t.message.status?.type??"complete")==="running"}function ng(t){return t.message.parts.length}var Id=Symbol.for("@assistant-ui/groupBy.memoKey");var kd=t=>{let e=t.nextChildIdx++;return t.nodeKey===""?String(e):`${t.nodeKey}.${e}`},Cd=(t,e)=>{if(!(e===void 0||t.claimed.has(e)))return t.claimed.add(e),`id:${e}`},Ed=(t,e)=>{let r={key:"",nodeKey:"",indices:[],children:[],nextChildIdx:0,claimed:new Set},o=[r],i=()=>{let s=o.pop(),n=o[o.length-1];n.children.push({type:"group",key:s.key,nodeKey:s.nodeKey,idKey:Cd(n,e?.[s.indices[0]]),indices:s.indices,children:s.children})};for(let s=0;s<t.length;s++){let n=t[s],a=0;for(;a<o.length-1&&a<n.length&&o[a+1].key===n[a];)a++;for(;o.length-1>a;)i();for(;o.length-1<n.length;){let l=o[o.length-1];o.push({key:n[o.length-1],nodeKey:kd(l),indices:[],children:[],nextChildIdx:0,claimed:new Set})}let c=o[o.length-1];c.children.push({type:"part",index:s,nodeKey:kd(c),idKey:Cd(c,e?.[s])});for(let l=1;l<o.length;l++)o[l].indices.push(s)}for(;o.length>1;)i();return r.children};var tt=$("react/jsx-runtime"),ag=(t,e,r)=>{if(!r)return!1;switch(t){case"never":return!1;case"always":return!0;case"empty":return e.length===0;case"no-text":{let o=e[e.length-1];return o===void 0||o.type!=="text"&&o.type!=="reasoning"}}},Rd=()=>{throw new Error("MessagePrimitive.GroupedParts: rendered `children` under a leaf part. `children` is only meaningful for `group-\u2026` cases \u2014 add a matching case for the part type or return `null` to skip it.")},Ad=(t,e,r)=>{if(t.type==="part")return(0,tt.jsx)(Dn,{index:t.index,children:({part:n})=>r({part:n,children:(0,tt.jsx)(Rd,{})})},t.idKey?`part-${t.idKey}`:`part-${t.index}`);let{status:o,counts:i}=kl(e,t.indices),s={type:t.key,status:o,counts:i,indices:t.indices};return(0,tt.jsx)(Cs,{children:r({part:s,children:(0,tt.jsx)(tt.Fragment,{children:t.children.map(n=>Ad(n,e,r))})})},t.idKey??t.nodeKey)},zi=({groupBy:t,indicator:e="no-text",children:r})=>{let o=R(at(c=>c.message.parts)),i=R(c=>c.tools.toolUIs),s=R(c=>e==="never"?!1:c.message.status?.type==="running"),n=t[Id]??t,a=G(()=>{let c={toolUIs:i};return Ed(o.map(l=>t(l,c)??[]),o.map(l=>l.type==="tool-call"?l.toolCallId:void 0))},[o,n,i]);return(0,tt.jsxs)(tt.Fragment,{children:[a.map(c=>Ad(c,o,r)),ag(e,o,s)&&r({part:{type:"indicator"},children:(0,tt.jsx)(Rd,{})})]})};zi.displayName="MessagePrimitive.GroupedParts";var Hi=$("react/jsx-runtime"),cg=t=>{let e=g(5),{children:r}=t,o=R(Vi);if(!o)return null;let i;e[0]!==r||e[1]!==o?(i=r(o),e[0]=r,e[1]=o,e[2]=i):i=e[2];let s;return e[3]!==i?(s=(0,Hi.jsx)(Hi.Fragment,{children:i}),e[3]=i,e[4]=s):s=e[4],s},qi=te(cg);qi.displayName="MessagePrimitive.Quote";var bt=$("react/jsx-runtime"),Pd=(t,e)=>{switch(e.type){case"image":return t?.Image??t?.Attachment;case"document":return t?.Document??t?.Attachment;case"file":return t?.File??t?.Attachment;default:return t?.Attachment}},lg=t=>{let e=g(5),{components:r}=t,o=R(dg);if(!o)return null;let i=o,s;e[0]!==r||e[1]!==i?(s=Pd(r,i),e[0]=r,e[1]=i,e[2]=s):s=e[2];let n=s;if(!n)return null;let a;return e[3]!==n?(a=(0,bt.jsx)(n,{}),e[3]=n,e[4]=a):a=e[4],a},lo=te(t=>{let e=g(5),{index:r,components:o}=t,i;e[0]!==o?(i=(0,bt.jsx)(lg,{components:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,bt.jsx)(bn,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},(t,e)=>t.index===e.index&&t.components?.Image===e.components?.Image&&t.components?.Document===e.components?.Document&&t.components?.File===e.components?.File&&t.components?.Attachment===e.components?.Attachment);lo.displayName="MessagePrimitive.AttachmentByIndex";var Md=({children:t})=>{let e=R(at(r=>r.message.role!=="user"?[]:(r.message.attachments??[]).map(o=>o.id)));return G(()=>e.map((r,o)=>(0,bt.jsx)(bn,{index:o,children:(0,bt.jsx)(gt,{getItemState:i=>i.message.attachment({index:o}).getState(),children:i=>t({get attachment(){return i()}})})},r)),[e,t])},uo=t=>{let e=g(4),{components:r,children:o}=t;if(r){let s;return e[0]!==r?(s=(0,bt.jsx)(Md,{children:n=>{let{attachment:a}=n,c=Pd(r,a);return c?(0,bt.jsx)(c,{}):null}}),e[0]=r,e[1]=s):s=e[1],s}let i;return e[2]!==o?(i=(0,bt.jsx)(Md,{children:o}),e[2]=o,e[3]=i):i=e[3],i};uo.displayName="MessagePrimitive.Attachments";function dg(t){return t.attachment}var Yt=t=>{let{children:e}=t;return R(ug)?e:null};Yt.displayName="MessagePartPrimitive.InProgress";function ug(t){return t.part.status.type==="running"}var wt=$("react/jsx-runtime"),Od=t=>{let e=g(2),{components:r}=t,o=r.Suggestion,i;return e[0]!==o?(i=(0,wt.jsx)(o,{}),e[0]=o,e[1]=i):i=e[1],i},po=te(t=>{let e=g(5),{index:r,components:o}=t,i;e[0]!==o?(i=(0,wt.jsx)(Od,{components:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,wt.jsx)(xn,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},(t,e)=>t.index===e.index&&t.components.Suggestion===e.components.Suggestion);po.displayName="ThreadPrimitive.SuggestionByIndex";var Dd=({children:t})=>{let e=R(r=>r.suggestions.suggestions.length);return G(()=>e===0?null:Array.from({length:e},(r,o)=>(0,wt.jsx)(xn,{index:o,children:(0,wt.jsx)(gt,{getItemState:i=>i.suggestions.suggestion({index:o}).getState(),children:i=>t({get suggestion(){return i()}})})},o)),[e,t])},Gi=t=>{let e=g(4),{components:r,children:o}=t;if(r){let s;return e[0]!==r?(s=(0,wt.jsx)(Dd,{children:()=>(0,wt.jsx)(Od,{components:r})}),e[0]=r,e[1]=s):s=e[1],s}let i;return e[2]!==o?(i=(0,wt.jsx)(Dd,{children:o}),e[2]=o,e[3]=i):i=e[3],i};Gi.displayName="ThreadPrimitive.Suggestions";var Ki=te(Gi,(t,e)=>t.children||e.children?t.children===e.children:t.components.Suggestion===e.components.Suggestion);var Nd=(t,e)=>t.thread.isDisabled||e&&t.thread.isRunning&&!t.thread.capabilities.queue,Bd=t=>{if(t.message.status?.type!=="incomplete"||t.message.status.reason!=="error")return;let e=t.message.status.error;return typeof e=="string"?e:typeof e=="object"&&e!==null&&"message"in e&&typeof e.message=="string"?e.message:e??"An error occurred"};var On=t=>{let e=g(10),{prompt:r,send:o,clearComposer:i}=t,s=i===void 0?!0:i,n=U(),a=o??!1,c;e[0]!==a?(c=u=>Nd(u,a),e[0]=a,e[1]=c):c=e[1];let l=R(c),d;e[2]!==n||e[3]!==s||e[4]!==r||e[5]!==a?(d=()=>{if(a){let{isRunning:u,capabilities:h}=n.thread.getState();if(u&&!h.queue)return;n.thread.append({content:[{type:"text",text:r}],runConfig:n.composer.getState().runConfig}),s&&!u&&n.composer.setText("")}else if(s)n.composer.setText(r);else{let u=n.composer.getState().text;n.composer.setText([u,r].filter(pg).join(" "))}},e[2]=n,e[3]=s,e[4]=r,e[5]=a,e[6]=d):d=e[6];let m=d,p;return e[7]!==l||e[8]!==m?(p={trigger:m,disabled:l},e[7]=l,e[8]=m,e[9]=p):p=e[9],p};function pg(t){return t.trim()}var Nn=()=>R(Bd);function $d(t,e){function r(o){let i=ut(t);if(!o?.optional&&!i)throw new Error(`This component must be used within ${e}.`);return i}return r}function Wi(t,e){function r(i){let s=t(i);return s?s[e]:null}function o(i){let s=!1,n;typeof i=="function"?n=i:i&&typeof i=="object"&&(s=!!i.optional,n=i.selector);let a=r({optional:s});return a?n?a(n):a():null}return{[e]:o,[`${e}Store`]:r}}var Bn=we(null),mg=$d(Bn,"ThreadPrimitive.Viewport"),{useThreadViewport:$e,useThreadViewportStore:je}=Wi(mg,"useThreadViewport");var yr,$n=()=>{if(yr)return yr;let t=()=>({apis:new Map,nextId:0,listeners:new Set});if(typeof window>"u")return yr=t(),yr;let e=window.__ASSISTANT_UI_DEVTOOLS_HOOK__;if(e)return yr=e,e;let r=t();return window.__ASSISTANT_UI_DEVTOOLS_HOOK__=r,yr=r,r},Ji=t=>{ce($n().listeners,t,"DevTools")};var Dt,jd=(Dt=class{static register(e){let r=$n();for(let a of r.apis.values())if(a.api===e)return()=>{};let o=r.nextId++,i={api:e,logs:[]},s=e.on?.("*",a=>{let c=r.apis.get(o);c&&(c.logs.push({time:new Date,event:a.event,data:a.payload}),c.logs.length>Dt.MAX_EVENT_LOGS_PER_API&&(c.logs=c.logs.slice(-Dt.MAX_EVENT_LOGS_PER_API)),Ji(o))}),n=e.subscribe?.(()=>{Ji(o)});return r.apis.set(o,i),Ji(o),()=>{let a=$n();a.apis.get(o)&&(s?.(),n?.(),a.apis.delete(o),Ji(o))}}},f(Dt,"MAX_EVENT_LOGS_PER_API",200),Dt);var Ld=t=>{let e,r=new Set,o=(l,d)=>{let m=typeof l=="function"?l(e):l;if(!Object.is(m,e)){let p=e;e=d??(typeof m!="object"||m===null)?m:Object.assign({},e,m),r.forEach(u=>u(e,p))}},i=()=>e,a={setState:o,getState:i,getInitialState:()=>c,subscribe:l=>(r.add(l),()=>r.delete(l))},c=e=t(o,i,a);return a},Fd=(t=>t?Ld(t):Ld);var mo=Fe($("react"),1);var hg=t=>t;function fg(t,e=hg){let r=mo.default.useSyncExternalStore(t.subscribe,mo.default.useCallback(()=>e(t.getState()),[t,e]),mo.default.useCallback(()=>e(t.getInitialState()),[t,e]));return mo.default.useDebugValue(r),r}var Vd=t=>{let e=Fd(t),r=o=>fg(e,o);return Object.assign(r,e),r},Ud=(t=>t?Vd(t):Vd);var zd=t=>{let e=new Map,r=()=>{let o=0;for(let i of e.values())o+=i;t(o)};return{register:()=>{let o=Symbol();return e.set(o,0),{setHeight:i=>{e.get(o)!==i&&(e.set(o,i),r())},unregister:()=>{e.delete(o),r()}}}}},Hd=(t={})=>{let e=new Set,r=zd(n=>{s.setState({height:{...s.getState().height,viewport:n}})}),o=zd(n=>{s.setState({height:{...s.getState().height,inset:n}})}),i=(n,a)=>(s.setState({element:{...s.getState().element,[n]:a}}),()=>{s.getState().element[n]===a&&s.setState({element:{...s.getState().element,[n]:null}})}),s=Ud(()=>({isAtBottom:!0,scrollToBottom:({behavior:n="auto"}={})=>{ce(e,()=>({behavior:n}),"Thread viewport")},onScrollToBottom:n=>(e.add(n),()=>{e.delete(n)}),turnAnchor:t.turnAnchor??"bottom",topAnchorMessageClamp:{tallerThan:t.topAnchorMessageClamp?.tallerThan??"10em",visibleHeight:t.topAnchorMessageClamp?.visibleHeight??"6em"},height:{viewport:0,inset:0},element:{viewport:null,anchor:null,target:null},targetConfig:null,topAnchorTurn:null,registerViewport:r.register,registerContentInset:o.register,registerViewportElement:n=>i("viewport",n),registerAnchorElement:n=>i("anchor",n),registerAnchorTargetElement:(n,a)=>(s.setState({element:{...s.getState().element,target:n},targetConfig:n&&a?a:null}),()=>{s.getState().element.target===n&&s.setState({element:{...s.getState().element,target:null},targetConfig:null})}),setTopAnchorTurn:n=>{s.setState({topAnchorTurn:n})}}));return s};var Xt=t=>t;var qd=$("react/jsx-runtime"),gg=t=>{let e=g(11),r;e[0]===Symbol.for("react.memo_cache_sentinel")?(r={optional:!0},e[0]=r):r=e[0];let o=je(r),i;e[1]!==t?(i=()=>Hd(t),e[1]=t,e[2]=i):i=e[2];let[s]=z(i),n,a;e[3]!==o||e[4]!==s?(n=()=>o?.getState().onScrollToBottom(d=>{s.getState().scrollToBottom(d)}),a=[o,s],e[3]=o,e[4]=s,e[5]=n,e[6]=a):(n=e[5],a=e[6]),D(n,a);let c,l;return e[7]!==o||e[8]!==s?(c=()=>{if(o)return s.subscribe(d=>{o.getState().isAtBottom!==d.isAtBottom&&Xt(o).setState({isAtBottom:d.isAtBottom})})},l=[s,o],e[7]=o,e[8]=s,e[9]=c,e[10]=l):(c=e[9],l=e[10]),D(c,l),s},_r=t=>{let e=g(7),{children:r,options:o}=t,i;e[0]!==o?(i=o===void 0?{}:o,e[0]=o,e[1]=i):i=e[1];let s=gg(i),n;e[2]!==s?(n=()=>({useThreadViewport:s}),e[2]=s,e[3]=n):n=e[3];let[a]=z(n),c;return e[4]!==r||e[5]!==a?(c=(0,qd.jsx)(Bn.Provider,{value:a,children:r}),e[4]=r,e[5]=a,e[6]=c):c=e[6],c};var ho=$("react/jsx-runtime"),vg=()=>{let t=g(3),e=U(),r,o;return t[0]!==e?(r=()=>{typeof process>"u"},o=[e],t[0]=e,t[1]=r,t[2]=o):(r=t[1],o=t[2]),D(r,o),null},bg=t=>{let e=g(8),{children:r,aui:o,config:i,runtime:s}=t,n=o??null,a;e[0]===Symbol.for("react.memo_cache_sentinel")?(a=(0,ho.jsx)(vg,{}),e[0]=a):a=e[0];let c;e[1]!==r?(c=(0,ho.jsx)(_r,{children:r}),e[1]=r,e[2]=c):c=e[2];let l;return e[3]!==i||e[4]!==s||e[5]!==n||e[6]!==c?(l=(0,ho.jsxs)(Ys,{runtime:s,aui:n,config:i,children:[a,c]}),e[3]=i,e[4]=s,e[5]=n,e[6]=c,e[7]=l):l=e[7],l},jn=te(bg);var Xd=Fe($("react"),1),Zd=Fe($("react-dom"),1);var Yi={};ls(Yi,{Root:()=>yg,Slot:()=>yg,Slottable:()=>_g,createSlot:()=>fo,createSlottable:()=>zn});var ue=Fe($("react"),1);var Gd=Fe($("react"),1),wg=Object.defineProperty,Fn=(t,e)=>wg(t,"name",{value:e,configurable:!0});function Ln(t,e){if(typeof t=="function")return t(e);t!=null&&(t.current=e)}Fn(Ln,"setRef");function Vn(...t){return e=>{let r=!1,o=t.map(i=>{let s=Ln(i,e);return!r&&typeof s=="function"&&(r=!0),s});if(r)return()=>{for(let i=0;i<o.length;i++){let s=o[i];typeof s=="function"?s():Ln(t[i],null)}}}}Fn(Vn,"composeRefs");function Le(...t){return Gd.useCallback(Vn(...t),t)}Fn(Le,"useComposedRefs");var xg=Object.defineProperty,rt=(t,e)=>xg(t,"name",{value:e,configurable:!0});function fo(t){let e=ue.forwardRef((r,o)=>{let{children:i,...s}=r,n=null,a=!1,c=[];Un(i)&&typeof Qi=="function"&&(i=Qi(i._payload)),ue.Children.forEach(i,p=>{if(Qd(p)){a=!0;let u=p,h="child"in u.props?u.props.child:u.props.children;Un(h)&&typeof Qi=="function"&&(h=Qi(h._payload)),n=Sg(u,h),c.push(n?.props?.children)}else c.push(p)}),n?n=ue.cloneElement(n,void 0,c):!a&&ue.Children.count(i)===1&&ue.isValidElement(i)&&(n=i);let l=n?Jd(n):void 0,d=Le(o,l);if(!n){if(i||i===0)throw new Error(a?Cg(t):kg(t));return i}let m=Wd(s,n.props??{});return n.type!==ue.Fragment&&(m.ref=o?d:l),ue.cloneElement(n,m)});return e.displayName=`${t}.Slot`,e}rt(fo,"createSlot");var yg=fo("Slot"),Kd=Symbol.for("radix.slottable");function zn(t){let e=rt(r=>"child"in r?r.children(r.child):r.children,"Slottable");return e.displayName=`${t}.Slottable`,e.__radixId=Kd,e}rt(zn,"createSlottable");var _g=zn("Slottable"),Sg=rt((t,e)=>{if("child"in t.props){let r=t.props.child;return ue.isValidElement(r)?ue.cloneElement(r,void 0,t.props.children(r.props.children)):null}return ue.isValidElement(e)?e:null},"getSlottableElementFromSlottable");function Wd(t,e){let r={...e};for(let o in e){let i=t[o],s=e[o];/^on[A-Z]/.test(o)?i&&s?r[o]=(...a)=>{let c=s(...a);return i(...a),c}:i&&(r[o]=i):o==="style"?r[o]={...i,...s}:o==="className"&&(r[o]=[i,s].filter(Boolean).join(" "))}return{...t,...r}}rt(Wd,"mergeProps");function Jd(t){let e=Object.getOwnPropertyDescriptor(t.props,"ref")?.get,r=e&&"isReactWarning"in e&&e.isReactWarning;return r?t.ref:(e=Object.getOwnPropertyDescriptor(t,"ref")?.get,r=e&&"isReactWarning"in e&&e.isReactWarning,r?t.props.ref:t.props.ref||t.ref)}rt(Jd,"getElementRef");function Qd(t){return ue.isValidElement(t)&&typeof t.type=="function"&&"__radixId"in t.type&&t.type.__radixId===Kd}rt(Qd,"isSlottable");var Tg=Symbol.for("react.lazy");function Un(t){return t!=null&&typeof t=="object"&&"$$typeof"in t&&t.$$typeof===Tg&&"_payload"in t&&Yd(t._payload)}rt(Un,"isLazyComponent");function Yd(t){return typeof t=="object"&&t!==null&&"then"in t}rt(Yd,"isPromiseLike");var kg=rt(t=>`${t} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,"createSlotError"),Cg=rt(t=>`${t} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,"createSlottableError"),Qi=ue[" use ".trim().toString()];var eu=$("react/jsx-runtime"),Ig=Object.defineProperty,Eg=(t,e)=>Ig(t,"name",{value:e,configurable:!0}),Rg=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],Hn=Rg.reduce((t,e)=>{let r=fo(`Primitive.${e}`),o=Xd.forwardRef((i,s)=>{let{asChild:n,...a}=i,c=n?r:e;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),(0,eu.jsx)(c,{...a,ref:s})});return o.displayName=`Primitive.${e}`,{...t,[e]:o}},{});function qn(t,e){t&&Zd.flushSync(()=>t.dispatchEvent(e))}Eg(qn,"dispatchDiscreteCustomEvent");var Ag=Object.defineProperty,Sr=(t,e)=>Ag(t,"name",{value:e,configurable:!0}),tu=!!(typeof window<"u"&&window.document&&window.document.createElement);function Xi(t,e,{checkForDefaultPrevented:r=!0}={}){return Sr(function(i){if(t?.(i),r===!1||!i||!i.defaultPrevented)return e?.(i)},"handleEvent")}Sr(Xi,"composeEventHandlers");function Mg(t){if(!tu)throw new Error("Cannot access window outside of the DOM");return t?.ownerDocument?.defaultView??window}Sr(Mg,"getOwnerWindow");function Gn(t){if(!tu)throw new Error("Cannot access document outside of the DOM");return t?.ownerDocument??document}Sr(Gn,"getOwnerDocument");function ru(t,e=!1){let{activeElement:r}=Gn(t);if(!r?.nodeName)return null;if(ou(r)&&r.contentDocument)return ru(r.contentDocument.body,e);if(e){let o=r.getAttribute("aria-activedescendant");if(o){let i=Gn(r).getElementById(o);if(i)return i}}return r}Sr(ru,"getActiveElement");function ou(t){return t.tagName==="IFRAME"}Sr(ou,"isFrame");var Tr=Fe($("react"),1),Pg=Object.defineProperty,Dg=(t,e)=>Pg(t,"name",{value:e,configurable:!0});function Ot(t){let e=Tr.useRef(t);return Tr.useEffect(()=>{e.current=t}),Tr.useMemo(()=>((...r)=>e.current?.(...r)),[])}Dg(Ot,"useCallbackRef");var Zi=Hn;Zi.dispatchDiscreteCustomEvent=qn;Zi.Root=Hn;var iu=Object.defineProperty,es=(t,e)=>{let r={};for(var o in t)iu(r,o,{get:t[o],enumerable:!0});return e||iu(r,Symbol.toStringTag,{value:"Module"}),r};var ts=$("react/jsx-runtime");var Og=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"];function su(t,e){return Es(t,void 0,e!==void 0?e:t.props.children)}function nu(t,e,r){return(0,ts.jsx)(Yi.Root,{...r,children:su(t,e)})}function Ng(t){let e=re((r,o)=>{let i=g(17),s,n,a,c;i[0]!==r?({render:a,asChild:s,children:n,...c}=r,i[0]=r,i[1]=s,i[2]=n,i[3]=a,i[4]=c):(s=i[1],n=i[2],a=i[3],c=i[4]);let l=t;if(a&&Nr(a)){let p=c,u;i[5]!==n||i[6]!==a?(u=su(a,n),i[5]=n,i[6]=a,i[7]=u):u=i[7];let h;return i[8]!==o||i[9]!==p||i[10]!==u?(h=(0,ts.jsx)(l,{...p,asChild:!0,ref:o,children:u}),i[8]=o,i[9]=p,i[10]=u,i[11]=h):h=i[11],h}let d=c,m;return i[12]!==s||i[13]!==n||i[14]!==o||i[15]!==d?(m=(0,ts.jsx)(l,{...d,asChild:s,ref:o,children:n}),i[12]=s,i[13]=n,i[14]=o,i[15]=d,i[16]=m):m=i[16],m});return e.displayName=typeof t=="string"?t:t.displayName??t.name??"Component",e}function Bg(t){let e=Zi[t],r=Ng(e);return r.displayName=`Primitive.${t}`,r}var Se=Og.reduce((t,e)=>(t[e]=Bg(e),t),{});var au=$("react/jsx-runtime");var rs=(t,e,r=[])=>{let o=re((i,s)=>{let n=g(6),a={},c={};Object.keys(i).forEach(v=>{r.includes(v)?a[v]=i[v]:c[v]=i[v]});let l=e(a)??void 0,d=Se,m="button",p=c.disabled||!l,u=Xi(c.onClick,l),h;return n[0]!==s||n[1]!==c||n[2]!==d.button||n[3]!==p||n[4]!==u?(h=(0,au.jsx)(d.button,{type:m,...c,ref:s,disabled:p,onClick:u}),n[0]=s,n[1]=c,n[2]=d.button,n[3]=p,n[4]=u,n[5]=h):h=n[5],h});return o.displayName=t,o};var cu=t=>{let e=g(4),r=Ot(t),o=$e($g),i,s;e[0]!==r||e[1]!==o?(i=()=>o(r),s=[o,r],e[0]=r,e[1]=o,e[2]=i,e[3]=s):(i=e[2],s=e[3]),D(i,s)};function $g(t){return t.onScrollToBottom}var jg=()=>!1,Lg=()=>{},lu=t=>{let e=g(4),r;e[0]!==t?(r=s=>{if(typeof window>"u"||t===null||!window.matchMedia)return Lg;let n=window.matchMedia(t);return n.addEventListener("change",s),()=>n.removeEventListener("change",s)},e[0]=t,e[1]=r):r=e[1];let o=r,i;return e[2]!==t?(i=()=>typeof window>"u"||t===null||!window.matchMedia?!1:window.matchMedia(t).matches,e[2]=t,e[3]=i):i=e[3],it(o,i,jg)};var Fg=Object.freeze({type:"complete"}),Vg=Object.freeze({type:"text",text:"",status:Fg}),du=()=>R(Ug);function Ug(t){return t.part.type!=="text"&&t.part.type!=="reasoning"?Vg:t.part}var zg=$("react/jsx-runtime"),Hg=we(null);function qg(t){let e=ut(Hg);if(!t?.optional&&!e)throw new Error("This component must be used within a SmoothContextProvider.");return e}var{useSmoothStatus:P2,useSmoothStatusStore:uu}=Wi(qg,"useSmoothStatus");var pu=250,mu=5,Gg=class{constructor(t,e){f(this,"animationFrameId",null);f(this,"lastUpdateTime",Date.now());f(this,"lastCommitTime",0);f(this,"targetText","");f(this,"drainMs",pu);f(this,"maxCharIntervalMs",mu);f(this,"maxCharsPerFrame",1/0);f(this,"minCommitMs",0);f(this,"currentText");f(this,"setText");f(this,"animate",()=>{let t=Date.now(),e=t-this.lastUpdateTime,r=this.targetText.length-this.currentText.length,o=Math.min(this.maxCharIntervalMs,this.drainMs/r),i=Math.min(r,this.maxCharsPerFrame),s=0;for(;e>=o&&s<i;)s++,e-=o;s===i&&i===this.maxCharsPerFrame&&(e=0),s!==r?this.animationFrameId=requestAnimationFrame(this.animate):this.animationFrameId=null,s!==0&&(this.currentText=this.targetText.slice(0,this.currentText.length+s),this.lastUpdateTime=t-e,(s===r||t-this.lastCommitTime>=this.minCommitMs)&&(this.lastCommitTime=t,this.setText(this.currentText)))});this.currentText=t,this.setText=e}start(){this.animationFrameId===null&&(this.lastUpdateTime=Date.now(),this.animate())}stop(){this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}},Kn=Object.freeze({type:"running"}),os=(t,e)=>t!==void 0&&t>0?t:e,hu=(t,e=!1)=>{let{text:r}=t,o=lu("(prefers-reduced-motion: reduce)"),i=typeof e=="object"&&e!==null?e:void 0,s=e!==!1&&e!==null&&!o,n=os(i?.drainMs,pu),a=os(i?.maxCharIntervalMs,mu),c=os(i?.maxCharsPerFrame,1/0),l=os(i?.minCommitMs,0),[d,m]=z(t.status.type==="running"?"":r),p=U(),u=R(()=>p.part),[h,v]=z(u);(u!==h||!r.startsWith(d))&&(v(u),m(t.status.type==="running"?"":r));let b=uu({optional:!0}),y=Ot(I=>{if(m(I),b){let k=d!==I||t.status.type==="running"?Kn:t.status;Xt(b).setState(k,!0)}});D(()=>{if(b){let I=s&&(d!==r||t.status.type==="running")?Kn:t.status;Xt(b).setState(I,!0)}},[b,s,r,d,t.status]);let[S]=z(new Gg(d,y));D(()=>{S.drainMs=n,S.maxCharIntervalMs=a,S.maxCharsPerFrame=c,S.minCommitMs=l},[S,n,a,c,l]);let A=F(u);return D(()=>{if(!s){S.stop();return}let I=A.current!==u;if(A.current=u,I||!r.startsWith(S.targetText)){t.status.type==="running"?(S.currentText="",S.targetText=r,S.lastCommitTime=0,S.start()):(S.currentText=r,S.targetText=r,S.stop(),y(r));return}if(S.targetText=r,t.status.type!=="running"){if(S.currentText===""){S.currentText=r,S.stop(),y(r);return}S.start();return}S.start()},[S,s,r,t.status.type,u,y]),D(()=>()=>{S.stop()},[S]),G(()=>s?{...t,text:d,status:r===d?t.status:Kn}:t,[s,d,t,r])};var Kg=Object.freeze({type:"complete"}),Wg=Object.freeze({type:"image",image:"",status:Kg}),fu=()=>R(Jg);function Jg(t){return t.part.type!=="image"?Wg:t.part}var gu=$("react/jsx-runtime"),go=re(({smooth:t=!0,component:e=Se.span,render:r,...o},i)=>{let{text:s,status:n}=hu(du(),t),a={"data-status":n.type,...o,ref:i};return r&&Nr(r)?nu(r,s,a):(0,gu.jsx)(e,{...a,children:s})});go.displayName="MessagePartPrimitive.Text";var vu=$("react/jsx-runtime"),vo=re((t,e)=>{let r=g(4),{image:o}=fu(),i;return r[0]!==e||r[1]!==o||r[2]!==t?(i=(0,vu.jsx)(Se.img,{src:o,...t,ref:e}),r[0]=e,r[1]=o,r[2]=t,r[3]=i):i=r[3],i});vo.displayName="MessagePartPrimitive.Image";var Ke=t=>{let e=g(2),r=F(void 0),o;return e[0]!==t?(o=i=>{r.current&&(r.current(),r.current=void 0),i&&(r.current=t(i))},e[0]=t,e[1]=o):o=e[1],o};var Wn=(t,e)=>{let r=t.trim().match(/^(\d+(?:\.\d+)?|\.\d+)(em|px|rem)$/);if(!r)return Number.POSITIVE_INFINITY;let o=Number(r[1]),i=r[2];return i==="px"?o:i==="em"?o*(parseFloat(getComputedStyle(e).fontSize)||16):i==="rem"?o*(parseFloat(getComputedStyle(document.documentElement).fontSize)||16):Number.POSITIVE_INFINITY},bu=t=>t.dataset.messageId,wu=()=>{let t=document.createElement("div");return t.dataset.auiTopAnchorReserve="",t.style.height="0px",t.style.flexShrink="0",t.style.pointerEvents="none",t.setAttribute("aria-hidden","true"),t},is=(t,e)=>{let r=`${e}px`;return t.style.height!==r?(t.style.height=r,!0):!1},xu=t=>{let e=window.devicePixelRatio||1;return Math.round(t*e)/e};var bo=$("react/jsx-runtime");var yu=()=>{let t=g(4),e=U(),r;t[0]!==e.message?(r=()=>e.message,t[0]=e.message,t[1]=r):r=t[1];let o=R(r),i;return t[2]!==o?(i=s=>{let n=()=>{o.setIsHovering(!0)},a=()=>{o.setIsHovering(!1)};return s.addEventListener("mouseenter",n),s.addEventListener("mouseleave",a),s.matches(":hover")&&queueMicrotask(()=>o.setIsHovering(!0)),()=>{s.removeEventListener("mouseenter",n),s.removeEventListener("mouseleave",a),o.setIsHovering(!1)}},t[2]=o,t[3]=i):i=t[3],Ke(i)},Qg=()=>{let t=g(2),e=$e(rv),r;return t[0]!==e?(r=o=>o.message.role==="user"&&o.message.index>0&&o.message.index===o.thread.messages.length-2&&o.thread.messages.at(-1)?.role==="assistant"&&(o.message.id===e||o.thread.isRunning),t[0]=e,t[1]=r):r=t[1],R(r)},Yg=()=>{let t=g(2),e=$e(ov),r;return t[0]!==e?(r=o=>o.message.isLast&&o.message.role==="assistant"&&o.message.index>=1&&o.thread.messages.at(o.message.index-1)?.role==="user"&&(o.message.id===e||o.thread.isRunning),t[0]=e,t[1]=r):r=t[1],R(r)},Xg=(t,e)=>{let r=g(3),o;return r[0]!==t||r[1]!==e?(o=i=>{if(t)return e.getState().registerAnchorElement(i)},r[0]=t,r[1]=e,r[2]=o):o=r[2],Ke(o)},Zg=t=>{let e=g(3),{active:r,threadViewportStore:o}=t,i;return e[0]!==r||e[1]!==o?(i=s=>{if(!r)return;let n=o.getState(),a=n.topAnchorMessageClamp;return n.registerAnchorTargetElement(s,{tallerThan:Wn(a.tallerThan,s),visibleHeight:Wn(a.visibleHeight,s)})},e[0]=r,e[1]=o,e[2]=i):i=e[2],Ke(i)},ev=t=>{let e=g(7),r,o;e[0]!==t?({forwardedRef:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i=yu(),s=Le(r,i),n=R(iv),a;return e[3]!==n||e[4]!==o||e[5]!==s?(a=(0,bo.jsx)(Se.div,{...o,ref:s,"data-message-id":n}),e[3]=n,e[4]=o,e[5]=s,e[6]=a):a=e[6],a},tv=t=>{let e=g(13),r,o,i;e[0]!==t?({forwardedRef:r,threadViewportStore:i,...o}=t,e[0]=t,e[1]=r,e[2]=o,e[3]=i):(r=e[1],o=e[2],i=e[3]);let s=yu(),n=Qg(),a=Yg(),c=Xg(n,i),l;e[4]!==a||e[5]!==i?(l={active:a,threadViewportStore:i},e[4]=a,e[5]=i,e[6]=l):l=e[6];let d=Zg(l),m=Le(r,s,c,d),p=R(sv),u=n?"":void 0,h=a?"":void 0,v;return e[7]!==p||e[8]!==o||e[9]!==m||e[10]!==u||e[11]!==h?(v=(0,bo.jsx)(Se.div,{...o,ref:m,"data-message-id":p,"data-aui-top-anchor-user":u,"data-aui-top-anchor-target":h}),e[7]=p,e[8]=o,e[9]=m,e[10]=u,e[11]=h,e[12]=v):v=e[12],v},Jn=re((t,e)=>{let r=g(7),o=je();if(o.getState().turnAnchor==="top"){let s;return r[0]!==e||r[1]!==t||r[2]!==o?(s=(0,bo.jsx)(tv,{...t,forwardedRef:e,threadViewportStore:o}),r[0]=e,r[1]=t,r[2]=o,r[3]=s):s=r[3],s}let i;return r[4]!==e||r[5]!==t?(i=(0,bo.jsx)(ev,{...t,forwardedRef:e}),r[4]=e,r[5]=t,r[6]=i):i=r[6],i});Jn.displayName="MessagePrimitive.Root";function rv(t){return t.topAnchorTurn?.anchorId}function ov(t){return t.topAnchorTurn?.targetId}function iv(t){return t.message.id}function sv(t){return t.message.id}var xt=$("react/jsx-runtime"),Qn={...Ge,Text:()=>(0,xt.jsxs)("p",{style:{whiteSpace:"pre-line"},children:[(0,xt.jsx)(go,{}),(0,xt.jsx)(Yt,{children:(0,xt.jsx)("span",{style:{fontFamily:"revert"},children:" \u25CF"})})]}),Image:()=>(0,xt.jsx)(vo,{})},ss=t=>{let e=g(10);if("children"in t){let a;return e[0]!==t.children?(a=(0,xt.jsx)(co,{children:t.children}),e[0]=t.children,e[1]=a):a=e[1],a}let r,o;e[2]!==t?({components:r,...o}=t,e[2]=t,e[3]=r,e[4]=o):(r=e[3],o=e[4]);let i;e[5]!==r?(i=r?{...r,Text:r.Text??Qn.Text,Image:r.Image??Qn.Image}:Qn,e[5]=r,e[6]=i):i=e[6];let s=i,n;return e[7]!==o||e[8]!==s?(n=(0,xt.jsx)(co,{components:s,...o}),e[7]=o,e[8]=s,e[9]=n):n=e[9],n};ss.displayName="MessagePrimitive.Parts";var nv=t=>{let e=g(12),r;return e[0]!==t.assistant||e[1]!==t.copied||e[2]!==t.hasAttachments||e[3]!==t.hasBranches||e[4]!==t.hasContent||e[5]!==t.last||e[6]!==t.lastOrHover||e[7]!==t.speaking||e[8]!==t.submittedFeedback||e[9]!==t.system||e[10]!==t.user?(r=o=>{let{role:i,attachments:s,parts:n,branchCount:a,isLast:c,speech:l,isCopied:d,isHovering:m}=o.message;return!(t.hasBranches===!0&&a<2||t.user&&i!=="user"||t.assistant&&i!=="assistant"||t.system&&i!=="system"||t.lastOrHover===!0&&!m&&!c||t.last!==void 0&&t.last!==c||t.copied===!0&&!d||t.copied===!1&&d||t.speaking===!0&&l==null||t.speaking===!1&&l!=null||t.hasAttachments===!0&&(i!=="user"||!s?.length)||t.hasAttachments===!1&&i==="user"&&s?.length||t.hasContent===!0&&n.length===0||t.hasContent===!1&&n.length>0||t.submittedFeedback!==void 0&&(o.message.metadata.submittedFeedback?.type??null)!==t.submittedFeedback)},e[0]=t.assistant,e[1]=t.copied,e[2]=t.hasAttachments,e[3]=t.hasBranches,e[4]=t.hasContent,e[5]=t.last,e[6]=t.lastOrHover,e[7]=t.speaking,e[8]=t.submittedFeedback,e[9]=t.system,e[10]=t.user,e[11]=r):r=e[11],R(r)},Yn=t=>{let e=g(3),r,o;return e[0]!==t?({children:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]),nv(o)?r:null};Yn.displayName="MessagePrimitive.If";var Xn=t=>{let{children:e}=t;return Nn()!==void 0?e:null};Xn.displayName="MessagePrimitive.Error";var W=$("react/jsx-runtime"),av=t=>{let e=new Map;for(let o=0;o<t.length;o++){let i=t[o]?.parentId??o,s=e.get(i)??[];s.push(o),e.set(i,s)}let r=[];for(let[o,i]of e){let s=typeof o=="string"?o:void 0;r.push({groupKey:s,indices:i})}return r},cv=t=>{let e=g(4),r=R(bv),o;e:{if(r.length===0){let s;e[0]===Symbol.for("react.memo_cache_sentinel")?(s=[],e[0]=s):s=e[0],o=s;break e}let i;e[1]!==t||e[2]!==r?(i=t(r),e[1]=t,e[2]=r,e[3]=i):i=e[3],o=i}return o},lv=t=>{let e=g(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i;e[3]!==r||e[4]!==o.toolName?(i=a=>a.tools.toolUIs[o.toolName]?.[0]?.render??r,e[3]=r,e[4]=o.toolName,e[5]=i):i=e[5];let s=R(i);if(!s)return null;let n;return e[6]!==s||e[7]!==o?(n=(0,W.jsx)(s,{...o}),e[6]=s,e[7]=o,e[8]=n):n=e[8],n},dv=t=>{let e=g(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i;e[3]!==r||e[4]!==o.name?(i=a=>{let c=a.dataRenderers.renderers[o.name]??r;return Array.isArray(c)?c[0]??r:c},e[3]=r,e[4]=o.name,e[5]=i):i=e[5];let s=R(i);if(!s)return null;let n;return e[6]!==s||e[7]!==o?(n=(0,W.jsx)(s,{...o}),e[6]=s,e[7]=o,e[8]=n):n=e[8],n},Nt={Text:()=>(0,W.jsxs)("p",{style:{whiteSpace:"pre-line"},children:[(0,W.jsx)(go,{}),(0,W.jsx)(Yt,{children:(0,W.jsx)("span",{style:{fontFamily:"revert"},children:" \u25CF"})})]}),Reasoning:()=>null,Source:()=>null,Image:()=>(0,W.jsx)(vo,{}),File:()=>null,Unstable_Audio:()=>null,Group:({children:t})=>t},uv=t=>{let e=g(37),{components:r}=t,o;e[0]!==r?(o=r===void 0?{}:r,e[0]=r,e[1]=o):o=e[1];let{Text:i,Reasoning:s,Image:n,Source:a,File:c,Unstable_Audio:l,tools:d,data:m}=o,p=i===void 0?Nt.Text:i,u=s===void 0?Nt.Reasoning:s,h=n===void 0?Nt.Image:n,v=a===void 0?Nt.Source:a,b=c===void 0?Nt.File:c,y=l===void 0?Nt.Unstable_Audio:l,S;e[2]!==d?(S=d===void 0?{}:d,e[2]=d,e[3]=S):S=e[3];let A=S,I=U(),k=R(wv),E=k.type;if(E==="tool-call"){let C=I.part.addToolResult,x=I.part.resumeToolCall,P=I.part.respondToToolApproval;if("Override"in A){let V;return e[4]!==C||e[5]!==k||e[6]!==P||e[7]!==x||e[8]!==A.Override?(V=(0,W.jsx)(A.Override,{...k,addResult:C,resume:x,respondToApproval:P}),e[4]=C,e[5]=k,e[6]=P,e[7]=x,e[8]=A.Override,e[9]=V):V=e[9],V}let N=A.by_name?.[k.toolName]??A.Fallback,O;return e[10]!==N||e[11]!==C||e[12]!==k||e[13]!==P||e[14]!==x?(O=(0,W.jsx)(lv,{...k,Fallback:N,addResult:C,resume:x,respondToApproval:P}),e[10]=N,e[11]=C,e[12]=k,e[13]=P,e[14]=x,e[15]=O):O=e[15],O}if(k.status?.type==="requires-action")throw new Error("Encountered unexpected requires-action status");switch(E){case"text":{let C;return e[16]!==p||e[17]!==k?(C=(0,W.jsx)(p,{...k}),e[16]=p,e[17]=k,e[18]=C):C=e[18],C}case"reasoning":{let C;return e[19]!==u||e[20]!==k?(C=(0,W.jsx)(u,{...k}),e[19]=u,e[20]=k,e[21]=C):C=e[21],C}case"source":{let C;return e[22]!==v||e[23]!==k?(C=(0,W.jsx)(v,{...k}),e[22]=v,e[23]=k,e[24]=C):C=e[24],C}case"image":{let C;return e[25]!==h||e[26]!==k?(C=(0,W.jsx)(h,{...k}),e[25]=h,e[26]=k,e[27]=C):C=e[27],C}case"file":{let C;return e[28]!==b||e[29]!==k?(C=(0,W.jsx)(b,{...k}),e[28]=b,e[29]=k,e[30]=C):C=e[30],C}case"audio":{let C;return e[31]!==y||e[32]!==k?(C=(0,W.jsx)(y,{...k}),e[31]=y,e[32]=k,e[33]=C):C=e[33],C}case"data":{let C=m?.by_name?.[k.name]??m?.Fallback,x;return e[34]!==C||e[35]!==k?(x=(0,W.jsx)(dv,{...k,Fallback:C}),e[34]=C,e[35]=k,e[36]=x):x=e[36],x}default:return console.warn(`Unknown message part type: ${E}`),null}},pv=t=>{let e=g(5),{partIndex:r,components:o}=t,i;e[0]!==o?(i=(0,W.jsx)(uv,{components:o}),e[0]=o,e[1]=i):i=e[1];let s;return e[2]!==r||e[3]!==i?(s=(0,W.jsx)(Wt,{index:r,children:i}),e[2]=r,e[3]=i,e[4]=s):s=e[4],s},mv=te(pv,(t,e)=>t.partIndex===e.partIndex&&t.components?.Text===e.components?.Text&&t.components?.Reasoning===e.components?.Reasoning&&t.components?.Source===e.components?.Source&&t.components?.Image===e.components?.Image&&t.components?.File===e.components?.File&&t.components?.Unstable_Audio===e.components?.Unstable_Audio&&t.components?.tools===e.components?.tools&&t.components?.data===e.components?.data&&t.components?.Group===e.components?.Group),hv=t=>{let e=g(6),{status:r,component:o}=t,i=r.type==="running",s;e[0]!==o||e[1]!==r?(s=(0,W.jsx)(o,{type:"text",text:"",status:r}),e[0]=o,e[1]=r,e[2]=s):s=e[2];let n;return e[3]!==i||e[4]!==s?(n=(0,W.jsx)(Jt,{text:"",isRunning:i,children:s}),e[3]=i,e[4]=s,e[5]=n):n=e[5],n},fv=Object.freeze({type:"complete"}),gv=t=>{let e=g(6),{components:r}=t,o=R(xv);if(r?.Empty){let n;return e[0]!==r.Empty||e[1]!==o?(n=(0,W.jsx)(r.Empty,{status:o}),e[0]=r.Empty,e[1]=o,e[2]=n):n=e[2],n}let i=r?.Text??Nt.Text,s;return e[3]!==o||e[4]!==i?(s=(0,W.jsx)(hv,{status:o,component:i}),e[3]=o,e[4]=i,e[5]=s):s=e[5],s},vv=te(gv,(t,e)=>t.components?.Empty===e.components?.Empty&&t.components?.Text===e.components?.Text),ns=t=>{let e=g(9),{groupingFunction:r,components:o}=t,i=R(yv),s=cv(r),n;e:{if(i===0){let d;e[0]!==o?(d=(0,W.jsx)(vv,{components:o}),e[0]=o,e[1]=d):d=e[1],n=d;break e}let l;if(e[2]!==o||e[3]!==s){let d;e[5]!==o?(d=(m,p)=>{let u=o?.Group??Nt.Group;return(0,W.jsx)(u,{groupKey:m.groupKey,indices:m.indices,children:m.indices.map(h=>(0,W.jsx)(mv,{partIndex:h,components:o},h))},`group-${p}-${m.groupKey??"ungrouped"}`)},e[5]=o,e[6]=d):d=e[6],l=s.map(d),e[2]=o,e[3]=s,e[4]=l}else l=e[4];n=l}let a=n,c;return e[7]!==a?(c=(0,W.jsx)(W.Fragment,{children:a}),e[7]=a,e[8]=c):c=e[8],c};ns.displayName="MessagePrimitive.Unstable_PartsGrouped";var Zn=t=>{let e=g(6),r,o;e[0]!==t?({components:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let i;return e[3]!==r||e[4]!==o?(i=(0,W.jsx)(ns,{...o,components:r,groupingFunction:av}),e[3]=r,e[4]=o,e[5]=i):i=e[5],i};Zn.displayName="MessagePrimitive.Unstable_PartsGroupedByParentId";function bv(t){return t.message.parts}function wv(t){return t.part}function xv(t){return t.message.status??fv}function yv(t){return t.message.parts.length}var kr=es({AttachmentByIndex:()=>lo,Attachments:()=>uo,Content:()=>ss,Error:()=>Xn,GenerativeUI:()=>Ui,GroupedParts:()=>zi,If:()=>Yn,PartByIndex:()=>Pt,Parts:()=>ss,Quote:()=>qi,Root:()=>Jn,Unstable_PartsGrouped:()=>ns,Unstable_PartsGroupedByParentId:()=>Zn});var _u=t=>{let e=g(2),r=Ot(t),o;return e[0]!==r?(o=i=>{let s=new ResizeObserver(()=>{r()}),n=new MutationObserver(a=>{a.some(_v)&&r()});return s.observe(i),n.observe(i,{childList:!0,subtree:!0,attributes:!0,characterData:!0}),()=>{s.disconnect(),n.disconnect()}},e[0]=r,e[1]=o):o=e[1],Ke(o)};function _v(t){return t.type!=="attributes"||t.attributeName!=="style"}var Su=({autoScroll:t,scrollToBottomOnRunStart:e=!0,scrollToBottomOnInitialize:r=!0,scrollToBottomOnThreadSwitch:o=!0})=>{let i=F(null),s=R(x=>x.thread.messages.length>0),n=R(x=>x.thread.isRunning),a=F(!1),c=F(null),l=je();t===void 0&&(t=l.getState().turnAnchor!=="top");let d=F(0),m=F(0),p=F(0),u=F(0),h=F(null),v=F(t),b=F(t);Ue(()=>{let x=b.current;if(b.current=t,x||!t)return;let P=i.current;v.current=P!==null&&ni(P)},[t]);let y=It(x=>{let P=i.current;P&&(v.current=!0,h.current=x,P.scrollTo({top:P.scrollHeight,behavior:x}))},[]),S=It(()=>{c.current!==null&&(cancelAnimationFrame(c.current),c.current=null)},[]),A=It(x=>{h.current=x,S(),c.current=requestAnimationFrame(()=>{c.current=null,y(x)})},[S,y]);Ue(()=>()=>S(),[S]);let I=It(()=>{let x=l.getState();return x.turnAnchor==="top"&&x.element.viewport===i.current&&x.element.anchor!==null},[l]),k=()=>{let x=i.current;if(!x)return;let P=l.getState().isAtBottom,N=ni(x);if(!(!N&&d.current<x.scrollTop)){let O=Ws({scrollTop:d.current,scrollHeight:m.current},x);N?(Ks(x)&&(h.current=null),t&&(v.current=!0)):O&&(S(),h.current=null,v.current=!1),(N||h.current===null)&&N!==P&&Xt(l).setState({isAtBottom:N})}d.current=x.scrollTop,m.current=x.scrollHeight},E=_u(()=>{let x=i.current;if(!x)return;let{scrollHeight:P,clientHeight:N}=x;if(P===p.current&&N===u.current)return;p.current=P,u.current=N;let O=h.current;O&&I()?h.current=null:O?y(O):t&&!(n&&I())&&v.current&&y("instant"),k()}),C=Ke(x=>{let P=()=>{h.current=null};return x.addEventListener("scroll",k),x.addEventListener("pointerdown",P),()=>{x.removeEventListener("scroll",k),x.removeEventListener("pointerdown",P)}});return Ue(()=>{if(r){if(!s){a.current=!1;return}a.current||(a.current=!0,h.current===null&&A("instant"))}},[s,A,r]),cu(({behavior:x})=>{y(x)}),wi("thread.runStart",()=>{e&&l.getState().turnAnchor!=="top"&&A("auto")}),wi("threads.selectionChanged",()=>{o&&A("instant")}),Le(E,C,i)};var Tu=$("react/jsx-runtime"),ea=re((t,e)=>{let r=g(6),o=U(),i,s;r[0]!==o?(i=()=>{let a=c=>{if(c.key==="Escape"&&!(c.defaultPrevented||o.thread.source===null)&&o.thread.getState().speech!=null){c.preventDefault();try{o.thread.stopSpeaking()}catch(l){let d=l;if(!(d instanceof Error)||d.message!=="No message is being spoken")throw d}}};return document.addEventListener("keydown",a),()=>{document.removeEventListener("keydown",a)}},s=[o],r[0]=o,r[1]=i,r[2]=s):(i=r[1],s=r[2]),D(i,s);let n;return r[3]!==t||r[4]!==e?(n=(0,Tu.jsx)(Se.div,{...t,ref:e}),r[3]=t,r[4]=e,r[5]=n):n=r[5],n});ea.displayName="ThreadPrimitive.Root";var ta=t=>{let{children:e}=t;return R(Sv)?e:null};ta.displayName="ThreadPrimitive.Empty";function Sv(t){return t.thread.isEmpty}var Tv=t=>{let e=g(4),r;return e[0]!==t.disabled||e[1]!==t.empty||e[2]!==t.running?(r=o=>!(t.empty===!0&&!o.thread.isEmpty||t.empty===!1&&o.thread.isEmpty||t.running===!0&&!o.thread.isRunning||t.running===!1&&o.thread.isRunning||t.disabled===!0&&!o.thread.isDisabled||t.disabled===!1&&o.thread.isDisabled),e[0]=t.disabled,e[1]=t.empty,e[2]=t.running,e[3]=r):r=e[3],R(r)},ra=t=>{let e=g(3),r,o;return e[0]!==t?({children:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]),Tv(o)?r:null};ra.displayName="ThreadPrimitive.If";var as=(t,e)=>{let r=g(3),o;return r[0]!==e||r[1]!==t?(o=i=>{if(!t)return;let s=t(),n=()=>{let c=e?e(i):i.offsetHeight;s.setHeight(c)},a=new ResizeObserver(n);return a.observe(i),n(),()=>{a.disconnect(),s.unregister()}},r[0]=e,r[1]=t,r[2]=o):o=r[2],Ke(o)};var ku=t=>{let e=0,r=t;for(;r;)e+=r.offsetTop,r=r.offsetParent;return e},kv=(t,e)=>{let r=0,o=t;for(;o&&o!==e;)r+=o.offsetTop,o=o.offsetParent;return o===e?r:ku(t)-ku(e)},oa=({viewport:t,anchor:e,tallerThan:r,visibleHeight:o})=>{let i=kv(e,t),s=e.offsetHeight;return i+Math.max(0,s-(s<=r?s:o))},Cv=({scrollHeight:t,...e})=>{let{viewport:r}=e,o=oa(e)+r.clientHeight;return Math.max(0,o-t)},Cu=({viewport:t,reserve:e,...r})=>Cv({viewport:t,...r,scrollHeight:t.scrollHeight-e.offsetHeight});var Iu=t=>{let e=new ResizeObserver(t),r=new MutationObserver(t),o=null,i=null,s=null,n=()=>{e.disconnect(),r.disconnect(),o=null,i=null,s=null};return{target:(a,c,l)=>{o===a&&i===c&&s===l||(n(),e.observe(a),e.observe(c),e.observe(l),r.observe(l,{childList:!0,subtree:!0,characterData:!0}),o=a,i=c,s=l)},disconnect:n}};var Iv=t=>{let e=null;return{schedule:()=>{e===null&&(e=requestAnimationFrame(()=>{e=null,t()}))},cancel:()=>{e!==null&&(cancelAnimationFrame(e),e=null)}}},Eu=t=>{let e=null,r;function o(){let a=t.getState(),{viewport:c,anchor:l,target:d}=a.element,m=a.targetConfig;if(a.turnAnchor!=="top"||!c){s.disconnect(),e&&(is(e,0),e.remove());return}if(!l&&!d&&!m&&a.topAnchorTurn){s.disconnect(),e?.parentElement&&e.parentElement.lastElementChild!==e&&e.parentElement.append(e);return}if(!l||!d||!m){s.disconnect(),e&&(is(e,0),e.remove());return}if(e??(e=wu()),(e.parentElement!==d.parentElement||e.previousElementSibling!==d)&&d.after(e),s.target(c,l,d),is(e,Cu({viewport:c,anchor:l,reserve:e,...m}))){i.schedule();return}let p=bu(l);if(p!==void 0&&r===p)return;let u=xu(oa({viewport:c,anchor:l,...m}));Math.abs(c.scrollTop-u)>1&&c.scrollTo({top:u,behavior:"smooth"}),p!==void 0&&(r=p)}let i=Iv(o),s=Iu(i.schedule);i.schedule();let n=t.subscribe(i.schedule);return()=>{i.cancel(),n(),s.disconnect(),e?.remove()}};var Ru=t=>{let e=g(4),r=je(),o,i;e[0]!==t||e[1]!==r?(o=()=>{if(t)return Eu(r)},i=[t,r],e[0]=t,e[1]=r,e[2]=o,e[3]=i):(o=e[2],i=e[3]),Ue(o,i)};var Au=(t,e)=>{if(!t)return!1;let r=e.findIndex(o=>o.id===t.targetId);return r<1?!1:e[r-1]?.id===t.anchorId&&e.slice(r+1).every(o=>o.role==="user")},Mu=({isRunning:t,messages:e})=>{if(!t)return null;let r=e.at(-1),o=e.at(-2);return o?.role!=="user"||r?.role!=="assistant"?null:{anchorId:o.id,targetId:r.id}},Pu=t=>Mu(t)?.anchorId,Du=t=>Mu(t)?.targetId;var cs=$("react/jsx-runtime");var Ev=()=>{let t=$e(Mv);return as(t,Pv)},Rv=()=>{let t=$e(Dv);return Ke(t)},Av=t=>{let e=g(19),r=je(),o;e[0]!==t?(o=b=>{if(t)return Pu(b.thread)},e[0]=t,e[1]=o):o=e[1];let i=R(o),s;e[2]!==t?(s=b=>{if(t)return Du(b.thread)},e[2]=t,e[3]=s):s=e[3];let n=R(s),a=$e(Ov),c;e:{if(!i||!n){c=null;break e}let b;e[4]!==i||e[5]!==n?(b={anchorId:i,targetId:n},e[4]=i,e[5]=n,e[6]=b):b=e[6],c=b}let l=c,d;e[7]!==t||e[8]!==a?(d=b=>t&&!!a&&Au(a,b.thread.messages),e[7]=t,e[8]=a,e[9]=d):d=e[9];let m=R(d),p,u;e[10]!==r||e[11]!==a||e[12]!==m?(p=()=>{!a||m||r.getState().setTopAnchorTurn(null)},u=[r,a,m],e[10]=r,e[11]=a,e[12]=m,e[13]=p,e[14]=u):(p=e[13],u=e[14]),Ue(p,u);let h,v;e[15]!==l||e[16]!==r?(h=()=>{if(!l)return;let b=r.getState(),y=b.topAnchorTurn;y?.anchorId===l.anchorId&&y.targetId===l.targetId||b.setTopAnchorTurn(l)},v=[l,r],e[15]=l,e[16]=r,e[17]=h,e[18]=v):(h=e[17],v=e[18]),Ue(h,v)},Ou=re((t,e)=>{let r=g(18),o,i,s,n,a,c;r[0]!==t?({autoScroll:o,scrollToBottomOnRunStart:a,scrollToBottomOnInitialize:n,scrollToBottomOnThreadSwitch:c,children:i,...s}=t,r[0]=t,r[1]=o,r[2]=i,r[3]=s,r[4]=n,r[5]=a,r[6]=c):(o=r[1],i=r[2],s=r[3],n=r[4],a=r[5],c=r[6]);let l;r[7]!==o||r[8]!==n||r[9]!==a||r[10]!==c?(l={autoScroll:o,scrollToBottomOnRunStart:a,scrollToBottomOnInitialize:n,scrollToBottomOnThreadSwitch:c},r[7]=o,r[8]=n,r[9]=a,r[10]=c,r[11]=l):l=r[11];let d=Su(l),m=Ev(),p=Rv(),u=je(),h;r[12]!==u?(h=u.getState(),r[12]=u,r[13]=h):h=r[13];let v=h.turnAnchor==="top";Av(v),Ru(v);let b=Le(e,d,m,p),y;return r[14]!==i||r[15]!==b||r[16]!==s?(y=(0,cs.jsx)(Se.div,{...s,ref:b,children:i}),r[14]=i,r[15]=b,r[16]=s,r[17]=y):y=r[17],y});Ou.displayName="ThreadPrimitive.ViewportScrollable";var ia=re((t,e)=>{let r=g(13),o,i,s;r[0]!==t?({turnAnchor:s,topAnchorMessageClamp:i,...o}=t,r[0]=t,r[1]=o,r[2]=i,r[3]=s):(o=r[1],i=r[2],s=r[3]);let n;r[4]!==i||r[5]!==s?(n={turnAnchor:s,topAnchorMessageClamp:i},r[4]=i,r[5]=s,r[6]=n):n=r[6];let a;r[7]!==o||r[8]!==e?(a=(0,cs.jsx)(Ou,{...o,ref:e}),r[7]=o,r[8]=e,r[9]=a):a=r[9];let c;return r[10]!==n||r[11]!==a?(c=(0,cs.jsx)(_r,{options:n,children:a}),r[10]=n,r[11]=a,r[12]=c):c=r[12],c});ia.displayName="ThreadPrimitive.Viewport";function Mv(t){return t.registerViewport}function Pv(t){return t.clientHeight}function Dv(t){return t.registerViewportElement}function Ov(t){return t.topAnchorTurn}var Nu=$("react/jsx-runtime");var sa=re((t,e)=>{let r=g(3),o=$e(Nv),i=as(o,Bv),s=Le(e,i),n;return r[0]!==t||r[1]!==s?(n=(0,Nu.jsx)(Se.div,{...t,ref:s}),r[0]=t,r[1]=s,r[2]=n):n=r[2],n});sa.displayName="ThreadPrimitive.ViewportFooter";function Nv(t){return t.registerContentInset}function Bv(t){let e=parseFloat(getComputedStyle(t).marginTop)||0;return t.offsetHeight+e}var $v=t=>{let e=g(5),r;e[0]!==t?(r=t===void 0?{}:t,e[0]=t,e[1]=r):r=e[1];let{behavior:o}=r,i=$e(jv),s=je(),n;e[2]!==o||e[3]!==s?(n=()=>{s.getState().scrollToBottom({behavior:o})},e[2]=o,e[3]=s,e[4]=n):n=e[4];let a=n;return i?null:a},Bu=rs("ThreadPrimitive.ScrollToBottom",$v,["behavior"]);function jv(t){return t.isAtBottom}var Lv=t=>{let e=g(4),{prompt:r,send:o,clearComposer:i,autoSend:s}=t,n=o??s??!1,a;e[0]!==i||e[1]!==r||e[2]!==n?(a={prompt:r,send:n,clearComposer:i},e[0]=i,e[1]=r,e[2]=n,e[3]=a):a=e[3];let{disabled:c,trigger:l}=On(a);return c?null:l},$u=rs("ThreadPrimitive.Suggestion",Lv,["prompt","send","clearComposer","autoSend","method"]);var Cr=es({Empty:()=>ta,If:()=>ra,MessageByIndex:()=>so,Messages:()=>Fi,Root:()=>ea,ScrollToBottom:()=>Bu,Suggestion:()=>$u,SuggestionByIndex:()=>po,Suggestions:()=>Ki,Unstable_MessageById:()=>no,Viewport:()=>ia,ViewportFooter:()=>sa,ViewportProvider:()=>_r});var na=[{id:"allow-once",kind:"allow-once",label:"Allow once"},{id:"reject-once",kind:"reject-once",label:"Reject"}];function ju(t){let e=t.reason===void 0||t.reason===""?`${t.toolName} needs approval`:t.reason;return{id:t.id,prompt:e,display:"decision",options:na.map(r=>({...r}))}}function Lu(t){if(t.optionId!==void 0){let e=na.find(r=>r.id===t.optionId);if(e===void 0)throw new Error(`unknown approval option ${JSON.stringify(t.optionId)} \u2014 this dashboard offers ${na.map(r=>r.id).join(", ")}`);return e.kind==="allow-once"?"allowed-once":"rejected"}if(t.approved===void 0)throw new Error("approval response carried neither an optionId nor an approved flag");return t.approved?"allowed-once":"rejected"}var w=$("react/jsx-runtime");function Fv(t){let e=ju({id:t.id,toolName:t.toolName,...t.callId===void 0?{}:{callId:t.callId},...t.reason===void 0?{}:{reason:t.reason},...t.runId===void 0?{}:{runId:t.runId},askedAt:t.askedAt});return{id:`ask-${t.id}`,role:"assistant",createdAt:new Date(t.askedAt),content:[{type:"tool-call",toolCallId:t.id,toolName:t.toolName,args:{},argsText:"{}",approval:e}]}}function Fu(t,e,r=Date.now()){return{id:t,role:"user",createdAt:new Date(r),content:[{type:"text",text:e}]}}async function Vv(t,e){let r=Lu(e),o=e.feedback?.trim()??"";await t.respond(e.approvalId,r,o)}function Uv({node:t}){return t.kind==="heading"?(0,w.jsx)("h3",{className:"brief-heading",children:t.text}):t.kind==="list"?(0,w.jsx)("ul",{className:"brief-list",children:t.items.map((e,r)=>(0,w.jsx)("li",{children:e},r))}):t.kind==="code"?(0,w.jsx)("pre",{className:"brief-code","data-language":t.language,children:t.code}):(0,w.jsx)("p",{className:"brief-para",children:t.text})}function zv({ask:t}){return t.briefState==="none"?null:t.briefState==="pending"?(0,w.jsx)("div",{className:"brief-note",children:"Writing review brief\u2026"}):t.briefState==="failed"?(0,w.jsx)("div",{className:"brief-note",children:"Review brief unavailable."}):(0,w.jsx)("div",{className:"brief",children:(t.brief??[]).map((e,r)=>(0,w.jsx)(Uv,{node:e},r))})}function Hv(t){return new Date(t).toLocaleTimeString()}var Vu=Y.default.createContext({text:"",setText:()=>{},clear:()=>{},commitLocal:()=>{}});function Uu(){return Y.default.useContext(Vu)}function qv(t){let[e,r]=(0,Y.useState)(null),[o,i]=(0,Y.useState)(!1),s=ca.get(t.toolCallId),n=t.approval,a=n?.options??[],c=Uu(),l=(0,Y.useCallback)(p=>{i(!0),r(null),t.respondToApproval({optionId:p}).catch(u=>{r(u instanceof Error?u.message:String(u))}).finally(()=>i(!1))},[t]),d=n?.approved!==void 0||n?.resolution!==void 0,m=c.text.trim();return(0,w.jsxs)("div",{className:"card","aria-busy":o,children:[(0,w.jsxs)("div",{className:"card-top",children:[(0,w.jsx)("span",{className:"eyebrow",children:"Approval required"}),s!==void 0&&(0,w.jsxs)("span",{className:"asked",children:["asked ",Hv(s.askedAt)]})]}),(0,w.jsx)("div",{className:"tool",children:t.toolName}),s!==void 0&&(0,w.jsxs)("div",{className:"meta",children:[(0,w.jsx)("span",{className:"meta-k",children:"run"}),(0,w.jsx)("span",{className:"meta-v",children:s.runId??"agentless"}),s.callId!==void 0&&(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)("span",{className:"meta-k",children:"call"}),(0,w.jsx)("span",{className:"meta-v",children:s.callId})]})]}),n?.prompt!==void 0&&(0,w.jsx)("div",{className:"reason",children:n.prompt}),s!==void 0&&(0,w.jsx)(zv,{ask:s}),n?.resolution!==void 0&&(0,w.jsx)("div",{className:"brief-note settled",children:n.resolution==="expired"?"Expired \u2014 no answer in time.":"Cancelled \u2014 the ask was withdrawn."}),!d&&(0,w.jsxs)("div",{className:"row actions",children:[a.map(p=>(0,w.jsx)("button",{type:"button",className:p.kind==="allow-once"?"allow":"reject",disabled:o,"aria-busy":o,onClick:()=>l(p.id),children:p.label},p.id)),o&&(0,w.jsx)("span",{className:"busy-note",children:"Submitting\u2026"})]}),!d&&m!==""&&(0,w.jsxs)("div",{className:"feedback-preview","aria-live":"polite",children:["Feedback will be sent with your decision: ",(0,w.jsx)("em",{children:m})]}),e!==null&&(0,w.jsx)("div",{className:"brief-note error",role:"alert",children:e})]})}var ca=new Map;function Gv(t){let[e,r]=(0,Y.useState)(()=>window.__FL_DASHBOARD_SNAPSHOT__??null);return(0,Y.useEffect)(()=>{let o=!0,i=()=>{t.load().then(a=>{o&&r(a)}).catch(()=>{})};i();let s=t.onChange?.(i)??(()=>{}),n=setInterval(i,3e4);return()=>{o=!1,clearInterval(n),s()}},[t]),e}function Kv(t){(0,Y.useEffect)(()=>{let e=document.getElementById("pending-count");e!==null&&(e.textContent=t===0?"idle":`${String(t)} pending`,e.setAttribute("data-count",String(t)))},[t])}function Wv({disabled:t}){let e=Uu();return(0,w.jsx)("form",{className:"hitl-composer-root",onSubmit:o=>{o.preventDefault(),!(t||e.text.trim()==="")&&e.commitLocal()},children:(0,w.jsxs)("div",{className:`hitl-composer-shell${t?" is-disabled":""}`,children:[(0,w.jsx)("textarea",{className:"hitl-composer-input",placeholder:t?"No pending approval \u2014 waiting for the next gate\u2026":"Add response or feedback, then Allow once / Reject \u2014 or send to post feedback into the thread\u2026",rows:2,"aria-label":"Approval response and feedback",disabled:t,value:e.text,onChange:o=>e.setText(o.target.value),onKeyDown:o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),!t&&e.text.trim()!==""&&e.commitLocal())}}),(0,w.jsxs)("div",{className:"hitl-composer-actions",children:[(0,w.jsx)("span",{className:"hitl-composer-hint",children:t?"Composer idle":"Enter posts feedback \xB7 Shift+Enter newline \xB7 buttons decide"}),(0,w.jsx)("button",{type:"submit",className:"hitl-composer-send",disabled:t||e.text.trim()==="","aria-label":"Send feedback",children:(0,w.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none","aria-hidden":"true",children:(0,w.jsx)("path",{d:"M12 19V5M12 5l-6 6M12 5l6 6",stroke:"currentColor",strokeWidth:"2.2",strokeLinecap:"round",strokeLinejoin:"round"})})})]})]})})}function Jv(){return(0,w.jsx)(kr.Root,{className:"hitl-user-msg","data-role":"user",children:(0,w.jsx)("div",{className:"hitl-user-bubble",children:(0,w.jsx)(kr.Parts,{})})})}function Qv(){return(0,w.jsx)(kr.Root,{className:"hitl-assistant-msg","data-role":"assistant",children:(0,w.jsx)(kr.Parts,{components:{tools:{Override:qv}}})})}function Yv({pending:t,source:e}){ca.clear();for(let m of t)ca.set(m.id,m);let[r,o]=(0,Y.useState)([]),[i,s]=(0,Y.useState)(""),n=(0,Y.useRef)(i);n.current=i;let a=(0,Y.useMemo)(()=>[...t.map(Fv),...r].slice(-48),[t,r]),c=(0,Y.useCallback)(()=>{let m=n.current.trim();m!==""&&o(p=>[...p,Fu(`feedback-${String(Date.now())}`,m)])},[]),l=(0,Y.useMemo)(()=>({text:i,setText:s,clear:()=>{s(""),n.current=""},commitLocal:c}),[i,c]),d=io({messages:a,isRunning:!1,convertMessage:m=>m,onNew:async()=>{},onRespondToToolApproval:async m=>{let p=n.current.trim();await Vv(e,{...m,approvalId:m.approvalId,...p===""?{}:{feedback:p}}),p!==""&&o(u=>{let h=u[u.length-1];return h!==void 0&&h.role==="user"&&Array.isArray(h.content)&&h.content.some(b=>typeof b=="object"&&b!==null&&"text"in b&&b.text===p)?u:[...u,Fu(`feedback-${String(Date.now())}`,p)]}),s(""),n.current=""}});return(0,w.jsx)(Vu.Provider,{value:l,children:(0,w.jsx)(jn,{runtime:d,children:(0,w.jsx)(Cr.Root,{className:"hitl-thread-root",style:{"--thread-max-width":"44rem"},children:(0,w.jsxs)(Cr.Viewport,{className:"hitl-thread-viewport",turnAnchor:"top",children:[t.length===0&&r.length===0?(0,w.jsxs)("div",{className:"empty empty-plate hitl-welcome",children:[(0,w.jsx)("p",{className:"empty-title",children:"No pending approval requests."}),(0,w.jsx)("p",{className:"hint",children:"When a run reaches a review gate, the ask appears in this thread. Use the composer for response/feedback, then Allow once or Reject."})]}):null,(0,w.jsx)(Cr.Messages,{components:{UserMessage:Jv,AssistantMessage:Qv}}),(0,w.jsx)(Cr.ViewportFooter,{className:"hitl-thread-footer",children:(0,w.jsx)(Wv,{disabled:t.length===0})})]})})})})}function Xv(t){return t>=.9?"bad":t>=.7?"warn":"ok"}function aa({value:t,max:e,label:r,className:o}){if(!(e>0)||!Number.isFinite(t)||!Number.isFinite(e))return null;let i=Math.max(0,Math.min(1,t/e)),s=Xv(i),n=Math.round(i*1e3)/10;return(0,w.jsx)("div",{className:`meter ${s}${o?` ${o}`:""}`,role:"progressbar","aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":Math.round(i*100),"aria-label":r,children:(0,w.jsx)("i",{style:{width:`${n}%`}})})}function Zv(t){return t==="critical"?"tag tag-bad sig-tag":t==="warning"?"tag tag-warn sig-tag":t==="info"||t==="notice"?"tag tag-cyan sig-tag":"tag tag-ghost sig-tag"}function eb(t){return t==="approval"?"tag tag-warn feed-k":t==="gate"?"tag tag-bad feed-k":t==="judge"?"tag tag-ok feed-k":t==="signals"?"tag tag-cyan feed-k":t==="route"||t==="step"?"tag tag-accent feed-k":"tag tag-ghost feed-k"}var wo="Ungrouped";function la(t){return t.length<=12?t:`${t.slice(0,8)}\u2026`}function zu(t){let e=new Map;for(let o of t){let i=o.workspaceLabel?.trim()||wo,s=o.cwd&&o.cwd!==""?o.cwd:i,n=e.get(s);n===void 0&&(n={key:s,label:i,...o.cwd===void 0||o.cwd===""?{}:{cwd:o.cwd},sessions:[]},e.set(s,n)),n.sessions.push(o)}let r=[...e.values()];for(let o of r)o.sessions.sort((i,s)=>(s.updatedAt??0)-(i.updatedAt??0));return r.sort((o,i)=>o.label===wo&&i.label!==wo?1:i.label===wo&&o.label!==wo?-1:o.label.localeCompare(i.label)),r}function tb({snapshot:t,filter:e,onSelect:r}){let o=(0,Y.useMemo)(()=>{let a=new Map;for(let c of t.pending)c.runId===void 0||c.runId===""||a.set(c.runId,(a.get(c.runId)??0)+1);return a},[t.pending]),i=(0,Y.useMemo)(()=>zu(t.runs),[t.runs]),[s,n]=(0,Y.useState)({});return(0,Y.useEffect)(()=>{n(a=>{let c={...a};for(let l of i){let d=l.sessions.some(p=>(o.get(p.runId)??0)>0),m=e!=="all"&&l.sessions.some(p=>p.runId===e);(d||m||c[l.key]===void 0)&&(c[l.key]=!1)}return c})},[i,e,o]),t.runs.length===0?(0,w.jsxs)("section",{id:"workspaces","aria-label":"Workspaces",children:[(0,w.jsxs)("div",{className:"section-head",children:[(0,w.jsx)("h2",{children:"Workspaces"}),(0,w.jsx)("span",{className:"section-count",children:"0"})]}),(0,w.jsx)("p",{className:"empty",children:"No live sessions yet."})]}):(0,w.jsxs)("section",{id:"workspaces","aria-label":"Workspaces",children:[(0,w.jsxs)("div",{className:"section-head",children:[(0,w.jsx)("h2",{children:"Workspaces"}),(0,w.jsx)("span",{className:"section-count",children:i.length})]}),(0,w.jsxs)("div",{className:"ws-tree scroll-beauty",role:"tree",children:[(0,w.jsxs)("button",{type:"button",className:`ws-all${e==="all"?" is-active":""}`,role:"treeitem","aria-current":e==="all"?"true":void 0,onClick:()=>r("all"),children:["All sessions",(0,w.jsx)("span",{className:"tag tag-ghost",children:t.runs.length})]}),i.map(a=>{let c=s[a.key]===!0,l=a.sessions.reduce((d,m)=>d+(o.get(m.runId)??0),0);return(0,w.jsxs)("div",{className:"ws-group",role:"group",children:[(0,w.jsxs)("button",{type:"button",className:"ws-group-head","aria-expanded":!c,onClick:()=>n(d=>({...d,[a.key]:!c})),title:a.cwd??a.label,children:[(0,w.jsx)("span",{className:"ws-chevron","aria-hidden":"true",children:c?"\u25B8":"\u25BE"}),(0,w.jsx)("span",{className:"ws-group-label",children:a.label}),(0,w.jsx)("span",{className:"tag tag-ghost",children:a.sessions.length}),l>0&&(0,w.jsx)("span",{className:"tag tag-warn",children:l})]}),!c&&(0,w.jsx)("ul",{className:"ws-sessions",children:a.sessions.map(d=>{let m=o.get(d.runId)??0,p=e===d.runId,u=d.label??d.sessionId??d.runId;return(0,w.jsx)("li",{children:(0,w.jsxs)("button",{type:"button",className:`ws-session${p?" is-active":""}${m>0?" is-pending":""}`,role:"treeitem","aria-current":p?"true":void 0,title:`${u}
${d.runId}${d.cwd===void 0?"":`
${d.cwd}`}`,onClick:()=>r(d.runId),children:[(0,w.jsx)("span",{className:"ws-session-id mono",children:la(u)}),d.step!==void 0&&(0,w.jsxs)("span",{className:"tag tag-ghost",children:["s",d.step]}),m>0&&(0,w.jsx)("span",{className:"tag tag-warn",children:m})]})},d.runId)})})]},a.key)})]})]})}function rb({run:t}){return(0,w.jsxs)("div",{className:"run-card",children:[(0,w.jsxs)("div",{className:"run-grid",children:[(0,w.jsxs)("div",{children:[(0,w.jsx)("div",{className:"k",children:"run"}),(0,w.jsx)("div",{className:"v mono",title:t.runId,children:la(t.sessionId??t.runId)})]}),(0,w.jsxs)("div",{children:[(0,w.jsx)("div",{className:"k",children:"steps"}),(0,w.jsxs)("div",{className:"v",children:[t.step??"\u2014",t.maxSteps===void 0?"":` / ${t.maxSteps}`]}),t.step!==void 0&&t.maxSteps!==void 0&&(0,w.jsx)(aa,{value:t.step,max:t.maxSteps,label:`Step ${t.step} of ${t.maxSteps}`})]}),(0,w.jsxs)("div",{children:[(0,w.jsx)("div",{className:"k",children:"spend"}),(0,w.jsxs)("div",{className:"v",children:[t.spentUSD===void 0?"\u2014":`$${t.spentUSD.toFixed(4)}`,t.budgetUSD===void 0?"":` / $${t.budgetUSD.toFixed(2)}`]}),t.spentUSD!==void 0&&t.budgetUSD!==void 0&&(0,w.jsx)(aa,{value:t.spentUSD,max:t.budgetUSD,label:`Spend $${t.spentUSD.toFixed(4)} of $${t.budgetUSD.toFixed(2)}`})]}),t.route!==void 0&&(0,w.jsxs)("div",{children:[(0,w.jsx)("div",{className:"k",children:"route"}),(0,w.jsx)("div",{className:"v",children:(0,w.jsx)("span",{className:"tag tag-accent",title:t.route,children:t.route})})]}),t.judgeScore!==void 0&&(0,w.jsxs)("div",{children:[(0,w.jsx)("div",{className:"k",children:"judge"}),(0,w.jsx)("div",{className:"v",children:(0,w.jsxs)("span",{className:`tag ${t.judgeScore>=2?"tag-ok":t.judgeScore>=1?"tag-warn":"tag-bad"}`,children:[t.judgeScore," / 3"]})}),(0,w.jsx)(aa,{value:t.judgeScore,max:3,label:`Judge score ${t.judgeScore} of 3`,className:"accent"})]})]}),(t.signals??[]).map((e,r)=>(0,w.jsxs)("div",{className:`sig ${e.severity}`,children:[(0,w.jsx)("span",{className:Zv(e.severity),children:e.severity}),(0,w.jsx)("span",{className:"tag tag-ghost",children:e.kind}),(0,w.jsxs)("span",{children:["@ step ",e.step," \u2014 ",e.detail]})]},r))]})}function ob({snapshot:t,filter:e}){let r=e==="all"?t.runs:t.runs.filter(i=>i.runId===e),o=(0,Y.useMemo)(()=>zu(r),[r]);return(0,w.jsxs)("section",{id:"run-state",className:"pane pane-runs",children:[(0,w.jsxs)("div",{className:"section-head pane-head",children:[(0,w.jsx)("h2",{children:"Runs"}),(0,w.jsx)("span",{className:"section-count",children:r.length}),e!=="all"&&(0,w.jsx)("span",{className:"tag tag-accent",title:e,children:la(e)})]}),(0,w.jsx)("div",{className:"pane-scroll scroll-beauty",children:r.length===0?(0,w.jsx)("p",{className:"empty",children:e==="all"?"No run has reported yet.":"No run state for this session."}):o.map(i=>(0,w.jsxs)("div",{className:"run-group",children:[(0,w.jsxs)("div",{className:"run-group-head",title:i.cwd??i.label,children:[(0,w.jsx)("span",{className:"run-group-label",children:i.label}),(0,w.jsx)("span",{className:"tag tag-ghost",children:i.sessions.length})]}),(0,w.jsx)("div",{className:"run-group-body",children:i.sessions.map(s=>(0,w.jsx)(rb,{run:s},s.runId))})]},i.key))})]})}function ib({snapshot:t,filter:e}){let r=e==="all"?t.feed:t.feed.filter(o=>o.runId===e);return(0,w.jsxs)("section",{id:"activity",className:"pane pane-activity",children:[(0,w.jsxs)("div",{className:"section-head pane-head",children:[(0,w.jsx)("h2",{children:"Activity"}),(0,w.jsx)("span",{className:"section-count",children:r.length})]}),(0,w.jsx)("div",{className:"pane-scroll scroll-beauty",children:r.length===0?(0,w.jsx)("p",{className:"empty",children:e==="all"?"No activity yet.":"No activity for this session."}):(0,w.jsx)("ul",{className:"feed",children:[...r].reverse().map((o,i)=>(0,w.jsxs)("li",{className:"feed-item",children:[(0,w.jsx)("span",{className:"feed-t t",children:new Date(o.t).toLocaleTimeString()}),(0,w.jsx)("span",{className:eb(o.kind),children:o.kind}),(0,w.jsx)("span",{className:"feed-text text",children:o.text})]},`${String(o.t)}-${String(i)}`))})})]})}function Hu({source:t}){let e=Gv(t),[r,o]=(0,Y.useState)("all");return Kv(e?.pending.length??0),(0,Y.useEffect)(()=>{r==="all"||e===null||e.runs.some(i=>i.runId===r)||o("all")},[e,r]),e===null?(0,w.jsx)("p",{className:"empty",children:"Loading\u2026"}):(0,w.jsxs)("div",{className:"dashboard-shell",children:[(0,w.jsxs)("aside",{className:"sidebar","aria-label":"Workspaces and activity",children:[(0,w.jsx)("div",{className:"sidebar-top",children:(0,w.jsx)(tb,{snapshot:e,filter:r,onSelect:o})}),(0,w.jsx)(ib,{snapshot:e,filter:r})]}),(0,w.jsxs)("section",{className:"stage",id:"approvals","aria-label":"Approvals thread",children:[(0,w.jsxs)("div",{className:"section-head",children:[(0,w.jsx)("h2",{children:"Approval thread"}),(0,w.jsx)("span",{className:`section-count${e.pending.length>0?" hot":""}`,children:e.pending.length})]}),(0,w.jsx)(Yv,{pending:e.pending,source:t})]}),(0,w.jsx)("aside",{className:"rail","aria-label":"Grouped runs",children:(0,w.jsx)(ob,{snapshot:e,filter:r})})]})}function qu(t,e,r){let o=[...t].sort((c,l)=>l.updatedAt-c.updatedAt);if(o.length===0)return{target:void 0,ambiguous:!1,blocked:"no-session",note:"No open session yet \u2014 start a conversation first."};let s=(e===void 0?void 0:o.find(c=>c.id===e))??o[0],n=o.length>1,a=r.trim()==="";return{target:s,ambiguous:n,blocked:a?"empty-task":void 0,note:n?`Runs in the selected session${s===void 0?"":` \u2014 \u201C${s.displayTitle}\u201D`}.`:`Runs in \u201C${s?.displayTitle??""}\u201D.`}}var Gu=`/*! tailwindcss v4.1.18 | MIT License | https://tailwindcss.com */
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
`;var Ku=`/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

/* The aliases live on \`body\`, not \`:root\`, and that is load-bearing: the
   harness declares its \`--dsw-alias-*\` tokens on \`body\`. An alias block on
   \`:root\` (the html element) resolves before those tokens are ever in scope
   and silently keeps its hex fallback forever \u2014 which is exactly how this
   file ended up looking like a guest in the host UI. Declared on \`body\`, the
   same declarations still carry their fallbacks when the stylesheet renders
   outside the harness (the standalone page), which keeps that path honest. */
body {
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

* { box-sizing: border-box; }

html { scroll-padding-top: calc(var(--header-h) + 12px); }

body {
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
header {
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
header .brand {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
header h1 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
}
header .sep { color: var(--faint); }
header .product {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--muted);
}
header .header-meta {
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
main {
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
.fl-page {
  container-type: inline-size;
  container-name: fl-dashboard;
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
  .sidebar {
    position: sticky;
    top: calc(var(--header-h) + 12px);
    height: calc(100vh - var(--header-h) - 28px);
    max-height: calc(100vh - var(--header-h) - 28px);
    overflow: hidden;
  }
  .rail { grid-column: 1 / -1; max-height: 70vh; overflow: hidden; }
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
    height: calc(100vh - var(--header-h) - 28px);
    max-height: calc(100vh - var(--header-h) - 28px);
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
  background: color-mix(in srgb, var(--chrome) 55%, var(--panel));
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

/* Beautiful thin scrollbars (WebKit + Firefox) */
.scroll-beauty {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--accent) 45%, transparent) transparent;
}
.scroll-beauty::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.scroll-beauty::-webkit-scrollbar-track {
  background: transparent;
  margin: 4px 0;
}
.scroll-beauty::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--accent) 55%, var(--ok-deep)),
    color-mix(in srgb, var(--badge) 40%, transparent)
  );
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
  min-height: 32px;
}
.scroll-beauty::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--accent) 80%, var(--text)),
    color-mix(in srgb, var(--badge) 70%, transparent)
  );
  background-clip: padding-box;
  border: 2px solid transparent;
}
.scroll-beauty::-webkit-scrollbar-corner { background: transparent; }

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
h2 {
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
details summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 12.5px;
  outline-offset: 3px;
}
details summary:hover { color: var(--text); }
details .hint { margin-top: 10px; max-width: 72ch; }

code {
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

/* buttons \u2014 pill controls like the stockbroker confirm card */
button {
  font: inherit;
  font-weight: 600;
  font-size: 13.5px;
  border-radius: 999px;
  border: 1px solid var(--border);
  padding: 9px 18px;
  min-height: 40px;
  cursor: pointer;
  background: var(--panel-2);
  color: var(--text);
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, opacity 150ms ease;
}
button:hover:not(:disabled) { border-color: var(--faint); }
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
button:disabled { opacity: 0.5; cursor: default; }
button.allow {
  background: var(--ok-deep);
  border-color: var(--ok-deep);
  /* A mid-tone fill takes the page's own primary label, not the dark-fill
     foreground: that token is white in the light theme and measured 2.3:1 here. */
  color: var(--text);
}
button.allow:hover:not(:disabled) {
  background: var(--ok);
  border-color: var(--ok);
}
button.reject {
  background: color-mix(in srgb, var(--bad) 10%, var(--panel));
  border-color: color-mix(in srgb, var(--bad) 60%, var(--border));
  color: color-mix(in srgb, var(--bad) 62%, var(--text));
}
button.reject:hover:not(:disabled) {
  background: color-mix(in srgb, var(--bad-deep) 14%, transparent);
  border-color: var(--bad);
}

/* \u2500\u2500 stockbroker-like approval thread \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hitl-thread-root {
  display: flex;
  flex-direction: column;
  min-height: min(70vh, 720px);
  max-height: calc(100vh - var(--header-h) - 120px);
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
  padding: 16px 16px 0;
}
.hitl-thread-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  margin-top: auto;
  padding: 0 12px 14px;
  background: linear-gradient(180deg, transparent, var(--panel) 28%);
}
.hitl-welcome {
  margin: 24px auto;
  max-width: var(--thread-max-width);
  width: 100%;
}

.hitl-assistant-msg,
.hitl-user-msg {
  width: 100%;
  max-width: var(--thread-max-width);
  margin: 0 auto 14px;
  padding: 0;
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
  padding: 10px 12px 10px;
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
  padding: 4px 4px 0;
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
  color: #F0F0F0;
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
`;var Wu=`/*
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

.fl-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 13px;
}

.fl-pagehead {
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
  flex: 0 0 auto;
}

.fl-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--dsw-alias-label-primary);
}

.fl-sub {
  color: var(--dsw-alias-label-secondary);
  line-height: 1.5;
  margin: 0;
}

/* Tabs follow the harness's pill metrics: 24px tall, 12px type, ghost fill
   that lifts to a bordered active state. */
.fl-tabs { display: flex; gap: 6px; margin-top: 12px; }

.fl-tabs button {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}

.fl-tabs button:hover { background: var(--dsw-alias-interactive-bg-hover); }

.fl-tabs button:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}

.fl-tabs button[data-active="true"] {
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-button-ghost-active-fill);
  box-shadow: inset 0 0 0 1px var(--dsw-alias-button-ghost-active-border);
}

/* The designed dashboard fills the rest of the column. */
.fl-dashboard {
  flex: 1 1 auto;
  min-height: 0;
  /* The page's own scroll container. The responsive container is declared on
     .fl-page in shell.css, so the shell's @container rules describe THIS page's
     width rather than the window's. */
  overflow: auto;
  background: var(--dsw-alias-bg-base);
  min-width: 0;
}

.fl-panel { display: flex; flex-direction: column; overflow-y: auto; }

.fl-section {
  padding: 16px 18px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}

.fl-section-title {
  font-size: 11px;
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
  min-height: 24px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  padding: 4px 9px;
  font: inherit;
}

.fl-row input:focus-visible,
.fl-row select:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -1px;
}

.fl-row input:disabled,
.fl-row select:disabled { opacity: 0.5; }

.fl-hint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11.5px;
  line-height: 1.5;
  margin: -4px 0 12px 160px;
}

.fl-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 9px;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
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

.fl-actions button,
.hitl-composer-send {
  border: 1px solid transparent;
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
  border-radius: 8px;
  padding: 7px 16px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}
.fl-actions button[data-kind="ghost"] {
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  border-color: var(--dsw-alias-border-l2);
  font-weight: 400;
}
.fl-actions button:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
.fl-actions button:disabled { opacity: 0.5; cursor: not-allowed; }

.fl-actions button:focus-visible,
.hitl-composer-send:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}

.fl-notice {
  padding: 10px 18px;
  font-size: 12px;
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

.fl-pre {
  background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  padding: 9px 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px;
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
  padding: 16px 18px 14px;
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

.fl-start-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  font: inherit;
}

.fl-start-input:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -1px;
}

.fl-start-button {
  flex: 0 0 auto;
  height: 32px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.fl-start-button:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
.fl-start-button:disabled { opacity: 0.45; cursor: not-allowed; }
.fl-start-button:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}

.fl-start-session {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.fl-start-sessionlabel { color: var(--dsw-alias-label-secondary); }
.fl-start-session select {
  flex: 1 1 auto;
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 7px;
  font: inherit;
}

.fl-start-note { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
.fl-start-result { margin: 0; font-size: 12px; }
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
`;var M=$("react/jsx-runtime");function cb(t){return{onChange(e){let r=t.get("remote");return r?.$on===void 0?()=>{}:r.$on("featureLoop/changed",e)},async load(){let e=t.get("remote.featureLoop");if(e===void 0)throw new Error("feature-loop host remote is not mounted");let r=await e.live();if(!r.ok)throw new Error(r.error.message);return r.value},async respond(e,r,o){let i=t.get("remote.featureLoop");if(i===void 0)throw new Error("feature-loop host remote is not mounted");let s=await i.answer(e,r,o);if(!s.ok)throw new Error(s.error.message);if(!s.value.settled)throw new Error("that approval was already settled")}}}function lb({size:t}){let e=t??16;return(0,M.jsxs)("svg",{width:e,height:e,viewBox:"0 0 16 16",fill:"none",stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round","aria-hidden":!0,children:[(0,M.jsx)("path",{d:"M13.5 8a5.5 5.5 0 1 1-1.6-3.9"}),(0,M.jsx)("path",{d:"M13.5 1.8V5h-3.2"}),(0,M.jsx)("path",{d:"M8 5.6v4.8"})]})}function Ir({label:t,hint:e,children:r}){return(0,M.jsxs)("div",{children:[(0,M.jsxs)("div",{className:"fl-row",children:[(0,M.jsx)("label",{className:"fl-label",children:t}),r]}),e!==void 0?(0,M.jsx)("div",{className:"fl-hint",children:e}):null]})}function db({host:t}){let[e,r]=(0,ae.useState)(null),[o,i]=(0,ae.useState)(null),[s,n]=(0,ae.useState)(!1),[a,c]=(0,ae.useState)(null),l=(0,ae.useCallback)(async()=>{try{let u=t.get("remote.featureLoop");if(u===void 0){i({kind:"error",text:"feature-loop host remote is not mounted."});return}let h=await u.status();if(!h.ok){i({kind:"error",text:`status: ${h.error.message}`});return}r(h.value),c({judge:h.value.judge.kind,judgeBaseURL:h.value.judge.baseURL,systemOneModel:h.value.judge.model,judgeThreshold:Number(h.value.config.judgeThreshold??2),reviewBudget:Number(h.value.config.reviewBudget??.1),gateMode:String(h.value.config.gateMode??"ask")})}catch(u){i({kind:"error",text:`status failed: ${u.message}`})}},[t]);(0,ae.useEffect)(()=>{l()},[l]);let d=(0,ae.useCallback)(async()=>{if(a!==null){n(!0),i(null);try{let u=t.get("remote.featureLoop");if(u===void 0)return;let h=await u.save(a);if(!h.ok){i({kind:"error",text:`save: ${h.error.message}`});return}i({kind:"ok",text:"Saved. Values apply at the next reload of this plugin."}),await l()}catch(u){i({kind:"error",text:`save failed: ${u.message}`})}finally{n(!1)}}},[a,t,l]);if(e===null||a===null)return(0,M.jsx)("div",{className:"fl-panel",children:(0,M.jsx)("div",{className:"fl-empty",children:o?.text??"Loading feature loop status\u2026"})});let m=(u,h)=>c(v=>({...v,[u]:h})),p=a.judge!=="laya";return(0,M.jsxs)("div",{className:"fl-panel",children:[o===null?null:(0,M.jsx)("div",{className:"fl-notice","data-kind":o.kind,children:o.text}),(0,M.jsxs)("div",{className:"fl-section",children:[(0,M.jsx)("h3",{className:"fl-section-title",children:"Status"}),(0,M.jsxs)("div",{className:"fl-row",children:[(0,M.jsx)("span",{className:"fl-label",children:"Policies"}),(0,M.jsxs)("span",{className:"fl-badge","data-ok":e.enabled,children:[(0,M.jsx)("span",{className:"fl-dot"}),e.enabled?"on \u2014 spec configured":"off \u2014 no spec, detectors inactive"]})]}),(0,M.jsxs)("div",{className:"fl-row",children:[(0,M.jsx)("span",{className:"fl-label",children:"Judge"}),(0,M.jsxs)("span",{className:"fl-badge","data-ok":e.judge.kind==="none"?void 0:e.judge.reachable,children:[(0,M.jsx)("span",{className:"fl-dot"}),e.judge.kind,e.judge.kind==="laya"?` \xB7 ${e.judge.model} @ ${e.judge.baseURL}`:""]})]}),e.judge.detail===""?null:(0,M.jsx)("pre",{className:"fl-pre",children:e.judge.detail}),(0,M.jsxs)("div",{className:"fl-row",children:[(0,M.jsx)("span",{className:"fl-label",children:"Standalone page"}),e.dashboardURL===""?(0,M.jsxs)("span",{className:"fl-hint",style:{margin:0},children:["off \u2014 this page is the dashboard; set ",(0,M.jsx)("code",{children:"dashboard.standalone: true"})," to also serve it on loopback"]}):(0,M.jsx)("a",{className:"fl-link",href:e.dashboardURL,target:"_blank",rel:"noreferrer",children:e.dashboardURL})]}),(0,M.jsxs)("div",{className:"fl-row",children:[(0,M.jsx)("span",{className:"fl-label",children:"Settings file"}),(0,M.jsx)("code",{className:"fl-pre",style:{flex:1},children:e.configPath})]})]}),(0,M.jsxs)("div",{className:"fl-section",children:[(0,M.jsx)("h3",{className:"fl-section-title",children:"Judge"}),(0,M.jsx)(Ir,{label:"Kind",hint:"laya is local, free and needs no key. chat is metered and needs a gateway key. none leaves the detectors alone.",children:(0,M.jsxs)("select",{value:String(a.judge),onChange:u=>m("judge",u.target.value),children:[(0,M.jsx)("option",{value:"laya",children:"laya \u2014 local System One"}),(0,M.jsx)("option",{value:"none",children:"none \u2014 detectors only"}),(0,M.jsx)("option",{value:"chat",children:"chat \u2014 metered model"})]})}),(0,M.jsx)(Ir,{label:"Base URL",hint:"Same wire for Laya, Jev and TypeSafe \u2014 swapping providers changes only this URL and the model alias.",children:(0,M.jsx)("input",{type:"text",value:String(a.judgeBaseURL),disabled:p,onChange:u=>m("judgeBaseURL",u.target.value)})}),(0,M.jsx)(Ir,{label:"Model alias",children:(0,M.jsx)("input",{type:"text",value:String(a.systemOneModel),disabled:p,onChange:u=>m("systemOneModel",u.target.value)})}),(0,M.jsx)(Ir,{label:"Threshold",hint:"Score (0\u20133) that earns a human look. Laya scores ~0.5\u20131.4 in practice, so a value at or above 2 means the advisor never fires on its own.",children:(0,M.jsx)("input",{type:"number",step:"0.1",min:"0",max:"3",value:Number(a.judgeThreshold),onChange:u=>m("judgeThreshold",Number(u.target.value))})})]}),(0,M.jsxs)("div",{className:"fl-section",children:[(0,M.jsx)("h3",{className:"fl-section-title",children:"Attention"}),(0,M.jsx)(Ir,{label:"Review budget",hint:"Fraction of steps a human may be asked about, in (0, 1].",children:(0,M.jsx)("input",{type:"number",step:"0.05",min:"0.01",max:"1",value:Number(a.reviewBudget),onChange:u=>m("reviewBudget",Number(u.target.value))})}),(0,M.jsx)(Ir,{label:"Gate mode",hint:"ask prompts you in the composer and here. deny refuses outright \u2014 for unattended and CI runs.",children:(0,M.jsxs)("select",{value:String(a.gateMode),onChange:u=>m("gateMode",u.target.value),children:[(0,M.jsx)("option",{value:"ask",children:"ask \u2014 prompt a human"}),(0,M.jsx)("option",{value:"deny",children:"deny \u2014 refuse, never prompt"})]})})]}),(0,M.jsxs)("div",{className:"fl-actions",children:[(0,M.jsx)("button",{type:"button",disabled:s,onClick:()=>{d()},children:s?"Saving\u2026":"Save"}),(0,M.jsx)("button",{type:"button","data-kind":"ghost",disabled:s,onClick:()=>{l()},children:"Reload"})]})]})}function ub({host:t}){let[e,r]=(0,ae.useState)("dashboard"),o=(0,ae.useMemo)(()=>cb(t),[t]);return(0,M.jsxs)("div",{className:"fl-page",children:[(0,M.jsx)(pb,{host:t}),(0,M.jsx)("div",{className:"fl-pagehead",children:(0,M.jsxs)("div",{className:"fl-tabs",role:"tablist",children:[(0,M.jsx)("button",{type:"button",role:"tab","aria-selected":e==="dashboard","data-active":e==="dashboard",onClick:()=>r("dashboard"),children:"Dashboard"}),(0,M.jsx)("button",{type:"button",role:"tab","aria-selected":e==="settings","data-active":e==="settings",onClick:()=>r("settings"),children:"Settings"})]})}),e==="dashboard"?(0,M.jsx)("div",{className:"fl-dashboard",children:(0,M.jsx)(Hu,{source:o})}):(0,M.jsx)(db,{host:t})]})}function pb({host:t}){let[e,r]=(0,ae.useState)(""),[o,i]=(0,ae.useState)(!1),[s,n]=(0,ae.useState)(null),[a,c]=(0,ae.useState)(void 0),l=(0,ae.useMemo)(()=>{let y=t.get("sessions");if(y===void 0)return[];let{ids:S,byId:A}=y.list.getSnapshot();return S.map(I=>A[I]).filter(I=>I!==void 0)},[t,a]),d=qu(l,a,e),{target:m,ambiguous:p,note:u,blocked:h}=d,v=o||h!==void 0,b=(0,ae.useCallback)(async()=>{if(!(m===void 0||e.trim()==="")){i(!0),n(null);try{let y=t.get("remote.session");if(y===void 0){n({kind:"error",text:"the session controller is not available"});return}let S=t.get("remote.featureLoop");try{await S?.labelRun(m.id,e.trim())}catch{}let A=await y.prompt({requestId:globalThis.crypto.randomUUID(),sessionId:m.id,mode:"queue",content:[{type:"text",text:e.trim()}]});if(!A.ok){n({kind:"error",text:A.error.message});return}n({kind:"ok",text:`Running in \u201C${m.displayTitle}\u201D \u2014 the composer has the transcript.`}),r("")}catch(y){n({kind:"error",text:y.message})}finally{i(!1)}}},[t,m,e]);return(0,M.jsxs)("div",{className:"fl-start",children:[(0,M.jsxs)("div",{className:"fl-start-head",children:[(0,M.jsx)("h2",{className:"fl-title",children:"Start a loop"}),(0,M.jsx)("p",{className:"fl-sub",children:"Describe the task. It runs as a normal turn, so the step and cost ceilings, the detectors and the review gate all apply \u2014 and approvals arrive on this page."})]}),p?(0,M.jsxs)("label",{className:"fl-start-session",children:[(0,M.jsx)("span",{className:"fl-start-sessionlabel",children:"Session"}),(0,M.jsx)("select",{value:m?.id??"",onChange:y=>c(y.target.value),children:l.map(y=>(0,M.jsxs)("option",{value:y.id,children:[y.displayTitle,y.running?" (running)":""]},y.id))})]}):null,(0,M.jsxs)("div",{className:"fl-start-row",children:[(0,M.jsx)("input",{className:"fl-start-input",type:"text",value:e,placeholder:"e.g. fix the failing test in test/budget.test.ts","aria-label":"Task to run through the feature loop",onChange:y=>r(y.target.value),onKeyDown:y=>{y.key==="Enter"&&!y.shiftKey&&(y.preventDefault(),b())}}),(0,M.jsx)("button",{type:"button",className:"fl-start-button",disabled:v,onClick:()=>{b()},children:o?"Starting\u2026":"Start loop"})]}),(0,M.jsx)("p",{className:"fl-start-note",children:u}),s===null?null:(0,M.jsx)("p",{className:"fl-start-result","data-kind":s.kind,role:"status",children:s.text})]})}var Ju,mb=()=>Ju??(Ju=T.string()),Qu,hb=()=>Qu??(Qu=T.any()),xo=(t,e)=>({name:t,wire:t,source:"json",codec:{mode:"strict",typeSymbol:e,create:mb}}),fb=(t,e)=>({name:t,wire:t,source:"json",codec:{mode:"strict",typeSymbol:e,create:hb}}),yo={mode:"src-json"},gb={package:"@freepeak/dsh-feature-loop",descriptors:[{id:"@freepeak/dsh-feature-loop#featureLoop/status",service:"featureLoop",namespace:"featureLoop",method:"status",invocation:{kind:"direct"},parameters:[],result:yo},{id:"@freepeak/dsh-feature-loop#featureLoop/live",service:"featureLoop",namespace:"featureLoop",method:"live",invocation:{kind:"direct"},parameters:[],result:yo},{id:"@freepeak/dsh-feature-loop#featureLoop/answer",service:"featureLoop",namespace:"featureLoop",method:"answer",invocation:{kind:"direct"},parameters:[xo("id","string"),xo("outcome","string"),xo("feedback","string")],result:yo},{id:"@freepeak/dsh-feature-loop#featureLoop/save",service:"featureLoop",namespace:"featureLoop",method:"save",invocation:{kind:"direct"},parameters:[fb("settings","object")],result:yo},{id:"@freepeak/dsh-feature-loop#featureLoop/labelRun",service:"featureLoop",namespace:"featureLoop",method:"labelRun",invocation:{kind:"direct"},parameters:[xo("sessionId","string"),xo("task","string")],result:yo}]},vb={inject:["slots","locale","remote"],apply(t){let e=document.createElement("style");e.dataset.plugin="@freepeak/dsh-feature-loop",e.textContent=`${Ku}
${Gu}
${Wu}`,document.head.append(e),t.effect(()=>t.locale.register("featureLoop",{zh:{"featureLoop.panel":"Feature Loop"},en:{"featureLoop.panel":"Feature Loop"}}),"dsh-feature-loop: dictionaries");let r=t.remote.$mount(gb).then(o=>o).catch(o=>{console.error("dsh-feature-loop: remote mount failed",o)});return window.__dshFeatureLoop=Object.freeze({ready:r,call:(o,i,...s)=>{let n=t.get(`remote.${o}`);if(n===void 0)throw new Error(`remote.${o}.${i} not available`);return n[i]?.(...s)}}),t.slots.inject("sidebar.panellist",()=>t.slots.register({name:"sidebar.panellist",id:"feature-loop",order:11,label:"Feature Loop",locale:"featureLoop"},lb)),t.slots.inject("main",()=>t.slots.register({name:"main",key:"feature-loop",locale:"featureLoop"},()=>(0,M.jsx)(ub,{host:t}))),()=>{r.then(o=>o?.()).catch(()=>{})}}};return ip(bb);})();

    return __flPlugin.default || __flPlugin;
  },
});
