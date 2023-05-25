import { Trade } from '@phoobynet/alpaca-services'

export interface TradeSnapshotView extends Trade {
  signSymbol: string
  multiplier: number
  percentChange: number
  percentChangeFormatted: string
  percentChangeFormattedAbsolute: string
  amountChange: number
  amountChangeFormatted: string
  amountChangeFormattedAbsolute: string
  tradePriceFormatted: string
}
