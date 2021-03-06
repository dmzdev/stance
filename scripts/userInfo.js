require("datejs/date");

var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , spinBox: require("dmz/ui/spinBox")
      , graph: require("dmz/ui/graph")
      , mainWindow: require("dmz/ui/mainWindow")
      , layout: require("dmz/ui/layout")
      , label: require("dmz/ui/label")
      , loader: require('dmz/ui/uiLoader')
      , textEdit: require("dmz/ui/textEdit")
      , widget: require("dmz/ui/widget")
      , scrollArea: require("dmz/ui/scrollArea")
      , webview: require("dmz/ui/webView")
      , consts: require("dmz/ui/consts")
      , event: require("dmz/ui/event")
      }
   , stance: require("stanceConst")
   , data: require("dmz/runtime/data")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , message: require("dmz/runtime/messaging")
   , resources: require("dmz/runtime/resources")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   , time: require("dmz/runtime/time")
   }

   // Variables
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , Groups = {}
   , Users = {}
   , Votes = {}
   , Memos = {}
   , Newspapers = {}
   , Videos = {}
   , Lobbyists = {}
   , PdfItems = {}
   , Posts = {}
   , Comments = {}
   , Questions = {}
   , Advisors = {}
   , AllGroupsTab = {}
   , LayeredAchievements = false
   , NonLayeredAchievements = false
   , ShowStudentsMessage = dmz.message.create("showStudentsWindow")
   , ACHIEVEMENT_STYLE = "#Form { background-color: rgb(0, 0, 0); color: black; }"
   , BRONZE_STYLE = "#Form { background-color: rgb(150, 90, 56); color: black; }"
   , SILVER_STYLE = "#Form { background-color: rgb(168, 168, 168); color: black; }"
   , GOLD_STYLE = "#Form { background-color: rgb(217, 164, 65); color: black; }"
   , GOLD = 3
   , SILVER = 2
   , BRONZE = 1

   // UI
   , userInfoWidget = dmz.ui.loader.load("UserInfoWidget.ui")
   , groupTabs = userInfoWidget.lookup("groupTabs")
   , userStatisticsWidget = dmz.ui.webview.create("userStatistics")
   , previouslyOpened = false

   // Functions
   , toDate = dmz.util.timeStampToDate
   , createPieChart
   , setVoteDistributonPieChart
   , votesCast
   , voteAlignment
   , postsVsComments
   , tagTypes
   , totalTagPercentage
   , groupVoteDistribution
   , byUser
   , byAdvisor
   , byGroups
   , setUserPictureLabel
   , setVotesSeenLabel
   , setLobbyistsSeenLabel
   , setNewspapersSeenLabel
   , setVideosSeenLabel
   , setMemosSeenLabel
   , setPdfItemsSeenLabel
   , setLastLoginSeenLabel
   , setUserNameLabel
   , setVotedOnLabel
   , setDisturbanceInTheForceLabel
   , setGoldAchievementsLabel
   , setSilverAchievementsLabel
   , setBronzeAchievementsLabel
   , setTotalLoginsLabel
   , setGroupNameLabel
   , setTotalPostsLabel
   , setTotalCommentsLabel
   , setTotalVotesLabel
   , setTotalQuestionsLabel
   , setTotalMediaLabel
   , setMemberCountLabel
   , createUserAchievementWidgets
   , createUserWidget
   , fillGroupInfoWidget
   , createGroupTabs
   ;

ShowStudentsMessage.subscribe(self, function () {

   if (!userInfoWidget.visible() && !previouslyOpened) {

      previouslyOpened = true;
      createGroupTabs();
      userInfoWidget.show();
   }
   else if (previouslyOpened) { userInfoWidget.show(); }
});

createPieChart = function (data, labelFnc, scene, zero) {

   var x = zero ? (zero.x || 0) : 0
     , y = zero ? (zero.y || 0) : 0
     , graphLabel
     , startAngle
     , items = []
     , total = 0
     , everythingZero = true
     ;

   if (data && scene) {

      data.forEach(function (item) {

         if (item.amt !== 0) {

            total += (item.amt || 0);
            everythingZero = false;
         }
      });
      graphLabel = scene.addText(labelFnc(total));
      graphLabel.pos(20 + x, y);
      startAngle = 0
      data.forEach(function (item, index) {

         var spanAngle = item.amt / total * 360 * 16
           , ellipse = 0
           , legendBox
           , legendLabel
           ;

         if (item.amt) {

            legendBox = dmz.ui.graph.createRectItem(0, 0, 15, 15, graphLabel)
            if (!everythingZero) {

               ellipse = scene.addEllipse(x + 30, y + 30, 200, 200, startAngle, spanAngle, 0, item.brush);
            }
            legendLabel =
               dmz.ui.graph.createTextItem
                  ( item.label + " - " + item.amt + " ("+ (Math.round(item.amt / (total || 1) * 10000)/100) + "%)"
                  , legendBox);

            legendBox.pos(250, index * 20 + 20);
            legendBox.brush(item.brush);
            legendLabel.pos(20, -5);
            items.push(ellipse);
            items.push(legendLabel);
            startAngle += spanAngle;
         }

      });
      if (everythingZero) { scene.addEllipse(x + 30, y + 30, 200, 200, 0, 360 * 16, 0); }
      items.push(graphLabel);

   }
   return items;
};
/* user graphs */
setVoteDistributonPieChart = function (userHandle) {

   var legend = []
     , passBrush
     , failBrush
     , deniedBrush
     , pendingBrush
     , activeBrush
     ;

   if (Users[userHandle]) {

      passBrush = dmz.ui.graph.createBrush({ r: 70/255, g: 240/255, b: 70/255 });
      failBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 70/255, b: 70/255 });
      deniedBrush = dmz.ui.graph.createBrush({ r: 70/255, g: 70/255, b: 70/255 });
      pendingBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 240/255, b: 240/255 });
      activeBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 240/255, b: 70/255 });

      legend.push({ amt: Users[userHandle].votesPassed.length, brush: passBrush, label: "Passed" });
      legend.push({ amt: Users[userHandle].votesFailed.length, brush: failBrush, label: "Failed" });
      legend.push({ amt: Users[userHandle].votesDenied.length, brush: deniedBrush, label: "Denied" });
      legend.push({ amt: Users[userHandle].votesActive.length, brush: activeBrush, label: "Active" });
      legend.push({ amt: Users[userHandle].votesPending.length, brush: pendingBrush, label: "Pending" });

      createPieChart
         ( legend
         , function (total) { return "Proposed Vote Statistics: (Total Proposed Votes: " + total + ")"; }
         , Users[userHandle].ui.graphicsScene
         );
   }
};

votesCast = function (userHandle) {

   var yesBrush
     , noBrush
     , legend = []
     ;

   if (Users[userHandle]) {

      yesBrush = dmz.ui.graph.createBrush({ r: 70/255, g: 240/255, b: 70/255 });
      noBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 70/255, b: 70/255 });

      legend.push({ amt: Users[userHandle].votedYesOn.length, brush: yesBrush, label: "Voted Yes"});
      legend.push({ amt: Users[userHandle].votedNoOn.length, brush: noBrush, label: "Voted No"});

      createPieChart
         ( legend
         , function (total) { return "Vote History: (Total Times Voted: " + total + ")" }
         , Users[userHandle].ui.graphicsScene
         , { x: 600, y: 0 }
         );
   }
};

