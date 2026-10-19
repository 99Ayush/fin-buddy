/**
 * Offers Module - Public Interface (index.js)
 * Exports router and service for mounting in app.js
 */

const offersRouter = require('./offers.routes');
const offersService = require('./offers.service');

module.exports = {
  router: offersRouter,
  service: offersService,
  basePath: '/offers',
};