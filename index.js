var saved = ['passphrase', 'name', 'sid', 'score', 'label', 'target'];

function saveCookie(hrs) {
    var hrs = hrs || 6; // default 6 hrs
    for (var i in saved) {
        var j = saved[i];
        var p = $('#input_' + j).val();
        if (!!p) {
            setCookie(j, p, hrs); 
        }
    }
    console.log('Cookies saved.');
}

function restoreCookie() {
    for (var i in saved) {
        var j = saved[i];
        var p = getCookie(j);
        //console.log(j, p);
        if (!!p) {
            $('#input_' + j).val(p);
        }
    }
}

var logger = new function() {
    var ele = this.ele = $("#status");
    var snack = this.snack = $("#snack-toast")[0];
    console.log(ele[0], snack)
    var _this = this;
    this.log = function(msg) {
        (arguments.length <= 1 && typeof msg == 'string') ?
        //snack.MaterialSnackbar.showSnackbar({message: msg, timeout:5000}):
        ele.html(msg):
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
            };
        })(err);
    }
    
}

var app = {
    saved: saved,
    vals: {},
    passphrase: '',
    saved_count: 0,
    names: {},
    genuine_sig: {},
    genuine_stroke: {},
    forged_sig: {},
    forged_stroke: {},
    val: function(v){
        if(this.saved.indexOf(v) > -1){
            return this.vals[v] = $('#input_'+v).val();
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
    badge: $("#badge_saved_count"),
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
        this.badge.attr('data-badge', String(this.saved_count));
        return true;
    },
    update: function(){
        var passphrase = $("#input_passphrase").val().toUpperCase();
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
                logger.log('Correct passphrase!');
                logger.log('students info loaded ', info.name.length);
                    $("#input_name").autocomplete({
                        source: info.name
                    });
                    $("#input_target").autocomplete({
                        source: info.name
                    });
            }
        }
    },
    validate_name: function(){
        var student_name = $('#input_name').val();
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
        var id = [student_name, $('#input_sid').val(),
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

    }
}




function initUI(canvas) {
    restoreCookie();
    // var button = document.createElement('button');
    // var textNode = document.createTextNode('Save Signature!');
    // button.appendChild(textNode);
    // button.className = 'mdl-button mdl-js-button mdl-js-ripple-effect';
    // componentHandler.upgradeElement(button);
    // document.getElementById('container').appendChild(button);
    var button = "#button_save";
    $(button).click(function() {
        var zip = new JSZip();
        zip.file("Readme.txt", "images of signatures (named by hash-label) stored in offline/, size 256x128, PNG format\ntime series of strokes stored in online/, 3-D arrays");
        var img = zip.folder("offline");
        var st = zip.folder("online");
        var n_img = 0;

        for (var label in app.genuine_sig) {
            app.genuine_sig[label].forEach(function(e, i, arr) {
                var s = app.genuine_stroke[label][i];
                var h = hash8(e);
                img.file(h + '-' + label + '.png',
                    e.split('base64,')[1], {
                        base64: true
                    });
                n_img++;
                var arr = s.map(function(e) {
                    return e.map(function(e) {
                        return [e.x, e.y]
                    })
                });
                var arr = JSON.stringify(arr);
                st.file(h + '-' + label + '.json', arr);
            });

        }
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
    });

}



var sel = selector();





$(function() {
    var canvas = document.getElementById('sig-canvas');
    var ctx = canvas.getContext('2d');
    var scaling = parseFloat($(canvas).attr('width')) / parseFloat($(canvas).css('width'));
    console.log('canvas scaling', scaling);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round'
    initUI(canvas);

    $("#input_passphrase").focusout(function(){app.update()});
    $("#input_name").focus(function(){app.update()});
    $("#input_target").focus(function(){app.update});


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
        'touchstart': start,
        'mousemove': move,
        'touchmove': function(e) {
            if (window.blockMenuHeaderScroll) {
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
        'dblclick': function(e) {
            //console.log(e.offsetX, e.offsetY);
            reset();
        }
    });
    $("#button_reset").click(reset);
    $("#button_upload_genuine").click(function() {
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
        saveCookie();
        

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
            console.log('Genuine strokes submitted.', );
        });
        
        submit_one(formId, id, 'genuine-dataurl', image_data, stamp, function() {
            logger.log('Genuine signature submitted.');

        });
        

    });
    $("#button_download_target").click(function() {
        if(!static_info.dec){
            logger.invalid_pass();
            return;
        }
        var sheetId = static_info.dec.sheetId;
        var target_name = $('#input_target').val();
        var row = app.names[app.passphrase].indexOf(target_name);
        if (row < 0) {
            logger.invalid_name();
            return;
        }
        saveCookie();
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

    });
    $("#button_upload_forged").click(function() {
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
        saveCookie();

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

    });
    $("#button_download_all").click(function() {
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
        saveCookie();
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


    });
    $("#button_get_info").click(function() {
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
        saveCookie();
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

    });

}); // document ready
//$(window).on('unload', onExit);