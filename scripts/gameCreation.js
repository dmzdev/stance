var dmz =
   { ui:
      { consts: require('dmz/ui/consts')
      , label: require("dmz/ui/label")
      , layout: require("dmz/ui/layout")
      , loader: require('dmz/ui/uiLoader')
      , mainWindow: require('dmz/ui/mainWindow')
      , messageBox: require('dmz/ui/messageBox')
      , widget: require("dmz/ui/widget")
      , inputDialog: require("dmz/ui/inputDialog")
      , groupBox: require("dmz/ui/groupBox")
      , graph: require("dmz/ui/graph")
      }
   , defs: require("dmz/runtime/definitions")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   }

   // UI Elements
   , editScenarioDialog = dmz.ui.loader.load("EditScenarioDialog.ui")
   , deleteGameButton = editScenarioDialog.lookup("deleteGameButton")
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
   , allGroupButton = editScenarioDialog.lookup("allGroupButton")
   , editAdvisorButton = editScenarioDialog.lookup("editAdvisorButton")
   , addAdvisorButton = editScenarioDialog.lookup("addAdvisorButton")
   , advisorComboBox = editScenarioDialog.lookup("advisorList")
   , removeAdvisorButton = editScenarioDialog.lookup("removeAdvisorButton")
   , addLobbyistButton = editScenarioDialog.lookup("addLobbyistButton")
   , editLobbyistButton = editScenarioDialog.lookup("editLobbyistButton")
   , removeLobbyistButton = editScenarioDialog.lookup("removeLobbyistButton")
   , lobbyistComboBox = editScenarioDialog.lookup("lobbyistList")

   , createGroupDialog = dmz.ui.loader.load("CreateGroupDialog.ui")

   , createStudentDialog = dmz.ui.loader.load("CreateStudentDialog.ui")

   , groupListDialog = dmz.ui.loader.load("GroupListDialog.ui")
   , listLayout = groupListDialog.lookup("vLayout")

   , instructorDialog = dmz.ui.loader.load("InstructorWindowDialog")
   , scenarioList = instructorDialog.lookup("scenarioList")

   , editAdvisorDialog = dmz.ui.loader.load("EditAdvisorDialog.ui")
   , advisorGroupList = editAdvisorDialog.lookup("groupList")
   , pictureList = editAdvisorDialog.lookup("pictureList")
   , advisorBio = editAdvisorDialog.lookup("advisorBio")
   , pictureLabel = editAdvisorDialog.lookup("pictureLabel")

   , editLobbyistDialog = dmz.ui.loader.load("EditLobbyistDialog.ui")
   , lobbyistPictureLabel = editLobbyistDialog.lookup("pictureLabel")
   , lobbyistGroupList = editLobbyistDialog.lookup("groupList")
   , lobbyistBio = editLobbyistDialog.lookup("lobbyistBio")
   , lobbyistMessage = editLobbyistDialog.lookup("lobbyistMessage")
   , lobbyistPictureList = editLobbyistDialog.lookup("pictureList")

   // Handles
   , UserEmailHandle = dmz.defs.createNamedHandle("user_email")
   , UserGroupHandle = dmz.defs.createNamedHandle("user_group")

   , GroupPermissionsHandle = dmz.defs.createNamedHandle("group_permissions")
   , GroupMembersHandle = dmz.defs.createNamedHandle("group_members")

   , GameGroupHandle = dmz.defs.createNamedHandle("game_group")
   , GameUngroupedUsersHandle = dmz.defs.createNamedHandle("game_ungrouped_users")
   , GameUngroupedAdvisorsHandle = dmz.defs.createNamedHandle("game_ungrouped_advisors")
   , GameUngroupedLobbyistsHandle = dmz.defs.createNamedHandle("game_ungrouped_lobbyists")

   , ActiveHandle = dmz.defs.createNamedHandle("Active")

   , AdvisorPictureNameHandle = dmz.defs.createNamedHandle("advisor_pic_name")
   , AdvisorPictureDirectoryHandle = dmz.defs.createNamedHandle("advisor_dir")
   , AdvisorGroupHandle = dmz.defs.createNamedHandle("advisor_group")
   , AdvisorBioHandle = dmz.defs.createNamedHandle("advisor_bio")

   , LobbyistPictureNameHandle = dmz.defs.createNamedHandle("lobbyist_pic_name")
   , LobbyistPictureDirectoryHandle = dmz.defs.createNamedHandle("lobbyist_dir")
   , LobbyistGroupHandle = dmz.defs.createNamedHandle("lobbyist_group")
   , LobbyistBioHandle = dmz.defs.createNamedHandle("lobbyist_bio")
   , LobbyistMessageHandle = dmz.defs.createNamedHandle("lobbyist_message")


   , TextHandle = dmz.defs.createNamedHandle("text")
   , NameHandle = dmz.defs.createNamedHandle("name")
   , DisplayNameHandle = dmz.defs.createNamedHandle("display_name")
   , VisibleHandle = dmz.defs.createNamedHandle("visible")

   // Object Types
   , UserType = dmz.objectType.lookup("user")
   , GameType = dmz.objectType.lookup("game")
   , GroupType = dmz.objectType.lookup("group")
   , AdvisorType = dmz.objectType.lookup("advisor")
   , LobbyistType = dmz.objectType.lookup("lobbyist")

   // Variables
   , groupList = []
   , userList = {}
   , gameList = []
   , advisorPictureObjects = []
   , lobbyistPictureObjects = []
   , advisorList = []
   , lobbyistList = []
   , CurrentGameHandle = false

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
   , setup

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

         var studentList = group.get("student-list.student")
           , name = group.string("name", "No Name Group")
           , groupHandle
           , idx
           , user
           ;

         groupHandle = dmz.object.create(GroupType);
         dmz.object.activate(groupHandle);
         dmz.object.text(groupHandle, NameHandle, name);
         dmz.object.link(GameGroupHandle, CurrentGameHandle, groupHandle);
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
      dmz.object.text(user, NameHandle, name);
      dmz.object.text(user, UserEmailHandle, email);
