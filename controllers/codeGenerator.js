import crypto from 'crypto'

 export  function codeGenerator() {
        return  crypto.randomInt(10000, 999999).toString() 
}