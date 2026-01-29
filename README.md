# @watthem/quarrel

A tiny, dependency-free similarity toolkit built around TF-IDF + cosine similarity.
Designed to run in both Node and browser/Obsidian environments.

## Usage

```js
const similarity = require("@watthem/quarrel");

const docs = [
  { id: "a", title: "Hello", content: "Hello world note" },
  { id: "b", title: "Second", content: "Another note about world" }
];

const { vectors } = similarity.vectorizeDocuments(docs, {
  contentExcerptLength: 500,
  useHashing: true,
  hashDim: 2048
});

const items = docs.map((doc, i) => ({ id: doc.id, title: doc.title, embedding: vectors[i] }));
const matches = similarity.calculateSimilarities(items, { maxSimilar: 5 });
```

## API

- `stripFrontmatter(text)`
- `normalizeMarkdown(text)`
- `tokenize(text, options)`
- `buildEmbeddingText({ title, content }, options)`
- `buildTfidfVectors(texts, options)`
- `buildHashedTfidfVectors(texts, options)`
- `vectorizeDocuments(docs, options)`
- `cosineSimilarity(vecA, vecB)`
- `calculateSimilarities(items, options)`

## Notes

- Uses TF-IDF with L2 normalization.
- Feature hashing can trade a bit of precision for big speed gains.