//      dmz.object.text(user, DisplayNameHandle, getNewRandomName());
      dmz.object.text(user, DisplayNameHandle, name);
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

         CurrentGameHandle = objHandle;
         setup();
      }
   }
});

dmz.object.link.observe(self, GameGroupHandle,
function (linkObjHandle, attrHandle, superHandle, subHandle) {

   var name = dmz.object.text(subHandle, NameHandle);
   groupList.push(subHandle);
   groupComboBox.addItem(name);
   advisorGroupList.addItem(name);
   lobbyistGroupList.addItem(name);
});

dmz.object.link.observe(self, GroupMembersHandle,
function (linkObjHandle, attrHandle, groupHandle, studentHandle) {

   if (!userList[studentHandle]) {

      userList[studentHandle] =
         groupStudentList.addItem(dmz.object.text(studentHandle, NameHandle), studentHandle);

      userList[studentHandle].hidden(groupList[0] && (groupHandle !== groupList[0]));
   }

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

         dmz.object.unlink(
            dmz.object.linkHandle(GameUngroupedUsersHandle, CurrentGameHandle, objHandle));
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

         dmz.object.unlink(
            dmz.object.linkHandle(GroupMembersHandle, groupList[currentIndex], objHandle));
         dmz.object.link(GameUngroupedUsersHandle, CurrentGameHandle, objHandle);
         groupStudentList.removeItem(item);
         ungroupedStudentList.addItem(item);
      }
   }
};

