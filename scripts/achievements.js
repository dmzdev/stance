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
   , achievementForm = dmz.ui.loader.load("VoteForm.ui")
   , scrollArea = achievementForm.lookup("scrollArea")
   , formContent = scrollArea.widget()
   , contentLayout = dmz.ui.layout.createVBoxLayout()

   // Variables
   , ACHIEVEMENT_STYLE = "*{ background-color: rgb(0, 0, 0); }"
   , BRONZE_STYLE = "*{ background-color: rgb(150, 90, 56); }"
   , SILVER_STYLE = "*{ background-color: rgb(168, 168, 168); }"
   , GOLD_STYLE = "*{ background-color: rgb(217, 164, 65); }"
   , Users = {}
   , Achievements = []
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , beenOpened = false
   , hil
   , _exports = {}

   // Functions
   , removeNotifications
   , addAchievementUIElement
   , init
   ;

removeNotifications = function () {

   Achievements.forEach(function (item) { item.notif.hide(); });
};

addAchievementUIElement = function (achievement, isNew) {

   var achievementItem = dmz.ui.loader.load("AchievementItem.ui")
     , achievementTitleLabel = achievementItem.lookup("achievementTitleLabel")
     , achievementDescriptionLabel = achievementItem.lookup("achievementDescriptionLabel")
     , achievementPictureLabel = achievementItem.lookup("achievementPictureLabel")
     , list = self.config.get("achievement-set")
     , achievementList
     , achievementName = ""
     , achievementDescription = ""
     , achievementImage = ""
     , notificationLabel = dmz.ui.label.create(achievementItem)
     , achievementLevel = 3
     ;

   notificationLabel.fixedWidth(34);
   notificationLabel.pixmap((dmz.ui.graph.createPixmap(dmz.resources.findFile("PushNotify"))));
   notificationLabel.move(0, 0);
   list.forEach(function (listItem) {

      achievementList = listItem.get("achievement") || [];
      achievementList.forEach(function (achievementItem) {

         if (dmz.defs.lookupStateName(achievement) == achievementItem.string("name")) {

            achievementName = achievementItem.string("title") || "";
            achievementDescription = achievementItem.string("description") || "";
            achievementLevel = achievementItem.number("level");
            achievementImage = achievementItem.string("resource");
            if (achievementImage) { achievementImage = dmz.resources.findFile(achievementImage); }
            if (achievementImage) { achievementImage = dmz.ui.graph.createPixmap(achievementImage); }
            if (achievementImage) { achievementImage = achievementImage.scaled(80, 80); }
            if (achievementImage) { achievementPictureLabel.pixmap(achievementImage); }
         }
      });
   });
   if (achievementLevel === 3) { achievementItem.styleSheet(ACHIEVEMENT_STYLE); }
   else if (achievementLevel === 2) { achievementItem.styleSheet(GOLD_STYLE); }
   else if (achievementLevel === 1) { achievementItem.styleSheet(SILVER_STYLE); }
   else if (achievementLevel === 0) { achievementItem.styleSheet(BRONZE_STYLE); }
   achievementTitleLabel.text("<b>Title: </b>" + achievementName);
   achievementDescriptionLabel.text("<b>Description: </b>" + achievementDescription);
   contentLayout.insertWidget(0, achievementItem);
   if (isNew) { notificationLabel.show(); }
   else { notificationLabel.hide(); }
   Achievements.push({ ui: achievementItem, notif: notificationLabel });
};

_exports.achievementForm = achievementForm;

_exports.initialWindowOpen = function () {

   var allAchievements = dmz.stance.getAchievementStates();

   if (allAchievements && !beenOpened) {

      beenOpened = true;
      Object.keys(allAchievements).forEach(function (key) {

         if (Users[hil] && Users[hil].achievements &&
            Users[hil].achievements.and(allAchievements[key]).bool()) {

            if ((Users[hil].previousAchievements &&
               !Users[hil].achievements.and(allAchievements[key]).and(Users[hil].previousAchievements).bool()) ||
               !Users[hil].previousAchievements) {

               addAchievementUIElement(allAchievements[key], true);
            }
            else { addAchievementUIElement(allAchievements[key], false); }
         }
      });
   }
};

_exports.closeWindow = function () {

   removeNotifications();
   dmz.object.state(hil, dmz.stance.PreviousAchievements, Users[hil].achievements);
};

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      hil = objHandle;
      dmz.time.setTimer(self, function () {

         if (Users[objHandle] && !Users[objHandle].previousAchievements && Users[objHandle].achievements) {

            MainModule.highlight("Rolodex");
         }
         else if (Users[objHandle] &&
            Users[objHandle].previousAchievements &&
            Users[objHandle].achievements &&
            Users[objHandle].previousAchievements.xor(Users[objHandle].achievements).bool()) {

            MainModule.highlight("Rolodex");
         }
      });
   }
});

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType.isOfType(dmz.stance.UserType)) { Users[objHandle] = { handle: objHandle }; }
});

dmz.object.state.observe(self, dmz.stance.PreviousAchievements,
function (userHandle, attrHandle, state) {

   if (Users[userHandle]) { Users[userHandle].previousAchievements = state; }
});

dmz.object.state.observe(self, dmz.stance.Achievements,
function (userHandle, attrHandle, state) {

   var newAchievement
     //, userAchievements = []
     //, allAchievements = dmz.stance.getAchievementStates()
     ;

   if (Users[userHandle] && Users[userHandle].achievements) {

      /*Object.keys(allAchievements).forEach(function (key) {

         if (allAchievements[key].and(state).bool()) {

            userAchievements.push(allAchievements[key]);
         }
      });
      userAchievements.forEach(function (achievement) {

         if (!achievement.and(Users[userHandle].achievements).bool()) {

            self.log.error("New achievements!", achievement, dmz.defs.lookupStateName(achievement));
         }
      });*/
      // Above code can account for multiple achievements unlocked at once, uncomment
      // if needed.
      newAchievement = Users[userHandle].achievements.xor(state);
      addAchievementUIElement(newAchievement, true);
      //self.log.error("New achievements!", newState, dmz.defs.lookupStateName(newState));
      Users[userHandle].achievements = Users[userHandle].achievements.or(state);
      dmz.time.setTimer(self, function () {

         if (!Users[userHandle].previousAchievements) { MainModule.highlight("Rolodex"); }
         else if (Users[userHandle].previousAchievements.xor(Users[userHandle].achievements).bool()) {

            MainModule.highlight("Rolodex");
         }
      });
   }
   else if (Users[userHandle]) {

      Users[userHandle].achievements = state;
      dmz.time.setTimer(self, function () {

         if (!Users[userHandle].previousAchievements) { MainModule.highlight("Rolodex"); }
         else if (Users[userHandle].previousAchievements.xor(Users[userHandle].achievements).bool()) {

            MainModule.highlight("Rolodex");
         }
      });
   }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   formContent.layout(contentLayout);
   contentLayout.addStretch(1);
};

init();

dmz.module.publish(self, _exports);
