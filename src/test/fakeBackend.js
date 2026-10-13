import client from '../api/client';

const now = new Date().toISOString();
const hospRef = (id, name) => ({ id, name, city: 'Hyderabad', phone: '+91 40 5550 0000', emergencyContact: '+91 40 5550 0000' });
const res = (type, label, total, available, stale = false) => ({ type, label, unit: 'units', total, available, updatedAt: now, updatedBy: 'Demo', stale });
const resources = [res('ICU_BED', 'ICU beds', 10, 3), res('EMERGENCY_BED', 'Emergency beds', 20, 8), res('GENERAL_BED', 'General beds', 50, 20), res('VENTILATOR', 'Ventilators', 6, 2), res('BLOOD_UNITS', 'Blood units', 30, 12, true)];
const hospital = (id, name, receives = true) => ({ id, name, type: 'MULTI_SPECIALTY', address: 'Demo Road', city: 'Hyderabad', state: 'Telangana', phone: '1', email: 'x@y.z', emergencyContact: '2', latitude: 17.4 + id / 20, longitude: 78.4 + id / 15,
  emergencyServices: true, active: true, receivesReferrals: receives, specialties: ['Cardiology', 'Critical Care'], facilities: ['CT Scan'], resources, lastResourceUpdate: now, resourcesStale: false, activeReferrals: id, createdAt: now });
const referral = (id, status, actions) => ({ id, referralCode: `EL-2026-0000${id}`, patientName: 'DEMO-PT-100' + id, age: 55, gender: 'Male', emergencyCondition: 'Acute chest pain', clinicalSummary: 'Demo', urgency: 'CRITICAL',
  requiredSpecialty: 'Cardiology', facilities: ['CT Scan'], resources: [{ type: 'OPERATING_THEATRE', quantity: 1 }], icuRequired: true, ventilatorRequired: false, oxygenRequired: true, bloodRequired: true, bloodGroup: 'O+',
  additionalRequirements: null, referringHospital: hospRef(9, 'Medchal Community Hospital'), targetHospital: status === 'CREATED' ? null : hospRef(2, 'Hitech Heart Institute'), status, allowedActions: actions,
  decisionReason: null, decidedAt: null, createdByName: 'Dr Demo', createdAt: now, updatedAt: now });
const matchResult = (id, name, score) => ({ hospitalId: id, hospitalName: name, city: 'Hyderabad', score, distanceKm: 12.5, distanceNote: 'est', emergencyService: true, resourcesUpdatedAt: now, resourcesStale: false,
  checks: [{ key: 'specialty', label: 'Cardiology specialty', status: 'MATCHED', weight: 30, earned: 30, detail: 'listed' }, { key: 'icu', label: 'ICU bed', status: 'UNKNOWN', weight: 20, earned: 10, detail: 'stale' }, { key: 'bed', label: 'Bed', status: 'UNAVAILABLE', weight: 15, earned: 0, detail: '0 available' }],
  summary: ['✓ Cardiology specialty'] });
const page = (content) => ({ content, page: 0, size: 10, totalElements: content.length, totalPages: 1 });

export const USERS = {
  referring: { id: 1, email: 'medchal.referrer@emergencylink.demo', fullName: 'Dr. Lakshmi (Demo)', role: 'REFERRING_HOSPITAL', hospitalId: 9, hospitalName: 'Medchal Community Hospital', active: true },
  receiving: { id: 2, email: 'hitech.receiver@emergencylink.demo', fullName: 'Dr. Vikram (Demo)', role: 'RECEIVING_HOSPITAL', hospitalId: 2, hospitalName: 'Hitech Heart Institute', active: true },
  admin: { id: 3, email: 'admin@emergencylink.demo', fullName: 'Demo Administrator', role: 'ADMIN', hospitalId: null, hospitalName: null, active: true },
};

