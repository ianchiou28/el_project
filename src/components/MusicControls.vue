<template>
  <div class="music-player-card">
    <div class="player-header">
      <h2 class="music-title">音乐播放器</h2>
      <div class="search-bar">
        <input v-model="searchKeyword" @keyup.enter="searchSongsHandler" placeholder="搜索歌曲或歌手">

        </input>
        <div class="search-buttons">
          <md-filled-button class="md3-button" @click="searchSongsHandler">搜索</md-filled-button>
          <md-filled-button v-if="searching" class="md3-button" @click="resetSearch">重置</md-filled-button>
        </div>

      </div>
    </div>
    <audio ref="audioRef" :src="currentTrack?.url" :loop="isSingleLoop" @ended="onEnded" autoplay
      crossorigin="anonymous" playsinline preload="auto" class="music-audio" style="display:none"></audio>
    <div class="progress-container" v-if="currentTrack">
      <span class="time-label">{{ formatTime(currentTime) }}</span>
      <md-slider class="progress-slider" :value="currentTime" :min="0" :max="duration" step="0.1" @input="onSeek">
      </md-slider>
      <span class="time-label">{{ formatTime(duration) }}</span>
    </div>
    <div class="player-content">
      <div class="track-info" v-if="currentTrack">
        <p class="track-title">{{ currentTrack.title }}</p>
        <p class="track-artist">{{ currentTrack.artist }}</p>
      </div>
      <div class="music-actions">
        <md-filled-icon-button class="music-icons" @click="prevTrack" :disabled="tracks.length === 0" aria-label="上一曲">
          <md-icon>skip_previous</md-icon>
        </md-filled-icon-button>
        <md-filled-icon-button class="music-icons" @click="isPlaying ? pauseCurrent() : playCurrent()"
          :disabled="tracks.length === 0" aria-label="播放/暂停">
          <md-icon>{{ isPlaying ? 'pause' : 'play_arrow' }}</md-icon>
        </md-filled-icon-button>
        <md-filled-icon-button class="music-icons" @click="nextTrack" :disabled="tracks.length === 0" aria-label="下一曲">
          <md-icon>skip_next</md-icon>
        </md-filled-icon-button>
        <md-filled-icon-button class="music-icons" @click="toggleLoopMode" aria-label="循环模式">
          <md-icon>{{ isSingleLoop ? 'repeat_one' : 'repeat' }}</md-icon>
        </md-filled-icon-button>
      </div>
      <div class="status-messages">
        <div v-if="loading" class="music-loading">加载中...</div>
        <div v-if="error" class="music-error">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { fetchHotSongs, searchSongs, fetchPlaylistSongs } from '../services/musicApi.js';
import '@material/web/common.js'
import '@material/web/slider/slider.js';

const tracks = ref([]);
const currentTrackIndex = ref(0);
const currentTrack = ref(null);
const searchKeyword = ref('');
const loading = ref(false);
const error = ref('');
const searching = ref(false);
const audioRef = ref(null);
const currentTime = ref(0);
const duration = ref(0);
const isPlaying = ref(false); // 播放状态
const isSingleLoop = ref(false); // 单曲循环模式

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function onSeek(event) {
  const value = parseFloat(event.target.value);
  if (audioRef.value) {
    audioRef.value.currentTime = value;
    currentTime.value = value;
  }
}

const loadTracks = async () => {
  loading.value = true;
  error.value = '';
  try {
    const result = await fetchHotSongs(10);
    tracks.value = result;
    currentTrackIndex.value = 0;
    currentTrack.value = tracks.value[0] || null;
    if (!tracks.value.length) error.value = '未获取到可播放的歌曲';
  } catch (e) {
    error.value = '获取音乐失败';
  }
  loading.value = false;
};

const searchSongsHandler = async () => {
  if (!searchKeyword.value.trim()) return;
  loading.value = true;
  error.value = '';
  searching.value = true;
  try {
    const result = await searchSongs(searchKeyword.value, 10);
    tracks.value = result;
    currentTrackIndex.value = 0;
    currentTrack.value = tracks.value[0] || null;
    if (!tracks.value.length) error.value = '未获取到可播放的歌曲';
  } catch (e) {
    error.value = '搜索失败';
  }
  loading.value = false;
};

const resetSearch = () => {
  searchKeyword.value = '';
  searching.value = false;
  loadTracks();
};

const playCurrent = () => {
  if (!currentTrack.value?.url) {
    error.value = '当前歌曲无法播放';
    return;
  }

  if (audioRef.value) {
    error.value = '';
    if (audioRef.value.src !== currentTrack.value.url) {
      audioRef.value.load();
    }
    audioRef.value.play().catch(() => {
      error.value = '';
    });
  }
};

const pauseCurrent = () => {
  if (audioRef.value) {
    audioRef.value.pause();
  }
};

