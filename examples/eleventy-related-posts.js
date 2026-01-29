/**
 * 11ty Related Posts Plugin
 * 
 * Generates a "related posts" feature for your Eleventy blog
 * by computing TF-IDF similarity between post content.
 * 
 * Usage in .eleventy.js:
 * 
 *   const relatedPosts = require("./eleventy-related-posts");
 *   eleventyConfig.addPlugin(relatedPosts.plugin, {
 *     maxRelated: 3,
 *     minSimilarity: 0.1,
 *     useHashing: true
 *   });
 * 
 * Then in your template:
 * 
 *   {% for post in related %}
 *     <a href="{{ post.url }}">{{ post.title }}</a>
 *   {% endfor %}
 */

// Use relative path for local development/testing, package name when installed
const similarity = require("../index.js");

function plugin(eleventyConfig, options = {}) {
  const {
    maxRelated = 3,
    minSimilarity = 0.1,
    useHashing = true,
    hashDim = 2048,
    contentExcerptLength = 1000,
  } = options;

  eleventyConfig.addFilter("relatedPosts", function (post, allPosts) {
    if (!post || !allPosts || allPosts.length === 0) return [];

    // Filter to posts of similar type/category, exclude self
    const candidates = allPosts.filter(
      (p) => p !== post && p.data?.permalink !== post.data?.permalink
    );

    if (candidates.length === 0) return [];

    // Prepare documents for vectorization
    const docs = [post, ...candidates].map((doc) => ({
      id: doc.data?.permalink || doc.url,
      title: doc.data?.title || "",
      content: doc.content || "",
    }));

    try {
      // Vectorize all documents
      const { vectors } = similarity.vectorizeDocuments(docs, {
        contentExcerptLength,
        useHashing,
        hashDim,
      });

      // Get similarity scores between the first doc (our post) and others
      const scores = vectors.slice(1).map((vec, idx) => ({
        post: candidates[idx],
        similarity: similarity.cosineSimilarity(vectors[0], vec),
      }));

      // Filter by minimum similarity and sort
      return scores
        .filter((s) => s.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxRelated)
        .map((s) => s.post);
    } catch (err) {
      console.error("Error computing related posts:", err);
      return [];
    }
  });
}

module.exports = { plugin };
