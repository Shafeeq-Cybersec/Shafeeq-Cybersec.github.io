import React from 'react';
import { Shield, Award, Trophy } from 'lucide-react';
import certificatesData from './data/certificates.json';
import blogsData from './data/blogs.json';

export const roles = ['Blue Team Analyst', 'Threat Hunter', 'Cybersecurity Analyst', 'System Defender'];

const iconMap: Record<string, React.ReactElement> = {
  shield: React.createElement(Shield, { size: 40 }),
  award: React.createElement(Award, { size: 40 }),
  trophy: React.createElement(Trophy, { size: 40 }),
};

export const certificates = certificatesData.map((cert) => ({
  ...cert,
  icon: iconMap[cert.icon] || iconMap.shield,
}));

export const blogs = blogsData;
