# How-To Guide

Recipes for things you'll actually want to do.

## Pick a Vectorization Strategy

Quarrel can turn text into numbers two ways. Here's when to use each.

**Feature hashing** (`useHashing: true`) — the fast option. Fixed memory, no bookkeeping. You can't see which words map to which numbers, but for most uses that doesn't matter.

```js
const { vectors } = quarrel.vectorizeDocuments(docs, {
  useHashing: true,
  hashDim: 2048
});
```

**Standard TF-IDF** (the default) — the transparent option. Builds a vocabulary you can inspect. Better precision, but memory grows with your corpus.

```js
const { vectors, vocab } = quarrel.vectorizeDocuments(docs);
// vocab tells you what each position in the vector means
// e.g. ["javascript", "closure", "function", ...]
```

**Rule of thumb:** Start with hashing. Switch to standard if you need to debug why two documents score unexpectedly high or low.

### Tuning `hashDim`

This controls vector size. Bigger means fewer collisions (where two different words accidentally land in the same slot) but uses more memory.

| hashDim | Good for |
|---------|----------|
| 512 | Small collections, under 100 docs |
| 2048 | Most use cases (default) |
| 4096 | Large vocabulary or precision-sensitive work |

If unrelated documents are scoring as similar, try bumping this up.

## Add Custom Stopwords

Stopwords are common words Quarrel ignores ("the", "and", "is", etc.). If your documents share domain-specific filler words, filter those too:

```js
const stopwords = new Set([
  // keep the defaults
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
  "has", "have", "he", "her", "his", "i", "if", "in", "is", "it", "its",
  "me", "my", "not", "of", "on", "or", "our", "she", "so", "that", "the",
  "their", "them", "there", "they", "this", "to", "us", "was", "we", "were",
  "what", "when", "where", "who", "why", "will", "with", "you", "your",
  // add your own
  "todo", "fixme", "note"
]);

const { vectors } = quarrel.vectorizeDocuments(docs, {
  useHashing: true,
  stopwords
});
```

## Detect Which Documents Changed

Re-vectorizing everything on every run is wasteful. Use `fingerprintText` to skip unchanged documents:

```js
const fs = require("fs");
const quarrel = require("@watthem/quarrel");

// Load last run's fingerprints
let prev = {};
try { prev = JSON.parse(fs.readFileSync("fingerprints.json", "utf-8")); } catch {}

const docs = loadYourDocuments();
const changed = [];
const current = {};

for (const doc of docs) {
  const fp = quarrel.fingerprintText(doc.content);
  current[doc.id] = fp;
  if (prev[doc.id] !== fp) changed.push(doc);
}

console.log(`${changed.length} of ${docs.length} documents changed`);
fs.writeFileSync("fingerprints.json", JSON.stringify(current));
```

The fingerprint is a short hex string. Same content always gives the same hash. Different content (even a single character) gives a different one.

## Compare Just Two Documents

You don't always need a full corpus. Here's a quick pairwise check:

```js
const quarrel = require("@watthem/quarrel");

const textA = quarrel.buildEmbeddingText({
  title: "First doc",
  content: "Content of the first document..."
});
const textB = quarrel.buildEmbeddingText({
  title: "Second doc",
  content: "Content of the second document..."
});

const { vectors } = quarrel.buildHashedTfidfVectors([textA, textB], {
  hashDim: 2048
});

const score = quarrel.cosineSimilarity(vectors[0], vectors[1]);
console.log(`Similarity: ${(score * 100).toFixed(1)}%`);
```

One thing to know: scores are relative to the corpus you vectorize against. A two-document comparison will weight terms differently than a 500-document one.

## Clean Markdown Without Vectorizing

If you just want the text-processing parts:

```js
// Strip only frontmatter
const body = quarrel.stripFrontmatter(rawMarkdown);

// Strip everything: frontmatter, code blocks, links, formatting
const plain = quarrel.normalizeMarkdown(rawMarkdown);

// Get individual words (lowercased, stopwords removed)
const words = quarrel.tokenize(plain);
```

`vectorizeDocuments` does all of this internally. These are here if you're building something custom.

## Add "Related Posts" to an 11ty Site

```js
// eleventy.config.js
const quarrel = require("@watthem/quarrel");

module.exports = function (eleventyConfig) {
  eleventyConfig.addCollection("postsWithSimilar", function (collectionApi) {
    const posts = collectionApi.getFilteredByTag("post");

    const docs = posts.map((post) => ({
      id: post.fileSlug,
      title: post.data.title || post.fileSlug,
      content: post.template.frontMatter.content
    }));

    const { vectors } = quarrel.vectorizeDocuments(docs, {
      useHashing: true,
      hashDim: 2048,
      contentExcerptLength: 1000
    });

    const items = docs.map((doc, i) => ({
      id: doc.id,
      title: doc.title,
      embedding: vectors[i]
    }));

    const matches = quarrel.calculateSimilarities(items, { maxSimilar: 3 });

    for (const post of posts) {
      post.data.similar = matches[post.fileSlug] || [];
    }

    return posts;
  });
};
```

Then in your template:

```njk
{% if similar.length %}
<h2>Related Posts</h2>
<ul>
  {% for item in similar %}
  <li><a href="/posts/{{ item.id }}/">{{ item.title }}</a></li>
  {% endfor %}
</ul>
{% endif %}
```

## Control How Much Content Gets Used

By default, Quarrel uses the first 500 characters of each document's content. For longer documents where important topics appear later:

```js
const { vectors } = quarrel.vectorizeDocuments(docs, {
  contentExcerptLength: 1500
});
```

Longer excerpts catch more topics but take more processing. For short notes, the default is usually fine.
