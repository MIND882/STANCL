import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'

function MetricCard({ label, value, sub, color = 'orange' }) {
  const colors = { orange: 'bg-[#fff0eb] text-[#ff4f17]', green: 'bg-green-50 text-green-700', blue: 'bg-blue-50 text-blue-700', purple: 'bg-purple-50 text-purple-700' }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <p className="text-sm font-semibold text-gray-500 mb-3">{label}</p>
      <p className="text-4xl font-display font-bold text-gray-900 tracking-tight">{value}</p>
      {sub && <p className={`text-xs font-semibold mt-2 inline-block px-2 py-0.5 rounded-full ${colors[color]}`}>{sub}</p>}
    </div>
  )
}

export default function Analytics() {
  const { profile, user } = useAuth()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const storeId = profile?.stores?.[0]?.id
  const firstName = profile?.full_name?.split(' ')[0] || 'Creator'

  useEffect(() => {
    if (!storeId) { setLoading(false); return }
    const load = async () => {
      const { data: orderData } = await supabase
        .from('orders').select('amount, created_at, product:products(name), buyer_email, status')
        .eq('store_id', storeId).order('created_at', { ascending: false }).limit(10)
      const allOrders = orderData || []
      const revenue = allOrders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.amount || 0), 0)
      const { count: views } = await supabase.from('store_views').select('*', { count: 'exact', head: true }).eq('store_id', storeId)
      const { count: products } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId)
      setStats({ revenue, views: views || 0, products: products || 0, orders: allOrders.length })
      setOrders(allOrders.slice(0, 5))
      setLoading(false)
    }
    load()
  }, [storeId])

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Hey {firstName} 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your store.</p>
      </div>
      {!storeId && !loading && (
        <div className="bg-[#fff0eb] border border-[#ff4f17]/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Set up your store</p>
            <p className="text-sm text-gray-600 mt-1">Add your bio, avatar, and first products to go live.</p>
          </div>
          <Link to="/dashboard/store" className="btn-accent text-sm py-2 px-4">Set up now →</Link>
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-20 mb-4" /><div className="h-8 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Revenue (all time)" value={`$${((stats?.revenue || 0) / 100).toFixed(2)}`} sub="0% fees" color="green" />
          <MetricCard label="Store visits" value={(stats?.views || 0).toLocaleString()} sub="All time" color="blue" />
          <MetricCard label="Products" value={stats?.products || 0} sub="Active" color="purple" />
          <MetricCard label="Orders" value={stats?.orders || 0} sub="Total" color="orange" />
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="font-display font-bold text-gray-900">Recent orders</h2>
          <span className="text-xs text-gray-400">Last 5</span>
        </div>
        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-400 text-sm">No orders yet. Share your store link to get started!</p>
            {profile?.stores?.[0]?.username && (
              <a href={`/store/${profile.stores[0].username}`} target="_blank" rel="noreferrer" className="btn-outline mt-4 inline-flex text-sm">
                View my store →
              </a>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                <th className="text-left px-6 py-3">Customer</th>
                <th className="text-left px-6 py-3">Product</th>
                <th className="text-left px-6 py-3">Amount</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-700">{o.buyer_email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{o.product?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm font-semibold">${((o.amount || 0) / 100).toFixed(2)}</td>
                  <td className="px-6 py-4"><span className={o.status === 'paid' ? 'badge-green' : 'badge-gray'}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
