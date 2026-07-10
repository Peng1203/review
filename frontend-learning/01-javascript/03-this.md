# JavaScript this

## 一句话总结

`this` 是函数执行时的上下文引用，它指向谁取决于函数的调用方式，而不是定义位置。

---

## 核心概念

### 1. this 的绑定规则（按优先级）

| 优先级   | 调用方式                    | this 指向                      |
| ----- | ----------------------- | ---------------------------- |
| 1（最高） | `new` 绑定                | 新创建的对象                       |
| 2     | 显式绑定（`call/apply/bind`） | 指定的对象                        |
| 3     | 隐式绑定（对象方法调用）            | 调用对象                         |
| 4（最低） | 默认绑定                    | `window` / `undefined`（严格模式） |

---

## 四种绑定规则详解

### 1. 默认绑定（最常见）

```javascript
function sayHello() {
    console.log(this);
}

sayHello();  // window（浏览器）或 global（Node.js）
```

**规则：独立函数调用，`this` 指向全局对象。**

```javascript
// 严格模式下
"use strict";
function sayHello() {
    console.log(this);
}

sayHello();  // undefined ← 严格模式下是 undefined
```

### 2. 隐式绑定

```javascript
let obj = {
    name: "Peng",
    sayHello: function() {
        console.log(`Hello, I'm ${this.name}`);
    }
};

obj.sayHello();  // "Hello, I'm Peng" ← this 指向 obj
```

**规则：函数作为对象的方法调用，`this` 指向调用对象。**

```javascript
// 隐式绑定丢失
let sayHello = obj.sayHello;
sayHello();  // "Hello, undefined" ← this 指向 window
```

**为什么丢失？**

```
obj.sayHello()  → this 指向 obj（方法调用）
sayHello()      → this 指向 window（独立调用）
```

### 3. 显式绑定

```javascript
function sayHello() {
    console.log(`Hello, I'm ${this.name}`);
}

let obj = { name: "Peng" };

// call：立即执行，参数逐个传递
sayHello.call(obj);  // "Hello, I'm Peng"

// apply：立即执行，参数数组传递
sayHello.apply(obj);  // "Hello, I'm Peng"

// bind：返回新函数，不立即执行
let boundHello = sayHello.bind(obj);
boundHello();  // "Hello, I'm Peng"
```

| 方法      | 执行方式  | 参数传递 |
| ------- | ----- | ---- |
| `call`  | 立即执行  | 逐个传递 |
| `apply` | 立即执行  | 数组传递 |
| `bind`  | 返回新函数 | 逐个传递 |

### 4. new 绑定

```javascript
function Person(name) {
    this.name = name;
}

let peng = new Person("Peng");
console.log(peng.name);  // "Peng" ← this 指向新创建的对象
```

**new 做了什么？**

1. 创建空对象 `{}`
2. 将 `this` 指向空对象
3. 执行构造函数
4. 返回这个对象

---

## 箭头函数的特殊性

**箭头函数没有自己的 `this`，它继承外层作用域的 `this`。**

```javascript
let obj = {
    name: "Peng",
    // 普通函数：this 指向 obj
    sayHello: function() {
        console.log(`Hello, I'm ${this.name}`);
    },
    // 箭头函数：this 继承外层（window）
    sayHi: () => {
        console.log(`Hi, I'm ${this.name}`);
    }
};

obj.sayHello();  // "Hello, I'm Peng"
obj.sayHi();     // "Hi, undefined" ← this 指向 window
```

**为什么箭头函数这样设计？**

```javascript
// 问题：回调函数中 this 丢失
let obj = {
    name: "Peng",
    delayedHello: function() {
        setTimeout(function() {
            console.log(`Hello, I'm ${this.name}`);  // this 指向 window
        }, 1000);
    }
};

// 解决方案 1：保存 this
let obj = {
    name: "Peng",
    delayedHello: function() {
        let self = this;
        setTimeout(function() {
            console.log(`Hello, I'm ${self.name}`);  // "Hello, I'm Peng"
        }, 1000);
    }
};

// 解决方案 2：使用箭头函数（推荐）
let obj = {
    name: "Peng",
    delayedHello: function() {
        setTimeout(() => {
            console.log(`Hello, I'm ${this.name}`);  // "Hello, I'm Peng"
        }, 1000);
    }
};
```

---

## 绑定优先级

```javascript
function Person(name) {
    this.name = name;
}

let obj = {};

// new 绑定 > 显式绑定
let person1 = new Person.call(obj, "Peng");  // ❌ 报错
// new 不能和 call/apply 一起用

// 显式绑定 > 隐式绑定
function sayHello() {
    console.log(`Hello, I'm ${this.name}`);
}
let obj1 = { name: "Peng", sayHello: sayHello };
let obj2 = { name: "Test" };
obj1.sayHello.call(obj2);  // "Hello, I'm Test" ← 显式绑定优先
```

**优先级：new > 显式 > 隐式 > 默认**

new
 ↓
bind
 ↓
call/apply
 ↓
对象调用
 ↓
普通调用

---

## 动手验证

```javascript
// 测试 1：默认绑定
function test1() {
    console.log(this);
}
test1();  // window 或 undefined（严格模式）

// 测试 2：隐式绑定
let obj = {
    name: "Peng",
    test2: function() {
        console.log(this.name);
    }
};
obj.test2();  // "Peng"

// 测试 3：隐式绑定丢失
let test3 = obj.test2;
test3();  // undefined ← this 指向 window

// 测试 4：显式绑定
let obj2 = { name: "Test" };
obj.test2.call(obj2);  // "Test"

// 测试 5：箭头函数
let obj3 = {
    name: "Peng",
    test5: () => {
        console.log(this.name);
    }
};
obj3.test5();  // undefined ← this 指向 window

// 测试 6：new 绑定
function Person(name) {
    this.name = name;
}
let person = new Person("Peng");
console.log(person.name);  // "Peng"
```

---

## 容易混淆的地方

1. **this 是调用时绑定的** — 不是定义时绑定的
2. **箭头函数没有自己的 this** — 继承外层作用域的 this
3. **隐式绑定会丢失** — 赋值给变量后调用，this 指向 window
4. **严格模式下默认绑定是 undefined** — 不是 window

---

## 实际开发中的应用

```javascript
// Vue 2 中的 this
export default {
    data() {
        return {
            name: "Peng"
        };
    },
    methods: {
        sayHello() {
            // this 指向组件实例
            console.log(`Hello, I'm ${this.name}`);
        }
    }
};

// Vue 3 组合式 API 中的 this
// 在 setup() 中没有 this，需要使用 ref、reactive
```

---

## 下一步

学完这个知识点后，你可以：

1. 在你的 QuickLauncher 项目中查看 Vue 组件中的 this 指向
2. 下一个知识点：**闭包** — 理解函数如何捕获外部变量
