'use strict'

// ==========================================
// 隐藏类与内联缓存（Hidden Class & Inline Cache）——练习题
// ==========================================
// 运行方式：node 13.V8隐藏类与内联缓存.js

// 规则回顾：
//   - 隐藏类（Map/Shape）：记录"属性名 → 偏移量"，同形状对象共享
//   - 属性顺序不同 → 隐藏类不同 → 无法共享优化
//   - 动态加属性 / delete → 触发 map 转换，可能退化字典模式（慢）
//   - 内联缓存 IC：在调用点缓存 (map, 偏移)，命中则直接按偏移读
//   - monomorphic(1种形状) > polymorphic(2~4) > megamorphic(>4，退化查找)
//   - Vue 2 的 Vue.set / Vue 3 的 Proxy：理解"新增属性"带来的形状/响应式差异
//
// 请在每题「输出什么？」处写出预测，再运行 node 验证。

const N = 5000000

// ========== 一、同形状 vs 不同形状：性能对比 ==========

console.log('===== 练习 1：单态（同一形状）=====')
// 所有对象都来自同一个工厂，形状完全一致 → IC 单态

function makePoint(x, y) {
  return { x, y } // 始终按 x、y 顺序创建
}
const arr1 = []
for (let i = 0; i < 1000; i++) arr1.push(makePoint(i, i))
console.log('makePoint 批次创建完成')

console.time('访问单态形状')
let sum1 = 0
for (let round = 0; round < N; round++) {
  const p = arr1[round % 1000]
  sum1 += p.x + p.y
}
console.timeEnd('访问单态形状')
console.log('sum1:', sum1)

console.log('\n===== 练习 2：多态（两种形状混用）=====')
// 一半对象 x,y 顺序，一半对象 y,x 顺序 → 形状不同

function makePointA(x, y) {
  return { x, y }
}
function makePointB(x, y) {
  return { y, x } // 故意反过来
}
const arr2 = []
for (let i = 0; i < 500; i++) arr2.push(makePointA(i, i))
for (let i = 0; i < 500; i++) arr2.push(makePointB(i, i)) // 混入形状B

console.time('访问双态形状')
let sum2 = 0
for (let round = 0; round < N; round++) {
  const p = arr2[round % 1000]
  sum2 += p.x + p.y
}
console.timeEnd('访问双态形状')
console.log('sum2:', sum2)

console.log('\n===== 练习 3：超多态（四种以上形状）=====')
// 每个对象属性顺序都不同 → megamorphic，IC 退化

const arr3 = []
for (let i = 0; i < 1000; i++) {
  // 5 种不同顺序轮流，制造超多态
  const order = i % 5
  if (order === 0) arr3.push({ x: i, y: i })
  else if (order === 1) arr3.push({ y: i, x: i })
  else if (order === 2) arr3.push({ x: i, y: i, z: 0 })
  else if (order === 3) arr3.push({ y: i, x: i, z: 0 })
  else arr3.push({ z: 0, x: i, y: i })
}

console.time('访问超多态形状')
let sum3 = 0
for (let round = 0; round < N; round++) {
  const p = arr3[round % 1000]
  sum3 += p.x + p.y
}
console.timeEnd('访问超多态形状')
console.log('sum3:', sum3)

// 输出什么？练习 1 / 2 / 3 谁最快？差距大约多少倍？
// 提示：单态命中直接读偏移；超多态 IC 槽溢出 → 每次回退查找。

// ========== 二、动态加属性 ==========

console.log('\n===== 练习 4：创建后动态加属性 vs 一次给全 ====')
// 场景：一批对象初始化时只给 a，用的时候再补 b。

function batchLazy(n) {
  const list = []
  for (let i = 0; i < n; i++) {
    const o = { a: i }
    o.b = i * 2 // 动态补属性：形状在创建后再变一次
    list.push(o)
  }
  return list
}

function batchEager(n) {
  const list = []
  for (let i = 0; i < n; i++) {
    const o = { a: i, b: i * 2 } // 一次给全：形状稳定
    list.push(o)
  }
  return list
}

const n4 = 100000
console.time('动态补属性')
const lazyList = batchLazy(n4)
console.timeEnd('动态补属性')

console.time('一次给全')
const eagerList = batchEager(n4)
console.timeEnd('一次给全')

// 输出什么？谁更快？（此处在"创建阶段"就体现差异）
// 更关键的是：lazy 写法让每个对象多走一次 map transition。

// ========== 三、delete 的代价 ==========

console.log('\n===== 练习 5：delete 后对象退化（概念题）=====')
// delete 一个属性会让该对象的隐藏类"形状断裂"，
// V8 常把它降级成字典模式（慢属性）。思考后回答：
// 1) 为什么 delete 比"把属性设为 undefined/null"更伤性能？
// 2) 如果只是"清掉引用"，更推荐写什么？
// 提示：delete 改变形状；置 undefined 不改变形状。
console.log('  概念思考：delete 改变形状 vs 置 undefined 保持形状')

// ========== 四、扩展：观察 Map 地址 ==========

console.log('\n===== 练习 6：用 %DebugPrint 观察隐藏类（需 flag）=====')
// 单独运行下面命令，可看到两个对象的 map 地址是否相同：
//   node --allow-natives-syntax -e "
//     const a = { x: 1, y: 2 }
//     const b = { x: 3, y: 4 }   // 同顺序
//     const c = { y: 5, x: 6 }   // 反顺序
//     %DebugPrint(a); %DebugPrint(b); %DebugPrint(c)
//   "
// 预期：a、b 的 map 地址一致；c 与它们不同。
console.log('  手动运行上方命令对比 map 地址')

// ==========================================
// 总结
// ==========================================
// 单态 > 双态 > 超多态：保持调用点遇到的对象"形状一致"，
// 是让 V8 隐藏类 + 内联缓存发挥作用的根本。
//
// 实用准则：
//   1. 构造函数/工厂一次性初始化全部属性（含默认值）
//   2. 别用 delete，想清引用就赋 null/undefined
//   3. 别创建后再给对象"补新属性"（尤其热路径）
//   4. 对象数组的元素尽量来自同一工厂/类
// 这同时也让 Vue 的响应式系统（依赖收集/形状稳定）更高效。
