
import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
    },
    wallet: {
        type: String,
        required: true,
    },
    generateTIME: {
        type: Date,
        required: true,
        default: Date.now,
    },
    network: {
        type: String,
    },
});


const wallet = mongoose.models.wallet || mongoose.model('wallet', walletSchema);


export default wallet; 
