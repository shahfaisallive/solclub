import mongoose from 'mongoose'

const Token = mongoose.Schema({
    mintId: {
        type: String,
        required: true
    },
    tokenUri: {
        type: String,
        // required: true
    },
    name:{
        type: String,
        // required: true
    },
    symbol:{
        type: String,
        // required: true
    },
    image:{
        type: String,
        // required: true
    }
    
}, { timestamps: true })

// const TokenModel = mongoose.model('Token', Token) //real collection
const TokenModel = mongoose.model('testToken', Token) //test collection
export default TokenModel