export const FIELD_KEYS = [
  'title',
  'text',
  'authorName',
  'promotional',
  'images',
] as const;

export const IMAGE_STORAGE_PROVIDERS = [
  's3',
  'r2',
  'gcs',
  'azure',
  's3-compatible',
] as const;

export type TReviewFormFieldKey = (typeof FIELD_KEYS)[number];
export type TReviewFormFieldMode = 'hidden' | 'optional' | 'required';
export type TImageStorageProvider = (typeof IMAGE_STORAGE_PROVIDERS)[number];

export type TImageStorageProviderMeta = {
  defaultRegion?: string;
  defaultEndpoint?: string;
};

export const IMAGE_STORAGE_PROVIDER_META: Record<
  TImageStorageProvider,
  TImageStorageProviderMeta
> = {
  s3: {},
  r2: { defaultRegion: 'auto' },
  gcs: {
    defaultRegion: 'auto',
    defaultEndpoint: 'https://storage.googleapis.com',
  },
  azure: {},
  's3-compatible': {},
};

export const isImageStorageProvider = (
  value: unknown
): value is TImageStorageProvider =>
  typeof value === 'string' &&
  (IMAGE_STORAGE_PROVIDERS as readonly string[]).includes(value);
export type TRatingScale = 5 | 10;
export type TLocalizedLabels = Record<string, string>;

export type TReviewImageSettings = {
  provider: TImageStorageProvider;
  bucket: string;
  region: string;
  endpoint: string;
  publicBaseUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
  maxFiles: number;
  maxFileSizeMb: number;
};

export type TRatingDimension = {
  id?: string;
  key: string;
  labels: TLocalizedLabels;
};

export const createRatingDimensionId = (): string =>
  `rating-${Math.random().toString(36).slice(2, 10)}`;

export type TReviewSettings = {
  ratingScale: TRatingScale;
  fields: Record<TReviewFormFieldKey, TReviewFormFieldMode>;
  ratingDimensions: TRatingDimension[];
  images: TReviewImageSettings;
};

export const DEFAULT_IMAGE_SETTINGS: TReviewImageSettings = {
  provider: 's3',
  bucket: '',
  region: '',
  endpoint: '',
  publicBaseUrl: '',
  accessKeyId: '',
  secretAccessKey: '',
  maxFiles: 3,
  maxFileSizeMb: 5,
};

export const DEFAULT_REVIEW_SETTINGS: TReviewSettings = {
  ratingScale: 5,
  fields: {
    title: 'optional',
    text: 'required',
    authorName: 'optional',
    promotional: 'optional',
    images: 'optional',
  },
  ratingDimensions: [],
  images: DEFAULT_IMAGE_SETTINGS,
};

export const RATING_KEY_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;

export const slugifyRatingKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

export const labelForLocale = (
  labels: TLocalizedLabels,
  locale: string,
  fallback: string
): string => {
  const direct = labels[locale]?.trim();
  if (direct) {
    return direct;
  }
  const language = locale.split('-')[0];
  const matched = Object.entries(labels).find(
    ([code, value]) =>
      Boolean(value.trim()) &&
      (code === language || code.startsWith(`${language}-`))
  );
  if (matched?.[1]?.trim()) {
    return matched[1].trim();
  }
  const first = Object.values(labels).find((value) => value.trim());
  return first?.trim() || fallback;
};

export const ratingDimensionLabel = (
  dimensions: TRatingDimension[],
  key: string,
  locale: string
): string => {
  const dimension = dimensions.find((item) => item.key === key);
  return dimension
    ? labelForLocale(dimension.labels, locale, key)
    : key;
};

const parseLocalizedLabels = (value: unknown): TLocalizedLabels => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return Object.entries(value as Record<string, unknown>).reduce(
    (labels, [locale, label]) => {
      if (typeof label === 'string' && label.trim()) {
        labels[locale] = label.trim();
      }
      return labels;
    },
    {} as TLocalizedLabels
  );
};

export const parseRatingDimensions = (
  value: unknown
): TRatingDimension[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const dimensions: TRatingDimension[] = [];
  value.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }
    const raw = item as { key?: unknown; labels?: unknown };
    const key = typeof raw.key === 'string' ? slugifyRatingKey(raw.key) : '';
    if (!RATING_KEY_PATTERN.test(key) || seen.has(key)) {
      return;
    }
    const labels = parseLocalizedLabels(raw.labels);
    if (!Object.values(labels).some((label) => label.trim())) {
      return;
    }
    seen.add(key);
    dimensions.push({ key, labels });
  });
  return dimensions;
};

const isFieldMode = (value: unknown): value is TReviewFormFieldMode =>
  value === 'hidden' || value === 'optional' || value === 'required';

const asTrimmedString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const clampInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number => {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(amount)));
};

export const parseImageSettings = (
  value: unknown,
  previousSecret = ''
): TReviewImageSettings => {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<Record<keyof TReviewImageSettings, unknown>>)
      : {};
  const provider = isImageStorageProvider(raw.provider)
    ? raw.provider
    : 's3';
  const defaults = IMAGE_STORAGE_PROVIDER_META[provider];
  const secretAccessKey =
    asTrimmedString(raw.secretAccessKey) || previousSecret;
  const region =
    asTrimmedString(raw.region) || defaults.defaultRegion || '';
  const endpoint =
    asTrimmedString(raw.endpoint) || defaults.defaultEndpoint || '';

  return {
    provider,
    bucket: asTrimmedString(raw.bucket),
    region,
    endpoint,
    publicBaseUrl: asTrimmedString(raw.publicBaseUrl).replace(/\/+$/, ''),
    accessKeyId: asTrimmedString(raw.accessKeyId),
    secretAccessKey,
    maxFiles: clampInt(raw.maxFiles, DEFAULT_IMAGE_SETTINGS.maxFiles, 1, 10),
    maxFileSizeMb: clampInt(
      raw.maxFileSizeMb,
      DEFAULT_IMAGE_SETTINGS.maxFileSizeMb,
      1,
      25
    ),
  };
};

export const parseReviewSettings = (value: unknown): TReviewSettings => {
  if (!value || typeof value !== 'object') {
    return DEFAULT_REVIEW_SETTINGS;
  }

  const raw = value as {
    ratingScale?: unknown;
    fields?: Partial<Record<TReviewFormFieldKey, unknown>>;
    ratingDimensions?: unknown;
    images?: unknown;
  };

  return {
    ratingScale: raw.ratingScale === 10 || raw.ratingScale === '10' ? 10 : 5,
    fields: FIELD_KEYS.reduce((fields, key) => {
      const mode = raw.fields?.[key];
      fields[key] = isFieldMode(mode)
        ? mode
        : DEFAULT_REVIEW_SETTINGS.fields[key];
      return fields;
    }, {} as Record<TReviewFormFieldKey, TReviewFormFieldMode>),
    ratingDimensions: parseRatingDimensions(raw.ratingDimensions),
    images: parseImageSettings(raw.images),
  };
};

export const formatRating = (
  rating: number | null | undefined,
  ratingScale: TRatingScale
): string | null => {
  if (rating == null) {
    return null;
  }
  return `${rating} / ${ratingScale}`;
};
