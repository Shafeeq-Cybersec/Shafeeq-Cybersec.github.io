import React from 'react';
import { Shield, Award, Trophy, Lock, Code, Bug, Target, Monitor, Search, Radio } from 'lucide-react';
import certificatesData from './data/certificates.json';
import blogsData from './data/blogs.json';
import projectsData from './data/projects.json';
import profileData from './data/profile.json';
import skillsData from './data/skills.json';
import experienceData from './data/experience.json';
import educationData from './data/education.json';
import achievementsData from './data/achievements.json';

export const roles = ['Blue Team Analyst', 'Threat Hunter', 'Cybersecurity Analyst', 'System Defender'];

// ── Certificates ─────────────────────────────────────────────────
const iconMap: Record<string, React.ReactElement> = {
  shield: React.createElement(Shield, { size: 40 }),
  award: React.createElement(Award, { size: 40 }),
  trophy: React.createElement(Trophy, { size: 40 }),
};

export const certificates = certificatesData.map((cert) => ({
  ...cert,
  icon: iconMap[cert.icon] || iconMap.shield,
}));

// ── Blogs ─────────────────────────────────────────────────────────
export const blogs = blogsData;

// ── Projects ──────────────────────────────────────────────────────
const projectIconMap: Record<string, React.ReactElement> = {
  shield: React.createElement(Shield, { size: 22 }),
  lock: React.createElement(Lock, { size: 22 }),
  code: React.createElement(Code, { size: 22 }),
  bug: React.createElement(Bug, { size: 22 }),
  target: React.createElement(Target, { size: 22 }),
  monitor: React.createElement(Monitor, { size: 22 }),
  search: React.createElement(Search, { size: 22 }),
  radio: React.createElement(Radio, { size: 22 }),
};

export const projects = projectsData.map((p) => ({
  ...p,
  icon: projectIconMap[p.icon] || projectIconMap.shield,
}));

// ── Profile ───────────────────────────────────────────────────────
export const profile = profileData;

// ── Skills ────────────────────────────────────────────────────────
export const skills = skillsData;

// ── Experience ────────────────────────────────────────────────────
export const experience = experienceData;

// ── Education ─────────────────────────────────────────────────────
export const education = educationData;

// ── Achievements ──────────────────────────────────────────────────
const achievementIconMap: Record<string, React.ReactElement> = {
  trophy: React.createElement(Trophy, { size: 20 }),
  target: React.createElement(Target, { size: 20 }),
  award: React.createElement(Award, { size: 20 }),
  radio: React.createElement(Radio, { size: 20 }),
};

export const achievements = achievementsData.map((a) => ({
  ...a,
  iconEl: achievementIconMap[a.icon] || achievementIconMap.award,
}));
