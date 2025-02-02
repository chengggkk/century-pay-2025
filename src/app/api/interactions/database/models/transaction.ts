
import mongoose from 'mongoose';

const transactionsSchema = new mongoose.Schema({
    ReceiverId: {
        type: String,
        required: true,
    },
    SenderId: {
        type: String,
        required: true,
    },
    generateTIME: {
        type: Date,
        required: true,
        default: Date.now,
    },
    amount: {
        type: String,
        required: false
    },
    network: {
        type: String,
    },
});


const transactions = mongoose.models.transactions || mongoose.model('transactions', transactionsSchema);


export default transactions;
