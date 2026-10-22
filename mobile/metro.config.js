const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Ürün verisi ve doğrulama deseni web projesiyle ortak: ../src/data ve ../src/lib'den okunur.
config.watchFolders = [path.resolve(__dirname, '../src/data'), path.resolve(__dirname, '../src/lib')]

module.exports = config
