import path from 'path';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:1212`;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}