var fsAccess = require('fs-access')
var path = require('path')
var which = require('which')

// Return location of chrome.exe file for a given Chrome directory (available: "Chrome", "Chrome SxS").
function getChromeExe(chromeDirName) {
  // Only run these checks on win32
  if (process.platform !== 'win32') {
    return null
  }
  var windowsChromeDirectory, i, prefix
  var suffix = '\\Google\\' + chromeDirName + '\\Application\\chrome.exe'
  var prefixes = [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']]

  for (i = 0; i < prefixes.length; i++) {
    prefix = prefixes[i]
    try {
      windowsChromeDirectory = path.join(prefix, suffix)
      fsAccess.sync(windowsChromeDirectory)
      return windowsChromeDirectory
    } catch (e) { }
  }

  return windowsChromeDirectory
}

function getBin(commands) {
  // Don't run these checks on win32
  if (process.platform !== 'linux') {
    return null
  }
  var bin, i
  for (i = 0; i < commands.length; i++) {
    try {
      if (which.sync(commands[i])) {
        bin = commands[i]
        break
      }
    } catch (e) { }
  }
  return bin
}

function getChromeDarwin(defaultPath) {
  if (process.platform !== 'darwin') {
    return null
  }

  try {
    var homePath = path.join(process.env.HOME, defaultPath)
    fsAccess.sync(homePath)
    return homePath
  } catch (e) {
    return defaultPath
  }
}

module.exports = {
  // Try chromium-browser before chromium to avoid conflict with the legacy
  // chromium-bsu package previously known as 'chromium' in Debian and Ubuntu.
  linux: getBin(['chromium-browser', 'chromium', 'google-chrome', 'google-chrome-stable']),
  darwin: getChromeDarwin('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  win32: getChromeExe('Chrome')
}