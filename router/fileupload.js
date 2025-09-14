import express from 'express'
import cookieParser from 'cookie-parser'
import fs from 'fs'
import multer from 'multer'
import joi from 'joi'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Router } from 'express'
import { insertImage, insertVideo } from '../database/db.js'
import { config } from '../controllers/config.js'
import {cookieChecker} from '../controllers/cookieChecker.js'

const router=Router()
router.use(cookieParser())
router.use(express.json())

//Joi Schema
const ImageSchema=joi.object({
        //mimetype: joi.string().valid('image/jpeg','image/png','image/jpg').required(),
        originalname: joi.string().regex(/\.(jpeg|png|jpg)$/i).required()
})
const videoSchema=joi.object({
        originalname: joi.string().regex(/\.(mp4|mpeg|avi)$/i).required()
})

//Storage for both Images and Videos
const imageStorage=multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null, './images')
    }
})
const videoStorage=multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null, './videos')
    }
})
const uploadImage=multer({storage: imageStorage})
const uploadVideo=multer({storage: videoStorage})

const s3=new S3Client({
    region:"auto",
    endpoint: config.S3.endpoint,
    credentials:{
        accessKeyId:config.S3.accesskeyid,
        secretAccessKey: config.S3.secretaccesskey
    }
})

//ROUTES
//post image route
router.post('/image', cookieChecker, uploadImage.single('image'), async (req, res)=>{
    const {id, email, role}=req.user
    const {category, subCategory, price, description, name}=req.body
    const file=req.file
    const originalName=file.originalname
    const localPath=file.path
    const mimeType=file.mimetype
    //console.log(filepath,file)
    const err='Create a Sellers profile for you to be able to access this feature'
    let message='Please upload a jpeg, jpg or png file'

    if(!file) return res.status(400).json({error:'No file uploaded'})
    const{error}=ImageSchema.validate({originalname:originalName})
    if(error) {
        try {
                await fs.promises.unlink(localPath) 
                return res.status(400).json({message:'Please upload a jpeg, jpg or png file'})
        } catch (error) {
               console.error('Failed to delete file:', err);
                return res.status(500).json({error:'Failed to delete file'})
        }
    }

    if(role!='seller') return res.status(400).json({error:err})
    console.log(localPath, description, name)
    
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

        const insert=await insertImage(r2PublicUrl, category, email, id, subCategory, price, description, name)            
        if (insert.message) {
          try {
                await fs.promises.unlink(localPath) 
                return res.status(201).json({message:'File has been uploaded successfully'})
        } catch (error) {
               console.error('Failed to delete file:', error);
                return res.status(500).json({error:'Failed to delete file'})
        }
        }

        return res.status(400).json({message:"An error occured"})
        } catch (error) {
           await fs.promises.unlink(localPath)
            console.log(error)
            return res.status(500).json({error:"server error"})
        }
})

//post video route
router.post('/video', uploadVideo.single('video'), cookieChecker, async (req, res)=>{
    const {category, location}=req.body
    const {id, email, role}=req.user
    const file=req.file
    const originalName=file.originalname
    const localPath=file.path
    const mimeType=file.mimetype
    //console.log(fileName)
    const err='Create a Sellers profile for you to be able to access this feature'
    let message='Please upload an mp4, mpeg or avi file'
    const{error}=videoSchema.validate({originalname: originalName})

    if(error){
        await fs.promises.unlink(localPath)
        return res.status(400).json({message:message})
    }

    const filename = path.basename(file.path)
    const r2Key=`uploads/images/${uuidv4()}__${filename}`
    const r2PublicUrl=`${config.S3.r2bucket}${r2Key}`

    console.log(r2PublicUrl)

    if(role!='seller') return res.status(400).json({error: err})
        try {
            const fileBuffer=await fs.promises.readFile(localPath)

            const command=new PutObjectCommand({
                Bucket:config.S3.bucket,
                Key: r2Key,
                Body: fileBuffer,
                ContentType: mimeType
            })
            await s3.send(command)
            console.log(r2PublicUrl)
            const insert=await insertVideo(r2PublicUrl, category, email, id, location)

        if (insert.message) {
           await fs.promises.unlink(localPath)
            return res.status(201).json({message:'File uploaded successfully'})
        }
        return {message:"An error occured"}
        } catch (error) {
           await await fs.promises.unlink(localPath)
            console.log(error)
            return res.status(500).json({error:'Server error'})
        }
})


export default router