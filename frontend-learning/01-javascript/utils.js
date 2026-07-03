'use strict'
// number string boolean null undfined bigint symbol
// object -> array function

function isNumber(val) {
  // typeof NaN 也会返回 'number'
  if (typeof val === 'number') return !isNaN(val)
}

function isString(val) {
  return typeof val === 'string'
}

function isBoolean(val) {
  return typeof val === 'boolean'
}

function isNull(val) {
  return val === null
}

function isUndfined(val) {
  return typeof val === 'undefined'
}

function isBigint(val) {
  return typeof val === 'bigint'
}

function isSymbol(val) {
  return typeof val === 'symbol'
}

function isObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]'
}

function isArray(val) {
  if (val !== null && typeof val === 'object' && Array.isArray(val)) return true
  return false
}

function isFunction(cb) {
  return typeof val === 'function'
}
