export interface ListsParams {
  page: number
  pageSize: number
}

export function getLists(params: ListsParams) {
  return fetch('/ts/lists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
}
