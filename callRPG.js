const db = require('/QOpenSys/QIBM/ProdData/OPS/Node4/os400/db2i/lib/db2a');


module.exports = (fileName) => {
   const sql = `call #LALLAN.RHEXML3(${fileName})`

   const dbconn = new db.dbconn();

   dbconn.conn("*LOCAL");

   const stmt = new db.dbstmt(dbconn);

   stmt.prepareSync(sql);

   stmt.bindParamSync([
      [fileName, db.SQL_PARAM_INPUT, 2],
   ]);

   stmt.executeSync(function callback(out) {
      console.log('file has been imported', out)
   });

   delete stmt;
   dbconn.disconn();
   delete dbconn;
}

