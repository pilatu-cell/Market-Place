
import express from "express"
import rateLimit from "express-rate-limit"
import cookieParser from "cookie-parser"
import { Router } from "express"
import { cookieChecker } from '../controllers/cookieChecker.js'
import {checkUser, deleteUser} from '../database/db.js'

const limitReq= rateLimit({
    windowMs: 1000*60*60*3,
    max:5,
    message:'Too many wrong attempts. Please try again after 4 hours'
})

const router= Router()
router.use(express.json())
router.use(cookieParser())

router.delete('/profile', cookieChecker, limitReq, async (req, res)=>{
    const {id, email, role}=req.user,
    {password}=req.body

    if(!email || !password) return res.status(400).json({error:'Bad request. Please login again to make this request'})

    try {        
        //perform delete operation
        const deleteProfile=await deleteUser(password, email, role, id)
        if(deleteProfile.error) return res.status(400).json(deleteProfile)
        
        return res.status(200).json(deleteProfile)
    } catch (error) {
        return res.status(500).json({error:'Sorry a server error occured. Please try again later.'})
    }
})

export default router;