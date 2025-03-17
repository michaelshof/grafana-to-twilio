
const file_paths = {
  contacts: process.env.CONTACTS_FILE_PATH || './contacts.json',
  contact_groups: process.env.CONTACT_GROUPS_FILE_PATH || './contact_groups.json',
  twiml_ejs: process.env.TWIML_FILE_PATH || './twiml.xml.ejs',
}

const httpd_config = {
  port: process.env.HTTPD_PORT ? parseInt(process.env.HTTPD_PORT) : 3000,
  rate_window_call: process.env.HTTPD_RATE_WINDOW_CALL ? parseInt(process.env.HTTPD_RATE_WINDOW_CALL) : 1 * 60 * 1000,
  rate_limit_call: process.env.HTTPD_RATE_LIMIT_CALL ? parseInt(process.env.HTTPD_RATE_LIMIT_CALL) : 10,
}

const twilio_config = {
  account_sid: process.env.TWILIO_ACCOUNT_SID || '',
  auth_token: process.env.TWILIO_AUTH_TOKEN || '',
  log_level: process.env.TWILIO_LOG_LEVEL || 'debug',
  phone_number: process.env.TWILIO_PHONE_NUMBER || '',
  timeout: (process.env.TWILIO_TIMEOUT) ? parseInt(process.env.TWILIO_TIMEOUT) : 30,
}


export default { file_paths, httpd_config, twilio_config }
export { file_paths,httpd_config, twilio_config }
