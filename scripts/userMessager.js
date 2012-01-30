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
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
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

   if (Users[userHandle] && Users[userHandle].ui) {

      Users[userHandle].ui.createButton.show();
      Users[userHandle].ui.cancelButton.hide();
      Users[userHandle].ui.sendButton.hide();
      Users[userHandle].ui.messageEdit.hide();
      Users[userHandle].ui.messageEdit.text("");
      Users[userHandle].ui.createButton.observe(self, "clicked", function () {

         Users[userHandle].ui.errorLabel.hide();
         Users[userHandle].ui.errorLabel.text("");
         Users[userHandle].ui.createButton.hide();
         Users[userHandle].ui.cancelButton.show();
         Users[userHandle].ui.sendButton.show();
         Users[userHandle].ui.messageEdit.show();
         Users[userHandle].ui.messageEdit.text("");
      });
      Users[userHandle].ui.cancelButton.observe(self, "clicked", function () {

         Users[userHandle].ui.errorLabel.hide();
         Users[userHandle].ui.errorLabel.text("");
         Users[userHandle].ui.createButton.show();
         Users[userHandle].ui.cancelButton.hide();
         Users[userHandle].ui.sendButton.hide();
         Users[userHandle].ui.messageEdit.hide();
         Users[userHandle].ui.messageEdit.text("");
      });
      Users[userHandle].ui.sendButton.observe(self, "clicked", function () {

         if (Users[userHandle].ui.messageEdit.text() === "") {

            Users[userHandle].ui.errorLabel.show();
            Users[userHandle].ui.errorLabel.text("<font color=\"red\">Please enter a message.</font>");
         }
         else {

            EmailMod.sendEmail(
               [userHandle],
               ("STANCE: User " + dmz.object.text(hil, dmz.stance.DisplayNameHandle) + " has sent you a message."),
               Users[userHandle].ui.messageEdit.text());

            Users[userHandle].ui.errorLabel.hide();
            Users[userHandle].ui.errorLabel.text("");
            Users[userHandle].ui.createButton.show();
            Users[userHandle].ui.cancelButton.hide();
            Users[userHandle].ui.sendButton.hide();
            Users[userHandle].ui.messageEdit.hide();
            Users[userHandle].ui.messageEdit.text("");
         }
      });
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
      Users[userHandle].ui.errorLabel.hide();
      if (LoginSkipped) { Users[userHandle].ui.createButton.enabled(false); }
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
               Users[key].ui.messageEdit = userWidget.lookup("messageEdit");
               Users[key].ui.cancelButton = userWidget.lookup("cancelButton");
               Users[key].ui.createButton = userWidget.lookup("createButton");
               Users[key].ui.sendButton = userWidget.lookup("sendButton");
               Users[key].ui.errorLabel = userWidget.lookup("errorLabel");
               setupUserUI(Users[key].handle);
            }
         }
      });
   }
};

_exports.closeWindow = function () {

   Object.keys(Users).forEach(function (key) {

      if (Users[key] && Users[key].ui) {

         Users[key].ui.errorLabel.hide();
         Users[key].ui.errorLabel.text("");
         Users[key].ui.createButton.show();
         Users[key].ui.cancelButton.hide();
         Users[key].ui.sendButton.hide();
         Users[key].ui.messageEdit.hide();
         Users[key].ui.messageEdit.text("");
      }
   });
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

   if (Users[objHandle]) { Users[objHandle].lastLogin = newVal; }
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

/*dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage("Rolodex", messagerForm, openWindow, closeWindow);
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});
*/

init = function () {

   formContent.layout(contentLayout);
   contentLayout.addStretch(1);
};

init();

dmz.module.publish(self, _exports);
