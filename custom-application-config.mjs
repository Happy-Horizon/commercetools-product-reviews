import { PERMISSIONS, entryPointUriPath } from './src/constants';

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication}
 */
const config = {
  name: 'Product Reviews',
  entryPointUriPath,
  cloudIdentifier: '${env:CLOUD_IDENTIFIER}',
  env: {
    development: {
      initialProjectKey: '${env:CTP_INITIAL_PROJECT_KEY}',
    },
    production: {
      applicationId: process.env.APPLICATION_ID || 'TODO',
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
