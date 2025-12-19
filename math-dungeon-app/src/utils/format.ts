export const formatTemplate = (template: string, params: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
