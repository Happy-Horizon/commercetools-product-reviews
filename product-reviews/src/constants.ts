// Make sure to import the helper functions from the `ssr` entry point.
import { entryPointUriPathToPermissionKeys } from '@commercetools-frontend/application-shell/ssr';
import type { ApplicationWindow } from '@commercetools-frontend/constants';

declare let window: ApplicationWindow;
declare const process: { env: Record<string, string | undefined> };

export const entryPointUriPath =
  (typeof window !== 'undefined' && window.app?.entryPointUriPath) ||
  process.env.ENTRY_POINT_URI_PATH ||
  'product-reviews';

export const PERMISSIONS = entryPointUriPathToPermissionKeys(entryPointUriPath);

export const REVIEW_SETTINGS_CONTAINER = 'product-reviews';
export const REVIEW_SETTINGS_KEY = 'settings';

export const REVIEW_TYPE_KEY = 'shop-review';
export const REVIEW_PUBLISHED_FIELD = 'published';
export const REVIEW_PROMOTIONAL_FIELD = 'promotional';
export const REVIEW_RATINGS_FIELD = 'ratings';
export const REVIEW_STATE_DRAFT_KEY = 'review-draft';
export const REVIEW_STATE_PUBLISHED_KEY = 'review-published';