const dashboard = {
  role: 'X', kpis: { total: 9, active: 6, pending: 4, incoming: 1, awaitingDecision: 3, accepted: 2, declined: 1, completed: 2, urgent: 3, hospitals: 8, activeHospitals: 8, users: 9 },
  statusDistribution: { CREATED: 1, SENT: 2, ACCEPTED: 2, COMPLETED: 2, DECLINED: 1 }, urgencyDistribution: { CRITICAL: 4, URGENT: 3, STANDARD: 2 },
  referralsOverTime: Array.from({ length: 14 }, (_, i) => ({ date: new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10), count: i % 3 })),
  topSpecialties: [{ specialty: 'Cardiology', count: 3 }], avgDecisionMinutes: 35.5, recentActivity: [{ referralId: 1, referralCode: 'EL-2026-00001', eventType: 'ACCEPTED', description: 'Accepted', actorLabel: 'Dr X', createdAt: now }],
  ownResources: resources, resourceOverview: [{ type: 'ICU_BED', label: 'ICU beds', unit: 'beds', total: 50, available: 12, hospitalsReporting: 5, staleHospitals: 1 }], hospitalActivity: [{ hospitalId: 1, hospitalName: 'Hitech Heart Institute', referrals: 4 }], generatedAt: now,
};

/** Installs an in-memory fake of the EmergencyLink API so screens can be rendered without a backend. */
export function installFakeBackend({ failStatus = false } = {}) {
  const calls = [];
  client.defaults.adapter = async (config) => {
    const url = config.url.replace(/^https?:\/\/[^/]+/, '');
    const method = (config.method || 'get').toLowerCase();
    calls.push(`${method.toUpperCase()} ${url}`);
    const ok = (data) => ({ data, status: 200, statusText: 'OK', headers: {}, config });
    const fail = (status, message) => { const e = new Error(message); e.config = config; e.response = { status, data: { message, status }, headers: {}, config }; throw e; };
    if (url === '/api/public/status') { if (failStatus) fail(503, 'down'); return ok({ status: 'UP', database: 'UP', demoEnvironment: true, version: '1.0.0', assistantMode: 'DEMO', serverTime: now, lastResourceUpdate: now, hospitals: 8, referrals: 9, staleResourceRecords: 2, staleThresholdMinutes: 120 }); }
    if (url === '/api/auth/me') return ok(USERS[localStorage.getItem('test_role')] || USERS.referring);
    if (url === '/api/auth/login') return ok({ token: 't', tokenType: 'Bearer', expiresAt: now, user: USERS.referring });
    if (url === '/api/notifications/unread-count') return ok({ unread: 2 });
    if (url === '/api/notifications') return ok(page([{ id: 1, type: 'NEW_REFERRAL', title: 'New urgent referral', message: 'Chest pain', read: false, referralId: 1, referralCode: 'EL-2026-00001', createdAt: now }]));
    if (url === '/api/dashboard') return ok(dashboard);
    if (url === '/api/catalog') return ok({ specialties: ['Cardiology', 'Neurology'], facilities: ['CT Scan', 'Cath Lab'], resourceTypes: [] });
    if (url === '/api/referrals' && method === 'get') return ok(page([referral(1, 'SENT', ['VIEW', 'MESSAGE']), referral(2, 'ACCEPTED', ['START_TRANSFER', 'MESSAGE'])]));
    if (url === '/api/referrals/1') return ok(referral(1, 'CREATED', ['MATCH', 'SEND', 'CANCEL']));
    if (url === '/api/referrals/2') return ok(referral(2, 'VIEWED', ['ACCEPT', 'DECLINE', 'REQUEST_INFO', 'MESSAGE']));
    if (/\/api\/referrals\/\d+\/timeline/.test(url)) return ok([{ id: 1, eventType: 'CREATED', toStatus: 'CREATED', note: 'Referral created', actorLabel: 'Dr X', createdAt: now }, { id: 2, eventType: 'SENT', toStatus: 'SENT', note: 'Sent', actorLabel: 'Dr X', createdAt: now }]);
    if (/\/api\/referrals\/\d+\/messages/.test(url)) return ok([{ id: 1, referralId: 1, body: 'Ambulance en route', senderId: 2, senderName: 'Dr Y', senderRole: 'RECEIVING_HOSPITAL', senderHospitalId: 2, senderHospital: 'Hitech', createdAt: now }]);
    if (/\/api\/referrals\/\d+\/match/.test(url)) return ok([matchResult(2, 'Hitech Heart Institute', 82), matchResult(3, 'Deccan Care', 55), matchResult(4, 'Banjara Trauma', 40)]);
    if (/\/api\/referrals\/\d+\/view/.test(url)) return ok(referral(2, 'VIEWED', ['ACCEPT']));
    if (url === '/api/hospitals/network') return ok([hospital(1, 'Deccan Care Medical Centre'), hospital(2, 'Hitech Heart Institute'), hospital(3, 'Banjara Trauma Centre'), hospital(9, 'Medchal Community Hospital', false)]);
    if (url === '/api/hospitals') return ok(page([hospital(1, 'Deccan Care Medical Centre'), hospital(2, 'Hitech Heart Institute')]));
    if (/\/api\/hospitals\/\d+$/.test(url)) return ok(hospital(2, 'Hitech Heart Institute'));
    if (url === '/api/resources/mine') return ok(resources.map((r) => r));
    if (url === '/api/assistant/prompts') return ok([{ label: 'ICU availability', prompt: 'Which hospitals have an ICU bed available?', needsReferral: false }]);
    if (url === '/api/assistant/chat') return ok({ answer: '### 2 result(s)\n- **Hitech Heart Institute**\n\n> Coordination information only', mode: 'DEMO', sources: ['Hospital network data'], hospitals: [{ id: 2, name: 'Hitech Heart Institute', city: 'Hyderabad', score: null, highlights: ['ICU beds: 3/10'], resourcesStale: false, resourcesUpdatedAt: now }], dataNotes: ['1 hospital(s) have stale data'], generatedAt: now });
    if (url === '/api/public/help') return ok([{ slug: 'overview', title: 'What EmergencyLink does', category: 'Getting started', body: 'A demo platform.' }]);
    if (url === '/api/search') return ok({ referrals: [referral(1, 'SENT', [])], hospitals: [hospital(2, 'Hitech Heart Institute')], specialties: ['Cardiology'], facilities: [] });
    if (url === '/api/admin/users') return ok(page([{ ...USERS.admin }, { ...USERS.referring }]));
    if (url === '/api/admin/audit') return ok(page([{ id: 1, actorEmail: 'admin@emergencylink.demo', actorRole: 'ADMIN', action: 'SETTINGS_UPDATED', reason: 'Tuning', outcome: 'SUCCESS', before: 'referral wait 30 min', after: 'referral wait 45 min', entityType: 'User', entityId: 3, entityLabel: 'admin', detail: 'Signed in', createdAt: now }]));
    if (url === '/api/saved-filters') return method === 'post' ? ok({ id: 8, name: 'Mine', scope: 'referrals', filter: '{}', createdAt: now }) : ok([{ id: 7, name: 'Critical only', scope: 'referrals', filter: '{"urgency":"CRITICAL"}', createdAt: now }]);
    if (url === '/api/admin/settings') return method === 'put' ? ok({ waitMinutes: 45, staleMinutes: 120, defaultWaitMinutes: 30, defaultStaleMinutes: 120, updatedBy: 'Demo Administrator', updatedAt: now })
      : ok({ waitMinutes: 30, staleMinutes: 120, defaultWaitMinutes: 30, defaultStaleMinutes: 120, updatedBy: null, updatedAt: null });
    if (url === '/api/admin/exceptions/state') return ok({ total: 2, high: 1, medium: 1, low: 0, reviewed: 0, waitThresholdMinutes: 30, staleAfterMinutes: 120, items: [] });
    if (/\/api\/admin\/hospitals\/\d+\/resource-history/.test(url)) return ok([]);
    if (/\/api\/admin\/hospitals\/\d+\/resources/.test(url)) return ok(method === 'put' ? { resources: [], warnings: ['ICU beds now shows none available.'] }
      : [{ type: 'ICU_BED', label: 'ICU beds', unit: 'beds', total: 6, available: 2, updatedAt: now, updatedBy: 'x', stale: false }]);
    if (url === '/api/admin/reports/summary') return ok({ from: '2026-09-01', to: '2026-09-30', generatedAt: now, totalReferrals: 4, byStatus: { SENT: 2, ACCEPTED: 1, COMPLETED: 1 }, byUrgency: { CRITICAL: 3, URGENT: 1 },
      volumeByDay: [{ date: '2026-09-01', count: 2 }, { date: '2026-09-02', count: 2 }], acceptedDecisions: 1, declinedDecisions: 0, acceptanceRate: 100, completedEvents: 1, cancelledEvents: 0,
      responseTime: { sampleSize: 1, avgMinutes: null, medianMinutes: null, minMinutes: null, maxMinutes: null },
      hospitalActivity: [{ hospitalId: 1, hospitalName: 'Deccan Care Medical Centre', active: true, sent: 3, received: 0, accepted: 0, declined: 0, completed: 0 }],
      staleResources: [], profileCompleteness: [{ hospitalId: 2, hospitalName: 'Hitech Heart Institute', percent: 83, missing: ['phone'] }], auditByAction: { LOGIN: 3 }, staleAfterMinutes: 120 });
    if (url.startsWith('/api/admin/reports/export/')) return ok('a,b');
    if (url === '/api/admin/overview') return ok({ hospitalsTotal: 8, hospitalsActive: 7, usersTotal: 9, usersActive: 9, activeReferrals: 5, awaitingAction: 2, criticalOrUrgentActive: 3, completed: 1, declinedOrCancelled: 1,
      flaggedReferrals: 1, overdueReferrals: 1, staleResourceRecords: 2, openExceptions: 3, byStatus: { CREATED: 1, SENT: 2, COMPLETED: 1 }, byUrgency: { CRITICAL: 2, URGENT: 1, STANDARD: 1 },
      avgCreationToDecisionMinutes: null, decisionSampleSize: 1, waitThresholdMinutes: 30, generatedAt: now });
    if (url === '/api/admin/exceptions') return ok({ total: 2, high: 1, medium: 1, low: 0, reviewed: 0, waitThresholdMinutes: 30, staleAfterMinutes: 120, items: [
      { id: 'overdue-1', type: 'AWAITING_TOO_LONG', severity: 'HIGH', title: 'Referral waiting beyond the threshold', explanation: 'Waiting 45 minutes.', entityType: 'Referral', entityId: 1, entityLabel: 'EL-2026-00001', detectedAt: now, route: '/app/referrals/1', status: 'OPEN', ownerName: null, note: null },
      { id: 'stale-2', type: 'STALE_RESOURCE', severity: 'MEDIUM', title: 'Resource availability needs confirmation', explanation: '2 records are old.', entityType: 'Hospital', entityId: 2, entityLabel: 'Hitech Heart Institute', detectedAt: now, route: '/app/hospitals/2', status: 'IN_PROGRESS', ownerName: 'Demo Administrator', note: null }] });
    if (/\/api\/admin\/referrals\/\d+\/notes/.test(url)) return method === 'post' ? ok({ id: 2, body: 'Checked', authorLabel: 'Demo Administrator', createdAt: now }) : ok([]);
    if (/\/api\/admin\/referrals\/\d+/.test(url)) return ok(referral(1, 'CREATED', []));
    if (/\/api\/admin\/hospitals\/\d+\/active/.test(url)) return ok(hospital(1, 'Deccan Care Medical Centre'));
    if (url === '/api/auth/logout') return ok(null);
    fail(404, `Unmocked endpoint ${method} ${url}`);
  };
  return calls;
}
