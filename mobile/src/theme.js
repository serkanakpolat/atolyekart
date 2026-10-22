import { useColorScheme } from 'react-native'

// Web'deki src/index.css değişkenleriyle aynı palet (BizCard sarı/siyah).
const light = {
  bg: '#F4F4F4',
  card: '#FFFFFF',
  ink: '#0A0A0A',
  muted: '#4A4A4A',
  line: '#E4E4E4',
  primary: '#FCDB66',
  onPrimary: '#0A0A0A',
  primaryPressed: '#F5CC3F',
  mat: '#F6F1E7',
  frame: '#5A3C22',
  danger: '#B3261E',
}

const dark = {
  ...light,
  bg: '#000000',
  card: '#0A0A0A',
  ink: '#F4F4F4',
  muted: '#B5B5B5',
  line: '#2A2A2A',
  mat: '#E9E1D2',
  danger: '#F2857C',
}

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light
}

export const SERIF = 'serif'
