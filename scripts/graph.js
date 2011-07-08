require("datejs/date"); // www.datejs.com - an open-source JavaScript Date Library.

var dmz =
   { ui:
      { consts: require("dmz/ui/consts")
      , layout: require("dmz/ui/layout")
      , loader: require("dmz/ui/uiLoader")
      , mainWindow: require("dmz/ui/mainWindow")
      , graph: require("dmz/ui/graph")
      , event: require("dmz/ui/event")
      , label: require("dmz/ui/label")
      , button: require("dmz/ui/button")
      , tabWidget: require("dmz/ui/tabWidget")
      , webview: require("dmz/ui/webView")
      , widget: require("dmz/ui/widget")
      , textEdit: require("dmz/ui/textEdit")
      , lineEdit: require("dmz/ui/lineEdit")
      }
   , config: require("dmz/runtime/config")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   , message: require("dmz/runtime/messaging")
   , resources: require("dmz/runtime/resources")
   , stance: require("stanceConst")
   , vector: require("dmz/types/vector")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   , sys: require("sys")
   }

   // UI Elements
   , graphWindow = dmz.ui.loader.load("AARForm.ui")
   , graphWindowScene = -1
   , graphicsView = graphWindow.lookup("aarGraphicsView")
   , groupViewTypeList = graphWindow.lookup("groupViewTypeList")
   , groupList = graphWindow.lookup("groupList")
   , userLayout = graphWindow.lookup("userLayout")
   , groupLayout = graphWindow.lookup("groupLayout")
   , objectTypeLayout = graphWindow.lookup("objectTypeLayout")
   , stackedWidget = graphWindow.lookup("stackedWidget")
   , intervalAmtBox = graphWindow.lookup("intervalAmtBox")
   , intervalTypeBox = graphWindow.lookup("intervalTypeBox")
//   , startDateBox = graphWindow.lookup("startDate")
//   , endDateBox = graphWindow.lookup("endDate")

   , graphDialog = dmz.ui.loader.load("AARDialog.ui", graphWindow)
   , scrollArea = graphDialog.lookup("scrollArea")
   , scrollLayout = dmz.ui.layout.createVBoxLayout()

   // Consts
   , StdBox =
        { x: 0
        , y: 0
        , w: 40
        , h: -40
        , space: 5
        }
   , ObjectTypeData = {}
   , ObjectTypeList =
        [ dmz.stance.CommentType
        , dmz.stance.LobbyistType
        , dmz.stance.MemoType
        , dmz.stance.NewspaperType
        , dmz.stance.PinType
        , dmz.stance.PostType
        , dmz.stance.QuestionType
//        , dmz.stance.VideoType
        ]
   , HandleIndex = 0

   , Interval = { days: 1, weeks: 7 }
   , GraphType = { Game: 0, Group: 1 }
   , DateFormat = "ddd MMM dd yyyy"

   // Variables
   , eventItems = {}
   , forumItems = {}
   , prevObj
   , objCount = 1
   , masterData = { game: false, groups: {}, users: {}, events: {} }
   , XAxis
   , YAxis
   , previousScrollWidgets = false
   , PinMap = {}
   , LastObjects = []

   // Functions
   , mouseEvent

   , createHLine
   , createVLine
   , drawBoxToBoxLine

   , getGroupFromCreatedBy
   , getUserFromCreatedBy
   , getMediaGroups
   , getAllGroupUsers
   , createBoxObj

   , updateName

   , updateUserList
   , updateGraph
   , setGraph

   , openEventDialog
   , lobbyistEvent
   , memoEvent
   , newspaperEvent
   , videoEvent
   , pinEvent
   , questionEvent
   , voteEvent
   , postEvent
   , commentEvent
   , getForumWidgetList = function () { return false; }

   , createLabel

   ;

createLabel = function (str) {

   var label;
   str = str ? str : "";
   label = (str.length > 25) ? dmz.ui.textEdit.create(str) : dmz.ui.lineEdit.create(str);
   label.readOnly(true);
   return label;
};

