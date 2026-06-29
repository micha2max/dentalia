# Claude Code Prompt: Add WebMCP + llms.txt to an Astro Site

Paste the block below into a Claude Code session that has access to the Astro project. It will read the site, add WebMCP support, write an accurate `llms.txt`, and deploy to the **correct** production target (not just *a* deploy target).

The deployment section is the part that bit us last time. Read it before you trust the agent.

---

```
You have access to an Astro website project. Add WebMCP support, an
accurate llms.txt, and ship it to the actual production target so the
live domain serves the new files. Reference:
https://developer.chrome.com/docs/ai/webmcp

## 1. Explore the project first

- Read package.json. Note Astro version, the @astrojs/cloudflare /
  @astrojs/vercel / @astrojs/netlify adapter (or none = static), and the
  deploy scripts.
- Read astro.config.mjs (or .ts). Note: output mode ('static' vs 'server'
  vs 'hybrid'), adapter import, site URL.
- Find the base layout (src/layouts/*.astro). This is where the WebMCP
  components must be wired.
- Check existing endpoints/components: is there a /api/search.json? A
  search form? A content collection? Reuse what is there.
- Read the actual homepage, about page, services pages, contact page so
  you can write a real llms.txt with real content, not placeholders.

Report what you found in 5 to 10 bullet points before writing code.

## 2. Create src/components/WebMCPTools.astro

Inline script, no client framework dependency. Customize the tools to
THIS site. Always include search_site. Add ONE more tool that maps to
the site's highest-value conversion action (book_consultation,
request_quote, navigate_to_service, get_pricing). Implement it for real,
not as a stub.

    ---
    ---
    <script is:inline>
      (function () {
        if (typeof navigator === 'undefined' || !navigator.modelContext) return;

        navigator.modelContext.registerTool({
          name: 'search_site',
          description: 'Search this site by keyword and return up to ten matching pages with title, URL, and excerpt.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Keyword or phrase, plain text.' },
              limit: { type: 'integer', description: 'Max results, default 5, max 10.', default: 5 }
            },
            required: ['query']
          },
          annotations: { readOnlyHint: true },
          execute: async function (input) {
            const q = String(input.query || '').trim();
            if (!q) return 'No query provided.';
            const limit = Math.min(parseInt(input.limit, 10) || 5, 10);
            try {
              const res = await fetch('/api/search.json?q=' + encodeURIComponent(q) + '&limit=' + limit);
              if (!res.ok) return 'Search failed with status ' + res.status;
              const data = await res.json();
              const results = (data && data.results) || [];
              if (!results.length) return 'No results for "' + q + '".';
              return results.map(r => '- ' + r.title + ': ' + r.url + (r.excerpt ? ' (' + r.excerpt + ')' : '')).join('\n');
            } catch (e) {
              return 'Search error: ' + e.message;
            }
          }
        });

        // TODO: add the second site-specific tool here.
      })();
    </script>

## 3. Create src/components/WebMCPSearchForm.astro

Declarative WebMCP form. Required by the Lighthouse webmcp-schema-validity
audit. Every toolname needs a matching tooldescription, every input needs
a name attribute AND a toolparamdescription AND a real <label>.

    ---
    ---
    <form
      toolname="search_site_form"
      tooldescription="Search this site for pages by keyword and load the results page."
      action="/search"
      method="get"
      class="webmcp-search-form"
    >
      <label for="webmcp-q">Search the site</label>
      <input
        id="webmcp-q"
        type="search"
        name="q"
        toolparamdescription="The keyword or phrase to search for. Plain text."
        autocomplete="off"
      />
      <button type="submit">Search</button>
    </form>

    <style>
      .webmcp-search-form {
        position: absolute; left: -9999px; top: auto;
        width: 1px; height: 1px; overflow: hidden;
      }
    </style>

If a visible search form already exists, add the toolname /
tooldescription / toolparamdescription attributes to THAT form instead
of duplicating it.

## 4. Wire both components into the base layout

Import and render both just before </body>.

## 5. Create the search endpoint if missing

If there is no /api/search.json, create src/pages/api/search.json.ts.
Search across whichever content collections exist (services, locations,
blog, pages) and return { results: [{ title, url, excerpt }] }.

## 6. Create public/llms.txt with REAL content

Read the homepage, about, services, contact pages. Pull actual business
name, real services, real contact info. Do not use placeholders. The
file must have:
- H1 with business name
- Blockquote one-line summary
- ## About (2-3 sentences from real content)
- ## Services (markdown list, each link absolute or root-relative)
- ## Key Pages (about, pricing if it exists, contact)
- ## Agent Tools Available (list the tools you registered)
- ## Contact (real phone, email, hours if available)

## 7. Add the Permissions-Policy header

Detect the deploy target by checking files in this order:
- wrangler.jsonc / wrangler.toml -> Cloudflare (Worker OR Pages, see step 8)
- vercel.json or .vercel/ -> Vercel
- netlify.toml or _redirects -> Netlify

Then add the header:
- Cloudflare Pages: append to public/_headers
    /*
      Permissions-Policy: tools=(self)
- Cloudflare Workers (Astro v6 + @astrojs/cloudflare): public/_headers
  STILL works because the adapter respects it. Add the same lines.
- Vercel: add to vercel.json under "headers"
- Netlify: add to netlify.toml under [[headers]]

## 8. Identify the CORRECT deploy target (read this carefully)

This is the step that breaks for most projects. Do not assume.

A. Read wrangler.jsonc / wrangler.toml. Look for:
   - "name": "..." -> this is the project/Worker name.
   - "main": "..." -> if present, this is a WORKER, not Pages.
   - "pages_build_output_dir": "..." -> if present, this is PAGES.
   - "routes" or "custom_domains" -> this tells you which domains the
     Worker/Pages project actually serves.

B. Run these to verify what is currently live:
       npx wrangler whoami
       npx wrangler deployments list           # for Workers
       npx wrangler pages project list         # for Pages
   Match the project name in wrangler config to a deployment whose
   custom domain equals the site's live domain.

C. If wrangler.jsonc has "main" set, this is a Worker. Build, then deploy
   with:
       npm run build
       npx wrangler deploy
   Do NOT run `wrangler pages deploy` for a Worker project. It will
   create a parallel Pages project that is NOT connected to the live
   domain, and you will spend an hour debugging "cache" issues that are
   actually misrouted deploys.

D. If wrangler.jsonc has "pages_build_output_dir", this is Pages. Find
   the right output directory before deploying. Astro v6 with the
   Cloudflare adapter writes static assets to dist/client/, NOT to
   dist/. Run `ls dist/` after build to confirm. If you see a `client/`
   subfolder, deploy that:
       npm run build
       npx wrangler pages deploy dist/client --project-name <name>
   If `pages_build_output_dir` is already set to "dist/client" in
   wrangler config, `npx wrangler pages deploy` alone will pick it up.

E. Cache vs routing diagnosis: after deploy, if the live domain still
   serves the old file, do NOT immediately blame cache. Run:
       curl -sI https://<live-domain>/llms.txt
       curl -s  https://<live-domain>/llms.txt | head -20
   Compare against the deploy preview URL Wrangler printed. If the
   preview URL serves the new content but the live domain serves old,
   that is a ROUTING problem (wrong project), not a cache problem.
   Re-check which Worker/Pages project owns the custom domain.

F. For Vercel: `vercel --prod`. For Netlify: `netlify deploy --prod`.
   For static-only (no adapter, no host config): tell the user to deploy
   manually.

## 9. Build, deploy, verify on the live domain

1. Run `npm run build`. Confirm it succeeds.
2. Deploy using the correct command from step 8.
3. Confirm the live domain serves the new files:
       curl -sI https://<live-domain>/llms.txt | head -5
       curl -s  https://<live-domain>/llms.txt | head -10
   The H1 should be the real business name. If you see placeholders or
   a 404, you deployed to the wrong target. Go back to step 8.
4. Open the live domain in Chrome Canary with
   chrome://flags/#enable-webmcp-testing on. In DevTools Console:
       await navigator.modelContext.getTools()
   Confirm at least three tools: search_site, search_site_form, plus
   the site-specific one.
5. Run Lighthouse > Agentic Browsing on the live domain. Confirm
   webmcp-schema-validity and llms-txt-presence pass.

## 10. Report back

List:
- Files created or modified, with paths.
- Tool names and one-line descriptions.
- Detected deploy target (Worker vs Pages vs Vercel vs Netlify vs
  static) and WHY you picked it (which file pointed you there).
- The exact deploy command that worked.
- A curl snippet confirming the live domain now serves the new
  llms.txt.
- Any TODOs the user must complete (e.g. real phone if not findable
  on the site).

## Rules

- No em dashes anywhere. Use colons, commas, parentheses, or new sentences.
- Do not invent services, prices, addresses, or hours. Read the live site.
- Do not add a JS framework or new runtime dependency. Plain inline
  script only.
- Tool descriptions use positive language ("Search posts by keyword"),
  not negative ("Do not use for...").
- One function per tool. Verb names (search_site, book_consultation),
  not start_search_process.
- Never assume a deploy command from past sessions or memory. Always
  re-derive the deploy target from wrangler.jsonc / vercel.json /
  netlify.toml in THIS project.
- If wrangler config has "main" set, it is a Worker. Use
  `wrangler deploy`. Never `wrangler pages deploy`.
- For Astro v6 + Cloudflare, the static output directory is dist/client,
  not dist. Verify with `ls dist/` after build before deploying.
- After deploy, ALWAYS curl the live domain to confirm the new file
  shipped. If it did not, it is a routing problem, not a cache problem.
```

---

## Changelog vs the v1 prompt

| What was missing | What was added |
|---|---|
| Treated Cloudflare as one target | Splits Worker vs Pages, reads `wrangler.jsonc` to detect which |
| Assumed `dist/` is the output | Astro v6 Cloudflare adapter writes to `dist/client/`. Explicit check. |
| Assumed memory of past deploys | Forbids relying on prior session memory. Re-derive every time. |
| Blamed cache when files were stale | Adds curl-based verification + a "routing not cache" diagnosis. |
| Single deploy command | Verifies the project/Worker actually owns the live custom domain before deploying. |
| Verified locally only | Step 9 confirms the live domain (not just preview URL) serves the new files. |

## When to use this

Every Astro site, every time. The deploy logic is generic and works for Cloudflare Workers, Cloudflare Pages, Vercel, Netlify, and static. The site-content logic re-reads the site each run, so it adapts to whatever domain and business you point it at.
