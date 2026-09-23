import {
  DEFAULT_REVIEW_SETTINGS,
  formatRating,
  parseImageSettings,
  parseReviewSettings,
} from './review-settings';

it('returns defaults for empty values', () => {
  expect(parseReviewSettings(null)).toEqual(DEFAULT_REVIEW_SETTINGS);
  expect(parseReviewSettings(undefined)).toEqual(DEFAULT_REVIEW_SETTINGS);
});

it('parses a 1 to 10 scale and known field modes', () => {
  expect(
    parseReviewSettings({
      ratingScale: 10,
      fields: {
        title: 'required',
        text: 'hidden',
        authorName: 'optional',
        promotional: 'required',
        unknown: 'required',
      },
    })
  ).toEqual({
    ratingScale: 10,
    fields: {
      title: 'required',
      text: 'hidden',
      authorName: 'optional',
      promotional: 'required',
      images: 'optional',
    },
    ratingDimensions: [],
    images: DEFAULT_REVIEW_SETTINGS.images,
  });
});

it('parses extra ratings and drops invalid keys', () => {
  expect(
    parseReviewSettings({
      ratingDimensions: [
        {
          key: 'Price',
          labels: { 'en-GB': 'Price', 'nl-NL': 'Prijs', empty: '  ' },
        },
        { key: 'price', labels: { 'en-GB': 'Duplicate' } },
        { key: '1bad', labels: { 'en-GB': 'Bad' } },
        { key: 'quality', labels: {} },
      ],
    })
  ).toEqual({
    ...DEFAULT_REVIEW_SETTINGS,
    ratingDimensions: [
      {
        key: 'price',
        labels: { 'en-GB': 'Price', 'nl-NL': 'Prijs' },
      },
    ],
  });
});

it('parses S3 and R2 image settings and keeps a previous secret', () => {
  expect(
    parseReviewSettings({
      images: {
        provider: 'r2',
        bucket: 'reviews/',
        region: '',
        endpoint: 'https://abc.r2.cloudflarestorage.com/',
        publicBaseUrl: 'https://pub-abc.r2.dev/',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        maxFiles: 8,
        maxFileSizeMb: 12,
      },
    }).images
  ).toEqual({
    provider: 'r2',
    bucket: 'reviews/',
    region: 'auto',
    endpoint: 'https://abc.r2.cloudflarestorage.com/',
    publicBaseUrl: 'https://pub-abc.r2.dev',
    accessKeyId: 'key',
    secretAccessKey: 'secret',
    maxFiles: 8,
    maxFileSizeMb: 12,
  });

  expect(
    parseImageSettings({ provider: 's3', bucket: 'media' }, 'kept-secret')
  ).toMatchObject({
    provider: 's3',
    bucket: 'media',
    secretAccessKey: 'kept-secret',
  });

  expect(parseImageSettings({ provider: 'gcs', bucket: 'photos' })).toMatchObject({
    provider: 'gcs',
    bucket: 'photos',
    region: 'auto',
    endpoint: 'https://storage.googleapis.com',
  });

  expect(parseImageSettings({ provider: 'unknown' }).provider).toBe('s3');
});

it('formats a rating against the configured scale', () => {
  expect(formatRating(4, 5)).toBe('4 / 5');
  expect(formatRating(8, 10)).toBe('8 / 10');
  expect(formatRating(null, 5)).toBeNull();
});
