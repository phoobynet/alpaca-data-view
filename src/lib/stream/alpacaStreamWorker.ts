import { AlpacaStream } from '@/lib/stream/AlpacaStream'

interface MessageData {
  type: string
  payload: any
}

let alpacaStream: AlpacaStream | undefined

// @ts-ignore
self.onmessage = async (message: MessageEvent) => {
  const data = message.data as MessageData
  if (data.type === 'credential') {
    alpacaStream?.disconnect()
    alpacaStream = new AlpacaStream(data.payload)

    alpacaStream.addEventListener('ready', () => {
      self.postMessage({ type: 'ready' })
    })

    alpacaStream.addEventListener('error', (event: Event) => {
      self.postMessage({
        type: 'error',
        payload: (event as CustomEvent).detail,
      })
    })

    alpacaStream.addEventListener('trade', (event: Event) => {
      self.postMessage({
        type: 'trade',
        payload: (event as CustomEvent).detail,
      })
    })

    alpacaStream.addEventListener('disconnected', () => {
      self.postMessage({
        type: 'disconnected',
      })
    })

    alpacaStream.connect()
  } else if (data.type === 'subscription') {
    alpacaStream?.subscribe(data.payload)
  } else if (data.type === 'unsubscribed') {
    alpacaStream?.unsubscribe(data.payload)
  } else if (data.type === 'disconnect') {
    alpacaStream?.disconnect()
  }
}
