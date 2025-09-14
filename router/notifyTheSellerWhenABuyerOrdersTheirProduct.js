
//import the required modules
import express from "express"
import cookieParser from "cookie-parser";
import { Router } from "express";
import {config} from '../controllers/config.js'
import {cookieChecker} from '../controllers/cookieChecker.js'

const router= Router()
router.use(cookieParser())
router.use(express.json())

// create  a whatsapp send message function
export async function sendNotification(SellerPhoneNumber, consumerPhoneNumber,  consumerUsername){
    const serviceProvider='Whatsapp: +14155238886',
    target=`Whatsapp:${SellerPhoneNumber}`,
    ssid=config.Twilio.acc_ssid,
    token=config.Twilio.auth_token,
    message=`Hi there, consumer ${consumerUsername} made a contact request on your product. Please reach out to them on this phone number (${consumerPhoneNumber})`,
    url=`https://api.twilio.com/2010-04-01/Accounts/${ssid}/Messages.json`

    
    const formData = new URLSearchParams();
    formData.append('From', serviceProvider);
    formData.append('To', target);
    formData.append('Body', message);


    try {
        const response = await fetch(url, {
            method: 'POST',
            headers:{   
                'Authorization': 'Basic ' + btoa(`${ssid}:${token}`),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body:formData.toString()
        })

        const data = await response.json()
        if(!response.ok){
            console.log(response.status)
            return {error: data}
        }

        return {message:'A notification has been sent to the seller on your interest on this product.'}

    } catch (error) {
        console.log(`An error occured: ${error}`)
        return{error:'Sorry a server error occurred. Please try again later'}
    }
}

   
//create a route to which the message wil be  sent on req
router.post('/notification', cookieChecker, async (req, res)=>{
    const {cellNo, username}= req.user,
    {phoneNumber}=req.body

    

    const sendMessage= await sendNotification(phoneNumber, cellNo,  username)
    console.log(sendMessage)

    if(!sendMessage.message) return res.status(400).json({error: sendMessage.error})

    return res.status(200).json({message: sendMessage.message})
})


export default router