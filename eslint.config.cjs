const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');
const nextTypeScript = require('eslint-config-next/typescript');

module.exports = [
    ...nextCoreWebVitals,
    ...nextTypeScript,
    {
        linterOptions: {
            reportUnusedDisableDirectives: false,
        },
    },
    {
        ignores: [
            '.claude/**',
            '.windsurf/**',
            '**/.claude/**',
            '**/.windsurf/**',
            'reports/**',
            'tmp/**',
        ],
    },
    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
        rules: {
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/refs': 'off',
            'react-hooks/static-components': 'off',
            'react-hooks/incompatible-library': 'off',
            'react/no-unescaped-entities': 'off',
            '@next/next/no-img-element': 'off',
            'no-console': [
                'off',
                {
                    allow: ['warn', 'error'],
                },
            ],
        },
    },
    {
        files: ['**/*.{js,jsx,mjs,cjs}'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/naming-convention': 'off',
        },
    },
];
