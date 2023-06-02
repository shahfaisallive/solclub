import express from "express"
import { getHostTokenAccount, getTxDetails, stakeController, unstakeController } from "../controllers/stakingControllers.js"
const router = express.Router()

router.get('/tx/:hash', getTxDetails)
router.get('/token-account/:mintId', getHostTokenAccount)
router.post('/stake', stakeController)
router.post('/unstake', unstakeController)


export default router