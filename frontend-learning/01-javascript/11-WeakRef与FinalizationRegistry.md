# WeakRef 与 FinalizationRegistry

> 本章是「垃圾回收」体系的收尾章。建议学完前两课（可达性/分代回收、V8 GC 性能优化）之后学习。核心理解**强引用 vs 弱引用**，以及"对象死后自动消失 / 收到通知"的应用场景。

---

## 前置知识 & 知识网络

- **依赖**：垃圾回收基础（可达性、标记-清除）、`WeakMap` / `WeakSet`、闭包
- **影响**：缓存设计、全局注册表、性能优化阶段的资源清理

---

## 一句话总结

`WeakRef` 允许你**弱引用**地持有对象（引用它，但不阻止 GC 回收它）；`FinalizationRegistry` 让你在对象**确实被回收后**收到通知。两者配合，用于"缓存 / 全局注册表"这类**对象死了，条目就该自动消失**的场景。

---

## 背景：强引用把我们困在哪了？

### 1. 缓存的宿命：用 Map 就会泄漏或失控

想给"大对象"缓存计算结果，最朴素的做法：

```javascript
const cache = new Map()

function heavy(id) {
  if (cache.has(id)) return cache.get(id)
  const result = expensiveWork(id)
  cache.set(id, result)
  return result
}
```

问题：Map 对 key 和 value 都是**强引用**。只要条目还在，key 就永远活着。缓存无限增长 → 内存泄漏。所以得手动控制容量（LRU）、手动清理——麻烦且容易出错。

### 2. WeakMap 只解决了一半

`WeakMap` 弱引用 **key**：key 没人用时，条目自动消失。它解决了缓存泄漏，但有两个局限：

- **value 仍是强引用**——如果 value 内部又引用回 key，这个环让 key 永远回收不了
- **不可迭代、无 size、无通知**——"key 被回收了"这件事，你无从得知

### 3. 真实痛点：value 引用 key 的经典陷阱

给对象关联"它自己的派生信息"，很容易写出这个环：

```javascript
const cache = new WeakMap()

function process(obj) {
  let entry = cache.get(obj)
  if (!entry) {
    entry = {
      obj,                          // ⚠️ entry 强引用了 key 自己
      result: heavyCompute(obj),
    }
    cache.set(obj, entry)           // WeakMap 又强引用了 entry
  }
  return entry
}
```

```text
WeakMap ──(强引用)──► entry ──(强引用)──► obj
   ▲                                      │
   └────────────(key, 弱引用)──────────────┘

obj 作为 key 被弱引用，本该死；
但 entry.obj 强引用着它 → 死不了 → 缓存永不清理
```

**没有 WeakRef，这个环无解**——你既想缓存 obj 相关的数据，又不想 obj 因此永生。

---

## 第一节：WeakRef——单向的、不保鲜的引用

```javascript
let ref = new WeakRef(obj)   // 弱引用 obj
// ... 后来
let stillAlive = ref.deref() // 取出对象；若 obj 已被回收，返回 undefined
```

语义对比：

```text
强引用 (普通变量/Map/Set)      → 让对象存活，是"根"的一部分
WeakRef (弱引用)              → 指向对象，但不阻止回收
                               deref(): 活着 → 返回对象；已死 → undefined
```

**对象是否活着，由所有强引用决定，WeakRef 不参与表决。**

### 打破上面的环：entry 里存 WeakRef 而不是 obj

```javascript
const cache = new WeakMap()

function process(obj) {
  let entry = cache.get(obj)
  if (!entry) {
    entry = {
      objRef: new WeakRef(obj),     // 弱引用，不再强留 obj
      result: heavyCompute(obj),
    }
    cache.set(obj, entry)
  }
  return entry
}

const obj = { name: '临时对象' }
const e = process(obj)
// obj 的外部强引用没了之后：
// WeakMap 的 key 弱引用 + entry.objRef 弱引用 → obj 可以被回收
// obj 被回收后，cache.get(obj) 也取不到了（key 没了）→ 条目自然消亡
```

---

## 第二节：FinalizationRegistry——对象死后的"讣告"

`WeakRef` 只能让你"问它死没死"，`FinalizationRegistry` 让你"等它死的那一刻收到通知"。

```javascript
const registry = new FinalizationRegistry(heldValue => {
  // obj 被回收后，这里异步执行
  console.log('对象已被回收，清理相关资源:', heldValue)
})

registry.register(obj, '和 obj 关联的清理数据')  // 登记
// registry.unregister(token) 可以取消登记
```

register 的第三个参数 **unregisterToken** 用于将来取消登记：

```javascript
const token = {}
registry.register(obj, held, token)   // token 不能和 obj 是同一个对象
// ...
registry.unregister(token)            // 不再关心 obj 的死活
```

