import Dexie from 'dexie'
import { Asset, Calendar } from '@phoobynet/alpaca-services'

export interface SelectedAsset {
  symbol: string
}

class AppDatabase extends Dexie {
  public assets!: Dexie.Table<Asset>
  public calendars!: Dexie.Table<Calendar>
  public selectedAssets!: Dexie.Table<SelectedAsset>

  constructor() {
    super('appDatabase')
    this.version(2).stores({
      calendars: 'id,date',
      assets:
        'id,class,status,symbol,exchange,name,tradable,shortable,marginable,easy_to_borrow',
      selectedAssets: 'symbol',
    })
  }
}

export const database = new AppDatabase()
