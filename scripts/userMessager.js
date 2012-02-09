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
   , USER_MESSAGE = " has pinged you because you have not logged in for over 3 days."
   , ADMIN_MESSAGE = "The Watcher has noticed that you have not logged in for 3 days and has pinged you."
   , SEND_MAIL = true
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
   , clearLayout
   , sendEmail
   , setButtonText
   , setUIItemLabels
   , initUIItems
   , init
   ;

clearLayout = function () {

   var widget;

   if (formContent && contentLayout) {

      widget = contentLayout.takeAt(0);
      while (widget) {

         widget.hide();
         widget = contentLayout.takeAt(0);
      }
      contentLayout.addStretch(1);
   }
};

sendEmail = function (userHandle) {

   if (SEND_MAIL && Users[userHandle] && EmailMod) {

      if ((dmz.object.scalar(hil, dmz.stance.Permissions) === dmz.stance.ADMIN_PERMISSION) ||
         (dmz.object.scalar(hil, dmz.stance.Permissions) === dmz.stance.TECH_PERMISSION)) {

         EmailMod.sendEmail(
            [userHandle],
            "STANCE: Watcher has pinged you. (DO NOT REPLY)",
            "The Watcher has noticed that you have not logged in for over 3 days, please remember that participation is part of your grade.", self);
      }
      else if (dmz.object.scalar(hil, dmz.stance.Permissions) === dmz.stance.STUDENT_PERMISSION) {

         EmailMod.sendEmail(
            [userHandle],
            "STANCE: " + Users[hil].displayName + " has pinged you. (DO NOT REPLY)",
            Users[hil].displayName + " has noticed that you have not logged in for over 3 days, please remember that participation is part of your grade.");
      }
      else if (dmz.object.scalar(hil, dmz.stance.Permissions) === dmz.stance.OBSERVER_PERMISSION) {

         EmailMod.sendEmail(
            [userHandle],
            "STANCE: An observer has pinged you. (DO NOT REPLY)",
            "An observer has noticed that you have not logged in for over 3 days, please remember that participation is part of your grade.");
      }
      else if (dmz.object.scalar(hil, dmz.stance.Permissions) === dmz.stance.ADVISOR_PERMISSION) {

         EmailMod.sendEmail(
            [userHandle],
            "STANCE: An advisor has pinged you. (DO NOT REPLY)",
            "An advisor has noticed that you have not logged in for over 3 days, please remember that participation is part of your grade.");
      }
      else {

         EmailMod.sendEmail(
            [userHandle],
            "STANCE: Someone has pinged you. (DO NOT REPLY)",
            "Someone has noticed that you have not logged in for over 3 days, please remember that participation is part of your grade.");
      }
   }
};

setButtonText = function (userHandle) {

   var THIRTY_SIX_HOURS = 129600
     , SIX_HOURS = 21600
     ;

   if (Users[userHandle] && Users[hil] && Users[userHandle].ui && Users[userHandle].ui.pingUserButton &&
      (Users[userHandle].lastLogin !== undefined) && (Users[userHandle].lastPing !== undefined) &&
      (Users[hil].lastLogin !== undefined)) {

      self.log.error("1:", (Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS) ,
         (Users[userHandle].lastPing === 0));
      self.log.error("2:", (Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS) ,
         (Users[hil].lastLogin - Users[userHandle].lastPing > SIX_HOURS));
      self.log.error("3:", (Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS) ,
         (Users[hil].lastLogin - Users[userHandle].lastPing >= 0) ,
         (Users[hil].lastLogin - Users[userHandle].lastPing < SIX_HOURS));

      if ((Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS) &&
         (Users[userHandle].lastPing === 0)) {

         Users[userHandle].ui.pingUserButton.enabled(true);
         Users[userHandle].ui.pingUserButton.text("Ping User");
      }
      else if ((Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS) &&
         (Users[hil].lastLogin - Users[userHandle].lastPing > SIX_HOURS)) {

         Users[userHandle].ui.pingUserButton.enabled(true);
         Users[userHandle].ui.pingUserButton.text("Ping User Again");
      }
      else if ((Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS) &&
         ((Users[hil].lastLogin - Users[userHandle].lastPing >= 0)) &&
         (Users[hil].lastLogin - Users[userHandle].lastPing < SIX_HOURS)) {

         Users[userHandle].ui.pingUserButton.enabled(false);
         Users[userHandle].ui.pingUserButton.text("Ping User Again");
      }
      else {

         Users[userHandle].ui.pingUserButton.enabled(false);
         Users[userHandle].ui.pingUserButton.text("Ping User");
      }
   }
};

