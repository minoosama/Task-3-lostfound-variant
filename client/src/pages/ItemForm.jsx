import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Report Item page — routed at /items/new (report) and /items/:id (edit),
// both wrapped in <ProtectedRoute>.

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: load the item and fill the form. Report mode: start empty.
  useEffect(() => {
    setError('')
    if (!id) {
      // going from /items/:id to /items/new reuses this component, so clear the old item
      setForm(defaults)
      return
    }
    let ignore = false
    api.get('/items/' + id)
      .then(res => {
        if (ignore) return
        const { item } = res.data
        setForm({
          title: item.title,
          status: item.status,
          category: item.category,
          location: item.location ?? '',
          description: item.description ?? ''
        })
      })
      .catch(err => {
        if (!ignore) setError(err?.response?.data?.message || 'Could not load item')
      })
    // drop a late response if the user has already moved to another page
    return () => { ignore = true }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      // form only holds these five fields, so reportedBy is never sent
      if (id) await api.patch('/items/' + id, form)
      else await api.post('/items', form)
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" name="title" placeholder="Title (e.g. Black backpack)" value={form.title} onChange={onChange} />
        <select className="input" name="status" value={form.status} onChange={onChange}>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
          <option value="claimed">Claimed</option>
        </select>
        <select className="input" name="category" value={form.category} onChange={onChange}>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="documents">Documents</option>
          <option value="accessories">Accessories</option>
          <option value="other">Other</option>
        </select>
        <input className="input" name="location" placeholder="Location (optional, e.g. Library 2nd floor)" value={form.location} onChange={onChange} />
        <textarea className="input" name="description" placeholder="Description (optional)" rows={3} value={form.description} onChange={onChange} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
