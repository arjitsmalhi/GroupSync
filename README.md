# GroupSync

> A zero-login, 100% client-side web application for university students to run group projects with balanced workloads, derived interim deadlines, and professor-ready contribution reports.

---

## Quick Start (How to Run Locally)

```bash
# Install dependencies
npm install

# Run pure logic test suite (Vitest)
npm test

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## Deployment (Static Hosting)

GroupSync has no backend, no database, no serverless functions, and zero external network calls. It builds to plain static HTML/CSS/JS in `dist/`.

- **GitHub Pages**: Build with `npm run build` and publish the `dist/` folder via GitHub Actions or branch deployment.
- **Netlify**: Connect your repository with build command `npm run build` and publish directory `dist`.
- **Vercel**: Set framework to Vite, build command `npm run build`, output directory `dist`.

---

## How Sharing and Merging Work

1. **Snapshot URL**: The entire project state is serialized into JSON, compressed via `lz-string`'s URI-safe encoder, and attached as the URL hash (`#s=...`). The hash is never transmitted across the network to any server.
2. **Slim Links vs .JSON Files**:
   - For links exceeding 2,000 characters, users can toggle "Slim link" to omit historical activity logs.
   - For complete archival, users can export and import standard `.json` backup files.
3. **Merge Engine**:
   When opening a share link or importing a file with a matching project ID:
   - **Per Task**: The newest `updatedAt` wins. A `deletedAt` timestamp counts as an update (supporting soft-delete propagation).
   - **Activity Log**: Unioned by entry ID and sorted chronologically by timestamp.
   - **Members**: Unioned by ID.
   - **Milestones**: Selected from the version with the newer project `updatedAt`.
   - A detailed 3-way change summary is previewed prior to confirmation.

---

## Honest Limitations

- **Snapshot Sharing**: Links represent a point-in-time snapshot, not real-time concurrent synchronization (WebSockets/CRDT). Teammates editing simultaneously must share links and merge.
- **Self-Declared Identity**: GroupSync has zero authentication or passwords. Member identity is self-declared on the browser and can be switched by the user at will.
- **Integrity Fingerprint Scope**: The SHA-256 fingerprint generated on the professor report proves that the exported data matches the snapshot state when generated; it does not prevent someone with access to raw `.json` files from modifying values prior to re-generating a hash.

