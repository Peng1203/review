'use strict'
function test() {
  let a = {}
  let b = {}

  function test1() {
    console.log('b ------', b)
  }

  return function () {
    return a
  }
}

const clFn = test()

clFn()
const codeStr = `
async function search() {
  let result = []

  for (let i = 0; i < 3; i++) {
    result.push(i)
  }
  
  result = result.map(item => ({
    id: item,
    name: item
  }))

  return result
}
`
const testFn = new Function(
  `

  ${codeStr}

  return search()
  `,
)

async function main() {
  const res = await testFn()
  console.log(res)
}
main()
