
import express from 'express'
import cookieParser from 'cookie-parser'
import rateLimit  from 'express-rate-limit'
import moment from 'moment'
import joi from 'joi'
import { Router } from 'express'
import {cookieChecker} from '../controllers/cookieChecker.js'
import {client} from '../controllers/redisCache.js'
import {saveRatings, getRatings} from '../database/db.js'


const ratingLimiter= rateLimit({
    windowMs: 1000*60*60*5,
    max:3,
    message:'Too many requests received from this IP. Please try again later.'
})

const detailsVerifier=joi.object({
    rating: joi.string().pattern(/^[0-9]+$/).required(),
    sellerId: joi.string().required(),
    sellerEmail: joi.string().custom((values, helpers)=>{
        if(!values.endsWith('@students.kyu.ac.ke')) return helpers.message('Unable to post your comment. Please try again after some hours.')
    })
})

const router=Router()
router.use(cookieParser())
router.use(express.json())

router.post('/rating', cookieChecker,  async(req, res)=>{
    const{role, id}=req.user,
    message='Cannot post a rating for the current role. Please create a consumer profile to gain the priviledge of post a comment.'

    if(role!=='consumer') return res.status(403).json(message)

    const status= req.body.status || 'new'
    let {rating, sellerEmail}=req.body
    const date=moment().format('YYYYMMDD')

    // const {error}=detailsVerifier.validate({rating, sellerId, sellerEmail})
    // console.log(error)

    // if(error) return res.status(400).json({error:'Unable to post your comment. Please try again after some hours.'})

    try {
            const saved= await saveRatings(id, status, sellerEmail, rating, date)
            const message=saved.message

            if(!message) return{error:'An error occured. Please try again later'}

            return res.status(201).json({message: saved.message})
    } catch (error) {
        console.log(error)
        res.status(500).json({error:'A server error occured. Please try again later'})
    }
    
})

router.get('/getRatings', cookieChecker, ratingLimiter, async(req, res)=>{
        const {sellerEmail}= req.body
        const  {error}= detailsVerifier.validate(sellerEmail)
        if (error) return res.status(400).json({error:'Unable to fetch the comments. Please try again later'})
        
        try {
            const ratings=await getRatings(sellerEmail)
            if(!ratings.status) return res.status(400). json({error:'Unable to fetch the comments. Please try again later'})

            res.status(200).json(ratings.row)
        } catch (error) {
            res.status(500).json({error:'Server error. Please try again later'})
        }
})

export default router