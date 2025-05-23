<template>
  <div class="md3-app">
    <header class="md3-top-app-bar">
      <div class="top-app-bar-content">
        <h1 class="md3-title-large">心情日记</h1>
        <p class="md3-body-medium">记录你的每一天</p>
      </div>
    </header>

    <div class="page-wrapper"> <main class="md3-main-content-area">
        <aside class="left-sidebar">
          <div class="sidebar-module-wrapper"> <WeatherWidget /> </div>
          <div class="sidebar-module-wrapper"> <QuoteDisplay /> </div>
        </aside>

        <div class="main-panel">
          <CalendarView />
        </div>
      </main>
    </div>

    <footer class="md3-footer">
      <p class="md3-body-small">&copy; {{ new Date().getFullYear() }} 心情日记应用</p>
    </footer>
  </div>
</template>

<script setup>
import CalendarView from './components/CalendarView.vue';
import QuoteDisplay from './components/QuoteDisplay.vue';
import WeatherWidget from './components/WeatherWidget.vue';
</script>

<style>
/* 全局样式和变量 */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

:root {
  --md-primary: #1A73E8;
  --md-on-primary: #FFFFFF;
  --md-primary-rgb: 26, 115, 232;
  /* ... (其他颜色变量保持不变) ... */
  --md-background: #f8f9fa;
  --md-on-background: #212529;
  --md-surface: #FFFFFF;
  --md-on-surface: #212529;
  --md-surface-variant: #e9ecef;
  --md-on-surface-variant: #495057;
  --md-outline: #ced4da;
  --md-outline-variant: #dee2e6;
  --md-error: #dc3545;

  /* 布局变量调整 */
  --top-app-bar-height: 60px;
  --footer-height: 44px;
  --page-horizontal-padding: 32px; /* 页面最外层左右内边距 */
  --content-vertical-padding: 24px;  /* 内容区上下内边距 */
  --sidebar-width: 280px;            /* 左侧边栏宽度，可以根据内容调整 */
  --panel-gap: 24px;                 /* 模块和面板之间的间隙 */
  --content-max-width: 1366px;       /* 整体内容区域的最大宽度 */
}

html {
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
*, *:before, *:after {
  box-sizing: inherit;
}

body {
  margin: 0; padding: 0;
  font-family: 'Roboto', sans-serif;
  background-color: var(--md-background);
  color: var(--md-on-background);
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.md3-app {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.md3-top-app-bar {
  background-color: var(--md-surface);
  color: var(--md-on-surface);
  padding: 0 var(--page-horizontal-padding); /* 使用页面左右内边距 */
  height: var(--top-app-bar-height);
  display: flex;
  justify-content: center; /* 标题居中 */
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid var(--md-outline);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}
.top-app-bar-content { text-align: center; }
.md3-title-large { font-size: 1.15rem; font-weight: 500; margin: 0 0 2px 0; }
.md3-body-medium { font-size: 0.8rem; font-weight: 400; margin: 0; opacity: 0.75; }

.page-wrapper { /* 新增：用于控制内容最大宽度和居中 */
  width: 100%;
  max-width: var(--content-max-width); /* 限制内容区域的最大宽度 */
  margin: 0 auto; /* 使内容区域在页面中水平居中 */
  padding: 0 var(--page-horizontal-padding); /* 保证内容区与页面边缘有间隙 */
  box-sizing: border-box;
  flex-grow: 1; /* 占据可用垂直空间 */
  display: flex; /* 使内部的 .md3-main-content-area 能正确布局 */
}

.md3-main-content-area {
  display: flex;
  flex-grow: 1; /* 填满 .page-wrapper 的宽度 */
  padding-top: var(--content-vertical-padding); /* 内容区顶部内边距 */
  padding-bottom: var(--content-vertical-padding); /* 内容区底部内边距 */
  gap: var(--panel-gap);
  align-items: flex-start;
  width: 100%; /* 确保它填满 .page-wrapper */
}

.left-sidebar {
  width: var(--sidebar-width);
  min-width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--panel-gap); /* 天气和语录模块之间的间距 */
  position: sticky;
  top: calc(var(--top-app-bar-height) + var(--content-vertical-padding)); /* 调整粘性定位的 top 值 */
  align-self: flex-start;
  /* 左侧边栏高度由内容决定，随页面滚动 */
}

.sidebar-module-wrapper {
  background-color: var(--md-surface);
  border-radius: 12px;
  padding: 18px;   /* 调整模块内边距 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
  width: 100%;
  box-sizing: border-box;
}

.main-panel {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 800px; /* 日历主体的最大宽度恢复到800px */
  /* 如果希望日历在 .main-panel 中不是严格靠左（当 .main-panel 比 800px 宽时），
     可以给 .main-panel 设置 align-items: center; 或者给 CalendarView margin: 0 auto;
     但通常 flex-grow:1 后，如果 CalendarView 内部是 width:100%，它会填满。
     这里的 max-width:800px 是对 CalendarView 所在的这个容器的限制。
  */
}
.main-panel > * { /* CalendarView */
    width: 100%;
}


.md3-footer {
  padding: 8px var(--page-horizontal-padding);
  text-align: center;
  background-color: var(--md-surface-variant);
  color: var(--md-on-surface-variant);
  border-top: 1px solid var(--md-outline);
  flex-shrink: 0;
  height: var(--footer-height);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}
.md3-footer .md3-body-small { font-size: 0.75rem; }

.md3-icon { font-family: 'Material Symbols Outlined'; font-size: 24px; }
/* ... (您的 .md3-button 等通用样式，确保它们与 QuoteDisplay.vue 中使用的按钮样式协调) ... */
</style>