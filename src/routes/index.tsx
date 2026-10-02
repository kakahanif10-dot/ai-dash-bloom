import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Code2, ExternalLink, Eye, Globe2, LayoutTemplate, LoaderCircle, Monitor, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Plus, RotateCcw, Smartphone, Sparkles, Tablet, Trash2, WandSparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateWebsite } from '@/lib/generate.functions'
import atelierImage from '@/assets/atelier-interior.jpg'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Webgen Studio — AI Website Builder' },
    { name: 'description', content: 'Create and refine responsive websites with AI in a live browser workspace.' },
    { property: 'og:title', content: 'Webgen Studio — AI Website Builder' },
    { property: 'og:description', content: 'Create and refine responsive websites with AI in a live browser workspace.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Workspace,
})

type Draft = { id: string; title: string; html: string; updatedAt: number; messages: Message[] }
type Message = { id: string; role: 'user' | 'assistant'; text: string }
type Device = 'desktop' | 'tablet' | 'mobile'
const STORAGE_KEY = 'webgen.studio.drafts.v1'
const uid = () => crypto.randomUUID()

function starterHtml() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atelier Forma</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f1eb;color:#202521;font-family:Arial,sans-serif}header{height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 5%;background:#f4f1eb}.logo{font-family:Georgia,serif;font-size:24px;letter-spacing:-1px}nav{display:flex;gap:32px}nav a{color:#313b34;text-decoration:none;font-size:12px}header button,.hero button{border:0;background:#2f4d39;color:white;padding:14px 21px;cursor:pointer;font-size:12px}.hero{position:relative;min-height:480px;display:flex;align-items:center;overflow:hidden;background:#272923 url('${atelierImage}') center 54%/cover}.hero:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(21,28,22,.72),transparent 78%)}.hero-content{position:relative;color:white;margin-left:7%;max-width:540px}.eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase}.hero h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(44px,6vw,78px);line-height:1.05;margin:20px 0}.hero p{font-size:14px;line-height:1.7;max-width:340px}.hero button{background:#efede5;color:#253329;margin-top:14px}.intro{display:grid;grid-template-columns:1fr 1fr;gap:50px;padding:56px 7%}.intro span{color:#809084;font-size:11px;letter-spacing:2px}.intro h2{font:normal 36px Georgia,serif;margin:13px 0}.intro p{line-height:1.7;color:#636b63;font-size:14px;max-width:440px}@media(max-width:700px){header{height:64px}nav{display:none}.hero{min-height:520px}.hero-content{margin:0 7%}.intro{grid-template-columns:1fr;gap:8px}.hero h1{font-size:52px}}</style></head><body><header><div class="logo">ATELIER FORMA<span style="color:#899588">.</span></div><nav><a href="#about">Our approach</a><a href="#about">Projects</a><a href="#about">Journal</a></nav><button onclick="document.querySelector('#about').scrollIntoView({behavior:'smooth'})">Get in touch ↗</button></header><main><section class="hero"><div class="hero-content"><div class="eyebrow">Architecture & interiors · Est. 2018</div><h1>Spaces that<br>feel like home.</h1><p>Considered architecture and interiors, shaped around the way you live.</p><button onclick="document.querySelector('#about').scrollIntoView({behavior:'smooth'})">Explore our work ↗</button></div></section><section class="intro" id="about"><div><span>01 / OUR PHILOSOPHY</span><h2>Made for living,<br>made to last.</h2></div><p>We believe the best spaces tell a story. From the first sketch to the final detail, we create places with warmth, purpose, and a lasting sense of belonging.</p></section></main></body></html>`
}

