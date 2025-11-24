import React from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Horizon UI inspired theme
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      500: '#319795',
      600: '#2C7A7B',
    },
    horizon: {
      blue: {
        500: '#4318FF',
        600: '#3311DB',
      },
      green: {
        500: '#01B574',
      },
      red: {
        500: '#E31A1A',
      },
      orange: {
        500: '#FFB547',
      },
    }
  },
  fonts: {
    heading: '"DM Sans", sans-serif',
    body: '"DM Sans", sans-serif',
  },
});

interface ModernChakraProviderProps {
  children: React.ReactNode;
}

export const ModernChakraProvider: React.FC<ModernChakraProviderProps> = ({ children }) => {
  return (
    <ChakraProvider theme={theme}>
      {children}
    </ChakraProvider>
  );
};