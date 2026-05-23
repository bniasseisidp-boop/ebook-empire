<?php

return [
    'paths'                    => ['api/*', 'storage/*'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => [
        'http://localhost:5173',
        'http://localhost:3000',
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => false,
];
