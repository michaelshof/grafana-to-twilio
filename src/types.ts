interface Contact {
  phone_number: string
  timeout?: number
}
type Contacts = Record<string, Contact>

type ContactGroup = Array<string>
type ContactGroups = Record<string, ContactGroup>

interface FilePaths {
  contacts: string
  contact_groups: string
  twiml_ejs: string
}

interface HttpdConfig {
  bearer_token: string
  port: number
  rate_window_call: number
  rate_limit_call: number
}

interface TwilioConfig {
  account_sid: string
  auth_token: string
  log_level: string
  phone_number: string
  timeout: number
}

export { Contact, Contacts, ContactGroups, ContactGroup, FilePaths, HttpdConfig, TwilioConfig }
