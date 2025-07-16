import { renderHook, act } from '@testing-library/react';
import { useTheme, themes } from '@/hooks/useTheme';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock document.documentElement
const mockDocumentElement = {
  style: {
    setProperty: jest.fn()
  },
  setAttribute: jest.fn()
};

Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement
});

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default theme', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.currentTheme).toBe('default');
  });

  it('loads saved theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('ocean');
    
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.currentTheme).toBe('ocean');
  });

  it('changes theme correctly', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.changeTheme('forest');
    });
    
    expect(result.current.currentTheme).toBe('forest');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('dashboard-theme', 'forest');
  });

  it('applies CSS custom properties when changing theme', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.changeTheme('sunset');
    });
    
    // Check that CSS custom properties are set
    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--primary',
      themes.sunset.colors.primary
    );
    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--primary-foreground',
      themes.sunset.colors.primaryForeground
    );
  });

  it('sets data-theme attribute on document element', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.changeTheme('midnight');
    });
    
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'midnight');
  });

  it('returns current theme config correctly', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.changeTheme('lavender');
    });
    
    const currentConfig = result.current.getCurrentThemeConfig();
    expect(currentConfig).toEqual(themes.lavender);
  });

  it('provides access to all themes', () => {
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.themes).toEqual(themes);
  });

  it('handles invalid theme from localStorage gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme');
    
    const { result } = renderHook(() => useTheme());
    
    // Should fall back to default theme
    expect(result.current.currentTheme).toBe('default');
  });

  it('applies theme on mount when saved theme exists', () => {
    localStorageMock.getItem.mockReturnValue('ocean');
    
    renderHook(() => useTheme());
    
    // Should apply ocean theme CSS properties
    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--primary',
      themes.ocean.colors.primary
    );
  });

  it('converts camelCase to kebab-case for CSS variables', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.changeTheme('default');
    });
    
    // primaryForeground should become --primary-foreground
    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--primary-foreground',
      themes.default.colors.primaryForeground
    );
  });

  it('maintains theme state across re-renders', () => {
    const { result, rerender } = renderHook(() => useTheme());
    
    act(() => {
      result.current.changeTheme('forest');
    });
    
    rerender();
    
    expect(result.current.currentTheme).toBe('forest');
  });
});