getForumWidgetList = function (handleArray) {

   var postList = {}
     , postLayouts = []
     ;

   if (handleArray) {

      handleArray.forEach(function (handle) {

         var type = dmz.object.type(handle)
           , parent
           ;
         if (type && type.isOfType(dmz.stance.PostType)) {

            if (!postList[handle]) { postList[handle] = []; }
         }
         else if (type && type.isOfType(dmz.stance.CommentType)) {

            parent = dmz.object.subLinks(handle, dmz.stance.ParentHandle);
            parent = parent ? parent[0] : false;
            if (parent && !postList[parent]) { postList[parent] = []; }
         }
      });

      Object.keys(postList).forEach(function (handleStr) {

         var postHandle = parseInt(handleStr)
           , post = {}
           ;

//         self.log.warn ("postList:", handleStr);
         if (postHandle) {

            post.handle = postHandle;
            post.commentList = [];
            post.layout = dmz.ui.layout.createGridLayout();
            post.layout.property("spacing", 4);
            post.layout.margins(4);
            post.layout.columnMinimumWidth(0, 58);
            post.item = postEvent(postHandle);

            scrollLayout.insertLayout(0, post.layout);
            scrollLayout.property("spacing", 4);
            scrollLayout.margins(4);

            post.layout.addWidget(post.item, 0, 0, 1, 2);
            post.item.show();
//            post.highlight(handleArray.indexOf(postHandle) !== -1);
            if (handleArray.indexOf(postHandle) !== -1) {

               post.item.lookup("unreadLabel").show();
            }
            else { post.item.lookup("unreadLabel").hide(); }

            postLayouts.push(post);

            postList[postHandle] = dmz.object.superLinks(postHandle, dmz.stance.ParentHandle);
            if (postList[postHandle]) {

               postList[postHandle].forEach(function (commentHandle) {

                  var commentItem = commentEvent(commentHandle);
                  if (commentItem) {

                     post.layout.addWidget(commentItem, post.layout.rowCount(), 1);
                     post.commentList.push(commentItem);
                     commentItem.show();
                     if (handleArray.indexOf(commentHandle) !== -1) {

                        commentItem.lookup("unreadLabel").show();
                     }
                     else { commentItem.lookup("unreadLabel").hide(); }
                  }
               });
            }
         }
      });
   }
   return postLayouts;
};

openEventDialog = function (handleArray) {

   var type = (handleArray && handleArray[0]) ? dmz.object.type(handleArray[0]) : false
     , typeFunction = function () { return undefined; }
     , layouts
     , item
     , addedItems = false
     , layout
     , layoutItem
     , clearLayout
     ;

   if (ObjectTypeData[type]) {

      if (LastObjects) {

         LastObjects.forEach(function (item) {

            if (item && item.handle) { // forum event

               item.commentList.forEach(function (comment) {

                  item.layout.removeWidget(comment);
                  comment.hide();
               });

               item.layout.removeWidget(item.item);
               item.item.hide();
               scrollLayout.removeLayout(item.layout);
            }
            else { scrollLayout.removeWidget(item); item.hide(); }
         });
      }
      LastObjects = [];

      if (ObjectTypeData[type] == ObjectTypeData[dmz.stance.PostType]) {

         LastObjects = getForumWidgetList(handleArray);
         if (LastObjects) {

            LastObjects.forEach(function (postData) {

               if (postData) {

                  scrollLayout.property("spacing", 4);
                  scrollLayout.margins(4);
                  addedItems = true;
               }
            });
         }
      }
      else {

         typeFunction = ObjectTypeData[type].eventFunction;
         handleArray.forEach(function (handle) {

            var widget = typeFunction(handle);
            if (widget) {

               scrollLayout.addWidget(widget);
               LastObjects.push(widget);
               widget.show();
               addedItems = true;
            }
         });
      }

      scrollArea.ensureVisible(0, 0);
      if (addedItems) { graphDialog.open(self, function () {}); }
   }
   else { self.log.error ("Event dialog fail:", handleArray); }
};

lobbyistEvent = function (handle) {

   var widget
     , layout
     ;

   if (handle && !eventItems[handle]) {

      widget = dmz.ui.loader.load("AARItem.ui");
      layout = widget.lookup("formLayout");
      if (widget && layout) {

         layout.addRow("Title:", createLabel(dmz.object.text(handle, dmz.stance.TitleHandle)));
         layout.addRow("Message:", createLabel(dmz.object.text(handle, dmz.stance.TextHandle)));
         eventItems[handle] = widget;
      }
   }
   return eventItems[handle];
};

memoEvent = function (handle) {

   var widget
     , layout
     , webview
     ;

   if (handle && !eventItems[handle]) {

      widget = dmz.ui.loader.load("AARItem.ui");
      layout = widget.lookup("formLayout");
      if (widget && layout) {

         layout.addRow("Title:", createLabel(dmz.object.text(handle, dmz.stance.TitleHandle)));
         webview = dmz.ui.webview.create();
         webview.page().mainFrame().load(dmz.object.text(handle, dmz.stance.TextHandle));
         webview.sizePolicy(dmz.ui.consts.SPPreferred, dmz.ui.consts.SPMinimumExpanding);
         layout.addRow(webview);
         eventItems[handle] = widget;
      }
   }
   return eventItems[handle];
};

