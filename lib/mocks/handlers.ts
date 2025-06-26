import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'https://api.chunsik.site'

// Mock data
const mockUsers = [
  {
    userSeq: 1,
    name: 'TestUser1',
    level: 50,
    power: 1000000,
    userGrade: 'L1',
    leave: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userSeq: 2,
    name: 'TestUser2',
    level: 45,
    power: 800000,
    userGrade: 'E1',
    leave: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockDeserts = [
  {
    id: 1,
    name: 'Test Desert 1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Test Desert 2', 
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const handlers = [
  // User endpoints
  http.get(`${API_BASE_URL}/users`, () => {
    return HttpResponse.json({
      content: mockUsers,
      totalElements: mockUsers.length,
      totalPages: 1,
      size: 20,
      number: 0,
    })
  }),

  http.get(`${API_BASE_URL}/users/:id`, ({ params }) => {
    const { id } = params
    const user = mockUsers.find(u => u.userSeq === Number(id))
    
    if (!user) {
      return new HttpResponse(null, { status: 404 })
    }
    
    return HttpResponse.json(user)
  }),

  http.post(`${API_BASE_URL}/users`, async ({ request }) => {
    const newUser = await request.json() as any
    const user = {
      userSeq: mockUsers.length + 1,
      ...newUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockUsers.push(user)
    return HttpResponse.json(user, { status: 201 })
  }),

  http.put(`${API_BASE_URL}/users/:id`, async ({ params, request }) => {
    const { id } = params
    const updatedData = await request.json() as any
    const userIndex = mockUsers.findIndex(u => u.userSeq === Number(id))
    
    if (userIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...updatedData,
      updatedAt: new Date().toISOString(),
    }
    
    return HttpResponse.json(mockUsers[userIndex])
  }),

  http.delete(`${API_BASE_URL}/users/:id`, ({ params }) => {
    const { id } = params
    const userIndex = mockUsers.findIndex(u => u.userSeq === Number(id))
    
    if (userIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    
    mockUsers.splice(userIndex, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // Desert endpoints
  http.get(`${API_BASE_URL}/deserts`, () => {
    return HttpResponse.json({
      content: mockDeserts,
      totalElements: mockDeserts.length,
      totalPages: 1,
      size: 20,
      number: 0,
    })
  }),

  http.get(`${API_BASE_URL}/deserts/:id`, ({ params }) => {
    const { id } = params
    const desert = mockDeserts.find(d => d.id === Number(id))
    
    if (!desert) {
      return new HttpResponse(null, { status: 404 })
    }
    
    return HttpResponse.json(desert)
  }),

  // Health check endpoint
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({ status: 'OK', timestamp: new Date().toISOString() })
  }),

  // Error simulation endpoints for testing
  http.get(`${API_BASE_URL}/test/500`, () => {
    return new HttpResponse(null, { status: 500 })
  }),

  http.get(`${API_BASE_URL}/test/404`, () => {
    return new HttpResponse(null, { status: 404 })
  }),
]