voteAlignment = function (userHandle) {

   var item = Users[userHandle]
     , votedCorrectlyBrush
     , votedIncorrectlyBrush
     , legend = []
     , passedVotes = []
     , totalPassedVotes = []
     , votedCorrectly = 0
     , votedIncorrectly = 0
     , tempVoteItem
     ;

   if (Users[userHandle] && Users[userHandle].votedYesOn && Users[userHandle].groupHandle &&
      Groups[Users[userHandle].groupHandle]) {

      Users[userHandle].votedYesOn.forEach(function (voteHandle) {

         if (Votes[voteHandle]) {

            if (Votes[voteHandle].state === dmz.stance.VOTE_YES) { votedCorrectly += 1; }
            else if (Votes[voteHandle].state == dmz.stance.VOTE_NO) { votedIncorrectly += 1; }
         }
      });
      Users[userHandle].votedNoOn.forEach(function (voteHandle) {

         if (Votes[voteHandle]) {

            if (Votes[voteHandle].state === dmz.stance.VOTE_NO) { votedCorrectly += 1; }
            else if (Votes[voteHandle].state == dmz.stance.VOTE_YES) { votedIncorrectly += 1; }
         }
      });

      votedCorrectlyBrush = dmz.ui.graph.createBrush({ r: 70/255, g: 240/255, b: 70/255 });
      votedIncorrectlyBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 70/255, b: 70/255 });

      legend.push({ amt: votedCorrectly, brush: votedCorrectlyBrush, label: "Voted With Outcome" });
      legend.push({ amt: votedIncorrectly, brush: votedIncorrectlyBrush, label: "Voted Against Outcome" });

      createPieChart
         ( legend
         , function (total) { return "Vote Alignment: (Total Voted On Votes: " + total + ")" }
         , Users[userHandle].ui.graphicsScene
         , { x:0, y: 300 }
         );
   }
};

postsVsComments = function (userHandle) {

   var postBrush = dmz.ui.graph.createBrush({ r: 70/255, g: 70/255, b: 240/255 })
     , commentBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 240/255, b: 70/255 })
     , legend = []
     ;

   if (Users[userHandle]) {

      legend.push({ amt: Users[userHandle].posts.length, brush: postBrush, label: "Posts"});
      legend.push({ amt: Users[userHandle].comments.length, brush: commentBrush, label: "Comments"});

      createPieChart
         ( legend
         , function (total) { return "Posts vs Comments: (Total: " + total + ")"}
         , Users[userHandle].ui.graphicsScene
         , { x:600, y: 300 }
         );
   }
};

tagTypes = function (userHandle) {

   var legend = []
     , pdfItemTagBrush
     , voteTagBrush
     , postTagBrush
     , commentTagBrush
     , questionTagBrush
     ;

   if (Users[userHandle]) {

      pdfItemTagBrush = dmz.ui.graph.createBrush({ r: 70/255, g: 240/255, b: 70/255 });
      voteTagBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 70/255, b: 70/255 });
      postTagBrush = dmz.ui.graph.createBrush({ r: 70/255, g: 70/255, b: 70/255 });
      commentTagBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 240/255, b: 240/255 });
      questionTagBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 240/255, b: 70/255 });

      legend.push({ amt: Users[userHandle].pdfItemTags, brush: pdfItemTagBrush, label: "Pdf Item Tags" });
      legend.push({ amt: Users[userHandle].voteTags, brush: voteTagBrush, label: "Vote Tags" });
      legend.push({ amt: Users[userHandle].postTags, brush: postTagBrush, label: "Post Tags" });
      legend.push({ amt: Users[userHandle].commentTags, brush: commentTagBrush, label: "Comment Tags" });
      legend.push({ amt: Users[userHandle].questionTags, brush: questionTagBrush, label: "Question Tags" });
      createPieChart
         ( legend
         , function (total) { return "Tagged Item Statistics: (Total Tags: " + total + ")"; }
         , Users[userHandle].ui.graphicsScene
         , { x: 0, y: 600 }
         );
   }
};

/* group graphs */
groupVoteDistribution = function (groupHandle) {

   var legend = []
     , passBrush
     , failBrush
     , pendingBrush
     , deniedBrush
     , activeBrush
     ;

   if (Groups[groupHandle]) {

      passBrush = dmz.ui.graph.createBrush({ r: 70/255, g: 240/255, b: 70/255 });
      failBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 70/255, b: 70/255 });
      deniedBrush = dmz.ui.graph.createBrush({ r: 70/255, g: 70/255, b: 70/255 });
      pendingBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 240/255, b: 240/255 });
      activeBrush = dmz.ui.graph.createBrush({ r: 240/255, g: 240/255, b: 70/255 });

      legend.push({ amt: Groups[groupHandle].votesPassed.length, brush: passBrush, label: "Passed" });
      legend.push({ amt: Groups[groupHandle].votesFailed.length, brush: failBrush, label: "Failed" });
      legend.push({ amt: Groups[groupHandle].votesDenied.length, brush: deniedBrush, label: "Denied" });
      legend.push({ amt: Groups[groupHandle].votesActive.length, brush: activeBrush, label: "Active" });
      legend.push({ amt: Groups[groupHandle].votesPending.length, brush: pendingBrush, label: "Pending" });

      createPieChart
         ( legend
         , function (total) { return "Vote Result Statistics: (Total Votes: " + total + ")"; }
         , Groups[groupHandle].ui.groupGraphicsScene
         , { x: 0, y: 0 }
         );
   }
};

byUser = function (groupHandle, fieldName, field, xPos, yPos) {

   var legend = []
     , colorNumber = 765
     , colorStep = 0
     , currentColor = 0
     , users = []
     , brush
     , amount
     ;

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      users = Groups[groupHandle].members;
      colorStep = 765 / users.length;
      users.forEach(function (userHandle) {

         if (Users[userHandle][field].length !== undefined) { amount = Users[userHandle][field].length }
         else if (Users[userHandle][field] !== undefined) { amount = Users[userHandle][field] }
         else {

            self.log.error("Error Setting Value For", fieldName, "Chart");
            amount = 0;
         }
         if (currentColor <= 255) {

            brush = dmz.ui.graph.createBrush({ r: (currentColor / 255), g: 0, b: 0 });
            legend.push( { amt: amount, brush: brush, label: Users[userHandle].name });
         }
         else if ((currentColor > 255) && (currentColor <= 510)) {

            brush = dmz.ui.graph.createBrush({ r: 1, g: ((currentColor - 255) / 255), b: 0 });
            legend.push( { amt: amount, brush: brush, label: Users[userHandle].name });
         }
         else if (currentColor > 510) {

            brush = dmz.ui.graph.createBrush({ r: 1, g: 1, b: ((currentColor - 510) / 255) });
            legend.push( { amt: amount, brush: brush, label: Users[userHandle].name });
         }
         currentColor += colorStep;
      });
      createPieChart
         ( legend
         , function (total) { return fieldName + " From User: (Total " + fieldName + ": " + total + ")"; }
         , Groups[groupHandle].ui.groupGraphicsScene
         , { x: xPos, y: yPos }
         );
   }
};

/* advisor graphs */

byAdvisor = function (groupHandle, fieldName, field, xPos, yPos) {

   var legend = []
     , colorNumber = 765
     , colorStep = 0
     , currentColor = 0
     , advisors = []
     , brush
     ;

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      advisors = Groups[groupHandle].advisors;
      colorStep = 765 / advisors.length;
      advisors.forEach(function (advisorHandle) {

         if (currentColor <= 255) {

            brush = dmz.ui.graph.createBrush({ r: (currentColor / 255), g: 0, b: 0 });
            legend.push(
               { amt: Advisors[advisorHandle][field].length
               , brush: brush
               , label: (Advisors[advisorHandle].name + " (" + Advisors[advisorHandle].title + ")")
               });
         }
         else if ((currentColor > 255) && (currentColor <= 510)) {

            brush = dmz.ui.graph.createBrush({ r: 1, g: ((currentColor - 255)) / 255, b: 0 });
            legend.push(
               { amt: Advisors[advisorHandle][field].length
               , brush: brush
               , label: (Advisors[advisorHandle].name + " (" + Advisors[advisorHandle].title + ")")
               });
         }
         else if (currentColor > 510) {

            brush = dmz.ui.graph.createBrush({ r: 1, g: 1, b: ((currentColor - 510) / 255) });
            legend.push(
               { amt: Advisors[advisorHandle][field].length
               , brush: brush
               , label: (Advisors[advisorHandle].name + " (" + Advisors[advisorHandle].title + ")")
               });
         }
         currentColor += colorStep;
      });
      createPieChart
         ( legend
         , function (total) { return fieldName + " By Advisor: (Total " + fieldName + ": " + total + ")"; }
         , Groups[groupHandle].ui.advisorGraphicsScene
         , { x: xPos, y: yPos }
         );
   }
};

