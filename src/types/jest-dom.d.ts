/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R
      toHaveStyle(css: string | Record<string, any>): R
      toHaveClass(...classNames: string[]): R
      toBeVisible(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toBeEmpty(): R
      toBeEmptyDOMElement(): R
      toBeInvalid(): R
      toBeRequired(): R
      toBeValid(): R
      toContainElement(element: HTMLElement | null): R
      toContainHTML(html: string): R
      toHaveAccessibleDescription(description?: string | RegExp): R
      toHaveAccessibleName(name?: string | RegExp): R
      toHaveAttribute(attr: string, value?: string | RegExp): R
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R
      toHaveFocus(): R
      toHaveFormValues(values: Record<string, any>): R
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R
      toHaveValue(value?: string | string[] | number): R
      toBeChecked(): R
      toBePartiallyChecked(): R
      toHaveErrorMessage(message?: string | RegExp): R
    }
  }
}

