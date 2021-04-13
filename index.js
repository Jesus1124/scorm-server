const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

let fs = require("fs"),
  async = require("async"),
  unzip = require("unzipper"),
  util = require("util"),
  xmldoc = require("xmldoc"),
  ScormNavTreeBuilder = require("./ScormNavTreeBuilder"),
  ScormModel = require("./Model"),
  navTreeBuilder = new ScormNavTreeBuilder(),
  ScormContent = ScormModel.ScormContent,
  ScormContentParser = require("./ScormContentParser").ScormContentParser,
  scormParser = new ScormContentParser();

let express = require("express");
let cors = require("cors");
let os = require("os");
let path = require("path");
let request = require("request");
let app = express();
app.use(cors());
let navTreeMap = new Map();

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/scormContent", { dotFiles: "allow" }));

app.get("/scorm", (req, res) => {
  let zipURL = req.query.url;
  var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  console.log(fullUrl);
  zipURL = fullUrl.split("?");
  zipURL.shift();
  zipURL = zipURL.join("?").substr(4);
  let extractedDirName = "scormCourse";
  let unzipPipe = unzip.Extract({
    path: __dirname + `/scormContent/${extractedDirName}`,
  });

  unzipPipe.on("close", function () {
    let file = __dirname + `/scormContent/${extractedDirName}/imsmanifest.xml`;

    fs.readFile(file, function (err, data) {
      let scormContent = scormParser.parse(data);

      var navTree = navTreeBuilder.buildNavigationModel(
        scormContent,
        extractedDirName
      );
      navTreeMap.set(extractedDirName, navTree);

      return setTimeout(
        () => res.redirect("scormPlayer.html?contentID=scormCourse"),
        1000
      );
    });
  });

  request(zipURL).pipe(unzipPipe);
  // res.sendFile(__dirname + "/public/index.html");
});

app.get("/navTree", (req, res) => {
  res.send(navTreeMap.get(req.query.contentID));
});

app.get("/content", (req, res) => {
  var keys = [];
  navTreeMap.forEach((value, key) => {
    keys.push(key);
  });
  res.send(keys);
});

app.listen(3000, function () {
  console.log("SCORM server is running on port 3000!");
});
