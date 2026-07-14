/**
 * @fileoverview Defines Express routes for managing user financial accounts and balances.
 * @module routes/account.routes
 */
const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const accountControlle = require('../controllers/account.controller');

const router = express.Router();

/**
 * Provisions a new financial account for the authenticated user.
 * @name POST /api/accounts/
 * @function
 * @memberof module:routes/account.routes
 */
router.post("/",authMiddleware, accountControlle.createAccountController);

/**
 * Retrieves all accounts owned by the authenticated user.
 * @name GET /api/accounts/
 * @function
 * @memberof module:routes/account.routes
 */
router.get("/", authMiddleware, accountControlle.getAccountsController);

/**
 * Calculates and retrieves the current balance for a specific account.
 * @name GET /api/accounts/balance/:accountId
 * @function
 * @memberof module:routes/account.routes
 */

router.get("/balance/:accountId", authMiddleware, accountControlle.getAccountBalanceController);


module.exports = router;