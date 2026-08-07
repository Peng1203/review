# JavaScript Promise 与 async / await

> 本章是异步体系的重中之重。建议分 3 次学：① Promise 基础与状态机 → ② then 返回值规则与静态方法 → ③ async/await 与实战陷阱。每节末尾有「本节重点 + 思考题」，学完一节就停。

---

## 一句话总结

**Promise 是对「一个异步操作的最终结果」的封装**，它有且仅有三种状态（等待/成功/失败），状态一旦确定就不可逆转；`then/catch/finally` 用来拿到结果或错误，且每次调用都返回**新的** Promise，从而支持链式调用；`async/await` 只是把基于 Promise 的链式写法，变成"看起来像同步"的语法糖。

---

## 背景：为什么需要 Promise？

### 1. 回调地狱（Callback Hell）

没有 Promise 时，多个串行异步只能嵌套回调：

```javascript
getUser(id, function (user) {
  getOrders(user.id, function (orders) {
    getOrderDetail(orders[0].id, function (detail) {
      render(detail, function () {
        // 越套越深，缩进失控，难以维护
      })
    })
  })
})
```

问题：缩进地狱、错误处理要每层写、无法用 `try/catch`、难以组合。

### 2. 回调的「信任问题」

原生回调把控制权完全交给被调用方，它可能：

- **调用太早**（同步就把回调执行了）
- **调用太晚 / 不调用**（异步永远不回来）
- **调用多次**（成功后又失败，或重复成功）
- **吞掉异常**（回调里抛错外部捕获不到）

Promise 在设计上**修复了信任问题**：

- 状态一旦 `fulfilled`/`rejected` 就**冻结**，外部无法再改（解决"调用多次/太早"）
- `resolve/reject` 只生效**第一次**，后续调用被忽略
- 错误通过 `.catch` 链路传递，不会静默丢失

---

# 第一节：Promise 基础与状态机

## 1. 什么是 Promise

Promise 是一个对象，代表一个**尚未完成但将来会完成（或失败）的异步操作及其结果值**。

```javascript
const p = new Promise((resolve, reject) => {
  // executor：描述异步操作
  setTimeout(() => resolve('成功的值'), 1000)
})
```

## 2. 三种状态（核心）

```
        ┌─────────────┐
        │   pending   │  初始状态（待定）
        └──────┬──────┘
               │ resolve(value)
               ▼
        ┌─────────────┐
        │  fulfilled  │  已成功（resolved）
        └─────────────┘

        ┌─────────────┐
        │   pending   │
        └──────┬──────┘
               │ reject(reason)
               ▼
        ┌─────────────┐
        │  rejected   │  已失败
        └─────────────┘
```

**铁律（必须记住）：**

1. 状态只能从 `pending` → `fulfilled` 或 `pending` → `rejected`，**单向、不可逆**。
2. 一旦进入 `fulfilled` 或 `rejected`，状态**永久冻结**，之后 `resolve/reject` 都无效。
3. 一个 Promise 的"值"也永久固定，后续无法修改。

## 3. executor 是同步执行的

`new Promise(executor)` 里的 `executor` 函数**会立即同步执行**（不是异步！）。异步的是你「在里面调用的 setTimeout / fetch 等」。

```javascript
console.log('1')
new Promise((resolve) => {
  console.log('2') // 同步打印
  resolve('ok')
})
console.log('3')
// 输出：1 2 3
```

这就是为什么 `resolve('ok')` 即使"立刻"调用，`.then` 回调也**不会同步执行**（见第三节微任务）。

## 4. resolve / reject 只生效一次

```javascript
const p = new Promise((resolve, reject) => {
  resolve('第一次')  // 生效
  reject('第二次')   // 无效（状态已定）
  resolve('第三次')  // 无效
})
p.then((v) => console.log(v)) // 第一次
```

## 5. resolve 一个 Promise 会"展开"

如果 `resolve` 收到的是一个 Promise，外层 Promise 会**采用**它的状态（递归展开）：

```javascript
const inner = Promise.resolve('inner 的值')
const outer = new Promise((resolve) => resolve(inner))
outer.then((v) => console.log(v)) // 'inner 的值'（不是 inner 这个 Promise 对象）
```

