# Contributing

Thank you for your interest in contributing to this project!

## Translations

To edit/add translation:
- Open a dictionary file in `https://github.com/mbnuqw/sidebery/blob/v5/src/_locales`
- Click on a pencil icon to edit the file.
- Make some changes, e.g.:
  ```ts
  // Edit string value
  'some.label.id': {
    en: 'Value to edit',
  },

  // Edit translation with the countable value in context
  'some.label.id': {
    en: n => (n === 1 ? 'One' : 'Not one'),
  },
  'some.label.id': {
    en: n => {
      if (n === 0) return 'None'
      if (n < 5) return 'Less than five'
      if (n === 5) return 'Five'
      return 'More than five'
    },
  }

  // Add new translations
  'some.label.id': {
    en: 'Color',
    en_GB: 'Colour',
    fr: 'Couleur',
  },
  ```
- Create pull request.

All languages are optional and the fallback mechanism is (if user has the `pt_BR` UI language):  
`pt_BR` > `pt` > `en` > `label ID`.
