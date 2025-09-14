
import express from "express"
import cookieParser from "cookie-parser"
import multer from "multer"
import joi from 'joi'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Router } from "express"
import { cookieChecker } from "../controllers/cookieChecker.js"
import {patchProfile} from "../database/db.js"
import { config } from "../controllers/config.js"


const schema=joi.object({
        //mimetype: joi.string().valid('image/jpeg','image/png','image/jpg').required(),
        imageName: joi.string().regex(/\.(jpeg|png|jpg)$/i).required()
})

const cellNoSchema=joi.object({
        cellNo: joi.string().pattern(/^\+?[+0-9]+$/).max(14).required(),
})

const storage=multer.diskStorage(
{    destination: (req, file, cb)=>{
        cb(null, './bnsLogo')
    },
    filename: (req, file, cb)=>{
        cb(null, `${Date.now()}__${file.originalname}`)
    }
}
)

const patchImage= multer({storage:storage})

const s3=new S3Client({
    region:"auto",
    endpoint: config.S3.endpoint,
    credentials:{
        accessKeyId:config.S3.accesskeyid,
        secretAccessKey: config.S3.secretaccesskey
    }
})

async function safeUnlink(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // ignore "file not found", rethrow other errors
  }
}


const router=Router()
router.use(express.json())
router.use(cookieParser())

router.patch('/patchUser', cookieChecker, async (req, res) => {
    const { patch, title } = req.body;
    const { id, email, role } = req.user;

    console.log(req.body, req.user)

    if (role !== 'seller') {
        return res.status(403).json({ error: 'Please use a seller profile' });
    }

    if (!['username', 'phoneNumber'].includes(title)) {
        return res.status(400).json({ error: 'Invalid field for update' });
    }

    if (title === 'phoneNumber') {
        const { error } = cellNoSchema.validate({ cellNo: patch });
        // console.log(error);
        
        if (error) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

            try {
        const update = await patchProfile(title, patch, email, id);
        console.log(update)
        if (update.error) {
            return res.status(404).json({ error: update.error });
        }
        return res.status(200).json({ message: update.message });
    } catch (err) {
        return res.status(500).json({ error: 'Sorry a server error occurred' });
    }
    }

    try {
        const update = await patchProfile(title, patch, email, id);
        console.log(update)
        if (update.error) {
            return res.status(404).json({ error: update.error });
        }
        return res.status(200).json({ message: update.message });
    } catch (err) {
        return res.status(500).json({ error: 'Sorry a server error occurred' });
    }
});


router.patch('/patchEnterprise', cookieChecker, patchImage.single('logo'), async (req, res) => {
    const { title, prevUrl } = req.body;
    const { id, email, role } = req.user;
    const file = req.file;

    if (role !== 'seller') return res.status(400).json({ error: 'Please use a seller profile' });
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const originalName = file.originalname;
    const localPath = file.path;
    const mimeType = file.mimetype;

    const { error } = schema.validate({ imageName: originalName });
    if (error) {
        await safeUnlink(localPath);
        return res.status(400).json({ message: 'Please upload a jpeg, jpg or png file' });
    }

    const filename = path.basename(file.path);
    const r2Key = `uploads/images/${uuidv4()}__${filename}`;
    const r2PublicUrl = `${config.S3.r2bucket}${r2Key}`;

    try {
        if (prevUrl) {
            const previousKey = prevUrl.replace(config.S3.r2bucket, '');
            const deleteCommand = new DeleteObjectCommand({
                Bucket: config.S3.bucket,
                Key: previousKey
            });
            await s3.send(deleteCommand);
        }

        const fileBuffer = await fs.promises.readFile(localPath);

        const command = new PutObjectCommand({
            Bucket: config.S3.bucket,
            Key: r2Key,
            Body: fileBuffer,
            ContentType: mimeType
        });

        await s3.send(command);

        const insert = await patchProfile(title, r2PublicUrl, email, id);

        await safeUnlink(localPath);

        if (insert.message) {
            return res.status(201).json({ message: 'File has been uploaded successfully' });
        }

        return res.status(400).json({ error: insert.error });
    } catch (err) {
        await safeUnlink(file.path); // still try cleanup
        console.error(err);
        return res.status(500).send("server error");
    }
});

export default router;