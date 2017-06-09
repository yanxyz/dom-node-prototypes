$('text').value = ''

$('text').onchange = function (e) {
  var val = trim(this.value)
  if (!val) return

  var target = null
  switch (val) {
    case 'document':
      target = document
      break
    case 'text':
      target = document.createTextNode(val)
      break
    case 'frag':
      target = document.createDocumentFragment()
      break
    case 'comment':
      target = document.createComment('')
      break
    default:
      var els = document.getElementsByTagName(val)
      if (els.length) {
        target = els[0]
      } else {
        target = document.createComment(val)
      }
  }

  output(target)
}

function $(id) {
  return document.getElementById(id)
}

function output(node) {
  var props = []
  for (var p in node) {
    props.push(p)
  }
  $('result').innerText = props.join('\n')
}

function trim(str) {
  try {
    return str.trim()
  } catch (err) {
    return str.replace(/^\s+|\s+$/g, '')
  }
}
