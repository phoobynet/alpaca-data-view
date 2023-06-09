import { TradeStream } from '@/lib/stream'
import { options, Snapshot, Trade } from '@phoobynet/alpaca-services'
import { TradeSnapshot } from '@/lib/stream/TradeSnapshot'
import { TradeSnapshotView } from '@/lib/stream/TradeSnapshotView'

export enum TradeStreamWorkerRequestType {
  credentials = 'credentials',
  subscribe = 'subscribe',
  unsubscribe = 'unsubscribe',
  unsubscribeAll = 'unsubscribeAll',
}

export interface TradeStreamWorkerRequest<T> {
  type: TradeStreamWorkerRequestType
  payload?: T
}

export enum TradeStreamWorkerResponseType {
  connected = 'connected',
  tradeSnapshot = 'tradeSnapshot',
  snapshots = 'snapshots',
}

export interface TradeStreamWorkerResponse<T> {
  type: TradeStreamWorkerResponseType
  payload?: T
}

let tradeStream: TradeStream | undefined

const onTradeSnapshotHandler = (event: Event) => {
  const tradeSnapshot = (event as CustomEvent<TradeSnapshotView>).detail

  self.postMessage({
    type: 'tradeSnapshot',
    payload: tradeSnapshot,
  })
}

const unsubscribedHandler = (event: Event) => {
  const symbol = (event as CustomEvent<{ symbol: string }>).detail

  self.postMessage({
    type: 'unsubscribed',
    payload: symbol,
  })
}

const snapshotsHandler = (event: Event) => {
  const snapshots = (event as CustomEvent<Record<string, Snapshot>>).detail

  self.postMessage({
    type: 'snapshots',
    payload: snapshots,
  })
}

// @ts-ignore
self.onmessage = async (event: MessageEvent) => {
  const tickerWorkerMessage: TradeStreamWorkerRequest<any> = event.data

  switch (tickerWorkerMessage.type) {
    case TradeStreamWorkerRequestType.credentials:
      console.log('credentials', tickerWorkerMessage.payload)
      tradeStream?.unsubscribeAll()

      options.set({
        key: tickerWorkerMessage.payload.key,
        secret: tickerWorkerMessage.payload.secret,
        paper: true,
      })

      tradeStream = new TradeStream()
      tradeStream.addEventListener('tradeSnapshot', onTradeSnapshotHandler)
      tradeStream.addEventListener('unsubscribed', unsubscribedHandler)
      tradeStream.addEventListener('snapshots', snapshotsHandler)
      self.postMessage({
        type: TradeStreamWorkerResponseType.connected,
      })
      break
    case TradeStreamWorkerRequestType.unsubscribeAll:
      tradeStream?.unsubscribeAll()
      tradeStream?.removeEventListener('tradeSnapshot', onTradeSnapshotHandler)
      tradeStream?.removeEventListener('unsubscribed', unsubscribedHandler)
      tradeStream?.removeEventListener('snapshots', snapshotsHandler)
      tradeStream = undefined
      break
    case TradeStreamWorkerRequestType.subscribe:
      tradeStream?.subscribe(tickerWorkerMessage.payload)
      break
    case TradeStreamWorkerRequestType.unsubscribe:
      tradeStream?.unsubscribe(tickerWorkerMessage.payload)
      break
  }
}
