'use client';

import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { useEffect, useMemo, useRef, useState } from 'react';

const W = 1080;
const H = 1350;
const PREVIEW = 0.285;

const fonts = [
  'Vazirmatn',
  'Sahel',
  'Shabnam',
  'Samim',
  'Parastoo',
  'Tanha',
  'Gandom',
  'Nahid',
  'Vazir Code',
];

const sampleHtml = `
<h1>از یک متن، یک روایت پیوسته بساز.</h1>
<p>این ابزار متن را مثل یک سند واقعی می‌بیند؛ نه مجموعه‌ای از باکس‌های جدا.</p>
<p>هر چیزی که اینجا بنویسی، با همان ترتیب و استایل از یک اسلاید به اسلاید بعدی جریان پیدا می‌کند. اگر <strong>فونت</strong>، اندازه، فاصلهٔ خطوط یا حاشیه را تغییر بدهی، صفحه‌بندی کل سند دوباره محاسبه می‌شود.</p>
<h2>چرا این مهم است؟</h2>
<p>چون برای پست‌های چنداسلایدی لازم نیست خودت حدس بزنی متن هر صفحه کجا تمام شود. مرورگر همان کاری را می‌کند که یک صفحه‌آرای واقعی انجام می‌دهد.</p>
<ul>
  <li>پشتیبانی از متن فارسی و انگلیسی</li>
  <li>استایل‌های درون متن</li>
  <li>تیتر، بولد، ایتالیک و لیست</li>
  <li>خروجی مستقیم 1080×1350</li>
</ul>
<p>این فقط شروع نسخهٔ حرفه‌ای‌تر ابزار است.</p>`;

type Align = 'right' | 'center' | 'left' | 'justify';

type Theme = {
  name: string;
  bg: string;
  color: string;
  accent: string;
  font: string;
};

const themes: Theme[] = [
  { name: 'Paper', bg: '#fffdf8', color: '#171717', accent: '#7c3aed', font: 'Vazirmatn' },
  { name: 'Ink', bg: '#111318', color: '#f5f7fb', accent: '#8b5cf6', font: 'Vazirmatn' },
  { name: 'Editorial', bg: '#f3efe7', color: '#1f2937', accent: '#b45309', font: 'Markazi Text' },
  { name: 'Minimal', bg: '#ffffff', color: '#0f172a', accent: '#2563eb', font: 'Noto Sans Arabic' },
];

function cleanHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

