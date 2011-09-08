require("datejs/date");

var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , spinBox: require("dmz/ui/spinBox")
      , graph: require("dmz/ui/graph")
      , layout: require("dmz/ui/layout")
      , label: require("dmz/ui/label")
      , loader: require('dmz/ui/uiLoader')
      , textEdit: require("dmz/ui/textEdit")
      , widget: require("dmz/ui/widget")
      , scrollArea: require("dmz/ui/scrollArea")
      , webview: require("dmz/ui/webView")
      }
   , stance: require("stanceConst")
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
   , ShowStudentsMessage = dmz.message.create("showStudentsWindow")

   // UI
   , userInfoWidget = dmz.ui.loader.load("UserInfoWidget.ui")
   , groupTabs = userInfoWidget.lookup("groupTabs")
   , userStatisticsWidget = dmz.ui.webview.create("userStatistics")

   // Functions
   , toDate = dmz.util.timeStampToDate
   , setUserPictureLabel
   , setVotesSeenLabel
   , setLobbyistsSeenLabel
   , setNewspapersSeenLabel
   , setVideosSeenLabel
   , setMemosSeenLabel
   , setLastLoginSeenLabel
   , setStatisticsHtml
   , setUserNameLabel
   , initializeUserVoteData
   , createUserWidget
   , createGroupTabs
   , init
   ;

ShowStudentsMessage.subscribe(self, function () {

   createGroupTabs();
   userInfoWidget.show();
});

setUserPictureLabel = function (userHandle) {

   var pic;

   if (Users[userHandle]) {

      pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(Users[userHandle].picture));
      pic = pic.scaled(50, 50);
      Users[userHandle].ui.userPictureLabel.pixmap(pic);
   }
};

