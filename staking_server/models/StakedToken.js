import mongoose from 'mongoose'

const StakedToken = mongoose.Schema({
    mintId: {
        type: String,
        required: true
    },
    txHash: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    stakedAt: {
        type: Number,
        required: true
    },
    stakeDuration: {
        type: Number,
        required: true
    },
    ownerTokenAccount: {
        type: String,
        required: true
    },
    hostTokenAccount: {
        type: String,
        required: true
    }
}, { timestamps: true })

const StakedTokenModel = mongoose.model('StakedToken', StakedToken)
export default StakedTokenModel