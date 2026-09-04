'use strict'

// ==========================================
// V8 编译流水线（Parser → AST → Ignition → TurboFan）——练习题
// ==========================================
// 运行方式：node 12.V8编译流水线.js
// 部分观察需要额外 flag（文件内有说明）

// 规则回顾：
//   - 词法分析：把字符流切成 token（{let} {a} {=} {1} ...）
//   - 语法分析：把 token 组装成 AST
//   - 惰性解析：函数定义时只做表面解析，真正调用时才二次解析
//   - AST：代码的树状结构（Babel / ESLint / Vue 编译器也用）
//   - Ignition：AST → 字节码（平台无关中间表示）
//   - TurboFan：把"热点函数"优化编译为机器码（基于类型推测）
//   - 反优化 deopt：类型推测失败，回退字节码重新解释
//
// 请在每题「输出什么？」处写出预测，再运行 node 验证。

// ========== 一、概念判断题 ==========

// 练习 1：词法分析 vs 语法分析
console.log('===== 练习 1 =====')
// 下面哪个属于"词法分析"（切 token），哪个属于"语法分析"（组装 AST）？
// a) 把 "let a = 1" 切成 [{let},{a},{=},{1}]
// b) 检测到 "let a = " 缺少右值 → 报 SyntaxError
// c) 把 a + b 组织成 BinaryExpression(+, a, b)
// d) 识别出 1 是 NumberLiteral 而不是 Identifier
// 你的答案：a=词法分析____ b=语法分析____ c=语法分析____ d=语法分析____
console.log('  答案见文件末尾总结（先自己判断再对照）')

// ========== 二、AST 动手观察 ==========

// 练习 2：AST 长什么样（概念推理，不依赖工具）
console.log('\n===== 练习 2 =====')
// 下面这段代码，它的 AST 顶层大致有哪些节点？
function demo(a, b) {
  const sum = a + b
  return sum * 2
}
// 思考后填写：
//   Program
//   └── FunctionDeclaration
//       ├── name: demo____
//       ├── params: [a____, b____]
//       └── body:
//           ├── VariableDeclaration: add____
//           └── ReturnStatement: ____
console.log('  demo 的 AST 结构思考完成（对照上一题格式检查自己）')

// 说明：想亲眼看真实 AST，可运行：
//   npx acorn --ecma2022 --module 本文件路径  （或项目里安装 @babel/parser）

// ========== 三、热点函数与 TurboFan ==========

// 练习 3：解释执行 vs 优化执行——类型稳定的收益
console.log('\n===== 练习 3 =====')

// (1) 类型稳定：参数始终是 number
function addStable(a, b) {
  return a + b
}

// (2) 类型漂移：一会儿 number 一会儿 string
function addDrifting(a, b) {
  return a + b
}

const N = 1000_0000
let dummy = 0

console.time('类型稳定（始终 number）')
for (let i = 0; i < N; i++) {
  dummy = addStable(i, i)
}
console.timeEnd('类型稳定（始终 number）')

console.time('类型漂移（忽 number 忽 string）')
for (let i = 0; i < N; i++) {
  if (i % 2 === 0) {
    dummy = addDrifting(i, i) // number
  } else {
    dummy = addDrifting('a', 'b') // string ← 打破类型推测
  }
}
console.timeEnd('类型漂移（忽 number 忽 string）')

// 输出什么？哪个更快？
// 提示：类型稳定 → TurboFan 敢生成纯数字加法；类型漂移 → 反复反优化。

// 练习 4：反优化不是立刻生效——看函数"优化后替换原实现"的时机
console.log('\n===== 练习 4 =====')
// 引擎通常在函数成为热点后才优化，且优化在后台线程异步完成。
// 所以刚成为热点的那几次调用仍走解释器，稍后才切换到机器码。
// 思考：为什么 V8 不"第一次调用就优化"？
// 提示：优化编译本身需要 CPU 时间和内存。联系"不要过早优化"。
console.log('  优化发生在后台线程；普通函数一辈子到不了热点阈值')

// ========== 四、实战观察命令 ==========

// 练习 5：用 V8 内部 trace 观察编译行为
console.log('\n===== 练习 5 =====')
// 单独跑下面命令，观察某函数何时被优化、何时被反优化：
//   node --trace-opt --trace-deopt -e "
//     function f(x) { return x * 2 }
//     for (let i = 0; i < 100000; i++) f(i)   // 稳定 number → 被优化
//     f('boom')                                // 类型突变 → deopt
//   "
// 预期输出里会出现：
//   [compiling method ... using TurboFan]  ← 被优化
//   [deoptimize ... ]                      ← 被反优化
console.log('  请手动运行上方命令观察日志（关键词: TurboFan / deoptimize）')

// ========== 五、面试简答自测 ==========

// 练习 6：用自己的话回答（写在注释里）
console.log('\n===== 练习 6 =====')
// Q1: JS 是解释型还是编译型语言？为什么这么问是"伪命题"？
//     → 现代引擎是"解释执行 + 热点 JIT"的混合流水线，两者都有。
//
// Q2: 字节码和机器码有什么区别？为什么中间要有字节码？
//     → 平台无关 vs 平台相关；字节码为了"启动快 + 内存省"。
//
// Q3: 什么是 deopt（反优化）？它为什么存在？
//     → TurboFan 基于运行时类型做激进推测，推测被打破后回退字节码。
//
// Q4: 惰性解析解决什么问题？可能带来什么额外开销？
//     → 减少启动时解析量；代价是真正调用时要二次解析。
console.log('  按问题逐个口头回答，答不上的回到 12-V8编译流水线.md 对应章节')

// ==========================================
// 总结
// ==========================================
// 练习 1 参考答案：
//   词法分析 = a、d（把字符切成 token、识别 token 类型）
//   语法分析 = b、c（检查语法规则、组装 AST 结构）
//   区分关键：词法问"切成什么单元"，语法问"单元怎么组合才合法"。
//
// 练习 3 预期：类型稳定版本明显更快。
//   稳定的单一类型让 TurboFan 生成专用机器码（省类型检查）；
//   类型漂移会触发反复 deopt + 重新优化，产生"性能悬崖"。
//
// 核心：想被引擎优化 → 保持类型稳定、对象形状稳定；
//       先测量确认热点，再考虑针对优化。
