// This file ensures TypeScript knows about the Jest globals (describe/it/expect/jest).
// It does not change production code.

declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const beforeAll: any;
declare const afterAll: any;
declare const jest: any;

