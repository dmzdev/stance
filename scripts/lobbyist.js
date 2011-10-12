var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , consts: require('dmz/ui/consts')
      , graph: require("dmz/ui/graph")
      , inputDialog: require("dmz/ui/inputDialog")
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , messageBox: require("dmz/ui/messageBox")
      , mainWindow: require('dmz/ui/mainWindow')
      , treeWidget: require("dmz/ui/treeWidget")
      , webview: require("dmz/ui/webView")
      , widget: require("dmz/ui/widget")
      }
   , data: require("dmz/runtime/data")
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

   // UI Elements
   , lobbyistForm = dmz.ui.loader.load("LobbyistWindow.ui")
   , messageText = lobbyistForm.lookup("messageText")
   , nameLabel = lobbyistForm.lookup("nameLabel")
   , specialityLabel = lobbyistForm.lookup("specialityLabel")
   , pictureLabel = lobbyistForm.lookup("pictureLabel")
   , nextButton = lobbyistForm.lookup("nextButton")
   , prevButton = lobbyistForm.lookup("prevButton")
   , currLabel = lobbyistForm.lookup("currentLabel")
   , totalLabel = lobbyistForm.lookup("totalLabel")
   , unseenItemsLabel = lobbyistForm.lookup("unseenItemsLabel")
   , cancelButton = lobbyistForm.lookup("cancelButton")
   , deleteButton = lobbyistForm.lookup("deleteButton")
   , tagButton = lobbyistForm.lookup("tagButton")
   , tagLabel = lobbyistForm.lookup("tagLabel")

   // Variables
   , hil
   , userGroupHandle
   , Groups = {}
   , Lobbyists = {}
   , LobbyistsArray = []
   , CurrentLobbyistIndex = 0
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , beenOpened = false

   // Functions
   , initialButtonObserve
   , clickDelete
   , confirmDelete
   , clickCancel
   , checkNotifications
   , setLabels
   , loadCurrentLobbyist
   , populateLobbyistsArray
   , openWindow
   , init
   ;

initialButtonObserve = function () {

   if (dmz.stance.isAllowed(hil, dmz.stance.TagDataFlag)) { tagButton.show(); }
   else { tagButton.hide(); }
   if (dmz.stance.isAllowed(hil, dmz.stance.AlterMediaFlag)) {

      deleteButton.observe(self, "clicked", function () {

         clickDelete();
      });
      cancelButton.hide();
      deleteButton.show();
   }
   else {

      cancelButton.hide();
      deleteButton.hide();
   }
};

clickDelete = function () {

   if ((CurrentLobbyistIndex !== undefined) && LobbyistsArray.length) {

      if (dmz.stance.isAllowed(hil, dmz.stance.TagDataFlag)) { tagButton.hide(); }
      cancelButton.show();
      deleteButton.observe(self, "clicked", function () {

         confirmDelete()
      });
      cancelButton.observe(self, "clicked", function () {

         clickCancel()
      });
   }
};

confirmDelete = function () {

   if ((CurrentLobbyistIndex !== undefined) && LobbyistsArray.length) {

      dmz.object.flag(LobbyistsArray[CurrentLobbyistIndex].handle, dmz.stance.ActiveHandle, false);
      CurrentLobbyistIndex = 0;
      populateLobbyistsArray();
      loadCurrentLobbyist();
      initialButtonObserve();
      setLabels();
   }
};

clickCancel = function () { initialButtonObserve(); };

tagButton.observe(self, "clicked", function () {

   if ((CurrentLobbyistIndex !== undefined) && LobbyistsArray.length) {

      dmz.stance.TAG_MESSAGE.send(dmz.data.wrapHandle(LobbyistsArray[CurrentLobbyistIndex].handle));
   }
});

prevButton.observe(self, "clicked", function () {

   if (CurrentLobbyistIndex > 0) {

      CurrentLobbyistIndex -= 1;
      loadCurrentLobbyist();
      setLabels();
   }
});

nextButton.observe(self, "clicked", function () {

   if (!((CurrentLobbyistIndex + 1) >= LobbyistsArray.length)) {

      CurrentLobbyistIndex += 1;
      loadCurrentLobbyist();
      setLabels();
   }
});

checkNotifications = function () {

   if (LobbyistsArray.length) {

      LobbyistsArray.forEach(function (lobbyistItem) {

         if (lobbyistItem.viewed.indexOf(hil) === -1) {

            MainModule.highlight("Lobbyist");
         }
      });
   }
};

setLabels = function () {

   var notSeen = 0;

   totalLabel.text(LobbyistsArray.length);
   if (LobbyistsArray.length) {

      currLabel.text(CurrentLobbyistIndex + 1);
      LobbyistsArray.forEach(function (lobbyistItem) {

         if (lobbyistItem.viewed.indexOf(hil) === -1) {

            notSeen += 1;
         }
      });
      unseenItemsLabel.text("Unseen Items: " + notSeen);
   }
   else {

      currLabel.text(CurrentLobbyistIndex);
      unseenItemsLabel.text("Unseen Items: 0")
   }
   if (dmz.stance.isAllowed(hil, dmz.stance.SeeTagFlag) &&
      LobbyistsArray[CurrentLobbyistIndex] && LobbyistsArray[CurrentLobbyistIndex].tags) {

      tagLabel.text(LobbyistsArray[CurrentLobbyistIndex].tags.toString());
   }
   else { tagLabel.text(""); }
};

