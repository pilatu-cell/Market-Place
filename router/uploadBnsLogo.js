
import express from "express"
import cookieParser from "cookie-parser"
import multer from "multer"
import Joi from "joi"
import fs  from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Router } from "express"
import {insertBnsLogo} from '../database/db.js'
import {cookieChecker} from '../controllers/cookieChecker.js'
import {config} from '../controllers/config.js'


//REMEMBER TO ADD AN API TO UPLOAD THE IMAGES!!!!!!!!!!!!
const router= Router()
router.use(cookieParser())
router.use(express.json())

const storage=multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null, './bnsLogo')
    },
    filename: (req, file, cb)=>{
        cb(null, `${Date.now()}__${file.originalname}`)
    }
})
const uploadLogo=multer({storage:storage})

const schema=Joi.object({
    imageName:Joi.string().regex(/\.(jpeg|png|jpg)$/i).required()
})

const s3=new S3Client({
    region:"auto",
    endpoint: config.S3.endpoint,
    credentials:{
        accessKeyId:config.S3.accesskeyid,
        secretAccessKey: config.S3.secretaccesskey
    }
})

router.post('/logo', uploadLogo.single('logo'), cookieChecker, async (req, res) => {
    const { role, email, id } = req.user;
    console.log(req.user)
    if (role !== 'seller') {
        return res.status(403).json({ error: 'Sorry, the action requires a sellers account profile.' });
    }

    const file=req.file
    const originalName=file.originalname
    const localPath=file.path
    const mimeType=file.mimetype


    if(!file) return res.status(400).json({error:'No file uploaded'})
    const{error}=schema.validate({imageName:originalName})
    if(error) {
        try {
                await fs.promises.unlink(localPath) 
                return res.status(400).json({message:'Please upload a jpeg, jpg or png file'})
        } catch (error) {
               console.error('Failed to delete file:', err);
                return {error:'Failed to delete file'}
        }
    }

    if(role!='seller') return res.status(400).json({error:err})
    console.log(localPath)
    
    const filename = path.basename(file.path)
    const r2Key=`uploads/images/${uuidv4()}__${filename}`
    const r2PublicUrl=`${config.S3.r2bucket}${r2Key}`
        try {
            const fileBuffer=await fs.promises.readFile(localPath)

            const command=new PutObjectCommand({
                Bucket:config.S3.bucket,
                Key: r2Key,
                Body: fileBuffer,
                ContentType: mimeType
            })

            await s3.send(command)

            const insert=await insertBnsLogo(email, id, r2PublicUrl)           
        if (insert.message) {
            try {
                await fs.promises.unlink(localPath) 
            return res.status(200).json({message:'File has been uploaded successfully'})
            } catch (error) {
                console.error('Failed to delete file:', err);
                    return {error:'Failed to delete file'}
            }
        }

        return res.status(400).json({error:insert.error})
        } catch (error) {
           await fs.promises.unlink(localPath)
            console.log(error)
            return res.status(500).send("server error")
        }
});

export default router