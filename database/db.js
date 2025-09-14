// import 'dotenv/config'
// import mysql from 'mysql2'
// import {config} from '../controllers/config.js'
import bcrypt from 'bcrypt'
// import { resolve } from 'path'


//Check Connection
// const connection= mysql.createConnection({
//     host: config.db.host,
//     user: config.db.user,
//     password: config.db.password,
//     database: config.db.database
// })
// connection.connect(err=>{
//     if(err) console.error('unable to connect to the db')
//     console.log('connected to the database')
// })


// //Create Pool
// const db=mysql.createPool({
//     host: config.db.host,
//     user: config.db.user,
//     password: config.db.password,
//     database: config.db.database
// }).promise()

const url= 'http://127.0.0.1:8787'

//Insert a New user in to the DB
export async function adduser(id, username, email, password, phone_no, date, role, location){
    const status='Active'
    const salt= await bcrypt.genSalt(10)
    const hashedPassword= bcrypt.hashSync(password, salt)

    const data={
        hashedPassword,
        id,
        email,
        username,
        phone_no,
        date,
        role,
        status, 
        location
    }

    try {
        const response = await fetch(`${url}/api/createuser`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const result= await response.json()
        console.log(result)
        if(result.error || result.err) {
                console.log(result.error)         
                return {
                    error: result.error || result.err
                }
        }

        const fetchrole=result.user.role, 
        fetchemail=result.user.email

        const checkUp= await checkUser(fetchrole, fetchemail, password)
        console.log(checkUp)
        if(checkUp.error || checkUp.err) return {error: checkUp.err || checkUp.error}
        console.log(checkUp)
        return{message: result.message, getUser: checkUp.getUser}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}   
    }
}



