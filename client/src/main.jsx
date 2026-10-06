import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, BrainCircuit, FileUp, LogOut, Plus, Search, Sparkles, X, CheckCircle2, ChevronRight, NotebookPen, Trash2, Mic, Square, Sun, Moon, MessageSquare, Send, LayoutDashboard, StickyNote, FileText, Folder, Copy, Volume2, RefreshCw, ArrowLeft, User, Home, Trophy, ClipboardCheck, ChevronDown } from 'lucide-react';
import './styles.css';

const api = async (path, options = {}) => {
  const token = localStorage.getItem('notely_token');

  const response = await fetch(`${import.meta.env.VITE_API_URL || ''}${path}`, { ...options, headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const data = response.status === 204 ? null : await response.json();
  if (response.status === 401 && token) { localStorage.removeItem('notely_token'); localStorage.removeItem('notely_user'); window.dispatchEvent(new Event('auth-expired')); }
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};
const emptyNote = { title: 'Untitled note', content: '', tags: [] };
const Logo = ({ size = 36 }) => <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Smart Note Manager logo" style={{ flexShrink: 0 }}><rect width="64" height="64" rx="16" fill="var(--brand)"/><path d="M19 13h20l10 10v26a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4z" fill="#fff"/><path d="M39 13v7a3 3 0 0 0 3 3h7z" fill="#fff" opacity=".55"/><rect x="21" y="29" width="22" height="3" rx="1.5" fill="var(--brand)"/><rect x="21" y="36" width="16" height="3" rx="1.5" fill="var(--brand)" opacity=".35"/><rect x="21" y="43" width="10" height="3" rx="1.5" fill="var(--brand)" opacity=".35"/><circle cx="46" cy="45" r="9.5" fill="#fff"/><circle cx="46" cy="45" r="7.5" fill="var(--brand)"/><path d="M42.6 45.2l2.5 2.5 4.4-5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ACCENTS = [['indigo', '#4f46e5'], ['emerald', '#059669'], ['rose', '#e11d48'], ['amber', '#d97706'], ['slate', '#334155']];
const useAccent = () => {
  const [accent, setAccent] = useState(() => localStorage.getItem('sn_accent') || 'indigo');
  useEffect(() => { document.documentElement.dataset.accent = accent; localStorage.setItem('sn_accent', accent); }, [accent]);
  return [accent, setAccent];
};
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const useTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('notely_theme') || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('notely_theme', theme); }, [theme]);
  return [theme, () => setTheme(t => t === 'dark' ? 'light' : 'dark')];
};
const ThemeToggle = ({ theme, onToggle, className = 'theme-btn' }) => <button className={className} onClick={onToggle} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}</button>;
const ago = (d) => { const sec = (Date.now() - new Date(d)) / 1000; for (const [unit, v] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (sec >= v) return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(-Math.floor(sec / v), unit); return 'just now'; };
const date = (d) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(d));

