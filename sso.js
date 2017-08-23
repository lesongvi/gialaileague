	(function() {

	var SETTINGS = {};
	var SSO_SERVER_URL = 'https://sso.garena.com/';
	var SSO_URL_API_PRELOGIN = SSO_SERVER_URL + 'api/prelogin';
	var SSO_URL_API_LOGIN = SSO_SERVER_URL + 'api/login';
	var SSO_URL_API_LOGOUT = SSO_SERVER_URL + 'api/logout';
	var SSO_URL_API_CHECK_SESSION = SSO_SERVER_URL + 'api/check_session';
	var SSO_URL_UI_LOGIN = SSO_SERVER_URL + 'ui/login';
	var SSO_URL_UI_LOGOUT = SSO_SERVER_URL + 'ui/logout';
	
	var SSO_LOGOUT_TIMEOUT = 3000;
	var SSO_LOGOUT_SESSION_CHANGE_TIMEOUT_ID = 0;
	
	var KEY_CODE_ENTER = 13;
	
	var SSO_ON_SESSION_CHANGE_CALLBACK = null;

	var CAPTCHA_SERVICE = 'https://captcha.garena.com/image';
	var ACCOUNT_CENTER_URL = 'https://account.garena.com/recovery';

	var captcha_key = '';
	
	function _(key) {
		var language = SETTINGS['language'];
		if(!(language in SSO_I18N) || !(key in SSO_I18N[language])) {
			return key;
		}
		return SSO_I18N[language][key];
	}

	function getCurrentBaseUrl() {
		var url = window.location.href;
		var sep = url.indexOf('#');
		if(sep >= 0) {
			url = url.substring(0, sep);
		}
		var sep = url.indexOf('?');
		if(sep >= 0) {
			url = url.substring(0, sep);
		}
		return url;
	}
	
	function getRequestParams() {
		var e = window.location.search.replace(/^\?/, "").split("&"), n = 0, r, i = {}, s, o, u;
		while(( r = e[n++]) !== undefined) s = r.match(/^([^=&]*)=(.*)$/), s && ( o = decodeURIComponent(s[1]), u = decodeURIComponent(s[2]), i[o] = u);
		return i;
	}
	
	function generateUri(uri, params) {
		if(params != null) {
			var sParams = '';
			for(var key in params) {
				sParams += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
			}
			if(sParams.length > 0) {
				if(uri.indexOf('?') < 0) {
					sParams = '?' + sParams.substr(1);
				}
				uri += sParams;
			}
		}
		return uri;
	}

	function redirect(uri, params) {
		window.location = generateUri(uri, params);
	}

	function getCookie(name) {
		var cookieValue = null;
		if(document.cookie && document.cookie != '') {
			var cookies = document.cookie.split(';');
			for(var i = 0; i < cookies.length; i++) {
				var cookie = jQuery.trim(cookies[i]);
				if(cookie.substring(0, name.length + 1) == (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
		}
		return cookieValue;
	}
	
	function setCookie(name, value, expiredSeconds, domain) {
		var sValue = escape(value);
		if(expiredSeconds != null) {
			var expires = new Date(new Date().getTime() + expiredSeconds);
			sValue += "; expires=" + expires.toUTCString();
		}
		if(domain != null) {
			sValue += "; domain=" + domain;
		}
		document.cookie = name + "=" + sValue + '; path=/';
	}
	
	function removeCookie(name) {
		document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
	}
	
	function requestJsonp(url, params, callback) {
		params['format']  = 'jsonp';
		params['callback'] = callback;
		params['id']= new Date().getTime();
		params['app_id'] = SETTINGS['app_id'];
		var first = true;
		for(var key in params) {
			var value = params[key];
			if(first) {
				url += '?';
				first = false;
			} else {
				url += '&';
			}
			url += encodeURIComponent(key);
			url += '=';
			url += encodeURIComponent(value);
		}
		var scriptTag = $('<script/>', {'type': 'text/javascript'}).appendTo($('body'));
		scriptTag.attr('src', url);
	}

	function requestJson(url, params, callback, method, withCredentials) {
		method = (typeof method === "undefined") ? "GET" : method;
		withCredentials = (typeof withCredentials === "undefined") ? false : withCredentials;
		params['format']  = 'json';
		params['id']= new Date().getTime();
		params['app_id'] = SETTINGS['app_id'];
		$.ajax({
			type : method,
			url : url,
			data : params,
			dataType : 'json',
			success : callback,
			xhrFields: {
				withCredentials: withCredentials
			},
			error : function() {
				callback({'error': 'error_server'});
			}
		});
	}

	function appendClearDiv(container) {
		container.append($('<div/>', {'class' : 'sso_clear'}));
	}
	
	function removeDialog() {
		$(window).unbind('resize', centralizeDialog);
		$('.sso_dialog_container').remove();
	}
	
	function showError(msg) {
		$('#tips').remove();
		var panel = $('<div/>', {'id': 'tips', 'class': 'sso_login_form_row'});
		$('<p/>').addClass('red').text(msg).appendTo(panel);
		panel.insertBefore($('#sso_login_from_login_button'));
		panel.delay(5000).slideUp(500, function (){
			panel.remove();
		});
	}

	function setEmptySession() {
		setCookie(SETTINGS['session_cookie_name'], '', null, SETTINGS['session_cookie_domain']);
	}

	function clearGetSessionKey() {
		baseUrl = getCurrentBaseUrl();
		params = getRequestParams();
		if ('session_key' in params) {
			delete params['session_key'];
		}
		return generateUri(baseUrl, params)
	}
	
	function centralizeDialog(extra_height) {
		if(typeof(extra_height)==='object' || typeof(extra_height)==='undefined') {
			extra_height = 0;
		}
		var top = ($(window).height() - $('#sso_login_dialog').height() - extra_height) / 2;
		if(top < 0)	{
			top = 0;
		}
		$('#sso_login_dialog').css('top', top.toString() + 'px');
	}
	
	function showDialog(content, id, title, onCloseCallback) {
		removeDialog();
		var container = $('<div/>').addClass('sso_dialog_container').css('display', 'block');
		$('<div/>').addClass('sso_dialog_background').appendTo(container);
		var dialog = $('<div/>').addClass('sso_dialog').appendTo(container);
		if(id != null) {
			dialog.attr('id', id);
		}
		if(title == null) {
			title = '';
		}
		$('<div/>').addClass('sso_dialog_content').append(content).appendTo(dialog);
		$('body').append(container);
		
		var btnClose = $('<div/>', {'title': _('dialog_close_tip')}).addClass('sso_dialog_close').text('\u00D7').appendTo(dialog);
		btnClose.click(function() {
			if(onCloseCallback) {
				onCloseCallback();
			}
			$(window).unbind('resize', centralizeDialog);
			container.remove();
		});
		
		centralizeDialog();
		$(window).bind('resize', centralizeDialog);
		
		return;
	}
	
	function onSessionChange() {
		if(SSO_ON_SESSION_CHANGE_CALLBACK) {
			SSO_ON_SESSION_CHANGE_CALLBACK(SETTINGS);
		}
	}
	
	function showLoginDialog() {
		var panelLogin = $('<div/>').addClass('sso_login_panel');
		var formLogin = $('<div/>').addClass('sso_login_form').appendTo(panelLogin);
		var rowLogo = $('<div/>').addClass('sso_login_form_row').appendTo(formLogin);
		$('<div/>').addClass('sso_login_form_row_logo').appendTo(rowLogo);
		var rowAccount = $('<div/>').addClass('sso_login_form_row').appendTo(formLogin);
		$('<div/>').addClass('sso_login_form_caption').text(_('login_form_account')).appendTo(rowAccount);
		var valueAccount = $('<div/>').addClass('sso_login_form_value').appendTo(rowAccount);
		var txtAccount = $('<input/>', {
			'id': 'sso_login_form_account', 'name': 'sso_login_form_account', 'type': 'input', 'placeholder': _('login_form_account_prompt')
		}).addClass('sso_login_form_value_text').appendTo(valueAccount);
		appendClearDiv(rowAccount);
		var rowPassword = $('<div/>').addClass('sso_login_form_row').appendTo(formLogin);
		$('<div/>').addClass('sso_login_form_caption').text(_('login_form_password')).appendTo(rowPassword);
		var valuePassword = $('<div/>').addClass('sso_login_form_value').appendTo(rowPassword);
		var txtPassword = $('<input/>', {
			'id': 'sso_login_form_password', 'name': 'sso_login_form_password', 'type': 'password', 'placeholder': _('login_form_password_prompt')
		}).addClass('sso_login_form_value_text').appendTo(valuePassword);
		appendClearDiv(rowPassword);
		var rowCaptcha = $('<div/>', {'id': 'sso_login_form_captcha'}).addClass('sso_login_form_row').appendTo(formLogin);
		$('<img/>').appendTo($('<div/>', {'id': 'captcha_image'}).appendTo(rowCaptcha));
		var captcha_input_row = $('<div/>').addClass('captcha_input_row').appendTo(rowCaptcha);
		var txtCaptcha = $('<input/>', {
			'type': 'text', 'id': 'captcha_response_field', 'placeholder': _('sso_captcha_prompt'), 'autocorrect': 'off', 'autocapitalize': 'off'}
		).appendTo($('<div/>').addClass('captcha_input').appendTo(captcha_input_row));
		var refresh_captcha = $('<a/>', {'href': 'javascript:;'}).appendTo(
			$('<div/>').addClass('captcha_button captcha_button_reload').appendTo(
				$('<div/>').addClass('captcha_button_panel').appendTo(captcha_input_row)
		));
		refresh_captcha.click(refreshCaptcha);
		rowCaptcha.hide();
		var rowOperation = $('<div/>').addClass('sso_login_form_operation').appendTo(formLogin);
		var btnLogin = $('<button/>', {
			'id': 'sso_login_from_login_button', 'type': 'submit', 'text': _('login_form_button_login')
		}).addClass('sso_login_from_submit_button').appendTo(rowOperation);
		appendClearDiv(rowOperation);
		var panelLink = $('<div/>').addClass('sso_login_link_panel').appendTo(panelLogin);
		var linkRegister = $('<a/>', {
			'id':'sso_login_link_register', 'text': _('sso_login_link_register_text'), 'href': _('sso_login_link_register_url'), 'target':'_blank'
		}).addClass('sso_login_link').appendTo(panelLink);
		$('<span/>').addClass('sso_login_link_separator').text(_('sso_login_link_separator')).appendTo(panelLink);
		var linkForgetPassword = $('<a/>', {
			'id':'sso_login_link_forget_password', 'text': _('sso_login_link_forget_password_text'), 'href': 'javascript:;'
		}).addClass('sso_login_link').appendTo(panelLink);
		appendClearDiv(panelLogin);
		showDialog(panelLogin, 'sso_login_dialog', _('login_dialog_title'));
		
		linkForgetPassword.click(function forgetPassword() {
			window.open(ACCOUNT_CENTER_URL, '_blank');
		});
		function login() {
			var account = txtAccount.val();
			var password = txtPassword.val();
			if(account.length <= 0) {
				showError(_('login_error_account_empty'));
				txtAccount.focus();
				return;
			}
			if(password.length <= 0) {
				showError(_('login_error_password_empty'));
				txtPassword.focus();
				return;
			}
			var request = {'account': account};
			if($('#sso_login_form_captcha').is(":visible")) {
				var captcha = txtCaptcha.val();
				if(captcha == null || captcha.length <= 0) {
					showError(_('login_error_captcha_empty'));
					refreshCaptcha();
					return;
				}
				request['captcha_key'] = captcha_key;
				request['captcha'] = captcha;
			}
			btnLogin.attr("disabled", true);
			requestJsonp(SSO_URL_API_PRELOGIN, request, 'SSO.preloginCallback');
		}
		
		function onKeyPress(e) {
			if(e.which == KEY_CODE_ENTER) {
				if(btnLogin.attr("disabled")) {	
					return;
				}
				if(txtAccount.val().length <= 0) {
					if(txtAccount.is(':focus')) {
						showError(_('login_error_account_empty'));
					}
					txtAccount.focus();
					return;
				}
				if(txtPassword.val().length <= 0) {
					if(txtPassword.is(':focus')) {
						showError(_('login_error_password_empty'));
					}
					txtPassword.focus();
					return;
				}
				if($('#sso_login_form_captcha').is(":visible")) {
					var captcha = txtCaptcha.val();
					if(captcha == null || captcha.length <= 0) {
						showError(_('login_error_captcha_empty'));
						refreshCaptcha();
						return;
					}
				}
				login();
			}
		}
		
		$('#sso_login_dialog').keypress(onKeyPress);
		btnLogin.click(login);
		
		txtAccount.focus();
	}
	
	function redirectLogin() {
		params = {
			'app_id': SETTINGS['app_id'],
			'redirect_uri': window.location.href,
			'locale': SETTINGS['language'],
			'display': 'page'
		};
		redirect(SSO_URL_UI_LOGIN, params);
	}
	
	function redirectLogout(sessionKey, redirectUri) {
		params = {
			'app_id': SETTINGS['app_id'],
			'redirect_uri': redirectUri,
			'session_key': sessionKey,
			'uid': SETTINGS['uid']
		};
		redirect(SSO_URL_UI_LOGOUT, params);
	}
	
	function showCaptcha() {
		var sso_captcha = $('#sso_login_form_captcha');
		if(!sso_captcha.is(":visible")) {
			sso_captcha.show();
		}
		refreshCaptcha();
	}

	function uuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}

	function refreshCaptcha() {
		captcha_key = uuid().replace(/-/g,'');
		var sso_captcha = $('#captcha_image');
		if(sso_captcha.is(":visible")) {
			$(sso_captcha).find('img').attr('src', CAPTCHA_SERVICE+'?key='+captcha_key);
		}
	}
	
	function preloginCallback(data) {
		if('error' in data) {
			if(data['error'] == 'error_require_captcha') {
				showCaptcha();
			} else {
				showError(_('login_' + data['error']));
				refreshCaptcha();
				if(data['error'] == 'error_captcha') {
					$('#captcha_response_field').focus();
				}
			}
			$('#sso_login_from_login_button').attr("disabled", false);
			return;
		}
		var password = $('#sso_login_form_password').val();
		var passwordMd5 = CryptoJS.MD5(password);
		var passwordKey = CryptoJS.SHA256(CryptoJS.SHA256(passwordMd5 + data.v1) + data.v2);
		var encryptedPassword = CryptoJS.AES.encrypt(passwordMd5, passwordKey, {mode: CryptoJS.mode.ECB,padding: CryptoJS.pad.NoPadding});
		encryptedPassword = CryptoJS.enc.Base64.parse(encryptedPassword.toString()).toString(CryptoJS.enc.Hex);
		requestJsonp(SSO_URL_API_LOGIN, {'account': data.account, 'password': encryptedPassword}, 'SSO.loginCallback');
	}
	
	function loginCallback(data) {
		if('error' in data) {
			if(data['error'] == 'error_require_captcha') {
				showCaptcha();
			} else {
				showError(_('login_' + data['error']));
				refreshCaptcha();
			}
			$('#sso_login_from_login_button').attr("disabled", false);
			return;
		}
		SETTINGS['login'] = true;
		SETTINGS['uid'] = data['uid'];
		SETTINGS['username'] = data['username'];
		SETTINGS['timestamp'] = data['timestamp'];
		setCookie(SETTINGS['session_cookie_name'], data['session_key'], null, SETTINGS['session_cookie_domain']);
		removeDialog();
		onSessionChange();
	}
	
	function checkSessionCallback(data) {
		if('error' in data) {
			setEmptySession();
			return;
		}
		if(data['login']) {
			loginCallback(data);
		} else {
			setEmptySession();
			onSessionChange();
		}
	}
	
	function loginCheckSessionCallback(data) {
		if('error' in data) {
			showLoginDialog();
			return;
		}
		if(data['login']) {
			loginCallback(data);
		} else {
			showLoginDialog();
		}
	}
	
	function logoutCallback(data) {
		clearTimeout(SSO_LOGOUT_SESSION_CHANGE_TIMEOUT_ID);
		SSO_LOGOUT_SESSION_CHANGE_TIMEOUT_ID = 0;
		onSessionChange();
	}
	
	function checkSsoSession() {
		requestJson(SSO_URL_API_CHECK_SESSION, {}, SSO.checkSessionCallback, 'GET', true);
	}
	
	function login() {
		if(SETTINGS['login_mode'] == 'popup') {
			requestJsonp(SSO_URL_API_CHECK_SESSION, {}, 'SSO.loginCheckSessionCallback');
		} else {
			redirectLogin();
		}
	}

	function logout(redirectUri) {
		if (SSO_LOGOUT_SESSION_CHANGE_TIMEOUT_ID != 0) {
			return;
		}
		sessionKey = getCookie(SETTINGS['session_cookie_name']);
		setEmptySession();
		SETTINGS['login'] = false;
		if (SETTINGS['login_mode'] == 'popup') {
			requestJsonp(SSO_URL_API_LOGOUT, {'uid': SETTINGS['uid'], 'session_key': sessionKey}, 'SSO.logoutCallback');
			SSO_LOGOUT_SESSION_CHANGE_TIMEOUT_ID = setTimeout(onSessionChange, SSO_LOGOUT_TIMEOUT);
		} else {
			var defaultRedirectUri = clearGetSessionKey();
			if (typeof redirectUri === 'undefined') {
				redirectUri = defaultRedirectUri;
			}
			redirectLogout(sessionKey, redirectUri);
		}
	}
	
	function init(settings) {
		SETTINGS = settings;
		if(SETTINGS.on_session_change_callback != null) {
			SSO_ON_SESSION_CHANGE_CALLBACK = SETTINGS.on_session_change_callback;
		}
		if(SETTINGS['check_sso_session']) {
			SETTINGS['check_sso_session'] = false;
			checkSsoSession();
		} else {
			onSessionChange();
		}
	}
	
	function setOnSessionChangeCallback(callback) {
		SSO_ON_SESSION_CHANGE_CALLBACK = callback;
	}
	
	window.SSO = {};
	var SSO = window.SSO;
	SSO._ = _;
	SSO.init = init;
	SSO.login = login;
	SSO.logout = logout;
	SSO.setOnSessionChangeCallback = setOnSessionChangeCallback;
	SSO.preloginCallback = preloginCallback;
	SSO.loginCallback = loginCallback;
	SSO.logoutCallback = logoutCallback;
	SSO.checkSessionCallback = checkSessionCallback;
	SSO.loginCheckSessionCallback = loginCheckSessionCallback;
})();
