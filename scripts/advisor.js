var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , mainWindow: require('dmz/ui/mainWindow')
      , tabWidget: require("dmz/ui/tabWidget")
      , widget: require("dmz/ui/widget")
      }
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , module: require("dmz/runtime/module")
   }

   // UI Elements
   , advisorTabWidget = dmz.ui.tabWidget.create()
//   , editScenarioDialog = dmz.ui.loader.load("EditScenarioDialog.ui")
//   , deleteGameButton = editScenarioDialog.lookup("deleteGameButton")


   // Handles
   , GroupNameHandle = dmz.defs.createNamedHandle("group_name")
   , GroupPermissionsHandle = dmz.defs.createNamedHandle("group_permissions")
   , GroupMembersHandle = dmz.defs.createNamedHandle("group_members")

   , GameGroupHandle = dmz.defs.createNamedHandle("game_group")
   , GameNameHandle = dmz.defs.createNamedHandle("game_name")

   , ActiveHandle = dmz.defs.createNamedHandle("Active")

   , AdvisorNameHandle = dmz.defs.createNamedHandle("advisor_name")
   , AdvisorPictureNameHandle = dmz.defs.createNamedHandle("advisor_pic_name")
   , AdvisorPictureDirectoryHandle = dmz.defs.createNamedHandle("advisor_dir")
   , AdvisorGroupHandle = dmz.defs.createNamedHandle("advisor_group")
   , AdvisorBioHandle = dmz.defs.createNamedHandle("advisor_bio")

   // Devtools type, handle
   , CurrentUserHandle = dmz.defs.createNamedHandle("current_user")
   , CurrentUserType = dmz.objectType.lookup("current_user")

   // Object Types
   , UserType = dmz.objectType.lookup("user")
   , GameType = dmz.objectType.lookup("game_type")
   , GroupType = dmz.objectType.lookup("group")
   , AdvisorType = dmz.objectType.lookup("advisor")

   // Variables
   , CurrentUser = false

   // Function decls
   , tabsFromGroup
   , tabFromAdvisor
   ;


// Devtools
dmz.object.link.observe(self, CurrentUserHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var type = dmz.object.type(subHandle)
     , handle
     ;

   if (type && type.isOfType(UserType)) {

      CurrentUser = subHandle;
      handle = dmz.object.superLinks(CurrentUser, GroupMembersHandle);
      if (handle && handle[0]) {

         handle = handle[0];
         type = dmz.object.type(handle);
         if (type && type.isOfType(GroupType)) {

            tabsFromGroup(handle);
         }
      }
   }
});

dmz.object.create.observe(self, function (objHandle, objType) {


});

tabsFromGroup = function (groupHandle) {

   var advisors
     , tab
     , index = 0
     ;

   advisorTabWidget.clear();
   advisors = dmz.object.subLinks(groupHandle, AdvisorGroupHandle);
   if (advisors) {

      advisors.forEach(function (advisor) {

         tab = tabFromAdvisor(advisor, index++);
         if (tab) { advisorTabWidget.add(tab, dmz.object.text(advisor, AdvisorNameHandle)); }
      });
   }
}

tabFromAdvisor = function (advisorHandle, index) {

   var tab = dmz.ui.loader.load("AdvisorWindow.ui")
     , bioText = tab.lookup("bioText")
     , submitQuestionButton = tab.lookup("submitQuestionButton")
     , questionTree = tab.lookup("questionTree")
     , taskingText = tab.lookup("taskingText")
     , submitTextButton = tab.lookup("submitTextButton")
     , pictureLabel = tab.lookup("pictureLabel")
     , text
     , directory
     ;

   text = dmz.object.text(advisorHandle, AdvisorBioHandle);
   if (!text) { text = ""; }
   bioText.text(text);
   directory = dmz.object.text(advisorHandle, AdvisorPictureDirectoryHandle);
   text = dmz.object.text(advisorHandle, AdvisorPictureNameHandle);

   return tab;
};
