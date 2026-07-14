/**
 * @fileoverview Controllers for managing user accounts, including creation, retrieval, and balance calculation.
 * @module controllers/account.controller
 */
const accountModel = require('../models/account.model');

/**
 * Provisions a new account linked to the requesting user.
 * @function createAccountController
 * @route POST /api/accounts
 * @access Private
 */
async function createAccountController(req, res) {
    const user = req.user;
    
    const account = await accountModel.create({
        user: user._id
    });

    return res.status(201).json({
        account  
    });

}

/**
 * Fetches all accounts associated with the requesting user.
 * @function getAccountsController
 * @route GET /api/accounts
 * @access Private
 */
async function getAccountsController(req, res) {
    const user = req.user;
    
    const accounts = await accountModel.find({
        user: user._id
    });

    return res.status(200).json({
        accounts  
    });
}

/**
 * Calculates the current real-time balance for a given account ID.
 * Secures the request by ensuring the account belongs to the requesting user.
 * @function getAccountBalanceController
 * @route GET /api/accounts/balance/:accountId
 * @access Private
 */
async function getAccountBalanceController(req, res) {
    const accountId = req.params.accountId;
    
    // Verify account existence and ownership before querying the ledger to prevent unauthorized access
    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    });

    if(!account)
    {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    const balance = await account.getBalance();

    return res.status(200).json({
        accountId,
        balance
    });
}

module.exports = {
    createAccountController,
    getAccountsController,
    getAccountBalanceController
};