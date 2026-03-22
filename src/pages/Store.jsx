import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const TYPE_ICON  = { download:'📖', course:'🎓', coaching:'📅', link:'🔗' }
const TYPE_LABEL = { download:'Digital Download', course:'Online Course', coaching:'Coaching Call', link:'Link' }
const TYPE_BG    = { download:'bg-orange-50', course:'bg-purple-50', coaching:'bg-green-50', link:'bg-blue-50' }

export default function Store() {
  const { username } = useParams()
  const [store, setStore]       = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: storeData } = await supabase
        .from('stores').select('*').eq('username', username).eq('is_active', true).maybeSingle()
      if (!storeData) { setNotFound(true); setLoading(false); return }
      setStore(storeData)

      const { data: productData } = await supabase
        .from('products').select('*')
        .eq('store_id', storeData.id).eq('is_active', true)
        .order('sort_order', { ascending: true })
      setProducts(productData || [])
      setLoading(false)

      // Log view (fire and forget)
      supabase.from('store_views').insert({ store_id: storeData.id, referrer: document.referrer || null })
    }
    load()
  }, [username])

  const handleBuy = async (product) => {
    if (product.type === 'link') { window.open(product.external_url, '_blank'); return }
    if (product.price === 0) { toast.success('Free product! Download link would appear here.'); return }
    try {
      const res = await fetch('/api/create-product-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id, storeId: store.id,
          successUrl: `${window.location.origin}/store/${username}?success=1`,
          cancelUrl: window.location.href,
        }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) { toast.error(err.message) }
  }

  const themeColor = store?.theme_color || '#ff4f17'
  const downloads  = products.filter(p => p.type === 'download')
  const courses    = products.filter(p => p.type === 'course')
  const coaching   = products.filter(p => p.type === 'coaching')
  const links      = products.filter(p => p.type === 'link')

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: themeColor, borderTopColor: 'transparent' }} />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-8">
      <p className="text-6xl mb-4">🔍</p>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">Store not found</h1>
      <p className="text-gray-500">@{username} doesn't exist yet.</p>
    </div>
  )

  function Section({ title, items }) {
    if (!items.length) return null
    return (
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>
        <div className="space-y-3">
          {items.map(p => (
            <button key={p.id} onClick={() => handleBuy(p)}
              className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${TYPE_BG[p.type]}`}>
                {TYPE_ICON[p.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABEL[p.type]}{p.description ? ` · ${p.description.slice(0,40)}` : ''}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-display font-bold text-gray-900 text-lg">
                  {p.price === 0 ? 'Free' : `$${(p.price / 100).toFixed(0)}`}
                </p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: themeColor }}>
                  {p.type === 'link' ? 'Visit →' : p.price === 0 ? 'Get free →' : 'Buy now →'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-md mx-auto px-4 pt-16 pb-12">
        {/* Profile header */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl overflow-hidden border-4 border-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${themeColor}, #ff3b9a)` }}>
            {store.avatar_url ? <img src={store.avatar_url} alt="" className="w-full h-full object-cover" /> : (store.display_name?.[0] || '👤')}
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">{store.display_name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">@{store.username}</p>
          {store.bio && <p className="text-sm text-gray-600 mt-3 leading-relaxed max-w-xs mx-auto">{store.bio}</p>}
          <div className="mt-3 h-1 rounded-full w-12 mx-auto" style={{ background: themeColor }} />
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🚧</p>
            <p className="text-gray-400">Products coming soon!</p>
          </div>
        ) : (
          <>
            <Section title="📖 Digital Products" items={downloads} />
            <Section title="🎓 Courses" items={courses} />
            <Section title="📅 Book a Call" items={coaching} />
            <Section title="🔗 Links" items={links} />
          </>
        )}

        {/* Powered by */}
        <p className="text-center text-xs text-gray-300 mt-10">
          Powered by <span className="font-semibold text-gray-400">Stan</span>
        </p>
      </div>
    </div>
  )
}
