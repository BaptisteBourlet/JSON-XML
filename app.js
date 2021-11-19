const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { toXML } = require('jstoxml');
dotenv.config();
const PORT = 7000;


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
   header: '<?xml version="1.0" encoding="UTF-16" standalone="no"?>',
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
app.post('/parseJSON', (req, res) => {
   const receivedJSON = req.body;

   const folder = __dirname + '/parsedXML';

   try {
      if (!fs.existsSync(folder)) {
         fs.mkdirSync(folder);
      }

      let XML = toXML(generateCorrectFormat(receivedJSON), xmlOptions);

      fs.writeFileSync(`${folder}/${generateName(receivedJSON)}.xml`, XML)

      res.status(200).send('Received and Parsed the JSON.');
   }
   catch (err) {
      res.status(401).send('Error occured during parsing process');
      console.log(err);
   }
})


// server starts
const server = app.listen(PORT, () => {
   console.log('listening on port ' + PORT);
})




// functions & middlewares

const authToken = async (req, res, next) => {
   const authHeader = req.headers.authorization; // if sent with header as 'Bearer xxxtokenxxx'

   const token = authHeader.split()[1];

   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
         res.status(401).send('Unauthorized request');
      }

      console.log(decoded);
      next()
   });
}

const generateName = (json) => {
   const { Company, SequenceGroupId, MessageKey, MessageXml } = json;

   let match = MessageXml.match(/<ItemId>([^<]*)<\/ItemId>/);
   let ItemId = match[1]; // extract ItemId from JSON

   return `${SequenceGroupId}_DAT(${Company})_(${ItemId}(0))_${MessageKey.toUpperCase()}`;
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


