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
  let idx1 = zipURL.indexOf("%2F") + 3,
    idx2 = zipURL.indexOf(".zip");
  let extractedDirName = zipURL.substr(idx1, idx2 - idx1);
  let unzipPipe = unzip.Extract({
    path: __dirname + `/scormContent/${extractedDirName}`,
  });

  function returnTo() {
    let file = __dirname + `/scormContent/${extractedDirName}/imsmanifest.xml`;

    fs.readFile(file, function (err, data) {
      let scormContent = scormParser.parse(data);

      var navTree = navTreeBuilder.buildNavigationModel(
        scormContent,
        extractedDirName
      );
      navTreeMap.set(extractedDirName, navTree);

      return res.redirect(`scormPlayer.html?contentID=${extractedDirName}`);
    });
  }
  if (fs.existsSync(__dirname + `/scormContent/${extractedDirName}`)) {
    console.log("Already Exist");
    return returnTo();
  }

  unzipPipe.on("close", function () {
    return returnTo();
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
