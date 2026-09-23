/// <reference path="../../../@types-extensions/graphql-ctp/index.d.ts" />

import type { ApolloError } from '@apollo/client';
import {
  useMcMutation,
  useMcQuery,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import type { TDataTableSortingState } from '@commercetools-uikit/hooks';
import {
  REVIEW_PROMOTIONAL_FIELD,
  REVIEW_PUBLISHED_FIELD,
  REVIEW_RATINGS_FIELD,
  REVIEW_STATE_DRAFT_KEY,
  REVIEW_STATE_PUBLISHED_KEY,
  REVIEW_TYPE_KEY,
} from '../../constants';
import DeleteReviewMutation from './delete-review.ctp.graphql';
import FetchReviewDetailsQuery from './fetch-review-details.ctp.graphql';
import FetchReviewsQuery from './fetch-reviews.ctp.graphql';
import SearchProductsQuery from './search-products.ctp.graphql';
import UpdateReviewMutation from './update-review.ctp.graphql';

export type TReviewCustomField = {
  name: string;
  value: unknown;
};

export type TReviewTarget = {
  __typename?: string;
  id: string;
  key?: string | null;
  masterData?: {
    current?: {
      name?: string | null;
    } | null;
  } | null;
};

export type TReview = {
  id: string;
  version?: number;
  authorName?: string | null;
  title?: string | null;
  text?: string | null;
  rating?: number | null;
  locale?: string | null;
  createdAt: string;
  includedInStatistics: boolean;
  uniquenessValue?: string | null;
  custom?: {
    customFieldsRaw?: TReviewCustomField[] | null;
  } | null;
  customer?: {
    id: string;
    email?: string | null;
  } | null;
  target?: TReviewTarget | null;
};

type TReviewsQuery = {
  reviews: {
    total: number;
    count: number;
    offset: number;
    results: TReview[];
  };
};

type TReviewDetailsQuery = {
  review?: TReview | null;
};

export type TReviewStatusFilter = 'all' | 'draft' | 'published';
export type TReviewPromotionalFilter = 'all' | 'yes' | 'no';

export type TReviewListFilters = {
  productQuery: string;
  status: TReviewStatusFilter;
  promotional: TReviewPromotionalFilter;
};

export const DEFAULT_REVIEW_LIST_FILTERS: TReviewListFilters = {
  productQuery: '',
  status: 'all',
  promotional: 'all',
};

type PaginationAndSortingProps = {
  page: { value: number };
  perPage: { value: number };
  tableSorting: TDataTableSortingState;
  locale: string;
  filters: TReviewListFilters;
};

type TUpdateReviewMutation = {
  updateReview?: TReview | null;
};

export type TReviewEditValues = {
  authorName: string;
  title: string;
  text: string;
  rating: number;
  promotional: boolean;
  ratings: Record<string, number>;
};

type TReviewUpdateActionInput = {
  setAuthorName?: { authorName?: string };
  setTitle?: { title?: string };
  setText?: { text?: string };
  setRating?: { rating?: number };
  setCustomField?: { name: string; value: string };
  setCustomType?: {
    typeKey: string;
    fields: Array<{ name: string; value: string }>;
  };
  transitionState?: {
    force: boolean;
    state: { typeId: string; key: string };
  };
};

type TUpdateReviewVariables = {
  id: string;
  version: number;
  actions: TReviewUpdateActionInput[];
};

type TDeleteReviewMutation = {
  deleteReview?: { id: string } | null;
};

type TDeleteReviewVariables = {
  id: string;
  version: number;
};

const platformContext = {
  target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
};

export function isPromotional(review: TReview): boolean {
  return Boolean(
    review.custom?.customFieldsRaw?.some(
      (field) => field.name === REVIEW_PROMOTIONAL_FIELD && field.value === true
    )
  );
}

export function isPublished(review: TReview): boolean {
  return Boolean(
    review.custom?.customFieldsRaw?.some(
      (field) => field.name === REVIEW_PUBLISHED_FIELD && field.value === true
    )
  );
}

export function parseRatingsValue(value: unknown): Record<string, number> {
  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  return Object.entries(raw as Record<string, unknown>).reduce(
    (ratings, [key, score]) => {
      const amount = typeof score === 'number' ? score : Number(score);
      if (Number.isInteger(amount) && amount >= 1 && amount <= 10) {
        ratings[key] = amount;
      }
      return ratings;
    },
    {} as Record<string, number>
  );
}

export function reviewRatings(review: TReview): Record<string, number> {
  const field = review.custom?.customFieldsRaw?.find(
    (item) => item.name === REVIEW_RATINGS_FIELD
  );
  return parseRatingsValue(field?.value);
}

export function reviewStatusWhere(
  filter: TReviewStatusFilter
): string | undefined {
  if (filter === 'published') {
    return `custom(fields(${REVIEW_PUBLISHED_FIELD}=true))`;
  }
  if (filter === 'draft') {
    return `not(custom(fields(${REVIEW_PUBLISHED_FIELD}=true)))`;
  }
  return undefined;
}

export function escapePredicate(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function productSearchWhere(query: string, locale: string): string {
  const escaped = escapePredicate(query.trim());
  return [
    `id="${escaped}"`,
    `key="${escaped}"`,
    `masterData(current(name(${locale}="${escaped}")))`,
  ].join(' or ');
}

export function buildReviewsWhere(
  filters: TReviewListFilters,
  productIds?: string[]
): string | undefined {
  const parts: string[] = [];
  const status = reviewStatusWhere(filters.status);
  if (status) {
    parts.push(status);
  }
  if (filters.promotional === 'yes') {
    parts.push(`custom(fields(${REVIEW_PROMOTIONAL_FIELD}=true))`);
  } else if (filters.promotional === 'no') {
    parts.push(`not(custom(fields(${REVIEW_PROMOTIONAL_FIELD}=true)))`);
  }
  if (filters.productQuery.trim()) {
    if (productIds && productIds.length > 0) {
      parts.push(
        `target(id in (${productIds
          .map((id) => `"${escapePredicate(id)}"`)
          .join(',')}))`
      );
    } else {
      parts.push('id="00000000-0000-0000-0000-000000000000"');
    }
  }
  return parts.length ? parts.join(' and ') : undefined;
}

export function publishActions(review: TReview, published: boolean) {
  const value = JSON.stringify(published);
  const transitionState = {
    transitionState: {
      force: true,
      state: {
        typeId: 'state',
        key: published ? REVIEW_STATE_PUBLISHED_KEY : REVIEW_STATE_DRAFT_KEY,
      },
    },
  };
  if (review.custom) {
    return [
      {
        setCustomField: {
          name: REVIEW_PUBLISHED_FIELD,
          value,
        },
      },
      transitionState,
    ];
  }
  return [
    {
      setCustomType: {
        typeKey: REVIEW_TYPE_KEY,
        fields: [{ name: REVIEW_PUBLISHED_FIELD, value }],
      },
    },
    transitionState,
  ];
}

const jsonFieldValue = (value: unknown): string => JSON.stringify(value);

const ratingsFieldValue = (ratings: Record<string, number>): string =>
  jsonFieldValue(JSON.stringify(ratings));

const sameRatings = (
  left: Record<string, number>,
  right: Record<string, number>
): boolean => {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return Array.from(keys).every((key) => left[key] === right[key]);
};

const optionalText = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

export function editActions(
  review: TReview,
  values: TReviewEditValues
): TReviewUpdateActionInput[] {
  const actions: TReviewUpdateActionInput[] = [];
  const authorName = optionalText(values.authorName);
  const title = optionalText(values.title);
  const text = optionalText(values.text);

  if (optionalText(review.authorName ?? '') !== authorName) {
    actions.push({ setAuthorName: { authorName: authorName ?? '' } });
  }
  if (optionalText(review.title ?? '') !== title) {
    actions.push({ setTitle: { title: title ?? '' } });
  }
  if (optionalText(review.text ?? '') !== text) {
    actions.push({ setText: { text: text ?? '' } });
  }
  if ((review.rating ?? undefined) !== values.rating) {
    actions.push({ setRating: { rating: values.rating } });
  }

  const promotionalChanged = isPromotional(review) !== values.promotional;
  const ratingsChanged = !sameRatings(reviewRatings(review), values.ratings);

  if (!promotionalChanged && !ratingsChanged) {
    return actions;
  }

  if (!review.custom) {
    const fields = [
      {
        name: REVIEW_PUBLISHED_FIELD,
        value: jsonFieldValue(false),
      },
      {
        name: REVIEW_PROMOTIONAL_FIELD,
        value: jsonFieldValue(values.promotional),
      },
    ];
    if (Object.keys(values.ratings).length > 0) {
      fields.push({
        name: REVIEW_RATINGS_FIELD,
        value: ratingsFieldValue(values.ratings),
      });
    }
    actions.push({
      setCustomType: {
        typeKey: REVIEW_TYPE_KEY,
        fields,
      },
    });
    return actions;
  }

  if (promotionalChanged) {
    actions.push({
      setCustomField: {
        name: REVIEW_PROMOTIONAL_FIELD,
        value: jsonFieldValue(values.promotional),
      },
    });
  }
  if (ratingsChanged) {
    actions.push({
      setCustomField: {
        name: REVIEW_RATINGS_FIELD,
        value: ratingsFieldValue(values.ratings),
      },
    });
  }
  return actions;
}

export function productName(review: TReview): string {
  if (review.target?.__typename !== 'Product') {
    return review.target?.id ?? '—';
  }
  return (
    review.target.masterData?.current?.name ||
    review.target.key ||
    review.target.id
  );
}

type TProductsQuery = {
  products: {
    results: Array<{ id: string }>;
  };
};

export const useProductSearchIds = (query: string, locale: string) => {
  const trimmed = query.trim();
  const { data, error, loading } = useMcQuery<TProductsQuery>(
    SearchProductsQuery,
    {
      variables: {
        where: productSearchWhere(trimmed, locale),
        locale,
      },
      skip: !trimmed,
      context: platformContext,
    }
  );

  return {
    productIds: trimmed
        ? (data?.products.results.map((product: { id: string }) => product.id) ??
          [])
      : undefined,
    error: error as ApolloError | undefined,
    loading: Boolean(trimmed) && loading,
  };
};

export const useReviewsFetcher = ({
  page,
  perPage,
  tableSorting,
  locale,
  filters,
}: PaginationAndSortingProps) => {
  const productSearch = useProductSearchIds(filters.productQuery, locale);
  const skipReviews = productSearch.loading;
  const { data, error, loading } = useMcQuery<TReviewsQuery>(
    FetchReviewsQuery,
    {
      variables: {
        limit: perPage.value,
        offset: (page.value - 1) * perPage.value,
        sort: [`${tableSorting.value.key} ${tableSorting.value.order}`],
        locale,
        where: buildReviewsWhere(filters, productSearch.productIds),
      },
      skip: skipReviews,
      context: platformContext,
    }
  );

  return {
    reviewsPaginatedResult: data?.reviews,
    error: (error ?? productSearch.error) as ApolloError | undefined,
    loading: loading || productSearch.loading,
  };
};

export const useReviewDetailsFetcher = (id: string, locale: string) => {
  const { data, error, loading } = useMcQuery<TReviewDetailsQuery>(
    FetchReviewDetailsQuery,
    {
      variables: { id, locale },
      context: platformContext,
    }
  );

  return {
    review: data?.review ?? undefined,
    error: error as ApolloError | undefined,
    loading,
  };
};

export const useReviewPublisher = () => {
  const [updateReview, { loading }] = useMcMutation<
    TUpdateReviewMutation,
    TUpdateReviewVariables
  >(UpdateReviewMutation, {
    context: platformContext,
    refetchQueries: ['FetchReviews', 'FetchReviewDetails'],
  });

  const setPublished = (review: TReview, published: boolean) => {
    if (review.version == null) {
      return Promise.reject(new Error('Review version is required'));
    }
    return updateReview({
      variables: {
        id: review.id,
        version: review.version,
        actions: publishActions(review, published),
      },
    });
  };

  return {
    setPublished,
    loading,
  };
};

export const useReviewEditor = () => {
  const [updateReview, { loading }] = useMcMutation<
    TUpdateReviewMutation,
    TUpdateReviewVariables
  >(UpdateReviewMutation, {
    context: platformContext,
    refetchQueries: ['FetchReviews', 'FetchReviewDetails'],
  });

  const saveReview = (review: TReview, values: TReviewEditValues) => {
    if (review.version == null) {
      return Promise.reject(new Error('Review version is required'));
    }
    const actions = editActions(review, values);
    if (actions.length === 0) {
      return Promise.resolve();
    }
    return updateReview({
      variables: {
        id: review.id,
        version: review.version,
        actions,
      },
    });
  };

  return {
    saveReview,
    loading,
  };
};

export const useReviewDeleter = () => {
  const [deleteReview, { loading }] = useMcMutation<
    TDeleteReviewMutation,
    TDeleteReviewVariables
  >(DeleteReviewMutation, {
    context: platformContext,
    refetchQueries: ['FetchReviews'],
  });

  const removeReview = (review: TReview) => {
    if (review.version == null) {
      return Promise.reject(new Error('Review version is required'));
    }
    return deleteReview({
      variables: {
        id: review.id,
        version: review.version,
      },
    });
  };

  return {
    removeReview,
    loading,
  };
};
