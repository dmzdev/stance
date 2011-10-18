function(doc) {

   if((doc.type === "object") && doc.object && doc.object.attributes) {

      doc.object.attributes.forEach(function (attr) {

         if (attr.name === "update_posted_time_handle") {

            if (attr.flag.value === true) {

               emit(attr.flag.value, null);
            }
         }
      });
   }
}
