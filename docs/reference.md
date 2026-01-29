# API Reference

Every function Quarrel exports, with all parameters and return values.

---

## Text Processing

### `stripFrontmatter(text)`

Removes YAML frontmatter (`---` blocks) from the start of a string.

| Param | Type | Description |
|-------|------|-------------|
| `text` | `string` | Input text |

**Returns:** `string`

```js
quarrel.stripFrontmatter("---\ntitle: Hello\n---\nBody");
// => "\nBody"

quarrel.stripFrontmatter("No frontmatter");
// => "No frontmatter"
```

---

### `normalizeMarkdown(text)`

Strips all markdown syntax — frontmatter, code blocks, inline code, images, links, blockquotes, headings, and emphasis — leaving plain text.

| Param | Type | Description |
|-------|------|-------------|
| `text` | `string` | Raw markdown |

**Returns:** `string`

```js
quarrel.normalizeMarkdown("# Title\n\nSome **bold** and [a link](http://x.com).");
// => "Title Some bold and ."
```

---

### `tokenize(text, options?)`

Splits text into lowercase words, removing punctuation, short words, and stopwords.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `text` | `string` | — | Input text |
| `options.minTokenLength` | `number` | `3` | Shortest word to keep |
| `options.stopwords` | `Set<string>` | built-in | Words to skip |

**Returns:** `string[]`

```js
quarrel.tokenize("The quick brown fox jumps over the lazy dog");
// => ["quick", "brown", "fox", "jumps", "over", "lazy", "dog"]

quarrel.tokenize("AI & ML", { minTokenLength: 2 });
// => ["ai", "ml"]
```

---

### `buildEmbeddingText(input, options?)`

Merges a title and content into one string for vectorization. Content gets markdown-stripped and trimmed to `contentExcerptLength`.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `input.title` | `string` | `""` | Document title |
| `input.content` | `string` | `""` | Document body (markdown OK) |
| `options.contentExcerptLength` | `number` | `500` | Max content characters to use |

**Returns:** `string`

```js
quarrel.buildEmbeddingText({
  title: "My Note",
  content: "# Heading\n\nSome content..."
});
// => "My Note Heading Some content..."
```

---

### `fingerprintText(text)`

Returns an 8-character hex hash for change detection. Same input always gives the same output.

| Param | Type | Description |
|-------|------|-------------|
| `text` | `string` | Input text |

**Returns:** `string` (8 hex characters)

```js
quarrel.fingerprintText("hello world");
// => "cad44818"
```

Not for security — just for checking if content changed between runs.

---

## Vectorization

### `buildTfidfVectors(texts, options?)`

Takes an array of plain text strings and returns weighted vectors plus the vocabulary used.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `texts` | `string[]` | — | Plain text strings |
| `options.maxVocab` | `number` | `5000` | Cap on vocabulary size |
| `options.minTokenLength` | `number` | `3` | Shortest token to keep |
| `options.stopwords` | `Set<string>` | built-in | Words to skip |

**Returns:** `{ vectors: number[][], vocab: string[] }`

- `vectors` — one per input, length matches `vocab`
- `vocab` — the terms, in order (index = vector position)

```js
const { vectors, vocab } = quarrel.buildTfidfVectors([
  "javascript closures are useful",
  "python decorators are elegant"
]);
```

---

### `buildHashedTfidfVectors(texts, options?)`

Like `buildTfidfVectors`, but maps words to a fixed-size vector using hashing instead of building a vocabulary. Faster, constant memory, slightly less precise.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `texts` | `string[]` | — | Plain text strings |
| `options.hashDim` | `number` | `2048` | Size of each vector |
| `options.minTokenLength` | `number` | `3` | Shortest token to keep |
| `options.stopwords` | `Set<string>` | built-in | Words to skip |

**Returns:** `{ vectors: number[][] }`

```js
const { vectors } = quarrel.buildHashedTfidfVectors(
  ["javascript closures", "python decorators"],
  { hashDim: 512 }
);
// vectors[0].length === 512
```

---

### `vectorizeDocuments(docs, options?)`

The main entry point. Takes document objects, handles markdown cleanup, and returns vectors. Use this unless you need lower-level control.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `docs` | `Array<{ id, title?, content }>` | — | Your documents |
| `options.contentExcerptLength` | `number` | `500` | Max content characters |
| `options.useHashing` | `boolean` | `false` | Use feature hashing |
| `options.hashDim` | `number` | `2048` | Vector size (hashing only) |
| `options.maxVocab` | `number` | `5000` | Vocabulary cap (standard only) |
| `options.minTokenLength` | `number` | `3` | Shortest token to keep |
| `options.stopwords` | `Set<string>` | built-in | Words to skip |

**Returns:** `{ vectors: number[][], vocab?: string[], texts: string[] }`

- `vectors` — one per document
- `vocab` — only present when `useHashing` is false
- `texts` — the cleaned strings that were actually vectorized

```js
const { vectors } = quarrel.vectorizeDocuments(
  [
    { id: "a", title: "Intro", content: "# Welcome\n\nHello world." },
    { id: "b", title: "Guide", content: "## Setup\n\nInstall and run." }
  ],
  { useHashing: true }
);
```

---

## Similarity

### `cosineSimilarity(vecA, vecB)`

Scores how similar two vectors are. 1 means identical, 0 means nothing in common.

| Param | Type | Description |
|-------|------|-------------|
| `vecA` | `number[]` | First vector |
| `vecB` | `number[]` | Second vector |

**Returns:** `number` (0 to 1)

Returns 0 for null/empty/mismatched vectors.

```js
quarrel.cosineSimilarity([1, 0, 0], [1, 0, 0]); // => 1
quarrel.cosineSimilarity([1, 0, 0], [0, 1, 0]); // => 0
quarrel.cosineSimilarity([1, 1, 0], [1, 0, 0]); // => ~0.707
```

---

### `calculateSimilarities(items, options?)`

Compares every item to every other item and returns ranked matches.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | `Array<{ id, title, embedding }>` | — | Items with vectors |
| `options.maxSimilar` | `number` | `5` | How many matches to return per item |

**Returns:** `Record<string, Array<{ id, title, similarity }>>`

A map from each item's ID to its top matches, sorted by score.

```js
const matches = quarrel.calculateSimilarities(
  [
    { id: "a", title: "Note A", embedding: [1, 0, 0] },
    { id: "b", title: "Note B", embedding: [0.9, 0.1, 0] },
    { id: "c", title: "Note C", embedding: [0, 0, 1] }
  ],
  { maxSimilar: 2 }
);

// matches["a"] => [
//   { id: "b", title: "Note B", similarity: 0.994 },
//   { id: "c", title: "Note C", similarity: 0 }
// ]
```
