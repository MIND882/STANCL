import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const TYPES = [
  { id: 'download', label: 'Digital download', icon: '📖', desc: 'PDF, template, preset' },
  { id: 'course',   label: 'Online course',    icon: '🎓', desc: 'Modules, videos, lessons' },
  { id: 'coaching', label: 'Coaching call',    icon: '📅', desc: 'Bookable 1:1 sessions' },
  { id: 'link',     label: 'External link',    icon: '🔗', desc: 'YouTube, affiliate, etc.' },
]
const TYPE_ICON  = { download:'📖', course:'🎓', coaching:'📅', link:'🔗' }
const TYPE_COLOR = { download:'bg-orange-50', course:'bg-purple-50', coaching:'bg-green-50', link:'bg-blue-50' }

function Modal({ storeId, onClose, onAdded }) {
  const [step, setStep]   = useState(1)
  const [type, setType]   = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm]   = useState({ name:'', description:'', price:'', url:'', is_free:false })

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('products').insert({
      store_id: storeId, type: type.id, name: form.name,
      description: form.description,
      price: form.is_free ? 0 : Math.round(parseFloat(form.price || 0) * 100),
      external_url: form.url || null, is_active: true,
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Product added!'); onAdded(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-gray-900">{step === 1 ? 'Add a product' : `New ${type?.label}`}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        {step === 1 ? (
          <div className="p-6 grid grid-cols-2 gap-3">
            {TYPES.map(t => (
              <button key={t.id} onClick={() => { setType(t); setStep(2) }}
                className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-gray-100 hover:border-[#ff4f17] hover:bg-[#fff0eb] transition-all text-left">
                <span className="text-2xl">{t.icon}</span>
                <span className="font-semibold text-sm text-gray-900">{t.label}</span>
                <span className="text-xs text-gray-400">{t.desc}</span>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={save} className="p-6 space-y-4">
            <div>
              <label className="label">Product name</label>
              <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Creator Playbook 2025" className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What will the buyer get?" className="input resize-none" />
            </div>
            {type.id !== 'link' && (
              <div>
                <label className="label">Price</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input type="number" min="0" step="0.01" value={form.price}
                      onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      disabled={form.is_free} placeholder="29.00" className="input pl-7 disabled:opacity-40" />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={form.is_free} onChange={e => setForm(p => ({ ...p, is_free: e.target.checked }))} />
                    Free
                  </label>
                </div>
              </div>
            )}
            {(type.id === 'link' || type.id === 'download') && (
              <div>
                <label className="label">{type.id === 'link' ? 'URL' : 'File URL'}</label>
                <input type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://" className="input" />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? <span className="flex items-center gap-2 justify-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : 'Add product'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Products() {
  const { profile } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const storeId = profile?.stores?.[0]?.id

  const fetch = async () => {
    if (!storeId) { setLoading(false); return }
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false })
    setProducts(data || []); setLoading(false)
  }
  useEffect(() => { fetch() }, [storeId])

  const toggle = async (id, cur) => {
    await supabase.from('products').update({ is_active: !cur }).eq('id', id)
    setProducts(p => p.map(x => x.id === id ? { ...x, is_active: !cur } : x))
  }
  const del = async (id) => {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(p => p.filter(x => x.id !== id))
    toast.success('Deleted.')
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-gray-500 mt-1">Everything you're selling in your store.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-accent text-sm py-2.5 px-5">+ Add product</button>
      </div>
      {!storeId && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-6">⚠ Set up your store first.</div>}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-20" />)}</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <p className="text-5xl mb-4">📦</p>
          <p className="font-display font-bold text-gray-900 text-xl mb-2">No products yet</p>
          <p className="text-gray-400 text-sm mb-6">Add your first product and start earning.</p>
          <button onClick={() => setShowModal(true)} className="btn-accent">+ Add your first product</button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 ${!p.is_active ? 'opacity-60' : ''}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${TYPE_COLOR[p.type] || 'bg-gray-50'}`}>{TYPE_ICON[p.type] || '📦'}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-sm text-gray-400 capitalize">{p.type} · {p.price === 0 ? 'Free' : `$${(p.price / 100).toFixed(2)}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(p.id, p.is_active)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.is_active ? 'Live' : 'Hidden'}
                </button>
                <button onClick={() => del(p.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && storeId && <Modal storeId={storeId} onClose={() => setShowModal(false)} onAdded={fetch} />}
    </div>
  )
}
