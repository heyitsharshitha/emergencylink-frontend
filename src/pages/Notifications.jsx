import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../api/services';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks';
import { PageHeader, Pagination } from '../components/ui/data';
import { Card } from '../components/ui/display';
import { Async, EmptyState, useToast } from '../components/ui/feedback';
import { Button, Segmented } from '../components/ui/forms';
import { NotificationItem } from '../components/layout/NotificationCenter';

export default function Notifications() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const list = useFetch(() => notificationApi.list(page, 15), [page]);
  const { refreshUnread, unread } = useApp();
  const nav = useNavigate();
  const toast = useToast();
  const open = async (n) => {
    if (!n.read) { try { await notificationApi.read(n.id); refreshUnread(); } catch { /* ignore */ } }
    nav(n.referralId ? `/app/referrals/${n.referralId}` : '/app/notifications');
  };
  return (
    <>
      <PageHeader title="Notifications" description="Referral events that need your attention: new referrals, decisions, information requests and messages."
        crumbs={[{ label: 'Dashboard', to: '/app' }, { label: 'Notifications' }]}
        actions={<><Segmented label="Filter" value={filter} onChange={setFilter} options={[['all', 'All'], ['unread', `Unread${unread ? ` (${unread})` : ''}`]]} />
          <Button variant="secondary" icon="Check" disabled={!unread} onClick={async () => { await notificationApi.readAll(); refreshUnread(); list.reload(); toast.success('All notifications marked as read.'); }}>Mark all read</Button></>} />
      <Async state={list} rows={5}>
        {(p) => {
          const items = filter === 'unread' ? p.content.filter((n) => !n.read) : p.content;
          return (
            <Card>
              <div style={{ margin: -20 }}>
                {items.length === 0 ? <EmptyState icon="Bell" title={filter === 'unread' ? 'No unread notifications' : "You're all caught up"}>New referrals, decisions and messages will appear here and in the bell menu.</EmptyState>
                  : items.map((n) => <NotificationItem key={n.id} n={n} onOpen={open} />)}
              </div>
              <div style={{ marginTop: 28 }}><Pagination page={p.page} totalPages={p.totalPages} totalElements={p.totalElements} size={p.size} onPage={setPage} /></div>
            </Card>
          );
        }}
      </Async>
    </>
  );
}
