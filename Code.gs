
// https://github.com/PlanetEfficacy/gmailFilter

// https://developers.google.com/apps-script/reference/gmail/gmail-label
// https://developers.google.com/apps-script/reference/contacts
// https://developers.google.com/apps-script/reference/contacts/contacts-app
// https://developers.google.com/apps-script/guides/logging

function prioritizeInbox() {
    
  console.log("code start...");
  
  // var firstThread = GmailApp.getInboxThreads(0,1)[0];
  var firstThread = GmailApp.search("in:inbox and (label:starred)", 0, 1)[0];
  firstThread.markUnread();  
   
  // Wrap the entire function in a try / catch, in case there is an error, log it.
  try {
   
    // Get the most recent threads in your inbox
    var NUM_THREADS = 50;
    var threads = GmailApp.search("in:inbox and (!label:starred)", 0, NUM_THREADS);
    
    console.log("fetched threads ... " + threads.length);
    // For each thread
    for (var t=0; t<threads.length; t++) {
      var thread = threads[t];
      console.log({msg:"thread", n:t, thread:thread});
      
      // Get the sender of the thread
      var senders_map = {};
      var messages = thread.getMessages(); 
      for (var msg_n in messages) {          
        var msg = messages[msg_n];
        var msg_sender = extractEmail(msg.getFrom());
        senders_map[msg_sender] = 1;
      }
      
      var senders = Object.keys(senders_map);
      
      console.log("thread senders : " + senders);
      
      for (var n in senders) {
        var sender = senders[n];
        console.log("checking sender : " + sender);
        if (isImportantSender(sender)) {
          console.log("*****   Starring message from .. " + sender + "     ******");
          
          GmailApp.starMessage(messages[0]);       // star the first message in thread   
          break;
        }
      }       

      
    }
  } catch (e) {
    console.log("Error..." + e.toString());
  }
}


function isImportantSender(sender) {
      
  // check user email
  
  var user_email = Session.getActiveUser().getEmail();
  // console.log("checking user email ... " + user_email);
  if (sender == user_email) {
    return true;
  } 
  
  // check gmail aliases
  var aliases = GmailApp.getAliases();
  // console.log("aliases... " + aliases);
  for (var n in aliases) {
    // console.log("checking alias: " + aliases[n]);                     
    if (sender == aliases[n]) {
      return true;
    }          
  }
  
  if (false) {
    // check if I they are in my starred folder
    var search_spec = "label:starred from:" + sender;
    console.log("starred search_spec = " + search_spec);
    var starred_threads = GmailApp.search(search_spec,0,5);
    if (starred_threads.length > 4) {
      return true;
    } 
  }
    
  // check if i've sent them mail twice before
  var search_spec = "from:me to:" + sender;
  console.log("convo search_spec = " + search_spec);
  var chats_with_contact = GmailApp.search(search_spec,0,5);
  console.log("chats_with_contact .... " + chats_with_contact.length)
  if (chats_with_contact.length > 1) {
    return true;
  }   
  
  return false;
}

function extractEmail(addr) {    
  var regex  = new RegExp("^[^<> '\"]@[^<> \"']$");  
     
  if (regex.test(addr)) {
    return addr;
  }
    
  var regex2 = new RegExp("^.+<([^ ]+@.+)>$");
  if (regex2.test(addr)) {
    var match = regex2.exec(addr);
   
    return match[1];
  }
  
  return addr;
  
  
}
