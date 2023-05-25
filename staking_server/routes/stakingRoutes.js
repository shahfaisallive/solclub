import express from "express"
import { getTokenAccount, getTxDetails, stakeController, unstakeController } from "../controllers/stakingControllers.js"
const router = express.Router()

router.get('/tx/:hash', getTxDetails)
router.get('/token-account/:mintId', getTokenAccount)
router.post('/stake', stakeController)
router.post('/unstake', unstakeController)


export default router