/* all groups graphs */
byGroups = function (fieldName, field, xPos, yPos) {

   var legend = []
     , colorNumber = 765
     , colorStep = 0
     , currentColor = 0
     , brush
     , amount
     ;

   if (Groups && AllGroupsTab && AllGroupsTab.ui) {

      colorStep = 765 / Object.keys(Groups).length;
      Object.keys(Groups).forEach(function (key) {

         if (Groups[key][field].length !== undefined) { amount = Groups[key][field].length }
         else if (Groups[key][field] !== undefined) { amount = Groups[key][field] }
         else { self.log.error("Error Setting Value For", fieldName, "Chart"); amount = 0; }

         if (currentColor <= 255) {

            brush = dmz.ui.graph.createBrush({ r: (currentColor / 255), g: 0, b: 0 });
            legend.push( { amt: amount, brush: brush, label: Groups[key].name });
         }
         else if ((currentColor > 255) && (currentColor <= 510)) {

            brush = dmz.ui.graph.createBrush({ r: 1, g: ((currentColor - 255) / 255), b: 0 });
            legend.push( { amt: amount, brush: brush, label: Groups[key].name });
         }
         else if (currentColor > 510) {

            brush = dmz.ui.graph.createBrush({ r: 1, g: 1, b: ((currentColor - 510) / 255) });
            legend.push( { amt: amount, brush: brush, label: Groups[key].name });
         }
         currentColor += colorStep;
      });
      createPieChart
         ( legend
         , function (total) { return fieldName + " Per Group: (Total " + fieldName + ": " + total + ")"; }
         , AllGroupsTab.ui.graphicsScene
         , { x: xPos, y: yPos }
         );
   }
};

setUserPictureLabel = function (userHandle) {

   var pic;

   if (Users[userHandle] && Users[userHandle].ui) {

      pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(Users[userHandle].picture));
      if (pic) {

         pic = pic.scaled(50, 50);
         Users[userHandle].ui.userPictureLabel.pixmap(pic);
      }
   }
};

setVotesSeenLabel = function (userHandle) {

   var tempHandles
     , totalGroupVotes
     , latestGroupVoteTime = 0
     , latestUserTime = Users[userHandle].latestVoteTime
     , userSeenVotes
     , unseenVotes = 0
     ;

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].groupHandle) {

      totalGroupVotes = Groups[Users[userHandle].groupHandle].votes;
      totalGroupVotes.forEach(function (voteHandle) {

         var postedTime = 0
           , startTime = 0
           , endTime = 0
           , greaterThanUserTime = false;
           ;
         if (Votes[voteHandle]) {

            postedTime = Votes[voteHandle].postedTime;
            startTime = Votes[voteHandle].startTime;
            endTime = Votes[voteHandle].endTime;
            if ((postedTime && (postedTime > latestUserTime)) ||
               (startTime && (startTime > latestUserTime)) ||
               (endTime && (endTime > latestUserTime))) {

               greaterThanUserTime = true;
            }
            if (greaterThanUserTime) { unseenVotes += 1; }
         }
      });
      totalGroupVotes = totalGroupVotes.length;
      Users[userHandle].ui.votesSeenLabel.text("<b>Votes Seen: </b>" + (totalGroupVotes - unseenVotes) + "<b>/</b>" + totalGroupVotes);
   }
};

setLobbyistsSeenLabel = function (userHandle) {

   var tempHandles
     , totalGroupLobbyists
     , userSeenLobbyists
     ;

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].groupHandle &&
      Groups[Users[userHandle].groupHandle]) {

      Users[userHandle].ui.lobbyistsSeenLabel.text(
         "<b>Lobbyists Seen: </b>" +
         Users[userHandle].lobbyistsSeen.length +
         "<b>/</b>" +
         Groups[Users[userHandle].groupHandle].lobbyists.length);
   }
};

setNewspapersSeenLabel = function (userHandle) {

   var tempHandles
     , totalGroupNewspapers
     , userSeenNewspapers
     ;

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].groupHandle &&
      Groups[Users[userHandle].groupHandle]) {

      Users[userHandle].ui.newspapersSeenLabel.text(
         "<b>Newspapers Seen: </b>" +
         Users[userHandle].newspapersSeen.length +
         "<b>/</b>" +
         Groups[Users[userHandle].groupHandle].newspapers.length);
   }
};

setVideosSeenLabel = function (userHandle) {

   var tempHandles
     , totalGroupVideos
     , userSeenVideos
     ;

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].groupHandle &&
      Groups[Users[userHandle].groupHandle]) {

      Users[userHandle].ui.videosSeenLabel.text(
         "<b>Videos seen: </b>" +
         Users[userHandle].videosSeen.length +
         "<b>/</b>" +
         Groups[Users[userHandle].groupHandle].videos.length);
   }
};

setMemosSeenLabel = function (userHandle) {

   var tempHandles
     , totalGroupMemos
     , userSeenMemos
     ;

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].groupHandle &&
      Groups[Users[userHandle].groupHandle]) {

      Users[userHandle].ui.memosSeenLabel.text(
         "<b>Memos Seen: </b>" +
         Users[userHandle].lobbyistsSeen.length +
         "<b>/</b>" +
         Groups[Users[userHandle].groupHandle].lobbyists.length);
   }
};

setPdfItemsSeenLabel = function (userHandle) {

   var tempHandle
     , totalGroupPdfItems
     , userSeenPdfItems
     ;

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].groupHandle &&
      Groups[Users[userHandle].groupHandle]) {

      Users[userHandle].ui.pdfItemsSeenLabel.text(
         "<b>PDFs Seen: </b>" +
         Users[userHandle].pdfItemsSeen.length +
         "<b>/</b>" +
         Groups[Users[userHandle].groupHandle].pdfItems.length);
   }
};

setLastLoginSeenLabel = function (userHandle) {

   if (Users[userHandle] && Users[userHandle].ui) {

      Users[userHandle].ui.lastLoginLabel.text("");
   }
};

setUserNameLabel = function (userHandle) {

   if (Users[userHandle] && Users[userHandle].ui) {

      Users[userHandle].ui.userNameLabel.text("<b>User Name: </b>" + Users[userHandle].name);
   }
};

setVotedOnLabel = function (userHandle) {

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].groupHandle &&
      Groups[Users[userHandle].groupHandle]) {

      Users[userHandle].ui.votedOnLabel.text(
         "<b>Voted On: </b>" +
         (Users[userHandle].votedYesOn.length + Users[userHandle].votedNoOn.length) +
         "<b>/</b>" +
            (
            Groups[Users[userHandle].groupHandle].votesPassed.length +
            Groups[Users[userHandle].groupHandle].votesFailed.length +
            Groups[Users[userHandle].groupHandle].votesActive.length
            )
         );
   }
};

setDisturbanceInTheForceLabel = function (userHandle) {

};

setGoldAchievementsLabel = function (userHandle) {

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].ui.goldAchievementsLabel) {

      Users[userHandle].ui.goldAchievementsLabel.text(
         "<b>Gold Achievements: </b>" +
         Users[userHandle].goldAchievements +
         "/" +
         Users[userHandle].totalGoldAchievements);
   }
};

setSilverAchievementsLabel = function (userHandle) {

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].ui.silverAchievementsLabel) {

      Users[userHandle].ui.silverAchievementsLabel.text(
         "<b>Silver Achievements: </b>" +
         Users[userHandle].silverAchievements +
         "/" +
         Users[userHandle].totalSilverAchievements);
   }
};

setBronzeAchievementsLabel = function (userHandle) {

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].ui.bronzeAchievementsLabel) {

      Users[userHandle].ui.bronzeAchievementsLabel.text(
         "<b>Bronze Achievements: </b>" +
         Users[userHandle].bronzeAchievements +
         "/" +
         Users[userHandle].totalBronzeAchievements);
   }
};

setTotalLoginsLabel = function (userHandle) {

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].ui.totalLoginsLabel &&
      (Users[userHandle].totalLogins !== undefined)) {

      Users[userHandle].ui.totalLoginsLabel.text("<b>Total Logins: </b>" + Users[userHandle].totalLogins);
   }
};

setGroupNameLabel = function (groupHandle) {

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      Groups[groupHandle].ui.groupNameLabel.text("<b>Group Name: </b>" + Groups[groupHandle].name);
   }
};

setTotalPostsLabel = function (groupHandle) {

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      Groups[groupHandle].ui.totalPostsLabel.text("<b>Total Posts: </b>" + Groups[groupHandle].posts.length);
   }
};

