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
   return email;
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
   return email;
};

_exports.sendVoteEmail = function (voteItem, state) {

   var email
     , subject
     , text
     , groupUserList
     , sendList = []
     , groupName
     , yesVotes
     , noVotes
     , priority
     ;

   if (voteItem.groupHandle) {

      groupName = dmz.stance.getDisplayName(voteItem.groupHandle);
      groupUserList = dmz.object.superLinks(voteItem.groupHandle, dmz.stance.GroupMembersHandle) || [];
      if (state === dmz.stance.VOTE_APPROVAL_PENDING) {

         groupUserList = dmz.object.superLinks(voteItem.groupHandle, dmz.stance.DataLinkHandle) || [];
         priority = dmz.stance.PRIORITY_FIRST;
         subject = "STANCE " + groupName + " needs a vote approved. (DO NOT REPLY)";
         sendList = groupUserList.filter(function (userHandle) {

            return dmz.object.flag(userHandle, dmz.stance.AdminHandle);
         });
      }
      else if (state === dmz.stance.VOTE_ACTIVE) {

         priority = dmz.stance.PRIORITY_SECOND;
         subject = "STANCE " + groupName + " has an active vote. (DO NOT REPLY)";
         sendList = groupUserList.filter(function (userHandle) {

            return !dmz.object.flag(userHandle, dmz.stance.AdminHandle);
         });
      }
      else if (state === dmz.stance.VOTE_DENIED) {

         priority = dmz.stance.PRIORITY_THIRD;
         subject = "STANCE " + groupName + " has had a vote denied. (DO NOT REPLY)";
         sendList = groupUserList.filter(function (userHandle) {

            return !dmz.object.flag(userHandle, dmz.stance.AdminHandle);
         });
      }
      else if (state === dmz.stance.VOTE_NO) {

         priority = dmz.stance.PRIORITY_THIRD;
         subject = "STANCE " + groupName + " has voted NO on the pending vote. (DO NOT REPLY)";
         sendList = groupUserList;
      }
      else if (state === dmz.stance.VOTE_YES) {

         priority = dmz.stance.PRIORITY_THIRD;
         subject = "STANCE " + groupName + " has voted YES on the pending vote. (DO NOT REPLY)";
         sendList = groupUserList;
      }
   }
   if (voteItem.question) {

      text = "Question: " + voteItem.question;
      if (state === dmz.stance.VOTE_ACTIVE) {

         text +=
            "\nAdvisor Response: " + (voteItem.ui.decisionTextEdit.text() || "Okay") +
            "\nDuration: " + voteItem.ui.timeBox.value() + "hrs";
      }
      else if (state === dmz.stance.VOTE_DENIED) {

         text += "\nAdvisor Response: " + (voteItem.ui.decisionTextEdit.text() || "No");
      }
      else if (state === dmz.stance.VOTE_NO) {

         text +=
            "\nAdvisor Response: " + voteItem.advisorResponse +
            "\nYes Votes: " + (voteItem.yesVotes || "0") +
            "\nNo Votes: " + (voteItem.noVotes || "0");
      }
      else if (state === dmz.stance.VOTE_YES) {

         text +=
            "\nAdvisor Response: " + voteItem.advisorResponse +
            "\nYes Votes: " + (voteItem.yesVotes || "0") +
            "\nNo Votes: " + (voteItem.noVotes) || "0";
      }
   }
   if (sendList.length && subject && text) {

      email = _exports.sendEmail(sendList, subject, text);
      dmz.object.link(dmz.stance.VoteEmailLinkHandle, email, voteItem.handle);
      dmz.object.scalar(email, dmz.stance.EmailPriorityHandle, priority);
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
