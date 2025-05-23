<template>
  <div class="calendar-view-wrapper"> <div class="md3-calendar" :style="calendarComputedStyle" v-if="!showEmotionReportView">
      <div class="md3-calendar-header">
        <button @click="prevMonth" class="md3-icon-button" aria-label="上个月">
          <span class="md3-icon">chevron_left</span>
        </button>
        <h2 class="md3-title-medium month-year-display">{{ currentMonth.format('YYYY年MM月') }}</h2>
        <button @click="nextMonth" class="md3-icon-button" aria-label="下一个月">
          <span class="md3-icon">chevron_right</span>
        </button>
        <div class="calendar-actions">
          <button @click="openChat" class="md3-icon-button" title="AI助手对话">
            <span class="md3-icon">chat_bubble</span>
          </button>
          <button @click="toggleEmotionReportDisplay" class="md3-icon-button" title="情绪分析报告">
            <span class="md3-icon">analytics</span>
          </button>
          <button @click="showSettingsModal = true" class="md3-icon-button" title="设置">
            <span class="md3-icon">settings</span>
          </button>
        </div>
      </div>

      <div class="md3-calendar-weekdays">
         <div v-for="day in weekDays" :key="day" class="md3-calendar-weekday">{{ day }}</div>
      </div>

      <div class="md3-calendar-days">
        <div
            v-for="(day, index) in daysInMonth"
            :key="day.date.format('YYYY-MM-DD-') + index" class="md3-calendar-day"
            :class="{
            'md3-calendar-day-inactive': !day.isCurrentMonth,
            'md3-calendar-day-has-events': events[day.date.format('YYYY-MM-DD')]?.length > 0,
            'md3-calendar-day-has-mood': moods[day.date.format('YYYY-MM-DD')]
            }"
            @click="openDetail(day.date)" >
            <div class="md3-calendar-date">{{ day.date.date() }}</div>
            <div v-if="moods[day.date.format('YYYY-MM-DD')]" class="md3-mood-indicator">
            {{ moodEmoji(moods[day.date.format('YYYY-MM-DD')]) }}
            </div>
            <div class="md3-event-list">
            <div
                v-for="(event, i) in (events[day.date.format('YYYY-MM-DD')] || []).slice(0, 2)"
                :key="i"
                class="md3-event-chip"
                :title="event.text"
            >
                {{ event.text }}
            </div>
            </div>
        </div>
      </div>
    </div> <div v-if="showDetailModal" class="md3-modal"> <div class="md3-modal-content md3-surface-container">
        <div class="md3-modal-header">
          <h3 class="md3-headline-small">
            {{ selectedDate?.format('YYYY-MM-DD') }}
            <span v-if="!isFutureSelectedDate"> -
              <span v-if="moods[selectedDate?.format('YYYY-MM-DD')]">编辑心情</span>
              <span v-else>记录心情</span>
            </span>
          </h3>
          <button @click="closeDetailModal" class="md3-icon-button" aria-label="关闭详情弹窗">
            <span class="md3-icon">close</span>
          </button>
        </div>
        <div class="md3-modal-body">
          <div v-if="!isFutureSelectedDate">
            <div class="md3-form-field">
               <label for="mood-category" class="md3-label">今天的心情是:</label>
               <select v-model="currentMood.category" id="mood-category" class="md3-select" :disabled="isFutureSelectedDate">
                   <option value="">-- 请选择 --</option>
                   <option value="喜悦">喜悦</option>
                   <option value="骄傲">骄傲</option>
                   <option value="难过">难过</option>
                   <option value="生气">生气</option>
                   <option value="害怕">害怕</option>
               </select>
            </div>
            <div class="md3-form-field">
               <label for="mood-scale" class="md3-label">程度 (1-10):</label>
               <input v-model.number="currentMood.scale" type="number" id="mood-scale" class="md3-text-field" min="1" max="10" :disabled="isFutureSelectedDate">
            </div>
            <div class="md3-form-field">
               <label for="mood-description" class="md3-label">详细描述 (可选):</label>
               <textarea v-model="currentMood.description" id="mood-description" class="md3-text-area" rows="3" placeholder="今天的心情如何？发生了什么事？" :disabled="isFutureSelectedDate"></textarea>
            </div>
          </div>
          <div v-else class="md3-form-field">
             <p class="md3-body-medium">未来日期无法记录心情，但可以添加提醒事项。</p>
          </div>
          <div class="md3-form-section">
             <label class="md3-label-large">提醒事项:</label>
             <div v-if="currentDayEvents.length > 0" class="md3-event-list-container">
               <div v-for="(event, index) in currentDayEvents" :key="index" class="md3-event-item">
                   <span>{{ index + 1 }}. {{ event.text }}</span>
                   <button @click="removeEvent(index)" class="md3-icon-button md3-icon-button-small" :disabled="isPastSelectedDate && !canModifyExistingPastEvents" aria-label="移除事件">
                       <span class="md3-icon">delete</span>
                   </button>
               </div>
             </div>
             <div v-if="!isPastSelectedDate || (isPastSelectedDate && canModifyExistingPastEvents)" class="md3-event-add">
               <textarea v-model="newEventText" class="md3-text-area" placeholder="新增提醒事项" :disabled="isPastSelectedDate && !canModifyExistingPastEvents"></textarea>
               <button @click="addEvent" class="md3-button md3-button-text" :disabled="isPastSelectedDate && !canModifyExistingPastEvents">
                   <span class="md3-icon">add</span> 添加
               </button>
             </div>
             <div v-else-if="isPastSelectedDate && !canModifyExistingPastEvents && currentDayEvents.length === 0" class="md3-form-field">
                 <p class="md3-body-medium">过去日期无法新增提醒事项。</p>
             </div>
          </div>
        </div>
        <div class="md3-modal-actions">
          <button v-if="!isFutureSelectedDate" @click="saveMood" class="md3-button">保存心情</button>
          <button @click="closeDetailModal" class="md3-button md3-button-text">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="showChatModal" class="md3-modal">
        <div class="md3-modal-content md3-surface-container chat-modal-content">
        <div class="md3-modal-header">
          <h3 class="md3-headline-small">AI 助手对话</h3>
          <button @click="closeChat" class="md3-icon-button" aria-label="关闭对话">
            <span class="md3-icon">close</span>
          </button>
        </div>
        <div v-if="chatInitializationError" class="api-key-warning md3-error-container chat-error">
             <p class="md3-body-medium">{{ chatInitializationError }}</p>
        </div>
        <div class="md3-modal-body chat-history-body">
          <div v-for="(message, index) in chatHistory" :key="index"
               :class="['chat-message', message.role === 'user' ? 'user-message' : 'assistant-message']">
            <p><strong>{{ message.role === 'user' ? '你' : '助手' }}:</strong> {{ message.content }}</p>
          </div>
          <div v-if="isChatLoading" class="chat-loading-indicator">
            <p>AI 思考中...</p>
          </div>
        </div>
        <div class="md3-modal-actions chat-input-actions">
          <div class="chat-input-wrapper">
            <textarea v-model="chatInput" @keyup.enter.exact="sendMessage"
                      class="md3-text-area" placeholder="输入你的问题..."
                      :disabled="isChatLoading || !!chatInitializationError"></textarea>
          </div>
          <button @click="sendMessage" :disabled="isChatLoading || !chatInput.trim() || !!chatInitializationError" class="md3-button send-button">
            <span class="md3-icon">send</span>发送
          </button>
        </div>
      </div>
    </div>

    <SettingsModal
      :show="showSettingsModal"
      :current-opacity="calendarOverlayOpacity"
      :current-background-image-name="currentBgImageName"
      @close="showSettingsModal = false"
      @update:opacity="updateCalendarOpacity"
      @background-selected="handleBackgroundSelected"
      @api-key-updated="handleApiKeyUpdate" />

    <div v-if="showEmotionReportView" class="emotion-report-container">
      <div class="emotion-report-header">
        <h2 class="md3-title-large">情绪分析报告</h2>
        <button @click="toggleEmotionReportDisplay" class="md3-icon-button" title="返回日历视图">
            <span class="md3-icon">calendar_month</span>
        </button>
      </div>
      <EmotionReport />
    </div>

  </div> </template>

