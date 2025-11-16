import { Google, Logs } from './_services'

export interface GDOutputFile extends GDFile {
  kind?: string
  size?: string
  fileExtension?: string
}

interface GDFile {
  id?: string
  name?: string
  originalFilename?: string
  properties?: Record<string, string>
  appProperties?: Record<string, string>
  createdTime?: string
  modifiedTime?: string
  parents?: string[]
  mimeType?: string
  copyRequiresWriterPermission?: true
}

interface ListResponse {
  nextPageToken?: string
  kind: string
  incompleteSearch: boolean
  files: GDOutputFile[]
}

///
/// List files
///
/// https://developers.google.com/drive/api/reference/rest/v3/files/list

const LIST_URL = 'https://www.googleapis.com/drive/v3/files'
const LIST_METHOD = 'GET'

export interface ListFilesOpts {
  orderBy?: 'name' | 'name_natural' | 'createdTime' | 'modifiedTime' | 'recency'
  q?: string
  fields?: (keyof GDOutputFile)[]
}

export async function listFiles(opts: ListFilesOpts): Promise<GDOutputFile[] | null> {
  Logs.info('Google.Drive.listFiles():', opts)

  // Check access token
  if (!Google.accessToken) await Google.loadAccessToken()
  if (!Google.accessToken) {
    Logs.err('Google.Drive.listFiles(): No accessToken')
    return null
  }

  // Prepare URL
  const url = new URL(LIST_URL)
  const defaultFields = 'files(id,name,kind,mimeType,size,modifiedTime,appProperties)'
  url.searchParams.set('corpora', 'user')
  url.searchParams.set('includeItemsFromAllDrives', 'false')
  if (opts.orderBy) url.searchParams.set('orderBy', opts.orderBy)
  else url.searchParams.set('orderBy', 'name_natural')
  url.searchParams.set('pageSize', '1000')
  if (opts.q) url.searchParams.set('q', opts.q)
  url.searchParams.set('spaces', 'appDataFolder')
  url.searchParams.set('supportsAllDrives', 'false')
  url.searchParams.set('includeLabels', 'false')
  if (opts.fields) url.searchParams.set('fields', `files(${opts.fields.join(',')})`)
  else url.searchParams.set('fields', defaultFields)
  const urlStr = url.toString()

  // Send request
  const response = await fetch(urlStr, {
    method: LIST_METHOD,
    headers: {
      Authorization: `Bearer ${Google.accessToken}`,
    },
  })
  if (!response.ok) {
    Logs.err('Google.Drive.listFiles(): Cannot fetch(1):', url.toString())
    Logs.err('Google.Drive.listFiles(): Cannot fetch(2):', response)
    return null
  }

  // Parse response
  let responseObject: ListResponse
  try {
    responseObject = await response.json()
  } catch (err) {
    Logs.err('Google.Drive.listFiles(): Cannot parse output json', err)
    return null
  }

  return responseObject.files
}

///
/// Create file
///
/// https://developers.google.com/drive/api/reference/rest/v3/files/create
/// https://developers.google.com/drive/api/guides/manage-uploads#multipart

const CREATE_URL = 'https://www.googleapis.com/upload/drive/v3/files'
const CREATE_METHOD = 'POST'

export interface CreateFileOpts {
  name: string
  content: any
  appProperties?: Record<string, string>
  fields?: (keyof GDOutputFile)[]
}

function createMultipartBody(boundary: string, metadata: GDFile, content: Blob): Blob {
  return new Blob([
    `
--${boundary}
Content-Type: application/json; charset=utf-8

${JSON.stringify(metadata)}
--${boundary}
Content-Type: ${content.type}; charset=utf-8

`,
    content,
    `\n--${boundary}--\n`,
  ])
}

