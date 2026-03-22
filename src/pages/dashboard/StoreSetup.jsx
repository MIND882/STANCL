import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function StoreSetup() {
  const { profile, user, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    theme_color: '#ff4f17',
  })

  useEffect(() => {
    const store = profile?.stores?.[0]
    if (store) {
      setForm({
        display_name: store.display_name || profile?.full_name || '',
        bio:          store.bio || '',
        avatar_url:   store.avatar_url || '',
        theme_color:  store.theme_color || '#ff4f17',
      })
    }
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const storeId = profile?.stores?.[0]?.id

    if (storeId) {
      const { error } = await supabase
        .from('stores')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', storeId)
      if (error) { toast.error(error.message); setSaving(false); return }
    } else {
      const username = profile?.username || user?.user_metadata?.username
      if (!username) { toast.error('No username found.'); setSaving(false); return }
      const { error } = await supabase
        .from('stores')
        .insert({ ...form, owner_id: user.id, username })
      if (error) { toast.error(error.message); setSaving(false); return }
    }

    await refreshProfile()
    toast.success('Store saved!')
    setSaving(false)
  }

  const storeUsername = profile?.stores?.[0]?.username

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">My Store</h1>
        <p className="text-gray-500 mt-1">Customize how your storefront looks to visitors.</p>
        {storeUsername && (
          <a href={`/store/${storeUsername}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#ff4f17] font-semibold hover:underline">
            🔗 yourapp.vercel.app/store/{storeUsername}
          </a>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display font-bold text-gray-900 mb-4">Profile</h2>
          <div className="flex items-center gap-5 mb-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl flex-shrink-0 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${form.theme_color}, #ff3b9a)` }}>
              {form.avatar_url ? <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : (form.display_name?.[0] || '👤')}
            </div>
            <div className="flex-1">
              <label className="label">Avatar URL</label>
              <input type="url" value={form.avatar_url}
                onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))}
                placeholder="https://i.imgur.com/yourphoto.jpg" className="input" />
              <p className="text-xs text-gray-400 mt-1">Paste an image URL. File upload coming in Phase 2.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Display name</label>
              <input type="text" required value={form.display_name}
                onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                placeholder="Alex Creates" className="input" />
            </div>
            <div>
              <label className="label">Bio <span className="text-gray-400 font-normal">({form.bio.length}/160)</span></label>
              <textarea rows={3} value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Digital marketing coach 🚀 Helping creators monetize their passion"
                className="input resize-none" maxLength={160} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display font-bold text-gray-900 mb-4">Branding</h2>
          <label className="label">Accent color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.theme_color}
              onChange={e => setForm(p => ({ ...p, theme_color: e.target.value }))}
              className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1" />
            <input type="text" value={form.theme_color}
              onChange={e => setForm(p => ({ ...p, theme_color: e.target.value }))}
              className="input w-32 font-mono text-sm" />
            <div className="flex gap-2">
              {['#ff4f17','#5b4fff','#00c853','#ff3b9a','#0ea5e9'].map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, theme_color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: form.theme_color === c ? '#111' : 'transparent',
                    transform: form.theme_color === c ? 'scale(1.2)' : 'scale(1)' }} />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display font-bold text-gray-900 mb-4">Preview</h2>
          <div className="bg-gray-50 rounded-xl p-6 text-center max-w-xs mx-auto">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${form.theme_color}, #ff3b9a)` }}>
              {form.avatar_url ? <img src={form.avatar_url} alt="" className="w-full h-full object-cover" /> : (form.display_name?.[0] || '👤')}
            </div>
            <p className="font-display font-bold text-gray-900">{form.display_name || 'Your name'}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{form.bio || 'Your bio will appear here'}</p>
            <div className="mt-3 h-1.5 rounded-full w-16 mx-auto" style={{ background: form.theme_color }} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-base">
          {saving ? <span className="flex items-center gap-2 justify-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : 'Save store settings'}
        </button>
      </form>
    </div>
  )
}
