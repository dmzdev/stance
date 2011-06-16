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
        , space: 20
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

   , getGroupFromCreatedBy
   , getUserFromCreatedBy
   , getMediaGroups
   , getAllGroupUsers
   , createBoxObj

   , updateName

   , updateUserList
   , updateGraph
   , setGraph

   ;

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

            var handle = item.data(HandleIndex);
            if (handle) { self.log.warn (handle, dmz.object.type(handle)); }
         });
      }
   }
};

createBoxObj = function (handle, x, y, count, parent) {

   var result = { box: false, label: false, count: false }
     , label = false
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
         result.box.data(HandleIndex, handle);
         if (result.box) {

            result.label = dmz.ui.graph.createTextItem(label, result.box);
            result.label.pos(0, StdBox.h);

            if (count) {

               result.count = dmz.ui.graph.createTextItem(count.toString(), result.box);
               result.count.pos(StdBox.w / 2, StdBox.h / 2);
            }
         }
         masterData.events[handle] = result;
      }
   }

   return result;
};

createHLine = function (x, y, len) { return dmz.ui.graph.createLineItem(x, y, x + len, y); }
createVLine = function (x, y, height) { return dmz.ui.graph.createLineItem(x, y, x, -(-y + height)); }

createAxes = function (scene) {

   if (scene) {

      XAxis = createHLine(0, 0, 200);
      scene.addItem(XAxis); // X-Axis
      YAxis = createVLine(0, 0, 50);
      scene.addItem(YAxis); // Y-Axis
   }
   return XAxis;
};

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
            if (index !== -1) groupList.removeIndex(index);
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
     ;
// Iterate through all objects, save { handle, createdAt, links (users/groups) }
   activeObjectTypes.forEach(function (type) {

      var typeData = ObjectTypeData[type];
      typeData.events.forEach(function (objHandle) {

         var obj = { handle: objHandle };
         obj.createdAt = dmz.object.timeStamp(objHandle, dmz.stance.CreatedAtServerTimeHandle);
         self.log.warn (objHandle, "created at:", obj.createdAt);
         if (!obj.createdAt) {

            self.log.error (objHandle, dmz.object.type(objHandle));
         }

         obj.createdAt = dmz.util.timeStampToDate(obj.createdAt);
         if (graphType === GraphType.Group) { obj.links = typeData.getGroups(objHandle); }
         else { obj.links = typeData.getUsers(objHandle); }
         obj.type = type;
         objectDataList.push(obj);
      });
   });

// Sort by timestamp
   objectDataList.sort(function (a, b) { return b.createdAt.isAfter(a.createdAt); });
   objectDataList.forEach(function (data) { self.log.warn (data.createdAt); });

// Create mapping of link handle to y-index
   yAxisItems.forEach(function (handle, index) {

      yAxisMap[handle] = index * StdBox.h + 10;
      self.log.warn ("YAxis:", handle, yAxisMap[handle]);
   });

// objTypeCntr = {}; objTypeCnt[type] = 0; objTypeCnt[type] += 1

   while (currDate.isBefore(endDate) && objectDataList.length) {

      nextDate = nextInterval(currDate);
//      objTypeCnt = {};
      item = objectDataList.pop();
      if (item && (item.createdAt.before(nextDate))) {

         x = currentInterval * (StdBox.w + space);
         item.links.forEach(function (handle) {

            if (yAxisMap[handle]) {

               createBoxObj(handle, x, yAxisMap[handle], XAxis);
            }
         });
      }



      while (item && (item.timestamp < nextDate)) {

         if (item.date < nextDate) {

            if (!objTypeCnt[item.type]) { objTypeCnt[item.type] = []; }
            objTypeCnt[item.type].push(item.handle);

         }
      }

//      Object.keys(objTypeCnt).forEach(function (type) {

//         if (objTypeCnt[type].length > 0) {

//            // Add box of correct type at next location for current interval with correct count
//            // Add one box for each group / user line
//            // On click, add dialog with correct info for handle
//         }
//      });
      currDate = nextDate;
      currentInterval += 1;
   }

};

