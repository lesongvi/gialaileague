(function() {
    var dc = {};
    var gu = "1EE70445DB72B259695F5854022A8883"
    String.prototype.dts_hash_code=function(){var hash=0;if(this.length==0)return hash;for(i=0;i<this.length;i++){char=this.charCodeAt(i);hash=((hash<<5)-hash)+char;hash=hash&hash}return hash;};

    function _dtsi() {
        a = document.createElement("a"), a.href = window.location.href, _dts.host = a.hostname, "undefined" != typeof document.referrer && document.referrer.length > 0 ? (_dts.r = document.referrer, _dts.p = _dts_gp(_dts.r), "q" in _dts.p ? _dts.q = _dts.p.q : "query" in _dts.p ? _dts.q = _dts.p.query : "p" in _dts.p ? _dts.q = _dts.p.p : "text" in _dts.p ? _dts.q = _dts.p.text : "wd" in _dts.p ? _dts.q = _dts.p.wd : _dts.q = 0) : (_dts.r = 0, _dts.q = 0)
    }
    var _dts = {};
    _dtsi();

    function __dtsinit() {
        var c = document.cookie.split(';');
        for(i = c.length - 1; i >= 0; i--) {
           cv = c[i].trim().split('=');
           dc[cv[0]] = cv[1];
        }
    }
    var di = __dtsinit();

    if(gu !== false && gu.length > 15) {
        lp(gu);
    } else if("__dtsu" in dc && dc.__dtsu.length > 15) {
        lp(dc.__dtsu);
    } else {
        window.addEventListener('message', function(e) {
            if(e.origin.indexOf('dtscout.com') >= 0) {
                if(e.data.length > 0) {
                    var temp = JSON.parse(e.data);
                    lp(temp.u);
                }
            }
        });

        var i = document.createElement('iframe');
        i.src = "//t.dtscout.com/idg/";
        i.width = 0;
        i.height = 0;
        i.style.display = 'none';
        document.body.appendChild(i);
    }

    function lp(data) {
        var uid = data;
        __sc('__dtsu', uid, 800);
        (function(){var j=document.createElement("img"); j.src="//bcp.crwdcntrl.net/5/c=3825/tp=DTSC/tpid="+uid;j.width=1;j.height=1;j.border=0;document.getElementsByTagName("body")[0].appendChild(j);j.onload=function(e){if(e.target) { try{e.target.parentNode.removeChild(e.target);}catch(e){}}}})();(function(){var s=document.createElement("script");s.src="https://n-cdn.areyouahuman.com/play/ZQp6LCe0OO3LeZB6ES1CZrJvMefQTtT9oZjddBS5?AYAH_P2="+uid+"&AYAH_F1=Lotame";s.async=true;document.getElementsByTagName("body")[0].appendChild(s);})();(function(){var i=document.createElement("img"); i.src="//get35.com/m/id.gif?uim_s=DTS&uim_k=71129f02efc51faa&uim_id="+uid;i.width=1;i.height=1;i.border=0;document.getElementsByTagName("body")[0].appendChild(i);i.onload=function(e){if(e.target){try{e.target.parentNode.removeChild(e.target);}catch(e){}}}})();var dts_pi_str="";for(var i=0;i<navigator.plugins.length;i++){dts_pi_str+=navigator.plugins[i].description}dts_pi_str=dts_pi_str.dts_hash_code();var dts_d=new Date();var dts_tz_offset=dts_d.getTimezoneOffset();var dts_res=screen.width+"x"+screen.height+"x"+screen.colorDepth;var dts_s=document.createElement("script");dts_s.async=true;dts_s.src="//t.dtscdn.com/widget/?d="+uid+"&p="+dts_pi_str+"&t="+dts_tz_offset+"&s="+dts_res+"&u="+encodeURIComponent(location.href)+"&r="+encodeURIComponent(document.referrer);document.getElementsByTagName("body")[0].appendChild(dts_s);    }

    function _dts_gp(t) {
        var d = {},
            e = t.split("?", 2);
        if (2 == e.length) {
            e = e[1].split("&");
            for (var s = 0; s < e.length; s++) {
                var _ = e[s].split("=", 2);
                2 == _.length && (d[_[0]] = unescape(_[1]))
            }
        }
        return d
    }

    function __sc(n,v,d) {
        var date = new Date();
        date.setTime(date.getTime() + (d * 86400000));
        document.cookie = n+"="+v+"; expires="+date.toUTCString()+"; path=/";
    }

    })();
