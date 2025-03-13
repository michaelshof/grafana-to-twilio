interface Contact {
  phone_number: string
  timeout?: number
}
type Contacts = Record<string, Contact>

type ContactGroup = Array<string>
type ContactGroups = Record<string, ContactGroup>

export { Contact, Contacts, ContactGroups, ContactGroup }
