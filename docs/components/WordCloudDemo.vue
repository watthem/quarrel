<script setup>
import { ref, computed } from 'vue'
import { buildTfidfVectors } from '../../index.mjs'

const documents = ref([
  {
    id: 'doc1',
    title: 'Space Exploration',
    content: 'Space exploration illustrates the human desire to explore and understand the universe. NASA and other agencies send spacecraft to planets and stars.',
  },
  {
    id: 'doc2',
    title: 'Deep Sea Diving',
    content: 'Deep sea diving requires special equipment to withstand high pressure. Divers explore the ocean depths to discover new marine life and shipwrecks.',
  },
  {
    id: 'doc3',
    title: 'Forest Ecosystems',
    content: 'Forest ecosystems are complex webs of life. Trees, plants, and animals interact in a delicate balance. Conservation is key to protecting these green spaces.',
  }
])

const selectedDocId = ref('doc1')
const threshold = ref(0.01)

const currentDoc = computed(() => 
  documents.value.find(d => d.id === selectedDocId.value)
)

const wordCloudData = computed(() => {
  if (!currentDoc.value) return []

  const texts = documents.value.map(d => d.content)
  const { vectors, vocab } = buildTfidfVectors(texts)
  
  const docIndex = documents.value.findIndex(d => d.id === selectedDocId.value)
  const tfIdfScores = vectors[docIndex]
  
  // Map vocabulary to scores
  const terms = vocab
    .map((word, i) => ({ word, score: tfIdfScores[i] }))
    .filter(t => t.score > threshold.value)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
  
  if (terms.length === 0) return []

  // Normalize scores for sizing (0.5rem to 2.5rem)
  const minScore = Math.min(...terms.map(t => t.score))
  const maxScore = Math.max(...terms.map(t => t.score))
  const range = maxScore - minScore || 1
  
  return terms.map(t => ({
    word: t.word,
    size: 0.8 + (1.7 * (t.score - minScore)) / range + 'rem',
    weight: t.score
  }))
})

// Generate color based on score
function getColor(weight) {
  // Simple blue gradient based on weight
  const opacity = 0.5 + Math.min(weight * 2, 0.5) 
  return `rgba(59, 130, 246, ${opacity})`
}
</script>

<template>
  <div class="word-cloud-demo">
    <div class="controls">
      <div class="control-group">
        <label>Document:</label>
        <select v-model="selectedDocId">
          <option v-for="doc in documents" :key="doc.id" :value="doc.id">
            {{ doc.title }}
          </option>
        </select>
      </div>

      <div class="control-group">
        <label>Threshold: {{ threshold }}</label>
        <input 
          type="range" 
          v-model.number="threshold" 
          min="0" 
          max="0.5" 
          step="0.01"
        >
      </div>
    </div>

    <div class="document-preview">
      <strong>Content:</strong>
      <p>{{ currentDoc.content }}</p>
    </div>

    <div class="cloud-container">
      <div v-if="wordCloudData.length === 0" class="empty-state">
        No words meet the threshold. Lower it to see more common terms.
      </div>
      <span 
        v-for="term in wordCloudData" 
        :key="term.word"
        class="cloud-word"
        :style="{ fontSize: term.size, color: getColor(term.weight) }"
        :title="`Score: ${term.weight.toFixed(4)}`"
      >
        {{ term.word }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.word-cloud-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
  background-color: var(--vp-c-bg-soft);
}

.controls {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

select, input[type="range"] {
  padding: 0.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
}

.document-preview {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
}

.document-preview p {
  margin: 0;
  font-style: italic;
}

.cloud-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
}

.cloud-word {
  transition: all 0.3s ease;
  cursor: default;
  line-height: 1;
}

.cloud-word:hover {
  transform: scale(1.1);
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
}

.empty-state {
  color: var(--vp-c-text-3);
  font-style: italic;
}
</style>
