module.exports = {
  apps: [
    {
      name: 'openclaw-worker',
      script: './openclaw_worker.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'openclaw-scheduler',
      script: './openclaw_scheduler.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/scheduler-error.log',
      out_file: './logs/scheduler-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
