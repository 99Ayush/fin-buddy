/**
 * Documents Module - Public Interface (index.js)
 * Exports router and service for mounting in app.js
 * Other modules MUST import only from this file.
 */

const documentsRouter = require('./documents.routes');
const documentsService = require('./documents.service');
const trapDetector = require('./trapDetector');

module.exports = {
  // Express router for mounting in app.js
  router: documentsRouter,

  // Service functions for programmatic use
  service: documentsService,

  // Trap detector for direct use
  trapDetector,

  // Route path prefix
  basePath: '/documents',
};