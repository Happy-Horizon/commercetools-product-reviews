import {
  REVIEW_PROMOTIONAL_FIELD,
  REVIEW_PUBLISHED_FIELD,
  REVIEW_STATE_DRAFT_KEY,
  REVIEW_STATE_PUBLISHED_KEY,
  REVIEW_TYPE_KEY,
} from '../../constants';
import {
  DEFAULT_REVIEW_LIST_FILTERS,
  buildReviewsWhere,
  editActions,
  isPublished,
  parseRatingsValue,
  publishActions,
  reviewRatings,
  reviewStatusWhere,
  type TReview,
} from './use-reviews-connector';

const review = (overrides: Partial<TReview> = {}): TReview => ({
  id: 'review-1',
  version: 1,
  createdAt: '2026-09-23T10:00:00.000Z',
  includedInStatistics: true,
  ...overrides,
});

it('treats a missing published field as draft', () => {
  expect(isPublished(review())).toBe(false);
  expect(
    isPublished(
      review({
        custom: {
          customFieldsRaw: [{ name: 'promotional', value: true }],
        },
      })
    )
  ).toBe(false);
});

it('is published only when the custom field is true', () => {
  expect(
    isPublished(
      review({
        custom: {
          customFieldsRaw: [{ name: REVIEW_PUBLISHED_FIELD, value: true }],
        },
      })
    )
  ).toBe(true);
});

it('combines product, status, and promotional filters', () => {
  expect(buildReviewsWhere(DEFAULT_REVIEW_LIST_FILTERS)).toBeUndefined();
  expect(
    buildReviewsWhere({
      productQuery: 'hat',
      status: 'draft',
      promotional: 'yes',
    }, ['product-1'])
  ).toBe(
    `not(custom(fields(${REVIEW_PUBLISHED_FIELD}=true))) and custom(fields(promotional=true)) and target(id in ("product-1"))`
  );
});

it('builds draft and published query predicates', () => {
  expect(reviewStatusWhere('all')).toBeUndefined();
  expect(reviewStatusWhere('published')).toBe(
    `custom(fields(${REVIEW_PUBLISHED_FIELD}=true))`
  );
  expect(reviewStatusWhere('draft')).toBe(
    `not(custom(fields(${REVIEW_PUBLISHED_FIELD}=true)))`
  );
});

it('sets the published field on an existing custom type', () => {
  expect(
    publishActions(
      review({
        custom: {
          customFieldsRaw: [{ name: 'promotional', value: false }],
        },
      }),
      true
    )
  ).toEqual([
    {
      setCustomField: {
        name: REVIEW_PUBLISHED_FIELD,
        value: 'true',
      },
    },
    {
      transitionState: {
        force: true,
        state: {
          typeId: 'state',
          key: REVIEW_STATE_PUBLISHED_KEY,
        },
      },
    },
  ]);
});

it('assigns the shop review type when the review has no custom fields', () => {
  expect(publishActions(review(), false)).toEqual([
    {
      setCustomType: {
        typeKey: REVIEW_TYPE_KEY,
        fields: [{ name: REVIEW_PUBLISHED_FIELD, value: 'false' }],
      },
    },
    {
      transitionState: {
        force: true,
        state: {
          typeId: 'state',
          key: REVIEW_STATE_DRAFT_KEY,
        },
      },
    },
  ]);
});

it('builds edit actions for text, rating, and custom fields', () => {
  expect(
    editActions(
      review({
        authorName: 'Ada',
        title: 'Old title',
        text: 'Old text',
        rating: 4,
        custom: {
          customFieldsRaw: [
            { name: REVIEW_PROMOTIONAL_FIELD, value: false },
            { name: 'ratings', value: { price: 4 } },
          ],
        },
      }),
      {
        authorName: 'Ada Lovelace',
        title: 'New title',
        text: 'New text',
        rating: 5,
        promotional: true,
        ratings: { price: 5 },
      }
    )
  ).toEqual([
    { setAuthorName: { authorName: 'Ada Lovelace' } },
    { setTitle: { title: 'New title' } },
    { setText: { text: 'New text' } },
    { setRating: { rating: 5 } },
    {
      setCustomField: {
        name: REVIEW_PROMOTIONAL_FIELD,
        value: 'true',
      },
    },
    {
      setCustomField: {
        name: 'ratings',
        value: '"{\\"price\\":5}"',
      },
    },
  ]);
});

it('assigns the shop review type when editing custom fields on a plain review', () => {
  expect(
    editActions(review({ rating: 3 }), {
      authorName: '',
      title: '',
      text: '',
      rating: 3,
      promotional: true,
      ratings: {},
    })
  ).toEqual([
    {
      setCustomType: {
        typeKey: REVIEW_TYPE_KEY,
        fields: [
          { name: REVIEW_PUBLISHED_FIELD, value: 'false' },
          { name: REVIEW_PROMOTIONAL_FIELD, value: 'true' },
        ],
      },
    },
  ]);
});

it('parses extra rating scores from a JSON custom field', () => {
  expect(parseRatingsValue('{"price":4,"quality":5}')).toEqual({
    price: 4,
    quality: 5,
  });
  expect(
    reviewRatings(
      review({
        custom: {
          customFieldsRaw: [
            { name: 'ratings', value: { price: 3, quality: 8 } },
          ],
        },
      })
    )
  ).toEqual({ price: 3, quality: 8 });
});