loadCurrentLobbyist = function () {

   var lobbyistItem
     , pic
     ;

   if (LobbyistsArray.length === 0) {

      messageText.text("");
      nameLabel.text("");
      specialityLabel.text("");
      pictureLabel.clear();
   }
   else if (CurrentLobbyistIndex < LobbyistsArray.length) {

      lobbyistItem = LobbyistsArray[CurrentLobbyistIndex];
      if (lobbyistItem && lobbyistItem.picture && lobbyistItem.message && lobbyistItem.name &&
         lobbyistItem.handle) {

         messageText.text(lobbyistItem.message);
         nameLabel.text(lobbyistItem.name);
         specialityLabel.text(lobbyistItem.title);
         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(lobbyistItem.picture));
         if (pic) { pictureLabel.pixmap(pic); }
         dmz.object.link(dmz.stance.MediaHandle, lobbyistItem.handle, hil);
      }
   }
};

populateLobbyistsArray = function () {

   LobbyistsArray = [];
   Object.keys(Lobbyists).forEach(function (key) {

      Lobbyists[key].groups.forEach(function (groupHandle) {

         if ((groupHandle === userGroupHandle) && Lobbyists[key].active) {

            LobbyistsArray.push(Lobbyists[key]);
         }
      });
   });
   LobbyistsArray.sort(function (obj1, obj2) {

      var result = obj2.createdAt - obj1.createdAt;
      if (obj1.createdAt === 0) { result = -1; }
      if (obj2.createdAt === 0) { result = 1; }
      return result ? result : 0;
   });
   CurrentLobbyistIndex = 0;
};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      hil = objHandle;
      dmz.time.setTimer(self, function () {

         initialButtonObserve();
         userGroupHandle = dmz.stance.getUserGroupHandle(hil);
         populateLobbyistsArray();
         checkNotifications();
      });
   }
});

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.LobbyistType)) {

      Lobbyists[objHandle] =
         { handle: objHandle
         , viewed: []
         , groups: []
         };
   }
   else if (objType.isOfType(dmz.stance.GroupType)) {

      Groups[objHandle] = { handle: objHandle };
   }
});

dmz.object.text.observe(self, dmz.stance.PictureHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Lobbyists[objHandle]) { Lobbyists[objHandle].picture = newVal; }
});

dmz.object.text.observe(self, dmz.stance.NameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Lobbyists[objHandle]) { Lobbyists[objHandle].name = newVal; }
});

dmz.object.text.observe(self, dmz.stance.TitleHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Lobbyists[objHandle]) { Lobbyists[objHandle].title = newVal; }
});

dmz.object.text.observe(self, dmz.stance.TextHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Lobbyists[objHandle]) { Lobbyists[objHandle].message = newVal; }
});

dmz.object.timeStamp.observe(self, dmz.stance.CreatedAtServerTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Lobbyists[objHandle]) { Lobbyists[objHandle].createdAt = newVal; }
});

dmz.object.flag.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Lobbyists[objHandle]) { Lobbyists[objHandle].active = newVal; }
});

dmz.object.text.observe(self, dmz.stance.NameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Groups[objHandle]) { Groups[objHandle].name = newVal; }
});

dmz.object.data.observe(self, dmz.stance.TagHandle,
function (objHandle, attrHandle, data) {

   if (Lobbyists[objHandle]) {

      Lobbyists[objHandle].tags = dmz.stance.getTags(data);
      setLabels();
   }
});

dmz.object.link.observe(self, dmz.stance.MediaHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Lobbyists[supHandle]) {

      if (dmz.object.type(subHandle).isOfType(dmz.stance.GroupType)) {

         Lobbyists[supHandle].groups.push(subHandle);
         dmz.time.setTimer(self, function () {

            populateLobbyistsArray();
            checkNotifications();
         });
      }
      else if (dmz.object.type(subHandle).isOfType(dmz.stance.UserType)) {

         Lobbyists[supHandle].viewed.push(subHandle);
      }
   }
});

openWindow = function () {

   beenOpened = true;
   populateLobbyistsArray();
   loadCurrentLobbyist();
   setLabels();
};

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;
   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage
         ( "Lobbyist"
         , lobbyistForm
         , openWindow
         , checkNotifications
         );
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   var pic;

   tagButton.hide();
   pic = dmz.ui.graph.createPixmap(dmz.resources.findFile("tagButton"));
   if (pic) { tagButton.setIcon(pic); }
   tagButton.styleSheet(dmz.stance.YELLOW_BUTTON);
   deleteButton.hide();
   deleteButton.styleSheet(dmz.stance.RED_BUTTON);
   cancelButton.hide();
   cancelButton.styleSheet(dmz.stance.GREEN_BUTTON);
   tagLabel.text("");
};

init();
