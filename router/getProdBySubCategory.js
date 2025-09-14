
import express from "express"
import { Router } from "express"
import {client} from '../controllers/redisCache.js'
import {viewProductsBySubcategory} from '../database/db.js'

const router= Router()
router.use(express.json())

router.post('/subcategory', async (req, res)=>{
    const {category, subcategory}=req.body
    const duration=7200

    if( !category || !subcategory) return res.status(400).json({error:'Sorry a bad request occured. Cannot view the products at the time. Please try again later'})

    try {
        const cachedProducts = await client.get(`${category}__${subcategory}`)
        if(cachedProducts){
            const Products= JSON.parse(cachedProducts)
            return res.status(200).json(Products)
        }

        const products= await viewProductsBySubcategory(category, subcategory)

        if(!products.message) return res.status(404).json({error:products.error})
        
        await client.setEx(`${category}__${subcategory}`, duration, JSON.stringify(products.prods))
        return res.status(200).json(products)
    } catch (error) {
        console.error(error)
        return res.status(500).json({error:'Sorry the server is down. Please try again later'})
    }
})

export default router;