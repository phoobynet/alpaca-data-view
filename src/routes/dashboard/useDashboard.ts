import { reactive, ref } from 'vue'
import { AlpacaStreamEvent, TradeMessage } from '@/lib/stream/AlpacaStream'
import { TradeSnapshot } from '@/lib/stream/TradeSnapshot'
import { TradeSnapshotView } from '@/lib/stream/TradeSnapshotView'
import { Snapshot } from '@phoobynet/alpaca-services'

export const useDashboard = () => {
  const ready = ref(false)
  const tradeSnapshots = new Map<string, TradeSnapshot>()
  const tradeSnapshotViews = reactive<
    Record<string, TradeSnapshotView | undefined>
  >({})

  let interval: ReturnType<typeof setInterval> | undefined
  let alpacaStreamWorker: Worker | undefined
  let snapshotWorker: Worker | undefined

  const start = () => {
    interval = setInterval(() => {
      for (const [symbol, tradeSnapshot] of tradeSnapshots.entries()) {
        tradeSnapshotViews[symbol] = tradeSnapshot.toView()
      }
    }, 500)

    alpacaStreamWorker = new Worker('@/lib/stream/alpacaStreamWorker.ts', {
      type: 'module',
    })

    alpacaStreamWorker.onmessage = (event: Event) => {
      const { detail } = event as CustomEvent

      if (detail.type === AlpacaStreamEvent.trade) {
        const tradeMessage = detail.payload as TradeMessage
        let tradeSnapshot = tradeSnapshots.get(tradeMessage.S)

        if (tradeSnapshot) {
          tradeSnapshot.trade = tradeMessage
        } else {
          tradeSnapshot = new TradeSnapshot()
          tradeSnapshot.trade = tradeMessage
          tradeSnapshots.set(tradeMessage.S, tradeSnapshot)
        }
      } else if (detail.type === AlpacaStreamEvent.ready) {
        ready.value = true
      } else if (detail.type === AlpacaStreamEvent.disconnected) {
        ready.value = false
      } else if (detail.type === AlpacaStreamEvent.error) {
        console.error(detail.payload)
      } else if (detail.type === AlpacaStreamEvent.subscription) {
        console.log(detail.payload)
      }
    }

    snapshotWorker = new Worker('@/lib/stream/snapshotsWorker.ts', {
      type: 'module',
    })

    snapshotWorker.onmessage = (event: Event) => {
      const { detail } = event as CustomEvent

      if (detail.type === 'snapshots') {
        for (const [symbol, snapshot] of Object.entries(detail.payload)) {
          let tradeSnapshot = tradeSnapshots.get(symbol)
          if (tradeSnapshot) {
            tradeSnapshot.snapshot = snapshot as Snapshot
          } else {
            tradeSnapshot = new TradeSnapshot()
            tradeSnapshot.snapshot = snapshot as Snapshot
            tradeSnapshots.set(symbol, tradeSnapshot)
          }
        }
      }
    }
  }

  const stop = () => {
    alpacaStreamWorker?.postMessage({
      type: 'disconnect',
    })
  }

  const subscribe = async (symbols: string[]): Promise<void> => {
    snapshotWorker?.postMessage({
      type: 'subscribe',
      payload: symbols,
    })

    alpacaStreamWorker?.postMessage({
      type: 'subscribe',
      payload: symbols,
    })
  }

  const unsubscribe = async (symbols: string[]): Promise<void> => {
    snapshotWorker?.postMessage({
      type: 'unsubscribe',
      payload: symbols,
    })

    alpacaStreamWorker?.postMessage({
      type: 'unsubscribe',
      payload: symbols,
    })
  }
  return {
    start,
    stop,
    ready,
    subscribe,
    unsubscribe,
  }
}
