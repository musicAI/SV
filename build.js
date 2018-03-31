#!/usr/bin/env node

const CryptoJS = typeof require != 'undefined'? require('crypto-js'): (CryptoJS || {});
const fs = typeof require != 'undefined'? require('fs'): {};

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

function catFile(path){
	return fs.readFileSync(path).toString()
}

function hash8(msg){
	return CryptoJS.SHA256(msg).toString().substr(0, 8);
}

function build(passphrase){
	var passphrase = passphrase || catFile('secret/pass');
	var enc = {};
	var dec = ['sheetId', 'formId', 'urlprefix'];
	dec.forEach(function(i){
		enc[i + '_enc'] = encrypt(catFile('secret/'+i), passphrase);
	})
	var df = catFile('secret/info.csv').split(/[\r\n]+/g).map(function(e){return e.split(',')});
	var cols = df.shift();
	var name = df.map(function(x){
		return x[1] + ', ' + x[0];
	})
	var hash = df.map(function(x, i){
		return hash8([name[i], x[2], 
      (parseFloat(x[4])*100)>>0].join(';'));
	});
	var static_info = {
		'secret': encrypt(JSON.stringify({'hash': hash,'name': name}), passphrase)
	};
	var res = 'var static_info = ' + JSON.stringify(static_info) + ';\n';
	dec.forEach(function(i){
		res += 'var '+i+'_enc = "' + enc[i+'_enc'] + '";\n';
	});
	fs.writeFileSync('./info.js', res);
}

if (typeof require != 'undefined' && require.main == module) {
    build();
}



if(typeof module != 'undefined'){
	module.exports = {
		catFile: catFile,
		encrypt: encrypt,
		decrypt: decrypt,
		hash8: hash8,
	}
}