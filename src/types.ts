interface Contact {
  phone_number: string
}
type Contacts = Record<string, Contact>

type ContactGroup = Array<string>
type ContactGroups = Record<string, ContactGroup>

export { Contacts, ContactGroups }
