import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus'; // 导入 Element Plus
import 'element-plus/dist/index.css'; // 导入 Element Plus 样式

const app = createApp(App);
app.use(ElementPlus); // 注册 Element Plus
app.mount('#app');