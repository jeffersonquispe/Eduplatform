/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable */
"use client";
// Port de "El taller del agente" (proyecto Claude Design). Animacion SVG isometrica como funcion pura
// del tiempo T; el reloj (T, play/pausa, bucle) vive en <TallerAgente/> en lugar del motor de composicion.
import { useEffect, useMemo, useRef, useState } from "react";

const DURATION = 59.5;

const Easing = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};
let TASK = ["", ""];

const C={n950:'#0A1B33',n900:'#0F2A4A',n800:'#163A63',n700:'#1D4E89',n600:'#2A62A6',n100:'#DCE7F4',n50:'#EEF3FA',t700:'#0B6B73',t600:'#0E7C86',t500:'#14939F',t100:'#D5EEF0',s950:'#0F172A',s900:'#1E293B',s700:'#334155',s500:'#64748B',s400:'#94A3B8',s300:'#CBD5E1',s200:'#E2E8F0',s100:'#F1F5F9',s50:'#F8FAFC',amb:'#B7791F',ambL:'#FEF3C7',red:'#B91C1C',redL:'#FEE2E2',grn:'#166534',grnL:'#DCFCE7',neon:'#7FE3EA',gold:'#E0A63B'};
const M={slate:[C.s100,C.s200,C.s300],navy:[C.n600,C.n700,C.n800],dark:[C.n800,C.n900,C.n950],teal:[C.t500,C.t600,C.t700],steel:[C.s300,C.s400,C.s500],amber:[C.gold,C.amb,'#92400E'],white:['#FFFFFF',C.s100,C.s200]};
const SANS="'Geist',system-ui,sans-serif",MONO="'Geist Mono',ui-monospace,monospace";
const STC={ask:C.t100,write:C.n600,read:C.t500,edit:C.gold,exec:C.s300};
const ST={read:{t:'LEER',s:'read_file'},write:{t:'ESCRIBIR',s:'write_file'},edit:{t:'EDITAR',s:'str_replace_edit'},exec:{t:'EJECUTAR',s:'run_script'},ask:{t:'PREGUNTAR',s:'ask_user'}};
const P=(x,y,z=0)=>[960+(x-y)*52,260+(x+y)*30-z*60];
const q=a=>a.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
const sm=(a,b,t,e=Easing.easeInOutCubic)=>t<=a?0:t>=b?1:e((t-a)/(b-a));
const lerp=(a,b,k)=>a+(b-a)*k;
const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const SP={ask:[10.9,3.1],write:[8,3.9],read:[3.4,2.9],exec:[2.9,4.4],edit:[7.7,7.0],home:[5.4,6.2],chair:[2.9,9.2]};
const TIM=[
 {leg:[10.0,12.0],a:12.0,b:14.5,r:14.6,pk:[18.6,19.6]},
 {leg:[19.6,20.7],a:20.7,b:22.6,r:22.6,pk:[23.0,23.6]},
 {leg:[23.6,25.2],a:25.2,b:27.2,r:27.2,pk:[27.4,28.0]},
 {leg:[27.8,29.4],a:29.4,b:31.2,r:31.2,pk:[31.4,32.0]},
 {leg:[31.7,33.5],a:33.5,b:35.0,r:35.4,pk:[38.0,38.8]},
 {leg:[39.0,40.9],a:40.9,b:43.4,r:43.4,pk:[43.5,44.1]},
 {leg:[43.6,45.4],a:45.4,b:46.8,r:46.6,pk:[46.7,47.3]}];
const TITLES=[[0.7,4.9,'1. Llega una tarea'],[6.0,9.6,'2. Piensa qué necesita'],[10.6,14.6,'3. Actúa con una herramienta'],[16.3,20.2,'4. Observa el resultado'],[20.9,24.6,'Y el ciclo se repite'],[26.0,30.6,'Cada paso queda en la mochila'],[35.0,39.0,'Si falla… lo corrige'],[39.4,43.4,'Lee el error y lo repara'],[45.9,48.2,'El contexto crece'],[48.3,50.45,'Repite hasta terminar']];
const EX=[[1.6,2.8,'surprise'],[2.8,5.5,'read'],[5.5,10,'think'],[12,14.5,'focus'],[14.6,19.5,'read'],[19.6,20.6,'happy'],[20.7,22.6,'focus'],[25.2,27.2,'focus'],[29.4,31.2,'focus'],[33.5,35,'focus'],[35,36.4,'surprise'],[36.4,39,'sad'],[40.9,43.4,'focus'],[43.4,45,'happy'],[45.4,46.8,'focus'],[46.8,50.5,'happy'],[52.6,55,'happy'],[55,60,'sleepy']];
const DEFAULT={task:'Crear una animación que explique cómo trabaja un agente de IA',beats:[
 {station:'ask',tool:'ask_user',label:'Pregunta alcance y estilo',result:'Respuestas recibidas',status:'ok'},
 {station:'write',tool:'copy_starter_component x2',label:'Copia el motor y el panel',result:'2 archivos copiados',status:'ok'},
 {station:'read',tool:'list_files + read_file x2',label:'Lee el sistema de diseño',result:'Colores y tipografía',status:'ok'},
 {station:'write',tool:'write_file + dc_write',label:'Escribe escena y datos',result:'Escena escrita',status:'ok'},
 {station:'exec',tool:'ready_for_verification',label:'Verifica en el navegador',result:'ERROR: ref no definida',status:'error'},
 {station:'edit',tool:'dc_js_str_replace',label:'Corrige el fallo',result:'Arreglo aplicado',status:'ok'},
 {station:'exec',tool:'ready_for_verification',label:'Vuelve a verificar',result:'Todo funciona',status:'ok'}]};

const actI=(st,t,bs)=>{let m=0;bs.forEach((b,i)=>{if(b.station!==st||!TIM[i])return;const T=TIM[i];m=Math.max(m,sm(T.a-.2,T.a+.2,t)*(1-sm(T.b,T.b+.3,t)))});return m};
const anyAct=(t,bs)=>Math.max(0,...bs.map((b,i)=>TIM[i]?sm(TIM[i].a,TIM[i].a+.2,t)*(1-sm(TIM[i].b,TIM[i].b+.2,t)):0));
const phaseAt=(t,bs)=>{for(let i=0;i<bs.length&&TIM[i];i++){const T=TIM[i],ts=i?TIM[i-1].pk[1]:5.5;if(t>=ts&&t<T.a)return 0;if(t>=T.a&&t<T.b)return 1;if(t>=T.b&&t<T.pk[1])return 2}return -1};
function robotState(t,bs){let cur=SP.home,dir=1;
 const legs=bs.map((b,i)=>({to:SP[b.station],s:TIM[i].leg[0],e:TIM[i].leg[1]}));legs.push({to:SP.chair,s:50.7,e:52.6});
 for(const L of legs){if(t<L.s)break;const dx=(L.to[0]-cur[0]-(L.to[1]-cur[1]));if(Math.abs(dx)>.05)dir=dx>0?1:-1;
  if(t>=L.e){cur=L.to;continue}
  const k=Easing.easeInOutSine((t-L.s)/(L.e-L.s));return{pos:[lerp(cur[0],L.to[0],k),lerp(cur[1],L.to[1],k)],dir,walking:true,ph:(t-L.s)*9.8}}
 return{pos:cur,dir,walking:false,ph:0}}
