# How It Works

Quarrel turns documents into numbers, then measures how close those numbers are. This page explains what that means — no math background needed.

## The Core Idea

You can't ask a computer "are these two articles about the same thing?" directly. Computers don't read. But you *can* ask "do these two articles use the same words in the same proportions?" That turns out to be a surprisingly good proxy for topical similarity.

Quarrel does this in three steps:

```
Text → Word Profile → Similarity Score
```

## Step 1: Clean Up and Split

Raw documents are noisy. A markdown file has YAML headers, code fences, links, and bold markers — none of which tell you what the document is *about*. Quarrel strips all of that, then breaks the plain text into individual words.

It also throws away "filler" words like "the", "and", "is" — words so common they don't help distinguish one document from another. What's left is a list of meaningful terms.

```
"# My Note\n\nThe **quick** brown fox" → ["quick", "brown", "fox"]
```

## Step 2: Weight the Words

Not all words are equally useful. If you're comparing blog posts and every single one contains the word "code," that word tells you nothing. But if only one post mentions "websockets," that's a strong signal.

Quarrel uses a technique called **TF-IDF** to capture this:

- **Term frequency**: how often a word appears in *this* document. More mentions = more relevant to this document.
- **Inverse document frequency**: how rare a word is across *all* documents. Rarer words = stronger signal.

Multiply those together and you get a score for each word in each document. Words that are frequent here but rare everywhere else score highest. Words that appear everywhere score near zero.

### Making Length Irrelevant

A 10,000-word article will naturally have higher word counts than a 200-word note. To keep the comparison fair, Quarrel normalizes each document's scores so they all have the same overall "size." This way, a short note and a long article on the same topic still look similar.

## Step 3: Compare

Each document is now a list of numbers — one number per word in the vocabulary. Two documents that use the same important words in similar proportions will have similar lists.

Quarrel measures this with **cosine similarity**: how much do these two lists point in the same direction?

- **1.0** — same word profile (probably the same document)
- **0.0** — no overlap at all
- Somewhere in between — partial overlap, which is where things get interesting

## Standard Mode vs. Feature Hashing

There are two ways to build those word profiles, and which one you pick depends on what you care about.

### Standard Mode

Quarrel scans every document, builds a vocabulary of all the words it finds, and assigns each word a position. Your vectors are as long as the vocabulary.

This is fully transparent — you can look at the vocabulary and see exactly which words drive the similarity. The downside is that the vocabulary changes if your documents change, which means old vectors become stale.

### Feature Hashing

Instead of tracking vocabulary, Quarrel runs each word through a hash function that converts it to a number. That number becomes the word's position in a fixed-size vector (2048 slots by default).

This is faster and uses constant memory. The tradeoff is **collisions**: two different words might hash to the same slot, blurring their signals slightly. In practice, with 2048 slots and a few hundred unique words, this rarely matters. If it does, increase the size.

### How to Decide

Start with hashing. It's simpler and works well for most cases. Use standard mode when you need to inspect or explain the results — like debugging why two documents score higher than expected.

## Fingerprinting (Bonus)

Separate from the similarity pipeline, Quarrel can hash an entire document into a short string. If the string changes, the content changed. This is useful for skipping re-processing on documents that haven't been edited since your last run.

It's fast and deterministic, but it's not a security feature — it's a convenience.

## Putting It All Together

| What happens | What it does |
|---|---|
| Strip markdown | Remove formatting noise |
| Tokenize | Extract meaningful words |
| TF-IDF weighting | Score words by importance |
| Normalize | Make document lengths comparable |
| Cosine similarity | Measure topic overlap (0–1) |

The whole pipeline is deterministic. Same inputs, same scores, every time. No randomness, no external calls, no API keys.

Want to see this in action? The [tutorial](./tutorial.md) builds a working example in about 15 lines. The [guide](./guide.md) covers practical recipes for real projects.
