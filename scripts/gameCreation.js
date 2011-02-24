var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , mainWindow: require('dmz/ui/mainWindow')
      , messageBox: require('dmz/ui/messageBox')
      , widget: require("dmz/ui/widget")
      , inputDialog: require("dmz/ui/inputDialog")
      }
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   }

   // UI Elements
   , editScenarioDialog = dmz.ui.loader.load("EditScenarioDialog.ui")
   , addStudentButton = editScenarioDialog.lookup("addStudentButton")
   , removeStudentButton = editScenarioDialog.lookup("removeStudentButton")
   , groupStudentList = editScenarioDialog.lookup("groupStudentList")
   , ungroupedStudentList = editScenarioDialog.lookup("ungroupedStudentList")
   , removeGroupButton = editScenarioDialog.lookup("removeGroupButton")
   , addGroupButton = editScenarioDialog.lookup("addGroupButton")
   , groupComboBox = editScenarioDialog.lookup("groupComboBox")
   , createPlayerButton = editScenarioDialog.lookup("createPlayerButton")
   , removePlayerButton = editScenarioDialog.lookup("removePlayerButton")
   , importStudentListButton = editScenarioDialog.lookup("importStudentListButton")
   , gameStateButton = editScenarioDialog.lookup("gameStateButton")
   , generateReportButton = editScenarioDialog.lookup("generateReportButton")
   , gameStatsButton = editScenarioDialog.lookup("gameStatsButton")

   , createGroupDialog = dmz.ui.loader.load("CreateGroupDialog.ui")

   , createStudentDialog = dmz.ui.loader.load("CreateStudentDialog.ui")

   , instructorDialog = dmz.ui.loader.load("InstructorWindowDialog")
   , scenarioList = instructorDialog.lookup("scenarioList")

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
   , GameNameHandle = dmz.defs.createNamedHandle("game_name")
   , GameUngroupedUsersHandle = dmz.defs.createNamedHandle("game_ungrouped_users")

   // Object Types
   , UserType = dmz.objectType.lookup("user")
   , GameType = dmz.objectType.lookup("game_type")
   , GroupType = dmz.objectType.lookup("group")

   // Variables
   , groupList = []
   , userList = {}
   , gameList = []

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


instructorDialog.observe(self, "addButton", "clicked", function (btn) {

   var nameDialog
     ;

   nameDialog = dmz.ui.inputDialog.create(
      { title: "Create New Scenario"
      , label: "Scenario Name"
      , text: ""
      }
      , btn);

   if (nameDialog) {

      nameDialog.open (self, function (result, name) {

         var game;

         if (result) {

            game = dmz.object.create(GameType);
            dmz.object.text(game, GameNameHandle, name);
            dmz.object.activate(game);
         }
      });
   }
});

instructorDialog.observe(self, "editButton", "clicked", function () {

   var currentGameHandle = gameList[scenarioList.currentIndex()]
     , type = dmz.object.type(currentGameHandle)
     , groups
     , ungrouped
     ;

   if (type && type.isOfType(GameType)) {

      groupList = [];
      groupComboBox.clear();
      ungroupedStudentList.clear();
      groupStudentList.clear();
      userList = [];
      // Iterate over groups linked to game and create them in UI
      groups = dmz.object.subLinks(currentGameHandle, GameGroupHandle);
      if (groups) {

         groups.forEach(function (group) {
            // For each group, iterate over linked students

            var students = dmz.object.subLinks(group, GroupMembersHandle)
              , groupName = dmz.object.text(group, GroupNameHandle)
              ;

            groupList.push(group);
            groupComboBox.addItem(groupName);
            if (students) {

               studentList.forEach(function (student) {

                  userList[student] = groupStudentList.addItem(
                     dmz.object.text(student, UserRealNameHandle), student);
               });
            }

         });
      }

      ungrouped = dmz.object.subLinks(currentGameHandle, GameUngroupedUsersHandle);
      if (ungrouped) {

         ungrouped.forEach(function (student) {

            userList[student] = ungroupedStudentList.addItem(
               dmz.object.text(student, UserRealNameHandle), student);
         });
      }


      userToGroup = function (item) {

         var objHandle
           , currentIndex
           , count = groupComboBox.count()
           , linkHandle
           ;

         if (item && count) {

            objHandle = item.data();
            currentIndex = groupComboBox.currentIndex();
            if (objHandle && (currentIndex < groupList.length)) {

               dmz.object.unlink(dmz.object.linkHandle(GameUngroupedUsersHandle, currentGameHandle, objHandle));
               dmz.object.link(GroupMembersHandle, groupList[currentIndex], objHandle);
               ungroupedStudentList.removeItem(item);
               groupStudentList.addItem(item);
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

               dmz.object.unlink(dmz.object.linkHandle(GroupMembersHandle, groupList[currentIndex], objHandle));
               dmz.object.link(GameUngroupedUsersHandle, currentGameHandle, objHandle);
               groupStudentList.removeItem(item);
               ungroupedStudentList.addItem(item);
            }
         }
      };

      addStudentButton.observe(self, "clicked", function () { userToGroup(ungroupedStudentList.currentItem()); });
      removeStudentButton.observe(self, "clicked", function () { userFromGroup(groupStudentList.currentItem()); });
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
               dmz.object.link(GameGroupHandle, currentGameHandle, group);
            }
         });
      });

      createPlayerButton.observe(self, "clicked", function () {

         createStudentDialog.open(self, function (value, dialog) {

            var name = dialog.lookup("name")
              , email = dialog.lookup("email")
              , student
              ;

            if (value && name && email) {

               student = createNewUser(name.text(), email.text());
               if (student) {

                  dmz.object.link(GameUngroupedUsersHandle, currentGameHandle, student);
                  userList[student] = ungroupedStudentList.addItem(
                     dmz.object.text(student, UserRealNameHandle), student);

               }
            }
         });
      });

      editScenarioDialog.open(self, function (result, dialog) {});
   }
});

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

         var studentList = group.get("student-list.student")
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

      if (objType.isOfType(GameType)) {

         gameList.push(objHandle);
         scenarioList.addItem(dmz.object.text(objHandle, GameNameHandle));
      }
   }
});

removeGroupButton.observe(self, "clicked", removeCurrentGroup = function () {

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
         item.hidden(!members || (members.indexOf(item.data()) === -1));
      }
   }
});

readUserConfig();
instructorDialog.open(self, function () {});