const packN=(t,bs)=>bs.reduce((a,b,i)=>a+(TIM[i]?sm(TIM[i].pk[0],TIM[i].pk[1],t,Easing.linear):0),0);
const gearPath=(r,n,tl=.22)=>{let d='';const R=r*(1+tl),w=Math.PI/n;for(let i=0;i<n;i++){const a=i*2*w;[[r,a-w*.5],[R,a-w*.28],[R,a+w*.28],[r,a+w*.5]].forEach((p,j)=>{d+=(i+j?'L':'M')+(Math.cos(p[1])*p[0]).toFixed(1)+' '+(Math.sin(p[1])*p[0]).toFixed(1)})}return d+'Z'};
const GP={a:gearPath(44,10),b:gearPath(32,8),c:gearPath(26,7),s:gearPath(14,8)};
const gearAng=t=>20*Math.min(t,35)+60*(Math.min(Math.max(t,33.5),35)-33.5)+(t>45.4?20*(t-45.4)+90*Math.min(t-45.4,1.4):0);
const jamI=t=>sm(35,35.15,t)*(1-sm(45.4,45.5,t));
const PLR=(x,z)=>{const p=P(x,0,z);return `matrix(.8667,.5,0,-1,${p[0]},${p[1]})`};
const PLL=(x,y,z)=>{const p=P(x,y,z);return `matrix(-.8667,.5,0,-1,${p[0]},${p[1]})`};

const Box=({x,y,z=0,w,d,h,c,sw=1.2})=>{const T=[P(x,y,z+h),P(x+w,y,z+h),P(x+w,y+d,z+h),P(x,y+d,z+h)],L=[P(x,y+d,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x,y+d,z+h)],R=[P(x+w,y,z),P(x+w,y+d,z),P(x+w,y+d,z+h),P(x+w,y,z+h)];
 return <g stroke="rgba(10,27,51,.4)" strokeWidth={sw} strokeLinejoin="round"><polygon points={q(L)} fill={c[1]}/><polygon points={q(R)} fill={c[2]}/><polygon points={q(T)} fill={c[0]}/></g>};
const fL=(x0,x1,Y,z0,z1)=>q([P(x0,Y,z0),P(x1,Y,z0),P(x1,Y,z1),P(x0,Y,z1)]);
const fR=(X,y0,y1,z0,z1)=>q([P(X,y0,z0),P(X,y1,z0),P(X,y1,z1),P(X,y0,z1)]);
const Flat=({x0,x1,y0,y1,z,fill,stroke})=><polygon points={q([P(x0,y0,z),P(x1,y0,z),P(x1,y1,z),P(x0,y1,z)])} fill={fill} stroke={stroke}/>;

function Sign({x,y,st,lit,w=210}){const s=ST[st];return <g transform={`translate(${x},${y})`}>
 <rect x={-w/2-5} y={-35} width={w+10} height={72} rx={14} fill={C.neon} opacity={.12+.35*lit}/>
 <rect x={-w/2} y={-30} width={w} height={62} rx={10} fill={C.n900} stroke={lit>.1?C.neon:C.n700} strokeWidth={3}/>
 <text y={4} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} letterSpacing={1.5} fill="#fff">{s.t}</text>
 <text y={25} textAnchor="middle" fontFamily={MONO} fontSize={15} fill={C.neon}>{s.s}</text></g>}

function Library({t,a}){const books=[];const cols=[C.n600,C.t500,C.s400,C.gold,C.n800,C.s300,C.t700];
 for(let r=0;r<3;r++)for(let i=0;i<14;i++){const x0=.75+i*.27,h=.62+hash(r*20+i)*.28,pull=(r===1&&i===7)?a*.55:0;
  books.push(<polygon key={r+'_'+i} points={fL(x0,x0+.23,1.25+pull,r*1.1+.32,r*1.1+.32+h)} fill={cols[(i*3+r)%7]} stroke="rgba(10,27,51,.4)" strokeWidth={1}/>)}
 const pages=[0,1,2,3,4].map(k=>{const ph=((t*1.4+k/5)%1),u=a*Math.sin(Math.PI*ph);const p=P(2.9+ph*1.6,1.5+ph*2.2,2.3+Math.sin(ph*3.1)*.8);
  return <rect key={k} x={-14} y={-10} width={28} height={20} fill="#fff" stroke={C.s400} opacity={u} transform={`translate(${p[0]},${p[1]}) rotate(${ph*300})`}/>});
 return <g><Box x={.6} y={.1} w={4.2} d={1.2} h={3.5} c={M.dark}/>
 <polygon points={fL(.7,4.7,1.26,.15,3.4)} fill={C.n950}/>
 {[0,1,2].map(r=><polygon key={r} points={fL(.7,4.7,1.27,r*1.1+.2,r*1.1+.32)} fill={C.s500}/>)}
 {books}<polygon points={q([P(.6,1.3,3.6),P(4.8,1.3,3.6),P(4.8,1.3,3.75),P(.6,1.3,3.75)])} fill={C.neon} opacity={.5+.5*a}/>{pages}</g>}

function Press({t,a,done}){const ang=t*40*(.3+a*3);const c=P(8,2.7,1.15);const len=a*Math.min(1,(t%2)/.8+.3);
 return <g><Box x={6.4} y={.5} w={3.2} d={2} h={1.5} c={M.navy}/>
 <Box x={6.8} y={.8} z={1.5} w={2.4} d={1.3} h={.9} c={M.teal}/>
 <polygon points={q([P(6.4,2.5,1.45),P(9.6,2.5,1.45),P(9.6,2.5,1.55),P(6.4,2.5,1.55)])} fill={C.neon} opacity={.4+.6*a}/>
 <g transform={`translate(${c[0]},${c[1]})`}><ellipse rx={58} ry={22} fill={C.s400} stroke={C.n900} strokeWidth={2}/><ellipse rx={48} ry={16} fill={C.s200}/>
  {[0,1,2,3].map(k=><line key={k} x1={-48} x2={48} y1={0} y2={0} stroke={C.s500} strokeWidth={3} transform={`rotate(${ang+k*45}) scale(1,.34)`}/>)}</g>
 <Flat x0={7.2} x1={8.8} y0={2.5} y1={2.5+len*1.7+.01} z={1.0} fill="#fff" stroke={C.s400}/>
 {len>.1&&[0,1,2].map(k=><line key={k} x1={P(7.4,2.6+k*.3*len,1.0)[0]} y1={P(7.4,2.6+k*.3*len,1.0)[1]} x2={P(8.6,2.6+k*.3*len,1.0)[0]} y2={P(8.6,2.6+k*.3*len,1.0)[1]} stroke={C.n700} strokeWidth={2}/>)}
 {[0,1,2].map(k=>{const ph=(t*1.2+k/3)%1,s=a>.3?1:0;const p=P(7.6+k*.4,4.3+ph*.6,.6*(1-ph));return <polygon key={k} points="-14,-5 14,-5 18,5 -10,5" fill="#fff" stroke={C.s400} opacity={s*(1-ph*.3)} transform={`translate(${p[0]},${p[1]})`}/>})}
 {Array.from({length:Math.min(done,5)}).map((_,k)=><Flat key={k} x0={9.7} x1={10.9} y0={2.6} y1={3.6} z={k*.05+.02} fill="#fff" stroke={C.s400}/>)}</g>}

