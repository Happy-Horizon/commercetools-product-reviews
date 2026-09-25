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
cd product-reviews
npm install
cp .env.example .env.local
```

From the repo root you can also run `npm start`, `npm test`, `npm run typecheck`, and `npm run lint`.

Edit `.env.local` and set:

- `CLOUD_IDENTIFIER` — your Merchant Center region (`gcp-eu`, `gcp-us`, `aws-eu`, `aws-us`, …)
- `CTP_INITIAL_PROJECT_KEY` — a project key you can log into

Then start the app:

```bash
npm start
```

This Custom Application **must** run on `http://localhost:3001`. After login, Merchant Center always sends `__local` apps back to that URL. Another port (2001, 3002, …) can serve the HTML, but the OIDC callback still lands on 3001 — which is the shop if that process is bound there.

Run the shop on a different port (for example `3000`) and keep this app on 3001.

## Register in Merchant Center

1. Open **Settings → Custom Applications** (organization level) and add a Custom Application.
2. Use these values:
   - **Name:** Product Reviews
   - **Application URL:** `http://localhost:3001`
   - **Entry point URI path:** `hh-product-reviews`
   - **OAuth scopes:** `view_products`, `manage_products`, `view_key_value_documents`, `manage_key_value_documents`, `view_states`, `manage_states`
3. Install the application on the commercetools project(s) that should use it.
4. Open Merchant Center for that project. **Product reviews** appears in the menu.

`view_states` / `manage_states` are required so Publish and Unpublish can move a review between the `review-draft` and `review-published` states. If the Custom Application was already registered, add those scopes in Merchant Center and sign in again.

The first time you start `npm start`, the CLI prints a development login URL. Sign in with your Merchant Center user.

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

See `product-reviews/custom-application-config.mjs` and `product-reviews/.env.example`:

- `entryPointUriPath`: `hh-product-reviews`
- `CLOUD_IDENTIFIER`: your Merchant Center region
- `CTP_INITIAL_PROJECT_KEY`: the project used after local login

Do not commit `.env.local` or API client secrets. The Custom Application uses the Merchant Center session.

## Deploy with Connect

This repo is a Connect connector. The specification is `connect.yaml` at the repo root. The Custom Application lives in `product-reviews/` (that folder name must match `deployAs.name`).

1. Register the Custom Application in Merchant Center first. Use a dummy **Application URL** (for example `https://example.com`). Note the **Application ID** and keep **Entry point URI path** as `hh-product-reviews` (`product-reviews` is already taken on gcp-eu).
2. Push this repo and create a **new git tag** (the existing `v1.0.0` tag does not include `connect.yaml`).
3. In Merchant Center, create an Organization Connector that points at this GitHub repo and that new tag.
4. Publish (preview or private use), then install it. When asked for configuration, set:
   - `CUSTOM_APPLICATION_ID` — the Application ID from step 1
   - `ENTRY_POINT_URI_PATH` — `hh-product-reviews`
   - `CLOUD_IDENTIFIER` — your region (`gcp-eu` by default)
5. When the installation is ready, copy the Connect **URL** for `product-reviews` and paste it as the Custom Application **Application URL**.

`APPLICATION_URL` is injected by Connect. You do not set it in `connect.yaml`.

Grant the [connect-mu](https://github.com/connect-mu) machine user read access if the GitHub repo is private.

## Docs

- [Custom Applications](https://docs.commercetools.com/merchant-center-customizations/custom-applications)
- [Deploy to Connect](https://docs.commercetools.com/merchant-center-customizations/deployment/commercetools-connect)
- [Reviews API](https://docs.commercetools.com/api/projects/reviews)

<p align="center">
  <br />
  Powered by
  <br />
  <img src="./product-reviews/src/assets/happy-horizon-wordmark-readme.png" alt="Happy Horizon" width="120" height="42" />
</p>
