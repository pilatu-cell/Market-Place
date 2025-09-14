import 'dotenv/config'
import mysql from 'mysql2'
import {config} from '../controllers/config.js'
import bcrypt from 'bcrypt'
// import { resolve } from 'path'


//Check Connection
const connection= mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
})
connection.connect(err=>{
    if(err) console.error('unable to connect to the db')
    console.log('connected to the database')
})


//Create Pool
const db=mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
}).promise()


//Insert a New user in to the DB
export async function adduser(id, username, email, password, phone_no, date, role){
    const status='Active'
    const salt= await bcrypt.genSalt(10)
    const hashedPassword= bcrypt.hashSync(password, salt)

    //creating seller's profile
    if(role==='seller'){        
            try {
        const [row]=await db.query('INSERT INTO sellers (id, username, email, password, phone_number, Date, role, status) VALUES(?,?,?,?,?,?,?,?)', [id, username, email, hashedPassword, phone_no, date, role, status])
        if (row.affectedRows===0) {
            return {error: "Failed to create the user. Login to the page" }
    }
            console.log(`User inserted row number: ${row.insertId}`)
        // await new Promise(resolve=>setTimeout(resolve, 5000))

            const newUser=await checkUser(role, email, password)
            console.log(newUser)
            return {message: newUser.message}
    } catch (error) {
        console.log(error)
        return {error:'Sorry a server error occured'}
    }
    }

    ///creating consumer's profile
        try {
        const [row]=await db.query('INSERT INTO consumers(id, username, email, password, phone_number, Date, role, status) VALUES(?,?,?,?,?,?,?,?)', [id, username, email, hashedPassword, phone_no, date, role, status])
        if (row.affectedRows===0) {
                return {error: "Failed to create the user. Login to the page" }
    }
            console.log(`User inserted row number: ${row.insertId}`)
        // await new Promise(resolve=>setTimeout(resolve, 5000))

            const newUser=await checkUser(role, email, password)
            return {message: newUser.message}
    } catch (error) {
        console.log(error)
        return {error:'Sorry a server error occured'}
    }
}



//VerifyUserCredentials
export async function checkUser(role, email, password) {
    if(role==='seller'){
        let message='Welcome'
        const [rows]= await db.query('SELECT *FROM sellers WHERE email=?', [email])
        if (rows.length === 0) return {error:'An error occured'}
        const user= rows[0]
        const isMatch = await bcrypt.compare(password, user.password)
      const getUser={
            username:user.username,
            id: user.id,
            email:user.email,
            role: user.role,
            phone_number: user.phone_number
        }
        if (isMatch) return {
            message,
            getUser
        }
    }
        


        let message='Welcome'
        const [rows]= await db.query('SELECT *FROM consumers WHERE email=?', [email])
        if (rows.length === 0) return {error:'An error occured'}
        const user= rows[0]
        const isMatch = await bcrypt.compare(password, user.password)
        const getUser={
            username:user.username,
            id: user.id,
            email:user.email,
            role: user.role,
            phone_number: user.phone_number
        }
        if (isMatch) return {
            message,
            getUser
        }
    }


//Check if the user exists while signing up function
export async function checkIfUserExists(email){
    const [row]=await db.query('SELECT *FROM consumers WHERE email=?', [email])
    const [row1]= await db.query("SELECT *FROM sellers WHERE email=?", [email])
    const error= "User email already exists"
    if (row.length>0 || row1.length>0)    return error
    return {message:"okay"}

}

//Store the generated code
export async function storeVerificationCode(email, verificationCode) {
        const expiresAt= new Date(Date.now()+300000)
        try {
                const store= await db.query("INSERT INTO verificationCodeStore(email, verificationcode, expiresin) values(?,?,?)", [email, verificationCode, expiresAt])
                if(store.length>0) return {message: "success"}
                return {error:"An error occured"}
        } catch (error) {
            console.log(error)
            return {err:`An error ${JSON.parse(error[0])} occured`}
        }
}


//Checking the verification if it is a match
export async function checkVerification(email, verificationCode){
        try {
            const [checkCode]= await db.query('SELECT *FROM verificationCodeStore WHERE email=? AND verificationcode=? AND expiresin > NOW()', [email, verificationCode])
            if (checkCode.length===0) return{error:"The code you provided does not exist or has expired. Please recheck your entry."}
            return {message:'success'}
        } catch (error) {
            console.log(error)
            return {error:`An error ${JSON.parse(error[0])} has occured during the operation`}
        }
}

