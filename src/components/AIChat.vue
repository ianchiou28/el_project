<template>
  <div class="ai-chat-module">
    <h3 class="chat-module-title md3-title-small">对话小蓝鲸</h3>

    <div v-if="chatInitializationError" class="chat-error-container">
      <p class="md3-body-medium">{{ chatInitializationError }}</p>
      <button @click="initializeChatOpenAI(true)" class="md3-button md3-button-text retry-button">
        <span class="md3-icon">refresh</span> 重试连接
      </button>
    </div>

    <div class="chat-history-body" ref="chatHistoryBodyRef">
      <div v-for="(message, index) in chatHistory" :key="index"
        :class="['chat-message-row', message.role === 'user' ? 'user-row' : 'assistant-row']">
        <div :class="['chat-message', message.role === 'user' ? 'user-message' : 'assistant-message']">
          <div class="message-sender"><strong>{{ message.role === 'user' ? '你' : '小蓝鲸' }}:</strong></div>
          <div class="message-content" v-html="simpleFormatContent(message.content)"></div>
        </div>
      </div>
      <div v-if="isChatLoading" class="chat-loading-indicator">
        <p>AI 思考中...</p>
      </div>
    </div>

    <div class="chat-input-actions">
      <div class="chat-input-wrapper">
        <textarea ref="textareaRef" v-model="chatInput" @input="autoGrowTextarea"
          @keydown.enter.prevent="handleEnterKey" class="md3-text-area" placeholder="输入你的问题..."
          :disabled="isChatLoading || !!chatInitializationError"></textarea>
      </div>
      <md-button @click="sendMessage" :disabled="isChatLoading || !chatInput.trim() || !!chatInitializationError"
        class="md3-button send-button" aria-label="发送消息">
        <span class="md3-icon">send</span>
      </md-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onUnmounted } from 'vue';
import OpenAI from 'openai'; 
import { DataService } from '../services/dataService.js';
import '@material/web/common.js';
const chatInput = ref('');
const chatHistory = ref([]);
const isChatLoading = ref(false);
let chatOpenAI = null;
const chatInitializationError = ref('');
const chatHistoryBodyRef = ref(null);
const textareaRef = ref(null);

const simpleFormatContent = (content) => {
  if (typeof content !== 'string') {
    return '';
  }
  return content.replace(/\n/g, '<br>');
};

const initializeChatOpenAI = (isRetry = false) => {
  if (!isRetry && chatOpenAI) return;
  chatInitializationError.value = '';
  const apiKey = DataService.getAiApiKey() || import.meta.env.VITE_OPENAI_API_KEY;
  if (apiKey) {
    try {
      chatOpenAI = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        dangerouslyAllowBrowser: true,
      });
      if (isRetry) {
        chatHistory.value.push({ role: 'assistant', content: '已尝试重新连接 AI 服务。' });
      }
    } catch (error) {
      chatOpenAI = null;
      chatInitializationError.value = `AI服务初始化失败: ${error.message || '未知错误'}. 请检查API Key或网络。`;
    }
  } else {
    chatOpenAI = null;
    chatInitializationError.value = "AI API Key 未配置。请在设置中配置后重试。";
  }
};

