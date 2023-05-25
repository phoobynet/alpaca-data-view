import { AlpacaStream, AlpacaStreamEvent } from '@/lib/stream/AlpacaStream'
import { MessageData } from '@/lib/stream/messageData'

let alpacaStream: AlpacaStream | undefined

// @ts-ignore
self.onmessage = async (message: MessageEvent) => {
  const data = message.data as MessageData
  if (data.type === 'credential') {
    alpacaStream?.disconnect()
    alpacaStream = new AlpacaStream(data.payload)

    alpacaStream.addEventListener(AlpacaStreamEvent.ready, () => {
      self.postMessage({ type: AlpacaStreamEvent.ready })
    })

    alpacaStream.addEventListener(AlpacaStreamEvent.error, (event: Event) => {
      self.postMessage({
        type: AlpacaStreamEvent.error,
        payload: (event as CustomEvent).detail,
      })
    })

    alpacaStream.addEventListener(AlpacaStreamEvent.trade, (event: Event) => {
      self.postMessage({
        type: AlpacaStreamEvent.trade,
        payload: (event as CustomEvent).detail,
      })
    })

    alpacaStream.addEventListener(AlpacaStreamEvent.disconnected, () => {
      self.postMessage({
        type: AlpacaStreamEvent.disconnected,
      })
    })

    alpacaStream.connect()
  } else if (data.type === 'subscribe') {
    alpacaStream?.subscribe({
      trades: data.payload as string[],
    })
  } else if (data.type === 'unsubscribe') {
    alpacaStream?.unsubscribe({
      trades: data.payload as string[],
    })
  } else if (data.type === 'disconnect') {
    alpacaStream?.disconnect()
  }
}
