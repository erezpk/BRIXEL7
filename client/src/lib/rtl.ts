export const RTL_CLASSES = {
  // Margin and padding
  mr: 'ml',
  ml: 'mr',
  pr: 'pl',
  pl: 'pr',
  'mr-auto': 'ml-auto',
  'ml-auto': 'mr-auto',
  
  // Text alignment
  'text-left': 'text-right',
  'text-right': 'text-left',
  
  // Borders
  'border-l': 'border-r',
  'border-r': 'border-l',
  'border-l-2': 'border-r-2',
  'border-r-2': 'border-l-2',
  'border-l-4': 'border-r-4',
  'border-r-4': 'border-l-4',
  
  // Positioning
  left: 'right',
  right: 'left',
  'left-0': 'right-0',
  'right-0': 'left-0',
  'left-2': 'right-2',
  'right-2': 'left-2',
  'left-4': 'right-4',
  'right-4': 'left-4',
  
  // Rounded corners
  'rounded-l': 'rounded-r',
  'rounded-r': 'rounded-l',
  'rounded-tl': 'rounded-tr',
  'rounded-tr': 'rounded-tl',
  'rounded-bl': 'rounded-br',
  'rounded-br': 'rounded-bl',
} as const;

export function rtlClass(className: string): string {
  return RTL_CLASSES[className as keyof typeof RTL_CLASSES] || className;
}

export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}
