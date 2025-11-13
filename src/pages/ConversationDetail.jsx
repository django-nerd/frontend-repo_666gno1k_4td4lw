import { useEffect, useRef, useState } from 'react'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import { getBaseUrl, toWsUrl } from '../utils/api'
import { Link, useParams } from 'react-router-dom'

function MessageBubble({ m }) {
  const inbound = m.direction === 'inbound'
  return (
    <div className={`max-w-[80%] ${inbound ? 'mr-auto' : 'ml-auto'}`}>
      <div className={`${inbound ? 'bg-white border' : 'bg-blue-600 text-white'} rounded-lg px-3 py-2 shadow-sm`}>
        <div className="text-sm whitespace-pre-wrap">{m.text}</div>
        <div className="text-[10px] opacity-60 mt-1">{m.topic ? `#${m.topic}` : ''} {m.urgency_score ? `• u${m.urgency_score}` : ''}</div>
      </div>
    </div>
  )
}

function CustomerInfoPanel({ customer }) {
  if (!customer) return null
  return (
    <div className="bg-white border rounded-lg p-4 space-y-2">
      <div className="font-semibold">Customer Info</div>
      <div className="text-sm text-gray-700 space-y-1">
        <div><span className="text-gray-500">Name:</span> {customer.name}</div>
        <div><span className="text-gray-500">Email:</span> {customer.email}</div>
        {customer.phone && <div><span className="text-gray-500">Phone:</span> {customer.phone}</div>}
        {customer.account_id && <div><span className="text-gray-500">Account ID:</span> {customer.account_id}</div>}
        {customer.notes && <div><span className="text-gray-500">Notes:</span> {customer.notes}</div>}
      </div>
    </div>
  )
}

function CannedMessageSelector({ canned, onSelect }) {
  return (
    <select onChange={(e)=>onSelect(e.target.value)} className="border rounded px-2 py-2 w-56">
      <option value="">Canned responses...</option>
      {canned.map(c => (
        <option key={c.id} value={c.id}>{c.title}</option>
      ))}
    </select>
  )
}

export default function ConversationDetail() {
  const { id } = useParams()
  const baseUrl = getBaseUrl()
  const [customer, setCustomer] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [canned, setCanned] = useState([])
  const listRef = useRef(null)

  const load = async () => {
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
    setTimeout(()=>{ if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, 50)
  }

  useEffect(()=>{ load() }, [id])

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
    return () => ws.close()
  }, [id, baseUrl])

  const send = async () => {
    if (!text.trim()) return
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: id, text, channel: 'agent', direction: 'outbound' })
    })
    if (!res.ok) return alert('Failed to send')
    const msg = await res.json()
    setMessages((prev)=>[...prev, msg])
    setText('')
  }

  const pickCanned = (val) => {
    const item = canned.find(c => c.id === val)
    if (item) setText(item.text)
  }

  return (
    <Layout>
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
            ) : messages.map(m => <MessageBubble key={m.id} m={m} />)}
          </div>
          <div className="p-3 border-t space-y-2">
            <div className="flex gap-2">
              <CannedMessageSelector canned={canned} onSelect={pickCanned} />
              <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Type a reply..." className="flex-1 border rounded px-3 py-2" />
              <button onClick={send} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Send</button>
            </div>
          </div>
        </div>
        <CustomerInfoPanel customer={customer} />
        <Link to="/" className="md:hidden inline-block text-blue-600 text-sm">Back</Link>
      </div>
    </Layout>
  )
}
