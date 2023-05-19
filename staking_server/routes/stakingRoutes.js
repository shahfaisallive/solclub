import express from "express"
import { getTokenAccount, stakeController } from "../controllers/stakingControllers.js"
const router = express.Router()

router.get('/token-account/:mintId', getTokenAccount)
router.post('/stake-new', stakeController)


export default router