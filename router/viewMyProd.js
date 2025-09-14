
import express from "express"
import cookieParser from "cookie-parser"
import { Router } from "express"
import { client } from "../controllers/redisCache.js"
import { cookieChecker } from "../controllers/cookieChecker.js"
import {viewMyMedia, } from '../database/db.js'


const router= Router()
router.use(express.json())
router.use(cookieParser())

router.get('/myProducts', cookieChecker, async (req, res)=>{
    const {email, id, role}= req.user

    if(!role || role!=='seller') return res.status(403).json({error:'Please use a seller profile!'})
        try {
            const duration= 7200
            let unparsed=await client.get(`${email}__${id}`)

            if(unparsed) {
                const products=JSON.parse(unparsed)
                return res.status(200).json(products)
            }
            const getMyprod=await viewMyMedia(email, id)
            if(!getMyprod.message) return res.status(404).json({error: getMyprod.err})
            const products={
                images: getMyprod.images || [],
                videos: getMyprod.videos || []
            }
            // console.log(products)
            await client.setEx(`${email}__${id}`, duration, JSON.stringify(products))
            return res.status(200).json(products)
        } catch (error) {
            console.log(`Error: ${error}`);
            return res.status(500).json({error:'Sorry a server error occured. Please try again later'})
        }
})

export default router;