**本节重点**：三种状态、状态不可逆、executor 同步、resolve/reject 一次生效。

**思考题**：
1. `new Promise((resolve) => resolve(1)).then(() => resolve(2))` 能第二次改变结果吗？为什么？
2. 为什么不直接用回调，而要用 Promise 包一层？

---

# 第二节：then / catch / finally 与返回值规则

> 这是**最容易出错**的部分，务必逐字理解「返回值规则」。

## 1. then 的完整形式

```javascript
p.then(onFulfilled, onRejected)
```

- `onFulfilled`：Promise 成功时调用，接收 `value`
- `onRejected`：Promise 失败时调用，接收 `reason`
- **`then` 总是返回一个新的 Promise**（不是原来的那个）

## 2. then 的返回值规则（重中之重）

`then` 返回的新 Promise 的状态，**由回调的返回值决定**，共 4 种情况：

```
then 的回调里：
├─ 返回一个普通值（或 undefined）
│     → 新 Promise 以该值 fulfilled
├─ 返回一个 Promise（或 thenable）
│     → 新 Promise 采用它的状态（展开）
├─ 抛出错误（throw）
│     → 新 Promise 以该错误 rejected
└─ 什么都不返回
      → 新 Promise 以 undefined fulfilled
```

示例：

```javascript
Promise.resolve(1)
  .then((x) => x + 1)            // 返回 2 → 新 Promise fulfilled(2)
  .then((x) => Promise.resolve(x * 10)) // 返回 Promise → 采用，fulfilled(20)
  .then((x) => { throw new Error('boom') }) // 抛错 → rejected
  .then((x) => console.log('不会到这里'))     // onFulfilled 跳过
  .catch((e) => console.log(e.message))        // 捕获 boom
```

> ⚠️ 常见错误：以为 `.then` 返回的是「原 Promise」。错！每次 `.then` 都产生新 Promise，链式依赖的是「上一步的结果往下传」。

## 3. catch

`p.catch(onRejected)` 等价于 `p.then(null, onRejected)`，专门用于捕获错误，也返回新 Promise。

## 4. 错误会「冒泡」到最近的 catch

```javascript
Promise.resolve(1)
  .then(() => { throw new Error('a') })
  .then(() => console.log('跳过')) // 因为上一步 rejected，这步 onFulfilled 跳过
  .catch((e) => console.log(e.message)) // 在这里被捕获 → 'a'
```

**规则**：Promise 链上任何一步 `reject` 或 `throw`，都会跳过后续所有 `onFulfilled`，直到遇到第一个 `onRejected`（catch）。

## 5. catch 之后链路「恢复」

`catch` 本身返回新 Promise，若 `catch` 回调**没有抛错/返回 rejected**，则后续 `.then` 会**正常继续**（以 catch 的返回值 fulfilled）：

```javascript
Promise.reject('出错')
  .catch((e) => {
    console.log('捕获:', e)
    return '恢复值' // catch 返回普通值 → 后续 fulfilled('恢复值')
  })
  .then((v) => console.log(v)) // '恢复值'
```

## 6. finally

无论成功失败都执行，常用于清理（关闭 loading、释放资源）。

```javascript
p.finally(() => console.log('无论成败都执行'))
```

**要点**：
- `finally` 的回调**不接收 value / reason**（拿不到结果）
- `finally` 返回新 Promise，**原结果会透传**——除非你在 `finally` 里 `return Promise.reject(...)` 或 `throw`，那会**覆盖**原结果

```javascript
Promise.resolve('原值')
  .finally(() => 'finally 的返回值被忽略')
  .then((v) => console.log(v)) // '原值'（finally 不改变结果）

Promise.resolve('原值')
  .finally(() => { throw new Error('覆盖') })
  .catch((e) => console.log(e.message)) // '覆盖'（finally 抛错覆盖原结果）
```

**本节重点**：then 永远返回新 Promise；4 种返回值规则；错误冒泡；catch 后恢复；finally 不接收值但能覆盖结果。

