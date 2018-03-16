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

function register(el, evts){
	for(var type in evts){
	  el.addEventListener(type, evts[type]);
	}
}

function selector(){
	var pressed = false;
	var boundary = [];
	var boxP1 = {};
	var boxP2 = {};
	var lastPos = {};

  function updateBoundary(x,y){
    var dx = x - lastPos.x;
    var dy = y - lastPos.y;
    if(dx == 0 && dy == 0){
      return;
    }

    // connect
    if(dx*dx > 1 && dy*dy<=dx*dx){
      var step = dx>0? 1: -1;
      var r = dy/dx;

      for(var j=1;j<dx/step;++j){
        boundary.push({x:lastPos.x+step*j, y:lastPos.y+Math.floor(step*j*r)});
      }
    }else if(dy*dy > 1 && dy*dy>=dx*dx){
      var step = dy>0? 1: -1;
      var r = dx/dy;
      for(var j=1;j<dy/step;++j){
        boundary.push({x:lastPos.x+Math.floor(step*j*r), y:lastPos.y+step*j});
      }
    }
    lastPos = {x:x, y:y};
    boundary.push(lastPos);

    // update bounding box
    if(x < boxP1.x){
      boxP1.x = x;
    }else if(x > boxP2.x){
      boxP2.x = x;
    }
    if(y < boxP1.y){
      boxP1.y = y;
    }else if(y > boxP2.y){
      boxP2.y = y;
    }

  }

  function pressing(e){
    if(pressed){
      return false;
    }
    boundary = [];
    lastPos = {x:e.offsetX, y:e.offsetY};
    boundary.push(lastPos);
    boxP1 = {x:e.offsetX, y:e.offsetY};
    boxP2 = {x:e.offsetX, y:e.offsetY};
    pressed = true;
    return true;
  }

  function release(e){
    if(!pressed){
      return false;
    }
    //updateBoundary(boundary[0].x, boundary[0].y);
    pressed = false;

    return {
      boundary: boundary,
      boxP1: boxP1,
      boxP2: boxP2
    }

  }
  return {
    pressing: pressing,
    pressed: function(){return pressed},
    release: release,
    updateBoundary: updateBoundary
  }

}
