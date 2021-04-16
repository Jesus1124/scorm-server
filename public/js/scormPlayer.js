/**
 * Created by thihara on 11/2/16.
 */
// var serverURL = "http://localhost:5000/learnforce-development/us-central1/app";
// var serverURL =
//   "https://europe-west3-audacious-mvp-df5dc.cloudfunctions.net/app";
// var serverURL = "https://europe-west3-postloungeacademy.cloudfunctions.net/app";

$(document).ready(function () {
  //Setting up dummy API
  window.scorm = new SCOBotBase({
    debug: true,
    time_type: "UTC", // or GMT
    exit_type: "suspend", // or finish
    success_status: "unknown", // passed, failed, unknown
    cmi: {}, // optional way to resume locally or some other custom use case
  });
  window.SB = new SCOBot({
    interaction_mode: "state", // state (single interaction) or journaled (history of interactions)
    scaled_passing_score: "0.7", // uses cmi.score.scaled to equate cmi.success_status
    completion_threshold: "1", // uses cmi.progress_measure to equate cmi.completion_status
    initiate_timer: false, // if max_time_allowed, you can set the timer vs. SCOBot
    scorm_strict: true, // Setting this to false will turn off the attempts to truncate data that exceeds the SPM's commonly supported by LMS's.
    // New in 4.0.3 -
    base64: true, // Set to false if you manage suspend data or do not wish for it to be encoded (v4.0.3 option)
    happyEnding: true, // Set to false if you want to disable this method (v4.0.5)
    useJSONSuspendData: true, // Set to false if you manage suspend data (v4.0.3 option)
    // New in 4.0.9 -
    doNotStatusUntilFinish: true, // Set to true if you don't want to update the score until finished. (4.0.9 option)
    sequencing: {
      // New in 4.1.1 : Sequence and Navigation options
      nav: {
        request: "_none_",
      },
    },
  });

  window.scorm.initialize();

  // window.API.on("LMSInitialize", function () {
  //   console.log("Initial");
  //   window.parent.postMessage("init", "http://localhost:8080");
  // });
  // window.API.on("LMSCommit", function () {
  //   console.log("commit");
  //   window.parent.postMessage("commit", "http://localhost:8080");
  // });

  // window.API_1484_11.on("Initialize", function () {
  //   console.log("2004 initialize");
  //   window.parent.postMessage("init");
  // });
  // window.API_1484_11.on("Commit", function () {
  //   console.log("2004 commit");
  //   window.parent.postMessage("init");
  // });
  // window.API.LMSInitialize();

  //This is where content providers will look for the SCORM RTE
  window.API_1484_11 = new SCOBot_API_1484_11();
  let prev_status = undefined;
  setInterval(function () {
    let completion_status = window.API_1484_11.GetValue(
      "cmi.completion_status"
    );

    console.log("COMPLETION____________________", completion_status);

    if (completion_status !== prev_status) {
      window.parent.postMessage(
        JSON.stringify({
          type: "completion_status",
          value: completion_status,
        }),
        "*"
      );
    }

    prev_status = completion_status;
  }, 1000);

  window.addEventListener("message", function (event) {
    console.log("MESSAGE_RECEIVED", event.data);
    const eventData = JSON.parse(event.data);
    if (eventData.type === "student_data") {
      window.GetStudentName = function () {
        return eventData.value.name.split(" ").join(",");
      };
    }
  });

  window.parent.postMessage(
    JSON.stringify({
      type: "get_student_data",
    }),
    "*"
  );

  $("body").on("click", ".navLink", function (evt) {
    evt.preventDefault();
    var link = this.href;
    $("#content").attr("src", link);
  });

  var urlParams = getQueryParameters(document.location.search);
  var contentID = urlParams.contentID;

  $.get("/navTree", { contentID: contentID }, function (navData) {
    console.log(JSON.stringify(navData));
    if (navData.length === 1 && navData[0].children.length === 1) {
      $("#contentNav").css("display", "none");
    } else createNavList(navData);
    // Note: comment createNavList and uncomment the line below to auto run the first SCO
    $("#content").attr("src", navData[0].children[0].link);
    console.log(navData, navData[0].children[0].link);
  });
});

var createNavList = function (navData) {
  var contentNavList = $("<ul/>").appendTo("#contentNav");
  navData.forEach(function (entry) {
    contentNavList.append(`<li class="mainNav">${entry.title}</li>`);
    var subList = $(`<ul/>`);
    entry.children.forEach(function (child) {
      subList.append(
        `<li class="subNav"><a class="navLink" href="${child.link}">${child.title}</a></li>`
      );
    });
    contentNavList.append(subList);
  });
};

var getQueryParameters = function (queryString) {
  queryString = queryString.split("+").join(" ");

  var params = {},
    tokens,
    re = /[?&]?([^=]+)=([^&]*)/g;

  while ((tokens = re.exec(queryString))) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }

  return params;
};
