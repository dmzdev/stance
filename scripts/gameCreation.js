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
   , userList = {}

   // Function decls
   , createNewGame
   , createNewUser
   , readUserConfig
   , createGroup
   , getNewRandomName
   , removeCurrentGroup
   , arrayContains
   , userToGroup
   , userFromGroup
   , configToStudent

   ;


configToStudent = function (student) {

   var name
     , email
     ;

   name = student.string("name", "NAME FAIL");
   email = student.string("email", "EMAIL FAIL");
   return createNewUser(name, email);
};

readUserConfig = function () {

   var studentList = self.config.get("student-list.student")
     , groupConfigList = self.config.get("group-list.group")
     ;

   if (studentList) { studentList.forEach(configToStudent); }

   if (groupConfigList) {

      groupConfigList.forEach(function (group) {

         var studentList = group.get("student")
           , name = group.string("name", "No Name Group")
           , groupHandle
           , idx
           , user
           ;

         groupHandle = dmz.object.create(GroupType);
         dmz.object.text(groupHandle, GroupNameHandle, name);
         dmz.object.activate(groupHandle);
         groupList.push(groupHandle);
         groupComboBox.addItem(name);
         for (idx = 0; idx < studentList.length; idx += 1) {

            user = configToStudent(studentList[idx])
            if (user) {

               dmz.object.link(GroupMembersHandle, groupHandle, user);
            }
         }
      });
   }
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
   return user;
};

// Placeholder for later function to generate names
getNewRandomName = function () {

   return "Bert";
}

dmz.object.create.observe(self, function (objHandle, objType) {

   if (objType) {

      if (objType.isOfType(UserType)) {

         userList[objHandle] =
            ungroupedStudentList.addItem(dmz.object.text(objHandle, UserRealNameHandle), objHandle);

      }
      else if (objType.isOfType(GameType)) {


      }
      else if (objType.isOfType(GroupType)) {


      }
   }
});

dmz.object.link.observe(self, GroupMembersHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var subType = dmz.object.type(subHandle)
     , superType = dmz.object.type(superHandle)
     , item
     , members
     ;

   if (subType.isOfType(UserType) && superType.isOfType(GroupType)) {

      if (groupList.indexOf(superHandle) !== -1) {

         item = userList[subHandle];
         ungroupedStudentList.removeItem(item);
         groupStudentList.addItem(item);
         item.hidden(groupList[groupComboBox.currentIndex()] !== superHandle);
      }
   }
});

dmz.object.unlink.observe(self, GroupMembersHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var subType = dmz.object.type(subHandle)
     , superType = dmz.object.type(superHandle)
     , item
     , members
     ;


   if (subType.isOfType(UserType) && superType.isOfType(GroupType)) {

      if (groupList.indexOf(superHandle) !== -1) {

         item = userList[subHandle];
         groupStudentList.removeItem(item);
         ungroupedStudentList.addItem(item);
         item.hidden(false);
      }
   }
});


doneButton.observe(self, "clicked", function () {

   self.log.warn ("Done!");
});

addStudentButton.observe(self, "clicked", function () {

   userToGroup(ungroupedStudentList.currentItem());
});

removeStudentButton.observe(self, "clicked", function () {

   userFromGroup(groupStudentList.currentItem());
});

userToGroup = function (item) {

   var objHandle
     , currentIndex
     , count = groupComboBox.count()
     ;

   if (item && count) {

      // add student to group
      objHandle = item.data();
      currentIndex = groupComboBox.currentIndex();
      if (objHandle && (currentIndex < groupList.length)) {

         dmz.object.link(GroupMembersHandle, groupList[currentIndex], objHandle);
      }
   }
};

userFromGroup = function (item) {

   var objHandle
     , currentIndex
     , count = groupComboBox.count()
     , linkHandle
     ;

   if (item && count) {

      objHandle = item.data();
      currentIndex = groupComboBox.currentIndex();
      if (objHandle && (currentIndex < groupList.length)) {

         linkHandle = dmz.object.linkHandle(GroupMembersHandle, groupList[currentIndex], objHandle);
         dmz.object.unlink(linkHandle);
      }
   }
};

groupStudentList.observe(self, "itemActivated", userFromGroup);
ungroupedStudentList.observe(self, "itemActivated", userToGroup);

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
     , item
     ;

   groupList.splice (index, 1);
   groupComboBox.removeIndex(index);

   count = groupStudentList.count();
   for (idx = count - 1; idx >= 0; idx -= 1) {

      item = groupStudentList.item(idx);
      if (!item.hidden()) { userFromGroup(item); }
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
      if (members) {

         for (idx = 0; idx < count; idx += 1) {

            item = groupStudentList.item(idx);
            item.hidden(members.indexOf(item.data()) === -1);
         }
      }
      else {

         for(idx = 0; idx < count; idx += 1) { groupStudentList.item(idx).hidden(true); }
      }
   }
});

readUserConfig();
//setGroupsForm.show();
