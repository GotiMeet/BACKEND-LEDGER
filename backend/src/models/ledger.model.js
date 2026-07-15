/**
 * @fileoverview Mongoose schema and model for the immutable financial ledger.
 * The ledger is the append-only source of truth for all financial movements.
 * 
 * BUSINESS PURPOSE:
 * Immutability is the cornerstone of double-entry bookkeeping and financial auditability.
 * Ledger entries must NEVER be modified or deleted because they represent historical facts
 * of fund transfers. Any modification would destroy financial consistency, making it impossible
 * to accurately reconstruct account balances or prove the integrity of the system to auditors.
 * To correct a mistake, a new compensating transaction (like a refund) must be appended.
 * 
 * @module models/ledger.model
 */
const mongoose = require('mongoose');  

/**
 * Represents a single immutable debit or credit entry in the ledger.
 * @constructor ledgerSchema
 */
const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Account is required for creating a ledger"],
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true, "Amount is required for creating a ledger"],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [true, "Transaction is required for creating a ledger"],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ['DEBIT', 'CREDIT'],
            message: 'Type must be either DEBIT or CREDIT'
        },
        required: [true, "Type is required for creating a ledger"],
        immutable: true
    }
});

/**
 * Hard enforcement of financial immutability. 
 * Throws an error whenever an update or delete operation is attempted on a ledger entry.
 * @throws {Error} Always throws to prevent data tampering.
 */
function preventLedgerModification(){
    throw new Error("Ledger is immutable and cannot be modified");
}

// Query Middleware (Updates): Blocks all attempts to alter existing ledger records via MongoDB queries.
// This guarantees that balances derived from the ledger remain mathematically sound and tamper-proof.
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("replaceOne", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);

// Query Middleware (Deletes): Blocks all attempts to permanently erase historical financial data.
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findByIdAndDelete", preventLedgerModification);

// Document Middleware: Intercepts save operations.
// Allows appending new entries but explicitly blocks saving changes to existing historical documents.
ledgerSchema.pre("save", function() {
    if (!this.isNew) {
        preventLedgerModification(); // This throws the error
    }
});


const ledgerModel = mongoose.model("ledger", ledgerSchema);


module.exports = ledgerModel;