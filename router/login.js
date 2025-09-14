import express from 'express'
// import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { banSellersWithMoreThan15Complains} from '../adminRouter/ban.js'
import { Router } from 'express'
import {config} from '../controllers/config.js'
import { checkUser } from '../database/db.js'

const router= Router()

router.use(express.json())
router.use(cookieParser())

router.post('/login', async (req, res)=>{
    const { role, email, password}=req.body

    if(!email|| !password) return res.status(400).send({error: 'Username and password are required'})

try {
    const user = await checkUser(role, email, password);

    if (user.error) {
        return res.status(401).json({ error: user.error });
    }

    const checkBan= await banSellersWithMoreThan15Complains(email)
    if(checkBan.error) return res.status(403).json({error:checkBan.error})
    if(checkBan.err) return res.status(500).json({err: checkBan.err})

    const token = jwt.sign(
        {
            id: user.getUser.id,
            username: user.getUser.username,
            email: user.getUser.email,
            role: user.getUser.role,
            cellNo: user.getUser.phone_number
        },
        config.secret_key,
        { expiresIn: '24h' }
    );

    res.cookie('cookie', token, {
        httpOnly: true,
        // secure: true,
        maxAge: 86400000, // 1 day
        // path: '/',
        sameSite: 'none',
        // domain: 'https://e9f9b2700a57.ngrok-free.app' // leave commented for now unless on same domain
    });

    const welcomeMessage = `Minister of Enjoyment. Welcome back ${user.getUser.username}`;
    return res.status(200).json({ message: welcomeMessage });

} catch (error) {
    console.error(`Server error: ${error}`);
    return res.status(500).send({ error: 'Internal server error' });
}

})

export default router