'use strict'

// ==========================================
// 事件循环（Event Loop）- 练习题
// ==========================================
// 规则回顾：
//   1) 同步代码先在调用栈执行
//   2) 栈空后，先【清空所有微任务】（Promise.then 等）
//   3) 再取【一个】宏任务（setTimeout 等）执行，回到 2
// 请在每题「输出什么？」处写出你的预测，然后运行 node 验证。

// 练习 1：同步 + setTimeout
console.log('===== 练习 1 =====')
console.log('A')
setTimeout(() => console.log('B'), 0)
console.log('C')
// 输出什么？ A C B  AC属于同步代码 直接进入调用栈执行 B属于宏任务 进入宏任务队列  setTimeout 执行完成并进入宏任务队列 等待主线程空闲后执行

// 练习 2：同步 + Promise（微任务）
console.log('\n===== 练习 2 =====')
console.log('1')
Promise.resolve().then(() => console.log('2'))
console.log('3')
// 输出什么？ 1 3 2 Promise的then属于微任务 进入微任务队列 等待主线程空闲时执行

// 练习 3：综合（经典题）
console.log('\n===== 练习 3 =====')
console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve().then(() => console.log('3'))
console.log('4')
// 输出什么？1 4 3 2 微任务执行队列先于宏任务队列执行

// 练习 4：多个 setTimeout（宏任务按入队顺序）
console.log('\n===== 练习 4 =====')
setTimeout(() => console.log('一'), 0)
setTimeout(() => console.log('二'), 0)
setTimeout(() => console.log('三'), 0)
// 输出什么？ 一 二 三 代码从上到下执行按照进入宏任务队列顺序 进行执行

// 练习 5：微任务中产生新微任务（注意顺序！）
console.log('\n===== 练习 5 =====')
Promise.resolve().then(() => {
  console.log('微任务1')
  Promise.resolve().then(() => console.log('微任务1-1'))
})
Promise.resolve().then(() => console.log('微任务2'))
// 输出什么？微任务1 微任务2 微任务1-1 由微任务产生新的微任务 追加到微任务队列末尾执行

// 练习 6：宏任务 vs 微任务 优先级
console.log('\n===== 练习 6 =====')
setTimeout(() => console.log('宏任务'), 0)
Promise.resolve().then(() => console.log('微任务'))
// 输出什么？ 微任务 宏任务 js引擎会优先执行微任务队列 然后才去执行宏任务队列

// 练习 7：循环中的 setTimeout（宏任务，回顾作用域）
console.log('\n===== 练习 7 =====')
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var i:', i), 0)
}
// 输出什么？（为什么不是 0 1 2？）i属于全局作用域的变量 同步任务执行完变量i已经变成了3 所以回调执行时 会打印3次3

// 练习 8：循环中的 Promise（微任务，回顾块级作用域）
console.log('\n===== 练习 8 =====')
for (let j = 0; j < 3; j++) {
  Promise.resolve().then(() => console.log('let j:', j))
}
// 输出什么？（为什么是 0 1 2？） let定义的变量每次循环 都会生成单独的块级作用域存储当前变量 因此回调执行是 打印的j始终指向独立的 块级作用域
