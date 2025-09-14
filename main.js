import express from 'express'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import signup from './router/signup.js'
import login from './router/login.js'
import uploads from './router/fileupload.js'
// import views from './router/viewuploads.js'
import comments from './CommentsRoute/comment.js'
import searchuser from './router/searchUser.js'
import uploadLogo from './router/uploadBnsLogo.js'
import notification from './router/notifyTheSellerWhenABuyerOrdersTheirProduct.js'
import rating from './CommentsRoute/rating.js'
import getUser from './router/getUser.js'
import patch from './router/patch.js'
import deleteProfile from './router/deleteUser.js'
import viewMyProd from './router/viewMyProd.js'
import viewBySubcategory from './router/getProdBySubCategory.js'
import {config} from './controllers/config.js'
import {cookieChecker} from './controllers/cookieChecker.js'

//console.log(config.db)

const app = express();
app.use(cookieParser())
app.use(express.json())
// app.use(cors({
//     origin:"https://e9f9b2700a57.ngrok-free.app",
//     credentials: true
// }))

const PORT = config.port;
const limiter=rateLimit({
    windowMs:60*1000,
    max:5,
    message:'Too many requests received from this IP, please try again later'
})

// app.use('/auth', limiter)
// app.use('/send', limiter)
app.use('/auth', signup);
app.use('/request', login)
app.use('/comment', comments)
app.use('/searchuser', searchuser)
app.use('/save', uploadLogo)
app.use('/get', getUser)
app.use('/update', patch)
app.use('/delete', deleteProfile)
app.use('/view', viewMyProd)
app.use('/viewProductsBy', viewBySubcategory)
app.use('/send', cookieChecker, notification)
app.use('/upload', cookieChecker, uploads)
// app.use('/view', cookieChecker, views)
app.use('/review', cookieChecker, rating)

app.get('/', (req, res)=>{
    console.log({
        port:config.port,
        db:config.db.host
    })
    res.send({
        port:config.port,
        db:config.db.host
    })
})
app.get('/cookie', cookieChecker, (req, res)=>{
        const {username, email, id}=req.user
        return res.status(200).send( id)
})

app.listen(PORT, ()=>{
    console.log(`Ah! who put you on the planet? eugh!! ${config.port} `);
})