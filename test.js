const crypto = require('crypto');


// const credentials = 'uday:udayJSON2XML';

// let base64encoded = new Buffer.from(credentials);

// base64encoded = base64encoded.toString('base64');

// console.log(base64encoded);

// // const hashed = crypto.createHash('sha256').update('sender:basicAuthSender').digest("hex");

// // console.log(hashed);
// let decoded = new Buffer.from(base64encoded, 'base64').toString();

// console.log(decoded);

// const folder = __dirname + '/parsedXML';

// console.log(folder)

const promise1 = new Promise((resolve, reject) => {  
   setTimeout(() => resolve(1), 2000);  
 });  
 const promise2 = new Promise((resolve, reject) => {  
   setTimeout(() => reject('error'), 1000);  
 });
 
 (async () => {  
   try {  
     const val1 = await promise1;  
     console.log(val1)  
     const val2 = await promise2;  
     console.log(val2)  
   } catch (error) {  
     console.log(error)  
   } finally {  
     console.log('finally runs');  
   }})()