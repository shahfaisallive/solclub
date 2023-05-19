import mongoose from 'mongoose'

const UnstakedToken = mongoose.Schema({
    mintId: {
        type: String,
        required: true
    },
    tokenUri: {
        type: String,
        required: true
    }
}, { timestamps: true })

const UnstakedTokenModel = mongoose.model('UnstakedToken', UnstakedToken)
export default UnstakedTokenModel