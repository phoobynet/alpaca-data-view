<script lang="ts" setup>
import { useAccountStore } from '@/stores/useAccountStore'
import { onMounted } from 'vue'

const accountStore = useAccountStore()

onMounted(async () => {
  await accountStore.fetchAccount()
})
</script>

<template>
  <RouterView />
</template>
