const arr = Array.from({length:10},()=>{

    return fetch('http://test.com:3000')

})


console.time('all')

await Promise.all(arr)


console.timeEnd('all')