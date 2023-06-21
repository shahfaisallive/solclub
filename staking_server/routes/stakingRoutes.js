import express from "express"
import { getHostAddress, getHostTokenAccount, getTxDetails, stakeController, unstakeController } from "../controllers/stakingControllers.js"
import { verifySignatureMiddleware } from "../middlewares/verifySignature.js"
const router = express.Router()

router.get('/hostAddress', getHostAddress)
router.get('/tx/:hash', getTxDetails)
router.get('/token-account/:mintId', getHostTokenAccount)
router.post('/stake', stakeController)
router.post('/unstake', verifySignatureMiddleware, unstakeController)


export default router