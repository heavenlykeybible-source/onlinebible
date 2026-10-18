import {defineConfig} from 'vitest/config';
// Node's test runner owns the .mjs suites in each service. Do not collect them
// as Vitest files and report their successful Node tests as empty suites.
export default defineConfig({test:{include:['test/**/*.test.ts']}});