setup = function () {

   var groups
     , ungrouped
     , members
     , idx
     , item
     , count
     , pictures
     , directory
     , advisors
     , lobbyists
     ;



//      groupList = [];
//      userList = {};
//      advisorPictureObjects = [];
//      lobbyistPictureObjects = [];
//      advisorList = [];
//      lobbyistList = [];
//      groupComboBox.clear();
//      ungroupedStudentList.clear();
//      groupStudentList.clear();
//      advisorComboBox.clear();
//      lobbyistGroupList.clear();

      // Iterate over groups linked to game and create them in UI
   groups = dmz.object.subLinks(CurrentGameHandle, GameGroupHandle);
   if (groups) {

      groups.forEach(function (group) {
         // For each group, iterate over linked students

         var students = dmz.object.subLinks(group, GroupMembersHandle)
           , advisors = dmz.object.subLinks(group, AdvisorGroupHandle)
           , lobbyists = dmz.object.subLinks(group, LobbyistGroupHandle)
           , groupName = dmz.object.text(group, NameHandle)
           ;

         groupList.push(group);
         groupComboBox.addItem(groupName);
         advisorGroupList.addItem(groupName);
         if (students) {

            students.forEach(function (student) {

               userList[student] = groupStudentList.addItem(
                  dmz.object.text(student, NameHandle), student);
            });
         }
         if (advisors) {

            advisors.forEach(function (advisor) {

               advisorComboBox.addItem(dmz.object.text(advisor, NameHandle))
               advisorList.push(advisor);
            });
         }
         if (lobbyists) {

            lobbyists.forEach(function (lobbyist) {

               lobbyistComboBox.addItem(dmz.object.text(lobbyist, NameHandle));
               lobbyistList.push(lobbyist);
            });
         }
      });

      members = dmz.object.subLinks(groupList[0], GroupMembersHandle);
      count = groupStudentList.count();
      for (idx = 0; idx < count; idx += 1) {

         item = groupStudentList.item(idx);
         item.hidden(!members || (members.indexOf(item.data()) === -1));
      }
   }

   ungrouped = dmz.object.subLinks(CurrentGameHandle, GameUngroupedUsersHandle);
   if (ungrouped) {

      ungrouped.forEach(function (student) {

         userList[student] = ungroupedStudentList.addItem(
            dmz.object.text(student, NameHandle), student);
      });
   }

   ungrouped = dmz.object.subLinks(CurrentGameHandle, GameUngroupedAdvisorsHandle);
   if (ungrouped) {

      ungrouped.forEach(function (advisor) {

         advisorComboBox.addItem(dmz.object.text(advisor, NameHandle))
         advisorList.push(advisor);
      });
   }

   ungrouped = dmz.object.subLinks(CurrentGameHandle, GameUngroupedLobbyistsHandle);
   if (ungrouped) {

      ungrouped.forEach(function (lobbyist) {

         lobbyistComboBox.addItem(dmz.object.text(lobbyist, NameHandle));
         lobbyistList.push(advisor);
      });
   }

   gameStateButton.text(
      dmz.object.flag(CurrentGameHandle, ActiveHandle) ?
      "End Game" :
      "Start Game");

   gameStateButton.observe(self, "clicked", function () {

      var active = dmz.object.flag(CurrentGameHandle, ActiveHandle)
        ;

      dmz.ui.messageBox.create(
         { type: dmz.ui.messageBox.Warning
         , text: "Are you sure that you'd like to " + (active ? "end " : "start ") + "the game?"
         , informativeText: "If you click <b>Ok</b>, all users will be sent an email notification."
         , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
         , defaultButton: dmz.ui.messageBox.Cancel
         }
         , editScenarioDialog
         ).open(self, function (value) {

            if (value) {

               active = !active;
               dmz.object.flag(CurrentGameHandle, ActiveHandle, active);
               gameStateButton.text(active ? "End Game" : "Start Game");
            }
         });
   });

   pictures = self.config.get("advisor-picture-list.picture");
   directory = self.config.string("advisor-picture-list.path");
   item = self.config.string("advisor-picture-list.default");
   advisorPictureObjects[0] = dmz.ui.graph.createPixmap(directory + item);
   pictureLabel.pixmap(advisorPictureObjects[0]);
   pictures.forEach(function (file) {

      advisorPictureObjects.push(dmz.ui.graph.createPixmap(directory + file.string("file")));
      pictureList.addItem(file.string("name"));
   });

   pictureList.observe(self, "currentIndexChanged", function (index) {

      if (index < advisorPictureObjects.length) {

         pictureLabel.pixmap(advisorPictureObjects[index]);
      }
   });

   pictures = self.config.get("lobbyist-picture-list.picture");
   directory = self.config.string("lobbyist-picture-list.path");
   item = self.config.string("lobbyist-picture-list.default");
   lobbyistPictureObjects[0] = dmz.ui.graph.createPixmap(directory + item);
   lobbyistPictureLabel.pixmap(lobbyistPictureObjects[0]);
   pictures.forEach(function (file) {

      lobbyistPictureObjects.push(dmz.ui.graph.createPixmap(directory + file.string("file")));
      lobbyistPictureList.addItem(file.string("name"));
   });

   lobbyistPictureList.observe(self, "currentIndexChanged", function (index) {

      if (index < lobbyistPictureObjects.length) {

         lobbyistPictureLabel.pixmap(lobbyistPictureObjects[index]);
      }
   });

   editScenarioDialog.open(self, function (result, dialog) {});
};