**思考题**：
1. `Promise.resolve(1).then(() => 2).then((x) => console.log(x))` 打印什么？中间那次 `.then` 做了什么？
2. `Promise.reject('e').catch(() => {}).then((x) => console.log(x))` 打印什么？为什么？

---

# 第三节：静态方法（Promise.all / allSettled / race / any）

## 1. Promise.resolve / reject

```javascript
Promise.resolve(1)        // 等同于 new Promise(res => res(1))
Promise.reject('err')     // 等同于 new Promise((_, rej) => rej('err'))
```

注意：`Promise.resolve(某个Promise)` 会直接返回那个 Promise（不双重包装）。

## 2. Promise.all —— 全部成功才成功

```javascript
const p = Promise.all([p1, p2, p3])
```

- 全部 `fulfilled` → 新 Promise `fulfilled`，结果是一个**按输入顺序排列的数组**
- **任意一个 `rejected`** → 新 Promise 立即 `rejected`，reason 是**第一个失败**的那个（其他仍在跑，但不会等）
- 输入顺序固定：即使 p2 先完成，结果数组仍是 `[p1结果, p2结果, p3结果]`

```javascript
const [a, b] = await Promise.all([fetchA(), fetchB()]) // 并发请求
```

⚠️ `Promise.all` 是**失败即短路**：一个失败就整体失败，不等其他。

## 3. Promise.allSettled —— 全部"落定"才结束

```javascript
const results = await Promise.allSettled([p1, p2])
// results = [
//   { status: 'fulfilled', value: ... },
//   { status: 'rejected',  reason: ... },
// ]
```

- **不管成功失败**，等所有都 `settle` 才返回
- 适合"发起一组请求，逐个处理结果/错误，不希望一个失败拖累整体"的场景

## 4. Promise.race —— 谁先"落定"算谁的

```javascript
Promise.race([p1, p2])
```

- 第一个 `settle`（无论成功或失败）的 Promise 决定结果
- 常用于**超时控制**：

```javascript
function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('超时')), ms)),
  ])
}
```

## 5. Promise.any —— 谁先"成功"算谁的

```javascript
Promise.any([p1, p2, p3])
```

- **第一个 `fulfilled`** 的 Promise 决定结果
- 全部 `rejected` 才整体 `rejected`，且 reason 是 `AggregateError`（包含所有失败原因）
- 适合"多个数据源竞速，取最快成功的"（如 CDN 竞速）

## 6. 四个静态方法对比

| 方法 | 成功条件 | 失败条件 | 结果 |
|---|---|---|---|
| `all` | 全部成功 | 任一个失败（取第一个失败） | 成功值的数组 |
| `allSettled` | 全部落定（不论成败） | 永不失败 | 状态+值/原因 的数组 |
| `race` | 第一个落定且成功 | 第一个落定且失败 | 第一个落定者 |
| `any` | 第一个成功 | 全部失败（AggregateError） | 第一个成功者 |

**本节重点**：四个静态方法的成功/失败语义差异；all 的失败短路；any 的 AggregateError。

**思考题**：
1. `Promise.all([Promise.resolve(1), Promise.reject('e'), Promise.resolve(3)])` 结果是什么？
2. 要"等所有请求都结束，逐个处理成功和失败"，用哪个方法？

---

# 第四节：Promise 与 Event Loop（连接上一章）

回顾 `07-事件循环`：

- `new Promise(executor)` 的 **executor 同步执行**
- `resolve/reject` 只是"定状态"，**不会同步触发 `.then` 回调**
- `.then / .catch / .finally` 的回调，**都是微任务**

```javascript
console.log('1')
Promise.resolve()
  .then(() => console.log('2'))
  .then(() => console.log('3'))
console.log('4')
// 输出：1 4 2 3
```

过程：同步 `1` → `Promise.resolve()` 的 `.then` 回调入微任务队 → 同步 `4` → 栈空，清空微任务 `2` → 第二个 `.then` 又产生新微任务 `3` → 打印 `2 3`。

**关键**：`then` 的回调永远在"当前宏任务结束后的微任务阶段"执行，所以永远晚于同步代码。

---

# 第五节：async / await

`async/await` 是 ES2017 语法，本质**完全基于 Promise**，只是写法像同步。

