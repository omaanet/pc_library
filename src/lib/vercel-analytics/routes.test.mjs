import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { NextRequest } from 'next/server';
import { analyticsRoute } from './route-handler.ts';
import { withCSRFProtection } from '../csrf-middleware.ts';
import { ApiError } from '../api-error-handler.ts';
import { isSuperAdminLevel } from '../../config/admin-roles.ts';

function route(kind, level, managed = true) {
    let calls = 0; let adminChecks = 0; let superChecks = 0; let pageChecks = 0;
    const authorize = async superOnly => {
        if (superOnly) superChecks++; else adminChecks++;
        if (level == null) throw new ApiError(401, 'private auth details');
        if (level < 1 || (superOnly && !isSuperAdminLevel(level))) throw new ApiError(403, 'private access details');
        return { userLevel: level, isAdmin: level >= 1 };
    };
    const filename = `../../app/api/admin/analytics/${kind === 'dashboard' ? '' : `${kind}/`}route.ts`;
    const source = fs.readFileSync(new URL(filename, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(compiled, { module, exports: module.exports, require: name => {
        if (name.endsWith('/admin-auth')) return {
            requireAdmin: () => authorize(false), requireSuperAdmin: () => authorize(true),
            requireManagedPageAccess: async key => { pageChecks++; assert.equal(key, 'statistics'); if (!managed) throw new ApiError(403, 'private page details'); },
        };
        if (name.endsWith('/admin-roles')) return { isSuperAdminLevel };
        if (name.endsWith('/route-handler')) return { analyticsRoute };
        if (name.endsWith('/csrf-middleware')) return { withCSRFProtection };
        if (name.endsWith('/cached-dashboard')) return { cachedDashboard: async (period, limit, refresh = false) => { calls++; return { period, limit, refresh }; } };
        if (name.endsWith('/client')) return { analyticsConfig: () => ({}), getAnalyticsClient: () => ({}) };
        if (name.endsWith('/service')) return { checkSetup: async () => { calls++; return { checked: true }; } };
        throw new Error(`Unexpected import ${name}`);
    } });
    return { handler: module.exports[kind === 'refresh' ? 'POST' : 'GET'], counts: () => ({ calls, adminChecks, superChecks, pageChecks }) };
}
function request(kind, params = '', csrf = true, body) {
    return new NextRequest(`http://localhost/api/admin/analytics/${kind}?${params}`, {
        method: kind === 'refresh' ? 'POST' : 'GET',
        ...(kind === 'refresh' ? { headers: csrf ? { 'x-csrf-token': 'x'.repeat(32) } : {}, body } : {}),
    });
}
test('dashboard permits admins; setup and refresh enforce superadmin before any work', async () => {
    for (const kind of ['dashboard', 'check', 'refresh']) for (const level of [null, 0, 1, 2, 3]) {
        const r = route(kind, level);
        const response = await r.handler(request(kind));
        const allowed = level >= (kind === 'dashboard' ? 1 : 3);
        assert.equal(response.status, allowed ? 200 : level == null ? 401 : 403);
        assert.equal(r.counts().calls, Number(allowed));
        assert.equal(r.counts()[kind === 'dashboard' ? 'adminChecks' : 'superChecks'], 1);
        assert.equal(response.headers.get('cache-control'), 'private, no-store');
        assert.equal((await response.text()).includes('private '), false);
    }
});
test('managed-page denial protects cached reads, refreshes and probes', async () => {
    for (const kind of ['dashboard', 'refresh', 'check']) {
        const r = route(kind, 3, false);
        assert.equal((await r.handler(request(kind))).status, 403);
        assert.equal(r.counts().calls, 0); assert.equal(r.counts().pageChecks, 1);
    }
});
test('refresh requires CSRF and rejects arbitrary query parameters and bodies', async () => {
    const r = route('refresh', 3);
    const denied = await r.handler(request('refresh', '', false));
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get('cache-control'), 'private, no-store');
    for (const params of ['projectId=other', 'token=secret', 'filter=anything', 'limit=500', 'period=7d&period=30d']) {
        assert.equal((await r.handler(request('refresh', params))).status, 400);
    }
    assert.equal((await r.handler(request('refresh', '', true, '{"projectId":"other"}'))).status, 400);
    assert.equal(r.counts().calls, 0);
    assert.deepEqual(await (await r.handler(request('refresh', 'period=30d&limit=50'))).json(), { period: '30d', limit: 50, refresh: true });
});
