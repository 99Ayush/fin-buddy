/**
 * Documents Module - Frontend Public Interface (index.js)
 * Exports page, API client, and i18n for shell registration
 */

import DocumentsPage from './pages/DocumentsPage';
import * as documentsApi from './services/documentsApi';
import * as i18n from './i18n';

export {
  DocumentsPage,
  documentsApi,
  i18n,
};

export default {
  page: DocumentsPage,
  api: documentsApi,
  i18n,
  routePath: '/documents',
};