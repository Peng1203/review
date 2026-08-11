import fastify from 'fastify'
import fc from '@fastify/cors'

const app = fastify()

app.register(fc, { origin: true, allowedHeaders: '*' })

app.get('/', async (request, reply) => {
  console.log(' 请求来了 ------')
  reply.header('Connection', 'close')

  await new Promise(resolve => {
    setTimeout(resolve, 3000)
  })
  reply.send('hello')
})

app.listen({
  port: 3000,
  host: '0.0.0.0',
})
