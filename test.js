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