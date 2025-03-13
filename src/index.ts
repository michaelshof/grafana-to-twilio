import dotenv from 'dotenv'
import express from 'express'
import twilioSDK from 'twilio'

dotenv.config()

const httpd_config = {
  port: process.env.HTTPD_PORT ? parseInt(process.env.HTTPD_PORT) : 3000,
}

const httpd_port = httpd_config.port
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

const twilio_config = {
  account_sid: process.env.TWILIO_ACCOUNT_SID || '',
  auth_token: process.env.TWILIO_AUTH_TOKEN || '',
  log_level: 'debug',
}
const twilio_client = twilioSDK(twilio_config.account_sid, twilio_config.auth_token, {
  logLevel: twilio_config.log_level,
})

const twilio_balance = twilio_client.balance
console.log('TWILIO:', 'Account Balance:', twilio_balance)

process.on('SIGINT', () => {
  const promises: Array<Promise<boolean>> = []
  console.log('')
  console.log('SIGINT:', 'Processing signal')

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
