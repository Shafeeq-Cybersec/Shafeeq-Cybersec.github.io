import React, { useEffect, useState } from 'react';
import {
  getFile,
  putFile,
  deleteFile,
  fileToBase64,
  utf8ToBase64,
  slugifyFilename,
  verifyToken,
  GitHubApiError,
} from './lib/github';

const TOKEN_KEY = 'admin_gh_token';

interface Certificate {
  cat: string;
  title: string;
  sub: string;
  image: string;
  pdf: string;
  icon: string;
}

interface Blog {
  id: number;
  date: string;
  author: string;
  title: string;
  desc: string;
  cat: string;
  image: string;
  link: string;
  content: string;
}

function useStatus() {
  const [status, setStatus] = useState<{ type: 'idle' | 'busy' | 'ok' | 'err'; msg: string }>({
    type: 'idle',
    msg: '',
  });
  return { status, setStatus };
}

function Login({ onLoggedIn }: { onLoggedIn: (token: string, login: string) => void }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const { login } = await verifyToken(token.trim());
      localStorage.setItem(TOKEN_KEY, token.trim());
      onLoggedIn(token.trim(), login);
    } catch (e) {
      setError(e instanceof GitHubApiError ? e.message : 'Could not verify token.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#e0e0e0] font-mono px-4">
      <div className="w-full max-w-md border border-[#222] bg-[#141414] rounded-lg p-8">
        <h1 className="text-xl font-bold mb-1 text-white">Admin Login</h1>
        <p className="text-sm text-[#888] mb-6">
          Paste a GitHub Personal Access Token with access to this repository. It is stored only in this
          browser (localStorage) and used to commit content updates directly to the repo.
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="github_pat_..."
          className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm mb-3 outline-none focus:border-[#3d6fd4]"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <button
          onClick={submit}
          disabled={busy || !token.trim()}
          className="w-full py-2 rounded bg-[#3d6fd4] hover:bg-[#5a8dee] disabled:opacity-50 text-white text-sm font-medium transition"
        >
          {busy ? 'Verifying…' : 'Log in'}
        </button>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs text-[#888] mb-1">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none focus:border-[#3d6fd4]"
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none focus:border-[#3d6fd4]"
        />
      )}
    </label>
  );
}

const NEW_CATEGORY = '__new__';

function CategoryPicker({
  label,
  value,
  onChange,
  existingCategories,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  existingCategories: string[];
}) {
  const isKnown = value === '' || existingCategories.some((c) => c.toLowerCase() === value.toLowerCase());
  const [adding, setAdding] = useState(!isKnown);

  return (
    <label className="block mb-3">
      <span className="block text-xs text-[#888] mb-1">{label}</span>
      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="New category name"
            className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none focus:border-[#3d6fd4]"
          />
          {existingCategories.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                onChange(existingCategories[0]);
              }}
              className="px-2 text-xs text-[#888] hover:text-white shrink-0"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === NEW_CATEGORY) {
              setAdding(true);
              onChange('');
            } else {
              onChange(e.target.value);
            }
          }}
          className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none"
        >
          {existingCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={NEW_CATEGORY}>+ Add new category…</option>
        </select>
      )}
    </label>
  );
}

