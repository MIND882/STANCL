import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, profile, subscription } = useAuth()
  const [saving, setSaving] = useState(false)
  const [pwd, setPwd] = useState({ next: '', confirm: '' })

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwd.next !== pwd.confirm) { toast.error("Passwords don't match."); return }
    if (pwd.next.length < 8) { toast.error('Min 8 characters.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwd.next })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Password updated!')
    setPwd({ next: '', confirm: '' })
  }

  const openBillingPortal = async () => {
    try {
      const res = await fetch('/api/billing-portal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, returnUrl: window.location.href }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) { toast.error(err.message) }
  }

  const planLabel = subscription?.plan === 'pro' ? 'Pro — $49/mo' : subscription?.plan === 'starter' ? 'Starter — $19/mo' : 'No active plan'

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and billing.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-display font-bold text-gray-900 mb-4">Account</h2>
        <div className="space-y-3">
          {[['Email', user?.email], ['Name', profile?.full_name || '—'], ['Username', `@${profile?.stores?.[0]?.username || '—'}`]].map(([l, v]) => (
            <div key={l} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
              <span className="text-sm text-gray-500">{l}</span>
              <span className="text-sm font-medium text-gray-900">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-display font-bold text-gray-900 mb-4">Billing</h2>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{planLabel}</p>
            {subscription?.status && <span className="badge-green mt-1 inline-block capitalize">{subscription.status}</span>}
          </div>
          <button onClick={openBillingPortal} className="btn-outline text-sm">Manage billing →</button>
        </div>
        <p className="text-xs text-gray-400">Managed securely via Stripe. Update card, view invoices, or cancel anytime.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-display font-bold text-gray-900 mb-4">Change password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <input type="password" required value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} placeholder="Min. 8 characters" className="input" />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" required value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat password" className="input" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <h2 className="font-display font-bold text-red-600 mb-2">Danger zone</h2>
        <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all data. Cannot be undone.</p>
        <button className="text-sm font-semibold text-red-500 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">Delete my account</button>
      </div>
    </div>
  )
}
