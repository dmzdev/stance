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

   // Functions
   , toDate = dmz.util.timeStampToDate
   , setLobbyistsSeenLabel
   , setNewspapersSeenLabel
   , setVideosSeenLabel
   , setMemosSeenLabel
   , setLastLoginSeenLabel
   , setUserNameLabel
   , createUserWidget
   , createGroupTabs
   , init
   ;

ShowStudentsMessage.subscribe(self, function () {

   createGroupTabs();
   userInfoWidget.show();
});

setLobbyistsSeenLabel = function (userHandle) {

};

setNewspapersSeenLabel = function (userHandle) {

};

setVideosSeenLabel = function (userHandle) {

};

setMemosSeenLabel = function (userHandle) {

};

setLastLoginSeenLabel = function (userHandle) {

};

setUserNameLabel = function (userHandle) {

};

createUserWidget = function (userHandle) {

   var userWidget = dmz.ui.loader.load("");
};

createGroupTabs = function () {

   var widget
     , layout
     ;

   groupTabs.clear();
   Object.keys(Groups).forEach(function (key) {

      widget = dmz.ui.widget.create();
      groupTabs.add(widget, Groups[key].name);
   });
};

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.GroupType)) {

      Groups[objHandle] = { handle: objHandle };
   }
   if (objType.isOfType(dmz.stance.UserType)) {

      Users[objHandle] = { handle: objHandle };
   }
});

dmz.object.text.observe(self, dmz.stance.NameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Groups[objHandle]) {

      Groups[objHandle].name = newVal;
   }
   if (Users[objHandle]) {

      Users[objHandle].name = newVal;
   }
});

dmz.object.text.observe(self, dmz.stance.DisplayNameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) {

      Users[objHandle].displayName = newVal;
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

