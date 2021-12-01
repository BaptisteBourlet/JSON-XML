
const credentials = 'uday:udayJSON2XML';

let base64encoded = new Buffer.from(credentials);

base64encoded = base64encoded.toString('base64');

console.log(base64encoded);

let decoded = new Buffer.from(base64encoded, 'base64').toString();

console.log(decoded);

const folder = __dirname + '/parsedXML';

console.log(folder)

