/**
 * @fileoverview Mongoose schema and model for financial accounts.
 * Provides the structure for user accounts and encapsulated methods for calculating balances based on ledger entries.
 * @module models/account.model
 */
const mongoose = require('mongoose');
const ledgerModel = require('../models/ledger.model');

/**
 * Represents a user's financial account.
 * @constructor accountSchema
 */
const accountSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Account must be associated with a user"],
        index: true
    },
    status:{
        type: String,
        enum: {
            values: ["ACTIVE", "FROZEN", "CLOSED"],
            message: "Status can be either ACTIVE, FROZEN or CLOSED",
        },
        default: "ACTIVE"
    },
    currency:{
        type: String,
        required: [true, "Currency is required for creating an account"],
        default: "INR"
    },
},
{
    timestamps: true
});

// Compound index to optimize querying active accounts per user
accountSchema.index({ user: 1, status: 1 });

/**
 * Calculates the real-time balance of the account by aggregating all associated ledger entries.
 * @returns {Promise<number>} The computed balance (total credits - total debits).
 */
accountSchema.methods.getBalance = async function(){
    const balanceData = await ledgerModel.aggregate([
        {
            $match: {
                account: this._id
            }
        },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            {
                                $eq: ["$type", "DEBIT"]
                            },
                            "$amount",
                            0
                        ]
                    }
                    
                },
                totalCredit:{
                    $sum: {
                        $cond: [
                            {
                                $eq: ["$type", "CREDIT"]
                            },
                            "$amount",
                            0
                        ]
                    }
                }
                
            }
        },
        {
            $project: {
                _id: 0,
                // Balance is calculated strictly as Credit - Debit based on standard financial rules
                balance: {
                    $subtract: ["$totalCredit", "$totalDebit"]
                }
            }
        }
    ]);

    if (balanceData.length === 0)
    {
        return 0;
    }
    
    return balanceData[0].balance;
}

const accountModel = mongoose.model("account", accountSchema);

module.exports = accountModel;