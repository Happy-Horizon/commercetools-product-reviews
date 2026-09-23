import { graphql } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent } from '@testing-library/react';
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

it('should render default rating scale and form field settings', async () => {
  mockServer.use(
    graphql.query('FetchReviewSettings', (_req, res, ctx) =>
      res(ctx.data({ customObject: null }))
    )
  );

  renderApplicationWithRedux(<ApplicationRoutes />, {
    route: `/my-project/${entryPointUriPath}/settings`,
    project: {
      allAppliedPermissions: mapResourceAccessToAppliedPermissions([
        PERMISSIONS.View,
        PERMISSIONS.Manage,
      ]),
    },
  });

  await screen.findByText('Review settings');
  expect(screen.getByText('General')).toBeInTheDocument();
  expect(screen.getByText('Form')).toBeInTheDocument();
  expect(screen.getByText('Rating')).toBeInTheDocument();
  expect(screen.getByText('Images')).toBeInTheDocument();
  expect(screen.getByLabelText('Rating scale')).toBeInTheDocument();
  expect(screen.getByText('1 to 5')).toBeInTheDocument();
  expect(screen.getByLabelText('Save settings')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Form'));
  expect(await screen.findByLabelText('Review text')).toBeInTheDocument();
  expect(screen.getByLabelText('Review images')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Rating'));
  expect(await screen.findByText('Additional ratings')).toBeInTheDocument();
  expect(screen.getByLabelText('Add rating')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Images'));
  expect(await screen.findByLabelText('Storage provider')).toBeInTheDocument();
  expect(screen.getByLabelText('Bucket')).toBeInTheDocument();
  expect(screen.getByLabelText('Public base URL')).toBeInTheDocument();
});
