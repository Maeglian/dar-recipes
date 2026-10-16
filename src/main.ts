import { createApp } from 'vue'
import App from './App.vue'
import { requestPersistentStorage } from './data/persistence'
import { router } from './router'
import './styles/tokens.css'
import './styles/base.css'

createApp(App).use(router).mount('#app')

void requestPersistentStorage()
