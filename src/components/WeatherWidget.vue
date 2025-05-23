<template>
  <div class="weather-widget">
    <div class="widget-content">
      <div class="weather-header">
        <input type="text" v-model="searchQuery" @input="searchCities" placeholder="搜索城市" class="city-search-input" />
        <select v-model="selectedCityId" @change="onCityChange" class="city-select">
          <option v-if="cityOptions.length === 0 && searchQuery" value="">无匹配城市</option>
          <option v-for="city in cityOptions" :key="city.id" :value="city.id">{{ city.name }}</option>
        </select>
      </div>
      <div v-if="loading" class="weather-loading">加载中...</div>
      <div v-if="!loading && !currentWeather.text.includes('失败')" class="weather-details">
        <div class="weather-location-display">
          <span class="md3-icon location-icon">location_on</span>
          <span>{{ selectedCity?.name }}</span>
        </div>
        <div class="weather-current">
          <div class="weather-temp">{{ currentWeather.temp }}°C</div>
          <div class="weather-desc">{{ currentWeather.text }}</div>
        </div>
        <div class="weather-forecast">
          <div v-for="day in forecast.slice(0, 5)" :key="day.fxDate" class="weather-forecast-day">
            <span>{{ formatDate(day.fxDate) }}</span>
            <span class="forecast-text">{{ day.textDay }}</span>
            <span>{{ day.tempMin }}~{{ day.tempMax }}°C</span>
          </div>
        </div>
      </div>
      <div v-if="!loading && currentWeather.text.includes('失败')" class="weather-error">
        天气获取失败。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const selectedCity = ref({ name: '北京', location: '101010100', id: '101010100' });
const selectedCityId = ref(selectedCity.value.id); // 新增
const currentWeather = ref({ temp: '--', text: '--' });
const forecast = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const cityOptions = ref([{ name: '北京', location: '101010100', id: '101010100' }]);

const QWEATHER_KEY = '9ac7e67bd8bc4b2ea179c05f33e2493f';
const API_HOST = 'p92vhdt5yu.re.qweatherapi.com'; // 推荐用官方公有云域名

const fetchWeather = async () => {
  if (!selectedCity.value || !selectedCity.value.location) {
    currentWeather.value = { temp: '--', text: '请选择城市' };
    forecast.value = [];
    return;
  }
  loading.value = true;
  currentWeather.value = { temp: '--', text: '加载中...' };
  forecast.value = [];
  try {
    const resNow = await fetch(`https://${API_HOST}/v7/weather/now?location=${selectedCity.value.location}&key=${QWEATHER_KEY}`);
    const dataNow = await resNow.json();
    if (dataNow.code !== "200") throw new Error(`Now API: ${dataNow.code} - ${dataNow.fxLink || dataNow.message || 'Unknown error'}`);
    currentWeather.value = {
      temp: dataNow.now.temp,
      text: dataNow.now.text,
    };

    const res7d = await fetch(`https://${API_HOST}/v7/weather/7d?location=${selectedCity.value.location}&key=${QWEATHER_KEY}`);
    const data7d = await res7d.json();
    if (data7d.code !== "200") throw new Error(`7D API: ${data7d.code} - ${data7d.fxLink || data7d.message || 'Unknown error'}`);
    forecast.value = data7d.daily;
  } catch (e) {
    currentWeather.value = { temp: 'N/A', text: '获取失败' };
    forecast.value = [];
    console.error("Weather fetch error:", e.message);
  }
  loading.value = false;
};