<script setup>
// --- Script 部分的核心逻辑保持与您提供的版本一致 ---
// 只是移除了 WeatherWidget 的导入
import { ref, computed, onMounted, watch } from 'vue';
import dayjs from 'dayjs';
import { DataService } from '../services/dataService.js';
import SettingsModal from './SettingsModal.vue';
import OpenAI from 'openai';
import EmotionReport from './EmotionReport.vue';
// import WeatherWidget from './WeatherWidget.vue'; // <--- 移除此行

const currentDate = ref(dayjs());
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const currentMonth = computed(() => currentDate.value.startOf('month'));
const daysInMonth = computed(() => {
  const start = currentMonth.value.startOf('week');
  const end = currentMonth.value.endOf('month').endOf('week');
  const daysArray = [];
  let date = start;
  while (date.isBefore(end) || date.isSame(end)) {
    daysArray.push({ date, isCurrentMonth: date.month() === currentMonth.value.month() });
    date = date.add(1, 'day');
  }
  return daysArray;
});

const showDetailModal = ref(false);
const selectedDate = ref(null);
const newEventText = ref('');
const events = ref({});
const moods = ref({});
const currentMood = ref({ scale: null, category: '', description: '' });
const currentDayEvents = computed(() => {
    const dateKey = selectedDate.value?.format('YYYY-MM-DD');
    return dateKey && events.value[dateKey] ? events.value[dateKey] : [];
});
const isFutureSelectedDate = computed(() => selectedDate.value?.isAfter(dayjs(), 'day'));
const isPastSelectedDate = computed(() => selectedDate.value?.isBefore(dayjs(), 'day'));
const canModifyExistingPastEvents = ref(true);

