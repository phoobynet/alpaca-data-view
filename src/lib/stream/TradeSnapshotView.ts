import { TradeMessage } from '@/lib/stream/AlpacaStream'

export interface TradeSnapshotView extends TradeMessage {
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
