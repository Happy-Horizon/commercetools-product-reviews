import { useMemo } from 'react';
import { useFormik } from 'formik';
import { useIntl } from 'react-intl';
import {
  Link as RouterLink,
  Route,
  Switch,
  useRouteMatch,
} from 'react-router-dom';
import { useShowNotification } from '@commercetools-frontend/actions-global';
import { TabHeader } from '@commercetools-frontend/application-components';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { DOMAINS } from '@commercetools-frontend/constants';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import Constraints from '@commercetools-uikit/constraints';
import FlatButton from '@commercetools-uikit/flat-button';
import { BackIcon, PlusBoldIcon } from '@commercetools-uikit/icons';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import LocalizedTextField from '@commercetools-uikit/localized-text-field';
import LocalizedTextInput from '@commercetools-uikit/localized-text-input';
import { ContentNotification } from '@commercetools-uikit/notifications';
import SelectField from '@commercetools-uikit/select-field';
import Stamp from '@commercetools-uikit/stamp';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import { PERMISSIONS } from '../../constants';
import { getErrorMessage } from '../../helpers';
import {
  FIELD_KEYS,
  IMAGE_STORAGE_PROVIDER_META,
  IMAGE_STORAGE_PROVIDERS,
  createRatingDimensionId,
  isImageStorageProvider,
  parseImageSettings,
  parseRatingDimensions,
  slugifyRatingKey,
  useReviewSettingsFetcher,
  useReviewSettingsUpdater,
  type TRatingDimension,
  type TReviewFormFieldKey,
  type TReviewFormFieldMode,
  type TReviewSettings,
} from '../../hooks/use-review-settings';
import messages from './messages';

const providerLabelMessage = {
  s3: messages.imageProviderS3,
  r2: messages.imageProviderR2,
  gcs: messages.imageProviderGcs,
  azure: messages.imageProviderAzure,
  's3-compatible': messages.imageProviderS3Compatible,
} as const;

const fieldTitleMessage = {
  title: messages.fieldTitle,
  text: messages.fieldText,
  authorName: messages.fieldAuthorName,
  promotional: messages.fieldPromotional,
  images: messages.fieldImages,
} as const;

const FALLBACK_LANGUAGES = ['en'];

