"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/.pnpm/@watthem+quarrel@0.1.1/node_modules/@watthem/quarrel/index.cjs
var require_quarrel = __commonJS({
  "node_modules/.pnpm/@watthem+quarrel@0.1.1/node_modules/@watthem/quarrel/index.cjs"(exports2, module2) {
    "use strict";
    function stripFrontmatter(text) {
      if (!text.startsWith("---"))
        return text;
      const end = text.indexOf("\n---", 3);
      if (end === -1)
        return text;
      return text.slice(end + 4);
    }
    function normalizeMarkdown(text) {
      let cleaned = stripFrontmatter(text);
      cleaned = cleaned.replace(/```[\s\S]*?```/g, " ");
      cleaned = cleaned.replace(/`[^`]*`/g, " ");
      cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
      cleaned = cleaned.replace(/\[[^\]]*\]\([^)]*\)/g, " ");
      cleaned = cleaned.replace(/^>\s?/gm, " ");
      cleaned = cleaned.replace(/^#+\s+/gm, " ");
      cleaned = cleaned.replace(/[*_~`]/g, " ");
      cleaned = cleaned.replace(/\s+/g, " ").trim();
      return cleaned;
    }
    var DEFAULT_STOPWORDS = /* @__PURE__ */ new Set([
      "a",
      "an",
      "and",
      "are",
      "as",
      "at",
      "be",
      "but",
      "by",
      "for",
      "from",
      "has",
      "have",
      "he",
      "her",
      "his",
      "i",
      "if",
      "in",
      "is",
      "it",
      "its",
      "me",
      "my",
      "not",
      "of",
      "on",
      "or",
      "our",
      "she",
      "so",
      "that",
      "the",
      "their",
      "them",
      "there",
      "they",
      "this",
      "to",
      "us",
      "was",
      "we",
      "were",
      "what",
      "when",
      "where",
      "who",
      "why",
      "will",
      "with",
      "you",
      "your"
    ]);
    function hashToken(text) {
      let hash = 2166136261;
      for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = hash * 16777619 >>> 0;
      }
      return hash;
    }
    function tokenize(text, options) {
      var _a, _b;
      const minTokenLength = (_a = options == null ? void 0 : options.minTokenLength) != null ? _a : 3;
      const stopwords = (_b = options == null ? void 0 : options.stopwords) != null ? _b : DEFAULT_STOPWORDS;
      return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((token) => token.length >= minTokenLength && !stopwords.has(token));
    }
    function buildEmbeddingText(input, options) {
      var _a;
      const title = input.title || "";
      const content = normalizeMarkdown(input.content || "");
      const limit = (_a = options == null ? void 0 : options.contentExcerptLength) != null ? _a : 500;
      const excerpt = content.slice(0, limit);
      return `${title} ${excerpt}`.trim();
    }
    function fingerprintText2(text) {
      let hash = 2166136261;
      for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = hash * 16777619 >>> 0;
      }
      return hash.toString(16).padStart(8, "0");
    }
    function cosineSimilarity2(vecA, vecB) {
      if (!vecA || !vecB || vecA.length !== vecB.length) {
        return 0;
      }
      const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
      const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
      const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
      if (magnitudeA === 0 || magnitudeB === 0)
        return 0;
      return dotProduct / (magnitudeA * magnitudeB);
    }
    function calculateSimilarities(items, options) {
      var _a;
      const maxSimilar = (_a = options == null ? void 0 : options.maxSimilar) != null ? _a : 5;
      const similarities = {};
      for (let i = 0; i < items.length; i++) {
        const a = items[i];
        similarities[a.id] = [];
        for (let j = 0; j < items.length; j++) {
          if (i === j)
            continue;
          const b = items[j];
          const similarity = cosineSimilarity2(a.embedding, b.embedding);
          similarities[a.id].push({ id: b.id, title: b.title, similarity });
        }
        similarities[a.id].sort((x, y) => y.similarity - x.similarity);
        similarities[a.id] = similarities[a.id].slice(0, maxSimilar);
      }
      return similarities;
    }
    function buildTfidfVectors(texts, options) {
      var _a, _b;
      const tokenized = texts.map((text) => tokenize(text, options));
      const docCount = tokenized.length;
      const dfCounts = /* @__PURE__ */ new Map();
      const tfCountsPerDoc = tokenized.map((tokens) => {
        var _a2, _b2;
        const tf = /* @__PURE__ */ new Map();
        for (const token of tokens) {
          tf.set(token, ((_a2 = tf.get(token)) != null ? _a2 : 0) + 1);
        }
        for (const token of new Set(tokens)) {
          dfCounts.set(token, ((_b2 = dfCounts.get(token)) != null ? _b2 : 0) + 1);
        }
        return tf;
      });
      const maxVocab = (_a = options == null ? void 0 : options.maxVocab) != null ? _a : 5e3;
      const vocab = Array.from(dfCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, maxVocab).map(([token]) => token);
      const idf = /* @__PURE__ */ new Map();
      for (const token of vocab) {
        const df = (_b = dfCounts.get(token)) != null ? _b : 1;
        idf.set(token, Math.log((docCount + 1) / (df + 1)) + 1);
      }
      const vectors = tfCountsPerDoc.map((tf) => {
        var _a2, _b2;
        const vec = new Array(vocab.length).fill(0);
        let norm = 0;
        for (let i = 0; i < vocab.length; i++) {
          const token = vocab[i];
          const tfVal = (_a2 = tf.get(token)) != null ? _a2 : 0;
          if (tfVal === 0)
            continue;
          const value = tfVal * ((_b2 = idf.get(token)) != null ? _b2 : 0);
          vec[i] = value;
          norm += value * value;
        }
        norm = Math.sqrt(norm);
        if (norm > 0) {
          for (let i = 0; i < vec.length; i++) {
            vec[i] = vec[i] / norm;
          }
        }
        return vec;
      });
      return { vectors, vocab };
    }
    function buildHashedTfidfVectors(texts, options) {
      var _a;
      const hashDim = (_a = options == null ? void 0 : options.hashDim) != null ? _a : 2048;
      const tokenized = texts.map((text) => tokenize(text, options));
      const docCount = tokenized.length;
      const dfCounts = new Array(hashDim).fill(0);
      const tfCountsPerDoc = tokenized.map((tokens) => {
        const tf = new Array(hashDim).fill(0);
        const seen = /* @__PURE__ */ new Set();
        for (const token of tokens) {
          const idx = hashToken(token) % hashDim;
          tf[idx] += 1;
          if (!seen.has(idx)) {
            seen.add(idx);
          }
        }
        for (const idx of seen) {
          dfCounts[idx] += 1;
        }
        return tf;
      });
      const vectors = tfCountsPerDoc.map((tf) => {
        const vec = new Array(hashDim).fill(0);
        let norm = 0;
        for (let i = 0; i < hashDim; i++) {
          const tfVal = tf[i];
          if (tfVal === 0)
            continue;
          const idf = Math.log((docCount + 1) / (dfCounts[i] + 1)) + 1;
          const value = tfVal * idf;
          vec[i] = value;
          norm += value * value;
        }
        norm = Math.sqrt(norm);
        if (norm > 0) {
          for (let i = 0; i < vec.length; i++) {
            vec[i] = vec[i] / norm;
          }
        }
        return vec;
      });
      return { vectors };
    }
    function vectorizeDocuments2(docs, options) {
      const texts = docs.map(
        (doc) => {
          var _a, _b;
          return buildEmbeddingText(
            { title: (_a = doc.title) != null ? _a : "", content: doc.content },
            { contentExcerptLength: (_b = options == null ? void 0 : options.contentExcerptLength) != null ? _b : 500 }
          );
        }
      );
      if (options == null ? void 0 : options.useHashing) {
        const { vectors: vectors2 } = buildHashedTfidfVectors(texts, options);
        return { vectors: vectors2, texts };
      }
      const { vectors, vocab } = buildTfidfVectors(texts, options);
      return { vectors, vocab, texts };
    }
    module2.exports = {
      stripFrontmatter,
      normalizeMarkdown,
      tokenize,
      buildEmbeddingText,
      buildTfidfVectors,
      buildHashedTfidfVectors,
      vectorizeDocuments: vectorizeDocuments2,
      fingerprintText: fingerprintText2,
      cosineSimilarity: cosineSimilarity2,
      calculateSimilarities
    };
  }
});

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => QuarrelSimilarNotesPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var quarrel = __toESM(require_quarrel(), 1);
var VIEW_TYPE = "quarrel-similar-notes";
var DEFAULT_SETTINGS = {
  maxResults: 6,
  minSimilarity: 0.15,
  hashDim: 2048,
  contentExcerptLength: 1500,
  openOnStart: true
};
var SimilarityIndex = class {
  constructor(app, settings) {
    this.documents = [];
    this.vectors = [];
    this.pathToIndex = /* @__PURE__ */ new Map();
    this.fingerprints = /* @__PURE__ */ new Map();
    this.indexing = false;
    this.dirty = false;
    this.lastBuiltAt = null;
    this.app = app;
    this.settings = settings;
  }
  updateSettings(settings) {
    this.settings = settings;
  }
  markDirty() {
    this.dirty = true;
  }
  isDirty() {
    return this.dirty;
  }
  isIndexing() {
    return this.indexing;
  }
  isReady() {
    return this.documents.length > 0 && this.vectors.length > 0 && !this.indexing;
  }
  getLastBuiltAt() {
    return this.lastBuiltAt;
  }
  async rebuild() {
    if (this.indexing)
      return;
    this.indexing = true;
    this.dirty = false;
    const files = this.app.vault.getMarkdownFiles();
    const documents = [];
    for (const file of files) {
      const content = await this.app.vault.cachedRead(file);
      documents.push({
        path: file.path,
        title: file.basename,
        content
      });
    }
    if (documents.length === 0) {
      this.documents = [];
      this.vectors = [];
      this.pathToIndex.clear();
      this.fingerprints.clear();
      this.indexing = false;
      return;
    }
    const { vectors } = quarrel.vectorizeDocuments(documents, {
      useHashing: true,
      hashDim: this.settings.hashDim,
      contentExcerptLength: this.settings.contentExcerptLength
    });
    this.documents = documents;
    this.vectors = vectors;
    this.pathToIndex.clear();
    this.fingerprints.clear();
    documents.forEach((doc, index) => {
      this.pathToIndex.set(doc.path, index);
      this.fingerprints.set(doc.path, quarrel.fingerprintText(doc.content));
    });
    this.lastBuiltAt = /* @__PURE__ */ new Date();
    this.indexing = false;
  }
  async checkForChanges() {
    const files = this.app.vault.getMarkdownFiles();
    const filePaths = new Set(files.map((file) => file.path));
    if (filePaths.size !== this.documents.length) {
      this.dirty = true;
      return true;
    }
    for (const file of files) {
      const previous = this.fingerprints.get(file.path);
      if (!previous) {
        this.dirty = true;
        return true;
      }
      const content = await this.app.vault.cachedRead(file);
      const current = quarrel.fingerprintText(content);
      if (current !== previous) {
        this.dirty = true;
        return true;
      }
    }
    return false;
  }
  getSimilarNotes(file) {
    if (!this.isReady())
      return [];
    const currentIndex = this.pathToIndex.get(file.path);
    if (currentIndex === void 0)
      return [];
    const currentVector = this.vectors[currentIndex];
    const scored = this.documents.map((doc, index) => ({
      doc,
      similarity: quarrel.cosineSimilarity(currentVector, this.vectors[index]),
      isSelf: index === currentIndex
    })).filter((entry) => !entry.isSelf).filter((entry) => entry.similarity >= this.settings.minSimilarity).sort((a, b) => b.similarity - a.similarity).slice(0, this.settings.maxResults);
    return scored.map((entry) => ({
      path: entry.doc.path,
      title: entry.doc.title,
      similarity: entry.similarity
    }));
  }
};
var SimilarNotesView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "Similar Notes";
  }
  async onOpen() {
    this.addAction("refresh-cw", "Rebuild index", () => {
      void this.plugin.rebuildIndex();
    });
    this.addAction("search", "Check for changes", () => {
      void this.plugin.checkForChanges();
    });
    this.render();
  }
  render() {
    const container = this.contentEl;
    container.empty();
    container.addClass("quarrel-similar-notes");
    const status = container.createDiv({ cls: "status" });
    const lastBuiltAt = this.plugin.index.getLastBuiltAt();
    if (this.plugin.index.isIndexing()) {
      status.setText("Indexing vault...");
      return;
    }
    if (!this.plugin.index.isReady()) {
      status.setText("Index not built yet.");
      return;
    }
    if (lastBuiltAt) {
      status.setText(`Indexed ${lastBuiltAt.toLocaleString()}`);
    }
    if (this.plugin.index.isDirty()) {
      container.createDiv({
        cls: "warning",
        text: "Index is out of date. Click Rebuild to refresh."
      });
    }
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      container.createDiv({ text: "Open a note to see similar notes." });
      return;
    }
    const results = this.plugin.index.getSimilarNotes(activeFile);
    if (results.length === 0) {
      container.createDiv({ text: "No similar notes found." });
      return;
    }
    for (const result of results) {
      const row = container.createDiv({ cls: "note-row" });
      row.createDiv({ cls: "note-title", text: result.title });
      row.createDiv({
        cls: "note-score",
        text: `${Math.round(result.similarity * 100)}%`
      });
      row.addEventListener("click", () => {
        var _a;
        const sourcePath = (_a = activeFile.path) != null ? _a : "";
        void this.app.workspace.openLinkText(result.path, sourcePath, false);
      });
    }
  }
};
var SimilarNotesSettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Max results").setDesc("Number of similar notes to show.").addText(
      (text) => text.setPlaceholder("6").setValue(String(this.plugin.settings.maxResults)).onChange(async (value) => {
        const next = Number(value);
        if (!Number.isFinite(next) || next <= 0)
          return;
        this.plugin.settings.maxResults = next;
        await this.plugin.saveSettings();
        this.plugin.index.updateSettings(this.plugin.settings);
        this.plugin.refreshView();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Min similarity").setDesc("Hide matches below this similarity score.").addText(
      (text) => text.setPlaceholder("0.15").setValue(String(this.plugin.settings.minSimilarity)).onChange(async (value) => {
        const next = Number(value);
        if (!Number.isFinite(next) || next < 0 || next > 1)
          return;
        this.plugin.settings.minSimilarity = next;
        await this.plugin.saveSettings();
        this.plugin.index.updateSettings(this.plugin.settings);
        this.plugin.refreshView();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Hash dimension").setDesc("Vector size for hashed TF-IDF. Higher = more precise, more memory.").addText(
      (text) => text.setPlaceholder("2048").setValue(String(this.plugin.settings.hashDim)).onChange(async (value) => {
        const next = Number(value);
        if (!Number.isFinite(next) || next <= 0)
          return;
        this.plugin.settings.hashDim = next;
        await this.plugin.saveSettings();
        this.plugin.index.updateSettings(this.plugin.settings);
        await this.plugin.rebuildIndex();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Content excerpt length").setDesc("How many characters per note are used for similarity.").addText(
      (text) => text.setPlaceholder("1500").setValue(String(this.plugin.settings.contentExcerptLength)).onChange(async (value) => {
        const next = Number(value);
        if (!Number.isFinite(next) || next <= 0)
          return;
        this.plugin.settings.contentExcerptLength = next;
        await this.plugin.saveSettings();
        this.plugin.index.updateSettings(this.plugin.settings);
        await this.plugin.rebuildIndex();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Open panel on start").setDesc("Automatically open the Similar Notes panel on launch.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.openOnStart).onChange(async (value) => {
        this.plugin.settings.openOnStart = value;
        await this.plugin.saveSettings();
      })
    );
  }
};
var QuarrelSimilarNotesPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.index = new SimilarityIndex(this.app, this.settings);
    void this.rebuildIndex();
    this.registerView(
      VIEW_TYPE,
      (leaf) => new SimilarNotesView(leaf, this)
    );
    this.addCommand({
      id: "open-similar-notes-panel",
      name: "Open Similar Notes panel",
      callback: () => void this.activateView()
    });
    this.addCommand({
      id: "rebuild-similar-notes-index",
      name: "Rebuild Similar Notes index",
      callback: () => void this.rebuildIndex()
    });
    this.addCommand({
      id: "check-similar-notes-changes",
      name: "Check Similar Notes for changes",
      callback: () => void this.checkForChanges()
    });
    this.addSettingTab(new SimilarNotesSettingsTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.refreshView())
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian.TFile && file.extension === "md") {
          this.index.markDirty();
          this.refreshView();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (file) => {
        if (file instanceof import_obsidian.TFile && file.extension === "md") {
          this.index.markDirty();
          this.refreshView();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof import_obsidian.TFile && file.extension === "md") {
          this.index.markDirty();
          this.refreshView();
        }
      })
    );
    if (this.settings.openOnStart) {
      await this.activateView();
    }
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }
  async activateView() {
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf)
      return;
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
  refreshView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof SimilarNotesView) {
        view.render();
      }
    }
  }
  async rebuildIndex() {
    new import_obsidian.Notice("Building similar notes index...");
    await this.index.rebuild();
    new import_obsidian.Notice("Similar notes index ready.");
    this.refreshView();
  }
  async checkForChanges() {
    const changed = await this.index.checkForChanges();
    if (changed) {
      new import_obsidian.Notice("Changes detected. Rebuild the index to refresh results.");
    } else {
      new import_obsidian.Notice("No changes detected.");
    }
    this.refreshView();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZV9tb2R1bGVzLy5wbnBtL0B3YXR0aGVtK3F1YXJyZWxAMC4xLjEvbm9kZV9tb2R1bGVzL0B3YXR0aGVtL3F1YXJyZWwvaW5kZXguY2pzIiwgIm1haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIlwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIE1pbmltYWwsIGVudmlyb25tZW50LWFnbm9zdGljIHNpbWlsYXJpdHkgaGVscGVycy5cbiAqIENvbW1vbkpTIHRvIHN1cHBvcnQgTm9kZSAoMTF0eSkgYW5kIE9ic2lkaWFuIChidW5kbGVkIENKUykuXG4gKi9cblxuLyoqXG4gKiBSZW1vdmUgWUFNTCBmcm9udG1hdHRlciBpZiBwcmVzZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHN0cmlwRnJvbnRtYXR0ZXIodGV4dCkge1xuICBpZiAoIXRleHQuc3RhcnRzV2l0aChcIi0tLVwiKSkgcmV0dXJuIHRleHQ7XG4gIGNvbnN0IGVuZCA9IHRleHQuaW5kZXhPZihcIlxcbi0tLVwiLCAzKTtcbiAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiB0ZXh0O1xuICByZXR1cm4gdGV4dC5zbGljZShlbmQgKyA0KTtcbn1cblxuLyoqXG4gKiBCYXNpYyBtYXJrZG93biBub3JtYWxpemF0aW9uIHNvIGVtYmVkZGluZ3MgZm9jdXMgb24gd29yZHMsIG5vdCBzeW50YXguXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplTWFya2Rvd24odGV4dCkge1xuICBsZXQgY2xlYW5lZCA9IHN0cmlwRnJvbnRtYXR0ZXIodGV4dCk7XG4gIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL2BgYFtcXHNcXFNdKj9gYGAvZywgXCIgXCIpO1xuICBjbGVhbmVkID0gY2xlYW5lZC5yZXBsYWNlKC9gW15gXSpgL2csIFwiIFwiKTtcbiAgY2xlYW5lZCA9IGNsZWFuZWQucmVwbGFjZSgvIVxcW1teXFxdXSpcXF1cXChbXildKlxcKS9nLCBcIiBcIik7XG4gIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL1xcW1teXFxdXSpcXF1cXChbXildKlxcKS9nLCBcIiBcIik7XG4gIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL14+XFxzPy9nbSwgXCIgXCIpO1xuICBjbGVhbmVkID0gY2xlYW5lZC5yZXBsYWNlKC9eIytcXHMrL2dtLCBcIiBcIik7XG4gIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL1sqX35gXS9nLCBcIiBcIik7XG4gIGNsZWFuZWQgPSBjbGVhbmVkLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKTtcbiAgcmV0dXJuIGNsZWFuZWQ7XG59XG5cbmNvbnN0IERFRkFVTFRfU1RPUFdPUkRTID0gbmV3IFNldChbXG4gIFwiYVwiLCBcImFuXCIsIFwiYW5kXCIsIFwiYXJlXCIsIFwiYXNcIiwgXCJhdFwiLCBcImJlXCIsIFwiYnV0XCIsIFwiYnlcIiwgXCJmb3JcIiwgXCJmcm9tXCIsXG4gIFwiaGFzXCIsIFwiaGF2ZVwiLCBcImhlXCIsIFwiaGVyXCIsIFwiaGlzXCIsIFwiaVwiLCBcImlmXCIsIFwiaW5cIiwgXCJpc1wiLCBcIml0XCIsIFwiaXRzXCIsXG4gIFwibWVcIiwgXCJteVwiLCBcIm5vdFwiLCBcIm9mXCIsIFwib25cIiwgXCJvclwiLCBcIm91clwiLCBcInNoZVwiLCBcInNvXCIsIFwidGhhdFwiLCBcInRoZVwiLFxuICBcInRoZWlyXCIsIFwidGhlbVwiLCBcInRoZXJlXCIsIFwidGhleVwiLCBcInRoaXNcIiwgXCJ0b1wiLCBcInVzXCIsIFwid2FzXCIsIFwid2VcIiwgXCJ3ZXJlXCIsXG4gIFwid2hhdFwiLCBcIndoZW5cIiwgXCJ3aGVyZVwiLCBcIndob1wiLCBcIndoeVwiLCBcIndpbGxcIiwgXCJ3aXRoXCIsIFwieW91XCIsIFwieW91clwiXG5dKTtcblxuLyoqXG4gKiBGTlYtMWEgaGFzaCBmb3IgZmVhdHVyZSBoYXNoaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGhhc2hUb2tlbih0ZXh0KSB7XG4gIGxldCBoYXNoID0gMHg4MTFjOWRjNTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgaGFzaCBePSB0ZXh0LmNoYXJDb2RlQXQoaSk7XG4gICAgaGFzaCA9IChoYXNoICogMHgwMTAwMDE5MykgPj4+IDA7XG4gIH1cbiAgcmV0dXJuIGhhc2g7XG59XG5cbi8qKlxuICogVG9rZW5pemUgdGV4dCBpbnRvIG5vcm1hbGl6ZWQgdGVybXMuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHBhcmFtIHt7IG1pblRva2VuTGVuZ3RoPzogbnVtYmVyLCBzdG9wd29yZHM/OiBTZXQ8c3RyaW5nPiB9fSBbb3B0aW9uc11cbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqL1xuZnVuY3Rpb24gdG9rZW5pemUodGV4dCwgb3B0aW9ucykge1xuICBjb25zdCBtaW5Ub2tlbkxlbmd0aCA9IG9wdGlvbnM/Lm1pblRva2VuTGVuZ3RoID8/IDM7XG4gIGNvbnN0IHN0b3B3b3JkcyA9IG9wdGlvbnM/LnN0b3B3b3JkcyA/PyBERUZBVUxUX1NUT1BXT1JEUztcbiAgcmV0dXJuIHRleHRcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOVxcc10vZywgXCIgXCIpXG4gICAgLnNwbGl0KC9cXHMrLylcbiAgICAuZmlsdGVyKCh0b2tlbikgPT4gdG9rZW4ubGVuZ3RoID49IG1pblRva2VuTGVuZ3RoICYmICFzdG9wd29yZHMuaGFzKHRva2VuKSk7XG59XG5cbi8qKlxuICogQnVpbGQgYSBzaW5nbGUgdGV4dCBzdHJpbmcgZm9yIGVtYmVkZGluZy5cbiAqIEBwYXJhbSB7eyB0aXRsZT86IHN0cmluZywgY29udGVudDogc3RyaW5nIH19IGlucHV0XG4gKiBAcGFyYW0ge3sgY29udGVudEV4Y2VycHRMZW5ndGg/OiBudW1iZXIgfX0gW29wdGlvbnNdXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBidWlsZEVtYmVkZGluZ1RleHQoaW5wdXQsIG9wdGlvbnMpIHtcbiAgY29uc3QgdGl0bGUgPSBpbnB1dC50aXRsZSB8fCBcIlwiO1xuICBjb25zdCBjb250ZW50ID0gbm9ybWFsaXplTWFya2Rvd24oaW5wdXQuY29udGVudCB8fCBcIlwiKTtcbiAgY29uc3QgbGltaXQgPSBvcHRpb25zPy5jb250ZW50RXhjZXJwdExlbmd0aCA/PyA1MDA7XG4gIGNvbnN0IGV4Y2VycHQgPSBjb250ZW50LnNsaWNlKDAsIGxpbWl0KTtcbiAgcmV0dXJuIGAke3RpdGxlfSAke2V4Y2VycHR9YC50cmltKCk7XG59XG5cbi8qKlxuICogRk5WLTFhIGhhc2ggZm9yIGNoYW5nZSBkZXRlY3Rpb24gKHN0YWJsZSwgZmFzdCwgbm8gY3J5cHRvKS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmaW5nZXJwcmludFRleHQodGV4dCkge1xuICBsZXQgaGFzaCA9IDB4ODExYzlkYzU7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xuICAgIGhhc2ggXj0gdGV4dC5jaGFyQ29kZUF0KGkpO1xuICAgIGhhc2ggPSAoaGFzaCAqIDB4MDEwMDAxOTMpID4+PiAwO1xuICB9XG4gIHJldHVybiBoYXNoLnRvU3RyaW5nKDE2KS5wYWRTdGFydCg4LCBcIjBcIik7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlIGNvc2luZSBzaW1pbGFyaXR5IGJldHdlZW4gdHdvIHZlY3RvcnMuXG4gKiBAcGFyYW0ge251bWJlcltdfSB2ZWNBXG4gKiBAcGFyYW0ge251bWJlcltdfSB2ZWNCXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBjb3NpbmVTaW1pbGFyaXR5KHZlY0EsIHZlY0IpIHtcbiAgaWYgKCF2ZWNBIHx8ICF2ZWNCIHx8IHZlY0EubGVuZ3RoICE9PSB2ZWNCLmxlbmd0aCkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIGNvbnN0IGRvdFByb2R1Y3QgPSB2ZWNBLnJlZHVjZSgoc3VtLCBhLCBpKSA9PiBzdW0gKyBhICogdmVjQltpXSwgMCk7XG4gIGNvbnN0IG1hZ25pdHVkZUEgPSBNYXRoLnNxcnQodmVjQS5yZWR1Y2UoKHN1bSwgYSkgPT4gc3VtICsgYSAqIGEsIDApKTtcbiAgY29uc3QgbWFnbml0dWRlQiA9IE1hdGguc3FydCh2ZWNCLnJlZHVjZSgoc3VtLCBiKSA9PiBzdW0gKyBiICogYiwgMCkpO1xuICBpZiAobWFnbml0dWRlQSA9PT0gMCB8fCBtYWduaXR1ZGVCID09PSAwKSByZXR1cm4gMDtcbiAgcmV0dXJuIGRvdFByb2R1Y3QgLyAobWFnbml0dWRlQSAqIG1hZ25pdHVkZUIpO1xufVxuXG4vKipcbiAqIENvbXB1dGUgc2ltaWxhcml0eSBsaXN0cyBmb3IgaXRlbXMgd2l0aCBlbWJlZGRpbmdzLlxuICogQHBhcmFtIHtBcnJheTx7IGlkOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIGVtYmVkZGluZzogbnVtYmVyW10gfT59IGl0ZW1zXG4gKiBAcGFyYW0ge3sgbWF4U2ltaWxhcj86IG51bWJlciB9fSBbb3B0aW9uc11cbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCBBcnJheTx7IGlkOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHNpbWlsYXJpdHk6IG51bWJlciB9Pj59XG4gKi9cbmZ1bmN0aW9uIGNhbGN1bGF0ZVNpbWlsYXJpdGllcyhpdGVtcywgb3B0aW9ucykge1xuICBjb25zdCBtYXhTaW1pbGFyID0gb3B0aW9ucz8ubWF4U2ltaWxhciA/PyA1O1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIEFycmF5PHsgaWQ6IHN0cmluZywgdGl0bGU6IHN0cmluZywgc2ltaWxhcml0eTogbnVtYmVyIH0+Pn0gKi9cbiAgY29uc3Qgc2ltaWxhcml0aWVzID0ge307XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGEgPSBpdGVtc1tpXTtcbiAgICBzaW1pbGFyaXRpZXNbYS5pZF0gPSBbXTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgaXRlbXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmIChpID09PSBqKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGIgPSBpdGVtc1tqXTtcbiAgICAgIGNvbnN0IHNpbWlsYXJpdHkgPSBjb3NpbmVTaW1pbGFyaXR5KGEuZW1iZWRkaW5nLCBiLmVtYmVkZGluZyk7XG4gICAgICBzaW1pbGFyaXRpZXNbYS5pZF0ucHVzaCh7IGlkOiBiLmlkLCB0aXRsZTogYi50aXRsZSwgc2ltaWxhcml0eSB9KTtcbiAgICB9XG5cbiAgICBzaW1pbGFyaXRpZXNbYS5pZF0uc29ydCgoeCwgeSkgPT4geS5zaW1pbGFyaXR5IC0geC5zaW1pbGFyaXR5KTtcbiAgICBzaW1pbGFyaXRpZXNbYS5pZF0gPSBzaW1pbGFyaXRpZXNbYS5pZF0uc2xpY2UoMCwgbWF4U2ltaWxhcik7XG4gIH1cblxuICByZXR1cm4gc2ltaWxhcml0aWVzO1xufVxuXG4vKipcbiAqIEJ1aWxkIFRGLUlERiB2ZWN0b3JzIGZvciBhIGNvcnB1cyBvZiB0ZXh0cy5cbiAqIEBwYXJhbSB7c3RyaW5nW119IHRleHRzXG4gKiBAcGFyYW0ge3sgbWF4Vm9jYWI/OiBudW1iZXIsIG1pblRva2VuTGVuZ3RoPzogbnVtYmVyLCBzdG9wd29yZHM/OiBTZXQ8c3RyaW5nPiB9fSBbb3B0aW9uc11cbiAqIEByZXR1cm5zIHt7IHZlY3RvcnM6IG51bWJlcltdW10sIHZvY2FiOiBzdHJpbmdbXSB9fVxuICovXG5mdW5jdGlvbiBidWlsZFRmaWRmVmVjdG9ycyh0ZXh0cywgb3B0aW9ucykge1xuICBjb25zdCB0b2tlbml6ZWQgPSB0ZXh0cy5tYXAoKHRleHQpID0+IHRva2VuaXplKHRleHQsIG9wdGlvbnMpKTtcbiAgY29uc3QgZG9jQ291bnQgPSB0b2tlbml6ZWQubGVuZ3RoO1xuXG4gIGNvbnN0IGRmQ291bnRzID0gbmV3IE1hcCgpO1xuICBjb25zdCB0ZkNvdW50c1BlckRvYyA9IHRva2VuaXplZC5tYXAoKHRva2VucykgPT4ge1xuICAgIGNvbnN0IHRmID0gbmV3IE1hcCgpO1xuICAgIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgICB0Zi5zZXQodG9rZW4sICh0Zi5nZXQodG9rZW4pID8/IDApICsgMSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgdG9rZW4gb2YgbmV3IFNldCh0b2tlbnMpKSB7XG4gICAgICBkZkNvdW50cy5zZXQodG9rZW4sIChkZkNvdW50cy5nZXQodG9rZW4pID8/IDApICsgMSk7XG4gICAgfVxuICAgIHJldHVybiB0ZjtcbiAgfSk7XG5cbiAgY29uc3QgbWF4Vm9jYWIgPSBvcHRpb25zPy5tYXhWb2NhYiA/PyA1MDAwO1xuICBjb25zdCB2b2NhYiA9IEFycmF5LmZyb20oZGZDb3VudHMuZW50cmllcygpKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiWzFdIC0gYVsxXSlcbiAgICAuc2xpY2UoMCwgbWF4Vm9jYWIpXG4gICAgLm1hcCgoW3Rva2VuXSkgPT4gdG9rZW4pO1xuXG4gIGNvbnN0IGlkZiA9IG5ldyBNYXAoKTtcbiAgZm9yIChjb25zdCB0b2tlbiBvZiB2b2NhYikge1xuICAgIGNvbnN0IGRmID0gZGZDb3VudHMuZ2V0KHRva2VuKSA/PyAxO1xuICAgIGlkZi5zZXQodG9rZW4sIE1hdGgubG9nKChkb2NDb3VudCArIDEpIC8gKGRmICsgMSkpICsgMSk7XG4gIH1cblxuICBjb25zdCB2ZWN0b3JzID0gdGZDb3VudHNQZXJEb2MubWFwKCh0ZikgPT4ge1xuICAgIGNvbnN0IHZlYyA9IG5ldyBBcnJheSh2b2NhYi5sZW5ndGgpLmZpbGwoMCk7XG4gICAgbGV0IG5vcm0gPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdm9jYWIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHRva2VuID0gdm9jYWJbaV07XG4gICAgICBjb25zdCB0ZlZhbCA9IHRmLmdldCh0b2tlbikgPz8gMDtcbiAgICAgIGlmICh0ZlZhbCA9PT0gMCkgY29udGludWU7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRmVmFsICogKGlkZi5nZXQodG9rZW4pID8/IDApO1xuICAgICAgdmVjW2ldID0gdmFsdWU7XG4gICAgICBub3JtICs9IHZhbHVlICogdmFsdWU7XG4gICAgfVxuICAgIG5vcm0gPSBNYXRoLnNxcnQobm9ybSk7XG4gICAgaWYgKG5vcm0gPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZlYy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2ZWNbaV0gPSB2ZWNbaV0gLyBub3JtO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmVjO1xuICB9KTtcblxuICByZXR1cm4geyB2ZWN0b3JzLCB2b2NhYiB9O1xufVxuXG4vKipcbiAqIEJ1aWxkIFRGLUlERiB2ZWN0b3JzIHVzaW5nIGZlYXR1cmUgaGFzaGluZyAoZml4ZWQgZGltZW5zaW9uYWxpdHkpLlxuICogQHBhcmFtIHtzdHJpbmdbXX0gdGV4dHNcbiAqIEBwYXJhbSB7eyBoYXNoRGltPzogbnVtYmVyLCBtaW5Ub2tlbkxlbmd0aD86IG51bWJlciwgc3RvcHdvcmRzPzogU2V0PHN0cmluZz4gfX0gW29wdGlvbnNdXG4gKiBAcmV0dXJucyB7eyB2ZWN0b3JzOiBudW1iZXJbXVtdIH19XG4gKi9cbmZ1bmN0aW9uIGJ1aWxkSGFzaGVkVGZpZGZWZWN0b3JzKHRleHRzLCBvcHRpb25zKSB7XG4gIGNvbnN0IGhhc2hEaW0gPSBvcHRpb25zPy5oYXNoRGltID8/IDIwNDg7XG4gIGNvbnN0IHRva2VuaXplZCA9IHRleHRzLm1hcCgodGV4dCkgPT4gdG9rZW5pemUodGV4dCwgb3B0aW9ucykpO1xuICBjb25zdCBkb2NDb3VudCA9IHRva2VuaXplZC5sZW5ndGg7XG5cbiAgY29uc3QgZGZDb3VudHMgPSBuZXcgQXJyYXkoaGFzaERpbSkuZmlsbCgwKTtcbiAgY29uc3QgdGZDb3VudHNQZXJEb2MgPSB0b2tlbml6ZWQubWFwKCh0b2tlbnMpID0+IHtcbiAgICBjb25zdCB0ZiA9IG5ldyBBcnJheShoYXNoRGltKS5maWxsKDApO1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KCk7XG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICAgIGNvbnN0IGlkeCA9IGhhc2hUb2tlbih0b2tlbikgJSBoYXNoRGltO1xuICAgICAgdGZbaWR4XSArPSAxO1xuICAgICAgaWYgKCFzZWVuLmhhcyhpZHgpKSB7XG4gICAgICAgIHNlZW4uYWRkKGlkeCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgaWR4IG9mIHNlZW4pIHtcbiAgICAgIGRmQ291bnRzW2lkeF0gKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHRmO1xuICB9KTtcblxuICBjb25zdCB2ZWN0b3JzID0gdGZDb3VudHNQZXJEb2MubWFwKCh0ZikgPT4ge1xuICAgIGNvbnN0IHZlYyA9IG5ldyBBcnJheShoYXNoRGltKS5maWxsKDApO1xuICAgIGxldCBub3JtID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhhc2hEaW07IGkrKykge1xuICAgICAgY29uc3QgdGZWYWwgPSB0ZltpXTtcbiAgICAgIGlmICh0ZlZhbCA9PT0gMCkgY29udGludWU7XG4gICAgICBjb25zdCBpZGYgPSBNYXRoLmxvZygoZG9jQ291bnQgKyAxKSAvIChkZkNvdW50c1tpXSArIDEpKSArIDE7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRmVmFsICogaWRmO1xuICAgICAgdmVjW2ldID0gdmFsdWU7XG4gICAgICBub3JtICs9IHZhbHVlICogdmFsdWU7XG4gICAgfVxuICAgIG5vcm0gPSBNYXRoLnNxcnQobm9ybSk7XG4gICAgaWYgKG5vcm0gPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZlYy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2ZWNbaV0gPSB2ZWNbaV0gLyBub3JtO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmVjO1xuICB9KTtcblxuICByZXR1cm4geyB2ZWN0b3JzIH07XG59XG5cbi8qKlxuICogVmVjdG9yaXplIGRvY3VtZW50cyB3aXRoIFRGLUlERi5cbiAqIEBwYXJhbSB7QXJyYXk8eyBpZDogc3RyaW5nLCB0aXRsZT86IHN0cmluZywgY29udGVudDogc3RyaW5nIH0+fSBkb2NzXG4gKiBAcGFyYW0ge3sgY29udGVudEV4Y2VycHRMZW5ndGg/OiBudW1iZXIsIG1heFZvY2FiPzogbnVtYmVyLCBtaW5Ub2tlbkxlbmd0aD86IG51bWJlciwgc3RvcHdvcmRzPzogU2V0PHN0cmluZz4sIHVzZUhhc2hpbmc/OiBib29sZWFuLCBoYXNoRGltPzogbnVtYmVyIH19IFtvcHRpb25zXVxuICogQHJldHVybnMge3sgdmVjdG9yczogbnVtYmVyW11bXSwgdm9jYWI/OiBzdHJpbmdbXSwgdGV4dHM6IHN0cmluZ1tdIH19XG4gKi9cbmZ1bmN0aW9uIHZlY3Rvcml6ZURvY3VtZW50cyhkb2NzLCBvcHRpb25zKSB7XG4gIGNvbnN0IHRleHRzID0gZG9jcy5tYXAoKGRvYykgPT5cbiAgICBidWlsZEVtYmVkZGluZ1RleHQoXG4gICAgICB7IHRpdGxlOiBkb2MudGl0bGUgPz8gXCJcIiwgY29udGVudDogZG9jLmNvbnRlbnQgfSxcbiAgICAgIHsgY29udGVudEV4Y2VycHRMZW5ndGg6IG9wdGlvbnM/LmNvbnRlbnRFeGNlcnB0TGVuZ3RoID8/IDUwMCB9XG4gICAgKVxuICApO1xuICBpZiAob3B0aW9ucz8udXNlSGFzaGluZykge1xuICAgIGNvbnN0IHsgdmVjdG9ycyB9ID0gYnVpbGRIYXNoZWRUZmlkZlZlY3RvcnModGV4dHMsIG9wdGlvbnMpO1xuICAgIHJldHVybiB7IHZlY3RvcnMsIHRleHRzIH07XG4gIH1cbiAgY29uc3QgeyB2ZWN0b3JzLCB2b2NhYiB9ID0gYnVpbGRUZmlkZlZlY3RvcnModGV4dHMsIG9wdGlvbnMpO1xuICByZXR1cm4geyB2ZWN0b3JzLCB2b2NhYiwgdGV4dHMgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHN0cmlwRnJvbnRtYXR0ZXIsXG4gIG5vcm1hbGl6ZU1hcmtkb3duLFxuICB0b2tlbml6ZSxcbiAgYnVpbGRFbWJlZGRpbmdUZXh0LFxuICBidWlsZFRmaWRmVmVjdG9ycyxcbiAgYnVpbGRIYXNoZWRUZmlkZlZlY3RvcnMsXG4gIHZlY3Rvcml6ZURvY3VtZW50cyxcbiAgZmluZ2VycHJpbnRUZXh0LFxuICBjb3NpbmVTaW1pbGFyaXR5LFxuICBjYWxjdWxhdGVTaW1pbGFyaXRpZXMsXG59O1xuIiwgImltcG9ydCB7XG4gIEFwcCxcbiAgSXRlbVZpZXcsXG4gIE5vdGljZSxcbiAgUGx1Z2luLFxuICBQbHVnaW5TZXR0aW5nVGFiLFxuICBTZXR0aW5nLFxuICBURmlsZSxcbiAgV29ya3NwYWNlTGVhZixcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgKiBhcyBxdWFycmVsIGZyb20gXCJAd2F0dGhlbS9xdWFycmVsXCI7XG5cbmNvbnN0IFZJRVdfVFlQRSA9IFwicXVhcnJlbC1zaW1pbGFyLW5vdGVzXCI7XG5cbmludGVyZmFjZSBTaW1pbGFyTm90ZXNTZXR0aW5ncyB7XG4gIG1heFJlc3VsdHM6IG51bWJlcjtcbiAgbWluU2ltaWxhcml0eTogbnVtYmVyO1xuICBoYXNoRGltOiBudW1iZXI7XG4gIGNvbnRlbnRFeGNlcnB0TGVuZ3RoOiBudW1iZXI7XG4gIG9wZW5PblN0YXJ0OiBib29sZWFuO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTaW1pbGFyTm90ZXNTZXR0aW5ncyA9IHtcbiAgbWF4UmVzdWx0czogNixcbiAgbWluU2ltaWxhcml0eTogMC4xNSxcbiAgaGFzaERpbTogMjA0OCxcbiAgY29udGVudEV4Y2VycHRMZW5ndGg6IDE1MDAsXG4gIG9wZW5PblN0YXJ0OiB0cnVlLFxufTtcblxudHlwZSBEb2N1bWVudFJlY29yZCA9IHtcbiAgcGF0aDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBjb250ZW50OiBzdHJpbmc7XG59O1xuXG5jbGFzcyBTaW1pbGFyaXR5SW5kZXgge1xuICBwcml2YXRlIGFwcDogQXBwO1xuICBwcml2YXRlIHNldHRpbmdzOiBTaW1pbGFyTm90ZXNTZXR0aW5ncztcbiAgcHJpdmF0ZSBkb2N1bWVudHM6IERvY3VtZW50UmVjb3JkW10gPSBbXTtcbiAgcHJpdmF0ZSB2ZWN0b3JzOiBudW1iZXJbXVtdID0gW107XG4gIHByaXZhdGUgcGF0aFRvSW5kZXggPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBwcml2YXRlIGZpbmdlcnByaW50cyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIHByaXZhdGUgaW5kZXhpbmcgPSBmYWxzZTtcbiAgcHJpdmF0ZSBkaXJ0eSA9IGZhbHNlO1xuICBwcml2YXRlIGxhc3RCdWlsdEF0OiBEYXRlIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHNldHRpbmdzOiBTaW1pbGFyTm90ZXNTZXR0aW5ncykge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgfVxuXG4gIHVwZGF0ZVNldHRpbmdzKHNldHRpbmdzOiBTaW1pbGFyTm90ZXNTZXR0aW5ncykge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgfVxuXG4gIG1hcmtEaXJ0eSgpIHtcbiAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIGlzRGlydHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlydHk7XG4gIH1cblxuICBpc0luZGV4aW5nKCkge1xuICAgIHJldHVybiB0aGlzLmluZGV4aW5nO1xuICB9XG5cbiAgaXNSZWFkeSgpIHtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHMubGVuZ3RoID4gMCAmJiB0aGlzLnZlY3RvcnMubGVuZ3RoID4gMCAmJiAhdGhpcy5pbmRleGluZztcbiAgfVxuXG4gIGdldExhc3RCdWlsdEF0KCkge1xuICAgIHJldHVybiB0aGlzLmxhc3RCdWlsdEF0O1xuICB9XG5cbiAgYXN5bmMgcmVidWlsZCgpIHtcbiAgICBpZiAodGhpcy5pbmRleGluZykgcmV0dXJuO1xuICAgIHRoaXMuaW5kZXhpbmcgPSB0cnVlO1xuICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcblxuICAgIGNvbnN0IGZpbGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xuICAgIGNvbnN0IGRvY3VtZW50czogRG9jdW1lbnRSZWNvcmRbXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY2FjaGVkUmVhZChmaWxlKTtcbiAgICAgIGRvY3VtZW50cy5wdXNoKHtcbiAgICAgICAgcGF0aDogZmlsZS5wYXRoLFxuICAgICAgICB0aXRsZTogZmlsZS5iYXNlbmFtZSxcbiAgICAgICAgY29udGVudCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChkb2N1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmRvY3VtZW50cyA9IFtdO1xuICAgICAgdGhpcy52ZWN0b3JzID0gW107XG4gICAgICB0aGlzLnBhdGhUb0luZGV4LmNsZWFyKCk7XG4gICAgICB0aGlzLmZpbmdlcnByaW50cy5jbGVhcigpO1xuICAgICAgdGhpcy5pbmRleGluZyA9IGZhbHNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHsgdmVjdG9ycyB9ID0gcXVhcnJlbC52ZWN0b3JpemVEb2N1bWVudHMoZG9jdW1lbnRzLCB7XG4gICAgICB1c2VIYXNoaW5nOiB0cnVlLFxuICAgICAgaGFzaERpbTogdGhpcy5zZXR0aW5ncy5oYXNoRGltLFxuICAgICAgY29udGVudEV4Y2VycHRMZW5ndGg6IHRoaXMuc2V0dGluZ3MuY29udGVudEV4Y2VycHRMZW5ndGgsXG4gICAgfSk7XG5cbiAgICB0aGlzLmRvY3VtZW50cyA9IGRvY3VtZW50cztcbiAgICB0aGlzLnZlY3RvcnMgPSB2ZWN0b3JzO1xuICAgIHRoaXMucGF0aFRvSW5kZXguY2xlYXIoKTtcbiAgICB0aGlzLmZpbmdlcnByaW50cy5jbGVhcigpO1xuXG4gICAgZG9jdW1lbnRzLmZvckVhY2goKGRvYywgaW5kZXgpID0+IHtcbiAgICAgIHRoaXMucGF0aFRvSW5kZXguc2V0KGRvYy5wYXRoLCBpbmRleCk7XG4gICAgICB0aGlzLmZpbmdlcnByaW50cy5zZXQoZG9jLnBhdGgsIHF1YXJyZWwuZmluZ2VycHJpbnRUZXh0KGRvYy5jb250ZW50KSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmxhc3RCdWlsdEF0ID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLmluZGV4aW5nID0gZmFsc2U7XG4gIH1cblxuICBhc3luYyBjaGVja0ZvckNoYW5nZXMoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG4gICAgY29uc3QgZmlsZVBhdGhzID0gbmV3IFNldChmaWxlcy5tYXAoKGZpbGUpID0+IGZpbGUucGF0aCkpO1xuXG4gICAgaWYgKGZpbGVQYXRocy5zaXplICE9PSB0aGlzLmRvY3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBjb25zdCBwcmV2aW91cyA9IHRoaXMuZmluZ2VycHJpbnRzLmdldChmaWxlLnBhdGgpO1xuICAgICAgaWYgKCFwcmV2aW91cykge1xuICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY2FjaGVkUmVhZChmaWxlKTtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSBxdWFycmVsLmZpbmdlcnByaW50VGV4dChjb250ZW50KTtcbiAgICAgIGlmIChjdXJyZW50ICE9PSBwcmV2aW91cykge1xuICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZ2V0U2ltaWxhck5vdGVzKGZpbGU6IFRGaWxlKTogeyBwYXRoOiBzdHJpbmc7IHRpdGxlOiBzdHJpbmc7IHNpbWlsYXJpdHk6IG51bWJlciB9W10ge1xuICAgIGlmICghdGhpcy5pc1JlYWR5KCkpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IHRoaXMucGF0aFRvSW5kZXguZ2V0KGZpbGUucGF0aCk7XG4gICAgaWYgKGN1cnJlbnRJbmRleCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gW107XG5cbiAgICBjb25zdCBjdXJyZW50VmVjdG9yID0gdGhpcy52ZWN0b3JzW2N1cnJlbnRJbmRleF07XG5cbiAgICBjb25zdCBzY29yZWQgPSB0aGlzLmRvY3VtZW50c1xuICAgICAgLm1hcCgoZG9jLCBpbmRleCkgPT4gKHtcbiAgICAgICAgZG9jLFxuICAgICAgICBzaW1pbGFyaXR5OiBxdWFycmVsLmNvc2luZVNpbWlsYXJpdHkoY3VycmVudFZlY3RvciwgdGhpcy52ZWN0b3JzW2luZGV4XSksXG4gICAgICAgIGlzU2VsZjogaW5kZXggPT09IGN1cnJlbnRJbmRleCxcbiAgICAgIH0pKVxuICAgICAgLmZpbHRlcigoZW50cnkpID0+ICFlbnRyeS5pc1NlbGYpXG4gICAgICAuZmlsdGVyKChlbnRyeSkgPT4gZW50cnkuc2ltaWxhcml0eSA+PSB0aGlzLnNldHRpbmdzLm1pblNpbWlsYXJpdHkpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYi5zaW1pbGFyaXR5IC0gYS5zaW1pbGFyaXR5KVxuICAgICAgLnNsaWNlKDAsIHRoaXMuc2V0dGluZ3MubWF4UmVzdWx0cyk7XG5cbiAgICByZXR1cm4gc2NvcmVkLm1hcCgoZW50cnkpID0+ICh7XG4gICAgICBwYXRoOiBlbnRyeS5kb2MucGF0aCxcbiAgICAgIHRpdGxlOiBlbnRyeS5kb2MudGl0bGUsXG4gICAgICBzaW1pbGFyaXR5OiBlbnRyeS5zaW1pbGFyaXR5LFxuICAgIH0pKTtcbiAgfVxufVxuXG5jbGFzcyBTaW1pbGFyTm90ZXNWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuICBwcml2YXRlIHBsdWdpbjogUXVhcnJlbFNpbWlsYXJOb3Rlc1BsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwbHVnaW46IFF1YXJyZWxTaW1pbGFyTm90ZXNQbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCkge1xuICAgIHJldHVybiBWSUVXX1RZUEU7XG4gIH1cblxuICBnZXREaXNwbGF5VGV4dCgpIHtcbiAgICByZXR1cm4gXCJTaW1pbGFyIE5vdGVzXCI7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKSB7XG4gICAgdGhpcy5hZGRBY3Rpb24oXCJyZWZyZXNoLWN3XCIsIFwiUmVidWlsZCBpbmRleFwiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLnJlYnVpbGRJbmRleCgpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRBY3Rpb24oXCJzZWFyY2hcIiwgXCJDaGVjayBmb3IgY2hhbmdlc1wiLCAoKSA9PiB7XG4gICAgICB2b2lkIHRoaXMucGx1Z2luLmNoZWNrRm9yQ2hhbmdlcygpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRlbnRFbDtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoXCJxdWFycmVsLXNpbWlsYXItbm90ZXNcIik7XG5cbiAgICBjb25zdCBzdGF0dXMgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBcInN0YXR1c1wiIH0pO1xuICAgIGNvbnN0IGxhc3RCdWlsdEF0ID0gdGhpcy5wbHVnaW4uaW5kZXguZ2V0TGFzdEJ1aWx0QXQoKTtcblxuICAgIGlmICh0aGlzLnBsdWdpbi5pbmRleC5pc0luZGV4aW5nKCkpIHtcbiAgICAgIHN0YXR1cy5zZXRUZXh0KFwiSW5kZXhpbmcgdmF1bHQuLi5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnBsdWdpbi5pbmRleC5pc1JlYWR5KCkpIHtcbiAgICAgIHN0YXR1cy5zZXRUZXh0KFwiSW5kZXggbm90IGJ1aWx0IHlldC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGxhc3RCdWlsdEF0KSB7XG4gICAgICBzdGF0dXMuc2V0VGV4dChgSW5kZXhlZCAke2xhc3RCdWlsdEF0LnRvTG9jYWxlU3RyaW5nKCl9YCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGx1Z2luLmluZGV4LmlzRGlydHkoKSkge1xuICAgICAgY29udGFpbmVyLmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJ3YXJuaW5nXCIsXG4gICAgICAgIHRleHQ6IFwiSW5kZXggaXMgb3V0IG9mIGRhdGUuIENsaWNrIFJlYnVpbGQgdG8gcmVmcmVzaC5cIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGl2ZUZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGlmICghYWN0aXZlRmlsZSkge1xuICAgICAgY29udGFpbmVyLmNyZWF0ZURpdih7IHRleHQ6IFwiT3BlbiBhIG5vdGUgdG8gc2VlIHNpbWlsYXIgbm90ZXMuXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0cyA9IHRoaXMucGx1Z2luLmluZGV4LmdldFNpbWlsYXJOb3RlcyhhY3RpdmVGaWxlKTtcbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnRhaW5lci5jcmVhdGVEaXYoeyB0ZXh0OiBcIk5vIHNpbWlsYXIgbm90ZXMgZm91bmQuXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgY29uc3Qgcm93ID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJub3RlLXJvd1wiIH0pO1xuICAgICAgcm93LmNyZWF0ZURpdih7IGNsczogXCJub3RlLXRpdGxlXCIsIHRleHQ6IHJlc3VsdC50aXRsZSB9KTtcbiAgICAgIHJvdy5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwibm90ZS1zY29yZVwiLFxuICAgICAgICB0ZXh0OiBgJHtNYXRoLnJvdW5kKHJlc3VsdC5zaW1pbGFyaXR5ICogMTAwKX0lYCxcbiAgICAgIH0pO1xuXG4gICAgICByb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgY29uc3Qgc291cmNlUGF0aCA9IGFjdGl2ZUZpbGUucGF0aCA/PyBcIlwiO1xuICAgICAgICB2b2lkIHRoaXMuYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQocmVzdWx0LnBhdGgsIHNvdXJjZVBhdGgsIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBTaW1pbGFyTm90ZXNTZXR0aW5nc1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwcml2YXRlIHBsdWdpbjogUXVhcnJlbFNpbWlsYXJOb3Rlc1BsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBRdWFycmVsU2ltaWxhck5vdGVzUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiTWF4IHJlc3VsdHNcIilcbiAgICAgIC5zZXREZXNjKFwiTnVtYmVyIG9mIHNpbWlsYXIgbm90ZXMgdG8gc2hvdy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiNlwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MubWF4UmVzdWx0cykpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV4dCA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgICAgICBpZiAoIU51bWJlci5pc0Zpbml0ZShuZXh0KSB8fCBuZXh0IDw9IDApIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm1heFJlc3VsdHMgPSBuZXh0O1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5pbmRleC51cGRhdGVTZXR0aW5ncyh0aGlzLnBsdWdpbi5zZXR0aW5ncyk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoVmlldygpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk1pbiBzaW1pbGFyaXR5XCIpXG4gICAgICAuc2V0RGVzYyhcIkhpZGUgbWF0Y2hlcyBiZWxvdyB0aGlzIHNpbWlsYXJpdHkgc2NvcmUuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT5cbiAgICAgICAgdGV4dFxuICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIjAuMTVcIilcbiAgICAgICAgICAuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLm1pblNpbWlsYXJpdHkpKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5leHQgPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobmV4dCkgfHwgbmV4dCA8IDAgfHwgbmV4dCA+IDEpIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLm1pblNpbWlsYXJpdHkgPSBuZXh0O1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5pbmRleC51cGRhdGVTZXR0aW5ncyh0aGlzLnBsdWdpbi5zZXR0aW5ncyk7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5yZWZyZXNoVmlldygpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkhhc2ggZGltZW5zaW9uXCIpXG4gICAgICAuc2V0RGVzYyhcIlZlY3RvciBzaXplIGZvciBoYXNoZWQgVEYtSURGLiBIaWdoZXIgPSBtb3JlIHByZWNpc2UsIG1vcmUgbWVtb3J5LlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCIyMDQ4XCIpXG4gICAgICAgICAgLnNldFZhbHVlKFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5oYXNoRGltKSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXh0ID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgICAgIGlmICghTnVtYmVyLmlzRmluaXRlKG5leHQpIHx8IG5leHQgPD0gMCkgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaGFzaERpbSA9IG5leHQ7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmluZGV4LnVwZGF0ZVNldHRpbmdzKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnJlYnVpbGRJbmRleCgpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkNvbnRlbnQgZXhjZXJwdCBsZW5ndGhcIilcbiAgICAgIC5zZXREZXNjKFwiSG93IG1hbnkgY2hhcmFjdGVycyBwZXIgbm90ZSBhcmUgdXNlZCBmb3Igc2ltaWxhcml0eS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICB0ZXh0XG4gICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiMTUwMFwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29udGVudEV4Y2VycHRMZW5ndGgpKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5leHQgPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobmV4dCkgfHwgbmV4dCA8PSAwKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb250ZW50RXhjZXJwdExlbmd0aCA9IG5leHQ7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmluZGV4LnVwZGF0ZVNldHRpbmdzKHRoaXMucGx1Z2luLnNldHRpbmdzKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnJlYnVpbGRJbmRleCgpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk9wZW4gcGFuZWwgb24gc3RhcnRcIilcbiAgICAgIC5zZXREZXNjKFwiQXV0b21hdGljYWxseSBvcGVuIHRoZSBTaW1pbGFyIE5vdGVzIHBhbmVsIG9uIGxhdW5jaC5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT5cbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm9wZW5PblN0YXJ0KS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5vcGVuT25TdGFydCA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRdWFycmVsU2ltaWxhck5vdGVzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3MhOiBTaW1pbGFyTm90ZXNTZXR0aW5ncztcbiAgaW5kZXghOiBTaW1pbGFyaXR5SW5kZXg7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICB0aGlzLmluZGV4ID0gbmV3IFNpbWlsYXJpdHlJbmRleCh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyk7XG4gICAgdm9pZCB0aGlzLnJlYnVpbGRJbmRleCgpO1xuXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBWSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IFNpbWlsYXJOb3Rlc1ZpZXcobGVhZiwgdGhpcylcbiAgICApO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9wZW4tc2ltaWxhci1ub3Rlcy1wYW5lbFwiLFxuICAgICAgbmFtZTogXCJPcGVuIFNpbWlsYXIgTm90ZXMgcGFuZWxcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkIHRoaXMuYWN0aXZhdGVWaWV3KCksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwicmVidWlsZC1zaW1pbGFyLW5vdGVzLWluZGV4XCIsXG4gICAgICBuYW1lOiBcIlJlYnVpbGQgU2ltaWxhciBOb3RlcyBpbmRleFwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHZvaWQgdGhpcy5yZWJ1aWxkSW5kZXgoKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJjaGVjay1zaW1pbGFyLW5vdGVzLWNoYW5nZXNcIixcbiAgICAgIG5hbWU6IFwiQ2hlY2sgU2ltaWxhciBOb3RlcyBmb3IgY2hhbmdlc1wiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHZvaWQgdGhpcy5jaGVja0ZvckNoYW5nZXMoKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgU2ltaWxhck5vdGVzU2V0dGluZ3NUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImZpbGUtb3BlblwiLCAoKSA9PiB0aGlzLnJlZnJlc2hWaWV3KCkpXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwibW9kaWZ5XCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUgJiYgZmlsZS5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgubWFya0RpcnR5KCk7XG4gICAgICAgICAgdGhpcy5yZWZyZXNoVmlldygpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC52YXVsdC5vbihcInJlbmFtZVwiLCAoZmlsZSkgPT4ge1xuICAgICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlICYmIGZpbGUuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Lm1hcmtEaXJ0eSgpO1xuICAgICAgICAgIHRoaXMucmVmcmVzaFZpZXcoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAudmF1bHQub24oXCJkZWxldGVcIiwgKGZpbGUpID0+IHtcbiAgICAgICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBURmlsZSAmJiBmaWxlLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgICAgdGhpcy5pbmRleC5tYXJrRGlydHkoKTtcbiAgICAgICAgICB0aGlzLnJlZnJlc2hWaWV3KCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGlmICh0aGlzLnNldHRpbmdzLm9wZW5PblN0YXJ0KSB7XG4gICAgICBhd2FpdCB0aGlzLmFjdGl2YXRlVmlldygpO1xuICAgIH1cbiAgfVxuXG4gIG9udW5sb2FkKCkge1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFKTtcbiAgfVxuXG4gIGFzeW5jIGFjdGl2YXRlVmlldygpIHtcbiAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG4gICAgaWYgKCFsZWFmKSByZXR1cm47XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBWSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcbiAgfVxuXG4gIHJlZnJlc2hWaWV3KCkge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFKTtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgbGVhdmVzKSB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBTaW1pbGFyTm90ZXNWaWV3KSB7XG4gICAgICAgIHZpZXcucmVuZGVyKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcmVidWlsZEluZGV4KCkge1xuICAgIG5ldyBOb3RpY2UoXCJCdWlsZGluZyBzaW1pbGFyIG5vdGVzIGluZGV4Li4uXCIpO1xuICAgIGF3YWl0IHRoaXMuaW5kZXgucmVidWlsZCgpO1xuICAgIG5ldyBOb3RpY2UoXCJTaW1pbGFyIG5vdGVzIGluZGV4IHJlYWR5LlwiKTtcbiAgICB0aGlzLnJlZnJlc2hWaWV3KCk7XG4gIH1cblxuICBhc3luYyBjaGVja0ZvckNoYW5nZXMoKSB7XG4gICAgY29uc3QgY2hhbmdlZCA9IGF3YWl0IHRoaXMuaW5kZXguY2hlY2tGb3JDaGFuZ2VzKCk7XG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJDaGFuZ2VzIGRldGVjdGVkLiBSZWJ1aWxkIHRoZSBpbmRleCB0byByZWZyZXNoIHJlc3VsdHMuXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gY2hhbmdlcyBkZXRlY3RlZC5cIik7XG4gICAgfVxuICAgIHRoaXMucmVmcmVzaFZpZXcoKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBLHNGQUFBQSxVQUFBQyxTQUFBO0FBQUE7QUFZQSxhQUFTLGlCQUFpQixNQUFNO0FBQzlCLFVBQUksQ0FBQyxLQUFLLFdBQVcsS0FBSztBQUFHLGVBQU87QUFDcEMsWUFBTSxNQUFNLEtBQUssUUFBUSxTQUFTLENBQUM7QUFDbkMsVUFBSSxRQUFRO0FBQUksZUFB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QUFDckIsZUFBSyxZQUFZO0FBQUEsUUFDbkI7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBRUEsU0FBSztBQUFBLE1BQ0gsS0FBSyxJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsU0FBUztBQUNwQyxZQUFJLGdCQUFnQix5QkFBUyxLQUFLLGNBQWMsTUFBTTtBQUNwRCxlQUFLLE1BQU0sVUFBVTtBQUNyQixlQUFLLFlBQVk7QUFBQSxRQUNuQjtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFFQSxRQUFJLEtBQUssU0FBUyxhQUFhO0FBQzdCLFlBQU0sS0FBSyxhQUFhO0FBQUEsSUFDMUI7QUFBQSxFQUNGO0FBQUEsRUFFQSxXQUFXO0FBQ1QsU0FBSyxJQUFJLFVBQVUsbUJBQW1CLFNBQVM7QUFBQSxFQUNqRDtBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ25CLFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxhQUFhLEtBQUs7QUFDbEQsUUFBSSxDQUFDO0FBQU07QUFDWCxVQUFNLEtBQUssYUFBYSxFQUFFLE1BQU0sV0FBVyxRQUFRLEtBQUssQ0FBQztBQUN6RCxTQUFLLElBQUksVUFBVSxXQUFXLElBQUk7QUFBQSxFQUNwQztBQUFBLEVBRUEsY0FBYztBQUNaLFVBQU0sU0FBUyxLQUFLLElBQUksVUFBVSxnQkFBZ0IsU0FBUztBQUMzRCxlQUFXLFFBQVEsUUFBUTtBQUN6QixZQUFNLE9BQU8sS0FBSztBQUNsQixVQUFJLGdCQUFnQixrQkFBa0I7QUFDcEMsYUFBSyxPQUFPO0FBQUEsTUFDZDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsUUFBSSx1QkFBTyxpQ0FBaUM7QUFDNUMsVUFBTSxLQUFLLE1BQU0sUUFBUTtBQUN6QixRQUFJLHVCQUFPLDRCQUE0QjtBQUN2QyxTQUFLLFlBQVk7QUFBQSxFQUNuQjtBQUFBLEVBRUEsTUFBTSxrQkFBa0I7QUFDdEIsVUFBTSxVQUFVLE1BQU0sS0FBSyxNQUFNLGdCQUFnQjtBQUNqRCxRQUFJLFNBQVM7QUFDWCxVQUFJLHVCQUFPLHlEQUF5RDtBQUFBLElBQ3RFLE9BQU87QUFDTCxVQUFJLHVCQUFPLHNCQUFzQjtBQUFBLElBQ25DO0FBQ0EsU0FBSyxZQUFZO0FBQUEsRUFDbkI7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNuQixTQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxrQkFBa0IsTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUFBLEVBQzNFO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsVUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRO0FBQUEsRUFDbkM7QUFDRjsiLAogICJuYW1lcyI6IFsiZXhwb3J0cyIsICJtb2R1bGUiLCAiZmluZ2VycHJpbnRUZXh0IiwgImNvc2luZVNpbWlsYXJpdHkiLCAiX2EiLCAiX2IiLCAidmVjdG9yaXplRG9jdW1lbnRzIiwgInZlY3RvcnMiXQp9Cg==
