import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { ToastProvider } from '../components/ui/feedback';
import { installFakeBackend, USERS } from './fakeBackend';
import { completeness } from '../pages/ReferralNew';
import { layoutNodes } from '../components/domain/NetworkMap';

function mount(route, role) {
  localStorage.clear();
  if (role) { localStorage.setItem('el_token', 'test'); localStorage.setItem('el_user', JSON.stringify(USERS[role])); localStorage.setItem('test_role', role); localStorage.setItem('el_tour_done', 'true'); }
  return render(
    <MemoryRouter initialEntries={[route]}><ToastProvider><AuthProvider><AppProvider><App /></AppProvider></AuthProvider></ToastProvider></MemoryRouter>,
  );
}

let errors;
beforeEach(() => { installFakeBackend(); errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { cleanup(); errors.mockRestore(); });

const noReactErrors = () => {
  const bad = errors.mock.calls.filter((c) => /Warning|Error:|not wrapped in act|Cannot read|is not defined/.test(String(c[0])) && !/not wrapped in act/.test(String(c[0])));
  expect(bad.map((c) => String(c[0]).slice(0, 160))).toEqual([]);
};

describe('public pages', () => {
  it('renders the landing page with the Access Portal entry and no demo messaging', async () => {
    mount('/');
    expect(await screen.findByText(/Connect\. Coordinate\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Access Portal/ })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Explore how it works/ })).toBeInTheDocument();
    expect(screen.queryByText(/demo environment|academic prototype|demo portal/i)).toBeNull();
    noReactErrors();
  });
  it('renders login and validates empty submit', async () => {
    mount('/login');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter your e-mail address.')).toBeInTheDocument();
    noReactErrors();
  });
  it('shows an unavailable state when the backend is down', async () => {
    installFakeBackend({ failStatus: true });
    mount('/status');
    expect(await screen.findByText('The backend cannot be reached')).toBeInTheDocument();
  });
  it('redirects unauthenticated users to login', async () => {
    mount('/app/referrals');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('authenticated screens', () => {
  const cases = [
    ['referring', '/app', 'Referral operations'],
    ['receiving', '/app', 'Incoming referral desk'],
    ['admin', '/app', 'System overview'],
    ['referring', '/app/referrals', 'EL-2026-00001'],
    ['referring', '/app/referrals/new', 'New emergency referral'],
    ['referring', '/app/referrals/1', /Run hospital matching/],
    ['receiving', '/app/referrals/2', /Decision needed/],
    ['referring', '/app/referrals/1/print', 'Print-friendly referral summary'],
    ['referring', '/app/network', 'Emergency network'],
    ['referring', '/app/hospitals/2', 'Hitech Heart Institute'],
    ['receiving', '/app/resources', 'Resource availability'],
    ['referring', '/app/messages', 'Messages'],
    ['referring', '/app/notifications', 'New urgent referral'],
    ['admin', '/app/analytics', 'Analytics'],
    ['referring', '/app/assistant', 'AI coordination assistant'],
    ['admin', '/app/admin', 'Administration'],
    ['referring', '/app/help', 'What EmergencyLink does'],
    ['referring', '/app/status', 'System status & data health'],
  ];
  it.each(cases)('%s can open %s', async (role, route, text) => {
    mount(route, role);
    expect((await screen.findAllByText(text, {}, { timeout: 4000 })).length).toBeGreaterThan(0);
    noReactErrors();
  });

  it('keeps admin-only routes away from hospital roles', async () => {
    mount('/app/admin', 'referring');
    expect(await screen.findByText('Referral operations')).toBeInTheDocument();
  });

  it('shows the shared shell: utility strip, skip link and role-filtered navigation', async () => {
    mount('/app', 'receiving');
    await screen.findByText('Incoming referral desk');
    expect(screen.queryByText('DEMO ENVIRONMENT')).toBeNull();
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    expect(screen.queryByText('New referral')).toBeNull(); // referring-only
    expect(screen.queryByRole('link', { name: 'Administration' })).toBeNull();
  });

  it('runs matching UI: comparison and score breakdown with unknown/unavailable groups', async () => {
    mount('/app/referrals/1', 'referring');
    fireEvent.click((await screen.findAllByRole('button', { name: /Run matching/ }))[0]);
    expect((await screen.findAllByText('Highest compatibility')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('82%', { selector: 'b' }).length).toBeGreaterThan(0);
    // The top hospital's breakdown opens by default and separates available / unavailable / unknown.
    expect(await screen.findByText(/Unknown or stale/)).toBeInTheDocument();
    expect(screen.getByText('Unavailable', { selector: 'div' })).toBeInTheDocument();
  });

  it('opens the quick search and finds grouped results', async () => {
    mount('/app', 'referring');
    await screen.findByText('Referral operations');
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const input = await screen.findByRole('combobox');
    fireEvent.change(input, { target: { value: 'hit' } });
    expect(await screen.findByText('Hospitals', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('assistant answers with markdown, cards and an honest not-connected label', async () => {
    mount('/app/assistant', 'referring');
    fireEvent.click(await screen.findByRole('button', { name: 'ICU availability' }));
    expect(await screen.findByText('2 result(s)')).toBeInTheDocument();
    expect(screen.getAllByText('Hitech Heart Institute').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not connected').length).toBeGreaterThan(0);
  });
});

describe('pure logic', () => {
  it('completeness check flags missing required fields in plain language', () => {
    const c = completeness({ patientName: '', age: '', emergencyCondition: 'x', clinicalSummary: '', urgency: '', requiredSpecialty: '', icuRequired: true, ventilatorRequired: false, oxygenRequired: false, bloodRequired: true, bloodGroup: '', needTheatre: false, needSpecialist: false, facilities: [] });
    expect(c.missingRequired.map((m) => m.label)).toEqual(['Patient identifier', 'Urgency level', 'Required specialty']);
    expect(c.missingOptional.map((m) => m.label)).toContain('Blood group (blood requested)');
  });
  it('network layout keeps every node inside the canvas and apart from each other', () => {
    const hs = Array.from({ length: 6 }, (_, i) => ({ id: i, latitude: 17.4 + (i % 2) * 0.001, longitude: 78.4 + i * 0.001 }));
    const pos = Object.values(layoutNodes(hs));
    pos.forEach((p) => { expect(p.x).toBeGreaterThan(0); expect(p.y).toBeGreaterThan(0); });
    for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) expect(Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y)).toBeGreaterThan(40);
  });
});


describe('administrator operations', () => {
  it('shows the operational overview with honest empty response-time data', async () => {
    mount('/app/admin', 'admin');
    expect(await screen.findByText('Awaiting action')).toBeInTheDocument();
    expect(screen.getByText(/Not enough data yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Waiting over 30 min/ })).toHaveAttribute('href', '/app/referrals?view=overdue');
    noReactErrors();
  });

  it('lists derived exceptions with a route to resolve each one', async () => {
    mount('/app/admin?tab=exceptions', 'admin');
    expect(await screen.findByText('Referral waiting beyond the threshold')).toBeInTheDocument();
    expect(screen.getByText('Resource availability needs confirmation')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Open record' })[0]).toHaveAttribute('href', '/app/referrals/1');
  });

  it('requires a reason before deactivating a hospital', async () => {
    const calls = installFakeBackend();
    mount('/app/admin?tab=hospitals', 'admin');
    fireEvent.click((await screen.findAllByRole('button', { name: 'Deactivate' }))[0]);
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Deactivate' }));
    expect(await screen.findByText('This field is required.')).toBeInTheDocument();
    expect(calls.some((c) => c.startsWith('PATCH'))).toBe(false);
  });

  it('offers administrator actions on a referral and requires a reason for a correction', async () => {
    const calls = installFakeBackend();
    mount('/app/referrals/1', 'admin');
    expect(await screen.findByText('Administrator actions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Correct details/ }));
    const apply = await screen.findByRole('button', { name: 'Apply correction' });
    expect(apply).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^Urgency/), { target: { value: 'STANDARD' } });
    expect(apply).toBeDisabled(); // a change alone is not enough
    expect(screen.getByText(/Urgency: Critical → Standard/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Reason for this correction/), { target: { value: 'Entered at the wrong urgency' } });
    await waitFor(() => expect(apply).not.toBeDisabled());
    fireEvent.click(apply);
    await waitFor(() => expect(calls).toContain('PUT /api/admin/referrals/1'));
  });

  it('keeps administrator actions away from hospital users', async () => {
    mount('/app/referrals/1', 'referring');
    await screen.findByText('Hospitals');
    expect(screen.queryByText('Administrator actions')).toBeNull();
    expect(screen.queryByText('Internal notes')).toBeNull();
  });
});


describe('administrator tools: ownership, settings, reports, audit, hospitals, saved filters', () => {
  it('lets an administrator take ownership of an exception and requires a note to mark it reviewed', async () => {
    const calls = installFakeBackend();
    mount('/app/admin?tab=exceptions', 'admin');
    expect(await screen.findByText('In progress')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Take ownership' }));
    await waitFor(() => expect(calls).toContain('PUT /api/admin/exceptions/state'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Mark reviewed' })[0]);
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mark reviewed' }));
    expect(await within(dialog).findByText('This field is required.')).toBeInTheDocument();
  });

  it('keeps Save disabled on the thresholds form until a value changes and a reason is given', async () => {
    const calls = installFakeBackend();
    mount('/app/admin?tab=settings', 'admin');
    const save = await screen.findByRole('button', { name: /Save thresholds/ });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Referral waiting threshold/), { target: { value: '45' } });
    expect(save).not.toBeDisabled();
    fireEvent.click(save);
    expect(await screen.findByText('A reason is required.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Reason for the change/), { target: { value: 'Quieter overnight' } });
    fireEvent.click(save);
    await waitFor(() => expect(calls).toContain('PUT /api/admin/settings'));
    fireEvent.change(screen.getByLabelText(/Referral waiting threshold/), { target: { value: '2' } });
    fireEvent.click(save);
    expect(await screen.findByText(/from 5 to 1440/)).toBeInTheDocument();
  });

  it('shows the report with honest rates and exports CSV', async () => {
    const calls = installFakeBackend();
    mount('/app/admin?tab=reports', 'admin');
    expect(await screen.findByText('Referrals created')).toBeInTheDocument();
    expect(screen.getByText(/not enough data yet \(1 decided/i)).toBeInTheDocument();
    expect(screen.getByText('Hitech Heart Institute')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Stale resources/ }));
    await waitFor(() => expect(calls.some((c) => c.startsWith('GET /api/admin/reports/export/stale-resources'))).toBe(true));
  });

  it('shows reason, before and after for an audit event', async () => {
    mount('/app/admin?tab=audit', 'admin');
    fireEvent.click(await screen.findByRole('button', { name: 'Details' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('referral wait 30 min')).toBeInTheDocument();
    expect(within(dialog).getByText('referral wait 45 min')).toBeInTheDocument();
    expect(within(dialog).getByText('Tuning')).toBeInTheDocument();
  });

  it('adds a hospital with validation and creates it through the admin API', async () => {
    const calls = installFakeBackend();
    mount('/app/admin?tab=hospitals', 'admin');
    fireEvent.click(await screen.findByRole('button', { name: /Add hospital/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add hospital' }));
    expect(await within(dialog).findByText('Name is required.')).toBeInTheDocument();
    expect(calls.some((c) => c.startsWith('POST /api/admin/hospitals'))).toBe(false);
    fireEvent.change(within(dialog).getByLabelText(/Hospital name/), { target: { value: 'Riverside Hospital' } });
    fireEvent.change(within(dialog).getByLabelText(/^City/), { target: { value: 'Hyderabad' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add hospital' }));
    await waitFor(() => expect(calls).toContain('POST /api/admin/hospitals'));
  });

  it('corrects resources only after a change and a reason, and shows matching warnings', async () => {
    const calls = installFakeBackend();
    mount('/app/admin?tab=hospitals', 'admin');
    fireEvent.click((await screen.findAllByRole('button', { name: 'Resources' }))[0]);
    const dialog = await screen.findByRole('dialog');
    const save = await within(dialog).findByRole('button', { name: 'Save corrections' });
    expect(save).toBeDisabled();
    fireEvent.change(within(dialog).getAllByLabelText('Available')[0], { target: { value: '0' } });
    fireEvent.change(within(dialog).getByLabelText(/Reason for this correction/), { target: { value: 'Phoned the ward' } });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.click(save);
    await waitFor(() => expect(calls).toContain('PUT /api/admin/hospitals/1/resources'));
    expect(await within(dialog).findByText(/ICU beds now shows none available/)).toBeInTheDocument();
  });

  it('applies a saved filter on the referrals page', async () => {
    mount('/app/referrals', 'referring');
    fireEvent.click(await screen.findByRole('button', { name: 'Critical only' }));
    await waitFor(() => expect(screen.getByLabelText('Urgency').value).toBe('CRITICAL'));
  });
});