setTotalCommentsLabel = function (groupHandle) {

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      Groups[groupHandle].ui.totalCommentsLabel.text("<b>Total Comments: </b>" + Groups[groupHandle].comments.length);
   }
};

setTotalVotesLabel = function (groupHandle) {

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      Groups[groupHandle].ui.totalVotesLabel.text("<b>Total Votes: </b>" + Groups[groupHandle].votes.length);
   }
};

setTotalQuestionsLabel = function (groupHandle) {

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      Groups[groupHandle].ui.totalQuestionsLabel.text("<b>Total Questions: </b>" + Groups[groupHandle].questions.length);
   }
};

setTotalMediaLabel = function (groupHandle) {

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      Groups[groupHandle].ui.totalMediaLabel.text(
         "<b>Total Media: </b>" +
         (
            Groups[groupHandle].memos.length +
            Groups[groupHandle].newspapers.length +
            Groups[groupHandle].videos.length +
            Groups[groupHandle].lobbyists.length));
   }
};

setMemberCountLabel = function (groupHandle) {

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      Groups[groupHandle].ui.memberCountLabel.text("<b>Total Members: </b>" + Groups[groupHandle].members.length);
   }
};

setDisturbanceInTheForceLabel = function (groupHandle) {

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      Groups[groupHandle].ui.disturbanceInTheForceLabel.text("<b>Disturbance In The Force Votes: </b>" + Groups[groupHandle].disturbances);
   }
};

createUserAchievementWidgets = function (userHandle) {

   var achievementWidget
     , highestAchievement
     , highestLevel
     ;

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].achievements &&
      Users[userHandle].groupHandle && Groups[Users[userHandle].groupHandle] && LayeredAchievements) {

      Object.keys(LayeredAchievements).forEach(function (key) {

         highestLevel = 0;
         LayeredAchievements[key].achievements.forEach(function (achievementItem) {

            if (Users[userHandle].achievements.and(achievementItem.achievement).bool()) {

               highestLevel = achievementItem.level;
            }
         });
         if (highestLevel) {

            if (highestLevel > LayeredAchievements[key].achievements.length) {

               highestLevel = LayeredAchievements[key].achievements.length;
            }
            highestAchievement = LayeredAchievements[key].achievements[highestLevel - 1];
            achievementWidget = dmz.ui.loader.load("AchievementItem.ui");
            achievementWidget.lookup("achievementTitleLabel").text("<b>Title: </b>" + highestAchievement.title);
            achievementWidget.lookup("achievementDescriptionLabel").text("<b>Description: </b>" + highestAchievement.description);
            achievementWidget.lookup("achievementPictureLabel").pixmap(highestAchievement.picturePixmap);
            if (highestAchievement.level === GOLD) {

               achievementWidget.styleSheet(GOLD_STYLE);
            }
            else if (highestAchievement.level === SILVER) {

               achievementWidget.styleSheet(SILVER_STYLE);
            }
            else if (highestAchievement.level === BRONZE) {

               achievementWidget.styleSheet(BRONZE_STYLE);
            }
            Users[userHandle].ui.achievements.push(achievementWidget);
            Users[userHandle].ui.achievementContentLayout.addWidget(achievementWidget);
         }
      });
   }
};

createUserWidget = function (userHandle) {

   var userWidget
     , achievementsWidget
     , userItem
     ;

   if (Users[userHandle]) {

      userItem = Users[userHandle];
      userWidget = dmz.ui.loader.load("UserInfoSubWidget.ui");
      achievementsWidget = dmz.ui.loader.load("WikiForm.ui");

      userItem.ui = { userWidget: userWidget, achievementsWidget: achievementsWidget, achievements: [] };
      userItem.ui.userPictureLabel = userWidget.lookup("userPictureLabel");
      userItem.ui.votesSeenLabel = userWidget.lookup("votesSeenLabel");
      userItem.ui.userNameLabel = userWidget.lookup("userNameLabel");
      userItem.ui.lastLoginLabel = userWidget.lookup("lastLoginLabel");
      userItem.ui.memosSeenLabel = userWidget.lookup("memosSeenLabel");
      userItem.ui.newspapersSeenLabel = userWidget.lookup("newspapersSeenLabel");
      userItem.ui.videosSeenLabel = userWidget.lookup("videosSeenLabel");
      userItem.ui.lobbyistsSeenLabel = userWidget.lookup("lobbyistsSeenLabel");
      userItem.ui.pdfItemsSeenLabel = userWidget.lookup("pdfItemsSeenLabel");
      userItem.ui.votedOnLabel = userWidget.lookup("votedOnLabel");
      userItem.ui.totalLoginsLabel = userWidget.lookup("disturbanceInTheForceLabel");
      userItem.ui.goldAchievementsLabel = userWidget.lookup("goldAchievementsLabel");
      userItem.ui.silverAchievementsLabel = userWidget.lookup("silverAchievementsLabel");
      userItem.ui.bronzeAchievementsLabel = userWidget.lookup("bronzeAchievementsLabel");
      userItem.ui.showUserStatisticsButton = userWidget.lookup("userStatisticsButton");
      userItem.ui.showUserAchievementsButton = userWidget.lookup("userAchievementsButton");
      userItem.ui.contentLayout = userWidget.lookup("contentLayout");
      userItem.ui.achievementContentLayout = achievementsWidget.lookup("wikiLayout");
      userItem.ui.graphicsScene = dmz.ui.graph.createScene();
      userItem.ui.graphicsView = dmz.ui.graph.createView(userItem.ui.graphicsScene);
      userItem.ui.graphicsView.alignment(dmz.ui.consts.AlignLeft | dmz.ui.consts.AlignTop);

      userItem.ui.showUserStatisticsButton.text("Show User Statistics");
      userItem.ui.showUserAchievementsButton.text("Show User Achievements");

      userItem.ui.userStatisticsWidgetOpen = false;
      userItem.ui.userAchievementsWidgetOpen = false;
      userItem.ui.showUserStatisticsButton.observe(self, "clicked", function () {

         if (userItem.ui.userStatisticsWidgetOpen) {

            userItem.ui.graphicsView.hide();
            userItem.ui.contentLayout.removeWidget(userItem.ui.graphicsView);
            userItem.ui.showUserStatisticsButton.text("Show User Statistics");
         }
         else {

            if (userItem.ui.userAchievementsWidgetOpen) {

               userItem.ui.achievementsWidget.hide();
               userItem.ui.contentLayout.removeWidget(userItem.ui.achievementsWidget);
               userItem.ui.showUserAchievementsButton.text("Show User Achievements");
               userItem.ui.userAchievementsWidgetOpen = false;
            }
            userItem.ui.contentLayout.insertWidget(0, userItem.ui.graphicsView);
            userItem.ui.graphicsView.show();
            userItem.ui.graphicsView.fixedHeight(600);
            userItem.ui.showUserStatisticsButton.text("Hide User Statistics");
         }
         userItem.ui.userStatisticsWidgetOpen = !userItem.ui.userStatisticsWidgetOpen;
      });
      userItem.ui.showUserAchievementsButton.observe(self, "clicked", function () {

         if (userItem.ui.userAchievementsWidgetOpen) {

            userItem.ui.achievementsWidget.hide();
            userItem.ui.contentLayout.removeWidget(userItem.ui.achievementsWidget);
            userItem.ui.showUserAchievementsButton.text("Show User Achievements");
         }
         else {

            if (userItem.ui.userStatisticsWidgetOpen) {

               userItem.ui.graphicsView.hide();
               userItem.ui.contentLayout.removeWidget(userItem.ui.graphicsView);
               userItem.ui.showUserStatisticsButton.text("Show User Statistics");
               userItem.ui.userStatisticsWidgetOpen = false;
            }
            userItem.ui.contentLayout.insertWidget(0, userItem.ui.achievementsWidget);
            userItem.ui.achievementsWidget.show();
            userItem.ui.showUserAchievementsButton.text("Hide User Achievements");
         }
         userItem.ui.userAchievementsWidgetOpen = !userItem.ui.userAchievementsWidgetOpen;
      });
      createUserAchievementWidgets(userItem.handle);
      setUserNameLabel(userItem.handle);
      setLastLoginSeenLabel(userItem.handle);
      setMemosSeenLabel(userItem.handle);
      setVideosSeenLabel(userItem.handle);
      setNewspapersSeenLabel(userItem.handle);
      setLobbyistsSeenLabel(userItem.handle);
      setPdfItemsSeenLabel(userItem.handle);
      setVotedOnLabel(userItem.handle);
      setUserPictureLabel(userItem.handle);
      setVotesSeenLabel(userItem.handle);
      setVoteDistributonPieChart(userItem.handle);
      votesCast(userItem.handle);
      voteAlignment(userItem.handle);
      postsVsComments(userItem.handle);
      tagTypes(userItem.handle);
      setGoldAchievementsLabel(userItem.handle);
      setSilverAchievementsLabel(userItem.handle);
      setBronzeAchievementsLabel(userItem.handle);
      setTotalLoginsLabel(userItem.handle);
   }
};

