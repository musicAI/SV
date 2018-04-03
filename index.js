function Logger() {
    var ele = this.ele = document.querySelector('#status');
    var snack = document.querySelector('#snack-toast');
    //console.log(ele[0], snack)
    var _this = this;
    this.log = function(msg) {
        (arguments.length <= 1 && typeof msg == 'string') ?
        //snack.MaterialSnackbar.showSnackbar({message: msg, timeout:5000}):
        (ele.innerHTML = msg):
            console.log.apply(_this, arguments);
    }
    var errMsg = {
        invalid_pass: 'Invalid passphrase!',
        invalid_name: 'Invalid name, pls select from auto-completion!',
        invalid_info: 'Incorrect information!!',
        no_pass: 'Pls input passphrase first!'
    }
    var log = this.log;
    for(var err in errMsg){
        this[err] = (function(e){
            return function(){
                log(errMsg[e]);
                //$.notify(errMsg[e], 'warn');
                //toastr['warning'](errMsg[e]);
            };
        })(err);
    }
    
}

var logger = new Logger();


var app = {
    saved: ['passphrase', 'name', 'sid', 'score', 'label', 'target'],
    vals: {},
    eles: {},
    init: function(){
        var eles = this.eles;
        this.saved.forEach(function(e,i){
            eles[e] = document.querySelector('#input_'+e);
        });
        this.badge = document.querySelector("#badge_saved_count");

    },
    saveCookie: function (hrs) {
        var hrs = hrs || 6; // default 6 hrs
        var obj = {};
        for (var i in this.saved) {
            var j = this.saved[i];
            obj[j] = this.val(j);
        }
        setCookie('b64inputs', btoa(JSON.stringify(obj)), hrs);
        console.log('Cookies saved.');
    },
    restoreCookie: function () {
        var b64inputs = getCookie('b64inputs');
        if(!b64inputs){
            return;
        }
        var obj;
        try{
            obj = JSON.parse(atob(b64inputs)); 
        }catch(e){
            logger.log('Invalid cookies!');
            return;
        }
        for (var i in this.saved) {
            var j = this.saved[i];
            if(!!obj[j]){
                this.eles[j].value = obj[j]

            }
        }
        this.update();
    },
    passphrase: '',
    saved_count: 0,
    names: {},
    genuine_sig: {},
    genuine_stroke: {},
    forged_sig: {},
    forged_stroke: {},
    val: function(v){
        if(this.saved.indexOf(v) > -1){
            return this.eles[v].value;
        }else{
            return '';
        }
    },
    labels: function() {
        return Object.keys(this.genuine_sig);
    },
    item: function(label, i) {
        return {
            signature: this.genuine_sig[label][i],
            stroking: this.genuine_stroke[label][i],
            id: [label, i]
        }
    },
    badge: null,
    add_genuine: function(label, imgdata, stdata) {
        if (!(label in this.genuine_sig)) {
            this.genuine_sig[label] = [];
            this.genuine_stroke[label] = [];
        }else{
            var pre = hash8(this.genuine_sig[label].slice(-1)[0]);
            var cur = hash8(imgdata);
            if(cur == pre){
                return false;
            }
        }
        this.genuine_sig[label].push(imgdata);
        this.genuine_stroke[label].push(stdata);
        this.saved_count++;
        this.badge.setAttribute('data-badge', this.saved_count);
        return true;
    },
    update: function(){
        var passphrase = this.val('passphrase').toUpperCase();
        if(this.passphrase == passphrase){
            return;
        }
        this.passphrase = passphrase;
        //var secret_obj = 'info.json'; // stored in json
        var secret_obj = static_info; // stored in js
        var info = decrypt(static_info.secret, this.passphrase);
        if(!info){
            logger.invalid_pass();
            static_info['dec'] = null;
        }else{
            info = JSON.parse(info);
            static_info['dec'] = info;
            if(!(this.passphrase in this.names)){
                this.names[this.passphrase] = info.name;
                logger.log('Correct passphrase.');
                logger.log('students info loaded ', info.name.length);
                try{
                    $("#input_name").autocomplete({
                        source: info.name
                    });
                    $("#input_target").autocomplete({
                        source: info.name
                    });
                }catch(e){
                    logger.log('Auto-completion not supported!!');
                    return;
                }
                    
            }
        }
    },
    validate_name: function(){
        var student_name = this.val('name');
        if (this.names[this.passphrase].indexOf(student_name) < 0) {
            logger.invalid_name();
            return false;
        }else{
            return student_name;
        }
    },
    validate_id: function(){
        if(!static_info.dec){
            logger.invalid_pass();
            return false;
        }
        var student_name = this.validate_name();
        if(!student_name){
            return false;
        }
        var score = this.val('score');
        if(!score){
            score = 0;
        }
        var id = [student_name, this.val('sid'),
            (parseFloat(score) * 100) >> 0
        ].join(';');
        id = hash8(id);
        if('check' in static_info.dec){
            if(static_info.dec.check.indexOf(hash8(id)) < 0){
                logger.invalid_info();
                return false;
            }
        }
        return id;

    },
    to_files: function(img_folder, json_folder){
        var n_img = 0;

        for (var label in this.genuine_sig) {
            var images = this.genuine_sig[label], strokes = this.genuine_stroke[label];
            n_img += images.length;
            images.forEach(function(e, i, arr) {
                var s = strokes[i];
                var h = hash8(e);
                img_folder.file(h + '-' + label + '.png',
                    e.split('base64,')[1], {
                        base64: true
                    });
                var arr = s.map(function(e) {
                    return e.map(function(e) {
                        return [e.x, e.y]
                    })
                });
                var arr = JSON.stringify(arr);
                json_folder.file(h + '-' + label + '.json', arr);
            });

        }
        return n_img;
    }
}




