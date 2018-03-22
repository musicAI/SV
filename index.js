var saved = ['passphrase', 'name', 'sid', 'score', 'label', 'target'];
function saveCookie(){
	for(var i in saved){
  	var j = saved[i];
  	var p = $('#input_' + j).val();
  	if(!!p){
  		setCookie(j, p, 2);
	  }
  }
  console.log('Cookies saved.');
}
var formId_enc = "cdc858c0b42d8bbf6a5daef1f71ef0569617b056173329dd64cdae5a00ec1bc9U2FsdGVkX1+w2CNIwH/qu+2gOKtfRYmEQb3gckRQdgXkiywm8Nq0n725JFPvv48PqY+cZCHKkqbAR4efyb1DUjP0A/oSaTEoX2gL5u6UkTU=";
var sheetId_enc = "b5e85b633fa5f51892b1d107a8bf0505b9c9a3bf2ba1c6e6ea26f893e9219617U2FsdGVkX1/MFIIvTYyEQFr90Uj7Gs0N0iJcGYgD20LVCWrVik6han9ccZ9Xmpq2UqYkRXg03j0PHnZZnTXXxA==";

var name_list = {};
var signature_list = {}, stroking_list = {}
var forged_signature_list = {}, forged_stroking_list = {};
var app = {
	saved_count:0,
	names: name_list,
	genuine_sig: signature_list,
	genuine_stroke: stroking_list,
	forged_sig: forged_signature_list,
	forged_stroke: forged_stroking_list,
	labels: function(){
		return Object.keys(this.genuine_sig);
	},
	item: function(label, i){
		return {
			signature: this.genuine_sig[label][i],
			stroking: this.genuine_stroke[label][i],
			id: [label, i]
		}
	},
	badge: $("#badge_saved_count"),
	add_genuine: function(label, imgdata, stdata){
		if(!(label in this.genuine_sig)){
			this.genuine_sig[label] = [];
			this.genuine_stroke[label] = [];
		}
		this.genuine_sig[label].push(imgdata);
		this.genuine_stroke[label].push(stdata);
		this.saved_count ++;
		this.badge.attr('data-badge', String(this.saved_count));
	}
}
  var logger = new function(){
  	var ele = this.ele = $("#status");
  	var snack = this.snack = $("#snack-toast")[0];
  	console.log(ele[0], snack)
  	var _this = this;
  	this.log = function(msg){
  		(arguments.length <= 1 && typeof msg == 'string')? 
  			//snack.MaterialSnackbar.showSnackbar({message: msg, timeout:5000}):
  			ele.html(msg): 
  			console.log.apply(_this, arguments);
  	}
  	this.invalid_pass = function(){
  		this.log('Invalid passphrase!');
  	}
  	this.invalid_name = function(){
  		this.log('Invalid name, pls select from auto-completion!');
  	}
  }
  

function initUI(canvas){
  // var button = document.createElement('button');
  // var textNode = document.createTextNode('Save Signature!');
  // button.appendChild(textNode);
  // button.className = 'mdl-button mdl-js-button mdl-js-ripple-effect';
  // componentHandler.upgradeElement(button);
  // document.getElementById('container').appendChild(button);
  var button = "#button_save"
  $(button).click(function(){
  	var zip = new JSZip();
		zip.file("Readme.txt", "signatures (with hash-label) stored in signature/, size 256x128, PNG format\nstrokes stored in stroke/, 2-D array");
		var img = zip.folder("signature");
		var st = zip.folder("stroke");
		var n_img = 0;
		for(var label in signature_list){
			signature_list[label].forEach(function(e,i,arr){
				var s = stroking_list[label][i];
				var h = CryptoJS.SHA256(e).toString().substr(0,8);
				img.file(h +'-'+label+'.png', 
					e.split('base64,')[1], {base64: true});
				n_img++;
				var arr = s.map(function(e){return e.map(function(e){return [e.x,e.y]})});
				var arr = JSON.stringify(arr);
				st.file(h+'-'+label+'.json', arr);
			});
			
		}
		if(n_img == 0){
			logger.log('No uploaded signature to save in this session!');
			return;
		}
		//var imgURL = canvas.toDataURL()
		//img.file("signature.png", imgURL.split('base64,')[1], {base64: true});
		zip.generateAsync({type:"blob"	})
		.then(function(content) {
		    // see FileSaver.js
		    saveAs(content, "Genuine.zip");
		    logger.log(n_img + ' signatures saved to zip.');
		});
  });
  
  for(var i in saved){
  	var j = saved[i];
  	var p = getCookie(j);
  	//console.log(j, p);
  	if(!!p){
	  	$('#input_' + j).val(p);
	  }
  }

}

	

