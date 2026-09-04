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