const backgroundImagePath = ref('');
const calendarOverlayOpacity = ref(0.55);
const currentBgImageName = ref('');
const showSettingsModal = ref(false);
const calendarComputedStyle = computed(() => ({
  '--calendar-overlay-alpha': calendarOverlayOpacity.value,
  backgroundImage: backgroundImagePath.value ? `url('${backgroundImagePath.value}')` : 'none'
}));

const showChatModal = ref(false);
const chatInput = ref('');
const chatHistory = ref([]);
const isChatLoading = ref(false);
let chatOpenAI = null;
const chatInitializationError = ref('');

const showEmotionReportView = ref(false);

function loadPersistentData() {
  const bgPath = DataService.getBackground();
  backgroundImagePath.value = bgPath || '';
  currentBgImageName.value = bgPath ? (bgPath.startsWith('data:image') ? '自定义图片' : bgPath.substring(bgPath.lastIndexOf('/') + 1)) : '';
  calendarOverlayOpacity.value = DataService.getCalendarOverlayOpacity();
  moods.value = DataService.getMoods() || {};
  events.value = DataService.getEvents() || {};
}

const initializeChatOpenAI = () => {
  chatInitializationError.value = '';
  const apiKey = DataService.getAiApiKey() || import.meta.env.VITE_OPENAI_API_KEY;
  if (apiKey) {
    try {
      chatOpenAI = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        dangerouslyAllowBrowser: true,
      });
    } catch (error) {
      chatOpenAI = null;
      chatInitializationError.value = `AI对话服务初始化失败: ${error.message || '未知错误'}. 请检查API Key。`;
    }
  } else {
    chatOpenAI = null;
    chatInitializationError.value = "AI API Key 未配置。对话功能不可用。";
  }
};

const handleApiKeyUpdate = () => {
  if (showChatModal.value) {
    initializeChatOpenAI();
  }
};

onMounted(() => { loadPersistentData(); });
watch(moods, (newMoods) => DataService.saveMoods(newMoods), { deep: true });
watch(events, (newEvents) => DataService.saveEvents(newEvents), { deep: true });
watch(calendarOverlayOpacity, (newOpacity) => DataService.saveCalendarOverlayOpacity(newOpacity));

