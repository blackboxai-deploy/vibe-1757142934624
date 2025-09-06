import { TrackingLink, LinkClick, LinkStats } from '@/types/link';
import { AnalyticsOverview } from '@/types/analytics';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');
const CLICKS_FILE = path.join(DATA_DIR, 'clicks.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Generic file operations
async function readJSONFile<T>(filePath: string): Promise<T[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, return empty array
    return [];
  }
}

async function writeJSONFile<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Link operations
export async function getAllLinks(): Promise<TrackingLink[]> {
  return readJSONFile<TrackingLink>(LINKS_FILE);
}

export async function getLinkByShortCode(shortCode: string): Promise<TrackingLink | null> {
  const links = await getAllLinks();
  return links.find(link => link.shortCode === shortCode) || null;
}

export async function getLinkById(id: string): Promise<TrackingLink | null> {
  const links = await getAllLinks();
  return links.find(link => link.id === id) || null;
}

export async function createLink(link: TrackingLink): Promise<void> {
  const links = await getAllLinks();
  links.push(link);
  await writeJSONFile(LINKS_FILE, links);
}

export async function updateLink(id: string, updates: Partial<TrackingLink>): Promise<boolean> {
  const links = await getAllLinks();
  const index = links.findIndex(link => link.id === id);
  
  if (index === -1) return false;
  
  links[index] = { ...links[index], ...updates, updatedAt: new Date().toISOString() };
  await writeJSONFile(LINKS_FILE, links);
  return true;
}

export async function deleteLink(id: string): Promise<boolean> {
  const links = await getAllLinks();
  const filteredLinks = links.filter(link => link.id !== id);
  
  if (filteredLinks.length === links.length) return false;
  
  await writeJSONFile(LINKS_FILE, filteredLinks);
  
  // Also remove associated clicks
  const clicks = await getAllClicks();
  const filteredClicks = clicks.filter(click => click.linkId !== id);
  await writeJSONFile(CLICKS_FILE, filteredClicks);
  
  return true;
}

// Click operations
export async function getAllClicks(): Promise<LinkClick[]> {
  return readJSONFile<LinkClick>(CLICKS_FILE);
}

export async function getClicksByLinkId(linkId: string): Promise<LinkClick[]> {
  const clicks = await getAllClicks();
  return clicks.filter(click => click.linkId === linkId);
}

export async function addClick(click: LinkClick): Promise<void> {
  const clicks = await getAllClicks();
  clicks.push(click);
  await writeJSONFile(CLICKS_FILE, clicks);
  
  // Update link statistics
  await updateLinkStats(click.linkId);
}

// Update link statistics after new click
async function updateLinkStats(linkId: string): Promise<void> {
  const clicks = await getClicksByLinkId(linkId);
  const uniqueSessionIds = new Set(clicks.map(click => click.sessionId));
  
  const updates: Partial<TrackingLink> = {
    totalClicks: clicks.length,
    uniqueClicks: uniqueSessionIds.size,
    lastClickAt: clicks[clicks.length - 1]?.timestamp
  };
  
  await updateLink(linkId, updates);
}

// Analytics operations
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const links = await getAllLinks();
  const clicks = await getAllClicks();
  
  const today = new Date().toISOString().split('T')[0];
  const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const clicksToday = clicks.filter(click => click.timestamp.startsWith(today)).length;
  const clicksThisWeek = clicks.filter(click => click.timestamp >= thisWeek).length;
  const clicksThisMonth = clicks.filter(click => click.timestamp >= thisMonth).length;
  
  // Top performing links
  const linkClickCounts = links.map(link => ({
    id: link.id,
    title: link.title || link.originalUrl,
    shortCode: link.shortCode,
    clicks: link.totalClicks
  })).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  
  // Recent activity
  const recentClicks = clicks
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
    .map(click => ({
      linkId: click.linkId,
      shortCode: click.shortCode,
      clicks: 1,
      timestamp: click.timestamp,
      location: click.location.city ? `${click.location.city}, ${click.location.country}` : click.location.country
    }));
  
  const uniqueSessionIds = new Set(clicks.map(click => click.sessionId));
  
  return {
    totalLinks: links.length,
    totalClicks: clicks.length,
    uniqueClicks: uniqueSessionIds.size,
    clicksToday,
    clicksThisWeek,
    clicksThisMonth,
    topPerformingLinks: linkClickCounts,
    recentActivity: recentClicks
  };
}

export async function getLinkStats(linkId: string): Promise<LinkStats | null> {
  const link = await getLinkById(linkId);
  if (!link) return null;
  
  const clicks = await getClicksByLinkId(linkId);
  
  // Group clicks by date
  const clicksByDate: Record<string, number> = {};
  const clicksByCountry: Record<string, number> = {};
  const clicksByDevice: Record<string, number> = {};
  const clicksByBrowser: Record<string, number> = {};
  const clicksByReferer: Record<string, number> = {};
  
  clicks.forEach(click => {
    const date = click.timestamp.split('T')[0];
    clicksByDate[date] = (clicksByDate[date] || 0) + 1;
    
    if (click.location.country) {
      clicksByCountry[click.location.country] = (clicksByCountry[click.location.country] || 0) + 1;
    }
    
    clicksByDevice[click.device.type] = (clicksByDevice[click.device.type] || 0) + 1;
    clicksByBrowser[click.device.browser] = (clicksByBrowser[click.device.browser] || 0) + 1;
    
    const referer = click.referer || 'Direct';
    clicksByReferer[referer] = (clicksByReferer[referer] || 0) + 1;
  });
  
  // Top locations
  const topLocations = Object.entries(clicksByCountry)
    .map(([country, clicks]) => ({
      country,
      clicks,
      percentage: (clicks / link.totalClicks) * 100
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);
  
  // Average clicks per day
  const daysSinceCreation = Math.max(1, Math.ceil((Date.now() - new Date(link.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  const averageClicksPerDay = link.totalClicks / daysSinceCreation;
  
  // Recent clicks
  const recentClicks = clicks
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);
  
  const uniqueSessionIds = new Set(clicks.map(click => click.sessionId));
  
  return {
    linkId: link.id,
    totalClicks: link.totalClicks,
    uniqueClicks: uniqueSessionIds.size,
    clicksByDate,
    clicksByCountry,
    clicksByDevice,
    clicksByBrowser,
    clicksByReferer,
    averageClicksPerDay,
    topLocations,
    recentClicks
  };
}