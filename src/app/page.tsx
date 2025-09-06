'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { toast } from 'sonner';
import { TrackingLink } from '@/types/link';
import { AnalyticsOverview } from '@/types/analytics';

export default function HomePage() {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    originalUrl: '',
    title: '',
    description: '',
    customCode: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [linksRes, analyticsRes] = await Promise.all([
        fetch('/api/links'),
        fetch('/api/analytics')
      ]);
      
      const linksData = await linksRes.json();
      const analyticsData = await analyticsRes.json();
      
      if (linksData.success) {
        setLinks(linksData.data);
      }
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.originalUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: formData.originalUrl.trim(),
          title: formData.title.trim() || undefined,
          description: formData.description.trim() || undefined,
          customCode: formData.customCode.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Link created successfully!');
        setFormData({
          originalUrl: '',
          title: '',
          description: '',
          customCode: '',
        });
        loadData(); // Reload data
        
        // Copy short URL to clipboard
        if (data.shortUrl && navigator.clipboard) {
          await navigator.clipboard.writeText(data.shortUrl);
          toast.success('Short URL copied to clipboard!');
        }
      } else {
        toast.error(data.error || 'Failed to create link');
      }
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('Failed to create link');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                L
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LinkTracker</h1>
                <p className="text-sm text-gray-600">Advanced Link Analytics</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Link Creation Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create Tracking Link
                </CardTitle>
                <CardDescription>
                  Transform any URL into a powerful tracking link with detailed geolocation analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="originalUrl">Original URL *</Label>
                    <Input
                      id="originalUrl"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.originalUrl}
                      onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title (Optional)</Label>
                      <Input
                        id="title"
                        placeholder="My Campaign Link"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customCode">Custom Code (Optional)</Label>
                      <Input
                        id="customCode"
                        placeholder="my-custom-link"
                        value={formData.customCode}
                        onChange={(e) => setFormData({ ...formData, customCode: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your link for better organization"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Tracking Link'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Overview */}
          <div>
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>Your tracking performance at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analytics.totalLinks}</div>
                        <div className="text-sm text-blue-600/70">Total Links</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{analytics.totalClicks}</div>
                        <div className="text-sm text-purple-600/70">Total Clicks</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analytics.uniqueClicks}</div>
                        <div className="text-sm text-green-600/70">Unique Clicks</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{analytics.clicksToday}</div>
                        <div className="text-sm text-orange-600/70">Today</div>
                      </div>
                    </div>
                    
                    {analytics.topPerformingLinks.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Top Performing</h4>
                        <div className="space-y-2">
                          {analytics.topPerformingLinks.slice(0, 3).map((link, index) => (
                            <div key={link.id} className="flex items-center justify-between text-sm">
                              <span className="truncate flex-1">{link.title || 'Untitled'}</span>
                              <Badge variant="secondary">{link.clicks}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">📊</div>
                    <p>Create your first link to see analytics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Links Table */}
        {links.length > 0 && (
          <Card className="mt-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Your Tracking Links</CardTitle>
              <CardDescription>Manage and monitor your created links</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Link</th>
                      <th className="text-left py-3 font-medium">Original URL</th>
                      <th className="text-left py-3 font-medium">Clicks</th>
                      <th className="text-left py-3 font-medium">Created</th>
                      <th className="text-left py-3 font-medium">Status</th>
                      <th className="text-left py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.slice(0, 10).map((link) => (
                      <tr key={link.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div>
                            <div className="font-medium">
                              {link.title || link.shortCode}
                            </div>
                            <div className="text-sm text-gray-500">
                              ${window.location.origin}/r/{link.shortCode}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="max-w-xs truncate text-sm text-gray-600">
                            {link.originalUrl}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-center">
                            <div className="font-medium">{link.totalClicks}</div>
                            <div className="text-xs text-gray-500">
                              {link.uniqueClicks} unique
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          {formatDate(link.createdAt)}
                        </td>
                        <td className="py-3">
                          <Badge 
                            variant={link.isActive ? "default" : "secondary"}
                            className={link.isActive ? "bg-green-100 text-green-800" : ""}
                          >
                            {link.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(`${window.location.origin}/r/${link.shortCode}`)}
                            >
                              Copy
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <div className="mt-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful Link Tracking Features
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Get detailed insights about your audience with our comprehensive tracking and analytics platform
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                🌍
              </div>
              <h3 className="text-xl font-semibold mb-2">Geolocation Tracking</h3>
              <p className="text-gray-600">
                Track visitor locations with IP geolocation and browser-based coordinates for precise analytics
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                📊
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">
                Monitor clicks, devices, browsers, and referrers with comprehensive real-time dashboards
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                🔗
              </div>
              <h3 className="text-xl font-semibold mb-2">Custom Short Links</h3>
              <p className="text-gray-600">
                Create branded short links with custom codes, passwords, and expiration dates
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 LinkTracker. Advanced link analytics platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}