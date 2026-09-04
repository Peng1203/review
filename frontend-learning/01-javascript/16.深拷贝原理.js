'use strict'

// ==========================================
// 深拷贝原理 —— 练习题
// ==========================================
// 运行方式：node 16.深拷贝原理.js
// 注意：本项目 package.json 为 ESM（type: module），用 structuredClone 无碍。

// 规则回顾：
//   - 浅拷贝：只复制第一层；嵌套对象仍共享引用
//   - 深拷贝：递归复制整张对象图，与原对象彻底无关
//   - JSON 方案四坑：函数/undefined/Symbol 丢失、Date 变字符串、Map/Set 变 {}、循环引用报错
//   - 手写递归三要点：基本类型出口 / 先登记再递归（防循环）/ WeakMap 登记表
//   - structuredClone：内置标准方案，支持循环引用 + Date/Map/Set，但函数/Symbol 报错
//
// 每题先预测输出，再运行验证。

// ========== 一、浅拷贝的边界 ==========

console.log('===== 练习 1：赋值 vs 浅拷贝 vs 深拷贝 =====')
const original = {
  name: 'Peng',
  address: { city: 'SZ' },
  tags: ['js', 'vue'],
}

const byAssign = original // 直接赋值
const shallow = { ...original } // 展开运算符（浅拷贝）
const deep = structuredClone(original) // 深拷贝

// 修改嵌套结构，观察影响范围：
shallow.address.city = 'BJ' // 只改了 shallow.address
console.log('original.address.city:', original.address.city)
console.log('deep.address.city:', deep.address.city)
// 预测：
//   byAssign.address.city 会变吗？____（会，同一对象）
//   original 被 shallow 影响了吗？____（会，浅拷贝共享深层引用）
//   deep 受影响了吗？____（不会，深拷贝独立）

shallow.tags.push('react')
console.log('original.tags:', original.tags)
// 预测：____（['js','vue','react']，浅拷贝共享 tags 数组引用）

console.log('\n===== 练习 2：浅拷贝为什么不够（底层原理）=====')
// 展开运算符做的其实是：
//   const clone = {}
//   for (key in obj) clone[key] = obj[key]   ← 复制的是"值/引用"
// 基本类型属性：值复制 → 独立
// 引用类型属性：复制引用 → 共享同一对象
console.log('  理解：浅拷贝只切断"第一层"的耦合')

// ========== 二、JSON 方案的坑 ==========

console.log('\n===== 练习 3：JSON 静默丢数据 =====')
const weird = {
  fn: () => 1,
  undef: undefined,
  sym: Symbol('s'),
  date: new Date('2026-01-01'),
  map: new Map([['k', 'v']]),
  set: new Set([1, 2]),
  n: null,
  nested: { ok: true },
}

const jsonCopy = JSON.parse(JSON.stringify(weird))
console.log(jsonCopy)
// 预测输出：
//   fn: ____（消失）
//   undef: ____（消失）
//   sym: ____（消失）
//   date: ____（变成字符串 "2026-01-01T00:00:00.000Z"）
//   map: ____（变成 {}）
//   set: ____（变成 {}）
//   n: ____（保留 null，JSON 支持）
//   nested: ____（正常深拷贝）

console.log('\n===== 练习 4：JSON 遇到循环引用直接抛错 =====')
const circular = { name: 'ring' }
circular.self = circular
try {
  JSON.parse(JSON.stringify(circular))
  console.log('JSON 拷贝成功？') // 不会到这
} catch (e) {
  console.log('JSON 抛错:', e.constructor.name, '-', e.message)
}

// ========== 三、手写递归深拷贝 ==========

