import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center text-center">
      <p className="font-mono text-teal-500 text-sm mb-2">404</p>
      <h1 className="font-display font-bold text-3xl text-slate-100 mb-2">Page not found</h1>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary">Back to overview</Link>
    </div>
  )
}