export default function Page() {
  const [html, setHtml] = useState(sampleHtml);
  const [font, setFont] = useState('Vazirmatn');
  const [size, setSize] = useState(50);
  const [lineHeight, setLineHeight] = useState(1.75);
  const [padding, setPadding] = useState(92);
  const [bg, setBg] = useState('#fffdf8');
  const [color, setColor] = useState('#171717');
  const [accent, setAccent] = useState('#7c3aed');
  const [align, setAlign] = useState<Align>('right');
  const [slides, setSlides] = useState(1);
  const [busy, setBusy] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);

  const editorRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const savedRange = useRef<Range | null>(null);

  const innerW = W - padding * 2;
  const innerH = H - padding * 2;
  const step = innerW + padding * 2;

  const flowStyle = useMemo(
    () =>
      ({
        '--page-bg': bg,
        '--text-color': color,
        '--accent': accent,
        '--body-font': font,
        '--body-size': size + 'px',
        '--line-height': lineHeight,
        '--inner-w': innerW + 'px',
        '--inner-h': innerH + 'px',
        '--column-gap': padding * 2 + 'px',
      }) as React.CSSProperties,
    [bg, color, accent, font, size, lineHeight, innerW, innerH, padding],
  );

  useEffect(() => {
    const stored = localStorage.getItem('insta-slides-document');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed.html) {
        setHtml(parsed.html);
        setEditorVersion((v) => v + 1);
      }
      if (parsed.font) setFont(parsed.font);
      if (parsed.size) setSize(parsed.size);
      if (parsed.lineHeight) setLineHeight(parsed.lineHeight);
      if (parsed.padding) setPadding(parsed.padding);
      if (parsed.bg) setBg(parsed.bg);
      if (parsed.color) setColor(parsed.color);
      if (parsed.accent) setAccent(parsed.accent);
      if (parsed.align) setAlign(parsed.align);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'insta-slides-document',
      JSON.stringify({ html, font, size, lineHeight, padding, bg, color, accent, align }),
    );
  }, [html, font, size, lineHeight, padding, bg, color, accent, align]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
    }
  }, [editorVersion]);

  useEffect(() => {
    const onSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRange.current = range.cloneRange();
      }
    };
    document.addEventListener('selectionchange', onSelection);
    return () => document.removeEventListener('selectionchange', onSelection);
  }, []);

  useEffect(() => {
    const measure = measureRef.current;
    if (!measure) return;
    const id = requestAnimationFrame(() => {
      const width = Math.max(innerW, measure.scrollWidth);
      const count = Math.max(1, Math.round((width + padding * 2) / step));
      setSlides(count);
    });
    return () => cancelAnimationFrame(id);
  }, [html, flowStyle, innerW, padding, step]);

  function restoreSelection() {
    const sel = window.getSelection();
    if (!sel || !savedRange.current) return;
    sel.removeAllRanges();
    sel.addRange(savedRange.current);
  }

  function command(cmd: string, value?: string) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(cmd, false, value);
    if (editorRef.current) setHtml(cleanHtml(editorRef.current.innerHTML));
  }

  function setBlock(tag: 'p' | 'h1' | 'h2' | 'blockquote') {
    command('formatBlock', tag);
  }

  function resetSample() {
    setHtml(sampleHtml);
    setEditorVersion((v) => v + 1);
  }

  function clearDoc() {
    setHtml('<p><br></p>');
    setEditorVersion((v) => v + 1);
  }

  function applyTheme(theme: Theme) {
    setBg(theme.bg);
    setColor(theme.color);
    setAccent(theme.accent);
    setFont(theme.font);
  }

  async function exportNode(index: number) {
    const node = exportRefs.current[index];
    if (!node) return null;
    return toPng(node, {
      cacheBust: true,
      pixelRatio: 1,
      canvasWidth: W,
      canvasHeight: H,
      width: W,
      height: H,
    });
  }

  async function exportOne(index: number) {
    const url = await exportNode(index);
    if (!url) return;
    const response = await fetch(url);
    saveAs(await response.blob(), `slide-${String(index + 1).padStart(2, '0')}.png`);
  }

  async function exportAll() {
    setBusy(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < slides; i += 1) {
        const url = await exportNode(i);
        if (!url) continue;
        zip.file(
          `slide-${String(i + 1).padStart(2, '0')}.png`,
          url.replace(/^data:image\/png;base64,/, ''),
          { base64: true },
        );
      }
      saveAs(await zip.generateAsync({ type: 'blob' }), 'instagram-carousel.zip');
    } finally {
      setBusy(false);
    }
  }

  const flow = (index = 0) => (
    <div className="flowViewport" style={{ width: innerW, height: innerH }}>
      <div
        className="flowColumns"
        style={{
          ...flowStyle,
          width: innerW,
          height: innerH,
          transform: `translateX(-${index * step}px)`,
          textAlign: align,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brandRow">
          <div>
            <h1>Insta Slides</h1>
            <p>Continuous carousel editor</p>
          </div>
          <span className="version">v2</span>
        </div>

        <section className="panel">
          <div className="panelTitle">
            <strong>Document</strong>
            <span>{slides} slide{slides > 1 ? 's' : ''}</span>
          </div>

          <div className="richToolbar">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); command('bold'); }}><b>B</b></button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); command('italic'); }}><i>I</i></button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); command('underline'); }}><u>U</u></button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); command('strikeThrough'); }}>S̶</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); setBlock('h1'); }}>H1</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); setBlock('h2'); }}>H2</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); setBlock('p'); }}>P</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); command('insertUnorderedList'); }}>• List</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); command('insertOrderedList'); }}>1. List</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); setBlock('blockquote'); }}>❝</button>
          </div>

          <div
            key={editorVersion}
            ref={editorRef}
            className="richEditor"
            contentEditable
            suppressContentEditableWarning
            dir="rtl"
            lang="fa"
            onInput={(e) => setHtml(cleanHtml(e.currentTarget.innerHTML))}
          />

          <div className="actionRow">
            <button type="button" onClick={resetSample}>نمونه</button>
            <button type="button" onClick={clearDoc}>پاک کردن</button>
          </div>
        </section>

        <section className="panel">
          <div className="panelTitle"><strong>Typography</strong></div>
          <label>فونت</label>
          <select value={font} onChange={(e) => setFont(e.target.value)}>
            {fonts.map((f) => <option key={f}>{f}</option>)}
          </select>

          <div className="twoCol">
            <div>
              <label>اندازه</label>
              <input type="number" min="22" max="120" value={size} onChange={(e) => setSize(+e.target.value)} />
            </div>
            <div>
              <label>Line height</label>
              <input type="number" min="1" max="3" step=".05" value={lineHeight} onChange={(e) => setLineHeight(+e.target.value)} />
            </div>
            <div>
              <label>حاشیه</label>
              <input type="number" min="40" max="180" step="2" value={padding} onChange={(e) => setPadding(+e.target.value)} />
            </div>
            <div>
              <label>تراز</label>
              <select value={align} onChange={(e) => setAlign(e.target.value as Align)}>
                <option value="right">راست</option>
                <option value="justify">دوطرفه</option>
                <option value="center">وسط</option>
                <option value="left">چپ</option>
              </select>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelTitle"><strong>Style</strong></div>
          <div className="themeGrid">
            {themes.map((theme) => (
              <button
                type="button"
                className="themeCard"
                key={theme.name}
                onClick={() => applyTheme(theme)}
                style={{ background: theme.bg, color: theme.color }}
              >
                <span style={{ background: theme.accent }} />
                {theme.name}
              </button>
            ))}
          </div>
          <div className="colorGrid">
            <label>متن<input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
            <label>پس‌زمینه<input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></label>
            <label>Accent<input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} /></label>
          </div>
        </section>
      </aside>

      <section className="workspace">
        <header className="workspaceHeader">
          <div>
            <h2>Pages</h2>
            <p>متن به‌صورت پیوسته بین صفحه‌ها جریان دارد.</p>
          </div>
          <button className="primary" onClick={exportAll} disabled={busy}>
            {busy ? 'در حال خروجی...' : 'Export all PNG'}
          </button>
        </header>

        <div className="pagesGrid">
          {Array.from({ length: slides }).map((_, index) => (
            <article className="pageCard" key={index}>
              <div className="pageMeta">
                <span>Slide {index + 1}</span>
                <button type="button" onClick={() => exportOne(index)}>PNG</button>
              </div>
              <div className="previewShell" style={{ width: W * PREVIEW, height: H * PREVIEW }}>
                <div className="previewScale" style={{ transform: `scale(${PREVIEW})` }}>
                  <div
                    ref={(node) => { exportRefs.current[index] = node; }}
                    className="exportPage"
                    style={{ width: W, height: H, background: bg, color }}
                  >
                    <div style={{ position: 'absolute', inset: padding }}>
                      {flow(index)}
                    </div>
                    <div className="slideNumber" style={{ color: accent }}>{index + 1}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="measureStage" aria-hidden>
          <div style={{ position: 'absolute', inset: padding }}>
            <div
              ref={measureRef}
              className="flowColumns"
              style={{ ...flowStyle, width: innerW, height: innerH, textAlign: align }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
