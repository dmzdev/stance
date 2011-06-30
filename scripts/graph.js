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
        , dmz.stance.VideoType
        ]
   , HandleIndex = 0

   , Interval = { days: 1, weeks: 7 }
   , GraphType = { Game: 0, Group: 1 }
   , DateFormat = "ddd MMM dd yyyy"

   // Variables
   , eventItems = {}
   , prevObj
   , objCount = 1
   , masterData = { game: false, groups: {}, users: {}, events: {} }
   , XAxis
   , YAxis

   // Functions
   , mouseEvent

   , createAxes
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
   , forumEvent

   ;

openEventDialog = function (handleArray) {

   var dialog = dmz.ui.loader.load("EventDialog.ui", graphWindow)
     , tabWidget = dmz.ui.tabWidget.create()
     , type = (handleArray && handleArray[0]) ? dmz.object.type(handleArray[0]) : false
     , typeFunction = function () { return undefined; }
     ;
   if (ObjectTypeData[type]) {

      typeFunction = ObjectTypeData[dmz.object.type(handleArray[0])].eventFunction;
      if (typeFunction) {

         handleArray.forEach(function (handle) {

            var data = typeFunction(handle);
            tabWidget.add(data.widget, data.label);
         });
         dialog.lookup("tabLayout").addWidget(tabWidget);
         dialog.open(function (value, dialog) {});
      }
   }
   else { self.log.error ("Event dialog fail:", handleArray); }
};

lobbyistEvent = function (handle) {

   var data = {}
     , layout
     ;
   if (handle) {

      data.label = dmz.stance.getDisplayName(handle);
      data.widget = dmz.ui.widget.create();
      layout = dmz.ui.layout.createFormLayout();
      data.widget.layout(layout);
   }
   return data;
};

memoEvent = function (handle) {

   var data = {}
     , layout
     ;
   if (handle) {

      data.label = dmz.stance.getDisplayName(handle);
      data.widget = dmz.ui.widget.create();
      layout = dmz.ui.layout.createFormLayout();
      data.widget.layout(layout);
   }
   return data;
};

newspaperEvent = function (handle) {

   var data = {}
     , layout
     ;
   if (handle) {

      data.label = dmz.stance.getDisplayName(handle);
      data.widget = dmz.ui.widget.create();
      layout = dmz.ui.layout.createFormLayout();
      data.widget.layout(layout);
   }
   return data;
};

videoEvent = function (handle) {

   var data = {}
     , layout
     ;
   if (handle) {

      data.label = dmz.stance.getDisplayName(handle);
      data.widget = dmz.ui.widget.create();
      layout = dmz.ui.layout.createFormLayout();
      data.widget.layout(layout);
   }
   return data;
};

pinEvent = function (handle) {

   var data = {}
     , layout
     ;
   if (handle) {

      data.label = dmz.stance.getDisplayName(handle);
      data.widget = dmz.ui.widget.create();
      layout = dmz.ui.layout.createFormLayout();
      data.widget.layout(layout);
   }
   return data;
};

questionEvent = function (handle) {

   var data = {}
     , layout
     ;
   if (handle) {

      data.label = dmz.stance.getDisplayName(handle);
      data.widget = dmz.ui.widget.create();
      layout = dmz.ui.layout.createFormLayout();
      data.widget.layout(layout);
   }
   return data;
};

voteEvent = function (handle) {

   var data = {}
     , layout
     ;
   if (handle) {

      data.label = dmz.stance.getDisplayName(handle);
      data.widget = dmz.ui.widget.create();
      layout = dmz.ui.layout.createFormLayout();
      data.widget.layout(layout);
   }
   return data;
};

