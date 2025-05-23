<template>
  <div class="quote-display-wrapper">
    <div class="widget-content">
      <div v-if="currentQuote" class="quote-card">
        <p class="quote-text">"{{ currentQuote.text }}"</p>
        <p v-if="currentQuote.author" class="quote-author">- {{ currentQuote.author }}</p>
        <p v-if="currentQuote.category" class="quote-category">分类: {{ currentQuote.category }}</p>

        <div class="actions">
          <button @click="toggleFavorite(currentQuote)" class="md3-button action-button">
            <span class="md3-icon material-symbols-outlined">{{ isFavorite(currentQuote.id) ? 'favorite' : 'favorite_border' }}</span>
            收藏
          </button>
          <button @click="shareQuote(currentQuote)" class="md3-button action-button">
            <span class="md3-icon material-symbols-outlined">share</span>
            分享
          </button>
          <button @click="getNextQuote" class="md3-button action-button">下一条</button>
        </div>
      </div>
      <div v-else class="loading-message">
        <p>正在加载语录...</p>
      </div>

      <div class="category-filter" v-if="categories.length > 0">
        <label for="quote-category-select" class="category-label">分类:</label>
        <select id="quote-category-select" v-model="selectedCategory" @change="filterQuotesByCategory" class="md3-select">
          <option value="">所有分类</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <button v-if="favoriteQuotes.length > 0 && !showFavorites" @click="showFavorites = true" class="md3-button view-favorites-button">
        查看收藏 ({{ favoriteQuotes.length }})
      </button>

      <div v-if="showFavorites" class="favorites-list-modal" @click.self="showFavorites = false">
        <div class="favorites-list-content md3-surface-container">
            <div class="favorites-list-header">
                <h3 class="md3-headline-small">我的收藏</h3>
                <button @click="showFavorites = false" class="md3-icon-button">
                    <span class="md3-icon material-symbols-outlined">close</span>
                </button>
            </div>
            <ul v-if="favoriteQuotes.length > 0" class="favorites-ul">
                <li v-for="favQuote in favoriteQuotes" :key="favQuote.id" class="favorite-item">
                    <div class="favorite-text-content">
                        <p class="quote-text-fav">"{{ favQuote.text }}"</p>
                        <p v-if="favQuote.author" class="quote-author-fav">- {{ favQuote.author }} ({{ favQuote.category }})</p>
                    </div>
                    <button @click="toggleFavorite(favQuote)" class="md3-button md3-button-text remove-fav-button">
                        <span class="md3-icon material-symbols-outlined" style="font-size: 16px;">delete_sweep</span>
                        移除
                    </button>
                </li>
            </ul>
            <p v-else class="no-favorites-message">您还没有收藏任何语录。</p>
        </div>
    </div>
    </div>
  </div>
</template>

<script setup>
// Script 部分与您之前提供的版本保持一致，确保导入路径正确
import { ref, onMounted, computed, watch } from 'vue';
import { quotes as allQuotesData } from '../quotes/quotes.js'; // 路径示例

const allQuotes = ref([]);
const currentQuote = ref(null);
const favoriteQuoteIds = ref(new Set());
const categories = ref([]);
const selectedCategory = ref('');
const showFavorites = ref(false);

async function fetchQuotes() {
  allQuotes.value = allQuotesData;
  if (!allQuotes.value || allQuotes.value.length === 0) {
    currentQuote.value = { id: -1, text: "语录库准备中...", author: "系统", category: "提示" };
    return;
  }
  const uniqueCategories = new Set(allQuotes.value.map(q => q.category).filter(Boolean));
  categories.value = Array.from(uniqueCategories);
  loadFavorites();
  setDailyQuote();
}