function Bench({t,a}){const sw=a>.01?Math.abs(Math.sin(t*7)):0,mx=Math.sin(t*2)*a*18;const hp=P(8.6,8.6,1.45),lp=P(7.5,8.9,1.45);
 return <g><Box x={6.2} y={8} w={3.1} d={1.7} h={1.2} c={M.slate}/>
 <Box x={6.3} y={8.1} z={0} w={.18} d={.18} h={1.2} c={M.steel}/>
 <Box x={7.0} y={8.4} z={1.2} w={1.4} d={.9} h={.05} c={M.white}/>
 {[0,1,2].map(k=><line key={k} x1={P(7.1,8.55+k*.22,1.27)[0]} y1={P(7.1,8.55+k*.22,1.27)[1]} x2={P(8.2,8.55+k*.22,1.27)[0]} y2={P(8.2,8.55+k*.22,1.27)[1]} stroke={C.s500} strokeWidth={2}/>)}
 <g transform={`translate(${lp[0]+mx},${lp[1]-10})`}><circle r={26} fill={C.t100} fillOpacity={.55} stroke={C.s900} strokeWidth={6}/><line x1={18} y1={18} x2={46} y2={46} stroke={C.s900} strokeWidth={9} strokeLinecap="round"/><path d="M-14 -8 Q-6 -20 8 -18" stroke="#fff" strokeWidth={3} fill="none"/></g>
 <g transform={`translate(${hp[0]},${hp[1]}) rotate(${-sw*65})`}><rect x={-6} y={-70} width={12} height={72} rx={4} fill={C.amb}/><rect x={-24} y={-86} width={48} height={22} rx={5} fill={C.s500}/></g>
 {sw>.85&&<g transform={`translate(${hp[0]-6},${hp[1]+4})`}>{[0,1,2,3].map(k=><circle key={k} cx={Math.cos(k*1.6)*14} cy={-Math.abs(Math.sin(k*1.6))*14} r={3} fill={C.gold}/>)}</g>}</g>}

function Machine({t,a}){const ga=gearAng(t),jam=jamI(t),run=jam<.5,shake=jam>.5?Math.sin(t*60)*1.5:0;
 const lp=bsExec.reduce((m,T)=>Math.max(m,sm(T.a,T.a+.4,t)*(1-sm(T.b+.2,T.b+.7,t))),0);
 const flash=jam>.5?(Math.sin(t*14)>0?1:.25):0;
 const o=P(1.8,1,0);
 return <g><Box x={.2} y={1} w={1.6} d={5} h={3.4} c={M.dark}/>
 <Box x={.6} y={1.5} z={3.4} w={.5} d={.5} h={1.2} c={M.steel}/><Box x={.6} y={4.6} z={3.4} w={.5} d={.5} h={1.0} c={M.steel}/>
 <polygon points={q([P(.2,1,3.4),P(1.8,1,3.4),P(1.8,6,3.4),P(.2,6,3.4)])} fill="none" stroke={run?C.neon:C.red} strokeWidth={3} opacity={.8}/>
 <g transform={`matrix(-.8667,.5,0,-1,${o[0]},${o[1]})`}>
  <rect x={8} y={8} width={284} height={188} rx={6} fill={C.n800} stroke={C.n950} strokeWidth={2}/>
  <g transform={`translate(${shake},0)`}>
  <g transform={`translate(70,115) rotate(${ga})`}><path d={GP.a} fill={C.s300} stroke={C.n950} strokeWidth={2}/><circle r={12} fill={C.n900}/><path d={GP.s} fill={C.gold} opacity={.9} transform="scale(.5)"/></g>
  <g transform={`translate(140,150) rotate(${-ga*44/32+14})`}><path d={GP.b} fill={C.s400} stroke={C.n950} strokeWidth={2}/><circle r={9} fill={C.n900}/></g>
  <g transform={`translate(190,117) rotate(${ga*32/26})`}><path d={GP.c} fill={C.neon} stroke={C.n950} strokeWidth={2}/><circle r={8} fill={C.n900}/></g></g>
  <g transform="translate(236,160)"><circle r={24} fill="#fff" stroke={C.n950} strokeWidth={3}/><line x2={0} y2={-18} stroke={C.red} strokeWidth={3} transform={`rotate(${-60+(run?Math.sin(t*3)*20+lp*70:90+Math.sin(t*40)*6)})`}/></g>
  {[42,86].map((x,i)=><g key={i} transform={`translate(${x},46)`}><rect x={-14} y={-4} width={28} height={12} rx={3} fill={C.n950}/><line y2={-34} stroke={i?C.s300:C.gold} strokeWidth={7} strokeLinecap="round" transform={`rotate(${(i?-20:-35+70*lp)})`}/><circle r={5} fill={C.s400}/></g>)}
  {[[C.grn,run?1:.2],[C.gold,.6],[C.red,jam>.5?flash:.15]].map((l,i)=><circle key={i} cx={140+i*22} cy={40} r={8} fill={l[0]} opacity={l[1]}/>)}
  <rect x={176} y={18} width={104} height={54} rx={4} fill={C.s950}/>
  {[0,1,2,3].map(k=><rect key={k} x={184} y={26+k*11} width={(jam>.5&&k===3?70:20+hash(k+Math.floor(t*(run?3:0.5)))*60)} height={5} fill={jam>.5&&k>=2?C.red:C.neon}/>)}
 </g>
 {[0,1,2].map(k=>{const ph=(t*.5+k/3)%1,sp=P(.85,1.75,4.6);return <circle key={k} cx={sp[0]+Math.sin(ph*5+k)*8} cy={sp[1]-ph*90} r={10+ph*22} fill={jam>.5?C.s700:"#fff"} opacity={(1-ph)*.55*(run?1:.6)}/>})}
 {[0,1].map(k=>{const ph=(t*.55+k/2+.2)%1,sp=P(.85,4.85,4.4);return <circle key={'b'+k} cx={sp[0]+Math.sin(ph*5+k)*8} cy={sp[1]-ph*90} r={10+ph*22} fill={jam>.5?C.s700:"#fff"} opacity={(1-ph)*.55}/>})}
 {t>35&&t<38.6&&Array.from({length:14}).map((_,k)=>{const sp=P(1.8,3.2,2.2),ph=((t-35)*1.6+k*.13)%1,ang=hash(k)*Math.PI*2,r=ph*(60+hash(k+9)*70);return <g key={k} opacity={(1-ph)*(Math.sin((t-35)*9+k)>-.3?1:0)}><circle cx={sp[0]+Math.cos(ang)*r} cy={sp[1]+Math.sin(ang)*r*.6+ph*ph*60} r={3.5} fill={k%3?C.gold:'#fff'}/></g>})}
 </g>}
const bsExec=[];

function Ask({t,a}){const sw=Math.sin(t*28)*18*a;const b=P(11,1.2,2.25);const f=P(11.6,1.2,1.0);
 return <g><Box x={10.2} y={.6} w={1.4} d={1.2} h={1.8} c={M.slate}/>
 <g transform={`translate(${b[0]},${b[1]}) rotate(${sw})`}><path d="M-26 0 Q-26 -34 0 -34 Q26 -34 26 0 Z" fill={C.gold} stroke={C.amb} strokeWidth={3}/><circle cy={6} r={6} fill={C.amb}/></g>
 <g transform={`translate(${f[0]},${f[1]-18})`}><circle r={26} fill={C.t600}/><text y={12} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={38} fill="#fff">?</text></g>
 {a>.3&&[0,1,2].map(k=>{const ph=(t*1.3+k/3)%1;return <text key={k} x={b[0]+28+k*8} y={b[1]-40-ph*50} fontFamily={SANS} fontWeight={700} fontSize={26} fill={C.t600} opacity={1-ph}>?</text>})}</g>}

