const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  const token = authHeader.split(" ")[1];
  if (!token || token === "") {
    req.isAuth = false;
    return next();
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_KEY);
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }
  req.isAuth = true;
  req.userId = decodedToken.userId;
  next();
};

// const jwt = require("jsonwebtoken");
//
// const HttpError = require("../models/http-error");
//
// module.exports = (req, res, next) => {
//   if (req.method === "OPTIONS") {
//     return next();
//   }
//   try {
//     const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
//     if (!token) {
//       throw new Error("Authentication failed!");
//     }
//     const decodedToken = jwt.verify(token, "supersecret_dont_share");
//     req.userData = { userId: decodedToken.userId };
//     next();
//   } catch (err) {
//     const error = new HttpError("Authentication failed!", 403);
//     return next(error);
//   }
// };
