import { graphql } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, waitFor } from '@testing-library/react';
import {
  mapResourceAccessToAppliedPermissions,
  screen,
} from '@commercetools-frontend/application-shell/test-utils';
import { entryPointUriPath, PERMISSIONS } from '../../constants';
import ApplicationRoutes from '../../routes';
import { renderApplicationWithRedux } from '../../test-utils';

const mockServer = setupServer();
afterEach(() => mockServer.resetHandlers());
beforeAll(() => {
  mockServer.listen({
    onUnhandledRequest: 'error',
  });
});
afterAll(() => {
  mockServer.close();
});

const review = {
  id: 'review-1',
  version: 3,
  authorName: 'Ada',
  title: 'Great hat',
  text: 'Warm and light.',
  rating: 5,
  locale: 'en',
  createdAt: '2026-09-23T10:00:00.000Z',
  includedInStatistics: false,
  uniquenessValue: 'ada@example.com:order-1',
  custom: {
    customFieldsRaw: [{ name: 'promotional', value: false }],
  },
  customer: {
    id: 'customer-1',
    email: 'ada@example.com',
  },
  target: {
    __typename: 'Product',
    id: 'product-1',
    key: 'hat',
    masterData: {
      current: {
        name: 'Wool hat',
      },
    },
  },
};

const listPayload = {
  reviews: {
    total: 1,
    count: 1,
    offset: 0,
    results: [review],
  },
};

const mockReadQueries = () => {
  mockServer.use(
    graphql.query('FetchReviewSettings', (_req, res, ctx) =>
      res(ctx.data({ customObject: null }))
    ),
    graphql.query('FetchReviews', (_req, res, ctx) =>
      res(ctx.data(listPayload))
    ),
    graphql.query('FetchReviewDetails', (_req, res, ctx) =>
      res(ctx.data({ review }))
    )
  );
};

const renderDetails = () =>
  renderApplicationWithRedux(<ApplicationRoutes />, {
    route: `/my-project/${entryPointUriPath}/review/review-1`,
    project: {
      allAppliedPermissions: mapResourceAccessToAppliedPermissions([
        PERMISSIONS.View,
        PERMISSIONS.Manage,
      ]),
    },
  });

it('saves edited review fields', async () => {
  const updates: unknown[] = [];
  mockReadQueries();
  mockServer.use(
    graphql.mutation('UpdateReview', (req, res, ctx) => {
      updates.push(req.variables);
      return res(
        ctx.data({
          updateReview: {
            ...review,
            version: 4,
            title: 'Updated hat',
          },
        })
      );
    })
  );

  renderDetails();

  const titleInput = await screen.findByLabelText('Title');
  fireEvent.change(titleInput, { target: { value: 'Updated hat' } });
  fireEvent.click(screen.getByLabelText('Save'));

  await screen.findByDisplayValue('Updated hat');
  expect(updates).toEqual([
    {
      id: 'review-1',
      version: 3,
      actions: [{ setTitle: { title: 'Updated hat' } }],
    },
  ]);
});

it('deletes the review after confirmation', async () => {
  const deletions: unknown[] = [];
  mockReadQueries();
  mockServer.use(
    graphql.mutation('DeleteReview', (req, res, ctx) => {
      deletions.push(req.variables);
      return res(ctx.data({ deleteReview: { id: review.id } }));
    })
  );

  renderDetails();

  fireEvent.click(await screen.findByLabelText('Delete'));
  fireEvent.click(await screen.findByTestId('confirm-delete-review'));

  await waitFor(() => {
    expect(deletions).toEqual([{ id: 'review-1', version: 3 }]);
  });
});
