/**
 * @fileoverview Defines Express routes for processing financial transactions and system funding.
 * @module routes/transaction.routes
 */
const express = require('express');
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const { authMiddleware , authSystemUserMiddleware} = require('../middleware/auth.middleware');

/**
 * Initiates a secure financial transaction between two accounts.
 * @name POST /api/transactions
 * @function
 * @memberof module:routes/transaction.routes
 */
router.post("/", authMiddleware, transactionController.createTransactionController);

/**
 * Provisions initial funds to a user account from the system account.
 * Restricted to administrative system users.
 * @name POST /api/transactions/system/initial-funds
 * @function
 * @memberof module:routes/transaction.routes
 */
router.post("/system/initial-funds", authSystemUserMiddleware, transactionController.createInitialFundsTransactionController);

module.exports = router;