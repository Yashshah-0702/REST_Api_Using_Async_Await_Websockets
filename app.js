const express = require("express");
const bodyParser = require("body-parser");
const feed = require("./Routes/feed");
const auth = require("./Routes/auth");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
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

const app = express();

app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});
app.use(feed);
app.use(auth);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data
  res.status(status).json({
    message: message,
    data:data
  });
});

mongoose
  .connect(
    "mongodb+srv://Yash_Shah:y_a_s_h@cluster0.h0nmwav.mongodb.net/messages"
  )
  .then(() => {
    console.log("Connected to database...");
    const server = app.listen(8080);
    const io = require('./socket').init(server)
    io.on('connection', socket => {
      console.log('Client connected');
    });
  })
  .catch((err) => {
    console.log(err);
  });
