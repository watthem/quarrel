/**
 * Obsidian Similar Notes Plugin
 * 
 * Find semantically similar notes in your vault using TF-IDF similarity.
 * This can be used to suggest backlinks, create "related notes" sidebars,
 * or power a search interface.
 * 
 * Usage in your plugin's onload():
 * 
 *   const similarNotes = new SimilarNotesIndex(this.app);
 *   this.registerCommand({
 *     id: "find-similar",
 *     name: "Find similar notes",
 *     callback: () => similarNotes.showSimilarForCurrent()
 *   });
 */

// Use relative path for local development/testing, package name when installed
const similarity = require("../index.cjs");

class SimilarNotesIndex {
  constructor(app, options = {}) {
    this.app = app;
    this.options = {
      maxResults: 5,
      minSimilarity: 0.15,
      useHashing: true,
      hashDim: 2048,
      contentExcerptLength: 1500,
      ...options,
    };
    this.index = null;
    this.documents = null;
    this.vectors = null;
    this.buildIndex();
  }

  /**
   * Build or rebuild the similarity index from all vault files
   */
  buildIndex() {
    try {
      const markdownFiles = this.app.vault.getMarkdownFiles();
      
      this.documents = markdownFiles.map((file) => ({
        id: file.path,
        title: file.basename,
        path: file.path,
        content: this.app.vault.read(file) || "",
      }));

      if (this.documents.length === 0) return;

      // Vectorize all documents once
      const { vectors } = similarity.vectorizeDocuments(
        this.documents,
        this.options
      );

      this.vectors = vectors;
    } catch (err) {
      console.error("Error building similarity index:", err);
      this.documents = [];
      this.vectors = [];
    }
  }

  /**
   * Find similar notes for a given file
   * @param {TFile} file The note to find matches for
   * @param {number} limit Max results to return
   * @returns {Array} Similar notes with similarity scores
   */
  findSimilar(file, limit = null) {
    if (!this.documents || !this.vectors) return [];

    const limit_ = limit || this.options.maxResults;
    const docIdx = this.documents.findIndex((d) => d.path === file.path);
    if (docIdx === -1) return [];

    const currentVector = this.vectors[docIdx];

    // Calculate similarity with all other documents
    const scores = this.documents
      .map((doc, idx) => ({
        file: { ...doc, isSelf: idx === docIdx },
        score: similarity.cosineSimilarity(currentVector, this.vectors[idx]),
      }))
      .filter(
        (s) => !s.file.isSelf && s.score >= this.options.minSimilarity
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit_);

    return scores;
  }

  /**
   * Find similar notes for the currently active file
   * @returns {Array} Similar notes with file objects and scores
   */
  findSimilarForCurrent() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return [];
    return this.findSimilar(activeFile);
  }

  /**
   * Display similar notes in a modal/panel
   * Requires obsidian module for UI, but returns structured data
   */
  getSimilarNotes(file) {
    const results = this.findSimilar(file);
    return results.map((r) => ({
      path: r.file.path,
      title: r.file.title,
      similarity: r.score,
      percentage: Math.round(r.score * 100),
    }));
  }
}

module.exports = SimilarNotesIndex;
