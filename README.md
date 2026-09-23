<p align="center">
  <a href="https://commercetools.com/">
    <img
      alt="commercetools"
      width="280"
      src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png"
    />
  </a>
</p>

# Product Reviews

Merchant Center Custom Application for commercetools product reviews.

Lists storefront product reviews from the commercetools Reviews API inside Merchant Center. Merchant Center has no built-in Reviews screen; this app is the admin view for ratings, text, and promotional disclosure.

## Local development

```bash
pnpm install
cp .env.example .env.local
```

Edit `.env.local` and set:

- `CLOUD_IDENTIFIER` — your Merchant Center region (`gcp-eu`, `gcp-us`, `aws-eu`, `aws-us`, …)
- `CTP_INITIAL_PROJECT_KEY` — a project key you can log into

Then start the app:

```bash
pnpm start
```

This Custom Application **must** run on `http://localhost:3001`. After login, Merchant Center always sends `__local` apps back to that URL. Another port (2001, 3002, …) can serve the HTML, but the OIDC callback still lands on 3001 — which is the shop if that process is bound there.

Run the shop on a different port (for example `3000`) and keep this app on 3001.

## Register in Merchant Center

1. Open **Settings → Custom Applications** (organization level) and add a Custom Application.
2. Use these values:
   - **Name:** Product Reviews
   - **Application URL:** `http://localhost:3001`
   - **Entry point URI path:** `product-reviews`
   - **OAuth scopes:** `view_products`, `manage_products`, `view_key_value_documents`, `manage_key_value_documents`, `view_states`, `manage_states`
3. Install the application on the commercetools project(s) that should use it.
4. Open Merchant Center for that project. **Product reviews** appears in the menu.

`view_states` / `manage_states` are required so Publish and Unpublish can move a review between the `review-draft` and `review-published` states. If the Custom Application was already registered, add those scopes in Merchant Center and sign in again.

The first time you start `pnpm start`, the CLI prints a development login URL. Sign in with your Merchant Center user.

## What it shows

- Paginated review list: product, author, title, **draft/published status**, rating, promotional flag, created date
- Default list filter is **Draft**. Publish from the review detail page so the storefront can show it
- Detail modal: edit author, title, text, ratings, and promotional flag; publish / unpublish; delete with confirmation
- Settings: rating scale (1–5 or 1–10), extra ratings with per-locale labels (price, quality, …), and storefront form fields (hidden / optional / required)
- Promotional comes from custom field `shop-review.promotional` (Boolean) written by the shop
- Visibility comes from custom field `shop-review.published` (Boolean). Missing or `false` means draft

Settings are stored as Custom Object `product-reviews` / `settings` so the shop can read the same document. Extra rating scores are stored on each review as custom field `shop-review.ratings` (JSON object). The commercetools `rating` field stays the overall score (average of extra ratings when those are configured).

The shop must create reviews with `published: false` and list only `published=true`. Restart the shop after that change so type `shop-review` gets the `published` field.

## Project config

See `custom-application-config.mjs` and `.env.example`:

- `entryPointUriPath`: `product-reviews`
- `CLOUD_IDENTIFIER`: your Merchant Center region
- `CTP_INITIAL_PROJECT_KEY`: the project used after local login

Do not commit `.env.local` or API client secrets. The Custom Application uses the Merchant Center session.

## Docs

- [Custom Applications](https://docs.commercetools.com/merchant-center-customizations/custom-applications)
- [Reviews API](https://docs.commercetools.com/api/projects/reviews)

<p align="center">
  <br />
  Powered by
  <br />
  <img src="./src/assets/happy-horizon-wordmark-readme.png" alt="Happy Horizon" width="120" height="42" />
</p>
