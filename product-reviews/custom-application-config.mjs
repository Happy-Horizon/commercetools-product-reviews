import { PERMISSIONS, entryPointUriPath } from './src/constants';

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication}
 */
const config = {
  name: 'Product Reviews',
  entryPointUriPath: process.env.ENTRY_POINT_URI_PATH || entryPointUriPath,
  cloudIdentifier: process.env.CLOUD_IDENTIFIER || 'gcp-eu',
  env: {
    development: {
      initialProjectKey:
        process.env.CTP_INITIAL_PROJECT_KEY || 'your-project-key',
    },
    production: {
      applicationId:
        process.env.CUSTOM_APPLICATION_ID ||
        process.env.APPLICATION_ID ||
        'TODO',
      url: process.env.APPLICATION_URL || 'https://your-app.example.com',
    },
  },
  oAuthScopes: {
    view: ['view_products', 'view_key_value_documents', 'view_states'],
    manage: ['manage_products', 'manage_key_value_documents', 'manage_states'],
  },
  icon: '${path:@commercetools-frontend/assets/application-icons/star.svg}',
  mainMenuLink: {
    defaultLabel: 'Product reviews',
    labelAllLocales: [],
    permissions: [PERMISSIONS.View],
  },
  submenuLinks: [
    {
      uriPath: 'settings',
      defaultLabel: 'Settings',
      labelAllLocales: [],
      permissions: [PERMISSIONS.View],
    },
  ],
};

export default config;
