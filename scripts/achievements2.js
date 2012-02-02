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
   , Achievements = {}
   , UIArray = []
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }
   , beenOpened = false
   , hil
   , _exports = {}

   // Functions
   , createAchievementUIElement
   , openWindow
   , init
   ;

createAchievementUIElement = function() {

};

openWindow = function () {

   if (!beenOpened) {

      Object.keys(Achievements).forEach(function (key) {

         Achievements[key].forEach(function (achievementItem) {

            if (!achievementItem.ui) {

               achievementItem.ui = dmz.ui.loader.load("AchievementItem.ui");
            }
         });
      });
   }
};

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   var list = self.config.get("achievement-set.set");

   formContent.layout(contentLayout);
   contentLayout.addStretch(1);
   list.forEach(function (setItem) {

      Users[setItem.string("name")] = [];
      var setItemList = setItem.get("achievement");
      setItemList.forEach(function (achievement) {

         var picture = achievement.string("resource");

         if (picture) { picture = dmz.resources.findFile(picture); }
         if (picture) { picture = dmz.ui.graph.createPixmap(picture); }
         if (picture) { picture = picture.scaled(80, 80); }
         Users[setItem.string("name")].push(
            { name: achievement.string("name")
            , title: achievement.string("title")
            , description: achievement.string("description")
            , picturePixmap: picture
            , achievement: dmz.defs.lookupState(achievement.string("name"))
            , level: achievement.number("level")
            , ui: false
            , uiArrayIndex: false
            });
      });
   });
   /*Object.keys(Users).forEach(function (key) {

      self.log.error("Category:", key);
      Users[key].forEach(function (achievement) {

         self.log.error(achievement.name, achievement.achievement);
      });
      self.log.error("<---------------------------->\n");
   });*/
};

init();

dmz.module.publish(self, _exports);
