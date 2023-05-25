import dotenv from "dotenv"
dotenv.config({ path: './.env' })

import express from "express"
import cors from 'cors'
import mongoose from 'mongoose'


// IMPORTING ROUTES
import stakingRoutes from './routes/stakingRoutes.js'
import tokenRoutes from './routes/tokenRoutes.js'

const app = express()
app.use(express.json())

// CORS SETUP
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use(cors({
    origin: "*",
    credentials: true,
}));

// Using the routes
app.use('/api/token', tokenRoutes)
app.use('/api/staking', stakingRoutes)

// Default Route
app.use('/', (req, res) => res.send('Welcome to Solclub Staking..! If you feel misdirected, kindly recheck your path!'))


// MONGODB CONNECTION
mongoose.connect("mongodb://127.0.0.1:27017/solclub")
    .then(() => {
        console.log('Staking Server connected to MongoDB successfully');
    }).catch(err => {
        console.log('ERRR! Connection to MongoDB Failed')
        console.log(err)
    })

// SERVER LISTENING
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log('Staking server is running successfully on Port: ' + PORT)
})