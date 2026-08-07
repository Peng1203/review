'use strict'

// ==========================================
// Promise 与 async/await - 练习题（共 21 题）
// ==========================================
// 规则回顾：
//   - Promise 三种状态：pending → fulfilled / rejected（不可逆）
//   - new Promise(executor) 的 executor 同步执行
//   - then/catch/finally 都返回【新】Promise
//   - resolve/reject 只生效第一次
//   - .then 回调是【微任务】（连接事件循环）
//   - async 必返回 Promise；await 暂停取 value，后续是微任务
// 请在每题「输出什么？」处写出预测，再运行 node 验证。

// ========== 一、基础与状态机 ==========

// 练习 1：executor 是同步执行的
console.log('===== 练习 1 =====')
console.log('1')
new Promise((resolve) => {
  console.log('2') // executor 同步？
  resolve('ok')
})
console.log('3')
// 输出什么？

// 练习 2：状态不可逆（resolve 后再 reject 无效）
console.log('\n===== 练习 2 =====')
const p2 = new Promise((resolve, reject) => {
  resolve('第一次')
  reject('第二次') // 生效吗？
})
p2.then((v) => console.log('fulfilled:', v))
// 输出什么？reject 那次会不会造成 unhandledRejection？

// 练习 3：resolve 一个 Promise 会"展开"
console.log('\n===== 练习 3 =====')
const inner = Promise.resolve('inner 的值')
const outer = new Promise((resolve) => resolve(inner))
outer.then((v) => console.log('outer 结果:', v))
// 输出什么？outer 拿到的是 inner 这个对象，还是 'inner 的值'？

// ========== 二、then 返回值规则 ==========

// 练习 4：then 返回普通值
console.log('\n===== 练习 4 =====')
Promise.resolve(1)
  .then((x) => x + 1)
  .then((x) => console.log('结果:', x))
// 输出什么？

// 练习 5：then 返回 Promise（展开）+ 中途抛错
console.log('\n===== 练习 5 =====')
Promise.resolve(1)
  .then((x) => Promise.resolve(x * 10))
  .then((x) => {
    throw new Error('boom')
  })
  .then(() => console.log('到不了这里'))
  .catch((e) => console.log('catch:', e.message))
// 输出什么？哪一步被跳过了？

// 练习 6：错误冒泡（跳过后续 onFulfilled）
console.log('\n===== 练习 6 =====')
Promise.resolve('start')
  .then((v) => {
    throw new Error('中途错')
  })
  .then((v) => console.log('跳过:', v))
  .catch((e) => console.log('捕获:', e.message))
// 输出什么？

// 练习 7：catch 之后链路"恢复"
console.log('\n===== 练习 7 =====')
Promise.reject('出错')
  .catch((e) => {
    console.log('捕获:', e)
    return '恢复值' // catch 返回普通值会怎样？
  })
  .then((v) => console.log('恢复后:', v))
// 输出什么？

// 练习 8：finally 不接收值，但结果透传
console.log('\n===== 练习 8 =====')
Promise.resolve('原值')
  .finally(() => console.log('finally 执行'))
  .then((v) => console.log('值:', v))
// 输出什么？finally 回调能拿到 "原值" 吗？

// 练习 9：finally 抛错会覆盖原结果
console.log('\n===== 练习 9 =====')
Promise.resolve('原值')
  .finally(() => {
    throw new Error('覆盖')
  })
  .then((v) => console.log('值:', v))
  .catch((e) => console.log('catch:', e.message))
// 输出什么？"原值" 还在吗？

// ========== 三、静态方法 ==========

// 练习 10：Promise.all（全部成功）
console.log('\n===== 练习 10 =====')
Promise.all([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3),
]).then((arr) => console.log('all:', arr))
// 输出什么？顺序是否保持输入顺序？

// 练习 11：Promise.all（失败即短路）
console.log('\n===== 练习 11 =====')
Promise.all([
  Promise.resolve(1),
  Promise.reject('失败'),
  Promise.resolve(3),
]).then((arr) => console.log('不会到这里:', arr))
  .catch((e) => console.log('all catch:', e))
// 输出什么？会等第三个完成吗？

// 练习 12：Promise.allSettled（全部落定）
console.log('\n===== 练习 12 =====')
Promise.allSettled([
  Promise.resolve('ok'),
  Promise.reject('bad'),
]).then((res) => console.log('settled:', JSON.stringify(res)))
// 输出什么？

// 练习 13：Promise.race（超时控制）
console.log('\n===== 练习 13 =====')
function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('超时')), ms)),
  ])
}
withTimeout(Promise.resolve('快点'), 100)
  .then((v) => console.log('race:', v))
  .catch((e) => console.log('race catch:', e.message))
// 输出什么？

// 练习 14：Promise.race（先失败者决定）
console.log('\n===== 练习 14 =====')
Promise.race([
  new Promise((_, rej) => setTimeout(() => rej(new Error('先失败')), 10)),
  new Promise((res) => setTimeout(() => res('后成功'), 50)),
]).then((v) => console.log(v))
  .catch((e) => console.log('race catch:', e.message))
// 输出什么？

// 练习 15：Promise.any（第一个成功）
console.log('\n===== 练习 15 =====')
Promise.any([
  Promise.reject('失败1'),
  Promise.resolve('成功'),
  Promise.reject('失败2'),
]).then((v) => console.log('any:', v))
  .catch((e) => console.log('any catch:', e.errors))
// 输出什么？

// ========== 四、Promise 与事件循环 ==========

// 练习 16：then 回调是微任务（对比 setTimeout）
console.log('\n===== 练习 16 =====')
console.log('A')
Promise.resolve().then(() => console.log('B'))
setTimeout(() => console.log('C'), 0)
console.log('D')
// 输出什么？B 和 C 谁先？

// ========== 五、async / await ==========

// 练习 17：async 函数必返回 Promise
console.log('\n===== 练习 17 =====')
async function f() {
  return 1
}
f().then((v) => console.log('async 返回值:', v))
// 输出什么？

// 练习 18：await 的微任务本质（顺序）
console.log('\n===== 练习 18 =====')
console.log('1')
async function g() {
  console.log('2')
  await null // await 之后的代码进入微任务
  console.log('3')
}
g()
console.log('4')
// 输出什么？

// 练习 19：await 串行 vs Promise.all 并行
console.log('\n===== 练习 19 =====')
function delay(name, ms) {
  return new Promise((res) => setTimeout(() => {
    console.log(name)
    res()
  }, ms))
}
async function serial() {
  await delay('串行1', 30)
  await delay('串行2', 30)
}
async function parallel() {
  await Promise.all([delay('并行1', 30), delay('并行2', 30)])
}
serial().then(() => console.log('--- 串行结束 ---'))
parallel().then(() => console.log('--- 并行结束 ---'))
// 观察：三组打印的先后顺序是什么？

// 练习 20：try/catch 捕获 await 错误
console.log('\n===== 练习 20 =====')
async function h() {
  try {
    await Promise.reject(new Error('挂了'))
  } catch (e) {
    console.log('try-catch:', e.message)
  }
}
h()
// 输出什么？

// ========== 六、易混淆陷阱 ==========

// 练习 21：同一个 Promise 加多个 then（互不影响）
console.log('\n===== 练习 21 =====')
const p21 = Promise.resolve(1)
p21.then((x) => console.log('A:', x))
p21.then((x) => console.log('B:', x))
// 输出什么？A 和 B 各自拿到什么值？
