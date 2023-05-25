import { createApp } from 'vue'
import '@/style.scss'
import App from '@/App.vue'
import { router } from '@/routes/router'
import { options } from '@phoobynet/alpaca-services'
import { createPinia } from 'pinia'
import { assetRepository } from '@/lib/assets'
import { calendarRepository } from '@/lib/calendars'

const pinia = createPinia()

options.set({
  key: import.meta.env.VITE_APP_APCA_API_KEY_ID,
  secret: import.meta.env.VITE_APP_APCA_API_SECRET_KEY,
  paper: true,
})

options.patch({
  assetRepository,
  calendarRepository,
})

const main = async () => {
  // force the retrieval of assets and calendars
  await assetRepository.find('AAPL')
  await calendarRepository.find(new Date())
}

main().then(() => {
  console.log('Assets and calendars loaded')
  createApp(App).use(pinia).use(router).mount('#app')
})