addStudentButton.observe(self, "clicked", function () { userToGroup(ungroupedStudentList.currentItem()); });
removeStudentButton.observe(self, "clicked", function () { userFromGroup(groupStudentList.currentItem()); });
groupStudentList.observe(self, "itemActivated", userFromGroup);
ungroupedStudentList.observe(self, "itemActivated", userToGroup);

addGroupButton.observe(self, "clicked", function () {

   createGroupDialog.open(self, function (value, dialog) {

      var groupName = dialog.lookup("groupName").text()
        , permissionType = dialog.lookup("permissionType")
        , group
        ;

      if (value) {

         group = dmz.object.create(GroupType);
         dmz.object.activate(group);
         dmz.object.text(group, NameHandle, groupName);
         // Link group to "Game" object
         // Add line to convert permission type into bitmask
         groupList.push(group);
         groupComboBox.addItem(groupName);
         advisorGroupList.addItem(groupName);
         lobbyistGroupList.addItem(groupName);
         dmz.object.link(GameGroupHandle, CurrentGameHandle, group);
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

            dmz.object.link(GameUngroupedUsersHandle, CurrentGameHandle, student);
            userList[student] = ungroupedStudentList.addItem(
               dmz.object.text(student, NameHandle), student);

         }
      }
      name.clear();
      email.clear();
   });
});

deleteGameButton.observe(self, "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this game?"
      , informativeText: "Clicking <b>Ok</b> will cause all game data to be permanently erased!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , editScenarioDialog
   ).open(self, function (value) {

      if (value) {

         dmz.ui.messageBox.create(
            { type: dmz.ui.messageBox.Critical
            , text: "This action will result in the permanent loss of all game data!"
            , informativeText: "Clicking <b>Ok</b> will cause all game data to be permanently erased!"
            , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
            , defaultButton: dmz.ui.messageBox.Cancel
            }
            , editScenarioDialog
         ).open(self, function (value) {

            if (value) { dmz.object.destroy(CurrentGameHandle); }
         });
      }
   });
});

removeGroupButton.observe(self, "clicked", function () {

   var index = groupComboBox.currentIndex()
     , groupHandle = groupList[index]
     , groupMembers
     , count
     , idx
     , item
     ;

   self.log.warn (groupList);
   self.log.warn (index);

   groupMembers = dmz.object.subLinks(groupHandle, GroupMembersHandle);
   self.log.warn (groupMembers);

   groupMembers.forEach(function (user) {

      var item = userList[user];
      if (item) { userFromGroup(item); }
   });

   groupList.splice (index, 1);
   groupComboBox.removeIndex(index);
   dmz.object.destroy(groupHandle);
});