const searchCities = async () => {
  if (searchQuery.value.length < 1) {
    return;
  }
  const params = new URLSearchParams({
    location: searchQuery.value,
    key: QWEATHER_KEY,
  });
  try {
    // 这里用你的私有云域名和 /geo/v2/city/lookup 路径
    const res = await fetch(`https://${API_HOST}/geo/v2/city/lookup?${params.toString()}`);
    const data = await res.json();
    if (data.code === "200" && data.location) {
      cityOptions.value = data.location.map(city => ({
        name: `${city.name}, ${city.adm2 || city.adm1}`,
        location: city.id,
        id: city.id,
        lat: city.lat,
        lon: city.lon,
        country: city.country,
        adm1: city.adm1,
        adm2: city.adm2,
        fxLink: city.fxLink,
      }));
      if (cityOptions.value.length > 0) {
        selectedCityId.value = cityOptions.value[0].id;
        selectedCity.value = cityOptions.value[0];
      }
    } else {
      cityOptions.value = [];
      console.error("City search error:", data.code, data.message || data.fxLink);
    }
  } catch (error) {
    cityOptions.value = [];
    console.error("City search network error:", error);
  }
};

// 监听 select 的变化，更新 selectedCity
const onCityChange = () => {
  const found = cityOptions.value.find(c => c.id === selectedCityId.value);
  if (found) {
    selectedCity.value = found;
  }
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

onMounted(() => {
  if (selectedCity.value && selectedCity.value.location) {
    fetchWeather();
  }
});

// 监听 selectedCity 的 location 变化，自动刷新天气
watch(() => selectedCity.value?.location, (newLocation, oldLocation) => {
  if (newLocation && newLocation !== oldLocation) {
    fetchWeather();
  }
});
</script>

<style scoped>
.weather-widget {
  /* This root class is for App.vue's .sidebar-module-wrapper to target if needed */
  /* We'll style .widget-content for the card look */
  width: 100%; /* Ensure it takes full width of its slot in sidebar-module-wrapper */
}

.widget-content {
  font-size: 0.875rem; /* 14px base, slightly smaller */
  /* Padding and background are handled by .sidebar-module-wrapper in App.vue */
}

.weather-header {
  display: flex;
  flex-direction: column;
  gap: 8px; /* Reduced gap */
  margin-bottom: 10px; /* Reduced margin */
}

.city-search-input, .city-select {
  width: 100%;
  padding: 6px 10px; /* Reduced padding */
  font-size: 0.8125rem; /* 13px */
  border: 1px solid var(--md-outline, #ccc);
  border-radius: 6px; /* Smaller radius */
  box-sizing: border-box;
  background-color: var(--md-surface, #fff);
  color: var(--md-on-surface, #333);
}
.city-select {
  appearance: none; /* For custom arrow if needed */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='20' viewBox='0 -960 960 960' width='20' fill='%235F6368'%3E%3Cpath d='M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 28px; /* Space for arrow */
}


.weather-location-display {
  display: flex;
  align-items: center;
  font-weight: 500; /* Was bold, can be 500 */
  font-size: 0.9rem; /* ~14.4px */
  margin-bottom: 8px; /* Space below city name */
  color: var(--md-on-surface-variant);
}
.location-icon {
    font-size: 1.1em; /* Relative to parent font-size */
    margin-right: 4px;
    color: var(--md-primary);
}

.weather-current {
  text-align: center; /* Center current weather */
  margin-bottom: 8px; /* Reduced margin */
}
.weather-temp {
  font-size: 1.8rem; /* ~29px, reduced */
  font-weight: 500; /* Less bold */
  color: var(--md-primary); /* Use primary color */
  line-height: 1.1;
}
.weather-desc {
  font-size: 0.8rem; /* ~12.8px */
  color: var(--md-on-surface-variant);
}

.weather-forecast {
  display: flex;
  flex-direction: column;
  gap: 3px; /* Reduced gap */
}
.weather-forecast-day {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem; /* 12px, smaller forecast text */
  color: var(--md-on-surface-variant);
  padding: 2px 0; /* Minimal padding */
}
.weather-forecast-day .forecast-text {
    flex-basis: 30%; /* Give weather text some space */
    text-align: center;
}


.weather-loading, .weather-error {
  color: var(--md-on-surface-variant);
  font-size: 0.8rem; /* ~12.8px */
  text-align: center;
  padding: 10px 0;
}
</style>