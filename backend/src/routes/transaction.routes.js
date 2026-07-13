const express = require('express');
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const { authMiddleware , authSystemUserMiddleware} = require('../middleware/auth.middleware');

/**
 * - POST /api/transactions
 * - Create a new transaction
 * - Protected Route
 */
router.post("/", authMiddleware, transactionController.createTransactionController);

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial fund transaction from system user 
 */
router.post("/system/initial-funds", authSystemUserMiddleware, transactionController.createInitialFundsTransactionController);

module.exports = router;