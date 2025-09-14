import mailer from 'nodemailer'
import {config} from './config.js'

//console.log(config.email.user, config.email.pass )

const transpoter= mailer.createTransport({
    service:'gmail',
    auth:{
        user:config.email.user,
        pass: config.email.pass 
    },
    secure: true
})

export async function mailSender(email, verificationCode) {
        const mailOption={
            from: config.email.user,
            to: email,
            subject: 'Verify Email',
            html:`<p>Your verification code is <strong style="color:green">${verificationCode}</strong> which is valid for the next 5 minutes</p>`
        }

         const transpoted=await transpoter.sendMail(mailOption)
         if(transpoted) return {message:'Code has been sent to your email. The code is valid for the next 5 minutes'}
}