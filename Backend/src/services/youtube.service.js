/**
 * YouTube Data API v3 Service for Video Lecture Finding
 */

export const searchYouTubeVideos = async (query, maxResults = 3) => {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_CALENDAR_API_KEY;

  if (!apiKey) {
    console.warn('[YouTube API] No YOUTUBE_API_KEY configured in environment.');
    return [];
  }

  try {
    const cleanQuery = encodeURIComponent(`${query} tutorial masterclass`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${cleanQuery}&type=video&videoEmbeddable=true&maxResults=${maxResults}&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[YouTube API Warning] Status ${res.status}: ${errorText}`);
      return [];
    }

    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item, idx) => ({
      id: `v-yt-${item.id?.videoId || idx + 1}`,
      videoId: item.id?.videoId || null,
      title: item.snippet?.title || `${query} Tutorial`,
      channel: item.snippet?.channelTitle || 'Tech Educator',
      duration: '25 mins',
      searchQuery: query,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      embedUrl: item.id?.videoId 
        ? `https://www.youtube-nocookie.com/embed/${item.id.videoId}?rel=0`
        : `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}`,
      topicsCovered: query,
    }));
  } catch (err) {
    console.error(`[YouTube API Error]: ${err.message}`);
    return [];
  }
};