console.log('\n===== 练习 5：最小可用 deepClone（含循环引用）=====')
function deepClone(target, map = new WeakMap()) {
  // ① 基本类型 / 函数：直接返回
  if (target === null || typeof target !== 'object') return target

  // ② 循环引用：已拷过 → 返回它的拷贝
  if (map.has(target)) return map.get(target)

  // ③ 特殊类型
  if (target instanceof Date) return new Date(target)
  if (target instanceof RegExp) return new RegExp(target.source, target.flags)
  if (target instanceof Map) {
    const copy = new Map()
    map.set(target, copy)
    target.forEach((val, key) => copy.set(key, deepClone(val, map)))
    return copy
  }
  if (target instanceof Set) {
    const copy = new Set()
    map.set(target, copy)
    target.forEach(val => copy.add(deepClone(val, map)))
    return copy
  }

  // ④ 数组 / 普通对象
  const clone = Array.isArray(target) ? [] : {}
  map.set(target, clone) // 先登记，再递归（关键顺序！）
  for (const key of Reflect.ownKeys(target)) {
    clone[key] = deepClone(target[key], map)
  }
  return clone
}

// 测试：循环引用
const ring = { name: 'ring' }
ring.self = ring
const ringCopy = deepClone(ring)
console.log('循环引用拷贝成功:', ringCopy.name)
console.log('ringCopy.self === ringCopy:', ringCopy.self === ringCopy)

// 测试：Date / Map / Set / 数组
const mixed = {
  date: new Date('2026-01-01'),
  map: new Map([['k', { deep: 1 }]]),
  set: new Set([{ a: 1 }]),
  list: [{ x: 1 }, { x: 2 }],
}
const mixedCopy = deepClone(mixed)
console.log('date 仍是 Date 实例:', mixedCopy.date instanceof Date)
console.log('map 值是独立对象:', mixedCopy.map.get('k') !== mixed.map.get('k'))
console.log('set 元素独立:', [...mixedCopy.set][0] !== [...mixed.set][0])
console.log('list 元素独立:', mixedCopy.list[0] !== mixed.list[0])

// 思考：为什么 ② 的 map.has 检查要放在递归前？
// 提示：若没有登记表，ring.self 会无限递归导致栈溢出。
console.log('  关键：先登记（map.set）再递归子属性 = 防循环引用')

// ========== 四、structuredClone（标准方案） ======

console.log('\n===== 练习 6：structuredClone 处理内置类型 + 循环引用 =====')
const scRing = { list: [1, 2] }
scRing.self = scRing
const scCopy = structuredClone(scRing)
console.log('循环引用正常:', scCopy.self === scCopy)
console.log('数组独立:', scCopy.list !== scRing.list)

console.log('\n===== 练习 7：structuredClone 对函数/Symbol 报错 =====')
try {
  structuredClone({ fn: () => 1 })
  console.log('函数拷贝成功？') // 不会到这
} catch (e) {
  console.log('函数报错:', e.constructor.name)
}
try {
  structuredClone({ s: Symbol('x') })
  console.log('Symbol 拷贝成功？') // 不会到这
} catch (e) {
  console.log('Symbol 报错:', e.constructor.name)
}

// ========== 五、设计对比 ==========

console.log('\n===== 练习 8：三种方案如何选 =====')
console.log('  纯 JSON 数据(可序列化)     → JSON / structuredClone 都行')
console.log('  含 Date/Map/Set/循环引用    → structuredClone（内置）')
console.log('  含函数且想要"保留函数引用"   → structuredClone 会抛错，须手写/避开')
console.log('  需要原型链/类实例保持        → 手写 + 额外处理（多数场景不需要）')
// 问：为什么 JSON 遇到函数是"静默丢弃"，structuredClone 却是"报错"？
// 答：JSON 是数据交换格式，序列化时合法地忽略不可表达值；
//     structuredClone 的语义是"完整克隆对象"，做不到就 fail fast（宁可报错不静默错）。

// ==========================================
// 总结
// ==========================================
// 1. {...obj} / Object.assign = 浅拷贝：只切第一层
// 2. JSON.parse(JSON.stringify())：纯数据可用，遇函数/Symbol/循环引用有坑
// 3. 手写 deepClone 核心 = 递归 + 先登记防循环 + 特殊类型分派
// 4. structuredClone 是现代标准答案（函数/Symbol 除外）
// 5. 现实选择：默认 structuredClone；要细粒度控制用 lodash cloneDeep
