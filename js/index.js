const BASE_URL = 'https://prod.microservice.ont.io/addon-server'

let BaseFn = {
  sendAppMessage: function(type, data) {
    var message = {
      method: type,
      params: JSON.stringify(data)
    }
    window.webkit.messageHandlers.ONTAuthJSFunction.postMessage(message)
  },
  getLoginResult: function(id, callback) {
    $.ajax({
      type: 'GET',
      url: BASE_URL + '/api/v1/account/login/result/' + id,
      dataType: 'JSON',
      contentType: 'application/json;charset=UTF-8',
      success: function(res) {
        var data = res.result
        callback && callback(data)
      }
    })
  }
}

;(function(doc, win) {
  var docEl = doc.documentElement,
    resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
    recalc = function() {
      var clientWidth = docEl.clientWidth > 750 ? 750 : docEl.clientWidth

      if (!clientWidth) {
        return
      }

      docEl.style.fontSize = 100 * (clientWidth / 750) + 'px'
    }

  recalc()

  if (!doc.addEventListener) return

  win.addEventListener(resizeEvt, recalc, false)

  doc.addEventListener('DOMContentLoaded', recalc, false)
})(document, window)

// 注册
;(function() {
  if (sessionStorage.getItem('username') && sessionStorage.getItem('ontid')) {
    $('#register_result').show()
    $('#register_layout').hide()
    $('.username_text').html('Account: ' + sessionStorage.getItem('username'))
    $('.ontid_text').html('ONT ID: ' + sessionStorage.getItem('ontid'))
  }
  $('#registerBtn').click(function() {
    let userName = $('#username').val()
    console.log(userName)
    if (!new RegExp(/\S/).test(userName)) return alert('please enter username')
    $.ajax({
      type: 'POST',
      url: BASE_URL + '/api/v1/account/register',
      data: JSON.stringify({
        userName
      }),
      dataType: 'JSON',
      contentType: 'application/json;charset=UTF-8',
      success: function(res) {
        var data = res.result.qrcode
        console.log(data)
        var message = {
          method: 'OntProtocolRegister',
          params: JSON.stringify(data)
        }
        // 发送参数
        window.webkit.messageHandlers.ONTAuthJSFunction.postMessage(message)
      }
    })
    // 接收注册回调
    window.ONTAuthJSFunctionCallback = data => {
      if (data) {
        const { ontid } = JSON.parse(data)
        $('#register_result').show()
        $('#register_layout').hide()
        $('.username_text').html('Account: ' + userName)
        $('.ontid_text').html('ONT ID: ' + ontid)
        sessionStorage.setItem('username', userName)
        sessionStorage.setItem('ontid', ontid)
      } else {
        $('#register_result').show()
        $('#register_layout').hide()
        $('#register_result').html('No Data')
      }
    }
  })
})()

// 登陆
;(function() {
  let loginTimer = null
  if (sessionStorage.getItem('username') && sessionStorage.getItem('ontid')) {
    $('#login_result').show()
    $('#login_layout').hide()
    $('.login_username_text').html(
      'Account: ' + sessionStorage.getItem('username')
    )
    $('.login_ontid_text').html('ONT ID: ' + sessionStorage.getItem('ontid'))
  }

  $('#loginBtn').click(function() {
    $.ajax({
      type: 'POST',
      url: BASE_URL + '/api/v1/account/login',
      dataType: 'JSON',
      contentType: 'application/json;charset=UTF-8',
      success: function(res) {
        const { appId, qrcode } = res.result
        try {
          BaseFn.sendAppMessage('OntProtocolLogin', qrcode)
        } catch (error) {}
        loginTimer = setInterval(function() {
          BaseFn.getLoginResult(appId, function(loginRes) {
            console.log(loginRes)
            if (loginRes.result === '1') {
              sessionStorage.setItem('ontid', loginRes.ontid)
              sessionStorage.setItem('username', loginRes.userName)
              $('#login_result').show()
              $('#login_layout').hide()
              $('.login_username_text').html('Account: ' + loginRes.ontid)
              $('.login_ontid_text').html('ONT ID: ' + loginRes.userName)
              return clearInterval(loginTimer)
            } else if (loginRes.result === '2') {
              alert('Error, please try again!')
              return clearInterval(loginTimer)
            }
          })
        }, 3000)
      }
    })
  })
})()
