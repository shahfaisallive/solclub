import express from "express"
import { getAllTokens } from "../controllers/stakingControllers.js"
const router = express.Router()

router.get('/all-tokens', getAllTokens)


export default router