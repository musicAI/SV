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

function hash8(msg){
  return CryptoJS.SHA256(msg).toString().substr(0, 8);
}

function parallel(funcs, cb){
  var n = funcs.length;
  var dict = funcs.map(function(){return null;});
  return funcs.map(function(f,i){
    return f(function(data){
      if(dict[i]==null && data!=null){
        dict[i] = data;
        n--;
      }
      if(n<=0){
        cb(dict);
      }
    });
  });

}

function serial(funcs, cb){
  var n = funcs.length;
  var dict = funcs.map(function(){return null;});
  function iter(i, data){// callback for funcs[i]
    if(data != null && dict[i] == null){
      dict[i] = data;
    }
    if(i==n-1){
      return cb(dict);
    }else{
      return funcs[i+1](function(data1){
        iter(i+1, data1);
      }, dict.slice(0,i+1));// depend on previous data
    }
  }
  return iter(-1, null);
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

function getStamp(){
  var d = new Date();
  return d.toISOString();
}

function get_json(url, handle, onerror){

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState == XMLHttpRequest.DONE){
      if(this.status == 200 || this.status == 0){
        try{
          var obj = JSON.parse(this.responseText);
          handle(obj)
        }catch(e){
          handle(this.responseText);
        }
      } else{
        typeof onerror == 'undefined'? console.log('Not successful!', this.status):
          onerror(this.responseText);
      }
     };
  }

  xhr.open("GET", url, true);
  xhr.send();

	// $.ajax({
	// 	url: url,
	// 	type: 'GET',
	// 	dataType: '*'
	// }).done(handle).fail(function(e){
	// 	typeof onerror == 'undefined'? console.log(e): onerror(e);
	// 	//alert("Access Denied!")
	// })
}

function get_extra_info(sep){
  var device = typeof window.orientation !== 'undefined'?'mobile':'desktop';
  var origin = window.location.origin;
  var res = [device, origin];
  return typeof sep === 'undefined'? res: sep + res.join(sep);
}



var entry = (function(){
  var prefill_str = "entry.734324363=ID&entry.980529461=TYPE&entry.466105486=DATA&entry.1069261603=STAMP";
  var prefill = prefill_str.split('&');
  var entry = {};
  for(var i in prefill){
    var j = prefill[i].split('=');
    entry[j[1]] = j[0];
  }
  return entry;

})();


function submit_one(formId, ID,TYPE,DATA,STAMP, onsuccess, onerror){
	
	var posturl = 'https://docs.google.com/forms/d/e/' + formId + '/formResponse';
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
    if (this.readyState == XMLHttpRequest.DONE){
			if(this.status == 200 || this.status == 0){
        typeof onsuccess == 'undefined'? console.log('sent', DATA.length):
          onsuccess(this.responseText);
			} else{
        typeof onerror == 'undefined'? console.log('Not successful!', this.status, key, value, id):
          onerror(this.responseText);
	    }
     };
  }

	xhr.open("POST", posturl, true);
  var extra_str = get_extra_info(';');
  var data = {};
	data[entry.ID] = ID;
  data[entry.TYPE] = TYPE + extra_str;
  data[entry.DATA] = DATA;
  data[entry.STAMP] = STAMP;
  data['submit'] = 'Submit';
	var fd = new FormData();
	for(var item in data){
		fd.append(item, data[item]);
	}

  xhr.send(fd);
	
}


function get_target(sheetId, row, column, handle){
  var cell = 'R' + row + 'C' + column;
  var geturl = "https://spreadsheets.google.com/feeds/cells/" + sheetId 
  + "/2/public/values/"+ cell + "?alt=json";
  return get_json(geturl, handle);
}

function register(el, evts){
	for(var type in evts){
	  el.addEventListener(type, evts[type]);
	}
}

function selector(){
	var pressed = false;
	var signature = [];
	var boundary = [];
  var mouse_stroke = [];
  var mouse_rec = [];
  var time_rec = [];
	var boxP1 = {};
	var boxP2 = {};
	var lastPos = {};

  function updateBoundary(x,y){
    mouse_stroke.push([x,y]);
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

    // update bounding box, for resizing the signature
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

  function pressing(offsetX, offsetY){
    if(pressed){
      return false;
    }
    boundary = [];
    mouse_stroke = [];
    time_rec.push(getStamp());
    lastPos = {x:offsetX, y:offsetY};
    boundary.push(lastPos);
    mouse_stroke.push([offsetX, offsetY]);
    boxP1 = {x:offsetX, y:offsetY};
    boxP2 = {x:offsetX, y:offsetY};
    pressed = true;
    return true;
  }

  function release(e){
    if(!pressed){
      return false;
    }
    //updateBoundary(boundary[0].x, boundary[0].y); // back to the staring point
    pressed = false;

    signature.push(boundary);
    mouse_rec.push(mouse_stroke);

    return {
      boundary: boundary,
      rec: mouse_stroke,
      boxP1: boxP1,
      boxP2: boxP2
    }

  }
  function reset(){
    	signature = [];
      time_rec = [];
      mouse_rec = [];
  }
  return {
    pressing: pressing,
    pressed: function(){return pressed},
    release: release,
    updateBoundary: updateBoundary,
    reset: reset,
    signature: function(){return signature},
    rec: function(){return {mouse:mouse_rec, time:time_rec};}
  }

}

function encrypt_secret(json_url, passphrase){
	get_json(json_url, function(data){
		var content = JSON.stringify({"secret":encrypt(JSON.stringify(data), passphrase)});
		//console.log(content);
		var blob = new Blob([content], {type:'text/plain;charset=utf-8'})
		saveAs(blob, json_url.split('/').pop()+'.json');
    content = "var static_info = " + content;
    blob = new Blob([content], {type:'text/plain;charset=utf-8'})
    saveAs(blob, json_url.split('/').pop()+'.js');

	})
}

function decrypt_secret(json_url, passphrase, handle){
  function processing(data){
    //console.log(data)
    var content = decrypt(data['secret'], passphrase);
    if(!!content){
      try{
        var obj = JSON.parse(content);
        handle(obj);
      }catch(e){
        console.log(e);
      }
    }else{
      console.log('invalid passphrase!')
    }
  }
  typeof json_url === "object"? processing(json_url): get_json(json_url, processing);

}

function stroking_b64(stroke_arr){
  //var zip = JSZip();
  var data = stroke_arr.map(function(e){
    return btoa(String.fromCharCode.apply(null, [].concat.apply([], e.map(function(e){return [e.x,e.y]}))));
  });
  return data.join(';');
  
  // data.forEach(function(e,i,arr){
  //   zip.file(String(i+1), e, {binary:true, compression:"DEFLATE"})
  // });
  //zip.generateAsync({type:"string", compression: "DEFLATE"}).then(handle);

}
function b64_stroking(b64str){
  return b64str.split(';').map(function(e){
    return atob(e).split('').map(function(e,i){
      return e.charCodeAt(0);
    });
  })
}