function Desk({t,mini,mt,bs}){
 const scr=<g><rect width={1920} height={1080} fill={C.n950}/>{!mini&&t>48.4?<g><World t={mt} bs={bs} mini={true}/></g>:<g>{[0,1,2,3,4].map(k=><rect key={k} x={160} y={200+k*120} width={500+hash(k+Math.floor(t))*900} height={40} fill={C.t600} opacity={.5}/>)}</g>}</g>;
 const m=P(0,11.8,4.2);
 return <g><Box x={0} y={6.4} w={.15} d={5.6} h={.04} c={M.dark} sw={0}/>
 <Box x={0} y={6.5} z={0} w={1.7} d={5.5} h={1.05} c={M.slate}/>
 <polygon points={fR(0,6.25,12,1.05,4.45)} fill={C.n900} stroke={C.n950} strokeWidth={3}/>
 <g transform={`matrix(.14625,-.084375,0,.16667,${m[0]},${m[1]})`}><clipPath id={mini?'scrM':'scrA'}><rect width={1920} height={1080}/></clipPath><g clipPath={`url(#${mini?'scrM':'scrA'})`}>{mini?<rect width={1920} height={1080} fill={C.n950}/>:scr}</g></g>
 <polygon points={fR(0,6.4,11.8,1.2,4.2)} fill={C.neon} opacity={.07+.05*Math.sin(t*3)}/>
 <g transform={`translate(${P(1.0,7.0,1.05)[0]},${P(1.0,7.0,1.05)[1]})`}><rect x={-14} y={-30} width={28} height={30} rx={4} fill="#fff" stroke={C.s400}/><text y={-10} textAnchor="middle" fontFamily={MONO} fontSize={9} fill={C.n900}>t=0.7</text></g>
 <g transform={`translate(${P(1.0,8.0,1.05)[0]},${P(1.0,8.0,1.05)[1]})`}><ellipse cx={0} cy={-8} rx={16} ry={12} fill={C.gold}/><circle cx={10} cy={-22} r={8} fill={C.gold}/><path d="M17 -22 l8 3 -8 2z" fill={C.red}/><text y={14} textAnchor="middle" fontFamily={MONO} fontSize={10} fill={C.s700}>debug</text></g></g>}

function Cat({t}){const p=P(9.4,10.4,0),br=1+Math.sin(t*1.8)*.04;
 return <g transform={`translate(${p[0]},${p[1]})`}>
 <ellipse rx={74} ry={34} fill={C.n700} stroke={C.n950} strokeWidth={2}/><ellipse rx={62} ry={26} fill={C.n800}/>
 <g transform={`translate(0,-10) scale(1,${br})`}><ellipse rx={44} ry={20} fill={C.s400}/><circle cx={-36} cy={-4} r={16} fill={C.s400}/><path d="M-48 -16 l-2 -14 12 8zM-30 -18 l4 -14 8 10z" fill={C.s400}/><path d="M-42 -3 q4 4 8 0" stroke={C.s900} strokeWidth={2} fill="none"/><path d="M40 4 q30 -4 20 -22" stroke={C.s400} strokeWidth={9} fill="none" strokeLinecap="round"/></g>
 <text x={-8} y={46} textAnchor="middle" fontFamily={MONO} fontSize={12} fill={C.s700}>/cache</text>
 {[0,1,2].map(k=>{const ph=(t*.4+k/3)%1;return <text key={k} x={-44+ph*40} y={-40-ph*60} fontFamily={SANS} fontWeight={700} fontSize={16+ph*14} fill={C.n700} opacity={Math.sin(ph*Math.PI)}>z</text>})}</g>}

function Robot({pos,rs,t,expr,n,pulse,sit,cel,work,cards}){const [x,y]=P(pos[0],pos[1],0);const dir=rs.dir,walking=rs.walking,ph=rs.ph;
 const sw=walking?Math.sin(ph)*26:0,bob=walking?-Math.abs(Math.sin(ph))*6:Math.sin(t*2.2)*-1.5;
 const armR=cel?-150+Math.sin(t*12)*14:work>.05?-70+Math.sin(t*9)*22*work:walking?-sw:6+Math.sin(t*2)*3,armL=cel?-150+Math.sin(t*12+1)*14:walking?sw:-6;
 const blink=(t%4>3.88)?.1:1;
 const eyes={neutral:<g><rect x={-15} y={-132*1} width={8} height={12*blink} rx={4} fill={C.neon} transform="translate(0,2)"/><rect x={7} y={-130} width={8} height={12*blink} rx={4} fill={C.neon}/></g>,
 surprise:<g><ellipse cx={-11} cy={-125} rx={9} ry={13} fill={C.neon}/><ellipse cx={11} cy={-125} rx={9} ry={13} fill={C.neon}/><circle cx={-11} cy={-125} r={3.5} fill={C.n950}/><circle cx={11} cy={-125} r={3.5} fill={C.n950}/></g>,
 think:<g transform="translate(4,-3)"><rect x={-15} y={-130} width={8} height={12} rx={4} fill={C.neon}/><rect x={7} y={-127} width={8} height={7} rx={3.5} fill={C.neon}/></g>,
 read:<g><rect x={-16} y={-126} width={10} height={6} rx={3} fill={C.neon}/><rect x={6} y={-126} width={10} height={6} rx={3} fill={C.neon}/></g>,
 focus:<g><rect x={-16} y={-127} width={11} height={7} rx={3} fill={C.neon}/><rect x={5} y={-127} width={11} height={7} rx={3} fill={C.neon}/><path d="M-18 -133 L-4 -131M18 -133 L4 -131" stroke={C.neon} strokeWidth={2.5}/></g>,
 happy:<g fill="none" stroke={C.neon} strokeWidth={4.5} strokeLinecap="round"><path d="M-18 -120 Q-11 -131 -4 -120"/><path d="M4 -120 Q11 -131 18 -120"/></g>,
 sad:<g><ellipse cx={-11} cy={-123} rx={6} ry={8} fill={C.neon}/><ellipse cx={11} cy={-123} rx={6} ry={8} fill={C.neon}/><path d="M-19 -134 L-5 -138M19 -134 L5 -138" stroke={C.neon} strokeWidth={3} strokeLinecap="round"/></g>,
 sleepy:<g stroke={C.neon} strokeWidth={4} strokeLinecap="round"><path d="M-17 -123 H-5M5 -123 H17"/></g>}[expr]||null;
 const legA=sit?82:sw;
 return <g transform={`translate(${x},${y+(sit?-30*sit:0)})`}>
 <ellipse cy={2} rx={44} ry={13} fill="rgba(10,27,51,.28)"/>
 <g transform={`scale(${dir},1)`}><g transform={`translate(0,${bob})`}>
  <g transform={`translate(-30,-76) scale(${1+pulse*.08})`}>
   {Array.from({length:Math.min(Math.ceil(n),6)}).map((_,j)=><rect key={j} x={-12+j*3-8} y={-48-(j%3)*5} width={20} height={26} rx={3} fill={cards[j]||'#fff'} stroke={C.n950} strokeWidth={1.5} transform={`rotate(${(j-2.5)*6} ${-2+j*3} -20)`}/>)}
   <rect x={-28} y={-34} width={52} height={74} rx={12} fill={C.amb} stroke={C.n950} strokeWidth={2.5}/><rect x={-28} y={-34} width={52} height={20} rx={10} fill="#92400E" stroke={C.n950} strokeWidth={2.5}/>
   <rect x={-18} y={-8} width={32} height={44} rx={5} fill={C.s950}/>
   {Array.from({length:7}).map((_,j)=>{const f=Math.min(1,Math.max(0,n-j));return f>0&&<rect key={j} x={-16} y={32-(j+f)*6} width={28} height={5} fill={cards[j]||C.neon} opacity={.95}/>})}
  </g>
  <g transform={`translate(-14,-38) rotate(${-legA*.9})`}><rect x={-6} y={0} width={12} height={38} rx={6} fill={C.n800}/><rect x={-9} y={32} width={20} height={9} rx={4} fill={C.s300}/></g>
  <g transform={`translate(14,-38) rotate(${legA})`}><rect x={-6} y={0} width={12} height={38} rx={6} fill={C.n800}/><rect x={-9} y={32} width={20} height={9} rx={4} fill={C.s300}/></g>
  <g transform={`translate(-30,-92) rotate(${armL})`}><rect x={-6} y={0} width={12} height={40} rx={6} fill={C.n700}/><circle cy={42} r={8} fill="#fff" stroke={C.s400}/></g>
  <rect x={-30} y={-102} width={60} height={68} rx={16} fill={C.n800} stroke={C.n950} strokeWidth={2.5}/>
  <rect x={-18} y={-86} width={36} height={24} rx={6} fill={C.n950}/><circle cx={-8} cy={-74} r={4} fill={C.neon} opacity={.6+.4*Math.sin(t*4)}/><rect x={0} y={-77} width={14} height={6} rx={2} fill={C.t500}/>
  <g transform={`translate(30,-92) rotate(${armR})`}><rect x={-6} y={0} width={12} height={40} rx={6} fill={C.n700}/><circle cy={42} r={8} fill="#fff" stroke={C.s400}/></g>
  <line y1={-152} y2={-170} stroke={C.s400} strokeWidth={3}/><circle cy={-174} r={6} fill={Math.sin(t*5)>0?C.gold:C.neon}/>
  <rect x={-32} y={-152} width={64} height={54} rx={18} fill={C.s100} stroke={C.n950} strokeWidth={2.5}/>
  <rect x={-25} y={-142} width={50} height={34} rx={12} fill={C.n950}/>{eyes}
 </g></g></g>}