const updateCalendarOpacity = (newOpacity) => { calendarOverlayOpacity.value = newOpacity; };
const handleBackgroundSelected = (file) => {
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      backgroundImagePath.value = e.target.result;
      DataService.saveBackground(e.target.result);
      currentBgImageName.value = file.name;
    };
    reader.readAsDataURL(file);
  }
};
const openDetail = (date) => { // 移除 $event 参数，如果您不打算使用它来定位弹窗
  selectedDate.value = date;
  newEventText.value = '';
  const dateKey = date.format('YYYY-MM-DD');
  currentMood.value = { ...(moods.value[dateKey] || { scale: null, category: '', description: '' }) };
  showDetailModal.value = true;
  // 如果您的弹窗定位逻辑已修复并依赖于 $event，请保留它
  // 否则，您当前的弹窗是居中模式，不需要 event 对象
};
const closeDetailModal = () => {
    showDetailModal.value = false;
    selectedDate.value = null;
};
const addEvent = () => {
  if (!selectedDate.value || newEventText.value.trim() === '') return;
  const dateKey = selectedDate.value.format('YYYY-MM-DD');
  if (!events.value[dateKey]) {
    events.value[dateKey] = [];
  }
  events.value[dateKey].push({ text: newEventText.value.trim() });
  newEventText.value = '';
};
const removeEvent = (index) => {
  if (!selectedDate.value) return;
  const dateKey = selectedDate.value.format('YYYY-MM-DD');
  if (events.value[dateKey] && events.value[dateKey][index] !== undefined) {
    events.value[dateKey].splice(index, 1);
    if (events.value[dateKey].length === 0) {
        delete events.value[dateKey];
    }
  }
};
const saveMood = () => {
  if (!selectedDate.value || isFutureSelectedDate.value) return;
  const dateKey = selectedDate.value.format('YYYY-MM-DD');
  if (currentMood.value.category) {
    moods.value[dateKey] = { ...currentMood.value };
  } else {
    delete moods.value[dateKey];
  }
  closeDetailModal();
};
const moodEmoji = (mood) => {
  if (!mood || !mood.category) return '';
  const emojis = { '喜悦': '😊', '骄傲': '😎', '难过': '😢', '生气': '😠', '害怕': '😨' };
  return emojis[mood.category] || '😐';
};
const prevMonth = () => { currentDate.value = currentDate.value.subtract(1, 'month'); };
const nextMonth = () => { currentDate.value = currentDate.value.add(1, 'month'); };
const openChat = () => {
  initializeChatOpenAI();
  showChatModal.value = true;
};
const closeChat = () => { showChatModal.value = false; };
const sendMessage = async () => {
  if (!chatInput.value.trim() || isChatLoading.value || !chatOpenAI) {
    if (!chatOpenAI && !chatInitializationError.value) {
        chatInitializationError.value = "AI 对话服务未就绪。";
    }
    return;
  }
  const userMessage = { role: 'user', content: chatInput.value.trim() };
  chatHistory.value.push(userMessage);
  chatInput.value = '';
  isChatLoading.value = true;
  try {
    const messagesForAPI = [
        { role: "system", content: "你是一个乐于助人的日历应用AI助手。" },
        ...chatHistory.value.slice(-5)
    ];
    const completion = await chatOpenAI.chat.completions.create({
      model: "qwen-plus",
      messages: messagesForAPI,
    });
    const assistantMessageContent = completion.choices[0]?.message?.content || '抱歉，我暂时无法回复。';
    chatHistory.value.push({ role: 'assistant', content: assistantMessageContent });
  } catch (error) {
    const errorText = error.response?.data?.error?.message || error.message || '未知错误';
    chatHistory.value.push({ role: 'assistant', content: `对话连接失败: ${errorText}` });
  } finally {
    isChatLoading.value = false;
  }
};
const toggleEmotionReportDisplay = () => {
  showEmotionReportView.value = !showEmotionReportView.value;
};

</script>

<style scoped>
/* --- 严格参照您提供的截图和“之前版本”的日历主体排版 --- */
.calendar-view-wrapper {
  width: 100%;
}

