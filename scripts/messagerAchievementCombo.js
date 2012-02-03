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
   , comboForm = dmz.ui.loader.load("UserInfoWidget.ui")
   , tabs = comboForm = comboForm.lookup("groupTabs")
   , tab1 = comboForm.lookup("tab1")
   , tab2 = comboForm.lookup("tab2")

   // Variables
   , AchievementsMod = false
   , UserMessagerMod = false
   , MainModule = { list: {}, highlight: function (str) { this.list[str] = true; } }

   // Functions
   , openWindow
   , closeWindow
   , init
   ;

openWindow = function () {

   if (AchievementsMod) {

      AchievementsMod.openWindow();
   }
   if (UserMessagerMod) {

      UserMessagerMod.openWindow();
   }
};

closeWindow = function () {

   if (UserMessagerMod) {

      UserMessagerMod.closeWindow();
   }
   if (AchievementsMod) {

      AchievementsMod.closeWindow();
   }
};

dmz.module.subscribe(self, "userMessager", function (Mode, module) {

   if (Mode === dmz.module.Activate) { UserMessagerMod = module; }
});

dmz.module.subscribe(self, "achievements2", function (Mode, module) {

   if (Mode === dmz.module.Activate) { AchievementsMod = module; }
});

dmz.module.subscribe(self, "main", function (Mode, module) {

   var list;

   if (Mode === dmz.module.Activate) {

      list = MainModule.list;
      MainModule = module;
      module.addPage("Rolodex", comboForm, openWindow, closeWindow);
      if (list) { Object.keys(list).forEach(function (str) { module.highlight(str); }); }
   }
});

init = function () {

   tabs.clear();
   if (AchievementsMod) {

      tabs.add(AchievementsMod.achievementForm, "Achievements");
   }
   if (UserMessagerMod) {

      tabs.add(UserMessagerMod.messagerForm, "Email Group Members");
   }
};

init();
