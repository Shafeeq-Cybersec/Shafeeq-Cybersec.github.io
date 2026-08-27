/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Shield, 
  ShieldCheck,
  GraduationCap, 
  School, 
  BarChart2, 
  MapPin, 
  Mail, 
  Search, 
  Briefcase, 
  Code, 
  Recycle, 
  FileText, 
  Microscope, 
  Trophy, 
  Settings, 
  Award, 
  Radio, 
  Lock, 
  Target, 
  Monitor, 
  Bug, 
  Fish, 
  AlertTriangle,
  Calendar,
  Linkedin,
  Github,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Phone,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

import { certificates, blogs, roles, projects } from './data';
import CyberShield from './components/CyberShield';
import DataDebris from './components/DataDebris';

interface CertCardProps {
  cert: any;
  index: number;
  onOpen: (index: number) => void;
}

function CertCard({ cert, index, onOpen }: CertCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const isPdf = cert.image?.toLowerCase().endsWith('.pdf');

  return (
    <div className="cert-card group">
      <div className="cert-badge">{cert.cat}</div>
      <div 
        className="cert-thumb overflow-hidden rounded relative cursor-pointer group h-48 bg-[#0a0a0a]"
        onClick={() => onOpen(index)}
      >
        {cert.image && !imgError ? (
          isPdf ? (
            <div className="flex flex-col items-center justify-center h-full text-blue-500 bg-blue-500/5">
              <FileText size={48} />
              <span className="text-[10px] mt-2 font-mono uppercase tracking-wider">PDF Certificate</span>
              <span className="text-[8px] text-gray-500 mt-1">Click to view on GitHub</span>
            </div>
          ) : (
            <img 
              src={cert.image} 
              alt={cert.title} 
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-blue-500/40 bg-blue-500/5">
            {cert.icon || <Shield size={48} />}
            {imgError && (
              <span className="text-[8px] text-gray-600 mt-3 font-mono">Image loading failed</span>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-2 bg-blue-600 rounded-full text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Search size={20} />
          </div>
        </div>
      </div>
      <div className="cert-info">
        <div className="cert-title">{cert.title}</div>
        <div className="cert-sub">{cert.sub}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [typedText, setTypedText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [certFilter, setCertFilter] = useState('all');
  const [blogPage, setBlogPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedCertIndex, setSelectedCertIndex] = useState<number | null>(null);
  const [selectedBlogIndex, setSelectedBlogIndex] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isBlogHovered, setIsBlogHovered] = useState(false);

  // Typing effect logic
  useEffect(() => {
    let rIdx = 0;
    let cIdx = 0;
    let del = false;
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      const cur = roles[rIdx];
      setTypedText(del ? cur.substring(0, cIdx--) : cur.substring(0, cIdx++));
      
      if (!del && cIdx > cur.length) {
        del = true;
        timeoutId = setTimeout(type, 1800);
        return;
      }
      
      if (del && cIdx < 0) {
        del = false;
        rIdx = (rIdx + 1) % roles.length;
      }
      
      timeoutId = setTimeout(type, del ? 55 : 95);
    };

    type();
    return () => clearTimeout(timeoutId);
  }, []);

  // Scroll logic for active nav link and scroll-to-top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      const sections = document.querySelectorAll('section[id]');
      let current = 'home';
      sections.forEach(s => {
        const offset = (s as HTMLElement).offsetTop - 100;
        if (window.scrollY >= offset) current = s.id;
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const certs = certificates;

  const certCategories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of certs) {
      const key = c.cat.toLowerCase().trim();
      if (!seen.has(key)) seen.set(key, c.cat.trim());
    }
    const keys = Array.from(seen.keys()).sort((a, b) => {
      if (a === 'others') return 1;
      if (b === 'others') return -1;
      return 0;
    });
    return ['all', ...keys];
  }, [certs]);

  const certCategoryLabels: Record<string, string> = useMemo(() => {
    const labels: Record<string, string> = { all: 'All' };
    for (const c of certs) {
      const key = c.cat.toLowerCase().trim();
      if (!labels[key]) labels[key] = c.cat.trim();
    }
    return labels;
  }, [certs]);

  const filteredCerts = useMemo(() => {
    const currentFilter = certFilter.toLowerCase();
    if (currentFilter === 'all') return certs;
    return certs.filter(c => c.cat.toLowerCase().trim() === currentFilter);
  }, [certs, certFilter]);

  useEffect(() => {
    setSelectedCertIndex(null);
  }, [certFilter]);

  const BLOGS_PER_PAGE = 3;
  const totalBlogPages = Math.ceil(blogs.length / BLOGS_PER_PAGE);

  // Auto-move blog pages (pauses on hover for comfortable reading)
  useEffect(() => {
    if (totalBlogPages <= 1 || isBlogHovered) return;
    const interval = setInterval(() => {
      setDirection(1);
      setBlogPage((prev) => (prev + 1) % totalBlogPages);
    }, 8000);
    return () => clearInterval(interval);
  }, [totalBlogPages, isBlogHovered]);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setBlogPage((prev) => (prev + newDirection + totalBlogPages) % totalBlogPages);
  };

  const filteredBlogs = blogs.slice(blogPage * BLOGS_PER_PAGE, blogPage * BLOGS_PER_PAGE + BLOGS_PER_PAGE);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT || "https://formspree.io/f/xvzdlqbp";

    if (!endpoint) {
      console.error("Formspree endpoint not found.");
      // Fallback for local testing
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        form.reset();
        setTimeout(() => setIsSubmitted(false), 4000);
      }, 1500);
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setIsSubmitted(true);
        form.reset();
        setTimeout(() => setIsSubmitted(false), 4000);
      } else {
        alert("Oops! There was a problem submitting your form");
      }
    } catch (error) {
      alert("Oops! There was a problem submitting your form");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <DataDebris />
      {/* NAV */}
      <nav>
        <div className="nav-logo">
          <img src="/favicon.png" alt="Logo" width="36" height="36" style={{borderRadius: '6px'}} />
          <span className="nav-logo-text">Shafeeq S</span>
        </div>
        <ul className="nav-links">
          {['home', 'about', 'resume', 'qualification', 'projects', 'certifications', 'blogs', 'contact'].map(item => (
            <li key={item}>
              <a href={`#${item}`} className={activeSection === item ? 'active' : ''}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </a>
            </li>
          ))}
        </ul>
        <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* MOBILE NAV */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mobile-nav open"
          >
            {['home', 'about', 'resume', 'qualification', 'projects', 'certifications', 'blogs', 'contact'].map(item => (
              <a 
                key={item} 
                href={`#${item}`} 
                onClick={() => setIsMenuOpen(false)}
                className={activeSection === item ? 'active' : ''}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HOME */}
      <section id="home" className="p-0 overflow-hidden bg-[#0B0F19] relative min-h-screen flex items-center justify-center">
        {/* Gradient Overlay for Text Legibility */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/80 to-transparent w-[50%] hidden lg:block"></div>
        
        <div className="max-w-[1280px] w-full mx-auto pl-6 md:pl-12 lg:pl-20 pr-6 md:pr-12 lg:pr-20 grid grid-cols-1 lg:grid-cols-[55%_45%] items-center min-h-[100vh] relative z-20">
          
          {/* LEFT SIDE (TEXT BLOCK) */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.2
                }
              }
            }}
            className="flex flex-col justify-center text-center lg:text-left py-20 lg:py-0 lg:pl-[20px]"
          >
            <motion.p 
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } }
              }}
              className="text-[#6B7280] text-[13px] sm:text-[14px] font-mono tracking-[0.2em] uppercase mb-1"
            >
              Cybersecurity Portfolio
            </motion.p>
            
            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease: [0.23, 1, 0.32, 1] } }
              }}
              className="text-white text-[clamp(2.5rem,8vw,4.5rem)] font-[800] leading-[1.1] tracking-[1px] mb-4 whitespace-nowrap"
            >
              SHAFEEQ S
            </motion.h1>
            
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { duration: 0.8 } }
              }}
              className="text-[20px] sm:text-[22px] md:text-[26px] mb-8"
            >
              <span className="text-[#9CA3AF]">I am a </span>
              <span className="text-[#3B82F6] font-semibold">{typedText}</span>
              <span className="inline-block w-[2px] h-[1.1em] bg-[#3B82F6] ml-1 align-middle animate-pulse"></span>
            </motion.div>
            
            <motion.div 
              variants={{
                hidden: { opacity: 0, x: -30 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
              }}
              className="space-y-4 mb-8 text-[#D1D5DB] text-[16px] md:text-[18px] leading-relaxed max-w-[550px] mx-auto lg:mx-0"
            >
              <div className="flex items-center gap-4 group">
                <ShieldCheck size={20} className="text-[#3B82F6] shrink-0" />
                <span className="tracking-wide">5+ SOC Incident Reports</span>
              </div>
              <div className="flex items-center gap-4 group">
                <ShieldCheck size={20} className="text-[#3B82F6] shrink-0" />
                <span className="tracking-wide">Hands-on Labs (LetsDefend)</span>
              </div>
              <div className="flex items-center gap-4 group">
                <ShieldCheck size={20} className="text-[#3B82F6] shrink-0" />
                <span className="tracking-wide">Malware Analysis & Threat Hunting</span>
              </div>
            </motion.div>
            
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } }
              }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6"
            >
              <a href="#projects" className="btn-primary">
                View Projects
              </a>
              <a href="#blogs" className="btn-secondary">
                View Reports
              </a>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE (ANIMATION AREA) */}
          <div className="relative flex items-center justify-center lg:justify-end min-h-[400px] lg:min-h-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]"
            >
              {/* Layer 1: Background Glow */}
              <div className="absolute inset-0 bg-blue-600/10 rounded-full blur-[100px]"></div>
              
              {/* Layer 2, 4, 5: Radar, Particles, Beams */}
              <div className="absolute inset-0 z-0">
                <CyberShield />
              </div>

              {/* Layer 3: Shield (Center) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[120px] h-[120px] md:w-[150px] md:h-[150px] bg-[#0B0F19]/60 backdrop-blur-md rounded-full border border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  <Shield size={60} className="text-[#3B82F6] animate-pulse" />
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ABOUT */}
      <section id="about">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
        >
          <h2 className="section-title">I Am <span>Shafeeq</span></h2>
          <div className="about-text">
            <p>A Computer Science and Business Systems student with a growing focus on cybersecurity, particularly malware analysis and digital forensics. I enjoy working with tools like Wireshark and Procmon to understand real-world threats and system behavior.</p>
            <p>I'm passionate about building practical skills through hands-on labs and continuously improving my knowledge in security and software development. My journey in cybersecurity is driven by curiosity, persistence, and a commitment to making digital systems safer.</p>
          </div>
          <div className="about-grid">
            <div className="about-item">
              <GraduationCap className="icon" />
              <span className="label">Degree:&nbsp;</span>
              <span className="value">B.Tech CS & Business Systems</span>
            </div>
            <div className="about-item">
              <School className="icon" />
              <span className="label">College:&nbsp;</span>
              <span className="value">Panimalar Engineering College</span>
            </div>
            <div className="about-item">
              <BarChart2 className="icon" />
              <span className="label">CGPA:&nbsp;</span>
              <span className="value">8.1 / 10</span>
            </div>
            <div className="about-item">
              <MapPin className="icon" />
              <span className="label">City:&nbsp;</span>
              <span className="value">Chennai, India</span>
            </div>
            <div className="about-item">
              <Mail className="icon" />
              <span className="label">Email:&nbsp;</span>
              <span className="value">shafeeq.connect@gmail.com</span>
            </div>
            <div className="about-item">
              <Search className="icon" />
              <span className="label">Focus:&nbsp;</span>
              <span className="value">SOC · Malware Analysis · Forensics</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* RESUME (Timeline) */}
      <section id="resume">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
        >
          <h2 className="section-title">My <span>Resume</span></h2>
          <div className="flex justify-center mb-24 mt-4">
            <a
              href="/Shafeeq-Resume.pdf"
              download="Shafeeq_S_Cybersecurity_Resume.pdf"
              className="btn-primary flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Resume
            </a>
          </div>
          <div className="resume-grid">
            <div>
              <div className="resume-col-title">
                <GraduationCap className="icon" size={20} /> Education
              </div>
            <div className="timeline">
              <div className="tl-item">
                <div className="tl-dot"></div>
                <div className="tl-period">2024 – 2028</div>
                <div className="tl-title">B.Tech — CS & Business Systems</div>
                <div className="tl-org">Panimalar Engineering College</div>
                <div className="tl-desc">CGPA: 8.0 / 10</div>
              </div>
              <div className="tl-item">
                <div className="tl-dot"></div>
                <div className="tl-period">2024</div>
                <div className="tl-title">HSE (+2)</div>
                <div className="tl-org">Velammal Matric.Hr.Sec.School</div>
                <div className="tl-desc">Percentage: 76.17%</div>
              </div>
              <div className="tl-item">
                <div className="tl-dot"></div>
                <div className="tl-period">2022</div>
                <div className="tl-title">SSLC</div>
                <div className="tl-org">Sir Issac Newton Matriculation School</div>
                <div className="tl-desc">Percentage: 86.6%</div>
              </div>
            </div>
          </div>
          <div>
            <div className="resume-col-title">
              <Briefcase className="icon" size={20} /> Experience
            </div>
            <div className="timeline">
              <div className="tl-item">
                <div className="tl-dot"></div>
                <div className="tl-period">Mar 2024 – Apr 2024</div>
                <div className="tl-title">Cybersecurity Intern</div>
                <div className="tl-org">TANSAM (Govt. of Tamil Nadu)</div>
                <ul className="tl-list">
                  <li>Conducted reconnaissance using advanced OSINT tools.</li>
                  <li>Practiced steganography techniques using Kali Linux to hide data.</li>
                  <li>Explored IoT vulnerabilities and implemented countermeasures.</li>
                  <li>Studied global frameworks including NIST RMF, CSF, and ISO 27005.</li>
                  <li>Strengthened hands-on knowledge in risk management & incident response.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>

      {/* QUALIFICATION Section */}
      <section id="qualification" className="relative">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
        >
          <h2 className="section-title">My <span>Qualification</span></h2>
          <div className="qual-grid">
            {/* Card 1: Skills & Tools */}
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
              className="qual-card"
            >
            <div className="qual-title-row">
              <Settings className="icon" size={20} />
              <h3>Skills & Tools</h3>
            </div>
            <ul className="qual-list">
              <li>Malware Analysis (Static & Dynamic)</li>
              <li>Network Traffic Analysis (Wireshark)</li>
              <li>Phishing Email Analysis</li>
              <li>Incident Response & Alert Investigation</li>
              <li>Threat Hunting & Log Analysis</li>
              <li>OSINT Techniques</li>
              <li>Kali Linux & CTF Challenges</li>
              <li>Procmon / Process Hacker (Sysinternals)</li>
              <li>Burp Suite (Basic Web Testing)</li>
              <li>John the Ripper / Password Cracking</li>
              <li>SIEM Alerts & SOC Operations</li>
              <li>Python Scripting & Automation</li>
              <li>Fiddler / Steganography Tools</li>
            </ul>
          </motion.div>

          {/* Card 2: Certifications */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
            className="qual-card"
          >
            <div className="qual-title-row">
              <Award className="icon" size={20} />
              <h3>Certifications</h3>
            </div>
            <ul className="qual-list">
              <li>Cybersecurity Internship – TANSAM Center of Excellence</li>
              <li>TryHackMe – Hands-on Cybersecurity Labs</li>
              <li>LetsDefend – SOC Analyst Training (Ongoing)</li>
              <li>IEEE Conference Presenter – PECTEAM 2K25</li>
              <li>Certificate of Appreciation & Excellence – Cybersecurity Quiz</li>
              <li>B.Tech Computer Science & Business Systems (CGPA 8.1)</li>
            </ul>
          </motion.div>
        </div>
        </motion.div>
      </section>

      <section id="projects">
        <motion.div
           initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
           whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
        >
          <h2 className="section-title">My <span>Projects</span></h2>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="projects-grid"
          >
            {projects.map((p, i) => (
              <motion.div
                key={`${p.title}-${i}`}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.33, 1, 0.68, 1] } }
                }}
                whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.4, ease: "easeOut" } }}
                className="proj-card group"
              >
                <div className="proj-icon-wrap">
                  {p.icon}
                </div>
                <div className="proj-title">{p.title}</div>
                <div className="proj-period">{p.period}</div>
                <p className="proj-desc">{p.desc}</p>
                <div className="proj-tech">{p.tech}</div>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-mono transition-colors">
                    <ExternalLink size={14} /> View Project
                  </a>
                )}
              </motion.div>
            ))}

            <motion.div
            variants={{
              hidden: { opacity: 0, y: 30, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.33, 1, 0.68, 1] } }
            }}
            whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.4, ease: "easeOut" } }}
            className="proj-card group"
          >
            <div className="proj-icon-wrap">
              <Trophy size={22} />
            </div>
            <div className="proj-title">Awards & Achievements</div>
            <div className="proj-period">2024 – 2025</div>
            <ul className="tl-list mt-3">
              <li className="text-[0.78rem] text-gray-400 mb-1">1st Place — Cybersecurity Quiz (TANSAM)</li>
              <li className="text-[0.78rem] text-gray-400 mb-1">1st Place — Rhetoric Rumble Debate (RMD)</li>
              <li className="text-[0.78rem] text-gray-400">Award of Excellence — TANSAM Internship</li>
            </ul>
          </motion.div>
        </motion.div>
        </motion.div>
      </section>

      {/* CERTIFICATIONS GALLERY */}
      <section id="certifications">
        <motion.div
           initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
           whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
        >
          <h2 className="section-title">My <span>Certifications</span></h2>
          <div className="filter-btns">
            {certCategories.map(cat => (
              <button
                key={cat}
                className={`filter-btn ${certFilter === cat ? 'active' : ''}`}
                onClick={() => setCertFilter(cat)}
              >
                {certCategoryLabels[cat]}
              </button>
            ))}
          </div>
          <div className="certs-grid">
            <AnimatePresence mode="popLayout">
              {filteredCerts.map((c, i) => (
                <motion.div
                  key={`${c.title}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(5px)' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.03,
                    ease: [0.33, 1, 0.68, 1]
                  }}
                >
                  <CertCard
                    cert={c}
                    index={i}
                    onOpen={(idx) => setSelectedCertIndex(idx)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* BLOGS */}
      <section id="blogs">
        <motion.div
           initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
           whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
        >
          <h2 className="section-title">My <span>Experience & Blogs</span></h2>
          <div 
            className="relative overflow-hidden group"
            onMouseEnter={() => setIsBlogHovered(true)}
            onMouseLeave={() => setIsBlogHovered(false)}
          >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div 
              key={blogPage}
              custom={direction}
              variants={{
                enter: (direction: number) => ({
                  x: direction > 0 ? 60 : -60,
                  opacity: 0,
                  scale: 0.98,
                  filter: 'blur(4px)'
                }),
                center: {
                  zIndex: 1,
                  x: 0,
                  opacity: 1,
                  scale: 1,
                  filter: 'blur(0px)'
                },
                exit: (direction: number) => ({
                  zIndex: 0,
                  x: direction < 0 ? 60 : -60,
                  opacity: 0,
                  scale: 0.98,
                  filter: 'blur(4px)'
                })
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="blogs-grid"
            >
              {filteredBlogs.map((b, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="blog-card group"
                >
                  <div className="blog-thumb overflow-hidden aspect-video">
                    <img 
                      src={(b as any).image} 
                      alt={b.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="blog-body p-6">
                    <div className="blog-meta flex items-center justify-between mb-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Calendar size={14} className="text-blue-500" /> {b.date}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <User size={14} className="text-blue-500" /> By {b.author}
                      </span>
                    </div>
                    <div className="border-t border-gray-700/50 pt-4 mb-4">
                      <div className="blog-title text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                        {b.title}
                      </div>
                      <p className="blog-desc text-sm text-gray-400 line-clamp-2 mb-6">
                        {b.desc}
                      </p>
                      <button 
                        onClick={() => {
                          const actualIndex = blogs.findIndex(blog => blog.title === b.title);
                          setSelectedBlogIndex(actualIndex);
                        }}
                        className="blog-read-more"
                      >
                        <span>Read Report</span>
                        <div className="btn-line"></div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="blog-pagination">
          <button className="page-btn" onClick={() => paginate(-1)}>
            <ChevronLeft size={20} />
          </button>
          {Array.from({ length: totalBlogPages }, (_, i) => (
            <button 
              key={i} 
              className={`page-dot ${blogPage === i ? 'active' : ''}`}
              onClick={() => {
                setDirection(i > blogPage ? 1 : -1);
                setBlogPage(i);
              }}
            ></button>
          ))}
          <button className="page-btn" onClick={() => paginate(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
        </motion.div>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <motion.div
           initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
           whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
        >
          <h2 className="section-title">Contact <span>Me</span></h2>
          <div className="contact-wrap">
          <div className="contact-left">
            <h3>Get In Touch</h3>
            <p>I'm always open to new opportunities, collaborations, and conversations about cybersecurity. Feel free to reach out.</p>
            <div className="contact-item">
              <div className="contact-item-label">
                <Phone className="icon" /> Phone
              </div>
              <div className="contact-item-val">+91 96007 93923</div>
            </div>
            <div className="contact-item">
              <div className="contact-item-label">
                <Mail className="icon" /> Email
              </div>
              <div className="contact-item-val">
                <a href="mailto:shafeeq.connect@gmail.com">shafeeq.connect@gmail.com</a>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-item-label">
                <Linkedin className="icon" /> LinkedIn
              </div>
              <div className="contact-item-val">
                <a href="https://www.linkedin.com/in/shafeeq-cybersec/" target="_blank">Reach Me Out On LinkedIn <ExternalLink size={10} className="inline ml-1" /></a>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-item-label">
                <Github className="icon" /> GitHub
              </div>
              <div className="contact-item-val">
                <a href="https://github.com/Shafeeq-Cybersec" target="_blank">Reach Me Out On GitHub <ExternalLink size={10} className="inline ml-1" /></a>
              </div>
            </div>
          </div>
            <div>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <input type="text" name="name" className="form-input" placeholder="name" id="cf-name" required />
                  <input type="email" name="email" className="form-input" placeholder="email" id="cf-email" required />
                </div>
                <input type="text" name="subject" className="form-input" placeholder="subject" id="cf-subject" required />
                <textarea name="message" className="form-textarea" placeholder="message" id="cf-message" required></textarea>
                
                <AnimatePresence mode="wait">
                  {isSubmitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded flex items-center gap-2 w-full text-xs"
                    >
                      <Trophy size={16} />
                      <span className="font-medium">Message sent successfully!</span>
                    </motion.div>
                  ) : (
                    <motion.button 
                      key="submit"
                      type="submit" 
                      className="submit-btn flex items-center justify-center gap-2 min-w-[150px]"
                      disabled={isSubmitting}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </motion.button>
                  )}
                </AnimatePresence>
              </form>
            </div>
        </div>
        </motion.div>
      </section>

      <footer>© 2025 Shafeeq S. All rights reserved. | Cybersecurity Portfolio</footer>

      <button 
        className={`scroll-top ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ChevronUp size={24} />
      </button>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedCertIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-md"
          >
            <button 
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[1010]"
              onClick={() => setSelectedCertIndex(null)}
            >
              <X size={32} />
            </button>

            <button
              className="absolute left-4 md:left-10 text-white/50 hover:text-white transition-colors z-[1010] lightbox-nav-btn"
              onClick={() => setSelectedCertIndex((prev) => (prev! - 1 + filteredCerts.length) % filteredCerts.length)}
            >
              <ChevronLeft size={48} className="w-8 h-8 md:w-12 md:h-12" />
            </button>

            <motion.div
              initial={{ scale: 0.8, opacity: 0, filter: 'blur(15px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 0.8, opacity: 0, filter: 'blur(15px)' }}
              transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
              className="relative max-w-[95vw] max-h-[95vh] w-auto h-auto flex flex-col items-center justify-center"
            >
              <div className="bg-white p-0.5 md:p-1 rounded shadow-2xl relative overflow-hidden flex items-center justify-center">
                {(filteredCerts[selectedCertIndex] as any).image?.toLowerCase().endsWith('.pdf') ? (
                  <a
                    href={(filteredCerts[selectedCertIndex] as any).image}
                    target="_blank"
                    rel="noreferrer"
                    className="w-[600px] max-w-[80vw] h-[400px] bg-gray-100 flex flex-col gap-3 items-center justify-center text-gray-500 hover:text-blue-600 transition"
                  >
                    <FileText size={48} />
                    <span className="text-sm font-mono uppercase tracking-wider">Open PDF Certificate</span>
                  </a>
                ) : (filteredCerts[selectedCertIndex] as any).image ? (
                  <img
                    src={(filteredCerts[selectedCertIndex] as any).image}
                    alt={filteredCerts[selectedCertIndex].title}
                    className="max-h-[85vh] md:max-h-[92vh] max-w-[92vw] w-auto h-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-[600px] h-[400px] bg-gray-100 flex items-center justify-center text-gray-400">
                    {filteredCerts[selectedCertIndex].icon}
                  </div>
                )}
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-white text-xl font-semibold mb-1">{filteredCerts[selectedCertIndex].title}</h3>
                <p className="text-blue-400 font-mono text-sm uppercase tracking-wider">{filteredCerts[selectedCertIndex].sub}</p>
                <div className="mt-4 text-white/40 text-xs font-mono">
                  {selectedCertIndex + 1} of {filteredCerts.length}
                </div>
              </div>
            </motion.div>

            <button
              className="absolute right-4 md:right-10 text-white/50 hover:text-white transition-colors z-[1010] lightbox-nav-btn"
              onClick={() => setSelectedCertIndex((prev) => (prev! + 1) % filteredCerts.length)}
            >
              <ChevronRight size={48} className="w-8 h-8 md:w-12 md:h-12" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BLOG MODAL */}
      <AnimatePresence>
        {selectedBlogIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-md"
          >
            <button 
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[1010]"
              onClick={() => setSelectedBlogIndex(null)}
            >
              <X size={32} />
            </button>

            <motion.div 
              initial={{ y: 70, opacity: 0, filter: 'blur(20px)', scale: 0.95 }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ y: 70, opacity: 0, filter: 'blur(20px)', scale: 0.95 }}
              transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
              className="bg-[#111] border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl relative"
            >
              <div className="aspect-video w-full relative overflow-hidden">
                <img 
                  src={(blogs[selectedBlogIndex] as any).image} 
                  alt={blogs[selectedBlogIndex].title} 
                  className="w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex gap-4 mb-3">
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{(blogs[selectedBlogIndex] as any).cat}</span>
                    <span className="text-xs font-mono text-gray-400">{blogs[selectedBlogIndex].date}</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
                    {blogs[selectedBlogIndex].title}
                  </h2>
                </div>
              </div>

              <div className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-800">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <User size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{blogs[selectedBlogIndex].author}</div>
                    <div className="text-xs text-gray-500">Cybersecurity Analyst</div>
                  </div>
                </div>

                <div className="markdown-body">
                  <Markdown>{(blogs[selectedBlogIndex] as any).content}</Markdown>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800 flex justify-between items-center flex-wrap gap-4">
                  <button 
                    onClick={() => setSelectedBlogIndex(null)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft size={20} /> Back to Blogs
                  </button>
                  { (blogs[selectedBlogIndex] as any).link && (
                    <a 
                      href={(blogs[selectedBlogIndex] as any).link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-primary flex items-center gap-2"
                    >
                      View Full Report on LinkedIn <ExternalLink size={16} />
                    </a>
                  )}
                  <div className="flex gap-4">
                    <a href="https://www.linkedin.com/in/shafeeq-cybersec/" target="_blank" className="text-gray-500 hover:text-blue-400 transition-colors"><Linkedin size={18} /></a>
                    <a href="https://github.com/Shafeeq-Cybersec" target="_blank" className="text-gray-500 hover:text-blue-400 transition-colors"><Github size={18} /></a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