setUIItemLabels = function (userHandle) {

   var pic;

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].ui.widget &&
      Users[userHandle].ui.userNameLabel && Users[userHandle].ui.pingUserButton &&
      Users[userHandle].ui.lastLoginLabel && Users[userHandle].ui.pictureLabel) {

      if (Users[userHandle].picture) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(Users[userHandle].picture));
         if (pic) {

            pic = pic.scaled(80, 80);
            if (pic) { Users[userHandle].ui.pictureLabel.pixmap(pic); }
         }
      }
      if (Users[userHandle].lastLogin === undefined || Users[userHandle].lastLogin === 0) {

         Users[userHandle].ui.lastLoginLabel.text("<b>Last Login: </b>No previous logins.");
      }
      else {

         Users[userHandle].ui.lastLoginLabel.text
            ("<b>Last Login: </b>" + toDate(Users[userHandle].lastLogin).toString(dmz.stance.TIME_FORMAT));
      }
      if (Users[userHandle].displayName) {

         Users[userHandle].ui.userNameLabel.text("<b>Name:</b> " + Users[userHandle].displayName);
      }
   }
};

initUIItems = function () {

   Object.keys(Users).forEach(function (key) {

      if (Users[key] && !Users[key].ui && (Users[key].groupHandle === userGroupHandle) &&
         Users[key].active && (Users[key].permissions === dmz.stance.STUDENT_PERMISSION)) {

         Users[key].ui = {};
         Users[key].ui.widget = dmz.ui.loader.load("PingUserWidget.ui");
         Users[key].ui.userNameLabel = Users[key].ui.widget.lookup("userNameLabel");
         Users[key].ui.lastLoginLabel = Users[key].ui.widget.lookup("lastLoginLabel");
         Users[key].ui.pictureLabel = Users[key].ui.widget.lookup("pictureLabel");
         Users[key].ui.pingUserButton = Users[key].ui.widget.lookup("pingUserButton");
         Users[key].ui.pingUserButton.observe(self, "clicked", function () {

            dmz.object.timeStamp(Users[key].handle, dmz.stance.LastPingTimeHandle, Users[hil].lastLogin);
            sendEmail(Users[key].handle);
         });
         setUIItemLabels(Users[key].handle);
         setButtonText(Users[key].handle);
         if (LoginSkipped) { Users[key].ui.pingUserButton.enabled(false); }
         contentLayout.insertWidget(0 , Users[key].ui.widget);
      }
   });
};

_exports.messagerForm = messagerForm;

_exports.openWindow = function () {

   if (!beenOpened) {

      initUIItems();
   }
   beenOpened = true;
};

_exports.closeWindow = function () {

};

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.UserType)) {

      Users[objHandle] = { handle: objHandle };
   }
});

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      hil = objHandle;
      dmz.time.setTimer(self, function () {

         userGroupHandle = dmz.stance.getUserGroupHandle(hil);
         clearLayout();
         Object.keys(Users).forEach(function (key) { Users[key].ui = false; })
         beenOpened = false;
      });
   }
});

dmz.object.flag.observe(self, dmz.stance.ActiveHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) { Users[objHandle].active = newVal; }
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
      dmz.time.setTimer(self, function () {

         Object.keys(Users).forEach(function (key) {

            setButtonText(Users[key].handle);
         });
      });
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.LastPingTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) {

      Users[objHandle].lastPing = newVal;
      dmz.time.setTimer(self, function () {

         Object.keys(Users).forEach(function (key) {

            setButtonText(Users[key].handle);
         });
      });
   }
});

dmz.object.scalar.observe(self, dmz.stance.Permissions,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) { Users[objHandle].permissions = newVal; }
});

dmz.object.link.observe(self, dmz.stance.OriginalGroupHandle,
function (linkHandle, attrHandle, supHandle, subHandle) {

   if (Users[supHandle]) { Users[supHandle].groupHandle = subHandle; }
});

dmz.module.subscribe(self, "email", function (Mode, module) {

   if (Mode === dmz.module.Activate) { EmailMod = module; }
});

LoginSkippedMessage.subscribe(self, function (data) { LoginSkipped = true; });

init = function () {

   formContent.layout(contentLayout);
   contentLayout.addStretch(1);
};

init();

dmz.module.publish(self, _exports);
