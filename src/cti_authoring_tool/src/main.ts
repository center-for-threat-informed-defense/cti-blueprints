import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import "@/assets/fonts/inter.css"
import "@/assets/fonts/roboto_mono.css"

createApp(App).use(store).mount('#app')
