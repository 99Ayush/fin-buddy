/**
 * Offers Module - Routes (offers.routes.js)
 * API routes for /offers endpoints
 */

const express = require('express');
const offersController = require('./offers.controller');

const router = express.Router();

/**
 * @route POST /offers/compare
 * @description Compare 2-4 job offers side-by-side
 * @body { offerIds?: string[], manualOffers?: object[] }
 * @returns { offers[], comparison[] }
 */
router.post('/compare', offersController.compareOffers);

/**
 * @route POST /offers/esop
 * @description Calculate ESOP projections across Bear/Base/Bull scenarios
 * @body { totalOptions, strikePrice, totalCompanyShares, cliffMonths?, vestingSchedule?, currentValuation?, scenarios? }
 * @returns { projections, vestingSchedule, assumptions }
 */
router.post('/esop', offersController.calculateEsop);

/**
 * @route POST /offers/email
 * @description Generate AI counter-offer email
 * @body { currentOfferId, asks[], tone?, competingOfferIds? }
 * @returns { email }
 */
router.post('/email', offersController.generateEmail);

/**
 * @route POST /offers/roleplay
 * @description HR Role-Play turn
 * @body { offerId, conversationHistory[], userMessage, persona?, turnNumber? }
 * @returns { hrResponse, turnNumber, isComplete }
 */
router.post('/roleplay', offersController.roleplayTurn);

/**
 * @route POST /offers/scorecard
 * @description Generate negotiation scorecard after roleplay
 * @body { offerId, conversationHistory[], persona? }
 * @returns { scorecard }
 */
router.post('/scorecard', offersController.generateScorecard);

/**
 * @route GET /offers/my-offers
 * @description List user's saved offer letters
 * @returns { offers[] }
 */
router.get('/my-offers', offersController.listMyOffers);

module.exports = router;