function initUI(canvas) {
    
    
    app.init();
    app.restoreCookie();
    register([app.eles.name, app.eles.target], {
            'focus': function(){app.update()}
        }
    );

    register(app.eles.passphrase, {
        'focusout': function(){app.update()}
    });    
    // var button = document.createElement('button');
    // var textNode = document.createTextNode('Save Signature!');
    // button.appendChild(textNode);
    // button.className = 'mdl-button mdl-js-button mdl-js-ripple-effect';
    // componentHandler.upgradeElement(button);
    // document.getElementById('container').appendChild(button);
    var button = document.querySelector("#button_save");
    register(button, {
        'click': function() {
            var zip = new JSZip();
            zip.file("Readme.txt", "images of signatures (named by hash-label) stored in offline/, size 256x128, PNG format\ntime series of strokes stored in online/, 3-D arrays");
            var img = zip.folder("offline");
            var st = zip.folder("online");
            var n_img = app.to_files(img, st);

            // for (var label in app.genuine_sig) {
            //     app.genuine_sig[label].forEach(function(e, i, arr) {
            //         var s = app.genuine_stroke[label][i];
            //         var h = hash8(e);
            //         img.file(h + '-' + label + '.png',
            //             e.split('base64,')[1], {
            //                 base64: true
            //             });
            //         n_img++;
            //         var arr = s.map(function(e) {
            //             return e.map(function(e) {
            //                 return [e.x, e.y]
            //             })
            //         });
            //         var arr = JSON.stringify(arr);
            //         st.file(h + '-' + label + '.json', arr);
            //     });

            // }
            if (n_img == 0) {
                logger.log('No uploaded signature to save in this session!');
                return;
            }

            zip.generateAsync({
                    type: "blob"
                })
                .then(function(content) {
                    // see FileSaver.js
                    saveAs(content, "Genuine.zip");
                    logger.log(n_img + ' signatures saved to zip.');
                });
        }
    });
}



var sel = null;
var canvas = null;