.md3-calendar {
  border-radius: 16px;
  color: var(--md-on-surface);
  overflow: hidden; /* 确保背景遮罩不会溢出 */
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.08);
  /* max-width: 800px; /* 由 App.vue 的 .main-panel 控制 */
  /* margin: 0 auto; /* 由 App.vue 的 .main-panel 控制 */
  background-size: cover;
  background-position: center;
  position: relative; /* 用于 ::before 绝对定位 */
  background-color: var(--md-surface, #FFFFFF); /* 确保有背景色 */
}

.md3-calendar::before { /* 背景图片遮罩 */
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(255, 255, 255, var(--calendar-overlay-alpha, 0.75)); /* 稍微调高默认不透明度以确保文字可读性 */
  z-index: 0;
  border-radius: inherit; /* 确保遮罩也应用圆角 */
}

.md3-calendar-header,
.md3-calendar-weekdays,
.md3-calendar-days {
  position: relative; /* 确保在遮罩之上 */
  z-index: 1;
  background-color: transparent; /* 让它们透明以显示日历背景 */
}

.md3-calendar-header {
  display: flex;
  align-items: center;
  padding: 12px 8px; /* 根据截图调整，更紧凑些 */
  border-bottom: 1px solid var(--md-outline-variant, rgba(0,0,0,0.1)); /* 细分隔线 */
}

.month-year-display {
  flex-grow: 1;
  text-align: center;
  font-size: 1.1rem; /* 约 17-18px */
  font-weight: 500;
  margin: 0 4px; /* 减小与箭头按钮的间距 */
  color: var(--md-on-surface);
}

.calendar-actions {
  display: flex;
  align-items: center;
  gap: 0; /* 按钮紧凑排列 */
}

.md3-icon-button {
  background: transparent; border: none; border-radius: 50%;
  width: 36px; height: 36px; /* 头部图标按钮尺寸 */
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background-color 0.2s;
  color: var(--md-on-surface-variant); padding:0;
}
.md3-icon-button .md3-icon { font-size: 20px; } /* 头部图标大小 */
.md3-icon-button:hover { background-color: rgba(0,0,0,0.06); }


.md3-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 6px 0; /* 上下内边距 */
  font-weight: 400; /* 星期文字不加粗 */
  text-align: center;
  font-size: 0.75rem; /* 12px，较小的星期文字 */
  color: var(--md-on-surface-variant);
  border-bottom: 1px solid var(--md-outline-variant, rgba(0,0,0,0.08)); /* 细分隔线 */
}
.md3-calendar-weekday {
  padding: 4px 0;
}

.md3-calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  /* 网格线由单元格边框创建 */
}

.md3-calendar-day {
  aspect-ratio: 1 / 1; /* 保持单元格为正方形，这是排版整齐的关键 */
  padding: 4px;        /* 单元格内边距 */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /* justify-content: space-between; /* 之前版本是这个，现在让内容从上往下排列 */
  justify-content: flex-start; /* 内容从顶部开始 */
  align-items: flex-start;     /* 内容向左对齐 */
  position: relative;
  cursor: pointer;
  transition: background-color 0.15s ease-out;
  border-right: 1px solid var(--md-outline-variant, rgba(0,0,0,0.08));
  border-bottom: 1px solid var(--md-outline-variant, rgba(0,0,0,0.08));
  overflow: hidden; /* 防止内容溢出 */
}
/* 移除最后一列的右边框 */
.md3-calendar-day:nth-child(7n) {
  border-right: none;
}
/* （可选）移除最后一行单元格的底边框，如果 .md3-calendar 有底部边框的话 */
/* .md3-calendar-day:nth-last-child(-n+7) { border-bottom: none; } */


.md3-calendar-day:hover {
  background-color: rgba(var(--md-primary-rgb, 26, 115, 232), 0.08); /* 使用您定义的主色调的透明色 */
}
.md3-calendar-day-inactive {
  color: var(--md-on-surface-variant);
  opacity: 0.5; /* 非本月日期更暗 */
  background-color: transparent; /* 非本月日期通常没有特别的背景 */
}
.md3-calendar-day-inactive .md3-calendar-date {
  color: var(--md-on-surface-variant) !important; /* 确保覆盖其他颜色 */
  opacity: 0.7;
}
.md3-calendar-day-inactive:hover {
  background-color: rgba(0,0,0,0.03); /* 非本月日期 hover 效果更淡 */
}

