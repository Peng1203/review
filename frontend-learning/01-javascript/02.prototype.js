'use strict'
// let a = {}

/**
 *  prototype 为构造函数的原型对象 {}
 *  __proto__ 为对象的隐式原型，指向构造函数的原型对象(prototype)
 *  只要是对象都有 __proto__ 所以原型对象(prototype) 也会有 __proto__
 */

const obj = { name: 'peng' }

function test() {}

// 构造函数
function A(name) {
  this.name = name
}

// 实例化对象
const a = new A('peng')

function handleTest() {}

console.log('obj ------', obj)
console.dir(test)
console.log('test.prototype ------', test.prototype)
console.log(' ------')

console.dir(handleTest)
console.dir(A)
console.log('a ------', a)

// prototype __proto__
console.log(a.__proto__ === A.prototype)
console.log(a.__proto__)
console.log(A.prototype)

console.log('-------')

console.log(A.prototype.__proto__ === Object.prototype)
console.log(Object.prototype.__proto__ === null)

console.log(' ------')

console.log('Object.prototype ------', Object.prototype)
/**
 a { 实例化对象a的隐式原型(__proto__) 
  __proto__: 指向构造函数A的原型对象(prototype)
    A.prototype: 由于A的prototype也是一个对象 所以A也存在自己的隐式原型 __proto__ 
      __proto__: A.prototype.__proto__ 指向构造函数(Object)的原型对象(prototype)
        Object.prototype: Object.prototype的 __proto__ 比较特殊 指向的为null 
          null 
 }
 
 */