function setDailyQuote() {
  if (!allQuotes.value || allQuotes.value.length === 0) {
    currentQuote.value = { id: -1, text: "暂无语录。", author: "系统", category: "提示" };
    return;
  }
  const today = new Date().toDateString();
  const lastQuoteDate = localStorage.getItem('lastQuoteDate');
  let quoteToShow;
  const lastQuoteIdStr = localStorage.getItem('dailyQuoteId');

  if (lastQuoteDate === today && lastQuoteIdStr) {
    const lastQuoteId = parseInt(lastQuoteIdStr);
    quoteToShow = allQuotes.value.find(q => q.id === lastQuoteId);
  }

  if (!quoteToShow) {
    quoteToShow = getRandomQuote();
    if (quoteToShow && quoteToShow.id != null) {
        localStorage.setItem('dailyQuoteId', quoteToShow.id.toString());
        localStorage.setItem('lastQuoteDate', today);
    } else if (allQuotes.value.length > 0) {
        quoteToShow = allQuotes.value[0];
        if(quoteToShow && quoteToShow.id != null) {
            localStorage.setItem('dailyQuoteId', quoteToShow.id.toString());
            localStorage.setItem('lastQuoteDate', today);
        }
    }
  }
  currentQuote.value = quoteToShow || { id: -1, text: "未能加载语录。", author: "系统", category: "错误" };
}

function getRandomQuote(quotesArray = allQuotes.value) {
  if (!quotesArray || quotesArray.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * quotesArray.length);
  return quotesArray[randomIndex];
}

function getNextQuote() {
  if (!allQuotes.value || allQuotes.value.length === 0) return;
  let newQuote;
  const sourceArray = selectedCategory.value ? filteredQuotes.value : allQuotes.value;

  if (!sourceArray || sourceArray.length === 0) {
      currentQuote.value = getRandomQuote(allQuotes.value) || { id: -1, text: "当前分类无语录。", author: "系统", category: "提示" };
      return;
  }
  if (sourceArray.length === 1 && currentQuote.value && sourceArray[0]?.id === currentQuote.value.id) return;

  let attempts = 0;
  const maxAttempts = sourceArray.length * 2 + 1;
  do {
    newQuote = getRandomQuote(sourceArray);
    attempts++;
  } while (newQuote && currentQuote.value && newQuote.id === currentQuote.value.id && sourceArray.length > 1 && attempts < maxAttempts);

  if (newQuote && currentQuote.value && newQuote.id === currentQuote.value.id && sourceArray.length > 1) {
     const otherQuotes = sourceArray.filter(q => q.id !== currentQuote.value.id);
     if (otherQuotes.length > 0) newQuote = getRandomQuote(otherQuotes);
  }
  currentQuote.value = newQuote || (sourceArray.length > 0 ? sourceArray[0] : null);
}

const filteredQuotes = computed(() => {
  if (!allQuotes.value) return [];
  if (!selectedCategory.value) return allQuotes.value;
  return allQuotes.value.filter(q => q.category === selectedCategory.value);
});

function filterQuotesByCategory() {
  const quotesInSelectedCategory = filteredQuotes.value;
  if (quotesInSelectedCategory && quotesInSelectedCategory.length > 0) {
      currentQuote.value = getRandomQuote(quotesInSelectedCategory);
  } else if (allQuotes.value && allQuotes.value.length > 0) {
      currentQuote.value = getRandomQuote(allQuotes.value);
  } else {
      currentQuote.value = { id: -1, text: "暂无语录。", author: "系统", category: "提示" };
  }
}

function loadFavorites() {
  try {
    const storedFavorites = localStorage.getItem('favoriteQuotes');
    if (storedFavorites) {
      const parsedFavorites = JSON.parse(storedFavorites);
      if (Array.isArray(parsedFavorites)) {
          favoriteQuoteIds.value = new Set(parsedFavorites);
      } else {
          favoriteQuoteIds.value = new Set();
      }
    }
  } catch (e) {
      favoriteQuoteIds.value = new Set();
  }
}
function saveFavorites() {
  localStorage.setItem('favoriteQuotes', JSON.stringify(Array.from(favoriteQuoteIds.value)));
}
function isFavorite(quoteId) {
  if (quoteId == null) return false;
  return favoriteQuoteIds.value.has(quoteId);
}
function toggleFavorite(quote) {
  if (!quote || quote.id == null) return;
  if (favoriteQuoteIds.value.has(quote.id)) {
    favoriteQuoteIds.value.delete(quote.id);
  } else {
    favoriteQuoteIds.value.add(quote.id);
  }
  saveFavorites();
}
const favoriteQuotes = computed(() => {
  if (!allQuotes.value || allQuotes.value.length === 0) return [];
  return allQuotes.value.filter(q => q.id != null && favoriteQuoteIds.value.has(q.id));
});

