<template>
    <div v-if="favoriteQuotes.length > 0" class="favorite-quotes">
        <h2>我的收藏</h2>
        <div v-for="quote in favoriteQuotes" :key="quote.id" class="favorite-quote">
            <p class="md3-body-medium">"{{ quote.content }}"</p>
            <p v-if="quote.author" class="md3-body-small">- {{ quote.author }}</p>
        </div>
    </div>
    <div v-else class="no-favorites">
        <p class="md3-body-medium">暂无收藏</p>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';

const allQuotes = ref([]);
const favoriteQuoteIds = ref(JSON.parse(localStorage.getItem('favoriteQuotes') || '[]'));

const fetchAllQuotes = async () => {
    try {
        // 修改为 5173 端口
        const response = await fetch('http://localhost:5173/quotes');
        if (!response.ok) {
            throw new Error('Could not fetch quotes');
        }
        allQuotes.value = await response.json();
    } catch (error) {
        console.error('Error fetching all quotes:', error);
    }
};

const favoriteQuotes = computed(() => {
    return allQuotes.value.filter(quote => favoriteQuoteIds.value.includes(quote.id));
});

onMounted(() => {
    fetchAllQuotes();
});

watch(
    () => favoriteQuoteIds.value,
    () => {
        localStorage.setItem('favoriteQuotes', JSON.stringify(favoriteQuoteIds.value));
    },
    { deep: true }
);
</script>

<style scoped>
.favorite-quotes {
    margin-top: 20px;
    padding: 16px;
    border: 1px solid var(--md-outline);
    border-radius: 8px;
    background-color: var(--md-surface-variant);
}

.favorite-quote {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--md-outline);
}

.favorite-quote:last-child {
    border-bottom: none;
}

.no-favorites {
    margin-top: 20px;
    padding: 16px;
    border: 1px solid var(--md-outline);
    border-radius: 8px;
    background-color: var(--md-surface-variant);
    text-align: center;
}
</style>