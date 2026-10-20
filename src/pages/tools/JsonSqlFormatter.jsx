import { useState, useRef, useId } from 'react';
import { Copy } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card, ChoiceChips } from '../../ui/controls';

const FAQS = [
  { q: 'What does Validate do?', a: 'It checks that your JSON is written correctly. If something is wrong, it tells you the line and column where the problem is.' },
  { q: 'What does the SQL tidy-up change?', a: 'It writes SQL words like SELECT and WHERE in capitals and starts each main part on a new line. Text inside quotes is never touched.' },
  { q: 'How does JSON to SQL INSERT work?', a: 'Paste a JSON list of objects, like [{"name":"Ana","age":30}]. Each object becomes one row and each key becomes a column.' },
  { q: 'Is my data uploaded?', a: 'No. Everything happens in your browser.' },
];

const KEYWORDS = [
  'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'BETWEEN', 'AS', 'ON',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'UNION', 'ALL', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
  'ASC', 'DESC', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS', 'PRIMARY KEY', 'DEFAULT',
];
const KW_RE = new RegExp(`\\b(${KEYWORDS.map((k) => k.replace(' ', '\\s+')).join('|')})\\b`, 'gi');
const CLAUSE_RE = /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|UNION(?: ALL)?|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|(?:(?:INNER|LEFT|RIGHT|FULL|CROSS)(?: OUTER)? )?JOIN)\b/g;

function formatSql(sql) {
  const parts = sql.split(/('(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\n]*|\/\*[\s\S]*?\*\/)/);
  const out = parts.map((p, i) => {
    if (i % 2 === 1) return p.startsWith('--') ? `${p}\n` : p;
    return p
      .replace(/\s+/g, ' ')
      .replace(KW_RE, (m) => m.toUpperCase().replace(/\s+/g, ' '))
      .replace(CLAUSE_RE, '\n$1')
      .replace(/ (AND|OR) /g, '\n  $1 ');
  }).join('');
  return out.split('\n').map((l) => l.trimEnd()).join('\n').replace(/\n{2,}/g, '\n').trim();
}

// Finds where JSON first goes wrong (index into text), for browsers whose error has no position.
function errorIndex(t) {
  let i = 0;
  const bad = () => { throw i; };
  const ws = () => { while (i < t.length && ' \t\n\r'.includes(t[i])) i++; };
  const str = () => {
    i++;
    while (i < t.length && t[i] !== '"') { if (t[i] === '\n') bad(); i += t[i] === '\\' ? 2 : 1; }
    if (i >= t.length) bad();
    i++;
  };
  const value = () => {
    ws();
    const c = t[i];
    if (c === '{') {
      i++; ws();
      if (t[i] === '}') { i++; return; }
      for (;;) {
        ws(); if (t[i] !== '"') bad();
        str(); ws(); if (t[i] !== ':') bad();
        i++; value(); ws();
        if (t[i] === ',') { i++; continue; }
        if (t[i] === '}') { i++; return; }
        bad();
      }
    } else if (c === '[') {
      i++; ws();
      if (t[i] === ']') { i++; return; }
      for (;;) {
        value(); ws();
        if (t[i] === ',') { i++; continue; }
        if (t[i] === ']') { i++; return; }
        bad();
      }
    } else if (c === '"') str();
    else {
      const m = t.slice(i).match(/^(-?\d+(\.\d+)?([eE][+-]?\d+)?|true|false|null)/);
      if (!m) bad();
      i += m[0].length;
    }
  };
  try { value(); ws(); if (i < t.length) bad(); } catch (e) { return typeof e === 'number' ? e : i; }
  return -1;
}

// Works out a human line and column for a JSON.parse error, across browsers.
function jsonProblem(text, err) {
  const msg = String(err?.message || '');
  let line; let col;
  const lc = msg.match(/line (\d+) column (\d+)/i);
  if (lc) { line = Number(lc[1]); col = Number(lc[2]); } else {
    const pos = msg.match(/position (\d+)/i);
    const idx = pos ? Number(pos[1]) : errorIndex(text);
    if (idx >= 0) {
      const before = text.slice(0, idx);
      line = before.split('\n').length;
      col = before.length - before.lastIndexOf('\n');
    }
  }
  if (/unexpected end/i.test(msg)) {
    const lines = text.split('\n');
    line = lines.length; col = lines[lines.length - 1].length + 1;
    return `The JSON stops too early at line ${line}, column ${col}. Something is missing, such as a closing bracket or quote.`;
  }
  const where = line ? ` at line ${line}, column ${col}` : '';
  return `This is not valid JSON${where}. Check for a missing comma, a missing quote, or an extra comma near there.`;
}

function ident(name) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `"${name.replace(/"/g, '""')}"`;
}
function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return `'${s.replace(/'/g, "''")}'`;
}
function jsonToInsert(data, table) {
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0 || rows.some((r) => r === null || typeof r !== 'object' || Array.isArray(r))) {
    throw new Error('Please paste a JSON list of objects, like [{"name": "Ana"}, {"name": "Ben"}].');
  }
  const cols = [];
  rows.forEach((r) => Object.keys(r).forEach((k) => { if (!cols.includes(k)) cols.push(k); }));
  if (cols.length === 0) throw new Error('The objects are empty, so there are no columns to insert.');
  const values = rows.map((r) => `  (${cols.map((c) => sqlValue(r[c])).join(', ')})`);
  return `INSERT INTO ${ident(table)} (${cols.map(ident).join(', ')})\nVALUES\n${values.join(',\n')};`;
}

