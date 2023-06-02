import mongoose from 'mongoose'

const UnstakedToken = mongoose.Schema({
    mintId: {
        type: String,
        required: true
    },
    unstakedAt: {
        type: Number,
        required: true
    },
    rewardClaimed: {
        type: Boolean,
        required: true
    }
}, { timestamps: true })

const UnstakedTokenModel = mongoose.model('UnstakedToken', UnstakedToken)
export default UnstakedTokenModel