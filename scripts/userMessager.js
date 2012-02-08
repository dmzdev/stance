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
   , doButtons
   , clearLayout
   , sendEmail
   , setupUserButtonText
   , setupUserUI
   , openWindow
   , closeWindow
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

   if (SEND_MAIL && Users[userHandle]) {

      if ((dmz.object.scalar(hil, dmz.stance.Permissions) === dmz.stance.ADMIN_PERMISSION) ||
         (dmz.object.scalar(hil, dmz.stance.Permissions) === dmz.stance.TECH_PERMISSION)) {

         self.log.error("Sending email!");
         EmailMod.sendEmail(
            [userHandle],
            "STANCE: Watcher has pinged you. (DO NOT REPLY)",
            "The Watcher has noticed that you have not logged in for over 3 days, please remember that participation is part of your grade.", self);
         self.log.error("Email sent");
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

setupUserButtonText = function (userHandle) {

   var messageText
     , recipients = []
     ;

   if (Users[userHandle] && Users[userHandle].ui && Users[hil] &&
      Users[hil].lastLogin && Users[userHandle].lastLogin && EmailMod) {

      // 129600 = 36Hrs
      // 21600 = 6Hrs
      //var THIRTY_SIX_HOURS = 129600
        //, SIX_HOURS = 21600
        //;
      // Testing Values
      var THIRTY_SIX_HOURS = 120
        , SIX_HOURS = 120
        ;

      if (dmz.stance.isAllowed(hil, dmz.stance.UnlimitedPingFlag)) {

         self.log.error(Users[hil].lastLogin - Users[userHandle].lastLogin);
         if ((Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS) &&
            (Users[userHandle].lastPing !== undefined) && (Users[userHandle].lastPing === 0)) {

            // Ping First Time
            Users[userHandle].ui.pingUserButton.enabled(true);
            Users[userHandle].ui.pingUserButton.text("Ping User");
         }
         else if (Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS) {

            // Ping Again
            Users[userHandle].ui.pingUserButton.enabled(true);
            Users[userHandle].ui.pingUserButton.text("Ping User Again");
         }
         else {

            Users[userHandle].ui.pingUserButton.enabled(false);
            Users[userHandle].ui.pingUserButton.text("Ping User")
         }
      }
      else if (dmz.stance.isAllowed(hil, dmz.stance.LimitedPingFlag)) {

         if (Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS &&
            (Users[userHandle].lastPing !== undefined) && (Users[userHandle].lastPing === 0)) {

            // Ping First Time
            Users[userHandle].ui.pingUserButton.enabled(true);
            Users[userHandle].ui.pingUserButton.text("Ping User");
         }
         else if (Users[hil].lastLogin - Users[userHandle].lastLogin > THIRTY_SIX_HOURS &&
            (Users[userHandle].lastPing !== undefined) &&
            (Users[hil].lastLogin - Users[userHandle].lastPing > SIX_HOURS)) {

            // Ping Again
            Users[userHandle].ui.pingUserButton.enabled(true);
            Users[userHandle].ui.pingUserButton.text("Ping User Again");
         }
         else if (Users[hil].lastLogin - Users[userHandle] > THIRTY_SIX_HOURS &&
            (Users[userHandle].lastPing !== undefined) &&
            (Users[hil].lastLogin - Users[userHandle].lastPing > 0) &&
            (Users[hil].lastLogin - Users[userHandle].lastPing < SIX_HOURS)) {

            Users[userHandle].ui.pingUserButton.enabled(false);
            Users[userHandle].ui.pingUserButton.text("Ping User Again");
         }
         else {

            Users[userHandle].ui.pingUserButton.enabled(false);
            Users[userHandle].ui.pingUserButton.text("Ping User")
         }
      }
      else {

         Users[userHandle].ui.pingUserButton.enabled(false);
         Users[userHandle].ui.pingUserButton.text("Ping User");
      }
   }
};

setupUserUI = function (userHandle) {

   var pic;

   if (Users[userHandle] && Users[userHandle].ui && Users[userHandle].picture) {

      if (!beenOpened) {

         pic = dmz.ui.graph.createPixmap(dmz.resources.findFile(Users[userHandle].picture));
         if (pic) {

            pic = pic.scaled(80, 80);
            if (pic) { Users[userHandle].ui.pictureLabel.pixmap(pic); }
         }
         Users[userHandle].ui.userNameLabel.text("<b>User Name: </b>" + Users[userHandle].displayName);
      }
      if (Users[userHandle].lastLogin === 0) {

         Users[userHandle].ui.lastLoginLabel.text("<b>Last Login: </b>No previous logins.");
      }
      else {

         Users[userHandle].ui.lastLoginLabel.text
            ("<b>Last Login: </b>" + toDate(Users[userHandle].lastLogin).toString(dmz.stance.TIME_FORMAT));
      }
      setupUserButtonText(userHandle);
      if (LoginSkipped) { Users[userHandle].ui.pingUserButton.enabled(false); }
      contentLayout.insertWidget(0, Users[userHandle].ui.userWidget);
   }
};

doButtons = function (userHandle) {

   if (!beenOpened) {

      self.log.error("Doing Buttons");
      Object.keys(Users).forEach(function (key) {

         self.log.error("In loop", Users[key], Users[key].ui, Users[key].pingUserButton);
         if (Users[key] && Users[key].ui && Users[key].pingUserButton) {

            self.log.error("Creating Callback", key);
            Users[key].ui.pingUserButton.observe(self, "clicked", function () {

               self.log.error("CALLBACK RUNNING!");
               dmz.object.timeStamp(key, dmz.stance.LastPingTimeHandle, Users[hil].lastLogin);
               sendEmail(key);
            });
         }
      });
   }
};

_exports.users = Users;

_exports.hil = hil;

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
               self.log.error("CREATING CALLBACK");
               Users[key].ui.pingUserButton.observe(self, "clicked", function () {

                  self.log.error("CALLBACK RUNNING!", key, dmz.stance.LastPingTimeHandle, Users[hil].lastLogin);
                  self.log.error(dmz.object.timeStamp(key, dmz.stance.LastPingTimeHandle, Users[hil].lastLogin));
                  sendEmail(key);
               });
               setupUserUI(Users[key].handle);
            }
         }
      });
   }
   beenOpened = true;
};;

_exports.closeWindow = function () {

};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      dmz.time.setTimer(self, function () {

         hil = objHandle;
         userGroupHandle = dmz.stance.getUserGroupHandle(hil);
         clearLayout();
         Object.keys(Users).forEach(function (key) {

            Users[key].ui = false;
         });
         beenOpened = false;
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
      if (objHandle === hil && beenOpened) {

         dmz.time.setTimer(self, function () {

            Object.keys(Users).forEach(function (key) {

               setupUserUI(key);
            });
         });
      }
   }
});

dmz.object.timeStamp.observe(self, dmz.stance.LastPingTimeHandle,
function (objHandle, attrHandle, newVal, oldVal) {

   if (Users[objHandle]) {

      Users[objHandle].lastPing = newVal;
      dmz.time.setTimer(self, function () {

         if (beenOpened) { setupUserUI(objHandle); }
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
