// src/renderer/src/utils/performance.ts
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`⏱️ ${name} took ${end - start}ms`);
  return result;
};

export const createPerformanceLogger = (componentName: string) => {
  return (operation: string, duration: number) => {
    if (duration > 16) { // More than 1 frame at 60fps
      console.warn(`⚠️ ${componentName} - ${operation} took ${duration.toFixed(2)}ms (slow)`);
    }
  };
};