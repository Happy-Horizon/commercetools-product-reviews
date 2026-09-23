import { lazy } from 'react';

const Settings = lazy(
  () => import('./settings' /* webpackChunkName: "settings" */)
);

export default Settings;
