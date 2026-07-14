/**
 * @fileoverview Controllers for processing financial transactions securely.
 * Enforces business rules like idempotency, balance checks, and atomic double-entry ledger updates.
 * @module controllers/transaction.controller
 */
const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const { sendTransactionEmail, sendTransactionFailureEmail, sendRefundEmail } = require('../services/email.service');
const accountModel = require('../models/account.model');
const mongoose = require('mongoose');

/**
 * Orchestrates a secure fund transfer between two accounts.
 * Implements idempotency to prevent double-charging and uses MongoDB sessions 
 * for atomic double-entry bookkeeping (ensuring debits and credits always balance).
 * @function createTransactionController
 * @route POST /api/transactions
 * @access Private
 */
async function createTransactionController(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const fromUserAccount = await accountModel.findById(fromAccount);

  const toUserAccount = await accountModel.findById(toAccount);

  if (!fromUserAccount || !toUserAccount) {
    return res.status(404).json({
      message: "Account not found",
    });
  }

  // Enforce idempotency: return the previous result if this exact request was already processed safely.
  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already exists",
        transaction: isTransactionAlreadyExists,
      });
    }

    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(400).json({
        message: "Transaction is pending!",
        transaction: isTransactionAlreadyExists,
      });
    }

    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "Transaction processing failed, Please retry",
        transaction: isTransactionAlreadyExists,
      });
    }

    if (isTransactionAlreadyExists.status === "REFUNDED") {
      return res.status(500).json({
        message: "Transaction has been refunded",
        transaction: isTransactionAlreadyExists,
      });
    }
  }

  // Business rule: Both accounts must be active to prevent unauthorized transfers involving frozen or closed accounts.
  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message: "Both accounts must be active to process the transaction",
    });
  }

  // Calculate real-time balance dynamically from the ledger to guarantee accurate funds availability.
  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance, Current balance is ${balance}, Requested amount is ${amount}`,
    });
  }

    let transaction;
    try {
        
        // Use an atomic MongoDB session to ensure the transaction and its double-entry ledger records are committed all together or not at all.
        const session = await mongoose.startSession();
        
        session.startTransaction();
        
        transaction = await transactionModel.create(
            [
                {
                    fromAccount,
                    toAccount,
                    amount,
                    idempotencyKey,
                    status: "PENDING",
                },
            ],
            { session },
        );
        
        
        const debitLedgerEntry = await ledgerModel.create(
            [
                {
                    account: fromAccount,
                    amount,
                    transaction: transaction[0]._id,
                    type: "DEBIT",
                },
            ],
            { session },
        );
        
        
        const creditLedgerEntry = await ledgerModel.create(
            [
                {
                    account: toAccount,
                    amount,
                    transaction: transaction[0]._id,
                    type: "CREDIT",
                },
            ],
            { session },
        );
        
        
        
        await transactionModel.updateOne(
            { _id: transaction[0]._id },
            { $set: { status: "COMPLETED" } },
            { session },
        );
        
        
        await session.commitTransaction();
        session.endSession();
        
    } catch (error) {
        return res.status(400).json({
            message: "Transaction is Pending due to some issue, Please try again later"
        });
    }
        
        await sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);
        
        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: transaction
        });
    }
    
    /**
     * Processes an administrative deposit of initial funds from the system account to a user account.
     * Uses atomic transactions to ensure financial consistency.
     * @function createInitialFundsTransactionController
     * @route POST /api/transactions/system/initial-funds
     * @access Private (System User Only)
     */
    async function createInitialFundsTransactionController(req, res){
        const {toAccount, amount, idempotencyKey} = req.body;
        
        if(!toAccount || !amount || !idempotencyKey)
            {
                return res.status(400).json({
                    message: "All fields are required"
                });
            }
            
            const toUserAccount = await accountModel.findById(toAccount);
            
            if(!toUserAccount)
                {
        return res.status(404).json({
            message: "User account not found"
        });
    }

    if(toUserAccount.status !== "ACTIVE")
    {
        return res.status(400).json({
            message: "User account is not active"
        });
    }
    
    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    });
    
    if(!fromUserAccount)
    {
        return res.status(404).json({
            message: "System user account not found",
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = await transactionModel.create(
        [
            {
                fromAccount: fromUserAccount._id,
                toAccount,
                amount,
                status: "PENDING",
                idempotencyKey
            }
        ], { session });
    
    const debitLedgerEntry = await ledgerModel.create(
        [
            {
                account: fromUserAccount._id,
                amount,
                transaction: transaction[0]._id,
                type: "DEBIT"
            }
        ], { session });

    const creditLedgerEntry = await ledgerModel.create(
        [
            {
                account: toUserAccount._id,
                amount,
                transaction: transaction[0]._id,
                type: "CREDIT"
            }
        ], { session });

   transaction[0].status = "COMPLETED";
   await transaction[0].save({ session });

   await session.commitTransaction();
   session.endSession();

   return res.status(201).json({
        message: "Initial funds deposited successfully",
        transaction: transaction[0],
        debitLedgerEntry,
        creditLedgerEntry
    });
}

module.exports = {
    createTransactionController,
    createInitialFundsTransactionController
};