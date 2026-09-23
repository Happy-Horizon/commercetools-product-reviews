import { lazy } from 'react';

const Reviews = lazy(
  () => import('./reviews' /* webpackChunkName: "reviews" */)
);

export default Reviews;
