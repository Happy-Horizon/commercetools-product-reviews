import { lazy } from 'react';

const ReviewDetails = lazy(
  () => import('./review-details' /* webpackChunkName: "review-details" */)
);

export default ReviewDetails;