export async function deleteExistingCode(email, verificationCode) {
    const [row]= await db.query('DELETE FROM verificationCodeStore WHERE email=? AND verificationcode=?', [email, verificationCode])
    if(row.length===0) return {error:"Sorry could not find the otp"}
        
    return {message:'Verification success. Proceed to registration'}
}


//Delete the user from the DB as per the request from the user
export async function deleteUser(email, role, id) {
    if (role === 'consumer') {
        const [row] = await db.query('DELETE FROM consumers WHERE email = ?', [email]);
        if (row.affectedRows === 0) {
            return {
                error: 'Sorry, could not perform the delete operation. Please try again later.'
            };
        }
        return {
            message: 'Your profile has been deleted successfully'
        };
    }

    
    const connection = await db.getConnection(); 

    try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM ratings WHERE email = ? AND user_id = ?', [email, id]);
        await connection.query('DELETE FROM complains WHERE email = ?', [email]);
        await connection.query('DELETE FROM compliments WHERE email = ?', [email]);
        await connection.query('DELETE FROM images WHERE email = ? AND user_id = ?', [email, id]);
        await connection.query('DELETE FROM bnslogo WHERE email = ? AND user_id = ?', [email, id]);
        await connection.query('DELETE FROM sellers WHERE email = ? AND id = ?', [email, id]);

        await connection.commit();
        connection.release();

        return {
            message: 'Your profile has been deleted successfully'
        };

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error(error);
        return {
            error: 'Sorry, could not perform the delete operation. Please try again later.'
        };
    }
}



//Creating and Storing Media
export async function insertImage(filePath,category, email, id, sub_category, price, description, name) {
    // const status='Active'
    const [row]=await db.query('INSERT INTO images(filepath, category, user_id, user_email, sub_category, price, description, name) VALUES(?,?,?,?,?,?, ?,?)', [filePath, category, email, id, sub_category, price, description, name])
    if(row.affectedRows===0) return {error:'An error occured while saving the image'}
    return {message:"Image inserted successsfully"}
}

export async function insertVideo(filePath,category, email, id, sub_category) {
    const status='Active'
    const [row]=await db.query('INSERT INTO videos(filepath, category, user_id, user_email, sub_category, status) VALUES(?,?,?,?,?,?)', [filePath, category, email, id, sub_category, status])
    if(row.affectedRows===0) return {error:'An error occured while saving the upload'}
    return {message:"Video file inserted successsfully"}
}

export async function insertBnsLogo(email, id, filePath){
    const [row]= await db.query('INSERT INTO bnslogo(email, user_id, image_url) VALUES(?,?,?)', [email, id, filePath])
    if(row.affectedRows===0) return {error:'An error occured while saving the image'}
    return{message:'Image saved successfully'}
}

