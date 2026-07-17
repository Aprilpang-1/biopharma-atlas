# Biopharma Investment Atlas — deploy to GitHub Pages

This folder is the Phase 3 skeleton: `index.html` fetches `data/content.json`
and lists areas → modalities → example drugs to prove the data model works.
No map or styling yet — that's Phase 4+.

## One-time setup

1. Go to https://github.com/new and create a new **public** repository
   (e.g. `biopharma-atlas`). Don't add a README/gitignore — leave it empty.
2. On your computer, open a terminal in this `atlas-site` folder and run:

   ```
   git init
   git add .
   git commit -m "Phase 3: skeleton site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/biopharma-atlas.git
   git push -u origin main
   ```

3. On GitHub, open the repo → **Settings** → **Pages** (left sidebar).
4. Under "Build and deployment" → Source, choose **Deploy from a branch**.
5. Branch: `main`, folder: `/ (root)`. Click **Save**.
6. Wait ~1 minute, then refresh the Pages settings page — it will show your
   live URL, typically:

   ```
   https://<your-username>.github.io/biopharma-atlas/
   ```

## Future updates

Every later phase just means editing files in this same folder, then:

```
git add .
git commit -m "Phase 4: subway map rendering"
git push
```

GitHub Pages redeploys automatically within about a minute.

## Local preview (optional, before pushing)

If you have Python installed, from inside this folder run:

```
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.
