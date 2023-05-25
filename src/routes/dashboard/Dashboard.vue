<script setup lang="ts">
import AssetSearch from '@/components/AssetSearch.vue'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { database } from '@/lib/database'
import DashboardCard from '@/routes/dashboard/DashboardCard.vue'
import {
  TradeStreamWorkerRequest,
  TradeStreamWorkerRequestType,
  TradeStreamWorkerResponse,
  TradeStreamWorkerResponseType,
} from '@/lib/workers/tradeStreamWorker'

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
          v-for="(tradeSnapshotView, symbol) in tradeSnapshots"
          :key="symbol"
          :trade-snapshot-view="tradeSnapshotView"
          @delete="(deleteSymbol: string) => onRemoveSymbol(deleteSymbol)"
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
