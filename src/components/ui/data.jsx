import { Link } from 'react-router-dom';
import Icon from './Icon';
import { Button } from './forms';
import { EVENT_META, fmtDateTime, timeAgo } from '../../utils/format';

export function PageHeader({ title, description, actions, crumbs, updatedAt }) {
  return (
    <header>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="page-head">
        <div>
          <h1 id="page-title" tabIndex={-1}>{title}</h1>
          {description && <p>{description}</p>}
          {updatedAt && <span className="freshness"><Icon name="Clock" size={12} />Data refreshed {timeAgo(updatedAt)} · {fmtDateTime(updatedAt)}</span>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </header>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol className="crumbs">
        {items.map((c, i) => (
          <li key={i} style={{ display: 'contents' }}>
            {i > 0 && <Icon name="ChevronRight" size={12} />}
            {c.to && i < items.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current={i === items.length - 1 ? 'page' : undefined}>{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** columns: [{ key, header, render?, sortKey?, className? }] */
export function Table({ columns, rows, rowKey = 'id', sort, onSort, caption, empty }) {
  return (
    <div className="table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort && sort.key === c.sortKey;
              return (
                <th key={c.key} scope="col" className={c.className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sortKey && onSort
                    ? <button onClick={() => onSort(c.sortKey)}>{c.header}<Icon name={active ? (sort.dir === 'asc' ? 'ArrowUp' : 'ArrowDown') : 'ArrowUpDown'} size={12} /></button>
                    : c.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={columns.length}>{empty}</td></tr>}
          {rows.map((r) => <tr key={r[rowKey]}>{columns.map((c) => <td key={c.key} className={c.className}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, totalElements, size, onPage }) {
  if (!totalElements) return null;
  const from = page * size + 1; const to = Math.min(totalElements, (page + 1) * size);
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>Showing {from}–{to} of {totalElements}</span>
      <div className="row" style={{ gap: 6 }}>
        <Button size="sm" variant="secondary" icon="ChevronLeft" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button>
        <span aria-live="polite">Page {page + 1} of {Math.max(totalPages, 1)}</span>
        <Button size="sm" variant="secondary" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}>Next<Icon name="ChevronRight" /></Button>
      </div>
    </nav>
  );
}

export function Timeline({ events, empty = 'No events recorded yet.' }) {
  if (!events?.length) return <p className="muted small">{empty}</p>;
  return (
    <ol className="timeline" aria-label="Referral timeline">
      {events.map((e) => {
        const m = EVENT_META[e.eventType] || { label: e.eventType, tone: 'neutral', icon: 'Info' };
        return (
          <li key={e.id}>
            <span className={`tl-dot ${m.tone}`}><Icon name={m.icon} size={14} /></span>
            <div className="tl-title">{m.label}</div>
            {e.note && <div className="tl-note">{e.note}</div>}
            <div className="tl-meta"><time dateTime={e.createdAt}>{fmtDateTime(e.createdAt)}</time>{e.actorLabel ? ` · ${e.actorLabel}` : ''}</div>
          </li>
        );
      })}
    </ol>
  );
}