forumEvent = function (handle) {

   var data = {}
     , layout
     ;
   if (handle) {

      data.label = dmz.stance.getDisplayName(handle);
      data.widget = dmz.ui.widget.create();
      layout = dmz.ui.layout.createFormLayout();
      data.widget.layout(layout);
   }
   return data;
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
            if (handles) { self.log.warn (handles, dmz.object.type(handles[0])); }
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
     ;

//   self.log.warn ("CreateBoxObj:", handle, x, y, count, parent);
   if (handle) {

      type = dmz.object.type(handle);
      if (ObjectTypeData[type]) {

         label = ObjectTypeData[type].label;
         if (type.isOfType(dmz.stance.VoteType)) {

            if (!dmz.object.flag(handle, dmz.stance.VoteApprovedHandle)) { label += "d"; }
            else if (dmz.object.flag(handle, dmz.stance.VoteResultHandle)) { label += "a"; }
            else { label += "f"; }
         }

         result.box = dmz.ui.graph.createRectItem(StdBox.x, StdBox.y, StdBox.w, StdBox.h, parent);
         result.box.brush(ObjectTypeData[type].brush);
         result.box.pos(x, y);
         result.box.data(HandleIndex, result.handles);
         if (result.box) {

            result.label = dmz.ui.graph.createTextItem(label, result.box);
            result.label.pos(0, StdBox.h);

            if (count) {

               result.countLabel = dmz.ui.graph.createTextItem(count.toString(), result.box);
               result.countLabel.pos(StdBox.w / 2, StdBox.h / 2);
            }
         }
         masterData.events[handle] = result;
      }
   }

   return result;
};

createHLine = function (x, y, len) { return dmz.ui.graph.createLineItem(x, y, x + len, y); }
createVLine = function (x, y, height) { return dmz.ui.graph.createLineItem(x, y, x, -(-y + height)); }

createAxes = function (scene, x, y, yItems) {

   self.log.warn ("Create Axes:", x, y, yItems);
   if (scene) {

      XAxis = createHLine(x, y, 200);
      scene.addItem(XAxis); // X-Axis
      YAxis = createVLine(x, y, -((yItems + 1.5) * StdBox.h));
      scene.addItem(YAxis); // Y-Axis
   }
   return XAxis;
};

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
//   createAxes(graphWindowScene, (longestTitle + 10), 0, yAxisItems.length);
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
            objectDataList.push(obj);
         }
      });
   });

// Sort by timestamp
   objectDataList.sort(function (a, b) { return Date.compare(a.createdAt, b.createdAt); });

   self.log.warn ("curr:", currDate, "end:", endDate, "oDL:", objectDataList.length);
   while (currDate.isBefore(endDate) && objectDataList.length) {

      nextDate = nextInterval(currDate);
      if (nextDate.isAfter(endDate)) { nextDate = endDate; }
      self.log.warn(currDate.toString(DateFormat), "->", nextDate.toString(DateFormat));
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
     ;

   if (gameTime) {

      gameStart = dmz.util.timeStampToDate(gameTime.number("server", 0))
      gameEnd = dmz.util.timeStampToDate(gameTime.number("server", 1))

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
         + "  gameStart: " + dmz.util.timeStampToDate(gameStart) + "\n"
         + "  gameEnd: " + dmz.util.timeStampToDate(gameEnd) + "\n"
         );

      setGraph(graphType, activeTypes, activeLineHandles, gameStart, gameEnd, intervalfnc);
   }
   else { self.log.error ("Game time has not been set!"); }
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

   var data;
   graphWindowScene = dmz.ui.graph.createScene();
   graphicsView.scene (graphWindowScene);
   graphicsView.alignment (dmz.ui.consts.AlignLeft | dmz.ui.consts.AlignBottom);
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
      , brush: dmz.ui.graph.createBrush({ r: 0.5, g: 0.8, b: 0.3 })
      , getGroups: getMediaGroups
      , getUsers: false
      , eventFunction: newspaperEvent
      };

   ObjectTypeData[dmz.stance.VideoType] =
      { name: "Videos"
      , brush: dmz.ui.graph.createBrush({ r: 0.3, g: 0.8, b: 0.7 })
      , getGroups: getMediaGroups
      , getUsers: false
      , eventFunction: videoEvent
      };

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
      , brush: dmz.ui.graph.createBrush({ r: 0.3, g: 0.8, b: 0.3 })
      , getGroups: getGroupFromCreatedBy
      , getUsers: getUserFromCreatedBy
      , eventFunction: voteEvent
      };

   data =
      { name: "Forum post"
      , brush: dmz.ui.graph.createBrush({ r: 1, g: 0.8, b: 0.8 })
      , getGroups: getGroupFromCreatedBy
      , getUsers: getUserFromCreatedBy
      , eventFunction: forumEvent
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
      else if (ObjectTypeData[type]) { ObjectTypeData[type].events.push(handle); }
   }
});