updateGraph = function () {

   var interval = intervalAmtBox.value() * Interval[intervalTypeBox.currentText()]
     , graphType = groupViewTypeList.currentIndex()
     , groupIndex = groupList.currentIndex()
     , groupHandle = false
     , activeTypes = []
     , activeLineHandles = []
     , dataList = false
     , intervalfnc = function (date) { return date.add(interval).days(); }
     , gameTime = dmz.object.data(masterData.game, dmz.stance.GameStartTimeHandle)
     , gameStart = dmz.util.timeStampToDate(gameTime.number("server", 0))
     , gameEnd = dmz.util.timeStampToDate(gameTime.number("server", 1))

     ;

   Object.keys(ObjectTypeData).forEach(function (type) {

      if (ObjectTypeData[type].selected) { activeTypes.push(type); }
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
      + "  GraphType: " + (graphType ? "Group" : "Game") + "\n"
      + "  ActiveTypes: [" + activeTypes + "]\n"
      + "  activeLines: [" + activeLineHandles +"]\n"
      + "  gameStart: " + dmz.util.timeStampToDate(gameStart) + "\n"
      + "  gameEnd: " + dmz.util.timeStampToDate(gameEnd) + "\n"
      );

   setGraph(graphType, activeTypes, activeLineHandles, gameStart, gameEnd, intervalfnc);

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
//   graphWindowScene = dmz.ui.graph.createScene(-50, 50, 50, 1);
   graphWindowScene = dmz.ui.graph.createScene();
   graphicsView.scene (graphWindowScene);
//   graphicsView.alignment (dmz.ui.consts.AlignLeft | dmz.ui.consts.AlignBottom);
   graphWindowScene.eventFilter(self, mouseEvent);

   prevObj = { box: createAxes(graphWindowScene) };

   ObjectTypeData[dmz.stance.LobbyistType] =
      { name: "Lobbyists"
      , brush: dmz.ui.graph.createBrush({ r: 0.1, g: 1, b: 0.3 })
      , getGroups: function (handle) {

           var groupHandle = dmz.object.superLinks(handle, dmz.stance.ActiveLobbyistHandle);
           return (groupHandle && groupHandle[0]) ? [groupHandle] : [];
        }
      };

   ObjectTypeData[dmz.stance.MemoType] =
      { name: "Memos"
      , brush: dmz.ui.graph.createBrush({ r: 0.3, g: 0.3, b: 0.3 })
      , getGroups: getMediaGroups
      };

   ObjectTypeData[dmz.stance.NewspaperType] =
      { name: "Newspapers"
      , brush: dmz.ui.graph.createBrush({ r: 0.5, g: 0.8, b: 0.3 })
      , getGroups: getMediaGroups
      };

   ObjectTypeData[dmz.stance.PinType] =
      { name: "Pins"
      , brush: dmz.ui.graph.createBrush({ r: 1, g: 0.2, b: 0.3 })
      , getGroups: function (handle) {

           var groupList = dmz.object.superLinks(handle, dmz.stance.GroupPinHandle);
           return groupList ? groupList : [];
        }
      };

   ObjectTypeData[dmz.stance.QuestionType] =
      { name: "Questions"
      , brush: dmz.ui.graph.createBrush({ r: 0.8, g: 0.8, b: 0.3 })
      , getGroups: getGroupFromCreatedBy
      , getUsers: getUserFromCreatedBy
      };

   ObjectTypeData[dmz.stance.VideoType] =
      { name: "Videos"
      , brush: dmz.ui.graph.createBrush({ r: 0.3, g: 0.8, b: 0.7 })
      , getGroups: getMediaGroups
      };

   ObjectTypeData[dmz.stance.VoteType] =
      { name: "Tasks"
      , brush: dmz.ui.graph.createBrush({ r: 0.3, g: 0.8, b: 0.3 })
      , getGroups: getGroupFromCreatedBy
      , getUsers: getUserFromCreatedBy
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

            var ret = [];
            data.getGroups().forEach(function (handle) {

               ret = ret.concat(getAllGroupUsers(handle));
            });
            return ret;
         };
      }

      objectTypeLayout.insertWidget(1, data.itemLabel);
      data.itemLabel.setChecked(true);
   });

//   updateGraph();

   graphWindow.show();
}());

updateUserList = function (index) {

   var handle = groupList.itemData(index)
     , groupData
     ;

   self.log.warn ("GroupList:", handle);
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

         self.log.warn ("user:", handle, userData.label.text(), userData.group, isCurrent);
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

   self.log.warn ("Link:", groupHandle, userHandle, userData, groupData);
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
      else {

         if (ObjectTypeData[type]) { ObjectTypeData[type].events.push(handle); }
         // Other types
//         data =
//            { handle: handle
//            , type: type
//            };

//         masterData.events[handle] = data;
//         nextObj = createBoxObj(handle, StdBox.w + StdBox.space, 0, 1, prevObj.box);
//         if (nextObj.box) { prevObj = nextObj; objCount += 1; }
      }
   }
});