function CertificatesPanel({ token }: { token: string }) {
  const [items, setItems] = useState<Certificate[] | null>(null);
  const [sha, setSha] = useState<string | undefined>();
  const { status, setStatus } = useStatus();

  const [form, setForm] = useState({ cat: '', title: '', sub: '', pdf: '', icon: 'shield' });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = async () => {
    const file = await getFile(token, 'src/data/certificates.json');
    const loaded: Certificate[] = file ? JSON.parse(file.content) : [];
    setItems(loaded);
    setSha(file?.sha);
    if (loaded.length) {
      const cats = Array.from(new Set(loaded.map((c) => c.cat).filter(Boolean)));
      setForm((f) => (f.cat ? f : { ...f, cat: cats[0] }));
    }
  };

  const existingCategories = Array.from(new Set((items ?? []).map((c) => c.cat).filter(Boolean))).sort();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCertificate = async () => {
    if (!form.title.trim() || !imageFile) {
      setStatus({ type: 'err', msg: 'Title and image are required.' });
      return;
    }
    setStatus({ type: 'busy', msg: 'Uploading image…' });
    try {
      const filename = slugifyFilename(imageFile.name);
      const imgBase64 = await fileToBase64(imageFile);
      await putFile(token, `public/certificates/${filename}`, imgBase64, `Add certificate image: ${form.title}`);

      setStatus({ type: 'busy', msg: 'Updating certificates.json…' });
      const latest = await getFile(token, 'src/data/certificates.json');
      const current: Certificate[] = latest ? JSON.parse(latest.content) : [];
      const next = [
        ...current,
        {
          cat: form.cat || 'Others',
          title: form.title,
          sub: form.sub,
          image: `/certificates/${filename}`,
          pdf: form.pdf,
          icon: form.icon,
        },
      ];
      await putFile(
        token,
        'src/data/certificates.json',
        utf8ToBase64(JSON.stringify(next, null, 2)),
        `Add certificate: ${form.title}`,
        latest?.sha
      );
      setStatus({ type: 'ok', msg: 'Certificate added. It will appear after the site rebuilds (~1 min).' });
      setForm({ cat: form.cat, title: '', sub: '', pdf: '', icon: 'shield' });
      setImageFile(null);
      await load();
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed to add certificate.' });
    }
  };

  const removeCertificate = async (index: number) => {
    if (!items) return;
    if (!confirm(`Delete "${items[index].title}"?`)) return;
    setStatus({ type: 'busy', msg: 'Deleting…' });
    try {
      const latest = await getFile(token, 'src/data/certificates.json');
      const current: Certificate[] = latest ? JSON.parse(latest.content) : [];
      const next = current.filter((_, i) => i !== index);
      await putFile(
        token,
        'src/data/certificates.json',
        utf8ToBase64(JSON.stringify(next, null, 2)),
        `Remove certificate: ${current[index]?.title ?? ''}`,
        latest?.sha
      );
      setStatus({ type: 'ok', msg: 'Certificate removed.' });
      await load();
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed to delete certificate.' });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Add Certificate</h2>
        <CategoryPicker
          label="Category (shown as a filter tab on the site)"
          value={form.cat}
          onChange={(v) => setForm({ ...form, cat: v })}
          existingCategories={existingCategories}
        />
        <TextField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <TextField label="Subtitle / Issuer" value={form.sub} onChange={(v) => setForm({ ...form, sub: v })} />
        <TextField label="PDF link (optional)" value={form.pdf} onChange={(v) => setForm({ ...form, pdf: v })} />
        <label className="block mb-3">
          <span className="block text-xs text-[#888] mb-1">Fallback icon</span>
          <select
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none"
          >
            <option value="shield">Shield</option>
            <option value="award">Award</option>
            <option value="trophy">Trophy</option>
          </select>
        </label>
        <label className="block mb-4">
          <span className="block text-xs text-[#888] mb-1">Certificate image or PDF</span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="text-sm text-[#888]"
          />
        </label>
        <button
          onClick={addCertificate}
          disabled={status.type === 'busy'}
          className="px-4 py-2 rounded bg-[#3d6fd4] hover:bg-[#5a8dee] disabled:opacity-50 text-white text-sm font-medium transition"
        >
          {status.type === 'busy' ? 'Working…' : 'Add Certificate'}
        </button>
        {status.msg && (
          <p className={`text-xs mt-3 ${status.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{status.msg}</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Existing Certificates ({items?.length ?? '…'})</h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {items?.map((c, i) => (
            <div key={`${c.title}-${i}`} className="flex items-center justify-between gap-3 border border-[#222] bg-[#111] rounded px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{c.title}</div>
                <div className="text-xs text-[#888]">{c.cat} · {c.sub}</div>
              </div>
              <button
                onClick={() => removeCertificate(i)}
                className="text-xs text-red-400 hover:text-red-300 shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlogsPanel({ token }: { token: string }) {
  const [items, setItems] = useState<Blog[] | null>(null);
  const { status, setStatus } = useStatus();

  const [form, setForm] = useState({
    title: '',
    date: '',
    author: 'Shafeeq S',
    cat: '',
    desc: '',
    link: '',
    content: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = async () => {
    const file = await getFile(token, 'src/data/blogs.json');
    const loaded: Blog[] = file ? JSON.parse(file.content) : [];
    setItems(loaded);
    if (loaded.length) {
      const cats = Array.from(new Set(loaded.map((b) => b.cat).filter(Boolean)));
      setForm((f) => (f.cat ? f : { ...f, cat: cats[0] }));
    }
  };

  const existingCategories = Array.from(new Set((items ?? []).map((b) => b.cat).filter(Boolean))).sort();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addBlog = async () => {
    if (!form.title.trim() || !imageFile) {
      setStatus({ type: 'err', msg: 'Title and image are required.' });
      return;
    }
    setStatus({ type: 'busy', msg: 'Uploading image…' });
    try {
      const filename = slugifyFilename(imageFile.name);
      const imgBase64 = await fileToBase64(imageFile);
      await putFile(token, `public/blogs/${filename}`, imgBase64, `Add blog image: ${form.title}`);

      setStatus({ type: 'busy', msg: 'Updating blogs.json…' });
      const latest = await getFile(token, 'src/data/blogs.json');
      const current: Blog[] = latest ? JSON.parse(latest.content) : [];
      const nextId = current.length ? Math.max(...current.map((b) => b.id)) + 1 : 1;
      const next = [
        {
          id: nextId,
          date: form.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          author: form.author || 'Shafeeq S',
          title: form.title,
          desc: form.desc,
          cat: form.cat || 'Case Study',
          image: `/blogs/${filename}`,
          link: form.link,
          content: form.content,
        },
        ...current,
      ];
      await putFile(
        token,
        'src/data/blogs.json',
        utf8ToBase64(JSON.stringify(next, null, 2)),
        `Add blog: ${form.title}`,
        latest?.sha
      );
      setStatus({ type: 'ok', msg: 'Blog added. It will appear after the site rebuilds (~1 min).' });
      setForm({ title: '', date: '', author: 'Shafeeq S', cat: form.cat, desc: '', link: '', content: '' });
      setImageFile(null);
      await load();
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed to add blog.' });
    }
  };

  const removeBlog = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    setStatus({ type: 'busy', msg: 'Deleting…' });
    try {
      const latest = await getFile(token, 'src/data/blogs.json');
      const current: Blog[] = latest ? JSON.parse(latest.content) : [];
      const next = current.filter((b) => b.id !== id);
      await putFile(
        token,
        'src/data/blogs.json',
        utf8ToBase64(JSON.stringify(next, null, 2)),
        `Remove blog: ${title}`,
        latest?.sha
      );
      setStatus({ type: 'ok', msg: 'Blog removed.' });
      await load();
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed to delete blog.' });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Add Blog Post</h2>
        <TextField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <TextField label="Date (e.g. 18 Jul, 2026)" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
        <TextField label="Author" value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
        <CategoryPicker
          label="Category"
          value={form.cat}
          onChange={(v) => setForm({ ...form, cat: v })}
          existingCategories={existingCategories}
        />
        <TextField label="Short description" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} textarea />
        <TextField label="External link (optional)" value={form.link} onChange={(v) => setForm({ ...form, link: v })} />
        <TextField label="Content (Markdown)" value={form.content} onChange={(v) => setForm({ ...form, content: v })} textarea />
        <label className="block mb-4">
          <span className="block text-xs text-[#888] mb-1">Thumbnail image</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="text-sm text-[#888]"
          />
        </label>
        <button
          onClick={addBlog}
          disabled={status.type === 'busy'}
          className="px-4 py-2 rounded bg-[#3d6fd4] hover:bg-[#5a8dee] disabled:opacity-50 text-white text-sm font-medium transition"
        >
          {status.type === 'busy' ? 'Working…' : 'Add Blog Post'}
        </button>
        {status.msg && (
          <p className={`text-xs mt-3 ${status.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{status.msg}</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Existing Blog Posts ({items?.length ?? '…'})</h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {items?.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 border border-[#222] bg-[#111] rounded px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{b.title}</div>
                <div className="text-xs text-[#888]">{b.date} · {b.cat}</div>
              </div>
              <button onClick={() => removeBlog(b.id, b.title)} className="text-xs text-red-400 hover:text-red-300 shrink-0">
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [login, setLogin] = useState<string | null>(null);
  const [tab, setTab] = useState<'certs' | 'blogs'>('certs');

  useEffect(() => {
    if (token && !login) {
      verifyToken(token)
        .then((r) => setLogin(r.login))
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        });
    }
  }, [token, login]);

  if (!token) {
    return (
      <Login
        onLoggedIn={(t, l) => {
          setToken(t);
          setLogin(l);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono">
      <header className="border-b border-[#222] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold">Portfolio Admin</h1>
          <p className="text-xs text-[#888]">Signed in as {login ?? '…'}</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-[#888] hover:text-white">
            ← Back to site
          </a>
          <button
            onClick={() => {
              localStorage.removeItem(TOKEN_KEY);
              setToken(null);
              setLogin(null);
            }}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="flex gap-2 px-6 pt-4">
        {(['certs', 'blogs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-sm ${
              tab === t ? 'bg-[#3d6fd4] text-white' : 'bg-[#141414] text-[#888] border border-[#222]'
            }`}
          >
            {t === 'certs' ? 'Certificates' : 'Blogs'}
          </button>
        ))}
      </div>

      <main className="p-6">{tab === 'certs' ? <CertificatesPanel token={token} /> : <BlogsPanel token={token} />}</main>
    </div>
  );
}
