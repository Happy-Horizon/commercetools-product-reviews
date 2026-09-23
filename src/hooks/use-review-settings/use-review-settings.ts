/// <reference path="../../../@types-extensions/graphql-ctp/index.d.ts" />

import { useMemo } from 'react';
import type { ApolloError } from '@apollo/client';
import {
  useMcMutation,
  useMcQuery,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import {
  REVIEW_SETTINGS_CONTAINER,
  REVIEW_SETTINGS_KEY,
} from '../../constants';
import FetchReviewSettingsQuery from './fetch-review-settings.ctp.graphql';
import {
  DEFAULT_REVIEW_SETTINGS,
  parseReviewSettings,
  type TReviewSettings,
} from './review-settings';
import UpsertReviewSettingsMutation from './upsert-review-settings.ctp.graphql';

type TCustomObject = {
  id: string;
  version: number;
  container: string;
  key: string;
  value: unknown;
};

type TReviewSettingsQuery = {
  customObject?: TCustomObject | null;
};

type TUpsertReviewSettingsMutation = {
  createOrUpdateCustomObject: TCustomObject;
};

type TUpsertReviewSettingsVariables = {
  draft: {
    container: string;
    key: string;
    value: string;
    version?: number;
  };
};

const queryVariables = {
  container: REVIEW_SETTINGS_CONTAINER,
  key: REVIEW_SETTINGS_KEY,
};

const platformContext = {
  target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
};

const coerceCustomObjectValue = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export const useReviewSettingsFetcher = () => {
  const { data, error, loading } = useMcQuery<TReviewSettingsQuery>(
    FetchReviewSettingsQuery,
    {
      variables: queryVariables,
      context: platformContext,
      // Surface permission / network failures in the UI instead of silently
      // falling back to defaults (which made saves look broken for no reason).
      errorPolicy: 'none',
    }
  );

  const settings = useMemo(
    () =>
      parseReviewSettings(coerceCustomObjectValue(data?.customObject?.value)),
    [data?.customObject?.id, data?.customObject?.version, data?.customObject?.value]
  );

  return {
    settings,
    version: data?.customObject?.version,
    error: error as ApolloError | undefined,
    loading,
  };
};

export const useReviewSettingsUpdater = () => {
  const [upsertReviewSettings, { loading }] = useMcMutation<
    TUpsertReviewSettingsMutation,
    TUpsertReviewSettingsVariables
  >(UpsertReviewSettingsMutation, {
    context: platformContext,
    awaitRefetchQueries: true,
    refetchQueries: [
      {
        query: FetchReviewSettingsQuery,
        variables: queryVariables,
        context: platformContext,
      },
    ],
  });

  const saveSettings = async (settings: TReviewSettings, version?: number) => {
    const result = await upsertReviewSettings({
      variables: {
        draft: {
          container: REVIEW_SETTINGS_CONTAINER,
          key: REVIEW_SETTINGS_KEY,
          // CustomObjectDraft.value is a String of escaped JSON (not Json scalar).
          value: JSON.stringify(settings),
          ...(version == null ? {} : { version }),
        },
      },
    });

    if (result.errors?.length) {
      throw result.errors[0];
    }
    if (!result.data?.createOrUpdateCustomObject) {
      throw new Error('Custom Object was not created or updated.');
    }

    return result.data.createOrUpdateCustomObject;
  };

  return {
    saveSettings,
    loading,
    defaultSettings: DEFAULT_REVIEW_SETTINGS,
  };
};
