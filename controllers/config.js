import dotenv from 'dotenv';
dotenv.config({path:`.env.${process.env.NODE_ENV}`});

export const config={
    port:process.env.PORT,
    secret_key:process.env.SECRET_KEY || 'my_nigga_you_aint_getting_none_of_this_shit',
    redis_url: process.env.REDIS_URL,
    redis:{
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    db:{
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASS,
        database: process.env.SQL_DB

    },
    email:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    },
    Twilio:{
        acc_ssid: process.env.ACCOUNT_SSID,
        auth_token: process.env.ACCOUNT_AUTHTOKEN
    },
    S3:{
        endpoint: process.env.S3ENDPOINT,
        accesskeyid: process.env.S3ACCESSKEYID,
        secretaccesskey: process.env.S3SECRETACCESSKEY,
        r2bucket: process.env.R2BUCKET,
        bucket: process.env.MYBUCKET
    }
}
