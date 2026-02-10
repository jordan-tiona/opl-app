import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultEsmPreset()

const config: JestConfigWithTsJest = {
    ...presetConfig,
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['./app/test/setup.ts'],
    moduleNameMapper: {
        '\\.(css|less|scss)$': '<rootDir>/app/test/style-mock.ts',
        '^~/(.*)$': '<rootDir>/app/$1',
    },
    testMatch: ['<rootDir>/app/**/*.test.{ts,tsx}'],
}

export default config