const nextTrack = () => {
  if (!tracks.value.length) return;

  const startIndex = currentTrackIndex.value;
  let foundPlayable = false;
  let attempts = 0;
  const maxAttempts = tracks.value.length; // 最多尝试遍历一遍歌单

  do {
    currentTrackIndex.value = (currentTrackIndex.value + 1) % tracks.value.length;
    currentTrack.value = tracks.value[currentTrackIndex.value];

    if (currentTrack.value?.url) {
      foundPlayable = true;
      break;
    }
    attempts++;
  } while (attempts < maxAttempts && currentTrackIndex.value !== startIndex);

  if (!foundPlayable) {
    error.value = '没有找到可播放的歌曲';
    return;
  }

  playCurrent();
};

const prevTrack = () => {
  if (!tracks.value.length) return;

  const startIndex = currentTrackIndex.value;
  let foundPlayable = false;
  let attempts = 0;
  const maxAttempts = tracks.value.length; // 最多尝试遍历一遍歌单

  do {
    currentTrackIndex.value = (currentTrackIndex.value - 1 + tracks.value.length) % tracks.value.length;
    currentTrack.value = tracks.value[currentTrackIndex.value];

    if (currentTrack.value?.url) {
      foundPlayable = true;
      break;
    }
    attempts++;
  } while (attempts < maxAttempts && currentTrackIndex.value !== startIndex);

  if (!foundPlayable) {
    error.value = '没有找到可播放的歌曲';
    return;
  }

  playCurrent();
};

const loadPlaylist = async () => {
  loading.value = true;
  error.value = '';
  try {
    const songs = await fetchPlaylistSongs(3778678, 20);
    if (songs.length > 0) {
      tracks.value = songs;
      currentTrackIndex.value = 0;
      currentTrack.value = tracks.value[0];
      playCurrent();
    } else {
      error.value = '未能获取到歌单歌曲';
    }
  } catch (e) {
    error.value = '加载歌单失败';
  }
  loading.value = false;
};

// 自动播放当前曲目，当 currentTrack 变化时触发
watch(currentTrack, (newTrack) => {
  if (newTrack) {
    playCurrent();
  }
});

watch(currentTrackIndex, (newIndex) => {
  currentTrack.value = tracks.value[newIndex] || null;
});

// 更新当前播放时间
setInterval(() => {
  if (audioRef.value && !audioRef.value.paused) {
    currentTime.value = audioRef.value.currentTime;
    duration.value = audioRef.value.duration;
  }
}, 1000);

onMounted(() => {
  loadTracks();
  // 注册音频事件
  const audio = audioRef.value;
  if (audio) {
    audio.addEventListener('loadedmetadata', () => {
      duration.value = audio.duration;
    });
    audio.addEventListener('timeupdate', () => {
      currentTime.value = audio.currentTime;
    });
    audio.addEventListener('play', () => { isPlaying.value = true; });
    audio.addEventListener('pause', () => { isPlaying.value = false; });
  }
});

onUnmounted(() => {
  const audio = audioRef.value;
  if (audio) {
    audio.removeEventListener('loadedmetadata', () => { });
    audio.removeEventListener('timeupdate', () => { });
  }
});

function toggleLoopMode() {
  isSingleLoop.value = !isSingleLoop.value;
  if (audioRef.value) audioRef.value.loop = isSingleLoop.value;
}

function onEnded() {
  if (!isSingleLoop.value) nextTrack();
}
</script>

<style scoped>
.music-player-card {
  background: var(--md-surface);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
  padding: 12px;
  width: 100%;
  max-width: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.music-title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  color: var(--md-on-surface);
  text-align: center;
}

.search-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.search-bar input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--md-outline);
  border-radius: 4px;
  font-size: 0.9rem;
}

.music-audio {
  width: 100%;
  height: 36px;
  margin: 4px 0;
}

.player-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.track-info {
  text-align: center;
  margin: 0;
}

.track-title {
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0;
  color: var(--md-on-surface);
}

.track-artist {
  font-size: 0.8rem;
  color: var(--md-on-surface-variant);
  margin: 4px 0 0 0;
}

.music-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-direction: row;
}

.md3-button {
  background: var(--md-surface-variant);
  border: 1px solid var(--md-outline);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 0.9rem;
  color: var(--md-on-surface);
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.music-icons {
  --md-filled-icon-button-container-width: 42px;
  --md-filled-icon-button-container-height: 42px;
  --md-filled-icon-button-icon-size: 30px;
}

.md3-button:hover {
  background: var(--md-outline-variant);
}

.md3-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-messages {
  text-align: center;
  min-height: 20px;
}

.music-loading {
  color: #888;
  font-size: 0.9em;
}

.music-error {
  color: #d32f2f;
  font-size: 0.9em;
}

.search-buttons {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 8px;
}

.search-buttons .md3-button {
  flex: 1;
  width: auto;
}

.progress-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  padding: 0 8px;
  overflow: hidden;
}

.time-label {
  font-size: 0.8rem;
  color: var(--md-on-surface-variant);
}

.progress-slider {
  flex: 1;
  width: auto;
  min-width: 0;
  max-width: 100%;
}
</style>