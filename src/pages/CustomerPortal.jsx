import { useState } from 'react'
import Layout from '../components/Layout'
import { getBaseUrl } from '../utils/api'

export default function CustomerPortal() {
  const baseUrl = getBaseUrl()
  const [name, setName] = useState('Jane Doe')
  const [email, setEmail] = useState('jane@example.com')
  const [text, setText] = useState('I have a question about my account')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      // create or upsert customer
      const cr = await fetch(baseUrl + '/api/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      })
      const cust = await cr.json()
      const mr = await fetch(baseUrl + '/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: cust.id, text, channel: 'web', direction: 'inbound' })
      })
      if (!mr.ok) throw new Error('Failed to submit')
      setText('')
      alert('Message sent!')
    } catch (e) {
      alert('Failed to submit')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-md">
        <h1 className="text-xl font-semibold mb-3">Customer Portal</h1>
        <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-2">
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" className="w-full border rounded px-3 py-2" />
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full border rounded px-3 py-2" />
          <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="Type your message" className="w-full border rounded px-3 py-2 h-28" />
          <div className="text-right">
            <button disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60">Send</button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
