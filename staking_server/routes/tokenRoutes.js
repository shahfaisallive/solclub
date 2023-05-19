import express from "express"
import { fetchFromSolana, getAllTokens } from "../controllers/tokenControllers.js"
const router = express.Router()

router.get('/fetch', fetchFromSolana)
router.get('/all', getAllTokens)


export default router