//VerifyUserCredentials
export async function checkUser(role, email, password) {
    const data={
        role,
        email,
    }

    try {
        const response = await fetch(`${url}/api/loginuser`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const result= await response.json()
        // console.log(result)
        if(result.error || result.err) {
            console.log(result.error)
            return {
                error: result.error || result.err
            }
        }
        // console.log(result)
        const userPassword= result.user.password
        const isMatch = await bcrypt.compare(password, userPassword)

        if(!isMatch) return{
            error:'Invalid username/password'
        }

        if(result.user.status === 'Banned') return{error:`There are a lot of complains on the profile ${result.user.email} which resulted in a ban, please reach out to the help desk for further instructions.`}
        
        const verifiedUser = {
                username: result.user.username,
                id: result.user.id,
                email:result.user.email,
                role: result.user.role,
                phone_number: result.user.phone_number
        }
        console.log(result.message)

        return{
           getUser: verifiedUser,
           message: result.message
    }
    } catch (error) {
        console.log(error)
        return {error:'Server error'}   
    }
}


//Check if the user exists while signing up function
export async function checkIfUserExists(email){
    const data= {
        email
    }

    try {
        const response=await fetch(`${url}/api/checkifuserexists`, {
        method: 'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify(data)
        })
        
        const results = await response.json()

        if(!results.message) return {error: results.error || results.err}

        return {message: results.message}

    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}

//Store the generated code
export async function storeVerificationCode(email, verificationCode) {
        const expiresAt= new Date(Date.now()+600000)
        const data={
            email,
            verificationCode,
            expiresAt
        }
        try {
            const response=await fetch(`${url}/api/storecode`, {
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify(data)
            })

            const result= await response.json()

            console.log(result)
            if (!result.message) return {error:result.error || result.err}
            return {message:result.message}
        } catch (error) {
            console.log(error)
            return {error:'Server error'}
        }
}


//Checking the verification if it is a match
export async function checkVerification(email, verificationCode){
        const data= {
            email,
            verificationCode
        }

        try {
            const response = await fetch(`${url}/api/checkcode`, {
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify(data)
            })

            const results = await response.json()

            console.log(results)

            if(!results.message) return {error:results.error||results.err}
            return {message:results.message}
        
        } catch (error) {
                console.log(error)
                return {error:'Server error'}
        }
}

export async function deleteExistingCode(email, verificationCode) {
        const data= {
            email,
            verificationCode
        }

        try {
            const response= await fetch(`${url}/api/deletecode`, {
                method:'DELETE',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify(data)
            })

            const results = await response.json()

            if(results.error || results.err) return {error: results.error || results.err}
            return {message:'Verification success. Proceed to registration'}

        } catch (error) {
            console.log(error)
            return {error:'Server error'}
        }
}


//Delete the user from the DB as per the request from the user
export async function deleteUser(password, email, role, id) {
        const verify= await checkUser(role, email, password)
        if(verify.error) return {
            error: verify.error
        } 

        const data = {
            email,
            role,
            id
        }

        try {
            const response = await fetch(`${url}/api/deleteuser`, {
                method:'DELETE',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify(data)
            })

            const results = await response.json()

            if(results.error || results.err) return{error: results.error || results.err}

            return{message: results.message}
            
        } catch (error) {
            console.log(error)
            return {error:'Server error'}
        }

}



//Creating and Storing Media
export async function insertImage(filePath,category, email, id, sub_category, price, description, name) {
    // const status='Active'
    const data={
        filePath, category, email, id, sub_category, price, description, name
    }

    try {
        const response = await fetch(`${url}/api/storeimage`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {error: results.error|| results.err}

        return {message:results.message}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}

//STORING VIDEO MEDIA
export async function insertVideo(filePath,category, email, id, location) {
    const data={
        filePath, category, email, id, location
    }

    try {
        const response = await fetch(`${url}/api/storevideo`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {error: results.error|| results.err}

        return {message:results.message}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}

//STORING ENTERPRISE LOGO MEDIA
export async function insertBnsLogo(email, id, filePath){
    const data={
        filePath, email, id
    }

    try {
        const response = await fetch(`${url}/api/storelogo`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {error: results.error|| results.err}

        return {message:results.message}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}

//Seller view media
export async function viewMyMedia(email, id) {
    const data={
        email, id
    }

    try {
        const response = await fetch(`${url}/api/viewmymedia`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {error: results.error|| results.err}

        return {
            images: results.images,
            videos: results.videos,
            message:results.message}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}

//Consumer view media
export async function viewMedia(){
    const active="Active"
    const Undefined="undefined"
    const [images]=await db.query('SELECT category, filepath, user_id, user_email, sub_category FROM images WHERE status=? AND sub_category!=?', [active, Undefined])
    const[videos]=await db.query('SELECT category, filepath, user_id, user_email, sub_category FROM videos WHERE status=? AND sub_category !=?', [active, Undefined])
    if(images.length==0 && videos.length==0) return {err:'No uploads have been made by the sellers'}
    return {
        images, videos
    }
}

//Consumer view media by subcategory
export async function viewProductsBySubcategory(category, subCategory) {
    const active='Active'
    const data={
        category, subCategory, active
    }

    try {
        const response = await fetch(`${url}/api/viewproductsbysubcategory`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {error: results.error|| results.err}

        return {
            prods: {
                images: results.images, 
                videos: results.videos
            },
            message:results.message
        }
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}


//COMMENTS STORAGE (Complains and Compliments)
export async function complainStorage(complain, timestamp, userid, email) {
    const data={
        complain,
        userid,
        timestamp,
        email
    }
    console.log(data)

    try {
        const response = await fetch(`${url}/api/storecomplain`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {error: results.error|| results.err}

        return {message:results.message}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}

export async function complimentStorage(compliment, timestamp, id, email){
    const data={
        compliment,
        id,
        timestamp,
        email
    }
    console.log(data)
    try {
        const response = await fetch(`${url}/api/storecompliment`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {error: results.error|| results.err}

        return {message:results.message}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}

//COMMENTS FETCHING
export async function fetchComments(email) {
    const data={
        email
    }

       try {
        const response = await fetch(`${url}/api/fetchcomment`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {
            error: results.error|| results.err
        }
        // console.log(results.result.complains, results.result.compliments)
        return {message:results.message, comments: results.result}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}

//INSERT RATINGS
export async function saveRatings(userId, status, email, rate, date){
    let rating=rate
    const data={
        userId,
        email,
        rating,
        date,
        status
    }
    
    const mergeRating=await getRatings(email)
    if(mergeRating.rate.length===0 && status==='new'){
        try {
            const response= await fetch(`${url}/api/storeratings`, {
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify(data)
            })

            const results= await response.json()

            if(!results.message) return {error: results.error || results.err}

            return {message: results.message}
        } catch (error) {
                console.log(error)
                return {error:'Server error'}   
        }
    }

    data.rating= (mergeRating.rate[0].rating + rate)/2

        try {
            const response = await fetch(`${url}/api/storeratings`, {
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify(data)
            })

            const results=await response.json()
            console.log(results)
            if(!results.message) return {error: results.error || results.err}

            return {message: results.message}
        } catch (error) {
                console.log(error)
                return {error:'Server error'}   
        }

}

//GET RATINGS
export async function getRatings(email) {
    const data={
        email
    }
    
    try {
        const response= await fetch(`${url}/api/retrieveratings`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results= await response.json()

        if(!results.message) return {error:response.err || response.error}
        return {
            rate: results.rating,
            message: results.message
        }
    } catch (error) {
        console.log(error)
        return {error:'Server error'}   
    }
}

//ISSUE BAN
export async function issueBan(email) {
    const data={
        email
    }
    
    try {
        const response= await fetch(`${url}/api/issueban`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results= await response.json()

        if(!results.message) return {error:response.err || response.error}
        return {
            rate: results.rating,
            message: results.message
        }
    } catch (error) {
        console.log(error)
        return {error:'Server error'}   
    }
}

//CHANGE USERNAME
// export async function changeUsername(email, role, newUsername) {
//     if(role==='seller'){
//         const [adjust]=await db.query('UPDATE sellers SET username=? WHERE email=?', [newUsername, email])
//         if(adjust.affectedRows===0) return {error:'An error occured while saving your new username. Please try again later'}
//         return {message:'Username has been changed successfully'}
//     }
//     const [adjust] = await db.query('UPDATE consumers SET username=? WHERE email=?', [newUsername, email])
//     if(adjust.affectedRows===0) return {error:'An error occured while saving your new username. Please try again later'}
//     return {message:'Username has been changed successfully'}
// }

//SEARCH QUERY
export async function searchSeller(search) {
  if (!search || search.trim() === '') {
    return { error: 'Search input is empty' };
  }

  const trimmedSearch = search.trim();

  const data={
    trimmedSearch,
  }

     try {
        const response = await fetch(`${url}/api/searchseller`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {error: results.error|| results.err}


        const user= results.seller
        // console.log(user)

        return {message:results.message, user}
    } catch (err) {
        console.log(err)
        return {err:'Server error'}
    }
}


export async function getUser(email, userId) {
    const data={
        email,
        userId
    }

       try {
        const response = await fetch(`${url}/api/getuser`, {
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        console.log(results)
        if(results.error || results.err) return {error: results.error|| results.err}

        return {message:results.message, user: results.user}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }
}

export async function patchProfile(title, patch, email, userid) {
    const trimTitle = title.trim().toLowerCase();
    const data={
        email,
        userid,
        trimTitle,
        patch
    }

       try {
        const response = await fetch(`${url}/api/patchprofile`, {
            method:'PATCH',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        })

        const results = await response.json()
        if(results.error || results.err) return {error: results.error|| results.err}

        return {message:results.message}
    } catch (error) {
        console.log(error)
        return {error:'Server error'}
    }

}