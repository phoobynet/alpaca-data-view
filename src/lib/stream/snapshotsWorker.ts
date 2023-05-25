import { MessageData } from '@/lib/stream/MessageData'
import { options, getMultiSnapshot } from '@phoobynet/alpaca-services'
import { getSeconds } from 'date-fns'

let interval: ReturnType<typeof setInterval> | undefined

self.onmessage = async (event: MessageEvent) => {
  const data = event.data as MessageData

  if (data.type === 'subscribe') {
    if (interval) {
      clearInterval(interval)
    }

    interval = setInterval(async () => {
      if (getSeconds(new Date()) === 1) {
        const result = await getMultiSnapshot({
          symbols: data.payload,
        })

        self.postMessage({
          type: 'snapshots',
          payload: result,
        })
      }
    }, 1_000)
  } else if (data.type === 'unsubscribe') {
    if (interval) {
      clearInterval(interval)
      interval = undefined
    }
  } else if (data.type === 'credentials') {
    options.set(data.payload)
  } else {
    console.log('Unknown message type: ', data.type)
  }
}