newspaperEvent = function (handle) {

   var widget
     , layout
     , webview
     ;

   if (handle && !eventItems[handle]) {

      widget = dmz.ui.loader.load("AARItem.ui");
      layout = widget.lookup("formLayout");
      if (widget && layout) {

         layout.addRow("Title:", createLabel(dmz.object.text(handle, dmz.stance.TitleHandle)));
         webview = dmz.ui.webview.create();
         webview.page().mainFrame().load(dmz.object.text(handle, dmz.stance.TextHandle));
         webview.sizePolicy(dmz.ui.consts.SPPreferred, dmz.ui.consts.SPMinimumExpanding);
         layout.addRow(webview);
         eventItems[handle] = widget;
      }
   }
   return eventItems[handle];
};

videoEvent = function (handle) {

//   var data = {}
//     , layout
//     ;
//   if (handle) {

//      data.label = dmz.stance.getDisplayName(handle);
//      data.widget = dmz.ui.widget.create();
//      layout = dmz.ui.layout.createFormLayout();
//      data.widget.layout(layout);
//   }
//   return data;

   return false;
};

pinEvent = function (handle) {

   var widget
     , layout
     , label
     , text
     , index
     ;

   if (handle && !eventItems[handle]) {

      widget = dmz.ui.loader.load("AARItem.ui");
      layout = widget.lookup("formLayout");
      if (widget && layout) {

         label = dmz.ui.label.create();
         text = dmz.object.text(handle, dmz.stance.PinFileHandle);
         label.pixmap(dmz.ui.graph.createPixmap(PinMap[text]));
         layout.addRow(label, createLabel(dmz.object.text(handle, dmz.stance.PinTitleHandle)));
         layout.addRow("Text:", createLabel(dmz.object.text(handle, dmz.stance.PinDescHandle)));
         eventItems[handle] = widget;
      }
   }
   return eventItems[handle];
};

questionEvent = function (handle) {

   var widget
     , layout
     , advisorHandle
     ;

   if (handle && !eventItems[handle]) {

      advisorHandle = dmz.object.superLinks(handle, dmz.stance.AdvisorAnsweredQuestionHandle);
      if (!advisorHandle) { advisorHandle = dmz.object.superLinks(handle, dmz.stance.AdvisorActiveQuestionHandle); }
      advisorHandle = advisorHandle ? advisorHandle[0] : false;

      widget = dmz.ui.loader.load("AARItem.ui");
      layout = widget.lookup("formLayout");
      if (widget && layout) {

         layout.addRow("Advisor Title:", createLabel(dmz.object.text(advisorHandle, dmz.stance.TitleHandle)));
         layout.addRow("Question:", createLabel(dmz.object.text(handle, dmz.stance.TextHandle)));
         layout.addRow("Answer:", createLabel(dmz.object.text(handle, dmz.stance.CommentHandle)));
         eventItems[handle] = widget;
      }
   }
   return eventItems[handle];
};

voteEvent = function (handle) {

   var widget
     , layout
     , advisorHandle
     , undec
     , yes
     , no
     , label
     ;

   if (handle && !eventItems[handle]) {

      advisorHandle = dmz.object.superLinks(handle, dmz.stance.VoteAdvisorHandle);
      advisorHandle = advisorHandle ? advisorHandle[0] : false;

      widget = dmz.ui.loader.load("AARItem.ui");
      layout = widget.lookup("formLayout");
      if (widget && layout) {

         layout.addRow("Advisor Title:", createLabel(dmz.object.text(advisorHandle, dmz.stance.TitleHandle)));
         layout.addRow("Task:", createLabel(dmz.object.text(handle, dmz.stance.TextHandle)));
         layout.addRow("Advisor Response:", createLabel(dmz.object.text(handle, dmz.stance.CommentHandle)));
         yes = dmz.object.subLinks(handle, dmz.stance.VoteYesHandle);
         no = dmz.object.subLinks(handle, dmz.stance.VoteNoHandle);
         undec = dmz.object.subLinks(handle, dmz.stance.VoteUndecidedHandle);
         label = dmz.stance.getVoteStatus(handle);
         if (label !== "DENIED") {

            label = label
               + " - Y: " + (yes ? yes.length : 0)
               + " N: " + (no ? no.length : 0)
               + " U: " + (undec ? undec.length : 0)
               ;
         }
         layout.addRow("Result:", createLabel(label));
         eventItems[handle] = widget;
      }
   }
   return eventItems[handle];
};