var button_clicks = {
    "reset": null,
    "upload_genuine": function() {
        if(!static_info.dec){
            logger.invalid_pass();
            return;
        }
        var formId = static_info.dec.formId;
        
        var id = app.validate_id();
        if(!id){
            return;
        }
        var label = app.val('label');
        var stamp = getStamp();
        id = id + label; //encrypt(id, passphrase);
        logger.log('Saving and submitting data ...');
        app.saveCookie();
        

        var stroke_data = sel.signature()
        var stroke_str = stroking_b64(stroke_data);
        console.log('stroke string length', stroke_str.length);
        var image_data = canvas.toDataURL();
        console.log('dataurl length', image_data.length);
        if(!app.add_genuine(label, image_data, stroke_data)){
            logger.log('Do not submit the same signature twice!!');
            return;
        }

        submit_one(formId, id, 'genuine-strokearray', stroke_str, stamp, function() {
            console.log('Genuine strokes submitted.');
        });
        
        submit_one(formId, id, 'genuine-dataurl', image_data, stamp, function() {
            logger.log('Genuine signature submitted.');

        });
    },
    "download_target": function() {
        if(!static_info.dec){
            logger.invalid_pass();
            return;
        }
        var sheetId = static_info.dec.sheetId;
        var target_name = app.val('target');
        var row = app.names[app.passphrase].indexOf(target_name);
        if (row < 0) {
            logger.invalid_name();
            return;
        }
        app.saveCookie();
        get_target(sheetId, row+1, 2, function(data) {
            // handle data
            var dataurl = data.entry.gs$cell.$t;
            if (dataurl.indexOf('base64') < 0) {
                logger.log("No signature to imitate");
                $("#sig-image").attr('src', '');
                return;
            }
            $("#sig-image").attr('src', dataurl);
            logger.log('Target signature downloaded!');
        });

    },
    "upload_forged": function() {
        if(!static_info.dec){
            logger.invalid_pass();
            return;
        }

        var formId = static_info.dec.formId;
        var target_name = app.val('target');
        if (app.names[app.passphrase].indexOf(target_name) < 0) {
            logger.invalid_name();
            return;
        }
        app.saveCookie();

        var stamp = getStamp();
        var id = target_name + ';' + hash8($('#sig-image').attr('src')); //encrypt(id, passphrase);
        logger.log('Submitting data ...');

        var stroke_data = sel.signature()
        var stroke_str = stroking_b64(stroke_data);
        console.log('stroke string length', stroke_str.length);
        submit_one(formId, id, 'forged-strokearray', stroke_str, stamp, function() {
            console.log('Forged strokes submitted.');
        });
        var image_data = canvas.toDataURL();
        console.log('dataurl length', image_data.length);
        submit_one(formId, id, 'forged-dataurl', image_data, stamp, function() {
            logger.log('Forged signature submitted.');
        });

    },
    "download_all": function() {
        if(!static_info.dec){
            logger.invalid_pass();
            return;
        }
        var sheetId = static_info.dec.sheetId;
        var urlprefix = static_info.dec.urlprefix;
        var student_name = app.validate_name();
        if(!student_name){
            return;
        }
        var id = app.validate_id();
        if(!id){
            return;
        }
        app.saveCookie();
        var stamp = hash8(getStamp());

        var zip_url = urlprefix + id + '/svdata_' +
            student_name.replace(/ /g, '_').replace(/,/g, '') + '.zip?t=' + stamp;
        //console.log(zip_url)
        get_json(urlprefix + 'date', function(data) {
            logger.log('Zip updated at ' + new Date(data));
        }, function(e) {
            logger.log('Failed to download all signatures')
        });
        window.open(zip_url, '_blank');


    },
    "get_info": function() {
        if(!static_info.dec){
            logger.invalid_pass();
            return;
        }
        var sheetId = static_info.dec.sheetId;
        var student_name = app.val('name');
        var row = app.names[app.passphrase].indexOf(student_name);
        if (row < 0) {
            logger.invalid_name();
            return;
        }
        app.saveCookie();
        row += 1;
        parallel([
            function(func){
                get_target(sheetId, row, 1, func);
            },
            function(func){
                get_target(sheetId, row, 3, func);
            }
        ], function(data){
            var genuine_count = parseInt(data[0].entry.gs$cell.$t);
            var forged_count = parseInt(data[1].entry.gs$cell.$t);
            logger.log(genuine_count+' genuine + '+forged_count+' forged = ' + (genuine_count+forged_count)+' signatures');

        });

    }



}



window.onload = function() {
    // global vars
    sel = selector();
    canvas = document.getElementById('sig-canvas');
    var ctx = canvas.getContext('2d');
    var scaling = parseFloat(canvas.getAttribute('width')) / parseFloat(canvas.offsetWidth);
    console.log('canvas scaling', scaling);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    initUI(canvas);


    // source image mouse control
    function release(e) {
        var res = sel.release(e);
        window.blockMenuHeaderScroll = false;
        if (res == false) {
            return;
        }
        //ctx.lineTo(res.boundary[0].x, res.boundary[0].y);
        //ctx.stroke();
        ctx.closePath();
    }

    function start(e) {
        var offsetX = Math.round(scaling * e.offsetX);
        var offsetY = Math.round(scaling * e.offsetY);

        if (sel.pressing(offsetX, offsetY)) {
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY);
            window.blockMenuHeaderScroll = true;
        }
    }

    function move(e) {
        if (sel.pressed()) {
            var offsetX = Math.round(scaling * e.offsetX);
            var offsetY = Math.round(scaling * e.offsetY);
            sel.updateBoundary(offsetX, offsetY);
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
        }
    }

    function reset() {
        console.log(sel.signature())
        sel.reset();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        logger.log('Canvas cleared!');
    }

    register(canvas, {
        'mousedown': function(e) {
            start(e);
            move(e);
        },
        'touchstart': function(e){
            start(e);
        },
        'mousemove': move,
        'touchmove': function(e) {
            if (window.blockMenuHeaderScroll) {
                e.preventDefault();
            }
            var touch = e.targetTouches[0];
            //logger.log([touch.clientX>>0, touch.pageX>>0, touch.clientY>>0, touch.pageY>>0].join(','));
            var mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.pageX,
                clientY: touch.pageY
            });
            canvas.dispatchEvent(mouseEvent);
        },
        'mouseup': release,
        'mouseout': release,
        'touchend': release,
        'dblclick': function(e) {
            //console.log(e.offsetX, e.offsetY);
            reset();
        }
    });
    button_clicks['reset'] = function(e){
        reset();
    }

    for(var cmd in button_clicks){
        var ev = document.querySelector('#button_' + cmd);
        ev.addEventListener('click', button_clicks[cmd]);
    }

}; // document ready
//$(window).on('unload', onExit);