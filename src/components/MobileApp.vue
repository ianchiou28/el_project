<template>
  <div class="mobile-app">
    <div class="page-container">
      <div v-show="activePage === 0" class="page-content">
        <CalendarView :active="activePage === 0" />
        <WeatherWidget />
        <QuoteDisplay />
        <MusicControls />
      </div>
      <div v-show="activePage === 1" class="aichat-container">
        <AIChat />
      </div>
      <div v-show="activePage === 2">
        <EmotionReport :active="activePage === 2" />
      </div>
      <div v-if="activePage === 3">
        <SettingsModal />
      </div>
    </div>

    <md-navigation-bar>
      <md-navigation-tab label="日历" :active="activePage === 0" @click="activePage = 0">
        <span slot="inactive-icon" class="md3-icon">calendar_month</span>
        <span slot="active-icon" class="md3-icon">calendar_month</span>
      </md-navigation-tab>
      <md-navigation-tab label="聊天" :active="activePage === 1" @click="activePage = 1">
        <span slot="inactive-icon" class="md3-icon">chat</span>
        <span slot="active-icon" class="md3-icon">chat</span>
      </md-navigation-tab>
      <md-navigation-tab label="分析" :active="activePage === 2" @click="activePage = 2">
        <span slot="inactive-icon" class="md3-icon">insights</span>
        <span slot="active-icon" class="md3-icon">insights</span>
      </md-navigation-tab>
      <md-navigation-tab label="设置" :active="activePage === 3" @click="activePage = 3">
        <span slot="inactive-icon" class="md3-icon">settings</span>
        <span slot="active-icon" class="md3-icon">settings</span>
      </md-navigation-tab>
    </md-navigation-bar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import '@material/web/labs/navigationbar/navigation-bar.js';
import '@material/web/labs/navigationtab/navigation-tab.js';
import '@material/web/labs/navigationdrawer/navigation-drawer.js';
import '@material/web/common.js';

import CalendarView from './CalendarView.vue';
import WeatherWidget from './WeatherWidget.vue';
import QuoteDisplay from './QuoteDisplay.vue';
import MusicControls from './MusicControls.vue';
import EmotionReport from './EmotionReport.vue';
import SettingsModal from './SettingsModal.vue';
import AIChat from './AIChat.vue';

const activePage = ref(0);
</script>

<style scoped>
.mobile-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--md-background);
}

.page-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-container>* {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  width: 100%;
}

md-navigation-bar {
  --md-navigation-bar-background-color: var(--md-primary);
  --md-navigation-bar-selected-indicator-color: var(--md-on-primary);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

md-navigation-bar-item {
  --md-navigation-bar-item-color: var(--md-on-primary);
  --md-navigation-bar-item-selected-color: var(--md-on-primary);
}

.aichat-container {
  height: calc(100vh - 56px);
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.aichat-container>* {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.page-container,
.page-container>*,
.aichat-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.page-container::-webkit-scrollbar,
.page-container>*::-webkit-scrollbar,
.aichat-container::-webkit-scrollbar {
  display: none;
}
</style>