function Card({x,y,sc,tool,text,err}){return <g transform={`translate(${x},${y}) scale(${sc})`} opacity={Math.min(1,sc*3)}>
 <rect x={-130} y={-40} width={260} height={80} rx={12} fill={err?C.redL:'#fff'} stroke={err?C.red:C.t600} strokeWidth={3}/>
 <text x={-114} y={-14} fontFamily={MONO} fontSize={14} fill={err?C.red:C.t700}>{tool}</text>
 <text x={-114} y={18} fontFamily={SANS} fontWeight={600} fontSize={22} fill={err?C.red:C.n900}>{text}</text></g>}

function Icon({k,t}){
 if(k===0)return <g><rect x={-26} y={-16} width={24} height={32} fill={C.t500} stroke={C.n900} strokeWidth={2}/><rect x={2} y={-16} width={24} height={32} fill={C.n600} stroke={C.n900} strokeWidth={2}/></g>;
 if(k===1)return <g><rect x={-22} y={-8} width={44} height={24} fill={C.n700}/><rect x={-14} y={-26} width={28} height={30} fill="#fff" stroke={C.n900} strokeWidth={2}/><line x1={-8} x2={8} y1={-18} y2={-18} stroke={C.n900} strokeWidth={2}/><line x1={-8} x2={8} y1={-10} y2={-10} stroke={C.n900} strokeWidth={2}/></g>;
 if(k===2)return <g transform={`rotate(${t*60})`}><path d={GP.b} transform="scale(.8)" fill={C.s400} stroke={C.n900} strokeWidth={2}/></g>;
 return <g transform="rotate(30)"><rect x={-4} y={-6} width={8} height={34} fill={C.amb}/><rect x={-18} y={-22} width={36} height={16} rx={3} fill={C.s500}/></g>}

