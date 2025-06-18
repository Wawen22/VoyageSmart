// Basic utility functions tests
describe('Basic Utilities', () => {
  describe('String utilities', () => {
    it('should handle string operations', () => {
      const testString = 'Hello World'
      expect(testString.toLowerCase()).toBe('hello world')
      expect(testString.toUpperCase()).toBe('HELLO WORLD')
      expect(testString.length).toBe(11)
    })

    it('should handle empty strings', () => {
      const emptyString = ''
      expect(emptyString.length).toBe(0)
      expect(emptyString.trim()).toBe('')
    })
  })

  describe('Array utilities', () => {
    it('should handle array operations', () => {
      const testArray = [1, 2, 3, 4, 5]
      expect(testArray.length).toBe(5)
      expect(testArray.includes(3)).toBe(true)
      expect(testArray.includes(6)).toBe(false)
    })

    it('should handle array filtering', () => {
      const numbers = [1, 2, 3, 4, 5, 6]
      const evenNumbers = numbers.filter(n => n % 2 === 0)
      expect(evenNumbers).toEqual([2, 4, 6])
    })

    it('should handle array mapping', () => {
      const numbers = [1, 2, 3]
      const doubled = numbers.map(n => n * 2)
      expect(doubled).toEqual([2, 4, 6])
    })
  })

  describe('Object utilities', () => {
    it('should handle object operations', () => {
      const testObject = { name: 'John', age: 30 }
      expect(Object.keys(testObject)).toEqual(['name', 'age'])
      expect(Object.values(testObject)).toEqual(['John', 30])
    })

    it('should handle object merging', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { c: 3, d: 4 }
      const merged = { ...obj1, ...obj2 }
      expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4 })
    })
  })

  describe('Date utilities', () => {
    it('should handle date operations', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0) // January is 0
      expect(date.getDate()).toBe(1)
    })

    it('should handle date formatting', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      const isoString = date.toISOString()
      expect(isoString).toBe('2024-01-01T00:00:00.000Z')
    })
  })

  describe('Number utilities', () => {
    it('should handle number operations', () => {
      expect(Math.round(3.7)).toBe(4)
      expect(Math.floor(3.7)).toBe(3)
      expect(Math.ceil(3.2)).toBe(4)
    })

    it('should handle number validation', () => {
      expect(Number.isInteger(5)).toBe(true)
      expect(Number.isInteger(5.5)).toBe(false)
      expect(Number.isNaN(NaN)).toBe(true)
      expect(Number.isNaN(5)).toBe(false)
    })
  })

  describe('Boolean utilities', () => {
    it('should handle boolean operations', () => {
      expect(true && true).toBe(true)
      expect(true && false).toBe(false)
      expect(true || false).toBe(true)
      expect(false || false).toBe(false)
    })

    it('should handle truthy/falsy values', () => {
      expect(Boolean('')).toBe(false)
      expect(Boolean('hello')).toBe(true)
      expect(Boolean(0)).toBe(false)
      expect(Boolean(1)).toBe(true)
      expect(Boolean(null)).toBe(false)
      expect(Boolean(undefined)).toBe(false)
    })
  })

  describe('Type checking', () => {
    it('should check types correctly', () => {
      expect(typeof 'string').toBe('string')
      expect(typeof 123).toBe('number')
      expect(typeof true).toBe('boolean')
      expect(typeof {}).toBe('object')
      expect(typeof []).toBe('object')
      expect(Array.isArray([])).toBe(true)
      expect(Array.isArray({})).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle errors correctly', () => {
      expect(() => {
        throw new Error('Test error')
      }).toThrow('Test error')
    })

    it('should handle try-catch', () => {
      let result
      try {
        result = 'success'
      } catch (error) {
        result = 'error'
      }
      expect(result).toBe('success')
    })
  })

  describe('Async operations', () => {
    it('should handle promises', async () => {
      const promise = Promise.resolve('resolved')
      const result = await promise
      expect(result).toBe('resolved')
    })

    it('should handle promise rejection', async () => {
      const promise = Promise.reject(new Error('rejected'))
      await expect(promise).rejects.toThrow('rejected')
    })

    it('should handle setTimeout with promises', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
      const start = Date.now()
      await delay(10)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(10)
    })
  })

  describe('JSON operations', () => {
    it('should handle JSON stringify and parse', () => {
      const obj = { name: 'John', age: 30 }
      const json = JSON.stringify(obj)
      const parsed = JSON.parse(json)
      expect(parsed).toEqual(obj)
    })

    it('should handle invalid JSON', () => {
      expect(() => {
        JSON.parse('invalid json')
      }).toThrow()
    })
  })

  describe('Regular expressions', () => {
    it('should handle regex matching', () => {
      const email = 'test@example.com'
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      expect(emailRegex.test(email)).toBe(true)
      expect(emailRegex.test('invalid-email')).toBe(false)
    })

    it('should handle regex replacement', () => {
      const text = 'Hello World'
      const replaced = text.replace(/World/, 'Universe')
      expect(replaced).toBe('Hello Universe')
    })
  })
})
