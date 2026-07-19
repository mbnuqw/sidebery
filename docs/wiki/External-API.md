# External API

Sidebery exposes a versioned WebExtension API for integrations that need its panel and tab-tree model. Requests use Firefox's `runtime.sendMessage(extensionId, message)` API and must include the Firefox window whose Sidebery sidebar should handle the request.

Sidebery's published extension ID is `{3c078156-979c-498b-8990-85f7987dd929}`.

```js
const { id: windowId } = await browser.windows.getCurrent()
const response = await browser.runtime.sendMessage('{3c078156-979c-498b-8990-85f7987dd929}', {
  type: 'sidebery-api',
  version: 1,
  method: 'get-state',
  windowId,
})

if (!response.ok) throw new Error(`${response.error.code}: ${response.error.message}`)
```

The API deliberately returns structural state only. Use Firefox's `tabs` API for native tab properties such as URL and title, joining records by tab ID.

## Methods

### `get-state`

Returns the active panel, all panels, and every tab's panel and tree position. Tab records include `parentId`, `ancestorIds`, `childIds`, `level`, `folded`, and group flags.

### `move-tabs`

Moves tabs and their descendants. `params.tabIds` is required. The destination may include `panelId`, `parentId`, `beforeTabId`, or `afterTabId`. Set `parentId` to `null` to place tabs at the tree root.

```js
params: { tabIds: [12], panelId: 'work', parentId: 8 }
```

### `create-group`

Creates a Sidebery group around tabs in one panel.

```js
params: { tabIds: [12, 15], title: 'Research' }
```

### `remove-group`

Removes a group tab while preserving its descendants, promoting them to the group's parent.

```js
params: {
  groupTabId: 18
}
```

### `rename-group`

Renames a group tab.

```js
params: { groupTabId: 18, title: 'References' }
```

### `flatten-tabs`

Removes tabs from their current parent while preserving their order.

```js
params: {
  tabIds: [12, 15]
}
```

## Responses

Every response includes `type: "sidebery-api"`, `version: 1`, and either `{ ok: true, result }` or `{ ok: false, error: { code, message } }`. Callers should treat unknown fields as forward-compatible additions and reject API versions they do not understand.
