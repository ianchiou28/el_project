<template>
    <div class="md3-app">
        <header class="md3-top-app-bar">
            <div class="top-app-bar-content">
                <h1 class="md3-title-large">心情日记</h1>
                <p class="md3-body-medium">记录你的每一天</p>
            </div>
        </header>

        <div class="page-wrapper">
            <div class="app-layout">
                <main class="md3-main-content-area">
                    <aside class="left-sidebar">
                        <div class="sidebar-module-wrapper">
                            <WeatherWidget />
                        </div>
                        <div class="sidebar-module-wrapper">
                            <QuoteDisplay />
                        </div>
                    </aside>

                    <div class="main-panel">
                        <CalendarView />
                    </div>

                    <aside class="right-sidebar">
                        <div class="sidebar-module-wrapper-music-controls">
                            <MusicControls />
                        </div>
                        <div class="sidebar-module-wrapper sidebar-module-wrapper-aichat-fixed-height">
                            <AIChat />
                        </div>
                    </aside>
                </main>
            </div>
        </div>

        <footer class="md3-footer">
            <p class="md3-body-small">&copy; {{ new Date().getFullYear() }} 心情日记应用</p>
        </footer>
    </div>
</template>

<script setup>
import CalendarView from './CalendarView.vue';
import QuoteDisplay from './QuoteDisplay.vue';
import WeatherWidget from './WeatherWidget.vue';
import MusicControls from './MusicControls.vue';
import AIChat from './AIChat.vue';
</script>
