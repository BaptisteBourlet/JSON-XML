

const credentials = 'uday:udayJSON2XML';
let base64encoded = new Buffer.from(credentials);

base64encoded = base64encoded.toString('base64');

console.log(base64encoded);  //dWRheTp1ZGF5SlNPTjJYTUw=

let decoded = new Buffer.from(base64encoded, 'base64').toString();

console.log(decoded); //uday:udayJSON2XML
