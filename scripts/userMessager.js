var dmz =
   { ui:
      { button: require("dmz/ui/button")
      , consts: require('dmz/ui/consts')
      , label: require("dmz/ui/label")
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , mainWindow: require('dmz/ui/mainWindow')
      , messageBox: require('dmz/ui/messageBox')
      , widget: require("dmz/ui/widget")
      , inputDialog: require("dmz/ui/inputDialog")
      , groupBox: require("dmz/ui/groupBox")
      , graph: require("dmz/ui/graph")
      , crypto: require("dmz/ui/crypto")
      }
   , stance: require("stanceConst")
   , data: require("dmz/runtime/data")
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , time: require("dmz/runtime/time")
   , util: require("dmz/types/util")
   , resources: require("dmz/runtime/resources")
   , message: require("dmz/runtime/messaging")
   , module: require("dmz/runtime/module")
   , mask: require("dmz/types/mask")
   }

   // UI Elements
   , messagerForm = dmz.ui.loader.load("VoteForm.ui")
   , scrollArea = messagerForm.lookup("scrollArea")
   , formContent = scrollArea.widget()
   , contentLayout = dmz.ui.layout.createVBoxLayout()

   // Variables
   , USER_STYLE = "#pingUserWidget{ background-color: rgb(220, 220, 220); }"
   , Users = {}
   , Groups = {}
   , beenOpened = false
   , hil
   , userGroupHandle
   , EmailMod = false
   , LoginSkippedMessage = dmz.message.create("Login_Skipped_Message")
   , LoginSkipped = false
   , _exports = {}

   // Functions
   , toDate = dmz.util.timeStampToDate
   , setupUserButtonObservers
   , setupUserUI
   , openWindow
   , closeWindow
   , init
   ;

setupUserButtonObservers = function (userHandle) {

   var messageText
     , recipients = []
     ;

   if (Users[userHandle] && Users[userHandle].ui && Users[hil] &&
      Users[hil].lastLogin && Users[userHandle].lastLogin) {

      // 129600 = 36Hrs
      // 21600 = 6Hrs
      var THIRTY_SIX_HOURS = 129600
        , SIX_HOURS = 21600
        ;

      if (dmz.stance.isAllowed(hil, dmz.stance.UnlimitedPingFlag)) {

         if (Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS) {

            // Ping again
            Users[userHandle].ui.pingUserButton.enabled(true);
            Users[userHandle].ui.pingUserButton.text("Ping User Again");
         }
         else if (Users[userHandle].lastLogin && Users[hil].lastLogin &&
            (Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS)) {

            // First Ping
            Users[userHandle].pingUserButton.enabled(true);
            Users[userHandle].pingUserButton("Ping User");
         }
         else {

            Users[userHandle].pingUserButton.enabled(false);
         }
      }
      else if (dmz.stance.isAllowed(hil, dmz.stance.LimitedPingFlag)) {

         if (Users[userHandle].lastPing && Users[hil].lastLogin && Users[userHandle].lastLogin &&
            (Users[hil].lastLogin - Users[userhandle].lastPing > SIX_HOURS) &&
            (Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS)) {

            // Ping again
            Users[userHandle].ui.pingUserButton.enabled(true);
            Users[userHandle].ui.pingUserButton.text("Ping User Again");
         }
         else if (Users[userHandle].lastLogin && Users[hil].lastLogin && Users[userHandle].lastPing &&
            (Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS)) {

            // First Ping
            Users[userHandle].ui.pingUserButton.enabled(true);
            Users[userHandle].ui.pingUserButton.text("Ping User Again");
         }
         else {

            Users[userHandle].pingUserButton.enabled(false);
         }
      }
      else {

         Users[userHandle].ui.pingUserButton.enabled(false);
      }
   }
};

setupUserUI = function (userHandle) {

   var pic;

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].picture) {

      pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(Users[userHandle].picture));
      if (pic) {

         pic = pic.scaled(80, 80);
         if (pic) { Users[userHandle].ui.pictureLabel.pixmap(pic); }
      }
      Users[userHandle].ui.userNameLabel.text("<b>User Name: </b>" + Users[userHandle].displayName);
      if (Users[userHandle].lastLogin === 0) {

         Users[userHandle].ui.lastLoginLabel.text("<b>Last Login: </b>No previous logins.");
      }
      else {

         Users[userHandle].ui.lastLoginLabel.text
            ("<b>Last Login: </b>" + toDate(Users[userHandle].lastLogin).toString(dmz.stance.TIME_FORMAT));
      }
      if (LoginSkipped) { Users[userHandle].ui.pingButton.enabled(false); }
      setupUserButtonObservers(userHandle);
      contentLayout.insertWidget(0, Users[userHandle].ui.userWidget);
   }
};

_exports.messagerForm = messagerForm;

_exports.openWindow = function () {

   if (!beenOpened) {

      Object.keys(Users).forEach(function (key) {

         var userWidget;

         if ((Users[key].groupHandle === userGroupHandle) &&
            (Users[key].handle !== hil) && Users[key].active &&
            (Users[key].permissions === dmz.stance.STUDENT_PERMISSION)) {

            if (!Users[key].ui) {

               userWidget = dmz.ui.loader.load("PingUserWidget.ui");
               userWidget.styleSheet(USER_STYLE);
               Users[key].ui = {};
               Users[key].ui.userWidget = userWidget;
               Users[key].ui.pictureLabel = userWidget.lookup("pictureLabel");
               Users[key].ui.userNameLabel = userWidget.lookup("userNameLabel");
               Users[key].ui.lastLoginLabel = userWidget.lookup("lastLoginLabel");
               Users[key].ui.pingUserButton = userWidget.lookup("pingUserButton");
               setupUserUI(Users[key].handle);
            }
         }
      });
   }
};

_exports.closeWindow = function () {

};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      dmz.time.setTimer(self, function () {

         hil = objHandle;
         userGroupHandle = dmz.stance.getUserGroupHandle(hil);
      });
   }
});

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.UserType)) {

      Users[objHandle] = { handle: objHandle }
   }
});

dmz.object.scalar.observe(self, dmz.stance.Permissions,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) { Users[objHandle].permissions = newVal; }
});

dmz.object.text.observe(self, dmz.stance.DisplayNameHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) { Users[objHandle].displayName = newVal; }
});

dmz.object.text.observe(self, dmz.stance.PictureHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) { Users[objHandle].picture = newVal; }
});

dmz.object.timeStamp.observe(self, dmz.stance.LastLoginTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) {

      Users[objHandle].lastLogin = newVal;
       if (objHandle === hil) {

         dmz.time.setTimer(self, function () {

            Object.keys(Users).forEach(function () {

               setupUserUI(key);
            });
         });
      }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.LastPingTimaHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) {

      Users[objHandle].lastPing = newVal;
      dmz.time.setTimer(self, function () {

         Object.keys(Users).forEach(function () {


         });
      });
   }
});

dmz.object.flag.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) { Users[objHandle].active = newVal; }
});

dmz.object.link.observe(self, dmz.stance.OriginalGroupHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Users[supHandle]) { Users[supHandle].groupHandle = subHandle; }
});

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) { EmailMod = module; }
});

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

dmz.time.setRepeatingTimer(self, 3600, function () {

   dmz.object.flag(hil, dmz.stance.UpdateLastLoginTimeHandle, true);
});

init = function () {

   formContent.layout(contentLayout);
   contentLayout.addStretch(1);
};

init();

dmz.module.publish(self, _exports);