const sendMessage = async () => {
  const trimmedInput = chatInput.value.trim();
  if (!trimmedInput || isChatLoading.value) return;

  if (!chatOpenAI) {
    initializeChatOpenAI(true);
    if (!chatOpenAI) {
      chatHistory.value.push({ role: 'assistant', content: 'AI 服务未连接，无法发送。请检查配置并重试。' });
      return;
    }
  }

  const userMessage = { role: 'user', content: trimmedInput };
  chatHistory.value.push(userMessage);
  chatInput.value = '';
  isChatLoading.value = true;

  // 发送消息后，立即重置文本输入框高度
  await nextTick();
  if (textareaRef.value) {
    autoGrowTextarea(textareaRef.value); // 直接传递元素
  }

  try {
    // 添加近一个月心情日记至 system 指令
    const moods = DataService.getMoods();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const recentEntries = Object.entries(moods)
      .filter(([date]) => new Date(date) >= oneMonthAgo)
      .sort(([d1], [d2]) => new Date(d1) - new Date(d2));
    let moodDiaryText = "以下是近一个月的心情日记：\n";
    if (recentEntries.length === 0) {
      moodDiaryText += "暂无记录。";
    } else {
      recentEntries.forEach(([date, mood]) => {
        // 使用 description 字段作为日记内容输出
        const entryText = mood.description || '无内容';
        moodDiaryText += `${date}: ${entryText}\n`;
      });
    }
    const systemContent = `你是一个乐于助人的日历应用AI助手，叫做小蓝鲸。\n${moodDiaryText}`;

    const messagesForAPI = [
      { role: "system", content: systemContent },
      // 从 chatHistory 末尾取最多5条用户和助手的消息，加上当前用户消息，构成上下文
      ...chatHistory.value.slice(0, -1).slice(-5).map(msg => ({ role: msg.role, content: msg.content })),
      userMessage // 确保当前用户消息是最后一条
    ];

    const completion = await chatOpenAI.chat.completions.create({
      model: "qwen-plus", // 确保这是你期望使用的模型
      messages: messagesForAPI,
    });
    const assistantMessageContent = completion.choices[0]?.message?.content || '抱歉，我暂时无法回复。';
    chatHistory.value.push({ role: 'assistant', content: assistantMessageContent });
  } catch (error) {
    let errorText = '对话发生错误。';
    if (error.response) {
      errorText = `错误 ${error.response.status}: ${error.response.data?.error?.message || error.message}`;
    } else {
      errorText = `连接失败: ${error.message || '未知网络错误'}`;
    }
    chatHistory.value.push({ role: 'assistant', content: errorText });
  } finally {
    isChatLoading.value = false;
  }
};

