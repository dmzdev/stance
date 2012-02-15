function(doc) {

   if ((doc.type === "object") && (doc.object) && (doc.object.attributes) && (doc.object_type === "user")) {

      var value = false
        , exists = false
        ;

      doc.object.attributes.forEach(function (attr) {

         if (attr.name === "consecutive_logins") {

            exists = true;
            value = attr.flag.value;
         }
      });
      if (exists && !value) {

         emit(doc.object, null);
      }
   }
}
