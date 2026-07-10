'use strict'
var name = 'window'

const obj={
 name:'obj',

 say(){

   console.log(this.name)

   function inner(){
     console.log(this.name)
   }

   inner()
 }
}

obj.say()