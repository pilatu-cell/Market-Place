import express from 'express'
import redis from 'redis'
import cookieParser from 'cookie-parser'
import { Router } from 'express'
import {client} from '../controllers/redisCache.js'
//import {config} from '../controllers/config.js'
import {cookieChecker} from '../controllers/cookieChecker.js'
import { viewMedia,viewMyMedia } from '../database/db.js'

const router= Router()
router.use(cookieParser())
router.use(express.json())

router.get('/uploads', cookieChecker, async(req, res)=>{
    const duration= 24*60*60*1000
    const {role, id}=req.user
if(role==='consumer'){
                try {
            let view=await client.get('consumerViews')
            if(view) {
                console.log('cache hit')
                return res.status(200).send(JSON.parse(view))
            }
            console.log('cache miss')
                view= await viewMedia()
                console.log(view.err)
                if(view.err) return res.status(404).json(view)
                await client.setEx('consumerViews', duration, JSON.stringify(view))
                console.log('Data cached')
                return res.status(200).json(view)
        } catch (error) {
            console.log(`An error ${error} occured`)
            return res.status(500).json({message:'Oops the server is out'})
        }
}
if(role==='seller'){
    try {
            let view=await client.get(`${id}_views`)
            const parsedViews= JSON.parse(view)
            if(view) {
                console.log('cache hit')
                return res.status(200).json(parsedViews)
            }
            console.log('cache miss')
                view= await viewMyMedia(id)
                console.log(view.err)
                if(view.err) return res.status(404).json(view)
                await client.setEx(`${id}_views`, duration, JSON.stringify(view))
                console.log('Data cached')
                return res.status(200).json(view)
    } catch (error) {
        console.log(error)
        return res.status(500).json('A Server Error Occured')
    }
}

else{
    return res.status(400).json('Please register or login to view the products')
}
})

export default router