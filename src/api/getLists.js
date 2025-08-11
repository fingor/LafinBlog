
export function getLists(params) {
  return fetch('/ts/lists', { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
}
    