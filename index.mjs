/**
 * Minimal, environment-agnostic similarity helpers.
 * ESM version for browser/Vite usage.
 */

/**
 * Remove YAML frontmatter if present.
 * @param {string} text
 * @returns {string}
 */
export function stripFrontmatter(text) {
  if (!text.startsWith("---")) return text;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return text;
  return text.slice(end + 4);
}

/**
 * Basic markdown normalization so embeddings focus on words, not syntax.
 * @param {string} text
 * @returns {string}
 */
export function normalizeMarkdown(text) {
  let cleaned = stripFrontmatter(text);
  cleaned = cleaned.replace(/```[\s\S]*?```/g, " ");
  cleaned = cleaned.replace(/`[^`]*`/g, " ");
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  cleaned = cleaned.replace(/\[[^\]]*\]\([^)]*\)/g, " ");
  cleaned = cleaned.replace(/^>\s?/gm, " ");
  cleaned = cleaned.replace(/^#+\s+/gm, " ");
  cleaned = cleaned.replace(/[*_~`]/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

const DEFAULT_STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
  "has", "have", "he", "her", "his", "i", "if", "in", "is", "it", "its",
  "me", "my", "not", "of", "on", "or", "our", "she", "so", "that", "the",
  "their", "them", "there", "they", "this", "to", "us", "was", "we", "were",
  "what", "when", "where", "who", "why", "will", "with", "you", "your"
]);

/**
 * FNV-1a hash for feature hashing.
 * @param {string} text
 * @returns {number}
 */
function hashToken(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Tokenize text into normalized terms.
 * @param {string} text
 * @param {{ minTokenLength?: number, stopwords?: Set<string> }} [options]
 * @returns {string[]}
 */
export function tokenize(text, options) {
  const minTokenLength = options?.minTokenLength ?? 3;
  const stopwords = options?.stopwords ?? DEFAULT_STOPWORDS;
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= minTokenLength && !stopwords.has(token));
}

/**
 * Build a single text string for embedding.
 * @param {{ title?: string, content: string }} input
 * @param {{ contentExcerptLength?: number }} [options]
 * @returns {string}
 */
export function buildEmbeddingText(input, options) {
  const title = input.title || "";
  const content = normalizeMarkdown(input.content || "");
  const limit = options?.contentExcerptLength ?? 500;
  const excerpt = content.slice(0, limit);
  return `${title} ${excerpt}`.trim();
}

/**
 * FNV-1a hash for change detection (stable, fast, no crypto).
 * @param {string} text
 * @returns {string}
 */
export function fingerprintText(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Calculate cosine similarity between two vectors.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Compute similarity lists for items with embeddings.
 * @param {Array<{ id: string, title: string, embedding: number[] }>} items
 * @param {{ maxSimilar?: number }} [options]
 * @returns {Record<string, Array<{ id: string, title: string, similarity: number }>>}
 */
export function calculateSimilarities(items, options) {
  const maxSimilar = options?.maxSimilar ?? 5;
  const similarities = {};

  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    similarities[a.id] = [];

    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const b = items[j];
      const similarity = cosineSimilarity(a.embedding, b.embedding);
      similarities[a.id].push({ id: b.id, title: b.title, similarity });
    }

    similarities[a.id].sort((x, y) => y.similarity - x.similarity);
    similarities[a.id] = similarities[a.id].slice(0, maxSimilar);
  }

  return similarities;
}

/**
 * Build TF-IDF vectors for a corpus of texts.
 * @param {string[]} texts
 * @param {{ maxVocab?: number, minTokenLength?: number, stopwords?: Set<string> }} [options]
 * @returns {{ vectors: number[][], vocab: string[] }}
 */
export function buildTfidfVectors(texts, options) {
  const tokenized = texts.map((text) => tokenize(text, options));
  const docCount = tokenized.length;

  const dfCounts = new Map();
  const tfCountsPerDoc = tokenized.map((tokens) => {
    const tf = new Map();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) ?? 0) + 1);
    }
    for (const token of new Set(tokens)) {
      dfCounts.set(token, (dfCounts.get(token) ?? 0) + 1);
    }
    return tf;
  });

  const maxVocab = options?.maxVocab ?? 5000;
  const vocab = Array.from(dfCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxVocab)
    .map(([token]) => token);

  const idf = new Map();
  for (const token of vocab) {
    const df = dfCounts.get(token) ?? 1;
    idf.set(token, Math.log((docCount + 1) / (df + 1)) + 1);
  }

  const vectors = tfCountsPerDoc.map((tf) => {
    const vec = new Array(vocab.length).fill(0);
    let norm = 0;
    for (let i = 0; i < vocab.length; i++) {
      const token = vocab[i];
      const tfVal = tf.get(token) ?? 0;
      if (tfVal === 0) continue;
      const value = tfVal * (idf.get(token) ?? 0);
      vec[i] = value;
      norm += value * value;
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < vec.length; i++) {
        vec[i] = vec[i] / norm;
      }
    }
    return vec;
  });

  return { vectors, vocab };
}

/**
 * Build TF-IDF vectors using feature hashing (fixed dimensionality).
 * @param {string[]} texts
 * @param {{ hashDim?: number, minTokenLength?: number, stopwords?: Set<string> }} [options]
 * @returns {{ vectors: number[][] }}
 */
export function buildHashedTfidfVectors(texts, options) {
  const hashDim = options?.hashDim ?? 2048;
  const tokenized = texts.map((text) => tokenize(text, options));
  const docCount = tokenized.length;

  const dfCounts = new Array(hashDim).fill(0);
  const tfCountsPerDoc = tokenized.map((tokens) => {
    const tf = new Array(hashDim).fill(0);
    const seen = new Set();
    for (const token of tokens) {
      const idx = hashToken(token) % hashDim;
      tf[idx] += 1;
      if (!seen.has(idx)) {
        seen.add(idx);
      }
    }
    for (const idx of seen) {
      dfCounts[idx] += 1;
    }
    return tf;
  });

  const vectors = tfCountsPerDoc.map((tf) => {
    const vec = new Array(hashDim).fill(0);
    let norm = 0;
    for (let i = 0; i < hashDim; i++) {
      const tfVal = tf[i];
      if (tfVal === 0) continue;
      const idf = Math.log((docCount + 1) / (dfCounts[i] + 1)) + 1;
      const value = tfVal * idf;
      vec[i] = value;
      norm += value * value;
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < vec.length; i++) {
        vec[i] = vec[i] / norm;
      }
    }
    return vec;
  });

  return { vectors };
}

/**
 * Vectorize documents with TF-IDF.
 * @param {Array<{ id: string, title?: string, content: string }>} docs
 * @param {{ contentExcerptLength?: number, maxVocab?: number, minTokenLength?: number, stopwords?: Set<string>, useHashing?: boolean, hashDim?: number }} [options]
 * @returns {{ vectors: number[][], vocab?: string[], texts: string[] }}
 */
export function vectorizeDocuments(docs, options) {
  const texts = docs.map((doc) =>
    buildEmbeddingText(
      { title: doc.title ?? "", content: doc.content },
      { contentExcerptLength: options?.contentExcerptLength ?? 500 }
    )
  );
  if (options?.useHashing) {
    const { vectors } = buildHashedTfidfVectors(texts, options);
    return { vectors, texts };
  }
  const { vectors, vocab } = buildTfidfVectors(texts, options);
  return { vectors, vocab, texts };
}