function World({t,bs,mini}){
 const rs=robotState(t,bs),pos=rs.pos,n=packN(t,bs),sit=sm(52.6,53.2,t);
 const expr=(EX.find(e=>t>=e[0]&&t<e[1])||[0,0,'neutral'])[2];
 const cel=(t>46.8&&t<48.4)||(t>52.9&&t<54.3)?1:0,work=anyAct(t,bs);
 const cards=bs.map((b,i)=>b.status==='error'?C.red:STC[b.station]);
 const pulse=bs.reduce((m,b,i)=>Math.max(m,TIM[i]&&t>TIM[i].pk[1]&&t<TIM[i].pk[1]+.4?1-(t-TIM[i].pk[1])/.4:0),0);
 const writesDone=bs.reduce((a,b,i)=>a+(b.station==='write'&&TIM[i]&&t>TIM[i].b+1?1:0),0);
 const aR=actI('read',t,bs),aW=actI('write',t,bs),aE=actI('edit',t,bs),aX=actI('exec',t,bs),aA=actI('ask',t,bs);
 bsExec.length=0;bs.forEach((b,i)=>{if(b.station==='exec'&&TIM[i])bsExec.push(TIM[i])});
 const mt=((t-48.4)*5)%49;
 const rp=P(pos[0],pos[1],0);
 const items=[
  {d:3,e:<Library t={t} a={aR}/>},{d:7.5,e:<Press t={t} a={aW} done={writesDone}/>},{d:4.6,e:<Machine t={t} a={aX}/>},{d:12.2,e:<Ask t={t} a={aA}/>},
  {d:10.3,e:<Desk t={t} mini={mini} mt={mt} bs={bs}/>},{d:16.5,e:<Bench t={t} a={aE}/>},{d:19.8,e:<Cat t={t}/>},
  {d:13.7,e:<g><Box x={6.4} y={6.2} w={1.3} d={.9} h={.5} c={M.navy}/>{t>1.6&&t<2.9&&<Flat x0={6.6} x1={7.5} y0={6.3} y1={6.95} z={.52} fill="#fff" stroke={C.s400}/>}</g>},
  {d:19.5,e:<g transform={`translate(${P(11,9,0)[0]},${P(11,9,0)[1]})`}><path d="M-26 0 L-20 -36 H20 L26 0Z" fill={C.t700} stroke={C.n950} strokeWidth={2}/>{[-30,-12,10,28].map((a,i)=><path key={i} d={`M0 -36 Q${a} ${-60-i*8} ${a*1.6} ${-80+i*5}`} stroke={C.grn} strokeWidth={9} fill="none" strokeLinecap="round" transform={`rotate(${Math.sin(t+i)*2})`}/>)}</g>},
  {d:pos[0]+pos[1]-.4,e:sit>0?<Box x={SP.chair[0]-.5} y={SP.chair[1]-.5} w={1} d={1} h={.55} c={M.dark}/>:null},
  {d:pos[0]+pos[1],e:<Robot pos={pos} rs={rs} t={t} expr={expr} n={n} pulse={pulse} sit={sit} cel={cel} work={work} cards={cards}/>}
 ].sort((a,b)=>a.d-b.d);
 const lights=[];for(let i=0;i<24;i++){const a=i<12?P(i,0,4.1):P(0,i-12,4.1);lights.push(<circle key={i} cx={a[0]} cy={a[1]+Math.sin(i)*3+8} r={5} fill={i%3?C.neon:C.gold} opacity={.35+.65*Math.abs(Math.sin(t*2+i*1.3))}/>)}
 const cab=(pts,off)=><polyline points={q(pts.map(p=>P(p[0],p[1],.02)))} fill="none" stroke={C.neon} strokeWidth={4} strokeDasharray="14 18" strokeDashoffset={-t*40+off} opacity={.7} strokeLinecap="round"/>;
 const tray=P(7.05,6.65,.55);const hd=[rp[0],rp[1]-215];
 const fall=sm(.8,1.6,t,Easing.easeInQuad);
 const over=[];
 if(t>.7&&t<1.65)over.push(<g key="pf" transform={`translate(${tray[0]+Math.sin(t*9)*18*(1-fall)},${lerp(tray[1]-380,tray[1],fall)}) rotate(${Math.sin(t*9)*25*(1-fall)})`}><polygon points="-30,-18 30,-18 36,18 -24,18" fill="#fff" stroke={C.s400} strokeWidth={2}/></g>);
 const tk=sm(2.8,3.5,t,Easing.easeOutBack)*(1-sm(5.0,5.5,t));
 if(tk>.01){const px=lerp(tray[0],hd[0]-10,sm(5.0,5.5,t)),py=lerp(tray[1]-190,hd[1]-30,sm(5.0,5.5,t));over.push(<g key="tk" transform={`translate(${px},${py}) scale(${tk})`}><rect x={-210} y={-76} width={420} height={152} rx={14} fill="#fff" stroke={C.t600} strokeWidth={4}/><rect x={-210} y={-76} width={420} height={36} rx={14} fill={C.t600}/><text x={-190} y={-51} fontFamily={MONO} fontSize={18} fontWeight={500} fill="#fff" letterSpacing={2}>TAREA</text><text x={-190} y={-8} fontFamily={SANS} fontWeight={600} fontSize={26} fill={C.n900}>{TASK[0]}</text><text x={-190} y={30} fontFamily={SANS} fontWeight={600} fontSize={26} fill={C.n900}>{TASK[1]}</text><text x={-190} y={60} fontFamily={MONO} fontSize={14} fill={C.s500}>prioridad: alta</text></g>)}
 const th=sm(5.8,6.3,t,Easing.easeOutBack)*(1-sm(9.4,9.9,t));
 if(th>.01){const k=Math.floor((t-6)/.95)%4;over.push(<g key="th" transform={`translate(${hd[0]+40},${hd[1]-30}) scale(${th})`}><circle cx={-50} cy={90} r={7} fill="#fff" stroke={C.s400} strokeWidth={2}/><circle cx={-34} cy={68} r={11} fill="#fff" stroke={C.s400} strokeWidth={2}/><ellipse cx={20} cy={20} rx={92} ry={56} fill="#fff" stroke={C.s400} strokeWidth={3}/><g transform="translate(20,20) scale(1.2)"><Icon k={Math.max(0,k)} t={t}/></g></g>)}
 bs.forEach((b,i)=>{const T=TIM[i];if(!T||t<T.r||t>T.pk[1])return;const err=b.status==='error';const sp=P(SP[b.station][0],SP[b.station][1],0);
  const f1=sm(T.r,T.r+.8,t),f2=sm(T.pk[0],T.pk[1],t);const pk=[rp[0]-30*rs.dir,rp[1]-120];
  let x=lerp(sp[0],hd[0],f1),y=lerp(sp[1]-190,hd[1],f1)-Math.sin(f1*Math.PI)*40;x=lerp(x,pk[0],f2);y=lerp(y,pk[1],f2);
  over.push(<Card key={'c'+i} x={x} y={y} sc={Math.min(1,sm(T.r,T.r+.3,t,Easing.easeOutBack))*(1-.85*f2)} tool={b.tool.length>26?b.tool.slice(0,26):b.tool} text={b.result} err={err}/>)});
 const sg=[['read',3.2,.15,4.5],['write',8,.15,3.6],['exec',.2,3.5,4.3],['ask',10.9,.15,3.5],['edit',10.3,8.6,1.6]].map(s=>{const p=P(s[1],s[2],s[3]);return <Sign key={s[0]} x={p[0]+(s[0]==='exec'?-12:0)} y={p[1]} st={s[0]} lit={actI(s[0],t,bs)} w={s[0]==='ask'?250:s[0]==='edit'?250:200}/>});
 const wall=[<polygon key="rw" points={q([P(0,0,0),P(12,0,0),P(12,0,4.2),P(0,0,4.2)])} fill={C.n50}/>,<polygon key="lw" points={q([P(0,0,0),P(0,12,0),P(0,12,4.2),P(0,0,4.2)])} fill={C.n100}/>];
 const ck=PLR(5.5,3.2);
 return <g>
  <polygon points={q([P(-.3,-.3,4.3),P(12.3,-.3,4.3),P(12.3,12.3,-.45),P(-.3,12.3,-.45)])} fill="none"/>
  {wall}
  <polygon points={q([P(0,0,4.2),P(12,0,4.2),P(12,0,4.4),P(0,0,4.4)])} fill={C.n900}/><polygon points={q([P(0,0,4.2),P(0,12,4.2),P(0,12,4.4),P(0,0,4.4)])} fill={C.n800}/>
  <polygon points={q([P(0,0,0),P(12,0,0),P(12,12,0),P(0,12,0)])} fill={C.s100} stroke={C.s300} strokeWidth={1.5}/>
  <polygon points={q([P(0,12,0),P(12,12,0),P(12,12,-.45),P(0,12,-.45)])} fill={C.n800}/><polygon points={q([P(12,0,0),P(12,12,0),P(12,12,-.45),P(12,0,-.45)])} fill={C.n900}/>
  {Array.from({length:11}).map((_,i)=><g key={i} stroke={C.s200} strokeWidth={1.5}><line x1={P(i+1,0,0)[0]} y1={P(i+1,0,0)[1]} x2={P(i+1,12,0)[0]} y2={P(i+1,12,0)[1]}/><line x1={P(0,i+1,0)[0]} y1={P(0,i+1,0)[1]} x2={P(12,i+1,0)[0]} y2={P(12,i+1,0)[1]}/></g>)}
  <Flat x0={4} x1={8.4} y0={4.4} y1={8} z={0} fill={C.n100} stroke={C.n600}/><Flat x0={4.3} x1={8.1} y0={4.7} y1={7.7} z={0} fill={C.t100} stroke={C.t500}/>
  {cab([[1.9,5.5],[4.6,5.5],[4.6,3.5],[6.4,3.5],[6.4,2.6]],0)}{cab([[9.6,1.6],[10.2,1.6],[10.2,3],[8.5,3]],6)}
  <g transform={ck}><circle r={34} fill="#fff" stroke={C.n900} strokeWidth={5}/><line y2={-22} stroke={C.n900} strokeWidth={4} transform={`rotate(${t*6})`}/><line y2={-14} stroke={C.red} strokeWidth={5} transform={`rotate(${t*72})`}/></g>
  <g transform={`${PLR(6.9,3.7)}`}><rect x={-60} y={-80} width={110} height={80} fill={C.ambL} stroke={C.amb} strokeWidth={2}/><text x={-50} y={-50} fontFamily={MONO} fontSize={13} fill={C.n900}>attention is</text><text x={-50} y={-30} fontFamily={MONO} fontSize={13} fill={C.n900}>all you need</text></g>
  {lights}
  {items.map((it,i)=><g key={i}>{it.e}</g>)}
  {over}{sg}
 </g>}

/* ---------- audio ---------- */
const AU={ctx:null};
function auInit(){if(AU.ctx)return AU.ctx;const c=new (window.AudioContext||window.webkitAudioContext)();AU.ctx=c;
 AU.master=c.createGain();AU.master.gain.value=.9;AU.master.connect(c.destination);
 AU.sfx=c.createGain();AU.sfx.connect(AU.master);
 AU.duck=c.createGain();AU.duck.connect(AU.master);AU.mus=c.createGain();AU.mus.gain.value=.5;AU.mus.connect(AU.duck);
 const dl=c.createDelay(1);dl.delayTime.value=.39;const fb=c.createGain();fb.gain.value=.35;dl.connect(fb);fb.connect(dl);const dg=c.createGain();dg.gain.value=.5;dl.connect(dg);dg.connect(AU.mus);AU.echo=dl;
 const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.noise=b;
 AU.nextBar=0;AU.bar=0;return c}
const tone=(f,dur,type='sine',vol=.2,o={})=>{const c=AU.ctx,t0=c.currentTime+(o.at||0),os=c.createOscillator(),g=c.createGain();os.type=type;os.frequency.setValueAtTime(f,t0);if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t0+dur);
 g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+(o.atk||.005));g.gain.exponentialRampToValueAtTime(.0001,t0+dur);os.connect(g);g.connect(o.dest||AU.sfx);os.start(t0);os.stop(t0+dur+.05)};
