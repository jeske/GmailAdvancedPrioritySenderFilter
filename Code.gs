// https://github.com/PlanetEfficacy/gmailFilter

// https://developers.google.com/apps-script/reference/gmail/gmail-label
// https://developers.google.com/apps-script/reference/contacts
// https://developers.google.com/apps-script/reference/contacts/contacts-app
// https://developers.google.com/apps-script/guides/logging

function prioritizeInbox() {
    
  console.log("code start...");
    
  // Wrap the entire function in a try / catch, in case there is an error, log it.
  try {
   
    // Get the most recent threads in your inbox
    var NUM_THREADS = 50;
    var threads = GmailApp.search("in:inbox and (!is:starred) and !in:z", 0, NUM_THREADS);
    
    console.log("fetched threads ... " + threads.length);
    // For each thread
    for (var t=0; t<threads.length; t++) {
      var thread = threads[t];
      console.log({msg:"thread", n:t, thread:thread});
      
      // Get the unique senders of the thread
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

        if (isSpammySender(sender)) {
          console.log("***** moving spammy thread from .. " + sender + "     *****");
          GmailApp.getUserLabelByName("InboxBulk").addToThread(thread);
          thread.moveToArchive();
          break;
        }

        if (isImportantSender(sender)) {
          console.log("*****   Starring message from .. " + sender + "     ******");
          
          GmailApp.starMessage(messages[0]);       // star the first message in thread   
          break;
        }

        if (isMaybeBulkSender(sender)) {
          console.log("**** maybe bulk message from domain .. " + sender + "     ******");
          GmailApp.getUserLabelByName("InboxBulkMaybe").addToThread(thread);
          thread.moveToArchive();
          break;
        }
      }       

      // if we didn't move it out of inbox, mark the thread as processed...
      if (thread.isInInbox) {
        GmailApp.getUserLabelByName("z").addToThread(thread);
      }
    }
  } catch (e) {
    console.log("Error..." + e.toString());
  }
}

function isSpammySender(sender) {
  // no spammy sending from self
  if (true) {
    var user_email = Session.getActiveUser().getEmail();
    if (sender == user_email) {
      return false;
    }     
    // check gmail aliases
    var aliases = GmailApp.getAliases();
    // console.log("aliases... " + aliases);
    for (var n in aliases) {
      // console.log("checking alias: " + aliases[n]);                     
      if (sender == aliases[n]) {
        return false;
      }          
    }
  }

  if (true) {
    // check if I'm whitelisted with InboxArchive
    var search_spec = "in:InboxArchive from:" + sender;    
    var whitelist_threads = GmailApp.search(search_spec,0,5);

    if (whitelist_threads.length == 0) {  // nope? then check if I have any messgaes in spam
      // check if I have ever marked spam a message from this sender
      var search_spec = "in:spam from:" + sender;    
      var spam_threads = GmailApp.search(search_spec,0,5);

      console.log("spam search_spec = " + search_spec + "    returned: " + spam_threads.length);
      if (spam_threads.length > 0) {
        return true;
      } 
    }
  }
  return false;
}

function isMaybeBulkSender(sender) {
  // no maybe bulk sending from self
  if (true) {
    var user_email = Session.getActiveUser().getEmail();
    if (sender == user_email) {
      return false;
    }     
    // check gmail aliases
    var aliases = GmailApp.getAliases();
    // console.log("aliases... " + aliases);
    for (var n in aliases) {
      // console.log("checking alias: " + aliases[n]);                     
      if (sender == aliases[n]) {
        return false;
      }          
    }
  }

  // check if I'm whitelisted with InboxArchive
  var search_spec = "in:InboxArchive from:" + sender;    
  var whitelist_threads = GmailApp.search(search_spec,0,5);

  if (whitelist_threads.length == 0) {  // nope? then check if I have any messgaes in spam

    var sender_domain = sender.split("@")[1];
    console.log("checking sender DOMAIN : " + sender_domain);

      if (true) {
      // check if I have ever archived a message from this sender
      var search_spec = "!in:inbox !label:starred !in:Spam !in:InboxBulk !in:InboxBulkMaybe from:" + sender_domain;    
      var saved_threads = GmailApp.search(search_spec,0,5);

      console.log("maybe bulk sender search_spec = " + search_spec + "    returned: " + saved_threads.length);
      if (saved_threads.length == 0) {
        return true; // if we have no saved threads from this sender, maybe it's spam
      } 
    }
  }

  return false;
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
