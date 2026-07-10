const mongoose = require('mongoose');

const transactionShema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "From account is required for creating a transaction"],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "To account is required for creating a transaction"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
            message: "Status can be either PENDING, COMPLETED, FAILED or REFUNDED"
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [true, "Amount is required for creating a transaction"],
        min: [0, "Amount can't be zero"]
    },
    idempotencyKey: {
        type: String,
        unique: true,
        index: true,
        required: [true, "Idempotency key is required for creating a transaction"]
    }
},
{
    timestamps: true
});



const transactionModel = mongoose.model("transaction", transactionShema);
module.exports = transactionModel;