fillGroupInfoWidget = function (groupHandle) {

   var groupItem
     , groupWidget
     ;

   if (Groups[groupHandle] && Groups[groupHandle].ui) {

      groupItem = Groups[groupHandle];

      groupItem.ui.groupInfoWidget = dmz.ui.loader.load("UserInfoSubWidget.ui");
      groupWidget = groupItem.ui.groupInfoWidget;
      groupItem.ui.buttonLayout = groupWidget.lookup("buttonLayout");
      groupItem.ui.groupPictureLabel = groupWidget.lookup("userPictureLabel");
      groupItem.ui.groupNameLabel = groupWidget.lookup("userNameLabel");
      groupItem.ui.tempGroupLabel = groupWidget.lookup("lastLoginLabel");
      groupItem.ui.totalPostsLabel = groupWidget.lookup("memosSeenLabel");
      groupItem.ui.totalCommentsLabel = groupWidget.lookup("newspapersSeenLabel");
      groupItem.ui.totalVotesLabel = groupWidget.lookup("videosSeenLabel");
      groupItem.ui.totalQuestionsLabel = groupWidget.lookup("lobbyistsSeenLabel");
      groupItem.ui.totalMediaLabel = groupWidget.lookup("votesSeenLabel");
      groupWidget.lookup("pdfItemsSeenLabel").hide();
      groupWidget.lookup("goldAchievementsLabel").hide();
      groupWidget.lookup("silverAchievementsLabel").hide();
      groupWidget.lookup("bronzeAchievementsLabel").hide();
      groupItem.ui.disturbanceInTheForceLabel = groupWidget.lookup("disturbanceInTheForceLabel");
      groupItem.ui.memberCountLabel = groupWidget.lookup("votedOnLabel");
      groupItem.ui.showGroupStatisticsButton = groupWidget.lookup("userStatisticsButton");
      groupItem.ui.contentLayout = groupWidget.lookup("contentLayout");
      groupItem.ui.showAdvisorStatisticsButton = groupWidget.lookup("userAchievementsButton");
      groupItem.ui.showAdvisorStatisticsButton.text("Show Advisor Statistics");

      groupItem.ui.groupGraphicsScene = dmz.ui.graph.createScene();
      groupItem.ui.groupGraphicsView = dmz.ui.graph.createView(groupItem.ui.groupGraphicsScene);
      groupItem.ui.groupGraphicsView.alignment(dmz.ui.consts.AlignLeft | dmz.ui.consts.AlignTop);

      groupItem.ui.advisorGraphicsScene = dmz.ui.graph.createScene();
      groupItem.ui.advisorGraphicsView = dmz.ui.graph.createView(groupItem.ui.advisorGraphicsScene);
      groupItem.ui.advisorGraphicsView.alignment(dmz.ui.consts.AlignLeft | dmz.ui.consts.AlignTop);

      groupItem.ui.groupStatisticsWidgetOpen = false;
      groupItem.ui.advisorStatisticsWidgetOpen = false;

      groupItem.ui.showAdvisorStatisticsButton.observe(self, "clicked", function () {

         if (groupItem.ui.advisorStatisticsWidgetOpen) {

            groupItem.ui.advisorGraphicsView.hide();
            groupItem.ui.contentLayout.removeWidget(groupItem.ui.advisorGraphicsView);
            groupItem.ui.showAdvisorStatisticsButton.text("Show Advisor Statistics");
         }
         else {

            if (groupItem.ui.groupStatisticsWidgetOpen) {

               groupItem.ui.groupGraphicsView.hide();
               groupItem.ui.contentLayout.removeWidget(groupItem.ui.groupGraphicsView);
               groupItem.ui.showGroupStatisticsButton.text("Show Group Statistics");
               groupItem.ui.groupStatisticsWidgetOpen = false;
            }
            groupItem.ui.contentLayout.insertWidget(0, groupItem.ui.advisorGraphicsView);
            groupItem.ui.advisorGraphicsView.show();
            groupItem.ui.advisorGraphicsView.fixedHeight(900);
            groupItem.ui.showAdvisorStatisticsButton.text("Hide Advisor Statistics");
         }
         groupItem.ui.advisorStatisticsWidgetOpen = !groupItem.ui.advisorStatisticsWidgetOpen;
      });

      groupItem.ui.showGroupStatisticsButton.observe(self, "clicked", function () {

         if (groupItem.ui.groupStatisticsWidgetOpen) {

            groupItem.ui.groupGraphicsView.hide();
            groupItem.ui.contentLayout.removeWidget(groupItem.ui.groupGraphicsView);
            groupItem.ui.showGroupStatisticsButton.text("Show Group Statistics");
         }
         else {

            if (groupItem.ui.advisorStatisticsWidgetOpen) {

               groupItem.ui.advisorGraphicsView.hide();
               groupItem.ui.contentLayout.removeWidget(groupItem.ui.advisorGraphicsView);
               groupItem.ui.showAdvisorStatisticsButton.text("Show Advisor Statistics");
               groupItem.ui.advisorStatisticsWidgetOpen = false;
            }
            groupItem.ui.contentLayout.insertWidget(0, groupItem.ui.groupGraphicsView);
            groupItem.ui.groupGraphicsView.show();
            groupItem.ui.groupGraphicsView.fixedHeight(600);
            groupItem.ui.showGroupStatisticsButton.text("Hide Group Statistics");
         }
         groupItem.ui.groupStatisticsWidgetOpen = !groupItem.ui.groupStatisticsWidgetOpen;
      });

      groupItem.ui.groupPictureLabel.text("");
      groupItem.ui.tempGroupLabel.text("");
      setGroupNameLabel(groupHandle);
      setTotalPostsLabel(groupHandle);
      setTotalCommentsLabel(groupHandle);
      setTotalVotesLabel(groupHandle);
      setTotalQuestionsLabel(groupHandle);
      setTotalMediaLabel(groupHandle);
      setMemberCountLabel(groupHandle);
      setDisturbanceInTheForceLabel(groupHandle);

      groupVoteDistribution(groupHandle);
      byUser(groupHandle, "Votes Created", "votesCreated", 600, 0);
      byUser(groupHandle, "Posts Created", "posts", 0, 300);
      byUser(groupHandle, "Comments Created", "comments", 600 , 300);
      byUser(groupHandle, "Items Tagged", "totalTags", 0, 600);
      byUser(groupHandle, "Pdf Items Tagged", "pdfItemTags", 600, 600);
      byUser(groupHandle, "Votes Tagged", "voteTags", 0, 900);
      byUser(groupHandle, "Posts Tagged", "postTags", 600, 900)
      byUser(groupHandle, "Comments Tagged", "commentTags", 0, 1200);
      byUser(groupHandle, "Questions Tagged", "questionTags", 600, 1200);
      byUser(groupHandle, "Achievement Points", "achievementPoints", 0, 1500);
      byUser(groupHandle, "Gold Achievements", "goldAchievements", 600, 1500);
      byUser(groupHandle, "Silver Achievements", "silverAchievements", 0, 1800);
      byUser(groupHandle, "Bronze Achievements", "bronzeAchievements", 600, 1800);

      byAdvisor(groupHandle, "Votes", "votes", 0, 0);
      byAdvisor(groupHandle, "Questions", "questions", 600, 0);
      byAdvisor(groupHandle, "Votes Denied", "votesDenied", 0, 300);
      byAdvisor(groupHandle, "Votes Approved", "votesApproved", 600, 300);
      byAdvisor(groupHandle, "Votes Passed", "votesPassed", 0, 600);
      byAdvisor(groupHandle, "Votes Failed", "votesFailed", 600, 600);
   }
};

