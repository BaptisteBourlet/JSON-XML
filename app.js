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


// packages used
// https://www.npmjs.com/package/jstoxml
// https://jwt.io/

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

   // if (!checkValidProps(receivedJSON)) {
   //    res.status(400).send('Format incorrect, please check again the properties');
   //    return;
   // }

   try {
      if (!fs.existsSync(folder)) {
         fs.mkdirSync(folder);
      }

      let XML = toXML(generateCorrectFormat(receivedJSON), xmlOptions);

      const fileName = `${generateName(receivedJSON)}.xml`;

      let fileNameWithPath = `${folder}/${fileName}`;

      fs.writeFile(`${fileNameWithPath}`, XML, (err) => {
         if (err) {
            res.status(401).send('Unable to write file to disk: ' + err);
            return;
         }

         res.status(200).send('Received and successfully parsed the JSON.');
      });
   }
   catch (err) {
      res.status(401).send('Error occured: ' + err);
      console.log(err);
   }
})


app.post('/test', (req, res) => {
   const receivedJSON = req.body;

   const folder = __dirname + '/parsedXML';

   // if (!checkValidProps(receivedJSON)) {
   //    res.status(400).send('Format incorrect, please check again the properties');
   //    return;
   // }

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

         // fileNameWithPath = fileNameWithPath.replace('/BECAB004', '');

         callRPG(fileNameWithPath);

         res.status(200).send('Received and parsed the JSON.');
      });
   }

   catch (err) {
      res.status(401).send('Error occured.', err);
      console.log({ check, err });
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

      console.log('1 - created new Pool');

      const connection = pool.attach();

      console.log('2 - connected to DB2')

      const statement = connection.getStatement();

      console.log('3 - statement started');

      const sql = `CALL RHEPGM.RHEXML3 ('${fileName}')`;

      await statement.prepare(sql);

      console.log('4 - STMT prepared');

      await statement.execute();

      console.log('5 - executed statement');

      await pool.detach(connection);

      console.log('6 - stopped connection');

   }
   catch (err) {
      console.log('error occured while calling RPG program: ' + err);
   }
}

// const sql = `call #RHEPGM.RHEXML3(${fileName})`

// const dbconn = new db.dbconn();

// dbconn.conn("*LOCAL");

// const stmt = new db.dbstmt(dbconn);

// stmt.prepareSync(sql);

// stmt.bindParamSync([
//    [fileName, db.SQL_PARAM_IN
// ]);

// stmt.executeSync(function callback(out) {
//    console.log('file has been imported', out)
// });

// delete stmt;
// dbconn.disconn();
// delete dbconn;


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

   console.log('VALID', validString);
   console.log('CHECK', stringToCheck);


   return validString == stringToCheck;
}


const generateName = (json) => {
   const { Company, SequenceGroupId, MessageKey, MessageXml, ConversationSeqNo } = json;

   let match = MessageXml.match(/<ItemId>([^<]*)<\/ItemId>/);
   let ItemId = match[1]; // extract ItemId from JSON

   return `${SequenceGroupId}_DAT(${Company})_(${ItemId}(${ConversationSeqNo}))_${MessageKey.toUpperCase()}`;
}

const generateCorrectFormat = (json) => {
   return {
      Envelop: {
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