const Settings = () => {
  const intl = useIntl();
  const match = useRouteMatch();
  const isRatingTab = Boolean(
    useRouteMatch({ path: `${match.path}/rating`, exact: true })
  );
  const showNotification = useShowNotification();
  const canManage = useIsAuthorized({
    demandedPermissions: [PERMISSIONS.Manage],
  });
  const { settings, version, error, loading } = useReviewSettingsFetcher();
  const { saveSettings, loading: saving } = useReviewSettingsUpdater();
  const languages = useApplicationContext((context) =>
    context.project?.languages?.length
      ? context.project.languages
      : FALLBACK_LANGUAGES
  );
  const dataLocale = useApplicationContext(
    (context) => context.dataLocale ?? languages[0]
  );
  const selectedLanguage = languages.includes(dataLocale)
    ? dataLocale
    : languages[0];

  const emptyDimension = (): TRatingDimension => ({
    id: createRatingDimensionId(),
    key: '',
    labels: LocalizedTextInput.createLocalizedString(languages),
  });

  const initialValues = useMemo<TReviewSettings>(
    () => ({
      ...settings,
      ratingDimensions: settings.ratingDimensions.map((dimension) => ({
        id: dimension.id ?? dimension.key ?? createRatingDimensionId(),
        key: dimension.key,
        labels: LocalizedTextInput.createLocalizedString(
          languages,
          dimension.labels
        ),
      })),
      images: {
        ...settings.images,
        secretAccessKey: '',
      },
    }),
    [languages, settings]
  );

  const formik = useFormik<TReviewSettings>({
    enableReinitialize: true,
    initialValues,
    onSubmit: async (values) => {
      try {
        await saveSettings(
          {
            ...values,
            ratingDimensions: parseRatingDimensions(values.ratingDimensions),
            images: parseImageSettings(
              values.images,
              settings.images.secretAccessKey
            ),
          },
          version
        );
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

  const fieldModeOptions = [
    { value: 'hidden', label: intl.formatMessage(messages.modeHidden) },
    { value: 'optional', label: intl.formatMessage(messages.modeOptional) },
    { value: 'required', label: intl.formatMessage(messages.modeRequired) },
  ];
  const reviewsPath = match.url.replace(/\/settings\/?$/, '');

  if (loading) {
    return <LoadingSpinner />;
  }

  const setImageField = (
    field: keyof TReviewSettings['images'],
    value: string | number
  ) => {
    formik.setFieldValue(`images.${field}`, value);
  };

  const generalTab = (
    <Spacings.Stack scale="l">
      <ContentNotification type="info">
        <Text.Body intlMessage={messages.hint} />
      </ContentNotification>
      <SelectField
        name="ratingScale"
        title={intl.formatMessage(messages.ratingScale)}
        description={intl.formatMessage(messages.ratingScaleDescription)}
        value={String(formik.values.ratingScale)}
        isDisabled={!canManage || saving}
        options={[
          {
            value: '5',
            label: intl.formatMessage(messages.scaleFive),
          },
          {
            value: '10',
            label: intl.formatMessage(messages.scaleTen),
          },
        ]}
        onChange={(event) => {
          formik.setFieldValue(
            'ratingScale',
            event.target.value === '10' ? 10 : 5
          );
        }}
      />
    </Spacings.Stack>
  );

  const formTab = (
    <Spacings.Stack scale="l">
      <Spacings.Stack scale="s">
        <Text.Subheadline as="h4" intlMessage={messages.formFields} />
        <Text.Body intlMessage={messages.formFieldsDescription} />
      </Spacings.Stack>
      {FIELD_KEYS.map((fieldKey: TReviewFormFieldKey) => (
        <SelectField
          key={fieldKey}
          name={`fields.${fieldKey}`}
          title={intl.formatMessage(fieldTitleMessage[fieldKey])}
          value={formik.values.fields[fieldKey]}
          isDisabled={!canManage || saving}
          options={fieldModeOptions}
          onChange={(event) => {
            formik.setFieldValue(
              `fields.${fieldKey}`,
              event.target.value as TReviewFormFieldMode
            );
          }}
        />
      ))}
    </Spacings.Stack>
  );

  const ratingTab = (
    <Spacings.Stack scale="l">
      <Spacings.Stack scale="s">
        <Text.Subheadline as="h4" intlMessage={messages.ratingDimensions} />
        <Text.Body intlMessage={messages.ratingDimensionsDescription} />
      </Spacings.Stack>

      {formik.values.ratingDimensions.length === 0 && (
        <Text.Body intlMessage={messages.noRatingDimensions} />
      )}

      {formik.values.ratingDimensions.map((dimension, index) => (
        <Spacings.Stack
          key={dimension.id ?? `rating-dimension-${index}`}
          scale="s"
        >
          <Spacings.Inline alignItems="center" justifyContent="space-between">
            <Stamp
              isCondensed
              tone={dimension.key ? 'information' : 'secondary'}
              label={
                dimension.key ||
                intl.formatMessage(messages.newRatingDimension)
              }
            />
            {canManage && (
              <FlatButton
                label={intl.formatMessage(messages.removeRatingDimension)}
                isDisabled={saving}
                onClick={() => {
                  formik.setFieldValue(
                    'ratingDimensions',
                    formik.values.ratingDimensions.filter(
                      (_item, itemIndex) => itemIndex !== index
                    )
                  );
                }}
              />
            )}
          </Spacings.Inline>
          <TextField
            name={`ratingDimensions.${index}.key`}
            title={intl.formatMessage(messages.ratingDimensionKey)}
            description={intl.formatMessage(
              messages.ratingDimensionKeyDescription
            )}
            value={dimension.key}
            isDisabled={!canManage || saving}
            onChange={(event) => {
              formik.setFieldValue(
                `ratingDimensions.${index}.key`,
                event.target.value
              );
            }}
            onBlur={() => {
              formik.setFieldValue(
                `ratingDimensions.${index}.key`,
                slugifyRatingKey(dimension.key)
              );
            }}
          />
          <LocalizedTextField
            name={`ratingDimensions.${index}.labels`}
            title={intl.formatMessage(messages.ratingDimensionLabels)}
            selectedLanguage={selectedLanguage}
            value={dimension.labels}
            isDisabled={!canManage || saving}
            onChange={(event) => {
              const language = (
                event.target as HTMLInputElement & {
                  language?: string;
                }
              ).language;
              if (!language) {
                return;
              }
              formik.setFieldValue(
                `ratingDimensions.${index}.labels.${language}`,
                event.target.value
              );
            }}
          />
        </Spacings.Stack>
      ))}
    </Spacings.Stack>
  );

  const imagesTab = (
    <Spacings.Stack scale="l">
      <ContentNotification type="info">
        <Text.Body intlMessage={messages.imagesHint} />
      </ContentNotification>
      <SelectField
        name="images.provider"
        title={intl.formatMessage(messages.imageProvider)}
        value={formik.values.images.provider}
        isDisabled={!canManage || saving}
        options={IMAGE_STORAGE_PROVIDERS.map((provider) => ({
          value: provider,
          label: intl.formatMessage(providerLabelMessage[provider]),
        }))}
        onChange={(event) => {
          const provider = isImageStorageProvider(event.target.value)
            ? event.target.value
            : 's3';
          const defaults = IMAGE_STORAGE_PROVIDER_META[provider];
          formik.setFieldValue('images.provider', provider);
          if (!formik.values.images.region && defaults.defaultRegion) {
            formik.setFieldValue('images.region', defaults.defaultRegion);
          }
          if (!formik.values.images.endpoint && defaults.defaultEndpoint) {
            formik.setFieldValue('images.endpoint', defaults.defaultEndpoint);
          }
        }}
      />
      <TextField
        name="images.bucket"
        title={intl.formatMessage(messages.imageBucket)}
        value={formik.values.images.bucket}
        isDisabled={!canManage || saving}
        onChange={(event) => setImageField('bucket', event.target.value)}
      />
      <TextField
        name="images.region"
        title={intl.formatMessage(messages.imageRegion)}
        description={intl.formatMessage(messages.imageRegionDescription)}
        value={formik.values.images.region}
        isDisabled={!canManage || saving}
        onChange={(event) => setImageField('region', event.target.value)}
      />
      <TextField
        name="images.endpoint"
        title={intl.formatMessage(messages.imageEndpoint)}
        description={intl.formatMessage(messages.imageEndpointDescription)}
        value={formik.values.images.endpoint}
        isDisabled={!canManage || saving}
        onChange={(event) => setImageField('endpoint', event.target.value)}
      />
      <TextField
        name="images.publicBaseUrl"
        title={intl.formatMessage(messages.imagePublicBaseUrl)}
        description={intl.formatMessage(messages.imagePublicBaseUrlDescription)}
        value={formik.values.images.publicBaseUrl}
        isDisabled={!canManage || saving}
        onChange={(event) => setImageField('publicBaseUrl', event.target.value)}
      />
      <TextField
        name="images.accessKeyId"
        title={intl.formatMessage(messages.imageAccessKeyId)}
        value={formik.values.images.accessKeyId}
        isDisabled={!canManage || saving}
        onChange={(event) => setImageField('accessKeyId', event.target.value)}
      />
      <TextField
        name="images.secretAccessKey"
        title={intl.formatMessage(messages.imageSecretAccessKey)}
        description={
          settings.images.secretAccessKey
            ? `${intl.formatMessage(messages.imageSecretStored)} ${intl.formatMessage(
                messages.imageSecretAccessKeyDescription
              )}`
            : intl.formatMessage(messages.imageSecretAccessKeyDescription)
        }
        value={formik.values.images.secretAccessKey}
        isDisabled={!canManage || saving}
        onChange={(event) =>
          setImageField('secretAccessKey', event.target.value)
        }
      />
      <TextField
        name="images.maxFiles"
        title={intl.formatMessage(messages.imageMaxFiles)}
        value={String(formik.values.images.maxFiles)}
        isDisabled={!canManage || saving}
        onChange={(event) => {
          const digits = event.target.value.replace(/[^\d]/g, '');
          setImageField('maxFiles', digits === '' ? 1 : Number(digits));
        }}
      />
      <TextField
        name="images.maxFileSizeMb"
        title={intl.formatMessage(messages.imageMaxFileSizeMb)}
        value={String(formik.values.images.maxFileSizeMb)}
        isDisabled={!canManage || saving}
        onChange={(event) => {
          const digits = event.target.value.replace(/[^\d]/g, '');
          setImageField('maxFileSizeMb', digits === '' ? 1 : Number(digits));
        }}
      />
    </Spacings.Stack>
  );

  return (
    <Spacings.Stack scale="xl">
      <Spacings.Stack scale="xs">
        <FlatButton
          as={RouterLink}
          to={reviewsPath}
          icon={<BackIcon />}
          label={intl.formatMessage(messages.backToReviews)}
        />
        <Text.Headline as="h2" intlMessage={messages.title} />
      </Spacings.Stack>

      <Constraints.Horizontal max={13}>
        <Spacings.Stack scale="l">
          {!canManage && (
            <ContentNotification type="warning">
              <Text.Body intlMessage={messages.noPermission} />
            </ContentNotification>
          )}

          {error && (
            <ContentNotification type="error">
              <Text.Body>{getErrorMessage(error)}</Text.Body>
            </ContentNotification>
          )}

          <Spacings.Inline alignItems="flex-end" scale="m">
            <TabHeader
              to={match.url}
              exactPathMatch
              intlMessage={messages.tabGeneral}
            />
            <TabHeader
              to={`${match.url}/form`}
              exactPathMatch
              intlMessage={messages.tabForm}
            />
            <TabHeader
              to={`${match.url}/rating`}
              exactPathMatch
              intlMessage={messages.tabRating}
            />
            <TabHeader
              to={`${match.url}/images`}
              exactPathMatch
              intlMessage={messages.tabImages}
            />
          </Spacings.Inline>

          <form onSubmit={formik.handleSubmit}>
            <Spacings.Stack scale="l">
              <Switch>
                <Route path={`${match.path}/form`}>{formTab}</Route>
                <Route path={`${match.path}/rating`}>{ratingTab}</Route>
                <Route path={`${match.path}/images`}>{imagesTab}</Route>
                <Route>{generalTab}</Route>
              </Switch>

              {canManage && (
                <Spacings.Inline alignItems="center" scale="m">
                  {isRatingTab && (
                    <SecondaryButton
                      type="button"
                      iconLeft={<PlusBoldIcon />}
                      label={intl.formatMessage(messages.addRatingDimension)}
                      isDisabled={saving}
                      onClick={() => {
                        formik.setFieldValue('ratingDimensions', [
                          ...formik.values.ratingDimensions,
                          emptyDimension(),
                        ]);
                      }}
                    />
                  )}
                  <PrimaryButton
                    type="submit"
                    label={intl.formatMessage(messages.save)}
                    isDisabled={saving || !formik.dirty}
                  />
                </Spacings.Inline>
              )}
            </Spacings.Stack>
          </form>
        </Spacings.Stack>
      </Constraints.Horizontal>
    </Spacings.Stack>
  );
};
Settings.displayName = 'Settings';

export default Settings;