postEvent = function (postHandle) {

   var handle
     , date
     , item
     , label
     ;

   if (postHandle && !eventItems[postHandle]) {

      item = dmz.ui.loader.load("PostItem.ui");
      handle = dmz.object.subLinks(postHandle, dmz.stance.CreatedByHandle);
      if (handle) {

         handle = handle[0];
         item.lookup("postedByLabel").text("<b>" + dmz.stance.getDisplayName(handle) + "</b>");
         item.lookup("avatarLabel").pixmap(
            dmz.ui.graph.createPixmap(
               dmz.resources.findFile(
                  dmz.object.text(handle, dmz.stance.PictureHandle))));
      }
      date = dmz.object.timeStamp(postHandle, dmz.stance.CreatedAtServerTimeHandle);
      date = date ? dmz.util.timeStampToDate(date).toString("F") : "N/A";
      item.lookup("postedAtLabel").text("<span style=\"color:#939393;\">- " + date + "</span>");
      item.lookup("messageLabel").text(dmz.object.text(postHandle, dmz.stance.TextHandle));
      item.lookup("commentAddLabel").hide();
      label = item.lookup("unreadLabel");
      label.pixmap(dmz.ui.graph.createPixmap(dmz.resources.findFile("PushNotify")));
      label.hide();
      eventItems[postHandle] = item;
   }
   return eventItems[postHandle];
};

commentEvent = function (commentHandle) {

   var handle
     , date
     , item
     , label
     ;

   if (commentHandle && !eventItems[commentHandle]) {

      item = dmz.ui.loader.load("CommentItem.ui");
      handle = dmz.object.subLinks(commentHandle, dmz.stance.CreatedByHandle);
      if (handle) {

         handle = handle[0];
         item.lookup("postedByLabel").text("<b>" + dmz.stance.getDisplayName(handle) + "</b>");
         item.lookup("avatarLabel").pixmap(
            dmz.ui.graph.createPixmap(
               dmz.resources.findFile(
                  dmz.object.text(handle, dmz.stance.PictureHandle))));
      }
      date = dmz.object.timeStamp(commentHandle, dmz.stance.CreatedAtServerTimeHandle);
      date = date ? dmz.util.timeStampToDate(date).toString("F") : "N/A";
      item.lookup("postedAtLabel").text("<span style=\"color:#939393;\">- " + date + "</span>");
      item.lookup("messageLabel").text(dmz.object.text(commentHandle, dmz.stance.TextHandle));
      item.lookup("commentAddLabel").hide();
      label = item.lookup("unreadLabel");
      label.pixmap(dmz.ui.graph.createPixmap(dmz.resources.findFile("PushNotify")));
      label.hide();
      eventItems[commentHandle] = item;
   }
   return eventItems[commentHandle];
};

mouseEvent = function (object, event) {

   var type = event.type()
     , pos
     , items
     ;

   if (object == graphWindowScene) {

      if (type == dmz.ui.event.GraphicsSceneMousePress) {

         pos = event.scenePos();
         items =
            object.items(pos, dmz.ui.consts.IntersectsItemShape, dmz.ui.consts.DescendingOrder);
         items.forEach(function (item) {

            var handles = item.data(HandleIndex);
//            openEventDialog(item.data(HandleIndex));
            if (handles) {

               self.log.warn (handles, dmz.object.type(handles[0]));
               dmz.time.setTimer(self, function () { openEventDialog(handles); });
            }
         });
      }
   }
};

createBoxObj = function (handle, x, y, parent) {

   var result =
          { box: false
          , label: false
          , countLabel: false
          , count: 1
          , handles: [handle]
          }
     , label = false
     , count = 1
     , type
     , rect
     , brush
     ;

   if (handle) {

      type = dmz.object.type(handle);
      if (ObjectTypeData[type]) {

         label = ObjectTypeData[type].label;
         if (type.isOfType(dmz.stance.VoteType)) {

            if (!dmz.object.flag(handle, dmz.stance.VoteApprovedHandle)) {

               label += "d";
               brush = ObjectTypeData[type].brush.deny;
            }
            else if (dmz.object.flag(handle, dmz.stance.VoteResultHandle)) {

               label += "a";
               brush = ObjectTypeData[type].brush.pass;
            }
            else {

               label += "f";
               brush = ObjectTypeData[type].brush.fail;
            }
         }
         else { brush = ObjectTypeData[type].brush; }

         result.box = dmz.ui.graph.createRectItem(StdBox.x, StdBox.y, StdBox.w, StdBox.h, parent);
         result.box.brush(brush);
         result.box.pos(x, y);
         result.box.data(HandleIndex, result.handles);
         if (result.box) {

            result.label = dmz.ui.graph.createTextItem(label, result.box);
            result.label.pos(0, StdBox.h);

            if (count) {

               result.countLabel = dmz.ui.graph.createTextItem(count.toString(), result.box);
               result.countLabel.pos(0, StdBox.h / 2);
            }
         }
         masterData.events[handle] = result;
      }
   }

   return result;
};

