module.exports = {
  apps: [
    {
      name: 'WordleTracker',
      script: './dist/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
