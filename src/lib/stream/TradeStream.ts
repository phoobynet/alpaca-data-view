import {
  CancelFn,
  getLatestTrade,
  getMultiSnapshot,
  observeTrades,
  Snapshot,
  Trade,
} from '@phoobynet/alpaca-services'
import { throttle } from 'lodash-es'
import { database } from '@/lib/database'
import { getSeconds } from 'date-fns'

export class TradeStream extends EventTarget {
  private symbols: Map<string, CancelFn> = new Map<string, CancelFn>()
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

      this.dispatchEvent(
        new CustomEvent<Record<string, Snapshot>>('snapshots', {
          detail: snapshots,
        }),
      )
    } else {
      this.dispatchEvent(
        new CustomEvent<Record<string, Snapshot>>('snapshots', {
          detail: {},
        }),
      )
    }
  }

  public async subscribe(symbol: string) {
    if (this.symbols.has(symbol)) return

    // initial trade
    try {
      const latestTrade = await getLatestTrade(symbol)

      this.dispatchEvent(
        new CustomEvent<Trade>('trade', {
          detail: latestTrade,
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
          this.dispatchEvent(
            new CustomEvent('trade', {
              detail: trade,
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