export async function createJsonFile(opts: CreateFileOpts): Promise<GDOutputFile | null> {
  Logs.info('Google.Drive.createJsonFile():', opts)

  // Check access token
  if (!Google.accessToken) await Google.loadAccessToken()
  if (!Google.accessToken) {
    Logs.err('Google.Drive.createJsonFile(): No accessToken')
    return null
  }

  // Prepare URL
  const url = new URL(CREATE_URL)
  const defaultFields = 'id,modifiedTime'
  url.searchParams.set('uploadType', 'multipart')
  url.searchParams.set('useContentAsIndexableText', 'false')
  if (opts.fields) url.searchParams.set('fields', opts.fields.join(','))
  else url.searchParams.set('fields', defaultFields)

  // Generate boundary string
  const boundaryStr = Math.random().toString(16).slice(2)

  // Prepare metadata
  const metadata: GDFile = {
    name: opts.name,
    parents: ['appDataFolder'],
  }
  if (opts.appProperties) {
    metadata.appProperties = opts.appProperties
  }

  // Prepare content
  const jsonContent = JSON.stringify(opts.content)
  const file = new File([jsonContent], opts.name, { type: 'application/json' })

  // Prepare body
  const multipartBody = createMultipartBody(boundaryStr, metadata, file)

  // Send request
  const response = await fetch(url.toString(), {
    method: CREATE_METHOD,
    headers: {
      Authorization: `Bearer ${Google.accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundaryStr}`,
      'Content-Length': `${multipartBody.size}`,
    },
    body: multipartBody,
  })
  if (!response.ok) {
    Logs.err('Google.Drive.createJsonFile(): Cannot fetch(1):', url.toString())
    Logs.err('Google.Drive.createJsonFile(): Cannot fetch(2):', response)
    return null
  }

  // Parse response
  let responseObject: GDOutputFile
  try {
    responseObject = await response.json()
  } catch (err) {
    Logs.err('Google.Drive.createJsonFile(): Cannot parse output json', err)
    return null
  }

  return responseObject
}

///
/// Get file
///
/// https://developers.google.com/drive/api/reference/rest/v3/files/get

const GET_URL = (id: string) => `https://www.googleapis.com/drive/v3/files/${id}`
const GET_METHOD = 'GET'

export async function getJsonFile<T>(fileId: string): Promise<T | null> {
  Logs.info('Google.Drive.getJsonFile():', fileId)

  // Check access token
  if (!Google.accessToken) await Google.loadAccessToken()
  if (!Google.accessToken) {
    Logs.err('Google.Drive.getJsonFile(): No accessToken')
    return null
  }

  // Prepare URL
  const url = new URL(GET_URL(fileId))
  url.searchParams.set('alt', 'media')
  url.searchParams.set('acknowledgeAbuse', 'true')

  // Send request
  const response = await fetch(url.toString(), {
    method: GET_METHOD,
    headers: {
      Authorization: `Bearer ${Google.accessToken}`,
    },
  })
  if (!response.ok) {
    Logs.err('Google.Drive.getJsonFile(): Cannot fetch(1):', url.toString())
    Logs.err('Google.Drive.getJsonFile(): Cannot fetch(2):', response)
    return null
  }

  // Parse response
  let responseObject: T
  try {
    responseObject = await response.json()
  } catch (err) {
    Logs.err('Google.Drive.getJsonFile(): Cannot parse output json', err)
    return null
  }

  return responseObject
}

///
/// Update file
///
/// https://developers.google.com/drive/api/reference/rest/v3/files/update

export interface UpdFileOpts {
  fileId: string
  name?: string
  appProperties?: Record<string, string>
  content?: any
  fields?: (keyof GDOutputFile)[]
}

const UPD_FILE_URL = (id: string) => `https://www.googleapis.com/upload/drive/v3/files/${id}`
const UPD_METADATA_URL = (id: string) => `https://www.googleapis.com/drive/v3/files/${id}`
const UPD_METHOD = 'PATCH'

