<template>
    <div class="md3-emotion-report-page md3-container">
      <h2 class="md3-title-large page-title">情绪分析报告</h2>
  
      <div class="month-selector md3-surface-container">
        <button @click="changeMonth(-1)" class="md3-icon-button">
          <span class="md3-icon">chevron_left</span>
        </button>
        <h3 class="md3-title-medium current-month-display">{{ selectedMonth.format('YYYY年MM月') }}</h3>
        <button @click="changeMonth(1)" class="md3-icon-button">
          <span class="md3-icon">chevron_right</span>
        </button>
      </div>
  
      <section class="report-section md3-surface-container">
        <h3 class="md3-headline-small section-title">情绪变化趋势图</h3>
        <div v-if="isLoadingChart" class="loading-indicator">图表加载中...</div>
        <div v-if="!isLoadingChart && !hasMoodDataForMonth" class="no-data-message">
          {{ selectedMonth.format('YYYY年MM月') }} 暂无心情数据。
        </div>
        <div class="chart-container" v-if="!isLoadingChart && hasMoodDataForMonth">
          <Line :data="chartData" :options="chartOptions" ref="emotionChartRef" />
          </div>
      </section>
  
      <section v-if="selectedDayDetails.date" class="report-section md3-surface-container">
        <h3 class="md3-headline-small section-title">
          {{ selectedDayDetails.date }} 日详情
        </h3>
        <div v-if="selectedDayDetails.mood">
          <p class="md3-body-large">
            <strong>心情:</strong> {{ selectedDayDetails.mood.category }} (程度: {{ selectedDayDetails.mood.scale }}/10) {{ moodEmoji(selectedDayDetails.mood) }}
          </p>
          <p v-if="selectedDayDetails.mood.description" class="md3-body-medium">
            <strong>描述:</strong> {{ selectedDayDetails.mood.description }}
          </p>
        </div>
        <div v-else>
          <p class="md3-body-large">当日无心情记录。</p>
        </div>
        <div>
          <h4 class="md3-title-small">关联事件:</h4>
          <ul v-if="selectedDayDetails.events && selectedDayDetails.events.length > 0" class="event-list">
            <li v-for="(event, index) in selectedDayDetails.events" :key="index" class="md3-body-medium">
              {{ event.text }}
            </li>
          </ul>
          <p v-else class="md3-body-medium">当日无事件记录。</p>
        </div>
      </section>
  
      <section class="report-section md3-surface-container">
        <h3 class="md3-headline-small section-title">每月情绪分析报告</h3>
        <div v-if="!aiApiKeyPresent" class="api-key-warning md3-error-container">
          <p class="md3-body-medium">AI API Key 未设置。请先在日历页面的“设置”中配置 AI API Key 以生成报告。</p>
        </div>
        <button
          @click="generateMonthlyReport"
          :disabled="isLoadingReport || !hasMoodDataForMonth || !aiApiKeyPresent"
          class="md3-button"
        >
          <span v-if="isLoadingReport" class="md3-icon">hourglass_top</span>
          <span v-else class="md3-icon">auto_awesome</span>
          {{ isLoadingReport ? '报告生成中...（请等待1-3分钟）' : (monthlyReportContent ? '重新生成报告' : '生成本月报告') }}
        </button>
        <div v-if="isLoadingReport && !monthlyReportContent" class="loading-indicator md3-body-medium">
          AI 助手正在努力分析中，请稍候...
        </div>
        <div v-if="monthlyReportContent" class="report-content md3-surface-variant">
          <h4 class="md3-title-medium">AI 分析结果:</h4>
          <pre class="md3-body-medium ai-report-text">{{ monthlyReportContent }}</pre>
        </div>
        <div v-if="!isLoadingReport && !hasMoodDataForMonth && aiApiKeyPresent" class="no-data-message md3-body-medium">
          本月无心情数据，无法生成AI分析报告。
        </div>
      </section>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import dayjs from 'dayjs'
  import { DataService } from '../services/dataService.js' // 假设路径正确
  import OpenAI from 'openai' // 从您的项目中导入
  
  // 导入 Chart.js 组件
  import { Line } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Filler
  } from 'chart.js'
  
  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Filler
  )
  
  // --- 响应式数据 ---
  const selectedMonth = ref(dayjs().startOf('month'))
  const allMoods = ref({})
  const allEvents = ref({})
  const isLoadingChart = ref(true)
  const isLoadingReport = ref(false)
  const monthlyReportContent = ref('')
  const selectedDayDetails = ref({ date: null, mood: null, events: [] })
  const emotionChartRef = ref(null)
  const aiApiKey = ref('')
  const aiApiKeyPresent = computed(() => !!aiApiKey.value)
  
  let openai = null;
  
  const initializeOpenAI = () => {
    const userApiKey = DataService.getAiApiKey()
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY
    const apiKeyToUse = userApiKey || envApiKey
    aiApiKey.value = apiKeyToUse
  
    if (apiKeyToUse) {
      try {
        openai = new OpenAI({
          apiKey: apiKeyToUse,
          baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
          dangerouslyAllowBrowser: true,
        })
      } catch (error) {
        console.error("Failed to initialize OpenAI client:", error)
        aiApiKey.value = ''
      }
    } else {
      console.warn("AI API Key is not configured.")
    }
  }
  
  const moodsForSelectedMonth = computed(() => {
    const monthKey = selectedMonth.value.format('YYYY-MM')
    const moods = {}
    for (const dateStr in allMoods.value) {
      if (dateStr.startsWith(monthKey)) {
        moods[dateStr] = allMoods.value[dateStr]
      }
    }
    return moods
  })
  
  const eventsForSelectedMonth = computed(() => {
    const monthKey = selectedMonth.value.format('YYYY-MM')
    const events = {}
    for (const dateStr in allEvents.value) {
      if (dateStr.startsWith(monthKey)) {
        events[dateStr] = allEvents.value[dateStr]
      }
    }
    return events
  })
  
  const hasMoodDataForMonth = computed(() => {
    return Object.keys(moodsForSelectedMonth.value).length > 0
  })
  
  const chartData = computed(() => {
    if (!hasMoodDataForMonth.value) {
      return { labels: [], datasets: [] }
    }
  
    const daysInCurrentMonth = selectedMonth.value.daysInMonth()
    const labels = []
    const moodScaleData = []
  
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const date = selectedMonth.value.date(i)
      const dateStr = date.format('YYYY-MM-DD')
      labels.push(date.format('MM-DD'))
  
      const moodEntry = moodsForSelectedMonth.value[dateStr]
      moodScaleData.push(moodEntry ? moodEntry.scale : null)
    }
  
    return {
      labels,
      datasets: [
        {
          label: '心情程度 (1-10)',
          backgroundColor: 'rgba(118, 75, 162, 0.2)',
          borderColor: 'var(--md-primary, #764BA2)',
          tension: 0.3,
          data: moodScaleData,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    }
  })
  
  const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 1,
          color: 'var(--md-on-surface-variant, #5F6368)',
        },
        grid: {
          color: 'var(--md-outline-variant, #BDC1C6)',
        }
      },
      x: {
        ticks: {
          color: 'var(--md-on-surface-variant, #5F6368)',
        },
        grid: {
          display: false,
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'var(--md-on-surface, #202124)',
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
              const dateStr = selectedMonth.value.date(context.dataIndex + 1).format('YYYY-MM-DD')
              const mood = allMoods.value[dateStr]
              if (mood && mood.category) {
                label += ` (${mood.category} ${moodEmoji(mood)})`
              }
            }
            return label;
          }
        }
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const chartElement = elements[0];
        const dataIndex = chartElement.index;
        const clickedDate = selectedMonth.value.date(dataIndex + 1);
        onDaySelected(clickedDate);
      }
    }
  })
  
  const fetchData = () => {
    isLoadingChart.value = true
    allMoods.value = DataService.getMoods()
    allEvents.value = DataService.getEvents()
    isLoadingChart.value = false
  }
  
  const changeMonth = (increment) => {
    selectedMonth.value = selectedMonth.value.add(increment, 'month').startOf('month')
    selectedDayDetails.value = { date: null, mood: null, events: [] }
    monthlyReportContent.value = ''
  }
  
  const moodEmoji = (mood) => {
    if (!mood || !mood.category) return '';
    const emojis = { '喜悦': '😊', '骄傲': '😎', '难过': '😢', '生气': '😠', '害怕': '😨' };
    return emojis[mood.category] || '😐';
  }
  
  const onDaySelected = (dateObj) => {
    const dateStr = dateObj.format('YYYY-MM-DD')
    selectedDayDetails.value = {
      date: dateObj.format('YYYY年MM月DD日'),
      mood: allMoods.value[dateStr] || null,
      events: allEvents.value[dateStr] || [],
    }
  }
  
  const generateMonthlyReport = async () => {
    if (!hasMoodDataForMonth.value || !openai) {
      if (!openai) monthlyReportContent.value = "AI 服务未配置或API Key无效，请检查设置。"
      else monthlyReportContent.value = "本月无心情数据，无法生成报告。";
      return
    }
  
    isLoadingReport.value = true
    monthlyReportContent.value = ''
  
    let promptData = `以下是用户在 ${selectedMonth.value.format('YYYY年MM月')} 记录的心情和事件数据：\n\n`
    promptData += "心情记录 (日期: {心情类别, 心情程度(1-10), 描述}):\n"
    let moodEntries = 0
    for (const dateStr in moodsForSelectedMonth.value) {
      const mood = moodsForSelectedMonth.value[dateStr]
      promptData += `${dateStr}: {类别: ${mood.category}, 程度: ${mood.scale}, 描述: "${mood.description || '无'}"}\n`
      moodEntries++
    }
    if (moodEntries === 0) {
        promptData += "本月无具体心情条目记录。\n";
    }
  
    promptData += "\n事件记录 (日期: [事件列表]):\n"
    let eventEntries = 0
    for (const dateStr in eventsForSelectedMonth.value) {
      const eventList = eventsForSelectedMonth.value[dateStr]
      if (eventList && eventList.length > 0) {
        promptData += `${dateStr}: [${eventList.map(e => `"${e.text}"`).join(', ')}]\n`
        eventEntries++
      }
    }
     if (eventEntries === 0) {
        promptData += "本月无具体事件条目记录。\n";
    }
  
    const systemPrompt = `你是一位专业的心理分析助手和关怀伙伴。请根据用户提供的一个月内记录的心情日记数据（包括心情类别、心情程度1-10、心情描述以及当天发生的事件），生成一份情绪分析报告。
  报告应包含以下几个方面：
  1.  **本月整体情绪回顾**: 总结用户本月的情绪基调是怎样的（例如，积极为主、有些波动、挑战较多等）。
  2.  **主要情绪模式**:识别并指出本月用户最常出现的心情是什么？是否存在某种情绪（如焦虑、低落）持续时间较长或反复出现的情况？
  3.  **情绪波动分析**: 分析本月情绪评分的波动情况。是否有特别高涨或低落的时期？这些高低点是否与记录的特定事件有关联？请具体举例说明。
  4.  **潜在关联解读**: 尝试从心情描述和事件记录中找出情绪与事件之间可能的联系。例如，“看起来你在[某事件]后感到了[某种情绪]”。
  5.  **积极反馈与个性化建议**:
      * 如果用户有很多积极情绪，给予肯定和鼓励。
      * 如果用户经历了一些负面情绪，提供富有同情心的理解，并给出1-2条具体的、可操作的、温和的建议来帮助用户更好地应对类似情绪或情况。例如，放松技巧、积极的自我对话、寻求支持等。避免给出医学建议。
      * 如果用户记录的积极事件很多，可以赞赏用户的努力和成就。
      * 如果数据不足以进行某些分析，请委婉说明。
  
  报告风格应亲切、积极、富有同情心、易于理解且具有建设性。请直接输出报告内容。`
  
    try {
      const completion = await openai.chat.completions.create({
        model: "qwen-plus",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptData },
        ],
        temperature: 0.7,
      })
      monthlyReportContent.value = completion.choices[0]?.message?.content || 'AI未能生成报告内容。'
    } catch (error) {
      console.error('AI report generation failed:', error)
      monthlyReportContent.value = `抱歉，AI报告生成失败。错误信息：${error.message || '未知错误'} (请检查API Key和网络连接)`
    } finally {
      isLoadingReport.value = false
    }
  }
  
  onMounted(() => {
    initializeOpenAI()
    fetchData()
  })
  
  watch(selectedMonth, () => {
    // 计算属性 chartData 会自动更新，vue-chartjs 会监听其变化
  }, { immediate: true })
  
  </script>
  
  <style scoped>
  .md3-emotion-report-page {
    padding: 24px;
    background-color: var(--md-background);
    color: var(--md-on-background);
  }
  
  .page-title {
    text-align: center;
    margin-bottom: 24px;
    color: var(--md-primary);
  }
  
  .month-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    padding: 12px;
    border-radius: 12px;
    /* background-color: var(--md-surface-container); 卡片背景色 */
    /* box-shadow: 0 1px 2px rgba(0,0,0,0.1); */
  }
  
  .current-month-display {
    margin: 0 16px;
    min-width: 150px;
    text-align: center;
  }
  
  .report-section {
    margin-bottom: 32px;
    padding: 20px;
    border-radius: 16px;
    /* background-color: var(--md-surface-container); */ /* 卡片背景色 */
    box-shadow: 0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.08);
  }
  .section-title {
    margin-top: 0;
    margin-bottom: 16px;
    color: var(--md-primary);
    border-bottom: 1px solid var(--md-outline-variant);
    padding-bottom: 8px;
  }
  
  .loading-indicator, .no-data-message {
    text-align: center;
    padding: 20px;
    color: var(--md-on-surface-variant);
  }
  
  .api-key-warning {
    padding: 12px;
    margin-bottom: 16px;
    border-radius: 8px;
    background-color: var(--md-error-container); /* 使用错误状态背景色 */
  }
  .api-key-warning p {
    margin: 0;
    color: var(--md-on-error-container); /* 使用错误状态文字颜色 */
  }
  
  .chart-container {
    height: 350px;
    position: relative;
  }
  
  .event-list {
    list-style-type: disc;
    padding-left: 20px;
  }
  .event-list li {
    margin-bottom: 4px;
  }
  
  .report-content {
    margin-top: 16px;
    padding: 16px;
    border-radius: 8px;
    background-color: var(--md-surface-variant);
  }
  
  .ai-report-text {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'Roboto', sans-serif;
    line-height: 1.6;
    color: var(--md-on-surface-variant);
  }
  
  .md3-icon-button {
    background: transparent;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
    color: var(--md-on-surface-variant);
  }
  .md3-icon-button:hover {
    background-color: rgba(0,0,0,0.04);
  }
  .md3-icon {
    font-family: 'Material Symbols Outlined';
    font-size: 24px;
  }
  .md3-button {
    background-color: var(--md-primary);
    color: var(--md-on-primary);
    padding: 10px 24px;
    border-radius: 20px;
    border: none;
    font-family: 'Roboto', sans-serif;
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .md3-button:disabled {
    background-color: var(--md-outline);
    color: var(--md-on-surface-variant);
    cursor: not-allowed;
    box-shadow: none;
  }
  .md3-button:hover:not(:disabled) {
    box-shadow: 0 1px 2px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
    /* background-color: color-mix(in srgb, var(--md-primary) 90%, black); */
  }
  
  /* 确保您的全局 CSS 或 App.vue 中定义了以下这些 CSS 变量 */
  /*
  :root {
    --md-primary: #764BA2;  // 示例主色调 (紫色系)
    --md-on-primary: #FFFFFF;
    --md-error-container: #FCE8E6;
    --md-on-error-container: #B00020; // 更明显的错误文字颜色
    --md-background: #FEF7FF; // 示例背景色 (浅紫色系)
    --md-on-background: #1D1B20;
    --md-surface: #FEF7FF; // 示例表面颜色
    --md-on-surface: #1D1B20;
    --md-surface-container: #F3EDF7; // 卡片背景色 (浅紫色系)
    --md-surface-variant: #EADDFF;   // AI报告背景 (浅紫色系)
    --md-on-surface-variant: #49454F;
    --md-outline: #CAC4D0;
    --md-outline-variant: #79747E; // 稍微深一点的轮廓变体
  
    // 以下字体大小和权重变量是您原始代码中使用的，也应该全局定义
    // --md-title-large-font-size: 22px;
    // --md-title-medium-font-size: 18px; (假设, 您的代码中使用的是 font-size: 18px)
    // --md-headline-small-font-size: 20px; (假设, 您的代码中使用的是 font-size: 20px)
    // --md-body-large-font-size: 16px; (假设)
    // --md-body-medium-font-size: 14px;
    // --md-title-small-font-size: 14px; (假设, 您用在了关联事件标题)
  }
  
  .md3-title-large { font-size: 22px; font-weight: 500; } // 示例
  .md3-title-medium { font-size: 18px; font-weight: 500; } // 示例
  .md3-headline-small { font-size: 20px; font-weight: 500; } // 示例
  .md3-body-large { font-size: 16px; font-weight: 400; } // 示例
  .md3-body-medium { font-size: 14px; font-weight: 400; } // 示例
  .md3-title-small { font-size: 14px; font-weight: 500; } // 示例
  .md3-container { padding: 16px; } // 您代码中用到的
  */
  </style>