allGroupButton.observe(self, "clicked", function () {

   var groups
     , studentList
     , vLayout
     , groupBox
     ;

   groups = dmz.object.subLinks(CurrentGameHandle, GameGroupHandle);
   groups.forEach(function (groupHandle) {

      groupBox = dmz.ui.groupBox.create(dmz.object.text(groupHandle, NameHandle))
      vLayout = dmz.ui.layout.createVBoxLayout();
      studentList = dmz.object.subLinks(groupHandle, GroupMembersHandle);
      if (studentList) {

         studentList.forEach(function (student) {

            vLayout.addWidget(dmz.ui.label.create(dmz.object.text(student, NameHandle)));
         });
      }
      groupBox.layout(vLayout);
      listLayout.addWidget(groupBox);
   });

   studentList = dmz.object.subLinks(CurrentGameHandle, GameUngroupedUsersHandle);
   if (studentList) {

      groupBox = dmz.ui.groupBox.create("Ungrouped Students")
      vLayout = dmz.ui.layout.createVBoxLayout();
      studentList.forEach(function (student) {

         vLayout.addWidget(dmz.ui.label.create(dmz.object.text(student, NameHandle)));
      });
      groupBox.layout(vLayout);
      listLayout.addWidget(groupBox);
   }

   groupListDialog.open(self, function (result) {

      var widget;

      while (listLayout.count()) {

         widget = listLayout.at(0);
         listLayout.removeWidget(widget);
         widget.close();
      }
   });
});

addLobbyistButton.observe(self, "clicked", function () {

   dmz.ui.inputDialog.create(
      { title: "Create New Lobbyist"
      , label: "Lobbyist Name:"
      , text: ""
      }
      , addLobbyistButton
      ).open(self, function (value, name) {

         var handle;

         if (value && (name.length > 0)) {

            handle = dmz.object.create(LobbyistType);
            dmz.object.text(handle, NameHandle, name);
            dmz.object.activate(handle);
            dmz.object.link(GameUngroupedLobbyistsHandle, CurrentGameHandle, handle);
            lobbyistComboBox.addItem(name);
            lobbyistList.push(handle);
         }
      });
});

editLobbyistButton.observe(self, "clicked", function () {

   var groupIndex
     , groupHandle
     , pictureIndex
     , lobbyistHandle
     , links
     , index = lobbyistComboBox.currentIndex()
     , text
     ;

   if (index < lobbyistList.length) {

      lobbyistHandle = lobbyistList[index];

      links = dmz.object.superLinks(lobbyistHandle, LobbyistGroupHandle);
      if (links && links[0]) {

         groupIndex = lobbyistGroupList.findText(dmz.object.text(links[0], NameHandle));
      }

      pictureIndex = lobbyistPictureList.findText(dmz.object.text(lobbyistHandle, LobbyistPictureNameHandle));

      lobbyistPictureList.currentIndex((pictureIndex === -1) ? 0 : pictureIndex);
      lobbyistGroupList.currentIndex((groupIndex === -1) ? 0 : groupIndex);
      text = dmz.object.text(lobbyistHandle, LobbyistBioHandle);
      if (!text) { text = " "; }
      lobbyistBio.text(text);

      text = dmz.object.text(lobbyistHandle, LobbyistMessageHandle);
      if (!text) { text = " "; }
      lobbyistMessage.text(text);

      editLobbyistDialog.open(self, function (result) {

         if (result) {

            dmz.object.unlinkSuperObjects(lobbyistHandle, LobbyistGroupHandle);
            dmz.object.link(
               lobbyistHandle,
               LobbyistGroupHandle,
               groupList[lobbyistGroupList.currentIndex()]);

            dmz.object.text(lobbyistHandle, LobbyistPictureNameHandle, lobbyistPictureList.currentText());
            dmz.object.text(lobbyistHandle, LobbyistBioHandle, lobbyistBio.text());
            dmz.object.text(lobbyistHandle, LobbyistMessageHandle, lobbyistMessage.text());
         }
      });
   }
});

