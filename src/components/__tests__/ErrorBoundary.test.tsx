import React from 'react'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary, APIErrorBoundary, FormErrorBoundary } from '../ErrorBoundary'

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Mock console.error to avoid noise in test output
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ErrorBoundary Component', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should render error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument()
    })

    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })

    it('should call onError callback when error occurs', () => {
      const onErrorMock = jest.fn()

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Error Details (Development):')).toBeInTheDocument()
      expect(screen.getByText('Test error')).toBeInTheDocument()

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })

    it('should not show error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Error Details (Development):')).not.toBeInTheDocument()

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })
  })

  describe('APIErrorBoundary Component', () => {
    it('should render children when there is no error', () => {
      render(
        <APIErrorBoundary>
          <ThrowError shouldThrow={false} />
        </APIErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should render API-specific error UI when child component throws', () => {
      render(
        <APIErrorBoundary>
          <ThrowError shouldThrow={true} />
        </APIErrorBoundary>
      )

      expect(screen.getByText('Failed to load data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    })
  })

  describe('FormErrorBoundary Component', () => {
    it('should render children when there is no error', () => {
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={false} />
        </FormErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should render form-specific error UI when child component throws', () => {
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      )

      expect(screen.getByText(/There was an error with this form/)).toBeInTheDocument()
      expect(screen.getByText(/Please refresh the page and try again/)).toBeInTheDocument()
    })
  })

  describe('Error Recovery', () => {
    it('should reset error state when retry button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Error UI should be visible
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i })
      retryButton.click()

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      // Should show normal content again
      expect(screen.getByText('No error')).toBeInTheDocument()
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('Error Logging', () => {
    it('should log errors to console in development', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })

    it('should log errors for production monitoring', () => {
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(console.error).toHaveBeenCalledWith(
        'Production error:',
        expect.objectContaining({
          error: 'Test error',
          timestamp: expect.any(String)
        })
      )

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      })
    })
  })
})
