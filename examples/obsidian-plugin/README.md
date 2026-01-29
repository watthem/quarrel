# Quarrel Similar Notes (Obsidian MVP)

Local-only similar notes panel powered by @watthem/quarrel (TF-IDF + cosine similarity).

## What it does
- Indexes your vault locally (no network calls)
- Shows a Similar Notes panel in the right sidebar
- Lets you rebuild the index or check for changes

## Build
From this folder:

```bash
npm install
npm run build
```

## Install in Obsidian (manual)
1. Copy `manifest.json`, `main.js`, and `styles.css` into:
   - `<vault>/.obsidian/plugins/quarrel-similar-notes/`
2. Enable the plugin in Obsidian settings.

## Notes
- Uses hashed TF-IDF for speed and privacy.
- If your vault changes, click "Rebuild index" in the panel.
- Tune similarity and vector size in the plugin settings.
