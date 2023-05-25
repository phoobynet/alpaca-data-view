import { Env } from '@/lib/env'

export enum AlpacaStreamEvent {
  ready = 'ready',
  error = 'error',
  subscription = 'subscription',
  trade = 'trade',
  disconnected = 'disconnected',
}

interface Message {
  T: string
  msg?: string
  code?: number
}

export interface TradeMessage {
  T: string
  S: string
  i: number
  x: string
  p: number
  s: number
  c: string[]
  z: string
  t: string
}

export interface AlpacaStreamSubscription {
  trades: string[]
}

export class AlpacaStream extends EventTarget {
  private _socket: WebSocket | undefined

  constructor(private env: Env) {
    super()
  }

  connect() {
    this._socket = new WebSocket('wss://stream.data.alpaca.markets/v2/sip')

    this._socket.onopen = () => {
      console.log('Alpaca Socket Open')
    }

    this._socket.onmessage = (message: MessageEvent) => {
      const messages = JSON.parse(message.data.toString()) as Message[]

      const leading = messages[0]

      if (leading.T === 'success') {
        if (leading.msg === 'connected') {
          // authenticated
          const request = JSON.stringify({
            action: 'auth',
            key: this.env.key,
            secret: this.env.secret,
          })
          console.log(request)
          this._socket!.send(request)
        } else if (leading.msg === 'authenticated') {
          this.dispatchEvent(new CustomEvent(AlpacaStreamEvent.ready))
        }
      } else if (leading.T === 'error') {
        this.dispatchEvent(
          new CustomEvent(AlpacaStreamEvent.error, { detail: leading }),
        )
      } else if (leading.T === 'subscription') {
        this.dispatchEvent(
          new CustomEvent(AlpacaStreamEvent.subscription, {
            detail: leading,
          }),
        )
      } else {
        for (const message of messages) {
          if (message.T === 't') {
            this.dispatchEvent(
              new CustomEvent<TradeMessage>(AlpacaStreamEvent.trade, {
                detail: message as TradeMessage,
              }),
            )
          }
        }
      }
    }

    this._socket.onerror = error => {
      this.dispatchEvent(
        new CustomEvent(AlpacaStreamEvent.error, { detail: error }),
      )
    }
  }

  disconnect() {
    this._socket?.close()
    this.dispatchEvent(new CustomEvent(AlpacaStreamEvent.disconnected))
  }

  private get isSocketOpen() {
    return !(
      !this._socket ||
      this._socket.readyState === WebSocket.CLOSED ||
      this._socket.readyState === WebSocket.CLOSING
    )
  }

  subscribe(request: AlpacaStreamSubscription) {
    if (!this.isSocketOpen) {
      throw new Error('Socket not available')
    }

    this._socket!.send(JSON.stringify({ action: 'subscribe', ...request }))
  }

  unsubscribe(request: AlpacaStreamSubscription) {
    if (!this.isSocketOpen) {
      throw new Error('Socket not available')
    }

    this._socket!.send(JSON.stringify({ action: 'unsubscribe', ...request }))
  }
}
