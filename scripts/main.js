var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , mainWindow: require('dmz/ui/mainWindow')
      , messageBox: require('dmz/ui/messageBox')
      , widget: require("dmz/ui/widget")
      }
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   }

   // UI Elements
   , setGroupsForm = dmz.ui.loader.load("SetGroupsForm.ui")
   , doneButton = setGroupsForm.lookup("doneButton")
   , addStudentButton = setGroupsForm.lookup("addStudentButton")
   , removeStudentButton = setGroupsForm.lookup("removeStudentButton")
   , groupStudentList = setGroupsForm.lookup("groupStudentList")
   , ungroupedStudentList = setGroupsForm.lookup("ungroupedStudentList")
   , removeGroupButton = setGroupsForm.lookup("removeGroupButton")
   , resetButton = setGroupsForm.lookup("resetButton")
   , addGroupButton = setGroupsForm.lookup("addGroupButton")
   , groupComboBox = setGroupsForm.lookup("groupComboBox")

   , createGroupDialog = dmz.ui.loader.load("CreateGroupDialog.ui")

   // Handles
   , UserRealNameHandle = dmz.defs.createNamedHandle("user_real_name")
   , UserEmailHandle = dmz.defs.createNamedHandle("user_email")
   , UserGroupHandle = dmz.defs.createNamedHandle("user_group")
   , UserGameNameHandle = dmz.defs.createNamedHandle("user_game_name")
   , UserPasswordHandle = dmz.defs.createNamedHandle("user_password")

   , GroupNameHandle = dmz.defs.createNamedHandle("group_name")
   , GroupPermissionsHandle = dmz.defs.createNamedHandle("group_permissions")
   , GroupMembersHandle = dmz.defs.createNamedHandle("group_members")

   , GameGroupHandle = dmz.defs.createNamedHandle("game_group")

   // Object Types
   , UserType = dmz.objectType.lookup("user")
   , GameType = dmz.objectType.lookup("game_type")
   , GroupType = dmz.objectType.lookup("group")

   // Variables
   , groupList = []

   // Function decls
   , createNewGame
   , createNewUser
   , readUserConfig
   , createGroup
   , getNewRandomName
   , removeCurrentGroup
   , arrayContains

   ;

readUserConfig = function () {

   var studentList = self.config.get("student-list.student")
     ;

   studentList.forEach(function (student) {

      var name
        , email
        ;

      name = student.string("name", "NAME FAIL");
      email = student.string("email", "EMAIL FAIL");
      createNewUser(name, email);
   });
};

createNewUser = function (name, email) {

   var user
     ;

   if (name && email) {

      user = dmz.object.create(UserType);
      dmz.object.text(user, UserRealNameHandle, name);
      dmz.object.text(user, UserEmailHandle, email);
      dmz.object.text(user, UserGameNameHandle, getNewRandomName());
      dmz.object.activate(user);
   }
};

// Placeholder for later function to generate names
getNewRandomName = function () {

   return "Bert";
}

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType) {

      if (objType.isOfType(UserType)) {

//         self.log.warn (
//            "Got user:"
//            , dmz.object.text(objHandle, UserRealNameHandle)
//            , dmz.object.text(objHandle, UserEmailHandle)
//            , dmz.object.text(objHandle, UserGameNameHandle)
//            );

         ungroupedStudentList.addItem(dmz.object.text(objHandle, UserRealNameHandle), objHandle);
      }
      else if (objType.isOfType(GameType)) {


      }
      else if (objType.isOfType(GroupType)) {


      }
   }
});

doneButton.observe(self, "clicked", function () {

   self.log.warn ("Done!");
});

addStudentButton.observe(self, "clicked", function () {

   var curr = ungroupedStudentList.currentItem();
   if (curr) {

      // add student to group

      groupStudentList.addItem(curr);
   }
});

removeStudentButton.observe(self, "clicked", function () {

   var curr = groupStudentList.currentItem();
   if (curr) {

      //remove student from group

      ungroupedStudentList.addItem(curr);
   }
});

groupStudentList.observe(self, "itemActivated", function (item) {

   if (item) {

      // remove student from group

      ungroupedStudentList.addItem(item);
   }
});

ungroupedStudentList.observe(self, "itemActivated", function (item) {

   if (item) {

      // add student to group

      groupStudentList.addItem(item);
   }
});

addGroupButton.observe(self, "clicked", function () {

   createGroupDialog.open(self, function (value, dialog) {

      var groupName = dialog.lookup("groupName")
        , permissionType = dialog.lookup("permissionType")
        , group
        ;

      if (value) {

         group = dmz.object.create(GroupType);
         dmz.object.text(group, GroupNameHandle, groupName.text());
         // Link group to "Game" object
         // Add line to convert permission type into bitmask
         dmz.object.activate(group);
         groupList.push(group);
         groupComboBox.addItem(groupName.text());
      }
   });
});

removeCurrentGroup = function () {

   var index = groupComboBox.currentIndex()
     , groupHandle = groupList[index]
     , groupMembers
     , count
     , idx
     ;

   groupList.splice (index, 1);
   groupComboBox.removeIndex(index);
   dmz.object.unlinkSubObjects(groupHandle, GroupMembersHandle);
   dmz.object.unlinkSuperObjects(groupHandle, GameGroupHandle);

   count = groupStudentList.count();
   for (idx = count - 1; idx >= 0; idx -= 1) {

      ungroupedStudentList.addItem(groupStudentList.takeItemAt(idx));
   }

   dmz.object.destroy(groupHandle);
};


removeGroupButton.observe(self, "clicked", removeCurrentGroup);

resetButton.observe(self, "clicked", function () {

   var count = groupComboBox.count();
   while (count--) { removeCurrentGroup(); }
});


groupComboBox.observe(self, "currentIndexChanged", function (index) {

   var groupHandle = groupList[index]
     , members
     , item
     , idx
     , count
     ;

   if (groupHandle) {

      members = dmz.object.subLinks(groupHandle, GroupMembersHandle);
      count = groupStudentList.count();
      for (idx = 0; idx < count; idx += 1) {

         item = groupStudentList.item(idx);
         item.hidden((members.indexOf(item.data()) !== -1));
      }
   }
});

readUserConfig();
setGroupsForm.show();
