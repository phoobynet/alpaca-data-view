<script setup lang="ts">
import {
  AlpacaStream,
  AlpacaStreamEvent,
  TradeMessage,
} from '@/lib/stream/AlpacaStream'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getEnv } from '@/lib/env'

const alpacaStream = new AlpacaStream(getEnv())

const trade = ref<TradeMessage>()

const onTradeHandler = (event: Event) => {
  trade.value = (event as CustomEvent<TradeMessage>).detail
}

onMounted(() => {
  alpacaStream.addEventListener(AlpacaStreamEvent.error, (event: Event) => {
    const error = (event as CustomEvent).detail
    console.error(error)
  })

  alpacaStream.addEventListener(AlpacaStreamEvent.trade, onTradeHandler)
  alpacaStream.addEventListener(AlpacaStreamEvent.ready, () => {
    alpacaStream.subscribe({
      trades: ['AAPL'],
    })
  })

  alpacaStream.connect()
})

onBeforeUnmount(() => {
  alpacaStream.disconnect()
})
</script>

<template>
  <div>
    <h1>Socket Demo</h1>
    <p>Trade: {{ JSON.stringify(trade, null, 2) }}</p>
  </div>
</template>

<style scoped lang="scss"></style>