.md3-calendar-date {
  font-size: 0.8125rem; /* 13px */
  font-weight: 400; /* 日期数字不加粗，或用 500 */
  line-height: 1.2;
  padding: 2px;      /* 日期数字周围的微小间距 */
  color: var(--md-on-surface);
  align-self: flex-start; /* 确保在左上角 */
  margin-bottom: 2px; /* 与事件列表的间距 */
}

.md3-mood-indicator {
  position: absolute;
  top: 3px;   /* 根据内边距微调 */
  right: 3px;
  font-size: 0.9rem; /* 约 14-15px */
  line-height: 1;
  z-index: 1; /* 确保在事件之上，如果事件列表有背景的话 */
}

.md3-event-list {
  width: 100%;
  font-size: 0.625rem; /* 10px，非常小以容纳更多事件 */
  line-height: 1.2;
  flex-grow: 1; /* 占据日期数字下方的剩余空间 */
  overflow-y: auto; /* 如果事件多，允许滚动 */
  padding-top: 1px;
  scrollbar-width: thin;
  scrollbar-color: var(--md-outline, #ccc) transparent;
}
.md3-event-list::-webkit-scrollbar { width: 3px; }
.md3-event-list::-webkit-scrollbar-track { background: transparent; }
.md3-event-list::-webkit-scrollbar-thumb {
  background-color: var(--md-outline, #ccc);
  border-radius: 3px;
}

.md3-event-chip {
  background-color: var(--md-tertiary-container, rgba(232, 113, 10, 0.1)); /* 使用变量并提供备用 */
  color: var(--md-on-tertiary-container, #5C2C00);
  padding: 1px 4px; /* 紧凑的内边距 */
  border-radius: 4px;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 100%; /* 确保不超过单元格宽度 */
  box-sizing: border-box;
}

/* 情绪报告容器和头部样式 (保持与之前一致或按需调整) */
.emotion-report-container {
  width: 100%;
  margin-top: 24px;
}
.emotion-report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--md-outline, #e0e0e0);
    background-color: var(--md-surface-variant);
    border-radius: 12px 12px 0 0;
}
.emotion-report-header .md3-title-large {
    margin: 0;
    color: var(--md-primary);
    font-size: 1.25rem;
    flex-grow: 1;
    text-align: left;
}
.emotion-report-header .md3-icon-button { color: var(--md-primary); }

/* 弹窗样式 (您提到这部分已修复，所以使用您提供的版本中的样式) */
/* 确保您的 .md3-modal, .md3-modal-content 等样式是您满意的版本 */
.md3-modal {
  position: fixed; inset: 0; background-color: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}
.md3-modal-content {
  background-color: var(--md-surface, #fff); color: var(--md-on-surface, #000);
  border-radius: 28px; width: 100%; max-width: 500px; max-height: 90vh;
  display: flex; flex-direction: column; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  overflow: hidden;
}
/* ... (其余弹窗、表单、聊天等样式，请确保从您满意的版本复制过来) ... */
.md3-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--md-outline, #ccc);
}
.md3-modal-header .md3-headline-small { margin: 0; flex-grow: 1; }
.md3-modal-body { padding: 20px 24px; flex-grow: 1; overflow-y: auto; }
.md3-modal-actions {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--md-outline, #ccc);
}
/* 表单字段等 */
.md3-form-field { margin-bottom: 16px; display: flex; flex-direction: column; }
.md3-form-section { margin-top: 24px; }
.md3-label, .md3-label-large { display: block; color: var(--md-on-surface-variant); font-size: 14px; margin-bottom: 8px; }
.md3-label-large { font-size: 16px; font-weight: 500; color: var(--md-on-surface); }
.md3-select, .md3-text-field, .md3-text-area {
  width: 100%; box-sizing: border-box;
  padding: 12px 16px; border: 1px solid var(--md-outline); border-radius: 8px;
  background-color: var(--md-surface-variant); color: var(--md-on-surface-variant);
  font-family: 'Roboto', sans-serif; font-size: 16px;
}
.md3-select {
    padding-right: 36px;
    appearance: none; -webkit-appearance: none; -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24' fill='%235F6368'%3E%3Cpath d='M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; background-size: 20px;
}
.md3-select:disabled { /* 添加了 disabled 状态的样式 */
  background-color: color-mix(in srgb, var(--md-surface-variant) 50%, var(--md-on-surface-variant) 10%);
  color: color-mix(in srgb, var(--md-on-surface-variant) 50%, var(--md-surface-variant));
  cursor: not-allowed;
  border-color: color-mix(in srgb, var(--md-outline) 70%, var(--md-surface-variant));
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 -960 960 960' width='24' fill='%23BDC1C6'%3E%3Cpath d='M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z'/%3E%3C/svg%3E");
}
.md3-select:focus, .md3-text-field:focus, .md3-text-area:focus {
  border-color: var(--md-primary); background-color: var(--md-surface);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary) 20%, transparent); outline: none;
}
.md3-text-area { resize: vertical; min-height: 80px; }
.md3-event-list-container { margin-bottom: 16px; }
.md3-event-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid var(--md-outline-variant); gap: 8px;
}
.md3-event-item span:first-child { flex-grow: 1; word-break: break-word; }
.md3-event-add { display: flex; flex-direction: column; gap: 8px; }
.md3-button-text { background-color: transparent; color: var(--md-primary); box-shadow: none; }
.md3-button-text:hover:not(:disabled) { background-color: rgba(var(--md-primary-rgb, 26, 115, 232), 0.08); }
.md3-icon-button-small { width: 32px; height: 32px; }
.md3-icon-button-small .md3-icon { font-size: 18px; }

