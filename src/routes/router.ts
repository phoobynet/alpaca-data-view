import Dashboard from '@/routes/dashboard/Dashboard.vue'
import { createRouter, createWebHistory } from 'vue-router'
import WorkerDemo from '@/routes/worker-demo/WorkerDemo.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Dashboard,
      name: 'Dashboard',
    },
    {
      path: '/worker-demo',
      component: WorkerDemo,
      name: 'WorkerDemo',
    },
  ],
})
