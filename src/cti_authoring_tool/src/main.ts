import App from './App.vue'
import store from './store'
import "@/assets/fonts/inter.css"
import "@/assets/fonts/roboto_mono.css"
import { createApp, ref } from 'vue'
import { PluginConfiguration } from './assets/scripts/Page'

// Configure Page API
PluginConfiguration.makeReactive = (O: any) => ref(O).value;

// Create App
createApp(App).use(store).mount('#app')
