# Use Cases

Real-world integrations using Quarrel.

---

## Static Site Generators

### Eleventy / 11ty

Add "related posts" to your blog at build time. The plugin computes TF-IDF similarity between all posts and exposes a `relatedPosts` filter for your templates.

```js
// .eleventy.js
const relatedPosts = require("./eleventy-related-posts");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(relatedPosts.plugin, {
    maxRelated: 3,
    minSimilarity: 0.1,
    useHashing: true
  });
};
```

Then in your template:

```njk
{% for post in page | relatedPosts(collections.posts) %}
  <a href="{{ post.url }}">{{ post.data.title }}</a>
{% endfor %}
```

[View example code](https://github.com/watthem/quarrel/blob/main/examples/eleventy-related-posts.js)

---

## Desktop Apps (Electron, Tauri, VSCode)

Build "similar documents" features into desktop JavaScript apps. Quarrel runs entirely client-side with no external calls—ideal for local-first, privacy-respecting tools.

```js
const { SimilarNotesIndex } = require("@watthem/quarrel/examples/obsidian-similar-notes");

// Works with any app that has a document store
const index = new SimilarNotesIndex(documentStore, {
  maxResults: 5,
  minSimilarity: 0.1
});

// Build index from your documents
await index.buildIndex();

// Query for similar documents
const results = index.findSimilar(currentDocument);
// results: [{ path, title, score }, ...]
```

This pattern works for:
- **Obsidian plugins** — surface related notes in your vault
- **VSCode extensions** — find similar files in a workspace
- **Electron/Tauri apps** — add "related items" to any document-based tool

[View Obsidian example](https://github.com/watthem/quarrel/blob/main/examples/obsidian-similar-notes.js)

---

## Visualization & Analytics

### Interactive Word Cloud

Generate dynamic word clouds from document content. Use TF-IDF scores to size and color terms, giving visual prominence to words that best characterize a document.

<WordCloudDemo />

```js
const quarrel = require("quarrel");

function generateWordCloud(document, allDocuments) {
  // Extract all texts and compute TF-IDF
  const texts = allDocuments.map(d => d.content);
  const { vectors, vocab } = quarrel.buildTfidfVectors(texts);
  
  // Find this document's index and get its vector
  const docIndex = allDocuments.findIndex(d => d.id === document.id);
  const tfIdfScores = vectors[docIndex];
  
  // Map vocabulary to scores, filter out low-importance terms
  const terms = vocab
    .map((word, i) => ({ word, score: tfIdfScores[i] }))
    .filter(t => t.score > 0.01)  // threshold for visibility
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);  // top 50 terms
  
  // Normalize scores for sizing (0.1 to 1.0)
  const minScore = Math.min(...terms.map(t => t.score));
  const maxScore = Math.max(...terms.map(t => t.score));
  const range = maxScore - minScore || 1;
  
  return terms.map(t => ({
    word: t.word,
    size: 0.1 + (0.9 * (t.score - minScore)) / range,
    weight: t.score
  }));
}

// Use with a visualization library (d3, canvas, etc.)
const cloud = generateWordCloud(
  { id: "doc1", content: "JavaScript closures and scope..." },
  allDocuments
);
```

Perfect for:
- **Documentation dashboards** — visualize what topics a page covers
- **Research tools** — quickly understand document content
- **Content analytics** — identify key themes across a corpus
- **Knowledge bases** — browse concepts visually

---

## Other Ideas

Quarrel's TF-IDF + cosine similarity approach works anywhere you need to find textual similarity:

- **Documentation sites** — suggest related pages
- **Knowledge bases** — detect duplicate or near-duplicate entries
- **Search results** — group similar results together
- **Content clustering** — organize documents by topic without manual tagging
- **Change detection** — use `fingerprintText` to skip re-processing unchanged content