function Auth({ onAuth, expired }) {
  const [register, setRegister] = useState(false), [form, setForm] = useState({ name: '', email: '', password: '' }), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const submit = async (e) => { e.preventDefault(); setLoading(true); setError(''); try { onAuth(await api(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(form) })); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  return <main className="auth-page"><section className="auth-card"><Logo size={56}/><p className="eyebrow" style={{ marginTop: 18 }}>SMART NOTE MANAGER</p><h1>Think less.<br/><em>Remember more.</em></h1><p className="subcopy">Sign in to open your notes, or create a free account to get started.</p>{expired && <p className="error" style={{ marginBottom: 12 }}>Your session expired. Please sign in again.</p>}<form onSubmit={submit} className="space-y-3">{register && <input required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>}<input required type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/><input required type="password" minLength="6" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>{error && <p className="error">{error}</p>}<button className="primary w-full" disabled={loading}>{loading ? 'One moment…' : register ? 'Create my space' : 'Welcome back'} <ChevronRight size={17}/></button></form><button className="switch" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></section></main>;
}

function Quiz({ note, onComplete }) {
  const questions = note?.questions || [];
  const [answers, setAnswers] = useState([]), [current, setCurrent] = useState(0), [result, setResult] = useState(null), [saving, setSaving] = useState(false);
  useEffect(() => { setAnswers([]); setCurrent(0); setResult(null); }, [note?._id, questions.length]);
  if (!questions.length) return <p className="empty">Generate a study analysis to create a quiz.</p>;
  if (result) return <div className="result"><CheckCircle2 size={36}/><h2>Quiz complete</h2><strong>{result.score} / {result.totalQuestions}</strong><p>{result.percentage}% correct · {result.correctAnswers} right · {result.totalQuestions - result.correctAnswers} wrong</p><div className="review">{questions.map((q, i) => <div key={i}><b>{i + 1}. {q.question}</b><p className={result.selectedAnswers[i] === q.answer ? 'right' : 'wrong-text'}>Your answer: {q.options[result.selectedAnswers[i]]} · Correct: {q.options[q.answer]}</p><small>{q.explanation}</small></div>)}</div></div>;
  const q = questions[current], answered = Number.isInteger(answers[current]);
  const choose = (answer) => { const next = [...answers]; next[current] = answer; setAnswers(next); };
  const submit = async () => { if (answers.length !== questions.length || answers.some((a) => !Number.isInteger(a))) return; setSaving(true); try { const saved = await api(`/api/notes/${note._id}/quiz-attempts`, { method: 'POST', body: JSON.stringify({ selectedAnswers: answers }) }); setResult(saved); onComplete?.(saved); } finally { setSaving(false); } };
  return <div className="quiz"><p className="progress">Question {current + 1} of {questions.length}</p><div className="bar"><i style={{ width: `${((current + 1) / questions.length) * 100}%` }}/></div><section className="question"><b>{q.question}</b><div>{q.options.map((o, oi) => <button key={oi} onClick={() => choose(oi)} className={`option ${answers[current] === oi ? 'chosen' : ''}`}>{String.fromCharCode(65 + oi)}. {o}</button>)}</div></section><div className="quiz-nav"><button onClick={() => setCurrent(current - 1)} disabled={!current}>Previous</button>{current < questions.length - 1 ? <button className="dark" onClick={() => setCurrent(current + 1)} disabled={!answered}>Next</button> : <button className="dark" onClick={submit} disabled={!answered || saving}>{saving ? 'Saving…' : 'Submit quiz'}</button>}</div></div>;
}

const SUGGESTIONS = ['Summarize this PDF in 5 bullets', 'What are the key terms defined here?', 'List any dates or numbers mentioned'];
function AskPdf({ note, chat, setChat }) {
  const [q, setQ] = useState(''), [loading, setLoading] = useState(false), endRef = useRef(null);
  const messages = chat.id === note._id ? chat.messages : [];
  useEffect(() => { endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' }); }, [messages.length, loading]);
  useEffect(() => { setLoading(false); setQ(''); }, [note._id]);
  const ask = async (text) => {
    const question = text.trim(); if (!question || loading) return;
    const id = note._id, history = messages.filter(m => !m.error).slice(-6).map(m => ({ role: m.role, text: m.text }));
    const push = (m) => setChat(c => c.id === id ? { ...c, messages: [...c.messages, m] } : c);
    setQ(''); setLoading(true); push({ role: 'user', text: question });
    try { const { answer } = await api(`/api/notes/${id}/ask`, { method: 'POST', body: JSON.stringify({ question, history }) }); push({ role: 'ai', text: answer }); }
    catch (err) { push({ role: 'ai', text: err.message || 'Something went wrong. Please try again.', error: true }); }
    finally { setLoading(false); }
  };
  return <div className="ask">
    <div className="chat" aria-live="polite">
      {!messages.length && <div className="chat-empty"><p>Ask anything about <b>{note.title}</b>. Answers come only from this PDF.</p><div className="suggest">{SUGGESTIONS.map(s => <button key={s} onClick={() => ask(s)} disabled={loading}>{s}</button>)}</div></div>}
      {messages.map((m, i) => <div key={i} className={`msg ${m.role}${m.error ? ' error' : ''}`}>{m.text}</div>)}
      {loading && <div className="msg ai typing" aria-label="AI is thinking"><i/><i/><i/></div>}
      <div ref={endRef}/>
    </div>
    <form className="chat-form" onSubmit={e => { e.preventDefault(); ask(q); }}>
      <input value={q} maxLength={1000} onChange={e => setQ(e.target.value)} placeholder="Ask a question about this PDF…" disabled={loading} aria-label="Question"/>
      <button className="primary" disabled={loading || !q.trim()} aria-label="Send"><Send size={16}/></button>
      {!!messages.length && <button type="button" className="ghost" onClick={() => setChat({ id: note._id, messages: [] })} disabled={loading}>Clear</button>}
    </form>
  </div>;
}

function App() {
  const [session, setSession] = useState(() => { try { return localStorage.getItem('notely_token') ? JSON.parse(localStorage.getItem('notely_user')) : null; } catch { return null; } });
  const [expired, setExpired] = useState(false);
  useEffect(() => { const out = () => { setSession(null); setNotes([]); setActive(null); setExpired(true); }; window.addEventListener('auth-expired', out); return () => window.removeEventListener('auth-expired', out); }, []);
  const [notes, setNotes] = useState([]), [active, setActive] = useState(null), [search, setSearch] = useState(''), [folder, setFolder] = useState('All'), [tab, setTab] = useState('note'), [busy, setBusy] = useState(''), [notice, setNotice] = useState('');
  const [theme, toggleTheme] = useTheme(), [accent, setAccent] = useAccent(), [listening, setListening] = useState(false), [interim, setInterim] = useState('');
  const recRef = useRef(null), activeRef = useRef(null); activeRef.current = active;
  const [chat, setChat] = useState({ id: null, messages: [] }), [nav, setNav] = useState('dashboard'), [open, setOpen] = useState(false), [menu, setMenu] = useState(false), [stats, setStats] = useState({ quizzesAttempted: 0, averageScore: 0 });
  useEffect(() => { if (active?._id) setOpen(true); }, [active?._id]);
  useEffect(() => { setChat({ id: active?._id || null, messages: [] }); }, [active?._id]);
  const load = async () => { try { const all = await api('/api/notes'); setNotes(all); if (!active && all[0] && window.innerWidth > 820) setActive(all[0]); api('/api/notes/stats').then(setStats).catch(() => {}); } catch (e) { setNotice(e.message); } };
  useEffect(() => { if (session) load(); }, [session]);
  const filtered = useMemo(() => notes.filter(n => (nav !== 'pdf' || n.source === 'pdf') && (folder === 'All' || n.folder === folder) && `${n.title} ${n.content} ${n.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())), [notes, search, folder, nav]);
  const grouped = useMemo(() => ['Study', 'Personal', 'Work', 'Fun'].map(f => [f, filtered.filter(n => (n.folder || 'Study') === f)]).filter(([, l]) => l.length), [filtered]);
  const auth = ({ token, user }) => { localStorage.setItem('notely_token', token); localStorage.setItem('notely_user', JSON.stringify(user)); setSession(user); setExpired(false); };
  const logout = () => { localStorage.removeItem('notely_token'); localStorage.removeItem('notely_user'); setSession(null); setNotes([]); setActive(null); };
  const save = async (next = active) => {
  if (!next) return;

  setBusy('save');

  try {
    const updated = await api(`/api/notes/${next._id}`, {
      method: 'PATCH',
      body: JSON.stringify(next)
    });

    setActive(updated);

    setNotes(ns =>
      ns.map(n =>
        n._id === updated._id ? updated : n
      )
    );

    setNotice('Saved');
  } catch (e) {
    setNotice(e.message);
  } finally {
    setBusy('');
  }
};

const newNote = async () => {
  try {
    const n = await api('/api/notes', {
      method: 'POST',
      body: JSON.stringify(emptyNote)
    });

    setNotes(ns => [n, ...ns]);
    setActive(n);
    setTab('note');

    return n;
  } catch (e) {
    setNotice(e.message);
  }
};

const deleteNote = async () => {
  if (
    !active ||
    !window.confirm(`Delete "${active.title}"? This cannot be undone.`)
  ) {
    return;
  }

  try {
    await api(`/api/notes/${active._id}`, {
      method: 'DELETE'
    });

    const remaining = notes.filter(
      n => n._id !== active._id
    );

    setNotes(remaining);

    setActive(
      window.innerWidth > 820
        ? remaining[0] || null
        : null
    );

    setTab('note');
    setNotice('Note deleted.');
  } catch (e) {
    setNotice(e.message);
  }
};

const doAi = async () => {
  if (!active) return;

  setBusy('analyze');

  try {
    const out = await api(
      `/api/notes/${active._id}/analyze`,
      {
        method: 'POST'
      }
    );

    const updated = {
      ...active,
      ...out
    };

    setActive(updated);

    setNotes(ns =>
      ns.map(n =>
        n._id === updated._id ? updated : n
      )
    );

    setTab('summary');
  } catch (e) {
    setNotice(e.message);
  } finally {
    setBusy('');
  }
};

const importFile = async (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  setBusy('pdf');

  try {
    let n;

    if (
      /\.pdf$/i.test(file.name) ||
      file.type === 'application/pdf'
    ) {
      const body = new FormData();
      body.append('file', file);

      n = await api('/api/notes/import-pdf', {
        method: 'POST',
        body
      });
    } else {
      const text = await file.text();

      n = await api('/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: file.name,
          content: text.slice(0, 300000),
          tags: []
        })
      });
    }

    setNotes(ns => [n, ...ns]);
    setActive(n);
    setTab('note');
    setNotice('File imported — ready for AI.');
  } catch (e) {
    setNotice(e.message);
  } finally {
    setBusy('');
    e.target.value = '';
  }
};
  const haltDictation = () => { const r = recRef.current; if (!r) return; r.onend = null; r.stop(); recRef.current = null; setListening(false); setInterim(''); save(); };
  const startDictation = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setNotice('Voice typing works in Chrome, Edge or Safari.'); return; }
    const rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = navigator.language || 'en-IN';
    rec.onresult = (ev) => {
      let done = '', live = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) { const t = ev.results[i][0].transcript; if (ev.results[i].isFinal) done += t; else live += t; }
      setInterim(live);
      if (done.trim()) setActive(prev => prev ? { ...prev, content: `${prev.content}${prev.content && !/\s$/.test(prev.content) ? ' ' : ''}${done.trim()} ` } : prev);
    };
    rec.onerror = (ev) => { if (ev.error !== 'no-speech' && ev.error !== 'aborted') setNotice(ev.error === 'not-allowed' ? 'Microphone permission was blocked.' : `Voice error: ${ev.error}`); };
    rec.onend = () => { setListening(false); setInterim(''); recRef.current = null; const cur = activeRef.current; if (!cur) return; const words = cur.content.trim().split(/\s+/).filter(Boolean); const next = cur.title === 'Untitled note' && words.length ? { ...cur, title: words.slice(0, 6).join(' ') } : cur; setActive(next); save(next); };
    recRef.current = rec; rec.start(); setListening(true); setTab('note');
  };
  const toggleDictation = () => listening ? recRef.current?.stop() : startDictation();
  const voiceNote = async () => { const n = await newNote(); if (n) setTimeout(startDictation, 0); };
  if (!session) return <><ThemeToggle theme={theme} onToggle={toggleTheme} className="theme-fab"/><Auth onAuth={auth} expired={expired}/></>;
  const FOLDERS = ['Study', 'Personal', 'Work', 'Fun'], detail = open && active, ptab = ['points', 'quiz', 'ask'].includes(tab) ? tab : 'summary';
  const words = active?.content.trim() ? active.content.trim().split(/\s+/).length : 0, pdfCount = notes.filter(n => n.source === 'pdf').length, sumCount = notes.filter(n => n.summary).length;
  const select = (n) => { haltDictation(); setActive(n); setOpen(true); setTab('summary'); };
  const go = (v) => { setNav(v); setOpen(false); setMenu(false); if (v !== 'notes') setFolder('All'); };
  const copy = async () => { try { await navigator.clipboard.writeText(`${active.summary}\n\n${(active.bulletPoints || []).map(p => '• ' + p).join('\n')}`); setNotice('Copied to clipboard'); } catch { setNotice('Copy is not available in this browser.'); } };
  const listen = () => { if (!('speechSynthesis' in window)) return setNotice('Speech playback is not supported in this browser.'); speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(active.summary)); };
  const stat = [[StickyNote, notes.length, 'Total Notes'], [FileText, pdfCount, 'PDFs Processed'], [Sparkles, sumCount, 'AI Summaries'], [ClipboardCheck, stats.quizzesAttempted, 'Quizzes Attempted'], [Trophy, `${stats.averageScore}%`, 'Average Score']];
  return <main className={`shell nav-${nav} ${detail ? 'detail' : ''}`}>
    <aside className="side">
      <div className="logo"><Logo size={34}/><b>Smart Note Manager</b></div>
      <nav className="menu">{[['dashboard', LayoutDashboard, 'Dashboard'], ['notes', StickyNote, 'My Notes'], ['pdf', FileText, 'PDF & AI']].map(([k, I, l]) => <button key={k} className={nav === k && folder === 'All' ? 'on' : ''} onClick={() => go(k)}><I size={18}/>{l}</button>)}</nav>
      <p className="side-label">Folders</p>
      <nav className="menu">{FOLDERS.map(f => <button key={f} className={folder === f ? 'on' : ''} onClick={() => { setFolder(folder === f ? 'All' : f); setNav('notes'); setOpen(false); }}><Folder size={18} className={`fi f-${f}`}/>{f}<em>{notes.filter(n => n.folder === f).length}</em></button>)}</nav>
      <nav className="menu bottom"><button onClick={voiceNote}><Mic size={18}/>Voice Assistant</button><button onClick={logout}><LogOut size={18}/>Logout</button></nav>
    </aside>
    <section className="main">
      {notice && <div className="toast">{notice}<button onClick={() => setNotice('')}><X size={15}/></button></div>}
      <div className="top">
        <div className="mlogo"><Logo size={30}/></div>
        <label className="gsearch"><Search size={16}/><input placeholder="Search notes, PDFs or keywords..." value={search} onChange={e => setSearch(e.target.value)}/></label>
        <ThemeToggle theme={theme} onToggle={toggleTheme} className="theme-top2"/>
        <button className="me" onClick={() => setMenu(!menu)}><span>{session.name?.slice(0, 1)}</span><b>{session.name}</b><ChevronDown size={15}/></button>
        {menu && <div className="pop"><b>{session.name}</b><div className="swatches" role="group" aria-label="Accent colour">{ACCENTS.map(([k, c]) => <button key={k} className={accent === k ? 'sw on' : 'sw'} style={{ background: c }} title={`${k} accent`} aria-label={`${k} accent`} onClick={() => setAccent(k)}/>)}</div><button onClick={toggleTheme}>{theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>} {theme === 'dark' ? 'Light' : 'Dark'} theme</button><button onClick={logout}><LogOut size={15}/> Sign out</button></div>}
      </div>
      {nav === 'dashboard' && <><div className="hello"><div><h1>{greet()}, {session.name?.split(' ')[0]}</h1><p>Keep your ideas organized and learn smarter.</p></div><button className="primary" onClick={newNote}><Plus size={16}/> New Note</button></div>
        <div className="stats">{stat.map(([I, v, l], i) => <div key={l} className={`stat s${i}`}><span><I size={22}/></span><div><b>{v}</b><small>{l}</small></div></div>)}</div></>}
      <div className="cols">
        <div className="card list">
          <div className="card-h"><h2>{nav === 'pdf' ? 'PDF & AI' : folder !== 'All' ? folder : 'My Notes'}</h2><button className="icon" onClick={newNote} title="New note"><Plus size={16}/></button></div>
          {nav === 'pdf' && <label className="dropzone"><FileUp size={26}/><b>{busy === 'pdf' ? 'Processing…' : 'Upload a PDF'}</b><span>Get AI summary, key points and MCQs automatically</span><input type="file" hidden accept="application/pdf,.pdf,.txt,.md" onChange={importFile}/></label>}
          <div className="items">{filtered.length ? filtered.map(n => <button key={n._id} className={`item ${active?._id === n._id ? 'sel' : ''}`} onClick={() => select(n)}><span className={`ico f-${n.folder || 'Study'}`}><FileText size={18}/></span><span className="meta"><b>{n.title}</b><em className="snip">{n.content.replace(/\s+/g, ' ').slice(0, 80) || 'Empty note'}</em><small><i className={`chip f-${n.folder || 'Study'}`}>{n.folder || 'Study'}</i>{ago(n.updatedAt)}</small></span></button>) : <p className="empty">No notes here yet. Create one, speak one, or upload a PDF.</p>}</div>
        </div>
        {active ? <>
          <div className="card ed">
            <div className="ed-h"><button className="back icon" onClick={() => setOpen(false)}><ArrowLeft size={18}/></button><input className="title2" value={active.title} onChange={e => setActive({ ...active, title: e.target.value })} onBlur={() => save()}/><button className={`mic ${listening ? 'live' : ''}`} onClick={toggleDictation} title="Dictate into this note">{listening ? <Square size={13}/> : <Mic size={15}/>} {listening ? 'Stop' : 'Dictate'}</button><button className="icon danger" onClick={deleteNote} title="Delete this note"><Trash2 size={16}/></button></div>
            <div className="ed-meta"><select className={`chip f-${active.folder || 'Study'}`} value={active.folder || 'Study'} onChange={e => { const next = { ...active, folder: e.target.value }; setActive(next); save(next); }}>{FOLDERS.map(f => <option key={f}>{f}</option>)}</select><span>Edited {ago(active.updatedAt)}</span><input className="tags" value={active.tags.join(', ')} placeholder="tags, comma separated" onChange={e => setActive({ ...active, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}/></div>
            <textarea value={active.content} placeholder="Start writing your idea…" onChange={e => setActive({ ...active, content: e.target.value })} onBlur={() => save()}/>
            <div className="ed-foot"><span>{words} words</span><span>{busy === 'save' ? 'Saving…' : '✓ Saves automatically'}</span></div>
            {listening && <div className="live-strip"><i/>Listening{interim ? `: ${interim}` : '…'}</div>}
          </div>
          <div className="card panel">
            <div className="ptabs">{[['summary', 'Summary'], ['points', 'Key Points'], ['quiz', 'Quiz'], ...(active.source === 'pdf' ? [['ask', 'Ask PDF']] : [])].map(([k, l]) => <button key={k} className={ptab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
            <div className="pbody">
              {ptab === 'summary' && (active.summary ? <div className="pc"><h3><Sparkles size={16}/> AI Summary</h3><p>{active.summary}</p></div> : <p className="empty">Generate an analysis to get a summary, key points and a quiz.</p>)}
              {ptab === 'points' && (active.bulletPoints?.length ? <div className="pc"><h3><Sparkles size={16}/> Key Points</h3><ul>{active.bulletPoints.map((pt, i) => <li key={i}>{pt}</li>)}</ul></div> : <p className="empty">No key points yet. Generate an analysis first.</p>)}
              {ptab === 'quiz' && <Quiz note={active} onComplete={() => { setNotice('Quiz result saved to your private history.'); api('/api/notes/stats').then(setStats).catch(() => {}); }}/>}
              {ptab === 'ask' && active.source === 'pdf' && <AskPdf note={active} chat={chat} setChat={setChat}/>}
            </div>
            <div className="pfoot"><button className="primary" onClick={doAi} disabled={!!busy}><RefreshCw size={15}/> {busy === 'analyze' ? 'Analyzing…' : active.summary ? 'Regenerate' : 'Generate'}</button><button onClick={copy} disabled={!active.summary}><Copy size={15}/> Copy</button><button onClick={listen} disabled={!active.summary}><Volume2 size={15}/> Listen</button></div>
          </div></> : <div className="card blank"><Logo size={56}/><h2>Your ideas have a home.</h2><p>Type it, speak it, or upload a file — then let AI turn it into a quiz.</p><div className="welcome-actions"><button className="primary" onClick={newNote}><Plus size={16}/> Type a note</button><button className="ghost" onClick={voiceNote}><Mic size={16}/> Speak a note</button></div></div>}
      </div>
    </section>
    <nav className="tabbar">{[['dashboard', Home, 'Home'], ['notes', StickyNote, 'Notes'], ['pdf', FileText, 'PDF']].map(([k, I, l]) => <button key={k} className={nav === k ? 'on' : ''} onClick={() => go(k)}><I size={20}/>{l}</button>)}<button onClick={voiceNote}><Mic size={20}/>Voice</button><button onClick={() => setMenu(!menu)}><User size={20}/>Profile</button></nav>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
