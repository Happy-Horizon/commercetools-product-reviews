import { Fragment, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import {
  ConfirmationDialog,
  InfoModalPage,
  PageNotFound,
} from '@commercetools-frontend/application-components';
import { ApplicationPageTitle } from '@commercetools-frontend/application-shell';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { DOMAINS, NO_VALUE_FALLBACK } from '@commercetools-frontend/constants';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import FlatButton from '@commercetools-uikit/flat-button';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import SelectField from '@commercetools-uikit/select-field';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import { PERMISSIONS } from '../../constants';
import { getErrorMessage } from '../../helpers';
import {
  formatRating,
  ratingDimensionLabel,
  useReviewSettingsFetcher,
} from '../../hooks/use-review-settings';
import {
  isPromotional,
  isPublished,
  productName,
  reviewRatings,
  useReviewDeleter,
  useReviewDetailsFetcher,
  useReviewEditor,
  useReviewPublisher,
  type TReviewEditValues,
} from '../../hooks/use-reviews-connector';
import messages from './messages';

type TReviewDetailsProps = {
  onClose: () => void;
};

type TDetailRowProps = {
  label: string;
  value: string;
};

const EMPTY_VALUES: TReviewEditValues = {
  authorName: '',
  title: '',
  text: '',
  rating: 0,
  promotional: false,
  ratings: {},
};

const DetailRow = (props: TDetailRowProps) => (
  <Spacings.Stack scale="xs">
    <Text.Detail isBold>{props.label}</Text.Detail>
    <Text.Body>{props.value}</Text.Body>
  </Spacings.Stack>
);

const ReviewDetails = (props: TReviewDetailsProps) => {
  const intl = useIntl();
  const params = useParams<{ id: string }>();
  const locale = useApplicationContext((context) => context.dataLocale ?? 'en');
  const showNotification = useShowNotification();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const { settings } = useReviewSettingsFetcher();
  const { review, error, loading } = useReviewDetailsFetcher(params.id, locale);
  const { setPublished, loading: publishing } = useReviewPublisher();
  const { saveReview, loading: saving } = useReviewEditor();
  const { removeReview, loading: deleting } = useReviewDeleter();

  const title = review?.title || intl.formatMessage(messages.title);
  const published = review ? isPublished(review) : false;
  const dimensions = settings.ratingDimensions;
  const busy = publishing || saving || deleting;
  const fieldsDisabled = !canManage || busy;

  const initialValues = useMemo<TReviewEditValues>(() => {
    if (!review) {
      return EMPTY_VALUES;
    }
    const existing = reviewRatings(review);
    return {
      authorName: review.authorName ?? '',
      title: review.title ?? '',
      text: review.text ?? '',
      rating: review.rating ?? 0,
      promotional: isPromotional(review),
      ratings: Object.fromEntries(
        dimensions.map((dimension) => [
          dimension.key,
          existing[dimension.key] ?? 0,
        ])
      ),
    };
  }, [dimensions, review]);

  const formik = useFormik<TReviewEditValues>({
    enableReinitialize: true,
    initialValues,
    onSubmit: async (values) => {
      if (!review) {
        return;
      }
      const extraScores = dimensions.map(
        (dimension) => values.ratings[dimension.key] ?? 0
      );
      const rating = dimensions.length
        ? Math.round(
            extraScores.reduce((sum, score) => sum + score, 0) /
              extraScores.length
          )
        : values.rating;
      const scores = dimensions.length ? extraScores : [rating];
      if (
        scores.some(
          (score) => score < 1 || score > settings.ratingScale
        )
      ) {
        showNotification({
          kind: 'error',
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(messages.ratingInvalid),
        });
        return;
      }
      try {
        await saveReview(review, {
          ...values,
          rating,
          ratings: Object.fromEntries(
            dimensions.map((dimension, index) => [
              dimension.key,
              extraScores[index],
            ])
          ),
        });
        showNotification({
          kind: 'success',
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(messages.saveSuccess),
        });
      } catch {
        showNotification({
          kind: 'error',
          domain: DOMAINS.SIDE,
          text: intl.formatMessage(messages.saveError),
        });
      }
    },
  });

  const ratingOptions = Array.from(
    { length: settings.ratingScale },
    (_, index) => {
      const value = String(index + 1);
      return {
        value,
        label: formatRating(index + 1, settings.ratingScale) ?? value,
      };
    }
  );

  const handlePublishChange = async (nextPublished: boolean) => {
    if (!review) {
      return;
    }
    try {
      await setPublished(review, nextPublished);
      showNotification({
        kind: 'success',
        domain: DOMAINS.SIDE,
        text: intl.formatMessage(
          nextPublished ? messages.publishSuccess : messages.unpublishSuccess
        ),
      });
    } catch {
      showNotification({
        kind: 'error',
        domain: DOMAINS.SIDE,
        text: intl.formatMessage(messages.publishError),
      });
    }
  };

  const handleDelete = async () => {
    if (!review) {
      return;
    }
    try {
      await removeReview(review);
      showNotification({
        kind: 'success',
        domain: DOMAINS.SIDE,
        text: intl.formatMessage(messages.deleteSuccess),
      });
      setIsDeleteOpen(false);
      props.onClose();
    } catch {
      showNotification({
        kind: 'error',
        domain: DOMAINS.SIDE,
        text: intl.formatMessage(messages.deleteError),
      });
    }
  };

  return (
    <InfoModalPage title={title} isOpen onClose={props.onClose}>
      {loading && (
        <Spacings.Stack alignItems="center">
          <LoadingSpinner />
        </Spacings.Stack>
      )}
      {error && (
        <ContentNotification type="error">
          <Text.Body>
            {getErrorMessage(error) ||
              intl.formatMessage(messages.errorMessage)}
          </Text.Body>
        </ContentNotification>
      )}
      {review === null && <PageNotFound />}
      {review && (
        <Fragment>
          <ApplicationPageTitle additionalParts={[title]} />
          <form onSubmit={formik.handleSubmit}>
            <Spacings.Stack scale="l">
              {!published && (
                <ContentNotification type="info">
                  <Text.Body intlMessage={messages.draftHint} />
                </ContentNotification>
              )}
              {!canManage && (
                <ContentNotification type="warning">
                  <Text.Body intlMessage={messages.noPermission} />
                </ContentNotification>
              )}
              {canManage && (
                <FlatButton
                  label={intl.formatMessage(
                    published ? messages.unpublish : messages.publish
                  )}
                  isDisabled={busy}
                  onClick={() => handlePublishChange(!published)}
                />
              )}
              <DetailRow
                label={intl.formatMessage(messages.status)}
                value={intl.formatMessage(
                  published ? messages.statusPublished : messages.statusDraft
                )}
              />
              <DetailRow
                label={intl.formatMessage(messages.product)}
                value={productName(review)}
              />
              <TextField
                name="authorName"
                title={intl.formatMessage(messages.author)}
                value={formik.values.authorName}
                isDisabled={fieldsDisabled}
                onChange={formik.handleChange}
              />
              <TextField
                name="title"
                title={intl.formatMessage(messages.reviewTitle)}
                value={formik.values.title}
                isDisabled={fieldsDisabled}
                onChange={formik.handleChange}
              />
              <TextField
                name="text"
                title={intl.formatMessage(messages.text)}
                value={formik.values.text}
                isDisabled={fieldsDisabled}
                onChange={formik.handleChange}
              />
              {dimensions.length === 0 ? (
                <SelectField
                  name="rating"
                  title={intl.formatMessage(messages.rating)}
                  value={
                    formik.values.rating > 0
                      ? String(formik.values.rating)
                      : undefined
                  }
                  isDisabled={fieldsDisabled}
                  options={ratingOptions}
                  onChange={(event) =>
                    formik.setFieldValue('rating', Number(event.target.value))
                  }
                />
              ) : (
                dimensions.map((dimension) => (
                  <SelectField
                    key={dimension.key}
                    name={`ratings.${dimension.key}`}
                    title={ratingDimensionLabel(
                      dimensions,
                      dimension.key,
                      locale
                    )}
                    value={
                      formik.values.ratings[dimension.key] > 0
                        ? String(formik.values.ratings[dimension.key])
                        : undefined
                    }
                    isDisabled={fieldsDisabled}
                    options={ratingOptions}
                    onChange={(event) =>
                      formik.setFieldValue(
                        `ratings.${dimension.key}`,
                        Number(event.target.value)
                      )
                    }
                  />
                ))
              )}
              <SelectField
                name="promotional"
                title={intl.formatMessage(messages.promotional)}
                value={String(formik.values.promotional)}
                isDisabled={fieldsDisabled}
                options={[
                  {
                    value: 'true',
                    label: intl.formatMessage(messages.yes),
                  },
                  {
                    value: 'false',
                    label: intl.formatMessage(messages.no),
                  },
                ]}
                onChange={(event) =>
                  formik.setFieldValue(
                    'promotional',
                    event.target.value === 'true'
                  )
                }
              />
              <DetailRow
                label={intl.formatMessage(messages.locale)}
                value={review.locale || NO_VALUE_FALLBACK}
              />
              <DetailRow
                label={intl.formatMessage(messages.createdAt)}
                value={intl.formatDate(review.createdAt, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
              <DetailRow
                label={intl.formatMessage(messages.customerEmail)}
                value={
                  review.customer?.email || intl.formatMessage(messages.guest)
                }
              />
              <DetailRow
                label={intl.formatMessage(messages.uniquenessValue)}
                value={review.uniquenessValue || NO_VALUE_FALLBACK}
              />
              <DetailRow
                label={intl.formatMessage(messages.includedInStatistics)}
                value={intl.formatMessage(
                  review.includedInStatistics ? messages.yes : messages.no
                )}
              />
              {canManage && (
                <Spacings.Inline scale="m">
                  <SecondaryButton
                    label={intl.formatMessage(messages.delete)}
                    isDisabled={busy}
                    onClick={() => setIsDeleteOpen(true)}
                  />
                  <PrimaryButton
                    label={intl.formatMessage(messages.save)}
                    isDisabled={busy || !formik.dirty}
                    type="submit"
                  />
                </Spacings.Inline>
              )}
            </Spacings.Stack>
          </form>
          <ConfirmationDialog
            title={intl.formatMessage(messages.deleteTitle)}
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onCancel={() => setIsDeleteOpen(false)}
            onConfirm={handleDelete}
            isPrimaryButtonDisabled={deleting}
            labelPrimary={ConfirmationDialog.Intl.delete}
            dataAttributesPrimaryButton={{
              'data-testid': 'confirm-delete-review',
            }}
          >
            <Text.Body intlMessage={messages.deleteConfirm} />
          </ConfirmationDialog>
        </Fragment>
      )}
    </InfoModalPage>
  );
};
ReviewDetails.displayName = 'ReviewDetails';

export default ReviewDetails;
