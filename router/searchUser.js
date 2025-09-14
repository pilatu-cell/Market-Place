
import express from "express"
import cors from 'cors'
import { Router } from "express"
import rateLimit from "express-rate-limit"
import { client } from "../controllers/redisCache.js"
import {searchSeller} from '../database/db.js'


// REMEMBER TO ADD A CACHE!!!!!!!!!
const  router= Router()
router.use(cors({
    origin:'http://127.0.0.1:5500'
}))
router.use(express.json())
const limitSearch = rateLimit({
  windowMs: 1000 * 30,
  max: 20,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      error: "Too many requests",
      message: "You have reached the limit of your search. Please try again after 30 seconds."
    })
  }
})


router.post('/byid', async(req, res)=>{
    const search=req.body.search?.trim()

    try {
        const duration=7200

        const cachedUsers=await client.get(`searched__${search}`)
        if (cachedUsers) {
            let sellers=JSON.parse(cachedUsers)
            console.log(sellers)
            return res.status(200).json({sellers: sellers.seller, message: sellers.message})
        } 
        let sellers= await searchSeller(search)
        if (sellers.error || sellers.err) return res.status(403).json({ error: sellers.error || sellers.err })

        console.log(sellers)
        await client.setEx(`searched__${search}`, duration, JSON.stringify({seller: sellers.user, message: sellers.message}))
        return res.status(200).json({sellers: sellers.user, message: sellers.message})
    } catch (error) {
        console.log(error)
        res.status(500).json({error:'Sorry a server error occured '})
    }
} )

export default router