createHLine = function (x, y, len) { return dmz.ui.graph.createLineItem(x, y, x + len, y); }
createVLine = function (x, y, height) { return dmz.ui.graph.createLineItem(x, y, x, -(-y + height)); }

drawBoxToBoxLine = function (oldBox, newBox, label) {

   var oldPos
     , oldRect
     , newPos
     , x
     , line
     ;
   if (oldBox && newBox) {

      oldPos = oldBox.pos();
      newPos = newBox.pos();
      oldRect = oldBox.boundingRect();
      x = oldPos[0] + oldRect.width;
      line = createHLine(x, oldPos[1] + (oldRect.height / 2), newPos[0] - x);
      line.acceptHoverEvents(true);
      line.toolTip(label);
      graphWindowScene.addItem(line);
   }
   return line;
}

updateName = function (handle) {

   var data
     , name
     , index
     ;
   if (handle) {

      name = dmz.stance.getDisplayName(handle);
      if (masterData.groups[handle]) {

         data = masterData.groups[handle];
         if (data.name) {

            index = groupList.findText(data.name);
            if (index !== -1) { groupList.removeIndex(index); }
         }
         groupList.addItem(name, handle);
      }
      else if (masterData.users[handle]) { data = masterData.users[handle]; }

      if (data && data.label) {

         data.name = name;
         data.label.text(name);
      }
   }
};

setGraph = function (graphType, activeObjectTypes, yAxisItems, startDate, endDate, nextInterval) {

   var objTypeCnt
     , interval = []
     , currDate = startDate
     , nextDate
     , objectDataList = []
     , yAxisMap = {}
     , currentInterval = 0
     , x
     , item
     , box
     , boxCount = 0
     , boxInInterval = false
     , longestTitle = 0
     , addedBox = false
     , lastBox = false
     , xLine
     , StartX
     , intervalLineFnc
     , intervalLine
     , rotationAmt = 20
     ;

   graphWindowScene.clear();
// Create mapping of link handle to y-index
   yAxisItems.forEach(function (handle, index) {

      var text = dmz.stance.getDisplayName(handle)
        , rect
        ;
      yAxisMap[handle] = { height: index * StdBox.h, tooltip: text };
      text = graphWindowScene.addText(text);
      rect = text.boundingRect();
      longestTitle = (rect.width > longestTitle) ? rect.width : longestTitle;
      text.pos(0, yAxisMap[handle].height + StdBox.h);
      yAxisMap[handle].lastBox = text;
      yAxisMap[handle].label = text;
   });

   StartX = longestTitle + 10;
   XAxis = createHLine(StartX, 0, 200);
   graphWindowScene.addItem(XAxis);
   intervalLineFnc = function (x) { return createVLine(x, 0, -((yAxisItems.length + 1) * StdBox.h)); }
   YAxis = intervalLineFnc(StartX);
   item = dmz.ui.graph.createTextItem(startDate.toString(DateFormat), YAxis);
   item.pos(StartX, 0);
   item.rotation(rotationAmt);

   graphWindowScene.addItem(YAxis);
   interval.push(YAxis);

// Iterate through all objects, save { handle, createdAt, links (users/groups) }
   activeObjectTypes.forEach(function (type) {

      var typeData = ObjectTypeData[type];
      typeData.events.forEach(function (objHandle) {

         var obj = { handle: objHandle };
         if (graphType === GraphType.Game) { obj.links = typeData.getGroups(objHandle); }
         else { obj.links = typeData.getUsers(objHandle); }
         obj.type = typeData;
         obj.createdAt = dmz.object.timeStamp(objHandle, dmz.stance.CreatedAtServerTimeHandle);
         if (obj.createdAt) {

            obj.createdAt = dmz.util.timeStampToDate(obj.createdAt);
            if (obj.createdAt.isAfter(startDate) && obj.createdAt.isBefore(endDate)) {

               objectDataList.push(obj);
            }
         }
      });
   });

// Sort by timestamp
   objectDataList.sort(function (a, b) { return Date.compare(a.createdAt, b.createdAt); });

   self.log.warn ("curr:", currDate, "end:", endDate, "oDL:", objectDataList.length);
   while (currDate.isBefore(endDate) && objectDataList.length) {

      nextDate = nextInterval(currDate);
      if (nextDate.isAfter(endDate)) { nextDate = endDate; }
//      self.log.warn(currDate.toString(DateFormat), "->", nextDate.toString(DateFormat));
      item = objectDataList.shift();
      while (item) {

         if (item.createdAt.isBefore(nextDate)) {

            addedBox = false;
            x = boxCount * (StdBox.w + StdBox.space) + StartX;
            item.links.forEach(function (handle) {

               var lineItem
                 , line
                 , data = yAxisMap[handle]
                 , box
                 ;

               if (data) {

                  if (data.lastType !== item.type) {

                     box = createBoxObj(item.handle, x, data.height, XAxis);
                     addedBox = true;
                     boxInInterval = true;
                     data.lastType = item.type;
                     data.lastBox = box;
                  }
                  else if (data.lastBox.count) {

                     data.lastBox.handles.push(item.handle);
                     data.lastBox.countLabel.plainText(data.lastBox.handles.length.toString());
                     data.lastBox.box.data(HandleIndex, data.lastBox.handles);
                  }
               }
            });

            if (addedBox) { boxCount += 1; }
            item = objectDataList.shift();
         }
         else { objectDataList.unshift(item); item = false; }
      }

      Object.keys(yAxisMap).forEach(function (key) { yAxisMap[key].lastType = false; });
      // Create vert line to mark end of interval
      if (!boxInInterval) { boxCount += 1; }
      boxInInterval = false;
      intervalLine = intervalLineFnc(boxCount * (StdBox.w + StdBox.space) + StartX);
      item = dmz.ui.graph.createTextItem(nextDate.toString(DateFormat), intervalLine);
      item.rotation(rotationAmt);
      item.pos(boxCount * (StdBox.w + StdBox.space) + StartX, 0);
      graphWindowScene.addItem(intervalLine);
      interval.push(intervalLine);
      currDate = nextDate;
      currentInterval += 1;
   }


   intervalLine = interval[interval.length - 1];
   Object.keys(yAxisMap).forEach (function (h) {

      var data = yAxisMap[h]
        , line
        ;

      line = createHLine(0, data.height + (StdBox.h / 2), boxCount * (StdBox.w + StdBox.space) + StartX);
      line.z(-1);
      line.acceptHoverEvents(true);
      line.toolTip(data.tooltip);
      graphWindowScene.addItem(line);
   });
   xLine = XAxis.line();
   xLine.x2 = (x ? x : xLine.x2) + (StdBox.w * 2);
   XAxis.line(xLine);
};