---

## 第三节：必须接受的两个"不保证"

这是本章最重要的心智模型：

```text
① 回调时机不保证
   FinalizationRegistry 的回调在对象被 GC 之后才执行，
   但具体何时执行由引擎决定——可能很快，也可能被推迟很久
   （规范甚至允许引擎推迟到进程退出都不执行）

② deref() 拿到的对象必须立刻"接住"
   let x = ref.deref()   // 正确：存进局部变量，x 现在是被强引用的
   ref.deref().foo()     // 危险：临时对象用完引用即消失，可能立刻被回收
```

**推论**：`FinalizationRegistry` 不能用来做"关键性清理"（如关闭数据库连接、保存数据）。那些必须靠确定性的代码（`dispose()`、组件卸载钩子）。弱引用清理是**兜底**，不是主力。

---

## 结合实际开发

**适用场景**（都符合"条目该跟着对象一起死"）：

| 场景 | 做法 |
|---|---|
| 缓存派生结果 | value 存 `WeakRef`，打破 value→key 的环 |
| 给 DOM 节点挂数据 | `WeakMap` key=节点；节点被移除回收后数据自动消失 |
| 全局监听器注册表 | key=被监听对象，对象死了自动从表里消失 |
| 大对象缓存 | 不阻碍对象回收，内存压力自动缓解 |

**Vue 里最实用的其实是 WeakMap**：按组件实例缓存数据、`Map<组件, 它的状态>`——组件销毁即条目失效，无需手动清理。

---

## 框架设计思想（如果我是 TC39 设计者）

1. **为什么 WeakMap 的 value 不强转弱引用？** → 语义会崩：key 活着 value 却可能没了、迭代遍历对不上、与强引用混在一起无法预测。弱引用只放在 key 上，规则清晰可推理。
2. **为什么 FinalizationRegistry 不保证回调时机？** → 保证确定性执行 = 每次 GC 都要扫描注册表 + 引擎无法自由优化 = 全站变慢。规范宁可"不保证"，也不让 GC 背上确定性清理的包袱。**设计哲学：能确定做的就用确定性代码，不确定的时机绝不让程序员依赖。**
3. **和手动清理的关系** → 弱引用不是让你"不写清理代码"，而是解决"清理代码根本无从下手"的场景（对象什么时候死，你不知道）。它把"不得不手动"变成"自动兜底"。

---

## 源码/规范学习建议

- TC39 提案：**proposal-weakrefs**（了解规范如何规定"不保证"）
- 无需读 V8 C++。直接在练习里用 `node --expose-gc` 亲手验证
- 关注两个边界：`deref()` 后立即回收的竞态、`FinalizationRegistry` 回调的执行顺序（微任务）

---

## 总结

**核心知识**：强引用 vs 弱引用 → `WeakRef.deref()` → `FinalizationRegistry` 登记/取消 → 两个"不保证"（回调时机、立即接住）。

**容易混淆**：

- `WeakMap` 弱的是 key，value 还是强引用——value 引用 key 会形成打不破的环
- `WeakRef` 不等同 `WeakMap`，它可独立使用、能弱引用任意对象
- 弱引用清理是兜底，关键清理必须用确定性代码

**实际应用**：写缓存时，先问"条目应该跟谁一起死？"——跟 key 死用 WeakMap，避免 value 反向锁死用 WeakRef，想在死后收尾用 FinalizationRegistry。

---

## 思考题

1. 为什么 `deref()` 返回的对象要立刻存进局部变量再用？直接 `ref.deref().foo()` 有什么风险？
2. 能用 `FinalizationRegistry` 在对象回收时"自动关闭 WebSocket / 保存草稿"吗？为什么？
3. 下面这段，`obj` 还能被回收吗？如果不能，用 WeakRef 怎么改？

```javascript
const cache = new WeakMap()
function track(obj) {
  const info = { owner: obj, ts: Date.now() }   // value 引用 key
  cache.set(obj, info)
  return info
}
```

---

## 实践建议

1. 在 `09.垃圾回收.js` 里加一道题：value 引用 key 的 WeakMap 环，验证它回收不掉；改成 `owner: new WeakRef(obj)` 后，再用 `node --expose-gc` 验证能回收。
2. 用 `FinalizationRegistry` + `global.gc()` 观察回调何时执行，确认"时机不保证"。

---

## 下一步推荐

JS 第一阶段已接近收官。剩余可选项：

- **V8 运行时**（编译流水线 / 隐藏类 / JIT）——补完 `tree.md` 的"运行时"板块
- **深拷贝原理**（数据层面收尾）
- 进入 **2.5 阶段 / 浏览器渲染流程**
