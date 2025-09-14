import express from 'express'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import joi from 'joi'
import moment from 'moment'
import rateLimit from 'express-rate-limit'
import { Router } from 'express'
import {saveRatings} from '../database/db.js'
import {config} from '../controllers/config.js'
import {codeGenerator} from '../controllers/codeGenerator.js'
import {mailSender } from '../controllers/mailSender.js'
import {sendMessage} from '../controllers/sendWhatsappMessage.js'
import { adduser, checkIfUserExists, storeVerificationCode, checkVerification, deleteExistingCode } from '../database/db.js'



const router = Router()
const schema= joi.object({
    username: joi.string().min(3).required(),
    password: joi.string().min(8).required(),
    email: joi.string().email().required(),
    phoneNumber: joi.string().pattern(/^[+0-9]+$/).required(),
    role: joi.string().valid('consumer', 'seller').required(),
    // code: joi.string().max(6).required()
})
const codeLimiter=rateLimit({
    windowMs:5*60*1000,
    max:1,
    message:{error:'Please wait for 5 minutes before sending another request'}
})



//middleware
router.use(express.json())
router.use(cookieParser())


//Route(s)
//Sending verification code route..
router.post('/request-otp',codeLimiter, async (req,res)=>{
    const {email, role}=req.body
    const error='Invalid email. Please use a @students.kyu.ac.ke email.'
    if(role==='seller' && !email.includes('@students.kyu.ac.ke')) return res.status(400).json({error:'Invalid email. Please use a @students.kyu.ac.ke email.'})

        const verification= codeGenerator()
        await storeVerificationCode(email, verification)
        const sent=await mailSender(email, verification)
        console.log(sent)
        if (sent) res.send(sent)
})

//verifying the code
router.post('/verify-signup',  async (req,res)=>{
    // Function to generate a random ID
    function id(){
    const length=15
    const pool='abcdefghijklmnopqrstuvwxyz0123456789'
    let keyID=''

    for (let index = 0; index < length; index++) {
        const randomKeyId=Math.floor(Math.random()*pool.length)
            keyID += pool[randomKeyId]        
    }
    return `${keyID}`
}

    const {username, password, email, phoneNumber, role, location}=req.body

    const {error}=schema.validate({username, password, email, phoneNumber, role})
    console.log(error)
    if (error) return res.status(400).send({error: error.details[0].message})

     const date=moment().format('YYYYMMDD')
     const Userid=id()
     const status='new'


        try {
            // Check if user exists
            const userExists= await checkIfUserExists(email)
            if(userExists.error) return res.status(400).json({message:"This email already has a registered user"})

        //     //Check if the code matches
        //     const codeMatch=await checkVerification(email, code)
        //     if(!codeMatch.message) return res.status(400).json({error:codeMatch.error})


            if(role==='seller') {
                const rating=3
                const initialRating=await saveRatings(Userid, status, email, rating, date)
                console.log(initialRating)
            }            

            const newUser= await adduser(Userid, username, email, password, phoneNumber, date, role, location)
            if( newUser.error) return res.status(400).json({error:newUser.error})

            const stringifiedUser=JSON.stringify(newUser)
            if(newUser && newUser.message){
                    const token= jwt.sign({username:username, id:Userid, email: email, role: role, cellNo: phoneNumber}, config.secret_key, {expiresIn:'1h'})
                    res.cookie('cookie', token, {
                        httpOnly: true,
                        // secure: false,
                        maxAge:1000*60*60,
                        // path:'/',
                        // sameSite: 'lax',
                        // domain:'https://e9f9b2700a57.ngrok-free.app'
                    })
            }

            //Delete code from the db
            // await deleteExistingCode(email, code)
            await sendMessage(phoneNumber, username, Userid)

            
            const welcomeMessage=`Niaje ${username}, karibu kwa community. JIBAMBE!!!`
            return res.status(200).json({message: welcomeMessage})
        } catch (error) {
            console.log(error)
            return res.status(500).send({error:"Server error"})
        }
})
//End of Route1


export default router