createGroupTabs = function () {

   var scrollArea
     , usersLayout
     , scrollLayout
     , scrollWidget
     , itors = {}
     , graphicsScene
     , graphicsView
     , graphicsLayout
     ;

   groupTabs.clear();

   scrollArea = dmz.ui.scrollArea.create();
   scrollWidget = dmz.ui.widget.create("scrollWidget");
   usersLayout = dmz.ui.layout.createVBoxLayout();
   usersLayout.addStretch(1);
   scrollWidget.layout(usersLayout);
   scrollArea.widget(scrollWidget);
   scrollArea.widgetResizable(true);
   groupTabs.add(scrollArea, "Group Comparisons");
   AllGroupsTab.ui = {};
   AllGroupsTab.ui.graphicsScene = dmz.ui.graph.createScene();
   graphicsView = dmz.ui.graph.createView(AllGroupsTab.ui.graphicsScene);
   graphicsView.alignment(dmz.ui.consts.AlignLeft | dmz.ui.consts.AlignTop);
   graphicsLayout = dmz.ui.layout.createVBoxLayout("graphicsLayout");
   scrollArea.layout(graphicsLayout);
   graphicsLayout.addWidget(graphicsView);

   byGroups("Votes", "votes", 0, 0);
   byGroups("Denied Votes", "votesDenied", 0, 600);
   byGroups("Approved Votes", "votesApproved", 600, 600);
   byGroups("Failed Votes", "votesFailed", 0, 900);
   byGroups("Passed Votes", "votesPassed", 600, 900);
   byGroups("Posts", "posts", 600, 0);
   byGroups("Comments", "comments", 0, 300);
   byGroups("Questions", "questions", 600, 300);
   byGroups("Tags", "totalTags", 0, 1200);
   byGroups("Achievement Points", "achievementPoints", 600, 1200);
   byGroups("Gold Achievements", "goldAchievements", 0, 1500);
   byGroups("Silver Achievements", "silverAchievements", 600, 1500);
   byGroups("Bronze Achievements", "bronzeAchievements", 0, 1800);

   Object.keys(Groups).forEach(function (key) {

      if (Groups[key].members.length) {

         scrollArea = dmz.ui.scrollArea.create();
         scrollWidget = dmz.ui.widget.create("scrollWidget");
         usersLayout = dmz.ui.layout.createVBoxLayout();
         usersLayout.addStretch(1);
         scrollWidget.layout(usersLayout);
         scrollArea.widget(scrollWidget);
         scrollArea.widgetResizable(true);

         groupTabs.add(scrollArea, Groups[key].name);
         Groups[key].ui = {};
         Groups[key].ui.usersLayout = usersLayout;
         fillGroupInfoWidget(key);
         Groups[key].ui.usersLayout.insertWidget(0, Groups[key].ui.groupInfoWidget);
      }
   });

   Object.keys(Users).forEach(function (key) {

      if (Users[key].groupHandle && !Users[key].adminFlag && Groups[Users[key].groupHandle] &&
         Groups[Users[key].groupHandle].ui && Groups[Users[key].groupHandle].ui.usersLayout) {

         createUserWidget(key);
         if (itors[Users[key].groupHandle] !== undefined) {

            itors[Users[key].groupHandle].itor += 1;
         }
         else { itors[Users[key].groupHandle] = { itor: 1 }; }
         Groups[Users[key].groupHandle].ui.usersLayout.insertWidget(
            itors[Users[key].groupHandle].itor, Users[key].ui.userWidget);
      }
   });
};

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.GroupType)) {

      Groups[objHandle] =
         { handle: objHandle
         , votes: []
         , votesPending: []
         , votesActive: []
         , votesDenied: []
         , votesPassed: []
         , votesFailed: []
         , votesCreated: []
         , votesApproved: []
         , memosCreated: []
         , newspapersCreated: []
         , videosCreated: []
         , lobbyistsCreated: []
         , pdfItemsCreated: []
         , memos: []
         , newspapers: []
         , videos: []
         , lobbyists: []
         , pdfItems: []
         , members: []
         , posts: []
         , comments: []
         , questions: []
         , advisors: []
         , memoTags: 0
         , newspaperTags: 0
         , videoTags: 0
         , lobbyistTags: 0
         , pdfItemTags: 0
         , voteTags: 0
         , postTags: 0
         , commentTags: 0
         , questionTags: 0
         , totalTags: 0
         , disturbances: 0
         , goldAchievements: 0
         , silverAchievements: 0
         , bronzeAchievements: 0
         , achievementPoints: 0
         };
   }
   else if (objType.isOfType(dmz.stance.UserType)) {

      Users[objHandle] =
         { handle: objHandle
         , votesPending: []
         , votesActive: []
         , votesDenied: []
         , votesPassed: []
         , votesFailed: []
         , votesCreated: []
         , votesApproved: []
         , votedNoOn: []
         , votedYesOn: []
         , memosCreated: []
         , videosCreated: []
         , newspapersCreated: []
         , lobbyistsCreated: []
         , pdfItemsCreated: []
         , memosSeen: []
         , videosSeen: []
         , newspapersSeen: []
         , lobbyistsSeen: []
         , pdfItemsSeen: []
         , posts: []
         , comments: []
         , questions: []
         , memoTags: 0
         , newspaperTags: 0
         , videoTags: 0
         , lobbyistTags: 0
         , pdfItemTags: 0
         , voteTags: 0
         , postTags: 0
         , commentTags: 0
         , questionTags: 0
         , totalTags: 0
         , bronzeAchievements: 0
         , totalBronzeAchievements: 0
         , silverAchievements: 0
         , totalSilverAchievements: 0
         , goldAchievements: 0
         , totalGoldAchievements: 0
         , achievementPoints: 0
         };
      dmz.time.setTimer(self, function () {

         Users[objHandle].latestVoteTime = dmz.stance.userAttribute(
            objHandle,
            dmz.stance.VoteTimeHandle);
         if (!((dmz.object.scalar(objHandle, dmz.stance.Permissions) === dmz.stance.STUDENT_PERMISSION) ||
            dmz.object.scalar(objHandle, dmz.stance.Permissions) === dmz.stance.OBSERVER_PERMISSION) || !Users[objHandle].active) {

            delete Users[objHandle];
         }
      });
   }
   else if (objType.isOfType(dmz.stance.MemoType)) {

      Memos[objHandle] = { handle: objHandle, tags: 0, tagField: "memoTags", cbField: "memosCreated" };
   }
   else if (objType.isOfType(dmz.stance.NewspaperType)) {

      Newspapers[objHandle] = { handle: objHandle, tags: 0, tagField: "newspaperTags", cbField: "newspapersCreated" };
   }
   else if (objType.isOfType(dmz.stance.VideoType)) {

      Videos[objHandle] = { handle: objHandle, tags: 0, tagField: "videoTags", cbField: "videosCreated" };
   }
   else if (objType.isOfType(dmz.stance.LobbyistType)) {

      Lobbyists[objHandle] = { handle: objHandle, tags: 0, tagField: "lobbyistTags", cbField: "lobbyistsCreated" };
   }
   else if (objType.isOfType(dmz.stance.PdfItemType)) {

      PdfItems[objHandle] = { handle: objHandle, tags: 0, tagField: "pdfItemTags", cbField: "pdfItemsCreated" };
   }
   else if (objType.isOfType(dmz.stance.VoteType)) {

      Votes[objHandle] = { handle: objHandle, tags: 0, tagField: "voteTags" , disturbance: false };
   }
   else if (objType.isOfType(dmz.stance.PostType)) {

      Posts[objHandle] =
         { handle: objHandle
         , comments: []
         , tags: 0
         , tagField: "postTags"
         , cbField: "posts"
         };
   }
   else if (objType.isOfType(dmz.stance.CommentType)) {

      Comments[objHandle] = { handle: objHandle, tags: 0, tagField: "commentTags", cbField: "comments" };
   }
   else if (objType.isOfType(dmz.stance.QuestionType)) {

      Questions[objHandle] = { handle: objHandle, tags: 0, tagField: "questionTags", cbField: "questions" };
   }
   else if (objType.isOfType(dmz.stance.AdvisorType)) {

      Advisors[objHandle] =
         { handle: objHandle
         , questions: []
         , votes: []
         , votesPending: []
         , votesActive: []
         , votesDenied: []
         , votesPassed: []
         , votesFailed: []
         , votesApproved: []
         };
   }
});

