const BASE_URL = 'https://prod.microservice.ont.io/addon-server'
// http://192.168.1.129:7879
const H_URL = 'http://18.141.44.15:7879'
const Authorize_URL = 'http://18.141.44.15:7878'

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
  },
  getLoginResultByOwner(id, callback) {
    $.ajax({
      type: 'GET',
      url: Authorize_URL + '/api/v2/app/login/result/' + id,
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
        try {
          window.webkit.messageHandlers.ONTAuthJSFunction.postMessage(message)
        } catch (error) {}
      }
    })
    // 接收注册回调
    window.ONTAuthJSFunctionCallbackRegister = data => {
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
              sessionStorage.setItem('token', loginRes.token)
              sessionStorage.removeItem('ontid')
              sessionStorage.setItem('ontid', loginRes.ontid)
              sessionStorage.setItem('username', loginRes.userName)
              $('#login_result').show()
              $('#login_layout').hide()
              $('.login_username_text').html('Account: ' + loginRes.userName)
              $('.login_ontid_text').html('ONT ID: ' + loginRes.ontid)
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

// Apply Claim
;(function() {
  // sessionStorage.setItem('ontid', 'did:ont:AVdJRxk4uTnwAq1Xrre6fsBrkX6cuN2BrY')
  $('#applyClaim').click(function() {
    if (!sessionStorage.getItem('ontid')) return alert('please log in first!')
    const ontid = sessionStorage.getItem('ontid')
    let params = {}
    params.name = $('#ClaimInputName').val()
    params.age = $('#ClaimInputAge').val()
    params.answer = true
    console.log(params)
    if (!new RegExp(/\S/).test(params.name) || !params.age)
      return alert('please enter userinfo!')

    $.ajax({
      type: 'POST',
      url: H_URL + '/api/v1/ta/claim',
      dataType: 'JSON',
      data: JSON.stringify({
        ...params,
        ontid
      }),
      contentType: 'application/json;charset=UTF-8',
      success: function(res) {
        return res.result === 'SUCCESS'
          ? alert('Apply success!')
          : alert('Apply fail, please try again!')
      }
    })
  })
})()

// Get Claim
;(function() {
  $('#getClaim').click(function() {
    $.ajax({
      type: 'GET',
      url: H_URL + '/api/v1/ta/claim',
      dataType: 'JSON',
      contentType: 'application/json;charset=UTF-8',
      success: function(res) {
        console.log(res)
        try {
          BaseFn.sendAppMessage('OntProtocolGetClaim', res.result)
        } catch (error) {}
      }
    })
    // 接收注册回调
    window.ONTAuthJSFunctionCallbackGetClaim = data => {
      if (data) {
        alert('Get Success!')
      } else {
        alert('Get Fail')
      }
    }
  })
})()

// Authorize Claim
;(function() {
  $('#authorizeClaim').click(function() {
    $.ajax({
      type: 'POST',
      url: Authorize_URL + '/api/v1/app/claim',
      dataType: 'JSON',
      contentType: 'application/json;charset=UTF-8',
      success: function(res) {
        console.log(res)
        try {
          BaseFn.sendAppMessage('OntProtocolAuthorizeClaim', res.result)
        } catch (error) {}
      }
    })
    // 接收注册回调
    window.ONTAuthJSFunctionCallbackAuthorizeClaim = data => {
      if (data) {
        alert('Authorize Success!')
      } else {
        alert('Authorize Fail')
      }
    }
  })
})()

// Centralization ONT ID
;(function() {
  $('#centraClaim').click(function() {
    let userName = $('#CentraName').val()
    let password = $('#CentraPassword').val()
    if (!new RegExp(/\S/).test(userName) || !new RegExp(/\S/).test(password))
      return alert('please enter info')
    $.ajax({
      type: 'POST',
      url: Authorize_URL + '/api/v2/app/register',
      dataType: 'JSON',
      data: JSON.stringify({
        userName,
        password
      }),
      contentType: 'application/json;charset=UTF-8',
      success: function(res) {
        const { userName, ontid } = res.result
        sessionStorage.setItem('centraOns', userName)
        sessionStorage.setItem('centraOntid', ontid)
        $('#centra_account_layout').hide()
        $('#centra_account_result').show()
        $('#centra_account_result .username_text').html('Account: ' + userName)
        $('#centra_account_result .ontid_text').html('ONT ID: ' + ontid)
        alert('SUCCESS')
      },
      error: function(error) {
        console.log(error)
        alert(error.responseJSON.desc)
      }
    })
  })
})()

// Centralization ONT ID Login
;(function() {
  $('#centra_account_btn').click(function() {
    let userName = $('#CentraName_login').val()
    let password = $('#CentraPassword_login').val()
    if (!new RegExp(/\S/).test(userName) || !new RegExp(/\S/).test(password))
      return alert('please enter info')
    $.ajax({
      type: 'POST',
      url: Authorize_URL + '/api/v2/app/login',
      dataType: 'JSON',
      data: JSON.stringify({
        userName,
        password
      }),
      contentType: 'application/json;charset=UTF-8',
      success: function(res) {
        console.log(res)
        const { userName, ontid } = res.result
        sessionStorage.setItem('centraOns', userName)
        sessionStorage.setItem('centraOntid', ontid)
        $('#centra_account_login_layout').hide()
        $('#centra_account_login_result').show()
        $('#centra_account_login_result .username_text').html(
          'Account: ' + userName
        )
        $('#centra_account_login_result .ontid_text').html('ONT ID: ' + ontid)
        alert('SUCCESS')
      },
      error: function(error) {
        console.log(error)
        alert(error.responseJSON.desc)
      }
    })
  })
})()

// Add Owner ID
;(function() {
  $('#addownerBtn').click(function() {
    const centID = sessionStorage.getItem('centraOntid')
    if (!centID) return alert('please login by centralization account!')

    $.ajax({
      type: 'POST',
      url: Authorize_URL + `/api/v2/app/add-owner/${centID}`,
      dataType: 'JSON',
      contentType: 'application/json;charset=UTF-8',
      success: function(res) {
        console.log(res)
        try {
          BaseFn.sendAppMessage('OntProtocolAddOwner', res.result)
        } catch (error) {}
      },
      error: function(error) {
        console.log(error)
        alert(error.responseJSON.desc)
      }
    })

    // 接收注册回调
    window.ONTAuthJSFunctionCallbackAddOwner = data => {
      $('#addowner_result').html(data)
      if (data) {
        alert('Add Success!')
      } else {
        alert('Add Fail')
      }
    }
  })
})()

// Login by Owner ID
;(function() {
  let loginOwnerTimer = null
  $('#ownerLoginBtn').click(function() {
    $.ajax({
      type: 'POST',
      url: Authorize_URL + `/api/v2/app/login/owner`,
      dataType: 'JSON',
      contentType: 'application/json;charset=UTF-8',
      success: function(res) {
        console.log(res)
        const { id, qrCode } = res.result
        try {
          BaseFn.sendAppMessage('OntProtocolAddOwner', qrCode)
        } catch (error) {}

        loginOwnerTimer = setInterval(function() {
          BaseFn.getLoginResultByOwner(id, function(loginRes) {
            console.log(loginRes)
            if (loginRes.result === '1') {
              sessionStorage.setItem('centraOntid', loginRes.ontid)
              sessionStorage.setItem('centraOns', loginRes.userName)
              $('#owner_login_result').show()
              $('#owner_login_layout').hide()
              $('#owner_login_result .login_username_text').html(
                'Account: ' + loginRes.userName
              )
              $('#owner_login_result .login_ontid_text').html(
                'ONT ID: ' + loginRes.ontid
              )
              return clearInterval(loginOwnerTimer)
            } else if (loginRes.result === '2') {
              alert('Error, please try again!')
              return clearInterval(loginOwnerTimer)
            }
          })
        }, 3000)
      },
      error: function(error) {
        console.log(error)
        alert(error.responseJSON.desc)
      }
    })
  })
})()
