module.exports = {
    apps: [{
        name: 'farmonitor',
        script: 'src/index.js',
        watch: false,
        autorestart: true,
        max_restarts: 10,
        restart_delay: 5000,
        env: {
            NODE_ENV: 'production'
        },
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        time: true
    }]
};
