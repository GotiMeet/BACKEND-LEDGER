const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const { sendTransactionEmail, sendTransactionFailureEmail, sendRefundEmail } = require('../services/email.service');
const accountModel = require('../models/account.model');
const mongoose = require('mongoose');

/**
 * - Create a new Transaction
 *THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create DEBIT ledger entry
     * 6. Create CREDIT ledger entry
     * 7. Mark transaction COMPLETED
     * 8. Commit MongoDB session
     * 9. Send email notification
     * 
 */

async function createTransactionController(req, res) {
  // 1. Validate request
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

  // 2. Validate idempotency key
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

  // 3. Check account status
  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message: "Both accounts must be active to process the transaction",
    });
  }

  // 4. Derive sender balance from ledger
  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance, Current balance is ${balance}, Requested amount is ${amount}`,
    });
  }

    let transaction;
    try {
        
        // 5. Create Transaction (PENDING)
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
        
        // 6. Create DEBIT ledger entry
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
        
        // 7. Create CREDIT ledger entry
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
        
        // 8. Mark transaction COMPLETED
        
        await transactionModel.updateOne(
            { _id: transaction[0]._id },
            { $set: { status: "COMPLETED" } },
            { session },
        );
        
        // 9. Commit MongoDB session
        await session.commitTransaction();
        session.endSession();
        
    } catch (error) {
        return res.status(400).json({
            message: "Transaction is Pending due to some issue, Please try again later"
        });
    }
        // 10. Send email notification
        await sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);
        
        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: transaction
        });
    }
    
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