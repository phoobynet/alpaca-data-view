<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { debouncedWatch, onKeyDown, onClickOutside } from '@vueuse/core'
import { useAssetSearchStore } from '@/stores/useAssetSearchStore'

const store = useAssetSearchStore()
const emit = defineEmits(['update:symbol'])

const { loading, results, hasResults } = storeToRefs(store)

const query = ref<string>('')
const selectedIndex = ref<number>(-1)
const queryInput = ref<HTMLInputElement | null>(null)
const assetSearchRef = ref<HTMLDivElement | null>(null)
onClickOutside(assetSearchRef, () => {
  results.value = []
  queryInput.value?.select()
  selectedIndex.value = -1
})

onKeyDown('Escape', () => {
  results.value = []
  queryInput.value?.select()
  selectedIndex.value = -1
})

const onResultsDown = () => {
  if (selectedIndex.value < results.value.length - 1) {
    selectedIndex.value++
  }
}

const onResultsUp = () => {
  if (selectedIndex.value > 0) {
    selectedIndex.value--
  }
}

const onResultsEnter = () => {
  if (selectedIndex.value >= 0) {
    const asset = results.value[selectedIndex.value]
    emit('update:symbol', asset.symbol)
    results.value = []
    query.value = ''
    selectedIndex.value = -1
  }
}

debouncedWatch(
  query,
  async value => {
    results.value = []
    if (value) {
      await store.searchAssets(value)
    }
  },
  { debounce: 500 },
)

onMounted(async () => {
  await store.initialize()
})
</script>

<template>
  <div class="asset-search" ref="assetSearchRef">
    <template v-if="loading">
      <div>Loading...</div>
    </template>
    <template v-else>
      <div class="inner-container">
        <input
          type="text"
          placeholder="Search for assets..."
          v-model="query"
          @keydown.down.prevent="onResultsDown"
          @keydown.up.prevent="onResultsUp"
          @keydown.enter.prevent="onResultsEnter"
          ref="queryInput"
        />
        <Transition>
          <div class="search-results" v-if="hasResults">
            <div
              class="search-result"
              :class="{ selected: i === selectedIndex }"
              v-for="(x, i) in results"
              :key="x.symbol"
            >
              <div class="symbol">{{ x.symbol }}</div>
              <div class="exchange">{{ x.exchange }}</div>
              <div class="name">{{ x.name }}</div>
            </div>
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.asset-search {
  @apply flex flex-row items-center h-10 w-full bg-slate-700 relative z-10;

  .inner-container {
    @apply absolute w-full h-full;
    input {
      @apply outline-none border-none bg-inherit h-full w-full px-4 text-xl;
    }
  }

  .search-results {
    @apply bg-slate-700 w-full pb-3;

    .search-result {
      @apply h-6 w-full text-sm px-4;
      display: grid;
      grid-template-columns: 6rem 5rem 1fr;
      grid-template-areas: 'symbol exchange name';

      &.selected {
        @apply bg-slate-800;
      }

      .symbol {
        grid-area: symbol;
        @apply min-w-[3rem] font-bold tracking-wider text-orange-400;
      }

      .exchange {
        grid-area: exchange;
        @apply font-light text-slate-200;
      }

      .name {
        grid-area: name;
        @apply font-light;
      }
    }
  }
}

.v-enter-active,
.v-leave-active {
  transition: all 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
