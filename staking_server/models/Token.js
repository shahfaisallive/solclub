import mongoose from 'mongoose'

const TokenSchema = mongoose.Schema({
    mintId: {
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
    isStaked: {
        type: Boolean,
        required: true,
        default: false
    },
    ownerTokenAccount: {
        type: String,
        required: true
    },
    hostTokenAccount: {
        type: String,
        required: true
    },
    tokenUri: {
        type: String,
        required: true
    }
}, { timestamps: true })

const TokenModel = mongoose.model('Token', TokenSchema)
export default TokenModel