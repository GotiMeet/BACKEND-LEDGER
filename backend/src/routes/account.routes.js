const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const accountControlle = require('../controllers/account.controller');

const router = express.Router();

/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */
router.post("/",authMiddleware, accountControlle.createAccountController);

/**
 * - GET /api/accounts/
 * - Get account of a logged-in user
 * - Protected Route
 */
router.get("/", authMiddleware, accountControlle.getAccountsController);

/**
 * - GET /api/accounts/balance/:accountId
 * - Get balance of an account
 * - Protected Route
 */

router.get("/balance/:accountId", authMiddleware, accountControlle.getAccountBalanceController);


module.exports = router;