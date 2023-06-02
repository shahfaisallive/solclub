import express from "express"
import { fetchFromSolana, getAllTokens, getMyStakedTokens } from "../controllers/tokenControllers.js"
const router = express.Router()

router.get('/fetch', fetchFromSolana)
router.get('/all', getAllTokens)
router.get('/staked/:address', getMyStakedTokens)


export default router