dmz.object.data.observe(self, dmz.stance.TagHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   var numOfTags = newVal.number(dmz.stance.TotalHandle, 0) || 0
     , data
     ;

   data =
      Votes[objHandle] || Memos[objHandle] || Newspapers[objHandle] || Videos[objHandle] ||
      Lobbyists[objHandle] || PdfItems[objHandle] || Posts[objHandle] || Comments[objHandle] ||
      Questions[objHandle];

   if (data) {

      data.tags = numOfTags;
      dmz.time.setTimer(self, function () {

         var user = data.createdByHandle ? Users[data.createdByHandle] : false;
         if (user) {

            user[data.tagField] += numOfTags;
            user.totalTags += numOfTags;
            if (Groups[user.groupHandle]) {

               Groups[user.groupHandle][data.tagField] += numOfTags;
               Groups[user.groupHandle].totalTags += numOfTags;
            }
         }
      });
   }
});

dmz.object.state.observe(self, dmz.stance.Achievements,
function (objHandle, attrHandle, state) {

   var highestLevel = 0;

   if (Users[objHandle] && !Users[objHandle].achievements) {

      Users[objHandle].achievements = state;
      dmz.time.setTimer(self, function () {

         if (Users[objHandle] && Users[objHandle].groupHandle && Groups[Users[objHandle].groupHandle]) {

            Object.keys(LayeredAchievements).forEach(function (key) {

               highestLevel = 0;
               LayeredAchievements[key].achievements.forEach(function (achievementItem) {

                  if (achievementItem.level === GOLD) {

                     Users[objHandle].totalGoldAchievements += 1;
                     if (state.and(achievementItem.achievement).bool()) {

                        highestLevel = achievementItem.level;
                        Users[objHandle].goldAchievements += 1;
                        Groups[Users[objHandle].groupHandle].goldAchievements += 1;
                     }
                  }
                  else if (achievementItem.level === SILVER) {

                     Users[objHandle].totalSilverAchievements += 1;
                     if (state.and(achievementItem.achievement).bool()) {

                        highestLevel = achievementItem.level;
                        Users[objHandle].silverAchievements += 1;
                        Groups[Users[objHandle].groupHandle].silverAchievements += 1;
                     }
                  }
                  else if (achievementItem.level === BRONZE) {

                     Users[objHandle].totalBronzeAchievements += 1;
                     if (state.and(achievementItem.achievement).bool()) {

                        highestLevel = achievementItem.level;
                        Users[objHandle].bronzeAchievements += 1;
                        Groups[Users[objHandle].groupHandle].bronzeAchievements += 1;
                     }
                  }
               });
               if (highestLevel) {

                  Users[objHandle].achievementPoints += highestLevel;
                  Groups[Users[objHandle].groupHandle].achievementPoints += highestLevel;
               }
            });
         }
      });
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Groups[objHandle]) { Groups[objHandle].name = newVal; }
   else if (Users[objHandle]) { Users[objHandle].uuid = newVal; }
   else if (Advisors[objHandle]) { Advisors[objHandle].name = newVal; }
});

dmz.object.text.observe(self, dmz.stance.DisplayNameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) { Users[objHandle].name = newVal; }
});

dmz.object.text.observe(self, dmz.stance.PictureHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) { Users[objHandle].picture = newVal; }
});

dmz.object.link.observe(self, dmz.stance.OriginalGroupHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Users[supHandle]) {

      Users[supHandle].groupHandle = subHandle;
      dmz.time.setTimer(self, function () {

         if (((dmz.object.scalar(supHandle, dmz.stance.Permissions) === dmz.stance.STUDENT_PERMISSION) ||
            dmz.object.scalar(supHandle, dmz.stance.Permissions) === dmz.stance.OBSERVER_PERMISSION) &&
            Users[supHandle] && Groups[subHandle]) {

            Groups[subHandle].members.push(supHandle);
         }
      });
   }
});

dmz.object.text.observe(self, dmz.stance.CommentHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Votes[objHandle]) { Votes[objHandle].advisorResponse = newVal; }
});

dmz.object.text.observe(self, dmz.stance.TextHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Votes[objHandle]) { Votes[objHandle].question = newVal; }
   else if (Memos[objHandle]) { Memos[objHandle].link = newVal; }
   else if (Newspapers[objHandle]) { Newspapers[objHandle].link = newVal; }
   else if (Videos[objHandle]) { Videos[objHandle].link = newVal; }
   else if (Lobbyists[objHandle]) { Lobbyists[objHandle].message = newVal; }
   else if (PdfItems[objHandle]) { PdfItems[objHandle].link = newVal; }
   else if (Comments[objHandle]) { Comments[objHandle].text = newVal; }
   else if (Posts[objHandle]) { Posts[objHandle].text = newVal; }
});

dmz.object.text.observe(self, dmz.stance.TitleHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   var data = Memos[objHandle] || Newspapers[objHandle] || Videos[objHandle] || Lobbyists[objHandle] || PdfItems[objHandle] || Advisors[objHandle];
   if (data) { data.title = newVal; }
});

dmz.object.flag.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   var data = Memos[objHandle] || Newspapers[objHandle] || Videos[objHandle] || Lobbyists[objHandle] || PdfItems[objHandle] || Users[objHandle];
   if (data) { data.active = newVal; }
});

dmz.object.flag.observe(self, dmz.stance.DisruptTheForceFlag,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Votes[objHandle]) { Votes[objHandle].disturbance = true; }
   dmz.time.setTimer(self, function () {

      if (Groups[Votes[objHandle].groupHandle]) {

         Groups[Votes[objHandle].groupHandle].disturbances += 1;
      }
   });
});

dmz.object.scalar.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) { Users[objHandle].totalLogins = newVal; }
});

dmz.object.text.observe(self, dmz.stance.NameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Lobbyists[objHandle]) { Lobbysts[objHandle].name = newVal; }
});

dmz.object.scalar.observe(self, dmz.stance.VoteState,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Votes[objHandle]) { Votes[objHandle].state = newVal; }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Votes[objHandle]) { Votes[objHandle].postedTime = newVal; }
});

dmz.object.timeStamp.observe(self, dmz.stance.ExpiredAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Votes[objHandle]) { Votes[objHandle].expiredTime = newVal; }
});

dmz.object.timeStamp.observe(self, dmz.stance.EndedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Votes[objHandle]) { Votes[objHandle].endTime = newVal; }
});

dmz.object.link.observe(self, dmz.stance.MediaHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (dmz.object.type(supHandle).isOfType(dmz.stance.MemoType)) {

      dmz.time.setTimer(self, function () {

         if (Memos[supHandle].active) {

            if (Users[subHandle]) { Users[subHandle].memosSeen.push(supHandle); }
            else if (Groups[subHandle]) { Groups[subHandle].memos.push(subHandle); }
         }
      });
   }
   else if (dmz.object.type(supHandle).isOfType(dmz.stance.NewspaperType)) {

      dmz.time.setTimer(self, function () {

         if (Newspapers[supHandle].active) {

            if (Users[subHandle]) { Users[subHandle].newspapersSeen.push(supHandle); }
            else if (Groups[subHandle]) { Groups[subHandle].newspapers.push(subHandle); }
         }
      });
   }
   else if (dmz.object.type(supHandle).isOfType(dmz.stance.VideoType)) {

      dmz.time.setTimer(self, function () {

         if (Videos[supHandle].active) {

            if (Users[subHandle]) { Users[subHandle].videosSeen.push(supHandle); }
            else if (Groups[subHandle]) { Groups[subHandle].videos.push(subHandle); }
         }
      });
   }
   else if (dmz.object.type(supHandle).isOfType(dmz.stance.LobbyistType)) {

      dmz.time.setTimer(self, function () {

         if (Lobbyists[supHandle].active) {

            if (Users[subHandle]) { Users[subHandle].lobbyistsSeen.push(supHandle); }
            else if (Groups[subHandle]) { Groups[subHandle].lobbyists.push(subHandle); }
         }
      });
   }
   else if (dmz.object.type(supHandle).isOfType(dmz.stance.PdfItemType)) {

      dmz.time.setTimer(self, function () {

         if (PdfItems[supHandle].active) {

            if (Users[subHandle]) { Users[subHandle].pdfItemsSeen.push(supHandle); }
            else if (Groups[subHandle]) { Groups[subHandle].pdfItems.push(supHandle); }
         }
      });
   }
});

