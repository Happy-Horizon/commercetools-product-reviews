import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'Settings.title',
    defaultMessage: 'Review settings',
  },
  backToReviews: {
    id: 'Settings.backToReviews',
    defaultMessage: 'Back to reviews',
  },
  tabGeneral: {
    id: 'Settings.tabGeneral',
    defaultMessage: 'General',
  },
  tabForm: {
    id: 'Settings.tabForm',
    defaultMessage: 'Form',
  },
  tabRating: {
    id: 'Settings.tabRating',
    defaultMessage: 'Rating',
  },
  tabImages: {
    id: 'Settings.tabImages',
    defaultMessage: 'Images',
  },
  hint: {
    id: 'Settings.hint',
    defaultMessage:
      'These settings control the storefront review form. The shop should read Custom Object container "product-reviews", key "settings".',
  },
  ratingScale: {
    id: 'Settings.ratingScale',
    defaultMessage: 'Rating scale',
  },
  ratingScaleDescription: {
    id: 'Settings.ratingScaleDescription',
    defaultMessage: 'Maximum score customers can give a product.',
  },
  scaleFive: {
    id: 'Settings.scaleFive',
    defaultMessage: '1 to 5',
  },
  scaleTen: {
    id: 'Settings.scaleTen',
    defaultMessage: '1 to 10',
  },
  formFields: {
    id: 'Settings.formFields',
    defaultMessage: 'Storefront form fields',
  },
  formFieldsDescription: {
    id: 'Settings.formFieldsDescription',
    defaultMessage:
      'Choose which fields appear on the review form and whether they are required. An overall rating is always collected when no extra ratings are configured.',
  },
  ratingDimensions: {
    id: 'Settings.ratingDimensions',
    defaultMessage: 'Additional ratings',
  },
  ratingDimensionsDescription: {
    id: 'Settings.ratingDimensionsDescription',
    defaultMessage:
      'Add extra scores such as price or quality. Each rating has a key (used when saving) and a label per project language.',
  },
  ratingDimensionKey: {
    id: 'Settings.ratingDimensionKey',
    defaultMessage: 'Key',
  },
  ratingDimensionKeyDescription: {
    id: 'Settings.ratingDimensionKeyDescription',
    defaultMessage: 'Lowercase letters, numbers, and hyphens. Example: price',
  },
  ratingDimensionLabels: {
    id: 'Settings.ratingDimensionLabels',
    defaultMessage: 'Labels',
  },
  newRatingDimension: {
    id: 'Settings.newRatingDimension',
    defaultMessage: 'New rating',
  },
  addRatingDimension: {
    id: 'Settings.addRatingDimension',
    defaultMessage: 'Add rating',
  },
  removeRatingDimension: {
    id: 'Settings.removeRatingDimension',
    defaultMessage: 'Remove',
  },
  noRatingDimensions: {
    id: 'Settings.noRatingDimensions',
    defaultMessage:
      'No extra ratings yet. The storefront will only show the overall rating.',
  },
  fieldTitle: {
    id: 'Settings.fieldTitle',
    defaultMessage: 'Title',
  },
  fieldText: {
    id: 'Settings.fieldText',
    defaultMessage: 'Review text',
  },
  fieldAuthorName: {
    id: 'Settings.fieldAuthorName',
    defaultMessage: 'Author name',
  },
  fieldPromotional: {
    id: 'Settings.fieldPromotional',
    defaultMessage: 'Promotional / sponsored disclosure',
  },
  fieldImages: {
    id: 'Settings.fieldImages',
    defaultMessage: 'Review images',
  },
  imagesHint: {
    id: 'Settings.imagesHint',
    defaultMessage:
      'The shop uploads review photos to this bucket and stores the public URLs on the review.',
  },
  imageProvider: {
    id: 'Settings.imageProvider',
    defaultMessage: 'Storage provider',
  },
  imageProviderS3: {
    id: 'Settings.imageProviderS3',
    defaultMessage: 'Amazon S3',
  },
  imageProviderR2: {
    id: 'Settings.imageProviderR2',
    defaultMessage: 'Cloudflare R2',
  },
  imageProviderGcs: {
    id: 'Settings.imageProviderGcs',
    defaultMessage: 'Google Cloud Storage',
  },
  imageProviderAzure: {
    id: 'Settings.imageProviderAzure',
    defaultMessage: 'Azure Blob Storage',
  },
  imageProviderS3Compatible: {
    id: 'Settings.imageProviderS3Compatible',
    defaultMessage: 'S3-compatible (MinIO, Spaces, …)',
  },
  imageBucket: {
    id: 'Settings.imageBucket',
    defaultMessage: 'Bucket',
  },
  imageRegion: {
    id: 'Settings.imageRegion',
    defaultMessage: 'Region',
  },
  imageRegionDescription: {
    id: 'Settings.imageRegionDescription',
    defaultMessage:
      'AWS region such as eu-west-1. R2 and GCS usually use auto. Azure uses the storage location if needed.',
  },
  imageEndpoint: {
    id: 'Settings.imageEndpoint',
    defaultMessage: 'Endpoint',
  },
  imageEndpointDescription: {
    id: 'Settings.imageEndpointDescription',
    defaultMessage:
      'R2: https://ACCOUNT_ID.r2.cloudflarestorage.com. GCS: https://storage.googleapis.com. Azure: https://ACCOUNT.blob.core.windows.net. Required for S3-compatible hosts such as MinIO.',
  },
  imagePublicBaseUrl: {
    id: 'Settings.imagePublicBaseUrl',
    defaultMessage: 'Public base URL',
  },
  imagePublicBaseUrlDescription: {
    id: 'Settings.imagePublicBaseUrlDescription',
    defaultMessage:
      'Public URL prefix stored on reviews, without a trailing slash. Example: https://pub-xxxxx.r2.dev or a CloudFront domain.',
  },
  imageAccessKeyId: {
    id: 'Settings.imageAccessKeyId',
    defaultMessage: 'Access key ID',
  },
  imageSecretAccessKey: {
    id: 'Settings.imageSecretAccessKey',
    defaultMessage: 'Secret access key',
  },
  imageSecretAccessKeyDescription: {
    id: 'Settings.imageSecretAccessKeyDescription',
    defaultMessage:
      'Leave blank to keep the key that is already stored.',
  },
  imageSecretStored: {
    id: 'Settings.imageSecretStored',
    defaultMessage: 'A secret key is already saved.',
  },
  imageMaxFiles: {
    id: 'Settings.imageMaxFiles',
    defaultMessage: 'Maximum images per review',
  },
  imageMaxFileSizeMb: {
    id: 'Settings.imageMaxFileSizeMb',
    defaultMessage: 'Maximum file size (MB)',
  },
  modeHidden: {
    id: 'Settings.modeHidden',
    defaultMessage: 'Hidden',
  },
  modeOptional: {
    id: 'Settings.modeOptional',
    defaultMessage: 'Optional',
  },
  modeRequired: {
    id: 'Settings.modeRequired',
    defaultMessage: 'Required',
  },
  save: {
    id: 'Settings.save',
    defaultMessage: 'Save settings',
  },
  saveSuccess: {
    id: 'Settings.saveSuccess',
    defaultMessage: 'Review settings saved.',
  },
  saveError: {
    id: 'Settings.saveError',
    defaultMessage: 'We could not save the settings. Please try again.',
  },
  noPermission: {
    id: 'Settings.noPermission',
    defaultMessage: 'You can view these settings but you cannot change them.',
  },
});