const nz=(dur,vol,ftype,f,o={})=>{const c=AU.ctx,t0=c.currentTime+(o.at||0),s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=AU.noise;fl.type=ftype;fl.frequency.setValueAtTime(f,t0);if(o.to)fl.frequency.exponentialRampToValueAtTime(o.to,t0+dur);fl.Q.value=o.q||1;
 g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+(o.atk||.01));g.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(fl);fl.connect(g);g.connect(AU.sfx);s.start(t0,Math.random());s.stop(t0+dur+.05)};
const bell=(f,vol=.12,dur=1.4,at=0)=>[1,2.76,5.4].forEach((m,i)=>tone(f*m,dur/(1+i),'sine',vol/(1+i*1.4),{at}));
const SFX={
 step:()=>{nz(.07,.25,'lowpass',500);tone(95,.09,'sine',.3,{to:50})},
 whoosh:()=>nz(.55,.16,'bandpass',500,{to:2600,q:2,atk:.2}),
 thud:()=>{tone(75,.18,'sine',.5,{to:35});nz(.1,.2,'lowpass',300)},
 blip:()=>tone(660,.12,'triangle',.16,{to:880}),
 oh:()=>{tone(440,.18,'square',.07,{to:900});tone(660,.2,'sine',.12,{to:1320})},
 bell:()=>bell(1175,.1,1.1),
 press:()=>{nz(.05,.3,'highpass',1500);tone(120,.12,'square',.2,{to:55});tone(1900,.03,'square',.05)},
 page:()=>nz(.25,.14,'bandpass',2800,{to:5000,q:1.5,atk:.05}),
 hammer:()=>{tone(1500,.16,'sine',.18);tone(2310,.12,'sine',.1);nz(.03,.2,'highpass',3000);tone(90,.06,'sine',.25)},
 lever:()=>{tone(170,.14,'square',.2,{to:70});nz(.04,.2,'highpass',2000)},
 gear:()=>{tone(210,.03,'square',.05);tone(140,.03,'square',.04,{at:.06})},
 steam:()=>nz(1.1,.14,'highpass',2200,{atk:.15}),
 jam:()=>{tone(190,.7,'sawtooth',.28,{to:35});tone(60,.3,'square',.25,{at:.1,to:30});nz(.3,.25,'lowpass',500)},
 spark:()=>{for(let i=0;i<5;i++)nz(.04,.2,'highpass',5500,{at:i*.045+Math.random()*.02})},
 err:()=>{tone(180,.14,'square',.14);tone(150,.2,'square',.14,{at:.18})},
 ding:()=>{tone(988,.5,'sine',.18);tone(1319,.45,'sine',.1,{at:.09})},
 pack:()=>tone(280,.14,'sine',.22,{to:720}),
 ok:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.28,'triangle',.15,{at:i*.09})),
 chime:()=>[1047,1319,1568,2093].forEach((f,i)=>bell(f,.13,2.2,i*.16))};
function buildEvents(bs){const E=[],a=(t,type)=>E.push({t,type});
 a(.9,'whoosh');a(1.6,'thud');a(1.65,'oh');[5.9,6.85,7.8,8.75].forEach(t=>a(t,'blip'));a(2.8,'ding');a(5.1,'blip');
 const legs=bs.map((b,i)=>TIM[i].leg);legs.push([50.7,52.6]);legs.forEach(l=>{for(let t=l[0]+.32;t<l[1]-.1;t+=.32)a(t,'step')});a(52.7,'thud');
 bs.forEach((b,i)=>{const T=TIM[i];
  if(b.station==='ask')[0,.7,1.4,2.1].forEach(d=>a(T.a+.1+d,'bell'));
  if(b.station==='write')for(let t=T.a+.1;t<T.b;t+=.5)a(t,'press');
  if(b.station==='read')for(let t=T.a+.1;t<T.b;t+=.5)a(t,'page');
  if(b.station==='edit')for(let t=T.a+.1;t<T.b;t+=.45)a(t,'hammer');
  if(b.station==='exec'){a(T.a+.1,'lever');for(let t=T.a+.35;t<T.b+(b.status==='error'?0:1);t+=.13)a(t,'gear');a(T.a+.5,'steam');
   if(b.status==='error'){a(35,'jam');[35.2,35.6,36.1,36.8,37.5].forEach(t=>a(t,'spark'));a(T.r,'err')}else a(T.r,'ok')}
  else a(T.r,b.station==='edit'?'ok':'ding');
  a(T.pk[1],'pack')});
 a(53.6,'chime');return E.sort((x,y)=>x.t-y.t)}
const PROG=[[130.8,261.6,329.6,392,493.9],[110,220,261.6,329.6,392],[87.3,174.6,261.6,329.6,440],[98,196,246.9,293.7,349.2]],PENT=[523.3,587.3,659.3,784,880,1047];
function musicTick(){const c=AU.ctx;if(!c||c.state!=='running')return;const spb=60/74,bar=spb*4;
 while(AU.nextBar<c.currentTime+1.2){if(!AU.nextBar)AU.nextBar=c.currentTime+.1;const t0=AU.nextBar,ch=PROG[AU.bar%4];
  ch.slice(1).forEach(f=>{const o=c.createOscillator(),g=c.createGain(),fl=c.createBiquadFilter();o.type='triangle';o.frequency.value=f;fl.type='lowpass';fl.frequency.value=900;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.05,t0+.8);g.gain.linearRampToValueAtTime(.04,t0+bar-.3);g.gain.linearRampToValueAtTime(0,t0+bar+.5);o.connect(fl);fl.connect(g);g.connect(AU.mus);o.start(t0);o.stop(t0+bar+.6)});
  [0,2].forEach(b=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=ch[0];g.gain.setValueAtTime(0,t0+b*spb);g.gain.linearRampToValueAtTime(.14,t0+b*spb+.02);g.gain.exponentialRampToValueAtTime(.001,t0+b*spb+spb*1.8);o.connect(g);g.connect(AU.mus);o.start(t0+b*spb);o.stop(t0+b*spb+spb*2)});
  for(let k=0;k<8;k++){const r=hash(AU.bar*8+k);if(r<.55){const f=PENT[Math.floor(hash(AU.bar*13+k*3)*6)],o=c.createOscillator(),g=c.createGain(),tt=t0+k*spb/2;o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,tt);g.gain.linearRampToValueAtTime(.05,tt+.01);g.gain.exponentialRampToValueAtTime(.001,tt+.5);o.connect(g);g.connect(AU.mus);g.connect(AU.echo);o.start(tt);o.stop(tt+.6)}}
  AU.nextBar+=bar;AU.bar++}}
function duck(){const c=AU.ctx,n=c.currentTime;AU.duck.gain.cancelScheduledValues(n);AU.duck.gain.setTargetAtTime(.4,n,.02);AU.duck.gain.setTargetAtTime(1,n+.3,.25)}

const CAM=(()=>{const g=(t,x,y,z,s,dx=0)=>{const p=P(x,y,z);return[t,p[0]+dx,p[1],s]};return[[0,960,500,1],[4.5,...P(5.4,6.2,1.3).slice(0,2),1.5],[9.5,...P(5.4,6.2,1.3).slice(0,2),1.6],g(12.5,10.3,3.1,1.3,1.55),g(19.5,10.3,3.1,1.3,1.55),g(21.5,8.4,3.2,1.2,1.5),g(24,8.4,3.2,1.2,1.5),g(26,3.8,2.8,1.6,1.5),g(28,3.8,2.8,1.6,1.5),g(30,8.2,3.4,1.2,1.5),g(32.5,8.2,3.4,1.2,1.5),g(34,2.9,4.2,1.7,1.5),g(39,2.9,4.2,1.7,1.5),g(41,7.7,7.2,1.1,1.5),g(43.6,7.7,7.2,1.1,1.5),g(45.8,2.9,4.4,1.5,2.1,-170),g(50.2,2.9,4.4,1.5,2.1,-170),g(51.8,2.3,8.6,1.8,1.7),[58.2,960,500,1]]})();

