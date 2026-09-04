# 变量提升与暂时性死区（TDZ）

## 前置知识 & 知识网络

- **依赖**：执行上下文（创建阶段/执行阶段）、作用域与作用域链（`06`）
- **影响**：闭包循环陷阱、`typeof` 安全检测、class 声明时机、Vue/Vite 源码里大量 `let` 的阅读

---

## 一句话总结

`var`/`function` 声明在**编译阶段**就会被登记进作用域（提升），而 `let`/`const` 虽然也被登记，但从登记那一刻起到真正初始化之间有一段**"看得见、碰不得"**的区间，这个区间叫**暂时性死区（TDZ）**——在 TDZ 内访问变量会直接抛 `ReferenceError`。

---

## 背景：为什么 JS 有"提升"这种怪东西？

### 1. 历史原因：JS 是被"赶工"造出来的

1995 年 Brendan Eich 用 10 天设计出 JS。为了支持"函数声明在定义之前就能调用"这种自然的编程习惯，他把声明处理成"先登记、后执行"：

```javascript
foo()              // 能调用！foo 已被提升
function foo() { console.log('hi') }
```

"函数可以先调用、后定义"依赖提升，这个特性保留至今。`var` 也一样——先声明、后赋值，所以拿到的是 `undefined`。

### 2. 提升的本质：不是"代码移动"，而是"分阶段执行"

很多人以为提升是"JS 把声明搬到作用域顶部"。**不是**。真相是：每次进入一个作用域，JS 引擎**分两个阶段**处理：

```text
阶段一：创建阶段（编译/实例化）
  扫描整个作用域的声明
  把 var / 函数声明登记进"变量环境"
  把 let / const 也登记，但【不初始化】

阶段二：执行阶段
  逐行执行代码
  执行到声明行时才真正初始化
```

因为"登记"发生在执行任何代码之前，所以在执行阶段一开始，`var` 变量就已经存在（值为 `undefined`），函数也已就位——这造成了"看起来被提升了"的效果。

---

## 第一节：两个登记环境

ES 规范把作用域内的绑定（binding）分成两类登记处：

```text
变量环境 VariableEnvironment      ← var 声明住这里
词法环境 LexicalEnvironment       ← let / const 声明住这里
```

- `var` 进变量环境时**顺手初始化成 undefined**
- `let`/`const` 进词法环境时**只登记不初始化**——处于"未初始化（uninitialized）"状态

```javascript
console.log(a)   // ✅ undefined —— var 被初始化成 undefined 了

console.log(b)   // 💥 ReferenceError —— b 在 TDZ 中！
                 // 引擎知道 b 存在（已登记），但它还没初始化
let b = 1
```

---

## 第二节：TDZ 的定义与产生

### TDZ = 从"登记"到"初始化"之间的区间

```text
进入作用域
   │
   ├── 创建阶段：let b 已登记（未初始化）←────┐
   │                                         │
   ▼                                         │
执行阶段，碰到 console.log(b)  ←──── TDZ ────┤ 在这里访问 → ReferenceError
   │                                         │
   ▼                                         │
执行到 let b = 1，初始化完成  ───────────────┘
```

为什么 TDZ 会抛错，而 `var` 只是 `undefined`？

- `var`：登记时已给 `undefined`，所以不抛错
- `let`/`const`：登记但没给值，如果在初始化前被读取，引擎无法给出"有意义的值"，所以直接抛 `ReferenceError` 作为强制约束

> 面试关键点：**TDZ 恰恰证明了 let/const 也"提升"**——不提升的话，访问它应该报"未定义（is not defined）"；而现在报的是"已定义但未初始化"，说明它确实已经被登记进作用域了，只是不允许提前碰。

---

## 第三节：哪些情况会踩中 TDZ？

| 场景 | 是否会抛错 |
|---|---|
| `console.log(x); let x = 1` | 💥 TDZ |
| 函数参数默认值里引用后面的参数 | 💥 TDZ |
| `typeof x; let x` | 💥 注意：`typeof` 对 `var` 不报错，对 TDZ 中的 `let` 也报错！ |
| class 声明（也是 TDZ 语义） | 💥 用 `class C {}` 之前访问 C 报错 |
| 块级作用域内 | 💥 同样适用 |

经典坑：`typeof` 检查。

```javascript
console.log(typeof undeclaredVar)  // "undefined" —— 未声明的反而不报错
console.log(typeof tdzVar)         // 💥 ReferenceError —— 因为 tdzVar 在 TDZ 里
let tdzVar = 1
```

---

## 结合实践：经典面试题

### 经典 1：`var` 循环与 setTimeout

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100)
}
// 输出 3 3 3 —— var 没有块级作用域，三个闭包共享同一个 i
// 用 let 则输出 0 1 2 —— let 有块级作用域，每次迭代独立绑定
```

### 经典 2：函数提升与变量提升的优先级

```javascript
console.log(typeof foo)  // "function" —— 函数声明提升优先于 var
var foo = 1
function foo() {}
```

### 经典 3：参数默认值的 TDZ

```javascript
function f(a = b, b = 2) { return a }
// f(1) → 1（a 有传值就不触发默认值）
// f()  → 💥 ReferenceError：a 的默认值引用了还没初始化的 b
```

---

## 设计思想：为什么当初不把 let 也设计成"var 那样"？

**如果 let/const 也初始化为 undefined，会发生什么？**

```javascript
if (condition) {
  const val = 计算出来的值   // 需要时间算
  // 在算完之前，如果别处访问了 val……
}
```

如果没有 TDZ，程序员会拿到一个"占位的 undefined"，等到真正初始化后才发现逻辑被悄悄污染——**bug 延迟暴露**，非常难查。

TDZ 的价值 = **尽早失败（fail fast）**：把"用错了时机"的问题，从"静默的 undefined 污染"变成"立刻抛错"，让开发者第一眼就知道"这里访问得太早了"。

> 设计哲学对照：V8 的 guard 宁可回退也不算错；JS 的 TDZ 宁可抛错也不给假值——**都是"正确性优先于便利性"**。

---

## 源码/规范建议（了解即可）

- ECMAScript 规范中 **Lexical Environments / Binding Initialization** 相关章节定义了 TDZ
- 阅读 V8 对 let/const 的处理：在 DevTools Sources 或 `node --print-bytecode` 下观察 `let` 与 `var` 的差异

---

## 总结

**核心知识**：提升 = 创建阶段先登记声明；var 初始化成 undefined、let/const 只登记不初始化；TDZ = 登记到初始化之间的禁区，碰了抛 ReferenceError。

**容易混淆**：

- let/const **也提升**（已登记），不是"不提升"，只是"不允许提前访问"
- `typeof` 对 TDZ 变量抛错、对未声明变量不抛错
- 函数声明提升优先于 var 变量提升

**实际应用**：把 `let`/`const` 声明尽量放在作用域顶部（别依赖"先使用后声明"），循环/闭包问题优先用 `let`。

---

## 思考题

1. 为什么说 "let/const 也提升"？TDZ 抛出的错误信息为什么不是 "xx is not defined"？
2. 如果 ES 当初允许 let 提前读到 undefined（无 TDZ），会带来什么隐患？
3. `typeof` 在什么时候会抛 ReferenceError？为什么和访问未声明变量行为不同？

---

## 实践建议

1. 打开 DevTools Console 逐行实验 `var`/`let` 在声明前后的行为差异，观察报错信息。
2. 运行配套练习文件，把每种 TDZ 场景的错误亲手触发一遍。

---

## 下一步推荐

第一阶段最后一块：**深拷贝原理**——学完即可解锁浏览器阶段。
