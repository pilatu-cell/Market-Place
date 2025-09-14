import express from 'express'
import cookieParser from 'cookie-parser'
import moment from 'moment'
import rateLimiter from 'express-rate-limit'
import { Router } from 'express'
import {cookieChecker} from '../controllers/cookieChecker.js'
import {complainStorage, complimentStorage, fetchComments} from '../database/db.js'
import { client } from '../controllers/redisCache.js'



const commentLimiter= rateLimiter({
        windowMs:5*60*1000,
        max:5,
        message:'Too many comment requests received from this IP. Please wait for another 5 minutes before making another request'
})

const router=Router()
router.use(cookieParser())
router.use(express.json())

router.post('/complain', cookieChecker, async(req, res)=>{
        const{role, id}=req.user
        const date= moment().format('YYYYMMDD')
        const {complain, targetEmail}=req.body
        console.log(targetEmail)
        if(role!=='consumer') return res.status(403).json({error:'Create a consumer profile for you to be able to post a complain or a compliment'})
        
        const complainStore= await complainStorage(complain, date, id, targetEmail)
        console.log(complainStore)
        if(!complainStore.message) return res.status(500).json({error:complainStore})

        return res.status(201).json({message:complainStore.message})
})
router.post('/compliment', cookieChecker, async(req, res)=>{
        const {role, id}= req.user
        const {compliment, about}=req.body
        console.log(about)
        const date=moment().format('YYYYMMDD')

        if (role!=='consumer') return res.status(403).json({error:'Create a consumer profile for you to be able to post a complain or a compliment'})

        const storeCompliment= await complimentStorage(compliment, date, id, about)
        if(!storeCompliment.message) return res.status(500).json({error:storeCompliment})
        
        return res.status(200).json({message:storeCompliment.message})
})
router.post('/getcomments', cookieChecker, async(req, res)=>{
        const {role}= req.user
        const {email}=req.body
        if(role!=='consumer' && role!=='seller') return res.status(403).json({error:'Please use a verified cookie to access the comments'})
        
try {

    const [compliment, complain] = await Promise.all([client.get(`${email}_compliment`), client.get(`${email}_complain`)]);
    const duration = 1000 * 60 * 60 * 12;

    if (compliment || complain) {
        console.log('Cache hit');
        return res.status(200).json({
            message:'Using cached data',
            compliment: compliment ? JSON.parse(compliment) : [],
            complain: complain ? JSON.parse(complain) : []
        });
    }


    const comment = await fetchComments(email);
    try {
        await Promise.all([
            comment.compliments && client.setEx(
                `${email}_compliment`, 
                duration, 
                JSON.stringify(comment.compliments)
            ),
            comment.complains && client.setEx(
                `${email}_complain`, 
                duration, 
                JSON.stringify(comment.complains)
            )
        ]);
        return res.status(200).json(comment);
    } catch (cacheError) {
        console.error('Cache set error:', cacheError);
    }
} catch (error) {
    console.error('Error in comment handler:', error);
    return res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
    });
}
})

export default router