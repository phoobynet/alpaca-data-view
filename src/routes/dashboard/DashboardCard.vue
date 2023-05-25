<script setup lang="ts">
import { Asset, getAsset, Snapshot, Trade } from '@phoobynet/alpaca-services'
import { computed, ref, watch } from 'vue'
import numeral from 'numeral'
import { numberDiff } from '@/lib/numberDiff'
import { useElementHover } from '@vueuse/core'
import { Close } from '@vicons/carbon'
import { Icon } from '@vicons/utils'

const props = defineProps<{ trade: Trade; snapshot?: Snapshot }>()
const emit = defineEmits(['delete'])
const asset = ref<Asset>()
const date = new Date()
const isoDate = date.toISOString().substring(0, 10)
const card = ref<HTMLDivElement | null>(null)

const isHovered = useElementHover(card)

const priceFormatted = computed(() => {
  return numeral(props.trade.p).format('$0,0.00')
})

const priceDiff = computed(() => {
  if (
    !props.snapshot?.prevDailyBar ||
    !props.snapshot?.dailyBar ||
    !props.trade
  ) {
    return undefined
  }

  let closingPrice: number

  if (props.snapshot.dailyBar.t.substring(0, 10) === isoDate) {
    closingPrice = props.snapshot.prevDailyBar.c
  } else {
    closingPrice = props.snapshot.dailyBar.c
  }

  return numberDiff(closingPrice, props.trade.p)
})

const priceChangeFormatted = computed(() => {
  const diff = priceDiff.value

  if (diff === undefined) {
    return undefined
  }

  return numeral(diff.change).format('$0,0.00')
})

const pctChangeFormatted = computed(() => {
  const diff = priceDiff.value

  if (diff === undefined) {
    return undefined
  }

  return numeral(diff.changePercent).format('0,0.00%')
})

const onDelete = () => {
  emit('delete', props.trade.S)
}

watch(
  () => props.trade.S,
  async (newValue, oldValue) => {
    if (newValue !== oldValue && newValue) {
      asset.value = await getAsset(newValue)
    }
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div
    ref="card"
    class="dashboard-card"
    :data-up="priceDiff?.sign === 1"
    :data-down="priceDiff?.sign === -1"
    v-if="trade && asset && snapshot"
  >
    <div class="name">{{ asset.name }}</div>
    <div class="symbol">{{ asset.symbol }}</div>
    <div class="price">{{ priceFormatted }}</div>
    <div class="change">
      <div class="price-change">{{ priceChangeFormatted }}</div>
      <div class="pct-change">{{ pctChangeFormatted }}</div>
    </div>
    <Transition>
      <div class="overlay" v-if="isHovered">
        <Icon :size="36" class="text-red-500" @click="onDelete">
          <Close />
        </Icon>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dashboard-card {
  @apply relative px-2 py-1 rounded border grid gap-0 hover:cursor-pointer;
  grid-template-rows: repeat(4, auto);
  grid-template-columns: repeat(3, auto);
  grid-template-areas:
    'name name name'
    'symbol price price'
    '. change change'
    'delete-btn delete-btn delete-btn';

  &[data-up='true'] {
    @apply border-green-500 border-r-16;
  }

  &[data-down='true'] {
    @apply border-red-500 border-r-16;
  }

  .name {
    grid-area: name;
    @apply text-xs text-slate-200 leading-tight truncate;
  }

  .symbol {
    grid-area: symbol;
    @apply text-xl font-bold tracking-wider;
  }

  .change {
    @apply flex gap-1 justify-end;
    grid-area: change;

    &.up {
      @apply text-green-400;
    }

    .price-change {
      grid-area: price-change;
      justify-self: end;
      @apply tabular-nums;
    }

    .pct-change {
      grid-area: pct-change;
      justify-self: end;
      @apply tabular-nums;
    }
  }

  .price {
    grid-area: price;
    justify-self: end;
    @apply tabular-nums text-xl font-light;
  }

  .delete-btn {
    grid-area: delete-btn;
    @apply uppercase border border-red-400 px-2 py-0.5 rounded font-semibold transition-all duration-150 text-xs mt-2;
    @apply hover:bg-red-500 text-red-400 hover:text-white hover:border-red-500;
    @apply active:scale-95;
  }

  .overlay {
    @apply absolute w-full h-full top-0 left-0 bg-red-500 bg-opacity-50 overflow-clip flex items-center justify-center rounded;
  }

  .v-enter-active,
  .v-leave-active {
    transition: opacity 0.5s ease;
  }

  .v-enter-from,
  .v-leave-to {
    opacity: 0;
  }
}
</style>
