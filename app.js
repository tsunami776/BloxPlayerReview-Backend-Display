const express = require("express");
// const helmet = require("helmet");
const compression = require("compression");
// const morgan = require("morgan");
const bodyParser = require("body-parser");
const graphqlHttp = require("express-graphql");
const mongoose = require("mongoose");

const cors = require("cors");


const graphQlSchema = require("./graphql/schema/index");
const graphQlResolvers = require("./graphql/resolvers/index");
const isAuth = require("./middleware/is-auth");
const path = require("path");
const fs = require("fs");
// const fileUpload = require("./middleware/file-upload");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { clearImage } = require("./util/file");

//file upload
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
// aws.config.update({
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   accessKeyId: process.env.AWS_SECRET_ACCESS_KEY_ID,
//   region: process.env.AWS_REGION
// });

const app = express();
//file upload
const s3 = new aws.S3({
  secretAccessKey: "",
  accessKeyId: "AKIA5FSNIYEEH56V566Q",
  region: "us-east-1"
});

const imageFilter = (req, file, cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg'){
    cb(null, true)
  }else{
    cb(new Error('Invalid Mime type, only JPEG, JPG and PNG'), false);
  }
}

const upload = multer({
  fileFilter: imageFilter,
  storage: multerS3({
    s3: s3,
    bucket: 'badger-share-test2',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      console.log('metadata function called');
      cb(null, {fieldName: "TESTING_META_DATA!"});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(cors());

// const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {flags: "a"});
// app.use(helmet());
app.use(compression());
// app.use(morgan("combined", {stream:accessLogStream}));
app.use(bodyParser.json());

//UPLOAD
const singleUpload = upload.single('image');
app.put("/upload-image", (req, res, next) => {
  singleUpload(req, res, function (err){
    //potential fix
    if(err){
      console.log(err.message);
      return res.status(422).send({errors: [{title: 'Upload failed', detail: err.message}]});
    }

    return res.json({
      message: "File uploaded.",
      'imageUrl': req.file.location,
    });
  });
});

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(isAuth);

app.put("/post-image", (req, res, next) => {
  // if (!req.isAuth) {
  //   throw new Error("Not authenticated!");
  // }
  if (!req.file) {
    return res.status(200).json({ message: "No file provided!" });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res.status(201).json({
    message: "File stored.",
    filePath: req.file.path.replace("\\", "/"),
  });
});

app.use(
  "/graphql",
  graphqlHttp({
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true,
    formatError(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || "An error occurred.";
      const code = err.originalError.code || 500;
      return { message: message, status: code, data: data };
    },
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

// app.use((error, req, res, next) => {
//   if (req.file) {
//     fs.unlink(req.file.path, (err) => {
//       console.log(err);
//     });
//   }
//   if (res.headerSent) {
//     return next(error);
//   }
//   res.status(error.code || 500);
//   res.json({ message: error.message || "An unknown error occurred!" });
// });

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.gkypzdt.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`
  )
  .then(() => {
    app.listen(process.env.PORT || 8080);
  })
  .catch((err) => {
    console.log(err);
  });
