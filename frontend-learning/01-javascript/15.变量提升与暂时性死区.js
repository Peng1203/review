'use strict'

// ==========================================
// 变量提升与暂时性死区（TDZ）——练习题
// ==========================================
// 运行方式：node 15.变量提升与暂时性死区.js

// 规则回顾：
//   - var / function：创建阶段登记并初始化为 undefined → 可提前访问
//   - let / const：创建阶段只登记【不初始化】→ 提前访问抛 ReferenceError
//   - TDZ = 从"登记"到"执行到声明行初始化"之间的区间
//   - typeof 对 TDZ 中的 let/const 也抛错（与未声明变量不同）
//   - 函数声明提升优先级 > var 变量提升
//   - class 声明同样有 TDZ
//
// 每题先预测输出，再运行验证。

console.log('===== 练习 1：var 提升（拿到 undefined）=====')
console.log(a) // 输出什么？underfined
var a = 1
// 预判：____（提示：undefined，不报错）
// 说明：var 在创建阶段已被初始化为 undefined

console.log('\n===== 练习 2：let 的 TDZ（抛错）=====')
// console.log(b) // 取消注释运行，会抛什么错？ReferrenceError
let b = 2
// 预判：____（提示：ReferenceError: Cannot access 'b' before initialization）
// 关键：报的是 "before initialization"，而不是 "is not defined"，
//       证明 b 已被登记进作用域（确实提升了），只是还没初始化

console.log('\n===== 练习 3：typeof 对 TDZ 变量也抛错 =====')
console.log(typeof undeclaredVar) // 输出什么？（未声明变量）underfined
// 预判：____（"undefined"）
// 取消注释看 TDZ：
// console.log(typeof c) // 抛错吗？
let c = 3
// 预判：____（抛 ReferenceError，因为 c 在 TDZ 中，与"未声明"不同）

console.log('\n===== 练习 4：函数提升优先于 var =====')
function demoHoist() {
  console.log(typeof foo) // 输出什么？ function
  var foo = 'string'
  function foo() {}
}
demoHoist()
// 预判：____（提示："function"——函数声明先登记，覆盖 var）
// 为什么 var 后面又赋值了 string，typeof 还是 function？
// 因为创建阶段先登记 function 声明，再处理 var（发现已存在则跳过）

console.log('\n===== 练习 5：var 循环与闭包（经典面试）=====')
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var:', i), 0)
}
// 输出什么？____（预判：3 3 3）
// 原因：var 无块级作用域，三个闭包捕获同一个全局 i

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log('let:', j), 10)
}
// 输出什么？____（预判：0 1 2）
// 原因：let 有块级作用域，每次迭代生成独立绑定（每次循环一个新 j）
// 实现细节：规范里叫 "per-iteration bindings"

console.log('\n===== 练习 6：参数默认值的 TDZ =====')
function f1(a = b, b = 2) {
  return a
}
try {
  console.log(f1(1)) // 输出什么？____（1：a 有传值，默认值不触发）
  console.log(f1()) // 会怎样？____（抛 ReferenceError：a 默认值读 b，b 还没初始化）
} catch (e) {
  console.log('f1():', e.constructor.name, '-', e.message)
}
// 参数按顺序初始化：a 的默认值求值时，b 尚未初始化 → 处于 TDZ

console.log('\n===== 练习 7：块级作用域内的 TDZ =====')
{
  // console.log(d) // 取消注释运行：抛错吗？____（抛，d 在块级 TDZ 中）
  let d = 4
  console.log('块内 d:', d)
}
// console.log(d) // 取消注释：会怎样？____（ReferenceError: d is not defined）
// 注意区别：块外访问是"完全未定义"（没登记到外层），
//          块内声明前访问是"TDZ"（已登记但未初始化）

console.log('\n===== 练习 8：class 也有 TDZ =====')
try {
  // const p = new Person() // 取消注释：会怎样？
  class Person {}
  const p = new Person()
  console.log('Person 实例创建成功')
} catch (e) {
  console.log('class TDZ:', e.constructor.name, '-', e.message)
}
// class 声明与 let/const 一样：声明前处于 TDZ，不可提前实例化

// ==========================================
// 总结
// ==========================================
// 判断"能不能提前访问"看两件事：
//   1. 有没有被登记（作用域内声明）→ 决定报 "is not defined" 还是别的
//   2. 有没有被初始化 → var=undefined 可读；let/const 未初始化 → TDZ 抛错
//
// 记忆锚点：
//   var  → 登记+初始化(undefined)   提升可读，值为 undefined
//   let/const → 只登记不初始化      提升但不可读，读则 ReferenceError
//   function → 登记+完整函数体      提升可调用
//   class → 只登记不初始化          提升但不可 new（TDZ）
//   typeof 不是"万能安全"：对 TDZ 变量照样抛错