export async function updateJsonFile(opts: UpdFileOpts): Promise<GDOutputFile | null> {
  Logs.info('Google.Drive.updateJsonFile():', opts)

  // Check access token
  if (!Google.accessToken) await Google.loadAccessToken()
  if (!Google.accessToken) {
    Logs.err('Google.Drive.updateJsonFile(): No accessToken')
    return null
  }

  // Set the type of request
  const updContent = opts.content !== undefined
  const updMetadata = opts.name !== undefined || opts.appProperties !== undefined
  const updAll = updContent && updMetadata
  Logs.info('Google.Drive.updateJsonFile(): updContent:', updContent)
  Logs.info('Google.Drive.updateJsonFile(): updMetadata:', updMetadata)

  // Prepare URL
  let url
  if (updAll || updContent) {
    url = new URL(UPD_FILE_URL(opts.fileId))
    if (updAll) url.searchParams.set('uploadType', 'multipart')
    else url.searchParams.set('uploadType', 'media')
  } else {
    url = new URL(UPD_METADATA_URL(opts.fileId))
  }
  const defaultFields = 'modifiedTime'
  if (opts.fields) url.searchParams.set('fields', opts.fields.join(','))
  else url.searchParams.set('fields', defaultFields)

  let contentBlob: Blob | undefined
  if (updContent) {
    const jsonContent = JSON.stringify(opts.content)
    contentBlob = new Blob([jsonContent], { type: 'application/json' })
  }

  let metadata: GDFile | undefined
  if (updMetadata) {
    metadata = {}
    if (opts.name) metadata.name = opts.name
    if (opts.appProperties) metadata.appProperties = opts.appProperties
  }

  let body: Blob
  let boundaryStr: string | undefined
  if (contentBlob && metadata) {
    boundaryStr = Math.random().toString(16).slice(2)
    body = createMultipartBody(boundaryStr, metadata, contentBlob)
  } else {
    body = contentBlob || new Blob([JSON.stringify(metadata)])
  }

  if (!body) {
    Logs.err('Google.Drive.updateJsonFile(): Nothing to update:', opts)
    return null
  }

  // Send request
  let contentType
  if (updAll) contentType = `multipart/related; boundary=${boundaryStr}`
  else contentType = 'application/json; charset=utf-8'
  const response = await fetch(url.toString(), {
    method: UPD_METHOD,
    headers: {
      Authorization: `Bearer ${Google.accessToken}`,
      'Content-Type': contentType,
      'Content-Length': `${body.size}`,
    },
    body: body,
  })
  if (!response.ok) {
    Logs.err('Google.Drive.updateJsonFile(): Cannot fetch(1):', url.toString())
    Logs.err('Google.Drive.updateJsonFile(): Cannot fetch(2):', response)
    throw response.status
  }

  // Parse response
  let responseObject: GDOutputFile
  try {
    responseObject = await response.json()
  } catch (err) {
    Logs.err('Google.Drive.updateJsonFile(): Cannot parse output json', err)
    return null
  }

  if (!responseObject.id) responseObject.id = opts.fileId

  return responseObject
}

///
/// Delete file
///
/// https://developers.google.com/drive/api/reference/rest/v3/files/delete

const DEL_URL = (fileId: string) => `https://www.googleapis.com/drive/v3/files/${fileId}`
const DEL_METHOD = 'DELETE'

export async function deleteFile(fileId: string): Promise<boolean> {
  Logs.info('Google.Drive.deleteFile():', fileId)

  // Check access token
  if (!Google.accessToken) await Google.loadAccessToken()
  if (!Google.accessToken) {
    Logs.err('Google.Drive.deleteFile(): No accessToken')
    return false
  }

  // Prepare URL
  const url = new URL(DEL_URL(fileId))

  // Send request
  const response = await fetch(url.toString(), {
    method: DEL_METHOD,
    headers: {
      Authorization: `Bearer ${Google.accessToken}`,
    },
  })
  if (!response.ok) {
    Logs.err('Google.Drive.deleteFile(): Cannot fetch(1):', url.toString())
    Logs.err('Google.Drive.deleteFile(): Cannot fetch(2):', response)
    throw response.status
  }

  return true
}