updateGraph = function () {

   var interval = intervalAmtBox.value() * Interval[intervalTypeBox.currentText()]
     , graphType = groupViewTypeList.currentIndex()
     , groupIndex = groupList.currentIndex()
     , groupHandle = false
     , activeTypes = []
     , activeLineHandles = []
     , dataList = false
     , intervalfnc = function (date) { return date.clone().add(interval).days(); }
     , gameTime = dmz.object.data(masterData.game, dmz.stance.GameStartTimeHandle)
     , gameStart
     , gameEnd
     , graphStart
     , graphEnd
//     , graphStart = startDateBox.dateTime()
//     , graphEnd = endDateBox.dateTime()
     ;

   if (gameTime) {

      gameStart = dmz.util.timeStampToDate(gameTime.number("server", 0))
      gameEnd = dmz.util.timeStampToDate(gameTime.number("server", 1))

      graphStart = gameStart;
      graphEnd = gameEnd;
//      if (gameStart && graphStart && graphStart.isBefore(gameStart)) {

//         graphStart = gameStart;
//      }
//      if (gameEnd && graphEnd && graphEnd.isAfter(gameEnd)) { graphEnd = gameEnd; }
   }
   if (graphStart && graphEnd) {

      if (graphStart.isBefore(graphEnd)) {

         Object.keys(ObjectTypeData).forEach(function (type) {

            if (ObjectTypeData[type].selected && (type != dmz.stance.CommentType)) {

               activeTypes.push(type);
            }
         });

         if (graphType === GraphType.Game) { dataList = masterData.groups; }
         else if (graphType === GraphType.Group) { dataList = masterData.users; }
         if (dataList) {

            Object.keys(dataList).forEach(function (key) {

               if (dataList[key].selected) { activeLineHandles.push(dataList[key].handle); }
            });
         }

         self.log.warn
            ( "Update graph:\n"
            + "  Interval: " + interval + " days\n"
            + "  GraphType: " + (graphType ? "Group" : "Game") + "(" + graphType + ")" + "\n"
            + "  ActiveTypes: [" + activeTypes + "]\n"
            + "  activeLines: [" + activeLineHandles +"]\n"
            + "  graphStart: " + graphStart + "\n"
            + "  graphEnd: " + graphEnd + "\n"
            );

         setGraph(graphType, activeTypes, activeLineHandles, graphStart, graphEnd, intervalfnc);
      }
      else {

         dmz.ui.messageBox.create(
            { type: dmz.ui.messageBox.Warning
            , text: "Start Date must be before End Date!"
            , standardButtons: [dmz.ui.messageBox.Ok]
            , defaultButton: dmz.ui.messageBox.Ok
            }
            , graphWindow
            ).open(self, function (value) {});
      }
   }
};

