const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const { toXML } = require('jstoxml');
dotenv.config();
const PORT = 62315;
const basicAuth = require('./basicAuth');
const { DBPool } = require('idb-pconnector');
const { Connection, Statement, } = require('idb-pconnector');


// packages used
// https://www.npmjs.com/package/jstoxml
// https://www.npmjs.com/package/idb-pconnector


// options
const corsOptions = {
   origin: '*', // all origins for now
   optionsSuccessStatus: 200,
   credentials: true,
}

const xmlOptions = {
   header: '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
   attributesFilter: false,
   filter: false
}

//middlewares
app.use(express.json());
app.set('view engine', 'html');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors(corsOptions));



// CableBuilder routes
app.post('/data/CbiMessages', basicAuth, (req, res) => {
   const receivedJSON = req.body;

   const folder = __dirname + '/parsedXML';

   try {
      if (!fs.existsSync(folder)) {
         fs.mkdirSync(folder);
      }

      let XML = toXML(generateCorrectFormat(receivedJSON), xmlOptions);

      const fileName = `${generateName(receivedJSON)}.xml`;

      let fileNameWithPath = `${folder}/${fileName}`;

      fs.writeFile(`${fileNameWithPath}`, XML, async (err) => {
         if (err) {
            res.status(401).send('Unable to write file to disk: ' + err);
            return;
         }

         fileNameWithPath = fileNameWithPath.replace('/BECAB004', ''); // remove /BECAB004

         fileNameWithPath = addRightPads(fileNameWithPath); // add space to make 256 length

         callRPG(fileNameWithPath);

         res.status(200).send('Received and parsed the JSON for Key:' + receivedJSON.MessageKey);

      });
   }
   catch (err) {
      res.status(401).send('Error occured.', err);
      console.log(err);
   }
})



app.post('/test', basicAuth, (req, res) => {
   const receivedJSON = req.body;

   const folder = __dirname + '/parsedXML';

   try {
      if (!fs.existsSync(folder)) {
         fs.mkdirSync(folder);
      }

      let XML = toXML(generateCorrectFormat(receivedJSON), xmlOptions);

      const fileName = `${generateName(receivedJSON)}.xml`;

      let fileNameWithPath = `${folder}/${fileName}`;

      fs.writeFile(`${fileNameWithPath}`, XML, async (err) => {
         if (err) {
            res.status(401).send('Unable to write file to disk: ' + err);
            return;
         }

         fileNameWithPath = fileNameWithPath.replace('/BECAB004', ''); // remove /BECAB004

         fileNameWithPath = addRightPads(fileNameWithPath); // add space to make 256 length

         callRPG(fileNameWithPath);

         setTimeout(async () => {
            const result = await getMessageKey(receivedJSON.MessageKey);

            console.log(result);

            res.status(200).send('Received and parsed the JSON for Key:' + receivedJSON.MessageKey);
            // if (result[0].CMSGID == receivedJSON.MessageKey) {
            // }
         }, 200)
      });
   }
   catch (err) {
      res.status(401).send('Error occured.', err);
      console.log(err);
   }
})


// server starts
const server = app.listen(PORT, () => {
   console.log('listening on port ' + PORT);
})






// functions & middlewares

const callRPG = async (fileName) => {
   try {
      const pool = new DBPool();

      const connection = pool.attach();

      const statement = connection.getStatement();

      const sql = `CALL RHEPGM.RHEXML3 ('${fileName}')`;

      await statement.prepare(sql);

      await statement.execute();

      await pool.detach(connection);
   }
   catch (err) {
      console.log('error occured while calling RPG program: ' + err);
   }
}

const getMessageKey = async (messageKey) => {

   const connection = new Connection({ url: '*LOCAL' });

   const statement = new Statement(connection);

   const results = await statement.exec(`SELECT * FROM RHEDTA.RHEXMLH WHERE CMSGID = '${messageKey}'`);

   return results;
}


const checkValidProps = (json) => {
   const validProps = [
      'Company',
      'ConversationDate',
      'ConversationId',
      'ConversationName',
      'ConversationSeqNo',
      'DomainId',
      'EndOfMessage',
      'MessageKey',
      'MessageXml',
      'Name',
      'Sender',
      'SequenceGroupId',
      'ValidateChanges',
      'dataAreaId'];

   let propsToCheck = Object.keys(json).sort(); // expect an array exactly like validProps
   let validString = validProps.join('');
   let stringToCheck = propsToCheck.join('');

   return validString == stringToCheck;
}

const addRightPads = (fileName) => {
   //return fileName with space Pad => fileName.length = 256;
   const oneSpace = ' ';
   return fileName + oneSpace.repeat(256 - fileName.length);
}

const generateName = (json) => {
   const { Company, SequenceGroupId, MessageKey, MessageXml, ConversationSeqNo } = json;

   let match = MessageXml.match(/<ItemId>([^<]*)<\/ItemId>/);

   let ItemId = match ? match[1] : ''; // extract ItemId from JSON

   return `${SequenceGroupId}_DAT(${Company})_(${ItemId}(${ConversationSeqNo}))_${MessageKey.toUpperCase()}`;
}

const generateCorrectFormat = (json) => {
   return {
      Envelope: {
         Header: {
            MessageId: `{${json.MessageKey.toUpperCase()}}`,
            Action: 'http://schemas.microsoft.com/dynamics/2012/01/services/CsCbiNewMessageService/create',
         },
         Body: {
            MessageParts: {
               CsCbiNewMessage: {
                  _name: "Message",
                  _attrs: {
                     class: "entity",
                  },
                  _content: {
                     Company: json.Company,
                     ConversationDate: json.ConversationDate,
                     ConversationId: `{${json.ConversationId.toUpperCase()}}`,
                     ConversationName: json.ConversationName,
                     ConversationSeqNo: json.ConversationSeqNo,
                     EndOfMessage: json.EndOfMessage,
                     MessageXml: json.MessageXml,
                     Name: json.Name,
                     Sender: json.Sender,
                     SequenceGroupId: json.SequenceGroupId,
                     ValidateChanges: json.ValidateChanges,
                  }
               }
            }
         }
      }
   }
}

