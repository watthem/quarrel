import {
  App,
  ItemView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import * as quarrel from "@watthem/quarrel";

const VIEW_TYPE = "quarrel-similar-notes";

interface SimilarNotesSettings {
  maxResults: number;
  minSimilarity: number;
  hashDim: number;
  contentExcerptLength: number;
  openOnStart: boolean;
}

const DEFAULT_SETTINGS: SimilarNotesSettings = {
  maxResults: 6,
  minSimilarity: 0.15,
  hashDim: 2048,
  contentExcerptLength: 1500,
  openOnStart: true,
};

type DocumentRecord = {
  path: string;
  title: string;
  content: string;
};

class SimilarityIndex {
  private app: App;
  private settings: SimilarNotesSettings;
  private documents: DocumentRecord[] = [];
  private vectors: number[][] = [];
  private pathToIndex = new Map<string, number>();
  private fingerprints = new Map<string, string>();
  private indexing = false;
  private dirty = false;
  private lastBuiltAt: Date | null = null;

  constructor(app: App, settings: SimilarNotesSettings) {
    this.app = app;
    this.settings = settings;
  }

  updateSettings(settings: SimilarNotesSettings) {
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
    if (this.indexing) return;
    this.indexing = true;
    this.dirty = false;

    const files = this.app.vault.getMarkdownFiles();
    const documents: DocumentRecord[] = [];

    for (const file of files) {
      const content = await this.app.vault.cachedRead(file);
      documents.push({
        path: file.path,
        title: file.basename,
        content,
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
      contentExcerptLength: this.settings.contentExcerptLength,
    });

    this.documents = documents;
    this.vectors = vectors;
    this.pathToIndex.clear();
    this.fingerprints.clear();

    documents.forEach((doc, index) => {
      this.pathToIndex.set(doc.path, index);
      this.fingerprints.set(doc.path, quarrel.fingerprintText(doc.content));
    });

    this.lastBuiltAt = new Date();
    this.indexing = false;
  }

  async checkForChanges(): Promise<boolean> {
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

  getSimilarNotes(file: TFile): { path: string; title: string; similarity: number }[] {
    if (!this.isReady()) return [];

    const currentIndex = this.pathToIndex.get(file.path);
    if (currentIndex === undefined) return [];

    const currentVector = this.vectors[currentIndex];

    const scored = this.documents
      .map((doc, index) => ({
        doc,
        similarity: quarrel.cosineSimilarity(currentVector, this.vectors[index]),
        isSelf: index === currentIndex,
      }))
      .filter((entry) => !entry.isSelf)
      .filter((entry) => entry.similarity >= this.settings.minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.settings.maxResults);

    return scored.map((entry) => ({
      path: entry.doc.path,
      title: entry.doc.title,
      similarity: entry.similarity,
    }));
  }
}

class SimilarNotesView extends ItemView {
  private plugin: QuarrelSimilarNotesPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: QuarrelSimilarNotesPlugin) {
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
        text: "Index is out of date. Click Rebuild to refresh.",
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
        text: `${Math.round(result.similarity * 100)}%`,
      });

      row.addEventListener("click", () => {
        const sourcePath = activeFile.path ?? "";
        void this.app.workspace.openLinkText(result.path, sourcePath, false);
      });
    }
  }
}

class SimilarNotesSettingsTab extends PluginSettingTab {
  private plugin: QuarrelSimilarNotesPlugin;

  constructor(app: App, plugin: QuarrelSimilarNotesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Max results")
      .setDesc("Number of similar notes to show.")
      .addText((text) =>
        text
          .setPlaceholder("6")
          .setValue(String(this.plugin.settings.maxResults))
          .onChange(async (value) => {
            const next = Number(value);
            if (!Number.isFinite(next) || next <= 0) return;
            this.plugin.settings.maxResults = next;
            await this.plugin.saveSettings();
            this.plugin.index.updateSettings(this.plugin.settings);
            this.plugin.refreshView();
          })
      );

    new Setting(containerEl)
      .setName("Min similarity")
      .setDesc("Hide matches below this similarity score.")
      .addText((text) =>
        text
          .setPlaceholder("0.15")
          .setValue(String(this.plugin.settings.minSimilarity))
          .onChange(async (value) => {
            const next = Number(value);
            if (!Number.isFinite(next) || next < 0 || next > 1) return;
            this.plugin.settings.minSimilarity = next;
            await this.plugin.saveSettings();
            this.plugin.index.updateSettings(this.plugin.settings);
            this.plugin.refreshView();
          })
      );

    new Setting(containerEl)
      .setName("Hash dimension")
      .setDesc("Vector size for hashed TF-IDF. Higher = more precise, more memory.")
      .addText((text) =>
        text
          .setPlaceholder("2048")
          .setValue(String(this.plugin.settings.hashDim))
          .onChange(async (value) => {
            const next = Number(value);
            if (!Number.isFinite(next) || next <= 0) return;
            this.plugin.settings.hashDim = next;
            await this.plugin.saveSettings();
            this.plugin.index.updateSettings(this.plugin.settings);
            await this.plugin.rebuildIndex();
          })
      );

    new Setting(containerEl)
      .setName("Content excerpt length")
      .setDesc("How many characters per note are used for similarity.")
      .addText((text) =>
        text
          .setPlaceholder("1500")
          .setValue(String(this.plugin.settings.contentExcerptLength))
          .onChange(async (value) => {
            const next = Number(value);
            if (!Number.isFinite(next) || next <= 0) return;
            this.plugin.settings.contentExcerptLength = next;
            await this.plugin.saveSettings();
            this.plugin.index.updateSettings(this.plugin.settings);
            await this.plugin.rebuildIndex();
          })
      );

    new Setting(containerEl)
      .setName("Open panel on start")
      .setDesc("Automatically open the Similar Notes panel on launch.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.openOnStart).onChange(async (value) => {
          this.plugin.settings.openOnStart = value;
          await this.plugin.saveSettings();
        })
      );
  }
}

export default class QuarrelSimilarNotesPlugin extends Plugin {
  settings!: SimilarNotesSettings;
  index!: SimilarityIndex;

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
      callback: () => void this.activateView(),
    });

    this.addCommand({
      id: "rebuild-similar-notes-index",
      name: "Rebuild Similar Notes index",
      callback: () => void this.rebuildIndex(),
    });

    this.addCommand({
      id: "check-similar-notes-changes",
      name: "Check Similar Notes for changes",
      callback: () => void this.checkForChanges(),
    });

    this.addSettingTab(new SimilarNotesSettingsTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-open", () => this.refreshView())
    );

    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.index.markDirty();
          this.refreshView();
        }
      })
    );

    this.registerEvent(
      this.app.vault.on("rename", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.index.markDirty();
          this.refreshView();
        }
      })
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (file instanceof TFile && file.extension === "md") {
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
    if (!leaf) return;
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
    new Notice("Building similar notes index...");
    await this.index.rebuild();
    new Notice("Similar notes index ready.");
    this.refreshView();
  }

  async checkForChanges() {
    const changed = await this.index.checkForChanges();
    if (changed) {
      new Notice("Changes detected. Rebuild the index to refresh results.");
    } else {
      new Notice("No changes detected.");
    }
    this.refreshView();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
