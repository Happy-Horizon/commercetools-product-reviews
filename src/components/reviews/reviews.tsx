import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Link as RouterLink, Switch, useHistory, useRouteMatch } from 'react-router-dom';
import { SuspendedRoute } from '@commercetools-frontend/application-shell';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { NO_VALUE_FALLBACK } from '@commercetools-frontend/constants';
import DataTable from '@commercetools-uikit/data-table';
import {
  useDataTableSortingState,
  usePaginationState,
} from '@commercetools-uikit/hooks';
import { GearIcon } from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import { Pagination } from '@commercetools-uikit/pagination';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import SelectField from '@commercetools-uikit/select-field';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import { getErrorMessage } from '../../helpers';
import {
  formatRating,
  useReviewSettingsFetcher,
} from '../../hooks/use-review-settings';
import {
  DEFAULT_REVIEW_LIST_FILTERS,
  isPromotional,
  isPublished,
  productName,
  useReviewsFetcher,
  type TReview,
  type TReviewListFilters,
  type TReviewPromotionalFilter,
  type TReviewStatusFilter,
} from '../../hooks/use-reviews-connector';
import happyHorizonWordmark from '../../assets/happy-horizon-wordmark.png';
import ReviewDetails from '../review-details';
import messages from './messages';

const Reviews = () => {
  const intl = useIntl();
  const match = useRouteMatch();
  const { push } = useHistory();
  const { page, perPage } = usePaginationState();
  const [filters, setFilters] = useState<TReviewListFilters>(
    DEFAULT_REVIEW_LIST_FILTERS
  );
  const tableSorting = useDataTableSortingState({
    key: 'createdAt',
    order: 'desc',
  });
  const locale = useApplicationContext((context) => context.dataLocale ?? 'en');
  const { settings } = useReviewSettingsFetcher();
  const { reviewsPaginatedResult, error, loading } = useReviewsFetcher({
    page,
    perPage,
    tableSorting,
    locale,
    filters,
  });

  const updateFilter = <K extends keyof TReviewListFilters>(
    key: K,
    value: TReviewListFilters[K]
  ) => {
    page.onChange(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const columns = [
    { key: 'product', label: intl.formatMessage(messages.columnProduct) },
    { key: 'authorName', label: intl.formatMessage(messages.columnAuthor) },
    { key: 'title', label: intl.formatMessage(messages.columnTitle) },
    {
      key: 'status',
      label: intl.formatMessage(messages.columnStatus),
    },
    {
      key: 'rating',
      label: intl.formatMessage(messages.columnRating),
      isSortable: true,
    },
    {
      key: 'promotional',
      label: intl.formatMessage(messages.columnPromotional),
    },
    {
      key: 'createdAt',
      label: intl.formatMessage(messages.columnCreatedAt),
      isSortable: true,
    },
  ];

  if (error) {
    return (
      <ContentNotification type="error">
        <Text.Body>{getErrorMessage(error)}</Text.Body>
      </ContentNotification>
    );
  }

  return (
    <Spacings.Stack scale="l">
      <Spacings.Inline alignItems="center" justifyContent="space-between">
        <Text.Headline as="h2" intlMessage={messages.title} />
        <Spacings.Inline alignItems="center" scale="m">
          <Spacings.Inline alignItems="center" scale="s">
            <Text.Detail tone="secondary" nowrap>
              {intl.formatMessage(messages.poweredBy)}
            </Text.Detail>
            <img
              src={happyHorizonWordmark}
              alt={intl.formatMessage(messages.poweredByAlt)}
              height={32}
              style={{ display: 'block', height: '32px', width: 'auto' }}
            />
          </Spacings.Inline>
          <SecondaryButton
            as={RouterLink}
            to={`${match.url}/settings`}
            iconLeft={<GearIcon />}
            label={intl.formatMessage(messages.openSettings)}
          />
        </Spacings.Inline>
      </Spacings.Inline>

      <Spacings.Inline alignItems="flex-end" scale="m">
          <TextField
            name="productFilter"
            title={intl.formatMessage(messages.productFilter)}
            placeholder={intl.formatMessage(messages.productFilterDescription)}
            value={filters.productQuery}
            horizontalConstraint={8}
            onChange={(event) =>
              updateFilter('productQuery', event.target.value)
            }
          />
          <SelectField
            name="statusFilter"
            title={intl.formatMessage(messages.statusFilter)}
            value={filters.status}
            horizontalConstraint={5}
            options={[
              {
                value: 'all',
                label: intl.formatMessage(messages.statusAll),
              },
              {
                value: 'draft',
                label: intl.formatMessage(messages.statusDraft),
              },
              {
                value: 'published',
                label: intl.formatMessage(messages.statusPublished),
              },
            ]}
            onChange={(event) =>
              updateFilter('status', event.target.value as TReviewStatusFilter)
            }
          />
          <SelectField
            name="promotionalFilter"
            title={intl.formatMessage(messages.promotionalFilter)}
            value={filters.promotional}
            horizontalConstraint={5}
            options={[
              {
                value: 'all',
                label: intl.formatMessage(messages.statusAll),
              },
              {
                value: 'yes',
                label: intl.formatMessage(messages.yes),
              },
              {
                value: 'no',
                label: intl.formatMessage(messages.no),
              },
            ]}
            onChange={(event) =>
              updateFilter(
                'promotional',
                event.target.value as TReviewPromotionalFilter
              )
            }
          />
      </Spacings.Inline>

      {loading && <LoadingSpinner />}

      {reviewsPaginatedResult ? (
        <Spacings.Stack scale="l">
          {reviewsPaginatedResult.results.length === 0 ? (
            <Text.Body intlMessage={messages.noResults} />
          ) : (
            <DataTable<TReview>
              isCondensed
              columns={columns}
              rows={reviewsPaginatedResult.results}
              itemRenderer={(item, column) => {
                switch (column.key) {
                  case 'product':
                    return productName(item);
                  case 'authorName':
                    return item.authorName || NO_VALUE_FALLBACK;
                  case 'title':
                    return item.title || NO_VALUE_FALLBACK;
                  case 'status':
                    return intl.formatMessage(
                      isPublished(item)
                        ? messages.statusPublished
                        : messages.statusDraft
                    );
                  case 'rating':
                    return (
                      formatRating(item.rating, settings.ratingScale) ||
                      NO_VALUE_FALLBACK
                    );
                  case 'promotional':
                    return isPromotional(item)
                      ? intl.formatMessage(messages.yes)
                      : intl.formatMessage(messages.no);
                  case 'createdAt':
                    return intl.formatDate(item.createdAt, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                  default:
                    return null;
                }
              }}
              sortedBy={tableSorting.value.key}
              sortDirection={tableSorting.value.order}
              onSortChange={tableSorting.onChange}
              onRowClick={(row) => push(`${match.url}/review/${row.id}`)}
            />
          )}
          <Pagination
            page={page.value}
            onPageChange={page.onChange}
            perPage={perPage.value}
            onPerPageChange={perPage.onChange}
            totalItems={reviewsPaginatedResult.total}
            perPageRange="s"
          />
          <Switch>
            <SuspendedRoute path={`${match.url}/review/:id`}>
              <ReviewDetails onClose={() => push(`${match.url}`)} />
            </SuspendedRoute>
          </Switch>
        </Spacings.Stack>
      ) : null}
    </Spacings.Stack>
  );
};
Reviews.displayName = 'Reviews';

export default Reviews;