//Seller view media
export async function viewMyMedia(email, id) {
    const [videos]=await db.query('SELECT category, filepath, price, name, description FROM videos WHERE user_id=? AND user_email=?', [id, email])
    const [images]=await db.query('SELECT category, filepath, price, name, description FROM images WHERE user_id=? AND user_email=?', [id, email])
    if(videos.length==0 && images.length==0) return{err:'No uploads found under your ID please Upload some!!!'}
    return {
        videos,
        images,
        message:'Uploads retrieved successfully'
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
export async function viewProductsBySubcategory(category, subcategory) {
    const active = "Active";
    let image, video;

    if (category !== 'services') {
        const [imageProducts] = await db.query(`
            SELECT 
                s.name AS username,
                s.id AS id,
                s.email AS email,
                s.phone_number,
                i.filepath,
                i.price,
                i.description,
                i.name
            FROM sellers s
            JOIN images i ON i.user_id = s.id AND i.user_email = s.email
            WHERE i.category = ? AND i.sub_category = ? AND s.status = ?
        `, [category, subcategory, active]);

        if (imageProducts.length === 0) {
            return {
                error: 'No seller has uploaded a product of this category yet. Please try another product'
            };
        }

        image = imageProducts;
        return {
            products: image,
            message: 'Products retrieved successfully'
        };
    }

    // SERVICES SECTION
    const [imageServices] = await db.query(`
        SELECT 
            s.name AS username,
            s.id AS id,
            s.email AS email,
            s.phone_number,
            i.filepath,
            i.price,
            i.description,
            i.name
        FROM sellers s
        JOIN images i ON i.user_id = s.id AND i.user_email = s.email
        WHERE i.category = ? AND i.sub_category = ? AND s.status = ?
    `, [category, subcategory, active]);

    const [videoServices] = await db.query(`
        SELECT 
            s.name AS username,
            s.id AS id,
            s.email AS email,
            s.phone_number,
            v.filepath,
            v.price,
            v.description,
            v.name
        FROM sellers s
        JOIN videos v ON v.user_id = s.id AND v.user_email = s.email
        WHERE v.category = ? AND v.sub_category = ? AND s.status = ?
    `, [category, subcategory, active]);

    if (imageServices.length === 0 && videoServices.length === 0) {
        return {
            error: 'No seller has uploaded a product of this category yet. Please try another product'
        };
    }

    image = imageServices || [];
    video = videoServices || [];

    return {
        services: {
            image,
            video
        }
    };
}


//COMMENTS STORAGE (Complains and Compliments)
export async function complainStorage(complain, timestamp, userid, email) {
    const [row]= await db.query('INSERT INTO complains(complain, commentor_id, created_at, critiqued_profile) VALUES(?,?,?,?)', [complain, userid, timestamp, email])
    if(row.affectedRows===0) return {err:'An error occured while saving your comment. Please try again later'}
    return {message:`Comment made at ${timestamp} by user profile ${userid} has been received. Feel free to air out your views.`}
}

export async function complimentStorage(compliment, timestamp, id, email){
        const [row]=await db.query('INSERT INTO compliments(compliment, commenter_id, created_at, critiqued_profile) VALUES(?,?,?,?)', [compliment, id, timestamp, email])
        if(row.affectedRows===0) return {err:'An error occured while saving your comment. Please try again later'}
        return {message:`Comment made at ${timestamp} by user profile ${id} has been received. Feel free to air out your views.`}
}

//COMMENTS FETCHING
export async function fetchComments(email) {
    const [compliment]=await db.query('SELECT compliment, commenter_id, created_at FROM compliments WHERE critiqued_profile=?', [email])
    const [complain]=await db.query('SELECT complain, commenter_id, created_at FROM complains WHERE critiqued_profile=?', [email])

    if(compliment.length==0 && complain.length==0) return {newMessage:'This user profile seems to have no complains or compliments posted about them.'}
    return {
        compliment,
        complain,
    }
}

//INSERT RATINGS
export async function saveRatings(userId, email, rating, date){
    const mergeRating=await getRatings(email)
    console.log(mergeRating)

    if(mergeRating.message){
            const [row]=await db.query('INSERT  INTO ratings (user_id, email, rating, created_at) VALUES(?,?,?,?)', [userId, email, rating, date])
            if (row.affectedRows===0) return {error:'An error occured while saving your rating, please try again later'}
            return{message:'Your rating has been received succesfully. Thank you for being a member of this community'}
    }

    const averageRating= (mergeRating.row.rating+rating)/2
    console.log(averageRating)

    const [row]=await db.query('INSERT  INTO ratings (user_id, email, rating, created_at) VALUES(?,?,?,?)', [userId, email, averageRating, date])
    if (row.affectedRows===0) return {error:'An error occured while saving your rating, please try again later'}
    return{message:'Your rating has been received succesfully. Thank you for being a member of this community'}
}

//GET RATINGS
export async function getRatings(email) {
        const [row]=await  db.query('SELECT rating FROM ratings WHERE email=?', [email])
        if(row.length===0)  return {message:'No ratings has yet been made on this profile'}
        return {
            row:row[0],
            status:'ok'
        }
}

//ISSUE BAN
export async function issueBan(email) {
    const [ban]= await db.query('UPDATE sellers SET status=Banned WHERE email=? ', [email])
    if (ban.affectedRows===0) return {error:'The user does not exist'}

    return  ban[0]
}

//CHANGE USERNAME
export async function changeUsername(email, role, newUsername) {
    if(role==='seller'){
        const [adjust]=await db.query('UPDATE sellers SET username=? WHERE email=?', [newUsername, email])
        if(adjust.affectedRows===0) return {error:'An error occured while saving your new username. Please try again later'}
        return {message:'Username has been changed successfully'}
    }
    const [adjust] = await db.query('UPDATE consumers SET username=? WHERE email=?', [newUsername, email])
    if(adjust.affectedRows===0) return {error:'An error occured while saving your new username. Please try again later'}
    return {message:'Username has been changed successfully'}
}

//SEARCH QUERY
export async function searchSeller(search) {
  if (!search || search.trim() === '') {
    return { error: 'Search input is empty' };
  }

  const trimmedSearch = search.trim();

  const [matchSellers] = await db.query(`
    SELECT
      s.username AS username,
      s.email AS email,
      s.id AS id,
      s.phone_number AS phone_number,
      b.image_url AS image_url,
      r.rating AS rating
    FROM
      sellers s
    JOIN bnslogo b ON s.email = b.email
    JOIN ratings r ON s.email = r.email
    WHERE
      s.status = 'Active' AND (
        s.username = ? OR
        s.email = ? OR
        s.id = ?
      )
    ORDER BY 
      r.rating DESC;
  `, [trimmedSearch, trimmedSearch, trimmedSearch]);

  if (matchSellers.length === 0) {
    const [matchBannedSellers] = await db.query(`
      SELECT
        s.username AS username,
        s.email AS email,
        s.id AS id,
        s.phone_number AS phone_number,
        b.image_url AS image_url,
        r.rating AS rating
      FROM
        sellers s
      JOIN bnslogo b ON s.email = b.email
      JOIN ratings r ON s.email = r.email
      WHERE
        s.status = 'Banned' AND (
          s.username = ? OR
          s.email = ? OR
          s.id = ?
        );
    `, [trimmedSearch, trimmedSearch, trimmedSearch]);

    if (matchBannedSellers.length > 0) {
      return { message: 'Sorry, the user is banned' };
    }

    return { error: 'Sorry, could not find the user' };
  }

  return { matchSellers };
}


export async function getUser(email, userId) {
    const [row]=db.query(
        `
        SELECT 
        u.username,
        u.id AS userid,
        u.email,
        r.rating,
        b.image_url,
        u.phone_number
        FROM users u
        JOIN ratings r ON u.id = r.user_id AND u.email = r.email
        JOIN bnslogo b ON b.user_id = u.id AND b.email = u.email
        WHERE u.id = ? AND u.email = ?
        `, [userId, email]
    )
    if(row.length===0) return {error:'Sorry an error occured while fetching the user'}
    const user =row[0]

    if (user.status!=='Active') return {errorMessage:'Sorry the user profile is currently banned'}

    return{
        user:{
            username:user.username,
            id: user.user_id,
            email: user.email,
            phoneNumber: user.phone_number,
            bnsLogo: user. image_url,
            rate: user.rating
        },
        message:'User fetch successful'
    }
}

export async function patchProfile(title, patch, email, userid) {
    const trimTitle = title.trim().toLowerCase();

    let query = '';
    let params = [];

    switch (trimTitle) {
        case 'username':
            query = `UPDATE sellers SET username = ? WHERE email = ? AND user_id = ?`;
            params = [patch, email, userid];
            break;

        case 'phonenumber':
            query = `UPDATE sellers SET phone_number = ? WHERE email = ? AND user_id = ?`;
            params = [patch, email, userid];
            break;

        case 'bnslogo':
            query = `UPDATE bnslogo SET image_url = ? WHERE email = ? AND user_id = ?`;
            params = [patch, email, userid];
            break;

        default:
            return {
                error: 'Sorry, could not make the update. Invalid title provided.'
            };
    }

    try {
        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) {
            return {
                error: 'No rows were updated. Please check if the record exists or if the value is unchanged.'
            };
        }

        return {
            message: 'Profile has been updated successfully'
        };
    } catch (err) {
        console.error(err);
        return {
            error: 'A database error occurred while updating the profile.'
        };
    }
}


// const a='mwaura.22@s5tents.ku.ac.ke',
// b='6j67b4ux',
// c=3,
// d=20250730,
// e='mii',
// f='assli',
// g='seller'

// adduser(b,e,a,f,c,d,g)


// saveRatings(b, a, c,d)