removeLobbyistButton.observe(self, "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this lobbyist?"
      , informativeText: "Clicking <b>Ok</b> will cause all data for this lobbyist to be permanently deleted!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , removeLobbyistButton
   ).open(self, function (value) {

      var index = lobbyistComboBox.currentIndex()
        , handle
        ;

      if (value && (index < lobbyistList.length)) {

         handle = lobbyistList[index];
         lobbyistList.splice(index, 1);
         lobbyistComboBox.removeIndex(index);
         dmz.object.destroy(handle);
      }
   });
});

addAdvisorButton.observe(self, "clicked", function () {

   dmz.ui.inputDialog.create(
      { title: "Create New Advisor"
      , label: "Advisor Name:"
      , text: ""
      }
      , addAdvisorButton
      ).open(self, function (value, name) {

         var handle;

         if (value && (name.length > 0)) {

            handle = dmz.object.create(AdvisorType);
            dmz.object.text(handle, NameHandle, name);
            dmz.object.activate(handle);
            dmz.object.link(GameUngroupedAdvisorsHandle, CurrentGameHandle, handle);
            advisorComboBox.addItem(name);
            advisorList.push(handle);
         }
      });
});

editAdvisorButton.observe(self, "clicked", function () {

   var groupIndex
     , groupHandle
     , pictureIndex
     , advisorHandle
     , links
     , index = advisorComboBox.currentIndex()
     , text
     ;

   if (index < advisorList.length) {

      advisorHandle = advisorList[index];

      links = dmz.object.superLinks(advisorHandle, AdvisorGroupHandle);
      if (links && links[0]) {

         groupIndex = advisorGroupList.findText(dmz.object.text(links[0], NameHandle));
      }

      pictureIndex = pictureList.findText(dmz.object.text(advisorHandle, AdvisorPictureNameHandle));

      pictureList.currentIndex((pictureIndex === -1) ? 0 : pictureIndex);
      advisorGroupList.currentIndex((groupIndex === -1) ? 0 : groupIndex);
      text = dmz.object.text(advisorHandle, AdvisorBioHandle);
      if (!text) { text = " "; }
      advisorBio.text(text);

      editAdvisorDialog.open(self, function (result) {

         if (result) {

            dmz.object.unlinkSuperObjects(advisorHandle, AdvisorGroupHandle);
            dmz.object.link(
               advisorHandle,
               AdvisorGroupHandle,
               groupList[advisorGroupList.currentIndex()]);

            dmz.object.text(advisorHandle, AdvisorPictureDirectoryHandle, directory);
            dmz.object.text(advisorHandle, AdvisorPictureNameHandle, pictureList.currentText());
            dmz.object.text(advisorHandle, AdvisorBioHandle, advisorBio.text());
         }
      });
   }
});

removeAdvisorButton.observe(self, "clicked", function () {

   dmz.ui.messageBox.create(
      { type: dmz.ui.messageBox.Warning
      , text: "Are you sure you want to delete this advisor?"
      , informativeText: "Clicking <b>Ok</b> will cause all data for this advisor to be permanently deleted!"
      , standardButtons: [dmz.ui.messageBox.Cancel, dmz.ui.messageBox.Ok]
      , defaultButton: dmz.ui.messageBox.Cancel
      }
      , removeAdvisorButton
   ).open(self, function (value) {

      var index = advisorComboBox.currentIndex()
        , handle
        ;

      if (value && (index < advisorList.length)) {

         handle = advisorList[index];
         advisorList.splice(index, 1);
         advisorComboBox.removeIndex(index);
         dmz.object.destroy(handle);
      }
   });
});

// Testing purposes
var game = dmz.object.create(GameType);
dmz.object.activate(game);
dmz.object.text(game, NameHandle, "Game");

readUserConfig();
