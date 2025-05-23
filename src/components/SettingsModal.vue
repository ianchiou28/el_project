<template>
  <div v-if="show" class="md3-modal settings-dialog-overlay">
    <div class="md3-modal-content md3-surface-container settings-dialog-content">
      <div class="md3-modal-header">
        <p class="md3-headline-small dialog-title">设置</p>
        <button @click="handleClose" class="md3-icon-button dialog-close-button">
          <span class="md3-icon">close</span>
        </button>
      </div>

      <div class="md3-modal-body settings-dialog-body">
        <div class="setting-item">
          <label for="background-image-upload" class="md3-label-large setting-label">日历背景图片</label>
          <div class="setting-control">
            <button @click="triggerFileInput" class="md3-button md3-button-outlined">
              <span class="md3-icon" :style="{ verticalAlign: 'middle' }">upload_file</span> <span :style="{ verticalAlign: 'middle' }">选择图片</span>
            </button>
            <p v-if="currentBackgroundImageName" class="md3-body-small file-name-display">
              当前: {{ currentBackgroundImageName }}
            </p>
          </div>
          <input
            type="file"
            ref="fileInputRef"
            @change="handleFileChange"
            accept="image/*"
            style="display: none"
            id="background-image-upload"
          />
        </div>

        <div class="setting-item">
          <label for="calendar-opacity" class="md3-label-large setting-label">
            背景遮罩不透明度
          </label>
          <div class="setting-control opacity-control">
            <input
              type="range"
              id="calendar-opacity"
              min="0"
              max="1"
              step="0.01"
              v-model.number="localOpacity"
              @input="updateOpacity"
              class="md3-slider"
            />
            <span class="md3-body-medium opacity-value">{{ Math.round(localOpacity * 100) }}%</span>
          </div>
        </div>
        <div class="setting-item">
        <label for="ai-api-key" class="md3-label-large setting-label">AI API Key</label>
        <div class="setting-control">
          <input
            type="password"
            id="ai-api-key"
            v-model="aiApiKeyInput"
            placeholder="请输入您的 API Key"
            class="md3-text-field"
          />
          <p class="md3-body-small">请在此处输入您的 AI API Key (本地加密存储)</p>
      </div>
        </div>
      </div>

      <div class="md3-modal-actions">
        <button @click="handleClose" class="md3-button md3-button-text">完成</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, toRefs, onMounted, onUnmounted } from 'vue';
import { DataService } from '../services/dataService.js';

const props = defineProps({
  show: Boolean,
  currentOpacity: {
    type: Number,
    default: 0.75
  },
  currentBackgroundImageName: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'update:opacity', 'background-selected']);

const fileInputRef = ref(null);
const { currentOpacity, show } = toRefs(props);
const localOpacity = ref(props.currentOpacity);
const aiApiKeyInput = ref('');

watch(currentOpacity, (newVal) => {
  localOpacity.value = newVal;
});

watch(show, (newVal) => {
  if (newVal) {
    aiApiKeyInput.value = DataService.getAiApiKey();
    localOpacity.value = props.currentOpacity; 
  }
});

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    emit('background-selected', file);
  }
  event.target.value = '';
};

const updateOpacity = () => {
  emit('update:opacity', localOpacity.value);
};

const saveSettings = () => {
  DataService.saveAiApiKey(aiApiKeyInput.value);
};

const handleClose = () => {
  saveSettings();
  emit('close');
};


onMounted(() => {
  if (props.show) {
    aiApiKeyInput.value = DataService.getAiApiKey();
  }
});

</script>

<style scoped>
.settings-dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  padding: 16px;
}

.settings-dialog-content {
  background-color: var(--md-surface);
  color: var(--md-on-surface);
  border-radius: 28px;
  width: 100%;
  max-width: 380px; 
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px rgba(0, 0, 0, 0.3);
}

.settings-dialog-body {
  padding: 0 24px 24px;
}

.setting-item {
  margin-bottom: 24px;
}
.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  color: var(--md-on-surface);
  margin-bottom: 12px;
  font-weight: 500;
}

.setting-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: 16px;
}

.md3-slider {
  flex-grow: 1;
  width: auto;
  cursor: pointer;
  accent-color: var(--md-primary);
  background: var(--md-surface-variant);
  border-radius: 4px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
}

.md3-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--md-primary);
  border-radius: 50%;
  cursor: pointer;
  border: 4px solid var(--md-surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.md3-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--md-primary);
  border-radius: 50%;
  cursor: pointer;
  border: 4px solid var(--md-surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.opacity-value {
  color: var(--md-on-surface-variant);
  min-width: 40px;
  text-align: right;
}

.md3-button-outlined {
  background-color: transparent;
  color: var(--md-primary);
  border: 1px solid var(--md-outline);
  padding: 10px 16px;
  border-radius: 20px;
  align-self: flex-start;
}
.md3-button-outlined:hover {
  background-color: color-mix(in srgb, var(--md-primary) 8%, transparent);
  border-color: var(--md-primary);
}
.file-name-display {
  margin-top: 0;
  color: var(--md-on-surface-variant);
  font-size: 12px;
}

.md3-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.dialog-title {
  margin: 0;
  flex-grow: 1;
}

.dialog-close-button {
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--md-on-surface-variant);
  padding: 0;
  margin-left: 16px;
}

.dialog-close-button:hover {
  background-color: color-mix(in srgb, var(--md-on-surface-variant) 8%, transparent);
}

.dialog-close-button .md3-icon {
  font-size: 24px;
}

.md3-modal-actions {
  padding: 8px 24px 24px;
  justify-content: flex-end;
}

.md3-text-field {
  padding: 12px 16px;
  border: 1px solid var(--md-outline); 
  border-radius: 8px; 
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
  background-color: var(--md-surface-variant); 
  color: var(--md-on-surface-variant); 
  width: 100%;
  box-sizing: border-box;
}

.md3-text-field:focus {
  border-color: var(--md-primary);
  background-color: var(--md-surface); 
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary) 20%, transparent);
}
</style>
