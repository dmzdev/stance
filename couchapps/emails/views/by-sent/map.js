function(doc) {

   if ((doc.type === "object") && (doc.object_type === "email") && doc.object && doc.object.attributes) {
      
      var sent;

      doc.object.attributes.forEach(function(attr) {
         if (attr.name === "sent") { sent = attr.flag.value; }
      });
      
      emit(sent, null);
   }
}
