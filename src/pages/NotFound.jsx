import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-8">
      <p className="text-7xl mb-6">🤷</p>
      <h1 className="text-4xl font-display font-bold text-gray-900 mb-3">Page not found</h1>
      <p className="text-gray-500 mb-8">This page doesn't exist. Maybe it moved?</p>
      <Link to="/" className="btn-primary">← Back home</Link>
    </div>
  )
}
