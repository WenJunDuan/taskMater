import router from './router'
import { createApp } from 'vue'
import App from './App.vue'
import { pinia } from './stores'
import './assets/main.css'
import './plugins/chart'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
