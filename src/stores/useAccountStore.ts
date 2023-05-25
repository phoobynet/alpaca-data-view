import { defineStore } from 'pinia'
import { Account, getAccount } from '@phoobynet/alpaca-services'

export interface AccountStore {
  account?: Account
}

export const useAccountStore = defineStore('account', {
  state: (): AccountStore => ({
    account: undefined,
  }),

  actions: {
    async fetchAccount(): Promise<void> {
      this.account = await getAccount()
    },
  },
})
