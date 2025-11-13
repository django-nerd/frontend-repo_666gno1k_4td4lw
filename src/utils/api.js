export const getBaseUrl = () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export const toWsUrl = (httpUrl) => {
  try {
    if (httpUrl.startsWith('https://')) return httpUrl.replace('https://', 'wss://')
    if (httpUrl.startsWith('http://')) return httpUrl.replace('http://', 'ws://')
    return `ws://${httpUrl.replace(/^\/\//, '')}`
  } catch {
    return 'ws://localhost:8000'
  }
}