function readDrafts(): Draft[] {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : [] } catch { return [] }
}
function Workspace() {
  const generate = useServerFn(generateWebsite)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [activeId, setActiveId] = useState('starter')
  const [html, setHtml] = useState(starterHtml)
  const [messages, setMessages] = useState<Message[]>([])
  const [prompt, setPrompt] = useState('')
  const [title, setTitle] = useState('Untitled website')
  const [device, setDevice] = useState<Device>('desktop')
  const [view, setView] = useState<'preview' | 'code'>('preview')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)
  const [version, setVersion] = useState(0)
  const [ready, setReady] = useState(false)
  const chatEnd = useRef<HTMLDivElement>(null)
  const [iframeKey, setIframeKey] = useState(0)

  useEffect(() => { const saved = readDrafts(); setDrafts(saved); if (saved.length) { const first = saved[0]; setActiveId(first.id); setHtml(first.html); setTitle(first.title); setMessages(first.messages || []) } setReady(true) }, [])
  useEffect(() => { if (ready) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts)) } catch { setError('Browser storage is full. Your latest changes may not be saved.') } } }, [drafts, ready])
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, busy])
  const activeDraft = useMemo(() => drafts.find(d => d.id === activeId), [drafts, activeId])
  const save = (nextHtml: string, nextMessages: Message[], nextTitle = title) => {
    if (activeId === 'starter') {
      const id = uid()
      setActiveId(id)
      setDrafts(prev => [{ id, title: nextTitle, html: nextHtml, messages: nextMessages, updatedAt: Date.now() }, ...prev])
    } else {
      setDrafts(prev => prev.map(d => d.id === activeId ? { ...d, title: nextTitle, html: nextHtml, messages: nextMessages, updatedAt: Date.now() } : d))
    }
  }
  const createNew = () => { setActiveId('starter'); setHtml(starterHtml()); setTitle('Untitled website'); setMessages([]); setPrompt(''); setError(''); setView('preview'); setVersion(v => v + 1) }
  const selectDraft = (draft: Draft) => { setActiveId(draft.id); setHtml(draft.html); setTitle(draft.title); setMessages(draft.messages || []); setError(''); setView('preview'); setVersion(v => v + 1) }
  const removeDraft = (id: string) => { setDrafts(prev => prev.filter(d => d.id !== id)); if (id === activeId) createNew() }
  const submit = async (text = prompt) => {
    const request = text.trim()
    if (request.length < 3 || busy) return
    setBusy(true); setError(''); setPrompt('')
    const pending: Message[] = [...messages, { id: uid(), role: 'user', text: request }]
    setMessages(pending)
    try {
      const result = await generate({ data: { prompt: request, previousHtml: activeId === 'starter' ? undefined : html } })
      const nextTitle = activeId === 'starter' ? request.slice(0, 38).replace(/[.!?]+$/, '') : title
      const done: Message[] = [...pending, { id: uid(), role: 'assistant', text: activeId === 'starter' ? 'Your website is ready. Tell me what you’d like to change.' : 'I’ve updated your website. What should we refine next?' }]
      setHtml(result.html); setTitle(nextTitle); setMessages(done); save(result.html, done, nextTitle); setVersion(v => v + 1); setView('preview')
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'); setMessages(pending) }
    finally { setBusy(false) }
  }
  const updateCode = (value: string) => { setHtml(value); save(value, messages) }
  const openPreview = () => { const blob = new Blob([html], { type: 'text/html' }); const url = URL.createObjectURL(blob); const tab = window.open(url, '_blank', 'noopener,noreferrer'); if (!tab) setError('Allow pop-ups to open the website in a new tab.'); setTimeout(() => URL.revokeObjectURL(url), 60000) }

  return <div className="studio-shell">
    <aside className={`studio-sidebar ${sidebarOpen ? '' : 'is-collapsed'}`}>
      <div className="brand-row"><div className="brand-mark"><Sparkles size={17}/></div>{sidebarOpen && <span className="brand-name">webgen<span>.</span></span>}{sidebarOpen && <Button variant="ghost" size="icon" title="Collapse sidebar" aria-label="Collapse sidebar" onClick={() => setSidebarOpen(false)} className="ml-auto"><PanelLeftClose size={17}/></Button>}</div>
      {!sidebarOpen ? <div className="collapsed-actions"><Button variant="ghost" size="icon" title="Expand sidebar" aria-label="Expand sidebar" onClick={() => setSidebarOpen(true)}><PanelLeftOpen size={17}/></Button><Button variant="ghost" size="icon" title="New website" aria-label="New website" onClick={createNew}><Plus size={18}/></Button></div> : <>
        <div className="sidebar-main"><Button onClick={createNew} className="new-site-btn"><Plus size={16}/> New website</Button><div className="sidebar-label">WORKSPACE</div><div className="sidebar-link selected"><LayoutTemplate size={16}/> My websites <span>{drafts.length}</span></div><div className="sidebar-label recent-label">RECENT PROJECTS</div><div className="draft-list">{drafts.length ? drafts.map(d => <div className={`draft-row ${d.id === activeId ? 'active' : ''}`} key={d.id}><Button variant="ghost" className="draft-select" onClick={() => selectDraft(d)} title={d.title}><Globe2 size={15}/><span>{d.title}</span></Button><Button variant="ghost" size="icon" className="draft-delete" title={`Delete ${d.title}`} aria-label={`Delete ${d.title}`} onClick={() => removeDraft(d.id)}><Trash2 size={14}/></Button></div>) : <p className="empty-projects">Your websites will appear here.</p>}</div></div>
        <div className="sidebar-bottom"><div className="sidebar-status"><span className="status-dot"/> AI website builder <span className="status-caption">ONLINE</span></div><div className="profile-row"><div className="profile-avatar">W</div><div><strong>My workspace</strong><small>Personal projects</small></div><MoreHorizontal size={17}/></div></div>
      </>}
    </aside>
    <main className="studio-main">
      <header className="topbar"><div className="topbar-left"><span className="breadcrumb-muted">Workspace</span><span className="breadcrumb-slash">/</span><span className="project-title">{title}</span><ChevronDown size={14} className="breadcrumb-chevron"/></div><div className="topbar-right"><span className="saved-label"><Check size={13}/> {busy ? 'Generating' : 'Saved locally'}</span><Button variant="outline" size="sm" onClick={openPreview} title="Open website in new tab"><ExternalLink size={15}/><span className="topbar-text">Open website</span></Button></div></header>
      <div className="workspace-body">
        {chatOpen && <section className="chat-pane"><div className="pane-header"><div className="pane-heading"><span className="ai-icon"><Sparkles size={15}/></span><strong>AI assistant</strong></div><Button variant="ghost" size="icon" title="Hide assistant" aria-label="Hide assistant" onClick={() => setChatOpen(false)}><PanelLeftClose size={17}/></Button></div>
          <div className="conversation"><div className="chat-content">{messages.length === 0 && <div className="welcome"><div className="welcome-icon"><WandSparkles size={24}/></div><span className="welcome-overline">YOUR CREATIVE PARTNER</span><h1>What will we<br/><em>build today?</em></h1><p>Describe the website you have in mind. Start from an idea, then refine it together.</p><div className="suggestion-list"><span>TRY AN IDEA</span>{['A modern portfolio for a photographer', 'A website for a neighborhood coffee shop', 'A clean SaaS landing page for a calendar tool'].map(s => <Button key={s} variant="outline" onClick={() => setPrompt(s)} className="suggestion"><span>{s}</span><ArrowRight size={14}/></Button>)}</div></div>}
            {messages.map(m => <div key={m.id} className={`chat-message ${m.role}`}><div className="message-avatar">{m.role === 'assistant' ? <Sparkles size={14}/> : 'Y'}</div><div><div className="message-role">{m.role === 'assistant' ? 'Webgen' : 'You'}</div><p>{m.text}</p></div></div>)}
            {busy && <div className="chat-message assistant"><div className="message-avatar"><Sparkles size={14}/></div><div><div className="message-role">Webgen</div><p className="thinking"><LoaderCircle size={15} className="spin"/> Building your website...</p></div></div>}
            <div ref={chatEnd}/></div></div>
          <div className="composer-wrap">{error && <div className="error-banner">{error}<Button variant="ghost" size="icon" onClick={() => setError('')} aria-label="Dismiss error"><X size={14}/></Button></div>}<form className="composer" onSubmit={e => { e.preventDefault(); void submit() }}><textarea aria-label="Describe your website" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit() } }} placeholder={activeId === 'starter' ? 'Describe the website you want to create...' : 'Ask for a change to your website...'} rows={3} maxLength={4000}/><div className="composer-footer"><span><Sparkles size={13}/> AI website builder</span><Button type="submit" size="icon" disabled={busy || prompt.trim().length < 3} title="Generate website" aria-label="Generate website" className="send-btn">{busy ? <LoaderCircle size={16} className="spin"/> : <ArrowRight size={17}/>}</Button></div></form><div className="composer-hint">Press Enter to send · Shift + Enter for a new line</div></div>
        </section>}
        <section className="preview-pane"><div className="preview-toolbar"><div className="preview-tabs">{!chatOpen && <Button variant="ghost" size="icon" title="Show assistant" aria-label="Show assistant" onClick={() => setChatOpen(true)}><PanelLeftOpen size={17}/></Button>}<Button variant="ghost" className={`view-tab ${view === 'preview' ? 'active' : ''}`} onClick={() => setView('preview')}><Eye size={15}/> Preview</Button><Button variant="ghost" className={`view-tab ${view === 'code' ? 'active' : ''}`} onClick={() => setView('code')}><Code2 size={15}/> Code</Button></div><div className="device-controls"><Button variant="ghost" size="icon" className={device === 'desktop' ? 'device-active' : ''} title="Desktop preview" aria-label="Desktop preview" onClick={() => setDevice('desktop')}><Monitor size={16}/></Button><Button variant="ghost" size="icon" className={device === 'tablet' ? 'device-active' : ''} title="Tablet preview" aria-label="Tablet preview" onClick={() => setDevice('tablet')}><Tablet size={16}/></Button><Button variant="ghost" size="icon" className={device === 'mobile' ? 'device-active' : ''} title="Mobile preview" aria-label="Mobile preview" onClick={() => setDevice('mobile')}><Smartphone size={16}/></Button><span className="toolbar-divider"/><Button variant="ghost" size="icon" title="Refresh preview" aria-label="Refresh preview" onClick={() => setIframeKey(k => k + 1)}><RotateCcw size={15}/></Button></div></div>
          <div className="canvas"><div className={`browser-frame ${device}`}><div className="browser-chrome"><div className="chrome-dots"><i/><i/><i/></div><div className="address"><Globe2 size={12}/><span>{activeDraft ? activeDraft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'your-new-website'}.webgen.site</span></div><div className="chrome-arrows"><ArrowLeft size={12}/><ArrowRight size={12}/></div></div>{view === 'preview' ? <iframe key={`${version}-${iframeKey}`} title="Website preview" sandbox="allow-scripts allow-forms allow-modals" srcDoc={html} className="website-iframe"/> : <textarea className="code-editor" aria-label="Edit website HTML" spellCheck={false} value={html} onChange={e => updateCode(e.target.value)} />}</div></div><div className="preview-footer"><span><span className="live-dot"/> Live preview</span><span>{device === 'desktop' ? 'Desktop · Responsive' : device === 'tablet' ? 'Tablet · 768px' : 'Mobile · 390px'}</span></div>
        </section>
      </div>
    </main>
  </div>
}
