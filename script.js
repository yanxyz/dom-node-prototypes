'use strict'

/**
 * DOM helper
 */

function $(selector, context) {
  if (selector[0] === '#') {
    return document.getElementById(selector.slice(1))
  }
  return (context || document).querySelector(selector)
}

$.all = function (selector, context) {
  var slice = Array.prototype.slice

  if (typeof selector === 'string') {
    return slice.call((context || document).querySelectorAll(selector))
  }

  if (typeof selector === 'object') {
    return slice.call(selector)
  }

  throw new TypeError("'selector' should be string but got " + typeof selector)
}

$.on = function (elem, type, handler) {
  if (typeof elem === 'string') {
    elem = $(elem)
  }

  elem.addEventListener(type, handler)
  return elem
}

// IE > 8 只支持 Element.prototype.msMatches
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || function () {
    alert('Your browser does not support .matches().')
  }
}

function delegate(selector, handler) {
  return function (ev) {
    var target = ev.target
    // selector 选中的 element 应该是 currentTarget 的后代元素
    if (target === ev.currentTarget) return
    while (!target.matches(selector)) {
      target = target.parentNode
      if (target === ev.currentTarget) return
    }
    if (target) {
      ev.delegateTarget = target
      handler.call(this, ev)
    }
  }
}

function createElement(tagName, isSVG) {
  if (isSVG) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName)
  }
  return document.createElement(tagName)
}

function throttle(fn, wait) {
  var last = 0
  var timer

  return function () {
    var now = Date.now()
    var elapsed = now - last

    function exec() {
      fn.apply(this, arguments)
      last = now
    }

    timer && clearTimeout(timer)
    if (elapsed > wait) {
      exec()
    } else {
      timer = setTimeout(exec, wait - elapsed)
    }
  }
}

/**
 * bind events
 */

var input = $('#name')
var checkboxSVG = $('#svg')

$.on(input, 'change', function () {
  var value = this.value.trim().toLowerCase()
  if (!value) {
    this.focus()
    return
  }

  switch (value) {
    case 'doc':
      log(document)
      break
    case 'cmt':
      log(document.createComment('A comment node'))
      break
    case 'text':
      log(document.createTextNode('A textNode node'))
      break
    case 'frag':
      log(document.createDocumentFragment())
      break
    default:
      // 优先使用本页面的 elements
      var els = document.getElementsByTagName(value)
      if (els.length) {
        log(els[0])
        return
      }

      log(createElement(value, checkboxSVG.checked))
  }
})

$.on(checkboxSVG, 'change', function () {
  var name = input.value.trim().toLowerCase()
  if (!name) {
    input.focus()
    return
  }

  // 如果是 SVG element，重新输入
  if (this.checked) {
    input.value = ''
    input.focus()
    return
  }

  // 如果是 HTML element，输出结果
  log(createElement(name))
})

var className = 'active'

$.on('#output', 'click', delegate('h3', function (ev) {
  var el = ev.delegateTarget
  el.classList.toggle(className)
  el.nextElementSibling.classList.toggle(className)
}))

$.on('#expandAll', 'click', function () {
  $.all($('#output').children).forEach(function (el) {
    el.classList.add(className)
  })
})

$.on('#collapseAll', 'click', function () {
  $.all($('#output').children).forEach(function (el) {
    el.classList.remove(className)
  })
})

var h = $('#bar').offsetHeight
$.on(window, 'scroll', throttle(function () {
  if (window.pageYOffset > h) {
    document.body.classList.add('fixed')
  } else {
    document.body.classList.remove('fixed')
  }
}, 50))

log(document)

function log(node) {
  var obj = {}
  // 节点对象通常没有自己的属性
  // obj[node.nodeName] = getOwnPropertyNames(node)

  var prototypes = getPrototypes(node)
  // console.log(prototypes)
  prototypes.forEach(function (proto) {
    var name = getFunctionName(proto.constructor)
    obj[name] = getOwnPropertyNames(proto)
  })
  print(obj)
}

function getPrototypes(node) {
  var prototypes = []

  function get(node) {
    var proto = Object.getPrototypeOf(node)
    if (proto) {
      prototypes.push(proto)
      get(proto)
    }
  }

  get(node)
  return prototypes
}

function getOwnPropertyNames(obj) {
  return Object.getOwnPropertyNames(obj)
    .map(function (name) {
      if (name === 'constructor') {
        return {
          name: name,
          type: 'property'
        }
      }

      if (name.indexOf('on') === 0) {
        return {
          name: name,
          type: 'handler'
        }
      }

      try {
        if (typeof obj[name] === 'function') {
          return {
            name: name,
            type: 'method'
          }
        }
      } catch (err) {
        var type = getAccessorType(obj, name)

        if (type === 'not-accessor') {
          console.log(obj, name)
        }

        return {
          name: name,
          type: type
        }
      }

      return {
        name: name,
        type: 'property'
      }
    })
}

function getAccessorType(obj, prop) {
  var type = ''
  var descriptor = Object.getOwnPropertyDescriptor(obj, prop)
  descriptor.get && (type = 'get')
  descriptor.set && (type += ' set')
  return type || 'not-accessor'
}

function getFunctionName(fn) {
  var name = fn.name
  if (name) return name

  try {
    return fn.toString().match(/(object|function) ([^\s\]\(]+)/)[2]
  } catch (err) {
    console.log(fn)
    throw err
  }
}

function print(data) {
  $('#output').innerHTML = Object.keys(data).map(function (key) {
    var html = '<h3>' + key + '</h3>'
    var items = data[key].map(function (x) {
      return '<li class="' + x.type + '">' + x.name + '</li>'
    }).join('\n')
    return html + '<ul>' + items + '</ul>'
  }).join('\n')
}
