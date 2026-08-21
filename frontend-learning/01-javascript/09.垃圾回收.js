'use strict'

// ==========================================
// 垃圾回收（Garbage Collection）- 练习题
// ==========================================
// 运行方式：node --expose-gc 09.垃圾回收.js
// （--expose-gc 会暴露 global.gc()，可以手动强制触发 GC 来观察回收）

// 规则回顾：
//   - 内存生命周期：分配 → 使用 → 释放
//   - 栈存基本类型 / 调用帧；堆存对象
//   - 可达性：从根（globalThis / 调用栈局部变量）能到达 = 保留
//   - 不可达 = 垃圾，等待 GC 回收
//   - 强引用（普通变量、Map、Set）保持对象存活
//   - 弱引用（WeakMap、WeakSet）不阻止对象被回收
//   - 循环引用不是问题，前提是整个环从根不可达
//   - 闭包本身不泄漏，被长期持有的闭包才会泄漏
//
// 请在每题「输出什么？」处写出预测，再运行 node 验证。
// ==========================================

// 工具函数：手动 GC（未带 --expose-gc 时给出提示，不报错）
const gc = () => {
  if (typeof global.gc === 'function') {
    global.gc()
  } else {
    console.warn('   [提示] 未带 --expose-gc 启动，跳过强制回收')
  }
}

const mb = bytes => (bytes / 1024 / 1024).toFixed(2) + ' MB'

function heapUsed() {
  return process.memoryUsage().heapUsed
}

// ========== 一、可达性思维 ==========

// 练习 1：局部变量在函数结束后（IIFE 用完了就扔）
console.log('===== 练习 1 =====')
console.log('before:', mb(heapUsed()))
;(function () {
  const big = new Array(5_000_000).fill('x')
  console.log('  创建后:', mb(heapUsed()))
})() // 执行完，big 还在吗？不在了
gc()
console.log('after gc:', mb(heapUsed()))
// 输出什么？为什么内存会回落到接近 before？输出的大小应该和before打印一样 big在立即执行函数执行完成后 从根出发无法再访问到 所以gc方法执行后被回收了 所以之前后内存占用变化不大
// 提示：big 只在 IIFE 内部可见，调用一结束，从根出发就找不到它了。

// 练习 2：挂在全局对象上的变量（意外全局变量 = 泄漏）
console.log('\n===== 练习 2 =====')
globalThis.bigData = new Array(5_000_000).fill('y')
console.log('全局创建后:', mb(heapUsed()))
gc()
console.log('after gc:', mb(heapUsed()))
// 输出什么？为什么这次内存没有被回收？输出的内存占用比上一个打印大 因为globalThis 上挂载了一个新的变量bigData 从根出发 始终可以找到该变量 所有不会被GC
// 提示：globalThis 是根，root 直接可达的对象永远"活着"。

// 练习 3：循环引用（打破"引用计数"的直觉）
console.log('\n===== 练习 3 =====')
;(function () {
  const a = {}
  const b = {}
  a.ref = b
  b.ref = a
  console.log('  环创建后:', mb(heapUsed()))
})()
gc()
console.log('after gc:', mb(heapUsed()))
// 输出什么？a 和 b 互相引用（引用计数永远 >= 1），为什么还是被回收了？ 不会
// 提示：关键看这个环还"从根可达"吗？

// ========== 二、强引用 vs 弱引用 ==========

// 练习 4：Map 是强引用（key 失效后条目还在）
console.log('\n===== 练习 4 =====')
let key4 = { name: 'key' }
const map = new Map()
map.set(key4, new Array(1_000_000).fill('m'))
key4 = null // key 引用置空
gc()
console.log('Map.size:', map.size)
// 输出什么？key 已经置为 null，Map 里的数据还在吗？为什么？输出1 Map中的数据还在 并不会被GC 因为map对对象的引用是强引用 从根出发任然能找到 所有并不会回收
// 提示：Map 持有对 key 对象的强引用，它自己就是一条"根"。

// 练习 5：WeakMap 是弱引用（key 失效后条目自动消失）
console.log('\n===== 练习 5 =====')
let key5 = { name: 'key' }
const wm = new WeakMap()
wm.set(key5, new Array(1_000_000).fill('w'))
key5 = null
gc()
// WeakMap 没有 size 也没有迭代能力，无法直接数条目。
// 请对比练习 4 想一下：为什么 WeakMap 里那条数据已经"不存在"了？weakMap属于弱引用 不会阻止GC回收
console.log('  练习 4 的 Map 里数据还在（强引用）；')
console.log('  练习 5 的 WeakMap 条目会随 key 一起被回收（弱引用）')

