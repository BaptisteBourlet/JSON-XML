const express = require('express');
const app = express();
const PORT = 7000;
const bodyParser = require('body-parser');
const { toXML } = require('jstoxml');
const fs = require('fs');

//middlewares
app.use(express.json());
app.engine('html', require('ejs').renderFile);
app.use('/', express.static(__dirname + '/views'));
app.use('/', express.static(__dirname + '/ga'));
app.set('view engine', 'html');
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/index', (req, res) => {
   res.render('index');
})

app.post('/getJSON', (req, res) => {
   const receivedJSON = req.body;

   const xmlOptions = {
      header: '<?xml version="1.0" encoding="UTF-16" standalone="no"?>',
      attributesFilter: false,
      filter: false
   }

   let XML = toXML(generateCorrectFormat(receivedJSON), xmlOptions);

   fs.writeFile(__dirname + `/parsedXML/${generateName(receivedJSON)}.xml`, XML, (err) => {
      if (err) {
         res.status(401).send('Error occured during parsing process');
         console.log(err);
      }

      res.status(200).send('Received and Parsed the JSON.');
   })
})


const server = app.listen(PORT, () => {
   console.log('listening on port ' + PORT);
})








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
