import { Link } from 'react-router-dom'

const FEATURES = [
  { icon:'📦', title:'Digital Downloads', desc:'Sell PDFs, templates, presets. Instant automated delivery.' },
  { icon:'🎓', title:'Online Courses',    desc:'Build structured courses with video, text, and workbooks.' },
  { icon:'📅', title:'Coaching Calls',    desc:'Accept bookings with a built-in calendar. Clients pay, you show up.' },
  { icon:'💌', title:'Email Marketing',   desc:'Grow your list with lead magnets. Own your audience forever.' },
  { icon:'📊', title:'Analytics',         desc:'Track visits, revenue, and conversions. Know what works.' },
  { icon:'🔗', title:'Link in Bio',       desc:'One link replaces your website, course platform, and scheduler.' },
]

const STATS = [['$500M+','Creator earnings'],['100K+','Active creators'],['0%','Transaction fees']]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-[#ff4f17] rounded-lg flex items-center justify-center text-white font-bold">S</span>
            <span className="font-display font-bold text-gray-900 text-lg">Stan</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <Link to="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"  className="btn-ghost text-sm">Log in</Link>
            <Link to="/signup" className="btn-primary text-sm py-2 px-4">Start free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#fff0eb] text-[#ff4f17] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 bg-[#ff4f17] rounded-full animate-pulse" />
          Trusted by 100,000+ creators
        </div>
        <h1 className="text-6xl md:text-7xl font-display font-bold text-gray-900 tracking-tight leading-[1.05] mb-6">
          Turn your followers<br />into <span className="text-[#ff4f17]">income</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Your all-in-one creator store. Sell digital products, courses, coaching &amp; more — all from one powerful link in bio.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link to="/signup" className="btn-accent text-lg px-8 py-4">Start for free — 14 days →</Link>
          <p className="text-sm text-gray-400">No credit card required</p>
        </div>
        <div className="flex items-center justify-center gap-8 pt-10 border-t border-gray-100 mt-10">
          {STATS.map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="text-3xl font-display font-bold text-gray-900 tracking-tight">{n}</p>
              <p className="text-sm text-gray-400 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#ff4f17] mb-3">Everything you need</div>
            <h2 className="text-4xl font-display font-bold text-gray-900 tracking-tight">One link. Unlimited revenue.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-display font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <h2 className="text-5xl font-display font-bold text-gray-900 tracking-tight mb-4">Your creator store awaits.</h2>
        <p className="text-lg text-gray-500 mb-10">Join 100,000+ creators already earning with Stan.</p>
        <Link to="/signup" className="btn-accent text-lg px-10 py-4">Create your free store →</Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-[#ff4f17] rounded-lg flex items-center justify-center text-white font-bold text-sm">S</span>
            <span className="font-display font-bold text-white">Stan</span>
          </div>
          <p className="text-sm">© 2026 Stan. Made with ❤️ for creators.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
