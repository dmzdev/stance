var dmz =
   { stance: require("stanceConst")
   , object: require("dmz/components/object")
   , objectType: require("dmz/runtime/objectType")
   , util: require("dmz/types/util")
   }
   , sendEmail
   ;


sendEmail = function (targets, title, text) {

   var userListStr = ""
     , title = (title && title.length) ? title : "No subject."
     , text = (text && text.length) ? text : "No text."
     , email
     ;

   if (targets && targets.length) {

      targets.forEach(function (userHandle) {

         var type = dmz.object.type(userHandle);
         if (type && type.isOfType(dmz.stance.UserType)) {

            userListStr =
               userListStr.concat(
                  dmz.object.text(userHandle, dmz.stance.NameHandle) + ",");
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
}

dmz.util.defineConst(exports, "sendEmail", sendEmail);