const SAMPLE_JSON = '{"name":"Ana","age":30,"tags":["a","b"]}';

export default function JsonSqlFormatter() {
  const [tab, setTab] = useState('json');
  const [json, setJson] = useState('');
  const [sql, setSql] = useState('');
  const [table, setTable] = useState('my_table');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState(null); // { ok, text }
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  const jsonId = useId();
  const sqlId = useId();
  const tableId = useId();

  const say = (ok, text) => setStatus({ ok, text });

  const parseJson = () => {
    if (!json.trim()) { say(false, 'Paste some JSON first.'); setOutput(''); return null; }
    try { return { data: JSON.parse(json) }; } catch (e) { say(false, jsonProblem(json, e)); setOutput(''); return null; }
  };
  const format = () => { const r = parseJson(); if (r) { setOutput(JSON.stringify(r.data, null, 2)); say(true, 'Formatted.'); } };
  const minify = () => { const r = parseJson(); if (r) { setOutput(JSON.stringify(r.data)); say(true, 'Minified. All the extra spaces are gone.'); } };
  const validate = () => { const r = parseJson(); if (r) { setOutput(''); say(true, 'This is valid JSON.'); } };
  const toInsert = () => {
    const r = parseJson();
    if (!r) return;
    if (!table.trim()) { say(false, 'Type a table name first.'); return; }
    try { setOutput(jsonToInsert(r.data, table.trim())); say(true, 'SQL INSERT made.'); } catch (e) { setOutput(''); say(false, e.message); }
  };
  const tidySql = () => {
    if (!sql.trim()) { say(false, 'Paste some SQL first.'); setOutput(''); return; }
    setOutput(formatSql(sql));
    say(true, 'SQL tidied.');
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      say(false, 'Your browser blocked copying. Select the result and press Ctrl+C instead.');
    }
  };

  const area = 'block w-full rounded-lg border border-line-strong bg-cream px-3 py-2 font-mono text-sm text-ink focus:outline focus:outline-3 focus:outline-wine';

  return (
    <ToolFrame
      path="/tools/json-sql-formatter"
      name="JSON & SQL Formatter"
      title="Make messy JSON or SQL neat"
      intro="Paste your code, choose what to do with it, and copy the tidy result."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-4">
          <ChoiceChips
            label="Type of code"
            options={[{ value: 'json', label: 'JSON' }, { value: 'sql', label: 'SQL' }]}
            value={tab}
            onChange={(v) => { setTab(v); setOutput(''); setStatus(null); }}
          />
          {tab === 'json' ? (
            <>
              <label htmlFor={jsonId} className="text-lg font-bold">Your JSON</label>
              <textarea id={jsonId} value={json} onChange={(e) => setJson(e.target.value)} rows={9} spellCheck={false} placeholder={SAMPLE_JSON} className={area} />
              <div className="flex flex-wrap items-end gap-3">
                <Button onClick={format}>Format</Button>
                <Button variant="secondary" onClick={minify}>Minify</Button>
                <Button variant="secondary" onClick={validate}>Validate</Button>
              </div>
              <div className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
                <div className="space-y-1">
                  <label htmlFor={tableId} className="text-sm font-semibold text-ink">Table name</label>
                  <input id={tableId} type="text" value={table} onChange={(e) => setTable(e.target.value)} className="block w-48 rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine" />
                </div>
                <Button variant="secondary" onClick={toInsert}>Turn into SQL INSERT</Button>
              </div>
            </>
          ) : (
            <>
              <label htmlFor={sqlId} className="text-lg font-bold">Your SQL</label>
              <textarea id={sqlId} value={sql} onChange={(e) => setSql(e.target.value)} rows={9} spellCheck={false} placeholder="select id, name from users where age > 18 order by name" className={area} />
              <Button onClick={tidySql}>Tidy up SQL</Button>
            </>
          )}
          {status && (
            <p className={`rounded-lg px-4 py-3 text-sm ${status.ok ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'}`} role={status.ok ? 'status' : 'alert'}>{status.text}</p>
          )}
        </Card>

        {output && (
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Result</h2>
              <Button variant="secondary" onClick={copy}><Copy size={18} aria-hidden="true" />{copied ? 'Copied' : 'Copy'}</Button>
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg bg-cream p-4 font-mono text-sm text-ink">{output}</pre>
          </Card>
        )}
      </div>
    </ToolFrame>
  );
}