var sel = selector();
function update_namelist(){
	var passphrase = $("#input_passphrase").val().toUpperCase();
	//var secret_obj = 'info.json'; // stored in json
	var secret_obj = static_info;  // stored in js
	if(passphrase && !(passphrase in name_list)){
		decrypt_secret(secret_obj, passphrase, 
			function(info){
				logger.log('students info loaded', info.students.length);
				name_list[passphrase] = info.students.map(function(e){return e[1]+', '+e[0]});
				$("#input_name").autocomplete({
					source: name_list[passphrase]
				});
				$("#input_target").autocomplete({
					source: name_list[passphrase]
				});
		}); // auto-completion
	}
}
  

	
	
	
$(function(){
	var canvas = document.getElementById('sig-canvas');
    var ctx = canvas.getContext('2d');
    var scaling = parseFloat($(canvas).attr('width'))/parseFloat($(canvas).css('width'));
    console.log('canvas scaling', scaling);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round'
	initUI(canvas);
	
	$("#input_passphrase").focusout(update_namelist)
	$("#input_name").focus(update_namelist);
	$("#input_target").focus(update_namelist);
	
  
  // source image mouse control
  function release(e){
    var res = sel.release(e);
    window.blockMenuHeaderScroll = false;
    if(res == false){
      return;
    }
    //ctx.lineTo(res.boundary[0].x, res.boundary[0].y);
    //ctx.stroke();
    ctx.closePath();
  }
  function start(e){
  	var offsetX = Math.round(scaling * e.offsetX);
  	var offsetY = Math.round(scaling * e.offsetY);

  	if(sel.pressing(offsetX, offsetY)){
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    window.blockMenuHeaderScroll = true;
  }
  }
  function move(e){
  	if(sel.pressed()){
  		var offsetX = Math.round(scaling * e.offsetX);
  	  var offsetY = Math.round(scaling * e.offsetY);
        sel.updateBoundary(offsetX, offsetY);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    }
  }
  function reset(){
  	console.log(sel.signature())
  	sel.reset();
  	ctx.clearRect(0, 0, canvas.width, canvas.height);
  	logger.log('Canvas cleared!');
  }

  register(canvas, {
    'mousedown': function(e){
    	start(e);
    	move(e);
    },
    'touchstart': start,
    'mousemove': move,
    'touchmove': function(e){
    	if(window.blockMenuHeaderScroll){
	    		e.preventDefault();
	    }
    	var touch = e.targetTouches[0];
     //$("#status").html([touch.clientX>>0, touch.pageX>>0, touch.clientY>>0, touch.pageY>>0].join(','));
    	var mouseEvent = new MouseEvent("mousemove", {
		    clientX: touch.pageX,
		    clientY: touch.pageY
		  });
	  	canvas.dispatchEvent(mouseEvent);
    },
    'mouseup': release,
    'mouseout': release,
    'touchend': release,
    'dblclick': function(e){
      //console.log(e.offsetX, e.offsetY);
      reset();
    }
  });
  $("#button_reset").click(reset);
  $("#button_upload_genuine").click(function(){
  	var passphrase = $("#input_passphrase").val().toUpperCase();

  	var formId = decrypt(formId_enc, passphrase);
	if(!formId){
		logger.invalid_pass();
		return;
	}
	saveCookie();
	
	
	var d = new Date();
    var stamp = d.toUTCString();
    var score = $('#input_score').val();
    if(!score){
    	score = 0;
    }
    var label = $('#input_label').val();
    update_namelist();
    var student_name = $('#input_name').val();
    if(name_list[passphrase].indexOf(student_name) < 0){
    	logger.invalid_name();
    	return;
    }

    var id = [student_name, $('#input_sid').val(), 
      (parseFloat(score)*100)>>0].join(';');
    var id = CryptoJS.SHA256(id).toString().substr(0,8) + label; //encrypt(id, passphrase);
    logger.log('Saving and submitting data ...');
  	
  	var stroke_data = sel.signature()
  	//stroking_list[label].push(stroke_data);
  	var stroke_str = stroking_b64(stroke_data);
  	console.log('stroke string length', stroke_str.length);
  	submit_one(formId, id, 'genuine-strokearray', stroke_str, stamp, function(){
  		console.log('Genuine strokes submitted.', );
  	});
  	var image_data = canvas.toDataURL();
	console.log('dataurl length', image_data.length);
  	//signature_list[label].push(image_data);
  	submit_one(formId, id, 'genuine-dataurl', image_data, stamp, function(){
  		logger.log('Genuine signature submitted.');
  		
  	});
  	app.add_genuine(label, image_data, stroke_data);
  	
  });
  $("#button_download_target").click(function(){
		var passphrase = $("#input_passphrase").val().toUpperCase();

  	var sheetId = decrypt(sheetId_enc, passphrase);
		if(!sheetId){
			//console.log('invalid passphrase!')
			logger.invalid_pass();
			return;
		}
		update_namelist();
		var target_name = $('#input_target').val();
		var row = name_list[passphrase].indexOf(target_name);
    if(row < 0){
    	logger.invalid_name();
    	return;
    }
    saveCookie();
    row += 1;
	get_target(sheetId, row, 2, function(data){
		// handle data
		var dataurl = data.entry.gs$cell.$t;
		if(dataurl.indexOf('base64')<0){
			logger.log("No signature to imitate");
			$("#sig-image").attr('src', '');
			return;
		}
		$("#sig-image").attr('src', dataurl);
		logger.log('Target signature downloaded!');
	});

  });
$("#button_upload_forged").click(function(){
	var passphrase = $("#input_passphrase").val().toUpperCase();

  	var formId = decrypt(formId_enc, passphrase);
	if(!formId){
		//console.log('invalid passphrase!')
		logger.invalid_pass()
		return;
	}
	var target_name = $('#input_target').val();
	if(name_list[passphrase].indexOf(target_name) < 0){
    	logger.invalid_name();
    	return;
    }
	saveCookie();
	
	var d = new Date();
    var stamp = d.toUTCString();
    var id = target_name + ';'+ CryptoJS.SHA256($('#sig-image').attr('src')).toString().substr(0,8); //encrypt(id, passphrase);
    logger.log('Submitting data ...');
    
  	var stroke_data = sel.signature()
  	var stroke_str = stroking_b64(stroke_data);
  	console.log('stroke string length', stroke_str.length);
  	submit_one(formId, id, 'forged-strokearray', stroke_str, stamp, function(){
  		console.log('Forged strokes submitted.');
  	});
  	var image_data = canvas.toDataURL();
	console.log('dataurl length', image_data.length);
  	submit_one(formId, id, 'forged-dataurl', image_data, stamp, function(){
  		logger.log('Forged signature submitted.');
  	});

});
$("#button_get_info").click(function(){
	var passphrase = $("#input_passphrase").val().toUpperCase();
  	var sheetId = decrypt(sheetId_enc, passphrase);
		if(!sheetId){
			//console.log('invalid passphrase!')
			logger.invalid_pass();
			return;
		}
		update_namelist();
		var student_name = $('#input_name').val();
		var row = name_list[passphrase].indexOf(student_name);
		if(row < 0){
    	logger.invalid_name();
    	return;
    }
    saveCookie();
    row += 1;
	get_target(sheetId, row, 1, function(data){
		// handle data
		var genuine_count = parseInt(data.entry.gs$cell.$t);
		get_target(sheetId, row, 3, function(data){
			var forged_count = parseInt(data.entry.gs$cell.$t);
			logger.log((genuine_count + forged_count) + ' signatures, '+genuine_count + ' genuine.');
		});

	});
		

});
	
}); // document ready
//$(window).on('unload', onExit);