import { defineStore } from 'pinia'
import { getAssets } from '@phoobynet/alpaca-services'
import Fuse from 'fuse.js'

export interface AssetSearchResult {
  name: string
  symbol: string
  exchange: string
  class: string
}

export interface AssetSearchStore {
  fuse?: Fuse<AssetSearchResult>
  results: AssetSearchResult[]
  searching: boolean
  loading: boolean
}

export const useAssetSearchStore = defineStore('assetSearch', {
  state: (): AssetSearchStore => ({
    fuse: undefined,
    results: [],
    searching: false,
    loading: false,
  }),

  actions: {
    async initialize(): Promise<void> {
      if (this.fuse) return

      const assets = await getAssets().then(assets =>
        assets.map(x => ({
          name: x.name,
          symbol: x.symbol,
          exchange: x.exchange,
          class: x.class,
        })),
      )

      this.fuse = new Fuse<AssetSearchResult>(assets, {
        keys: ['name', 'symbol'],
      })
    },
    async searchAssets(query: string): Promise<void> {
      if (!this.fuse) {
        await this.initialize()
      }

      try {
        this.searching = true
        this.results = this.fuse!.search(query, {
          limit: 20,
        }).flatMap(x => x.item)
      } catch (e) {
        console.error(e)
      } finally {
        this.searching = false
      }
    },
  },
  getters: {
    hasResults(state): boolean {
      return !state.searching && state.results.length > 0
    },
  },
})
