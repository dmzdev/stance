var dmz =
   { stance: require("stanceConst")
   , module: require("dmz/runtime/module")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , util: require("dmz/types/util")
   }
   , sendEmail
   , _exports = {}
   , userFilterList = {}
   ;


_exports.sendEmail = function (targets, title, text) {

   var userListStr = ""
     , title = (title && title.length) ? title : "No subject."
     , text = (text && text.length) ? text : "No text."
     , email
     ;

   if (targets && targets.length) {

      targets.forEach(function (userHandle) {

         var type = dmz.object.type(userHandle)
           , name = dmz.object.text(userHandle, dmz.stance.NameHandle)
           ;
         if (type && type.isOfType(dmz.stance.UserType) && !userFilterList[name]) {

            userListStr = userListStr.concat(name + ",");
         }
      });

      if (userListStr.length) {

         email = dmz.object.create(dmz.stance.EmailType);
         dmz.object.text(email, dmz.stance.EmailRecipientHandle, userListStr);
         dmz.object.text(email, dmz.stance.TitleHandle, title);
         dmz.object.text(email, dmz.stance.TextHandle, text);
         dmz.object.flag(email, dmz.stance.SentHandle, false);
         dmz.object.activate(email);
      }
   }
};

_exports.sendTechEmail = function (targets, title, text) {

   var userListStr = ""
     , title = (title && title.length) ? title : "No subject."
     , text = (text && text.length) ? text : "No text."
     , email
     ;

   if (targets && targets.length) {

      targets.forEach(function (emailAddr) { userListStr = userListStr.concat(emailAddr + ","); });

      if (userListStr.length) {

         email = dmz.object.create(dmz.stance.EmailType);
         dmz.object.text(email, dmz.stance.EmailRecipientHandle, userListStr);
         dmz.object.text(email, dmz.stance.TitleHandle, title);
         dmz.object.text(email, dmz.stance.TextHandle, text);
         dmz.object.flag(email, dmz.stance.SentHandle, false);
         dmz.object.activate(email);
      }
   }
};


(function () {

   var list = self.config.get("user-filter.user");
   if (list) {

      list.forEach(function (userConfig) {

         var name = userConfig.string("name");
         if (name) { userFilterList[name] = true; }
      });
   }
}());

dmz.module.publish(self, _exports);