## 1. async 函数

```javascript
async function f() {
  return 1
}
f() // 返回一个 Promise（等价于 Promise.resolve(1)）
```

- `async` 函数**永远返回 Promise**
- `return x` 等价于 `return Promise.resolve(x)`

## 2. await

```javascript
async function f() {
  const v = await Promise.resolve(2)
  console.log(v) // 2
}
```

- `await` 后面跟 Promise 时，**暂停**函数执行，等它 settle，然后：
  - fulfilled → 取出 value 作为 `await` 表达式的值
  - rejected → 抛出该错误（可被 `try/catch` 捕获）
- `await` 后面的**非 Promise 值会被自动包装**成 `Promise.resolve(值)`

```javascript
const x = await 123   // 等价于 await Promise.resolve(123)
```

## 3. await 的微任务本质（连接 Event Loop）

`await` 之后的代码，等价于"前一个 Promise 的 `.then` 回调"，是**微任务**：

```javascript
console.log('1')
async function f() {
  console.log('2')
  await null          // await 后面的代码进入微任务
  console.log('3')
}
f()
console.log('4')
// 输出：1 2 4 3
```

过程：同步 `1` → `f()` 执行，同步打印 `2`，遇到 `await` 暂停，`f()` 返回一个 pending Promise → 同步 `4` → 微任务阶段恢复 `f`，打印 `3`。

> 注意 `2` 在 `4` 之前（因为 `f()` 内部 `await` 之前是同步的），`3` 在 `4` 之后（`await` 之后是微任务）。

## 4. try / catch 捕获错误

```javascript
async function f() {
  try {
    const v = await Promise.reject(new Error('失败'))
  } catch (e) {
    console.log(e.message) // '失败'
  }
}
```

`await` 抛出的 rejection 会被 `try/catch` 捕获——这是比 `.catch` 更直观的写法。

## 5. 串行 vs 并行（重要性能点）

```javascript
// 串行：a 完成才请求 b（慢）
const a = await fetchA()
const b = await fetchB()

// 并行：同时发起，再等结果（快）
const [a, b] = await Promise.all([fetchA(), fetchB()])
```

⚠️ `await` 在循环里默认是**串行**的：

```javascript
for (const url of urls) {
  await fetch(url) // 一个接一个
}
// 并行写法：
await Promise.all(urls.map((u) => fetch(u)))
```

## 6. for await...of

遍历"异步可迭代对象"（每个元素都是 Promise）：

```javascript
for await (const item of asyncIterable) {
  console.log(item)
}
```

## 7. 顶层 await（ES2022，模块中可用）

在 ES Module 顶层可直接 `await`，无需包在 async 函数里（仅限 `import` 的模块环境）。

**本节重点**：async 必返回 Promise；await 暂停并取 value；非 Promise 自动包装；await 后续是微任务；串行 vs 并行用 Promise.all。

**思考题**：
1. `async function f(){ return await Promise.resolve(1) }` 和 `async function f(){ return Promise.resolve(1) }` 区别？
2. 如何把"依次请求 3 个接口"改成并发？

---

# 第六节：常见陷阱与易混淆（必看）

| 陷阱 | 正确理解 |
|---|---|
| `then` 返回原 Promise | 错，返回**新** Promise，链式依赖结果传递 |
| executor 是异步的 | 错，executor **同步**执行 |
| `resolve` 后可再 `reject` | 错，状态冻结，第二次调用无效 |
| `catch` 后链路断了 | 错，`catch` 返回新 Promise，没抛错则后续 `.then` 恢复 |
| `finally` 能拿到 value | 错，`finally` 回调不接收参数 |
| `finally` 永远不改变结果 | 错，若 `finally` 里 `throw`/`return rejected` 会**覆盖** |
| `Promise.all` 等全部完成 | 错，`all` 是**失败即短路**；要等都完成用 `allSettled` |
| `await` 是阻塞整个线程 | 错，`await` 只暂停当前 async 函数，让出主线程（微任务） |
| 多个 `then` 共享一个 Promise 会各自运行 | 对，但注意：同一个 Promise 加多个 `then`，每个 `then` 独立收到原结果（不是链式） |

