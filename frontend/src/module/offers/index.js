/**
 * Offers Module - Frontend Public Interface (index.js)
 * Exports page, API client, and i18n for shell registration
 */

import OffersPage from './pages/OffersPage';
import * as offersApi from './services/offersApi';
import * as i18n from './i18n';

export {
  OffersPage,
  offersApi,
  i18n,
};

export default {
  page: OffersPage,
  api: offersApi,
  i18n,
  routePath: '/offers',
};