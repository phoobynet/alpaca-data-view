<script setup lang="ts">
import { Asset, getAsset } from '@phoobynet/alpaca-services'
import { ref, toRefs, watch } from 'vue'
import { useElementHover } from '@vueuse/core'
import { Close, CaretDown, CaretUp } from '@vicons/carbon'
import { Icon } from '@vicons/utils'
import { TradeSnapshotView } from '@/lib/stream/TradeSnapshotView'

const props = defineProps<{ tradeSnapshotView: TradeSnapshotView }>()
const emit = defineEmits(['delete'])
const asset = ref<Asset>()
const card = ref<HTMLDivElement | null>(null)

const { tradeSnapshotView: view } = toRefs(props)

const isHovered = useElementHover(card)

const onDelete = () => {
  emit('delete', props.tradeSnapshotView?.symbol)
}

watch(
  () => view.value?.S,
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
    :data-multiplier="tradeSnapshotView?.multiplier"
    v-if="tradeSnapshotView && asset"
  >
    <div class="name">{{ asset.name }}</div>
    <div class="symbol">{{ asset.symbol }}</div>
    <div class="price">{{ view.tradePriceFormatted }}</div>
    <div class="change">
      <div v-if="view.multiplier === 1">
        <Icon :size="24" class="-translate-y-[1px]">
          <CaretUp />
        </Icon>
      </div>
      <div v-if="view.multiplier === -1" class="-translate-y-[3px]">
        <Icon :size="24">
          <CaretDown />
        </Icon>
      </div>
      <div class="price-change">
        {{ view.amountChangeFormattedAbsolute }}
      </div>
      <div class="pct-change">({{ view.percentChangeFormattedAbsolute }})</div>
    </div>
    <Transition>
      <div class="overlay" v-if="isHovered" @click="onDelete">
        <Icon :size="36" class="text-red-500">
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

  &[data-multiplier='1'] {
    @apply border-green-500 border-r-16;

    .change {
      @apply text-green-400 font-light;
    }
  }

  &[data-multiplier='-1'] {
    @apply border-red-500 border-r-16;

    .change {
      @apply text-red-400 font-light;
    }
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
    @apply flex gap-1 justify-end text-sm;
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
      @apply tabular-nums font-bold tracking-wider;
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
    @apply absolute w-full h-full top-0 left-0 bg-black bg-opacity-80 overflow-clip flex items-center justify-center rounded;
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
