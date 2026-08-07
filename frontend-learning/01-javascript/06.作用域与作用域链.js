'use strict'

// ==========================================
// 作用域与作用域链 - 练习题
// ==========================================

// 练习 1：基础作用域查找
console.log('===== 练习 1 =====')
let name = '全局'

function outer() {
  let name = '外层'

  function inner() {
    let name = '内层'
    console.log(name) // 输出什么？ 内层
  }

  inner()
  console.log(name) // 输出什么？ 外层
}

outer()
console.log(name) // 输出什么？全局

// 练习 2：作用域链向上查找
console.log('\n===== 练习 2 =====')

let a = 1

function level1() {
  let b = 2

  function level2() {
    let c = 3
    console.log(a, b, c) // 输出什么？ 1 2 3
  }

  level2()
  console.log(a, b) // 输出什么？（c 能访问吗？）1 2  c无法访问到 c属于level2函数的作用域
}

level1()
console.log(a) // 输出什么？（b, c 能访问吗？）1 无法访问到 b c

// 练习 3：var vs let 作用域
console.log('\n===== 练习 3 =====')

function testVar() {
  if (true) {
    var fruit = '苹果'
  }
  console.log(fruit) // 输出什么？ 苹果
}

function testLet() {
  if (true) {
    let vegetable = '胡萝卜'
  }
  console.log(vegetable) // 输出什么？ 会报错
}

testVar()
testLet() // 这行会报错吗？let 不会进行变量提升 会报错

// 练习 4：循环中的闭包（常见面试题）
console.log('\n===== 练习 4 =====')

// 使用 var，结果是什么？ 3 3 3
console.log('使用 var:')
for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i)
  }, 100)
}

// 使用 let，结果是什么？0 1 2
console.log('使用 let:')
for (let j = 0; j < 3; j++) {
  setTimeout(function () {
    console.log(j)
  }, 100)
}

// 练习 5：IIFE 解决闭包问题 利用每次循环执行一个新的函数 创一个单独的函数作用域 让其记住 i 的值
console.log('\n===== 练习 5 =====')

for (var i = 0; i < 3; i++) {
  ;(function (index) {
    setTimeout(function () {
      console.log('IIFE:', index)
    }, 100)
  })(i)
}

// 练习 6：词法作用域 vs 动态作用域（模拟）
console.log('\n===== 练习 6 =====')

let value = '全局值'

function foo() {
  console.log(value)
}

function bar() {
  let value = '局部值'
  foo() // 输出全局值还是局部值？为什么？ 应该输出全局值 不清楚为什么
}

bar()

// 练习 7：模块模式（利用函数作用域封装）
console.log('\n===== 练习 7 =====')

const Counter = (function () {
  let count = 0 // 私有变量

  return {
    increment: function () {
      count++
      console.log('count:', count)
    },
    decrement: function () {
      count--
      console.log('count:', count)
    },
    getCount: function () {
      return count
    },
  }
})()

Counter.increment()
Counter.increment()
Counter.decrement()
console.log('当前 count:', Counter.getCount()) // 打印1

// 尝试直接访问 count
// console.log(count);  // 这行会报错吗？会报错 因为 count 是私有变量 不能直接访问

// 练习 8：嵌套函数与作用域链
console.log('\n===== 练习 8 =====')

function createAdder(x) {
  return function (y) {
    return x + y
  }
}

const add5 = createAdder(5)
const add10 = createAdder(10)

console.log(add5(3)) // 输出什么？ 8
console.log(add10(3)) // 输出什么？ 13
console.log(add5(10)) // 输出什么？ 15

// 练习 9：分析作用域链
console.log('\n===== 练习 9 =====')

let globalVar = 'global'

function A() {
  let aVar = 'a'

  function B() {
    let bVar = 'b'

    function C() {
      let cVar = 'c'
      console.log('C 中访问:')
      console.log('cVar:', cVar) // c
      console.log('bVar:', bVar) // b
      console.log('aVar:', aVar) // a
      console.log('globalVar:', globalVar) // global
    }

    C()
  }

  B()
}

A()

// 练习 10：作用域链长度影响性能（理解即可）
console.log('\n===== 练习 10 =====')

const obj = {
  method1: function () {
    return 'method1'
  },
  method2: function () {
    return 'method2'
  },
  method3: function () {
    return 'method3'
  },
}

// 不好的写法：每次都要查找 obj
function badWay() {
  console.time('badWayTime')
  console.log(obj.method1())
  console.log(obj.method2())
  console.log(obj.method3())
  console.timeEnd('badWayTime')
}

// 好的写法：缓存引用
function goodWay() {
  console.time('goodWayTime')
  const m1 = obj.method1
  const m2 = obj.method2
  const m3 = obj.method3
  console.log(m1())
  console.log(m2())
  console.log(m3())
  console.timeEnd('goodWayTime')
}

badWay()
goodWay()
