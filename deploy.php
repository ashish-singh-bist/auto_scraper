<?php
namespace Deployer;

require 'recipe/laravel.php';

// Project name
set('application', 'auto_scraper');

set('ssh_type', 'native');
set('ssh_multiplexing', true);

// Project repository
set('repository', 'git@github.com:ashish-singh-bist/auto_scraper.git');

// [Optional] Allocate tty for git clone. Default value is false.
set('git_tty', true); 

// Shared files/dirs between deploys 
add('shared_files', ['webapp/.env', 'node_server/config/config.js']);
add('shared_dirs', ['webapp/storage', 'node_server/storage/site_output', 'node_server/storage/site_config', 'node_server/storage/sess_dir', 'node_server/storage/product_url', 'node_server/storage/log', 'node_server/storage/history_data', 'node_server/storage/global_config','webapp/public/.htaccess']);

// Writable dirs by web server 
add('writable_dirs', []);
set('allow_anonymous_stats', false);

set('keep_releases', 2);
set('default_stage', 'staging');

// Hosts
inventory('hosts.yml');
    
// Tasks

task('build', function () {
    run('cd {{release_path}} && build');
});


task('deploy:vendors', function () {
    run('cd {{release_path}}/webapp && composer install');
    write('composer install done!');
});

task('deploy:vendors', function () {
    run('cd {{release_path}}/webapp && composer install');
    write('composer install done!');
});

task('artisan:storage:link', function () {
    run('cd {{release_path}}/webapp && php artisan storage:link');
    write('storage:link run successfully!');
});

task('artisan:view:clear', function () {
    run('cd {{release_path}}/webapp && php artisan view:clear');
    write('view:clear run successfully!');
});

task('artisan:cache:clear', function () {
    run('cd {{release_path}}/webapp && php artisan cache:clear');
    write('cache:clear run successfully!');
});

task('artisan:config:cache', function () {
    run('cd {{release_path}}/webapp && php artisan config:cache');
    write('config:cache run successfully!');
});

task('artisan:optimize', function () {
    //No need to run this command
    //run('cd {{release_path}}/webapp && php artisan optimize');
    //write('optimize run successfully!');
});

task('node:module:install', function () {
    run('cd {{release_path}}/node_server && npm install');
    write('node module install done!');
});

after('deploy:vendors', 'node:module:install');

// [Optional] if deploy fails automatically unlock.
after('deploy:failed', 'deploy:unlock');

// Migrate database before symlink new release.

//before('deploy:symlink', 'artisan:migrate');

