import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'

// Utils
const getBaseUrl = () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const toWsUrl = (httpUrl) => {
  try {
    if (httpUrl.startsWith('https://')) return httpUrl.replace('https://', 'wss://')
    if (httpUrl.startsWith('http://')) return httpUrl.replace('http://', 'ws://')
    return `ws://${httpUrl.replace(/^\/\//, '')}`
  } catch {
    return 'ws://localhost:8000'
  }
}

function Layout({ children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-xl font-bold text-blue-600">Agent Inbox</Link>
          <nav className="ml-auto flex items-center gap-2">
            <Link to="/test" className="text-sm text-gray-600 hover:text-gray-900">Health</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

function Badge({ children, color = 'gray' }) {
  const styles = {
    gray: 'bg-gray-100 text-gray-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[color]}`}>{children}</span>
}

function Conversations() {
  const baseUrl = getBaseUrl()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [importing, setImporting] = useState(false)
  const [csvText, setCsvText] = useState('name,email,phone,text\nJane,jane@example.com,,When is my loan approved?\nBob,bob@example.com,,I need to update my account phone number\n')
  const navigate = useNavigate()

  const fetchConversations = async (query) => {
    setLoading(true)
    try {
      const url = new URL(baseUrl + '/api/conversations')
      if (query) url.searchParams.set('q', query)
      const res = await fetch(url)
      const data = await res.json()
      setItems((data && data.items) || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConversations(q) }, [])

  const onSearch = (e) => {
    e.preventDefault()
    fetchConversations(q)
  }

  const importCsv = async () => {
    try {
      setImporting(true)
      const res = await fetch(baseUrl + '/api/messages/import_csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: csvText, channel: 'web' })
      })
      if (!res.ok) throw new Error('Import failed')
      await fetchConversations(q)
      setImporting(false)
      alert('CSV imported')
    } catch (e) {
      console.error(e)
      setImporting(false)
      alert('Import failed')
    }
  }

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-4">
        <form onSubmit={onSearch} className="flex-1 flex gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search conversations..." className="flex-1 border rounded px-3 py-2" />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Search</button>
        </form>
        <button onClick={()=>document.getElementById('csv_modal').showModal()} className="px-3 py-2 rounded border bg-white hover:bg-gray-50">Import CSV</button>
      </div>

      <div className="bg-white border rounded-lg divide-y">
        {loading ? (
          <div className="p-6 text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-gray-500">No conversations yet.</div>
        ) : (
          items.map((it)=> (
            <div key={it.customer_id} className="p-4 flex items-start gap-4 hover:bg-gray-50 cursor-pointer" onClick={()=>navigate(`/c/${it.customer_id}`)}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{it.customer?.name || 'Unknown'}</div>
                  {it.customer?.is_vip ? <Badge color="yellow">VIP</Badge> : null}
                  {it.topics && it.topics.map((t)=>(<Badge key={t} color="blue">{t}</Badge>))}
                </div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-1">{it.last_message}</div>
              </div>
              <div className="text-sm"><Badge color={it.max_urgency >= 70 ? 'red' : it.max_urgency >= 40 ? 'yellow' : 'gray'}>Urgency {it.max_urgency ?? 0}</Badge></div>
            </div>
          ))
        )}
      </div>

      <dialog id="csv_modal" className="modal">
        <form method="dialog" className="modal-box w-[720px] max-w-full">
          <h3 className="font-bold text-lg mb-2">Import messages from CSV</h3>
          <p className="text-sm text-gray-500 mb-3">Paste CSV with headers: name,email,phone,text</p>
          <textarea className="w-full h-48 border rounded p-2 font-mono text-sm" value={csvText} onChange={(e)=>setCsvText(e.target.value)} />
          <div className="mt-4 flex justify-end gap-2">
            <button className="px-3 py-2 rounded border">Close</button>
            <button type="button" onClick={importCsv} disabled={importing} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60">{importing ? 'Importing...' : 'Import'}</button>
          </div>
        </form>
      </dialog>
    </Layout>
  )
}

function Thread() {
  const { id } = useParams()
  const baseUrl = getBaseUrl()
  const [customer, setCustomer] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [canned, setCanned] = useState([])
  const [selectedCanned, setSelectedCanned] = useState('')
  const listRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const [custRes, msgRes, cannedRes] = await Promise.all([
        fetch(`${baseUrl}/api/customers/${id}`),
        fetch(`${baseUrl}/api/messages?customer_id=${id}&sort=time&limit=500`),
        fetch(`${baseUrl}/api/canned`),
      ])
      const cust = await custRes.json()
      const msgs = await msgRes.json()
      const cr = await cannedRes.json()
      setCustomer(cust)
      setMessages((msgs && msgs.items) || [])
      setCanned((cr && cr.items) || [])
      scrollToBottom()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [id])

  useEffect(()=>{ scrollToBottom() }, [messages])

  const scrollToBottom = () => {
    setTimeout(()=>{
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }, 50)
  }

  // WebSocket live updates
  useEffect(()=>{
    const wsUrl = toWsUrl(baseUrl) + '/ws/messages'
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (evt) => {
      try {
        const { type, data } = JSON.parse(evt.data)
        if (type === 'message_created' && data.customer_id === id) {
          setMessages((prev)=>[...prev, data])
        }
      } catch {}
    }
    ws.onerror = () => {}
    return () => ws.close()
  }, [id, baseUrl])

  const send = async () => {
    if (!text.trim()) return
    try {
      const res = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: id, text, channel: 'agent', direction: 'outbound' })
      })
      if (!res.ok) throw new Error('Failed to send')
      const msg = await res.json()
      setMessages((prev)=>[...prev, msg])
      setText('')
    } catch (e) {
      alert('Failed to send')
    }
  }

  const onSelectCanned = (val) => {
    setSelectedCanned(val)
    const item = canned.find(c => c.id === val)
    if (item) setText(item.text)
  }

  return (
    <Layout>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white border rounded-lg flex flex-col h-[70vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{customer?.name || 'Customer'}</div>
                <div className="text-sm text-gray-500">{customer?.email} {customer?.phone ? `• ${customer.phone}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                {customer?.is_vip ? <Badge color="yellow">VIP</Badge> : null}
                {customer?.kyc_status ? <Badge color="purple">KYC: {customer.kyc_status}</Badge> : null}
                {customer?.last_loan_status ? <Badge color="green">Loan: {customer.last_loan_status}</Badge> : null}
              </div>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-sm">No messages yet.</div>
              ) : messages.map(m => (
                <div key={m.id} className={`max-w-[80%] ${m.direction === 'inbound' ? 'mr-auto' : 'ml-auto'}`}>
                  <div className={`${m.direction === 'inbound' ? 'bg-white border' : 'bg-blue-600 text-white'} rounded-lg px-3 py-2 shadow-sm`}>
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                    <div className="text-[10px] opacity-60 mt-1">{m.topic ? `#${m.topic}` : ''} {m.urgency_score ? `• u${m.urgency_score}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t space-y-2">
              <div className="flex gap-2">
                <select value={selectedCanned} onChange={(e)=>onSelectCanned(e.target.value)} className="border rounded px-2 py-2 w-56">
                  <option value="">Canned responses...</option>
                  {canned.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Type a reply..." className="flex-1 border rounded px-3 py-2" />
                <button onClick={send} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Send</button>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4 space-y-3 h-[70vh] overflow-y-auto">
            <div className="font-semibold">Customer Info</div>
            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="text-gray-500">Name:</span> {customer?.name}</div>
              <div><span className="text-gray-500">Email:</span> {customer?.email}</div>
              {customer?.phone && <div><span className="text-gray-500">Phone:</span> {customer.phone}</div>}
              {customer?.account_id && <div><span className="text-gray-500">Account ID:</span> {customer.account_id}</div>}
              {customer?.notes && <div><span className="text-gray-500">Notes:</span> {customer.notes}</div>}
            </div>
            <Link to="/" className="inline-block mt-2 text-blue-600 text-sm">Back to inbox</Link>
          </div>
        </div>
      )}
    </Layout>
  )
}

function RouterApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Conversations />} />
        <Route path="/c/:id" element={<Thread />} />
        <Route path="/test" element={<TestProxy />} />
      </Routes>
    </BrowserRouter>
  )
}

// Lightweight proxy to existing test page without importing directly to avoid circular routes
function TestProxy() {
  useEffect(()=>{}, [])
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-gray-600">Open the health check from the navbar.</div>
  )
}

export default RouterApp
