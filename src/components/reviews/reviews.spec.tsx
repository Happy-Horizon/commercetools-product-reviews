import { graphql } from 'msw';
import { setupServer } from 'msw/node';
import {
  fireEvent,
  mapResourceAccessToAppliedPermissions,
  screen,
  type TRenderAppWithReduxOptions,
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

const review = (index: number) => ({
  id: `review-${index}`,
  version: 1,
  authorName: `Author ${index}`,
  title: `Title ${index}`,
  text: `Review text ${index}`,
  rating: 5,
  locale: 'en',
  createdAt: '2026-09-23T10:00:00.000Z',
  includedInStatistics: true,
  custom: {
    customFieldsRaw: [{ name: 'promotional', value: index === 0 }],
  },
  target: {
    __typename: 'Product',
    id: `product-${index}`,
    key: `product-key-${index}`,
    masterData: {
      current: {
        name: `Product ${index}`,
      },
    },
  },
});

const mockSettings = () =>
  graphql.query('FetchReviewSettings', (_req, res, ctx) =>
    res(ctx.data({ customObject: null }))
  );

const renderApp = (options: Partial<TRenderAppWithReduxOptions> = {}) => {
  const route = options.route || `/my-project/${entryPointUriPath}`;
  const { history } = renderApplicationWithRedux(<ApplicationRoutes />, {
    route,
    project: {
      allAppliedPermissions: mapResourceAccessToAppliedPermissions([
        PERMISSIONS.View,
      ]),
    },
    ...options,
  });
  return { history };
};

it('should render reviews and paginate to second page', async () => {
  mockServer.use(
    mockSettings(),
    graphql.query('FetchReviews', (req, res, ctx) => {
      const { offset } = req.variables;
      const totalItems = 25;
      const itemsPerPage = offset === 0 ? 20 : 5;
      const start = offset === 0 ? 0 : 20;

      return res(
        ctx.data({
          reviews: {
            total: totalItems,
            count: itemsPerPage,
            offset,
            results: Array.from({ length: itemsPerPage }).map((_, index) =>
              review(start + index)
            ),
          },
        })
      );
    })
  );
  renderApp();

  await screen.findByText('Author 0');
  expect(screen.getByLabelText('Product')).toBeInTheDocument();
  expect(screen.getByLabelText('Status')).toBeInTheDocument();
  expect(screen.getByLabelText('Promotional')).toBeInTheDocument();
  expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
  expect(screen.queryByText('Author 22')).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Next page'));

  await screen.findByText('Author 22');
  expect(screen.queryByText('Author 0')).not.toBeInTheDocument();
});
