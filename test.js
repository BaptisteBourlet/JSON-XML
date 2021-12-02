
// const credentials = 'uday:udayJSON2XML';

// let base64encoded = new Buffer.from(credentials);

// base64encoded = base64encoded.toString('base64');

// console.log(base64encoded);

// let decoded = new Buffer.from(base64encoded, 'base64').toString();

// console.log(decoded);

// const folder = __dirname + '/parsedXML';

// console.log(folder)
// dWRheTp1ZGF5SlNPTjJYTUw=




let string = "/wwwaaaaaaaaa/cdvts/htdocs/rhenania/cbexport/0100_DAT(RHE1)_(3010-0300(0))_3264268A-0B01-47BA-97D1-D6EE99D497C5.xml";

// const addRightPads = (fileName) => {
//    return fileName + new Array(256 - fileName.length + 1).join(' ');
// }
const addRightPads = (fileName) => {
   //return fileName with space Pad => fileName.length = 256;
   const oneSpace = ' ';
   return fileName + oneSpace.repeat(256 - fileName.length);
}