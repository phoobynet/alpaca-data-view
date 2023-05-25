<script setup lang="ts">
import AssetSearch from '@/components/AssetSearch.vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Snapshot, Trade } from '@phoobynet/alpaca-services'
import { database } from '@/lib/database'
import DashboardCard from '@/routes/dashboard/DashboardCard.vue'
import {
  TradeStreamWorkerRequest,
  TradeStreamWorkerRequestType,
  TradeStreamWorkerResponse,
  TradeStreamWorkerResponseType,
} from '@/lib/workers/tradeStreamWorker'
import { Env, getEnv } from '@/lib/env'

const trades = reactive<Record<string, Trade>>({})
const snapshots = ref<Record<string, Snapshot>>({})
const tradeStreamWorkerStatus = ref<'connecting' | 'connected'>()

const tradeStreamWorker = new Worker(
  new URL('@/lib/workers/tradeStreamWorker.ts', import.meta.url),
  { type: 'module' },
)

const connect = () => {
  tradeStreamWorker.postMessage({
    type: TradeStreamWorkerRequestType.credentials,
    payload: getEnv(),
  } satisfies TradeStreamWorkerRequest<Env>)
}

const subscribeTo = (symbol: string) => {
  tradeStreamWorker.postMessage({
    type: TradeStreamWorkerRequestType.subscribe,
    payload: symbol,
  } satisfies TradeStreamWorkerRequest<string>)
}

const unsubscribeFrom = (symbol: string) => {
  tradeStreamWorker.postMessage({
    type: TradeStreamWorkerRequestType.unsubscribe,
    payload: symbol,
  } satisfies TradeStreamWorkerRequest<string>)
}

const unsubscribeAll = () => {
  tradeStreamWorker.postMessage({
    type: TradeStreamWorkerRequestType.unsubscribeAll,
  } satisfies TradeStreamWorkerRequest<undefined>)
}

tradeStreamWorker.onmessage = (event: MessageEvent) => {
  const message = event.data as TradeStreamWorkerResponse<any>

  switch (message.type) {
    case TradeStreamWorkerResponseType.connected:
      tradeStreamWorkerStatus.value = 'connected'
      break
    case TradeStreamWorkerResponseType.trade:
      const t = message.payload as Trade
      if (t?.S) {
        trades[t.S] = t
      }
      break
    case TradeStreamWorkerResponseType.snapshots:
      snapshots.value = message.payload as Record<string, Snapshot>
      break
  }
}

const tradesList = computed(() => {
  return Object.values(trades)
})

const onSymbol = async (symbol: string) => {
  const selectedAsset = await database.selectedAssets
    .where('symbol')
    .equals(symbol)
    .first()

  if (!selectedAsset) {
    await database.selectedAssets.add({
      symbol,
    })
    subscribeTo(symbol)
  }
}

const onRemoveSymbol = async (symbol: string) => {
  await unsubscribeFrom(symbol)
  await database.selectedAssets.where('symbol').equals(symbol).delete()
}

onMounted(async () => {
  connect()

  const selectedAssets = await database.selectedAssets.toArray()

  for (const asset of selectedAssets) {
    await subscribeTo(asset.symbol)
  }
})

onBeforeUnmount(async () => {
  await unsubscribeAll()
  tradeStreamWorker.terminate()
})
</script>

<template>
  <div class="dashboard">
    <div>
      <AssetSearch @update:symbol="onSymbol" />
    </div>
    <main>
      <div class="cards">
        <DashboardCard
          v-for="(trade, index) in tradesList"
          :key="index"
          :trade="trade"
          :snapshot="!snapshots ? undefined : snapshots[trade.S]"
          @delete="(symbol: string) => onRemoveSymbol(symbol)"
        />
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  @apply flex flex-col gap-2;

  .cards {
    @apply grid xxs:grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 4xl:grid-cols-9 5xl:grid-cols-10 gap-2 mx-2;
  }

  .list-enter-active,
  .list-leave-active {
    transition: all 0.5s ease;
  }

  .list-enter-from,
  .list-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }
}
</style>
