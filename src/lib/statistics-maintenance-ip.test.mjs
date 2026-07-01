import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

const helperSource = fs.readFileSync(new URL('./statistics-maintenance-ip.ts', import.meta.url), 'utf8')
    .replace(
        "import { SITE_CONFIG } from '@/config/site-config';",
        "const SITE_CONFIG = { STATISTICS_MAINTENANCE_IP: '128.116.163.86' };"
    )
    .replace(
        "import { hashPromoVisitorIp } from '@/lib/promo-statistics';",
        `const { createHmac } = require('node:crypto');
function hashPromoVisitorIp(ipAddress) {
    const secret = process.env.STATS_HASH_SECRET;
    if (!secret) {
        throw new Error('STATS_HASH_SECRET is required for anonymous promo statistics');
    }
    return createHmac('sha256', secret).update(ipAddress).digest('hex');
}`
    );

const transpiledHelper = ts.transpileModule(helperSource, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
    },
}).outputText;

const helperModule = { exports: {} };
vm.runInNewContext(transpiledHelper, {
    module: helperModule,
    exports: helperModule.exports,
    process,
    require,
    URL,
});

const {
    getMaintenanceIpFilter,
    getMaintenanceUserFilter,
    getPromoAnonymousMaintenanceFilter,
    shouldIncludeMaintenanceIp,
} = helperModule.exports;

function restoreEnv(name, value) {
    if (value === undefined) {
        delete process.env[name];
    } else {
        process.env[name] = value;
    }
}

function requestFor(includeMaintenanceIp) {
    const suffix = includeMaintenanceIp === undefined
        ? ''
        : `?includeMaintenanceIp=${includeMaintenanceIp}`;
    return new Request(`https://example.test/api/statistics${suffix}`);
}

function promoHash(ipAddress) {
    return createHmac('sha256', process.env.STATS_HASH_SECRET).update(ipAddress).digest('hex');
}

test('maintenance filters include rows unless includeMaintenanceIp is false', () => {
    const originalSecret = process.env.STATS_HASH_SECRET;
    delete process.env.STATS_HASH_SECRET;

    assert.equal(shouldIncludeMaintenanceIp(requestFor(undefined)), true);
    assert.equal(getMaintenanceIpFilter(requestFor(undefined)), '(1 = 1)');
    assert.equal(getMaintenanceUserFilter(requestFor(undefined)), '(1 = 1)');
    assert.equal(getPromoAnonymousMaintenanceFilter(requestFor(undefined)), '(1 = 1)');

    restoreEnv('STATS_HASH_SECRET', originalSecret);
});

test('maintenance filters exclude local IPs, configured maintenance IP, and maintenance emails', () => {
    const disabledRequest = requestFor(false);

    const ipFilter = getMaintenanceIpFilter(disabledRequest);
    assert.match(ipFilter, /::1/);
    assert.match(ipFilter, /localhost/);
    assert.match(ipFilter, /127\.0\.0\.1/);
    assert.match(ipFilter, /128\.116\.163\.86/);

    const userFilter = getMaintenanceUserFilter(disabledRequest, 'sl.user_id');
    assert.match(userFilter, /sl\.user_id/);
    assert.match(userFilter, /oscar@omaa\.it/);
    assert.match(userFilter, /paolo@omaa\.it/);
});

test('promo anonymous filter hashes maintenance IPs only when excluding maintenance data', () => {
    const originalSecret = process.env.STATS_HASH_SECRET;
    process.env.STATS_HASH_SECRET = 'test-secret-with-at-least-32-bytes';

    const promoFilter = getPromoAnonymousMaintenanceFilter(requestFor(false), 'a.ip_hash');
    assert.match(promoFilter, /a\.ip_hash/);
    assert.match(promoFilter, new RegExp(promoHash('128.116.163.86')));
    assert.match(promoFilter, new RegExp(promoHash('127.0.0.1')));

    restoreEnv('STATS_HASH_SECRET', originalSecret);
});
