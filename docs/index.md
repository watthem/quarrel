# Quarrel

A tiny JavaScript library that answers one question: **which of my documents are about the same thing?**

No dependencies. No server. Works in Node, the browser, and Obsidian.

## Install

```bash
npm i @watthem/quarrel
```

## The Short Version

Give Quarrel some documents. Get back a ranked list of which ones are most alike.

```js
const quarrel = require("@watthem/quarrel");

const docs = [
  { id: "a", title: "Hello", content: "Hello world note" },
  { id: "b", title: "Second", content: "Another note about world" }
];

const { vectors } = quarrel.vectorizeDocuments(docs, {
  useHashing: true,
  hashDim: 2048
});

const items = docs.map((doc, i) => ({
  id: doc.id,
  title: doc.title,
  embedding: vectors[i]
}));

const matches = quarrel.calculateSimilarities(items, { maxSimilar: 5 });
```

That's it. No API keys, no training, no configuration files.

## Where to Go Next

- **[Tutorial](./tutorial.md)** — Build a "related notes" feature in 10 lines. Start here.
- **[How-To Guide](./guide.md)** — Recipes for real-world tasks: static sites, change detection, tuning accuracy.
- **[API Reference](./reference.md)** — Every function, every option, every return value.
- **[How It Works](./explainer.md)** — What's actually happening under the hood, without the math jargon.
