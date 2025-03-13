import dotenv from 'dotenv'
import express from 'express'

dotenv.config()

const httpd_port = process.env.HTTPD_PORT || 3000
const httpd = express()

httpd.post('/call/contact/:id', (request, response) => {
  response.json({ message: 'Hello World' })
})

httpd.post('/call/contact_group/:id', (request, response) => {
  response.json({ message: 'Hello World' })
})

const httpd_listener = httpd.listen(httpd_port, () => {
  console.log('HTTPD:', `Listening on port ${httpd_port}`)
})

process.on('SIGINT', () => {
  const promises: Array<Promise<boolean>> = []

  if (httpd_listener) {
    const httpd_promise = new Promise<boolean>((resolve) => {
      httpd_listener.close(() => {
        console.log('HTTPD:', 'Socket closed')
      })
      resolve(true)
    })
    promises.push(httpd_promise)
  }

  Promise.all(promises)
    .then(() => {
      process.exit(0)
    })
})
