// This script is intended to contain observer functions necessary to convert
// old databases to new databases.
var dmz =
       { defs: require("dmz/runtime/definitions")
       , module: require("dmz/runtime/module")
       , object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , message: require("dmz/runtime/messaging")
       , resources: require("dmz/runtime/resources")
       , stance: require("stanceConst")
       , time: require("dmz/runtime/time")
       , util: require("dmz/types/util")
       , ui:
          { consts: require('dmz/ui/consts')
          , graph: require("dmz/ui/graph")
          , layout: require("dmz/ui/layout")
          , label: require("dmz/ui/label")
          , loader: require('dmz/ui/uiLoader')
          , messageBox: require("dmz/ui/messageBox")
          , mainWindow: require("dmz/ui/mainWindow")
          }
       }

       // Fnclist
       , list = []
       ;

// Add Help forum to groups
list.push(function (objs) {

   objs = objs.filter(function (handle) {

      return dmz.object.type(handle).isOfType(dmz.stance.GroupType) && !dmz.object.superLinks(handle, dmz.stance.HelpLink);
   });
   objs.forEach(function (group) {

      var handle;
      self.log.warn ("Adding Help Forum to:", dmz.stance.getDisplayName(group), dmz.object.superLinks(group, dmz.stance.HelpLink), !dmz.object.superLinks(group, dmz.stance.HelpLink));
      handle = dmz.object.create(dmz.stance.HelpForumType);
      dmz.object.text(handle, dmz.stance.NameHandle, dmz.stance.getDisplayName(group));
      dmz.object.activate(handle);
      dmz.object.link(dmz.stance.HelpLink, handle, group);
   });
});

// Change Admins to new permission system
list.push(function (objs) {

   objs = obj.filter(function (handle) {

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

         dmz.object.state(user, dmz.stance.Permissions, permissions);
      }
   });
});

// Add DeletePostsFlag to admins
list.push(function (objs) {

   objs = obj.filter(function (handle) {

      return dmz.object.type(handle).isOfType(dmz.stance.UserType);
   });

   objs.forEach(function (user) {

      var permissions = dmz.object.state(user, dmz.stance.Permissions);
      if (dmz.stance.isAllowed(user, dmz.stance.AlterMediaFlag) &&
         !dmz.stance.isAllowed(user, dmz.stance.DeletePostsFlag)) {

         dmz.object.state(user, dmz.stance.Permissions, permissions.or(dmz.stance.DeletePostsFlag));
      }
   });
});

dmz.time.setTimer(self, 20, function () {

   var objs = dmz.object.getObjects() || [];
   list.forEach(objs.filter(function () { return true; }));
});
