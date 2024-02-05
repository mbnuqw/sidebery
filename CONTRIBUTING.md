# Contributing

Thank you for your interest in contributing to this project! Here you can find options to help maintain and develop Sidebery.


## Discussions

You can ask/answer a question or start a general discussion related to Sidebery.


## Issues

You can open an issue to report a bug or request a feature. Note that the more detailed you describe the steps to reproduce the bug (even if you think they are obvious), the faster I can reproduce it and fix it.


## Pull Requests

You can open a PR to fix a bug, change/create translation or add a new feature. A PR that address multiple bugs/feature requests at once will be closed. It may take some time to review changes, so thank you in advance for your patience.

### Translations

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


## Donate

You can also [donate to this project](./DONATE.md).
