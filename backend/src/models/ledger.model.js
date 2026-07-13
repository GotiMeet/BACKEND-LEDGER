const mongoose = require('mongoose');  

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

function preventLedgerModification(){
    throw new Error("Ledger is immutable and cannot be modified");
}

// Query Middleware (Updates)
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("replaceOne", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);

// Query Middleware (Deletes)
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findByIdAndDelete", preventLedgerModification);

// Document Middleware (The save Hook for Updates)
ledgerSchema.pre("save", function() {
    // If the document is not new (meaning it's an update), prevent it.
    if (!this.isNew) {
        preventLedgerModification(); // This throws the error
    }
});


const ledgerModel = mongoose.model("ledger", ledgerSchema);


module.exports = ledgerModel;