getGroupFromCreatedBy = function (handle) {

   var userHandle = dmz.object.subLinks(handle, dmz.stance.CreatedByHandle);
   userHandle = dmz.stance.getUserGroupHandle(userHandle[0]);
   return userHandle ? [userHandle] : [];
};

getMediaGroups = function (handle) {

   var groupList = dmz.object.superLinks(handle, dmz.stance.GameMediaHandle);
   return groupList ? groupList : [];
}

getAllGroupUsers = function (groupHandle) {

   var users = dmz.object.subLinks(groupHandle, dmz.stance.GroupMembersHandle);
   return users ? users : [];
};

getUserFromCreatedBy = function (handle) {

   var userHandle = dmz.object.subLinks(handle, dmz.stance.CreatedByHandle);
   return userHandle ? userHandle : [];
};

(function () {

   var iconList = self.config.get("map-pins.pin")
     ;

   if (iconList) {

      iconList.forEach(function (icon) {

         PinMap[icon.string("name")] = dmz.resources.findFile(icon.string("value"));
      });
   }
}());

(function () {

   var data;
   graphWindowScene = dmz.ui.graph.createScene();
   graphicsView.scene (graphWindowScene);
   graphicsView.alignment (dmz.ui.consts.AlignLeft | dmz.ui.consts.AlignBottom);

   scrollArea.widget().layout(scrollLayout);
   scrollLayout.margins(4);
//   scrollLayout.addStretch(1);

   graphWindowScene.eventFilter(self, mouseEvent);


   ObjectTypeData[dmz.stance.LobbyistType] =
      { name: "Lobbyists"
      , brush: dmz.ui.graph.createBrush({ r: 0.1, g: 1, b: 0.3 })
      , getGroups: function (handle) {

           var groupHandle = dmz.object.superLinks(handle, dmz.stance.ActiveLobbyistHandle);
           return (groupHandle && groupHandle[0]) ? [groupHandle] : [];
        }
      , getUsers: false
      , eventFunction: lobbyistEvent
      };

   ObjectTypeData[dmz.stance.MemoType] =
      { name: "Memos"
      , brush: dmz.ui.graph.createBrush({ r: 0.3, g: 0.3, b: 0.3 })
      , getGroups: getMediaGroups
      , getUsers: false
      , eventFunction: memoEvent
      };

   ObjectTypeData[dmz.stance.NewspaperType] =
      { name: "Newspapers"
      , brush: dmz.ui.graph.createBrush({ r: 0.5, g: 0.5, b: 0.3 })
      , getGroups: getMediaGroups
      , getUsers: false
      , eventFunction: newspaperEvent
      };

//   ObjectTypeData[dmz.stance.VideoType] =
//      { name: "Videos"
//      , brush: dmz.ui.graph.createBrush({ r: 0.3, g: 0.8, b: 0.7 })
//      , getGroups: getMediaGroups
//      , getUsers: false
//      , eventFunction: videoEvent
//      };

   ObjectTypeData[dmz.stance.PinType] =
      { name: "Pins"
      , brush: dmz.ui.graph.createBrush({ r: 1, g: 0.2, b: 0.3 })
      , getGroups: function (handle) {

           var groupList = dmz.object.superLinks(handle, dmz.stance.GroupPinHandle);
           return groupList ? groupList : [];
        }
      , getUsers: false
      , eventFunction: pinEvent
      };

   ObjectTypeData[dmz.stance.QuestionType] =
      { name: "Questions"
      , brush: dmz.ui.graph.createBrush({ r: 0.8, g: 0.8, b: 0.3 })
      , getGroups: getGroupFromCreatedBy
      , getUsers: getUserFromCreatedBy
      , eventFunction: questionEvent
      };

   ObjectTypeData[dmz.stance.VoteType] =
      { name: "Tasks"
      , brush:
           { fail: dmz.ui.graph.createBrush({ r: 1, g: 0, b: 0 })
           , pass: dmz.ui.graph.createBrush({ r: 0, g: 1, b: 0 })
           , deny: dmz.ui.graph.createBrush({ r: 0, g: 0, b: 1 })
           }
      , getGroups: getGroupFromCreatedBy
      , getUsers: getUserFromCreatedBy
      , eventFunction: voteEvent
      };

   data =
      { name: "Forum post"
      , brush: dmz.ui.graph.createBrush({ r: 1, g: 0.8, b: 0.8 })
      , getGroups: getGroupFromCreatedBy
      , getUsers: getUserFromCreatedBy
      };

   ObjectTypeData[dmz.stance.CommentType] = data;
   ObjectTypeData[dmz.stance.PostType] = data;

   Object.keys(ObjectTypeData).forEach(function (type) {

      var data = ObjectTypeData[type];
      if (!data.itemLabel) { data.itemLabel = dmz.ui.button.createCheckBox(data.name); }
      if (!data.events) { data.events = []; }
      if (!data.label) { data.label = data.name.charAt(0); }
      if (!data.selected) {

         data.selected = false;
         data.itemLabel.observe(self, "toggled", function (checked) { data.selected = checked; });
      }
      if (!data.getUsers) {

         data.getUsers = function (handle) {

            var ret = []
//              , groups = data.getGroups
              ;
            data.getGroups(handle).forEach(function (handle) {

               ret = ret.concat(getAllGroupUsers(handle));
//               self.log.warn("getUsers:", data.name, data.handle, ret);
            });
            return ret;
         };
      }

      objectTypeLayout.insertWidget(1, data.itemLabel);
      data.itemLabel.setChecked(true);
   });

   graphWindow.show();
}());

