# Product Screenshots Documentation Implementation Plan

**Goal:** Add the four real Git-Ingest workflow screenshots to the repository and present them in the README and product page with descriptive names and accessible captions.

**Architecture:** Store source screenshots in `assets/screenshots/`, keep the existing static product page self-contained, and add a responsive visual gallery plus a compact README gallery. No application runtime code changes.

**Tech Stack:** Markdown, static HTML/CSS, PNG assets.

---

### Task 1: Add descriptive screenshot assets

**Files:**

- Create: `assets/screenshots/project-folder-picker.png`
- Create: `assets/screenshots/project-preview-summary.png`
- Create: `assets/screenshots/generated-output-preview.png`
- Create: `assets/screenshots/saved-export-confirmation.png`

- [ ] Copy the four supplied screenshots into `assets/screenshots/` using the semantic filenames above.
- [ ] Confirm each copied file is a 2784×1944 PNG.

### Task 2: Document the workflow in README

**Files:**

- Modify: `README.md`

- [ ] Add a `## 🖥️ Product Screenshots` section after the project flow section.
- [ ] Show the four screenshots in workflow order with descriptive alt text and short captions.
- [ ] Keep the section concise and link each image from the tracked repository path.

### Task 3: Add the real workflow gallery to the product page

**Files:**

- Modify: `index.html`

- [ ] Add responsive gallery styles that match the existing light desktop-app visual language.
- [ ] Add four workflow cards under `#workflow`, each using one screenshot and a short explanation.
- [ ] Preserve the existing workflow copy and ensure the images have meaningful alt text.
- [ ] Check mobile layout rules keep the cards readable at narrow widths.

### Task 4: Verify links and presentation

**Files:**

- Verify: `README.md`
- Verify: `index.html`
- Verify: `assets/screenshots/*.png`

- [ ] Run repository checks relevant to docs and static assets.
- [ ] Confirm every referenced image exists and no source screenshot names remain in tracked docs.
- [ ] Inspect the final diff and preserve unrelated user changes.
