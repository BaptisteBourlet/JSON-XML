const users = [{ username: 'uday', password: 'udayJSON2XML'}];

module.exports = async (req, res, next) => {
   const authHeader = req.headers.authorization;
   let decoded = new Buffer.from(authHeader, 'base64').toString(); //uday:udayJSON2XML

   let username = decoded.split(':')[0];
   let password = decoded.split(':')[1];

   const foundUser = users.find(user => user.username == username && user.password == password);

   if (foundUser) {
      next();
   } else {
      res.status(401).send('credentials incorrect');
   }
}