
import express from "express"
import { Router } from "express"
import cookieParser from "cookie-parser"
import {client} from '../controllers/redisCache.js'
import {cookieChecker} from '../controllers/cookieChecker.js'
import {getUser} from '../database/db.js'

const router=Router()
router.use(express.json())
router.use(cookieParser())

router.get('/profile', cookieChecker, async (req, res)=>{
    const {email, id, role} = req.user

    if (role!=='seller') return res.status(403).json({error:'Please use seller profile to access this page'})

    try {
        const duration= 1000*60*60*5
        const profile= await client.get(`${email}${id}profile`)
        const parsedProfile = JSON.parse(profile)
        if(profile) return res.status(200).json({user: parsedProfile.user, message: parsedProfile.message})
        
        const profile1= await getUser(email, id)
        if(profile1.message){
            await client.setEx(`${email}${id}profile`, duration, JSON.stringify(profile1))
            return res.status(200).json({user: profile1.user, message: profile1.message}) 
        }
        if(profile1.error) return res.status(403).json({error: profile1.error})
        return res.status(404).json({user: profile1.user, message: profile1.message})
    } catch (error) {
        console.log(`Error: ${error}`)
        return res.status(500).json({error:'Sorry a server error occured. Please try again later'})
    }
})

export default router;