最后一个陷阱示例：

```javascript
const p = Promise.resolve(1)
p.then((x) => console.log('A:', x)) // A: 1
p.then((x) => console.log('B:', x)) // B: 1（两个 then 都拿到 1，互不影响）
// 这与 p.then().then() 链式不同！
```

---

# 第七节：结合开发 / 框架

### 1. fetch 返回 Promise

```javascript
const res = await fetch('/api/user')
const data = await res.json() // res.json() 也返回 Promise
```

### 2. Vue 中的异步

```javascript
async function load() {
  loading.value = true
  try {
    const [user, orders] = await Promise.all([getUser(), getOrders()])
    // 并发请求，渲染
  } catch (e) {
    // 统一错误处理
  } finally {
    loading.value = false // 无论成败都关 loading
  }
}
```

### 3. 未处理的 rejection（重要）

如果一个 Promise 被 `reject` 且**没有任何 `catch` / `try-catch` 接管**，会触发 `unhandledRejection`，在 Node / 浏览器控制台报红。务必：

- 在 Promise 链末端加 `.catch`
- 或在 async 函数调用处 `try/catch`
- 不要写 `p.then(() => {...})` 却忘了对 `p` 可能的 rejection 兜底

---

# 第八节：框架设计思想 & 源码学习（点到为止）

### Promise A+ 规范

Promise 的行为由 **Promises/A+ 规范** 定义（不是 ES 规范本身，但 JS 的 Promise 遵循它）。核心包括：

- `then` 必须返回新 Promise（2.2.7）
- `onFulfilled` / `onRejected` 必须是异步执行（通过"平台微任务"机制）
- `then` 的 `onFulfilled` 返回值若为 thenable，必须展开（2.3）

**源码学习建议**（不一次啃完）：
- 先手写一个**最简 Promise**（实现 executor / resolve / then 的异步调度与值传递），这是理解最深的路径
- 再读规范：搜索 "Promises/A+"，重点看 2.3 的 thenable 处理

### 为什么 async/await 基于 Promise 而非反过来？

Promise 已经是标准的异步原语，async/await 只是语法糖——没有 Promise 这层"状态机 + 微任务调度"，`await` 无从挂起和恢复。语言设计上用"语法糖 + 已有原语"成本最低、语义最统一。

---

## 总结

### 核心知识网络

```
Promise
├─ 状态机：pending → fulfilled / rejected（不可逆）
├─ executor 同步执行
├─ then/catch/finally 都返回新 Promise
│   └─ 返回值规则：普通值/返回Promise/抛错/不返回
├─ 错误冒泡到最近 catch，catch 后可恢复
├─ 静态方法：resolve/reject/all/allSettled/race/any
├─ .then 回调是微任务（连接 Event Loop）
└─ async/await = Promise 的语法糖
    ├─ async 必返回 Promise
    ├─ await 暂停取 value，后续是微任务
    └─ 串行 vs 并行（Promise.all）
```

### 容易混淆（再强调）

1. `then` 返回**新** Promise，不是原 Promise
2. 状态**不可逆**，`resolve/reject` 只生效一次
3. `finally` 不接收值，但能覆盖结果
4. `Promise.all` 失败即短路；要等都完成用 `allSettled`
5. `await` 不阻塞线程，只是让出主线程

### 知识关联

- 前置：执行上下文、Event Loop（微任务）、作用域闭包
- 后续：Generator（async 的底层实现思路）、浏览器网络请求、Vue 异步更新（nextTick）

### 实践建议

1. **手写一个最简 Promise**（实现 then 的异步调度），比读十篇博客都管用
2. 把项目里任意"嵌套回调"改写成 `async/await` + `try/catch`
3. 用 `Promise.all` 把串行请求改成并发，观察耗时变化

### 下一步

- 想深究原理：手写 Promise + 读 Promises/A+ 规范 2.3
- 想横向扩展：进入路线图下一阶段——**浏览器 / 网络**（HTTP、fetch 全生命周期、CORS），这些和 Promise 天然衔接
- 或回头把 `CLAUDE.md` 里 `Promise` / `async-await` 的 `[ ]` 勾成 `[x]`
