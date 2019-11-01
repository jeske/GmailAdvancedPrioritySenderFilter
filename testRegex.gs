

function extractEmail2(addr) {    
  var regex  = new RegExp(" *^[^ ]@[^ ] *$");  
     
  if (regex.test(addr)) {
    return addr;
  }
    
  var regex2 = new RegExp("^ *.+<([^ ]+@.+)> *$");
  if (regex2.test(addr)) {
    var match = regex2.exec(addr);
   
    return match[1];
  }
  
  throw new Error("unparsable email: " + addr);
  
}

function testRegex() {
    Logger.log("email = " + extractEmail2("Stardock Software <info@stardock.net>"));
    Logger.log("email = " + extractEmail2("DONOTREPLY@incometaxindiaefiling.gov.in"));
  
}
