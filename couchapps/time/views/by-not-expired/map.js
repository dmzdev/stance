function(doc) {

   if ((doc.type === "object") && (doc.object) && (doc.object.attributes) && (doc.object_type === "vote")) {

      var expired = false;
          valuesExists = false;

      doc.object.attributes.forEach(function (attr) {

         if (attr.name === "expired") {

            expired = attr.flag.value;
            valueExists = true;
         }
      });
      if (!expired && valueExists) {

         emit(doc.object, null);
      }
   }
}