async function shareQuote(quote) {
  if (!quote || !quote.text) {
    alert('没有可分享的语录内容。');
    return;
  }
  const shareData = {
    title: '每日一句精选',
    text: `"${quote.text}"${quote.author ? ' - ' + quote.author : ''}\n(来自心情日记APP)`,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      console.log('语录分享成功！');
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareData.text);
      alert('语录已复制到剪贴板！');
    } else {
      const manualCopyText = `${shareData.title}\n${shareData.text}`;
      prompt("您的浏览器不支持自动分享或复制。请手动复制以下内容：", manualCopyText);
    }
  } catch (err) {
    console.error('分享或复制操作失败:', err);
    const manualCopyText = `${shareData.title}\n${shareData.text}`;
    prompt(`分享操作失败 (${err.name || 'UnknownError'})。请手动复制以下内容：`, manualCopyText);
  }
}

onMounted(() => { fetchQuotes(); });
watch(selectedCategory, (newCategory, oldCategory) => {
    if (newCategory !== oldCategory) {
        filterQuotesByCategory();
    }
});
</script>

<style scoped>
/* Material Symbols Outlined - 确保已在 App.vue 或全局导入 */

.quote-display-wrapper {
  width: 100%;
}
.widget-content {
  font-size: 0.875rem; /* 14px 基础字号，保持适中 */
  /* 外层 .sidebar-module-wrapper (App.vue) 控制 padding, bg, shadow */
}

