'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {toPng} from 'html-to-image';
import JSZip from 'jszip';
import {saveAs} from 'file-saver';

const W=1080,H=1350;
const fonts=['Vazirmatn','Noto Sans Arabic','Noto Naskh Arabic','Lalezar','Markazi Text','Inter','Merriweather','Playfair Display','Roboto Slab','Caveat'];
const sample='این یک نمونه متن است برای ساخت اسلایدهای اینستاگرامی.\n\nمتن مثل یک سند پیوسته رفتار می‌کند؛ یعنی فقط متن را می‌نویسی و برنامه خودش آن را میان اسلایدها صفحه‌بندی می‌کند.\n\nاگر فونت، اندازه، فاصله خطوط یا حاشیه را عوض کنی، کل متن دوباره صفحه‌بندی می‌شود؛ شبیه صفحه‌های نرم‌افزار Word.\n\nاین نسخه‌ی اولیه است و پایه‌ی ویرایشگر کامل‌تر خواهد بود.';

export default function Page(){
 const [text,setText]=useState(sample),[font,setFont]=useState('Vazirmatn'),[size,setSize]=useState(54),[line,setLine]=useState(1.8),[weight,setWeight]=useState(500),[pad,setPad]=useState(92),[bg,setBg]=useState('#ffffff'),[color,setColor]=useState('#111827'),[align,setAlign]=useState<'right'|'center'|'left'|'justify'>('right'),[slides,setSlides]=useState<string[]>([sample]),[busy,setBusy]=useState(false);
 const measure=useRef<HTMLDivElement>(null), refs=useRef<(HTMLDivElement|null)[]>([]);
 const style=useMemo(()=>({fontFamily:font,fontSize:size,lineHeight:line,fontWeight:weight,padding:pad,background:bg,color,textAlign:align,direction:'rtl' as const,whiteSpace:'pre-wrap' as const,overflowWrap:'anywhere' as const}),[font,size,line,weight,pad,bg,color,align]);
 useEffect(()=>{const m=measure.current;if(!m)return; const words=text.split(/(\s+)/).filter(Boolean); let cur='',out:string[]=[]; const fits=(s:string)=>{m.textContent=s||' ';return m.scrollHeight<=H}; for(const w of words){const c=cur+w;if(fits(c))cur=c;else{if(cur.trim())out.push(cur.trimEnd());cur=w.trimStart();if(!fits(cur)){let p='';for(const ch of cur){if(fits(p+ch))p+=ch;else{if(p)out.push(p);p=ch}}cur=p}}} if(cur||!out.length)out.push(cur.trimEnd());setSlides(out)},[text,style]);
 async function exportAll(){setBusy(true);try{const zip=new JSZip();for(let i=0;i<refs.current.length;i++){const n=refs.current[i];if(!n)continue;const u=await toPng(n,{cacheBust:true,pixelRatio:1,canvasWidth:W,canvasHeight:H});zip.file('slide-'+String(i+1).padStart(2,'0')+'.png',u.replace(/^data:image\/png;base64,/,''),{base64:true})}saveAs(await zip.generateAsync({type:'blob'}),'instagram-carousel.zip')}finally{setBusy(false)}}
 return <main className="shell">
  <aside className="side">
   <h1>Insta Slides Editor</h1><p className="muted">متن واحد، صفحه‌بندی پیوسته، خروجی اسلاید اینستاگرام.</p>
   <label>متن اصلی</label><textarea value={text} onChange={e=>setText(e.target.value)}/>
   <div className="row"><button onClick={()=>setText(sample)}>متن نمونه</button><button onClick={()=>setText('')}>پاک کردن</button></div>
   <label>فونت</label><select value={font} onChange={e=>setFont(e.target.value)}>{fonts.map(f=><option key={f}>{f}</option>)}</select>
   <div className="grid">
    <div><label>اندازه</label><input type="number" min="22" max="120" value={size} onChange={e=>setSize(+e.target.value)}/></div>
    <div><label>وزن</label><select value={weight} onChange={e=>setWeight(+e.target.value)}><option>400</option><option>500</option><option>600</option><option>700</option></select></div>
    <div><label>فاصله خطوط</label><input type="number" min="1" max="3" step=".1" value={line} onChange={e=>setLine(+e.target.value)}/></div>
    <div><label>حاشیه</label><input type="number" min="40" max="220" value={pad} onChange={e=>setPad(+e.target.value)}/></div>
    <div><label>تراز</label><select value={align} onChange={e=>setAlign(e.target.value as any)}><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option><option value="justify">دوطرفه</option></select></div>
    <div><label>رنگ متن</label><input type="color" value={color} onChange={e=>setColor(e.target.value)}/></div>
    <div><label>پس‌زمینه</label><input type="color" value={bg} onChange={e=>setBg(e.target.value)}/></div>
   </div>
  </aside>
  <section className="work">
   <header><div><h2>پیش‌نمایش</h2><span>{slides.length} اسلاید · 1080×1350</span></div><button className="primary" onClick={exportAll} disabled={busy}>{busy?'در حال خروجی...':'خروجی PNG + ZIP'}</button></header>
   <div className="cards">{slides.map((s,i)=><article key={i}><div className="meta">اسلاید {i+1}</div><div className="preview"><div className="scale"><div ref={n=>{refs.current[i]=n}} className="page" style={style}>{s}</div></div></div></article>)}</div>
   <div ref={measure} className="measure" style={style}/>
  </section>
 </main>
}