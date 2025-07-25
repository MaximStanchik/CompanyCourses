const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(403).json({ message: "User is not authorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "Token not provided" });
    }

    const decodedData = jwt.verify(token, process.env.SECRET);
    req.user = decodedData;
    next();
  } 
  catch (e) {
    console.log("JWT verification error:", e.message);
    return res.status(403).json({ message: "User is not authorized" });
  }
};