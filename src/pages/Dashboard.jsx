import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import { getBaseUrl } from '../utils/api'
import { Link, useNavigate } from 'react-router-dom'

function ConversationCard({ item }) {
  const navigate = useNavigate()
  return (
    <div className="p-4 bg-white border rounded-lg hover:shadow cursor-pointer" onClick={()=>navigate(`/c/${item.customer_id}`)}>
      <div className="flex items-center gap-2">
        <div className="font-semibold">{item.customer?.name || 'Unknown'}</div>
        {item.customer?.is_vip ? <Badge color="yellow">VIP</Badge> : null}
        {item.topics && item.topics.slice(0,3).map(t => <Badge key={t} color="blue">{t}</Badge>)}
      </div>
      <div className="text-sm text-gray-600 line-clamp-2 mt-1">{item.last_message}</div>
      <div className="mt-2"><Badge color={item.max_urgency >= 70 ? 'red' : item.max_urgency >= 40 ? 'yellow' : 'gray'}>Urgency {item.max_urgency ?? 0}</Badge></div>
    </div>
  )
}

function StatsOverview({ stats }) {
  const blocks = [
    { label: 'Conversations', value: stats.total || 0 },
    { label: 'High Urgency', value: stats.high || 0 },
    { label: 'Medium Urgency', value: stats.medium || 0 },
    { label: 'Low Urgency', value: stats.low || 0 },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {blocks.map(b => (
        <div key={b.label} className="p-4 bg-white border rounded-lg">
          <div className="text-xs text-gray-500">{b.label}</div>
          <div className="text-2xl font-semibold">{b.value}</div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const baseUrl = getBaseUrl()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async (query) => {
    setLoading(true)
    try {
      const url = new URL(baseUrl + '/api/conversations')
      if (query) url.searchParams.set('q', query)
      const res = await fetch(url)
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [])

  const stats = (()=>{
    const total = items.length
    let high=0, medium=0, low=0
    items.forEach(i=>{
      if ((i.max_urgency||0) >= 70) high++
      else if ((i.max_urgency||0) >= 40) medium++
      else low++
    })
    return { total, high, medium, low }
  })()

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-4">
        <form onSubmit={(e)=>{e.preventDefault(); load(q)}} className="flex-1 flex gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search conversations..." className="flex-1 border rounded px-3 py-2" />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Search</button>
        </form>
        <Link to="/import" className="px-3 py-2 rounded border bg-white hover:bg-gray-50">Import CSV</Link>
      </div>

      <StatsOverview stats={stats} />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-gray-500">No conversations yet.</div>
        ) : (
          items.map(it => <ConversationCard key={it.customer_id} item={it} />)
        )}
      </div>
    </Layout>
  )
}
