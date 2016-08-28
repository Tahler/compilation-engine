import { Test } from './test';

export interface Request {
  lang: string;
  src: string;
  timeout: number;
  tests: Test[];
}

export namespace Request {
  export function hasRequiredProperties(obj: any): boolean {
    let hasRequiredProperties = true;
    RequiredProperties.forEach(requiredProperty => {
      if (!obj.hasOwnProperty(requiredProperty)) {
        hasRequiredProperties = false;
      }
    });
    return hasRequiredProperties;
  }
}

export const RequiredProperties: string[] = [
  'lang',
  'src',
  'timeout',
  'tests'
];