// 练习 6：WeakMap 的 key 必须是对象
console.log('\n===== 练习 6 =====')
try {
  const wm2 = new WeakMap()
  wm2.set(1, 'number') // 会怎样？
  console.log('  没有抛错')
} catch (e) {
  console.log('抛错:', e.constructor.name, '-', e.message)
}
// 输出什么？为什么 WeakMap 不允许基本类型做 key？ 因为weakmap设计的目标就是允许对象作为key时 不阻止被回收 而js判断变量是否回收是根据 是否可达
// 提示：基本类型在栈上，没有"堆对象生命周期"，弱引用无从谈起。

// ========== 三、闭包与泄漏 ==========

// 练习 7：被长期持有的闭包，会锁定外层大对象
console.log('\n===== 练习 7 =====')
let leakFn
function createLeak() {
  const big = new Array(2_000_000).fill('z') // 被返回的函数捕获
  return () => big.length
}
leakFn = createLeak()
console.log('闭包创建后:', mb(heapUsed()))
gc()
console.log('after gc:', mb(heapUsed()))
// 输出什么？big 会被回收吗？为什么？输出的内存占用应该是一样的 big不会回收 big作为闭包暴漏出去的方法 被外层变量 leakFn 方法引用 变量处于始终可达 所有不会被回收
// 提示：leakFn 是全局变量（根可达），闭包捕获了 big，big 跟着"活"下去。

leakFn = null // 修复：断开根到闭包的引用
gc()
console.log('leakFn = null 后再 gc:', mb(heapUsed()))
// 输出什么？对比上面，这次内存下降了吗？ 输出的内存占用比之前小了 因为leakFn 不再指向 闭包中的big 从根出发无法再访问到 big 所以会被GC回收

// ========== 四、观察"朝生暮死"对象 ==========

// 练习 8：制造大量临时对象，观察 Minor GC 的效果
console.log('\n===== 练习 8 =====')
function makeGarbage(n) {
  for (let i = 0; i < n; i++) {
    const obj = { data: new Array(1000).fill(i) } // 每次循环结束就不可达
  }
}
const before8 = mb(heapUsed())
makeGarbage(20000)
const after8 = mb(heapUsed())
gc()
const afterGc8 = mb(heapUsed())
console.log('制造前:', before8)
console.log('制造后（未回收）:', after8)
console.log('gc 后:', afterGc8)
// 输出什么？为什么 gc 后内存回落到接近制造前？循环创建的 obj 从根出发访问不可达 所有在执行完gc方法之后 全部被回收了
// 提示：这就是"朝生暮死"对象——从根可达的时间极短，
// 主要在新生代被回收，不会挤进老生代。

// ========== 五、定时器与清理 ==========

// 练习 9：setInterval 不清理会怎样？（Node 进程不退出）
console.log('\n===== 练习 9 =====')
const timer = setInterval(() => {}, 1000)
console.log('setInterval 注册后，Node 进程会一直挂起（Ctrl+C 或取消）')
clearInterval(timer)
console.log('clearInterval 后，事件循环不再被定时器阻塞')
// 思考：如果 setInterval 的回调里捕获了某个大对象，
// 且从不 clearInterval，那这个大对象会被回收吗？
// 答案见下一题。

// 练习 10：模拟"回调捕获大对象 + 不清理"的真实泄漏
console.log('\n===== 练习 10 =====')
let leakHolder
function attach() {
  const big = new Array(3_000_000).fill('L')
  leakHolder = () => big.length // 定时器回调里常见的写法
}
attach()
gc()
console.log('回调捕获后:', mb(heapUsed()))
// 为什么这里即使没有 setInterval，内存也没被回收？
// 提示：leakHolder 是全局可达的，它捕获了 big。
// 实际业务里：setInterval 回调 + 引用大对象 + 不清理 = 教科书级泄漏。

// ==========================================
// 总结
// ==========================================
// 判断"会不会被回收"只看一件事：从根出发还到不到达它？
//   - 局部变量用完即走 → 可回收（练习 1）
//   - 全局变量 / 全局闭包 → 长期存活（练习 2、7、10）
//   - 循环引用不是泄漏（练习 3）
//   - 想"不阻止回收地存引用" → WeakMap / WeakSet（练习 4/5/6）
// 排查内存问题：Chrome DevTools → Memory → Heap Snapshot 对比两次快照。
