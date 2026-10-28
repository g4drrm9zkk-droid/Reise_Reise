/* Lokale Auswertung von Reisedokumenten – reine Funktion, keine Netzwerkzugriffe. */
(function(g){
const MON={jan:1,januar:1,january:1,feb:2,februar:2,february:2,mär:3,mar:3,märz:3,maerz:3,march:3,apr:4,april:4,mai:5,may:5,jun:6,juni:6,june:6,jul:7,juli:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,okt:10,oct:10,oktober:10,october:10,nov:11,november:11,dez:12,dec:12,dezember:12,december:12};
const AIR='EK LH LX OS SN BA AF KL IB VY FR U2 W6 TK QR EY SQ CX QF NZ VA JQ AA UA DL AC AY SK DY KE OZ JL NH TG MH GA PR CI BR AI 6E SV MS ET KQ SA LA AM AV CM B6 WN HA LO RO TP AZ EW 4U X3 HV BT FI A3 PC LS WK EN DS 9C MU CA CZ HU FM GF WY UL BG PK 3K TR AK FD OD VN QZ EI VS LG FZ G9 XQ S7 KM NK F9 WS PD RJ LY HY JU'.split(' ');
const FLIGHT=new RegExp('\\b('+AIR.join('|')+')\\s?(\\d{2,4})\\b','g');
const STOP=new Set(['THE','AND','FOR','PDF','USD','EUR','AUD','GBP','CHF','VAT','TAX','NET','ONE','TWO','SEE','NOT','YOU','ARE','WAS','PNR','TOP','ALL','APP','WEB','MWS','NON','END','REF','FEE','PAX','CAN','MAY']);
const COUNTRIES=[['Australien','australia|australien'],['Neuseeland','new zealand|neuseeland'],['USA','united states|\\busa\\b|vereinigte staaten'],['Kanada','canada|kanada'],['Großbritannien','united kingdom|großbritannien|great britain'],['Japan','\\bjapan\\b'],['Thailand','thailand'],['Vietnam','vietnam'],['Indonesien','indonesia|indonesien'],['Indien','\\bindia\\b|indien'],['China','\\bchina\\b'],['Singapur','singapore|singapur'],['Malaysia','malaysia'],['Philippinen','philippin'],['Kambodscha','cambodia|kambodscha'],['Sri Lanka','sri lanka'],['Türkei','turkey|türkei|türkiye'],['Ägypten','egypt|ägypten'],['Marokko','morocco|marokko'],['Südafrika','south africa|südafrika'],['Kenia','kenya|kenia'],['Tansania','tanzania|tansania'],['Brasilien','brazil|brasilien'],['Mexiko','mexico|mexiko'],['Vereinigte Arabische Emirate','united arab emirates|\\buae\\b|vereinigte arabische'],['Schengen','schengen'],['Südkorea','south korea|südkorea'],['Jordanien','jordan'],['Nepal','\\bnepal\\b']];
const MN=Object.keys(MON).sort((a,b)=>b.length-a.length).join('|');
const R={iso:/(\d{4})-(\d{2})-(\d{2})/g,dmy:/(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4}|\d{2})(?!\d)/g,sl:/(\d{1,2})\/(\d{1,2})\/(\d{4})/g,dm:new RegExp('(\\d{1,2})\\.?\\s?('+MN+')(?![A-Za-zäÄ])\\.?,?\\s?(\\d{4}|\\d{2})?(?!\\d)','gi'),md:new RegExp('(?<![A-Za-zäÄ])('+MN+')\\.?\\s(\\d{1,2})(?:st|nd|rd|th)?,?\\s(\\d{4})','gi'),tm:/(\d{1,2}):(\d{2})(?::\d{2})?\s?(AM|PM|am|pm)?/g};
const p2=n=>String(n).padStart(2,'0');
function iso(y,m,d){if(!(m>=1&&m<=12&&d>=1&&d<=31))return null;if(y==null){const now=new Date();y=now.getFullYear();if(new Date(y,m-1,d)<now-45*864e5)y++}return y+'-'+p2(m)+'-'+p2(d)}
const y2=y=>{y=+y;return y<100?2000+y:y};
function scan(s){const T=[];const add=(re,fn)=>{re.lastIndex=0;let m;while((m=re.exec(s))){const v=fn(m);if(v)T.push({i:m.index,e:m.index+m[0].length,t:v[0],v:v[1]})}};
 add(R.iso,m=>['d',iso(+m[1],+m[2],+m[3])]);add(R.dmy,m=>['d',iso(y2(m[3]),+m[2],+m[1])]);add(R.sl,m=>['d',iso(+m[3],+m[2],+m[1])]);
 add(R.dm,m=>{const mo=MON[m[2].toLowerCase()];return mo&&['d',iso(m[3]?y2(m[3]):null,mo,+m[1])]});
 add(R.md,m=>{const mo=MON[m[1].toLowerCase()];return mo&&['d',iso(+m[3],mo,+m[2])]});
 add(R.tm,m=>{let h=+m[1];const ap=(m[3]||'').toLowerCase();if(ap==='pm'&&h<12)h+=12;if(ap==='am'&&h===12)h=0;return h<24?['t',p2(h)+':'+m[2]]:null});
 T.sort((a,b)=>a.i-b.i||b.e-a.e);const o=[];let end=-1;for(const t of T){if(t.i>=end&&t.v){o.push(t);end=t.e}}return o}
const firstDate=s=>{const t=scan(s).find(x=>x.t==='d');return t?t.v:''};
const after=(txt,re,n)=>{const m=re.exec(txt);return m?firstDate(txt.slice(m.index+m[0].length,m.index+m[0].length+(n||80))):''};
function findRef(txt,labels,ok){const re=new RegExp('(?:'+labels+')\\s*[:#.]?\\s*([A-Za-z0-9][A-Za-z0-9\\-\\.]{4,19})','gi');let m;while((m=re.exec(txt))){const c=m[1].replace(/[.\-]+$/,'');if(c.length>=5&&ok.test(c))return c}return''}
const FREF='buchungs\\s?(?:code|nummer|referenz)|booking\\s*(?:reference|ref\\.?|code|number)|confirmation\\s*(?:code|number|no\\.?)|reservation\\s*(?:code|number)|reservierungs\\s?(?:code|nummer)|bestätigungs\\s?(?:code|nummer)|\\bPNR\\b|record\\s*locator|buchung';
const LAB={ci:/check-?in(?:\s+at|\s+ab)?|einchecken/i,bd:/boarding|einsteigen|einstieg/i,dep:/\bdeparture\b|\bdeparts\b|\babflug\b/i,arr:/\barrival\b|\barrives\b|\bankunft\b/i};
function legBlocks(txt){const re=/\bLeg\s+\d+\s+of\s+\d+/gi,ix=[];let m;while((m=re.exec(txt)))ix.push(m.index);return ix.map((s,k)=>({w:txt.slice(s,ix[k+1]||txt.length),s,leg:1}))}
function winBlocks(txt){const ms=[...txt.matchAll(FLIGHT)];return ms.map((x,k)=>({w:txt.slice(x.index,Math.min(k+1<ms.length?ms[k+1].index:txt.length,x.index+700)),s:x.index,pre:txt.slice(Math.max(k?ms[k-1].index+ms[k-1][0].length:0,x.index-100),x.index)}))}
function build(txt,blocks){const F1=new RegExp(FLIGHT.source);
 return blocks.map(b=>{let w=b.w;const cp=w.search(/Coupon validity/i);if(cp>=0){const e=w.indexOf('\n',cp);if(e>=0){const bm=/^[^\n]*baggage[^\n]*/i.exec(w.slice(e+1));w=w.slice(0,e+1+(bm?bm[0].length:0))}}else if(b.leg)w=w.slice(0,1200);
  const m=w.match(F1)||w.match(/\bFlight\s*:?\s*([A-Z0-9]{2})\s?(\d{2,4})\b/);if(!m)return null;
  const T=scan(w),ts=T.filter(x=>x.t==='t'),ds=T.filter(x=>x.t==='d'),L0=Object.keys(LAB).map(k=>{const x=LAB[k].exec(w);return x&&{k,i:x.index}}).filter(Boolean).sort((a,b)=>a.i-b.i);let L=L0;if(ts.length<L.length)L=L0.filter(l=>l.k!=='bd');if(ts.length<L.length)L=L0.filter(l=>l.k==='dep'||l.k==='arr');const n=L.length;
  const pre=b.pre?scan(b.pre).reverse():[],lD=pre.find(x=>x.t==='d'),lT=pre.find(x=>x.t==='t'),preD=lD&&(!lT||lT.i<lD.i)?lD.v:'';let V={},mapped=0;
  if(n&&L.some(l=>l.k==='dep')&&ts.length>=n&&(b.leg||(ds.length>=n&&!preD))){mapped=1;L.forEach((l,j)=>{V[l.k]={d:(ds.length>=n?ds[j]:(ds[0]||{})).v||preD,t:ts[j].v}})}
  else{const dt=ts[0]?ts[0].v:'',at=ts[1]?ts[1].v:'',ad=ts[1]?(ds.find(x=>x.i>ts[0].i&&x.i<ts[1].i)||{}).v||'':'';let dd=preD||(ds.find(x=>!ts[0]||x.i<ts[0].i)||ds[0]||{}).v||'';
   if(!dd){const p=scan(txt.slice(0,b.s)).filter(x=>x.t==='d');if(p.length)dd=p[p.length-1].v}V={dep:{d:dd,t:dt},arr:{d:ad||dd,t:at}}}
  const D=V.dep||{},A=V.arr||{},C=V.bd||V.ci||{};
  {const near=(x,y)=>!x||!y||Math.abs(new Date(x)-new Date(y))<=2*864e5,ok=d=>new Date(d)>Date.now()-60*864e5;if(D.d&&A.d&&!near(D.d,A.d)){if(ok(A.d)&&!ok(D.d))D.d=A.d;else A.d=D.d}if(C.d&&D.d&&!near(C.d,D.d))C.d=D.d}let from='',to='';const pa=[...w.slice(0,300).matchAll(/\(([A-Z]{3})\)/g)].map(x=>x[1]).filter(x=>!STOP.has(x));if(pa.length>1){from=pa[0];to=pa[1]}else{const r=w.slice(0,500).match(/\b([A-Z]{3})\s*(?:→|->|–|—|-|>|to|nach)\s*([A-Z]{3})\b/);if(r&&!STOP.has(r[1])&&!STOP.has(r[2])){from=r[1];to=r[2]}}
  let seat=(w.match(/(?:sitz(?:platz)?|seat)\s*:?\s*(\d{1,2}[A-K])\b/i)||[])[1];if(!seat){const sl=/\b(?:seat|sitz)/i.exec(w);if(sl)seat=(w.slice(sl.index).match(/\b(\d{1,2}[A-K])\b/)||[])[1]}
  const gate=(w.match(/\bgate\s*:?\s*([A-Z]?\d{1,3}[A-Z]?)\b/i)||[])[1],tm=[...w.matchAll(/terminal\s*:?\s*(\d|[A-Z])\b/gi)].map(x=>x[1]),term=tm.length?'Terminal '+tm[0]+(tm[1]&&tm[1]!==tm[0]?' → '+tm[1]:''):'';
  const tf=(w.match(/\b(Saver|Flex Plus|Flex|Light|Basic|Classic|Lite|Special)\b/)||[])[1],cb=w.match(/\b(Premium Economy|Economy|Business|First)(?: Class)?(?:\s+(Saver|Flex|Light|Basic|Classic|Lite|Special))?/i),bag=(w.match(/(?:baggage|gepäck|freigepäck)\s*:?\s*(\d+\s*(?:kgs?|pcs?|pieces?|stück))/i)||[])[1];
  return{fn:m[1]+' '+m[2],dd:D.d||'',dt:D.t||'',ad:A.d||'',at:A.t||'',d0:C.d||'',t0:C.t||'',from,to,note:[cb&&(cb[1]+((cb[2]||tf)?' '+(cb[2]||tf):'')),seat&&'Sitz '+seat,term,gate&&'Gate '+gate,bag&&'Gepäck '+bag].filter(Boolean).join(', '),sc:(from?1:0)+(D.d?1:0)+(D.t?1:0)+(A.t?1:0)}}).filter(Boolean)}
function flightsOf(txt){
 const ref=findRef(txt,FREF,/^[A-Z0-9]{5,8}$/),A=build(txt,legBlocks(txt)),B=build(txt,winBlocks(txt)),have=new Set(A.map(x=>x.fn));
 const fix=A.map(x=>{if(x.dd&&x.dt)return x;const y=B.find(z=>z.fn===x.fn&&z.dd&&z.dt);return y?Object.assign({},y,{from:x.from||y.from,to:x.to||y.to}):x});
 let c=fix.concat(B.filter(x=>!have.has(x.fn)));if(c.length>1)c=c.filter(x=>x.sc>0);
 const best=new Map();c.forEach(x=>{const k=x.fn+'|'+x.dd;if(!best.has(k)||best.get(k).sc<x.sc)best.set(k,x)});
 c=[...best.values()];c=c.filter(x=>x.dd||!c.some(y=>y.fn===x.fn&&y.dd));
 const out=c.map(x=>({kind:'flights',title:x.fn+(x.from?' '+x.from+' → '+x.to:''),date0:x.t0&&x.d0?x.d0+'T'+x.t0:'',date:x.dd?x.dd+'T'+(x.dt||'00:00'):'',date2:x.at?(x.ad||x.dd)+'T'+x.at:'',ref,note:x.note}));
 const N=+((txt.match(/\bLeg\s+\d+\s+of\s+(\d+)/i)||[])[1]||0);if(N&&out.length<N)out.warn='Nur '+out.length+' von '+N+' Flügen erkannt.';return out}
function itemsToText(items){const a=items.filter(i=>i.s&&i.s.trim()).sort((p,q)=>q.y-p.y),lines=[];let cur=null;
 for(const it of a){const h=it.h||8;if(cur&&cur.last-it.y<=Math.max(2,.7*Math.min(h,cur.h))){cur.items.push(it);cur.last=it.y;cur.h=Math.min(cur.h,h)}else{cur={items:[it],last:it.y,h};lines.push(cur)}}
 return lines.map(l=>l.items.sort((p,q)=>p.x-q.x).map(i=>i.s.trim()).join(' ')).join('\n')}
function hotelOf(txt){
 let title='';const a=txt.match(/(?:booking|reservation|stay) at ([^\n.,]+?)(?: is| has| was|\.|,|\n|$)/i)||txt.match(/buchung (?:im|in der|in|bei) ([^\n.,]+?)(?: wurde| ist|\.|,|\n|$)/i);
 if(a)title=a[1].trim();
 if(!title){const l=txt.split('\n').map(s=>s.trim()).find(l=>l.length>=3&&l.length<=80&&/\b(hotel|resort|inn|lodge|hostel|suites?|apartments?|residence|motel|villa|b&b|pension|gasthof)\b/i.test(l)&&!/check|buchung|booking|confirm|bestätig|reservier|your |ihre |willkommen|thank|danke|price|preis|total|cancel|storn|policy|bedingung|@|http/i.test(l));if(l)title=l}
 if(!title){const m=txt.match(/(?:unterkunft|property|accommodation|hotel)\s*:\s*(.+)/i);if(m)title=m[1].trim()}
 const ci=after(txt,/check-?in|anreise|arrival date|ankunft(?:sdatum)?/i),co=after(txt,/check-?out|abreise(?:datum)?|departure date/i);
 const ref=findRef(txt,'booking\\s*(?:id|number|no\\.?|ref(?:erence)?|code)?|confirmation\\s*(?:number|no\\.?|code)|buchungs\\s?(?:nummer|code)|reservierungs\\s?(?:nummer|code)|bestätigungs\\s?(?:nummer|code)|reservation\\s*(?:number|no\\.?|id)',/\d/);
 const ad=txt.split('\n').map(s=>s.trim()).find(l=>l.length<90&&(/\b\d{1,4}\s+[A-Za-z .]{3,30}\s(?:street|st\.?|road|rd\.?|avenue|ave\.?|lane|drive|boulevard)\b/i.test(l)||/(?:straße|str\.|weg|platz|allee)\s*\d+/i.test(l)));
 return[{kind:'hotels',title:title||'Hotel',date:ci,date2:co,ref,note:ad||''}]}
function visaOf(txt){
 const type=/evisitor/i.test(txt)?'eVisitor':/\beta\b/i.test(txt)?'ETA':/\besta\b/i.test(txt)?'ESTA':/visum/i.test(txt)?'Visum':'Visa';
 let country='',bi=1e9;COUNTRIES.forEach(([l,r])=>{const m=new RegExp(r,'i').exec(txt);if(m&&m.index<bi){bi=m.index;country=l}});
 const from=after(txt,/gültig ab|valid from|date of grant|grant date|issue date|issued|ausgestellt am|erteilt am|ausstellungsdatum/i,60),to=after(txt,/gültig bis|valid until|valid to|valid through|expiry date|expires?|expiration|ablaufdatum|läuft ab/i,60);
 const ref=findRef(txt,'visa\\s*grant\\s*(?:number|no\\.?)|grant\\s*(?:number|no\\.?)|application\\s*(?:id|number|no\\.?)|transaction\\s*(?:reference|number)|antrags(?:nummer|id)|visum(?:s)?nummer|visa\\s*(?:number|no\\.?)|reference\\s*(?:number|no\\.?)|\\bTRN\\b',/\d/);
 const sub=(txt.match(/subclass\s*(\d+)/i)||[])[1],stay=(txt.match(/(?:stay|aufenthalt)[^.\n]{0,40}?(\d+\s*(?:days|tage|tagen|months|monate|monaten))/i)||[])[1];
 return[{kind:'visa',title:type+(country?' '+country:''),date:from,date2:to,ref,note:[sub&&'Subclass '+sub,stay&&'Aufenthalt '+stay].filter(Boolean).join(', ')}]}
function parseDoc(raw){
 const txt=String(raw||'').replace(/[\u00a0\u202f]/g,' ').replace(/[ \t]+/g,' ').trim();if(txt.length<10)return[];
 const n=re=>(txt.match(re)||[]).length;
 const sc={flights:n(FLIGHT)*3+n(/boarding|flug|flight|abflug|departure|e-?ticket|\bgate\b|terminal|\bpnr\b/gi),hotels:n(/hotel|check-?in|check-?out|zimmer|\broom\b|übernacht|\bnights?\b|nächte|unterkunft|booking\.com|airbnb|apartment/gi),visa:n(/visa|visum|evisitor|\beta\b|\besta\b|einreisegenehmigung|travel authori|grant/gi)*2};
 const top=Object.keys(sc).sort((a,b)=>sc[b]-sc[a])[0];if(!sc[top])return[];
 let r=top==='flights'?flightsOf(txt):top==='hotels'?hotelOf(txt):visaOf(txt);
 if(top==='flights'&&!r.length){const m=txt.match(/\b([A-Z]{3})\s*(?:→|->|–|—|-|>|to|nach)\s*([A-Z]{3})\b/),d=firstDate(txt);if(m)r=[{kind:'flights',title:'Flug '+m[1]+' → '+m[2],date:d?d+'T00:00':'',date2:'',ref:findRef(txt,FREF,/^[A-Z0-9]{5,8}$/),note:''}]}
 return r}
g.parseDoc=parseDoc;g.itemsToText=itemsToText;if(typeof module!=='undefined')module.exports={parseDoc,itemsToText};
})(typeof window!=='undefined'?window:globalThis);
