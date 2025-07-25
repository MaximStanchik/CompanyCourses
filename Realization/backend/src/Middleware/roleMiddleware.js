const { func } = require("joi");
const jwt = require("jsonwebtoken");

module.exports = function (roles) {
  return function (req, res, next) {
    if (req.method === "OPTIONS") {
      next();
    }
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res.status(403).json({ message: "User is not authorized" });
      }
      const { roles: decodedRoles } = jwt.verify(token, process.env.SECRET);
      console.log(decodedRoles);
      if (!decodedRoles) {
        return res.status(403).json({ message: "User is not authorized" });
      }
      let hasRole = false;
      decodedRoles.forEach((role) => {
        if (roles.includes(role)) {
          hasRole = true;
        }
      });  
      if (!hasRole) {
        return res
          .status(403)
          .json({ message: "You don't have enough rights" });
      }
      next();
    } 
    catch (e) {
      console.log(e);
      return res.status(403).json({ message: "User is not authorized" });
    }
  };
};
