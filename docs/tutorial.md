# Tutorial: Find Similar Notes

You have a pile of notes. You want to know which ones overlap. Let's build that.

## What You'll Make

A script that reads documents and prints the most related pairs. The whole thing is about 15 lines.

## Setup

```bash
npm i @watthem/quarrel
```

Create a file called `find-similar.js`.

## Step 1: Define Some Documents

```js
const quarrel = require("@watthem/quarrel");

const docs = [
  {
    id: "note-1",
    title: "JavaScript Closures",
    content: "A closure captures variables from its surrounding scope. Closures enable patterns like data privacy and function factories."
  },
  {
    id: "note-2",
    title: "Python Decorators",
    content: "Decorators modify other functions. They use the @syntax and are commonly used for logging, authentication, and caching."
  },
  {
    id: "note-3",
    title: "Functional Programming",
    content: "Functional programming emphasizes pure functions, closures, and higher-order functions. JavaScript supports these through first-class functions."
  },
  {
    id: "note-4",
    title: "Web Authentication",
    content: "Authentication on the web involves tokens, sessions, or OAuth. Common patterns include JWT and cookie-based sessions."
  }
];
```

Notes 1 and 3 share vocabulary (closures, JavaScript, functions). Notes 2 and 4 share a weaker link (authentication). Let's see if Quarrel picks that up.

## Step 2: Turn Text into Numbers

```js
const { vectors } = quarrel.vectorizeDocuments(docs, {
  useHashing: true,
  hashDim: 2048
});
```

Each document is now a list of 2048 numbers that represent what it's about. Quarrel handled the markdown cleanup, word splitting, and weighting automatically.

## Step 3: Find the Matches

```js
const items = docs.map((doc, i) => ({
  id: doc.id,
  title: doc.title,
  embedding: vectors[i]
}));

const matches = quarrel.calculateSimilarities(items, { maxSimilar: 3 });
```

## Step 4: Print the Results

```js
for (const [id, similar] of Object.entries(matches)) {
  const doc = docs.find((d) => d.id === id);
  console.log(`\n${doc.title}:`);
  for (const match of similar) {
    console.log(`  ${match.title} (${(match.similarity * 100).toFixed(1)}%)`);
  }
}
```

Run it:

```bash
node find-similar.js
```

The closures note and functional programming note should come out as the strongest pair. That tracks — they share the most meaningful words.

## Step 5: Use Real Files

Replace the hardcoded array with files on disk:

```js
const fs = require("fs");
const path = require("path");
const quarrel = require("@watthem/quarrel");

const notesDir = "./notes";
const files = fs.readdirSync(notesDir).filter((f) => f.endsWith(".md"));

const docs = files.map((file) => ({
  id: file,
  title: path.basename(file, ".md"),
  content: fs.readFileSync(path.join(notesDir, file), "utf-8")
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

const matches = quarrel.calculateSimilarities(items, { maxSimilar: 5 });

for (const [id, similar] of Object.entries(matches)) {
  console.log(`\n${id}:`);
  for (const match of similar) {
    console.log(`  ${match.title} (${(match.similarity * 100).toFixed(1)}%)`);
  }
}
```

Quarrel strips frontmatter and markdown formatting automatically, so you can feed it raw `.md` files.

## What Just Happened

1. `vectorizeDocuments` cleaned up your text and turned it into numbers
2. `calculateSimilarities` compared every pair and ranked the results
3. Same inputs always give the same scores — nothing random here

That's the core loop. The [How-To Guide](./guide.md) covers real-world recipes like static site integration and performance tuning. If you're curious about *why* this works, the [explainer](./explainer.md) walks through it without the math jargon.
