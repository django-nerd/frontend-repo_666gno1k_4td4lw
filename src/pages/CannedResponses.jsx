import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getBaseUrl } from '../utils/api'

export default function CannedResponses() {
  const baseUrl = getBaseUrl()
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  const load = async () => {
    const res = await fetch(`${baseUrl}/api/canned`)
    const data = await res.json()
    setItems(data.items || [])
  }

  useEffect(()=>{ load() }, [])

  const create = async (e) => {
    e.preventDefault()
    const res = await fetch(`${baseUrl}/api/canned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text })
    })
    if (!res.ok) return alert('Failed to create')
    setTitle(''); setText('')
    load()
  }

  return (
    <Layout>
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold">Canned Responses</h1>
        <form onSubmit={create} className="bg-white border rounded-lg p-4 space-y-2">
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="w-full border rounded px-3 py-2" />
          <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="Message text" className="w-full border rounded px-3 py-2 h-28" />
          <div className="text-right">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Create</button>
          </div>
        </form>

        <div className="grid gap-2">
          {items.map(i => (
            <div key={i.id} className="p-3 bg-white border rounded">
              <div className="font-medium">{i.title}</div>
              <div className="text-sm text-gray-600 whitespace-pre-wrap">{i.text}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