updateUserList = function (index) {

   var handle = groupList.itemData(index)
     , groupData
     ;

   if (handle && masterData.groups[handle]) {

      groupData = masterData.groups[handle];
      Object.keys(masterData.users).forEach(function (handle) {

         var isCurrent
           , userData
           ;
         handle = parseInt(handle);
         userData = masterData.users[handle];
         isCurrent = groupData.users.indexOf(handle);
         if (isCurrent !== -1) { masterData.users[handle].label.show(); }
         else { masterData.users[handle].label.hide(); }

         masterData.users[handle].label.setChecked(isCurrent !== -1);
      });
   }
};

groupViewTypeList.observe(self, "currentIndexChanged", function (index) {

   groupList.enabled(index === 1);
   updateUserList(groupList.currentIndex());
   stackedWidget.currentIndex(index);
});

groupList.observe(self, "currentIndexChanged", updateUserList);
graphWindow.observe(self, "updateGraphButton", "clicked", updateGraph);

dmz.object.text.observe(self, dmz.stance.DisplayNameHandle, function (handle) {

   if (handle) {

      if (masterData.groups[handle] || masterData.users[handle]) { updateName(handle); }
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle, function (handle) {

   if (handle) {

      if (masterData.groups[handle]) { updateName(handle); }
   }
});

dmz.object.link.observe(self, dmz.stance.GroupMembersHandle,
function (linkObjHandle, attrHandle, groupHandle, userHandle) {

   var userData = masterData.users[userHandle]
     , groupData = masterData.groups[groupHandle]
     ;

   if (userData && groupData && !dmz.object.flag(userHandle, dmz.stance.AdminHandle)) {

      userData.group = groupHandle;
      groupData.users.push(userHandle);
   }

});

dmz.object.link.observe(self, dmz.stance.AdminHandle, function (handle, attr, value) {

   var userData = masterData.users[handle]
     , groupData
     ;

   if (value && userData) {

      userData.label.hide();
      userData.label.setChecked(false);
      if (userData.group) {

         groupData = masterData.groups[userData.group];
         groupData.users.splice(groupData.users.indexOf(handle), 1);
      }
   }
});

dmz.object.create.observe(self, function (handle, type) {

   var nextObj
     , data
     ;
   if (type) {

      if (type.isOfType(dmz.stance.GameType)) {

         masterData.game = handle;
      }
      else if (type.isOfType(dmz.stance.GroupType)) {

         data =
            { label: dmz.ui.button.createCheckBox()
            , users: []
            , name: false
            , handle: handle
            };
         data.label.observe(self, "toggled", function (checked) { data.selected = checked; });
         masterData.groups[handle] = data;
         groupLayout.insertWidget(0, data.label);
         data.label.setChecked(true);
         updateName(handle);
      }
      else if (type.isOfType(dmz.stance.UserType)) {

         data =
            { handle: handle
            , name: false
            , label: dmz.ui.button.createCheckBox()
            };
         data.label.observe(self, "toggled", function (checked) { data.selected = checked; });
         masterData.users[handle] = data;
         userLayout.insertWidget(0, data.label);
         data.label.setChecked(true);
         updateName(handle);
      }
      else if (ObjectTypeData[type]) {

         ObjectTypeData[type].events.push(handle);
//         eventItems[handle] = ObjectTypeData[type].generateWidget(handle);
      }
   }
});


