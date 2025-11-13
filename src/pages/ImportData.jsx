import { useState } from 'react'
import Layout from '../components/Layout'
import { getBaseUrl } from '../utils/api'

export default function ImportData() {
  const baseUrl = getBaseUrl()
  const [csvText, setCsvText] = useState('name,email,phone,text\nJane,jane@example.com,,When is my loan approved?\nBob,bob@example.com,,I need to update my account phone number\n')
  const [busy, setBusy] = useState(false)

  const importCsv = async () => {
    try {
      setBusy(true)
      const res = await fetch(baseUrl + '/api/messages/import_csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: csvText, channel: 'web' })
      })
      if (!res.ok) throw new Error('Import failed')
      alert('Imported successfully')
    } catch (e) {
      alert('Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold mb-3">Import Messages (CSV)</h1>
        <p className="text-sm text-gray-500 mb-3">Headers required: name,email,phone,text</p>
        <textarea className="w-full h-64 border rounded p-2 font-mono text-sm" value={csvText} onChange={(e)=>setCsvText(e.target.value)} />
        <div className="mt-3 flex justify-end">
          <button onClick={importCsv} disabled={busy} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">{busy? 'Importing...' : 'Import'}</button>
        </div>
      </div>
    </Layout>
  )
}
