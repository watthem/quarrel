/**
 * Minimal Obsidian Similar Notes Example
 *
 * A lite starter for building your own similar notes plugin.
 * For a full implementation, see: https://github.com/watthem/quarrel-similar-notes
 */

// Use relative path for local development/testing, package name when installed
const quarrel = require("../index.cjs");

class SimilarNotesIndex {
  constructor(app, options = {}) {
    this.app = app;
    this.options = {
      maxResults: 5,
      minSimilarity: 0.1,
      useHashing: true,
      hashDim: 2048,
      ...options,
    };
    this.documents = [];
    this.vectors = [];
  }

  /**
   * Build or rebuild the similarity index from all vault files.
   * Must be called before findSimilar() will return results.
   */
  async buildIndex() {
    const files = this.app.vault.getMarkdownFiles();

    this.documents = await Promise.all(
      files.map(async (file) => ({
        id: file.path,
        title: file.basename,
        path: file.path,
        content: await this.app.vault.cachedRead(file),
      }))
    );

    if (this.documents.length === 0) return;

    const { vectors } = quarrel.vectorizeDocuments(this.documents, this.options);
    this.vectors = vectors;
  }

  /**
   * Find similar notes for a given file.
   * @param {TFile} file The note to find matches for
   * @returns {Array} Similar notes with path, title, and score
   */
  findSimilar(file) {
    const idx = this.documents.findIndex((d) => d.path === file.path);
    if (idx === -1) return [];

    return this.documents
      .map((doc, i) => ({
        path: doc.path,
        title: doc.title,
        score: quarrel.cosineSimilarity(this.vectors[idx], this.vectors[i]),
      }))
      .filter((r) => r.path !== file.path && r.score >= this.options.minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.options.maxResults);
  }
}

module.exports = { SimilarNotesIndex };