setVotesSeenLabel = function (userHandle) {

   var tempHandles
     , totalGroupVotes
     , latestGroupVoteTime = 0
     , latestUserTime = dmz.stance.userAttribute(userHandle, dmz.stance.VoteTimeHandle)
     , userSeenVotes
     , decisionHandle
     , unseenVotes = 0
     ;

   if (Users[userHandle] && Users[userHandle].groupHandle) {

      totalGroupVotes = dmz.object.superLinks(Users[userHandle].groupHandle, dmz.stance.VoteGroupHandle) || [];
      totalGroupVotes.forEach(function (voteHandle) {

         var createdTime = 0
           , approvedTime = 0
           , endedTime = 0
           , greaterThanUserTime = false;
           ;

         createdTime = dmz.object.timeStamp(voteHandle, dmz.stance.CreatedAtServerTimeHandle);
         decisionHandle = dmz.object.superLinks(voteHandle, dmz.stance.VoteLinkHandle);
         if (decisionHandle) {

            decisionHandle = decisionHandle[0];
            approvedTime = dmz.object.timeStamp(decisionHandle, dmz.stance.CreatedAtServerTimeHandle);
            endedTime = dmz.object.timeStamp(decisionHandle, dmz.stance.EndedAtServerTimeHandle);
         }
         if ((createdTime && (createdTime > latestUserTime)) ||
            (approvedTime && (approvedTime > latestUserTime)) ||
            (endedTime && (endedTime > latestUserTime))) {

            greaterThanUserTime = true;
         }
         if (greaterThanUserTime) {

            unseenVotes += 1;
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

   if (Users[userHandle] && Users[userHandle].groupHandle) {

      tempHandles = dmz.object.superLinks(Users[userHandle].groupHandle, dmz.stance.MediaHandle) || [];
      totalGroupLobbyists = tempHandles.filter(function (mediaItem) {

         return (dmz.object.type(mediaItem).isOfType(dmz.stance.LobbyistType) && dmz.object.flag(mediaItem, dmz.stance.ActiveHandle));
      });
      totalGroupLobbyists = totalGroupLobbyists.length;
      tempHandles = dmz.object.superLinks(userHandle, dmz.stance.MediaHandle) || [];
      userSeenLobbyists = tempHandles.filter(function (mediaItem) {

         return (dmz.object.type(mediaItem).isOfType(dmz.stance.LobbyistType) && dmz.object.flag(mediaItem, dmz.stance.ActiveHandle));
      });
      userSeenLobbyists = userSeenLobbyists.length;
      Users[userHandle].ui.lobbyistsSeenLabel.text("<b>Lobbyists Seen: </b>" + userSeenLobbyists + "<b>/</b>" + totalGroupLobbyists);
   }
};

setNewspapersSeenLabel = function (userHandle) {

   var tempHandles
     , totalGroupNewspapers
     , userSeenNewspapers
     ;

   if (Users[userHandle] && Users[userHandle].groupHandle) {

      tempHandles = dmz.object.superLinks(Users[userHandle].groupHandle, dmz.stance.MediaHandle) || [];
      totalGroupNewspapers = tempHandles.filter(function (mediaItem) {

         return (dmz.object.type(mediaItem).isOfType(dmz.stance.NewspaperType) && dmz.object.flag(mediaItem, dmz.stance.ActiveHandle));
      });
      totalGroupNewspapers = totalGroupNewspapers.length;
      tempHandles = dmz.object.superLinks(userHandle, dmz.stance.MediaHandle) || [];
      userSeenNewspapers = tempHandles.filter(function (mediaItem) {

         return (dmz.object.type(mediaItem).isOfType(dmz.stance.NewspaperType) && dmz.object.flag(mediaItem, dmz.stance.ActiveHandle));
      });
      userSeenNewspapers = userSeenNewspapers.length;
      Users[userHandle].ui.newspapersSeenLabel.text("<b>Newspapers Seen: </b>" + userSeenNewspapers + "<b>/</b>" + totalGroupNewspapers);
   }
};

setVideosSeenLabel = function (userHandle) {

   var tempHandles
     , totalGroupVideos
     , userSeenVideos
     ;

   if (Users[userHandle] && Users[userHandle].groupHandle) {

      tempHandles = dmz.object.superLinks(Users[userHandle].groupHandle, dmz.stance.MediaHandle) || [];
      totalGroupVideos = tempHandles.filter(function (mediaItem) {

         return (dmz.object.type(mediaItem).isOfType(dmz.stance.VideoType) && dmz.object.flag(mediaItem, dmz.stance.ActiveHandle));
      });
      totalGroupVideos = totalGroupVideos.length;
      tempHandles = dmz.object.superLinks(userHandle, dmz.stance.MediaHandle) || [];
      userSeenVideos = tempHandles.filter(function (mediaItem) {

         return (dmz.object.type(mediaItem).isOfType(dmz.stance.VideoType) && dmz.object.flag(mediaItem, dmz.stance.ActiveHandle));
      });
      userSeenVideos = userSeenVideos.length;
      Users[userHandle].ui.videosSeenLabel.text("<b>Videos Seen: </b>" + userSeenVideos + "<b>/</b>" + totalGroupVideos);
   }
};

setMemosSeenLabel = function (userHandle) {

   var tempHandles
     , totalGroupMemos
     , userSeenMemos
     ;

   if (Users[userHandle] && Users[userHandle].groupHandle) {

      tempHandles = dmz.object.superLinks(Users[userHandle].groupHandle, dmz.stance.MediaHandle) || [];
      totalGroupMemos = tempHandles.filter(function (mediaItem) {

         return (dmz.object.type(mediaItem).isOfType(dmz.stance.MemoType) && dmz.object.flag(mediaItem, dmz.stance.ActiveHandle));
      });
      totalGroupMemos = totalGroupMemos.length;
      tempHandles = dmz.object.superLinks(userHandle, dmz.stance.MediaHandle) || [];
      userSeenMemos = tempHandles.filter(function (mediaItem) {

         return (dmz.object.type(mediaItem).isOfType(dmz.stance.MemoType) && dmz.object.flag(mediaItem, dmz.stance.ActiveHandle));
      });
      userSeenMemos = userSeenMemos.length;
      Users[userHandle].ui.memosSeenLabel.text("<b>Memos Seen: </b>" + userSeenMemos + "<b>/</b>" + totalGroupMemos);
   }
};

setLastLoginSeenLabel = function (userHandle) {

   if (Users[userHandle]) {

      Users[userHandle].ui.lastLoginLabel.text("<b>Time currently not supported. </b>");
   }
};

setUserNameLabel = function (userHandle) {

   if (Users[userHandle]) {

      Users[userHandle].ui.userNameLabel.text("<b>User Name: </b>" + Users[userHandle].name);
   }
};

initializeUserVoteData = function () {

   var tempHandles
     , voteHandles
     , voteState
     , tempUserHandle
     ;

   Object.keys(Users).forEach(function (key) {

      Users[key].votesPending = 0;
      Users[key].votesDenied = 0;
      Users[key].votesActive = 0;
      Users[key].votesPassed = 0;
      Users[key].votesFailed = 0;
      Users[key].totalVotes = 0;
   });
   tempHandles = dmz.object.getObjects() || [];
   voteHandles = tempHandles.filter(function (item) {

      return dmz.object.type(item).isOfType(dmz.stance.VoteType);
   });
   voteHandles.forEach(function (voteHandle) {

      voteState = dmz.object.scalar(voteHandle, dmz.stance.VoteState);
      tempHandles = dmz.object.subLinks(voteHandle, dmz.stance.CreatedByHandle);
      if (tempHandles && Users[tempHandles[0]]) {

         tempUserHandle = tempHandles[0];
         if (voteState === 0) {

            Users[tempUserHandle].votesPending += 1;
         }
         else if (voteState === 1) {

            Users[tempUserHandle].votesDenied += 1;
         }
         else if (voteState === 2) {

            Users[tempUserHandle].votesActive += 1;
         }
         else if (voteState === 3) {

            Users[tempUserHandle].votesPassed += 1;
         }
         else if (voteState === 4) {

            Users[tempUserHandle].votesFailed += 1;
         }
         Users[tempUserHandle].totalVotes += 1;
      }
   });
};

setStatisticsHtml = function (userHandle) {

   var html;

   initializeUserVoteData();

   self.log.error(Users[userHandle].votesPending, Users[userHandle].votesDenied, Users[userHandle].votesActive);
   // Page opening
   html = "<html><head><script type='text/javascript' src='https://www.google.com/jsapi'></script>";
   html += "<script type='text/javascript'>google.load('visualization', '1.0', {'packages':['corechart']});";
   html += "google.setOnLoadCallback(drawVotePieChart);"

   // Vote Statistics Pie Chart
   html += "function drawVotePieChart() { var data = new google.visualization.DataTable();";
   html += "data.addColumn('string', 'State'); data.addColumn('number', 'Votes'); data.addRows([ ['Denied', " + Users[userHandle].votesDenied + "],";
   html += "['Passed', " + Users[userHandle].votesPassed + "], ['Failed', " + Users[userHandle].votesFailed + "], ['Active', " +  Users[userHandle].votesActive +"] ]);";
   html += "var options = {'title':'Vote Breakdown (Total Votes Proposed: " + Users[userHandle].totalVotes + ")', 'width':600, 'height':450, 'is3D':true };";
   html += "var chart = new google.visualization.PieChart(document.getElementById('chart_div'));";
   html += "chart.draw(data, options); } "

   // Compared with other users bar graph
   //html += "function drawUserComparisonChart() { var data = new google.visualization.DataTable();";
   //html += "data.addColumn('string', 'name'); data.addColumn('number', 'Votes')";

   html += "</script></head><body><center> <div id='chart_div'></div></center></body></html>";
   userStatisticsWidget.setHtml(html);
};

createUserWidget = function (userHandle) {

   var userWidget
     , userItem
     ;

   if (Users[userHandle]) {

      userItem = Users[userHandle];
      userWidget = dmz.ui.loader.load("UserInfoSubWidget.ui");
      userItem.ui = { userWidget: userWidget };
      userItem.ui.userPictureLabel = userWidget.lookup("userPictureLabel");
      userItem.ui.votesSeenLabel = userWidget.lookup("votesSeenLabel");
      userItem.ui.userNameLabel = userWidget.lookup("userNameLabel");
      userItem.ui.lastLoginLabel = userWidget.lookup("lastLoginLabel");
      userItem.ui.memosSeenLabel = userWidget.lookup("memosSeenLabel");
      userItem.ui.newspapersSeenLabel = userWidget.lookup("newspapersSeenLabel");
      userItem.ui.videosSeenLabel = userWidget.lookup("videosSeenLabel");
      userItem.ui.lobbyistsSeenLabel = userWidget.lookup("lobbyistsSeenLabel");
      userItem.ui.showForumPostsButton = userWidget.lookup("showForumPostsButton");
      userItem.ui.showVoteStatisticsButton = userWidget.lookup("showVoteStatisticsButton");
      userItem.ui.showUserStatisticsButton = userWidget.lookup("userStatisticsButton");
      userItem.ui.contentLayout = userWidget.lookup("contentLayout");
      userItem.ui.userStatisticsWidgetOpen = false;

      userItem.ui.showUserStatisticsButton.observe(self, "clicked", function () {

         if (userItem.ui.userStatisticsWidgetOpen) {

            userStatisticsWidget.hide();
            userItem.ui.contentLayout.removeWidget(userStatisticsWidget);
         }
         else {

            userItem.ui.contentLayout.insertWidget(0, userStatisticsWidget);
            userStatisticsWidget.show();
            userStatisticsWidget.fixedHeight(600);
            setStatisticsHtml(userHandle);
         }
         userItem.ui.userStatisticsWidgetOpen = !userItem.ui.userStatisticsWidgetOpen;
      });

      setUserNameLabel(userItem.handle);
      setLastLoginSeenLabel(userItem.handle);
      setMemosSeenLabel(userItem.handle);
      setVideosSeenLabel(userItem.handle);
      setNewspapersSeenLabel(userItem.handle);
      setLobbyistsSeenLabel(userItem.handle);
      setUserPictureLabel(userItem.handle);
      setVotesSeenLabel(userItem.handle);
   }
};

createGroupTabs = function () {

   var scrollArea
     , usersLayout
     , scrollLayout
     , scrollWidget
     , itors = {}
     ;

   groupTabs.clear();
   Object.keys(Groups).forEach(function (key) {

      scrollArea = dmz.ui.scrollArea.create();
      scrollWidget = dmz.ui.widget.create("scrollWidget");
      usersLayout = dmz.ui.layout.createVBoxLayout();
      usersLayout.addStretch(1);
      scrollWidget.layout(usersLayout);
      scrollArea.widget(scrollWidget);
      scrollArea.widgetResizable(true);

      groupTabs.add(scrollArea, Groups[key].name);
      Groups[key].usersLayout = usersLayout;
   });

   Object.keys(Users).forEach(function (key) {

      if (Users[key].groupHandle && Groups[Users[key].groupHandle] &&
         Groups[Users[key].groupHandle].usersLayout) {

         createUserWidget(key);
         if (itors[Users[key].groupHandle] !== undefined) {

            itors[Users[key].groupHandle].itor += 1;
         }
         else {

            itors[Users[key].groupHandle] = { itor: 0 };
         }
         Groups[Users[key].groupHandle].usersLayout.insertWidget(
            itors[Users[key].groupHandle].itor, Users[key].ui.userWidget);
      }
   });
};

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.GroupType)) {

      Groups[objHandle] =
         { handle: objHandle
         , totalVotes: 0
         };
   }
   if (objType.isOfType(dmz.stance.UserType)) {

      Users[objHandle] =
         { handle: objHandle
         , votesPending: 0
         , votesActive: 0
         , votesDenied: 0
         , votesPassed: 0
         , votesFailed: 0
         , totalVotes: 0
         };
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Groups[objHandle]) {

      Groups[objHandle].name = newVal;
   }
   if (Users[objHandle]) {

      Users[objHandle].uuid = newVal;
   }
});

dmz.object.text.observe(self, dmz.stance.DisplayNameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) {

      Users[objHandle].name = newVal;
   }
});

dmz.object.text.observe(self, dmz.stance.PictureHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) {

      Users[objHandle].picture = newVal;
   }
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Users[supHandle]) {

      Users[supHandle].groupHandle = subHandle;
   }
});