function Piece({T,playing,snd}){
 const bs=DEFAULT.beats;const ev=useMemo(()=>buildEvents(bs),[]);
 const words=DEFAULT.task.split(' ');const h=Math.ceil(words.length/2);TASK=[words.slice(0,h).join(' '),words.slice(h).join(' ')];
 const prev=useRef(0);
 useEffect(()=>{if(snd){const c=auInit();if(playing)c.resume();else c.suspend()}else if(AU.ctx)AU.ctx.suspend()},[snd,playing]);
 useEffect(()=>{if(!snd)return;const id=setInterval(musicTick,200);return()=>clearInterval(id)},[snd]);
 useEffect(()=>{const p=prev.current;prev.current=T;if(!snd||!playing||!AU.ctx||AU.ctx.state!=='running')return;if(T<p||T-p>.5)return;
  ev.forEach(e=>{if(e.t>p&&e.t<=T){SFX[e.type]();if(e.type!=='step'&&e.type!=='gear')duck()}})},[T]);
 let cx=960,cy=500,cs=1;for(let i=0;i<CAM.length-1;i++){const a=CAM[i],b=CAM[i+1];if(T>=a[0]&&T<=b[0]){const k=Easing.easeInOutCubic((T-a[0])/(b[0]-a[0]));cx=lerp(a[1],b[1],k);cy=lerp(a[2],b[2],k);cs=lerp(a[3],b[3],k);break}if(T>b[0]){cx=b[1];cy=b[2];cs=b[3]}}
 const drift=Math.sin(T*.5)*6;
 const ti=TITLES.find(x=>T>=x[0]&&T<=x[1]);const ta=ti?Math.min(sm(ti[0],ti[0]+.5,T),1-sm(ti[1]-.5,ti[1],T)):0;
 const ph=phaseAt(T,bs);const hud=sm(.5,1.5,T);
 const fin=sm(54.6,55.4,T);const mem=sm(45.7,46.2,T)*(1-sm(50.2,50.5,T));
 return <svg viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
  <defs><radialGradient id="vg" cx=".5" cy=".5" r=".75"><stop offset=".6" stopColor="#0A1B33" stopOpacity="0"/><stop offset="1" stopColor="#0A1B33" stopOpacity=".55"/></radialGradient></defs>
  <rect width="1920" height="1080" fill={C.n950}/>
  <g transform={`translate(960,540) scale(${cs}) translate(${-cx+drift*(cs>1.2?.5:1)},${-cy})`}><World t={T} bs={bs} mini={false}/></g>
  <rect width="1920" height="1080" fill="url(#vg)"/>
  <g opacity={.4+.6*hud} transform="translate(56,48)"><rect x={-12} y={-12} width={560} height={72} rx={16} fill={C.n900} opacity={.88}/>
   {['PENSAR','ACTUAR','OBSERVAR'].map((l,i)=><g key={l} transform={`translate(${i*178},0)`}><rect width={166} height={48} rx={24} fill={ph===i?C.t600:C.n800}/><circle cx={24} cy={24} r={7} fill={ph===i?'#fff':C.s500}/><text x={42} y={31} fontFamily={SANS} fontWeight={600} fontSize={20} fill={ph===i?'#fff':C.s300}>{l}</text></g>)}</g>
  {mem>.01&&<g opacity={mem} transform={`translate(${lerp(-40,70,mem)},230)`}><rect width={520} height={640} rx={18} fill="#fff" stroke={C.t600} strokeWidth={4}/><rect width={520} height={70} rx={18} fill={C.t600}/><text x={28} y={32} fontFamily={MONO} fontSize={16} fill="#fff" letterSpacing={2}>CONTEXT</text><text x={28} y={58} fontFamily={SANS} fontWeight={700} fontSize={24} fill="#fff">Memoria de trabajo</text>
   {bs.map((b,i)=>{const k=sm(46+i*.4,46.4+i*.4,T,Easing.easeOutBack);const err=b.status==='error';return <g key={i} opacity={Math.min(1,k)} transform={`translate(24,${92+i*76+(1-k)*14})`}><rect width={472} height={64} rx={10} fill={err?C.redL:C.s50} stroke={err?C.red:C.s200} strokeWidth={2}/><rect x={10} y={10} width={10} height={44} rx={5} fill={err?C.red:STC[b.station]}/><text x={36} y={26} fontFamily={MONO} fontSize={15} fill={C.s500}>{b.tool.length>30?b.tool.slice(0,30):b.tool}</text><text x={36} y={50} fontFamily={SANS} fontWeight={600} fontSize={22} fill={C.n900}>{b.label}</text></g>})}</g>}
  <g opacity={ta} transform={`translate(960,${ti?960-(1-ta)*14:960})`}><rect x={-440} y={-46} width={880} height={92} rx={46} fill="#fff" stroke={C.t600} strokeWidth={3}/><text y={16} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={46} letterSpacing={-1} fill={C.n900}>{ti?ti[2]:''}</text></g>
  {fin>.01&&<g opacity={fin} transform={`translate(960,${lerp(930,900,fin)})`}><rect x={-820} y={-100} width={1640} height={200} rx={28} fill={C.n900} stroke={C.neon} strokeWidth={3}/><text y={-6} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={64} letterSpacing={-1.5} fill="#fff">Así funciona la IA…</text><text y={66} textAnchor="middle" fontFamily={SANS} fontWeight={500} fontSize={46} fill={C.neon}>que acaba de crear esta animación.</text></g>}
  <rect width="1920" height="1080" fill={C.n950} opacity={1-sm(0,.6,T)}/>
 </svg>}

/* ---------- reloj + controles ---------- */
export default function TallerAgente() {
  const [T, setT] = useState(12.5);
  const [playing, setPlaying] = useState(false);
  const [snd, setSnd] = useState(false);
  const [visible, setVisible] = useState(false);
  const box = useRef(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced.current) setPlaying(true);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  const running = playing && visible;
  useEffect(() => {
    if (!running) return;
    let raf, last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setT((t) => (t + dt) % DURATION);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const btn = "eb-btn";
  return (
    <div ref={box}>
      <div
        role="img"
        aria-label="Animación isométrica de un robot que recibe una tarea, usa herramientas, corrige un error y guarda lo aprendido en su memoria, como trabaja un agente de IA."
        className="relative w-full overflow-hidden rounded-xl border border-border"
        style={{ aspectRatio: "16 / 9", background: C.n950 }}
      >
        <Piece T={T} playing={running} snd={snd} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className={btn} aria-pressed={playing} onClick={() => setPlaying((p) => !p)}>
          {playing ? "Pausar" : "Reproducir"}
        </button>
        <button
          type="button"
          className={btn}
          aria-pressed={snd}
          onClick={() => {
            if (!snd) auInit();
            setSnd(!snd);
          }}
        >
          {snd ? "Sonido activado" : "Activar sonido"}
        </button>
        <label className="flex min-w-48 flex-1 items-center gap-2 text-sm text-fg-3">
          <span className="sr-only">Posición de la animación</span>
          <input
            type="range"
            min={0}
            max={DURATION}
            step={0.1}
            value={T}
            onChange={(e) => setT(Number(e.target.value))}
            className="w-full"
          />
        </label>
      </div>
    </div>
  );
}
