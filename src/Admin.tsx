import React, { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';
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

interface Project {
  title: string;
  period: string;
  desc: string;
  tech: string;
  link: string;
  icon: string;
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

function FileInput({
  label,
  file,
  onChange,
  accept,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  accept: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <label className="block mb-4">
      <span className="block text-xs text-[#888] mb-1">{label}</span>
      <div className="flex items-center gap-3">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="w-14 h-14 rounded object-cover border border-[#333] shrink-0" />
        ) : file ? (
          <div className="w-14 h-14 rounded border border-[#333] bg-[#0a0a0a] flex items-center justify-center shrink-0">
            <FileText size={20} className="text-[#555]" />
          </div>
        ) : null}
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="text-sm text-[#888]"
        />
      </div>
      {file && <p className="text-xs text-[#555] mt-1">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}
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
        <FileInput label="Certificate image or PDF" file={imageFile} onChange={setImageFile} accept="image/*,.pdf" />
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
            <div key={`${c.title}-${i}`} className="flex items-center gap-3 border border-[#222] bg-[#111] rounded px-3 py-2">
              <div className="w-12 h-12 rounded bg-[#0a0a0a] border border-[#222] shrink-0 overflow-hidden flex items-center justify-center">
                {c.image && !c.image.toLowerCase().endsWith('.pdf') ? (
                  <img src={c.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FileText size={18} className="text-[#555]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
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
        <FileInput label="Thumbnail image" file={imageFile} onChange={setImageFile} accept="image/*" />
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
            <div key={b.id} className="flex items-center gap-3 border border-[#222] bg-[#111] rounded px-3 py-2">
              <div className="w-12 h-12 rounded bg-[#0a0a0a] border border-[#222] shrink-0 overflow-hidden flex items-center justify-center">
                {b.image ? (
                  <img src={b.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={18} className="text-[#555]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
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

const PROJECT_ICONS = ['shield', 'lock', 'code', 'bug', 'target', 'monitor', 'search', 'radio'];

function ProjectsPanel({ token }: { token: string }) {
  const [items, setItems] = useState<Project[] | null>(null);
  const { status, setStatus } = useStatus();

  const [form, setForm] = useState({ title: '', period: '', desc: '', tech: '', link: '', icon: 'shield' });

  const load = async () => {
    const file = await getFile(token, 'src/data/projects.json');
    setItems(file ? JSON.parse(file.content) : []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addProject = async () => {
    if (!form.title.trim()) {
      setStatus({ type: 'err', msg: 'Title is required.' });
      return;
    }
    setStatus({ type: 'busy', msg: 'Updating projects.json…' });
    try {
      const latest = await getFile(token, 'src/data/projects.json');
      const current: Project[] = latest ? JSON.parse(latest.content) : [];
      const next = [...current, { ...form }];
      await putFile(
        token,
        'src/data/projects.json',
        utf8ToBase64(JSON.stringify(next, null, 2)),
        `Add project: ${form.title}`,
        latest?.sha
      );
      setStatus({ type: 'ok', msg: 'Project added. It will appear after the site rebuilds (~1 min).' });
      setForm({ title: '', period: '', desc: '', tech: '', link: '', icon: 'shield' });
      await load();
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed to add project.' });
    }
  };

  const removeProject = async (index: number) => {
    if (!items) return;
    if (!confirm(`Delete "${items[index].title}"?`)) return;
    setStatus({ type: 'busy', msg: 'Deleting…' });
    try {
      const latest = await getFile(token, 'src/data/projects.json');
      const current: Project[] = latest ? JSON.parse(latest.content) : [];
      const next = current.filter((_, i) => i !== index);
      await putFile(
        token,
        'src/data/projects.json',
        utf8ToBase64(JSON.stringify(next, null, 2)),
        `Remove project: ${current[index]?.title ?? ''}`,
        latest?.sha
      );
      setStatus({ type: 'ok', msg: 'Project removed.' });
      await load();
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed to delete project.' });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Add Project</h2>
        <TextField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <TextField label="Period (e.g. 2026)" value={form.period} onChange={(v) => setForm({ ...form, period: v })} />
        <TextField label="Description" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} textarea />
        <TextField label="Tech stack (e.g. Python · React · GitHub)" value={form.tech} onChange={(v) => setForm({ ...form, tech: v })} />
        <TextField label="Project link (optional)" value={form.link} onChange={(v) => setForm({ ...form, link: v })} />
        <label className="block mb-4">
          <span className="block text-xs text-[#888] mb-1">Icon</span>
          <select
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none"
          >
            {PROJECT_ICONS.map((i) => (
              <option key={i} value={i}>
                {i.charAt(0).toUpperCase() + i.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={addProject}
          disabled={status.type === 'busy'}
          className="px-4 py-2 rounded bg-[#3d6fd4] hover:bg-[#5a8dee] disabled:opacity-50 text-white text-sm font-medium transition"
        >
          {status.type === 'busy' ? 'Working…' : 'Add Project'}
        </button>
        {status.msg && (
          <p className={`text-xs mt-3 ${status.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{status.msg}</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Existing Projects ({items?.length ?? '…'})</h2>
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {items?.map((p, i) => (
            <div key={`${p.title}-${i}`} className="flex items-center justify-between gap-3 border border-[#222] bg-[#111] rounded px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{p.title}</div>
                <div className="text-xs text-[#888]">{p.period}</div>
              </div>
              <button onClick={() => removeProject(i)} className="text-xs text-red-400 hover:text-red-300 shrink-0">
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROFILE PANEL
   ═══════════════════════════════════════════════════════ */
function ProfilePanel({ token }: { token: string }) {
  const { status, setStatus } = useStatus();
  const [form, setForm] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    getFile(token, 'src/data/profile.json').then(f => {
      if (f) setForm(JSON.parse(f.content));
    });
  }, []);

  const save = async () => {
    if (!form) return;
    setStatus({ type: 'busy', msg: 'Saving…' });
    try {
      const latest = await getFile(token, 'src/data/profile.json');
      await putFile(token, 'src/data/profile.json',
        utf8ToBase64(JSON.stringify(form, null, 2)),
        'Update profile data', latest?.sha);
      setStatus({ type: 'ok', msg: 'Profile saved. Site rebuilds in ~1 min.' });
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed.' });
    }
  };

  if (!form) return <p className="text-[#888] text-sm">Loading…</p>;

  const fields: { key: string; label: string; textarea?: boolean }[] = [
    { key: 'availabilityPill',  label: 'Availability Pill text' },
    { key: 'intro',             label: 'Career Profile intro paragraph', textarea: true },
    { key: 'aboutParagraph1',   label: 'About — Paragraph 1', textarea: true },
    { key: 'aboutParagraph2',   label: 'About — Paragraph 2', textarea: true },
    { key: 'degree',            label: 'Degree' },
    { key: 'college',           label: 'College' },
    { key: 'cgpa',              label: 'CGPA' },
    { key: 'city',              label: 'City' },
    { key: 'email',             label: 'Email' },
    { key: 'focus',             label: 'Focus (About section)' },
    { key: 'ctaText',           label: 'CTA heading' },
    { key: 'ctaSub',            label: 'CTA subtext' },
  ];

  const statsForm = (form as any).heroStats as Record<string, string> | undefined;

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-white mb-4">Profile & About</h2>
      {fields.map(f => (
        <TextField key={f.key} label={f.label} textarea={f.textarea}
          value={(form as any)[f.key] ?? ''}
          onChange={v => setForm({ ...form, [f.key]: v })} />
      ))}
      <h3 className="text-sm font-semibold text-white mt-4 mb-2">Hero Stats</h3>
      {statsForm && ['incidentReports','labsLabel','labsSublabel'].map(k => (
        <TextField key={k} label={k}
          value={statsForm[k] ?? ''}
          onChange={v => setForm({ ...form, heroStats: { ...statsForm, [k]: v } } as any)} />
      ))}
      <button onClick={save} disabled={status.type === 'busy'}
        className="px-4 py-2 rounded bg-[#3d6fd4] hover:bg-[#5a8dee] disabled:opacity-50 text-white text-sm font-medium transition">
        {status.type === 'busy' ? 'Saving…' : 'Save Profile'}
      </button>
      {status.msg && <p className={`text-xs mt-3 ${status.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{status.msg}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SKILLS PANEL
   ═══════════════════════════════════════════════════════ */
interface SkillCategory { category: string; tags: string[]; }

function SkillsPanel({ token }: { token: string }) {
  const [items, setItems] = useState<SkillCategory[] | null>(null);
  const { status, setStatus } = useStatus();
  const [newCat, setNewCat] = useState('');

  const load = async () => {
    const f = await getFile(token, 'src/data/skills.json');
    if (f) setItems(JSON.parse(f.content));
  };
  useEffect(() => { load(); }, []);

  const save = async (next: SkillCategory[]) => {
    setStatus({ type: 'busy', msg: 'Saving…' });
    try {
      const latest = await getFile(token, 'src/data/skills.json');
      await putFile(token, 'src/data/skills.json',
        utf8ToBase64(JSON.stringify(next, null, 2)),
        'Update skills', latest?.sha);
      setItems(next);
      setStatus({ type: 'ok', msg: 'Skills saved. Rebuilds in ~1 min.' });
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed.' });
    }
  };

  const updateTags = (idx: number, raw: string) => {
    if (!items) return;
    const next = items.map((c, i) =>
      i === idx ? { ...c, tags: raw.split(',').map(t => t.trim()).filter(Boolean) } : c);
    setItems(next);
  };

  const addCategory = () => {
    if (!newCat.trim() || !items) return;
    setItems([...items, { category: newCat.trim(), tags: [] }]);
    setNewCat('');
  };

  const removeCategory = (idx: number) => {
    if (!items) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  if (!items) return <p className="text-[#888] text-sm">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-white mb-4">Technical Skills</h2>
      <p className="text-xs text-[#888] mb-4">Each category has comma-separated skill tags.</p>
      <div className="space-y-4 mb-6">
        {items.map((cat, idx) => (
          <div key={idx} className="border border-[#222] rounded p-3 bg-[#111]">
            <div className="flex items-center justify-between mb-2">
              <input value={cat.category}
                onChange={e => setItems(items.map((c, i) => i === idx ? { ...c, category: e.target.value } : c))}
                className="flex-1 px-2 py-1 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none focus:border-[#3d6fd4] mr-2"
              />
              <button onClick={() => removeCategory(idx)} className="text-xs text-red-400 hover:text-red-300 shrink-0">Remove</button>
            </div>
            <textarea
              value={cat.tags.join(', ')}
              onChange={e => updateTags(idx, e.target.value)}
              rows={2}
              placeholder="Tag 1, Tag 2, Tag 3"
              className="w-full px-2 py-1 rounded bg-[#0a0a0a] border border-[#333] text-xs outline-none focus:border-[#3d6fd4]"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name"
          className="flex-1 px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none focus:border-[#3d6fd4]" />
        <button onClick={addCategory} className="px-3 py-2 rounded bg-[#141414] border border-[#333] text-sm text-white hover:border-[#3d6fd4]">+ Add</button>
      </div>
      <button onClick={() => save(items)} disabled={status.type === 'busy'}
        className="px-4 py-2 rounded bg-[#3d6fd4] hover:bg-[#5a8dee] disabled:opacity-50 text-white text-sm font-medium transition">
        {status.type === 'busy' ? 'Saving…' : 'Save Skills'}
      </button>
      {status.msg && <p className={`text-xs mt-3 ${status.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{status.msg}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EXPERIENCE PANEL
   ═══════════════════════════════════════════════════════ */
interface ExpEntry { id: number; role: string; org: string; period: string; type: string; badge: string; bullets: string[]; achievement: string; }

function ExperiencePanel({ token }: { token: string }) {
  const [items, setItems] = useState<ExpEntry[] | null>(null);
  const { status, setStatus } = useStatus();
  const blank: Omit<ExpEntry,'id'> = { role:'', org:'', period:'', type:'formal', badge:'Internship', bullets:[], achievement:'' };
  const [form, setForm] = useState(blank);

  const load = async () => {
    const f = await getFile(token, 'src/data/experience.json');
    if (f) setItems(JSON.parse(f.content));
  };
  useEffect(() => { load(); }, []);

  const save = async (next: ExpEntry[]) => {
    setStatus({ type: 'busy', msg: 'Saving…' });
    try {
      const latest = await getFile(token, 'src/data/experience.json');
      await putFile(token, 'src/data/experience.json',
        utf8ToBase64(JSON.stringify(next, null, 2)),
        `Update experience`, latest?.sha);
      setItems(next);
      setStatus({ type: 'ok', msg: 'Saved. Rebuilds in ~1 min.' });
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed.' });
    }
  };

  const add = () => {
    if (!form.role.trim() || !items) return;
    const next = [...items, { ...form, id: Date.now(), bullets: form.bullets }];
    save(next);
    setForm(blank);
  };

  const remove = (id: number) => {
    if (!items || !confirm('Remove this entry?')) return;
    save(items.filter(e => e.id !== id));
  };

  if (!items) return <p className="text-[#888] text-sm">Loading…</p>;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Add Experience</h2>
        <TextField label="Role / Title" value={form.role} onChange={v => setForm({...form, role: v})} />
        <TextField label="Organisation" value={form.org} onChange={v => setForm({...form, org: v})} />
        <TextField label="Period (e.g. Mar 2024 – Apr 2024)" value={form.period} onChange={v => setForm({...form, period: v})} />
        <label className="block mb-3">
          <span className="block text-xs text-[#888] mb-1">Type</span>
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
            className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none">
            <option value="formal">Formal (Internship)</option>
            <option value="lab">Hands-on / Lab</option>
          </select>
        </label>
        <TextField label="Badge label (e.g. Internship)" value={form.badge} onChange={v => setForm({...form, badge: v})} />
        <TextField label="Bullet points (one per line)" textarea value={form.bullets.join('\n')}
          onChange={v => setForm({...form, bullets: v.split('\n').map(s=>s.trim()).filter(Boolean)})} />
        <TextField label="Achievement note (optional)" value={form.achievement} onChange={v => setForm({...form, achievement: v})} />
        <button onClick={add} disabled={status.type === 'busy'}
          className="px-4 py-2 rounded bg-[#3d6fd4] hover:bg-[#5a8dee] disabled:opacity-50 text-white text-sm font-medium transition">
          {status.type === 'busy' ? 'Working…' : 'Add Entry'}
        </button>
        {status.msg && <p className={`text-xs mt-3 ${status.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{status.msg}</p>}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Existing ({items.length})</h2>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {items.map(e => (
            <div key={e.id} className="flex items-start justify-between gap-3 border border-[#222] bg-[#111] rounded px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{e.role}</div>
                <div className="text-xs text-[#888]">{e.org} · {e.period}</div>
                <div className="text-xs text-[#555] mt-0.5">{e.bullets.length} bullet{e.bullets.length !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => remove(e.id)} className="text-xs text-red-400 hover:text-red-300 shrink-0">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EDUCATION PANEL
   ═══════════════════════════════════════════════════════ */
interface EduEntry { id: number; period: string; degree: string; org: string; score: string; primary: boolean; }

function EducationPanel({ token }: { token: string }) {
  const [items, setItems] = useState<EduEntry[] | null>(null);
  const { status, setStatus } = useStatus();
  const blank: Omit<EduEntry,'id'> = { period:'', degree:'', org:'', score:'', primary: false };
  const [form, setForm] = useState(blank);

  const load = async () => {
    const f = await getFile(token, 'src/data/education.json');
    if (f) setItems(JSON.parse(f.content));
  };
  useEffect(() => { load(); }, []);

  const save = async (next: EduEntry[]) => {
    setStatus({ type: 'busy', msg: 'Saving…' });
    try {
      const latest = await getFile(token, 'src/data/education.json');
      await putFile(token, 'src/data/education.json',
        utf8ToBase64(JSON.stringify(next, null, 2)),
        'Update education', latest?.sha);
      setItems(next);
      setStatus({ type: 'ok', msg: 'Saved. Rebuilds in ~1 min.' });
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed.' });
    }
  };

  const add = () => {
    if (!form.degree.trim() || !items) return;
    save([...items, { ...form, id: Date.now() }]);
    setForm(blank);
  };

  const remove = (id: number) => {
    if (!items || !confirm('Remove?')) return;
    save(items.filter(e => e.id !== id));
  };

  if (!items) return <p className="text-[#888] text-sm">Loading…</p>;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Add Education</h2>
        <TextField label="Period (e.g. 2024 – 2028)" value={form.period} onChange={v => setForm({...form, period: v})} />
        <TextField label="Degree / Qualification" value={form.degree} onChange={v => setForm({...form, degree: v})} />
        <TextField label="Institution" value={form.org} onChange={v => setForm({...form, org: v})} />
        <TextField label="Score (e.g. CGPA: 8.17 / 10)" value={form.score} onChange={v => setForm({...form, score: v})} />
        <label className="flex items-center gap-2 mb-4 text-sm text-[#888] cursor-pointer">
          <input type="checkbox" checked={form.primary} onChange={e => setForm({...form, primary: e.target.checked})} />
          Mark as primary (blue accent border)
        </label>
        <button onClick={add} disabled={status.type === 'busy'}
          className="px-4 py-2 rounded bg-[#3d6fd4] hover:bg-[#5a8dee] disabled:opacity-50 text-white text-sm font-medium transition">
          {status.type === 'busy' ? 'Working…' : 'Add Entry'}
        </button>
        {status.msg && <p className={`text-xs mt-3 ${status.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{status.msg}</p>}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Existing ({items.length})</h2>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {items.map(e => (
            <div key={e.id} className="flex items-start justify-between gap-3 border border-[#222] bg-[#111] rounded px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{e.degree}</div>
                <div className="text-xs text-[#888]">{e.org} · {e.period}</div>
                <div className="text-xs text-[#555]">{e.score}{e.primary ? ' · primary' : ''}</div>
              </div>
              <button onClick={() => remove(e.id)} className="text-xs text-red-400 hover:text-red-300 shrink-0">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ACHIEVEMENTS PANEL
   ═══════════════════════════════════════════════════════ */
interface AchEntry { id: number; title: string; sub: string; icon: string; color: string; }

function AchievementsPanel({ token }: { token: string }) {
  const [items, setItems] = useState<AchEntry[] | null>(null);
  const { status, setStatus } = useStatus();
  const blank: Omit<AchEntry,'id'> = { title:'', sub:'', icon:'award', color:'blue' };
  const [form, setForm] = useState(blank);

  const load = async () => {
    const f = await getFile(token, 'src/data/achievements.json');
    if (f) setItems(JSON.parse(f.content));
  };
  useEffect(() => { load(); }, []);

  const save = async (next: AchEntry[]) => {
    setStatus({ type: 'busy', msg: 'Saving…' });
    try {
      const latest = await getFile(token, 'src/data/achievements.json');
      await putFile(token, 'src/data/achievements.json',
        utf8ToBase64(JSON.stringify(next, null, 2)),
        'Update achievements', latest?.sha);
      setItems(next);
      setStatus({ type: 'ok', msg: 'Saved. Rebuilds in ~1 min.' });
    } catch (e) {
      setStatus({ type: 'err', msg: e instanceof Error ? e.message : 'Failed.' });
    }
  };

  const add = () => {
    if (!form.title.trim() || !items) return;
    save([...items, { ...form, id: Date.now() }]);
    setForm(blank);
  };

  const remove = (id: number) => {
    if (!items || !confirm('Remove?')) return;
    save(items.filter(a => a.id !== id));
  };

  if (!items) return <p className="text-[#888] text-sm">Loading…</p>;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Add Achievement</h2>
        <TextField label="Title" value={form.title} onChange={v => setForm({...form, title: v})} />
        <TextField label="Subtitle / Source" value={form.sub} onChange={v => setForm({...form, sub: v})} />
        <label className="block mb-3">
          <span className="block text-xs text-[#888] mb-1">Icon</span>
          <select value={form.icon} onChange={e => setForm({...form, icon: e.target.value})}
            className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none">
            {['trophy','award','target','radio','shield','star'].map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
        <label className="block mb-4">
          <span className="block text-xs text-[#888] mb-1">Accent colour</span>
          <select value={form.color} onChange={e => setForm({...form, color: e.target.value})}
            className="w-full px-3 py-2 rounded bg-[#0a0a0a] border border-[#333] text-sm outline-none">
            <option value="gold">Gold</option>
            <option value="blue">Blue</option>
          </select>
        </label>
        <button onClick={add} disabled={status.type === 'busy'}
          className="px-4 py-2 rounded bg-[#3d6fd4] hover:bg-[#5a8dee] disabled:opacity-50 text-white text-sm font-medium transition">
          {status.type === 'busy' ? 'Working…' : 'Add Achievement'}
        </button>
        {status.msg && <p className={`text-xs mt-3 ${status.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{status.msg}</p>}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Existing ({items.length})</h2>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {items.map(a => (
            <div key={a.id} className="flex items-start justify-between gap-3 border border-[#222] bg-[#111] rounded px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{a.title}</div>
                <div className="text-xs text-[#888]">{a.sub}</div>
                <div className="text-xs text-[#555]">{a.icon} · {a.color}</div>
              </div>
              <button onClick={() => remove(a.id)} className="text-xs text-red-400 hover:text-red-300 shrink-0">Delete</button>
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
  const [tab, setTab] = useState<'certs' | 'blogs' | 'projects' | 'profile' | 'skills' | 'experience' | 'education' | 'achievements'>('certs');

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

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'profile',      label: 'Profile'      },
    { id: 'skills',       label: 'Skills'       },
    { id: 'experience',   label: 'Experience'   },
    { id: 'education',    label: 'Education'    },
    { id: 'achievements', label: 'Achievements' },
    { id: 'certs',        label: 'Certificates' },
    { id: 'blogs',        label: 'Blogs'        },
    { id: 'projects',     label: 'Projects'     },
  ];

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

      <div className="flex flex-wrap gap-2 px-6 pt-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded text-sm ${
              tab === t.id ? 'bg-[#3d6fd4] text-white' : 'bg-[#141414] text-[#888] border border-[#222]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="p-6">
        {tab === 'certs'        && <CertificatesPanel  token={token} />}
        {tab === 'blogs'        && <BlogsPanel         token={token} />}
        {tab === 'projects'     && <ProjectsPanel      token={token} />}
        {tab === 'profile'      && <ProfilePanel       token={token} />}
        {tab === 'skills'       && <SkillsPanel        token={token} />}
        {tab === 'experience'   && <ExperiencePanel    token={token} />}
        {tab === 'education'    && <EducationPanel     token={token} />}
        {tab === 'achievements' && <AchievementsPanel  token={token} />}
      </main>
    </div>
  );
}