const handleEnterKey = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const autoGrowTextarea = (eventOrTextarea) => {
  const textarea = eventOrTextarea.target ? eventOrTextarea.target : eventOrTextarea;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`; 
  }
};

watch(chatHistory, async () => {
  await nextTick();
  if (chatHistoryBodyRef.value) {
    chatHistoryBodyRef.value.scrollTop = chatHistoryBodyRef.value.scrollHeight;
  }
}, { deep: true });

const handleDataServiceChange = () => {
  chatInitializationError.value = '';
  chatOpenAI = null;
  initializeChatOpenAI();
};

onMounted(() => {
  initializeChatOpenAI();
  if (textareaRef.value) {
    autoGrowTextarea(textareaRef.value);
  }
  window.addEventListener('dataServiceChange', handleDataServiceChange);
});

onUnmounted(() => {
  window.removeEventListener('dataServiceChange', handleDataServiceChange);
});
</script>

<style scoped>
:root {
  --ai-chat-md-error-container-fallback: #fdecea;
  --ai-chat-md-on-error-container-fallback: #a82823;
  --ai-chat-md-primary-fallback: #1A73E8;
  --ai-chat-md-on-primary-fallback: #FFFFFF;
  --ai-chat-md-surface-variant-fallback: #e9ecef;
  --ai-chat-md-on-surface-variant-fallback: #495057;
}

.ai-chat-module {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.chat-module-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--md-on-surface-variant, var(--ai-chat-md-on-surface-variant-fallback));
  padding-bottom: 10px;
  margin: 0 0 10px 0;
  border-bottom: 1px solid var(--md-outline-variant, #dee2e6);
  flex-shrink: 0;
}

.chat-error-container {
  margin: 0 0 10px 0;
  padding: 10px;
  background-color: var(--md-error-container, var(--ai-chat-md-error-container-fallback));
  border-radius: 8px;
  color: var(--md-on-error-container, var(--ai-chat-md-on-error-container-fallback));
  flex-shrink: 0;
}

.chat-error-container p {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
}

.retry-button {
  padding: 4px 8px;
  font-size: 0.8rem;
  min-height: auto;
  height: auto;
}

.retry-button .md3-icon {
  font-size: 16px;
  margin-right: 4px;
}

.chat-history-body {
  flex-grow: 1;
  overflow-y: auto;
  padding: 5px 10px 10px 10px;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: var(--md-outline, #ccc) transparent;
}

.chat-history-body::-webkit-scrollbar {
  width: 6px;
}

.chat-history-body::-webkit-scrollbar-track {
  background: transparent;
}

.chat-history-body::-webkit-scrollbar-thumb {
  background-color: var(--md-outline, #ccc);
  border-radius: 3px;
}

.chat-message-row {
  display: flex;
  margin-bottom: 12px;
}

.user-row {
  justify-content: flex-end;
}

.assistant-row {
  justify-content: flex-start;
}

.chat-message {
  padding: 10px 15px;
  border-radius: 18px;
  max-width: 85%;
  word-break: break-word;
  font-size: 0.875rem;
  box-shadow: 0 1px 2.5px rgba(0, 0, 0, 0.1);
  line-height: 1.45;
}

.message-sender {
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
  font-size: 0.75rem;
  opacity: 0.85;
  line-height: 1;
}

.message-content :deep(p:first-child) {
  margin-top: 0;
}

.message-content :deep(p:last-child) {
  margin-bottom: 0;
}


.user-message {
  background-color: var(--md-primary, var(--ai-chat-md-primary-fallback));
  color: var(--md-on-primary, var(--ai-chat-md-on-primary-fallback));
  border-bottom-right-radius: 6px;
}

.user-message .message-sender {
  color: rgba(255, 255, 255, 0.85);
}

.assistant-message {
  background-color: var(--md-surface-variant, var(--ai-chat-md-surface-variant-fallback));
  color: var(--md-on-surface-variant, var(--ai-chat-md-on-surface-variant-fallback));
  border-bottom-left-radius: 6px;
}

.assistant-message .message-sender {
  color: var(--md-on-surface-variant, var(--ai-chat-md-on-surface-variant-fallback));
  opacity: 0.75;
}

.chat-loading-indicator {
  text-align: center;
  padding: 10px 0;
  color: var(--md-on-surface-variant, var(--ai-chat-md-on-surface-variant-fallback));
  font-style: italic;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.chat-input-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 0 0 0;
  border-top: 1px solid var(--md-outline-variant, #dee2e6);
  flex-shrink: 0;
  background-color: var(--md-surface, #fff);
}

.chat-input-wrapper {
  margin-left: 8px;
  margin-right: 8px;
  width: 100%;
}

.md3-text-area {
  width: 100%;
  max-height: 100px;
  resize: none;
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 0.9rem;
  box-sizing: border-box;
  border: 1px solid var(--md-outline, #ced4da);
  background-color: var(--md-surface, #fff);
  font-family: inherit;
  line-height: normal;
  overflow-y: auto;
}

.md3-text-area:focus {
  border-color: var(--md-primary, var(--ai-chat-md-primary-fallback));
  box-shadow: 0 0 0 1px var(--md-primary, var(--ai-chat-md-primary-fallback));
  outline: none;
}

.md3-text-area:disabled {
  background-color: var(--md-surface-variant, var(--ai-chat-md-surface-variant-fallback));
  opacity: 0.7;
}

.send-button {
  flex-shrink: 0;
  height: 40px;
  width: 40px;
  padding: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--md-primary, var(--ai-chat-md-primary-fallback));
  color: var(--md-on-primary, var(--ai-chat-md-on-primary-fallback));
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 8px;
}

.send-button:disabled {
  background-color: rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.38);
  cursor: not-allowed;
}

.send-button .md3-icon {
  font-size: 20px;
}

.md3-button-text {
  background-color: transparent;
  color: var(--md-primary, #1A73E8);
  box-shadow: none;
}

.md3-button-text:hover:not(:disabled) {
  background-color: rgba(var(--md-primary-rgb, 26, 115, 232), 0.08);
}

.md3-title-small {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
  letter-spacing: 0.00625rem;
}

.md3-body-medium {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  letter-spacing: 0.015625rem;
}

.chat-input-wrapper textarea {
  min-height: 80px;
}
</style>