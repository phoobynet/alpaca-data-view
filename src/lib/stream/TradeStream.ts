import {
  CancelFn,
  getLatestTrade,
  getMultiSnapshot,
  observeTrades,
  Trade,
} from '@phoobynet/alpaca-services'
import { throttle } from 'lodash-es'
import { database } from '@/lib/database'
import { getSeconds } from 'date-fns'
import { TradeSnapshot } from '@/lib/stream/TradeSnapshot'
import { TradeSnapshotView } from '@/lib/stream/TradeSnapshotView'

let webSocket: WebSocket | undefined

export class TradeStream extends EventTarget {
  private symbols: Map<string, CancelFn> = new Map<string, CancelFn>()
  private tradeSnapshots = new Map<string, TradeSnapshot>()
  private interval!: ReturnType<typeof setInterval> | undefined

  public constructor(private throttle = 500) {
    super()
  }

  private async updateSnapshots(): Promise<void> {
    const symbols = Array.from(this.symbols.keys())

    if (symbols.length) {
      const snapshots = await getMultiSnapshot({
        symbols,
      })

      for (const symbol of Object.keys(snapshots)) {
        const snapshot = snapshots[symbol]
        let tradeSnapshot = this.tradeSnapshots.get(symbol)

        if (tradeSnapshot) {
          tradeSnapshot.snapshot = snapshot
        } else {
          tradeSnapshot = new TradeSnapshot()
          tradeSnapshot.snapshot = snapshot
          this.tradeSnapshots.set(symbol, tradeSnapshot)
        }
        this.dispatchEvent(
          new CustomEvent<TradeSnapshotView>('tradeSnapshot', {
            detail: tradeSnapshot.toView(),
          }),
        )
      }
    }
  }

  public async subscribe(symbol: string) {
    if (this.symbols.has(symbol)) return

    // initial trade
    try {
      const latestTrade = await getLatestTrade(symbol)
      let tradeSnapshot = this.tradeSnapshots.get(symbol)

      if (tradeSnapshot) {
        tradeSnapshot.trade = latestTrade
      } else {
        tradeSnapshot = new TradeSnapshot()
        tradeSnapshot.trade = latestTrade
        this.tradeSnapshots.set(symbol, tradeSnapshot)
      }

      this.dispatchEvent(
        new CustomEvent<TradeSnapshotView>('tradeSnapshot', {
          detail: tradeSnapshot.toView(),
        }),
      )

      if (!this.interval) {
        this.interval = setInterval(async () => {
          if (getSeconds(new Date()) === 1) {
            await this.updateSnapshots()
          }
        }, 1_000)
      }

      const cancel = await observeTrades(
        symbol,
        throttle(trade => {
          let tradeSnapshot = this.tradeSnapshots.get(symbol)

          if (tradeSnapshot) {
            tradeSnapshot.trade = trade
          } else {
            tradeSnapshot = new TradeSnapshot()
            tradeSnapshot.trade = trade
            this.tradeSnapshots.set(symbol, tradeSnapshot)
          }

          this.dispatchEvent(
            new CustomEvent<TradeSnapshotView>('tradeSnapshot', {
              detail: tradeSnapshot.toView(),
            }),
          )
        }, this.throttle),
      )

      this.symbols.set(symbol, cancel)
      await this.updateSnapshots()
    } catch (error) {
      await database.selectedAssets.where('symbol').equals(symbol).delete()
      console.error(error)
    }
  }

  public async unsubscribe(symbol: string) {
    const cancel = this.symbols.get(symbol)
    if (!cancel) return

    // cancelling
    cancel()
    this.symbols.delete(symbol)
    this.tradeSnapshots.delete(symbol)

    this.dispatchEvent(
      new CustomEvent<{ symbol: string }>('unsubcribed', {
        detail: {
          symbol,
        },
      }),
    )

    await this.updateSnapshots()
  }

  public async unsubscribeAll() {
    const symbols = Array.from(this.symbols.keys())

    for (const symbol of symbols) {
      const cancel = this.symbols.get(symbol)
      if (!cancel) continue
      cancel()

      this.symbols.delete(symbol)
    }

    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }

    await this.updateSnapshots()

    this.dispatchEvent(
      new CustomEvent<{ symbols: string[] }>('unsubscribedAll', {
        detail: {
          symbols,
        },
      }),
    )
  }
}
