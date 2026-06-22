import assert from 'node:assert/strict';
import test from 'node:test';

import { getAdminRoleMenuClass } from './admin-role-menu.ts';

test('registered menu items inherit the normal menu color', () => {
    assert.equal(getAdminRoleMenuClass(0), '');
});

test('administrative menu levels receive distinct colors', () => {
    assert.match(getAdminRoleMenuClass(1), /text-blue-/);
    assert.match(getAdminRoleMenuClass(2), /text-amber-/);
    assert.match(getAdminRoleMenuClass(3), /text-yellow-/);
    assert.notEqual(getAdminRoleMenuClass(1), getAdminRoleMenuClass(2));
    assert.notEqual(getAdminRoleMenuClass(2), getAdminRoleMenuClass(3));
});

test('unknown levels fall back to the neutral registered style', () => {
    assert.equal(getAdminRoleMenuClass(undefined), '');
    assert.equal(getAdminRoleMenuClass(99), '');
});
