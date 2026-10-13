import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { referralApi } from '../../api/services';
import { useFetch, useAction } from '../../hooks';
import { Button, Textarea } from '../ui/forms';
import { LoadingState, EmptyState, ErrorState, useToast } from '../ui/feedback';
import { Badge } from '../ui/display';
import { fmtDateTime, ROLE_LABEL } from '../../utils/format';

export default function MessagePanel({ referralId, myId, canSend, code, onSent }) {
  const msgs = useFetch(() => referralApi.messages(referralId), [referralId]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, run] = useAction();
  const toast = useToast();
  const end = useRef(null);
  useEffect(() => { const t = setInterval(() => msgs.refresh(), 20000); return () => clearInterval(t); }, [referralId]); // eslint-disable-line
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [msgs.data?.length]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) { setError('Write a message before sending.'); return; }
    run(async () => {
      try { await referralApi.postMessage(referralId, text.trim()); setText(''); setError(''); await msgs.refresh(); onSent?.(); }
      catch (err) { setError(err.message); toast.error(err.message); }
    });
  };

  return (
    <div className="stack">
      {code && <div className="xs muted">Conversation attached to <Link to={`/app/referrals/${referralId}`}>{code}</Link>. Visible only to the two hospitals involved and administrators.</div>}
      {msgs.loading && !msgs.data && <LoadingState rows={3} card={false} />}
      {msgs.error && !msgs.data && <ErrorState error={msgs.error} onRetry={msgs.reload} />}
      {msgs.data?.length === 0 && <EmptyState icon="MessageSquare" title="No messages yet">{canSend ? 'Send the first message to coordinate this referral.' : 'Messaging opens once the referral has been sent to a hospital.'}</EmptyState>}
      <div className="chat" role="log" aria-live="polite" aria-label="Referral messages">
        {msgs.data?.map((m) => (
          <div key={m.id} className={`msg ${m.senderId === myId ? 'mine' : ''}`}>
            <div className="msg-meta"><b>{m.senderId === myId ? 'You' : m.senderName.replace(/\s*\(Demo\)/, '')}</b><Badge tone="outline">{ROLE_LABEL[m.senderRole]}</Badge>{m.senderHospital && <span>{m.senderHospital}</span>}<time dateTime={m.createdAt}>{fmtDateTime(m.createdAt)}</time></div>
            <div className="msg-body">{m.body}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {canSend ? (
        <form onSubmit={send} className="stack-sm" noValidate>
          <Textarea label="Message" required value={text} onChange={(e) => { setText(e.target.value); setError(''); }} maxLength={2000} error={error} help="Coordination details only. Never enter real patient identifiers." />
          <div className="row between"><span className="xs muted">{text.length}/2000</span><Button type="submit" icon="Send" loading={busy}>Send message</Button></div>
        </form>
      ) : <p className="small muted">You can read this conversation, but only the hospitals involved can post messages.</p>}
    </div>
  );
}
