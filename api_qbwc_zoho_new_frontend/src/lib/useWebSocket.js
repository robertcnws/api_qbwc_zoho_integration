import { useEffect, useRef, useCallback } from 'react'

// Vite sets import.meta.env.DEV automatically:
//   npm run dev   → true  (local dev server, no path prefix needed)
//   npm run build → false (production, uses VITE_WS_URL with /api_qbwc_zoho prefix)
const WS_BASE =
  import.meta.env.DEV
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
    : import.meta.env.VITE_WS_URL || 'wss://api-qbwc-zoho.newwindowsystem.net/api_qbwc_zoho'

const MAX_RETRIES = 5
const BASE_DELAY = 3000

export function useWebSocket({ path, params = {}, onMessage, enabled = true }) {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const mountedRef = useRef(true)
  const onMessageRef = useRef(onMessage)
  const retriesRef = useRef(0)
  const wasConnectedRef = useRef(false)

  useEffect(() => {
    onMessageRef.current = onMessage
  })

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return

    const token = localStorage.getItem('accessToken') || ''
    const queryParams = new URLSearchParams({ token, ...params }).toString()
    const url = `${WS_BASE}${path}?${queryParams}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      retriesRef.current = 0
      wasConnectedRef.current = true
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (mountedRef.current) onMessageRef.current(data)
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      // Only retry if we had a successful connection before, or haven't exceeded max retries
      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retriesRef.current)
        retriesRef.current += 1
        reconnectTimer.current = setTimeout(connect, delay)
      }
    }

    ws.onerror = () => ws.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, JSON.stringify(params), enabled])

  useEffect(() => {
    mountedRef.current = true
    retriesRef.current = 0
    wasConnectedRef.current = false
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])
}