.loading-message {
  text-align: center;
  padding: 18px;
  color: var(--md-on-surface-variant, #555);
  font-size: 0.8125rem; /* 13px */
}

.quote-card {
  background-color: var(--md-surface, #fff);
  padding: 18px 20px; /* 增加上下 padding 来增加整体高度, 左右 padding 适中 */
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  margin-bottom: 16px;
}

.quote-text {
  font-size: 1em; /* 相对于 .widget-content (14px * 1 = 14px), 保持清晰 */
  font-style: italic;
  line-height: 1.55; /* 略微增加行高以提升可读性 */
  color: var(--md-on-surface, #333);
  margin-bottom: 8px;
}

.quote-author {
  text-align: right;
  font-size: 0.875em; /* ~12.25px */
  color: var(--md-on-surface-variant, #5f6368);
  margin-top: 6px;
}

.quote-category {
  font-size: 0.75em; /* ~10.5px */
  color: var(--md-secondary, #673ab7);
  margin-top: 4px;
  text-align: right;
}

.actions {
  margin-top: 16px; /* 与上方文本的间距 */
  display: flex;
  gap: 6px; /* 按钮之间的间距 */
  flex-wrap: nowrap; /* 强制按钮在一行 */
  justify-content: flex-end;
  /* 如果按钮可能溢出，可以考虑 overflow-x: auto，但最好是通过调整按钮大小避免 */
}

.md3-button.action-button { /* 给操作按钮一个特定类名以缩小它们 */
  padding: 5px 10px; /* 更小的内边距 */
  font-size: 0.7rem;  /* 约 11.2px，更小的字体 */
  border-radius: 16px; /* 保持圆角风格 */
  gap: 4px;          /* 图标和文字间距 */
  min-height: 26px;  /* 确保按钮有最小高度 */
  white-space: nowrap; /* 防止按钮内文字换行 */
  flex-shrink: 0;    /* 防止按钮在 flex 容器中被不成比例地压缩 */
}
.md3-button.action-button .md3-icon {
  font-size: 14px; /* 按钮内图标更小 */
}


.category-filter {
  margin-top: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.category-label {
    font-weight: 500;
    font-size: 0.8125rem; /* 13px */
    color: var(--md-on-surface-variant);
}

.md3-select { /* 恢复到稍大一点的select，如果需要更小，可以再加 .compact-select */
  padding: 7px 26px 7px 10px;
  font-size: 0.8125rem; /* 13px */
  border-radius: 6px;
  min-width: 110px;
  height: auto;
  min-height: 30px;
  /* 其他 .md3-select 样式（边框、背景等）应与 App.vue 中定义的全局 .md3-select 一致或在此定义 */
  border: 1px solid var(--md-outline, #ccc);
  background-color: var(--md-surface, #fff);
  color: var(--md-on-surface, #333);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='18' viewBox='0 -960 960 960' width='18' fill='%235F6368'%3E%3Cpath d='M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
.md3-select:focus { /* 确保与全局样式一致 */
  border-color: var(--md-primary);
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary) 20%, transparent);
}

.view-favorites-button {
    margin-top: 12px;
    /* 这个按钮也使用 .action-button 的缩小样式，如果需要的话 */
    /* 或者使用标准的 .md3-button */
    padding: 6px 12px;
    font-size: 0.75rem;
}

/* Favorites Modal styles - 保持与上一版一致 */
.favorites-list-modal {
    position: fixed; inset: 0; background-color: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 16px;
}
.favorites-list-content {
    background-color: var(--md-surface-container, var(--md-surface, #fff));
    padding: 18px 22px;
    border-radius: 14px; width: 100%; max-width: 460px;
    max-height: 75vh;
    overflow-y: auto; box-shadow: 0 5px 18px rgba(0,0,0,0.1);
}
.favorites-list-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 12px; border-bottom: 1px solid var(--md-outline, #ccc); padding-bottom: 10px;
}
.favorites-list-header .md3-headline-small {
    margin: 0; color: var(--md-primary); font-size: 1.1rem;
}
.favorites-list-header .md3-icon-button { width: 34px; height: 34px; }
.favorites-list-header .md3-icon-button .md3-icon { font-size: 18px; }

.favorites-ul {
    list-style: none; /* 移除默认的项目符号/箭头 */
    padding: 0;
    margin: 0;
}
.favorite-item {
  margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--md-outline-variant, #eee);
  display: flex; justify-content: space-between; align-items: center;
  gap: 10px;
}
.favorite-item:last-child { border-bottom: none; margin-bottom: 0; }
.favorite-text-content { flex-grow: 1; min-width: 0; }

.quote-text-fav {
    font-style: italic; color: var(--md-on-surface); margin-bottom: 3px;
    font-size: 0.85em;
    white-space: normal; overflow: visible; text-overflow: clip;
}
.quote-author-fav {
    font-size: 0.75em;
    color: var(--md-on-surface-variant);
    white-space: normal;
}

.remove-fav-button {
    padding: 4px 8px;
    font-size: 0.7rem;
    min-height: 26px;
    flex-shrink: 0;
}
.remove-fav-button .md3-icon {
    font-size: 14px !important;
    margin-right: 3px;
}
.no-favorites-message {
    text-align: center; padding: 14px; color: var(--md-on-surface-variant);
    font-size: 0.8rem;
}

/* 确保 .md3-button, .md3-icon, .md3-button-text 的基础样式来自App.vue或全局 */
/* 如果没有，需要在这里补充或调整以匹配App.vue的风格 */
.md3-button-text {
  background-color: transparent;
  color: var(--md-primary);
  box-shadow: none;
}
.md3-button-text:hover:not(:disabled) {
  background-color: rgba(var(--md-primary-rgb, 26, 115, 232), 0.08);
}
.md3-icon.material-symbols-outlined { /* 更具体地指定 Material Symbols */
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'liga';
}
</style>