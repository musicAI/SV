function encrypt(unencrypted, passphrase){
	var encrypted = CryptoJS.AES.encrypt(unencrypted, passphrase);
  	var hmac = CryptoJS.HmacSHA256(encrypted.toString(), CryptoJS.SHA256(passphrase).toString()).toString();
  	var encryptedMsg = hmac + encrypted;
  	return encryptedMsg;
}
function decrypt(encryptedMsg, passphrase){
    var encryptedHMAC = encryptedMsg.substring(0, 64),
    encryptedHTML = encryptedMsg.substring(64),
    decryptedHMAC = CryptoJS.HmacSHA256(encryptedHTML, CryptoJS.SHA256(passphrase).toString()).toString();

    if (decryptedHMAC !== encryptedHMAC) {
        //alert('Bad passphrase !');
        return null;
    }
    var ret = CryptoJS.AES.decrypt(encryptedHTML, passphrase).toString(CryptoJS.enc.Utf8);
    return ret;
}

function setCookie(cname, cvalue, exhrs) {
    var d = new Date();
    d.setTime(d.getTime() + (exhrs*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;";
}
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function get_json(url, handle){
	$.ajax({
		url: url,
		type: 'GET',
		dataType: 'JSON'
	}).done(handle).fail(function(e){
		console.log(e)
		//alert("Access Denied!")
	})
}


var prefill_str = "entry.734324363=ID&entry.980529461=TYPE&entry.466105486=DATA&entry.1069261603=STAMP";
prefill = prefill_str.split('&');
var entry = {};
for(var i in prefill){
	var j = prefill[i].split('=');
	entry[j[1]] = j[0];
}

function submit_one(formId, ID,TYPE,DATA,STAMP) {
	
	var posturl = 'https://docs.google.com/forms/d/e/' + formId + '/formResponse';
  var xhr = new XMLHttpRequest();
  
  xhr.onreadystatechange = function() {
    if (this.readyState == XMLHttpRequest.DONE){
      if(this.status == 200 || this.status == 0){
        console.log(DATA);
      } else{
        console.log('Not successful!', this.status, key, value, id);
      }
    }
  };

  xhr.open("POST", posturl, true);
  data = {};
  data[entry.ID] = ID;
  data[entry.TYPE] = TYPE;
  data[entry.DATA] = DATA;
  data[entry.STAMP] = STAMP;
  data['submit'] = 'Submit';
  var fd = new FormData();
  for(var item in data){
    fd.append(item, data[item]);
  }
  xhr.send(fd);
}