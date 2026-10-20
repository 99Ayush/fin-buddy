/**
 * Offers Module - Controller (offers.controller.js)
 * Route handlers for /offers endpoints
 */

const offersService = require('./offers.service');
const reportStore = require('../../shared/reportStore');

/**
 * POST /offers/compare
 * Compare 2-4 offers side-by-side
 */
async function compareOffers(req, res) {
  try {
    const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';
    const { offerIds, manualOffers } = req.body;

    let offers = [];

    if (offerIds && offerIds.length > 0) {
      // Load from reportStore
      for (const id of offerIds) {
        const report = await reportStore.getReport(id);
        if (report && report.documentType === 'offer_letter') {
          offers.push(report);
        }
      }
    }

    if (manualOffers && manualOffers.length > 0) {
      offers = [...offers, ...manualOffers];
    }

    if (offers.length < 2 || offers.length > 4) {
      return res.status(400).json({
        error: 'Provide 2-4 offers (via offerIds or manualOffers)',
        code: 'INVALID_OFFER_COUNT',
      });
    }

    const result = await offersService.compareOffers(offers, userId);

    console.log(`[OFFERS] Comparison: ${offers.length} offers compared`);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[OFFERS] Compare error:', error.message);
    res.status(400).json({ error: error.message, code: 'COMPARE_FAILED' });
  }
}

/**
 * POST /offers/esop
 * Calculate ESOP projections
 */
async function calculateEsop(req, res) {
  try {
    const params = req.body;

    if (!params.totalOptions || !params.strikePrice || !params.totalCompanyShares) {
      return res.status(400).json({
        error: 'Required: totalOptions, strikePrice, totalCompanyShares',
        code: 'MISSING_PARAMS',
      });
    }

    const result = await offersService.calculateEsop(params);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[OFFERS] ESOP error:', error.message);
    res.status(400).json({ error: error.message, code: 'ESOP_FAILED' });
  }
}

/**
 * POST /offers/email
 * Generate counter-offer email
 */
async function generateEmail(req, res) {
  try {
    const { currentOfferId, asks, tone, competingOfferIds } = req.body;
    const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';

    if (!currentOfferId) {
      return res.status(400).json({ error: 'currentOfferId required', code: 'MISSING_OFFER' });
    }

    const currentOffer = await reportStore.getReport(currentOfferId);
    if (!currentOffer || currentOffer.documentType !== 'offer_letter') {
      return res.status(404).json({ error: 'Offer not found', code: 'OFFER_NOT_FOUND' });
    }

    let competingOffers = [];
    if (competingOfferIds) {
      for (const id of competingOfferIds) {
        const report = await reportStore.getReport(id);
        if (report && report.documentType === 'offer_letter') {
          competingOffers.push(report);
        }
      }
    }

    const email = await offersService.generateCounterEmail({
      currentOffer,
      asks: asks || [],
      tone: tone || 'polite_enthusiastic',
      competingOffers,
    });

    res.json({ success: true, email });
  } catch (error) {
    console.error('[OFFERS] Email error:', error.message);
    res.status(400).json({ error: error.message, code: 'EMAIL_FAILED' });
  }
}

/**
 * POST /offers/roleplay
 * HR Role-Play turn
 */
async function roleplayTurn(req, res) {
  try {
    const { offerId, conversationHistory, userMessage, persona, turnNumber } = req.body;
    const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';

    if (!offerId || !userMessage) {
      return res.status(400).json({ error: 'offerId and userMessage required', code: 'MISSING_PARAMS' });
    }

    const offer = await reportStore.getReport(offerId);
    if (!offer || offer.documentType !== 'offer_letter') {
      return res.status(404).json({ error: 'Offer not found', code: 'OFFER_NOT_FOUND' });
    }

    const result = await offersService.roleplayTurn({
      offer,
      conversationHistory: conversationHistory || [],
      userMessage,
      persona: persona || 'friendly_recruiter',
      turnNumber: turnNumber || 1,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[OFFERS] Roleplay error:', error.message);
    res.status(400).json({ error: error.message, code: 'ROLEPLAY_FAILED' });
  }
}

/**
 * POST /offers/scorecard
 * Generate negotiation scorecard
 */
async function generateScorecard(req, res) {
  try {
    const { offerId, conversationHistory, persona } = req.body;

    if (!offerId || !conversationHistory) {
      return res.status(400).json({ error: 'offerId and conversationHistory required', code: 'MISSING_PARAMS' });
    }

    const offer = await reportStore.getReport(offerId);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found', code: 'OFFER_NOT_FOUND' });
    }

    const scorecard = await offersService.generateScorecard({
      offer,
      conversationHistory,
      persona: persona || 'friendly_recruiter',
    });

    res.json({ success: true, scorecard });
  } catch (error) {
    console.error('[OFFERS] Scorecard error:', error.message);
    res.status(400).json({ error: error.message, code: 'SCORECARD_FAILED' });
  }
}

/**
 * GET /offers/my-offers
 * List user's saved offers
 */
async function listMyOffers(req, res) {
  try {
    const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';
    const offers = await offersService.getUserOffers(userId);

    res.json({
      success: true,
      offers: offers.map(o => ({
        documentId: o.documentId,
        companyName: o.company?.name,
        ctcAnnual: o.compensation?.ctcAnnual,
        savedAt: o.savedAt,
      })),
    });
  } catch (error) {
    console.error('[OFFERS] List error:', error.message);
    res.status(500).json({ error: error.message, code: 'LIST_FAILED' });
  }
}

module.exports = {
  compareOffers,
  calculateEsop,
  generateEmail,
  roleplayTurn,
  generateScorecard,
  listMyOffers,
};
