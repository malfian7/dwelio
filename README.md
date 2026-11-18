# Dwelio — 3D home studio

Draw walls, doors, windows and roofs on a grid, orbit the model 360°, walk through the sample house and read CAD-style drawings — all in the browser, built on [Three.js](https://threejs.org/) (r128). No framework, no bundler, no install step.

## Project structure

```
dwelio/
├── index.html                  Markup only: rail, topbar, panels, modals; loads css/ and js/ in order
├── css/
│   ├── base.css                Design tokens, shared components, canvas, CAD-sheet chrome
│   ├── layout.css              Shell layout: rail, topbar, panel, tool columns, modals, responsive
│   ├── sidebar-builder.css     Spec-sheet sidebar + Create (builder) toolbar
│   └── motion.css              Motion language (keyframes, press/hover feedback) + reduced-motion
├── js/
│   ├── core/
│   │   ├── utils.js            $ / $$, clamp, lerp, easing, tween
│   │   ├── icons.js            Inline SVG icon set
│   │   ├── toast.js            Toast notifications
│   │   ├── export-pdf.js       Downloads + minimal vector PDF writer
│   │   ├── house-data.js       Walls, rooms, stairs, furniture (single source for 3D, drawings, minimap)
│   │   └── textures.js         Procedural canvas textures
│   ├── scene/scene.js          Three.js scene, builder engine, furniture library, cameras, render loop
│   ├── cad/cad.js              CAD sheets generated as SVG from the house data
│   ├── ui/
│   │   ├── shell.js            Modes (tabs), popovers, 3D view controls, project menu
│   │   ├── panels.js           Models panel: materials, snapshots, export
│   │   ├── cad-ui.js           Drawings mode UI
│   │   ├── interior-ui.js      Interior mode UI (rooms, finishes, lighting, minimap)
│   │   ├── create.js           Create mode: interactive builder + guided demo
│   │   ├── keyboard.js         Keyboard shortcuts
│   │   └── motion.js           Count-up numbers, ripples, placement ping
│   └── main.js                 Boot: initial camera, loading veil, intro build
├── assets/favicon.svg
├── manifest.webmanifest
├── tools/
│   ├── build_single.py         Bundle everything into one self-contained HTML file (Python 3)
│   └── check_syntax.mjs        Syntax-check every script listed in index.html (Node 18+)
├── .github/workflows/pages.yml Deploys the folder to GitHub Pages on every push to main
├── vercel.json                 Vercel: static site served from the repo root, no build step
└── package.json                Convenience scripts (serve, bundle, check)
```

## Run it

Open `index.html` in a browser (internet needed for Three.js from cdnjs and the web fonts), or serve the folder:

```bash
python3 -m http.server 8080      # then open http://localhost:8080
```

## Build a single file

```bash
python3 tools/build_single.py     # → dist/dwelio.single.html
```

## Deploy to GitHub Pages

Push to a repository, then **Settings → Pages → Source: GitHub Actions**. The workflow in `.github/workflows/pages.yml` syntax-checks the scripts and publishes the site. (Without Actions you can also choose *Deploy from a branch → main / root*.)

## Deploy to Vercel

Import the repository and keep the defaults — `vercel.json` already tells Vercel there is no build step and that the site is served from the repo root. (`npm run bundle` is a manual helper, deliberately not named `build`, so Vercel does not try to run it.)

## Notes for contributors

- The scripts are classic (non-module) files that share one global scope so the project also works when opened straight from disk. **Load order matters** — it is the order of the `<script>` tags in `index.html`; later files may use anything declared in earlier ones, and top-level code must not call functions from files that load later (do that in `js/main.js`).
- Units in the house data are metres (x → east, z → south, y → up). The builder works on a 0.5 m grid.
- Custom builds open in **Model** only; Interior and Drawings are generated for the sample house, Casa Terra.
