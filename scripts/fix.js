// This script is intended to contain observer functions necessary to convert
// old databases to new databases.
var dmz =
       { defs: require("dmz/runtime/definitions")
       , object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , stance: require("stanceConst")
       , time: require("dmz/runtime/time")
       , util: require("dmz/types/util")
       }

       // Fnclist
       , list = []
       ;

// Set Game default permissions
list.push(function (objs) {

   objs = objs.filter(function (handle) {

      return dmz.object.type(handle).isOfType(dmz.stance.GameType);
   });

   objs.forEach(function (gameHandle) {

      if (!dmz.object.state(gameHandle, dmz.stance.StudentPermissionsHandle)) {

         self.log.warn ("Setting Game Student Permissions");
         dmz.object.state(gameHandle, dmz.stance.StudentPermissionsHandle, dmz.stance.StudentPermissions);
      }
      if (!dmz.object.state(gameHandle, dmz.stance.AdminPermissionsHandle)) {

         self.log.warn ("Setting Game Student Permissions");
         dmz.object.state(gameHandle, dmz.stance.AdminPermissionsHandle, dmz.stance.AdminPermissions);
      }
      if (!dmz.object.state(gameHandle, dmz.stance.AdvisorPermissionsHandle)) {

         self.log.warn ("Setting Game Advisor Permissions");
         dmz.object.state(gameHandle, dmz.stance.AdvisorPermissionsHandle, dmz.stance.AdvisorPermissions);
      }
      if (!dmz.object.state(gameHandle, dmz.stance.ObserverPermissionsHandle)) {

         self.log.warn ("Setting Game Observer Permissions");
         dmz.object.state(gameHandle, dmz.stance.ObserverPermissionsHandle, dmz.stance.ObserverPermissions);
      }
      if (!dmz.object.state(gameHandle, dmz.stance.TechPermissionsHandle)) {

         self.log.warn ("Setting Game Tech Permissions");
         dmz.object.state(gameHandle, dmz.stance.TechPermissionsHandle, dmz.stance.TechPermissions);
      }
   });
});

// Add Help forum to groups
list.push(function (objs) {

   objs = objs.filter(function (handle) {

      return dmz.object.type(handle).isOfType(dmz.stance.GroupType) &&
         !dmz.object.superLinks(handle, dmz.stance.HelpLink);
   });
   objs.forEach(function (group) {

      var handle;
      self.log.warn
         ( "Adding Help Forum to:", dmz.stance.getDisplayName(group)
         , dmz.object.superLinks(group, dmz.stance.HelpLink)
         , !dmz.object.superLinks(group, dmz.stance.HelpLink));
      handle = dmz.object.create(dmz.stance.HelpForumType);
      dmz.object.text(handle, dmz.stance.NameHandle, dmz.stance.getDisplayName(group));
      dmz.object.activate(handle);
      dmz.object.link(dmz.stance.HelpLink, handle, group);
   });
});

// Change Admins to new permission system
list.push(function (objs) {

   objs = objs.filter(function (handle) {

      return dmz.object.type(handle).isOfType(dmz.stance.UserType);
   });

   objs.forEach(function (user) {

      var permissions = dmz.object.state(user, dmz.stance.Permissions);
      if (!permissions || !permissions.bool()) {

         if (dmz.object.flag(user, dmz.stance.AdminHandle)) {

            if (dmz.stance.getDisplayName(user) === "Watcher") { permissions = dmz.stanceAdminPermissions; }
            else { permissions = dmz.stance.TechPermissions; }
         }
         else { permissions = dmz.stance.StudentPermissions; }

         self.log.warn ("Resetting permissions for", dmz.stance.getDisplayName(user));
         dmz.object.state(user, dmz.stance.Permissions, permissions);
      }
   });
});

// Add permission scalar to users
list.push(function (objs) {

   objs = objs.filter(function (handle) {

      return dmz.object.type(handle).isOfType(dmz.stance.UserType) &&
         (dmz.object.scalar(handle, dmz.stance.Permissions) === undefined);
   });

   objs.forEach(function (user) {

      var permission = -1;
      if (dmz.stance.isAllowed(user, dmz.stance.SwitchGroupFlag)) {

         if (dmz.stance.isAllowed(user, dmz.stance.AlterMediaFlag)) {

            if (dmz.stance.isAllowed(user, dmz.stance.AlterUsersFlag)) {

               permission = dmz.stance.TECH_PERMISSION;
            }
            else { permission = dmz.stance.ADMIN_PERMISSION; }
         }
         else { permission = dmz.stance.OBSERVER_PERMISSION; }
      }
      else if (dmz.stance.isAllowed(user, dmz.stance.CastVoteFlag)) {

         permission = dmz.stance.STUDENT_PERMISSION;
      }
      else if (dmz.object.state(user, dmz.stance.Permissions)) {

         permission = dmz.stance.ADVISOR_PERMISSION;
      }
      if (permission !== -1) { dmz.object.scalar(user, dmz.stance.Permissions, permission); }
   });
});

// Add DeletePostsFlag to admins
list.push(function (objs) {

   objs = objs.filter(function (handle) {

      return dmz.object.type(handle).isOfType(dmz.stance.UserType);
   });

   objs.forEach(function (user) {

      var permissions = dmz.object.state(user, dmz.stance.Permissions);
      if (dmz.stance.isAllowed(user, dmz.stance.AlterMediaFlag) &&
         !dmz.stance.isAllowed(user, dmz.stance.DeletePostsFlag)) {

         self.log.warn ("Giving DeletePostsFlag permission to", dmz.stance.getDisplayName(user));
         dmz.object.state(user, dmz.stance.Permissions, permissions.or(dmz.stance.DeletePostsFlag));
      }
   });
});

// Remove CastVote from tech users
list.push(function (objs) {

   objs = objs.filter(function (handle) {

      return dmz.object.type(handle).isOfType(dmz.stance.UserType);
   });

   objs.forEach(function (user) {

      var permissions = dmz.object.state(user, dmz.stance.Permissions);
      if (dmz.stance.isAllowed(user, dmz.stance.ChangePermissionsFlag) &&
         dmz.stance.isAllowed(user, dmz.stance.CastVoteFlag)) {

         dmz.object.state(user, dmz.stance.Permissions, permissions.unset(dmz.stance.CastVoteFlag));
      }
   });
});

dmz.time.setTimer(self, 15, function () {

   var objs = dmz.object.getObjects() || [];
   list.forEach(function (fnc) { fnc (objs.filter(function () { return true; })); });
});
