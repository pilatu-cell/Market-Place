import redis from 'redis'
import {config} from './config.js'

export const client=redis.createClient({
    // url:config.redis_url
    url: `redis://default:${config.redis.password}@${config.redis.host}:${config.redis.port}`
})

client.on('error', (err)=>{
        console.error(`An error ${err} occured`)
})
let connected = false

clientConnect()
async function clientConnect(){
    try {
        await client.connect()
        connected=true
        return console.log('Redis connected')
    } catch (error) {
        console.log(`An error ${error} occured`)
    }
}
