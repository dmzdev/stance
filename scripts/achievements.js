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
   , ACHIEVEMENT_STYLE = "#Form { background-color: rgb(0, 0, 0); }"
   , BRONZE_STYLE = "#Form { background-color: rgb(150, 90, 56); }"
   , SILVER_STYLE = "#Form { background-color: rgb(168, 168, 168); }"
   , GOLD_STYLE = "#Form { background-color: rgb(217, 164, 65); }"
   , GOLD = 3
   , SILVER = 2
   , BRONZE = 1
   , Users = {}
   , Achievements = {}
   , NonLayeredAchievements = {}
   , UIArray = []
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , beenOpened = false
   , hil
   , _exports = {}

   // Functions
   , checkForNotifications
   , addAchievementItemUI
   , init
   ;

checkForNotifications = function () {

   if (Users[hil] && Users[hil].achievements) {

      if (!Users[hil].previousAchievements) {

         MainModule.highlight("Rolodex");
         Object.keys(NonLayeredAchievements).forEach(function (key) {

            var data;

            if (NonLayeredAchievements[key].achievement.and(Users[hil].achievements).bool() &&
               !NonLayeredAchievements[key].messageSent) {

               NonLayeredAchievements[key].messageSent = true;
               data = dmz.data.create();
               data.string(dmz.stance.NameHandle, 0, NonLayeredAchievements[key].title);
               data.string(dmz.stance.PictureHandle, 0, NonLayeredAchievements[key].picture);
               dmz.time.setTimer(self, 2, function () { dmz.stance.ACHIEVEMENT_MESSAGE.send(data); });
            }
         });
      }
      else if (Users[hil].achievements.xor(Users[hil].previousAchievements).bool()) {

         MainModule.highlight("Rolodex");
         Object.keys(NonLayeredAchievements).forEach(function (key) {

            var isInAchievements = false
               , isInPreviousAchievements = false
               , data
               ;

            if (NonLayeredAchievements[key].achievement.and(Users[hil].achievements).bool()) {

               isInAchievements = true;
            }
            if (NonLayeredAchievements[key].achievement.and(Users[hil].previousAchievements).bool()) {

               isInPreviousAchievements = true;
            }
            if (isInAchievements && !isInPreviousAchievements && !NonLayeredAchievements[key].messageSent) {

               NonLayeredAchievements[key].messageSent = true;
               data = dmz.data.create();
               data.string(dmz.stance.NameHandle, 0, NonLayeredAchievements[key].title);
               data.string(dmz.stance.PictureHandle, 0, NonLayeredAchievements[key].picture);
               dmz.time.setTimer(self, 2, function () { dmz.stance.ACHIEVEMENT_MESSAGE.send(data); });
            }
         });
      }
   }
};

addAchievementItemUI = function (achievementSet) {

   if (!achievementSet.ui) {

      achievementSet.ui = {};
      achievementSet.ui.widget = dmz.ui.loader.load("AchievementItem.ui");
      achievementSet.ui.achievementTitleLabel = achievementSet.ui.widget.lookup("achievementTitleLabel");
      achievementSet.ui.achievementDescriptionLabel = achievementSet.ui.widget.lookup("achievementDescriptionLabel");
      achievementSet.ui.achievementPictureLabel = achievementSet.ui.widget.lookup("achievementPictureLabel");
      achievementSet.ui.notificationLabel = dmz.ui.label.create(achievementSet.ui.widget);
      achievementSet.ui.notificationLabel.fixedWidth(34);
      achievementSet.ui.notificationLabel.pixmap((dmz.ui.graph.createPixmap(dmz.resources.findFile("PushNotify"))));
   }
   achievementSet.achievements.forEach(function (achievementItem) {

      if (dmz.stance.hasAchievement(hil, achievementItem.achievement) &&
         (achievementItem.level > achievementSet.currentLevel)) {

         if (achievementSet.currentLevel === 0) { contentLayout.insertWidget(0, achievementSet.ui.widget); }
         achievementSet.ui.achievementTitleLabel.text("<b>Title: </b>" + achievementItem.title);
         achievementSet.ui.achievementDescriptionLabel.text("<b>Description: </b>" + achievementItem.description);
         achievementSet.ui.achievementPictureLabel.pixmap(achievementItem.picturePixmap);
         achievementSet.currentLevel = achievementItem.level;
         if (achievementItem.level === GOLD) {

            achievementSet.ui.widget.styleSheet(GOLD_STYLE);
         }
         else if (achievementItem.level === SILVER) {

            achievementSet.ui.widget.styleSheet(SILVER_STYLE);
         }
         else if (achievementItem.level === BRONZE) {

            achievementSet.ui.widget.styleSheet(BRONZE_STYLE);
         }
         if (!dmz.stance.hasSeenAchievement(hil, achievementItem.achievement)) {

            achievementSet.ui.notificationLabel.show();
         }
         else { achievementSet.ui.notificationLabel.hide(); }
      }
   });
};

_exports.openWindow = function () {

   if (!beenOpened) {

      Object.keys(Achievements).forEach(function (key) {

         addAchievementItemUI(Achievements[key]);
      });
   }
   beenOpened = true;
};

_exports.closeWindow = function () {

   Object.keys(Achievements).forEach(function (key) {

      Achievements[key].ui.notificationLabel.hide();
   });
   if (Users[hil].achievements) {

      dmz.object.state(hil, dmz.stance.PreviousAchievements, Users[hil].achievements);
   }
};

_exports.achievementForm = achievementForm;

dmz.object.flag.observe(self, dmz.object.HILAttribute,
function (objHandle, attrHandle, value) {

   if (value) {

      hil = objHandle;
      dmz.time.setTimer(self, function () { checkForNotifications(); });
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

   if (Users[userHandle]) { Users[userHandle].achievements = state; }
   dmz.time.setTimer(self, function () {

      var newAchievement = false;

      checkForNotifications();
      if (Users[userHandle].previousAchievements) {

         newAchievement = Users[userHandle].achievements.xor(Users[userHandle].previousAchievements);
      }
      if (beenOpened && newAchievement) {

         Object.keys(Achievements).forEach(function (key) {

            Achievements[key].achievements.forEach(function (achievementItem) {

               if (achievementItem.achievement.and(newAchievement).bool()) {

                  addAchievementItemUI(Achievements[key]);
               }
            });
         });
      }
   });
});

init = function () {

   var list = self.config.get("achievement-set.set");

   formContent.layout(contentLayout);
   contentLayout.addStretch(1);
   list.forEach(function (setItem) {

      var setItemList = setItem.get("achievement")
        , setItemName = setItem.string("name")
        ;

      Achievements[setItemName] =
         { ui: false
         , achievements: []
         , currentLevel: 0
         , name: setItemName
         };
      setItemList.forEach(function (achievement) {

         var picture = achievement.string("resource")
           , achievementName = achievement.string("name")
           , pictureString = ""
           ;

         if (picture) {

            pictureString = picture;
            picture = dmz.resources.findFile(picture);
         }
         if (picture) { picture = dmz.ui.graph.createPixmap(picture); }
         if (picture) { picture = picture.scaled(100, 100); }
         NonLayeredAchievements[achievementName] =
            { name: achievementName
            , title: achievement.string("title")
            , description: achievement.string("description")
            , picture: pictureString
            , picturePixmap: picture
            , achievement: dmz.defs.lookupState(achievementName)
            , level: achievement.number("level")
            , messageSent: false
            };
         Achievements[setItemName].achievements.push(NonLayeredAchievements[achievementName]);
      });
   });
};

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init();

dmz.module.publish(self, _exports);
