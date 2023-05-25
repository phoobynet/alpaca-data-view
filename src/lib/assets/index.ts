import { database } from '@/lib/database'
import { Asset, AssetRepository, getAssets } from '@phoobynet/alpaca-services'

let isReady = false

const isEmpty = async (): Promise<void> => {
  if (!isReady) {
    const c = await database.assets.count()
    if (c === 0) {
      // set forceHTTP to true to ensure data is retrieved from the API (not from cache (which will be empty (which is loop badness)))
      const assets = await getAssets(true)
      await database.assets.bulkPut(assets)
    }
    isReady = true
  }
}

export const assetRepository: AssetRepository = {
  async find(symbol: string): Promise<Asset | undefined> {
    await isEmpty()
    return database.assets.where('symbol').equalsIgnoreCase(symbol).first()
  },
  async findAll(): Promise<Asset[]> {
    await isEmpty()
    return database.assets.toArray()
  },
}
