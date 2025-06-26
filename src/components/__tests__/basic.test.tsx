// src/components/__tests__/basic.test.tsx - Basic Component Test
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Basic component for testing
const TestComponent = ({ title }: { title: string }) => (
  <View testID="test-component">
    <Text testID="test-title">{title}</Text>
  </View>
);

describe('Basic Component Tests', () => {
  it('should render test component correctly', () => {
    const { getByTestId } = render(<TestComponent title="Test Title" />);
    
    expect(getByTestId('test-component')).toBeTruthy();
    expect(getByTestId('test-title')).toBeTruthy();
  });

  it('should display the correct title', () => {
    const { getByTestId } = render(<TestComponent title="Hello World" />);
    
    const titleElement = getByTestId('test-title');
    expect(titleElement.props.children).toBe('Hello World');
  });
});