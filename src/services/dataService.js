const XOR_KEY = "VueDiaryApiKeyObfuscationKey";

function simpleXORCrypt(text, key) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function encryptApiKey(apiKey) {
  if (!apiKey) return "";
  try {
    const xored = simpleXORCrypt(apiKey, XOR_KEY);
    return btoa(xored);
  } catch (e) {
    console.error("Error encrypting API key:", e);
    return "";
  }
}

function decryptApiKey(encryptedApiKey) {
  if (!encryptedApiKey) return "";
  try {
    const xored = atob(encryptedApiKey);
    return simpleXORCrypt(xored, XOR_KEY);
  } catch (e) {
    console.error("Error decrypting API key:", e);
    return ""; 
  }
}

export const DataService = {
  // 保存心情数据
  saveMoods(moods) {
    localStorage.setItem('calendarMoods', JSON.stringify(moods));
  },
  
  // 获取心情数据
  getMoods() {
    const savedMoods = localStorage.getItem('calendarMoods');
    return savedMoods ? JSON.parse(savedMoods) : {};
  },
  
  // 保存提醒事项
  saveEvents(events) {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  },
  
  // 获取提醒事项
  getEvents() {
    const savedEvents = localStorage.getItem('calendarEvents');
    return savedEvents ? JSON.parse(savedEvents) : {};
  },
  
  // 保存背景图片
  saveBackground(backgroundUrl) {
    localStorage.setItem('calendarBackground', backgroundUrl);
  },
  
  // 获取背景图片
  getBackground() {
    return localStorage.getItem('calendarBackground') || '/images/b4b1ebec449cfc572813ef4b46a3dec3.jpeg';
  },

  // 保存日历遮罩透明度
  saveCalendarOverlayOpacity(opacity) {
    localStorage.setItem('calendarOverlayOpacity', opacity);
  },

  // 获取日历遮罩透明度
  getCalendarOverlayOpacity() {
    const opacity = localStorage.getItem('calendarOverlayOpacity');
    return opacity ? parseFloat(opacity) : 0.55; // 默认值 0.55
  },

  // 保存 AI API Key
  saveAiApiKey(apiKey) {
    const encryptedKey = encryptApiKey(apiKey);
    if (encryptedKey) {
      localStorage.setItem('aiApiKey', encryptedKey);
    } else if (!apiKey) { 
      localStorage.removeItem('aiApiKey');
    }
  },

  // 获取 AI API Key
  getAiApiKey() {
    const encryptedKey = localStorage.getItem('aiApiKey');
    return decryptApiKey(encryptedKey);
  }
}