dmz.object.link.observe(self, dmz.stance.VoteLinkHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Votes[supHandle]) {

      Votes[supHandle].advisorHandle = subHandle;
      dmz.time.setTimer(self, function () {

         var fields = false;
         if (Advisors[subHandle]) {

            Advisors[subHandle].votes.push(supHandle);
            switch (Votes[supHandle].state) {

               case dmz.stance.VOTE_APPROVAL_PENDING: fields = [ "votesPending" ]; break;
               case dmz.stance.VOTE_DENIED: fields = [ "votesDenied" ]; break;
               case dmz.stance.VOTE_ACTIVE: fields = [ "votesActive", "votesApproved" ]; break;
               case dmz.stance.VOTE_YES: fields = [ "votesPassed", "votesApproved" ]; break;
               case dmz.stance.VOTE_NO: fields = [ "votesFailed", "votesApproved" ]; break;
               default: break;
            }
            if (fields) {

               fields.forEach(function (field) { Advisors[subHandle][field].push(supHandle); });
            }
         }
      });
   }
});

dmz.object.link.observe(self, dmz.stance.VoteGroupHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Votes[supHandle]) {

      Votes[supHandle].groupHandle = subHandle;
      dmz.time.setTimer(self, function () {

         var fields = false;
         if (Groups[subHandle]) {

            Groups[subHandle].votes.push(supHandle);
            switch (Votes[supHandle].state) {

               case dmz.stance.VOTE_APPROVAL_PENDING: fields = [ "votesPending" ]; break;
               case dmz.stance.VOTE_DENIED: fields = [ "votesDenied" ]; break;
               case dmz.stance.VOTE_ACTIVE: fields = [ "votesActive", "votesApproved" ]; break;
               case dmz.stance.VOTE_YES: fields = [ "votesPassed", "votesApproved" ]; break;
               case dmz.stance.VOTE_NO: fields = [ "votesFailed", "votesApproved" ]; break;
               default: break;
            }
            if (fields) {

               fields.forEach(function (field) { Groups[subHandle][field].push(supHandle); });
            }
         }
      });
   }
});

dmz.object.link.observe(self, dmz.stance.AdvisorGroupHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Advisors[supHandle]) {

      Advisors[supHandle].groupHandle = subHandle;
      dmz.time.setTimer(self, function () {

         if (Groups[subHandle]) { Groups[subHandle].advisors.push(supHandle); }
      });
   }
});

dmz.object.link.observe(self, dmz.stance.CreatedByHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   var data
     , setGroup = false
     ;
   if (Votes[supHandle]) {

      Votes[supHandle].createdByHandle = subHandle;
      dmz.time.setTimer(self, function () {

         var fields
           , permissions = dmz.object.scalar(subHandle, dmz.stance.Permissions)
           ;
         if (Users[subHandle] && Users[subHandle].active &&
            ((permissions === dmz.stance.STUDENT_PERMISSION) ||
               (permissions === dmz.stance.OBSERVER_PERMISSION))) {

            Users[subHandle].votesCreated.push(subHandle);

            switch (Votes[supHandle].state) {

               case dmz.stance.VOTE_APPROVAL_PENDING: fields = [ "votesPending" ]; break;
               case dmz.stance.VOTE_DENIED: fields = [ "votesDenied" ]; break;
               case dmz.stance.VOTE_ACTIVE: fields = [ "votesActive", "votesApproved" ]; break;
               case dmz.stance.VOTE_YES: fields = [ "votesPassed", "votesApproved" ]; break;
               case dmz.stance.VOTE_NO: fields = [ "votesFailed", "votesApproved" ]; break;
               default: break;
            }

            if (fields) {

               fields.forEach(function (field) { Users[subHandle][field].push(supHandle); });
            }
         }
      });
   }
   else {

      data = Posts[supHandle] || Comments[supHandle] || Questions[supHandle];
      if (!data) {

         setGroup = true;
         data = Memos[supHandle] || Newspapers[supHandle] || Videos[supHandle] || Lobbyists[supHandle] || PdfItems[supHandle];
      }

      if (data) {

         if (Posts[supHandle] || Comments[supHandle]) { data.createdByHandle = subHandle; }
         dmz.time.setTimer(self, function () {

            var permissions = dmz.object.scalar(subHandle, dmz.stance.Permissions)
              , user = Users[subHandle]
              ;
            if (user && user.active &&
               ((permissions === dmz.stance.STUDENT_PERMISSION) ||
                  permissions === dmz.stance.OBSERVER_PERMISSION)) {

               user[data.cbField].push(supHandle);
               if (setGroup && user.groupHandle && Groups[user.groupHandle]) {

                  Groups[user.groupHandle][data.cbField].push(supHandle);
               }
            }
         });
      }
   }
});

dmz.object.link.observe(self, dmz.stance.ParentHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Comments[supHandle]) {

      dmz.time.setTimer(self, function () {

         var tempHandles;

         if (Posts[subHandle]) {

            Comments[supHandle].parentPost = subHandle;
            Posts[subHandle].comments.push(supHandle);

            tempHandles = dmz.object.subLinks(subHandle, dmz.stance.ParentHandle);
            if (tempHandles) {

               tempHandles = dmz.object.subLinks(tempHandles[0], dmz.stance.ForumLink);
               if (tempHandles && Groups[tempHandles[0]]) {

                  Groups[tempHandles[0]].comments.push(supHandle);
               }
            }
         }
      });
   }
   else if (Posts[supHandle]) {

      dmz.time.setTimer(self, function () {

         var tempHandles;

         if (!Posts[subHandle]) {

            dmz.time.setTimer(self, function () {

               var tempHandles;

               tempHandles = dmz.object.subLinks(subHandle, dmz.stance.ForumLink);
               if (tempHandles && Groups[tempHandles[0]]) {

                  Groups[tempHandles[0]].posts.push(supHandle);
               }
            });
         }
      });
   }
});

dmz.object.link.observe(self, dmz.stance.QuestionLinkHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Questions[supHandle]) {

      dmz.time.setTimer(self, function () {

         var tempHandles = dmz.object.subLinks(subHandle, dmz.stance.AdvisorGroupHandle);

         if (tempHandles && Groups[tempHandles[0]]) {

            Groups[tempHandles[0]].questions.push(supHandle);
         }
         if (Advisors[subHandle]) { Advisors[subHandle].questions.push(subHandle); }
      });
   }
});

dmz.object.link.observe(self, dmz.stance.VoteGroupHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Votes[supHandle]) { Votes[supHandle].groupHandle = subHandle; }
});

dmz.object.link.observe(self, dmz.stance.NoHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Votes[subHandle]) {

      Votes[subHandle].noVotes = (Votes[subHandle].noVotes || 0) + 1;
      dmz.time.setTimer (self, function () {

         if (Users[supHandle] && ((dmz.object.scalar(supHandle, dmz.stance.Permissions) === dmz.stance.STUDENT_PERMISSION) ||
            dmz.object.scalar(supHandle, dmz.stance.Permissions) === dmz.stance.OBSERVER_PERMISSION) &&
            Users[supHandle].active) {

            Users[supHandle].votedNoOn.push(subHandle);
         }
      });
   }
});

dmz.object.link.observe(self, dmz.stance.YesHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Votes[subHandle]) {

      Votes[subHandle].noVotes = (Votes[subHandle].yesVotes || 0) + 1;
      dmz.time.setTimer (self, function () {

         if (Users[supHandle] && ((dmz.object.scalar(supHandle, dmz.stance.Permissions) === dmz.stance.STUDENT_PERMISSION) ||
            dmz.object.scalar(supHandle, dmz.stance.Permissions) === dmz.stance.OBSERVER_PERMISSION) &&
            Users[supHandle].active) {

            Users[supHandle].votedYesOn.push(subHandle);
         }
      });
   }
});

dmz.module.subscribe(self, "achievements", function (Mode, module) {

   if (Mode === dmz.module.Activate) {

      LayeredAchievements = module.LayeredAchievements;
      NonLayeredAchievements = module.NonLayeredAchievements;
   }
});
