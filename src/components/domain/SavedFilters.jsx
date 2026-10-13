import { useState } from 'react';
import { savedFilterApi } from '../../api/services';
import { useAction, useFetch } from '../../hooks';
import { Modal, useToast } from '../ui/feedback';
import { Button, Input } from '../ui/forms';
import Icon from '../ui/Icon';

const KEYS = ['q', 'status', 'urgency', 'specialty', 'hospital', 'from', 'to', 'view', 'sort', 'dir'];

/** Personal saved filters: private to the signed-in user and stored on the server. */
export default function SavedFilters({ scope, current, canSave, onApply }) {
  const state = useFetch(() => savedFilterApi.list(scope), [scope]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [busy, run] = useAction();
  const toast = useToast();
  const list = state.data || [];
  const save = () => run(async () => {
    try {
      const filter = Object.fromEntries(KEYS.filter((k) => current[k] !== '' && current[k] != null).map((k) => [k, current[k]]));
      await savedFilterApi.save(name.trim(), scope, filter);
      toast.success('Filter saved.'); setNaming(false); setName(''); state.refresh();
    } catch (e) { toast.error(e.message); }
  });
  const remove = (f) => run(async () => {
    try { await savedFilterApi.remove(f.id); toast.success('Saved filter deleted.'); state.refresh(); } catch (e) { toast.error(e.message); }
  });
  const apply = (f) => { try { onApply(JSON.parse(f.filter)); } catch { toast.error('This saved filter could not be read.'); } };
  return (
    <div className="row wrap" style={{ gap: 8, alignItems: 'center' }} role="group" aria-label="My saved filters">
      <span className="small muted">My filters:</span>
      {list.length === 0 && <span className="small muted">none saved yet</span>}
      {list.map((f) => (
        <span key={f.id} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <button type="button" className="chip" style={{ border: 0, background: 'transparent', padding: 0 }} onClick={() => apply(f)}>{f.name}</button>
          <button type="button" aria-label={`Delete saved filter ${f.name}`} style={{ border: 0, background: 'transparent', cursor: 'pointer' }} disabled={busy} onClick={() => remove(f)}><Icon name="X" size={12} /></button>
        </span>
      ))}
      <Button size="sm" variant="secondary" icon="Save" disabled={!canSave} onClick={() => setNaming(true)}>Save current filter</Button>
      <Modal open={naming} onClose={() => setNaming(false)} title="Save this filter"
        footer={<><Button variant="ghost" onClick={() => setNaming(false)}>Cancel</Button><Button loading={busy} disabled={!name.trim()} onClick={save}>Save filter</Button></>}>
        <Input label="Name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} help="Saving with an existing name replaces that filter." />
      </Modal>
    </div>
  );
}
