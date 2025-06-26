import { fetchFromAPI, buildQueryString } from '@/lib/api-service'

// Mock fetch for API tests
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('fetchFromAPI', () => {
    it('should fetch data successfully', async () => {
      const mockData = { message: 'Success' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      })

      const result = await fetchFromAPI('/test')
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.chunsik.site/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found' }),
      })

      await expect(fetchFromAPI('/not-found')).rejects.toThrow('Resource not found')
    })

    it('should handle 500 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      })

      await expect(fetchFromAPI('/server-error')).rejects.toThrow('API 요청 실패: 500')
    })

    it('should handle 204 No Content responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      })

      const result = await fetchFromAPI('/delete', { method: 'DELETE' })
      expect(result).toEqual({})
    })

    it('should include custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      })

      await fetchFromAPI('/test-headers', {
        headers: {
          'Authorization': 'Bearer token123',
          'Custom-Header': 'custom-value'
        }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.chunsik.site/test-headers',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token123',
            'Custom-Header': 'custom-value',
          }),
        })
      )
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(fetchFromAPI('/network-error')).rejects.toThrow('API 요청 중 오류 발생: Network error')
    })
  })

  describe('buildQueryString', () => {
    it('should build query string from params', () => {
      const params = {
        page: 1,
        size: 10,
        search: 'test'
      }
      
      const result = buildQueryString(params)
      expect(result).toBe('?page=1&size=10&search=test')
    })

    it('should filter out undefined, null, and empty values', () => {
      const params = {
        page: 1,
        search: '',
        filter: null,
        sort: undefined,
        active: true
      }
      
      const result = buildQueryString(params)
      expect(result).toBe('?page=1&active=true')
    })

    it('should return empty string for empty params', () => {
      const result = buildQueryString({})
      expect(result).toBe('')
    })

    it('should encode special characters', () => {
      const params = {
        search: 'test search with spaces',
        filter: 'name=John&age=30'
      }
      
      const result = buildQueryString(params)
      expect(result).toBe('?search=test%20search%20with%20spaces&filter=name%3DJohn%26age%3D30')
    })
  })
})