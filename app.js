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

// const db = require('/QOpenSys/QIBM/ProdData/OPS/Node4/os400/db2i/lib/db2a');

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
app.use('/', express.static(__dirname + '/views'));
app.use(express.json());
// app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors(corsOptions));

// routes
app.post('/data/CbiMessages', (req, res) => {
   const receivedJSON = req.body;
   const errors = {};

   const folder = __dirname + '/parsedXML';

   if (!checkValidProps(receivedJSON)) {
      res.status(400).send('Format incorrect, please check again the properties');
      return;
   }

   try {
      if (!fs.existsSync(folder)) {
         fs.mkdirSync(folder);
      }

      let XML = toXML(generateCorrectFormat(receivedJSON), xmlOptions);

      const fileName = `${generateName(receivedJSON)}.xml`;

      let fileNameWithPath = `${folder}/${fileName}`;

      fs.writeFile(`${fileNameWithPath}`, XML, (err) => {
         if (err) {
            res.status(401).send(err);
            return;
         }

         fileNameWithPath = fileNameWithPath.replace('/BECAB004', '');

         const callRPGResult = callRPG(fileNameWithPath);

         res.status(200).send(callRPGResult);
      });
   }
   catch (err) {
      res.status(401).send(err);
      console.log(err);
   }
})


// server starts
const server = app.listen(PORT, () => {
   console.log('listening on port ' + PORT);
})

// functions & middlewares

const callRPG = async (fileName) => {

   const pool = new DBPool();

   const connection = pool.attach();

   const statement = connection.getStatement();

   const sql = `CALL RHEPGM.RHEXML3(${fileName})`;

   await statement.prepare(sql);

   const results = await statement.execute();

   if (results) {
      console.log(`results:\n ${JSON.stringify(results)}`);
   }

   await pool.detach(connection);


   return results;

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


