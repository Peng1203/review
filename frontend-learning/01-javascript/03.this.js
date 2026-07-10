function Person(name) {
  this.name = name

  this.sayHello = function () {
    setTimeout(function () {
      console.log(`Hello, I'm ${this.name}`)
    }, 1000)
  }
}

const p = new Person('Peng')

p.sayHello()
