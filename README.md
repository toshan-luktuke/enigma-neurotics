# TIL

A daily discovery website built with Astro, TypeScript, Markdown, and native CSS. No database or runtime backend is required. Fonts and icons are served locally.

## Run locally

Use Node 22.22 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by Astro. `npm run build` checks types and generates the site in `dist/`. `npm run preview` serves that build.

On restricted machines, set `ASTRO_TELEMETRY_DISABLED=1` in your shell if Astro cannot write its user-level settings. The site itself only writes build output within the project.

## Add an edition

1. Copy `templates/discovery.md` into `src/content/discoveries/`. Use a name such as `2026-10-20-your-topic.md`.
2. Give the edition a unique slug and a publication date in `YYYY-MM-DD` format. Dates use `Asia/Kolkata`, regardless of where the build runs.
3. Choose Nature, Science, Space, Technology, History, or Culture. Add a summary and at least one real HTTPS source with its title and publisher.
4. Write the article in Markdown. Headings can vary by story; second-level headings populate the section navigation automatically.
5. If using an image, save it in `src/assets/`, reference its relative path, and supply useful alternative text and attribution. Astro creates optimized WebP variants.
6. Check every factual claim against the linked sources. Review **all copy with the humanizer skill**, including the title, summary, body, captions, and any new interface text. Remove filler and stock phrasing without losing qualifications or adding claims. The skill is available at `C:/Users/tosha/.agents/skills/humanizer/SKILL.md` in the author's environment; other editors should use their installed humanizer skill and this same editorial checklist.
7. Set `draft: false`, run the checks, and merge the change into the deployment branch.

The schema rejects invalid dates, unsupported categories, missing sources, and images without alternative text. The publication selector rejects duplicate slugs and duplicate dates among non-draft editions, including future editions. Drafts can share a date while work is in progress.

The site publishes editions whose date is on or before the build's date in India. This is a daily edition model, not a per-minute embargo: a push after midnight IST can publish that day's entry before the morning scheduled build. To require an exact release time later, introduce a publication timestamp and update the shared selector.

Until a rebuild, visitors see the previously generated edition. If no article is scheduled, the most recent edition remains visible with its actual publication date. If none has been published, the homepage shows a simple first-edition message. Future and draft articles never enter public routes, archive data, RSS, or sitemap. Their Markdown is not copied into the public output. Do not place confidential assets in `public/`.

## Voice and corrections

Write as a curious, informed person explaining something to a friend. Answer the question early, use concrete details, and keep uncertainty where the evidence needs it. Never invent quotations, personal memories, sources, or numerical claims to make a story livelier. The humanizer pass is an editing step, not a substitute for fact-checking.

Keep quotations and source titles faithful even if their wording differs from the house style. For a factual correction, add a dated note to the article saying what changed. Spelling and formatting fixes do not require a note.

The starter articles are original summaries of the sources linked under each story. The forest photograph is by Sebastian Unrau, from Unsplash, and is credited on the article. It illustrates a forest; it is not an image of the cited experiment. Read the [Unsplash license](https://unsplash.com/license) before reusing or replacing photography. Phosphor icons are MIT licensed; the bundled fonts use the SIL Open Font License. Package license files remain in their respective dependencies.

## Deploy to Netlify

1. Push this project to a GitHub repository and import that repository into Netlify.
2. Keep the provided `netlify.toml`: the build command is `npm run build`, and the publish directory is `dist`.
3. Set `SITE_URL` to the final public origin, including `https://`. Netlify's `URL` environment variable is the fallback. Local builds use `http://localhost:4321` when neither is configured. Set the final origin before production so canonical links, RSS, sitemap, and social metadata are correct.
4. Deploy the site. Netlify rebuilds on pushes to its configured deployment branch.
5. Create a Netlify build hook for that branch. Save its URL in the GitHub repository's Actions secret `NETLIFY_BUILD_HOOK`. Never add it to source files or public environment variables.
6. Enable the repository's GitHub Actions workflows. Run **Publish daily edition** manually once to verify the hook.

The daily workflow runs at 00:45 UTC, equivalent to 06:15 IST. GitHub can delay scheduled jobs; this is a morning publishing target, not an exact-time guarantee. Scheduled workflows run from the default branch. Keep the deployment branch and workflow source aligned. GitHub may disable scheduled workflows in inactive public repositories; check Actions if publishing stops.

The hook request's success means Netlify accepted the request, not that a deployment completed. Check Netlify's deploy status and use its native failed-deploy notifications. A failed build keeps the previous successful deployment. To recover, fix the content/build failure and rerun the workflow or trigger a deploy in Netlify. Roll back using a previous successful Netlify deployment if needed.

No production deployment or credentials are included in this repository. Set the repository, Netlify site, and secret in your accounts before daily releases can run.

## Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit tests cover IST date rollover, eligibility, ordering, missing days, duplicate dates/slugs, and reading time. Browser checks cover desktop/mobile reading, archive search and filters, sharing and failure fallback, keyboard navigation, reduced motion, no-JavaScript reading, feeds, and 404s. Automated axe checks look for WCAG A/AA violations on the main pages; they complement visual and keyboard review and do not certify accessibility. The CI workflow runs these checks using Chromium.

The initial browser tests use the seven starter editions dated October 13 through 19, 2026. Update their content-specific assertions when changing that fixture content. The publication logic tests use explicit dates and do not depend on the machine clock.

## Maintain the site

- `src/lib/content.ts` is the entry point for published content. Routes and feeds should use it rather than query raw collections. A future CMS adapter belongs here.
- `src/lib/publication.ts` owns pure date, validation, and reading-time logic.
- `src/layouts/` and `src/components/` contain shared page and reading elements. `src/styles/global.css` defines design tokens and responsive rules.
- Content is rendered at build time. Search and category filters operate on the already public archive in the browser. Sharing loads a small script and falls back to a selectable link if clipboard access fails.
- RSS, sitemap, robots, canonical links, and article structured data are generated with the configured site origin. Article metadata uses the permanent article URL; the homepage canonical points to the homepage.
- Commit `package-lock.json`, install with `npm ci`, and review dependency updates regularly. Run the checks after updates.
- Use `npm run format` to apply the shared formatting rules, or `npm run format:check` to check them without editing files.

Accounts, personalized recommendations, comments, email delivery, and automated content generation are deliberately outside this version.
