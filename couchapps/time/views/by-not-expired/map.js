function(doc) {

   if ((doc.type === "object") && (doc.object) && (doc.object.attributes) && (doc.object_type === "vote")) {

      var expired = false
        , valuesExists = false
        , createdAtServerTime = 0
        , endedAtServerTime = 0
        ;

      doc.object.attributes.forEach(function (attr) {

         if (attr.name === "expired") {

            expired = attr.flag.value;
            valueExists = true;
         }
         if (attr.name === "created_at_server_time") {

            createdAtServerTime = attr.timestamp.value;
         }
         if (attr.name === "ended_at_server_time") {

            endedAtServerTime = attr.timestamp.value;
         }
      });
      if (!expired && valueExists && createdAtServerTime && endedAtServerTime) {

         emit(doc.object, null);
      }
   }
}
