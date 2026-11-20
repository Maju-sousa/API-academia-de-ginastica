import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: 'postgresql://starlife:starlife@localhost:5432/starlife_test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
    },
  },
});
