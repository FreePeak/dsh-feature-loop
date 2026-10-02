window.__ModuleLoader__.load({
  id: '@freepeak/dsh-feature-loop',
  factory(require) {
"use strict";var __flPlugin=(()=>{var lm=Object.create;var Hr=Object.defineProperty;var cm=Object.getOwnPropertyDescriptor;var dm=Object.getOwnPropertyNames;var um=Object.getPrototypeOf,pm=Object.prototype.hasOwnProperty;var Ua=t=>{throw TypeError(t)};var mm=(t,e,r)=>e in t?Hr(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r;var V=(t=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(t,{get:(e,r)=>(typeof require<"u"?require:e)[r]}):t)(function(t){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+t+'" is not supported')});var hm=(t,e)=>()=>{try{return e||t((e={exports:{}}).exports,e),e.exports}catch(r){throw e=0,r}},Ai=(t,e)=>{for(var r in e)Hr(t,r,{get:e[r],enumerable:!0})},jo=(t,e,r,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of dm(e))!pm.call(t,s)&&s!==r&&Hr(t,s,{get:()=>e[s],enumerable:!(o=cm(e,s))||o.enumerable});return t},F=(t,e,r)=>(jo(t,e,"default"),r&&jo(r,e,"default")),qe=(t,e,r)=>(r=t!=null?lm(um(t)):{},jo(e||!t||!t.__esModule?Hr(r,"default",{value:t,enumerable:!0}):r,t)),fm=t=>jo(Hr({},"__esModule",{value:!0}),t);var h=(t,e,r)=>mm(t,typeof e!="symbol"?e+"":e,r),za=(t,e,r)=>e.has(t)||Ua("Cannot "+r);var kt=(t,e,r)=>(za(t,e,"read from private field"),r?r.call(t):e.get(t)),Xt=(t,e,r)=>e.has(t)?Ua("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,r),Zt=(t,e,r,o)=>(za(t,e,"write to private field"),o?o.call(t,r):e.set(t,r),r);var Sn=hm((Nk,Rr)=>{"use strict";var Vf=typeof Buffer<"u",wc=/"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/,yc=/"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;function xc(t,e,r){r==null&&e!==null&&typeof e=="object"&&(r=e,e=void 0),Vf&&Buffer.isBuffer(t)&&(t=t.toString()),t&&t.charCodeAt(0)===65279&&(t=t.slice(1));let o=JSON.parse(t,e);if(o===null||typeof o!="object")return o;let s=r&&r.protoAction||"error",i=r&&r.constructorAction||"error";if(s==="ignore"&&i==="ignore")return o;if(s!=="ignore"&&i!=="ignore"){if(wc.test(t)===!1&&yc.test(t)===!1)return o}else if(s!=="ignore"&&i==="ignore"){if(wc.test(t)===!1)return o}else if(yc.test(t)===!1)return o;return _c(o,{protoAction:s,constructorAction:i,safe:r&&r.safe})}function _c(t,{protoAction:e="error",constructorAction:r="error",safe:o}={}){let s=[t];for(;s.length;){let i=s;s=[];for(let n of i){if(e!=="ignore"&&Object.prototype.hasOwnProperty.call(n,"__proto__")){if(o===!0)return null;if(e==="error")throw new SyntaxError("Object contains forbidden prototype property");delete n.__proto__}if(r!=="ignore"&&Object.prototype.hasOwnProperty.call(n,"constructor")&&n.constructor!==null&&typeof n.constructor=="object"&&Object.prototype.hasOwnProperty.call(n.constructor,"prototype")){if(o===!0)return null;if(r==="error")throw new SyntaxError("Object contains forbidden prototype property");delete n.constructor}for(let a in n){let l=n[a];l&&typeof l=="object"&&s.push(l)}}}return t}function _n(t,e,r){let{stackTraceLimit:o}=Error;Error.stackTraceLimit=0;try{return xc(t,e,r)}finally{Error.stackTraceLimit=o}}function Uf(t,e){let{stackTraceLimit:r}=Error;Error.stackTraceLimit=0;try{return xc(t,e,{safe:!0})}catch{return}finally{Error.stackTraceLimit=r}}Rr.exports=_n;Rr.exports.default=_n;Rr.exports.parse=_n;Rr.exports.safeParse=Uf;Rr.exports.scan=_c});var _y={};Ai(_y,{default:()=>xy});var ue=V("react");function Re(t){return t==null}function Vo(t){return t&&typeof t=="object"&&!Array.isArray(t)}function qa(t,e){return Object.fromEntries(Object.entries(t).filter(([r,o])=>e(r,o)))}function It(t,e){return Object.fromEntries(Object.entries(t).map(([r,o])=>[r,e(o,r)]))}function Ga(t,e,r){if(!e)return{...t};let o={};for(let s of e)(r||t[s]!==void 0)&&(o[s]=t[s]);return o}var Wa=Symbol.for("cosmokit.volatile.write");function Mi(t,e=new Set){if(typeof t=="function")throw new TypeError("volatile config cannot contain functions");if(t===null||typeof t!="object")return t;if(e.has(t))throw new TypeError("volatile config cannot contain cycles");e.add(t);try{if(Array.isArray(t))return Object.freeze(t.map(r=>Mi(r,e)));if(Object.getPrototypeOf(t)!==Object.prototype&&Object.getPrototypeOf(t)!==null)throw new TypeError("volatile config objects must be plain objects or arrays");return Object.freeze(Object.fromEntries(Object.entries(t).map(([r,o])=>[r,Mi(o,e)])))}finally{e.delete(t)}}function Pi(t){let e=Mi(t);return Object.freeze({get:()=>e,[Wa]:r=>{e=r}})}function vr(t){return typeof t=="object"&&t!==null&&Wa in t}function Nt(t,e){return arguments.length===1?r=>Nt(t,r):t in globalThis&&e instanceof globalThis[t]||Object.prototype.toString.call(e).slice(8,-1)===t}function Uo(t){return Nt("ArrayBuffer",t)||Nt("SharedArrayBuffer",t)}function gm(t){return Uo(t)||ArrayBuffer.isView(t)}var at;(function(t){t.is=Uo,t.isSource=gm;function e(n){return ArrayBuffer.isView(n)?n.buffer.slice(n.byteOffset,n.byteOffset+n.byteLength):n}t.fromSource=e;function r(n){if(n=e(n),typeof Buffer<"u")return Buffer.from(n).toString("base64");let a="",l=new Uint8Array(n);for(let c=0;c<l.byteLength;c++)a+=String.fromCharCode(l[c]);return btoa(a)}t.toBase64=r;function o(n){return typeof Buffer<"u"?e(Buffer.from(n,"base64")):Uint8Array.from(atob(n),a=>a.charCodeAt(0))}t.fromBase64=o;function s(n){return n=e(n),typeof Buffer<"u"?Buffer.from(n).toString("hex"):Array.from(new Uint8Array(n),a=>a.toString(16).padStart(2,"0")).join("")}t.toHex=s;function i(n){if(typeof Buffer<"u")return e(Buffer.from(n,"hex"));let a=n.length%2===0?n:n.slice(0,n.length-1),l=[];for(let c=0;c<a.length;c+=2)l.push(parseInt(`${a[c]}${a[c+1]}`,16));return Uint8Array.from(l).buffer}t.fromHex=i})(at||(at={}));var Ty=at.fromBase64,ky=at.toBase64,Iy=at.fromHex,Cy=at.toHex;function Fo(t,e=new Map){if(!t||typeof t!="object")return t;if(Nt("Date",t))return new Date(t.valueOf());if(Nt("RegExp",t))return new RegExp(t.source,t.flags);if(Uo(t))return t.slice(0);if(ArrayBuffer.isView(t))return t.buffer.slice(t.byteOffset,t.byteOffset+t.byteLength);let r=e.get(t);if(r)return r;if(Array.isArray(t)){let s=[];return e.set(t,s),t.forEach((i,n)=>{s[n]=Reflect.apply(Fo,null,[i,e])}),s}let o=Object.create(Object.getPrototypeOf(t));e.set(t,o);for(let s of Reflect.ownKeys(t)){let i={...Reflect.getOwnPropertyDescriptor(t,s)};"value"in i&&(i.value=Reflect.apply(Fo,null,[i.value,e])),Reflect.defineProperty(o,s,i)}return o}function zo(t,e,r){let o=new Set;function s(i,n){if(i===n)return!0;if(vr(i)||vr(n))return vr(i)&&vr(n);if(!r&&Re(i)&&Re(n))return!0;if(typeof i!=typeof n||typeof i!="object"||!i||!n||o.has(i))return!1;function a(l,c){return l(i)?l(n)?c(i,n):!1:l(n)?!1:void 0}o.add(i);try{return a(Array.isArray,(l,c)=>{if(l.length!==c.length)return!1;for(let d=0;d<l.length;d++)if(!s(l[d],c[d]))return!1;return!0})??a(Nt("Date"),(l,c)=>l.valueOf()===c.valueOf())??a(Nt("URL"),(l,c)=>l.href===c.href)??a(Nt("RegExp"),(l,c)=>l.source===c.source&&l.flags===c.flags)??a(Uo,(l,c)=>{if(l.byteLength!==c.byteLength)return!1;let d=new Uint8Array(l),u=new Uint8Array(c);for(let m=0;m<d.length;m++)if(d[m]!==u[m])return!1;return!0})??((!r||[i,n].every(l=>Object.getPrototypeOf(l)===Object.prototype||Object.getPrototypeOf(l)===null))&&Object.keys({...i,...n}).every(l=>s(i[l],n[l])))}finally{o.delete(i)}}return s(t,e)}var Ha;(function(t){t.millisecond=1,t.second=1e3,t.minute=t.second*60,t.hour=t.minute*60,t.day=t.hour*24,t.week=t.day*7;let e=new Date().getTimezoneOffset();function r(p){e=p}t.setTimezoneOffset=r;function o(){return e}t.getTimezoneOffset=o;function s(p=new Date,f){return typeof p=="number"&&(p=new Date(p)),f===void 0&&(f=e),Math.floor((p.valueOf()/t.minute-f)/1440)}t.getDateNumber=s;function i(p,f){let g=new Date(p*t.day);return f===void 0&&(f=e),new Date(+g+f*t.minute)}t.fromDateNumber=i;let n=/\d+(?:\.\d+)?/.source,a=new RegExp(`^${["w(?:eek(?:s)?)?","d(?:ay(?:s)?)?","h(?:our(?:s)?)?","m(?:in(?:ute)?(?:s)?)?","s(?:ec(?:ond)?(?:s)?)?"].map(p=>`(${n}${p})?`).join("")}$`);function l(p){let f=a.exec(p);return f?(parseFloat(f[1])*t.week||0)+(parseFloat(f[2])*t.day||0)+(parseFloat(f[3])*t.hour||0)+(parseFloat(f[4])*t.minute||0)+(parseFloat(f[5])*t.second||0):0}t.parseTime=l;function c(p){let f=l(p);return f?p=Date.now()+f:/^\d{1,2}(:\d{1,2}){1,2}$/.test(p)?p=`${new Date().toLocaleDateString()}-${p}`:/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(p)&&(p=`${new Date().getFullYear()}-${p}`),p?new Date(p):new Date}t.parseDate=c;function d(p){let f=Math.abs(p);return f>=t.day-t.hour/2?Math.round(p/t.day)+"d":f>=t.hour-t.minute/2?Math.round(p/t.hour)+"h":f>=t.minute-t.second/2?Math.round(p/t.minute)+"m":f>=t.second?Math.round(p/t.second)+"s":p+"ms"}t.format=d;function u(p,f=2){return p.toString().padStart(f,"0")}t.toDigits=u;function m(p,f=new Date){return p.replace("yyyy",f.getFullYear().toString()).replace("yy",f.getFullYear().toString().slice(2)).replace("MM",u(f.getMonth()+1)).replace("dd",u(f.getDate())).replace("hh",u(f.getHours())).replace("mm",u(f.getMinutes())).replace("ss",u(f.getSeconds())).replace("SSS",u(f.getMilliseconds(),3))}t.template=m})(Ha||(Ha={}));var Gr=Symbol.for("schemastery"),Qa=Symbol.for("ValidationError");globalThis.__schemastery_index__??(globalThis.__schemastery_index__=0);globalThis.__schemastery_refs__=void 0;var J=class extends TypeError{constructor(e,r){let o="$";for(let s of r.path||[])typeof s=="string"?o+="."+s:typeof s=="number"?o+="["+s+"]":typeof s=="symbol"&&(o+=`[Symbol(${s.toString()})]`);o.startsWith(".")&&(o=o.slice(1));super((o==="$"?"":`${o} `)+e);h(this,"options");h(this,"name","ValidationError");this.options=r}static is(e){return!!e?.[Qa]}};Object.defineProperty(J.prototype,Qa,{value:!0});var E=function(t){let e=function(r,o={}){return E.resolve(r,e,o)[0]};if(t.refs){let r=It(t.refs,s=>new E(s)),o=s=>r[s];for(let s in r){let i=r[s];i.sKey=o(i.sKey),i.inner=o(i.inner),i.list=i.list&&i.list.map(o),i.dict=i.dict&&It(i.dict,o)}return r[t.uid]}if(Object.assign(e,t),typeof e.callback=="string")try{e.callback=new Function("return "+e.callback)()}catch{}return Object.defineProperty(e,"uid",{value:globalThis.__schemastery_index__++}),Object.setPrototypeOf(e,E.prototype),e.meta||(e.meta={}),e.toString=e.toString.bind(e),e};E.prototype=Object.create(Function.prototype);E.prototype[Gr]=!0;Object.defineProperty(E.prototype,"~standard",{get(){return{version:1,vendor:"schemastery",validate:t=>{try{return{value:E.resolve(t,this,{})[0]}}catch(e){if(J.is(e))return{issues:[{message:e.message,path:e.options.path}]};throw e}}}}});E.ValidationError=J;E.prototype.toJSON=function(){var r,o;if(globalThis.__schemastery_refs__)return(r=globalThis.__schemastery_refs__)[o=this.uid]??(r[o]=JSON.parse(JSON.stringify({...this}))),this.uid;globalThis.__schemastery_refs__={[this.uid]:{...this}},globalThis.__schemastery_refs__[this.uid]=JSON.parse(JSON.stringify({...this}));let e={uid:this.uid,refs:globalThis.__schemastery_refs__};return globalThis.__schemastery_refs__=void 0,e};E.prototype.set=function(e,r){return this.dict[e]=r,this};E.prototype.push=function(e){return this.list.push(e),this};function vm(t,e){let r=typeof t=="string"?{"":t}:{...t};for(let o in e){let s=e[o];s?.$description||s?.$desc?r[o]=s.$description||s.$desc:typeof s=="string"&&(r[o]=s)}return r}function qr(t){return t?.$value??t?.$inner}function Ka(t){return qa(t??{},e=>!e.startsWith("$"))}E.prototype.i18n=function(e){let r=E(this),o=vm(r.meta.description,e);return Object.keys(o).length&&(r.meta.description=o),r.dict&&(r.dict=It(r.dict,(s,i)=>s.i18n(It(e,n=>qr(n)?.[i]??n?.[i])))),r.list&&(r.list=r.list.map((s,i)=>s.i18n(It(e,(n={})=>Array.isArray(qr(n))?qr(n)[i]:Array.isArray(n)?n[i]:Ka(n))))),r.inner&&(r.inner=r.inner.i18n(It(e,s=>qr(s)?qr(s):Ka(s)))),r.sKey&&(r.sKey=r.sKey.i18n(It(e,s=>s?.$key))),r};E.prototype.extra=function(e,r){let o=E(this);return o.meta={...o.meta,[e]:r},o};for(let t of["required","disabled","collapse","hidden","loose"])Object.assign(E.prototype,{[t](e=!0){let r=E(this);return r.meta={...r.meta,[t]:e},r}});E.prototype.deprecated=function(){var r;let e=E(this);return(r=e.meta).badges||(r.badges=[]),e.meta.badges.push({text:"deprecated",type:"danger"}),e};E.prototype.experimental=function(){var r;let e=E(this);return(r=e.meta).badges||(r.badges=[]),e.meta.badges.push({text:"experimental",type:"warning"}),e};E.prototype.pattern=function(e){let r=E(this),o=Ga(e,["source","flags"]);return r.meta={...r.meta,pattern:o},r};E.prototype.simplify=function(e){if(vr(e)&&(e=e.get()),zo(e,this.meta.default,this.type==="dict"))return null;if(Re(e))return e;if(this.type==="object"||this.type==="dict"){let r={};for(let o in e){let s=(this.type==="object"?this.dict[o]:this.inner)?.simplify(e[o]);(this.type==="dict"||!Re(s))&&(r[o]=s)}return zo(r,this.meta.default,this.type==="dict")?null:r}else if(this.type==="array"||this.type==="tuple"){let r=[];return e.forEach((o,s)=>{let i=this.type==="array"?this.inner:this.list[s],n=i?i.simplify(o):o;r.push(n)}),r}else if(this.type==="intersect"){let r={};for(let o of this.list)Object.assign(r,o.simplify(e));return r}else if(this.type==="union")for(let r of this.list)try{return E.resolve(e,r,{}),r.simplify(e)}catch{}return e};E.prototype.toString=function(e){return Xa[this.type]?.(this,e)??`Schema<${this.type}>`};E.prototype.role=function(t,e){let r=E(this);return r.meta={...r.meta,role:t,extra:e},r};for(let t of["default","link","comment","description","max","min","step"])Object.assign(E.prototype,{[t](e){let r=E(this);return r.meta={...r.meta,[t]:e},r}});E.prototype.volatile=function(){if(this.meta.volatile)throw new TypeError("volatile schema is already wrapped");return this.extra("volatile",!0)};var Ya={},Ja=Symbol("checked-volatile-schema");function br(t,e=[],r=!1,o=new Map){let s=o.get(t)??new Set;if(s.has(r))return;if(s.add(r),o.set(t,s),t.meta?.volatile&&r)throw new J("volatile fields require a fixed object path without an enclosing volatile field",{path:e});let i=r||!!t.meta?.volatile;if(t.dict)for(let[n,a]of Object.entries(t.dict))br(a,[...e,n],i,o);if(t.sKey&&br(t.sKey,[...e,"<key>"],!0,o),t.inner&&(t.type!=="lazy"||t.inner[Gr])&&br(t.inner,[...e,"*"],!0,o),t.list)for(let n=0;n<t.list.length;n++)br(t.list[n],[...e,String(n)],!0,o)}E.extend=function(e,r){Ya[e]=r};E.resolve=function(e,r,o={},s=!1){if(!r)return[e];if(o[Ja]||(br(r,o.path),o={...o,[Ja]:!0}),r.meta?.volatile){let n=E(r);n.meta={...r.meta,volatile:!1};let[a,l]=E.resolve(e,n,o,s);try{return[Pi(a),l]}catch(c){throw new J(c instanceof Error?c.message:String(c),o)}}if(o.ignore?.(e,r))return[e];if(Re(e)&&r.type!=="lazy"){if(r.meta.required)throw new J("missing required value",o);let n=r,a=r.meta.default;for(;n?.type==="intersect"&&Re(a);)n=n.list[0],a=n?.meta.default;if(Re(a))return[e];e=Fo(a)}let i=Ya[r.type];if(!i)throw new J(`unsupported type "${r.type}"`,o);try{return i(e,r,o,s)}catch(n){if(!r.meta.loose)throw n;return[r.meta.default]}};E.from=function(e){if(Re(e))return E.any();if(["string","number","boolean"].includes(typeof e))return E.const(e).required();if(e[Gr])return e;if(typeof e=="function")switch(e){case String:return E.string().required();case Number:return E.number().required();case Boolean:return E.boolean().required();case Function:return E.function().required();default:return E.is(e).required()}else throw new TypeError(`cannot infer schema from ${e}`)};E.lazy=function(e){let r=()=>(o.inner[Gr]||(o.inner=o.builder(),o.inner.meta={...o.meta,...o.inner.meta}),o.inner.toJSON()),o=new E({type:"lazy",builder:e,inner:{toJSON:r}});return o};E.natural=function(){return E.number().step(1).min(0)};E.percent=function(){return E.number().step(.01).min(0).max(1).role("slider")};E.date=function(){return E.union([E.is(Date),E.transform(E.string().role("datetime"),(e,r)=>{let o=new Date(e);if(isNaN(+o))throw new J(`invalid date "${e}"`,r);return o},!0)])};E.regExp=function(e=""){return E.union([E.is(RegExp),E.transform(E.string().role("regexp",{flag:e}),(r,o)=>{try{return new RegExp(r,e)}catch(s){throw new J(s.message,o)}},!0)])};E.arrayBuffer=function(e){return E.union([E.is(ArrayBuffer),E.is(SharedArrayBuffer),E.transform(E.any(),(r,o)=>{if(at.isSource(r))return at.fromSource(r);throw new J(`expected ArrayBufferSource but got ${r}`,o)},!0),...e?[E.transform(E.string(),(r,o)=>{try{return e==="base64"?at.fromBase64(r):at.fromHex(r)}catch(s){throw new J(s.message,o)}},!0)]:[]])};E.extend("lazy",(t,e,r,o)=>(e.inner[Gr]||(e.inner=e.builder(),e.inner.meta={...e.meta,...e.inner.meta},br(e.inner,r.path,!0)),E.resolve(t,e.inner,r,o)));E.extend("any",t=>[t]);E.extend("never",(t,e,r)=>{throw new J(`expected nullable but got ${t}`,r)});E.extend("const",(t,{value:e},r)=>{if(zo(t,e))return[e];throw new J(`expected ${e} but got ${t}`,r)});function Ni(t,e,r,o,s=!1){let{max:i=1/0,min:n=-1/0}=e;if(t>i)throw new J(`expected ${r} <= ${i} but got ${t}`,o);if(t<n&&!s)throw new J(`expected ${r} >= ${n} but got ${t}`,o)}E.extend("string",(t,{meta:e},r)=>{if(typeof t!="string")throw new J(`expected string but got ${t}`,r);if(e.pattern){let o=new RegExp(e.pattern.source,e.pattern.flags);if(!o.test(t))throw new J(`expect string to match regexp ${o}`,r)}return Ni(t.length,e,"string length",r),[t]});function Oi(t,e){let r=t.toString();if(r.includes("e"))return t*Math.pow(10,e);let o=r.indexOf(".");if(o===-1)return t*Math.pow(10,e);let s=r.slice(o+1),i=r.slice(0,o);return s.length<=e?+(i+s.padEnd(e,"0")):+(i+s.slice(0,e)+"."+s.slice(e))}function bm(t,e,r){if(r=Math.abs(r),!/^\d+\.\d+$/.test(r.toString()))return(t-e)%r===0;let o=r.toString().indexOf("."),s=r.toString().slice(o+1).length;return Math.abs(Oi(t,s)-Oi(e,s))%Oi(r,s)===0}E.extend("number",(t,{meta:e},r)=>{if(typeof t!="number")throw new J(`expected number but got ${t}`,r);Ni(t,e,"number",r);let{step:o}=e;if(o&&!bm(t,e.min??0,o))throw new J(`expected number multiple of ${o} but got ${t}`,r);return[t]});E.extend("boolean",(t,e,r)=>{if(typeof t=="boolean")return[t];throw new J(`expected boolean but got ${t}`,r)});E.extend("bitset",(t,{bits:e,meta:r},o)=>{let s=0,i=[];if(typeof t=="number"){s=t;for(let n in e)t&e[n]&&i.push(n)}else if(Array.isArray(t)){i=t;for(let n of i){if(typeof n!="string")throw new J(`expected string but got ${n}`,o);n in e&&(s|=e[n])}}else throw new J(`expected number or array but got ${t}`,o);return s===r.default?[s]:[s,i]});E.extend("function",(t,e,r)=>{if(typeof t=="function")return[t];throw new J(`expected function but got ${t}`,r)});E.extend("is",(t,{constructor:e},r)=>{if(typeof e=="function"){if(t instanceof e)return[t];throw new J(`expected ${e.name} but got ${t}`,r)}else{if(Re(t))throw new J(`expected ${e} but got ${t}`,r);let o=Object.getPrototypeOf(t);for(;o;){if(o.constructor?.name===e)return[t];o=Object.getPrototypeOf(o)}throw new J(`expected ${e} but got ${t}`,r)}});function Ho(t,e,r,o){try{let[s,i]=E.resolve(t[e],r,{...o,path:[...o.path||[],e]});return i!==void 0&&(t[e]=i),s}catch(s){if(!o?.autofix)throw s;return delete t[e],r.meta.volatile?Pi(r.meta.default):r.meta.default}}E.extend("array",(t,{inner:e,meta:r},o)=>{if(!Array.isArray(t))throw new J(`expected array but got ${t}`,o);return Ni(t.length,r,"array length",o,!Re(e.meta.default)),[t.map((s,i)=>Ho(t,i,e,o))]});E.extend("dict",(t,{inner:e,sKey:r},o,s)=>{if(!Vo(t))throw new J(`expected object but got ${t}`,o);let i={};for(let n in t){let a;try{a=E.resolve(n,r,o)[0]}catch(l){if(s)continue;throw l}i[a]=Ho(t,n,e,o),t[a]=t[n],n!==a&&delete t[n]}return[i]});E.extend("tuple",(t,{list:e},r,o)=>{if(!Array.isArray(t))throw new J(`expected array but got ${t}`,r);let s=e.map((i,n)=>Ho(t,n,i,r));return o?[s]:(s.push(...t.slice(e.length)),[s])});function Di(t,e){for(let r in e)r in t||(t[r]=e[r])}E.extend("object",(t,{dict:e},r,o)=>{if(!Vo(t))throw new J(`expected object but got ${t}`,r);let s={};for(let i in e){let n=Ho(t,i,e[i],r);(!Re(n)||i in t)&&(s[i]=n)}return o||Di(s,t),[s]});E.extend("union",(t,{list:e,toString:r},o,s)=>{let i=[];for(let n of e)try{return E.resolve(t,n,o,s)}catch(a){i.push(a)}throw new J(`expected ${r()} but got ${JSON.stringify(t)}`,o)});E.extend("intersect",(t,{list:e,toString:r},o,s)=>{if(!e.length)return[t];let i;for(let n of e){let a=E.resolve(t,n,o,!0)[0];if(!Re(a))if(Re(i))i=a;else{if(typeof i!=typeof a)throw new J(`expected ${r()} but got ${JSON.stringify(t)}`,o);if(typeof a=="object")Di(i??(i={}),a);else if(i!==a)throw new J(`expected ${r()} but got ${JSON.stringify(t)}`,o)}}return!s&&Vo(t)&&Di(i,t),[i]});E.extend("transform",(t,{inner:e,callback:r,preserve:o},s)=>{let[i,n=t]=E.resolve(t,e,s,!0);return o?[r(i)]:[r(i),r(n)]});var Xa={};function ge(t,e,r){Xa[t]=r,Object.assign(E,{[t](...o){let s=new E({type:t});return e.forEach((i,n)=>{switch(i){case"sKey":s.sKey=o[n]??E.string();break;case"inner":s.inner=E.from(o[n]);break;case"list":s.list=o[n].map(E.from);break;case"dict":s.dict=It(o[n],E.from);break;case"bits":s.bits={};for(let a in o[n])typeof o[n][a]=="number"&&(s.bits[a]=o[n][a]);break;case"callback":{let a=s.callback=o[n];a.toJSON||(a.toJSON=()=>a.toString());break}case"constructor":{let a=s.constructor=o[n];typeof a=="function"&&(a.toJSON||(a.toJSON=()=>a.name));break}default:s[i]=o[n]}}),t==="object"||t==="dict"?s.meta.default={}:t==="array"||t==="tuple"?s.meta.default=[]:t==="bitset"&&(s.meta.default=0),s}})}ge("is",["constructor"],({constructor:t})=>typeof t=="function"?t.name:t);ge("any",[],()=>"any");ge("never",[],()=>"never");ge("const",["value"],({value:t})=>typeof t=="string"?JSON.stringify(t):t);ge("string",[],()=>"string");ge("number",[],()=>"number");ge("boolean",[],()=>"boolean");ge("bitset",["bits"],()=>"bitset");ge("function",[],()=>"function");ge("array",["inner"],({inner:t})=>`${t.toString(!0)}[]`);ge("dict",["inner","sKey"],({inner:t,sKey:e})=>`{ [key: ${e.toString()}]: ${t.toString()} }`);ge("tuple",["list"],({list:t})=>`[${t.map(e=>e.toString()).join(", ")}]`);ge("object",["dict"],({dict:t})=>Object.keys(t).length===0?"{}":`{ ${Object.entries(t).map(([e,r])=>`${e}${r.meta.required?"":"?"}: ${r.toString()}`).join(", ")} }`);ge("union",["list"],({list:t},e)=>{let r=t.map(({toString:o})=>o()).join(" | ");return e?`(${r})`:r});ge("intersect",["list"],({list:t})=>`${t.map(e=>e.toString(!0)).join(" & ")}`);ge("transform",["inner","callback","preserve"],({inner:t},e)=>t.toString(e));var Q=qe(V("react"),1);var wr=null;function Za(t,e){t.currentIndex=0,t.wipContextDeps=null,t.wipCommitCallbacks=[];let r=wr;wr=t;try{if(e(),t.isFirstRender=!1,t.cells.length!==t.currentIndex)throw new Error(`Rendered ${t.currentIndex} hooks but expected ${t.cells.length}. Hooks must be called in the exact same order in every render.`)}finally{wr=r}}function ie(){if(!wr)throw new Error("No resource fiber available");return wr}function xe(){return wr}var te=typeof process<"u"&&!1;var qo=t=>({version:0,committedVersion:0,dispatchUpdate:t,changelog:[],committedLog:[],unsettledCount:0,rollbackCallbacks:[]}),Wr=t=>{t.committedVersion=t.version;for(let e of t.changelog)e.logged=!1,e.settled||(e.settled=!0,t.unsettledCount--),t.committedLog.push(e);t.changelog.length=0,t.unsettledCount===0&&(t.committedLog.length=0),t.rollbackCallbacks.length=0},er=(t,e)=>{let r=t.version>e;if(t.version=e,r){for(let o=0;o<t.rollbackCallbacks.length;o++)t.rollbackCallbacks[o]();if(t.rollbackCallbacks.length=0,e<=t.committedVersion){let o=[];for(;t.committedVersion-o.length>e;){let s=t.committedLog.pop();if(s===void 0){if(te)throw new Error("tap: committed history is shorter than the replay base.");break}Go(s.fiber,s.cell),s.cell.workInProgress=s.prevState,o.push({record:s,prevState:s.prevState,eagerState:s.eagerState,hasEagerState:s.hasEagerState})}if(o.length>0){let s=t.committedVersion;yr(t,()=>{for(let i=o.length-1;i>=0;i--){let n=o[i];n.record.prevState=n.prevState,n.record.eagerState=n.eagerState,n.record.hasEagerState=n.hasEagerState,t.committedLog.push(n.record)}t.committedVersion=s})}t.committedVersion=e;for(let s of t.changelog)s.logged=!1;t.changelog.length=0}else{for(;t.committedVersion+t.changelog.length>e;)t.changelog.pop().logged=!1;for(let o=0;o<t.changelog.length;o++)Bi(t.changelog[o]);Wr(t)}}},Bi=t=>{var e;Go(t.fiber,t.cell),t.queued||(t.queued=!0,((e=t.cell).queue??(e.queue=[])).push(t))},bt=(t,e)=>{t.wipCommitCallbacks.push(e)},yr=(t,e)=>{t.rollbackCallbacks.push(e)},Go=(t,e)=>{e.isDirty||(e.isDirty=!0,t.markDirty?.(),yr(t.root,()=>{if(e.queue!==null){for(let r of e.queue)r.queued=!1;e.queue=null}e.workInProgress=e.current,e.isDirty=!1}))};var Li=Symbol.for("react.memo_cache_sentinel"),$i=t=>new Array(t).fill(Li),wm=(t,e)=>{let r=t.memoCache,o=r.workInProgress;if(o===null){let n=r.current;o=n===null?[]:n.map(a=>a.slice()),r.workInProgress=o,yr(t.root,()=>{r.workInProgress=null})}let s=r.index++,i=o[s];return i===void 0?(i=$i(e),o[s]=i):te&&i.length!==e&&console.error(`Expected a constant size argument for each invocation of c(). The previous cache was allocated with size ${i.length} but size ${e} was requested.`),i},Wo=t=>wm(ie(),t);var Ko=qe(V("react"),1),ym=Ko.default,xm=t=>(0,Ko.useMemo)(()=>{let e=$i(t);return e[Li]=!0,e},[]),el=ym.__COMPILER_RUNTIME?.c??xm;var _m=()=>xe()!==null,v=t=>_m()?Wo(t):el(t);var ve=(t,...e)=>Object.assign(Object.create(null),t,...e);var k={};Ai(k,{Children:()=>Lm,Fragment:()=>Ki,Suspense:()=>$m,cloneElement:()=>Qi,createContext:()=>ae,createElement:()=>Ji,default:()=>Tr.default,forwardRef:()=>ne,isValidElement:()=>Yr,lazy:()=>Bm,memo:()=>se,use:()=>rr,useCallback:()=>Ft,useContext:()=>Ke,useDebugValue:()=>Gi,useDeferredValue:()=>jm,useEffect:()=>N,useEffectEvent:()=>Qr,useId:()=>Nm,useImperativeHandle:()=>Wi,useInsertionEffect:()=>lt,useLayoutEffect:()=>We,useMemo:()=>K,useReducer:()=>qi,useRef:()=>U,useState:()=>j,useSyncExternalStore:()=>xt});var Bt=()=>{throw new Error("Rendered more hooks than during the previous render. Hooks must be called in the exact same order in every render.")},Lt=()=>{throw new Error("Hook order changed between renders")};var Sm=t=>({type:t,setup:void 0,setupDeps:void 0,cleanup:void 0,deps:null,generation:0});function ji(t,e,r){let o=ie(),s=o.currentIndex++,i=o.cells[s],n=i===void 0?Sm(r):i.type===r?i:Lt();if(i===void 0&&(o.isFirstRender||Bt(),o.cells[s]=n,r==="insertion"?(o.insertionCells??(o.insertionCells=[])).push(n):o.effectCells.push(n)),n.deps!==null&&!!e!=!!n.deps)throw new Error("useEffect called with and without dependencies across re-renders");bt(o,()=>{n.setup=t,n.setupDeps=e,n.generation++})}function Ae(t,e){ji(t,e,"effect")}var wt=(t,e)=>{te&&t.length!==e.length&&console.error(`The final argument passed to a hook changed size between renders. The order and size of this array must remain constant.

Previous: [${t.join(", ")}]
Incoming: [${e.join(", ")}]`);for(let r=0;r<t.length&&r<e.length;r++)if(!Object.is(t[r],e[r]))return!1;return!0};var tl=(t,e)=>{bt(t,()=>{e.current=e.wip,e.currentDeps=e.wipDeps,e.isDirty=!1})},$t=(t,e)=>{let r=ie(),o=r.currentIndex++,s=r.cells[o];if(s===void 0){r.isFirstRender||Bt();let a=t();return te&&r.devStrictMode&&t(),s={type:"memo",current:a,currentDeps:e,wip:a,wipDeps:e,isDirty:!1},r.cells[o]=s,a}s.type!=="memo"&&Lt();let i=s;if(wt(i.wipDeps,e))return i.isDirty&&tl(r,i),i.wip;let n=t();return te&&r.devStrictMode&&t(),i.wip=n,i.wipDeps=e,i.isDirty||(i.isDirty=!0,yr(r.root,()=>{i.wip=i.current,i.wipDeps=i.currentDeps,i.isDirty=!1})),tl(r,i),n};function Ge(t){return $t(()=>({current:t}),[])}var Fi=Symbol("tap.Context.defaultValue"),Tm=t=>t,yt=new Map,tr=new Set,rl=()=>new Map(yt),Jo=(t,e)=>{let r=yt;yt=t;try{return e()}finally{yt=r}},Vi=(t,e)=>{t[Fi]=e},ol=t=>typeof t=="object"&&t!==null&&Fi in t,sl=t=>typeof t=="object"&&t!==null&&"$$typeof"in t&&t.$$typeof===Symbol.for("react.context"),Ui=t=>ol(t)||sl(t),il=t=>{if(!ol(t)){if(sl(t)){Vi(t,t._currentValue??t._currentValue2);return}throw new Error("A tap resource's `use()` only accepts a tap context.")}},Ct=(t,e,r)=>{if(typeof t!="object"||t===null)throw new Error("useContextProvider only accepts a React context.");il(t);let o=t,s=ie(),i=Ge(void 0),n=i.current===void 0||!Object.is(i.current.value,e);Ae(()=>{i.current={value:e}},[e]);let a=yt.get(o),l=a!==void 0||yt.has(o);yt.set(o,{value:e,source:s});try{return km(o,n,r)}finally{l?yt.set(o,a):yt.delete(o)}},km=(t,e,r)=>{let o=tr.has(t);e?tr.add(t):tr.delete(t);try{return r()}finally{o?tr.add(t):tr.delete(t)}},Qo=t=>{il(t);let e=t,r=Im(e,t),o=ie();return(o.wipContextDeps??(o.wipContextDeps=new Map)).set(e,r.source),r.value},Im=(t,e)=>yt.get(t)??{value:Tm(e)[Fi],source:null},Cm=(t,e,r,o)=>{if(!o)return r;let s=r;for(let[i,n]of o)n===e||n===t||(s??(s=new Map)).set(i,n);return s},Yo=(t,e=t.wipContextDeps)=>{let r=xe();!r||!e||(r.wipContextDeps=Cm(r,t,r.wipContextDeps,e))},zi=()=>tr.size>0,Kr=t=>{if(!t.contextDeps||!zi())return!1;for(let e of tr.keys())if(t.contextDeps.has(e))return!0;return!1};var Em=(t,e,r)=>{if(t.isNeverMounted)throw new Error("Resource updated before mount");let o=!1,s=!0;t.root.unsettledCount++,t.root.dispatchUpdate(()=>(o||(o=!0,r&&t.root.changelog.length===0&&!e.cell.isDirty&&!e.hasEagerState&&(e.prevState=e.cell.workInProgress,e.eagerState=r(e.cell.workInProgress,e.action),e.hasEagerState=!0,s=!Object.is(e.cell.current,e.eagerState),!s&&!e.settled&&(e.settled=!0,t.root.unsettledCount--))),s),()=>(o=!0,s=!0,Bi(e),e.logged||(e.logged=!0,t.root.changelog.push(e)),!0))},Rm=(t,e,r,o,s)=>{let i=o?o(r):r;te&&t.devStrictMode&&o&&o(r);let n={type:"reducer",workInProgress:i,current:i,isDirty:!1,queue:null,renderQueue:null,reducer:e,dispatch:a=>{let l=xe();if(l!==null){if(l!==t)throw new Error("Cannot update a resource while rendering a different resource.");(t.renderPendingCells??(t.renderPendingCells=new Set)).add(n),(n.renderQueue??(n.renderQueue=[])).push(a)}else{let c={fiber:t,cell:n,action:a,hasEagerState:!1,eagerState:void 0,prevState:n.current,settled:!1,queued:!1,logged:!1};Em(t,c,s?e:void 0)}}};return n};function Hi(t,e,r,o){let s=ie(),i=s.currentIndex++,n=s.cells[i],a=(()=>{if(n!==void 0)return n.type==="reducer"?n:Lt();s.isFirstRender||Bt();let c=Rm(s,t,e,r,o);return s.cells[i]=c,c})(),l=a.queue;if(l!==null){let c=t===a.reducer;for(let d=0;d<l.length;d++){let u=l[d];!u.hasEagerState||!c||!Object.is(u.prevState,a.workInProgress)?(u.prevState=a.workInProgress,u.eagerState=t(a.workInProgress,u.action),u.hasEagerState=!0,te&&s.devStrictMode&&(u.eagerState=t(a.workInProgress,u.action))):te&&s.devStrictMode&&t(a.workInProgress,u.action),u.queued=!1,a.workInProgress=u.eagerState}a.queue=null}if(a.reducer=t,a.renderQueue!==null){let c=a.workInProgress;for(let d of a.renderQueue)c=t(c,d);a.renderQueue=null,s.renderPendingCells?.delete(a),Object.is(c,a.workInProgress)||(Go(s,a),a.workInProgress=c)}return a.isDirty&&bt(s,()=>{a.current=a.workInProgress,a.isDirty=!1}),[a.workInProgress,a.dispatch]}function xr(t,e,r){return Hi(t,e,r,!1)}var Am=(t,e)=>typeof e=="function"?e(t):e,Mm=t=>t===void 0?void 0:typeof t=="function"?t():t;function Xo(t){return Hi(Am,t,Mm,!0)}var _r=(t,e)=>$t(()=>t,e);function Zo(t,e){ji(t,e,"insertion")}function Sr(t){let e=ie(),r=Ge(t);return r.current!==t&&bt(e,()=>{r.current=t}),_r(((...o)=>{if(te&&xe())throw new Error("useEffectEvent cannot be called during render");return r.current(...o)}),[])}var es=t=>t!==null&&typeof t=="object"&&typeof t.then=="function",nl=()=>{},al=t=>{let e=t;switch(typeof e.status!="string"?(e.status="pending",t.then(r=>{e.status==="pending"&&(e.status="fulfilled",e.value=r)},r=>{e.status==="pending"&&(e.status="rejected",e.reason=r)})):e.status!=="fulfilled"&&e.status!=="rejected"&&t.then(nl,nl),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:throw t}};var Jr=t=>es(t)?al(t):Qo(t);var ll=!1,ts=(t,e,r=e)=>{let o=ie().isNeverMounted,s=o?r():e();te&&!ll&&(!o||r===e)&&(Object.is(s,e())||(ll=!0,console.error("The result of getSnapshot should be cached to avoid an infinite loop")));let[,i]=xr(l=>l+1,0),n=Ge(0),a=Sr(()=>{try{if(Object.is(s,e()))return n.current=0,!1}catch{}return!0});return Ae(()=>t(()=>{a()&&i()}),[t]),Ae(()=>{if(a()){if(++n.current>50)throw n.current=0,new Error("Maximum update depth exceeded. The result of getSnapshot should be cached to avoid an infinite loop.");i()}},[t,s,e]),s};var rs=(t,e)=>{};var Pm=0,os=()=>{let t=Ge(null);return t.current??(t.current=`:tap${Pm++}:`),t.current};var ss=(t,e,r)=>{let o=()=>{if(!t)return;let s=e();if(typeof t=="function"){let i=t(s);return typeof i=="function"?i:()=>t(null)}return t.current=s,()=>{t.current=null}};r==null?Ae(o):Ae(o,[...r,t])};var jt=qe(V("react"),1),Om=jt.default;function Dm(t){let e=(0,jt.useRef)(t);return(0,jt.useInsertionEffect)(()=>{e.current=t}),(0,jt.useCallback)(((...r)=>e.current(...r)),[])}var cl=Om.useEffectEvent??Dm;var Tr=qe(V("react"),1);F(k,V("react"));var _e=()=>xe()!==null,re=Tr.default,j=t=>_e()?Xo(t):re.useState(t),qi=(t,e,r)=>_e()?xr(t,e,r):re.useReducer(t,e,r),U=t=>_e()?Ge(t):re.useRef(t),K=(t,e)=>_e()?$t(t,e):re.useMemo(t,e),Ft=(t,e)=>_e()?_r(t,e):re.useCallback(t,e),N=(t,e)=>_e()?Ae(t,e):re.useEffect(t,e),We=(t,e)=>_e()?Ae(t,e):re.useLayoutEffect(t,e),Qr=t=>_e()?Sr(t):cl(t),xt=(t,e,r)=>_e()?ts(t,e,r):re.useSyncExternalStore(t,e,r),Gi=(t,e)=>_e()?rs(t,e):re.useDebugValue(t,e),lt=(t,e)=>_e()?Zo(t,e):re.useInsertionEffect(t,e),Nm=()=>_e()?os():re.useId(),Wi=(t,e,r)=>_e()?ss(t,e,r):re.useImperativeHandle(t,e,r),ne=t=>re.forwardRef(t),se=(t,e)=>re.memo(t,e),Ki=re.Fragment,Ji=(...t)=>re.createElement(...t),Qi=(...t)=>re.cloneElement(...t),Yr=t=>re.isValidElement(t),Bm=t=>re.lazy(t),Lm=re.Children,$m=re.Suspense,jm=(t,e)=>re.useDeferredValue(t,e),ae=t=>{let e=re.createContext(t);return Vi(e,t),e},rr=t=>_e()&&Ui(t)?Jr(t):re.use(t),Ke=t=>_e()&&Ui(t)?Jr(t):re.useContext(t);var Je=(t,e)=>{if(t.length!==0){if(t.length===1)throw t[0];for(let r of t)console.error(r);throw new AggregateError(t,e)}};var Fm=50,Qe={schedulers:new Set,isScheduled:!1},_t=null,Yi=[],Zi=class{constructor(t){h(this,"_isDirty",!1);h(this,"_task");this._task=t}get isDirty(){return this._isDirty}markDirty(){if(_t&&(_t.get(this)??0)>=Fm)throw new Error("Maximum update depth exceeded. This can happen when a resource repeatedly calls setState inside useEffect.");this._isDirty=!0,Qe.schedulers.add(this),ul()}runTask(){_t?.set(this,(_t.get(this)??0)+1),this._isDirty=!1,this._task()}settle(){this._isDirty=!1}},Vm=[],m_=new Zi(()=>{let t=Vm.splice(0),e=[];for(let r of t)try{r()}catch(o){e.push(o)}Je(e,"Errors occurred while running scheduled tasks")});var dl=t=>{if(_t!==null){Yi.push(t);return}t()},ul=()=>{Qe.isScheduled||(Qe.isScheduled=!0,Um())},Xi=()=>{let t=_t;_t=new Map;let e=[];try{for(let r of Qe.schedulers)if(Qe.schedulers.delete(r),!!r.isDirty)try{r.runTask()}catch(o){e.push(o)}}finally{if(_t=t,Qe.schedulers.clear(),Qe.isScheduled=!1,_t===null)for(;Yi.length>0;)try{Yi.shift()()}catch(r){e.push(r)}}Je(e,"Errors occurred during flushSync")},Um=(()=>{if(typeof MessageChannel<"u"){let t=null,e;return()=>{if(!t){let r=new MessageChannel;r.port1.onmessage=()=>{t?.unref?.(),Xi()},t=r.port1,e=r.port2}t.ref?.(),e.postMessage(null)}}return()=>setTimeout(Xi,0)})(),en=t=>{if(_t!==null)return te&&console.warn("flushTapSync was called from inside a render or commit. The flush is deferred until the current pass completes."),t();let e=Qe;Qe={schedulers:new Set,isScheduled:!0};try{let r=t();return Xi(),r}finally{let r=Qe.schedulers;if(Qe=e,r.size>0){for(let o of r)Qe.schedulers.add(o);ul()}}};function ml(t){if(t.length===0)return;let e;for(let r=0;r<t.length;r++)try{t[r]()}catch(o){(e??(e=[])).push(o)}e!==void 0&&Je(e,"Errors during commit")}function zm(t){let e=t.setup,r=t.setupDeps,o=t.generation,s;try{let i=e();if(i!==void 0&&typeof i!="function")throw new Error(`An effect function must either return a cleanup function or nothing. Received: ${typeof i}`);s=i}finally{t.generation===o?(t.cleanup=s,t.deps=r):s?.()}}var Hm=t=>t.setup===void 0?!1:t.deps===null||t.setupDeps===void 0?!0:!wt(t.deps,t.setupDeps);function pl(t,e){let r;for(let o of t)Hm(o)&&(r??(r=[])).push(o);if(r===void 0)return e;for(let o of r)if(o.deps=null,o.cleanup!==void 0)try{o.cleanup()}catch(s){(e??(e=[])).push(s)}finally{o.cleanup=void 0}for(let o of r)try{zm(o)}catch(s){(e??(e=[])).push(s)}return e}function tn(t,e=!0){let r;t.insertionCells!==null&&e&&(r=pl(t.insertionCells,r)),r=pl(t.effectCells,r),r!==void 0&&Je(r,"Errors during commit")}function rn(t){let e;for(let r of t)if(r.deps=null,r.cleanup)try{r.cleanup?.()}catch(o){(e??(e=[])).push(o)}finally{r.cleanup=void 0}e!==void 0&&Je(e,"Errors during cleanup")}var qm={useState:Xo,useReducer:xr,useRef:Ge,useMemo:$t,useCallback:_r,useEffect:Ae,useLayoutEffect:Ae,useInsertionEffect:Zo,useEffectEvent:Sr,useContext:Qo,use:Jr,useSyncExternalStore:ts,useDebugValue:rs,useId:os,useImperativeHandle:ss,useMemoCache:Wo},hl=Tr.default,or=hl.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE??hl.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,is=or==null?null:"H"in or?{get current(){return or.H},set current(t){or.H=t}}:"ReactCurrentDispatcher"in or?{get current(){return or.ReactCurrentDispatcher.current},set current(t){or.ReactCurrentDispatcher.current=t}}:null;function fl(t){if(!is)return t();let e=is.current;is.current=qm;try{return t()}finally{is.current=e}}function ns(t,e,r=void 0,o){return{hook:t,root:e,markDirty:r,devStrictMode:o,cells:[],effectCells:[],insertionCells:null,hostCells:null,contextDeps:null,wipContextDeps:null,wipCommitCallbacks:null,memoCache:{current:null,workInProgress:null,index:0},renderPendingCells:null,currentIndex:0,isFirstRender:!0,isMounted:!1,isReleased:!1,isNeverMounted:!0}}function on(t){t.wipCommitCallbacks=null,t.wipContextDeps=null,t.memoCache.workInProgress=null}function kr(t,e,r){try{e?(t.isReleased=!0,t.insertionCells!==null&&rn(t.insertionCells)):t.isMounted&&(t.isMounted=!1,rn(t.effectCells))}catch(o){(r??(r=[])).push(o)}if(t.hostCells!==null){for(let o of t.hostCells)if(o.fiber!==null&&(r=kr(o.fiber,e,r)),o.fibers!==null)for(let{fiber:s}of o.fibers.values())r=kr(s,e,r)}return r}function Xr(t,e=!0){let r;e&&(r=kr(t,!0,r)),r=kr(t,!1,r),r!==void 0&&Je(r,"Errors during cleanup")}function as(t){let e;for(let r of t)r.isReleased&&(e=kr(r,!0,e));for(let r of t)e=kr(r,!1,e);e!==void 0&&Je(e,"Errors during cleanup")}function Ye(t,e){if(t.renderPendingCells!==null){for(let s of t.renderPendingCells)s.renderQueue=null;t.renderPendingCells.clear()}let r=0,o;try{do{if(++r>25)throw new Error("Too many re-renders. tap limits the number of renders to prevent an infinite loop.");t.memoCache.index=0,Za(t,()=>{o=fl(()=>t.hook(...e))})}while((t.renderPendingCells?.size??0)>0)}catch(s){throw on(t),s}return Yo(t),o}function ct(t){let e=t.wipCommitCallbacks;t.wipCommitCallbacks=null;let r=te&&!t.isMounted&&t.devStrictMode==="root";t.isMounted=!0,t.isNeverMounted=!1,e!==null&&(t.contextDeps=t.wipContextDeps,Wr(t.root),t.memoCache.workInProgress!==null&&(t.memoCache.current=t.memoCache.workInProgress,t.memoCache.workInProgress=null),ml(e)),r&&(tn(t,e!==null),Xr(t,!1),t.isMounted=!0),tn(t,!r&&e!==null)}var Gm=()=>{let t=ie();return t.devStrictMode?t.isFirstRender?"child":"root":null},Wm=()=>"child",gl=()=>null,Km=()=>{if(!te)return gl;let t=U(0);return j(()=>t.current++),t.current!==2?gl:Wm},ls=()=>xe()?Gm:Km();var vl=t=>{let e=ie(),r=e.currentIndex++,o=e.cells[r],s;if(o===void 0){e.isFirstRender||Bt();let i=t instanceof Map;s={type:"host",fiber:i?null:t,fibers:i?t:null},e.cells[r]=s,(e.hostCells??(e.hostCells=[])).push(s)}else o.type!=="host"&&Lt(),s=o;return s.fibers===null&&s.fiber!==t&&bt(e,()=>{s.fiber=t}),s};var bl=(t,e)=>{if(!(t instanceof Map))return e(t);for(let{fiber:r}of t.values())e(r)},Jm=t=>{t.isReleased=!1},Qm=t=>{t.isReleased=!0,t.isMounted||queueMicrotask(()=>{t.isReleased&&Xr(t,!0)})},Ym=t=>{lt(()=>(bl(t,Jm),()=>bl(t,Qm)),[t]),N(()=>()=>{as(t instanceof Map?Array.from(t.values(),({fiber:e})=>e):[t])},[t])},Vt=t=>xe()?vl(t):(Ym(t),null),Xm=()=>{let t=U(0),e=t.current,r=ie();return{version:e,markDirty:K(()=>()=>{t.current++,r.markDirty?.()},[r]),root:r.root}},Zm=()=>{let[t]=j(()=>qo((s,i)=>{let n=!1;o(a=>(n=!s(),n?a:a+1)),n||r(()=>s()&&i())})),[e,r]=qi((s,i)=>(er(t,s),s+(i()?1:0)),0),[,o]=j(0);return er(t,e),{root:t,version:e,markDirty:void 0}},Ir=()=>{let t=ls(),{root:e,version:r,markDirty:o}=xe()?Xm():Zm();return{version:r,createFiber:Ft((s,i,n)=>ns(s,e,n?()=>{n(),o?.()}:o,t()),[])}};var eh=t=>t(),th=t=>{let e=[];for(let r of t)try{r()}catch(o){e.push(o)}Je(e,"Errors occurred while notifying Tap root subscribers")},rh=(t,e,r)=>{let o=new Zi(()=>a.handleUpdate()),s=[],i=qo((l,c)=>{s.length===0&&!l()||(s.push(c),o.markDirty())}),n=ns(eh,i,void 0,e),a={scheduler:o,queue:s,fiber:n,subscribers:new Set,pendingHostRender:!1,isMounted:!1,hasRendered:!1,committedRender:t,context:new Map,value:void 0,applyQueue:()=>{er(i,i.committedVersion);for(let l of s)te&&n.devStrictMode&&l(),l();return er(i,i.committedVersion+i.changelog.length),s.length},publish:(l,c)=>{o.isDirty||i.committedVersion!==c||a.value===l||(a.value=l,dl(()=>th(a.subscribers)))},finishFlush:(l,c,d)=>{Wr(i),s.splice(0,d),a.pendingHostRender=!1,s.length===0&&o.settle(),a.isMounted&&ct(n),a.publish(l,c)},handleUpdate:()=>{let l=a.applyQueue(),c;try{te&&n.devStrictMode&&Jo(a.context,()=>Ye(n,[a.committedRender])),c=Jo(a.context,()=>Ye(n,[a.committedRender]))}catch(d){if(er(i,i.committedVersion),es(d)){let u=()=>{a.isMounted&&o.markDirty()};d.then(u,u);return}if(a.isMounted){a.pendingHostRender=!0,r(u=>u+1);return}throw d}if(o.isDirty)throw new Error("Scheduler is dirty, this should never happen");a.finishFlush(c,i.version,l)}};return a},sn=t=>{let[,e]=j(0),r=ls(),o=U(null),s=o.current??(o.current=rh(t,r(),e)),i=rl(),n=s.scheduler.isDirty||s.pendingHostRender?s.applyQueue():0,a=Jo(i,()=>Ye(s.fiber,[t])),l={render:t,context:i,value:a,drained:n,wip:s.fiber.wipCommitCallbacks,version:s.fiber.root.version,processed:!1};return s.hasRendered||(s.hasRendered=!0,s.committedRender=t,s.context=i,s.value=a),N(()=>(s.isMounted=!0,()=>{s.isMounted=!1}),[s]),Vt(s.fiber),N(()=>{if(l.processed){s.fiber.isMounted||(ct(s.fiber),s.queue.length&&!s.scheduler.isDirty&&s.scheduler.markDirty());return}if(l.processed=!0,s.committedRender=l.render,s.context=l.context,s.fiber.wipCommitCallbacks!==l.wip){s.scheduler.isDirty||s.handleUpdate();return}if(l.drained>0&&s.fiber.root.version===l.version){s.finishFlush(l.value,l.version,l.drained);return}ct(s.fiber),s.publish(l.value,l.version)}),K(()=>({getValue:()=>s.value,subscribe:c=>(s.subscribers.add(c),()=>s.subscribers.delete(c))}),[s])};function L(t){return(...e)=>({hook:t,args:e})}function oe(t,e,r){return typeof e=="function"?(...o)=>oe(t,e(...o)):r?{...e,key:t,deps:r}:{...e,key:t}}var oh=(t,e)=>({fiber:t,key:e,currentDeps:null,current:null,wipDeps:null,wip:null});function be(t){let{version:e,createFiber:r}=Ir(),o=U(null),s=o.current??(o.current=oh(r(t.hook,t.key),t.key)),i=K(()=>s.fiber.hook===t.hook&&s.key===t.key&&!s.fiber.isReleased?s.fiber:r(t.hook,t.key),[s,t.hook,t.key,r]);s.wipDeps=s.currentDeps,s.wip=s.current;let n=[i,e,t.args];(Kr(i)||s.currentDeps===null||!wt(s.currentDeps,n))&&(s.wipDeps=n,s.wip={value:Ye(i,t.args)});let a=s.wip,l=Vt(i);return N(()=>{if(s.currentDeps=s.wipDeps,s.current=s.wip,s.fiber=i,s.key=t.key,ct(i),l!==null)return()=>{l.fiber!==i&&Xr(i,!0)}},[s,l,i,t.key,a]),a.value}var wl=(t,e,r)=>{let o=U(null),s=o.current??(o.current={wipDeps:null,wip:null,currentDeps:null,current:null});return s.wipDeps=s.currentDeps,s.wip=s.current,N(()=>{s.currentDeps=s.wipDeps,s.current=s.wip}),!r&&s.currentDeps&&wt(s.currentDeps,e)?s.current:(s.wipDeps=e,s.wip=t(),s.wip)};var yl=(t,e)=>{let r=t.get(e);r&&(r.isDirty=!0)},sh=(t,e)=>!t.isDirty&&!Kr(t.fiber)&&e!==void 0&&t.committedDeps!==void 0&&wt(t.committedDeps,e),ih=t=>{if(!zi())return!1;for(let{fiber:e}of t.values())if(Kr(e))return!0;return!1};function sr(t){let[e]=j(()=>new Map),{version:r,createFiber:o}=Ir(),s=ih(e),i=!1,n=wl(()=>{let a=new Set,l=[],c=0;for(let d=0;d<t.length;d++){let u=t[d],m=u.key;if(m===void 0)throw new Error(`useResources did not provide a key for array at index ${d}`);if(a.has(m))throw new Error(`Duplicate key ${m} in useResources`);a.add(m);let p=e.get(m);if(p)if(p.fiber.hook!==u.hook){let f=o(u.hook,u.key,()=>yl(e,m)),g=Ye(f,u.args);p.next={value:g,deps:u.deps,remount:f},i=!0}else if(sh(p,u.deps))typeof p.next=="object"&&on(p.fiber),p.fiber.contextDeps&&Yo(p.fiber,p.fiber.contextDeps),p.next="skip";else{let f=Ye(p.fiber,u.args);p.next={value:f,deps:u.deps}}else{let f=o(u.hook,u.key,()=>yl(e,m));p={fiber:f,next:{value:Ye(f,u.args),deps:u.deps},isDirty:!1,committedDeps:void 0,committedValue:void 0},c++,e.set(m,p)}l.push(typeof p.next=="object"?p.next.value:p.committedValue)}if(e.size>l.length-c)for(let d of e.keys())a.has(d)||(e.get(d).next="delete",i=!0);return l},[t,e,o,r],s);return Vt(e),N(()=>{if(i){let a=[];for(let[l,c]of e.entries()){let d=c.next;d==="delete"?(a.push(c.fiber),e.delete(l)):d!=="skip"&&d.remount&&(a.push(c.fiber),c.fiber=d.remount)}for(let l of a)l.isReleased=!0;as(a)}for(let a of e.values()){let l=a.next;l==="skip"?!a.fiber.isNeverMounted&&!a.fiber.isMounted&&ct(a.fiber):l!=="delete"&&(ct(a.fiber),a.committedDeps=l.deps,a.committedValue=l.value,a.isDirty=!1,a.next="skip")}},[n,e,i]),n}var nh=t=>t(),cs=t=>{let{createFiber:e}=Ir(),[r]=j(()=>e(nh,void 0)),o=Ye(r,[t]);Vt(r);let s=!1,i=()=>{s&&r.isMounted||(s=!0,ct(r))};return N(i),{value:o,effects:i}};var ah=()=>{let t=v(4),[e,r]=j(lh),o;t[0]===Symbol.for("react.memo_cache_sentinel")?(o=(l,c)=>(r(d=>{let u=ve(d.renderers);return u[l]=[...u[l]??[],c],{...d,renderers:u}}),()=>{r(d=>{let u=ve(d.renderers),m=u[l]?.filter(p=>p!==c)??[];return m.length>0?u[l]=m:delete u[l],{...d,renderers:u}})}),t[0]=o):o=t[0];let s=o,i;t[1]===Symbol.for("react.memo_cache_sentinel")?(i=l=>(r(c=>({...c,fallbacks:[...c.fallbacks,l]})),()=>{r(c=>({...c,fallbacks:c.fallbacks.filter(d=>d!==l)}))}),t[1]=i):i=t[1];let n=i,a;return t[2]!==e?(a={getState:()=>e,setDataUI:s,setFallbackDataUI:n},t[2]=e,t[3]=a):a=t[3],a},xl=L(ah);function lh(){return{renderers:ve(),fallbacks:[]}}var pe=(t,e,r)=>{let o=s=>{console.error(`[assistant-ui] ${r} listener threw an error`,s)};for(let s of t)try{let i=s(typeof e=="function"?e():e);i!==null&&(typeof i=="object"||typeof i=="function")&&"then"in i&&typeof i.then=="function"&&Promise.resolve(i).catch(o)}catch(i){o(i)}};var le=t=>t;var ch=new Set(["$$typeof","nodeType","then","__v_raw","__v_isRef","__v_isReactive","__v_isReadonly","__v_isShallow","__v_skip"]),Xe=(t,e)=>{if(t===Symbol.toStringTag)return e;if(typeof t!="symbol"){if(t==="toJSON")return()=>e;if(!ch.has(t))return!1}},Et=class{getOwnPropertyDescriptor(t,e){let r=this.get(t,e);if(r!==void 0)return{value:r,writable:!1,enumerable:!0,configurable:!0}}set(){return!1}setPrototypeOf(){return!1}defineProperty(){return!1}deleteProperty(){return!1}preventExtensions(){return!1}};var ir=Symbol("assistant-ui.store.clientId"),ds=Symbol("assistant-ui.store.instanceTag"),nn=(t,e)=>{let r=new Proxy((()=>{}),{apply:()=>(e(),r),get:(o,s)=>s==="source"?t.source:s==="query"?t.query:s==="name"?t.name:s===ir?ps(e()):e()[s],has:(o,s)=>s==="source"||s==="query"||s==="name"||s===ir||s in e(),ownKeys:()=>Reflect.ownKeys(e()),getOwnPropertyDescriptor:(o,s)=>{if(!(typeof s=="symbol"||!(s in e())))return{value:e()[s],writable:!1,enumerable:!0,configurable:!0}}});return r},an=(t,e)=>{let r=()=>{throw new Error(t)};return new Proxy((()=>{}),{apply:r,get:(o,s)=>{if(s==="source"||s==="query")return null;if(s==="name")return e;if(s===ir)return r();let i=Xe(s,"AssistantClientAccessor");return i!==!1?i:r()},has:(o,s)=>s==="source"||s==="query"||s==="name",ownKeys:()=>[],getOwnPropertyDescriptor:()=>{}})},Ut=t=>t?.source!=null,us=t=>t?.source===null,ps=t=>t[ir]??t,_l=t=>t[ds]??ps(t);var Rt=t=>t==="optional"||t==="subscribe"||t==="on"||t==="__proto__"||typeof t=="symbol",Zr=t=>{let e=[];for(let r in t)Rt(r)||e.push(r);return e};var nr,Sl,dh=(Sl=class extends Et{constructor(e){super();Xt(this,nr);Zt(this,nr,e)}get(e,r){let o=Xe(r,"OptionalAssistantClient");if(o!==!1)return o;if(Rt(r))return;let s=kt(this,nr)[r];return Ut(s)?s:void 0}ownKeys(){return Zr(kt(this,nr))}has(e,r){return!Rt(r)&&r in kt(this,nr)}},nr=new WeakMap,Sl),ms=t=>new Proxy({},new dh(t));var Tl=()=>()=>{},uh="You are using a component or hook that requires an AuiProvider. Wrap your component in an <AuiProvider> component.",eo,to,ro,hs,kl,ph=(kl=class extends Et{constructor(e,r,o){super();Xt(this,eo);Xt(this,to);Xt(this,ro);Xt(this,hs);Zt(this,eo,e),Zt(this,to,r),Zt(this,ro,o)}get(e,r){if(r==="subscribe"||r==="on")return Tl;if(r==="optional")return kt(this,hs)??Zt(this,hs,ms(kt(this,ro).call(this)));let o=Xe(r,kt(this,eo));return o!==!1?o:an(kt(this,to).call(this,String(r)),String(r))}ownKeys(){return["subscribe","on","optional"]}getOwnPropertyDescriptor(e,r){if(r!=="optional")return super.getOwnPropertyDescriptor(e,r);let o=this.get(e,r);if(o!==void 0)return{value:o,writable:!1,enumerable:!1,configurable:!0}}has(e,r){return r==="subscribe"||r==="on"||r==="optional"}},eo=new WeakMap,to=new WeakMap,ro=new WeakMap,hs=new WeakMap,kl),mh=(t,e)=>{let r=new Proxy({},new ph(t,e,()=>r));return r},zt=mh("DefaultAssistantClient",()=>uh),Il=()=>new Proxy({},{get(t,e){let r=Xe(e,"AssistantClient");return r!==!1?r:an(`The current scope does not have a "${String(e)}" property.`,String(e))}}),fs=ae(zt),hh=()=>{},Cl=new WeakMap,El=t=>Cl.get(t)??hh,Rl=(t,e)=>{Cl.set(t,e)},oo=()=>Ke(fs),Al=(t,e)=>Ct(fs,t,e);var ln=Symbol("assistant-ui.transform-scopes");function so(t,e){let r=t;if(r[ln])throw new Error("transformScopes is already attached to this resource");r[ln]=e}function Ml(t){return t[ln]}var io=t=>typeof t=="string"?{scope:t.split(".")[0],event:t}:{scope:t.scope,event:t.event};var gs=Symbol("assistant-ui.store.clientIndex"),Pl=t=>t[gs],Ol=ae([]),no=()=>rr(Ol),Dl=(t,e)=>{let r=v(3),o=no(),s;return r[0]!==t||r[1]!==o?(s=[...o,t],r[0]=t,r[1]=o,r[2]=s):s=r[2],Ct(Ol,s,e)};var vs=Symbol("assistant-ui.store.getValue"),cn=t=>{let e=t[vs];if(!e)throw new Error("Client scope contains a non-client resource. Ensure your Derived get() returns a client created with useClientResource(), not a plain resource.");return e.getState?.()},Nl=new Map;function fh(t){let e=Nl.get(t);return e||(e=function(...r){if(!this||typeof this!="object")throw new Error(`Method "${String(t)}" called without proper context. This may indicate the function was called incorrectly.`);let o=this[vs];if(!o)throw new Error(`Method "${String(t)}" called on invalid client proxy. Ensure you are calling this method on a valid client instance.`);let s=o[t];if(!s)throw new Error(`Method "${String(t)}" is not implemented.`);if(typeof s!="function")throw new Error(`"${String(t)}" is not a function.`);return s(...r)},Nl.set(t,e)),e}var gh=class extends Et{constructor(e,r,o){super();h(this,"boundFns");h(this,"cachedReceiver");h(this,"outputRef");h(this,"tagRef");h(this,"index");h(this,"self");this.outputRef=e,this.tagRef=r,this.index=o}get(e,r,o){if(r===vs)return this.outputRef.current;if(r===gs)return this.index;if(r===ir)return this.self;if(r===ds)return this.tagRef.current;let s=Xe(r,"ClientProxy");if(s!==!1)return s;let i=this.outputRef.current[r];if(typeof i=="function"){if(o===void 0)return i;(!this.boundFns||this.cachedReceiver!==o)&&(this.boundFns=new Map,this.cachedReceiver=o);let n=this.boundFns.get(r);return n||(n=fh(r).bind(o),this.boundFns.set(r,n)),n}return i}ownKeys(){return Object.keys(this.outputRef.current)}has(e,r){return r===vs||r===gs||r===ir||r===ds?!0:r in this.outputRef.current}},dt=t=>{let e=U(null),r=U(null),o=K(()=>({}),[t.hook,t.key]),s=no().length,i=K(()=>{let a=new gh(e,r,s),l=new Proxy({},a);return a.self=l,l},[s]),n=Dl(i,function(){return be(t)});return e.current||(e.current=n,r.current=o),N(()=>{e.current=n,r.current=o}),{methods:i,state:n.getState?.(),key:t.key}},bs=L(dt);var ws=0,dn=0,Ll=t=>{ws++,dn++;try{return t()}finally{dn--,ws++}},vh=t=>{let e,r=new Map,o=-1,s=a=>{if(dn===0)return cn(t[a]());if(o!==ws)r.clear(),o=ws;else if(r.has(a))return r.get(a);let l=cn(t[a]());return r.set(a,l),l};class i extends Et{get(l,c){let d=Xe(c,"OptionalAssistantState");if(d!==!1)return d;let u=c;if(!Rt(u)&&Ut(t[u]))return s(u)}ownKeys(){return Zr(t)}has(l,c){return!Rt(c)&&c in t}}class n extends Et{get(l,c){let d=Xe(c,"AssistantState");if(d!==!1)return d;if(c==="optional")return e??(e=new Proxy({},new i));let u=c;if(!Rt(u))return s(u)}ownKeys(){return[...Zr(t),"optional"]}has(l,c){return c==="optional"||!Rt(c)&&c in t}}return new Proxy({},new n)},Bl=new WeakMap,$l=t=>{let e=Bl.get(t);return e||(e=vh(t),Bl.set(t,e)),e};var Fl=ae(null),jl=Symbol("aui.scope-effect-unapplied"),Vl=(t,e)=>Ct(Fl,t,e),un=()=>{let t=rr(Fl);if(!t)throw new Error("AssistantTapContext is not available");return t},ao=()=>un().clientRef,lo=(t,e,r)=>{let o=v(8),{clientRef:s}=un(),i;o[0]!==s||o[1]!==e||o[2]!==t?(i=()=>{let a=s.current;if(a===null)throw new Error("useAssistantScopeEffect ran before the client was committed. This is likely an internal bug in assistant-ui.");let l=()=>{let p=s.current?.[t];return p!==void 0&&Ut(p)?_l(p):void 0},c=jl,d,u=p=>{if(d?.(),d=void 0,c=jl,p!==void 0){let f=e();d=typeof f=="function"?f:void 0}c=p};u(l());let m=a.subscribe(()=>{let p=l();p!==c&&u(p)});return()=>{m(),d?.()}},o[0]=s,o[1]=e,o[2]=t,o[3]=i):i=o[3];let n;o[4]!==s||o[5]!==r||o[6]!==t?(n=[s,t,...r],o[4]=s,o[5]=r,o[6]=t,o[7]=n):n=o[7],N(i,n)},Ze=()=>{let t=v(3),{emit:e}=un(),r=no(),o;return t[0]!==r||t[1]!==e?(o=(s,i)=>{e(s,i,r)},t[0]=r,t[1]=e,t[2]=o):o=t[2],Qr(o)};var ys=ae(void 0),pn=(t,e)=>{let r=rr(ys);return Ct(ys,t??r,e)};var Se=(t,e)=>{if(Array.isArray(t)!==Array.isArray(e))return!1;if(Array.isArray(t)&&Array.isArray(e)){if(t.length!==e.length)return!1;for(let o=0;o<t.length;o++)if(!Object.is(t[o],e[o]))return!1;return!0}let r=Object.keys(t);return r.length===Object.keys(e).length&&r.every(o=>Object.hasOwn(e,o)&&Object.is(t[o],e[o]))};var Ul=Symbol("assistant-ui.derived-hook"),zl=t=>{t[Ul]=!0},Hl=t=>t[Ul]===!0;var ql=t=>{console.error("NotificationManager: event listener error",t)},Gl=(t,e,r)=>{try{let o=t(e,r);o!==null&&(typeof o=="object"||typeof o=="function")&&typeof o.then=="function"&&Promise.resolve(o).catch(ql)}catch(o){ql(o)}},bh=()=>{let t=new Map,e=new Set,r=new Set;return{on(o,s){let i=s;if(o==="*")return e.add(i),()=>e.delete(i);let n=t.get(o);return n||(n=new Set,t.set(o,n)),n.add(i),()=>{n.delete(i),n.size===0&&t.get(o)===n&&t.delete(o)}},emit(o,s,i){!t.has(o)&&e.size===0||queueMicrotask(()=>{let n=t.get(o);if(n)for(let a of n)Gl(a,s,i);if(e.size>0){let a={event:o,payload:s};for(let l of e)Gl(l,a,i)}})},subscribe(o){return r.add(o),()=>r.delete(o)},notifySubscribers(){Ll(()=>{for(let o of r)try{o()}catch(s){console.error("NotificationManager: subscriber callback error",s)}})}}},mn=()=>j(bh)[0];var xs=()=>{let[t]=j(()=>({controller:new AbortController,generation:0}));return lt(()=>{let e=++t.generation;return()=>queueMicrotask(()=>{t.generation===e&&t.controller.abort()})},[t]),t.controller.signal};var co=t=>{let e=K(()=>({}),[]);return e.v!==void 0&&Se(e.v,t)?e.v:(e.v=t,t)},et=t=>{let e=v(2),r=U(void 0),o;return e[0]!==t?(o=s=>{let i=t(s);return r.current!==void 0&&Se(r.current,i)?r.current:(r.current=i,i)},e[0]=t,e[1]=o):o=e[1],o};var _s=(()=>{try{return!1}catch{return!1}})();var wh=(t,e)=>{let r={...t},o=new Set,s=!0;for(;s;){s=!1;for(let i of Object.values(r)){if(o.has(i.hook))continue;o.add(i.hook);let n=Ml(i.hook);if(n){n(r,e),s=!0;break}}}return r},Ss=t=>Hl(t.hook),yh=t=>{if(!Ss(t))return{source:"root",query:{}};let e=t.args[0];return{source:e.source,query:e.query??{}}},hn=Symbol.for("aui.event-receiver-ref"),Wl=(t,e)=>{let r=t===zt?Il():t,o=Object.create(r);Object.assign(o,e);let s;return Object.defineProperty(o,"optional",{get:()=>s??(s=ms(o)),enumerable:!1}),o},xh=({notifications:t,clientRef:e})=>K(()=>({subscribe:t.subscribe,on:function(r,o){if(!this)throw new Error("const { on } = useAui() is not supported. Use aui.on() instead.");let{scope:s,event:i}=io(r),n=r[hn];if(s!=="*"&&!n&&us(this[s]))throw new Error(`Scope "${s}" is not available. Use { scope: "*", event: "${i}" } to listen globally.`);let a=t.on(i,(c,d)=>{if(s==="*")return o(c);let u=((n??e).current??this)[s];if(!Ut(u))return;let m=ps(u);if(m===d[Pl(m)])return o(c)});if(s!=="*"){if(n){if(e.parent===zt)return a}else if(us(e.parent[s]))return a}let l=e.parent.on(r,o);return()=>{a(),l()}}}),[t,e]),Kl=t=>{let e=v(5),r;e[0]!==t?(r=yh(t),e[0]=t,e[1]=r):r=e[1];let{source:o,query:s}=r,i=co(s),n;return e[2]!==o||e[3]!==i?(n={source:o,query:i},e[2]=o,e[3]=i,e[4]=n):n=e[4],co(n)},_h=(t,e)=>{let r=v(3),o;return r[0]!==e||r[1]!==t?(o=e?t:bs(t),r[0]=e,r[1]=t,r[2]=o):o=r[2],be(o)},Sh=(t,e)=>{let r=oo(),o=Ss(e),s=_h(e,o),i=o?s:s.methods,n=Kl(e),a=K(()=>nn({name:t,...n},()=>i),[t,n,i]);return r[t]=a,a},Th=L(Sh),kh=t=>{let e=v(2),r;return e[0]!==t?(r=t.map(Mh),e[0]=t,e[1]=r):r=e[1],sr(r)},Jl=(t,e)=>{let r=co(e),o=K(()=>({}),[]);return o.deps!==r&&(o.deps=r,o.client=t),o.client},Ql=({parent:t,entries:e,clientRef:r,notifications:o})=>{let s=xh({notifications:o,clientRef:r}),i=Wl(t,s),n=K(()=>({clientRef:r,emit:o.emit}),[r,o.emit]),a=Vl(n,function(){return Al(i,function(){return kh(e)})});return{client:Jl(i,[t,...a])}},Ih=({parent:t,entries:e,destroySignal:r})=>{let o=U({parent:t,current:null}).current,{value:s,effects:i}=cs(function(){let a=mn(),{client:l}=pn(r,function(){return Ql({parent:t,entries:e,clientRef:o,notifications:a})});return N(()=>t.subscribe(a.notifySubscribers),[t,a]),N(()=>a.notifySubscribers()),l});return lt(()=>{o.parent=t,o.current=s},[s,t,o]),{client:s,effects:i}},Ch=({parent:t,entries:e,destroySignal:r})=>{let o=U({parent:t,current:null}).current,{value:s,effects:i}=cs(function(){let a=mn(),l=sn(function(){return pn(r,function(){return Ql({parent:t,entries:e,clientRef:o,notifications:a})})}),c=xt(l.subscribe,()=>l.getValue().client,()=>l.getValue().client);return N(()=>{let d=()=>en(()=>{o.current=l.getValue().client,a.notifySubscribers()}),u=l.subscribe(d),m=t.subscribe(d);return()=>{u(),m()}},[l,t,a]),c});return lt(()=>{o.parent=t,o.current=s},[s,t,o]),{client:s,effects:i}},Eh=(t,e,r,o)=>{let{get:s}=o.args[0],i=xt(t.subscribe,()=>s(t),()=>s(t)),n=Kl(o),a=K(()=>nn({name:r,...n},()=>i),[r,n,i]);return e[r]=a,a},Rh=(t,e)=>{if(_s){let[a]=j(()=>e.map(([d])=>d).join(",")),l=e.find(([,d])=>!Ss(d));if(l)throw new Error(`Scope "${l[0]}" is a root scope but this useAui mounted derived-only; remount with a new key to change scope kinds.`);let c=e.map(([d])=>d).join(",");if(c!==a)throw new Error(`A derived-only config mounted scopes [${a}] but now has [${c}]; remount with a new key to change the scope set.`)}let r=U({parent:t,current:null}).current,o=function(a,l){if(!this)throw new Error("const { on } = useAui() is not supported. Use aui.on() instead.");let{scope:c,event:d}=io(a);if(c==="*")return t.on(a,l);let u=a[hn];if(!u&&us(this[c]))throw new Error(`Scope "${c}" is not available. Use { scope: "*", event: "${d}" } to listen globally.`);return t.on({scope:c,event:d,[hn]:u??r},l)},s=Wl(t,{subscribe:t.subscribe,on:o}),i=e.map(([a,l])=>Eh(t,s,a,l)),n=Jl(s,[t,...i]);return lt(()=>{r.parent=t,r.current=n},[n,t,r]),n},Ah=(t,e)=>{let r=v(8),o;r[0]!==e||r[1]!==t?(o=Object.entries(wh(e,t)),r[0]=e,r[1]=t,r[2]=o):o=r[2];let s=o,i;r[3]!==s?(i=()=>s.length===0||s.some(Ph),r[3]=s,r[4]=i):i=r[4];let[n]=j(i),a;return r[5]!==s||r[6]!==n?(a={entries:s,rooted:n},r[5]=s,r[6]=n,r[7]=a):a=r[7],a},Yl=(t,e,r,o)=>{let{entries:s,rooted:i}=Ah(t,e);return i?r({parent:t,entries:s,destroySignal:o}):{client:Rh(t,s)}},Xl=(t,e,r)=>Yl(t,e,Ih,r);function q(t){let e=oo();if(t){let r=xs(),{client:o,effects:s}=Yl(e,t,Ch,r);return s&&Rl(o,s),o}return e}function Mh(t){let[e,r]=t;return oe(e,Th(e,r))}function Ph(t){let[,e]=t;return!Ss(e)}var P=t=>{let e=v(6),r=q(),o;e[0]!==r?(o=$l(r),e[0]=r,e[1]=o):o=e[1];let s=o,i,n;e[2]!==s||e[3]!==t?(i=()=>t(s),n=()=>t(s),e[2]=s,e[3]=t,e[4]=i,e[5]=n):(i=e[4],n=e[5]);let a=xt(r.subscribe,i,n);if(typeof a=="object"&&a!==null&&(a===s||a===s.optional))throw new Error("You tried to return the entire AssistantState. This is not supported due to technical limitations.");return Gi(a),a};var Zl=t=>{let e=v(3),{get:r}=t,o=q(),s;return e[0]!==o||e[1]!==r?(s=()=>r(o),e[0]=o,e[1]=r,e[2]=s):s=e[2],P(s)};zl(Zl);var ce=L(Zl);var ec=t=>{if(t.key===void 0)throw new Error("useClientLookup: Element has no key");return t.key};function me(t){let e=v(12),r;e[0]!==t?(r=t.map(Nh),e[0]=t,e[1]=r):r=e[1];let o=sr(r),s;e[2]!==t?(s=t.reduce(Dh,Object.create(null)),e[2]=t,e[3]=s):s=e[3];let i=s,n;e[4]!==o?(n=o.map(Oh),e[4]=o,e[5]=n):n=e[5];let a=n,l;e[6]!==i||e[7]!==o?(l=d=>{if("index"in d){if(d.index<0||d.index>=o.length)throw new Error(`useClientLookup: index ${d.index} out of bounds (length: ${o.length}) (ignore if recovered)`);return o[d.index].methods}let u=i[d.key];if(u===void 0)throw new Error(`useClientLookup: key "${d.key}" not found (ignore if recovered)`);return o[u].methods},e[6]=i,e[7]=o,e[8]=l):l=e[8];let c;return e[9]!==a||e[10]!==l?(c={state:a,get:l},e[9]=a,e[10]=l,e[11]=c):c=e[11],c}function Oh(t){return t.state}function Dh(t,e,r){return t[ec(e)]=r,t}function Nh(t){return oe(ec(t),bs(t),t.deps)}var Ts=(t,e=0)=>e===0?Math.abs(t.scrollHeight-t.scrollTop-t.clientHeight)<=1||t.scrollHeight<=t.clientHeight:t.scrollHeight-e-t.scrollTop-t.clientHeight<=1||t.scrollHeight-e<=t.clientHeight,fn=(t,e=0)=>e===0?t.scrollHeight>t.clientHeight+1:t.scrollHeight-e>t.clientHeight+1,gn=(t,e)=>t.scrollTop>e.scrollTop&&t.scrollHeight===e.scrollHeight;var Te=Symbol("skip-update"),ut=(t,...e)=>{let r=[];for(let o of t)try{o(...e)}catch(s){r.push(s)}if(r.length===1)throw r[0];if(r.length>1){for(let o of r)console.error(o);throw new AggregateError(r)}},St=t=>{ut(t)},vn=(t,e)=>{try{t()}catch(r){console.error("[assistant-ui] Subscription rollback cleanup threw",r)}throw e},tc=(t,e)=>t===void 0||e===void 0?t===e:Se(t,e),Cr=class{constructor(){h(this,"_subscribers",new Set)}subscribe(t){return this._subscribers.add(t),()=>this._subscribers.delete(t)}waitForUpdate(){return new Promise(t=>{let e=this.subscribe(()=>{e(),t()})})}_notifySubscribers(){ut(this._subscribers)}};var ks=class{constructor(){h(this,"_subscriptions",new Set);h(this,"_connection")}get isConnected(){return!!this._connection}notifySubscribers(t,e){if(e){pe(this._subscriptions,t,e);return}ut(this._subscriptions,t)}_updateConnection(){if(this._subscriptions.size>0){if(this._connection)return;this._connection=this._connect()}else{let t=this._connection;this._connection=void 0,t?.()}}subscribe(t){this._subscriptions.add(t);try{this._updateConnection()}catch(e){throw this._subscriptions.delete(t),e}return()=>{this._subscriptions.delete(t),this._updateConnection()}}},ke=class extends ks{constructor(e){super();h(this,"binding");h(this,"_previousState");h(this,"getState",()=>(this.isConnected||this._syncState(),this._previousState));this.binding=e;let r=e.getState();if(r===Te)throw new Error("Entry not available in the store");this._previousState=r}get path(){return this.binding.path}_syncState(){let e=this.binding.getState();return e===Te||tc(e,this._previousState)?!1:(this._previousState=e,!0)}_connect(){let e=()=>{this._syncState()&&this.notifySubscribers()},r=this.binding.subscribe(e);try{return this._syncState(),r}catch(o){throw vn(r,o)}}},uo=class extends ks{constructor(e){super();h(this,"binding");h(this,"_previousStateDirty",!0);h(this,"_previousState");h(this,"getState",()=>{if(!this.isConnected||this._previousStateDirty){let e=this.binding.getState();e!==Te&&(this._previousState===void 0||!tc(e,this._previousState))&&(this._previousState=e),this._previousStateDirty=!1}if(this._previousState===void 0)throw new Error("Entry not available in the store");return this._previousState});this.binding=e}get path(){return this.binding.path}_connect(){let e=()=>{this._previousStateDirty=!0,this.notifySubscribers()},r=this.binding.subscribe(e);return this._previousStateDirty=!0,r}},ar=class extends ks{constructor(e){super();h(this,"binding");this.binding=e}get path(){return this.binding.path}getState(){return this.binding.getState()}outerSubscribe(e){return this.binding.subscribe(e)}_connect(){let e=()=>{this.notifySubscribers()},r=this.binding.getState(),o=r?.subscribe(e),s=()=>{let n=this.binding.getState();if(n===r)return;r=n;let a=o;o=void 0;try{a?.()}finally{o=n?.subscribe(e),e()}},i;try{i=this.outerSubscribe(s)}catch(n){throw vn(()=>o?.(),n)}return()=>St([()=>i(),()=>o?.()])}},Is=class extends ks{constructor(e){super();h(this,"config");this.config=e}getState(){return this.config.binding.getState()}outerSubscribe(e){return this.config.binding.subscribe(e)}_connect(){let e=`Runtime event "${this.config.event}"`,r=a=>{this.notifySubscribers(a,e)},o=this.config.binding.getState(),s=o?.unstable_on(this.config.event,r),i=()=>{let a=this.config.binding.getState();if(a===o)return;o=a;let l=s;s=void 0;try{l?.()}finally{s=a?.unstable_on(this.config.event,r),this.config.notifyOnRebind&&r({})}},n;try{n=this.outerSubscribe(i)}catch(a){throw vn(()=>s?.(),a)}return()=>St([()=>n(),()=>s?.()])}};var bn=t=>{if(!t.overwrite)return t;let{overwrite:e,...r}=t;return r},rc=t=>{let e=Array.from(t).map(o=>o.getModelContext()).sort((o,s)=>(s.priority??0)-(o.priority??0)),r=ve();return e.reduce((o,s)=>{let i=s.priority??0;if(s.system&&(o.system?o.system+=`

${s.system}`:o.system=s.system),s.tools)for(let[n,a]of Object.entries(s.tools)){let l=o.tools!==void 0&&Object.hasOwn(o.tools,n)?o.tools[n]:void 0;if(l&&l!==a){let c=r[n];if(c===i){if(!a.overwrite)throw new Error(`You tried to define a tool with the name ${n}, but it already exists.`);o.tools[n]=bn(a);continue}let d=c>i?l:a,u=c>i?a:l;o.tools[n]=bn({...u,...d}),r[n]=Math.max(c,i);continue}o.tools||(o.tools=ve()),o.tools[n]=bn(a),Object.hasOwn(r,n)||(r[n]=i)}return s.config&&(o.config={...s.config,...o.config}),s.callSettings&&(o.callSettings={...s.callSettings,...o.callSettings}),s.unstable_composerMetadata&&(o.unstable_composerMetadata={...s.unstable_composerMetadata,...o.unstable_composerMetadata}),o},{})};var Cs=class{constructor(){h(this,"_providers",new Map);h(this,"_providerUnsubscribes",new Map);h(this,"_subscribers",new Set)}getModelContext(){return rc(new Set(this._providers.values()))}registerModelContextProvider(t){let e=Symbol();this._providers.set(e,t);let r;try{r=t.subscribe?.(()=>{this.notifySubscribers()})}catch(s){this._providers.delete(e);try{this.notifySubscribers()}catch(i){console.error(i)}throw s}this._providerUnsubscribes.set(e,r),this.notifySubscribers();let o=!1;return()=>{if(o)return;o=!0,this._providers.delete(e);let s=this._providerUnsubscribes.get(e);this._providerUnsubscribes.delete(e);let i=!1,n,a=l=>{try{l()}catch(c){i?console.error(c):(i=!0,n=c)}};if(s&&a(s),a(()=>this.notifySubscribers()),i)throw n}}notifySubscribers(){ut(this._subscribers)}subscribe(t){return this._subscribers.add(t),()=>{this._subscribers.delete(t)}}};var Bh=(t,e)=>t.length===e.length&&t.every((r,o)=>Object.is(r,e[o])),Es=(t,e)=>{let[r]=j(()=>({pending:void 0}));N(()=>{let o=r.pending;r.pending=void 0;let s;return o!==void 0&&Bh(o.deps,e)?s=o:(o?.cleanup?.(),s={deps:e,cleanup:t()}),()=>{r.pending=s,queueMicrotask(()=>{r.pending===s&&(r.pending=void 0,s.cleanup?.())})}},e)};var wn=[],Lh={modelName:void 0,toolNames:wn},$h=(t,e)=>t===e||Se(t,e),Rs=(t,e)=>{let r=t.getModelContext(),o=r.config?.modelName,s=r.tools?Object.keys(r.tools).sort():wn,i=s.length?s:wn;return o===e.modelName&&$h(i,e.toolNames)?e:{modelName:o,toolNames:i}},jh=()=>{let t=v(11),e;t[0]===Symbol.for("react.memo_cache_sentinel")?(e=new Cs,t[0]=e):e=t[0];let r=e,o;t[1]===Symbol.for("react.memo_cache_sentinel")?(o=()=>Rs(r,Lh),t[1]=o):o=t[1];let[s,i]=j(o),n,a;t[2]===Symbol.for("react.memo_cache_sentinel")?(n=()=>(i(p=>Rs(r,p)),r.subscribe(()=>{i(p=>Rs(r,p))})),a=[r],t[2]=n,t[3]=a):(n=t[2],a=t[3]),N(n,a);let l;t[4]!==s?(l=()=>Rs(r,s),t[4]=s,t[5]=l):l=t[5];let c,d,u;t[6]===Symbol.for("react.memo_cache_sentinel")?(c=()=>r.getModelContext(),d=p=>r.subscribe(p),u=p=>r.registerModelContextProvider(p),t[6]=c,t[7]=d,t[8]=u):(c=t[6],d=t[7],u=t[8]);let m;return t[9]!==l?(m={getState:l,getModelContext:c,subscribe:d,register:u},t[9]=l,t[10]=m):m=t[10],m},As=L(jh);var oc=(t,e)=>{if(!(e.status?.type==="running"||e.status?.type==="requires-action")){let o=t.complete;return typeof o!="function"?o??null:o({args:e.args,result:e.result})}let r=t.running;return typeof r!="function"?r??null:r({args:e.args})};var sc=t=>t.display!==void 0?t.display==="standalone":t.type==="human",ic=t=>function(r){return oc(t,r)};var nc=t=>{let e=v(16),{toolkit:r,mcpApp:o}=t,s;e[0]!==o?(s=o?[oe("mcpApp",o)]:[],e[0]=o,e[1]=s):s=e[1];let i=sr(s)[0],[n,a]=j(Fh),l;e[2]!==i||e[3]!==n?(l={toolUIs:n,mcpApp:i},e[2]=i,e[3]=n,e[4]=l):l=e[4];let c=l,d=ao(),u;e[5]===Symbol.for("react.memo_cache_sentinel")?(u=(w,S,T)=>{let I={render:S,renderText:T?.renderText,standalone:T?.standalone??!1};return a(C=>{let R=ve(C);return R[w]=[...R[w]??[],I],R}),()=>{a(C=>{let R=C[w]?.filter(M=>M!==I)??[],_=ve(C);return R.length>0?(_[w]=R,_):(delete _[w],_)})}},e[5]=u):u=e[5];let m=u,p,f;e[6]!==r?(p=()=>{if(!r)return;let w=[];for(let[S,T]of Object.entries(r)){let I="render"in T?T.render:void 0,C="renderText"in T?T.renderText:void 0,R=I??(C?ic(C):void 0);R&&w.push(m(S,R,{standalone:sc(T),renderText:C}))}return()=>St(w)},f=[r,m],e[6]=r,e[7]=p,e[8]=f):(p=e[7],f=e[8]),N(p,f);let g;e[9]!==d||e[10]!==r?(g=()=>{if(!r)return;let w=Object.entries(r).reduce(Vh,ve());return d.current.modelContext().register({getModelContext:()=>({tools:w})})},e[9]=d,e[10]=r,e[11]=g):g=e[11];let b;e[12]!==r?(b=[r],e[12]=r,e[13]=b):b=e[13],lo("modelContext",g,b);let x;return e[14]!==c?(x={getState:()=>c,setToolUI:m},e[14]=c,e[15]=x):x=e[15],x},ac=L(nc);so(nc,(t,e)=>{!t.modelContext&&e.modelContext.source===null&&(t.modelContext=As())});function Fh(){return ve()}function Vh(t,e){let[r,o]=e;if(o.type==="mcp")return t;let{display:s,render:i,renderText:n,...a}=o;return t[r]=a,t}var Me=t=>xt(t.subscribe,t.getState,t.getServerSnapshot);var Uh=Symbol.for("assistant-ui.silent-runtime-action"),lc=t=>typeof t=="object"&&t!==null&&Uh in t;var Ms=(t,e)=>{let r=e();return r.catch(o=>{lc(o)||console.error(`[assistant-ui] ${t} failed:`,o)}),r};var zh=t=>{let e=v(9),{runtime:r}=t,o=Me(r),s;e[0]!==o?(s=()=>o,e[0]=o,e[1]=s):s=e[1];let i,n;e[2]!==r?(i=()=>Ms("attachment remove",r.remove),n=()=>r,e[2]=r,e[3]=i,e[4]=n):(i=e[3],n=e[4]);let a;return e[5]!==s||e[6]!==i||e[7]!==n?(a={getState:s,remove:i,__internal_getRuntime:n},e[5]=s,e[6]=i,e[7]=n,e[8]=a):a=e[8],a},Ps=L(zh);var Hh=t=>{let e=v(5),{runtime:r,index:o}=t,s;e[0]!==o||e[1]!==r?(s=r.getAttachmentByIndex(o),e[0]=o,e[1]=r,e[2]=s):s=e[2];let i=s,n;return e[3]!==i?(n=Ps({runtime:i}),e[3]=i,e[4]=n):n=e[4],be(n)},qh=L(Hh),Gh=({item:t,onMove:e,onRemove:r})=>({getState:()=>t,steer:()=>e({lane:"steer",insertAfter:null}),move:e,remove:r}),Wh=L(Gh),Kh=t=>{let e=v(65),{threadIdRef:r,messageIdRef:o,runtime:s,isSuggestion:i}=t,n=Me(s),a=Ze(),l=U(!1),c,d;e[0]!==a||e[1]!==o||e[2]!==s||e[3]!==r?(c=()=>{let O=[],B=s.unstable_on("send",z=>{let Y=l.current;l.current=!1,a("composer.send",{threadId:r.current,...o&&{messageId:o.current},chars:z.chars,attachments:z.attachments,...Y?{suggestion:!0}:void 0})});O.push(B);let W=s.unstable_on("attachmentAdd",z=>{a("composer.attachmentAdd",{threadId:r.current,...o&&{messageId:o.current},...z.contentType?{contentType:z.contentType}:void 0})});return O.push(W),O.push(s.unstable_on("attachmentAddError",z=>{a("composer.attachmentAddError",{threadId:r.current,...o&&{messageId:o.current},...z.attachmentId&&{attachmentId:z.attachmentId},reason:z.reason,message:z.message,...z.contentType?{contentType:z.contentType}:void 0})})),()=>St(O)},d=[s,a,r,o],e[0]=a,e[1]=o,e[2]=s,e[3]=r,e[4]=c,e[5]=d):(c=e[4],d=e[5]),N(c,d);let u;if(e[6]!==s||e[7]!==n.attachments){let O;e[9]!==s?(O=(B,W)=>oe(B.id,qh({runtime:s,index:W}),[s,W]),e[9]=s,e[10]=O):O=e[10],u=n.attachments.map(O),e[6]=s,e[7]=n.attachments,e[8]=u}else u=e[8];let m=me(u),p=n.queue,f;if(e[11]!==p||e[12]!==s){let O;e[14]!==s?(O=B=>oe(B.id,Wh({item:B,onMove:W=>s.moveQueueItem(B.id,W),onRemove:()=>s.removeQueueItem(B.id)})),e[14]=s,e[15]=O):O=e[15],f=p.map(O),e[11]=p,e[12]=s,e[13]=f}else f=e[13];let g=me(f),b=n.type??"thread",x;e[16]!==m.state||e[17]!==p||e[18]!==n.attachmentAccept||e[19]!==n.canCancel||e[20]!==n.canSend||e[21]!==n.dictation||e[22]!==n.inTransit||e[23]!==n.isEditing||e[24]!==n.isEmpty||e[25]!==n.quote||e[26]!==n.role||e[27]!==n.runConfig||e[28]!==n.submission||e[29]!==n.text||e[30]!==b?(x={text:n.text,role:n.role,attachments:m.state,runConfig:n.runConfig,isEditing:n.isEditing,canCancel:n.canCancel,canSend:n.canSend,attachmentAccept:n.attachmentAccept,isEmpty:n.isEmpty,type:b,dictation:n.dictation,quote:n.quote,queue:p,submission:n.submission,inTransit:n.inTransit},e[16]=m.state,e[17]=p,e[18]=n.attachmentAccept,e[19]=n.canCancel,e[20]=n.canSend,e[21]=n.dictation,e[22]=n.inTransit,e[23]=n.isEditing,e[24]=n.isEmpty,e[25]=n.quote,e[26]=n.role,e[27]=n.runConfig,e[28]=n.submission,e[29]=n.text,e[30]=b,e[31]=x):x=e[31];let w=x,S;e[32]!==w?(S=()=>w,e[32]=w,e[33]=S):S=e[33];let T;e[34]!==i||e[35]!==s?(T=O=>{let B=s.getState();l.current=B.canSend&&(i?.(B.text)??!1),s.send(O)},e[34]=i,e[35]=s,e[36]=T):T=e[36];let I;e[37]!==a||e[38]!==o||e[39]!==s||e[40]!==r?(I=()=>{!o&&s.getState().canCancel&&a("composer.cancel",{threadId:r.current}),s.cancel()},e[37]=a,e[38]=o,e[39]=s,e[40]=r,e[41]=I):I=e[41];let C=s.beginEdit??Jh,R;e[42]!==m?(R=O=>"id"in O?m.get({key:O.id}):m.get(O),e[42]=m,e[43]=R):R=e[43];let _;e[44]!==g?(_=O=>"id"in O?g.get({key:O.id}):g.get(O),e[44]=g,e[45]=_):_=e[45];let M;e[46]!==s?(M=()=>s,e[46]=s,e[47]=M):M=e[47];let D;return e[48]!==s.addAttachment||e[49]!==s.clearAttachments||e[50]!==s.reset||e[51]!==s.setQuote||e[52]!==s.setRole||e[53]!==s.setRunConfig||e[54]!==s.setText||e[55]!==s.startDictation||e[56]!==s.stopDictation||e[57]!==C||e[58]!==R||e[59]!==_||e[60]!==M||e[61]!==S||e[62]!==T||e[63]!==I?(D={getState:S,setText:s.setText,setRole:s.setRole,setRunConfig:s.setRunConfig,addAttachment:s.addAttachment,reset:s.reset,clearAttachments:s.clearAttachments,send:T,cancel:I,beginEdit:C,startDictation:s.startDictation,stopDictation:s.stopDictation,setQuote:s.setQuote,attachment:R,queueItem:_,__internal_getRuntime:M},e[48]=s.addAttachment,e[49]=s.clearAttachments,e[50]=s.reset,e[51]=s.setQuote,e[52]=s.setRole,e[53]=s.setRunConfig,e[54]=s.setText,e[55]=s.startDictation,e[56]=s.stopDictation,e[57]=C,e[58]=R,e[59]=_,e[60]=M,e[61]=S,e[62]=T,e[63]=I,e[64]=D):D=e[64],D},Os=L(Kh);function Jh(){throw new Error("beginEdit is not supported in this runtime")}var Ds=t=>({get current(){return t()}});var Qh=t=>{let e=v(17),{runtime:r}=t,o=Me(r),s;e[0]!==o?(s=()=>o,e[0]=o,e[1]=s):s=e[1];let i,n,a;e[2]!==r?(i=u=>r.addToolResult(u),n=u=>r.resumeToolCall(u),a=u=>r.respondToToolApproval(u),e[2]=r,e[3]=i,e[4]=n,e[5]=a):(i=e[3],n=e[4],a=e[5]);let l;e[6]!==r.unstable_recordInteraction?(l=r.unstable_recordInteraction&&{unstable_recordInteraction:u=>r.unstable_recordInteraction(u)},e[6]=r.unstable_recordInteraction,e[7]=l):l=e[7];let c;e[8]!==r?(c=()=>r,e[8]=r,e[9]=c):c=e[9];let d;return e[10]!==s||e[11]!==i||e[12]!==n||e[13]!==a||e[14]!==l||e[15]!==c?(d={getState:s,addToolResult:i,resumeToolCall:n,respondToToolApproval:a,...l,__internal_getRuntime:c},e[10]=s,e[11]=i,e[12]=n,e[13]=a,e[14]=l,e[15]=c,e[16]=d):d=e[16],d},cc=L(Qh);var Yh=t=>{let e=v(5),{runtime:r,index:o}=t,s;e[0]!==o||e[1]!==r?(s=r.getAttachmentByIndex(o),e[0]=o,e[1]=r,e[2]=s):s=e[2];let i=s,n;return e[3]!==i?(n=Ps({runtime:i}),e[3]=i,e[4]=n):n=e[4],be(n)},Xh=L(Yh),Zh=t=>{let e=v(5),{runtime:r,index:o}=t,s;e[0]!==o||e[1]!==r?(s=r.getMessagePartByIndex(o),e[0]=o,e[1]=r,e[2]=s):s=e[2];let i=s,n;return e[3]!==i?(n=cc({runtime:i}),e[3]=i,e[4]=n):n=e[4],be(n)},ef=L(Zh),tf=t=>{let e=v(77),{runtime:r,threadIdRef:o,threadId:s,isLast:i}=t,n=Me(r),a=Ze(),[l,c]=j(!1),[d,u]=j(!1),m;e[0]!==r?(m=Ds(()=>r.getState().id),e[0]=r,e[1]=m):m=e[1];let p=m,f=U(n.status),g;e[2]!==a||e[3]!==r||e[4]!==s?(g=H=>{a(H,{threadId:s,messageId:r.getState().id})},e[2]=a,e[3]=r,e[4]=s,e[5]=g):g=e[5];let b=g,x,w;e[6]!==a||e[7]!==n.id||e[8]!==n.status||e[9]!==s?(x=()=>{let H=n.status,we=f.current;f.current=H,H?.type==="incomplete"&&H.reason==="error"&&(we?.type!=="incomplete"||we.reason!=="error")&&a("message.error",{threadId:s,messageId:n.id,reason:"error"})},w=[n.status,n.id,a,s],e[6]=a,e[7]=n.id,e[8]=n.status,e[9]=s,e[10]=x,e[11]=w):(x=e[10],w=e[11]),N(x,w);let S;e[12]!==p||e[13]!==r.composer||e[14]!==o?(S=Os({runtime:r.composer,threadIdRef:o,messageIdRef:p}),e[12]=p,e[13]=r.composer,e[14]=o,e[15]=S):S=e[15];let T=dt(S),I;if(e[16]!==r||e[17]!==n.content){let H;e[19]!==r?(H=(we,nt)=>oe("toolCallId"in we&&we.toolCallId!=null?`toolCallId-${we.toolCallId}`:`index-${nt}`,ef({runtime:r,index:nt}),[r,nt]),e[19]=r,e[20]=H):H=e[20],I=n.content.map(H),e[16]=r,e[17]=n.content,e[18]=I}else I=e[18];let C=me(I),R;e[21]!==n.attachments?(R=n.attachments??[],e[21]=n.attachments,e[22]=R):R=e[22];let _;if(e[23]!==r||e[24]!==R){let H;e[26]!==r?(H=(we,nt)=>oe(we.id,Xh({runtime:r,index:nt}),[r,nt]),e[26]=r,e[27]=H):H=e[27],_=R.map(H),e[23]=r,e[24]=R,e[25]=_}else _=e[25];let M=me(_),D=n,O;e[28]!==i?(O=i===!1?{isLast:i}:{},e[28]=i,e[29]=O):O=e[29];let B;e[30]!==T.state||e[31]!==l||e[32]!==d||e[33]!==C.state||e[34]!==O||e[35]!==D?(B={...D,...O,parts:C.state,composer:T.state,isCopied:l,isHovering:d},e[30]=T.state,e[31]=l,e[32]=d,e[33]=C.state,e[34]=O,e[35]=D,e[36]=B):B=e[36];let W=B,z;e[37]!==W?(z=()=>W,e[37]=W,e[38]=z):z=e[38];let Y;e[39]!==T.methods?(Y=()=>T.methods,e[39]=T.methods,e[40]=Y):Y=e[40];let G;e[41]!==r?(G=()=>r.delete(),e[41]=r,e[42]=G):G=e[42];let Z,He;e[43]!==b||e[44]!==r?(Z=H=>(b("message.reload"),r.reload(H)),He=()=>(b("message.speak"),r.speak()),e[43]=b,e[44]=r,e[45]=Z,e[46]=He):(Z=e[45],He=e[46]);let st,vt;e[47]!==r?(st=()=>r.stopSpeaking(),vt=H=>r.submitFeedback(H),e[47]=r,e[48]=st,e[49]=vt):(st=e[48],vt=e[49]);let De;e[50]!==b||e[51]!==r?(De=H=>(b("message.branchSwitched"),r.switchToBranch(H)),e[50]=b,e[51]=r,e[52]=De):De=e[52];let Ne;e[53]!==r?(Ne=()=>r.unstable_getCopyText(),e[53]=r,e[54]=Ne):Ne=e[54];let Be;e[55]!==C?(Be=H=>"index"in H?C.get({index:H.index}):C.get({key:`toolCallId-${H.toolCallId}`}),e[55]=C,e[56]=Be):Be=e[56];let Le;e[57]!==M?(Le=H=>"id"in H?M.get({key:H.id}):M.get(H),e[57]=M,e[58]=Le):Le=e[58];let $e;e[59]!==b?($e=H=>{H&&b("message.copied"),c(H)},e[59]=b,e[60]=$e):$e=e[60];let je;e[61]!==r?(je=()=>r,e[61]=r,e[62]=je):je=e[62];let it;return e[63]!==z||e[64]!==Y||e[65]!==G||e[66]!==Z||e[67]!==He||e[68]!==st||e[69]!==vt||e[70]!==De||e[71]!==Ne||e[72]!==Be||e[73]!==Le||e[74]!==$e||e[75]!==je?(it={getState:z,composer:Y,delete:G,reload:Z,speak:He,stopSpeaking:st,submitFeedback:vt,switchToBranch:De,getCopyText:Ne,part:Be,attachment:Le,setIsCopied:$e,setIsHovering:u,__internal_getRuntime:je},e[63]=z,e[64]=Y,e[65]=G,e[66]=Z,e[67]=He,e[68]=st,e[69]=vt,e[70]=De,e[71]=Ne,e[72]=Be,e[73]=Le,e[74]=$e,e[75]=je,e[76]=it):it=e[76],it},dc=L(tf);var pt=t=>t.content.filter(e=>e.type==="text").map(e=>e.text).join(`

`);var Pe=Object.freeze({type:"complete"}),Ns=Object.freeze({type:"running"}),rf=Object.freeze({cancelled:Object.freeze({type:"incomplete",reason:"cancelled"}),length:Object.freeze({type:"incomplete",reason:"length"}),"content-filter":Object.freeze({type:"incomplete",reason:"content-filter"}),other:Object.freeze({type:"incomplete",reason:"other"}),error:Object.freeze({type:"incomplete",reason:"error"})}),yn=t=>{let e=t.status;if(!e||typeof e!="object")return;let{type:r}=e;if(r==="running")return Ns;if(r==="complete")return Pe;if(r!=="incomplete")return;let{reason:o}=e;return rf[o==="cancelled"||o==="length"||o==="content-filter"||o==="other"||o==="error"?o:"other"]},xn=t=>t.interrupt!=null||t.approval!=null&&t.approval.approved===void 0&&t.approval.resolution===void 0,Bs=(t,e,r)=>{if(t.role!=="assistant")return Pe;if(r.type==="tool-call")return r.result===void 0||r.isPreliminary||xn(r)?t.status:Pe;if(t.status.type==="running"){let s=yn(r);if(s)return s}let o=e===Math.max(0,t.content.length-1);return t.status.type==="requires-action"?Pe:o?t.status:Pe};var of=t=>{let e=v(7),{type:r}=t,o;e[0]===Symbol.for("react.memo_cache_sentinel")?(o=[],e[0]=o):o=e[0];let s;e[1]===Symbol.for("react.memo_cache_sentinel")?(s={},e[1]=s):s=e[1];let i;e[2]===Symbol.for("react.memo_cache_sentinel")?(i=[],e[2]=i):i=e[2];let n;e[3]!==r?(n={isEditing:!1,isEmpty:!0,text:"",attachmentAccept:"*",attachments:o,role:"user",runConfig:s,canCancel:!1,canSend:!1,type:r,dictation:void 0,quote:void 0,queue:i,submission:void 0,inTransit:void 0},e[3]=r,e[4]=n):n=e[4];let a=n,l;return e[5]!==a?(l={getState:()=>a,setText:sf,setRole:nf,setRunConfig:af,addAttachment:lf,clearAttachments:cf,attachment:df,reset:uf,send:pf,cancel:mf,startDictation:hf,stopDictation:ff,beginEdit:gf,setQuote:vf,queueItem:bf},e[5]=a,e[6]=l):l=e[6],l},uc=L(of);function sf(){throw new Error("Not supported")}function nf(){throw new Error("Not supported")}function af(){throw new Error("Not supported")}function lf(){throw new Error("Not supported")}function cf(){throw new Error("Not supported")}function df(){throw new Error("Not supported")}function uf(){throw new Error("Not supported")}function pf(){throw new Error("Not supported")}function mf(){throw new Error("Not supported")}function hf(){throw new Error("Not supported")}function ff(){throw new Error("Not supported")}function gf(){throw new Error("Not supported")}function vf(){throw new Error("Not supported")}function bf(){throw new Error("Not supported")}var wf=t=>{let e=v(8),{part:r,isMessageRunning:o}=t,s;e[0]!==o||e[1]!==r?(s=o?yn(r)??Pe:Pe,e[0]=o,e[1]=r,e[2]=s):s=e[2];let i;e[3]!==r||e[4]!==s?(i={...r,status:s},e[3]=r,e[4]=s,e[5]=i):i=e[5];let n=i,a;return e[6]!==n?(a={getState:()=>n,addToolResult:Tf,resumeToolCall:kf,respondToToolApproval:If,unstable_recordInteraction:Cf},e[6]=n,e[7]=a):a=e[7],a},yf=L(wf),xf=({attachment:t})=>({getState:()=>t,remove:()=>{throw new Error("Not supported")}}),_f=L(xf),Sf=t=>{let e=v(38),{message:r,index:o,isLast:s,branchNumber:i,branchCount:n,submission:a}=t,l=s===void 0?!0:s,c=i===void 0?1:i,d=n===void 0?1:n,[u,m]=j(!1),[p,f]=j(!1),g=r.role==="assistant"&&r.status.type==="running",b;if(e[0]!==g||e[1]!==r.content){let G;e[3]!==g?(G=(Z,He)=>oe("toolCallId"in Z&&Z.toolCallId!=null?`toolCallId-${Z.toolCallId}`:`index-${He}`,yf({part:Z,isMessageRunning:g}),[Z,g]),e[3]=g,e[4]=G):G=e[4],b=r.content.map(G),e[0]=g,e[1]=r.content,e[2]=b}else b=e[2];let x=me(b),w;e[5]!==r.attachments||e[6]!==a?.attachments?(w=a?.attachments??r.attachments??[],e[5]=r.attachments,e[6]=a?.attachments,e[7]=w):w=e[7];let S;e[8]!==w?(S=w.map(Ef),e[8]=w,e[9]=S):S=e[9];let T=me(S),I;e[10]===Symbol.for("react.memo_cache_sentinel")?(I=uc({type:"edit"}),e[10]=I):I=e[10];let C=dt(I),R=C.state,_;e[11]!==d||e[12]!==c||e[13]!==R||e[14]!==o||e[15]!==u||e[16]!==p||e[17]!==l||e[18]!==r||e[19]!==x.state||e[20]!==a?(_={...r,parts:x.state,composer:R,parentId:null,index:o,isLast:l,branchNumber:c,branchCount:d,speech:void 0,isCopied:u,isHovering:p,submission:a},e[11]=d,e[12]=c,e[13]=R,e[14]=o,e[15]=u,e[16]=p,e[17]=l,e[18]=r,e[19]=x.state,e[20]=a,e[21]=_):_=e[21];let M=_,D;e[22]!==M?(D=()=>M,e[22]=M,e[23]=D):D=e[23];let O;e[24]!==C.methods?(O=()=>C.methods,e[24]=C.methods,e[25]=O):O=e[25];let B;e[26]!==x?(B=G=>"index"in G?x.get({index:G.index}):x.get({key:`toolCallId-${G.toolCallId}`}),e[26]=x,e[27]=B):B=e[27];let W;e[28]!==T?(W=G=>"id"in G?T.get({key:G.id}):T.get(G),e[28]=T,e[29]=W):W=e[29];let z;e[30]!==r?(z=()=>pt(r),e[30]=r,e[31]=z):z=e[31];let Y;return e[32]!==O||e[33]!==B||e[34]!==W||e[35]!==z||e[36]!==D?(Y={getState:D,composer:O,part:B,attachment:W,delete:Rf,reload:Af,speak:Mf,stopSpeaking:Pf,submitFeedback:Of,switchToBranch:Df,getCopyText:z,setIsCopied:m,setIsHovering:f},e[32]=O,e[33]=B,e[34]=W,e[35]=z,e[36]=D,e[37]=Y):Y=e[37],Y},pc=L(Sf);function Tf(){throw new Error("Not supported")}function kf(){throw new Error("Not supported")}function If(){throw new Error("Not supported")}async function Cf(){}function Ef(t){return oe(t.id,_f({attachment:t}),[t])}function Rf(){throw new Error("Not supported in ThreadMessageProvider")}function Af(){throw new Error("Not supported in ThreadMessageProvider")}function Mf(){throw new Error("Not supported in ThreadMessageProvider")}function Pf(){throw new Error("Not supported in ThreadMessageProvider")}function Of(){throw new Error("Not supported in ThreadMessageProvider")}function Df(){throw new Error("Not supported in ThreadMessageProvider")}var Ls=(t,e=21)=>(r=e)=>{let o="",s=r|0;for(;s-- >0;)o+=t[Math.random()*t.length|0];return o};var Ie=Ls("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",7),Nf="__error__";var mc=t=>t.startsWith(Nf);function hc(t){let e=t.match(/^data:([^;,]*)(?:;[^;,]+)*;base64,(.*)$/i);return e?{mimeType:e[1].toLowerCase()||"text/plain",data:e[2]}:null}var Er={entries:32,payloadLength:16384,logLength:65536},Bf=64,Lf=t=>{let e=Object.getPrototypeOf(t);return e===Object.prototype||e===null},$s=(t,e,r)=>{if(t===null)return!0;switch(typeof t){case"string":case"boolean":return!0;case"number":return Number.isFinite(t);case"object":break;default:return!1}if(r>Bf||e.has(t))return!1;e.add(t);let o=Array.isArray(t)?t.every(s=>$s(s,e,r+1)):Lf(t)&&Object.values(t).every(s=>$s(s,e,r+1));return e.delete(t),o},js=t=>typeof t=="object"&&t!==null&&!Array.isArray(t),fc=t=>t==="action"||t==="human-response";function gc(t,e=Date.now()){let{type:r,payload:o}=t;if(!fc(r))throw new Error(`Unknown tool interaction type: ${String(r)}`);if(!$s(o,new Set,0))throw new Error("A tool interaction payload must be plain JSON.");if(r==="action"&&!js(o))throw new Error("An action interaction payload must be a JSON object.");let s=JSON.stringify(o);if(s.length>Er.payloadLength)throw new Error(`A tool interaction payload is limited to ${Er.payloadLength} characters of JSON.`);return{type:r,occurredAt:e,payload:JSON.parse(s)}}function vc(t,e){let r=[...t?.entries??[],e],o=t?.omitted??0;for(;r.length>1&&(r.length>Er.entries||JSON.stringify(r).length>Er.logLength);)r.shift(),o+=1;return o>0?{entries:r,omitted:o}:{entries:r}}var $f=t=>{if(!js(t))return;let{type:e,occurredAt:r,payload:o}=t;if(fc(e)&&!(typeof r!="number"||!Number.isFinite(r))&&$s(o,new Set,0))return e==="action"?js(o)?{type:e,occurredAt:r,payload:o}:void 0:{type:e,occurredAt:r,payload:o}};function Fs(t){if(!js(t))return;let{entries:e,omitted:r}=t,o=Array.isArray(e)?e.flatMap(i=>{let n=$f(i);return n?[n]:[]}):[],s=typeof r=="number"&&Number.isInteger(r)&&r>0?r:0;for(;o.length>1&&(o.length>Er.entries||JSON.stringify(o).length>Er.logLength);)o.shift(),s+=1;if(!(o.length===0&&s===0))return s>0?{entries:o,omitted:s}:{entries:o}}async function*jf(){let t=this.getReader(),e=!0;try{for(;;){let r;try{r=await t.read()}catch(s){throw e=!1,s}if(r.done){e=!1;break}let{value:o}=r;yield o}}finally{try{e&&await t.cancel()}finally{t.releaseLock()}}}function Vs(t){var e;return t[e=Symbol.asyncIterator]??(t[e]=jf),t}var Ff=/[0-9a-fA-F]/;function bc(t){let e=["ROOT"],r=-1,o=null,s=0,i=[],n;function a(){n!==void 0&&(i.push(JSON.parse(`"${n}"`)),n=void 0)}function l(m,p,f){switch(m){case'"':r=p,e.pop(),e.push(f),e.push("INSIDE_STRING"),a();break;case"f":case"t":case"n":r=p,o=p,e.pop(),e.push(f),e.push("INSIDE_LITERAL");break;case"-":e.pop(),e.push(f),e.push("INSIDE_NUMBER"),a();break;case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":r=p,e.pop(),e.push(f),e.push("INSIDE_NUMBER"),a();break;case"{":r=p,e.pop(),e.push(f),e.push("INSIDE_OBJECT_START"),a();break;case"[":r=p,e.pop(),e.push(f),e.push("INSIDE_ARRAY_START"),a()}}function c(m,p){switch(m){case",":e.pop(),e.push("INSIDE_OBJECT_AFTER_COMMA");break;case"}":r=p,e.pop(),n=i.pop()}}function d(m,p){switch(m){case",":e.pop(),e.push("INSIDE_ARRAY_AFTER_COMMA"),n=(Number(n)+1).toString();break;case"]":r=p,e.pop(),n=i.pop()}}for(let m=0;m<t.length;m++){let p=t[m];switch(e[e.length-1]){case"ROOT":l(p,m,"FINISH");break;case"INSIDE_OBJECT_START":switch(p){case'"':e.pop(),e.push("INSIDE_OBJECT_KEY"),n="";break;case"}":r=m,e.pop(),n=i.pop()}break;case"INSIDE_OBJECT_AFTER_COMMA":p==='"'&&(e.pop(),e.push("INSIDE_OBJECT_KEY"),n="");break;case"INSIDE_OBJECT_KEY":switch(p){case'"':e.pop(),e.push("INSIDE_OBJECT_AFTER_KEY");break;case"\\":e.push("INSIDE_STRING_ESCAPE"),n+=p;break;default:n+=p}break;case"INSIDE_OBJECT_AFTER_KEY":p===":"&&(e.pop(),e.push("INSIDE_OBJECT_BEFORE_VALUE"));break;case"INSIDE_OBJECT_BEFORE_VALUE":l(p,m,"INSIDE_OBJECT_AFTER_VALUE");break;case"INSIDE_OBJECT_AFTER_VALUE":c(p,m);break;case"INSIDE_STRING":switch(p){case'"':e.pop(),r=m,n=i.pop();break;case"\\":e.push("INSIDE_STRING_ESCAPE");break;default:r=m}break;case"INSIDE_ARRAY_START":p==="]"?(r=m,e.pop(),n=i.pop()):(n="0",l(p,m,"INSIDE_ARRAY_AFTER_VALUE"));break;case"INSIDE_ARRAY_AFTER_VALUE":switch(p){case",":e.pop(),e.push("INSIDE_ARRAY_AFTER_COMMA"),n=(Number(n)+1).toString();break;case"]":r=m,e.pop(),n=i.pop();break;default:r=m}break;case"INSIDE_ARRAY_AFTER_COMMA":l(p,m,"INSIDE_ARRAY_AFTER_VALUE");break;case"INSIDE_STRING_ESCAPE":{e.pop();let f=e[e.length-1];p==="u"?(e.push("INSIDE_STRING_UNICODE_ESCAPE"),s=0):f==="INSIDE_STRING"&&(r=m),f==="INSIDE_OBJECT_KEY"&&(n+=p);break}case"INSIDE_STRING_UNICODE_ESCAPE":{let f=e[e.length-2];if(!Ff.test(p)){e.pop(),m--;break}s++,s===4&&(e.pop(),f==="INSIDE_STRING"&&(r=m)),f==="INSIDE_OBJECT_KEY"&&(n+=p);break}case"INSIDE_NUMBER":switch(p){case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":r=m;break;case"e":case"E":case"-":case"+":case".":break;case",":e.pop(),n=i.pop(),e[e.length-1]==="INSIDE_ARRAY_AFTER_VALUE"&&d(p,m),e[e.length-1]==="INSIDE_OBJECT_AFTER_VALUE"&&c(p,m);break;case"}":e.pop(),n=i.pop(),e[e.length-1]==="INSIDE_OBJECT_AFTER_VALUE"&&c(p,m);break;case"]":e.pop(),n=i.pop(),e[e.length-1]==="INSIDE_ARRAY_AFTER_VALUE"&&d(p,m);break;default:e.pop(),n=i.pop()}break;case"INSIDE_LITERAL":{let f=t.substring(o,m+1);!"false".startsWith(f)&&!"true".startsWith(f)&&!"null".startsWith(f)?(e.pop(),e[e.length-1]==="INSIDE_OBJECT_AFTER_VALUE"?c(p,m):e[e.length-1]==="INSIDE_ARRAY_AFTER_VALUE"&&d(p,m)):r=m;break}}}let u=t.slice(0,r+1);for(let m=e.length-1;m>=0;m--)switch(e[m]){case"INSIDE_STRING":u+='"';break;case"INSIDE_OBJECT_KEY":case"INSIDE_OBJECT_AFTER_KEY":case"INSIDE_OBJECT_AFTER_COMMA":case"INSIDE_OBJECT_START":case"INSIDE_OBJECT_BEFORE_VALUE":case"INSIDE_OBJECT_AFTER_VALUE":u+="}";break;case"INSIDE_ARRAY_START":case"INSIDE_ARRAY_AFTER_COMMA":case"INSIDE_ARRAY_AFTER_VALUE":u+="]";break;case"INSIDE_LITERAL":{let p=t.substring(o,t.length);"true".startsWith(p)?u+="true".slice(p.length):"false".startsWith(p)?u+="false".slice(p.length):"null".startsWith(p)&&(u+="null".slice(p.length))}}return[u,i]}var Tn=qe(Sn(),1),Us=Symbol("aui.parse-partial-json-object.meta"),Sc=t=>t?.[Us],Ar=t=>{if(t.length===0)return{[Us]:{state:"partial",partialPath:[]}};try{let e=Tn.default.parse(t);if(typeof e!="object"||e===null)throw new Error("argsText is expected to be an object");return e[Us]={state:"complete",partialPath:[]},e}catch{try{let[e,r]=bc(t),o=Tn.default.parse(e);if(typeof o!="object"||o===null)throw new Error("argsText is expected to be an object");return o[Us]={state:"partial",partialPath:r},o}catch{return}}},Tc=(t,e,r)=>{if(typeof t!="object"||t===null)return e.state;if(e.state==="complete")return"complete";if(r.length===0)return e.state;let[o,...s]=r;if(!Object.hasOwn(t,o))return"partial";let[i,...n]=e.partialPath;if(o!==i)return"complete";let a=t[o];return Tc(a,{state:"partial",partialPath:n},s)},lr=(t,e)=>{let r=Sc(t);if(!r)throw new Error("unable to determine object state");return Tc(t,r,e.map(String))};var kc=Ls("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",7);var Mr=()=>{let t,e,r=new Promise((o,s)=>{t=o,e=s});if(!t||!e)throw new Error("Failed to create promise");return{promise:r,resolve:t,reject:e}};var Ic=()=>{let t=[],e=!1,r=!1,o=!1,s,i,n=0,a,l,c=()=>(i=void 0,l??(l=Promise.all(t.splice(0).map(async g=>{try{await g.reader.cancel().catch(()=>{}),await g.pipeTask}finally{g.reader.releaseLock()}})).then(()=>{})),l),d=g=>{r||o||(o=!0,console.error(g),c(),s.error(g),a?.reject(g),a=void 0)},u=g=>{g.promise||(g.promise=g.reader.read().then(({done:b,value:x})=>{g.promise=void 0,!(r||o)&&(b?(t.splice(t.indexOf(g),1),g.reader.releaseLock(),e&&t.length===0&&n===0&&s.close()):s.enqueue(x),a?.resolve(),a=void 0)}).catch(d))},m=new ReadableStream({start(g){s=g},pull(){return a=Mr(),t.forEach(g=>{u(g)}),a.promise},async cancel(){r=!0;let g=c();a?.resolve(),a=void 0,await g}}),p=g=>{if(t.length>0&&(i=void 0),!i){let b=[];i=b,n++,Promise.resolve().then(()=>{if(n--,i===b&&(i=void 0),!(r||o)){for(let x of b)s.enqueue(x);e&&t.length===0&&n===0&&s.close(),a?.resolve(),a=void 0}}).catch(d)}i.push(g)};return{readable:m,isSealed(){return e},isCancelled(){return r},isErrored(){return o},seal(){e||r||o||(e=!0,t.length===0&&n===0&&s.close())},addStream:(g,b)=>{let x=b?.catch(()=>{});if(r||o){g.cancel().catch(()=>{});return}if(e)throw g.cancel().catch(()=>{}),new Error("Cannot add streams after the run callback has settled.");i=void 0;let w={reader:g.getReader(),pipeTask:x};t.push(w),u(w)},enqueue(g){if(!(r||o)){if(e)throw new Error("Cannot add streams after the run callback has settled.");p(g)}}}};var zs=(t,e)=>new ReadableStream({start(r){return t.start?.(e(r))},pull(r){return t.pull?.(e(r))},cancel(r){return t.cancel?.(r)}}),Hs=(t,e)=>{let r;return[zs({start(o){r=o},cancel(o){return e?.(r,o)}},t),r]};var Cc=t=>t instanceof TypeError,Oe=(t,e,r)=>{try{t.enqueue(e)}catch(o){if(!Cc(o))throw o;r?.(o)}},qs=t=>{try{t.close()}catch(e){if(!Cc(e))throw e}};var Ec=class{constructor(t,e={}){h(this,"_controller");h(this,"_strict");h(this,"_isClosed",!1);h(this,"_warnedDropped",!1);h(this,"_warnDroppedAfterClose",t=>{this._warnedDropped||(this._warnedDropped=!0,console.error(`Dropped text delta for closed stream: ${String(t)}`))});this._controller=t,this._strict=e.strict??!0}append(t){let e={type:"text-delta",path:[],textDelta:t};if(this._isClosed){if(this._strict)throw new TypeError("Cannot append to a closed TextStreamController");return Oe(this._controller,e,this._warnDroppedAfterClose),this}return Oe(this._controller,e),this}close(){this._isClosed||(this._isClosed=!0,Oe(this._controller,{type:"part-finish",path:[]}),qs(this._controller))}},Rc=(t,e={})=>zs(t,r=>new Ec(r,e)),kn=(t={})=>Hs(e=>new Ec(e,t));var Ac=Symbol.for("aui.tool-response"),Gs="<no result>",Ve=class In{constructor(e){h(this,"artifact");h(this,"result");h(this,"isError");h(this,"isPreliminary");h(this,"modelContent");h(this,"messages");e.artifact!==void 0&&(this.artifact=e.artifact);let r=e.result;this.result=r===void 0?Gs:r,this.isError=e.isError??!1,e.isPreliminary&&(this.isPreliminary=!0),e.modelContent!==void 0&&(this.modelContent=e.modelContent),e.messages!==void 0&&(this.messages=e.messages)}get[Ac](){return!0}static[Symbol.hasInstance](e){return typeof e=="object"&&e!==null&&Ac in e}static toResponse(e){return e instanceof In?e:new In({result:e===void 0?Gs:e})}};var zf=class{constructor(t,e={}){h(this,"_isClosed",!1);h(this,"_mergeTask");h(this,"_controller");h(this,"_argsTextController");this._controller=t;let r=Rc({start:s=>{this._argsTextController=s}},e),o=!1;this._mergeTask=r.pipeTo(new WritableStream({write:s=>{switch(s.type){case"text-delta":o=!0,Oe(this._controller,s);break;case"part-finish":o||Oe(this._controller,{type:"text-delta",textDelta:"{}",path:[]}),Oe(this._controller,{type:"tool-call-args-text-finish",path:[]});break;default:throw new Error(`Unexpected chunk type: ${s.type}`)}}}))}get argsText(){return this._argsTextController}async setResponse(t){if(this._isClosed)return;let e=t.result;Oe(this._controller,{type:"result",path:[],...t.artifact!==void 0?{artifact:t.artifact}:{},result:e===void 0?Gs:e,isError:t.isError??!1,...t.isPreliminary?{isPreliminary:!0}:{},...t.modelContent!==void 0?{modelContent:t.modelContent}:{},...t.messages!==void 0?{messages:t.messages}:{}}),t.isPreliminary?this._argsTextController.close():await this.close()}async close(){this._isClosed||(this._isClosed=!0,this._argsTextController.close(),await this._mergeTask,Oe(this._controller,{type:"part-finish",path:[]}),qs(this._controller))}};var Mc=(t={})=>Hs(e=>new zf(e,t));var Ws=class{constructor(){h(this,"value",-1)}up(){return++this.value}};var Pc=class extends TransformStream{constructor(t){super({transform(e,r){r.enqueue({...e,path:[t,...e.path]})}})}},cI=class extends TransformStream{constructor(t){super({transform(e,r){let{path:[o,...s]}=e;if(t!==o)throw new Error(`Path mismatch: expected ${t}, got ${o}`);r.enqueue({...e,path:s})}})}},Oc=class extends TransformStream{constructor(t){let e=new Ws,r=new Map;super({transform(o,s){o.type==="part-start"&&o.path.length===0&&r.set(e.up(),t.up());let[i,...n]=o.path;if(i===void 0){s.enqueue(o);return}let a=r.get(i);if(a===void 0)throw new Error("Path not found");s.enqueue({...o,path:[a,...n]})}})}};var Hf=class Dc{constructor(e,r={}){h(this,"_state");h(this,"_parentId");this._state=e||{strict:r.strict??!0,merger:Ic(),contentCounter:new Ws}}get __internal_isClosed(){return this._state.merger.isSealed()||this._state.merger.isCancelled()||this._state.merger.isErrored()}get __internal_isCancelled(){return this._state.merger.isCancelled()}__internal_getReadable(){return this._state.merger.readable}__internal_subscribeToClose(e){this._state.closeSubscriber=e}_addTransformedStream(e,r){if(e.locked)throw new TypeError("Cannot merge a stream that is already locked to a reader.");let o=e.pipeTo(r.writable).catch(async s=>{throw await r.writable.abort(s).catch(()=>{}),s});this._state.merger.addStream(r.readable,o)}_addPart(e,r){this._state.append&&(this._state.append.controller.close(),this._state.append=void 0),this.enqueue({type:"part-start",part:e,path:[]}),this._addTransformedStream(r,new Pc(this._state.contentCounter.value))}merge(e){this._addTransformedStream(e,new Oc(this._state.contentCounter))}appendText(e){(this._state.append?.kind!=="text"||this._state.append.parentId!==this._parentId)&&(this._state.append={kind:"text",parentId:this._parentId,controller:this.addTextPart()}),this._state.append.controller.append(e)}appendReasoning(e,r){(r!==void 0||this._state.append?.kind!=="reasoning"||this._state.append.parentId!==this._parentId)&&(this._state.append={kind:"reasoning",parentId:this._parentId,controller:this.addReasoningPart(r)}),!(r!==void 0&&e.length===0)&&this._state.append.controller.append(e)}addTextPart(){let[e,r]=kn({strict:this._state.strict});return this._addPart(this._withParentIdOption({type:"text"}),e),r}addReasoningPart(e){let[r,o]=kn({strict:this._state.strict});return this._addPart(this._withParentIdOption({type:"reasoning",...e}),r),o}addToolCallPart(e){let r=typeof e=="string"?{toolName:e}:e,o=r.toolName,s=r.toolCallId??kc(),[i,n]=Mc({strict:this._state.strict});return this._addPart({type:"tool-call",toolName:o,toolCallId:s,...this._parentId&&{parentId:this._parentId}},i),r.argsText!==void 0&&(n.argsText.append(r.argsText),n.argsText.close()),r.args!==void 0&&(n.argsText.append(JSON.stringify(r.args)),n.argsText.close()),r.response!==void 0&&n.setResponse(r.response),n}_finishedPartStream(){return new ReadableStream({start(e){e.enqueue({type:"part-finish",path:[]}),e.close()}})}_withParentIdOption(e){return this._parentId?{...e,parentId:this._parentId}:e}appendSource(e){this._addPart(this._withParentIdOption(e),this._finishedPartStream())}appendFile(e){this._addPart(this._withParentIdOption(e),this._finishedPartStream())}appendData(e){this._addPart(this._withParentIdOption(e),this._finishedPartStream())}enqueue(e){this._state.merger.enqueue(e),e.type==="part-start"&&e.path.length===0&&this._state.contentCounter.up()}withParentId(e){let r=new Dc(this._state);return r._parentId=e,r}close(){this._state.append?.controller?.close(),this._state.merger.seal(),this._state.closeSubscriber?.()}};function Nc(t,e={}){let r=new Hf(void 0,e);return(async()=>{try{await t(r)}catch(s){r.__internal_isClosed?r.__internal_isCancelled||console.error(s):r.enqueue({type:"error",path:[],error:String(s)})}finally{r.__internal_isClosed||r.close()}})(),r.__internal_getReadable()}function Cn(t={}){let{resolve:e,promise:r}=Mr(),o;return[Nc(s=>(o=s,o.__internal_subscribeToClose(e),r),t),o]}var po=class extends TransformStream{constructor(){let t=[];super({transform(e,r){if(e.type==="part-start"){if(e.path.length!==0){r.error(new Error("Nested parts are not supported"));return}t.push(e.part),r.enqueue(e);return}if(e.type==="text-delta"||e.type==="result"||e.type==="part-finish"||e.type==="tool-call-args-text-finish"){if(e.path.length!==1){r.error(new Error(`${e.type} chunks must have a path of length 1`));return}let o=e.path[0];if(o<0||o>=t.length){r.error(new Error(`Invalid path index: ${o}`));return}let s=t[o];r.enqueue({...e,meta:s});return}r.enqueue(e)}})}};var En=(t,e)=>{if(t.startsWith("data-"))return{type:"data",name:t.substring(5),data:e}},Ht=(t,e,r)=>{let{role:o,id:s,createdAt:i,attachments:n,status:a,metadata:l}=t,c={id:s??e,createdAt:i??new Date},d=typeof t.content=="string"?[{type:"text",text:t.content}]:t.content,u=({image:m,...p})=>typeof m!="string"?null:hc(m)?.mimeType.startsWith("image/")?{...p,image:m}:/^(https:\/\/|blob:)/i.test(m)?{...p,image:m}:(console.warn("Invalid image data format detected"),null);if(o!=="user"&&n?.length)throw new Error("attachments are only supported for user messages");if(o!=="assistant"&&a)throw new Error("status is only supported for assistant messages");if(o!=="assistant"&&l?.steps)throw new Error("metadata.steps is only supported for assistant messages");switch(o){case"assistant":return{...c,role:o,content:d.map(m=>{let p=m.type;switch(p){case"text":return m.text?.trim()?m:null;case"reasoning":return!m.text?.trim()&&!m.unstable_summary?.trim()?null:m;case"file":case"source":return m;case"image":return u(m);case"data":return m;case"generative-ui":return m;case"tool-call":{let{parentId:f,messages:g,unstable_interactions:b,...x}=m,w=Fs(b),S={...x,toolCallId:m.toolCallId||`tool-${Ie()}`,...f!==void 0&&{parentId:f},...g!==void 0&&{messages:g},...w!==void 0&&{unstable_interactions:w}};return m.args?{...S,args:m.args,argsText:m.argsText??JSON.stringify(m.args)}:{...S,args:Ar(m.argsText??"")??{},argsText:m.argsText??""}}case"audio":throw new Error(`Unsupported assistant message part type: ${p}`);default:{let f=p,g=En(f,m.data);if(g)return g;throw new Error(`Unsupported assistant message part type: ${f}`)}}}).filter(m=>!!m),status:a??r,metadata:{unstable_state:l?.unstable_state??null,unstable_annotations:l?.unstable_annotations??[],unstable_data:l?.unstable_data??[],custom:l?.custom??{},steps:l?.steps??[],...l?.timing&&{timing:l.timing},...l?.submittedFeedback&&{submittedFeedback:l.submittedFeedback},...l?.isOptimistic&&{isOptimistic:!0},...l?.modality&&{modality:l.modality}}};case"user":return{...c,role:o,content:d.map(m=>{let p=m.type;switch(p){case"text":case"image":case"audio":case"file":case"data":return m;case"reasoning":case"source":case"generative-ui":case"tool-call":throw new Error(`Unsupported user message part type: ${p}`);default:{let f=p,g=En(f,m.data);if(g)return g;throw new Error(`Unsupported user message part type: ${f}`)}}}),attachments:(n??[]).map(m=>({...m,content:m.content.map(p=>En(p.type,p.data)??p)})),metadata:{custom:l?.custom??{},...l?.isOptimistic&&{isOptimistic:!0},...l?.modality&&{modality:l.modality}}};case"system":if(d.length!==1||d[0].type!=="text")throw new Error("System messages must have exactly one text message part.");return{...c,role:o,content:d,metadata:{custom:l?.custom??{}}};default:throw new Error(`Unknown message role: ${o}`)}};var Bc=t=>Ht({role:t.role,content:t.role==="system"||t.text?[{type:"text",text:t.text}]:[],attachments:[],metadata:{custom:{...t.quote?{quote:t.quote}:{}}}},t.id,{type:"complete",reason:"unknown"});var qf=t=>{let e=K(()=>({}),[]),r=e.state,o=[];t.suggestions.forEach(i=>{let n=r?.suggestions[o.length];o.push(n&&Se(n,i)?n:i)});let s=r&&Se(o,r.suggestions)?r:{suggestions:o};return e.state=s,s},Gf=t=>({getState:()=>t}),Wf=L(Gf),Lc=t=>{let e=v(9),r=qf(t),o;e[0]!==r.suggestions?(o=r.suggestions.map(Qf),e[0]=r.suggestions,e[1]=o):o=e[1];let s=me(o),i;e[2]!==r?(i=()=>r,e[2]=r,e[3]=i):i=e[3];let n;e[4]!==s?(n=l=>{let{index:c}=l;return s.get({index:c})},e[4]=s,e[5]=n):n=e[5];let a;return e[6]!==i||e[7]!==n?(a={getState:i,suggestion:n},e[6]=i,e[7]=n,e[8]=a):a=e[8],a},Kf=t=>{let e=v(6),r;e[0]!==t?(r=t??[],e[0]=t,e[1]=r):r=e[1];let o;e[2]!==r?(o=r.map(Yf),e[2]=r,e[3]=o):o=e[3];let s;return e[4]!==o?(s={suggestions:o},e[4]=o,e[5]=s):s=e[5],Lc(s)},FI=L(Kf),Jf=t=>{let e=v(4),r;e[0]!==t?(r=t.map(Xf),e[0]=t,e[1]=r):r=e[1];let o;return e[2]!==r?(o={suggestions:r},e[2]=r,e[3]=o):o=e[3],Lc(o)},$c=L(Jf);function Qf(t,e){return oe(e,Wf(t),[t])}function Yf(t){return typeof t=="string"?{title:t,label:"",prompt:t}:{title:t.title,label:t.label,prompt:t.prompt}}function Xf(t){return{title:t.title??t.prompt,label:t.label??"",prompt:t.prompt}}var Zf=t=>"reason"in t?t.reason:void 0,eg=t=>"error"in t?t.error:void 0,tg=32,jc=new WeakMap,Rn=t=>jc.get(t)??t.id,rg=(t,e,r)=>"status"in t&&t.status?Bs(t,e,r):Pe,Fc=()=>{let t=[],e=new Map;return r=>{let o=[],s=new Map,i=!0,n=(l,c,d,u)=>{if(!(d>tg))for(let[m,p]of l.entries())for(let[f,g]of p.content.entries()){if(g.type!=="tool-call"||g.messages===void 0)continue;let b=g.messages,x=rg(p,f,g),w=Zf(x),S=eg(x),T=`${u}${m}.${f}`,I=e.get(T),C=I?.part===g&&I.statusType===x.type&&I.statusReason===w&&Object.is(I.statusError,S)&&I.messages===b&&I.task.messageId===p.id&&I.task.parentTaskId===c&&I.task.depth===d?I.task:{id:g.toolCallId,toolName:g.toolName,args:g.args,result:g.result,...g.isError===void 0?void 0:{isError:g.isError},status:x,timing:g.timing,messageId:p.id,parentTaskId:c,depth:d,messages:b};C!==I?.task&&(i=!1,jc.set(C,T)),o.push(C),s.set(T,{task:C,part:g,statusType:x.type,statusReason:w,statusError:S,messages:b}),n(b,C.id,d+1,`${T}.`)}};n(r,null,0,"");let a=i&&o.length===t.length&&o.every((l,c)=>l===t[c])?t:o;return t=a,e=s,a}},og=({task:t})=>({getState:()=>t}),Vc=L(og);var sg=t=>{let e=v(8),{runtime:r,id:o,threadIdRef:s,threadId:i,isLast:n}=t,a;e[0]!==o||e[1]!==r?(a=r.getMessageById(o),e[0]=o,e[1]=r,e[2]=a):a=e[2];let l=a,c;return e[3]!==n||e[4]!==l||e[5]!==i||e[6]!==s?(c=dc({runtime:l,threadIdRef:s,threadId:i,isLast:n}),e[3]=n,e[4]=l,e[5]=i,e[6]=s,e[7]=c):c=e[7],be(c)},ig=L(sg),ng=t=>{let e=v(111),{runtime:r}=t,o=Me(r),s=Ze(),i,n;e[0]!==s||e[1]!==r?(i=()=>{let ee=[];for(let ye of["runStart","runEnd","initialize","modelContextUpdate"]){let Fe=r.unstable_on(ye,()=>{let Tt=r.getState()?.threadId||"unknown";s(`thread.${ye}`,{threadId:Tt})});ee.push(Fe)}return ee.push(r.unstable_on("toolApprovalAnswered",ye=>{let Fe=r.getState()?.threadId||"unknown";s("thread.toolApprovalAnswered",{threadId:Fe,...ye})})),()=>St(ee)},n=[r,s],e[0]=s,e[1]=r,e[2]=i,e[3]=n):(i=e[2],n=e[3]),N(i,n);let a;e[4]!==r?(a=Ds(()=>r.getState().threadId),e[4]=r,e[5]=a):a=e[5];let l=a,c;e[6]!==s||e[7]!==r?(c=ee=>{s(ee,{threadId:r.getState().threadId})},e[6]=s,e[7]=r,e[8]=c):c=e[8];let d=c,u;e[9]!==r?(u=ee=>r.getState().suggestions.some(ye=>ye.prompt===ee),e[9]=r,e[10]=u):u=e[10];let m=u,p;e[11]!==m||e[12]!==r.composer||e[13]!==l?(p=Os({runtime:r.composer,threadIdRef:l,isSuggestion:m}),e[11]=m,e[12]=r.composer,e[13]=l,e[14]=p):p=e[14];let f=dt(p),g;e[15]!==o.suggestions?(g=$c(o.suggestions),e[15]=o.suggestions,e[16]=g):g=e[16];let b=dt(g),x;e[17]===Symbol.for("react.memo_cache_sentinel")?(x=Fc(),e[17]=x):x=e[17];let w=x,S;e[18]!==o.messages?(S=w(o.messages),e[18]=o.messages,e[19]=S):S=e[19];let T=S,I;e[20]!==T?(I=T.map(ag),e[20]=T,e[21]=I):I=e[21];let C=me(I),R=f.state.submission,_=f.state.inTransit,M;e[22]!==_?(M=_??[],e[22]=_,e[23]=M):M=e[23];let D;e[24]!==R?(D=R?[R]:[],e[24]=R,e[25]=D):D=e[25];let O;e[26]!==M||e[27]!==D?(O=[...M,...D],e[26]=M,e[27]=D,e[28]=O):O=e[28];let B=O,W;e[29]!==B?(W=B.map(Bc),e[29]=B,e[30]=W):W=e[30];let z=W,Y=o.messages.length-1,G;if(e[31]!==Y||e[32]!==B||e[33]!==z||e[34]!==r||e[35]!==o.messages||e[36]!==o.threadId||e[37]!==l){let ee;e[39]!==Y||e[40]!==B.length||e[41]!==r||e[42]!==o.threadId||e[43]!==l?(ee=(Tt,Yt)=>{let Va=Yt===Y&&B.length>0?!1:void 0;return oe(Tt.id,ig({runtime:r,id:Tt.id,threadIdRef:l,threadId:o.threadId,isLast:Va}),[r,Tt.id,l,o.threadId,Va])},e[39]=Y,e[40]=B.length,e[41]=r,e[42]=o.threadId,e[43]=l,e[44]=ee):ee=e[44];let ye=o.messages.map(ee),Fe;e[45]!==B||e[46]!==z||e[47]!==o.messages.length?(Fe=B.map((Tt,Yt)=>oe(Tt.id,pc({message:z[Yt],submission:Tt,index:o.messages.length+Yt,isLast:Yt===B.length-1}),[z[Yt],Tt,o.messages.length,Yt,B.length])),e[45]=B,e[46]=z,e[47]=o.messages.length,e[48]=Fe):Fe=e[48],G=[...ye,...Fe],e[31]=Y,e[32]=B,e[33]=z,e[34]=r,e[35]=o.messages,e[36]=o.threadId,e[37]=l,e[38]=G}else G=e[38];let Z=me(G),He=Z.state.length===0&&!o.isLoading,st;e[49]!==f.state||e[50]!==Z.state||e[51]!==o.capabilities||e[52]!==o.extras||e[53]!==o.isDisabled||e[54]!==o.isLoading||e[55]!==o.isRunning||e[56]!==o.speech||e[57]!==o.state||e[58]!==o.suggestions||e[59]!==o.voice||e[60]!==He||e[61]!==T?(st={isEmpty:He,isDisabled:o.isDisabled,isLoading:o.isLoading,isRunning:o.isRunning,capabilities:o.capabilities,state:o.state,suggestions:o.suggestions,extras:o.extras,speech:o.speech,voice:o.voice,composer:f.state,messages:Z.state,tasks:T},e[49]=f.state,e[50]=Z.state,e[51]=o.capabilities,e[52]=o.extras,e[53]=o.isDisabled,e[54]=o.isLoading,e[55]=o.isRunning,e[56]=o.speech,e[57]=o.state,e[58]=o.suggestions,e[59]=o.voice,e[60]=He,e[61]=T,e[62]=st):st=e[62];let vt=st,De;e[63]!==vt?(De=()=>vt,e[63]=vt,e[64]=De):De=e[64];let Ne;e[65]!==f.methods?(Ne=()=>f.methods,e[65]=f.methods,e[66]=Ne):Ne=e[66];let Be;e[67]!==b?(Be=()=>b.methods,e[67]=b,e[68]=Be):Be=e[68];let Le;e[69]!==C||e[70]!==T?(Le=ee=>{if("id"in ee){let ye=T.find(Fe=>Fe.id===ee.id);return C.get({key:ye?Rn(ye):ee.id})}return C.get(ee)},e[69]=C,e[70]=T,e[71]=Le):Le=e[71];let $e;e[72]!==s||e[73]!==m||e[74]!==r?($e=ee=>{let ye=typeof ee=="string"?{content:[{type:"text",text:ee}]}:ee;if((ye.role??"user")==="user"){let Fe=ye.content.map(lg).join("");s("composer.send",{threadId:r.getState().threadId,chars:Fe.length,attachments:ye.attachments?.length??0,...m(Fe)?{suggestion:!0}:void 0})}r.append(ee)},e[72]=s,e[73]=m,e[74]=r,e[75]=$e):$e=e[75];let je;e[76]!==d||e[77]!==r||e[78]!==o.isRunning?(je=()=>{o.isRunning&&d("thread.cancelRun"),r.cancelRun()},e[76]=d,e[77]=r,e[78]=o.isRunning,e[79]=je):je=e[79];let it;e[80]!==d||e[81]!==r?(it=()=>{r.connectVoice(),d("thread.voiceStarted")},e[80]=d,e[81]=r,e[82]=it):it=e[82];let H;e[83]!==Z?(H=ee=>"id"in ee?Z.get({key:ee.id}):Z.get(ee),e[83]=Z,e[84]=H):H=e[84];let we;e[85]!==r?(we=()=>r,e[85]=r,e[86]=we):we=e[86];let nt;return e[87]!==r.deleteMessage||e[88]!==r.disconnectVoice||e[89]!==r.export||e[90]!==r.getModelContext||e[91]!==r.getVoiceVolume||e[92]!==r.import||e[93]!==r.importExternalState||e[94]!==r.muteVoice||e[95]!==r.reset||e[96]!==r.resumeRun||e[97]!==r.startRun||e[98]!==r.stopSpeaking||e[99]!==r.subscribeVoiceVolume||e[100]!==r.unmuteVoice||e[101]!==De||e[102]!==Ne||e[103]!==Be||e[104]!==Le||e[105]!==$e||e[106]!==je||e[107]!==it||e[108]!==H||e[109]!==we?(nt={getState:De,composer:Ne,suggestions:Be,task:Le,append:$e,deleteMessage:r.deleteMessage,startRun:r.startRun,resumeRun:r.resumeRun,importExternalState:r.importExternalState,cancelRun:je,getModelContext:r.getModelContext,export:r.export,import:r.import,reset:r.reset,stopSpeaking:r.stopSpeaking,connectVoice:it,disconnectVoice:r.disconnectVoice,getVoiceVolume:r.getVoiceVolume,subscribeVoiceVolume:r.subscribeVoiceVolume,muteVoice:r.muteVoice,unmuteVoice:r.unmuteVoice,message:H,__internal_getRuntime:we},e[87]=r.deleteMessage,e[88]=r.disconnectVoice,e[89]=r.export,e[90]=r.getModelContext,e[91]=r.getVoiceVolume,e[92]=r.import,e[93]=r.importExternalState,e[94]=r.muteVoice,e[95]=r.reset,e[96]=r.resumeRun,e[97]=r.startRun,e[98]=r.stopSpeaking,e[99]=r.subscribeVoiceVolume,e[100]=r.unmuteVoice,e[101]=De,e[102]=Ne,e[103]=Be,e[104]=Le,e[105]=$e,e[106]=je,e[107]=it,e[108]=H,e[109]=we,e[110]=nt):nt=e[110],nt},Uc=L(ng);function ag(t){return oe(Rn(t),Vc({task:t}),[t])}function lg(t){return t.type==="text"?t.text:""}var zc=t=>{let e=v(4),r=Ze(),o=U(t),s,i;e[0]!==r||e[1]!==t?(s=()=>{let n=o.current;n!==t&&(o.current=t,r("threads.selectionChanged",{threadId:t,previousThreadId:n}))},i=[t,r],e[0]=r,e[1]=t,e[2]=s,e[3]=i):(s=e[2],i=e[3]),N(s,i)},Hc=(t,e,r)=>{let o=v(8),s=r===void 0?e:r,i=Ze(),n=e&&s,a;o[0]!==n||o[1]!==t?(a={isMain:n,threadId:t},o[0]=n,o[1]=t,o[2]=a):a=o[2];let l=U(a),c,d;o[3]!==i||o[4]!==e||o[5]!==t?(c=()=>{let u=l.current;u.isMain===e&&u.threadId===t||(l.current={isMain:e,threadId:t},i(e?"threadListItem.switchedTo":"threadListItem.switchedAway",{threadId:t}))},d=[e,t,i],o[3]=i,o[4]=e,o[5]=t,o[6]=c,o[7]=d):(c=o[6],d=o[7]),N(c,d)};var mt=(t,e)=>Ms(`thread list ${t}`,e);var cg=t=>{let e=v(27),{runtime:r,mainThreadIsRunning:o}=t,s=o===void 0?!1:o,i=Me(r),n;e:{let w=i.isRunning||i.isMain&&s;if(w===i.isRunning){n=i;break e}let S;e[0]!==w||e[1]!==i?(S={...i,isRunning:w},e[0]=w,e[1]=i,e[2]=S):S=e[2],n=S}let a=n;Hc(i.id,i.isMain);let l;e[3]!==a?(l=()=>a,e[3]=a,e[4]=l):l=e[4];let c,d,u,m,p,f,g;e[5]!==r?(d=w=>mt("switch",()=>r.switchTo(w)),u=w=>mt("rename",()=>r.rename(w)),m=w=>mt("update custom metadata",()=>r.updateCustom(w)),p=()=>mt("archive",()=>r.archive()),f=()=>mt("unarchive",()=>r.unarchive()),g=()=>mt("delete",()=>r.delete()),c=w=>mt("generate title",()=>r.generateTitle(w)),e[5]=r,e[6]=c,e[7]=d,e[8]=u,e[9]=m,e[10]=p,e[11]=f,e[12]=g):(c=e[6],d=e[7],u=e[8],m=e[9],p=e[10],f=e[11],g=e[12]);let b;e[13]!==r?(b=()=>r,e[13]=r,e[14]=b):b=e[14];let x;return e[15]!==r.detach||e[16]!==r.initialize||e[17]!==c||e[18]!==b||e[19]!==l||e[20]!==d||e[21]!==u||e[22]!==m||e[23]!==p||e[24]!==f||e[25]!==g?(x={getState:l,switchTo:d,rename:u,updateCustom:m,archive:p,unarchive:f,delete:g,generateTitle:c,initialize:r.initialize,detach:r.detach,__internal_getRuntime:b},e[15]=r.detach,e[16]=r.initialize,e[17]=c,e[18]=b,e[19]=l,e[20]=d,e[21]=u,e[22]=m,e[23]=p,e[24]=f,e[25]=g,e[26]=x):x=e[26],x},qc=L(cg);var dg=t=>{let e=v(6),{runtime:r,id:o,mainThreadIsRunning:s}=t,i;e[0]!==o||e[1]!==r?(i=r.getItemById(o),e[0]=o,e[1]=r,e[2]=i):i=e[2];let n=i,a;return e[3]!==s||e[4]!==n?(a=qc({runtime:n,mainThreadIsRunning:s}),e[3]=s,e[4]=n,e[5]=a):a=e[5],be(a)},ug=L(dg),pg=t=>{let e=v(48),{runtime:r,__internal_assistantRuntime:o}=t,s=Me(r);zc(s.mainThreadId);let i=Ze(),n,a;e[0]!==i||e[1]!==r?(n=()=>r.unstable_subscribeThreadEvents(D=>{let{threadId:O,type:B}=D;O!==r.getState().mainThreadId&&i(`thread.${B}`,{threadId:O})}),a=[r,i],e[0]=i,e[1]=r,e[2]=n,e[3]=a):(n=e[2],a=e[3]),N(n,a);let l;e[4]!==r.main?(l=Uc({runtime:r.main}),e[4]=r.main,e[5]=l):l=e[5];let c=dt(l),d;e[6]!==c.state||e[7]!==r||e[8]!==s.threadItems?(d=Object.keys(s.threadItems).map(D=>oe(D,ug({runtime:r,id:D,mainThreadIsRunning:c.state.isRunning}),[r,D,c.state.isRunning])),e[6]=c.state,e[7]=r,e[8]=s.threadItems,e[9]=d):d=e[9];let u=me(d),m=s.newThreadId??null,p;e[10]!==c.state||e[11]!==s.archivedThreadIds||e[12]!==s.hasMore||e[13]!==s.isLoading||e[14]!==s.isLoadingMore||e[15]!==s.loadError||e[16]!==s.mainThreadId||e[17]!==s.threadIds||e[18]!==m||e[19]!==u.state?(p={mainThreadId:s.mainThreadId,newThreadId:m,isLoading:s.isLoading,loadError:s.loadError,isLoadingMore:s.isLoadingMore,hasMore:s.hasMore,threadIds:s.threadIds,archivedThreadIds:s.archivedThreadIds,threadItems:u.state,main:c.state},e[10]=c.state,e[11]=s.archivedThreadIds,e[12]=s.hasMore,e[13]=s.isLoading,e[14]=s.isLoadingMore,e[15]=s.loadError,e[16]=s.mainThreadId,e[17]=s.threadIds,e[18]=m,e[19]=u.state,e[20]=p):p=e[20];let f=p,g;e[21]!==f?(g=()=>f,e[21]=f,e[22]=g):g=e[22];let b;e[23]!==c.methods?(b=()=>c.methods,e[23]=c.methods,e[24]=b):b=e[24];let x;e[25]!==f||e[26]!==u?(x=D=>{if(D==="main")return u.get({key:f.mainThreadId});if("id"in D)return u.get({key:D.id});let{index:O,archived:B}=D,W=B!==void 0&&B?f.archivedThreadIds[O]:f.threadIds[O];return u.get({key:W})},e[25]=f,e[26]=u,e[27]=x):x=e[27];let w,S,T,I,C,R;e[28]!==r?(w=(D,O)=>mt("switch",()=>r.switchToThread(D,O)),S=()=>mt("create",()=>r.switchToNewThread()),T=()=>r.getLoadThreadsPromise(),I=()=>r.reload(),C=()=>r.reloadMainThread(),R=()=>r.loadMore(),e[28]=r,e[29]=w,e[30]=S,e[31]=T,e[32]=I,e[33]=C,e[34]=R):(w=e[29],S=e[30],T=e[31],I=e[32],C=e[33],R=e[34]);let _;e[35]!==o?(_=()=>o,e[35]=o,e[36]=_):_=e[36];let M;return e[37]!==w||e[38]!==S||e[39]!==T||e[40]!==I||e[41]!==C||e[42]!==R||e[43]!==_||e[44]!==g||e[45]!==b||e[46]!==x?(M={getState:g,thread:b,item:x,switchToThread:w,switchToNewThread:S,getLoadThreadsPromise:T,reload:I,reloadMainThread:C,loadMore:R,__internal_getAssistantRuntime:_},e[37]=w,e[38]=S,e[39]=T,e[40]=I,e[41]=C,e[42]=R,e[43]=_,e[44]=g,e[45]=b,e[46]=x,e[47]=M):M=e[47],M},Gc=L(pg);var Wc=(t,e)=>{t.thread??(t.thread=ce({source:"threads",query:{type:"main"},get:r=>r.threads.thread("main")})),t.threadListItem??(t.threadListItem=ce({source:"threads",query:{type:"main"},get:r=>r.threads.item("main")})),t.composer??(t.composer=ce({source:"thread",query:{},get:r=>r.threads.thread("main").composer()})),!t.modelContext&&e.modelContext.source===null&&(t.modelContext=As()),!t.suggestions&&e.suggestions.source===null&&(t.suggestions=ce({source:"thread",query:{},get:r=>r.thread.suggestions()}))};var Kc=t=>{let e=v(7),r=ao(),o;e[0]!==r||e[1]!==t?(o=()=>t.registerModelContextProvider(r.current.modelContext()),e[0]=r,e[1]=t,e[2]=o):o=e[2];let s;e[3]!==t?(s=[t],e[3]=t,e[4]=s):s=e[4],lo("modelContext",o,s);let i;return e[5]!==t?(i=Gc({runtime:t.threads,__internal_assistantRuntime:t}),e[5]=t,e[6]=i):i=e[6],be(i)},Jc=L(Kc),mg=(t,e)=>{Wc(t,e),!t.tools&&e.tools.source===null&&(t.tools=ac({})),!t.dataRenderers&&e.dataRenderers.source===null&&(t.dataRenderers=xl())};so(Kc,mg);var Pr=V("react/jsx-runtime"),hg=le({}),Qc=({effects:t})=>{"use no memo";return We(t),null},he=ne(function(e,r){"use no memo";let{config:o,children:s}=e,i="extends"in e,n="value"in e,a=oo();if(_s){if(i&&n)throw new Error("AuiProvider: pass either `extends` or `value`, not both.");if(i&&e.extends===void 0)throw new Error("AuiProvider: `extends` must be a client or null, not undefined.");if(i&&!o)throw new Error("AuiProvider: `extends` requires a `config`.");if(n&&o)throw new Error("AuiProvider: pass either `value` or `config`, not both.");if(!n&&!o)throw new Error("AuiProvider: a `config` is required.");if(!i&&!n&&a!==zt)throw new Error("A parent AuiProvider exists \u2014 pass extends={aui} to inherit it or extends={null} to isolate.")}let l=i?e.extends??zt:n?e.value??zt:a,c=xs(),{client:d,effects:u}=Xl(l,o??hg,c);return Wi(r,()=>d,[d]),(0,Pr.jsx)(ys.Provider,{value:c,children:(0,Pr.jsxs)(fs.Provider,{value:d,children:[(0,Pr.jsx)(Qc,{effects:El(l)}),u&&(0,Pr.jsx)(Qc,{effects:u}),s]})})});var fg=t=>{let e=q(),r=U(!1),o=r.current?null:t(e);return P(()=>r.current?t(e):o),()=>(r.current=!0,t(e))},gg=Object.freeze({});function At(t){let e=v(3),{getItemState:r,children:o}=t,s=fg(r),i;return e[0]!==o||e[1]!==s?(i=o(s),e[0]=o,e[1]=s,e[2]=i):i=e[2],vg(i)}var vg=t=>{let e=typeof t=="object"&&t!=null&&"type"in t?t:null,r=e?.type,o=e?.key,s=typeof e?.props=="object"&&e.props!=null&&Object.entries(e.props).length===0?gg:e?.props;return K(()=>e,[r,o,s])??t};var Ks=(t,e)=>{let r=v(11),o=q(),s=Qr(e),i;r[0]!==t?(i=io(t),r[0]=t,r[1]=i):i=r[1];let{scope:n,event:a}=i,l;r[2]!==o||r[3]!==s||r[4]!==a||r[5]!==n?(l=()=>o.on({scope:n,event:a},s),r[2]=o,r[3]=s,r[4]=a,r[5]=n,r[6]=l):l=r[6];let c;r[7]!==o||r[8]!==a||r[9]!==n?(c=[o,n,a],r[7]=o,r[8]=a,r[9]=n,r[10]=c):c=r[10],N(l,c)};var mo=V("react/jsx-runtime"),Yc=t=>t._core?.RenderComponent,bg=({runtime:t,aui:e,config:r,children:o})=>{"use no memo";let s=Yc(t),i=le({...r,threads:Jc(t)});return(0,mo.jsxs)(he,{extends:e,config:i,children:[s&&(0,mo.jsx)(s,{}),o]})},An=se(t=>{let e=v(5),{runtime:r,aui:o,config:s,children:i}=t,n=o===void 0?null:o,a;return e[0]!==n||e[1]!==i||e[2]!==s||e[3]!==r?(a=(0,mo.jsx)(bg,{runtime:r,aui:n,config:s,children:i}),e[0]=n,e[1]=i,e[2]=s,e[3]=r,e[4]=a):a=e[4],a});var wg=ae(null);var Xc=()=>Ke(wg);function de(t){return t!=null&&typeof t=="object"&&!Array.isArray(t)}function ho(t,e=0){return e>100?!1:t===null||typeof t=="string"||typeof t=="boolean"?!0:typeof t=="number"?!Number.isNaN(t)&&Number.isFinite(t):Array.isArray(t)?t.every(r=>ho(r,e+1)):de(t)?Object.entries(t).every(([r,o])=>typeof r=="string"&&ho(o,e+1)):!1}var Zc=class extends TransformStream{constructor(t){super();let e=t(super.readable);Object.defineProperty(this,"readable",{value:e,writable:!1})}};function ed(t,e,r){try{let o=t();if(typeof o=="object"&&o!==null&&"then"in o)return o.then(e,r);e(o)}catch(o){r(o)}}function fo(t,e){let r=t;for(let o of e){if(r==null||!Object.hasOwn(r,o))return;r=r[o]}return r}var yg=class{constructor(t,e,r){h(this,"resolve");h(this,"reject");h(this,"disposed",!1);h(this,"fieldPath");this.resolve=t,this.reject=e,this.fieldPath=r}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{if(lr(t,this.fieldPath)==="complete"){let e=fo(t,this.fieldPath);e!==void 0&&(this.resolve(e),this.dispose())}}catch(e){this.reject(e),this.dispose()}}end(t){if(!this.disposed)try{let e=fo(t,this.fieldPath);this.resolve(e)}catch(e){this.reject(e)}finally{this.dispose()}}error(t){this.disposed||(this.reject(t),this.dispose())}dispose(){this.disposed=!0}},xg=class{constructor(t,e){h(this,"controller");h(this,"disposed",!1);h(this,"fieldPath");this.controller=t,this.fieldPath=e}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{let e=fo(t,this.fieldPath);e!==void 0&&this.controller.enqueue(e),lr(t,this.fieldPath)==="complete"&&(this.controller.close(),this.dispose())}catch(e){this.controller.error(e),this.dispose()}}end(){this.disposed||(this.controller.close(),this.dispose())}error(t){this.disposed||(this.controller.error(t),this.dispose())}dispose(){this.disposed=!0}},_g=class{constructor(t,e){h(this,"controller");h(this,"disposed",!1);h(this,"fieldPath");h(this,"lastValue");this.controller=t,this.fieldPath=e}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{let e=fo(t,this.fieldPath);if(e!==void 0&&typeof e=="string"){let r=e.substring(this.lastValue?.length||0);this.lastValue=e,this.controller.enqueue(r)}lr(t,this.fieldPath)==="complete"&&(this.controller.close(),this.dispose())}catch(e){this.controller.error(e),this.dispose()}}end(){this.disposed||(this.controller.close(),this.dispose())}error(t){this.disposed||(this.controller.error(t),this.dispose())}dispose(){this.disposed=!0}},Sg=class{constructor(t,e){h(this,"controller");h(this,"disposed",!1);h(this,"fieldPath");h(this,"nextIndex",0);this.controller=t,this.fieldPath=e}get isDisposed(){return this.disposed}update(t){if(!this.disposed)try{let e=fo(t,this.fieldPath);if(!Array.isArray(e))return;for(;this.nextIndex<e.length;this.nextIndex++){let r=[...this.fieldPath,this.nextIndex];if(lr(t,r)!=="complete")break;this.controller.enqueue(e[this.nextIndex])}lr(t,this.fieldPath)==="complete"&&(this.controller.close(),this.dispose())}catch(e){this.controller.error(e),this.dispose()}}end(){this.disposed||(this.controller.close(),this.dispose())}error(t){this.disposed||(this.controller.error(t),this.dispose())}dispose(){this.disposed=!0}},Tg=class{constructor(t){h(this,"argTextDeltas");h(this,"handles",new Set);h(this,"accumulatedText","");h(this,"parsedTextLength",-1);h(this,"args");h(this,"finished",!1);h(this,"failure");this.argTextDeltas=t,this.processStream()}async processStream(){try{let t=this.argTextDeltas.getReader();for(;;){let{value:e,done:r}=await t.read();if(r)break;this.accumulatedText+=e,this.handles.size!==0&&this.parseCurrentArgs()&&this.updateHandles()}}catch(t){this.failure={reason:t}}finally{this.finished=!0;for(let t of this.handles)this.settleHandle(t);this.handles.clear()}}settleHandle(t){this.failure?t.error(this.failure.reason):t.end(this.args)}parseCurrentArgs(){if(this.parsedTextLength===this.accumulatedText.length)return!1;let t=Ar(this.accumulatedText);return this.parsedTextLength=this.accumulatedText.length,t===void 0?(this.args??(this.args=Ar("")),!1):(this.args=t,!0)}updateHandles(){for(let t of this.handles)t.update(this.args),t.isDisposed&&this.handles.delete(t)}activateHandle(t){if(this.parseCurrentArgs(),t.update(this.args),!t.isDisposed){if(this.finished){this.settleHandle(t);return}this.handles.add(t)}}get(...t){return new Promise((e,r)=>{let o=new yg(e,r,t);this.activateHandle(o)})}streamValues(...t){let e=t,r,o=new ReadableStream({start:s=>{r=new xg(s,e),this.activateHandle(r)},cancel:()=>{r&&(r.dispose(),this.handles.delete(r))}});return Vs(o)}streamText(...t){let e=t,r,o=new ReadableStream({start:s=>{r=new _g(s,e),this.activateHandle(r)},cancel:()=>{r&&(r.dispose(),this.handles.delete(r))}});return Vs(o)}forEach(...t){let e=t,r,o=new ReadableStream({start:s=>{r=new Sg(s,e),this.activateHandle(r)},cancel:()=>{r&&(r.dispose(),this.handles.delete(r))}});return Vs(o)}},kg=class{constructor(t){h(this,"promise");this.promise=t}get(){return this.promise}},td=class{constructor(){h(this,"args");h(this,"response");h(this,"writable");h(this,"resolve");h(this,"argsText","");h(this,"result",{get:async()=>(await this.response.get()).result});let t=new TransformStream;this.writable=t.writable,this.args=new Tg(t.readable);let{promise:e,resolve:r}=Mr();this.resolve=r,this.response=new kg(e)}async appendArgsTextDelta(t){let e=this.writable.getWriter();try{await e.write(t)}catch(r){console.warn(r)}finally{e.releaseLock()}this.argsText+=t}async finishArgsText(){let t=this.writable.getWriter();try{await t.close()}catch(e){console.warn(e)}finally{t.releaseLock()}}setResponse(t){this.resolve(t)}};var rd=qe(Sn(),1),Ig=Symbol.for("assistant-stream.tool-execution-id"),Mn=(t,e,r,o,s)=>{try{let i=e?.(r,o,s);Promise.resolve(i).catch(n=>{console.error(`[assistant-stream] ${t} callback threw an error`,n)})}catch(i){console.error(`[assistant-stream] ${t} callback threw an error`,i)}},Or=t=>t.join(","),Pn=(t,e)=>{let r={...t};return Object.defineProperty(r,Ig,{value:e,enumerable:!0}),r},od=class extends Zc{constructor(t){let e=t,r=new Map,o=new Map,s=new Set,i=new Map,n=0;super(a=>{let l=new TransformStream({async transform(c,d){let u=i.get(Or(c.path));switch((c.type!=="part-finish"||c.meta.type!=="tool-call")&&d.enqueue(u?Pn(c,u):c),c.type){case"part-start":{let m=n;if(n+=1,c.part.type==="tool-call"){let p=new td,f=Symbol();i.set(String(m),f),o.set(f,p),e.streamCall({reader:p,toolCallId:c.part.toolCallId,toolName:c.part.toolName,executionId:f})}break}case"text-delta":if(c.meta.type==="tool-call"){let m=i.get(Or(c.path)),p=m?o.get(m):void 0;if(!p)throw new Error("No controller found for tool call");await p.appendArgsTextDelta(c.textDelta)}break;case"result":{if(c.meta.type!=="tool-call")break;let m=i.get(Or(c.path)),p=m?o.get(m):void 0;if(!p)throw new Error("No controller found for tool call");if(s.add(m),c.isPreliminary)break;p.setResponse(new Ve({result:c.result,artifact:c.artifact,isError:c.isError,modelContent:c.modelContent,messages:c.messages}));break}case"tool-call-args-text-finish":{if(c.meta.type!=="tool-call")break;let{toolCallId:m,toolName:p}=c.meta,f=i.get(Or(c.path)),g=f?o.get(f):void 0;if(!g)throw new Error("No controller found for tool call");if(await g.finishArgsText(),s.has(f))break;let b=!1,x=ed(()=>{let w;try{w=rd.default.parse(g.argsText)}catch(T){throw new Error(`Function parameter parsing failed. ${JSON.stringify(T.message)}`)}let S=e.execute({toolCallId:m,toolName:p,args:w,executionId:f});return S!==void 0&&(b=!0,Mn("onExecutionStart",e.onExecutionStart,m,p,f)),S},w=>{if(b&&Mn("onExecutionEnd",e.onExecutionEnd,m,p,f),w===void 0)return;let S=new Ve({artifact:w.artifact,result:w.result,isError:w.isError,messages:w.messages,modelContent:w.modelContent});g.setResponse(S),Oe(d,Pn({type:"result",path:c.path,...S},f))},w=>{b&&Mn("onExecutionEnd",e.onExecutionEnd,m,p,f);let S=new Ve({result:String(w),isError:!0});g.setResponse(S),Oe(d,Pn({type:"result",path:c.path,...S},f))});x&&r.set(f,x);break}case"part-finish":{if(c.meta.type!=="tool-call")break;let m=i.get(Or(c.path)),p=m?r.get(m):void 0,f=()=>{m&&(r.delete(m),o.delete(m),s.delete(m),i.delete(Or(c.path)))};p?p.then(()=>{f(),Oe(d,c)}):(f(),d.enqueue(c))}}},async flush(){await Promise.all(r.values())}});return a.pipeThrough(new po).pipeThrough(l)})}};var id=Symbol.for("assistant-stream.tool-execution-id"),Qs=Symbol("assistant-stream.tool-aborted"),Cg=t=>typeof t=="object"&&t!==null&&"~standard"in t&&t["~standard"].version===1,Eg=t=>typeof t?.then=="function",sd=async(t,e,r=!1)=>{let o,s=new Promise(i=>{o=()=>{r?queueMicrotask(()=>queueMicrotask(()=>i(Qs))):i(Qs)},e.aborted?o():e.addEventListener("abort",o,{once:!0})});try{return await Promise.race([t,s])}finally{e.removeEventListener("abort",o)}},Js=()=>new Ve({result:"Tool execution was cancelled.",isError:!0});function Rg(t,e,r,o){let s=t?.[r.toolName];return s?.execute?(async n=>{if(e.aborted)return Js();let a=n,l=r.args;if(Cg(s.parameters)){let u=s.parameters["~standard"].validate(r.args),m=Eg(u)?await sd(u,e):u;if(m===Qs)return Js();m.issues?a=s.experimental_onSchemaValidationError??(()=>{throw new Error(`Function parameter validation failed. ${JSON.stringify(m.issues)}`)}):l=m.value}if(e.aborted)return Js();let c=(async()=>{let u={toolCallId:r.toolCallId,abortSignal:e,human:f=>o(r.toolCallId,f,r.executionId),[id]:r.executionId},m=await a(l,u),p=Ve.toResponse(m);if(s.toModelOutput&&!p.isError&&p.modelContent===void 0)try{let f=await s.toModelOutput({toolCallId:r.toolCallId,input:l,output:p.result});return new Ve({result:p.result,artifact:p.artifact,isError:p.isError,messages:p.messages,modelContent:f})}catch(f){console.warn(`[assistant-stream] tool "${r.toolName}" toModelOutput threw; falling back to default projection.`,f)}return p})(),d=await sd(c,e,!0);return d===Qs?Js():d})(s.execute):void 0}function Ag(t,e,r,o,s){let i={toolCallId:o.toolCallId,abortSignal:e,human:n=>s(o.toolCallId,n,o.executionId),[id]:o.executionId};t?.[o.toolName]?.streamCall?.(r,i)}function On(t,e,r,o){let s=typeof t=="function"?t:()=>t,i=typeof e=="function"?e:()=>e,n=o,a=r,l={execute:c=>Rg(s(),i(),c,a),streamCall:({reader:c,...d})=>Ag(s(),i(),c,d,a),onExecutionStart:n?.onExecutionStart,onExecutionEnd:n?.onExecutionEnd};return new od(l)}var Mg=100,Dn=(t,e,r)=>{if(t===e)return!0;if(r>Mg||t==null||e==null)return!1;if(Array.isArray(t))return!Array.isArray(e)||t.length!==e.length?!1:t.every((i,n)=>Dn(i,e[n],r+1));if(Array.isArray(e)||!de(t)||!de(e))return!1;let o=Object.keys(t),s=Object.keys(e);return o.length!==s.length?!1:o.every(i=>Object.hasOwn(e,i)&&Dn(t[i],e[i],r+1))},go=(t,e)=>!ho(t)||!ho(e)?!1:Dn(t,e,0);function Pg(t){let e=t.metadata;if(!e||typeof e!="object")return;let r=e.custom;if(!r||typeof r!="object")return;let o=r.interactables;return Array.isArray(o)?o:void 0}function Og(t){return`update_${t.replace(/[^a-zA-Z0-9_-]/g,"_")}`}var Nn=t=>{if(!de(t))return;let e=t.id;return typeof e=="string"||typeof e=="number"?e:void 0};function Ln(t,e,r=[]){if(!de(t)||!de(e))return e;let o={...t,...e},[s,...i]=r;return s!==void 0&&Object.hasOwn(e,s)&&(o[s]=Ln(t[s],e[s],i)),o}function Dg(t,e,r,o){let s=Array.isArray(e.set)?[...e.set]:[...t];if(e.clear===!0&&(s=[]),Array.isArray(e.remove)&&e.remove.length>0){let n=new Set(e.remove);s=s.filter(a=>{let l=Nn(a);return l!==void 0?!n.has(l):!n.has(a)})}let i=e.update;if(Array.isArray(i)&&i.length>0){let n=new Map;for(let l of i){let c=Nn(l);c!==void 0&&!Number.isNaN(c)&&!n.has(c)&&n.set(c,l)}let a=o?.[0]==="update"?{patch:i[Number(o[1])],rest:o.slice(2)}:void 0;s=s.map(l=>{let c=Nn(l);if(c===void 0||!de(l))return l;let d=n.get(c);return d?a&&d===a.patch?Ln(l,d,a.rest):{...l,...d}:l})}if(Array.isArray(e.add)&&e.add.length>0){let n=r?e.add.map(a=>{if(!de(a)||a.id!==void 0)return a;let l=r();return l===void 0?a:{...a,id:l}}):e.add;s=[...s,...n]}return s}function Bn(t,e,r){if(!de(t)||!de(e))return e;let o=de(r?.arrayBaseline)?r.arrayBaseline:t,s=r?.partialPath,i=Object.entries(t);for(let[n,a]of Object.entries(e)){let l=o[n],c=s?.[0]===n?s.slice(1):void 0;if(Array.isArray(l)&&de(a)){let d=r?.idFactory&&(r.idKeyedFields===void 0||r.idKeyedFields.has(n))?()=>r.idFactory?.(n):void 0;i.push([n,Dg(l,a,d,c)])}else c?i.push([n,Ln(t[n],a,c)]):i.push([n,a])}return Object.fromEntries(i)}function Ng(t,e){if(!de(t)||!de(e))return;for(let s of Object.keys(t))if(!Object.hasOwn(e,s))return;let r=[];for(let[s,i]of Object.entries(e))(!Object.hasOwn(t,s)||!go(t[s],i))&&r.push([s,i]);let o=r.length;if(!(o===0||o===Object.keys(e).length))return Object.fromEntries(r)}var Bg=t=>{if(!t||typeof t!="object")return;let e=t;return e.type==="tool-call"?e:void 0},Lg=(t,e)=>{if(!t.args||typeof t.args!="object")return!1;let r=de(t.result)?t.result:void 0;if(r?.success===!1)return!1;if(typeof r?.id=="string")return r.id===e;let o=t.args.id;return o===e||o===void 0},$g=t=>{let e=de(t)?t.addedItemIds:void 0;if(!de(e))return;let r=new Map;for(let[o,s]of Object.entries(e)){if(!Array.isArray(s))continue;let i=s.filter(n=>typeof n=="string");i.length>0&&r.set(o,i)}if(r.size!==0)return o=>r.get(o)?.shift()},nd=new WeakMap;function jg(t,e,r){let o=nd.get(t);o||(o=new Map,nd.set(t,o));let s=o.get(r);s||(s=new Map,o.set(r,s));let i=s.get(e);if(i)return i;let n=Og(r),a=[],l=()=>a[a.length-1];for(let c of t){if(c.role==="user"){let d=Pg(c)?.find(u=>u.id===e);if(!d)continue;if(d.partial){let u=l();u&&a.push({state:Bn(u.state,d.state),origin:"user-edit"})}else a.push({state:d.state,origin:"user-edit"});continue}if(c.role==="assistant")for(let d of c.content??[]){let u=Bg(d);if(u){if(u.toolCallId===e&&u.toolName===r)u.args&&typeof u.args=="object"&&a.push({state:u.args,origin:"create",toolCallId:e});else if(u.toolName===n&&Lg(u,e)){let m=l();if(m){let{id:p,...f}=u.args,g=$g(u.result);a.push({state:g?Bn(m.state,f,{idFactory:g}):Bn(m.state,f),origin:"update",toolCallId:u.toolCallId})}}}}}return s.set(e,a),a}function Fg(t,e,r){let o=jg(t,e,r),s=o[o.length-1];return s?{state:s.state}:void 0}function ad(t,e){if(!t)return;let{interactables:r,...o}=t,s={...o};if(Array.isArray(r)){let i=[];for(let n of r){let a=Fg(e,n.id,n.name);if(!a){i.push({id:n.id,name:n.name,state:n.state});continue}if(go(n.state,a.state))continue;let l=Ng(a.state,n.state);i.push(l?{id:n.id,name:n.name,state:l,partial:!0}:{id:n.id,name:n.name,state:n.state})}i.length&&(s.interactables=i)}return Object.keys(s).length?s:void 0}var Mt=Symbol("innerMessage"),$n=Symbol("innerMessages"),Vg=[],jn=(t,e)=>{Mt in t||(t[Mt]=e)},ld=t=>{let e="messages"in t&&!("type"in t&&t.type==="tool-call")?t.messages:t,r=e[$n]||e[Mt];return r?Array.isArray(r)?r:(e[$n]=[r],e[$n]):Vg},cd="__external_store_fallback_";var ud=t=>t.type==="tool-call"&&t.result===void 0,Ug=t=>{if(t.type!=="tool-call"||t.result!==void 0)return!1;let e=t.messages?.at(-1);return e?.role==="assistant"&&e.status.type==="running"},pd=t=>t.type==="tool-call"&&xn(t),cr=Symbol("autoStatus"),dd=Object.freeze(Object.assign({type:"running"},{[cr]:!0})),zg=Object.freeze(Object.assign({type:"complete",reason:"unknown"},{[cr]:!0})),Hg=Object.freeze(Object.assign({type:"incomplete",reason:"cancelled"},{[cr]:!0})),qg=Object.freeze(Object.assign({type:"requires-action",reason:"tool-calls"},{[cr]:!0})),Gg=Object.freeze(Object.assign({type:"requires-action",reason:"interrupt"},{[cr]:!0})),md=t=>t[cr]===!0,hd=(t,e,r,o,s,i,n)=>t&&s!==void 0&&s!==null?Object.assign({type:"incomplete",reason:"error",error:s},{[cr]:!0}):t&&e?dd:r?Gg:n&&!i?dd:o?qg:i?Hg:zg,Fn=t=>hd(!1,!1,typeof t!="string"&&t.some(pd),typeof t!="string"&&t.some(ud)),Vn=(t,e,r)=>hd(e,r,typeof t!="string"&&t.some(pd),typeof t!="string"&&t.some(ud),void 0,void 0,typeof t!="string"&&t.some(Ug));var Un=class{constructor(){h(this,"cache",new WeakMap)}convertMessages(t,e){return t.map((r,o)=>{let s=e(this.cache.get(r),r,o);return this.cache.set(r,s),s})}};var zn=(t,e)=>{if(t.length!==e.length)return!1;for(let r=0;r<t.length;r++)if(t[r]!==e[r])return!1;return!0};var fd=V("react/jsx-runtime"),Hn=t=>{let e=v(6),{index:r,children:o}=t,s=q(),i;e[0]!==r?(i=le({attachment:ce({source:"message",query:{type:"index",index:r},get:l=>l.message.attachment({index:r})})}),e[0]=r,e[1]=i):i=e[1];let n=i,a;return e[2]!==s||e[3]!==o||e[4]!==n?(a=(0,fd.jsx)(he,{extends:s,config:n,children:o}),e[2]=s,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var gd=V("react/jsx-runtime"),qn=t=>{let e=v(6),{index:r,children:o}=t,s=q(),i;e[0]!==r?(i=le({message:ce({source:"thread",query:{type:"index",index:r},get:l=>l.thread.message({index:r})}),composer:ce({source:"message",query:{},get:l=>l.thread.message({index:r}).composer()})}),e[0]=r,e[1]=i):i=e[1];let n=i,a;return e[2]!==s||e[3]!==o||e[4]!==n?(a=(0,gd.jsx)(he,{extends:s,config:n,children:o}),e[2]=s,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var vd=V("react/jsx-runtime"),dr=t=>{let e=v(6),{index:r,children:o}=t,s=q(),i;e[0]!==r?(i=le({part:ce({source:"message",query:{type:"index",index:r},get:l=>l.message.part({index:r})})}),e[0]=r,e[1]=i):i=e[1];let n=i,a;return e[2]!==s||e[3]!==o||e[4]!==n?(a=(0,vd.jsx)(he,{extends:s,config:n,children:o}),e[2]=s,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var bd=V("react/jsx-runtime"),Wg=t=>{let e=v(7),{text:r,isRunning:o}=t,s;e[0]!==o?(s=o?{type:"running"}:{type:"complete"},e[0]=o,e[1]=s):s=e[1];let i;e[2]!==s||e[3]!==r?(i={type:"text",text:r,status:s},e[2]=s,e[3]=r,e[4]=i):i=e[4];let n=i,a;return e[5]!==n?(a={getState:()=>n,addToolResult:Jg,resumeToolCall:Qg,respondToToolApproval:Yg,unstable_recordInteraction:Xg},e[5]=n,e[6]=a):a=e[6],a},Kg=L(Wg),ur=t=>{let e=v(7),{text:r,isRunning:o,children:s}=t,i=o===void 0?!1:o,n=q(),a;e[0]!==i||e[1]!==r?(a=le({part:Kg({text:r,isRunning:i})}),e[0]=i,e[1]=r,e[2]=a):a=e[2];let l=a,c;return e[3]!==n||e[4]!==s||e[5]!==l?(c=(0,bd.jsx)(he,{extends:n,config:l,children:s}),e[3]=n,e[4]=s,e[5]=l,e[6]=c):c=e[6],c};function Jg(){throw new Error("Not supported")}function Qg(){throw new Error("Not supported")}function Yg(){throw new Error("Not supported")}async function Xg(){throw new Error("Not supported")}var wd=t=>{for(let e of t)if(e?.status.type==="running")return Ns;return t.at(-1)?.status??Pe},yd=(t,e)=>{let r={running:0,complete:0,incomplete:0,requiresAction:0},o=Pe,s=!1;for(let i of e)switch(o=t[i]?.status??Pe,o.type){case"running":r.running++,s=!0;break;case"complete":r.complete++;break;case"incomplete":r.incomplete++;break;case"requires-action":r.requiresAction++}return{status:s?Ns:o,counts:r}};var Zg=t=>{let e=v(11),{parts:r,getMessagePart:o}=t,[s,i]=j(!0),n;e[0]!==r?(n=wd(r),e[0]=r,e[1]=n):n=e[1];let a=n,l;e[2]!==s||e[3]!==r||e[4]!==a?(l={parts:r,collapsed:s,status:a},e[2]=s,e[3]=r,e[4]=a,e[5]=l):l=e[5];let c=l,d;e[6]!==c?(d=()=>c,e[6]=c,e[7]=d):d=e[7];let u;return e[8]!==o||e[9]!==d?(u={getState:d,setCollapsed:i,part:o},e[8]=o,e[9]=d,e[10]=u):u=e[10],u},xd=L(Zg);var _d=V("react/jsx-runtime"),Sd=t=>{let e=v(4),{startIndex:r,endIndex:o,children:s}=t,i=P(ev).slice(r,o+1),n=q(),a=le({chainOfThought:xd({parts:i,getMessagePart:c=>{let{index:d}=c;if(d<0||d>=i.length)throw new Error(`ChainOfThought part index ${d} is out of bounds (0..${i.length-1})`);return n.message.part({index:r+d})}})}),l;return e[0]!==s||e[1]!==a||e[2]!==n?(l=(0,_d.jsx)(he,{extends:n,config:a,children:s}),e[0]=s,e[1]=a,e[2]=n,e[3]=l):l=e[3],l};function ev(t){return t.message.parts}var Td=V("react/jsx-runtime"),Gn=t=>{let e=v(6),{index:r,children:o}=t,s=q(),i;e[0]!==r?(i=le({suggestion:ce({source:"suggestions",query:{index:r},get:l=>l.suggestions.suggestion({index:r})})}),e[0]=r,e[1]=i):i=e[1];let n=i,a;return e[2]!==s||e[3]!==o||e[4]!==n?(a=(0,Td.jsx)(he,{extends:s,config:n,children:o}),e[2]=s,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var Cd=Symbol.for("assistant-ui.message-not-sent"),kd,Id,Wn=class extends(Id=Error,kd=Cd,Id){constructor(e="The message was not sent."){super(e);h(this,kd,!0);this.name="MessageNotSentError"}},Ys=t=>typeof t=="object"&&t!==null&&Cd in t;var Xs=(t,e)=>{Promise.resolve(e).catch(r=>{Ys(r)||console.error(`[assistant-ui] ${t} failed`,r)})};var Ed=class{constructor(t){h(this,"_core");this._core=t,this.__internal_bindMethods()}get path(){return this._core.path}__internal_bindMethods(){this.getState=this.getState.bind(this),this.remove=this.remove.bind(this),this.subscribe=this.subscribe.bind(this)}getState(){return this._core.getState()}subscribe(t){return this._core.subscribe(t)}},Rd=class extends Ed{constructor(e,r){super(e);h(this,"_composerApi");this._composerApi=r}remove(){let e=this._composerApi.getState();if(!e)throw new Error("Composer is not available");return e.removeAttachment(this.getState().id)}},Ad=class extends Rd{get source(){return"thread-composer"}},Md=class extends Rd{get source(){return"edit-composer"}},Pd=class extends Ed{get source(){return"message"}remove(){throw new Error("Message attachments cannot be removed")}};var Dr=Object.freeze([]),Od=Object.freeze({}),tv=t=>Object.freeze({type:"thread",isEditing:t?.isEditing??!1,canCancel:t?.canCancel??!1,canSend:t?.canSend??!1,isEmpty:t?.isEmpty??!0,attachments:t?.attachments??Dr,text:t?.text??"",role:t?.role??"user",runConfig:t?.runConfig??Od,attachmentAccept:t?.attachmentAccept??"",dictation:t?.dictation,quote:t?.quote,queue:t?.queue??Dr,submission:t?.submission,inTransit:t?.inTransit??Dr,value:t?.text??""}),rv=t=>Object.freeze({type:"edit",isEditing:t?.isEditing??!1,canCancel:t?.canCancel??!1,canSend:t?.canSend??!1,isEmpty:t?.isEmpty??!0,text:t?.text??"",role:t?.role??"user",attachments:t?.attachments??Dr,runConfig:t?.runConfig??Od,attachmentAccept:t?.attachmentAccept??"",dictation:t?.dictation,quote:t?.quote,queue:t?.queue??Dr,submission:t?.submission,inTransit:t?.inTransit??Dr,parentId:t?.parentId??null,sourceId:t?.sourceId??null,value:t?.text??""}),Dd=class{constructor(t){h(this,"_core");h(this,"_eventSubscriptionSubjects",new Map);this._core=t}get path(){return this._core.path}__internal_bindMethods(){this.setText=this.setText.bind(this),this.setRunConfig=this.setRunConfig.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this),this.addAttachment=this.addAttachment.bind(this),this.reset=this.reset.bind(this),this.clearAttachments=this.clearAttachments.bind(this),this.send=this.send.bind(this),this.cancel=this.cancel.bind(this),this.steerQueueItem=this.steerQueueItem.bind(this),this.moveQueueItem=this.moveQueueItem.bind(this),this.removeQueueItem=this.removeQueueItem.bind(this),this.setRole=this.setRole.bind(this),this.getAttachmentByIndex=this.getAttachmentByIndex.bind(this),this.startDictation=this.startDictation.bind(this),this.stopDictation=this.stopDictation.bind(this),this.setQuote=this.setQuote.bind(this),this.unstable_on=this.unstable_on.bind(this)}setText(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setText(t)}setRunConfig(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setRunConfig(t)}addAttachment(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");return e.addAttachment(t)}reset(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");return t.reset()}clearAttachments(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");return t.clearAttachments()}send(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.send(t)}cancel(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");t.cancel()}steerQueueItem(t){this.moveQueueItem(t,{lane:"steer",insertAfter:null})}moveQueueItem(t,e){let r=this._core.getState();if(!r)throw new Error("Composer is not available");r.moveQueueItem(t,e)}removeQueueItem(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.removeQueueItem(t)}setRole(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setRole(t)}startDictation(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");t.startDictation()}stopDictation(){let t=this._core.getState();if(!t)throw new Error("Composer is not available");t.stopDictation()}setQuote(t){let e=this._core.getState();if(!e)throw new Error("Composer is not available");e.setQuote(t)}subscribe(t){return this._core.subscribe(t)}unstable_on(t,e){let r=this._eventSubscriptionSubjects.get(t);return r||(r=new Is({event:t,binding:this._core}),this._eventSubscriptionSubjects.set(t,r)),r.subscribe(e)}},Nd=class extends Dd{constructor(e){let r=new uo({path:e.path,getState:()=>tv(e.getState()),subscribe:o=>e.subscribe(o)});super({path:e.path,getState:()=>e.getState(),subscribe:o=>r.subscribe(o)});h(this,"_getState");this._getState=r.getState.bind(r),this.__internal_bindMethods()}get path(){return this._core.path}get type(){return"thread"}getState(){return this._getState()}getAttachmentByIndex(e){return new Ad(new ke({path:{...this.path,attachmentSource:"thread-composer",attachmentSelector:{type:"index",index:e},ref:`${this.path.ref}.attachments[${e}]`},getState:()=>{let r=this.getState().attachments[e];return r?{...r,source:"thread-composer"}:Te},subscribe:r=>this._core.subscribe(r)}),this._core)}},Bd=class extends Dd{constructor(e,r){let o=new uo({path:e.path,getState:()=>rv(e.getState()),subscribe:s=>e.subscribe(s)});super({path:e.path,getState:()=>e.getState(),subscribe:s=>o.subscribe(s)});h(this,"_getState");h(this,"_beginEdit");this._beginEdit=r,this._getState=o.getState.bind(o),this.__internal_bindMethods()}get path(){return this._core.path}get type(){return"edit"}__internal_bindMethods(){super.__internal_bindMethods(),this.beginEdit=this.beginEdit.bind(this)}getState(){return this._getState()}beginEdit(){this._beginEdit()}getAttachmentByIndex(e){return new Md(new ke({path:{...this.path,attachmentSource:"edit-composer",attachmentSelector:{type:"index",index:e},ref:`${this.path.ref}.attachments[${e}]`},getState:()=>{let r=this.getState().attachments[e];return r?{...r,source:"edit-composer"}:Te},subscribe:r=>this._core.subscribe(r)}),this._core)}};var ov="ui://",Ld=t=>!!t?.startsWith(ov),$d=t=>t.display==="text"||t.allowFreeform===!0;var jd={"allow-once":!0,"allow-always":!0,"reject-once":!1,"reject-always":!1},Fd=(t,e)=>{let r=e.text;if(r!==void 0&&!$d(t))throw new Error(`Tool approval "${t.id}" does not accept a free-form answer; the request must declare display "text" or allowFreeform`);let o,s;if("optionId"in e){let i=t.options?.find(n=>n.id===e.optionId);if(!i)throw new Error(`Tool approval has no option with id "${e.optionId}"`);if("approved"in e)o=e.approved;else{if(!Object.hasOwn(jd,i.kind))throw new Error(`Tool approval option "${i.id}" has a custom kind "${i.kind}"; respond with an explicit approved value instead`);o=jd[i.kind]}s=i.id}else if("approved"in e)o=e.approved;else{if(t.display!=="text"&&t.display!=="select")throw new Error(`Tool approval "${t.id}" is a decision, not a question; respond with an explicit approved value, optionally alongside the answer`);o=!0}return{approvalId:t.id,approved:o,...s!==void 0&&{optionId:s},...r!==void 0&&{text:r},...e.reason!=null&&{reason:e.reason}}};var Kn=class{constructor(t,e,r){h(this,"contentBinding");h(this,"messageApi");h(this,"threadApi");this.contentBinding=t,this.messageApi=e,this.threadApi=r,this.__internal_bindMethods()}get path(){return this.contentBinding.path}__internal_bindMethods(){this.addToolResult=this.addToolResult.bind(this),this.resumeToolCall=this.resumeToolCall.bind(this),this.respondToToolApproval=this.respondToToolApproval.bind(this),this.unstable_recordInteraction=this.unstable_recordInteraction.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this)}getState(){return this.contentBinding.getState()}addToolResult(t){let e=this.contentBinding.getState();if(!e)throw new Error("Message part is not available");if(e.type!=="tool-call")throw new Error("Tried to add tool result to non-tool message part");if(!this.messageApi)throw new Error("Message API is not available. This is likely a bug in assistant-ui.");if(!this.threadApi)throw new Error("Thread API is not available");let r=this.messageApi.getState();if(!r)throw new Error("Message is not available");let o=e.toolName,s=e.toolCallId,i=Ve.toResponse(t);this.threadApi.getState().addToolResult({messageId:r.id,toolName:o,toolCallId:s,result:i.result,isError:i.isError,...i.artifact!==void 0&&{artifact:i.artifact},...i.modelContent!==void 0&&{modelContent:i.modelContent}})}resumeToolCall(t){let e=this.contentBinding.getState();if(!e)throw new Error("Message part is not available");if(e.type!=="tool-call")throw new Error("Tried to resume tool call on non-tool message part");if(!this.threadApi)throw new Error("Thread API is not available");let r=e.toolCallId;this.threadApi.getState().resumeToolCall({toolCallId:r,payload:t}),this.unstable_recordInteraction({type:"human-response",payload:t}).catch(()=>{})}respondToToolApproval(t){let e=this.contentBinding.getState();if(!e)throw new Error("Message part is not available");if(e.type!=="tool-call")throw new Error("Tried to respond to tool approval on non-tool message part");if(!e.approval||e.approval.approved!==void 0||e.approval.resolution!==void 0)throw new Error("Tool call has no pending approval");if(!this.threadApi)throw new Error("Thread API is not available");return this.threadApi.getState().respondToToolApproval(Fd(e.approval,t))}async unstable_recordInteraction(t){let e=this.contentBinding.getState();if(!e)throw new Error("Message part is not available");if(e.type!=="tool-call")throw new Error("Tried to record interaction on non-tool message part");if(!this.messageApi)throw new Error("Message API is not available. This is likely a bug in assistant-ui.");if(!this.threadApi)throw new Error("Thread API is not available");let r=this.messageApi.getState();if(!r)throw new Error("Message is not available");let o=this.threadApi.getState();if(!o.unstable_recordToolInteraction)throw new Error("Runtime does not support recording tool interactions.");await o.unstable_recordToolInteraction({messageId:r.id,toolCallId:e.toolCallId,interaction:gc(t)})}subscribe(t){return this.contentBinding.subscribe(t)}};var Vd=(t,e)=>{let r=t.content[e];if(!r)return Te;let o=Bs(t,e,r);return Object.freeze({...r,[Mt]:r[Mt],status:o})},Ud=class{constructor(t,e){h(this,"_core");h(this,"_threadBinding");h(this,"composer");h(this,"_getEditComposerRuntimeCore",()=>this._threadBinding.getState().getEditComposer(this._core.getState().id));this._core=t,this._threadBinding=e,this.composer=new Bd(new ar({path:{...this.path,ref:`${this.path.ref}.composer`,composerSource:"edit"},getState:this._getEditComposerRuntimeCore,subscribe:r=>this._threadBinding.subscribe(r)}),()=>this._threadBinding.getState().beginEdit(this._core.getState().id)),this.__internal_bindMethods()}get path(){return this._core.path}__internal_bindMethods(){this.reload=this.reload.bind(this),this.delete=this.delete.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this),this.getMessagePartByIndex=this.getMessagePartByIndex.bind(this),this.getMessagePartByToolCallId=this.getMessagePartByToolCallId.bind(this),this.getAttachmentByIndex=this.getAttachmentByIndex.bind(this),this.unstable_getCopyText=this.unstable_getCopyText.bind(this),this.speak=this.speak.bind(this),this.stopSpeaking=this.stopSpeaking.bind(this),this.submitFeedback=this.submitFeedback.bind(this),this.switchToBranch=this.switchToBranch.bind(this)}getState(){return this._core.getState()}delete(){let t=this._core.getState();return this._threadBinding.getState().deleteMessage(t.id)}reload(t={}){let e=this._getEditComposerRuntimeCore(),r=e??this._threadBinding.getState().composer,o=e??r,{runConfig:s=o.runConfig}=t,i=this._core.getState();if(i.role!=="assistant")throw new Error("Can only reload assistant messages");Xs("Message reload",this._threadBinding.getState().startRun({parentId:i.parentId,sourceId:i.id,runConfig:s}))}speak(){let t=this._core.getState();return this._threadBinding.getState().speak(t.id)}stopSpeaking(){let t=this._core.getState();if(this._threadBinding.getState().speech?.messageId===t.id)this._threadBinding.getState().stopSpeaking();else throw new Error("Message is not being spoken")}submitFeedback({type:t,comment:e}){let r=this._core.getState();this._threadBinding.getState().submitFeedback({messageId:r.id,type:t,...e!==void 0?{comment:e}:void 0})}switchToBranch({position:t,branchId:e}){let r=this._core.getState();if(e&&t)throw new Error("May not specify both branchId and position");if(!e&&!t)throw new Error("Must specify either branchId or position");let o=this._threadBinding.getState().getBranches(r.id),s=e;if(t==="previous"?s=o[r.branchNumber-2]:t==="next"&&(s=o[r.branchNumber]),!s)throw new Error("Branch not found");this._threadBinding.getState().switchToBranch(s)}unstable_getCopyText(){return pt(this.getState())}subscribe(t){return this._core.subscribe(t)}getMessagePartByIndex(t){if(t<0)throw new Error("Message part index must be >= 0");return new Kn(new ke({path:{...this.path,ref:`${this.path.ref}.content[${t}]`,messagePartSelector:{type:"index",index:t}},getState:()=>Vd(this.getState(),t),subscribe:e=>this._core.subscribe(e)}),this._core,this._threadBinding)}getMessagePartByToolCallId(t){return new Kn(new ke({path:{...this.path,ref:`${this.path.ref}.content[toolCallId=${JSON.stringify(t)}]`,messagePartSelector:{type:"toolCallId",toolCallId:t}},getState:()=>{let e=this._core.getState(),r=e.content.findIndex(o=>o.type==="tool-call"&&o.toolCallId===t);return r===-1?Te:Vd(e,r)},subscribe:e=>this._core.subscribe(e)}),this._core,this._threadBinding)}getAttachmentByIndex(t){return new Pd(new ke({path:{...this.path,ref:`${this.path.ref}.attachments[${t}]`,attachmentSource:"message",attachmentSelector:{type:"index",index:t}},getState:()=>{let e=this.getState().attachments?.[t];return e?{...e,source:"message"}:Te},subscribe:e=>this._core.subscribe(e)}))}};var sv=t=>({parentId:t.parentId??null,sourceId:t.sourceId??null,runConfig:t.runConfig??{},...t.stream?{stream:t.stream}:{}}),iv=t=>({parentId:t.parentId??null,sourceId:t.sourceId??null,runConfig:t.runConfig??{}}),nv=(t,e)=>typeof e=="string"?{createdAt:new Date,parentId:t.at(-1)?.id??null,sourceId:null,runConfig:{},role:"user",content:[{type:"text",text:e}],attachments:[],metadata:{custom:{}}}:{createdAt:e.createdAt??new Date,parentId:e.parentId===void 0?t.at(-1)?.id??null:e.parentId,sourceId:e.sourceId??null,role:e.role??"user",content:e.content,attachments:e.attachments??[],metadata:e.metadata??{custom:{}},runConfig:e.runConfig??{},startRun:e.startRun},vo=t=>{if(t.isRunning!==void 0)return t.isRunning;let e=t.messages.at(-1);return e?.role==="assistant"&&e.status.type==="running"},av=(t,e)=>Object.freeze({threadId:e.id,metadata:e,capabilities:t.capabilities,isDisabled:t.isDisabled,isLoading:t.isLoading,isRunning:vo(t),messages:t.messages,state:t.state,suggestions:t.suggestions,extras:t.extras,speech:t.speech,voice:t.voice}),zd=class{constructor(t,e){h(this,"_threadBinding");h(this,"_stateBinding");h(this,"composer");h(this,"_eventSubscriptionSubjects",new Map);let r=new ke({path:t.path,getState:()=>av(t.getState(),e.getState()),subscribe:o=>{let s=t.subscribe(o),i=e.subscribe(o);return()=>St([s,i])}});this._stateBinding=r,this._threadBinding={path:t.path,getState:()=>t.getState(),getStateState:()=>r.getState(),outerSubscribe:o=>t.outerSubscribe(o),subscribe:o=>t.subscribe(o)},this.composer=new Nd(new ar({path:{...this.path,ref:`${this.path.ref}.composer`,composerSource:"thread"},getState:()=>this._threadBinding.getState().composer,subscribe:o=>this._threadBinding.subscribe(o)})),this.__internal_bindMethods()}get path(){return this._threadBinding.path}get __internal_threadBinding(){return this._threadBinding}__internal_bindMethods(){this.append=this.append.bind(this),this.deleteMessage=this.deleteMessage.bind(this),this.resumeRun=this.resumeRun.bind(this),this.importExternalState=this.importExternalState.bind(this),this.exportExternalState=this.exportExternalState.bind(this),this.startRun=this.startRun.bind(this),this.cancelRun=this.cancelRun.bind(this),this.unstable_notifySessionReset=this.unstable_notifySessionReset.bind(this),this.stopSpeaking=this.stopSpeaking.bind(this),this.connectVoice=this.connectVoice.bind(this),this.disconnectVoice=this.disconnectVoice.bind(this),this.muteVoice=this.muteVoice.bind(this),this.unmuteVoice=this.unmuteVoice.bind(this),this.getVoiceVolume=this.getVoiceVolume.bind(this),this.subscribeVoiceVolume=this.subscribeVoiceVolume.bind(this),this.export=this.export.bind(this),this.import=this.import.bind(this),this.reset=this.reset.bind(this),this.getMessageByIndex=this.getMessageByIndex.bind(this),this.getMessageById=this.getMessageById.bind(this),this.subscribe=this.subscribe.bind(this),this.unstable_on=this.unstable_on.bind(this),this.getModelContext=this.getModelContext.bind(this),this.getState=this.getState.bind(this)}getState(){return this._threadBinding.getStateState()}append(t){Xs("Message append",this._threadBinding.getState().append(nv(this._threadBinding.getState().messages,t)))}deleteMessage(t){return this._threadBinding.getState().deleteMessage(t)}subscribe(t){return this._stateBinding.subscribe(t)}getModelContext(){return this._threadBinding.getState().getModelContext()}startRun(t){return this._threadBinding.getState().startRun(iv(t))}resumeRun(t){return this._threadBinding.getState().resumeRun(sv(t))}exportExternalState(){return this._threadBinding.getState().exportExternalState()}importExternalState(t){this._threadBinding.getState().importExternalState(t)}cancelRun(){this._threadBinding.getState().cancelRun()}unstable_notifySessionReset(){this._threadBinding.getState().unstable_notifySessionReset()}stopSpeaking(){return this._threadBinding.getState().stopSpeaking()}connectVoice(){this._threadBinding.getState().connectVoice()}disconnectVoice(){this._threadBinding.getState().disconnectVoice()}getVoiceVolume(){return this._threadBinding.getState().getVoiceVolume()}subscribeVoiceVolume(t){return this._threadBinding.getState().subscribeVoiceVolume(t)}muteVoice(){this._threadBinding.getState().muteVoice()}unmuteVoice(){this._threadBinding.getState().unmuteVoice()}export(){return this._threadBinding.getState().export()}import(t){this._threadBinding.getState().import(t)}reset(t){this._threadBinding.getState().reset(t)}getMessageByIndex(t){if(t<0)throw new Error("Message index must be >= 0");return this._getMessageRuntime({...this.path,ref:`${this.path.ref}.messages[${t}]`,messageSelector:{type:"index",index:t}},()=>{let e=this._threadBinding.getState().messages,r=e[t];if(r)return{message:r,parentId:e[t-1]?.id??null,index:t}})}getMessageById(t){return this._getMessageRuntime({...this.path,ref:`${this.path.ref}.messages[messageId=${JSON.stringify(t)}]`,messageSelector:{type:"messageId",messageId:t}},()=>this._threadBinding.getState().getMessageById(t))}_getMessageRuntime(t,e){return new Ud(new ke({path:t,getState:()=>{let{message:r,parentId:o,index:s}=e()??{},{messages:i,speech:n}=this._threadBinding.getState();if(!r||o===void 0||s===void 0)return Te;let a=this._threadBinding.getState().getBranches(r.id);return{...r,[Mt]:r[Mt],index:s,isLast:i.at(-1)?.id===r.id,parentId:o,branchNumber:a.indexOf(r.id)+1,branchCount:a.length,speech:n?.messageId===r.id?n:void 0}},subscribe:r=>this._threadBinding.subscribe(r)}),this._threadBinding)}unstable_on(t,e){let r=this._eventSubscriptionSubjects.get(t);return r||(r=new Is({event:t,binding:this._threadBinding,notifyOnRebind:t==="modelContextUpdate"}),this._eventSubscriptionSubjects.set(t,r)),r.subscribe(e)}};var Nr=new WeakMap,pr=t=>{let e=Nr.get(t);return e||(e=new AbortController,Nr.set(t,e)),e.signal},Hd=new WeakMap,qd=t=>{let e=Hd.get(t);return e||(e=new AbortController,Hd.set(t,e)),e},Gd=t=>qd(t).signal,Wd=t=>{let e=Nr.get(t);e?.signal.aborted||(Nr.delete(t),e?.abort())},lv=t=>{if(t.voice)try{t.disconnectVoice()}catch(e){console.error("[assistant-ui] Voice cleanup threw while discarding a thread runtime",e)}};var Zs=t=>{let e=Nr.get(t)??new AbortController;Nr.set(t,e),e.abort(),qd(t).abort(),lv(t)};var bo=class{constructor(t,e){h(this,"_core");h(this,"_threadListBinding");this._core=t,this._threadListBinding=e,this.__internal_bindMethods()}get path(){return this._core.path}__internal_bindMethods(){this.switchTo=this.switchTo.bind(this),this.rename=this.rename.bind(this),this.updateCustom=this.updateCustom.bind(this),this.archive=this.archive.bind(this),this.unarchive=this.unarchive.bind(this),this.delete=this.delete.bind(this),this.initialize=this.initialize.bind(this),this.generateTitle=this.generateTitle.bind(this),this.subscribe=this.subscribe.bind(this),this.unstable_on=this.unstable_on.bind(this),this.getState=this.getState.bind(this),this.detach=this.detach.bind(this)}getState(){return this._core.getState()}switchTo(t){let e=this._core.getState();return this._threadListBinding.switchToThread(e.id,t)}rename(t){let e=this._core.getState();return this._threadListBinding.rename(e.id,t)}updateCustom(t){let e=this._core.getState();if(!this._threadListBinding.updateCustom)throw new Error("Thread list runtime does not support updating custom metadata");return this._threadListBinding.updateCustom(e.id,t)}archive(){let t=this._core.getState();return this._threadListBinding.archive(t.id)}unarchive(){let t=this._core.getState();return this._threadListBinding.unarchive(t.id)}delete(){let t=this._core.getState();return this._threadListBinding.delete(t.id)}initialize(){let t=this._core.getState();return this._threadListBinding.initialize(t.id)}generateTitle(t){let e=this._core.getState();return this._threadListBinding.generateTitle(e.id,t)}unstable_on(t,e){let r=this._core.getState().isMain,o=this._core.getState().id;return this.subscribe(()=>{let s=this._core.getState(),i=s.isMain,n=s.id;r===i&&o===n||(r=i,o=n,!(t==="switchedTo"&&!i)&&(t==="switchedAway"&&i||pe([e],{},`Thread list item "${t}"`)))})}subscribe(t){return this._core.subscribe(t)}detach(){let t=this._core.getState();this._threadListBinding.detach(t.id)}__internal_getRuntime(){return this}};var Jn=Promise.resolve(),cv=()=>{},dv=t=>({mainThreadId:t.mainThreadId,newThreadId:t.newThreadId,threadIds:t.threadIds,archivedThreadIds:t.archivedThreadIds,isLoading:t.isLoading,loadError:t.loadError,isLoadingMore:t.isLoadingMore??!1,hasMore:t.hasMore??!1,threadItems:t.threadItems}),ei=(t,e)=>{if(e===void 0)return Te;let r=t.getItemById(e);return r?{id:r.id,remoteId:r.remoteId,externalId:r.externalId,title:r.title,status:r.status,lastMessageAt:r.lastMessageAt,custom:r.custom,isMain:r.id===t.mainThreadId,isRunning:t.unstable_isThreadRunning?.(r.id)??!1}:Te},Kd=class{constructor(t,e=zd){h(this,"_getState");h(this,"_stateBinding");h(this,"_core");h(this,"_runtimeFactory");h(this,"_mainThreadListItemRuntime");h(this,"main");this._core=t,this._runtimeFactory=e;let r=new uo({path:{},getState:()=>dv(t),subscribe:o=>t.subscribe(o)});this._getState=r.getState.bind(r),this._stateBinding=r,this._mainThreadListItemRuntime=new bo(new ke({path:{ref:"threadItems[main]",threadSelector:{type:"main"}},getState:()=>ei(this._core,this._core.mainThreadId),subscribe:o=>this._core.subscribe(o)}),this._core),this.main=new e(new ar({path:{ref:"threads.main",threadSelector:{type:"main"}},getState:()=>t.getMainThreadRuntimeCore(),subscribe:o=>t.subscribe(o)}),this._mainThreadListItemRuntime),this.__internal_bindMethods()}__internal_bindMethods(){this.switchToThread=this.switchToThread.bind(this),this.switchToNewThread=this.switchToNewThread.bind(this),this.unstable_subscribeThreadEvents=this.unstable_subscribeThreadEvents.bind(this),this.getLoadThreadsPromise=this.getLoadThreadsPromise.bind(this),this.reload=this.reload.bind(this),this.reloadMainThread=this.reloadMainThread.bind(this),this.loadMore=this.loadMore.bind(this),this.getState=this.getState.bind(this),this.subscribe=this.subscribe.bind(this),this.getById=this.getById.bind(this),this.getItemById=this.getItemById.bind(this),this.getItemByIndex=this.getItemByIndex.bind(this),this.getArchivedItemByIndex=this.getArchivedItemByIndex.bind(this)}switchToThread(t,e){return this._core.switchToThread(t,e)}switchToNewThread(){return this._core.switchToNewThread()}unstable_subscribeThreadEvents(t){return this._core.unstable_subscribeThreadEvents?.(t)??cv}getLoadThreadsPromise(){return this._core.getLoadThreadsPromise()}reload(){return this._core.reload?.()??Jn}reloadMainThread(){return this._core.reloadMainThread?.()??Jn}loadMore(){return this._core.loadMore?.()??Jn}getState(){return this._getState()}subscribe(t){return this._stateBinding.subscribe(t)}get mainItem(){return this._mainThreadListItemRuntime}_createItemStateBinding(t){return new ke({path:{ref:`threadItems[threadId=${t}]`,threadSelector:{type:"threadId",threadId:t}},getState:()=>ei(this._core,t),subscribe:e=>this._core.subscribe(e)})}getById(t){return new this._runtimeFactory(new ar({path:{ref:`threads[threadId=${JSON.stringify(t)}]`,threadSelector:{type:"threadId",threadId:t}},getState:()=>this._core.getThreadRuntimeCore(t),subscribe:e=>this._core.subscribe(e)}),this._createItemStateBinding(t))}getItemByIndex(t){return new bo(new ke({path:{ref:`threadItems[${t}]`,threadSelector:{type:"index",index:t}},getState:()=>ei(this._core,this._core.threadIds[t]),subscribe:e=>this._core.subscribe(e)}),this._core)}getArchivedItemByIndex(t){return new bo(new ke({path:{ref:`archivedThreadItems[${t}]`,threadSelector:{type:"archiveIndex",index:t}},getState:()=>ei(this._core,this._core.archivedThreadIds[t]),subscribe:e=>this._core.subscribe(e)}),this._core)}getItemById(t){return new bo(this._createItemStateBinding(t),this._core)}};var Jd=class{constructor(t){h(this,"threads");h(this,"_thread");h(this,"_core");this._core=t,this.threads=new Kd(t.threads),this._thread=this.threads.main,this.__internal_bindMethods()}__internal_bindMethods(){this.registerModelContextProvider=this.registerModelContextProvider.bind(this)}get thread(){return this._thread}registerModelContextProvider(t){return this._core.registerModelContextProvider(t)}};var Qd=class{constructor(){h(this,"_contextProvider",new Cs)}registerModelContextProvider(t){return this._contextProvider.registerModelContextProvider(t)}getModelContextProvider(){return this._contextProvider}};var mr=Object.freeze([]),Br="DEFAULT_THREAD_ID",uv=Object.freeze([Br]),pv=Object.freeze({id:Br,remoteId:void 0,externalId:void 0,status:"regular"}),mv=Promise.resolve(),Yd=Object.freeze(ve({[Br]:pv})),Xd=class extends Cr{constructor(e={},r){super();h(this,"_mainThreadId",Br);h(this,"_threads",uv);h(this,"_archivedThreads",mr);h(this,"_threadData",Yd);h(this,"adapter",{});h(this,"_mainThread");h(this,"threadFactory");this.threadFactory=r,this.__internal_setAdapter(e,!0)}get isLoading(){return this.adapter.isLoading??!1}get newThreadId(){}get threadIds(){return this._threads}get archivedThreadIds(){return this._archivedThreads}get threadItems(){return this._threadData}getLoadThreadsPromise(){return mv}get mainThreadId(){return this._mainThreadId}getMainThreadRuntimeCore(){return this._mainThread}getThreadRuntimeCore(){throw new Error("Method not implemented.")}getItemById(e){return Object.hasOwn(this._threadData,e)?this._threadData[e]:void 0}__internal_setAdapter(e,r=!1){let o=this.adapter;this.adapter=e;let s=e.threadId??Br,i=e.threads??mr,n=e.archivedThreads??mr,a=o.threadId??Br,l=o.threads??mr,c=o.archivedThreads??mr;!r&&(o.isLoading??!1)===(e.isLoading??!1)&&a===s&&l===i&&c===n||((l!==i||c!==n||a!==s)&&(this._threadData=ve(Yd,Object.fromEntries(e.threads?.map(d=>[d.id,{...d,remoteId:d.remoteId,externalId:d.externalId,status:"regular"}])??[]),Object.fromEntries(e.archivedThreads?.map(d=>[d.id,{...d,remoteId:d.remoteId,externalId:d.externalId,status:"archived"}])??[]))),l!==i&&(this._threads=this.adapter.threads?.map(d=>d.id)??mr),c!==n&&(this._archivedThreads=this.adapter.archivedThreads?.map(d=>d.id)??mr),(r||a!==s)&&(r||Zs(this._mainThread),this._mainThreadId=s,this._mainThread=this.threadFactory()),Object.hasOwn(this._threadData,this._mainThreadId)||(this._threadData=ve(this._threadData,{[this._mainThreadId]:{id:this._mainThreadId,remoteId:void 0,externalId:void 0,status:"regular"}})),this._notifySubscribers())}async reloadMainThread(){this._mainThread.unstable_refetchThread&&await this._mainThread.unstable_refetchThread()}async switchToThread(e,r){if(this._mainThreadId===e)return;let o=this.adapter.onSwitchToThread;if(!o)throw new Error("External store adapter does not support switching to thread");await o(e)}async switchToNewThread(){let e=this.adapter.onSwitchToNewThread;if(!e)throw new Error("External store adapter does not support switching to new thread");await e()}async rename(e,r){let o=this.adapter.onRename;if(!o)throw new Error("External store adapter does not support renaming");await o(e,r)}async updateCustom(e,r){let o=this.adapter.onUpdateCustom;if(!o)throw new Error("External store adapter does not support updating custom metadata");await o(e,r)}async detach(){}async archive(e){let r=this.adapter.onArchive;if(!r)throw new Error("External store adapter does not support archiving");await r(e)}async unarchive(e){let r=this.adapter.onUnarchive;if(!r)throw new Error("External store adapter does not support unarchiving");await r(e)}async delete(e){let r=this.adapter.onDelete;if(!r)throw new Error("External store adapter does not support deleting");await r(e)}initialize(e){return Promise.resolve({remoteId:e,externalId:void 0})}generateTitle(){throw new Error("Method not implemented.")}};var ri={fromArray:t=>{let e=t.map(r=>Ht(r,Ie(),Fn(r.content)));return{messages:e.map((r,o)=>({parentId:o>0?e[o-1].id:null,message:r}))}},fromBranchableArray:(t,e)=>({...e?.headId!==void 0?{headId:e.headId}:void 0,messages:t.map(({message:r,parentId:o})=>{if(!r.id)throw new Error("ExportedMessageRepository.fromBranchableArray: Each message must have an 'id' field set.");return{parentId:o,message:Ht(r,r.id,Fn(r.content))}})})},ti=t=>{let e=t;for(;e.next;)e=e.next;return"current"in e?e:null},hv=(t,e)=>{let r=new Set(t.map(n=>n.message.id)),o=new Set,s=new Map,i=[];for(let n of t){let{parentId:a}=n;if(a!==null&&r.has(a)&&!o.has(a)&&!e(a)){let l=s.get(a);l?l.push(n):s.set(a,[n]);continue}for(let l=i.push(n)-1;l<i.length;l++){let{id:c}=i[l].message;if(o.has(c))continue;o.add(c);let d=s.get(c);d&&(s.delete(c),i.push(...d))}}for(let n of s.values())i.push(...n);return i};var fv=class{constructor(t){h(this,"_value",null);h(this,"func");this.func=t}get value(){return this._value===null&&(this._value=this.func()),this._value}dirty(){this._value=null}},oi=class{constructor(){h(this,"messages",new Map);h(this,"head",null);h(this,"root",{children:[],next:null});h(this,"_messages",new fv(()=>{let t=new Array((this.head?.level??-1)+1);for(let e=this.head;e;e=e.prev)t[e.level]=e.current;return t}))}updateLevels(t,e){let r=[{message:t,level:e}];for(;r.length>0;){let o=r.pop();o.message.level=o.level;for(let s of o.message.children){let i=this.messages.get(s);i&&r.push({message:i,level:o.level+1})}}}selectPathTo(t){for(let e=t;e;e=e.prev)(e.prev??this.root).next=e}performOp(t,e,r){let o=e.prev??this.root,s=t??this.root;if(!(r==="relink"&&o===s)){if(r==="relink"){for(let i=t;i;i=i.prev)if(i.current.id===e.current.id)throw new Error("MessageRepository(performOp/relink): A message with the same id already exists in the parent tree. This error occurs if the same message id is found multiple times. This is likely an internal bug in assistant-ui.")}if(r!=="link"&&(o.children=o.children.filter(i=>i!==e.current.id),o.next===e)){let i=o.children.at(-1),n=i?this.messages.get(i):null;if(n===void 0)throw new Error("MessageRepository(performOp/cut): Fallback sibling message not found. This is likely an internal bug in assistant-ui.");o.next=n}if(r!=="cut"){s.children=[...s.children,e.current.id],e.prev=t,ti(e)===this.head?this.selectPathTo(e):s.next===null&&(s.next=e,this.head===s&&(this.head=ti(e)));let i=t?t.level+1:0;this.updateLevels(e,i)}}}get headId(){return this.head?.current.id??null}get canonicalHeadId(){let t=this.head;for(;t?.current.metadata?.isOptimistic;)t=t.prev;return t?.current.id??null}getMessages(t){if(t===void 0||t===this.head?.current.id)return this._messages.value;let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(getMessages): Head message not found. This is likely an internal bug in assistant-ui.");let r=new Array(e.level+1);for(let o=e;o;o=o.prev)r[o.level]=o.current;return r}addOrUpdateMessage(t,e){let r=this.messages.get(e.id),o=t?this.messages.get(t):null;if(o===void 0)throw new Error("MessageRepository(addOrUpdateMessage): Parent message not found. This is likely an internal bug in assistant-ui.");if(r){this.performOp(o,r,"relink"),r.current=e,this._messages.dirty();return}let s={prev:o,current:e,next:null,children:[],level:o?o.level+1:0};this.messages.set(e.id,s),this.performOp(o,s,"link"),this.head===o&&(this.head=s),this._messages.dirty()}getMessage(t){let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(updateMessage): Message not found. This is likely an internal bug in assistant-ui.");return{parentId:e.prev?.current.id??null,message:e.current,index:e.level}}deleteMessage(t,e){let r=this.messages.get(t);if(!r)throw new Error("MessageRepository(deleteMessage): Message not found. This is likely an internal bug in assistant-ui.");let o=e===void 0?r.prev:e===null?null:this.messages.get(e);if(o===void 0)throw new Error("MessageRepository(deleteMessage): Replacement not found. This is likely an internal bug in assistant-ui.");for(let s=o;s;s=s.prev)if(s===r)throw new Error("MessageRepository(deleteMessage): Replacement is the deleted message or one of its descendants. This is likely an internal bug in assistant-ui.");for(let s of r.children){let i=this.messages.get(s);if(!i)throw new Error("MessageRepository(deleteMessage): Child message not found. This is likely an internal bug in assistant-ui.");this.performOp(o,i,"relink")}this.performOp(null,r,"cut"),this.messages.delete(t),this.head===r&&(this.head=ti(o??this.root)),this._messages.dirty()}hasChildren(t){return(this.messages.get(t)?.children.length??0)>0}getBranches(t){let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(getBranches): Message not found. This is likely an internal bug in assistant-ui.");let{children:r}=e.prev??this.root;return r}evictOffBranchOptimisticMessages(t,e){if(!t)return;let r=new Set;for(let s=e;s;s=s.prev)r.add(s.current.id);let o=[];for(let s=t;s&&!r.has(s.current.id);s=s.prev)s.current.metadata?.isOptimistic&&o.push(s.current.id);for(let s of o)this.messages.has(s)&&this.deleteMessage(s)}switchToBranch(t){let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(switchToBranch): Branch not found. This is likely an internal bug in assistant-ui.");let r=this.head;this.selectPathTo(e),this.head=ti(e),this.evictOffBranchOptimisticMessages(r,this.head),this._messages.dirty()}resetHead(t){if(t===null){this.clear();return}let e=this.messages.get(t);if(!e)throw new Error("MessageRepository(resetHead): Branch not found. This is likely an internal bug in assistant-ui.");let r=this.head;if(e.children.length>0){let o=[...e.children];for(;o.length>0;){let s=o.pop(),i=this.messages.get(s);if(i){for(let n of i.children)o.push(n);this.messages.delete(s)}}e.children=[],e.next=null}this.head=e,this.selectPathTo(e),this.evictOffBranchOptimisticMessages(r,this.head),this._messages.dirty()}clear(){this.messages.clear(),this.head=null,this.root={children:[],next:null},this._messages.dirty()}export(){let t=[],e=[...this.root.children].reverse();for(;e.length>0;){let r=this.messages.get(e.pop());if(!r)continue;for(let s=r.children.length-1;s>=0;s--)e.push(r.children[s]);if(r.current.metadata?.isOptimistic)continue;let o=r.prev;for(;o&&o.current.metadata?.isOptimistic;)o=o.prev;t.push({message:r.current,parentId:o?.current.id??null})}return{headId:this.canonicalHeadId,messages:t}}import({headId:t,messages:e}){let r=hv(e,o=>this.messages.has(o));for(let{message:o,parentId:s}of r)this.addOrUpdateMessage(s,o);this.resetHead(t??r.at(-1)?.message.id??null)}};var qt=Object.freeze([]);function*wo(t){for(let e of t)if(!(e?.role!=="assistant"||!Array.isArray(e.content)))for(let r of e.content)!r||r.type!=="tool-call"||(yield{part:r,messageId:e.id},r.messages?.length&&(yield*wo(r.messages)))}function Qn(t,e){if(e==="*")return!0;let r=e.split(",").map(i=>i.trim().toLowerCase()),o=t.name.toLowerCase(),s=t.type.split(";",1)[0].trim().toLowerCase();for(let i of r){if(i.startsWith(".")&&o.endsWith(i)||i.includes("/")&&i===s)return!0;if(i.endsWith("/*")){let n=i.split("/")[0];if(s.startsWith(`${n}/`))return!0}}return!1}function gv(t){let e=Ie();return t.type==="image"?{id:e,type:"image",name:t.filename??"image",content:[t],status:{type:"complete"}}:t.type==="file"?{id:e,type:"document",name:t.filename??"document",contentType:t.mimeType,content:[t],status:{type:"complete"}}:t.type==="audio"?{id:e,type:"audio",name:`audio.${t.audio.format}`,contentType:`audio/${t.audio.format}`,content:[t],status:{type:"complete"}}:{id:e,type:"data",name:t.name,content:[t],status:{type:"complete"}}}function Zd(t){let e=[];for(let r of t)r.type!=="text"&&e.push(gv(r));return e}var eu=t=>"content"in t&&!("lastModified"in t),ht=t=>t.status.type==="complete";var tu=class{constructor(){h(this,"operations",new Set);h(this,"uploading",new Map)}start(){let t={cancelled:!1,attachmentIds:new Set};return this.operations.add(t),t}accept(t,e){if(t.cancelled)return!1;t.attachmentIds.add(e.id);let r=this.uploading.get(e.id);return r?.operation!==t&&(r||e.status.type==="running")&&this.uploading.set(e.id,{operation:t,waiters:r?.waiters??new Set}),e.status.type!=="running"&&this.settle(e.id,t),!0}finish(t){this.operations.delete(t);for(let e of t.attachmentIds)this.settle(e,t)}isCancelled(t){return t.cancelled}cancel(t){for(let e of[...this.operations])e.attachmentIds.has(t)&&(e.cancelled=!0,this.operations.delete(e));this.settle(t)}cancelAll(){for(let t of this.operations)t.cancelled=!0;this.operations.clear();for(let t of[...this.uploading.keys()])this.settle(t)}whenSendable(t){let e=this.uploading.get(t);if(e)return new Promise(r=>e.waiters.add(r))}settle(t,e){let r=this.uploading.get(t);if(r&&!(e&&r.operation!==e)){this.uploading.delete(t);for(let o of r.waiters)o()}}},ru=async(t,e)=>{if(Symbol.asyncIterator in t){for await(let r of t)if(!e(r))break}else e(await t)};var ou=class{constructor(){h(this,"entries",new WeakMap);h(this,"removed",new WeakSet)}markRemoved(t){this.removed.add(t)}unmarkRemoved(t){this.removed.delete(t)}isRemoved(t){return this.removed.has(t)}async send(t,e,r){if(ht(t))return t;let o=this.entries.get(t)??{};if(o.result)return o.result;if(!e)throw new Error("Attachments are not supported");this.entries.set(t,o);let s=await e.send(t,r?{signal:r}:void 0);return o.result=s,s}transfer(t,e){let r=this.entries.get(t);return r&&this.entries.set(e,r),e}};var si=class extends Cr{constructor(){super(...arguments);h(this,"isEditing",!0);h(this,"_attachments",[]);h(this,"_text","");h(this,"_role","user");h(this,"_runConfig",{});h(this,"_quote");h(this,"_submission");h(this,"_submissionSend");h(this,"_inTransit",[]);h(this,"_inTransitSubmissions",[]);h(this,"_sendGeneration",0);h(this,"_attachmentAddOperations",new tu);h(this,"_attachmentSends",new ou);h(this,"_dictation");h(this,"_dictationSession");h(this,"_dictationUnsubscribes",[]);h(this,"_dictationBaseText","");h(this,"_currentInterimText","");h(this,"_dictationSessionIdCounter",0);h(this,"_activeDictationSessionId");h(this,"_isCleaningDictation",!1);h(this,"_eventSubscribers",new Map)}enrichWithComposerMetadata(e,r){return r?{...e,metadata:{...e.metadata,custom:{...e.metadata?.custom,...r}}}:e}get attachmentAccept(){return this.getAttachmentAdapter()?.accept??"*"}get attachments(){return this._attachments}setAttachments(e){this._attachments=e,this._notifySubscribers()}get isEmpty(){return!this.text.trim()&&!this.attachments.length}get text(){return this._text}get role(){return this._role}get runConfig(){return this._runConfig}get quote(){return this._quote}setQuote(e){this._quote!==e&&(this._quote=e,this._notifySubscribers())}setText(e){this._text!==e&&(this._text=e,this._rebaseDictation(e),this._notifySubscribers())}_rebaseDictation(e){if(!this._dictation)return;this._dictationBaseText=e,this._currentInterimText="";let{status:r,inputDisabled:o}=this._dictation;this._dictation=o?{status:r,inputDisabled:o}:{status:r}}setRole(e){this._role!==e&&(this._role=e,this._notifySubscribers())}setRunConfig(e){this._runConfig!==e&&(this._runConfig=e,this._notifySubscribers())}get submission(){return this._submission}get inTransit(){return this._inTransitSubmissions}get isSubmitting(){return this._submission!==void 0}get detachesDraftOnSend(){return!0}threadMessageIds(e){}settleInTransit(){if(this._inTransit.length===0)return;let e=new Set,r=this._inTransit.filter(({submission:o,known:s})=>{let i=this.threadMessageIds(o.role)?.find(n=>!s.has(n)&&!e.has(n));return i===void 0?!0:(e.add(i),!1)});r.length!==this._inTransit.length&&(this._setInTransit(r.map(o=>({...o,known:new Set([...o.known,...e])}))),this._notifySubscribers())}_setInTransit(e){this._inTransit=e,this._inTransitSubmissions=e.map(r=>r.submission)}_leaveTransit(e){let r=this._inTransit.filter(o=>o.submission!==e);return r.length===this._inTransit.length?!1:(this._setInTransit(r),!0)}_cancelAttachmentAdd(e){this._attachmentAddOperations.cancel(e)}_cancelAllAttachmentAdds(){this._attachmentAddOperations.cancelAll()}_emptyTextAndAttachments(){this._attachments=[],this._text="",this._rebaseDictation(""),this._notifySubscribers()}async _onClearAttachments(){let e=this.getAttachmentAdapter();if(e){let r=this._attachments.filter(o=>!ht(o));await Promise.all(r.map(async o=>e.remove(o)))}}async reset(){this._cancelAllAttachmentAdds(),this._sendGeneration++;let e=this._discardSubmission();if(this._attachments.length===0&&this._text===""&&this._role==="user"&&Object.keys(this._runConfig).length===0&&this._quote===void 0){await e;return}this._role="user",this._runConfig={},this._quote=void 0;let r=this._onClearAttachments();this._emptyTextAndAttachments(),await Promise.all([r,e])}async clearAttachments(){if(this._cancelAllAttachmentAdds(),this.isSubmitting)for(let r of this._attachments)this._attachmentSends.markRemoved(r);let e=this._onClearAttachments();this.setAttachments([]),await e}async send(e){if(!this.canSend||this.isSubmitting)return;if(this._dictationSession){let l=this._activeDictationSessionId;try{this._dictationSession.cancel()}catch(c){console.error("[assistant-ui] Dictation session cancel threw",c)}finally{this._cleanupDictation({sessionId:l})}}let r=this.attachments.filter(l=>!this._attachmentSends.isRemoved(l));if(!this.text.trim()&&r.length===0)return;let o={id:Ie(),role:this.role,text:this.text,quote:this._quote,attachments:r},s={options:e,runConfig:this.runConfig},i=r.filter(ht),n=i.length===r.length;if(n||(this._submission=o,this._submissionSend={...s,controller:new AbortController}),this.detachesDraftOnSend){let l=new Set(r);this._attachments=this._attachments.filter(c=>!l.has(c)),this._text="",this._rebaseDictation(""),this._quote=void 0}let a=++this._sendGeneration;if(this._notifySubscribers(),n){this._dispatch(a,o,i,s,!1);return}await this._prepareSubmission(a)}async _prepareSubmission(e){let r=this.getAttachmentAdapter(),o=(this._submission?.attachments??[]).flatMap(d=>{let u=this._attachmentAddOperations.whenSendable(d.id);return u?[u]:[]});if(o.length>0){if(await Promise.all(o),e!==this._sendGeneration)return;this._refreshSubmissionAttachments()}let s=this._submission,i=this._submissionSend;if(!s||!i)return;let n=s.attachments.filter(d=>!this._attachmentSends.isRemoved(d));for(let d of n)this._cancelAttachmentAdd(d.id);let a=await Promise.allSettled(n.map(d=>this._attachmentSends.send(d,r,i.controller.signal)));if(e!==this._sendGeneration)return;let l=a.find(d=>d.status==="rejected");if(l){this._returnSubmissionToDraft(n,a,l.reason);return}let c=a.flatMap((d,u)=>this._attachmentSends.isRemoved(n[u])||d.status==="rejected"?[]:[d.value]);this._dispatch(e,s,c,i,!0)}_dispatch(e,r,o,s,i){let n={createdAt:new Date,role:r.role,content:r.text?[{type:"text",text:r.text}]:[],attachments:o,runConfig:s.runConfig,metadata:{custom:{...r.quote?{quote:r.quote}:{}}}},a={...r,attachments:o},l=this.queue.length;if(i){if(this._submission=void 0,this._submissionSend=void 0,!this.detachesDraftOnSend){let u=new Map(o.map(m=>[m.id,m]));this._attachments=this._attachments.map(m=>u.get(m.id)??m)}let d=this.threadMessageIds(r.role);d&&this._setInTransit([...this._inTransit,{submission:a,known:new Set(d)}])}let c;try{c=this.handleSend(n,s.options)}catch(d){console.error("[assistant-ui] Failed to send the message",d),this._leaveTransit(a),e===this._sendGeneration?this._returnToDraft(a):this._notifySubscribers();return}c&&c.catch(d=>{let u=this._leaveTransit(a);e===this._sendGeneration&&Ys(d)?this._returnToDraft(a):u&&this._notifySubscribers()}),this._notifyEventSubscribers("send",{chars:r.text.length,attachments:o.length}),i&&(this.queue.length>l&&this._leaveTransit(a),this._notifySubscribers(),this.settleInTransit())}_refreshSubmissionAttachments(){let e=this._submission;if(!e)return;let r=e.attachments.filter(o=>!this._attachmentSends.isRemoved(o));r.length!==e.attachments.length&&(this._submission={...e,attachments:r})}_returnSubmissionToDraft(e,r,o){let s=this._submission;if(!s)return;let i=new Map;r.forEach((a,l)=>{a.status==="rejected"&&i.set(e[l].id,a.reason)});let n=s.attachments.map(a=>{if(!i.has(a.id)||ht(a))return a;let l=i.get(a.id);return this._attachmentSends.transfer(a,{...a,status:{type:"incomplete",reason:"error",message:l instanceof Error?l.message:String(l)}})});this._endSubmission(),this._returnToDraft({...s,attachments:n}),console.error("[assistant-ui] Failed to send attachments",o)}_endSubmission(){this._sendGeneration++,this._submission=void 0,this._submissionSend=void 0}__internal_dispose(){this._cancelAllAttachmentAdds(),this._submission&&(this._submissionSend?.controller.abort(),this._endSubmission(),this._notifySubscribers())}cancelSubmission(){let e=this._submission;e&&(this._submissionSend?.controller.abort(),this._endSubmission(),this._returnToDraft(e))}_returnToDraft(e){if(this.detachesDraftOnSend){let r=e.attachments.filter(s=>!this._attachmentSends.isRemoved(s));this._attachments=[...r,...this._attachments];let o=[e.text,this._text].filter(Boolean).join(`
`);this._text=o,this._rebaseDictation(o),this._quote=this._quote??e.quote}else{let r=new Map(e.attachments.map(o=>[o.id,o]));this._attachments=this._attachments.map(o=>r.get(o.id)??o)}this._notifySubscribers()}async _discardSubmission(){let e=this._submission;if(!e)return;this._submissionSend?.controller.abort(),this._endSubmission(),this._notifySubscribers();let r=this.getAttachmentAdapter();if(!r)return;let o=new Set(this._attachments.map(s=>s.id));await Promise.all(e.attachments.filter(s=>!ht(s)&&!o.has(s.id)).map(async s=>r.remove(s)))}restoreDraft(e){return this._text.trim()||this._quote!==void 0||this._attachments.length>0?!1:(this._text=e.text,this._rebaseDictation(e.text),this._quote=e.quote,this._attachments=e.attachments??[],this._notifySubscribers(),!0)}retractDraft(e){let r=e.attachments!==void 0?this._attachments===e.attachments:this._attachments.length===0;this._text!==e.text||this._quote!==e.quote||!r||(this._text="",this._rebaseDictation(""),this._quote=void 0,this._attachments=[],this._notifySubscribers())}cancel(){this.isSubmitting&&!this.detachesDraftOnSend&&(this._submissionSend?.controller.abort(),this._endSubmission(),this._notifySubscribers()),this.handleCancel()}get queue(){return qt}moveQueueItem(e,r){}removeQueueItem(e){}async addAttachment(e){if(eu(e)){let n=this.getAttachmentAdapter();if(n&&!Qn({name:e.name,type:e.contentType??""},n.accept)){let l=`File type ${e.contentType||"unknown"} is not accepted. Accepted types: ${n.accept}`,c=new Error(l);throw this._safeEmitAttachmentAddError("not-accepted",l,void 0,c,e.contentType),c}let a={id:e.id??Ie(),type:e.type??"document",name:e.name,contentType:e.contentType,content:e.content,status:{type:"complete"}};this._attachments=[...this._attachments,a],this._notifySubscribers(),this._notifyEventSubscribers("attachmentAdd",{...a.contentType?{contentType:a.contentType}:void 0});return}let r=this.getAttachmentAdapter();if(!r){let n="Attachments are not supported",a=new Error(n);throw this._safeEmitAttachmentAddError("no-adapter",n,void 0,a,e.type),a}if(!Qn({name:e.name,type:e.type},r.accept)){let n=`File type ${e.type||"unknown"} is not accepted. Accepted types: ${r.accept}`,a=new Error(n);throw this._safeEmitAttachmentAddError("not-accepted",n,void 0,a,e.type),a}let o=this._attachmentAddOperations.start(),s=n=>{if(!this._attachmentAddOperations.accept(o,n))return!1;let a=this._submission,l=a?.attachments.some(d=>d.id===n.id)??!1;a&&l&&(this._submission={...a,attachments:a.attachments.map(d=>d.id===n.id?this._attachmentSends.transfer(d,n):d)});let c=this._attachments.findIndex(d=>d.id===n.id);return c!==-1?this._attachments=[...this._attachments.slice(0,c),n,...this._attachments.slice(c+1)]:l||(this._attachments=[...this._attachments,n]),this._notifySubscribers(),!0},i;try{await ru(r.add({file:e}),n=>(i=n,s(n)))}catch(n){if(this._attachmentAddOperations.isCancelled(o))return;throw i&&s({...i,status:{type:"incomplete",reason:"error",message:n instanceof Error?n.message:String(n)}}),this._safeEmitAttachmentAddError("adapter-error",n instanceof Error?n.message:String(n),i?.id,n instanceof Error?n:void 0,i?.contentType||e.type),n}finally{this._attachmentAddOperations.finish(o)}this._attachmentAddOperations.isCancelled(o)||(i?.status.type==="incomplete"&&i.status.reason==="error"?this._safeEmitAttachmentAddError("adapter-error",i.status.message??"Attachment upload did not complete successfully.",i.id,void 0,i.contentType||e.type):this._notifyEventSubscribers("attachmentAdd",{...i?.contentType?{contentType:i.contentType}:e.type?{contentType:e.type}:void 0}))}_safeEmitAttachmentAddError(e,r,o,s,i){try{this._notifyEventSubscribers("attachmentAddError",{reason:e,message:r,...o!==void 0&&{attachmentId:o},...s!==void 0&&{error:s},...i?{contentType:i}:void 0})}catch(n){console.error("[assistant-ui] attachmentAddError subscriber threw:",n)}}async removeAttachment(e){let r=this._attachments.findIndex(s=>s.id===e);if(r===-1){await this._removeSubmittedAttachment(e);return}let o=this._attachments[r];if(this._cancelAttachmentAdd(e),this._attachmentSends.markRemoved(o),!ht(o)){let s=this.getAttachmentAdapter();if(!s)throw new Error("Attachments are not supported");try{await s.remove(o)}catch(i){let n=i instanceof Error?i.message:String(i);throw this._attachments=this._attachments.map(a=>a.id===e&&!ht(a)?this._attachmentSends.transfer(a,{...a,status:{type:"incomplete",reason:"error",message:n}}):a),this._notifySubscribers(),i}}this._attachments=this._attachments.filter(s=>s.id!==e),this._notifySubscribers()}async _removeSubmittedAttachment(e){let r=this._submission?.attachments.find(s=>s.id===e);if(!r)throw new Error("Attachment not found");if(this._cancelAttachmentAdd(e),this._attachmentSends.markRemoved(r),!ht(r)){let s=this.getAttachmentAdapter();if(!s)throw new Error("Attachments are not supported");try{await s.remove(r)}catch(i){throw this._failSubmittedRemoval(e,i),i}}let o=this._submission;o&&(this._submission={...o,attachments:o.attachments.filter(s=>s.id!==e)},this._notifySubscribers())}_failSubmittedRemoval(e,r){let o=this._submission;if(!o)return;let s=r instanceof Error?r.message:String(r);this._submission={...o,attachments:o.attachments.map(i=>{if(i.id!==e||ht(i))return i;let n=this._attachmentSends.transfer(i,{...i,status:{type:"incomplete",reason:"error",message:s}});return this._attachmentSends.markRemoved(n),n})},this._notifySubscribers()}get dictation(){return this._dictation}_isActiveSession(e,r){return this._activeDictationSessionId===e&&this._dictationSession===r}startDictation(){let e=this.getDictationAdapter();if(!e)throw new Error("Dictation adapter not configured");let r=this._dictationSession!==void 0;if(this._dictationSession){let c=this._dictationSession;this._cleanupDictation({notify:!1}),this._stopDictationSession(c)}let o=e.disableInputDuringDictation??!1;this._dictationBaseText=this._text,this._currentInterimText="";let s;try{s=e.listen()}catch(c){if(r)try{this._notifySubscribers()}catch(d){console.error("[assistant-ui] Dictation replacement rollback notification threw",d)}throw c}this._dictationSession=s;let i=++this._dictationSessionIdCounter;this._activeDictationSessionId=i,this._dictation={status:s.status,inputDisabled:o};try{this._notifySubscribers()}catch(c){console.error("[assistant-ui] Dictation start notification threw",c)}if(!this._isActiveSession(i,s))return;let n=[],a=()=>{for(let c of n.splice(0))try{c()}catch(d){console.error("[assistant-ui] Dictation cleanup threw",d)}},l=c=>(n.push(c),this._isActiveSession(i,s)?!0:(a(),!1));try{if(!l(s.onSpeech(d=>{if(!this._isActiveSession(i,s))return;let u=d.isFinal!==!1,m=this._dictationBaseText&&!this._dictationBaseText.endsWith(" ")&&d.transcript?" ":"";if(u){if(this._dictationBaseText=this._dictationBaseText+m+d.transcript,this._currentInterimText="",this._text=this._dictationBaseText,this._dictation){let{transcript:p,...f}=this._dictation;this._dictation=f}this._notifySubscribers()}else this._currentInterimText=m+d.transcript,this._text=this._dictationBaseText+this._currentInterimText,this._dictation&&(this._dictation={...this._dictation,transcript:d.transcript}),this._notifySubscribers()}))||!l(s.onSpeechStart(()=>{this._isActiveSession(i,s)&&(this._dictation={status:{type:"running"},inputDisabled:o,...this._dictation?.transcript&&{transcript:this._dictation.transcript}},this._notifySubscribers())}))||!l(s.onSpeechEnd(()=>{this._cleanupDictation({sessionId:i})})))return;let c=setInterval(()=>{this._isActiveSession(i,s)&&s.status.type==="ended"&&this._cleanupDictation({sessionId:i})},100);if(!l(()=>clearInterval(c)))return;this._dictationUnsubscribes.push(...n.splice(0))}catch(c){if(a(),this._isActiveSession(i,s))try{s.cancel()}catch(d){console.error("[assistant-ui] Dictation session cancel threw",d)}finally{this._cleanupDictation({sessionId:i})}throw c}}stopDictation(){if(!this._dictationSession)return;let e=this._dictationSession,r=this._activeDictationSessionId,o=()=>this._cleanupDictation({sessionId:r});this._stopDictationSession(e,o)}_stopDictationSession(e,r=()=>{}){let o;try{o=e.stop()}catch(s){console.error("[assistant-ui] Dictation session stop threw",s),r();return}o.then(r,s=>{console.error("[assistant-ui] Dictation session stop rejected",s),r()})}_cleanupDictation(e){if(e?.sessionId!==void 0&&e.sessionId!==this._activeDictationSessionId||this._isCleaningDictation)return;this._isCleaningDictation=!0;let r=o=>{try{o()}catch(s){console.error("[assistant-ui] Dictation cleanup threw",s)}};try{let o=this._dictationUnsubscribes;this._dictationUnsubscribes=[],this._dictationSession=void 0,this._activeDictationSessionId=void 0,this._dictation=void 0,this._dictationBaseText="",this._currentInterimText="";for(let s of o)r(s);e?.notify!==!1&&r(()=>this._notifySubscribers())}finally{this._isCleaningDictation=!1}}_notifyEventSubscribers(e,r){let o=this._eventSubscribers.get(e);o&&pe(o,r,`Composer runtime "${e}"`)}unstable_on(e,r){let o=r,s=this._eventSubscribers.get(e);return s||(s=new Set,this._eventSubscribers.set(e,s)),s.add(o),()=>{this._eventSubscribers.get(e)?.delete(o)}}};var su=t=>t.capabilities?.cancel?vo(t):!1,iu=class extends si{constructor(e){super();h(this,"_queueCache");h(this,"runtime");this.runtime=e,this.connect()}get canCancel(){return this.isSubmitting||su(this.runtime)}get canSend(){if(this.isEmpty||this.runtime.isSendDisabled||this.isSubmitting)return!1;let e=this.runtime.voice;return e?e.canSendText&&this.role==="user"&&this.attachments.length===0:!0}cancel(){if(!this.isSubmitting){super.cancel();return}this.cancelSubmission(),su(this.runtime)&&super.cancel()}threadMessageIds(e){return this.runtime.messages.filter(r=>r.role===e).map(r=>r.id)}get queue(){let e=this.runtime.getSteerQueueItems?.()??qt,r=this.runtime.getQueueItems?.()??qt,o=this._queueCache;if(o&&o.steer===e&&o.queue===r)return o.flat;let s=e.length===0?r:r.length===0?e:[...e,...r];return this._queueCache={steer:e,queue:r,flat:s},s}moveQueueItem(e,r){this.runtime.moveQueueItem?.(e,r)}removeQueueItem(e){this.runtime.removeQueueItem?.(e)}getAttachmentAdapter(){return this.runtime.adapters?.attachments}getDictationAdapter(){return this.runtime.adapters?.dictation}connect(){let e=!1,r=this.runtime.isSendDisabled,o=this.runtime.voice?.canSendText,s=this.queue;return this.runtime.subscribe(()=>{this.settleInTransit();let i=!1,n=this.canCancel;e!==n&&(e=n,i=!0),r!==this.runtime.isSendDisabled&&(r=this.runtime.isSendDisabled,i=!0);let a=this.runtime.voice?.canSendText;o!==a&&(o=a,i=!0),s!==this.queue&&(s=this.queue,i=!0),i&&this._notifySubscribers()})}async handleSend(e,r){return this.runtime.append({...e,parentId:this.runtime.messages.at(-1)?.id??null,sourceId:null,startRun:r?.startRun,steer:r?.steer})}async handleCancel(){this.runtime.cancelRun()}};var nu=class extends si{constructor(e,r,{parentId:o,message:s}){super();h(this,"_nonTextPassthrough");h(this,"_parentId");h(this,"_sourceId");h(this,"runtime");h(this,"endEditCallback");h(this,"_ended",!1);this.runtime=e;let i=e.voice!==void 0,n=e.subscribe(()=>{let l=e.voice!==void 0;l!==i&&(i=l,this._notifySubscribers())});this.endEditCallback=()=>{n(),r()},this._parentId=o,this._sourceId=s.id,this.setText(pt(s)),this.setRole(s.role);let a;s.role==="user"?(a=[...s.attachments??[],...Zd(s.content)],this._nonTextPassthrough=[]):(a=s.attachments??[],this._nonTextPassthrough=s.content.filter(l=>l.type!=="text")),this.setAttachments(a),this.setRunConfig({...e.composer.runConfig})}get canCancel(){return!0}get detachesDraftOnSend(){return!1}get canSend(){return!this.isEmpty&&!this.runtime.voice&&!this.isSubmitting}getAttachmentAdapter(){return this.runtime.adapters?.attachments}getDictationAdapter(){return this.runtime.adapters?.dictation}get parentId(){return this._parentId}get sourceId(){return this._sourceId}async handleSend(e,r){let o=this._nonTextPassthrough.length>0?[...e.content,...this._nonTextPassthrough]:e.content,s=this.runtime.append({...e,content:o,parentId:this._parentId,sourceId:this._sourceId,startRun:r?.startRun});return this.handleCancel(),s}handleCancel(){this._ended||(this._ended=!0,this.reset().catch(e=>{console.error("[assistant-ui] Failed to clear cancelled edit",e)}),this.endEditCallback(),this._notifySubscribers())}};var au=class extends Cr{constructor(e){super();h(this,"_isInitialized",!1);h(this,"repository",new oi);h(this,"_voiceMessages",[]);h(this,"_voiceGeneration",0);h(this,"_cachedMergedMessages",null);h(this,"_cachedVoiceGeneration",-1);h(this,"_cachedMergedBase",null);h(this,"composer",new iu(this));h(this,"_contextProvider");h(this,"_editComposers",new Map);h(this,"_stopSpeaking");h(this,"speech");h(this,"_voiceSession");h(this,"_voiceUnsubs",[]);h(this,"voice");h(this,"_voiceVolume",0);h(this,"_voiceVolumeSubscribers",new Set);h(this,"getVoiceVolume",()=>this._voiceVolume);h(this,"subscribeVoiceVolume",e=>(this._voiceVolumeSubscribers.add(e),()=>this._voiceVolumeSubscribers.delete(e)));h(this,"_currentAssistantMsg",null);h(this,"_eventSubscribers",new Map);this._contextProvider=e,Gd(this).addEventListener("abort",()=>{this.composer.__internal_dispose();for(let r of this._editComposers.values())r.__internal_dispose()})}_markVoiceMessagesDirty(){this._voiceGeneration++,this._cachedMergedMessages=null}_getBaseMessages(){return this.repository.getMessages()}_commitVoiceMessage(e){}_onMessageMetadataChanged(e,r){}_dropVoiceMessage(e,r){let o=this._voiceMessages.findIndex(s=>s.id===e);o!==-1&&(this._voiceMessages.splice(o,1),this._markVoiceMessagesDirty(),r&&this._notifySubscribers())}get messages(){if(this._voiceMessages.length===0)return this._getBaseMessages();let e=this._getBaseMessages();if(this._cachedVoiceGeneration!==this._voiceGeneration||this._cachedMergedBase!==e){let r=new Set(e.map(o=>o.id));this._cachedMergedMessages=[...e,...this._voiceMessages.filter(o=>!r.has(o.id))],this._cachedVoiceGeneration=this._voiceGeneration,this._cachedMergedBase=e}return this._cachedMergedMessages}get state(){let e;for(let r of this.messages)r.role==="assistant"&&(e=r);return e?.metadata.unstable_state??null}getModelContext(){return this._contextProvider.getModelContext()}enrichAppendMetadata(e,r=e.parentId){if(e.role!=="user")return e;let o=this.messages,s=r===null?-1:o.findIndex(n=>n.id===r),i=ad(this.getModelContext().unstable_composerMetadata,o.slice(0,s+1));return i?{...e,metadata:{...e.metadata,custom:{...e.metadata?.custom,...i}}}:e}getEditComposer(e){return this._editComposers.get(e)}_isVoiceMessage(e){return e!==null&&this._voiceMessages.some(r=>r.id===e)}_resolveAppendParent(e){return this._isVoiceMessage(e)?this._getBaseMessages().at(-1)?.id??null:e}beginEdit(e){if(this.voice)throw new Error("Cannot edit a message while a voice session is connected");if(this._isVoiceMessage(e))throw new Error("Voice transcript messages cannot be edited");if(this._editComposers.has(e))throw new Error("Edit already in progress");this._editComposers.set(e,new nu(this,()=>this._editComposers.delete(e),this.repository.getMessage(e))),this._notifySubscribers()}getMessageById(e){try{return this.repository.getMessage(e)}catch{let r=this.repository.getMessages(),o=this._voiceMessages.findIndex(s=>s.id===e);return o!==-1?{parentId:o>0?this._voiceMessages[o-1].id:r.at(-1)?.id??null,message:this._voiceMessages[o],index:r.length+o}:void 0}}getBranches(e){return this._voiceMessages.some(r=>r.id===e)?[]:this.repository.getBranches(e)}switchToBranch(e){this.repository.switchToBranch(e),this._notifySubscribers()}_notifyEventSubscribers(e,r){let o=this._eventSubscribers.get(e);o&&pe(o,r,`Thread runtime "${e}"`)}_notifyToolApprovalAnswered(e,r,o,s){this._notifyEventSubscribers("toolApprovalAnswered",{messageId:e,toolCallId:r,toolName:o,approved:s})}submitFeedback({messageId:e,type:r,comment:o}){let s=this.adapters?.feedback,i=this.getMessageById(e);if(!i)throw new Error(`Message not found: ${e}`);let{message:n,parentId:a}=i,l=o?.trim(),c={type:r,...l?{comment:l}:void 0};if(s?.submit({message:n,...c}),n.role==="assistant"){let d={...n,metadata:{...n.metadata,submittedFeedback:c}},u=this._voiceMessages.findIndex(m=>m.id===e);u===-1?(this.repository.addOrUpdateMessage(a,d),this._onMessageMetadataChanged(n,d)):(this._voiceMessages[u]=d,this._currentAssistantMsg===n&&(this._currentAssistantMsg=d),this._markVoiceMessagesDirty())}this._notifySubscribers()}speak(e){let r=this.adapters?.speech;if(!r)throw new Error("Speech adapter not configured");let o=this.getMessageById(e);if(!o)throw new Error(`Message not found: ${e}`);let{message:s}=o,i=this._stopSpeaking,n;try{i?.(),n=r.speak(pt(s))}catch(u){if(i&&!this._stopSpeaking)try{this._notifySubscribers()}catch(m){console.error("[assistant-ui] Speech rollback notification threw",m)}throw u}let a,l=()=>{this._stopSpeaking=void 0,this.speech=void 0;let u=a;a=void 0,u?.()},c=()=>{if(this._stopSpeaking===c)try{l()}finally{n.cancel()}},d=()=>{this._stopSpeaking===c&&(n.status.type==="ended"?ut([l,()=>this._notifySubscribers()]):(this.speech={messageId:e,status:n.status},this._notifySubscribers()))};this._stopSpeaking=c;try{if(a=n.subscribe(d),this._stopSpeaking!==c){a();return}d()}catch(u){if(this._stopSpeaking===c)try{ut([c,()=>this._notifySubscribers()])}catch(m){console.error("[assistant-ui] Speech rollback cleanup threw",m)}throw u}}stopSpeaking(){if(!this._stopSpeaking)throw new Error("No message is being spoken");ut([this._stopSpeaking,()=>this._notifySubscribers()])}_onVoiceConnected(){}_onVoiceDisconnected(){}_toVoiceSessionState(e,r,o){return{status:r,isMuted:e.isMuted,mode:o,canSendText:r.type==="running"&&e.sendText!==void 0}}_isRunActive(){if(this.isRunning)return!0;let e=this._getBaseMessages().at(-1);return e?.role==="assistant"&&(e.status.type==="running"||e.status.type==="requires-action")}_getVoiceCommitBarrier(){if(!this.isLoading)return;let e=pr(this);return(async()=>{for(;this.isLoading&&!e.aborted;)await new Promise(r=>{let o=()=>{s(),e.removeEventListener("abort",o),r()},s=this.subscribe(o);e.addEventListener("abort",o)})})()}connectVoice(){let e=this.adapters?.voice;if(!e)throw new Error("Voice adapter not configured");if(this._isRunActive())throw new Error("Cannot start a voice session while a run is in progress or paused on a pending tool action");let r=this._voiceSession!==void 0;try{this._disconnectVoice(!1)}catch(n){console.error("[assistant-ui] Voice cleanup threw before reconnect",n)}let o;try{o=e.connect({})}catch(n){throw r&&this._voiceSession===void 0&&this._onVoiceDisconnected(),n}this._voiceSession=o;let s=[];this._voiceUnsubs=s;let i=()=>{if(this._voiceSession===o&&this._voiceUnsubs===s)return!1;try{ut(s.splice(0))}catch(n){console.error("[assistant-ui] Detached voice setup cleanup threw",n)}return!0};try{let n="listening";if(this.voice=this._toVoiceSessionState(o,o.status,n),this._voiceVolume=0,this._notifySubscribers(),i()||(s.push(o.onStatusChange(a=>{this._voiceSession===o&&(a.type==="ended"?(this._finishVoiceAssistantMessage(),this._voiceSession=void 0,this.voice=void 0,this._onVoiceDisconnected()):this.voice=this._toVoiceSessionState(o,a,n),this._notifySubscribers())})),i())||(s.push(o.onModeChange(a=>{this._voiceSession===o&&(n=a,this.voice&&(this.voice={...this.voice,mode:a},this._notifySubscribers()))})),i())||(s.push(o.onVolumeChange(a=>{this._voiceSession===o&&(this._voiceVolume=a,pe(this._voiceVolumeSubscribers,void 0,"Voice volume"))})),i()))return;s.push(o.onTranscript(a=>{this._voiceSession===o&&this._handleVoiceTranscript(a)})),i()||this._onVoiceConnected()}catch(n){if(this._voiceSession===o&&this._voiceUnsubs===s){try{this._disconnectVoice(!1)}catch(a){console.error("[assistant-ui] Voice rollback cleanup threw",a)}r&&this._voiceSession===void 0&&this._onVoiceDisconnected()}else i();throw n}}_observeVoiceCommit(e){Promise.resolve(e).catch(r=>{console.error("[assistant-ui] Voice message commit failed",r)})}_handleVoiceTranscript(e){if(this.ensureInitialized(),e.role==="user")this._finishVoiceAssistantMessage(),this._currentAssistantMsg=null,e.isFinal&&this._observeVoiceCommit(this._commitVoiceUserMessage({id:Ie(),role:"user",content:[{type:"text",text:e.text}],metadata:{modality:"voice",custom:{}},createdAt:new Date,attachments:[]}));else{let r=e.isFinal?{type:"complete",reason:"stop"}:{type:"running"};if(!this._currentAssistantMsg)this._currentAssistantMsg={id:Ie(),role:"assistant",content:[{type:"text",text:e.text}],metadata:{unstable_state:this.state,unstable_annotations:[],unstable_data:[],steps:[],modality:"voice",custom:{}},status:r,createdAt:new Date},this._voiceMessages.push(this._currentAssistantMsg);else{let o=this._voiceMessages.indexOf(this._currentAssistantMsg);if(o===-1)return;let s={...this._currentAssistantMsg,content:[{type:"text",text:e.text}],status:r};this._voiceMessages[o]=s,this._currentAssistantMsg=s}e.isFinal&&(this._observeVoiceCommit(this._commitVoiceMessage(this._currentAssistantMsg)),this._currentAssistantMsg=null),this._markVoiceMessagesDirty(),this._notifySubscribers()}}_commitVoiceUserMessage(e){this._voiceMessages.push(e);let r=this._commitVoiceMessage(e);return this._markVoiceMessagesDirty(),this._notifySubscribers(),r}async _appendToVoiceSession(e){let r=this._voiceSession;if(!this.voice?.canSendText||!r?.sendText)throw new Error("Cannot send a text message while a voice session is connected");let o=e.content.filter(n=>n.type==="text");if(e.role!=="user"||e.sourceId!=null||e.parentId!==this._resolveAppendParent(this.messages.at(-1)?.id??null)||e.attachments?.length||o.length!==e.content.length||!o.some(n=>n.text.trim()))throw new Error("Only a plain text user message can be sent while a voice session is connected");let s=this.enrichAppendMetadata(e);this.ensureInitialized();let i=pr(this);try{await r.sendText(pt(e))}catch(n){if(i.aborted)return;let a=new Wn;throw a.cause=n,a}if(!i.aborted){if(this._voiceSession!==r)throw new Wn("The voice session ended before the typed message was recorded");this._finishVoiceAssistantMessage(!1),this._currentAssistantMsg=null,await this._commitVoiceUserMessage({id:Ie(),role:"user",content:o,metadata:{custom:{...s.metadata?.custom}},createdAt:e.createdAt,attachments:[]})}}_finishVoiceAssistantMessage(e=!0){let r=this._voiceMessages.at(-1);if(r?.role==="assistant"&&r.status.type==="running"){let o=this._voiceMessages.length-1;this._voiceMessages[o]={...r,status:{type:"complete",reason:"stop"}},this._observeVoiceCommit(this._commitVoiceMessage(this._voiceMessages[o])),this._currentAssistantMsg=null,this._markVoiceMessagesDirty(),e&&this._notifySubscribers()}}disconnectVoice(){this._disconnectVoice(!0)}_disconnectVoice(e){this._finishVoiceAssistantMessage(!1),this._currentAssistantMsg=null;let r=this._voiceUnsubs.splice(0);this._voiceUnsubs=[];let o=this._voiceSession;this._voiceSession=void 0,this.voice=void 0,this._voiceVolume=0;let s=this.speech&&this._isVoiceMessage(this.speech.messageId)?this._stopSpeaking:void 0;this._voiceMessages=[],this._markVoiceMessagesDirty();try{ut([...r,...s?[s]:[],...o?[()=>o.disconnect()]:[],()=>pe(this._voiceVolumeSubscribers,void 0,"Voice volume"),()=>this._notifySubscribers()])}finally{e&&o&&this._voiceSession===void 0&&this._onVoiceDisconnected()}}muteVoice(){if(!this._voiceSession)throw new Error("No active voice session");this._voiceSession.mute(),this.voice={...this.voice,isMuted:!0},this._notifySubscribers()}unmuteVoice(){if(!this._voiceSession)throw new Error("No active voice session");this._voiceSession.unmute(),this.voice={...this.voice,isMuted:!1},this._notifySubscribers()}ensureInitialized(){this._isInitialized||(this._isInitialized=!0,this._notifyEventSubscribers("initialize",{}))}export(){return this.repository.export()}import(e){this.ensureInitialized(),this.repository.clear(),this.repository.import(e),this._notifySubscribers()}reset(e){this.import(ri.fromArray(e??[]))}unstable_on(e,r){let o=r;if(e==="modelContextUpdate")return this._contextProvider.subscribe?.(()=>pe([o],{},`Thread runtime "${e}"`))??(()=>{});let s=this._eventSubscribers.get(e);return s||(s=new Set,this._eventSubscribers.set(e,s)),s.add(o),e==="initialize"&&this._isInitialized&&queueMicrotask(()=>{s.has(o)&&pe([o],{},`Thread runtime "${e}"`)}),()=>{this._eventSubscribers.get(e)?.delete(o)}}};var vv=Symbol.for("assistant-stream.tool-execution-id"),yo=t=>{try{return JSON.parse(t),!0}catch{return!1}},lu=t=>{try{return JSON.parse(t)}catch{return}},Yn=(t,e)=>{let r=lu(t),o=lu(e);return r===void 0||o===void 0?!1:go(r,o)},ii=t=>t.result!==void 0&&t.isPreliminary!==!0,Xn=t=>t[vv],cu=class{constructor(t,e,r){h(this,"_getTools");h(this,"_callbacks");h(this,"_isClientToolCall");h(this,"_entries",new Map);h(this,"_humanInput",new Map);h(this,"_executing",new Set);h(this,"_discardedToolCallIds",new Set);h(this,"_settledResolvers",[]);h(this,"_statuses",new Map);h(this,"_ac",new AbortController);h(this,"_pendingRestore",!0);h(this,"_lastSnapshot",null);h(this,"_isRunning",!1);h(this,"_controller");h(this,"_pipelineDead",!1);h(this,"_pipelineRestartUsed",!1);this._getTools=t,this._callbacks=e,this._isClientToolCall=r,this._initPipeline()}_initPipeline(){let[t,e]=Cn();this._controller=e;let o=On(()=>this._getWrappedTools(),()=>this._ac.signal,(s,i,n)=>this._onHumanInput(s,i,n),{onExecutionStart:(s,i,n)=>this._onExecutionStart(s,n),onExecutionEnd:(s,i,n)=>this._onExecutionEnd(s,n)});t.pipeThrough(o).pipeThrough(new po).pipeTo(new WritableStream({write:s=>{try{if(s.type!=="result")return;this._handleResultChunk(s)}catch(i){console.error("[ToolInvocationTracker] result chunk handling failed",i)}}})).catch(s=>{console.error("[ToolInvocationTracker] stream pipeline failed; will attempt single restart on next setState",s),this._pipelineDead=!0})}setState(t){try{if(this._pipelineDead){if(this._pipelineRestartUsed)return;this._pipelineRestartUsed=!0,this._pipelineDead=!1,this._demoteEntriesToRestored(),this._executing.clear(),this._ac=new AbortController,this._initPipeline()}if(this._lastSnapshot&&this._lastSnapshot.messages===t.messages&&this._lastSnapshot.isRunning===t.isRunning&&this._lastSnapshot.isLoading===t.isLoading)return;t.isLoading===!0&&(this._pendingRestore=!0);let e=this._isRunning;this._isRunning=t.isRunning;try{this._processMessages(t.messages)}catch(r){throw this._isRunning=e,r}this._lastSnapshot=t,this._pendingRestore=!1}catch(e){console.error("[ToolInvocationTracker] setState failed; snapshot dropped",e)}}reset(){try{this._pendingRestore=!0,this._entries.clear(),this._discardedToolCallIds.clear(),this._lastSnapshot=null,this.abort(),this._statuses.size>0&&(this._statuses=new Map,this._invokeOnStatusesChange())}catch(t){console.error("[ToolInvocationTracker] reset failed",t)}}abort(t){try{if(this._humanInput.forEach(({executionId:r,reject:o},s)=>{try{o(new Error("Tool execution aborted"))}catch{}this._endHumanRequest(s,r)}),this._humanInput.clear(),t?.discardPending)for(let[r,o]of this._entries)o.controller&&(o.argsComplete||o.hasResult||(this._discardedToolCallIds.add(r),o.skipExecute=!0));if(this._ac.abort(),this._ac=new AbortController,this._executing.size===0)return Promise.resolve();let e=new Set(this._executing);return new Promise(r=>{this._settledResolvers.push({executionIds:e,resolve:r})})}catch(e){return console.error("[ToolInvocationTracker] abort failed",e),Promise.resolve()}}_endHumanRequest(t,e){if(this._executing.has(e)){this._setStatus(t,{type:"executing"});return}let r=this._entries.get(t)?.executionId;(r===void 0||r===e)&&this._deleteStatus(t)}resume(t,e){try{let r=this._humanInput.get(t);return r?(this._humanInput.delete(t),this._endHumanRequest(t,r.executionId),r.resolve(e),!0):!1}catch(r){return console.error("[ToolInvocationTracker] resume failed",r),!1}}getStatuses(){return this._statuses}_getWrappedTools(){let t=this._getTools();if(t)return Object.fromEntries(Object.entries(t).map(([e,r])=>{let o=r.execute,s=r.streamCall;return o===void 0&&s===void 0?[e,r]:[e,{...r,...o!==void 0&&{execute:(...[i,n])=>{let a=Xn(n),l=this._captureExecution(n.toolCallId,a);return!l||l.skipExecute?new Promise(()=>{}):o(i,n)}},...s!==void 0&&{streamCall:(...[i,n])=>{let a=Xn(n);if(this._captureExecution(n.toolCallId,a))return s(i,n)}}}]}))}_captureExecution(t,e){if(e===void 0)return;let r=this._entries.get(t);if(r?.controller)return r.executionId===void 0&&(r.executionId=e),r.executionId===e?r:void 0}_onHumanInput(t,e,r){return new Promise((o,s)=>{let i=this._entries.get(t);if(!i?.controller||i.executionId!==r){s(new Error("Tool execution aborted"));return}let n=this._humanInput.get(t);if(n)try{n.reject(new Error("Human input request was superseded by a new request"))}catch{}this._humanInput.set(t,{executionId:r,resolve:o,reject:s}),this._setStatus(t,{type:"interrupt",payload:{type:"human",payload:e}})})}_onExecutionStart(t,e){this._captureExecution(t,e)&&(this._entries.get(t).skipExecute||(this._executing.add(e),this._humanInput.get(t)?.executionId!==e&&this._setStatus(t,{type:"executing"})))}_onExecutionEnd(t,e){if(e===void 0||!this._executing.delete(e))return;this._entries.get(t)?.executionId===e&&this._deleteStatus(t);let r=[];this._settledResolvers.forEach(({executionIds:o,resolve:s})=>{if([...o].some(i=>this._executing.has(i))){r.push({executionIds:o,resolve:s});return}try{s()}catch{}}),this._settledResolvers.length=0,this._settledResolvers.push(...r)}_handleResultChunk(t){let e=t.meta.toolCallId,r=Xn(t),o=this._entries.get(e);!o||o.executionId!==r||o?.hasResult||o.skipExecute||this._invokeOnResult({type:"add-tool-result",toolCallId:e,toolName:t.meta.toolName,result:t.result,isError:t.isError,...t.artifact!==void 0&&{artifact:t.artifact},...t.modelContent!==void 0&&{modelContent:t.modelContent}})}_invokeOnResult(t){try{this._callbacks.onResult(t)}catch(e){console.error("[ToolInvocationTracker] onResult callback threw; result dropped",e)}}_invokeOnStatusesChange(){try{this._callbacks.onStatusesChange(this._statuses)}catch(t){console.error("[ToolInvocationTracker] onStatusesChange callback threw; status change not propagated",t)}}_setStatus(t,e){let r=new Map(this._statuses);r.set(t,e),this._statuses=r,this._invokeOnStatusesChange()}_deleteStatus(t){if(!this._statuses.has(t))return;let e=new Map(this._statuses);e.delete(t),this._statuses=e,this._invokeOnStatusesChange()}_warnProviderOwnedSkip(t,e){}_shouldCloseArgsStream({argsText:t,hasResult:e,clientOwned:r}){return e?!0:yo(t)?r||!this._isRunning:!1}_startActiveEntry(t,e,r,o){let s={toolName:e,controller:this._controller.addToolCallPart({toolName:e,toolCallId:t}),argsText:"",hasResult:!1,skipExecute:r,argsComplete:!1,clientOwned:o};return this._entries.set(t,s),s}_demoteEntriesToRestored(){for(let[t,e]of this._entries)if(e.controller){if(!e.argsComplete&&!e.hasResult){this._entries.delete(t);continue}this._entries.set(t,{toolName:e.toolName,argsText:e.argsText,hasResult:e.hasResult})}}_processArgsText(t,e){if(!t.controller)return;let r=e.result!==void 0;if(e.argsText!==t.argsText){let o=!0;if(t.argsComplete)Yn(t.argsText,e.argsText),t.argsText=e.argsText,o=!1;else if(!e.argsText.startsWith(t.argsText))if(yo(t.argsText)&&yo(e.argsText)&&Yn(t.argsText,e.argsText)){let s=this._shouldCloseArgsStream({argsText:e.argsText,hasResult:r,clientOwned:t.clientOwned});s&&t.controller.argsText.close(),t.argsText=e.argsText,t.argsComplete=s,o=!1}else o=!1;if(o&&t.controller){let s=e.argsText.slice(t.argsText.length);t.controller.argsText.append(s);let i=this._shouldCloseArgsStream({argsText:e.argsText,hasResult:r,clientOwned:t.clientOwned});i&&t.controller.argsText.close(),t.argsText=e.argsText,t.argsComplete=i}}!t.argsComplete&&t.controller&&this._shouldCloseArgsStream({argsText:t.argsText,hasResult:r,clientOwned:t.clientOwned})&&(t.controller.argsText.close(),t.argsComplete=!0)}_processMessages(t){let e=this._pendingRestore;for(let{part:r}of wo(t)){let o=this._entries.get(r.toolCallId);if(e){o?.controller||this._entries.set(r.toolCallId,{toolName:r.toolName,argsText:r.argsText,hasResult:ii(r)});continue}let s=o;if(ii(r)&&this._discardedToolCallIds.delete(r.toolCallId),s&&!s.controller){if(s.hasResult||!(r.argsText!==s.argsText&&!(yo(s.argsText)&&yo(r.argsText)&&Yn(s.argsText,r.argsText)))&&!ii(r))continue;this._entries.delete(r.toolCallId),s=void 0}if(!s){let i=this._isClientToolCall?.(r),n=r.result===void 0&&i===!1;n&&this._warnProviderOwnedSkip(r.toolName,r.toolCallId),s=this._startActiveEntry(r.toolCallId,r.toolName,r.result!==void 0||n||this._discardedToolCallIds.has(r.toolCallId),i===!0)}if(r.result!==void 0&&(s.skipExecute=!0),r.approval!==void 0&&(s.skipExecute=!0),this._processArgsText(s,r),r.result!==void 0&&!s.hasResult){let{controller:i}=s;if(!i)continue;s.argsComplete=!0,i.setResponse(new Ve({result:r.result,artifact:r.artifact,isError:r.isError,isPreliminary:r.isPreliminary,...r.modelContent!==void 0?{modelContent:r.modelContent}:{}})),ii(r)&&(s.hasResult=!0,i.close())}}}};var bv=Object.freeze([]),Zn=(t,e)=>{Promise.resolve(e).catch(r=>{console.error(`[ExternalStoreThreadRuntimeCore] ${t} callback rejected`,r)})},wv=(t,e)=>t&&e[e.length-1]?.role!=="assistant",du=class extends au{constructor(e,r){super(e);h(this,"_capabilities",{switchToBranch:!1,switchBranchDuringRun:!1,edit:!1,delete:!1,reload:!1,refetchThread:!1,cancel:!1,unstable_copy:!1,speech:!1,dictation:!1,voice:!1,attachments:!1,feedback:!1,queue:!1,answerToolCall:!1});h(this,"_messages");h(this,"isDisabled");h(this,"isSendDisabled");h(this,"suggestions",[]);h(this,"extras");h(this,"_converter",new Un);h(this,"_pendingDeleteEvictions",new Map);h(this,"_optimistic",null);h(this,"_store");h(this,"_getInitializePromise");h(this,"_transformedQueue");h(this,"_toolInvocations",null);h(this,"_toolStatuses",new Map);h(this,"_effectiveIsRunning",!1);h(this,"_inTrackerUpdate",!1);h(this,"_pendingRunningRefresh",!1);h(this,"_toolCallToMessageId",new Map);h(this,"_messagesForToolCallIndex",null);h(this,"updateMessages",e=>{this._store.convertMessage!==void 0?this._store.setMessages?.(e.flatMap(ld)):this._store.setMessages?.(e)});this.__internal_setAdapter(r)}get capabilities(){return this._capabilities}get isLoading(){return this._store.isLoading??!1}get isRunning(){return this._hasExecutingTools(this._store)?!0:this._store.isRunning}_getBaseMessages(){return this._messages}get state(){return this._store.state??super.state}get adapters(){return this._store.adapters}get unstable_refetchThread(){if(this._store.onRefetchThread)return()=>this._store.onRefetchThread()}__internal_setGetInitializePromise(e){this._getInitializePromise=e}_runTrackerUpdate(e){this._inTrackerUpdate=!0;try{e()}finally{this._inTrackerUpdate=!1}this._pendingRunningRefresh&&(this._pendingRunningRefresh=!1,this._refreshEffectiveIsRunning())}_refreshEffectiveIsRunning(){let e=this._getEffectiveIsRunning(this._store);this._effectiveIsRunning!==e&&(this._effectiveIsRunning=e,this._notifyEventSubscribers(e?"runStart":"runEnd",{}),this._notifySubscribers())}_hasExecutingTools(e){if(e.unstable_enableToolInvocations!==!0||this._toolInvocations===null)return!1;for(let r of this._toolStatuses.values())if(r.type==="executing")return!0;return!1}_getEffectiveIsRunning(e){return(e.isRunning??!1)||this._hasExecutingTools(e)}beginEdit(e){if(!this._store.onEdit)throw new Error("Runtime does not support editing.");super.beginEdit(e)}__internal_setAdapter(e){this._store!==e&&this._updateStoreSnapshot(e)}_updateStoreSnapshot(e){let r=this._effectiveIsRunning;this.isDisabled=e.isDisabled??!1,this.isSendDisabled=e.isSendDisabled??!1;let o=this._store;this._store=e;let s=this._getEffectiveIsRunning(e),i=e.unstable_messageRepositoryInstance,n=i!==void 0&&i!==this.repository;if(n){this.repository=i,this._pendingDeleteEvictions.clear();let m=this.repository.getMessages(),p=m.at(-1);this._optimistic=p?.metadata.isOptimistic?{id:p.id,parentId:m.at(-2)?.id??null}:null}o?.queue!==e.queue&&(this._transformedQueue=void 0,e.queue?.__internal_setDispatchTransform?.(m=>{let p=this.messages.at(-1)?.id??null;return this.enrichAppendMetadata({...m,parentId:p},p)}),e.queue?.__internal_setDispatchTransform&&(this._transformedQueue=e.queue)),this.extras!==e.extras&&(this.extras=e.extras);let a=e.suggestions??bv;Se(this.suggestions,a)||(this.suggestions=a);let l={switchToBranch:this._store.setMessages!==void 0,switchBranchDuringRun:!1,edit:this._store.onEdit!==void 0,delete:this._store.onDelete!==void 0||this._store.setMessages!==void 0,reload:this._store.onReload!==void 0,refetchThread:this._store.onRefetchThread!==void 0,cancel:this._store.onCancel!==void 0,speech:this._store.adapters?.speech!==void 0,dictation:this._store.adapters?.dictation!==void 0,voice:this._store.adapters?.voice!==void 0,unstable_copy:this._store.unstable_capabilities?.copy!==!1,attachments:!!this._store.adapters?.attachments,feedback:!!this._store.adapters?.feedback,queue:this._store.queue!==void 0,answerToolCall:this._store.onAddToolResult!==void 0||this._store.onResumeToolCall!==void 0||this._store.onRespondToToolApproval!==void 0||this._store.unstable_enableToolInvocations===!0};Se(this._capabilities,l)||(this._capabilities=l);let c;if(e.messageRepository){if(o&&!n&&o.isRunning===e.isRunning&&o.messageRepository===e.messageRepository&&r===s){this._notifySubscribers();return}let m=e.messageRepository.messages,p=e.messageRepository.headId??m.at(-1)?.message.id??null;if(o&&!n&&o.messageRepository===e.messageRepository)this.repository.resetHead(p),c=this.repository.getMessages();else{let f=new Set(m.map(({message:g})=>g.id));for(let{message:g,parentId:b}of m)this.repository.addOrUpdateMessage(b,g);for(let{message:g}of this.repository.export().messages)f.has(g.id)||this.repository.deleteMessage(g.id);this._pendingDeleteEvictions.clear(),this.repository.resetHead(p),c=this.repository.getMessages()}}else if(e.messages){if(o){if(o.convertMessage!==e.convertMessage)this._converter=new Un;else if(!n&&o.isRunning===e.isRunning&&o.messages===e.messages&&r===s){this._notifySubscribers();return}}c=e.convertMessage?this._converter.convertMessages(e.messages,(f,g,b)=>{if(!e.convertMessage)return g;let x=b===(e.messages?.length??0)-1,w=`${cd}${b}`;if(f&&(f.role!=="assistant"||!md(f.status)||f.status===Vn(f.content,x,s))){if(f.id.startsWith("__external_store_fallback_")&&f.id!==w){let I={...f,id:w};return jn(I,g),I}return f}let S=e.convertMessage(g,b),T=Ht(S,w,Vn(S.content,x,s));return jn(T,g),T}):e.messages;let m=new Set,p=[];for(let f=c.length-1;f>=0;f--){let g=c[f];if(m.has(g.id)){console.warn(`ExternalStoreThreadRuntimeCore: duplicate message id "${g.id}" in the provided messages array; keeping the last occurrence.`);continue}m.add(g.id),p.push(g)}p.length!==c.length&&(c=p.reverse());for(let f=0;f<c.length;f++){let g=c[f],b=c[f-1];this.repository.addOrUpdateMessage(b?.id??null,g)}if(this._pendingDeleteEvictions.size>0){let f=new Set(c.map(g=>g.id));for(let[g,b]of this._pendingDeleteEvictions){if(f.has(g)){b.size===0&&this._pendingDeleteEvictions.delete(g);continue}this._pendingDeleteEvictions.delete(g);try{this.repository.getMessage(g)}catch{continue}this.repository.deleteMessage(g)}}}else throw new Error("ExternalStoreAdapter must provide either 'messages' or 'messageRepository'");c.length>0&&this.ensureInitialized(),this._effectiveIsRunning=s,r!==s&&(s?this._notifyEventSubscribers("runStart",{}):this._notifyEventSubscribers("runEnd",{}));let d=null;if(wv(s,c)){let m=c.at(-1)?.id??null;this._optimistic?.parentId!==m&&(this._optimistic={id:Ie(),parentId:m}),d=this._optimistic.id,this.repository.addOrUpdateMessage(m,Ht({role:"assistant",content:[],metadata:{isOptimistic:!0}},d,{type:"running"}))}d===null&&(this._optimistic=null),this.repository.resetHead(d??c.at(-1)?.id??null);let u=this.repository.getMessages();if((!this._messages||!zn(this._messages,u))&&(this._messages=u),this._voiceMessages.length>0){let m=new Set(this._messages.map(f=>f.id)),p=this._voiceMessages.filter(f=>!m.has(f.id));p.length!==this._voiceMessages.length&&(this._voiceMessages=p,this._markVoiceMessagesDirty())}n&&this._runTrackerUpdate(()=>this._toolInvocations?.reset()),this._runTrackerUpdate(()=>this._driveToolInvocations()),this._notifySubscribers()}_driveToolInvocations(){if(!this._store.unstable_enableToolInvocations){this._toolInvocations&&(this._toolInvocations.reset(),this._toolInvocations=null,this._toolStatuses=new Map,this._store.setToolStatuses?.({}));return}this._toolInvocations||(this._toolInvocations=new cu(()=>this.getModelContext().tools,{onResult:e=>{try{let r=this._findMessageIdForToolCall(e.toolCallId);if(r===void 0)return;Zn("onAddToolResult",this._store.onAddToolResult?.({messageId:r,toolCallId:e.toolCallId,toolName:e.toolName,result:e.result,isError:e.isError,...e.artifact!==void 0&&{artifact:e.artifact},...e.modelContent!==void 0&&{modelContent:e.modelContent}}))}catch(r){console.error("[ExternalStoreThreadRuntimeCore] onAddToolResult dispatch failed",r)}},onStatusesChange:e=>{let r=this._hasExecutingTools(this._store);this._toolStatuses=e;try{this._store.setToolStatuses?.(Object.fromEntries(e))}finally{r!==this._hasExecutingTools(this._store)&&(this._inTrackerUpdate?this._pendingRunningRefresh=!0:this._updateStoreSnapshot(this._store))}}},e=>this._store.unstable_isClientToolCall?.(e))),this._toolInvocations.setState({messages:this._messages,isRunning:this._getEffectiveIsRunning(this._store),...this._store.isLoading!==void 0&&{isLoading:this._store.isLoading}})}_findMessageIdForToolCall(e){if(this._messagesForToolCallIndex!==this._messages){this._toolCallToMessageId.clear();for(let{part:r,messageId:o}of wo(this._messages))this._toolCallToMessageId.set(r.toolCallId,o);this._messagesForToolCallIndex=this._messages}return this._toolCallToMessageId.get(e)}switchToBranch(e){if(!this._store.setMessages)throw new Error("Runtime does not support switching branches.");if(this._getEffectiveIsRunning(this._store))return;let r=this._store.unstable_onBranchChange,o=r?this.repository.canonicalHeadId:null;this.repository.switchToBranch(e),this._pendingDeleteEvictions.clear(),this.updateMessages(this.repository.getMessages()),r&&this._notifyBranchChange(o,r)}_notifyBranchChange(e,r){let o=this.repository.canonicalHeadId;o!==e&&r({headId:o,visibleMessageIds:this.repository.getMessages().map(s=>s.id)})}async append(e){let r={...e,parentId:this._resolveAppendParent(e.parentId)};if(this.voice)return this._appendToVoiceSession(r);if(this._isVoiceMessage(r.sourceId))throw new Error("Voice transcript messages cannot be edited");let o=r.sourceId!=null||r.parentId!==(this._getBaseMessages().at(-1)?.id??null);r=!o&&this._store.queue&&this._store.queue===this._transformedQueue?r:this.enrichAppendMetadata(r);let s=pr(this);this.ensureInitialized();let i=this._getInitializePromise?.();if(!o&&this._store.queue){if(i&&await i,s.aborted)return;r.steer??this._getEffectiveIsRunning(this._store)?this._store.queue.steer(r):this._store.queue.enqueue(r);return}if(i?.catch(()=>{}),(r.startRun??r.role==="user")&&await this._toolInvocations?.abort({discardPending:!0}),!s.aborted)if(o){if(!this._store.onEdit)throw new Error("Runtime does not support editing messages.");this._pendingDeleteEvictions.clear(),await this._store.onEdit(r)}else await this._store.onNew(r)}_commitVoiceMessage(e){let r=pr(this);if(r.aborted){this._dropVoiceMessage(e.id,!1);return}let o=this._getVoiceCommitBarrier();if(!o){this._store.onVoiceTranscript?.(e);return}let s=this.repository;return o.then(()=>{if(r.aborted||this.repository!==s){this._dropVoiceMessage(e.id,!0);return}this._store.onVoiceTranscript?.(e)})}async deleteMessage(e){if(this._store.onDelete){let o=this.repository.getMessages().some(i=>i.id===e),s=Symbol();if(o){let i=this._pendingDeleteEvictions.get(e)??new Set;this._pendingDeleteEvictions.set(e,i.add(s))}try{await this._store.onDelete(e)}finally{this._pendingDeleteEvictions.get(e)?.delete(s)}return}if(!this._store.setMessages)throw new Error("Runtime does not support deleting messages.");this._getEffectiveIsRunning(this._store)&&await this._toolInvocations?.abort();let r=this.repository.getMessages();if(r.findIndex(o=>o.id===e)===-1)throw new Error("Message not found.");this._pendingDeleteEvictions.clear(),this.updateMessages(r.filter(o=>o.id!==e)),this._evictDeletedMessage(e)}_evictDeletedMessage(e){if(!e.startsWith("__external_store_fallback_")){try{this.repository.getMessage(e)}catch{return}this.repository.deleteMessage(e),this._publishRepositoryMessages()}}_publishRepositoryMessages(){let e=this.repository.getMessages();zn(this._messages,e)||(this._messages=e),this._notifySubscribers()}getQueueItems(){return this._store?.queue?.items??qt}getSteerQueueItems(){return this._store?.queue?.steerItems??qt}moveQueueItem(e,r){this._store?.queue?.move(e,r)}removeQueueItem(e){this._store?.queue?.remove(e)}async startRun(e){if(!this._store.onReload)throw new Error("Runtime does not support reloading messages.");if(this.voice)throw new Error("Cannot start a run while a voice session is connected");if(this._isVoiceMessage(e.sourceId))throw new Error("Voice transcript messages cannot be reloaded");let r=this.repository.getMessages(),o=new Set(r.slice(0,r.findIndex(s=>s.id===e.parentId)+1).map(s=>s.id));for(let s of this._pendingDeleteEvictions.keys())o.has(s)||this._pendingDeleteEvictions.delete(s);await this._toolInvocations?.abort({discardPending:!0}),await this._store.onReload(e.parentId,e)}async resumeRun(e){if(!this._store.onResume)throw new Error("Runtime does not support resuming runs.");if(this.voice)throw new Error("Cannot start a run while a voice session is connected");if(this._isVoiceMessage(e.sourceId))throw new Error("Voice transcript messages cannot be reloaded");await this._store.onResume(e)}exportExternalState(){if(!this._store.onExportExternalState)throw new Error("Runtime does not support exporting external states.");return this._store.onExportExternalState()}importExternalState(e){if(!this._store.onLoadExternalState)throw new Error("Runtime does not support importing external states.");this._runTrackerUpdate(()=>this._toolInvocations?.reset()),this._store.onLoadExternalState(e)}unstable_notifySessionReset(){this._runTrackerUpdate(()=>this._toolInvocations?.reset()),this._store.queue?.__internal_notifyCancelled?.()}cancelRun(){if(!this._store.onCancel)throw new Error("Runtime does not support cancelling runs.");let e=pr(this);this._toolInvocations?.abort({discardPending:!0}),this._store.queue?.__internal_notifyCancelled?.(),Zn("onCancel",this._store.onCancel()),this.dropEmptyOptimisticHead();let r=this.repository.getMessages(),o=r[r.length-1],s=this._store.setMessages!==void 0&&o?.role==="user"&&o.id===r.at(-1)?.id&&o.content.every(n=>n.type==="text")?o:void 0,i;if(s){let n={text:pt(s),attachments:s.attachments,quote:s.metadata.custom.quote};this.composer.restoreDraft(n)&&(this.repository.deleteMessage(s.id),i={id:s.id,draft:n})}this._publishRepositoryMessages(),setTimeout(()=>{if(!e.aborted){if(this.dropEmptyOptimisticHead(),i){let n=this.repository.getMessages();n.at(-1)?.id===i.id?this.repository.deleteMessage(i.id):n.some(a=>a.id===i.id)&&this.composer.retractDraft(i.draft)}this._publishRepositoryMessages(),this.updateMessages(this._messages)}},0)}dropEmptyOptimisticHead(){let e=this.repository.getMessages().at(-1);e&&e.metadata.isOptimistic&&e.content.length===0&&this.repository.deleteMessage(e.id)}addToolResult(e){if(!this._store.onAddToolResult)throw new Error("Runtime does not support tool results.");Zn("onAddToolResult",this._store.onAddToolResult(e))}resumeToolCall(e){if(!(this._toolInvocations?.resume(e.toolCallId,e.payload)??!1)){if(this._store.onResumeToolCall){this._store.onResumeToolCall(e);return}throw new Error(`Tool call ${e.toolCallId} is not waiting for resume.`)}}respondToToolApproval(e){if(!this._store.onRespondToToolApproval)throw new Error("Runtime does not support tool approvals.");let r=this.messages.findLast(s=>s.role==="assistant"&&s.content.some(i=>i.type==="tool-call"&&i.approval?.id===e.approvalId)),o=r?.content.find(s=>s.type==="tool-call"&&s.approval?.id===e.approvalId);try{return Promise.resolve(this._store.onRespondToToolApproval(e)).then(()=>{r&&o?.type==="tool-call"&&this._notifyToolApprovalAnswered(r.id,o.toolCallId,o.toolName,e.approved)})}catch(s){return Promise.reject(s)}}async unstable_recordToolInteraction(e){if(!this._store.unstable_onRecordToolInteraction)throw new Error("Runtime does not support recording tool interactions.");await this._store.unstable_onRecordToolInteraction(e)}reset(e){let r=new oi;r.import(ri.fromArray(e??[])),this.updateMessages(r.getMessages())}import(e){super.import(e),this._store.onImport&&this._store.onImport(this.repository.getMessages())}};var uu=t=>t.adapters?.threadList??{},pu=class extends Qd{constructor(e){super();h(this,"threads");h(this,"_adapter");this._adapter=e,this.threads=new Xd(uu(e),()=>new du(this._contextProvider,this._adapter))}setAdapter(e){this._adapter=e,this.threads.__internal_setAdapter(uu(e)),this.threads.getMainThreadRuntimeCore().__internal_setAdapter(e)}};var mu=class{constructor(){h(this,"thread");h(this,"history");h(this,"lastHistory");h(this,"session",0);h(this,"copied",new Map);h(this,"failedIds",new Set);h(this,"interactions",new Map);h(this,"overlaid",new WeakMap);h(this,"pending",!1);h(this,"inFlight",!1);h(this,"timer");h(this,"waiters",[]);h(this,"warned",!1);h(this,"recordInteraction",async t=>{let e=this.thread,r=e?.messages.find(n=>n.id===t.messageId),o=r?.content.find(n=>n.type==="tool-call"&&n.toolCallId===t.toolCallId);if(!e||!r||o?.type!=="tool-call")throw new Error("Tool call is not available.");let s=vo(e);s||this.seed();let i=this.interactions.get(r.id);i||(i=new Map,this.interactions.set(r.id,i)),i.set(t.toolCallId,vc(i.get(t.toolCallId)??Fs(o.unstable_interactions),t.interaction)),s||await this.schedule(!0)})}signature(t){try{return JSON.stringify({role:t.role,content:t.content,status:t.role==="assistant"?t.status:void 0,metadata:t.metadata})??t}catch{return t}}branch(){return(this.thread?.messages??[]).filter(t=>!t.metadata.isOptimistic&&!t.id.startsWith("__external_store_fallback_")&&!mc(t.id)&&!(t.role==="assistant"&&t.status.type==="running")).map(t=>{let e=this.interactions.get(t.id);if(!e)return t;let r=this.overlaid.get(t);if(r&&r.logs.size===e.size&&[...e].every(([s,i])=>r.logs.get(s)===i))return r.message;let o={...t,content:t.content.map(s=>{if(s.type!=="tool-call")return s;let i=e.get(s.toolCallId);return i?{...s,unstable_interactions:i}:s})};return this.overlaid.set(t,{logs:new Map(e),message:o}),o})}seed(){for(let t of this.branch())!this.copied.has(t.id)&&!this.failedIds.has(t.id)&&this.copied.set(t.id,this.signature(t))}attach(t,e){e!==this.lastHistory&&(this.copied.clear(),this.failedIds.clear(),this.interactions.clear(),this.overlaid=new WeakMap,this.lastHistory=e,this.session+=1),this.thread=t,this.history=e,this.seed();let r=t.unstable_on("runStart",()=>this.seed()),o=t.unstable_on("runEnd",()=>this.schedule());return()=>{r(),o(),this.timer!==void 0&&clearTimeout(this.timer),this.timer=void 0,this.pending=!1;let s=new Error("History copy was detached.");for(let i of this.waiters.splice(0))i.reject(s);this.thread=void 0,this.history=void 0}}schedule(t=!1){this.pending=!0;let e=t?new Promise((r,o)=>{this.waiters.push({resolve:r,reject:o})}):Promise.resolve();return!this.inFlight&&this.timer===void 0&&(this.timer=setTimeout(()=>{this.timer=void 0,this.flush()},0)),e}async flush(){if(!this.pending||!this.history)return;let t=this.history,e=this.session;this.pending=!1,this.inFlight=!0;let r=this.waiters.splice(0),o=this.branch(),s=o.map(i=>[i.id,this.signature(i)]).filter(([i,n])=>this.copied.get(i)!==n);try{if(s.length>0&&(await t.unstable_copy?.(o,s.map(([i])=>i)),e===this.session))for(let[i,n]of s)this.copied.set(i,n),this.failedIds.delete(i);for(let i of r)i.resolve()}catch(i){if(e===this.session)for(let[n]of s)this.failedIds.add(n);this.warned||(this.warned=!0,console.warn("[useExternalStoreRuntime] Failed to copy history.",i));for(let n of r)n.reject(i)}finally{this.inFlight=!1,this.pending&&this.schedule()}}};var yv=ae(!1);var hu=()=>Ke(yv);var xo=t=>{let{modelContext:e,feedback:r,history:o}=Xc()??{},[s]=j(()=>new mu),i=!!o?.unstable_copy&&!t.unstable_persistsHistory&&!t.adapters?.threadList,n=K(()=>{let u=r&&!t.adapters?.feedback?{...t,adapters:{...t.adapters,feedback:r}}:t;return!i||t.unstable_onRecordToolInteraction?u:{...u,unstable_onRecordToolInteraction:s.recordInteraction}},[i,r,s,t]),[a]=j(()=>new pu(n)),l=hu(),[c]=j(()=>({generation:0}));lt(()=>{if(l)return;let u=++c.generation;return()=>queueMicrotask(()=>{c.generation===u&&Zs(a.threads.getMainThreadRuntimeCore())})},[l,c,a]),Es(()=>()=>{Wd(a.threads.getMainThreadRuntimeCore())},[a]),N(()=>{a.setAdapter(n)}),Es(()=>{if(!(!i||!o))return s.attach(a.threads.getMainThreadRuntimeCore(),o)},[i,o,s,a]),N(()=>{if(e)return a.registerModelContextProvider(e)},[e,a]);let[d]=j(()=>new Jd(a));return d};var fu=V("react/jsx-runtime"),gu=t=>{let e=v(6),{id:r,children:o}=t,s=q(),i;e[0]!==r?(i=le({message:ce({source:"thread",query:{type:"id",id:r},get:l=>l.thread.message({id:r})}),composer:ce({source:"message",query:{},get:l=>l.thread.message({id:r}).composer()})}),e[0]=r,e[1]=i):i=e[1];let n=i,a;return e[2]!==s||e[3]!==o||e[4]!==n?(a=(0,fu.jsx)(he,{extends:s,config:n,children:o}),e[2]=s,e[3]=o,e[4]=n,e[5]=a):a=e[5],a};var ft=V("react/jsx-runtime"),ea=(t,e)=>t.Message===e.Message&&t.EditComposer===e.EditComposer&&t.UserEditComposer===e.UserEditComposer&&t.AssistantEditComposer===e.AssistantEditComposer&&t.SystemEditComposer===e.SystemEditComposer&&t.UserMessage===e.UserMessage&&t.AssistantMessage===e.AssistantMessage&&t.SystemMessage===e.SystemMessage,vu=()=>null,bu=new WeakMap,xv=(t,e)=>{let r=bu.get(t);return r||(r=new Set(t.map(o=>o.id)),bu.set(t,r)),r.has(e)},_v=(t,e,r)=>{switch(e){case"user":return r?t.UserEditComposer??t.EditComposer??t.UserMessage??t.Message:t.UserMessage??t.Message;case"assistant":return r?t.AssistantEditComposer??t.EditComposer??t.AssistantMessage??t.Message:t.AssistantMessage??t.Message;case"system":return r?t.SystemEditComposer??t.EditComposer??t.SystemMessage??t.Message??vu:t.SystemMessage??t.Message??vu;default:throw new Error(`Unknown message role: ${e}`)}},ta=t=>{let e=v(6),{components:r}=t,o=P(Sv),s=P(Tv),i;e[0]!==r||e[1]!==s||e[2]!==o?(i=_v(r,o,s),e[0]=r,e[1]=s,e[2]=o,e[3]=i):i=e[3];let n=i,a;return e[4]!==n?(a=(0,ft.jsx)(n,{}),e[4]=n,e[5]=a):a=e[5],a},_o=se(t=>{let e=v(5),{index:r,components:o}=t,s;e[0]!==o?(s=(0,ft.jsx)(ta,{components:o}),e[0]=o,e[1]=s):s=e[1];let i;return e[2]!==r||e[3]!==s?(i=(0,ft.jsx)(qn,{index:r,children:s}),e[2]=r,e[3]=s,e[4]=i):i=e[4],i},(t,e)=>t.index===e.index&&ea(t.components,e.components));_o.displayName="ThreadPrimitive.MessageByIndex";var So=se(t=>{let e=v(7),{messageId:r,components:o}=t,s;if(e[0]!==r?(s=a=>xv(a.thread.messages,r),e[0]=r,e[1]=s):s=e[1],!P(s))return null;let i;e[2]!==o?(i=(0,ft.jsx)(ta,{components:o}),e[2]=o,e[3]=i):i=e[3];let n;return e[4]!==r||e[5]!==i?(n=(0,ft.jsx)(gu,{id:r,children:i}),e[4]=r,e[5]=i,e[6]=n):n=e[6],n},(t,e)=>t.messageId===e.messageId&&ea(t.components,e.components));So.displayName="ThreadPrimitive.Unstable_MessageById";var wu=({children:t})=>{let e=P(et(r=>r.thread.messages.map(o=>o.id)));return K(()=>e.length===0?null:e.map((r,o)=>(0,ft.jsx)(qn,{index:o,children:(0,ft.jsx)(At,{getItemState:s=>s.thread.message({index:o}).getState(),children:s=>t({get message(){return s()}})})},r)),[e,t])},ni=t=>{let e=v(4),{components:r,children:o}=t;if(r){let i;return e[0]!==r?(i=(0,ft.jsx)(wu,{children:()=>(0,ft.jsx)(ta,{components:r})}),e[0]=r,e[1]=i):i=e[1],i}let s;return e[2]!==o?(s=(0,ft.jsx)(wu,{children:o}),e[2]=o,e[3]=s):s=e[3],s};ni.displayName="ThreadPrimitive.Messages";var ai=se(ni,(t,e)=>t.children||e.children?t.children===e.children:ea(t.components,e.components));function Sv(t){return t.message.role}function Tv(t){return t.message.composer.isEditing}var li=t=>{let e=t.message.metadata;if(!(!e||typeof e!="object"))return e.custom?.quote};var Lr=V("react/jsx-runtime");var _u=class extends Error{constructor(e,r=`Component "${e}" is not in the generative-ui allowlist.`){super(r);h(this,"componentName");this.name="GenerativeUIRenderError",this.componentName=e}},kv=t=>typeof t=="object"&&t!==null&&!Array.isArray(t),Su=t=>t==null?[]:Array.isArray(t)?t:[t],yu=(t,...e)=>{typeof process<"u"},xu=64,ra=(t,e,r,o,s=0)=>{if(s>xu)return yu(`[generative-ui] Skipping node nested past ${xu} levels at ${o}.`),null;if(t==null)return null;if(typeof t=="string"||typeof t=="number")return t;if(Array.isArray(t))return t.map((d,u)=>ra(d,e,r,`${o}/${u}`,s+1));if(!kv(t)||!("component"in t)||typeof t.component!="string")return yu(`[generative-ui] Skipping malformed node at ${o}:`,t),null;let{component:i,props:n,children:a,key:l}=t,c=Object.hasOwn(e,i)?e[i]:void 0;if(!c){if(r)return(0,Lr.jsx)(r,{component:i,props:n},l??o);throw new _u(i)}return Ji(c,{...n??{},key:l??o},...Su(a).map((d,u)=>ra(d,e,r,`${o}/${u}`,s+1)))},To=t=>{let e=v(11),{spec:r,components:o,Fallback:s}=t,i=r?.root,n;e[0]!==i?(n=Su(i),e[0]=i,e[1]=n):n=e[1];let a=n,l;if(e[2]!==s||e[3]!==o||e[4]!==a){let d;e[6]!==s||e[7]!==o?(d=(u,m)=>ra(u,o,s,`${m}`),e[6]=s,e[7]=o,e[8]=d):d=e[8],l=a.map(d),e[2]=s,e[3]=o,e[4]=a,e[5]=l}else l=e[5];let c;return e[9]!==l?(c=(0,Lr.jsx)(Lr.Fragment,{children:l}),e[9]=l,e[10]=c):c=e[10],c};To.displayName="GenerativeUIRender";var ci=t=>{let e=v(4),{components:r,spec:o,Fallback:s}=t,i=P(Iv),n=o??i;if(!n)return null;let a;return e[0]!==s||e[1]!==r||e[2]!==n?(a=(0,Lr.jsx)(To,{spec:n,components:r,Fallback:s}),e[0]=s,e[1]=r,e[2]=n,e[3]=a):a=e[3],a};ci.displayName="MessagePrimitive.GenerativeUI";function Iv(t){let e=t.part;return e?.type==="generative-ui"?e.spec:void 0}var $=V("react/jsx-runtime"),oa=t=>{let e=-1;return{startGroup:r=>{e===-1&&(e=r)},endGroup:(r,o)=>{e!==-1&&(o.push({type:t,startIndex:e,endIndex:r}),e=-1)},finalize:(r,o)=>{e!==-1&&o.push({type:t,startIndex:e,endIndex:r})}}},Cv=(t,e,r)=>{let o=[];if(e){let s=oa("chainOfThoughtGroup");for(let i=0;i<t.length;i++){let n=t[i];n==="tool-call"||n==="reasoning"?s.startGroup(i):(s.endGroup(i-1,o),o.push({type:"single",index:i}))}s.finalize(t.length-1,o)}else{let s=oa("toolGroup"),i=oa("reasoningGroup");for(let n=0;n<t.length;n++){let a=t[n];a==="tool-call"?(i.endGroup(n-1,o),s.startGroup(n)):a==="reasoning"?(s.endGroup(n-1,o),i.startGroup(n)):(s.endGroup(n-1,o),i.endGroup(n-1,o),o.push({type:"single",index:n}))}s.finalize(t.length-1,o),i.finalize(t.length-1,o)}if(r){let s=new Set;for(let i of o){if(i.type==="single")continue;let n=r[i.startIndex];n!==void 0&&!s.has(n)&&(s.add(n),i.idKey=`id:${n}`)}}return o},Ev=t=>{let e=v(10),r=P(et(Hv)),o=P(et(Gv)),s;e:{if(r.length===0){let a;e[0]===Symbol.for("react.memo_cache_sentinel")?(a=[],e[0]=a):a=e[0];let l;e[1]!==o?(l={ranges:a,partIds:o},e[1]=o,e[2]=l):l=e[2],s=l;break e}let i;e[3]!==r||e[4]!==o||e[5]!==t?(i=Cv(r,t,o),e[3]=r,e[4]=o,e[5]=t,e[6]=i):i=e[6];let n;e[7]!==o||e[8]!==i?(n={ranges:i,partIds:o},e[7]=o,e[8]=i,e[9]=n):n=e[9],s=n}return s},Rv=t=>{let e=v(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let s;e[3]!==r||e[4]!==o.toolName?(s=a=>a.tools.toolUIs[o.toolName]?.[0]?.render??r,e[3]=r,e[4]=o.toolName,e[5]=s):s=e[5];let i=P(s);if(!i)return null;let n;return e[6]!==i||e[7]!==o?(n=(0,$.jsx)(i,{...o}),e[6]=i,e[7]=o,e[8]=n):n=e[8],n},sa=(t,e,r)=>{let o=t.renderers[e]?.[0];return o||(t.fallbacks[0]??r)},Av=t=>{let e=v(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let s;e[3]!==r||e[4]!==o.name?(s=a=>sa(a.dataRenderers,o.name,r),e[3]=r,e[4]=o.name,e[5]=s):s=e[5];let i=P(s);if(!i)return null;let n;return e[6]!==i||e[7]!==o?(n=(0,$.jsx)(i,{...o}),e[6]=i,e[7]=o,e[8]=n):n=e[8],n},tt={Text:()=>null,Reasoning:()=>null,Source:()=>null,Image:()=>null,File:()=>null,Unstable_Audio:()=>null,ToolGroup:({children:t})=>t,ReasoningGroup:({children:t})=>t},ia=t=>{let e=v(54),{components:r}=t,o;e[0]!==r?(o=r===void 0?{}:r,e[0]=r,e[1]=o):o=e[1];let{Text:s,Reasoning:i,Image:n,Source:a,File:l,Unstable_Audio:c,tools:d,data:u,generativeUI:m}=o,p=s===void 0?tt.Text:s,f=i===void 0?tt.Reasoning:i,g=n===void 0?tt.Image:n,b=a===void 0?tt.Source:a,x=l===void 0?tt.File:l,w=c===void 0?tt.Unstable_Audio:c,S;e[2]!==d?(S=d===void 0?{}:d,e[2]=d,e[3]=S):S=e[3];let T=S,I=q(),C=P(Wv),R=C.type;if(R==="tool-call"){let _=I.part.addToolResult,M=I.part.resumeToolCall,D=I.part.respondToToolApproval,O=I.part.unstable_recordInteraction;if("Override"in T){let G;e[4]!==O?(G=O&&{unstable_recordInteraction:O},e[4]=O,e[5]=G):G=e[5];let Z;return e[6]!==_||e[7]!==C||e[8]!==D||e[9]!==M||e[10]!==G||e[11]!==T.Override?(Z=(0,$.jsx)(T.Override,{...C,addResult:_,resume:M,respondToApproval:D,...G}),e[6]=_,e[7]=C,e[8]=D,e[9]=M,e[10]=G,e[11]=T.Override,e[12]=Z):Z=e[12],Z}let B;e[13]!==C.toolName||e[14]!==T.Fallback||e[15]!==T.by_name?(B=(T.by_name&&Object.hasOwn(T.by_name,C.toolName)?T.by_name[C.toolName]:void 0)??T.Fallback,e[13]=C.toolName,e[14]=T.Fallback,e[15]=T.by_name,e[16]=B):B=e[16];let W=B,z;e[17]!==O?(z=O&&{unstable_recordInteraction:O},e[17]=O,e[18]=z):z=e[18];let Y;return e[19]!==W||e[20]!==_||e[21]!==C||e[22]!==D||e[23]!==M||e[24]!==z?(Y=(0,$.jsx)(Rv,{...C,Fallback:W,addResult:_,resume:M,respondToApproval:D,...z}),e[19]=W,e[20]=_,e[21]=C,e[22]=D,e[23]=M,e[24]=z,e[25]=Y):Y=e[25],Y}if(C.status?.type==="requires-action")throw new Error("Encountered unexpected requires-action status");switch(R){case"text":{let _;return e[26]!==p||e[27]!==C?(_=(0,$.jsx)(p,{...C}),e[26]=p,e[27]=C,e[28]=_):_=e[28],_}case"reasoning":{let _;return e[29]!==f||e[30]!==C?(_=(0,$.jsx)(f,{...C}),e[29]=f,e[30]=C,e[31]=_):_=e[31],_}case"source":{let _;return e[32]!==b||e[33]!==C?(_=(0,$.jsx)(b,{...C}),e[32]=b,e[33]=C,e[34]=_):_=e[34],_}case"image":{let _;return e[35]!==g||e[36]!==C?(_=(0,$.jsx)(g,{...C}),e[35]=g,e[36]=C,e[37]=_):_=e[37],_}case"file":{let _;return e[38]!==x||e[39]!==C?(_=(0,$.jsx)(x,{...C}),e[38]=x,e[39]=C,e[40]=_):_=e[40],_}case"audio":{let _;return e[41]!==w||e[42]!==C?(_=(0,$.jsx)(w,{...C}),e[41]=w,e[42]=C,e[43]=_):_=e[43],_}case"data":{let _;e[44]!==u||e[45]!==C.name?(_=(u?.by_name&&Object.hasOwn(u.by_name,C.name)?u.by_name[C.name]:void 0)??u?.Fallback,e[44]=u,e[45]=C.name,e[46]=_):_=e[46];let M=_,D;return e[47]!==M||e[48]!==C?(D=(0,$.jsx)(Av,{...C,Fallback:M}),e[47]=M,e[48]=C,e[49]=D):D=e[49],D}case"generative-ui":{if(!m?.components)return typeof process<"u",null;let _=C,M;return e[50]!==m.Fallback||e[51]!==m.components||e[52]!==_.spec?(M=(0,$.jsx)(To,{spec:_.spec,components:m.components,Fallback:m.Fallback}),e[50]=m.Fallback,e[51]=m.components,e[52]=_.spec,e[53]=M):M=e[53],M}default:return console.warn(`Unknown message part type: ${R}`),null}},Gt=se(t=>{let e=v(5),{index:r,components:o}=t,s;e[0]!==o?(s=(0,$.jsx)(ia,{components:o}),e[0]=o,e[1]=s):s=e[1];let i;return e[2]!==r||e[3]!==s?(i=(0,$.jsx)(dr,{index:r,children:s}),e[2]=r,e[3]=s,e[4]=i):i=e[4],i},(t,e)=>t.index===e.index&&t.components?.Text===e.components?.Text&&t.components?.Reasoning===e.components?.Reasoning&&t.components?.Source===e.components?.Source&&t.components?.Image===e.components?.Image&&t.components?.File===e.components?.File&&t.components?.Unstable_Audio===e.components?.Unstable_Audio&&t.components?.tools===e.components?.tools&&t.components?.data===e.components?.data&&t.components?.generativeUI===e.components?.generativeUI&&t.components?.ToolGroup===e.components?.ToolGroup&&t.components?.ReasoningGroup===e.components?.ReasoningGroup);Gt.displayName="MessagePrimitive.PartByIndex";var Mv=t=>{let e=v(6),{status:r,component:o}=t,s=r.type==="running",i;e[0]!==o||e[1]!==r?(i=(0,$.jsx)(o,{type:"text",text:"",status:r}),e[0]=o,e[1]=r,e[2]=i):i=e[2];let n;return e[3]!==s||e[4]!==i?(n=(0,$.jsx)(ur,{text:"",isRunning:s,children:i}),e[3]=s,e[4]=i,e[5]=n):n=e[5],n},Pv=Object.freeze({type:"complete"}),Ov=Object.freeze({type:"running"}),Dv=t=>{let e=v(6),{components:r}=t,o=P(Kv);if(r?.Empty){let n;return e[0]!==r.Empty||e[1]!==o?(n=(0,$.jsx)(r.Empty,{status:o}),e[0]=r.Empty,e[1]=o,e[2]=n):n=e[2],n}if(o.type!=="running")return null;let s=r?.Text??tt.Text,i;return e[3]!==o||e[4]!==s?(i=(0,$.jsx)(Mv,{status:o,component:s}),e[3]=o,e[4]=s,e[5]=i):i=e[5],i},Tu=se(Dv,(t,e)=>t.components?.Empty===e.components?.Empty&&t.components?.Text===e.components?.Text),Nv=t=>{let e=v(4),{components:r,enabled:o}=t,s;if(e[0]!==o?(s=n=>{if(!o||n.message.parts.length===0)return!1;let a=n.message.parts[n.message.parts.length-1];return a?.type!=="text"&&a?.type!=="reasoning"},e[0]=o,e[1]=s):s=e[1],!P(s))return null;let i;return e[2]!==r?(i=(0,$.jsx)(Tu,{components:r}),e[2]=r,e[3]=i):i=e[3],i},Bv=se(Nv,(t,e)=>t.enabled===e.enabled&&t.components?.Empty===e.components?.Empty&&t.components?.Text===e.components?.Text),Lv=t=>{let e=v(4),{Quote:r}=t,o=P(li);if(!o)return null;let s;return e[0]!==r||e[1]!==o.messageId||e[2]!==o.text?(s=(0,$.jsx)(r,{text:o.text,messageId:o.messageId}),e[0]=r,e[1]=o.messageId,e[2]=o.text,e[3]=s):s=e[3],s},$v=se(Lv);function ku(t,e){let r=t.toolUIs[e.toolName]?.[0]?.render??null;return r||(Ld(e.mcp?.app?.resourceUri)&&t.mcpApp?t.mcpApp.render:null)}var Iu=()=>{let t=v(9),e=q(),r=P(Jv),o=P(Qv),s=e.part.unstable_recordInteraction;if(!o||r.type!=="tool-call")return null;let i;t[0]!==s?(i=s&&{unstable_recordInteraction:s},t[0]=s,t[1]=i):i=t[1];let n;return t[2]!==o||t[3]!==e.part.addToolResult||t[4]!==e.part.respondToToolApproval||t[5]!==e.part.resumeToolCall||t[6]!==r||t[7]!==i?(n=(0,$.jsx)(o,{...r,addResult:e.part.addToolResult,resume:e.part.resumeToolCall,respondToApproval:e.part.respondToToolApproval,...i}),t[2]=o,t[3]=e.part.addToolResult,t[4]=e.part.respondToToolApproval,t[5]=e.part.resumeToolCall,t[6]=r,t[7]=i,t[8]=n):n=t[8],n},Cu=()=>{let t=v(3),e=P(Yv),r=P(Xv);if(!r||e.type!=="data")return null;let o=e,s;return t[0]!==r||t[1]!==o?(s=(0,$.jsx)(r,{...o}),t[0]=r,t[1]=o,t[2]=s):s=t[2],s},na=()=>{let t=v(2),e=P(Zv);if(e==="tool-call"){let r;return t[0]===Symbol.for("react.memo_cache_sentinel")?(r=(0,$.jsx)(Iu,{}),t[0]=r):r=t[0],r}if(e==="data"){let r;return t[1]===Symbol.for("react.memo_cache_sentinel")?(r=(0,$.jsx)(Cu,{}),t[1]=r):r=t[1],r}return null},jv=Object.freeze({type:"text",text:"",status:Ov}),Fv=({children:t})=>{let e=q(),r=P(o=>o.dataRenderers);return(0,$.jsx)(At,{getItemState:o=>o.part.getState(),children:o=>t({get part(){let s=o();if(s.type==="tool-call"){let i=ku(e.tools.getState(),s)!==null,n=e.part;return{...s,toolUI:i?(0,$.jsx)(Iu,{}):null,addResult:n.addToolResult,resume:n.resumeToolCall,respondToApproval:n.respondToToolApproval,...n.unstable_recordInteraction&&{unstable_recordInteraction:n.unstable_recordInteraction}}}if(s.type==="data"){let i=sa(r,s.name,void 0)!==void 0;return{...s,dataRendererUI:i?(0,$.jsx)(Cu,{}):null}}return s}})})},aa=t=>{let e=v(5),{index:r,children:o}=t,s;e[0]!==o?(s=(0,$.jsx)(Fv,{children:o}),e[0]=o,e[1]=s):s=e[1];let i;return e[2]!==r||e[3]!==s?(i=(0,$.jsx)(dr,{index:r,children:s}),e[2]=r,e[3]=s,e[4]=i):i=e[4],i},Vv=t=>{let e=v(9),{children:r}=t,o=P(eb),s=P(tb),i=o===0&&s;if(o===0){if(!i)return null;let a;e[0]!==r?(a=r({part:jv}),e[0]=r,e[1]=a):a=e[1];let l;return e[2]!==a?(l=(0,$.jsx)(ur,{text:"",isRunning:!0,children:a}),e[2]=a,e[3]=l):l=e[3],l}let n;if(e[4]!==r||e[5]!==o){let a;e[7]!==r?(a=(l,c)=>(0,$.jsx)(aa,{index:c,children:d=>r(d)??(0,$.jsx)(na,{})},c),e[7]=r,e[8]=a):a=e[8],n=(0,$.jsx)($.Fragment,{children:Array.from({length:o},a)}),e[4]=r,e[5]=o,e[6]=n}else n=e[6];return n},ko=t=>{let e=v(5),{components:r,unstable_showEmptyOnNonTextEnd:o,children:s}=t,i=o===void 0?!0:o;if(s){let a;return e[0]!==s?(a=(0,$.jsx)(Vv,{children:s}),e[0]=s,e[1]=a):a=e[1],a}let n;return e[2]!==r||e[3]!==i?(n=(0,$.jsx)(Uv,{components:r,unstable_showEmptyOnNonTextEnd:i}),e[2]=r,e[3]=i,e[4]=n):n=e[4],n};ko.displayName="MessagePrimitive.Parts";var Uv=t=>{let e=v(15),{components:r,unstable_showEmptyOnNonTextEnd:o}=t,s=P(rb),i=!!r?.ChainOfThought,{ranges:n,partIds:a}=Ev(i),l;e:{if(s===0){let f;e[0]!==r?(f=(0,$.jsx)(Tu,{components:r}),e[0]=r,e[1]=f):f=e[1],l=f;break e}let p;if(e[2]!==r||e[3]!==n||e[4]!==a){let f=new Set,g=b=>{let x=a[b];return x!==void 0&&!f.has(x)?(f.add(x),`part-id:${x}`):`part-${b}`};p=n.map(b=>{if(b.type==="single")return(0,$.jsx)(Gt,{index:b.index,components:r},b.index);if(b.type==="chainOfThoughtGroup"){let x=r?.ChainOfThought;return x?(0,$.jsx)(Sd,{startIndex:b.startIndex,endIndex:b.endIndex,children:(0,$.jsx)(x,{})},`chainOfThought-${b.idKey??b.startIndex}`):null}else if(b.type==="toolGroup"){let x=r?.ToolGroup??tt.ToolGroup;return(0,$.jsx)(x,{startIndex:b.startIndex,endIndex:b.endIndex,children:Array.from({length:b.endIndex-b.startIndex+1},(w,S)=>{let T=b.startIndex+S;return(0,$.jsx)(Gt,{index:T,components:r},g(T))})},`tool-${b.idKey??b.startIndex}`)}else{let x=r?.ReasoningGroup??tt.ReasoningGroup;return(0,$.jsx)(x,{startIndex:b.startIndex,endIndex:b.endIndex,children:Array.from({length:b.endIndex-b.startIndex+1},(w,S)=>{let T=b.startIndex+S;return(0,$.jsx)(Gt,{index:T,components:r},`part-${T}`)})},`reasoning-${b.startIndex}`)}}),e[2]=r,e[3]=n,e[4]=a,e[5]=p}else p=e[5];l=p}let c=l,d;e[6]!==r?(d=r?.Quote&&(0,$.jsx)($v,{Quote:r.Quote}),e[6]=r,e[7]=d):d=e[7];let u;e[8]!==r||e[9]!==o?(u=(0,$.jsx)(Bv,{components:r,enabled:o}),e[8]=r,e[9]=o,e[10]=u):u=e[10];let m;return e[11]!==c||e[12]!==d||e[13]!==u?(m=(0,$.jsxs)($.Fragment,{children:[d,c,u]}),e[11]=c,e[12]=d,e[13]=u,e[14]=m):m=e[14],m};function zv(t){return t.type}function Hv(t){return t.message.parts.map(zv)}function qv(t){return t.type==="tool-call"?t.toolCallId:void 0}function Gv(t){return t.message.parts.map(qv)}function Wv(t){return t.part}function Kv(t){return t.message.status??Pv}function Jv(t){return t.part}function Qv(t){return t.part.type==="tool-call"?ku(t.tools,t.part):null}function Yv(t){return t.part}function Xv(t){return t.part.type==="data"?sa(t.dataRenderers,t.part.name,void 0)??null:null}function Zv(t){return t.part.type}function eb(t){return t.message.parts.length}function tb(t){return(t.message.status?.type??"complete")==="running"}function rb(t){return t.message.parts.length}var Au=Symbol.for("@assistant-ui/groupBy.memoKey");var Eu=t=>{let e=t.nextChildIdx++;return t.nodeKey===""?String(e):`${t.nodeKey}.${e}`},Ru=(t,e)=>{if(!(e===void 0||t.claimed.has(e)))return t.claimed.add(e),`id:${e}`},Mu=(t,e)=>{let r={key:"",nodeKey:"",indices:[],children:[],nextChildIdx:0,claimed:new Set},o=[r],s=()=>{let i=o.pop(),n=o[o.length-1];n.children.push({type:"group",key:i.key,nodeKey:i.nodeKey,idKey:Ru(n,e?.[i.indices[0]]),indices:i.indices,children:i.children})};for(let i=0;i<t.length;i++){let n=t[i],a=0;for(;a<o.length-1&&a<n.length&&o[a+1].key===n[a];)a++;for(;o.length-1>a;)s();for(;o.length-1<n.length;){let c=o[o.length-1];o.push({key:n[o.length-1],nodeKey:Eu(c),indices:[],children:[],nextChildIdx:0,claimed:new Set})}let l=o[o.length-1];l.children.push({type:"part",index:i,nodeKey:Eu(l),idKey:Ru(l,e?.[i])});for(let c=1;c<o.length;c++)o[c].indices.push(i)}for(;o.length>1;)s();return r.children};var rt=V("react/jsx-runtime"),ob=(t,e,r)=>{if(!r)return!1;switch(t){case"never":return!1;case"always":return!0;case"empty":return e.length===0;case"no-text":{let o=e[e.length-1];return o===void 0||o.type!=="text"&&o.type!=="reasoning"}}},Pu=()=>{throw new Error("MessagePrimitive.GroupedParts: rendered `children` under a leaf part. `children` is only meaningful for `group-\u2026` cases \u2014 add a matching case for the part type or return `null` to use registered UIs.")},Ou=(t,e,r)=>{if(t.type==="part")return(0,rt.jsx)(aa,{index:t.index,children:({part:n})=>r({part:n,children:(0,rt.jsx)(Pu,{})})??(0,rt.jsx)(na,{})},t.idKey?`part-${t.idKey}`:`part-${t.index}`);let{status:o,counts:s}=yd(e,t.indices),i={type:t.key,status:o,counts:s,indices:t.indices};return(0,rt.jsx)(Ki,{children:r({part:i,children:(0,rt.jsx)(rt.Fragment,{children:t.children.map(n=>Ou(n,e,r))})})},t.idKey??t.nodeKey)},di=({groupBy:t,indicator:e="no-text",children:r})=>{let o=P(et(l=>l.message.parts)),s=P(l=>l.tools.toolUIs),i=P(l=>e==="never"?!1:l.message.status?.type==="running"),n=t[Au]??t,a=K(()=>{let l={toolUIs:s};return Mu(o.map(c=>t(c,l)??[]),o.map(c=>c.type==="tool-call"?c.toolCallId:void 0))},[o,n,s]);return(0,rt.jsxs)(rt.Fragment,{children:[a.map(l=>Ou(l,o,r)),ob(e,o,i)&&r({part:{type:"indicator"},children:(0,rt.jsx)(Pu,{})})]})};di.displayName="MessagePrimitive.GroupedParts";var ui=V("react/jsx-runtime"),sb=t=>{let e=v(5),{children:r}=t,o=P(li);if(!o)return null;let s;e[0]!==r||e[1]!==o?(s=r(o),e[0]=r,e[1]=o,e[2]=s):s=e[2];let i;return e[3]!==s?(i=(0,ui.jsx)(ui.Fragment,{children:s}),e[3]=s,e[4]=i):i=e[4],i},pi=se(sb);pi.displayName="MessagePrimitive.Quote";var Pt=V("react/jsx-runtime"),Nu=(t,e)=>{switch(e.type){case"image":return t?.Image??t?.Attachment;case"document":return t?.Document??t?.Attachment;case"file":return t?.File??t?.Attachment;default:return t?.Attachment}},ib=t=>{let e=v(5),{components:r}=t,o=P(nb);if(!o)return null;let s;e[0]!==o||e[1]!==r?(s=Nu(r,o),e[0]=o,e[1]=r,e[2]=s):s=e[2];let i=s;if(!i)return null;let n;return e[3]!==i?(n=(0,Pt.jsx)(i,{}),e[3]=i,e[4]=n):n=e[4],n},Io=se(t=>{let e=v(5),{index:r,components:o}=t,s;e[0]!==o?(s=(0,Pt.jsx)(ib,{components:o}),e[0]=o,e[1]=s):s=e[1];let i;return e[2]!==r||e[3]!==s?(i=(0,Pt.jsx)(Hn,{index:r,children:s}),e[2]=r,e[3]=s,e[4]=i):i=e[4],i},(t,e)=>t.index===e.index&&t.components?.Image===e.components?.Image&&t.components?.Document===e.components?.Document&&t.components?.File===e.components?.File&&t.components?.Attachment===e.components?.Attachment);Io.displayName="MessagePrimitive.AttachmentByIndex";var Du=({children:t})=>{let e=P(et(r=>r.message.role!=="user"?[]:(r.message.submission?.attachments??r.message.attachments??[]).map(o=>o.id)));return K(()=>e.map((r,o)=>(0,Pt.jsx)(Hn,{index:o,children:(0,Pt.jsx)(At,{getItemState:s=>s.message.attachment({index:o}).getState(),children:s=>t({get attachment(){return s()}})})},r)),[e,t])},Co=t=>{let e=v(4),{components:r,children:o}=t;if(r){let i;return e[0]!==r?(i=(0,Pt.jsx)(Du,{children:n=>{let{attachment:a}=n,l=Nu(r,a);return l?(0,Pt.jsx)(l,{}):null}}),e[0]=r,e[1]=i):i=e[1],i}let s;return e[2]!==o?(s=(0,Pt.jsx)(Du,{children:o}),e[2]=o,e[3]=s):s=e[3],s};Co.displayName="MessagePrimitive.Attachments";function nb(t){return t.attachment}var hr=t=>{let{children:e}=t;return P(ab)?e:null};hr.displayName="MessagePartPrimitive.InProgress";function ab(t){return t.part.status.type==="running"}var Ot=V("react/jsx-runtime"),lb=t=>{let e=new Map;return t.map(r=>{let o=JSON.stringify([r.title,r.label,r.prompt]),s=e.get(o)??0;return e.set(o,s+1),s===0?o:`${o}:${s}`})},Lu=t=>{let e=v(2),{components:r}=t,o=r.Suggestion,s;return e[0]!==o?(s=(0,Ot.jsx)(o,{}),e[0]=o,e[1]=s):s=e[1],s},Eo=se(t=>{let e=v(5),{index:r,components:o}=t,s;e[0]!==o?(s=(0,Ot.jsx)(Lu,{components:o}),e[0]=o,e[1]=s):s=e[1];let i;return e[2]!==r||e[3]!==s?(i=(0,Ot.jsx)(Gn,{index:r,children:s}),e[2]=r,e[3]=s,e[4]=i):i=e[4],i},(t,e)=>t.index===e.index&&t.components.Suggestion===e.components.Suggestion);Eo.displayName="ThreadPrimitive.SuggestionByIndex";var Bu=({children:t})=>{let e=P(et(r=>lb(r.suggestions.suggestions)));return K(()=>e.length===0?null:e.map((r,o)=>(0,Ot.jsx)(Gn,{index:o,children:(0,Ot.jsx)(At,{getItemState:s=>s.suggestions.suggestion({index:o}).getState(),children:s=>t({get suggestion(){return s()}})})},r)),[e,t])},mi=t=>{let e=v(4),{components:r,children:o}=t;if(r){let i;return e[0]!==r?(i=(0,Ot.jsx)(Bu,{children:()=>(0,Ot.jsx)(Lu,{components:r})}),e[0]=r,e[1]=i):i=e[1],i}let s;return e[2]!==o?(s=(0,Ot.jsx)(Bu,{children:o}),e[2]=o,e[3]=s):s=e[3],s};mi.displayName="ThreadPrimitive.Suggestions";var hi=se(mi,(t,e)=>t.children||e.children?t.children===e.children:t.components.Suggestion===e.components.Suggestion);var la=t=>t.voice!==void 0?t.voice.canSendText?"now":"blocked":t.isRunning?t.capabilities.queue?"queued":"blocked":"now",$u=(t,e)=>t.thread.isDisabled||e&&la(t.thread)==="blocked",ju=t=>{if(t.message.status?.type!=="incomplete"||t.message.status.reason!=="error")return;let e=t.message.status.error;return typeof e=="string"?e:typeof e=="object"&&e!==null&&"message"in e&&typeof e.message=="string"?e.message:e??"An error occurred"};var ca=t=>{let e=v(10),{prompt:r,send:o,clearComposer:s}=t,i=s===void 0?!0:s,n=q(),a=o??!1,l;e[0]!==a?(l=p=>$u(p,a),e[0]=a,e[1]=l):l=e[1];let c=P(l),d;e[2]!==n||e[3]!==i||e[4]!==r||e[5]!==a?(d=()=>{if(a){let p=la(n.thread.getState());if(p==="blocked")return;n.thread.append({content:[{type:"text",text:r}],runConfig:n.composer.getState().runConfig}),i&&p==="now"&&n.composer.setText("")}else if(i)n.composer.setText(r);else{let p=n.composer.getState().text;n.composer.setText([p,r].filter(cb).join(" "))}},e[2]=n,e[3]=i,e[4]=r,e[5]=a,e[6]=d):d=e[6];let u=d,m;return e[7]!==c||e[8]!==u?(m={trigger:u,disabled:c},e[7]=c,e[8]=u,e[9]=m):m=e[9],m};function cb(t){return t.trim()}var da=()=>P(ju);function Fu(t,e){function r(o){let s=Ke(t);if(!o?.optional&&!s)throw new Error(`This component must be used within ${e}.`);return s}return r}function fi(t,e){function r(s){let i=t(s);return i?i[e]:null}function o(s){let i=!1,n;typeof s=="function"?n=s:s&&typeof s=="object"&&(i=!!s.optional,n=s.selector);let a=r({optional:i});return a?n?a(n):a():null}return{[e]:o,[`${e}Store`]:r}}var ua=ae(null),db=Fu(ua,"ThreadPrimitive.Viewport"),{useThreadViewport:Ue,useThreadViewportStore:ze}=fi(db,"useThreadViewport");var $r,pa=()=>{if($r)return $r;let t=()=>({apis:new Map,nextId:0,listeners:new Set});if(typeof window>"u")return $r=t(),$r;let e=window.__ASSISTANT_UI_DEVTOOLS_HOOK__;if(e)return $r=e,e;let r=t();return window.__ASSISTANT_UI_DEVTOOLS_HOOK__=r,$r=r,r},gi=t=>{pe(pa().listeners,t,"DevTools")};var Wt,Vu=(Wt=class{static register(e){let r=pa();for(let a of r.apis.values())if(a.api===e)return()=>{};let o=r.nextId++,s={api:e,logs:[]},i=e.on?.("*",a=>{let l=r.apis.get(o);l&&(l.logs.push({time:new Date,event:a.event,data:a.payload}),l.logs.length>Wt.MAX_EVENT_LOGS_PER_API&&(l.logs=l.logs.slice(-Wt.MAX_EVENT_LOGS_PER_API)),gi(o))}),n=e.subscribe?.(()=>{gi(o)});return r.apis.set(o,s),gi(o),()=>{let a=pa();a.apis.get(o)&&(i?.(),n?.(),a.apis.delete(o),gi(o))}}},h(Wt,"MAX_EVENT_LOGS_PER_API",200),Wt);var Uu=t=>{let e,r=new Set,o=(c,d)=>{let u=typeof c=="function"?c(e):c;if(!Object.is(u,e)){let m=e;e=d??(typeof u!="object"||u===null)?u:Object.assign({},e,u),r.forEach(p=>p(e,m))}},s=()=>e,a={setState:o,getState:s,getInitialState:()=>l,subscribe:c=>(r.add(c),()=>r.delete(c))},l=e=t(o,s,a);return a},zu=(t=>t?Uu(t):Uu);var Ro=qe(V("react"),1);var ub=t=>t;function pb(t,e=ub){let r=Ro.default.useSyncExternalStore(t.subscribe,Ro.default.useCallback(()=>e(t.getState()),[t,e]),Ro.default.useCallback(()=>e(t.getInitialState()),[t,e]));return Ro.default.useDebugValue(r),r}var Hu=t=>{let e=zu(t),r=o=>pb(e,o);return Object.assign(r,e),r},qu=(t=>t?Hu(t):Hu);var Gu=t=>{let e=new Map,r=()=>{let o=0;for(let s of e.values())o+=s;t(o)};return{register:()=>{let o=Symbol();return e.set(o,0),{setHeight:s=>{e.get(o)!==s&&(e.set(o,s),r())},unregister:()=>{e.delete(o),r()}}}}},Wu=(t={})=>{let e=new Set,r=Gu(n=>{i.setState({height:{...i.getState().height,viewport:n}})}),o=Gu(n=>{i.setState({height:{...i.getState().height,inset:n}})}),s=(n,a)=>(i.setState({element:{...i.getState().element,[n]:a}}),()=>{i.getState().element[n]===a&&i.setState({element:{...i.getState().element,[n]:null}})}),i=qu(()=>({isAtBottom:!0,scrollToBottom:({behavior:n="auto"}={})=>{pe(e,()=>({behavior:n}),"Thread viewport")},onScrollToBottom:n=>(e.add(n),()=>{e.delete(n)}),turnAnchor:t.turnAnchor??"bottom",topAnchorMessageClamp:{tallerThan:t.topAnchorMessageClamp?.tallerThan??"10em",visibleHeight:t.topAnchorMessageClamp?.visibleHeight??"6em"},height:{viewport:0,inset:0},element:{viewport:null,anchor:null,target:null},targetConfig:null,topAnchorTurn:null,registerViewport:r.register,registerContentInset:o.register,registerViewportElement:n=>s("viewport",n),registerAnchorElement:n=>s("anchor",n),registerAnchorTargetElement:(n,a)=>(i.setState({element:{...i.getState().element,target:n},targetConfig:n&&a?a:null}),()=>{i.getState().element.target===n&&i.setState({element:{...i.getState().element,target:null},targetConfig:null})}),setTopAnchorTurn:n=>{i.setState({topAnchorTurn:n})}}));return i};var fr=t=>t;var Ku=V("react/jsx-runtime"),mb=t=>{let e=v(11),r;e[0]===Symbol.for("react.memo_cache_sentinel")?(r={optional:!0},e[0]=r):r=e[0];let o=ze(r),s;e[1]!==t?(s=()=>Wu(t),e[1]=t,e[2]=s):s=e[2];let[i]=j(s),n,a;e[3]!==o||e[4]!==i?(n=()=>o?.getState().onScrollToBottom(d=>{i.getState().scrollToBottom(d)}),a=[o,i],e[3]=o,e[4]=i,e[5]=n,e[6]=a):(n=e[5],a=e[6]),N(n,a);let l,c;return e[7]!==o||e[8]!==i?(l=()=>{if(o)return i.subscribe(d=>{o.getState().isAtBottom!==d.isAtBottom&&fr(o).setState({isAtBottom:d.isAtBottom})})},c=[i,o],e[7]=o,e[8]=i,e[9]=l,e[10]=c):(l=e[9],c=e[10]),N(l,c),i},jr=t=>{let e=v(7),{children:r,options:o}=t,s;e[0]!==o?(s=o===void 0?{}:o,e[0]=o,e[1]=s):s=e[1];let i=mb(s),n;e[2]!==i?(n=()=>({useThreadViewport:i}),e[2]=i,e[3]=n):n=e[3];let[a]=j(n),l;return e[4]!==r||e[5]!==a?(l=(0,Ku.jsx)(ua.Provider,{value:a,children:r}),e[4]=r,e[5]=a,e[6]=l):l=e[6],l};var Ao=V("react/jsx-runtime"),hb=()=>{let t=v(3),e=q(),r,o;return t[0]!==e?(r=()=>{typeof process>"u"},o=[e],t[0]=e,t[1]=r,t[2]=o):(r=t[1],o=t[2]),N(r,o),null},fb=t=>{let e=v(8),{children:r,aui:o,config:s,runtime:i}=t,n=o??null,a;e[0]===Symbol.for("react.memo_cache_sentinel")?(a=(0,Ao.jsx)(hb,{}),e[0]=a):a=e[0];let l;e[1]!==r?(l=(0,Ao.jsx)(jr,{children:r}),e[1]=r,e[2]=l):l=e[2];let c;return e[3]!==s||e[4]!==i||e[5]!==n||e[6]!==l?(c=(0,Ao.jsxs)(An,{runtime:i,aui:n,config:s,children:[a,l]}),e[3]=s,e[4]=i,e[5]=n,e[6]=l,e[7]=c):c=e[7],c},ma=se(fb);var tp=qe(V("react"),1),rp=qe(V("react-dom"),1);var bi={};Ai(bi,{Root:()=>bb,Slot:()=>bb,Slottable:()=>wb,createSlot:()=>Mo,createSlottable:()=>ba});var fe=qe(V("react"),1);var Ju=qe(V("react"),1),gb=Object.defineProperty,fa=(t,e)=>gb(t,"name",{value:e,configurable:!0});function ha(t,e){if(typeof t=="function")return t(e);t!=null&&(t.current=e)}fa(ha,"setRef");function ga(...t){return e=>{let r=!1,o=t.map(s=>{let i=ha(s,e);return!r&&typeof i=="function"&&(r=!0),i});if(r)return()=>{for(let s=0;s<o.length;s++){let i=o[s];typeof i=="function"?i():ha(t[s],null)}}}}fa(ga,"composeRefs");function Ce(...t){return Ju.useCallback(ga(...t),t)}fa(Ce,"useComposedRefs");var vb=Object.defineProperty,gt=(t,e)=>vb(t,"name",{value:e,configurable:!0});function Mo(t){let e=fe.forwardRef((r,o)=>{let{children:s,...i}=r,n=null,a=!1,l=[];va(s)&&typeof vi=="function"&&(s=vi(s._payload)),fe.Children.forEach(s,m=>{if(Zu(m)){a=!0;let p=m,f="child"in p.props?p.props.child:p.props.children;va(f)&&typeof vi=="function"&&(f=vi(f._payload)),n=yb(p,f),l.push(n?.props?.children)}else l.push(m)}),n?n=fe.cloneElement(n,void 0,l):!a&&fe.Children.count(s)===1&&fe.isValidElement(s)&&(n=s);let c=n?Xu(n):void 0,d=Ce(o,c);if(!n){if(s||s===0)throw new Error(a?Sb(t):_b(t));return s}let u=Yu(i,n.props??{});return n.type!==fe.Fragment&&(u.ref=o?d:c),fe.cloneElement(n,u)});return e.displayName=`${t}.Slot`,e}gt(Mo,"createSlot");var bb=Mo("Slot"),Qu=Symbol.for("radix.slottable");function ba(t){let e=gt(r=>"child"in r?r.children(r.child):r.children,"Slottable");return e.displayName=`${t}.Slottable`,e.__radixId=Qu,e}gt(ba,"createSlottable");var wb=ba("Slottable"),yb=gt((t,e)=>{if("child"in t.props){let r=t.props.child;return fe.isValidElement(r)?fe.cloneElement(r,void 0,t.props.children(r.props.children)):null}return fe.isValidElement(e)?e:null},"getSlottableElementFromSlottable");function Yu(t,e){let r={...e};for(let o in e){let s=t[o],i=e[o];/^on[A-Z]/.test(o)?s&&i?r[o]=(...a)=>{let l=i(...a);return s(...a),l}:s&&(r[o]=s):o==="style"?r[o]={...s,...i}:o==="className"&&(r[o]=[s,i].filter(Boolean).join(" "))}return{...t,...r}}gt(Yu,"mergeProps");function Xu(t){let e=Object.getOwnPropertyDescriptor(t.props,"ref")?.get,r=e&&"isReactWarning"in e&&e.isReactWarning;return r?t.ref:(e=Object.getOwnPropertyDescriptor(t,"ref")?.get,r=e&&"isReactWarning"in e&&e.isReactWarning,r?t.props.ref:t.props.ref||t.ref)}gt(Xu,"getElementRef");function Zu(t){return fe.isValidElement(t)&&typeof t.type=="function"&&"__radixId"in t.type&&t.type.__radixId===Qu}gt(Zu,"isSlottable");var xb=Symbol.for("react.lazy");function va(t){return t!=null&&typeof t=="object"&&"$$typeof"in t&&t.$$typeof===xb&&"_payload"in t&&ep(t._payload)}gt(va,"isLazyComponent");function ep(t){return typeof t=="object"&&t!==null&&"then"in t}gt(ep,"isPromiseLike");var _b=gt(t=>`${t} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,"createSlotError"),Sb=gt(t=>`${t} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,"createSlottableError"),vi=fe[" use ".trim().toString()];var op=V("react/jsx-runtime"),Tb=Object.defineProperty,kb=(t,e)=>Tb(t,"name",{value:e,configurable:!0}),Ib=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],wa=Ib.reduce((t,e)=>{let r=Mo(`Primitive.${e}`),o=tp.forwardRef((s,i)=>{let{asChild:n,...a}=s,l=n?r:e;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),(0,op.jsx)(l,{...a,ref:i})});return o.displayName=`Primitive.${e}`,{...t,[e]:o}},{});function ya(t,e){t&&rp.flushSync(()=>t.dispatchEvent(e))}kb(ya,"dispatchDiscreteCustomEvent");var Cb=Object.defineProperty,Fr=(t,e)=>Cb(t,"name",{value:e,configurable:!0}),sp=!!(typeof window<"u"&&window.document&&window.document.createElement);function wi(t,e,{checkForDefaultPrevented:r=!0}={}){return Fr(function(s){if(t?.(s),r===!1||!s||!s.defaultPrevented)return e?.(s)},"handleEvent")}Fr(wi,"composeEventHandlers");function Eb(t){if(!sp)throw new Error("Cannot access window outside of the DOM");return t?.ownerDocument?.defaultView??window}Fr(Eb,"getOwnerWindow");function xa(t){if(!sp)throw new Error("Cannot access document outside of the DOM");return t?.ownerDocument??document}Fr(xa,"getOwnerDocument");function ip(t,e=!1){let{activeElement:r}=xa(t);if(!r?.nodeName)return null;if(np(r)&&r.contentDocument)return ip(r.contentDocument.body,e);if(e){let o=r.getAttribute("aria-activedescendant");if(o){let s=xa(r).getElementById(o);if(s)return s}}return r}Fr(ip,"getActiveElement");function np(t){return t.tagName==="IFRAME"}Fr(np,"isFrame");var Vr=qe(V("react"),1),Rb=Object.defineProperty,Ab=(t,e)=>Rb(t,"name",{value:e,configurable:!0});function Kt(t){let e=Vr.useRef(t);return Vr.useEffect(()=>{e.current=t}),Vr.useMemo(()=>((...r)=>e.current?.(...r)),[])}Ab(Kt,"useCallbackRef");var yi=wa;yi.dispatchDiscreteCustomEvent=ya;yi.Root=wa;var ap=Object.defineProperty,xi=(t,e)=>{let r={};for(var o in t)ap(r,o,{get:t[o],enumerable:!0});return e||ap(r,Symbol.toStringTag,{value:"Module"}),r};var _i=V("react/jsx-runtime");var Mb=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"];function lp(t,e){return Qi(t,void 0,e!==void 0?e:t.props.children)}function cp(t,e,r){return(0,_i.jsx)(bi.Root,{...r,children:lp(t,e)})}function Pb(t){let e=ne((r,o)=>{let s=v(17),i,n,a,l;s[0]!==r?({render:a,asChild:i,children:n,...l}=r,s[0]=r,s[1]=i,s[2]=n,s[3]=a,s[4]=l):(i=s[1],n=s[2],a=s[3],l=s[4]);let c=t;if(a&&Yr(a)){let m=l,p;s[5]!==n||s[6]!==a?(p=lp(a,n),s[5]=n,s[6]=a,s[7]=p):p=s[7];let f;return s[8]!==o||s[9]!==m||s[10]!==p?(f=(0,_i.jsx)(c,{...m,asChild:!0,ref:o,children:p}),s[8]=o,s[9]=m,s[10]=p,s[11]=f):f=s[11],f}let d=l,u;return s[12]!==i||s[13]!==n||s[14]!==o||s[15]!==d?(u=(0,_i.jsx)(c,{...d,asChild:i,ref:o,children:n}),s[12]=i,s[13]=n,s[14]=o,s[15]=d,s[16]=u):u=s[16],u});return e.displayName=typeof t=="string"?t:t.displayName??t.name??"Component",e}function Ob(t){let e=yi[t],r=Pb(e);return r.displayName=`Primitive.${t}`,r}var Ee=Mb.reduce((t,e)=>(t[e]=Ob(e),t),{});var dp=V("react/jsx-runtime");var Si=(t,e,r=[])=>{let o=ne((s,i)=>{let n=v(6),a={},l={};Object.keys(s).forEach(g=>{r.includes(g)?a[g]=s[g]:l[g]=s[g]});let c=e(a)??void 0,d=Ee,u="button",m=l.disabled||!c,p=wi(l.onClick,c),f;return n[0]!==i||n[1]!==l||n[2]!==d.button||n[3]!==m||n[4]!==p?(f=(0,dp.jsx)(d.button,{type:u,...l,ref:i,disabled:m,onClick:p}),n[0]=i,n[1]=l,n[2]=d.button,n[3]=m,n[4]=p,n[5]=f):f=n[5],f});return o.displayName=t,o};var up=t=>{let e=v(4),r=Kt(t),o=Ue(Db),s,i;e[0]!==r||e[1]!==o?(s=()=>o(r),i=[o,r],e[0]=r,e[1]=o,e[2]=s,e[3]=i):(s=e[2],i=e[3]),N(s,i)};function Db(t){return t.onScrollToBottom}var Nb=()=>!1,Bb=()=>{},pp=t=>{let e=v(4),r;e[0]!==t?(r=i=>{if(typeof window>"u"||t===null||!window.matchMedia)return Bb;let n=window.matchMedia(t);return n.addEventListener("change",i),()=>n.removeEventListener("change",i)},e[0]=t,e[1]=r):r=e[1];let o=r,s;return e[2]!==t?(s=()=>typeof window>"u"||t===null||!window.matchMedia?!1:window.matchMedia(t).matches,e[2]=t,e[3]=s):s=e[3],xt(o,s,Nb)};var Lb=Object.freeze({type:"complete"}),$b=Object.freeze({type:"text",text:"",status:Lb}),mp=()=>P(jb);function jb(t){return t.part.type!=="text"&&t.part.type!=="reasoning"?$b:t.part}var Fb=V("react/jsx-runtime"),Vb=ae(null);function Ub(t){let e=Ke(Vb);if(!t?.optional&&!e)throw new Error("This component must be used within a SmoothContextProvider.");return e}var{useSmoothStatus:$4,useSmoothStatusStore:hp}=fi(Ub,"useSmoothStatus");var fp=250,gp=5,zb=class{constructor(t,e){h(this,"animationFrameId",null);h(this,"lastUpdateTime",Date.now());h(this,"lastCommitTime",0);h(this,"targetText","");h(this,"drainMs",fp);h(this,"maxCharIntervalMs",gp);h(this,"maxCharsPerFrame",1/0);h(this,"minCommitMs",0);h(this,"currentText");h(this,"setText");h(this,"animate",()=>{let t=Date.now(),e=t-this.lastUpdateTime,r=this.targetText.length-this.currentText.length,o=Math.min(this.maxCharIntervalMs,this.drainMs/r),s=Math.min(r,this.maxCharsPerFrame),i=0;for(;e>=o&&i<s;)i++,e-=o;i===s&&s===this.maxCharsPerFrame&&(e=0),i!==r?this.animationFrameId=requestAnimationFrame(this.animate):this.animationFrameId=null,i!==0&&(this.currentText=this.targetText.slice(0,this.currentText.length+i),this.lastUpdateTime=t-e,(i===r||t-this.lastCommitTime>=this.minCommitMs)&&(this.lastCommitTime=t,this.setText(this.currentText)))});this.currentText=t,this.setText=e}start(){this.animationFrameId===null&&(this.lastUpdateTime=Date.now(),this.animate())}stop(){this.animationFrameId!==null&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}},_a=Object.freeze({type:"running"}),Ti=(t,e)=>t!==void 0&&t>0?t:e,vp=(t,e=!1)=>{let{text:r}=t,o=pp("(prefers-reduced-motion: reduce)"),s=typeof e=="object"&&e!==null?e:void 0,i=e!==!1&&e!==null&&!o,n=Ti(s?.drainMs,fp),a=Ti(s?.maxCharIntervalMs,gp),l=Ti(s?.maxCharsPerFrame,1/0),c=Ti(s?.minCommitMs,0),[d,u]=j(t.status.type==="running"?"":r),m=q(),p=P(()=>m.part),[f,g]=j(p);(p!==f||!r.startsWith(d))&&(g(p),u(t.status.type==="running"?"":r));let b=hp({optional:!0}),x=Kt(T=>{if(u(T),b){let I=d!==T||t.status.type==="running"?_a:t.status;fr(b).setState(I,!0)}});N(()=>{if(b){let T=i&&(d!==r||t.status.type==="running")?_a:t.status;fr(b).setState(T,!0)}},[b,i,r,d,t.status]);let[w]=j(new zb(d,x));N(()=>{w.drainMs=n,w.maxCharIntervalMs=a,w.maxCharsPerFrame=l,w.minCommitMs=c},[w,n,a,l,c]);let S=U(p);return N(()=>{if(!i){w.stop();return}let T=S.current!==p;if(S.current=p,T||!r.startsWith(w.targetText)){t.status.type==="running"?(w.currentText="",w.targetText=r,w.lastCommitTime=0,w.start()):(w.currentText=r,w.targetText=r,w.stop(),x(r));return}if(w.targetText=r,t.status.type!=="running"){if(w.currentText===""){w.currentText=r,w.stop(),x(r);return}w.start();return}w.start()},[w,i,r,t.status.type,p,x]),N(()=>()=>{w.stop()},[w]),K(()=>i?{...t,text:d,status:r===d?t.status:_a}:t,[i,d,t,r])};var Hb=Object.freeze({type:"complete"}),qb=Object.freeze({type:"image",image:"",status:Hb}),bp=()=>P(Gb);function Gb(t){return t.part.type!=="image"?qb:t.part}var wp=V("react/jsx-runtime"),Po=ne(({smooth:t=!0,component:e=Ee.span,render:r,...o},s)=>{let{text:i,status:n}=vp(mp(),t),a={"data-status":n.type,...o,ref:s};return r&&Yr(r)?cp(r,i,a):(0,wp.jsx)(e,{...a,children:i})});Po.displayName="MessagePartPrimitive.Text";var yp=V("react/jsx-runtime"),Oo=ne((t,e)=>{let r=v(4),{image:o}=bp(),s;return r[0]!==e||r[1]!==o||r[2]!==t?(s=(0,yp.jsx)(Ee.img,{src:o,...t,ref:e}),r[0]=e,r[1]=o,r[2]=t,r[3]=s):s=r[3],s});Oo.displayName="MessagePartPrimitive.Image";var ot=t=>{let e=v(2),r=U(void 0),o;return e[0]!==t?(o=s=>{r.current&&(r.current(),r.current=void 0),s&&(r.current=t(s))},e[0]=t,e[1]=o):o=e[1],o};var Sa=(t,e)=>{let r=t.trim().match(/^(\d+(?:\.\d+)?|\.\d+)(em|px|rem)$/);if(!r)return Number.POSITIVE_INFINITY;let o=Number(r[1]),s=r[2];return s==="px"?o:s==="em"?o*(parseFloat(getComputedStyle(e).fontSize)||16):s==="rem"?o*(parseFloat(getComputedStyle(document.documentElement).fontSize)||16):Number.POSITIVE_INFINITY},xp=t=>t.dataset.messageId,_p=()=>{let t=document.createElement("div");return t.dataset.auiTopAnchorReserve="",t.style.height="0px",t.style.flexShrink="0",t.style.pointerEvents="none",t.setAttribute("aria-hidden","true"),t},ki=(t,e)=>{let r=`${e}px`;return t.style.height!==r?(t.style.height=r,!0):!1},Ta=t=>{let e=window.devicePixelRatio||1;return Math.round(t*e)/e};var Do=V("react/jsx-runtime");var Sp=()=>{let t=v(4),e=q(),r;t[0]!==e.message?(r=()=>e.message,t[0]=e.message,t[1]=r):r=t[1];let o=P(r),s;return t[2]!==o?(s=i=>{let n=!0,a=()=>{o.setIsHovering(!0)},l=()=>{o.setIsHovering(!1)};return i.addEventListener("mouseenter",a),i.addEventListener("mouseleave",l),i.matches(":hover")&&queueMicrotask(()=>{n&&o.setIsHovering(!0)}),()=>{n=!1,i.removeEventListener("mouseenter",a),i.removeEventListener("mouseleave",l),o.setIsHovering(!1)}},t[2]=o,t[3]=s):s=t[3],ot(s)},Wb=()=>{let t=v(2),e=Ue(Zb),r;return t[0]!==e?(r=o=>o.message.role==="user"&&o.message.index>0&&o.message.index===o.thread.messages.length-2&&o.thread.messages.at(-1)?.role==="assistant"&&(o.message.id===e||o.thread.isRunning),t[0]=e,t[1]=r):r=t[1],P(r)},Kb=()=>{let t=v(2),e=Ue(ew),r;return t[0]!==e?(r=o=>o.message.isLast&&o.message.role==="assistant"&&o.message.index>=1&&o.thread.messages.at(o.message.index-1)?.role==="user"&&(o.message.id===e||o.thread.isRunning),t[0]=e,t[1]=r):r=t[1],P(r)},Jb=(t,e)=>{let r=v(3),o;return r[0]!==t||r[1]!==e?(o=s=>{if(t)return e.getState().registerAnchorElement(s)},r[0]=t,r[1]=e,r[2]=o):o=r[2],ot(o)},Qb=t=>{let e=v(3),{active:r,threadViewportStore:o}=t,s;return e[0]!==r||e[1]!==o?(s=i=>{if(!r)return;let n=o.getState(),a=n.topAnchorMessageClamp;return n.registerAnchorTargetElement(i,{tallerThan:Sa(a.tallerThan,i),visibleHeight:Sa(a.visibleHeight,i)})},e[0]=r,e[1]=o,e[2]=s):s=e[2],ot(s)},Yb=t=>{let e=v(7),r,o;e[0]!==t?({forwardedRef:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let s=Sp(),i=Ce(r,s),n=P(tw),a;return e[3]!==n||e[4]!==o||e[5]!==i?(a=(0,Do.jsx)(Ee.div,{...o,ref:i,"data-message-id":n}),e[3]=n,e[4]=o,e[5]=i,e[6]=a):a=e[6],a},Xb=t=>{let e=v(13),r,o,s;e[0]!==t?({forwardedRef:r,threadViewportStore:s,...o}=t,e[0]=t,e[1]=r,e[2]=o,e[3]=s):(r=e[1],o=e[2],s=e[3]);let i=Sp(),n=Wb(),a=Kb(),l=Jb(n,s),c;e[4]!==a||e[5]!==s?(c={active:a,threadViewportStore:s},e[4]=a,e[5]=s,e[6]=c):c=e[6];let d=Qb(c),u=Ce(r,i,l,d),m=P(rw),p=n?"":void 0,f=a?"":void 0,g;return e[7]!==m||e[8]!==o||e[9]!==u||e[10]!==p||e[11]!==f?(g=(0,Do.jsx)(Ee.div,{...o,ref:u,"data-message-id":m,"data-aui-top-anchor-user":p,"data-aui-top-anchor-target":f}),e[7]=m,e[8]=o,e[9]=u,e[10]=p,e[11]=f,e[12]=g):g=e[12],g},ka=ne((t,e)=>{let r=v(7),o=ze();if(o.getState().turnAnchor==="top"){let i;return r[0]!==e||r[1]!==t||r[2]!==o?(i=(0,Do.jsx)(Xb,{...t,forwardedRef:e,threadViewportStore:o}),r[0]=e,r[1]=t,r[2]=o,r[3]=i):i=r[3],i}let s;return r[4]!==e||r[5]!==t?(s=(0,Do.jsx)(Yb,{...t,forwardedRef:e}),r[4]=e,r[5]=t,r[6]=s):s=r[6],s});ka.displayName="MessagePrimitive.Root";function Zb(t){return t.topAnchorTurn?.anchorId}function ew(t){return t.topAnchorTurn?.targetId}function tw(t){return t.message.id}function rw(t){return t.message.id}var Dt=V("react/jsx-runtime"),Ia={...tt,Text:()=>(0,Dt.jsxs)("p",{style:{whiteSpace:"pre-line"},children:[(0,Dt.jsx)(Po,{}),(0,Dt.jsx)(hr,{children:(0,Dt.jsx)("span",{style:{fontFamily:"revert"},children:" \u25CF"})})]}),Image:()=>(0,Dt.jsx)(Oo,{})},Ii=t=>{let e=v(10);if("children"in t){let a;return e[0]!==t.children?(a=(0,Dt.jsx)(ko,{children:t.children}),e[0]=t.children,e[1]=a):a=e[1],a}let r,o;e[2]!==t?({components:r,...o}=t,e[2]=t,e[3]=r,e[4]=o):(r=e[3],o=e[4]);let s;e[5]!==r?(s=r?{...r,Text:r.Text??Ia.Text,Image:r.Image??Ia.Image}:Ia,e[5]=r,e[6]=s):s=e[6];let i=s,n;return e[7]!==o||e[8]!==i?(n=(0,Dt.jsx)(ko,{components:i,...o}),e[7]=o,e[8]=i,e[9]=n):n=e[9],n};Ii.displayName="MessagePrimitive.Parts";var ow=t=>{let e=v(12),r;return e[0]!==t.assistant||e[1]!==t.copied||e[2]!==t.hasAttachments||e[3]!==t.hasBranches||e[4]!==t.hasContent||e[5]!==t.last||e[6]!==t.lastOrHover||e[7]!==t.speaking||e[8]!==t.submittedFeedback||e[9]!==t.system||e[10]!==t.user?(r=o=>{let{role:s,attachments:i,parts:n,branchCount:a,isLast:l,speech:c,isCopied:d,isHovering:u}=o.message;return!(t.hasBranches===!0&&a<2||t.user===!0&&s!=="user"||t.user===!1&&s==="user"||t.assistant===!0&&s!=="assistant"||t.assistant===!1&&s==="assistant"||t.system===!0&&s!=="system"||t.system===!1&&s==="system"||t.lastOrHover===!0&&!u&&!l||t.last!==void 0&&t.last!==l||t.copied===!0&&!d||t.copied===!1&&d||t.speaking===!0&&c==null||t.speaking===!1&&c!=null||t.hasAttachments===!0&&(s!=="user"||!i?.length)||t.hasAttachments===!1&&s==="user"&&i?.length||t.hasContent===!0&&n.length===0||t.hasContent===!1&&n.length>0||t.submittedFeedback!==void 0&&(o.message.metadata.submittedFeedback?.type??null)!==t.submittedFeedback)},e[0]=t.assistant,e[1]=t.copied,e[2]=t.hasAttachments,e[3]=t.hasBranches,e[4]=t.hasContent,e[5]=t.last,e[6]=t.lastOrHover,e[7]=t.speaking,e[8]=t.submittedFeedback,e[9]=t.system,e[10]=t.user,e[11]=r):r=e[11],P(r)},Ca=t=>{let e=v(3),r,o;return e[0]!==t?({children:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]),ow(o)?r:null};Ca.displayName="MessagePrimitive.If";var Ea=t=>{let{children:e}=t;return da()!==void 0?e:null};Ea.displayName="MessagePrimitive.Error";var X=V("react/jsx-runtime"),sw=t=>{let e=new Map;for(let o=0;o<t.length;o++){let s=t[o]?.parentId??o,i=e.get(s)??[];i.push(o),e.set(s,i)}let r=[];for(let[o,s]of e){let i=typeof o=="string"?o:void 0;r.push({groupKey:i,indices:s})}return r},iw=t=>{let e=v(4),r=P(fw),o;e:{if(r.length===0){let i;e[0]===Symbol.for("react.memo_cache_sentinel")?(i=[],e[0]=i):i=e[0],o=i;break e}let s;e[1]!==t||e[2]!==r?(s=t(r),e[1]=t,e[2]=r,e[3]=s):s=e[3],o=s}return o},nw=t=>{let e=v(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let s;e[3]!==r||e[4]!==o.toolName?(s=a=>a.tools.toolUIs[o.toolName]?.[0]?.render??r,e[3]=r,e[4]=o.toolName,e[5]=s):s=e[5];let i=P(s);if(!i)return null;let n;return e[6]!==i||e[7]!==o?(n=(0,X.jsx)(i,{...o}),e[6]=i,e[7]=o,e[8]=n):n=e[8],n},aw=t=>{let e=v(9),r,o;e[0]!==t?({Fallback:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let s;e[3]!==r||e[4]!==o.name?(s=a=>{let l=a.dataRenderers.renderers[o.name]?.[0];return l||(a.dataRenderers.fallbacks[0]??r)},e[3]=r,e[4]=o.name,e[5]=s):s=e[5];let i=P(s);if(!i)return null;let n;return e[6]!==i||e[7]!==o?(n=(0,X.jsx)(i,{...o}),e[6]=i,e[7]=o,e[8]=n):n=e[8],n},Jt={Text:()=>(0,X.jsxs)("p",{style:{whiteSpace:"pre-line"},children:[(0,X.jsx)(Po,{}),(0,X.jsx)(hr,{children:(0,X.jsx)("span",{style:{fontFamily:"revert"},children:" \u25CF"})})]}),Reasoning:()=>null,Source:()=>null,Image:()=>(0,X.jsx)(Oo,{}),File:()=>null,Unstable_Audio:()=>null,Group:({children:t})=>t},lw=t=>{let e=v(50),{components:r}=t,o;e[0]!==r?(o=r===void 0?{}:r,e[0]=r,e[1]=o):o=e[1];let{Text:s,Reasoning:i,Image:n,Source:a,File:l,Unstable_Audio:c,tools:d,data:u}=o,m=s===void 0?Jt.Text:s,p=i===void 0?Jt.Reasoning:i,f=n===void 0?Jt.Image:n,g=a===void 0?Jt.Source:a,b=l===void 0?Jt.File:l,x=c===void 0?Jt.Unstable_Audio:c,w;e[2]!==d?(w=d===void 0?{}:d,e[2]=d,e[3]=w):w=e[3];let S=w,T=q(),I=P(gw),C=I.type;if(C==="tool-call"){let R=T.part.addToolResult,_=T.part.resumeToolCall,M=T.part.respondToToolApproval,D=T.part.unstable_recordInteraction;if("Override"in S){let Y;e[4]!==D?(Y=D&&{unstable_recordInteraction:D},e[4]=D,e[5]=Y):Y=e[5];let G;return e[6]!==R||e[7]!==I||e[8]!==M||e[9]!==_||e[10]!==Y||e[11]!==S.Override?(G=(0,X.jsx)(S.Override,{...I,addResult:R,resume:_,respondToApproval:M,...Y}),e[6]=R,e[7]=I,e[8]=M,e[9]=_,e[10]=Y,e[11]=S.Override,e[12]=G):G=e[12],G}let O;e[13]!==I.toolName||e[14]!==S.Fallback||e[15]!==S.by_name?(O=(S.by_name&&Object.hasOwn(S.by_name,I.toolName)?S.by_name[I.toolName]:void 0)??S.Fallback,e[13]=I.toolName,e[14]=S.Fallback,e[15]=S.by_name,e[16]=O):O=e[16];let B=O,W;e[17]!==D?(W=D&&{unstable_recordInteraction:D},e[17]=D,e[18]=W):W=e[18];let z;return e[19]!==B||e[20]!==R||e[21]!==I||e[22]!==M||e[23]!==_||e[24]!==W?(z=(0,X.jsx)(nw,{...I,Fallback:B,addResult:R,resume:_,respondToApproval:M,...W}),e[19]=B,e[20]=R,e[21]=I,e[22]=M,e[23]=_,e[24]=W,e[25]=z):z=e[25],z}if(I.status?.type==="requires-action")throw new Error("Encountered unexpected requires-action status");switch(C){case"text":{let R;return e[26]!==m||e[27]!==I?(R=(0,X.jsx)(m,{...I}),e[26]=m,e[27]=I,e[28]=R):R=e[28],R}case"reasoning":{let R;return e[29]!==p||e[30]!==I?(R=(0,X.jsx)(p,{...I}),e[29]=p,e[30]=I,e[31]=R):R=e[31],R}case"source":{let R;return e[32]!==g||e[33]!==I?(R=(0,X.jsx)(g,{...I}),e[32]=g,e[33]=I,e[34]=R):R=e[34],R}case"image":{let R;return e[35]!==f||e[36]!==I?(R=(0,X.jsx)(f,{...I}),e[35]=f,e[36]=I,e[37]=R):R=e[37],R}case"file":{let R;return e[38]!==b||e[39]!==I?(R=(0,X.jsx)(b,{...I}),e[38]=b,e[39]=I,e[40]=R):R=e[40],R}case"audio":{let R;return e[41]!==x||e[42]!==I?(R=(0,X.jsx)(x,{...I}),e[41]=x,e[42]=I,e[43]=R):R=e[43],R}case"data":{let R;e[44]!==u||e[45]!==I.name?(R=(u?.by_name&&Object.hasOwn(u.by_name,I.name)?u.by_name[I.name]:void 0)??u?.Fallback,e[44]=u,e[45]=I.name,e[46]=R):R=e[46];let _=R,M;return e[47]!==_||e[48]!==I?(M=(0,X.jsx)(aw,{...I,Fallback:_}),e[47]=_,e[48]=I,e[49]=M):M=e[49],M}default:return console.warn(`Unknown message part type: ${C}`),null}},cw=t=>{let e=v(5),{partIndex:r,components:o}=t,s;e[0]!==o?(s=(0,X.jsx)(lw,{components:o}),e[0]=o,e[1]=s):s=e[1];let i;return e[2]!==r||e[3]!==s?(i=(0,X.jsx)(dr,{index:r,children:s}),e[2]=r,e[3]=s,e[4]=i):i=e[4],i},dw=se(cw,(t,e)=>t.partIndex===e.partIndex&&t.components?.Text===e.components?.Text&&t.components?.Reasoning===e.components?.Reasoning&&t.components?.Source===e.components?.Source&&t.components?.Image===e.components?.Image&&t.components?.File===e.components?.File&&t.components?.Unstable_Audio===e.components?.Unstable_Audio&&t.components?.tools===e.components?.tools&&t.components?.data===e.components?.data&&t.components?.Group===e.components?.Group),uw=t=>{let e=v(6),{status:r,component:o}=t,s=r.type==="running",i;e[0]!==o||e[1]!==r?(i=(0,X.jsx)(o,{type:"text",text:"",status:r}),e[0]=o,e[1]=r,e[2]=i):i=e[2];let n;return e[3]!==s||e[4]!==i?(n=(0,X.jsx)(ur,{text:"",isRunning:s,children:i}),e[3]=s,e[4]=i,e[5]=n):n=e[5],n},pw=Object.freeze({type:"complete"}),mw=t=>{let e=v(6),{components:r}=t,o=P(vw);if(r?.Empty){let n;return e[0]!==r.Empty||e[1]!==o?(n=(0,X.jsx)(r.Empty,{status:o}),e[0]=r.Empty,e[1]=o,e[2]=n):n=e[2],n}let s=r?.Text??Jt.Text,i;return e[3]!==o||e[4]!==s?(i=(0,X.jsx)(uw,{status:o,component:s}),e[3]=o,e[4]=s,e[5]=i):i=e[5],i},hw=se(mw,(t,e)=>t.components?.Empty===e.components?.Empty&&t.components?.Text===e.components?.Text),Ci=t=>{let e=v(9),{groupingFunction:r,components:o}=t,s=P(bw),i=iw(r),n;e:{if(s===0){let d;e[0]!==o?(d=(0,X.jsx)(hw,{components:o}),e[0]=o,e[1]=d):d=e[1],n=d;break e}let c;if(e[2]!==o||e[3]!==i){let d;e[5]!==o?(d=(u,m)=>{let p=o?.Group??Jt.Group;return(0,X.jsx)(p,{groupKey:u.groupKey,indices:u.indices,children:u.indices.map(f=>(0,X.jsx)(dw,{partIndex:f,components:o},f))},`group-${m}-${u.groupKey??"ungrouped"}`)},e[5]=o,e[6]=d):d=e[6],c=i.map(d),e[2]=o,e[3]=i,e[4]=c}else c=e[4];n=c}let a=n,l;return e[7]!==a?(l=(0,X.jsx)(X.Fragment,{children:a}),e[7]=a,e[8]=l):l=e[8],l};Ci.displayName="MessagePrimitive.Unstable_PartsGrouped";var Ra=t=>{let e=v(6),r,o;e[0]!==t?({components:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]);let s;return e[3]!==r||e[4]!==o?(s=(0,X.jsx)(Ci,{...o,components:r,groupingFunction:sw}),e[3]=r,e[4]=o,e[5]=s):s=e[5],s};Ra.displayName="MessagePrimitive.Unstable_PartsGroupedByParentId";function fw(t){return t.message.parts}function gw(t){return t.part}function vw(t){return t.message.status??pw}function bw(t){return t.message.parts.length}var Ur=xi({AttachmentByIndex:()=>Io,Attachments:()=>Co,Content:()=>Ii,Error:()=>Ea,GenerativeUI:()=>ci,GroupedParts:()=>di,If:()=>Ca,PartByIndex:()=>Gt,Parts:()=>Ii,Quote:()=>pi,Root:()=>ka,Unstable_PartsGrouped:()=>Ci,Unstable_PartsGroupedByParentId:()=>Ra});var Tp=t=>{let e=v(2),r=Kt(t),o;return e[0]!==r?(o=s=>{let i=new ResizeObserver(()=>{r()}),n=new MutationObserver(a=>{a.some(ww)&&r()});return i.observe(s),n.observe(s,{childList:!0,subtree:!0,attributes:!0,characterData:!0}),()=>{i.disconnect(),n.disconnect()}},e[0]=r,e[1]=o):o=e[1],ot(o)};function ww(t){return t.type!=="attributes"||t.attributeName!=="style"}var yw=new Set(["Enter"," "]),xw=["textarea","select","[contenteditable]:not([contenteditable='false'])","input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']):not([type='reset']):not([type='image']):not([type='range']):not([type='file']):not([type='color'])"].join(", "),kp=({autoScroll:t,scrollToBottomOnRunStart:e=!0,scrollToBottomOnInitialize:r=!0,scrollToBottomOnThreadSwitch:o=!0})=>{let s=U(null),i=P(_=>_.thread.messages.length>0),n=P(_=>_.thread.isRunning),a=U(!1),l=U(null),c=ze();t===void 0&&(t=c.getState().turnAnchor!=="top");let d=U(0),u=U(0),m=U(0),p=U(0),f=U(null),g=U(t),b=U(t);We(()=>{let _=b.current;if(b.current=t,_||!t)return;let M=s.current;g.current=M!==null&&Ts(M)},[t]);let x=Ft(_=>{let M=s.current;M&&(g.current=!0,f.current=_,M.scrollTo({top:M.scrollHeight,behavior:_}))},[]),w=Ft(()=>{l.current!==null&&(cancelAnimationFrame(l.current),l.current=null)},[]),S=Ft(_=>{f.current=_,w(),l.current=requestAnimationFrame(()=>{l.current=null,x(_)})},[w,x]);We(()=>()=>w(),[w]);let T=Ft(()=>{let _=c.getState();return _.turnAnchor==="top"&&_.element.viewport===s.current&&_.element.anchor!==null},[c]),I=()=>{let _=s.current;if(!_)return;let M=c.getState().isAtBottom,D=Ts(_);if(!(!D&&d.current<_.scrollTop)){let O=gn({scrollTop:d.current,scrollHeight:u.current},_);D?(fn(_)&&(f.current=null),t&&(g.current=!0)):O&&(w(),f.current=null,g.current=!1),(D||f.current===null)&&D!==M&&fr(c).setState({isAtBottom:D})}d.current=_.scrollTop,u.current=_.scrollHeight},C=Tp(()=>{let _=s.current;if(!_)return;let{scrollHeight:M,clientHeight:D}=_;if(M===m.current&&D===p.current)return;m.current=M,p.current=D;let O=f.current;O&&T()?f.current=null:O?x(O):t&&!(n&&T())&&g.current&&x("instant"),I()}),R=ot(_=>{let M=()=>{w(),f.current=null},D=O=>{yw.has(O.key)&&(O.target?.closest?.(xw)||M())};return _.addEventListener("scroll",I),_.addEventListener("pointerdown",M),_.addEventListener("keydown",D),()=>{_.removeEventListener("scroll",I),_.removeEventListener("pointerdown",M),_.removeEventListener("keydown",D)}});return We(()=>{if(r){if(!i){a.current=!1;return}a.current||(a.current=!0,f.current===null&&S("instant"))}},[i,S,r]),up(({behavior:_})=>{x(_)}),Ks("thread.runStart",()=>{e&&c.getState().turnAnchor!=="top"&&S("auto")}),Ks("threads.selectionChanged",()=>{o&&S("instant")}),Ce(C,R,s)};var Ip=ae(void 0);var Aa=V("react/jsx-runtime");var Cp=new WeakMap,Ma=ne((t,e)=>{let r=v(9),o=q(),s=U(null),i=Ce(e,s),n;r[0]!==t?(n=u=>{u.key==="Escape"&&s.current&&Cp.set(u.nativeEvent,s.current),t.onKeyDown?.(u)},r[0]=t,r[1]=n):n=r[1];let a=n,l,c;r[2]!==o?(l=()=>{let u=m=>{if(m.key!=="Escape"||m.defaultPrevented||o.thread.source===null)return;let p=Cp.get(m)??m.composedPath().find(_w);if(!(p&&p!==s.current)&&o.thread.getState().speech!=null){m.preventDefault();try{o.thread.stopSpeaking()}catch(f){let g=f;if(!(g instanceof Error)||g.message!=="No message is being spoken")throw g}}};return document.addEventListener("keydown",u),()=>{document.removeEventListener("keydown",u)}},c=[o],r[2]=o,r[3]=l,r[4]=c):(l=r[3],c=r[4]),N(l,c);let d;return r[5]!==i||r[6]!==a||r[7]!==t?(d=(0,Aa.jsx)(Ip.Provider,{value:s,children:(0,Aa.jsx)(Ee.div,{...t,"data-aui-thread-root":"",ref:i,onKeyDown:a})}),r[5]=i,r[6]=a,r[7]=t,r[8]=d):d=r[8],d});Ma.displayName="ThreadPrimitive.Root";function _w(t){return t instanceof Element&&t.hasAttribute("data-aui-thread-root")}var Pa=t=>{let{children:e}=t;return P(Sw)?e:null};Pa.displayName="ThreadPrimitive.Empty";function Sw(t){return t.thread.isEmpty}var Tw=t=>{let e=v(4),r;return e[0]!==t.disabled||e[1]!==t.empty||e[2]!==t.running?(r=o=>!(t.empty===!0&&!o.thread.isEmpty||t.empty===!1&&o.thread.isEmpty||t.running===!0&&!o.thread.isRunning||t.running===!1&&o.thread.isRunning||t.disabled===!0&&!o.thread.isDisabled||t.disabled===!1&&o.thread.isDisabled),e[0]=t.disabled,e[1]=t.empty,e[2]=t.running,e[3]=r):r=e[3],P(r)},Oa=t=>{let e=v(3),r,o;return e[0]!==t?({children:r,...o}=t,e[0]=t,e[1]=r,e[2]=o):(r=e[1],o=e[2]),Tw(o)?r:null};Oa.displayName="ThreadPrimitive.If";var Ei=(t,e)=>{let r=v(3),o;return r[0]!==e||r[1]!==t?(o=s=>{if(!t)return;let i=t(),n=()=>{let l=e?e(s):s.offsetHeight;i.setHeight(l)},a=new ResizeObserver(n);return a.observe(s),n(),()=>{a.disconnect(),i.unregister()}},r[0]=e,r[1]=t,r[2]=o):o=r[2],ot(o)};var Ep=t=>{let e=0,r=t;for(;r;)e+=r.offsetTop,r=r.offsetParent;return e},kw=(t,e)=>{let r=0,o=t;for(;o&&o!==e;)r+=o.offsetTop,o=o.offsetParent;return o===e?r:Ep(t)-Ep(e)},Da=({viewport:t,anchor:e,tallerThan:r,visibleHeight:o})=>{let s=kw(e,t),i=e.offsetHeight;return s+Math.max(0,i-(i<=r?i:o))},Iw=({scrollHeight:t,...e})=>{let{viewport:r}=e,o=Da(e)+r.clientHeight;return Math.max(0,o-t)},Rp=({viewport:t,reserve:e,...r})=>Iw({viewport:t,...r,scrollHeight:t.scrollHeight-e.offsetHeight});var Ap=t=>{let e=new ResizeObserver(t),r=new MutationObserver(t),o=null,s=null,i=null,n=()=>{e.disconnect(),r.disconnect(),o=null,s=null,i=null};return{target:(a,l,c)=>{o===a&&s===l&&i===c||(n(),e.observe(a),e.observe(l),e.observe(c),r.observe(c,{childList:!0,subtree:!0,characterData:!0}),o=a,s=l,i=c)},disconnect:n}};var Cw=t=>{let e=null;return{schedule:()=>{e===null&&(e=requestAnimationFrame(()=>{e=null,t()}))},cancel:()=>{e!==null&&(cancelAnimationFrame(e),e=null)}}},Mp=t=>{let e=null,r,o=null,s=0,i=null,n=!1,a=null,l=()=>{i=null,a=null},c=()=>a!==null&&Math.abs(s-a)<=1,d=()=>{let b=o;if(!b)return;let x=b.scrollTop,w=Math.max(0,b.scrollHeight-b.clientHeight);x<s&&s>w+1&&Math.abs(x-w)<=1&&c()&&!n&&(i??(i=s),p.schedule()),s=x},u=b=>{o!==b&&(o&&o.removeEventListener("scroll",d),o=b,n=!1,l(),b&&(b.addEventListener("scroll",d,{passive:!0}),s=b.scrollTop))};function m(){let b=t.getState(),{viewport:x,anchor:w,target:S}=b.element,T=b.targetConfig;if(u(b.turnAnchor==="top"?x:null),b.turnAnchor!=="top"||!x){f.disconnect(),l(),e&&(ki(e,0),e.remove());return}if(!w&&!S&&!T&&b.topAnchorTurn){f.disconnect(),l(),e?.parentElement&&e.parentElement.lastElementChild!==e&&e.parentElement.append(e);return}if(!w||!S||!T){f.disconnect(),l(),e&&(ki(e,0),e.remove());return}if(e??(e=_p()),(e.parentElement!==S.parentElement||e.previousElementSibling!==S)&&S.after(e),f.target(x,w,S),ki(e,Rp({viewport:x,anchor:w,reserve:e,...T}))){p.schedule();return}let I=xp(w),C=Ta(Da({viewport:x,anchor:w,...T}));if(I===void 0||I!==r)i=null,n=!1,Math.abs(x.scrollTop-C)>1&&x.scrollTo({top:C,behavior:"smooth"}),I!==void 0&&(r=I);else if(i!==null&&a!==null){let R=Ta(i+(C-a));i=null,n=!0,Math.abs(x.scrollTop-R)>1&&x.scrollTo({top:R,behavior:"instant"})}a=C}let p=Cw(m),f=Ap(p.schedule);p.schedule();let g=t.subscribe(p.schedule);return()=>{p.cancel(),g(),f.disconnect(),u(null),e?.remove()}};var Pp=t=>{let e=v(4),r=ze(),o,s;e[0]!==t||e[1]!==r?(o=()=>{if(t)return Mp(r)},s=[t,r],e[0]=t,e[1]=r,e[2]=o,e[3]=s):(o=e[2],s=e[3]),We(o,s)};var Op=(t,e)=>{if(!t)return!1;let r=e.findIndex(o=>o.id===t.targetId);return r<1?!1:e[r-1]?.id===t.anchorId&&e.slice(r+1).every(o=>o.role==="user")},Dp=({isRunning:t,messages:e})=>{if(!t)return null;let r=e.at(-1),o=e.at(-2);return o?.role!=="user"||r?.role!=="assistant"?null:{anchorId:o.id,targetId:r.id}},Np=t=>Dp(t)?.anchorId,Bp=t=>Dp(t)?.targetId;var Ri=V("react/jsx-runtime");var Ew=()=>{let t=Ue(Mw);return Ei(t,Pw)},Rw=()=>{let t=Ue(Ow);return ot(t)},Aw=t=>{let e=v(19),r=ze(),o;e[0]!==t?(o=b=>{if(t)return Np(b.thread)},e[0]=t,e[1]=o):o=e[1];let s=P(o),i;e[2]!==t?(i=b=>{if(t)return Bp(b.thread)},e[2]=t,e[3]=i):i=e[3];let n=P(i),a=Ue(Dw),l;e:{if(!s||!n){l=null;break e}let b;e[4]!==s||e[5]!==n?(b={anchorId:s,targetId:n},e[4]=s,e[5]=n,e[6]=b):b=e[6],l=b}let c=l,d;e[7]!==t||e[8]!==a?(d=b=>t&&!!a&&Op(a,b.thread.messages),e[7]=t,e[8]=a,e[9]=d):d=e[9];let u=P(d),m,p;e[10]!==r||e[11]!==a||e[12]!==u?(m=()=>{!a||u||r.getState().setTopAnchorTurn(null)},p=[r,a,u],e[10]=r,e[11]=a,e[12]=u,e[13]=m,e[14]=p):(m=e[13],p=e[14]),We(m,p);let f,g;e[15]!==c||e[16]!==r?(f=()=>{if(!c)return;let b=r.getState(),x=b.topAnchorTurn;x?.anchorId===c.anchorId&&x.targetId===c.targetId||b.setTopAnchorTurn(c)},g=[c,r],e[15]=c,e[16]=r,e[17]=f,e[18]=g):(f=e[17],g=e[18]),We(f,g)},Lp=ne((t,e)=>{let r=v(18),o,s,i,n,a,l;r[0]!==t?({autoScroll:o,scrollToBottomOnRunStart:a,scrollToBottomOnInitialize:n,scrollToBottomOnThreadSwitch:l,children:s,...i}=t,r[0]=t,r[1]=o,r[2]=s,r[3]=i,r[4]=n,r[5]=a,r[6]=l):(o=r[1],s=r[2],i=r[3],n=r[4],a=r[5],l=r[6]);let c;r[7]!==o||r[8]!==n||r[9]!==a||r[10]!==l?(c={autoScroll:o,scrollToBottomOnRunStart:a,scrollToBottomOnInitialize:n,scrollToBottomOnThreadSwitch:l},r[7]=o,r[8]=n,r[9]=a,r[10]=l,r[11]=c):c=r[11];let d=kp(c),u=Ew(),m=Rw(),p=ze(),f;r[12]!==p?(f=p.getState(),r[12]=p,r[13]=f):f=r[13];let g=f.turnAnchor==="top";Aw(g),Pp(g);let b=Ce(e,d,u,m),x;return r[14]!==s||r[15]!==b||r[16]!==i?(x=(0,Ri.jsx)(Ee.div,{...i,ref:b,children:s}),r[14]=s,r[15]=b,r[16]=i,r[17]=x):x=r[17],x});Lp.displayName="ThreadPrimitive.ViewportScrollable";var Na=ne((t,e)=>{let r=v(13),o,s,i;r[0]!==t?({turnAnchor:i,topAnchorMessageClamp:s,...o}=t,r[0]=t,r[1]=o,r[2]=s,r[3]=i):(o=r[1],s=r[2],i=r[3]);let n;r[4]!==s||r[5]!==i?(n={turnAnchor:i,topAnchorMessageClamp:s},r[4]=s,r[5]=i,r[6]=n):n=r[6];let a;r[7]!==o||r[8]!==e?(a=(0,Ri.jsx)(Lp,{...o,ref:e}),r[7]=o,r[8]=e,r[9]=a):a=r[9];let l;return r[10]!==n||r[11]!==a?(l=(0,Ri.jsx)(jr,{options:n,children:a}),r[10]=n,r[11]=a,r[12]=l):l=r[12],l});Na.displayName="ThreadPrimitive.Viewport";function Mw(t){return t.registerViewport}function Pw(t){return t.clientHeight}function Ow(t){return t.registerViewportElement}function Dw(t){return t.topAnchorTurn}var $p=V("react/jsx-runtime");var Ba=ne((t,e)=>{let r=v(3),o=Ue(Nw),s=Ei(o,Bw),i=Ce(e,s),n;return r[0]!==t||r[1]!==i?(n=(0,$p.jsx)(Ee.div,{...t,ref:i}),r[0]=t,r[1]=i,r[2]=n):n=r[2],n});Ba.displayName="ThreadPrimitive.ViewportFooter";function Nw(t){return t.registerContentInset}function Bw(t){let e=parseFloat(getComputedStyle(t).marginTop)||0;return t.offsetHeight+e}var Lw=t=>{let e=v(5),r;e[0]!==t?(r=t===void 0?{}:t,e[0]=t,e[1]=r):r=e[1];let{behavior:o}=r,s=Ue($w),i=ze(),n;e[2]!==o||e[3]!==i?(n=()=>{i.getState().scrollToBottom({behavior:o})},e[2]=o,e[3]=i,e[4]=n):n=e[4];let a=n;return s?null:a},jp=Si("ThreadPrimitive.ScrollToBottom",Lw,["behavior"]);function $w(t){return t.isAtBottom}var jw=t=>{let e=v(4),{prompt:r,send:o,clearComposer:s,autoSend:i}=t,n=o??i??!1,a;e[0]!==s||e[1]!==r||e[2]!==n?(a={prompt:r,send:n,clearComposer:s},e[0]=s,e[1]=r,e[2]=n,e[3]=a):a=e[3];let{disabled:l,trigger:c}=ca(a);return l?null:c},Fp=Si("ThreadPrimitive.Suggestion",jw,["prompt","send","clearComposer","autoSend","method"]);var zr=xi({Empty:()=>Pa,If:()=>Oa,MessageByIndex:()=>_o,Messages:()=>ai,Root:()=>Ma,ScrollToBottom:()=>jp,Suggestion:()=>Fp,SuggestionByIndex:()=>Eo,Suggestions:()=>hi,Unstable_MessageById:()=>So,Viewport:()=>Na,ViewportFooter:()=>Ba,ViewportProvider:()=>jr});var La=[{id:"allow-once",kind:"allow-once",label:"Allow once"},{id:"reject-once",kind:"reject-once",label:"Reject"}];function Vp(t){let e=t.reason===void 0||t.reason===""?`${t.toolName} needs approval`:t.reason;return{id:t.id,prompt:e,display:"decision",options:La.map(r=>({...r}))}}function Up(t){if(t.optionId!==void 0){let e=La.find(r=>r.id===t.optionId);if(e===void 0)throw new Error(`unknown approval option ${JSON.stringify(t.optionId)} \u2014 this dashboard offers ${La.map(r=>r.id).join(", ")}`);return e.kind==="allow-once"?"allowed-once":"rejected"}if(t.approved===void 0)throw new Error("approval response carried neither an optionId nor an approved flag");return t.approved?"allowed-once":"rejected"}function zp(t){if(t==="unavailable")return"expired";if(t==="cancelled")return"cancelled"}function Hp(t){if(!t.ok)throw new Error(t.error.message)}var No={"review-risky":{label:"Review at risky steps",detail:"Reads never interrupt. A write is reviewed when the loop has no confidence to judge it.",policies:{read:"auto",glob:"auto",grep:"auto",edit:"auto-if-confident",write:"auto-if-confident",bash:"auto-if-confident"}},"approve-every-step":{label:"Approve every step",detail:"Every write, edit and shell command waits for you. Nothing changes without a click.",policies:{read:"auto",glob:"auto",grep:"auto",edit:"always-approve",write:"always-approve",bash:"always-approve"}},"never-ask":{label:"Never ask (gate off)",detail:"Writes, edits and shell commands run with no approval. Reads never interrupt either.",policies:{read:"auto",glob:"auto",grep:"auto",edit:"auto",write:"auto",bash:"auto"}}};function qp(t){let e=$a(t);return Gp.filter(o=>o!=="read"&&o!=="glob"&&o!=="grep").filter(o=>t?.[o]==="auto").length===0||e==="never-ask"?"":" \u2014 mixed with the fields below"}function $a(t){let e=Gp.filter(s=>s!=="read"&&s!=="glob"&&s!=="grep");return e.filter(s=>t?.[s]==="auto").length===e.length?"never-ask":e.filter(s=>t?.[s]==="always-approve").length===e.length?"approve-every-step":"review-risky"}var Gp=["read","glob","grep","edit","write","bash"];var Fw={"allowed once":"allowed-once",rejected:"rejected",cancelled:"cancelled",expired:"unavailable"};function Wp(t){let e=new Map;for(let r of t){if(r.text===void 0||typeof r.text!="string")continue;let o=/^(allowed once|rejected|cancelled|expired): .+ \[([0-9a-f-]{36})\]$/.exec(r.text);if(o===null)continue;let s=Fw[o[1]];s!==void 0&&e.set(o[2],s)}return e}var y=V("react/jsx-runtime");function Kp(t,e){let r=Vp({id:t.id,toolName:t.toolName,...t.callId===void 0?{}:{callId:t.callId},...t.reason===void 0?{}:{reason:t.reason},...t.runId===void 0?{}:{runId:t.runId},askedAt:t.askedAt});if(e!==void 0){let o=zp(e);o!==void 0?r.resolution=o:r.approved=e==="allowed-once"}return{id:`ask-${t.id}`,role:"assistant",createdAt:new Date(t.askedAt),content:[{type:"tool-call",toolCallId:t.id,toolName:t.toolName,args:{},argsText:"{}",approval:r}]}}function Uw(t){let[e,r]=(0,Q.useState)(void 0);return(0,Q.useEffect)(()=>{let o=!0;return t.status===void 0?()=>{}:(t.status().then(s=>{let i=s.config?.dashboard;o&&r(i?.brief?.enabled===!0)}).catch(()=>{}),()=>{o=!1})},[t]),e}function Jp(t,e,r=Date.now()){return{id:t,role:"user",createdAt:new Date(r),content:[{type:"text",text:e}]}}async function zw(t,e){let r=Up(e),o=e.feedback?.trim()??"";await t.respond(e.approvalId,r,o)}function Hw({node:t}){return t.kind==="heading"?(0,y.jsx)("h3",{className:"brief-heading",children:t.text}):t.kind==="list"?(0,y.jsx)("ul",{className:"brief-list",children:t.items.map((e,r)=>(0,y.jsx)("li",{children:e},r))}):t.kind==="code"?(0,y.jsx)("pre",{className:"brief-code","data-language":t.language,children:t.code}):(0,y.jsx)("p",{className:"brief-para",children:t.text})}function qw({ask:t,briefsOn:e}){return t.briefState==="none"||!e?null:t.briefState==="failed"?(0,y.jsx)("div",{className:"brief-note error",children:"Review brief unavailable \u2014 the approval itself is unaffected."}):t.briefState==="pending"?(0,y.jsx)("div",{className:"brief-note",children:"Writing review brief\u2026"}):(0,y.jsx)("div",{className:"brief",children:(t.brief??[]).map((r,o)=>(0,y.jsx)(Hw,{node:r},o))})}function Gw(t){return new Date(t).toLocaleTimeString()}var Qp=Q.default.createContext({text:"",setText:()=>{},clear:()=>{},commitLocal:()=>{}});function Yp(){return Q.default.useContext(Qp)}var Xp;function Ww(t){let[e,r]=(0,Q.useState)(null),[o,s]=(0,Q.useState)(!1),i=gr.get(t.toolCallId),n=t.approval,a=n?.options??[],l=Yp(),c=(0,Q.useCallback)(m=>{s(!0),r(null),t.respondToApproval({optionId:m}).catch(p=>{r(p instanceof Error?p.message:String(p))}).finally(()=>s(!1))},[t]),d=n?.approved!==void 0||n?.resolution!==void 0,u=l.text.trim();return(0,y.jsxs)("div",{className:"card","aria-busy":o,children:[(0,y.jsxs)("div",{className:"card-top",children:[(0,y.jsx)("span",{className:"eyebrow",children:"Approval required"}),i!==void 0&&(0,y.jsxs)("span",{className:"asked",children:["asked ",Gw(i.askedAt)]})]}),(0,y.jsx)("div",{className:"tool",children:t.toolName}),i!==void 0&&(0,y.jsxs)("div",{className:"meta",children:[(0,y.jsx)("span",{className:"meta-k",children:"run"}),(0,y.jsx)("span",{className:"meta-v",children:i.runId??"agentless"}),i.callId!==void 0&&(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)("span",{className:"meta-k",children:"call"}),(0,y.jsx)("span",{className:"meta-v",children:i.callId})]})]}),n?.prompt!==void 0&&(0,y.jsx)("div",{className:"reason",children:n.prompt}),i!==void 0&&(0,y.jsx)(qw,{ask:i,briefsOn:Xp}),n?.resolution!==void 0&&(0,y.jsx)("div",{className:"brief-note settled",children:n.resolution==="expired"?"Expired \u2014 no answer in time.":"Cancelled \u2014 the ask was withdrawn."}),!d&&(0,y.jsxs)("div",{className:"row actions",children:[a.map(m=>(0,y.jsx)("button",{type:"button",className:m.kind==="allow-once"?"allow":"reject",disabled:o,"aria-busy":o,onClick:()=>c(m.id),children:m.label},m.id)),o&&(0,y.jsx)("span",{className:"busy-note",children:"Submitting\u2026"})]}),!d&&u!==""&&(0,y.jsxs)("div",{className:"feedback-preview","aria-live":"polite",children:["Feedback will be sent with your decision: ",(0,y.jsx)("em",{children:u})]}),e!==null&&(0,y.jsx)("div",{className:"brief-note error",role:"alert",children:e})]})}var gr=new Map,Kw=Math.round(15e3/3);function Jw(t){let[e,r]=(0,Q.useState)(()=>window.__FL_DASHBOARD_SNAPSHOT__??null);return(0,Q.useEffect)(()=>{let o=!0,s=()=>{t.load().then(a=>{o&&r(a)}).catch(()=>{})};s();let i=t.onChange?.(s)??(()=>{}),n=setInterval(s,Kw);return()=>{o=!1,clearInterval(n),i()}},[t]),e}function Qw(t){(0,Q.useEffect)(()=>{let e=document.getElementById("pending-count");e!==null&&(e.textContent=t===0?"idle":`${String(t)} pending`,e.setAttribute("data-count",String(t)))},[t])}function Yw({disabled:t}){let e=Yp();return(0,y.jsx)("form",{className:"hitl-composer-root",onSubmit:o=>{o.preventDefault(),!(t||e.text.trim()==="")&&e.commitLocal()},children:(0,y.jsxs)("div",{className:`hitl-composer-shell${t?" is-disabled":""}`,children:[(0,y.jsx)("textarea",{className:"hitl-composer-input",placeholder:t?"No pending approval \u2014 waiting for the next gate\u2026":"Add response or feedback, then Allow once / Reject \u2014 or send to post feedback into the thread\u2026",rows:2,"aria-label":"Approval response and feedback",disabled:t,value:e.text,onChange:o=>e.setText(o.target.value),onKeyDown:o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),!t&&e.text.trim()!==""&&e.commitLocal())}}),(0,y.jsxs)("div",{className:"hitl-composer-actions",children:[(0,y.jsx)("span",{className:"hitl-composer-hint",children:t?"Composer idle":"Enter posts feedback \xB7 Shift+Enter newline \xB7 buttons decide"}),(0,y.jsx)("button",{type:"submit",className:"hitl-composer-send",disabled:t||e.text.trim()==="","aria-label":"Send feedback",children:(0,y.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none","aria-hidden":"true",children:(0,y.jsx)("path",{d:"M12 19V5M12 5l-6 6M12 5l6 6",stroke:"currentColor",strokeWidth:"2.2",strokeLinecap:"round",strokeLinejoin:"round"})})})]})]})})}function Xw(){return(0,y.jsx)(Ur.Root,{className:"hitl-user-msg","data-role":"user",children:(0,y.jsx)("div",{className:"hitl-user-bubble",children:(0,y.jsx)(Ur.Parts,{})})})}function Zw(){return(0,y.jsx)(Ur.Root,{className:"hitl-assistant-msg","data-role":"assistant",children:(0,y.jsx)(Ur.Parts,{components:{tools:{Override:Ww}}})})}function ey({pending:t,feed:e,source:r,briefsOn:o}){for(let x of t)gr.set(x.id,x);let s=new Set(t.map(x=>x.id));Xp=o;let i=(0,Q.useMemo)(()=>{let x=[];for(let S of e){if(S.kind!=="approval")continue;let T=/^(allowed once|rejected|cancelled|expired): ([\w./-]+)(?: — (.*?))? \[([0-9a-f-]{36})\]$/.exec(S.text);if(T===null)continue;let[,,I,C,R]=T;if(s.has(R))continue;let _=gr.get(R);x.push({id:R,toolName:_?.toolName??I,...C===void 0?{}:{reason:`${I}: ${C}`},..._?.runId===void 0?{}:{runId:_.runId},askedAt:S.t})}let w=x.slice(-12);for(let S of w){let T={id:S.id,toolName:S.toolName,...S.callId===void 0?{}:{callId:S.callId},...S.reason===void 0?{}:{reason:S.reason},...S.runId===void 0?{}:{runId:S.runId},askedAt:S.askedAt,briefState:"none"};gr.has(S.id)||gr.set(S.id,T)}for(let S of[...gr.keys()])!s.has(S)&&!w.some(T=>T.id===S)&&gr.delete(S);return w},[e,s]),[n,a]=(0,Q.useState)([]),[l,c]=(0,Q.useState)(""),d=(0,Q.useRef)(l);d.current=l;let[u,m]=(0,Q.useState)(()=>new Map);(0,Q.useEffect)(()=>{let x=Wp(e);x.size!==0&&m(w=>{let S=new Map;for(let[T,I]of x)S.set(T,I);return S.size===w.size&&[...S].every(([T,I])=>w.get(T)===I)?w:S})},[e]);let p=(0,Q.useMemo)(()=>[...[...t.map(w=>Kp(w,u.get(w.id))),...i.map(w=>Kp(w,u.get(w.id)))],...n].slice(-48),[t,i,n,u]),f=(0,Q.useCallback)(()=>{let x=d.current.trim();x!==""&&a(w=>[...w,Jp(`feedback-${String(Date.now())}`,x)])},[]),g=(0,Q.useMemo)(()=>({text:l,setText:c,clear:()=>{c(""),d.current=""},commitLocal:f}),[l,f]),b=xo({messages:p,isRunning:!1,convertMessage:x=>x,onNew:async()=>{},onRespondToToolApproval:async x=>{let w=d.current.trim();await zw(r,{...x,approvalId:x.approvalId,...w===""?{}:{feedback:w}}),w!==""&&a(S=>{let T=S[S.length-1];return T!==void 0&&T.role==="user"&&Array.isArray(T.content)&&T.content.some(C=>typeof C=="object"&&C!==null&&"text"in C&&C.text===w)?S:[...S,Jp(`feedback-${String(Date.now())}`,w)]}),c(""),d.current=""}});return(0,y.jsx)(Qp.Provider,{value:g,children:(0,y.jsx)(ma,{runtime:b,children:(0,y.jsx)(zr.Root,{className:"hitl-thread-root",style:{"--thread-max-width":"44rem"},children:(0,y.jsxs)(zr.Viewport,{className:"hitl-thread-viewport",turnAnchor:"top",children:[t.length===0&&n.length===0?(0,y.jsxs)("div",{className:"empty empty-plate hitl-welcome",children:[(0,y.jsx)("p",{className:"empty-title",children:"No pending approval requests."}),(0,y.jsx)("p",{className:"hint",children:"When a run reaches a review gate, the ask appears in this thread. Use the composer for response/feedback, then Allow once or Reject."})]}):null,(0,y.jsx)(zr.Messages,{components:{UserMessage:Xw,AssistantMessage:Zw}}),(0,y.jsx)(zr.ViewportFooter,{className:"hitl-thread-footer",children:(0,y.jsx)(Yw,{disabled:t.length===0})})]})})})})}function ty(t){return t>=.9?"bad":t>=.7?"warn":"ok"}function ja({value:t,max:e,label:r,className:o}){if(!(e>0)||!Number.isFinite(t)||!Number.isFinite(e))return null;let s=Math.max(0,Math.min(1,t/e)),i=ty(s),n=Math.round(s*1e3)/10;return(0,y.jsx)("div",{className:`meter ${i}${o?` ${o}`:""}`,role:"progressbar","aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":Math.round(s*100),"aria-label":r,children:(0,y.jsx)("i",{style:{width:`${n}%`}})})}function ry(t){return t==="critical"?"tag tag-bad sig-tag":t==="warning"?"tag tag-warn sig-tag":t==="info"||t==="notice"?"tag tag-cyan sig-tag":"tag tag-ghost sig-tag"}function oy(t){return t==="approval"?"tag tag-warn feed-k":t==="gate"?"tag tag-bad feed-k":t==="judge"?"tag tag-ok feed-k":t==="signals"?"tag tag-cyan feed-k":t==="route"||t==="step"?"tag tag-accent feed-k":"tag tag-ghost feed-k"}var Bo="Ungrouped";function Fa(t){return t.length<=12?t:`${t.slice(0,8)}\u2026`}function Zp(t){let e=new Map;for(let o of t){let s=o.workspaceLabel?.trim()||Bo,i=o.cwd&&o.cwd!==""?o.cwd:s,n=e.get(i);n===void 0&&(n={key:i,label:s,...o.cwd===void 0||o.cwd===""?{}:{cwd:o.cwd},sessions:[]},e.set(i,n)),n.sessions.push(o)}let r=[...e.values()];for(let o of r)o.sessions.sort((s,i)=>(i.updatedAt??0)-(s.updatedAt??0));return r.sort((o,s)=>o.label===Bo&&s.label!==Bo?1:s.label===Bo&&o.label!==Bo?-1:o.label.localeCompare(s.label)),r}function sy({snapshot:t,filter:e,onSelect:r}){let o=(0,Q.useMemo)(()=>{let a=new Map;for(let l of t.pending)l.runId===void 0||l.runId===""||a.set(l.runId,(a.get(l.runId)??0)+1);return a},[t.pending]),s=(0,Q.useMemo)(()=>Zp(t.runs),[t.runs]),[i,n]=(0,Q.useState)({});return(0,Q.useEffect)(()=>{n(a=>{let l={...a};for(let c of s){let d=c.sessions.some(m=>(o.get(m.runId)??0)>0),u=e!=="all"&&c.sessions.some(m=>m.runId===e);(d||u||l[c.key]===void 0)&&(l[c.key]=!1)}return l})},[s,e,o]),t.runs.length===0?(0,y.jsxs)("section",{id:"workspaces","aria-label":"Workspaces",children:[(0,y.jsxs)("div",{className:"section-head",children:[(0,y.jsx)("h2",{children:"Workspaces"}),(0,y.jsx)("span",{className:"section-count",children:"0"})]}),(0,y.jsx)("p",{className:"empty",children:"No live sessions yet."})]}):(0,y.jsxs)("section",{id:"workspaces","aria-label":"Workspaces",children:[(0,y.jsxs)("div",{className:"section-head",children:[(0,y.jsx)("h2",{children:"Workspaces"}),(0,y.jsx)("span",{className:"section-count",children:s.length})]}),(0,y.jsxs)("div",{className:"ws-tree scroll-beauty",role:"tree",children:[(0,y.jsxs)("button",{type:"button",className:`ws-all${e==="all"?" is-active":""}`,role:"treeitem","aria-current":e==="all"?"true":void 0,onClick:()=>r("all"),children:["All sessions",(0,y.jsx)("span",{className:"tag tag-ghost",children:t.runs.length})]}),s.map(a=>{let l=i[a.key]===!0,c=a.sessions.reduce((d,u)=>d+(o.get(u.runId)??0),0);return(0,y.jsxs)("div",{className:"ws-group",role:"group",children:[(0,y.jsxs)("button",{type:"button",className:"ws-group-head","aria-expanded":!l,onClick:()=>n(d=>({...d,[a.key]:!l})),title:a.cwd??a.label,children:[(0,y.jsx)("span",{className:"ws-chevron","aria-hidden":"true",children:l?"\u25B8":"\u25BE"}),(0,y.jsx)("span",{className:"ws-group-label",children:a.label}),(0,y.jsx)("span",{className:"tag tag-ghost",children:a.sessions.length}),c>0&&(0,y.jsx)("span",{className:"tag tag-warn",children:c})]}),!l&&(0,y.jsx)("ul",{className:"ws-sessions",children:a.sessions.map(d=>{let u=o.get(d.runId)??0,m=e===d.runId,p=d.label??d.sessionId??d.runId;return(0,y.jsx)("li",{children:(0,y.jsxs)("button",{type:"button",className:`ws-session${m?" is-active":""}${u>0?" is-pending":""}`,role:"treeitem","aria-current":m?"true":void 0,title:`${p}
${d.runId}${d.cwd===void 0?"":`
${d.cwd}`}`,onClick:()=>r(d.runId),children:[(0,y.jsx)("span",{className:"ws-session-id mono",children:Fa(p)}),d.step!==void 0&&(0,y.jsxs)("span",{className:"tag tag-ghost",children:["s",d.step]}),u>0&&(0,y.jsx)("span",{className:"tag tag-warn",children:u})]})},d.runId)})})]},a.key)})]})]})}function iy({run:t}){return(0,y.jsxs)("div",{className:"run-card",children:[(0,y.jsxs)("div",{className:"run-grid",children:[(0,y.jsxs)("div",{children:[(0,y.jsx)("div",{className:"k",children:"run"}),(0,y.jsx)("div",{className:"v mono",title:t.runId,children:Fa(t.sessionId??t.runId)})]}),(0,y.jsxs)("div",{children:[(0,y.jsx)("div",{className:"k",children:"steps"}),(0,y.jsxs)("div",{className:"v",children:[t.step??"\u2014",t.maxSteps===void 0?"":` / ${t.maxSteps}`]}),t.step!==void 0&&t.maxSteps!==void 0&&(0,y.jsx)(ja,{value:t.step,max:t.maxSteps,label:`Step ${t.step} of ${t.maxSteps}`})]}),(0,y.jsxs)("div",{children:[(0,y.jsx)("div",{className:"k",children:"spend"}),(0,y.jsxs)("div",{className:"v",children:[t.spentUSD===void 0?"\u2014":`$${t.spentUSD.toFixed(4)}`,t.budgetUSD===void 0?"":` / $${t.budgetUSD.toFixed(2)}`]}),t.spentUSD!==void 0&&t.budgetUSD!==void 0&&(0,y.jsx)(ja,{value:t.spentUSD,max:t.budgetUSD,label:`Spend $${t.spentUSD.toFixed(4)} of $${t.budgetUSD.toFixed(2)}`})]}),t.route!==void 0&&(0,y.jsxs)("div",{children:[(0,y.jsx)("div",{className:"k",children:"route"}),(0,y.jsx)("div",{className:"v",children:(0,y.jsx)("span",{className:"tag tag-accent",title:t.route,children:t.route})})]}),t.judgeScore!==void 0&&(0,y.jsxs)("div",{children:[(0,y.jsx)("div",{className:"k",children:"judge"}),(0,y.jsx)("div",{className:"v",children:(0,y.jsxs)("span",{className:`tag ${t.judgeScore>=2?"tag-ok":t.judgeScore>=1?"tag-warn":"tag-bad"}`,children:[t.judgeScore," / 3"]})}),(0,y.jsx)(ja,{value:t.judgeScore,max:3,label:`Judge score ${t.judgeScore} of 3`,className:"accent"})]})]}),(t.signals??[]).map((e,r)=>(0,y.jsxs)("div",{className:`sig ${e.severity}`,children:[(0,y.jsx)("span",{className:ry(e.severity),children:e.severity}),(0,y.jsx)("span",{className:"tag tag-ghost",children:e.kind}),(0,y.jsxs)("span",{children:["@ step ",e.step," \u2014 ",e.detail]})]},r))]})}function ny({snapshot:t,filter:e}){let r=e==="all"?t.runs:t.runs.filter(s=>s.runId===e),o=(0,Q.useMemo)(()=>Zp(r),[r]);return(0,y.jsxs)("section",{id:"run-state",className:"pane pane-runs",children:[(0,y.jsxs)("div",{className:"section-head pane-head",children:[(0,y.jsx)("h2",{children:"Runs"}),(0,y.jsx)("span",{className:"section-count",children:r.length}),e!=="all"&&(0,y.jsx)("span",{className:"tag tag-accent",title:e,children:Fa(e)})]}),(0,y.jsx)("div",{className:"pane-scroll scroll-beauty",children:r.length===0?(0,y.jsx)("p",{className:"empty",children:e==="all"?"No run has reported yet.":"No run state for this session."}):o.map(s=>(0,y.jsxs)("div",{className:"run-group",children:[(0,y.jsxs)("div",{className:"run-group-head",title:s.cwd??s.label,children:[(0,y.jsx)("span",{className:"run-group-label",children:s.label}),(0,y.jsx)("span",{className:"tag tag-ghost",children:s.sessions.length})]}),(0,y.jsx)("div",{className:"run-group-body",children:s.sessions.map(i=>(0,y.jsx)(iy,{run:i},i.runId))})]},s.key))})]})}function ay({snapshot:t,filter:e}){let r=e==="all"?t.feed:t.feed.filter(o=>o.runId===e);return(0,y.jsxs)("section",{id:"activity",className:"pane pane-activity",children:[(0,y.jsxs)("div",{className:"section-head pane-head",children:[(0,y.jsx)("h2",{children:"Activity"}),(0,y.jsx)("span",{className:"section-count",children:r.length})]}),(0,y.jsx)("div",{className:"pane-scroll scroll-beauty",children:r.length===0?(0,y.jsx)("p",{className:"empty",children:e==="all"?"No activity yet.":"No activity for this session."}):(0,y.jsx)("ul",{className:"feed",children:[...r].reverse().map((o,s)=>(0,y.jsxs)("li",{className:"feed-item",children:[(0,y.jsx)("span",{className:"feed-t t",children:new Date(o.t).toLocaleTimeString()}),(0,y.jsx)("span",{className:oy(o.kind),children:o.kind}),(0,y.jsx)("span",{className:"feed-text text",children:o.text})]},`${String(o.t)}-${String(s)}`))})})]})}function em({source:t}){let e=Jw(t),r=Uw(t),[o,s]=(0,Q.useState)("all");return Qw(e?.pending.length??0),(0,Q.useEffect)(()=>{o==="all"||e===null||e.runs.some(i=>i.runId===o)||s("all")},[e,o]),e===null?(0,y.jsx)("p",{className:"empty",children:"Loading\u2026"}):(0,y.jsxs)("div",{className:"dashboard-shell",children:[(0,y.jsxs)("aside",{className:"sidebar","aria-label":"Workspaces and activity",children:[(0,y.jsx)("div",{className:"sidebar-top",children:(0,y.jsx)(sy,{snapshot:e,filter:o,onSelect:s})}),(0,y.jsx)(ay,{snapshot:e,filter:o})]}),(0,y.jsxs)("section",{className:"stage",id:"approvals","aria-label":"Approvals thread",children:[(0,y.jsxs)("div",{className:"section-head",children:[(0,y.jsx)("h2",{children:"Approval thread"}),(0,y.jsx)("span",{className:`section-count${e.pending.length>0?" hot":""}`,children:e.pending.length})]}),(0,y.jsx)(ey,{pending:e.pending,feed:e.feed,source:t,briefsOn:r})]}),(0,y.jsx)("aside",{className:"rail","aria-label":"Grouped runs",children:(0,y.jsx)(ny,{snapshot:e,filter:o})})]})}function tm(t,e){let r=e.find(o=>(o.retainedBy.mainView??0)>0);if(r!==void 0)return t.find(o=>o.sessionIds.includes(r.id))?.id}function rm(t,e,r,o){if(t.length===0)return{target:void 0,ambiguous:!1,blocked:"no-workspace",note:"No workspace is registered yet \u2014 open a project folder, then start the loop."};let s=new Map(t.map(l=>[l.id,l])),i=(r!==void 0?s.get(r):void 0)??(e!==void 0?s.get(e):void 0)??(t.length===1?t[0]:void 0),n=t.length>1;if(i===void 0)return{target:void 0,ambiguous:n,blocked:"choose-workspace",note:"Pick the workspace to run in \u2014 a loop writes files, so it is never guessed."};let a=o.trim()==="";return{target:i,ambiguous:n,blocked:a?"empty-task":void 0,note:`Runs in \u201C${i.title}\u201D \u2014 ${i.path}`}}var om=`/*! tailwindcss v4.1.18 | MIT License | https://tailwindcss.com */
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
`;var sm=`/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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
`;var im=`/*
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
`;var A=V("react/jsx-runtime");function uy(t){return{onChange(e){let r=t.get("remote");return r?.$on===void 0?()=>{}:r.$on("featureLoop/changed",e)},async load(){let e=t.get("remote.featureLoop");if(e===void 0)throw new Error("feature-loop host remote is not mounted");let r=await e.live();if(!r.ok)throw new Error(r.error.message);return r.value},async respond(e,r,o){let s=t.get("remote.featureLoop");if(s===void 0)throw new Error("feature-loop host remote is not mounted");Hp(await s.answer(e,r,o))},async status(){let e=t.get("remote.featureLoop");if(e===void 0)throw new Error("feature-loop host remote is not mounted");let r=await e.status();if(!r.ok)throw new Error(r.error.message);return{config:r.value.config}}}}function py({size:t}){let e=t??16;return(0,A.jsxs)("svg",{width:e,height:e,viewBox:"0 0 16 16",fill:"none",stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round","aria-hidden":!0,children:[(0,A.jsx)("path",{d:"M13.5 8a5.5 5.5 0 1 1-1.6-3.9"}),(0,A.jsx)("path",{d:"M13.5 1.8V5h-3.2"}),(0,A.jsx)("path",{d:"M8 5.6v4.8"})]})}function Qt({label:t,hint:e,children:r}){return(0,A.jsxs)("div",{children:[(0,A.jsxs)("div",{className:"fl-row",children:[(0,A.jsx)("label",{className:"fl-label",children:t}),r]}),e!==void 0?(0,A.jsx)("div",{className:"fl-hint",children:e}):null]})}var my=Object.keys(No);function hy({host:t}){let[e,r]=(0,ue.useState)(null),[o,s]=(0,ue.useState)(null),[i,n]=(0,ue.useState)(!1),[a,l]=(0,ue.useState)(null),c=(0,ue.useCallback)(async()=>{try{let g=t.get("remote.featureLoop");if(g===void 0){s({kind:"error",text:"feature-loop host remote is not mounted."});return}let b=await g.status();if(!b.ok){s({kind:"error",text:`status: ${b.error.message}`});return}r(b.value),l({judge:b.value.judge.kind,judgeBaseURL:b.value.judge.baseURL,systemOneModel:b.value.judge.model,judgeThreshold:Number(b.value.config.judgeThreshold??2),reviewBudget:Number(b.value.config.reviewBudget??.1),gateMode:String(b.value.config.gateMode??"ask"),gatePolicies:b.value.config.gatePolicies,checkpointAtStep:Number(b.value.config.checkpointAtStep??0)||""})}catch(g){s({kind:"error",text:`status failed: ${g.message}`})}},[t]);(0,ue.useEffect)(()=>{c()},[c]);let d=(0,ue.useCallback)(async()=>{if(a!==null){n(!0),s(null);try{let g=t.get("remote.featureLoop");if(g===void 0)return;let b=await g.save(a);if(!b.ok){s({kind:"error",text:`save: ${b.error.message}`});return}s({kind:"ok",text:"Saved to config.yaml and applied over the profile patch row \u2014 this takes effect at the next plugin load (restart the harness to apply it)."}),await c()}catch(g){s({kind:"error",text:`save failed: ${g.message}`})}finally{n(!1)}}},[a,t,c]);if(e===null||a===null)return(0,A.jsx)("div",{className:"fl-panel",children:(0,A.jsx)("div",{className:"fl-empty",children:o?.text??"Loading feature loop status\u2026"})});let u=(g,b)=>l(x=>({...x,[g]:b})),m=a.judge!=="laya",p=$a(a.gatePolicies),f=qp(a.gatePolicies)!=="";return(0,A.jsxs)("div",{className:"fl-panel",children:[o===null?null:(0,A.jsx)("div",{className:"fl-notice","data-kind":o.kind,children:o.text}),(0,A.jsxs)("div",{className:"fl-notice","data-kind":"info",role:"note",children:["These fields are ",(0,A.jsx)("strong",{children:"applied over your profile\u2019s"})," ",(0,A.jsx)("code",{children:"cordis.patch.yml"})," row, so this file wins wherever the two disagree. They take effect at the next ",(0,A.jsx)("strong",{children:"plugin load"})," \u2014 restart the harness to apply them, since the running gate was built when it booted. The Status section below shows what is stored."]}),(0,A.jsxs)("div",{className:"fl-section",children:[(0,A.jsx)("h3",{className:"fl-section-title",children:"Status"}),(0,A.jsxs)("div",{className:"fl-row",children:[(0,A.jsx)("span",{className:"fl-label",children:"Policies"}),(0,A.jsxs)("span",{className:"fl-badge","data-ok":e.enabled,children:[(0,A.jsx)("span",{className:"fl-dot"}),e.enabled?"on \u2014 spec configured":"off \u2014 no spec, detectors inactive"]})]}),(0,A.jsxs)("div",{className:"fl-row",children:[(0,A.jsx)("span",{className:"fl-label",children:"Judge"}),(0,A.jsxs)("span",{className:"fl-badge","data-ok":e.judge.kind==="none"?void 0:e.judge.reachable,children:[(0,A.jsx)("span",{className:"fl-dot"}),e.judge.kind,e.judge.kind==="laya"?` \xB7 ${e.judge.model} @ ${e.judge.baseURL}`:""]})]}),e.judge.detail===""?null:(0,A.jsx)("pre",{className:"fl-pre",children:e.judge.detail}),(0,A.jsxs)("div",{className:"fl-row",children:[(0,A.jsx)("span",{className:"fl-label",children:"Standalone page"}),e.dashboardURL===""?(0,A.jsxs)("span",{className:"fl-hint",style:{margin:0},children:["off \u2014 this page is the dashboard; set ",(0,A.jsx)("code",{children:"dashboard.standalone: true"})," to also serve it on loopback"]}):(0,A.jsx)("a",{className:"fl-link",href:e.dashboardURL,target:"_blank",rel:"noreferrer",children:e.dashboardURL})]}),(0,A.jsxs)("div",{className:"fl-row",children:[(0,A.jsx)("span",{className:"fl-label",children:"Settings file"}),(0,A.jsx)("code",{className:"fl-pre",style:{flex:1},children:e.configPath})]})]}),(0,A.jsxs)("div",{className:"fl-section",children:[(0,A.jsx)("h3",{className:"fl-section-title",children:"Judge"}),(0,A.jsx)(Qt,{label:"Kind",hint:"laya is local, free and needs no key. chat is metered and needs a gateway key. none leaves the detectors alone.",children:(0,A.jsxs)("select",{value:String(a.judge),onChange:g=>u("judge",g.target.value),children:[(0,A.jsx)("option",{value:"laya",children:"laya \u2014 local System One"}),(0,A.jsx)("option",{value:"none",children:"none \u2014 detectors only"}),(0,A.jsx)("option",{value:"chat",children:"chat \u2014 metered model"})]})}),(0,A.jsx)(Qt,{label:"Base URL",hint:"Same wire for Laya, Jev and TypeSafe \u2014 swapping providers changes only this URL and the model alias.",children:(0,A.jsx)("input",{type:"text",value:String(a.judgeBaseURL),disabled:m,onChange:g=>u("judgeBaseURL",g.target.value)})}),(0,A.jsx)(Qt,{label:"Model alias",children:(0,A.jsx)("input",{type:"text",value:String(a.systemOneModel),disabled:m,onChange:g=>u("systemOneModel",g.target.value)})}),(0,A.jsx)(Qt,{label:"Threshold",hint:"Score (0\u20133) that earns a human look. Laya scores ~0.5\u20131.4 in practice, so a value at or above 2 means the advisor never fires on its own.",children:(0,A.jsx)("input",{type:"number",step:"0.1",min:"0",max:"3",value:Number(a.judgeThreshold),onChange:g=>u("judgeThreshold",Number(g.target.value))})})]}),(0,A.jsxs)("div",{className:"fl-section",children:[(0,A.jsx)("h3",{className:"fl-section-title",children:"Attention"}),(0,A.jsx)(Qt,{label:"Review budget",hint:"Fraction of steps a human may be asked about, in (0, 1].",children:(0,A.jsx)("input",{type:"number",step:"0.05",min:"0.01",max:"1",value:Number(a.reviewBudget),onChange:g=>u("reviewBudget",Number(g.target.value))})}),(0,A.jsx)(Qt,{label:"Gate mode",hint:"ask prompts you in the composer and here. deny refuses outright \u2014 for unattended and CI runs.",children:(0,A.jsxs)("select",{value:String(a.gateMode),onChange:g=>u("gateMode",g.target.value),children:[(0,A.jsx)("option",{value:"ask",children:"ask \u2014 prompt a human"}),(0,A.jsx)("option",{value:"deny",children:"deny \u2014 refuse, never prompt"})]})})]}),(0,A.jsxs)("div",{className:"fl-section",children:[(0,A.jsx)("h3",{className:"fl-section-title",children:"Approval"}),(0,A.jsx)(Qt,{label:"When to stop and ask",hint:(f?"Not one of the postures, and this page has no per-tool fields: it lives in ~/.config/dshloop/config.yaml. Picking an option here REPLACES every class in that file. ":"")+No[p].detail,children:(0,A.jsx)("select",{value:p,onChange:g=>{let b=g.target.value;u("gatePolicies",{...No[b].policies})},children:my.map(g=>(0,A.jsx)("option",{value:g,children:No[g].label},g))})}),(0,A.jsx)(Qt,{label:"Review checkpoint at step",hint:"The run pauses once at this step and waits for you \u2014 the 'built and tested, now look at it' moment. Approve to let it continue. Empty disables it.",children:(0,A.jsx)("input",{type:"number",min:"1",value:String(a.checkpointAtStep??""),placeholder:"none",onChange:g=>{let b=g.target.value;u("checkpointAtStep",b===""?void 0:Number(b))}})})]}),(0,A.jsxs)("div",{className:"fl-actions",children:[(0,A.jsx)("button",{type:"button",disabled:i,onClick:()=>{d()},children:i?"Saving\u2026":"Save"}),(0,A.jsx)("button",{type:"button","data-kind":"ghost",disabled:i,onClick:()=>{c()},children:"Reload"})]})]})}function fy({host:t}){let[e,r]=(0,ue.useState)("dashboard"),o=(0,ue.useMemo)(()=>uy(t),[t]);return(0,A.jsxs)("div",{className:"fl-page",children:[(0,A.jsx)(gy,{host:t}),(0,A.jsx)("div",{className:"fl-pagehead",children:(0,A.jsxs)("div",{className:"fl-tabs",role:"tablist",children:[(0,A.jsx)("button",{type:"button",role:"tab","aria-selected":e==="dashboard","data-active":e==="dashboard",onClick:()=>r("dashboard"),children:"Dashboard"}),(0,A.jsx)("button",{type:"button",role:"tab","aria-selected":e==="settings","data-active":e==="settings",onClick:()=>r("settings"),children:"Settings"})]})}),e==="dashboard"?(0,A.jsx)("div",{className:"fl-dashboard",children:(0,A.jsx)(em,{source:o})}):(0,A.jsx)(hy,{host:t})]})}function gy({host:t}){let[e,r]=(0,ue.useState)(""),[o,s]=(0,ue.useState)(!1),[i,n]=(0,ue.useState)(null),[a,l]=(0,ue.useState)(void 0),{workspaces:c,opened:d}=(0,ue.useMemo)(()=>{let T=(t.get("workspaces")?.list.getSnapshot().items??[]).map(M=>({id:M.workspaceId,title:M.title,path:M.path,sessionIds:M.sessionIds})),I=t.get("sessions"),{ids:C,byId:R}=I?.list.getSnapshot()??{ids:[],byId:{}},_=C.map(M=>R[M]).filter(M=>M!==void 0);return{workspaces:T,opened:tm(T,_)}},[t,a]),u=rm(c,d,a,e),{target:m,ambiguous:p,note:f,blocked:g}=u,b=o||g!==void 0,x=(0,ue.useCallback)(async()=>{if(!(m===void 0||e.trim()==="")){s(!0),n(null);try{let w=t.get("remote.session");if(w===void 0){n({kind:"error",text:"the session controller is not available"});return}let S=t.get("uiWorkspace");if(S===void 0){n({kind:"error",text:"the workspace controller is not available"});return}let T=await S.connectWorkspace(m.id),I=t.get("remote.featureLoop");try{await I?.labelRun(T,e.trim())}catch{}let C=await w.prompt({requestId:globalThis.crypto.randomUUID(),sessionId:T,mode:"queue",content:[{type:"text",text:e.trim()}]});if(!C.ok){n({kind:"error",text:C.error.message});return}n({kind:"ok",text:`Running in \u201C${m.title}\u201D \u2014 the composer has the transcript.`}),r("")}catch(w){n({kind:"error",text:w.message})}finally{s(!1)}}},[t,m,e]);return(0,A.jsxs)("div",{className:"fl-start",children:[(0,A.jsxs)("div",{className:"fl-start-head",children:[(0,A.jsx)("h2",{className:"fl-title",children:"Start a loop"}),(0,A.jsx)("p",{className:"fl-sub",children:"Describe the task. It runs as a normal turn, so the step and cost ceilings, the detectors and the review gate all apply \u2014 and approvals arrive on this page."})]}),p?(0,A.jsxs)("label",{className:"fl-start-workspace",children:[(0,A.jsx)("span",{className:"fl-start-wspacelabel",children:"Workspace"}),(0,A.jsx)("select",{value:m?.id??"",onChange:w=>l(w.target.value),children:c.map(w=>(0,A.jsx)("option",{value:w.id,children:w.title===""?w.path:`${w.title} \u2014 ${w.path}`},w.id))})]}):null,(0,A.jsxs)("div",{className:"fl-start-row",children:[(0,A.jsx)("input",{className:"fl-start-input",type:"text",value:e,placeholder:"e.g. fix the failing test in test/budget.test.ts","aria-label":"Task to run through the feature loop",onChange:w=>r(w.target.value),onKeyDown:w=>{w.key==="Enter"&&!w.shiftKey&&(w.preventDefault(),x())}}),(0,A.jsx)("button",{type:"button",className:"fl-start-button",disabled:b,onClick:()=>{x()},children:o?"Starting\u2026":"Start loop"})]}),(0,A.jsx)("p",{className:"fl-start-note",children:f}),i===null?null:(0,A.jsx)("p",{className:"fl-start-result","data-kind":i.kind,role:"status",children:i.text})]})}var nm,vy=()=>nm??(nm=E.string()),am,by=()=>am??(am=E.any()),Lo=(t,e)=>({name:t,wire:t,source:"json",codec:{mode:"strict",typeSymbol:e,create:vy}}),wy=(t,e)=>({name:t,wire:t,source:"json",codec:{mode:"strict",typeSymbol:e,create:by}}),$o={mode:"src-json"},yy={package:"@freepeak/dsh-feature-loop",descriptors:[{id:"@freepeak/dsh-feature-loop#featureLoop/status",service:"featureLoop",namespace:"featureLoop",method:"status",invocation:{kind:"direct"},parameters:[],result:$o},{id:"@freepeak/dsh-feature-loop#featureLoop/live",service:"featureLoop",namespace:"featureLoop",method:"live",invocation:{kind:"direct"},parameters:[],result:$o},{id:"@freepeak/dsh-feature-loop#featureLoop/answer",service:"featureLoop",namespace:"featureLoop",method:"answer",invocation:{kind:"direct"},parameters:[Lo("id","string"),Lo("outcome","string"),Lo("feedback","string")],result:$o},{id:"@freepeak/dsh-feature-loop#featureLoop/save",service:"featureLoop",namespace:"featureLoop",method:"save",invocation:{kind:"direct"},parameters:[wy("settings","object")],result:$o},{id:"@freepeak/dsh-feature-loop#featureLoop/labelRun",service:"featureLoop",namespace:"featureLoop",method:"labelRun",invocation:{kind:"direct"},parameters:[Lo("sessionId","string"),Lo("task","string")],result:$o}]},xy={inject:["slots","locale","remote","workspaces","uiWorkspace"],apply(t){t.effect(()=>{let r=document.createElement("style");return r.dataset.plugin="@freepeak/dsh-feature-loop",r.dataset.pluginCss="@freepeak/dsh-feature-loop/dashboard",r.textContent=`${sm}
${om}
${im}`,document.head.append(r),()=>{r.remove()}},"dsh-feature-loop: dashboard stylesheet"),t.effect(()=>t.locale.register("featureLoop",{zh:{"featureLoop.panel":"Feature Loop"},en:{"featureLoop.panel":"Feature Loop"}}),"dsh-feature-loop: dictionaries");let e=t.remote.$mount(yy).then(r=>r).catch(r=>{console.error("dsh-feature-loop: remote mount failed",r)});return window.__dshFeatureLoop=Object.freeze({ready:e,call:(r,o,...s)=>{let i=t.get(`remote.${r}`);if(i===void 0)throw new Error(`remote.${r}.${o} not available`);return i[o]?.(...s)}}),t.slots.inject("sidebar.panellist",()=>t.slots.register({name:"sidebar.panellist",id:"feature-loop",order:11,label:"Feature Loop",locale:"featureLoop"},py)),t.slots.inject("main",()=>t.slots.register({name:"main",key:"feature-loop",locale:"featureLoop"},()=>(0,A.jsx)(fy,{host:t}))),()=>{e.then(r=>r?.()).catch(()=>{})}}};return fm(_y);})();

    return __flPlugin.default || __flPlugin;
  },
});
