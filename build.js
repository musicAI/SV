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

function CSVToArray(strData, strDelimiter) {
    // Check to see if the delimiter is defined. If not,
    // then default to COMMA.
    strDelimiter = (strDelimiter || ",");
    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );
    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [
        []
    ];
    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;
    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {
        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];
        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            (strMatchedDelimiter != strDelimiter)
        ) {
            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);
        }

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {
            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
            );
        } else {
            // We found a non-quoted value.
            var strMatchedValue = arrMatches[3];
        }
        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }
    return arrData;
}

function read_csv(path){
    var csv_str = catFile(path);
    return CSVToArray(csv_str);
}


function hash8(msg){
	return CryptoJS.SHA256(msg).toString().substr(0, 8);
}

function insert_script(scripts, src, tgt){
	var src = src || 'collect.html';
	var tgt = tgt || 'index.html';
	var html = catFile(src);
	var scripts = scripts || ['utils', 'info', 'index'];
	scripts.forEach(function(s){
		var script = catFile(s + '.js');
		html = html.replace(
			'<script src="'+s+'.js"></script>', 
			'<script>\n'+script+'\n</script>'
			);

	});
	fs.writeFileSync(tgt, html);
}

function build(passphrase){
	var passphrase = passphrase || catFile('secret/pass');
	var enc = {};
	var dec = ['sheetId', 'formId', 'urlprefix'];
	dec.forEach(function(i){
		enc[i] = catFile('secret/'+i);
	})
	//var df = catFile('secret/info.csv').split(/[\r\n]+/g).map(function(e){return e.split(',')});
	var df = read_csv('secret/info.csv');
	var cols = df.shift();
	var name = df.map(function(x){
		return x[1] + ', ' + x[0];
	})
	var hash = df.map(function(x, i){
		return hash8([name[i], x[2], 
      (parseFloat(x[4])*100)>>0].join(';'));
	});
	var check = hash.map(function(x){
		return hash8(x);
	}).sort();
	enc = Object.assign(enc, {'name': name, 'check':check});
	var res = '';
	var static_info = {
		'secret': encrypt(JSON.stringify(enc), passphrase)
	};
	res += 'var static_info = ' + JSON.stringify(static_info) + ';\n';
	fs.writeFileSync('./info.js', res);
}

if (typeof require != 'undefined' && require.main == module) {
	if(process.argv.length > 2){
		switch(process.argv[2]){
			case 'info.js':
				build();
				break;
			case 'index.html':
				insert_script();
				break;
			default:
				console.log('unknown: ' + process.argv[2]);
		}
	}
}



if(typeof module != 'undefined'){
	module.exports = {
		catFile: catFile,
		encrypt: encrypt,
		decrypt: decrypt,
		hash8: hash8,
	}
}