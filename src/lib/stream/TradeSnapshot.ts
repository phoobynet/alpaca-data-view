import { Snapshot } from '@phoobynet/alpaca-services'
import numeral from 'numeral'
import { TradeSnapshotView } from '@/lib/stream/TradeSnapshotView'
import { TradeMessage } from '@/lib/stream/AlpacaStream'

export class TradeSnapshot {
  get symbol(): string {
    return this.trade?.S ?? this?._snapshot?.symbol ?? ''
  }

  get trade(): TradeMessage | undefined {
    return this._trade
  }

  set trade(trade: TradeMessage | undefined) {
    this._trade = trade
    this.update()
  }

  set snapshot(snapshot: Snapshot | undefined) {
    this._snapshot = snapshot
    this.update()
  }

  get signSymbol(): string {
    return this._signSymbol
  }

  get multiplier(): number {
    return this._multiplier
  }

  get percentChange(): number {
    return this._percentChange
  }

  get percentChangeFormatted(): string {
    return numeral(this.percentChange).format('0,0.00%')
  }

  get percentChangeFormattedAbsolute(): string {
    return numeral(Math.abs(this.percentChange)).format('0,0.00%')
  }

  get amountChange(): number {
    return this._amountChange
  }

  get amountChangeFormatted(): string {
    return numeral(this.amountChange).format('0,0.00')
  }

  get amountChangeFormattedAbsolute(): string {
    return numeral(Math.abs(this.amountChange)).format('0,0.00')
  }

  get tradePriceFormatted(): string {
    return numeral(this._trade?.p ?? 0).format('$0,0.00')
  }

  private readonly isoDate: string = new Date().toISOString().substring(0, 10)
  private _amountChange: number = 0
  private _percentChange: number = 0
  private _multiplier: number = 0
  private _signSymbol: string = 'UNCH'
  private _trade?: TradeMessage
  private _snapshot?: Snapshot

  get previousClosingPrice(): number {
    if (!this._snapshot?.dailyBar?.t || !this._snapshot?.prevDailyBar?.t) {
      return 0
    }

    const dailyBarDate = this._snapshot.dailyBar.t.substring(0, 10)

    if (dailyBarDate === this.isoDate) {
      return this._snapshot.dailyBar.c
    }

    return this._snapshot.prevDailyBar.c
  }

  private update() {
    if (!this._trade || !this._snapshot) {
      return
    }

    this._amountChange = this.trade!.p - this.previousClosingPrice
    this._percentChange = this._amountChange / this.previousClosingPrice
    this._multiplier =
      this._amountChange > 0 ? 1 : this._amountChange < 0 ? -1 : 0
    this._signSymbol =
      this._multiplier > 0 ? '+' : this._multiplier < 0 ? '-' : 'UNCH'

    // calculate change
  }

  toView(): TradeSnapshotView | undefined {
    if (!this.trade || !this._snapshot) {
      return undefined
    }

    return {
      ...this.trade,
      signSymbol: this.signSymbol,
      multiplier: this.multiplier,
      percentChange: this.percentChange,
      percentChangeFormatted: this.percentChangeFormatted,
      percentChangeFormattedAbsolute: this.percentChangeFormattedAbsolute,
      amountChange: this.amountChange,
      amountChangeFormatted: this.amountChangeFormatted,
      amountChangeFormattedAbsolute: this.amountChangeFormattedAbsolute,
      tradePriceFormatted: this.tradePriceFormatted,
    }
  }
}