/* 对话弹窗特定样式 */
.chat-modal-content { height: 70vh; max-height: 600px; display: flex; flex-direction: column; }
.chat-error { margin: 0 24px 10px; padding: 10px; background-color: var(--md-error-container); border-radius: 8px;}
.chat-error p { color: var(--md-on-error-container); margin: 0;}
.chat-history-body { flex-grow: 1; overflow-y: auto; padding: 16px 24px; }
.chat-message { padding: 8px 12px; border-radius: 16px; margin-bottom: 8px; max-width: 80%; word-break: break-word; line-height: 1.4; }
.user-message { background-color: var(--md-primary-container); color: var(--md-on-primary-container); margin-left: auto; border-bottom-right-radius: 4px; }
.assistant-message { background-color: var(--md-surface-variant); color: var(--md-on-surface-variant); margin-right: auto; border-bottom-left-radius: 4px; }
.chat-input-actions { display: flex; align-items: flex-end; padding: 16px 24px; border-top: 1px solid var(--md-outline); }
.chat-input-wrapper { flex-grow: 1; margin-right: 8px; }
.chat-input-actions .md3-text-area { width: 100%; min-height: 40px; max-height: 120px; resize: none; border-radius: 20px; padding: 10px 16px; }
.chat-input-actions .send-button { flex-shrink: 0; }
.chat-loading-indicator { text-align: center; padding: 10px; color: var(--md-on-surface-variant); font-style: italic; }

/* 通用按钮样式，如果全局未定义 */
.md3-button {
  background-color: var(--md-primary); color: var(--md-on-primary);
  border: none; padding: 10px 24px; border-radius: 20px;
  font-weight: 500; text-transform: none; cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;
  font-family: 'Roboto', sans-serif; letter-spacing: 0.1px;
  display: inline-flex; align-items: center; gap: 8px;
}
.md3-button:hover:not(:disabled) {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  background-color: color-mix(in srgb, var(--md-primary) 90%, black);
}
.md3-button:disabled { /* 添加 disabled 状态 */
  background-color: rgba(0,0,0,0.12);
  color: rgba(0,0,0,0.38);
  box-shadow: none;
  cursor: not-allowed;
}
</style>