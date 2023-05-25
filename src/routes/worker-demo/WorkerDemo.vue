<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  TradeStreamWorkerRequest,
  TradeStreamWorkerRequestType,
  TradeStreamWorkerResponse,
  TradeStreamWorkerResponseType,
} from '@/lib/workers/tradeStreamWorker'
import { Trade } from '@phoobynet/alpaca-services'
import { Env, getEnv } from '@/lib/env'

const loading = ref(false)
const trade = ref<Trade>()
const connected = ref<boolean>(false)

const worker = new Worker(
  new URL('@/lib/workers/tradeStreamWorker.ts', import.meta.url),
  { type: 'module' },
)

worker.onmessage = (event: MessageEvent) => {
  const message = event.data as TradeStreamWorkerResponse<any>

  switch (message.type) {
    case TradeStreamWorkerResponseType.connected:
      loading.value = false
      connected.value = true
      worker.postMessage({
        type: TradeStreamWorkerRequestType.subscribe,
        payload: 'AAPL',
      })
      break
    case TradeStreamWorkerResponseType.trade:
      trade.value = message.payload as Trade
  }
}

onMounted(() => {
  loading.value = true
  const request: TradeStreamWorkerRequest<Env> = {
    type: TradeStreamWorkerRequestType.credentials,
    payload: getEnv(),
  }

  worker.postMessage(request)
})

onBeforeUnmount(() => {
  worker.postMessage({
    type: TradeStreamWorkerRequestType.unsubscribeAll,
  })
  worker.terminate()
})
</script>

<template>
  <div class="container mx-auto max-w-4xl flex flex-col gap-4">
    <h1>Worker Demo</h1>
    <main>
      <template v-if="!connected">Connecting...</template>
      <pre>{{ JSON.stringify(trade, null, 2) }}</pre>
    </main>
  </div>
</template>

<style scoped lang="scss"></style>
