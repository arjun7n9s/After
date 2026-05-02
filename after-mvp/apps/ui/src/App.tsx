import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          After MVP
        </h1>
        <p className="text-gray-600 mb-8">
          Local-first developer tool for capturing your development journey
        </p>
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Count is {count}
        </button>
        <p className="mt-4 text-sm text-gray-500">
          Phase 1: Foundation - In Progress
        </p>
      </div>
    </div>
  )
}

export default App

// Made with Bob
