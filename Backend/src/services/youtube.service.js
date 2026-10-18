/**
 * YouTube Data API v3 Service for Milestone Video Lecture Finding
 */

function resolveFallbackVideo(queryStr = "") {
  const text = queryStr.toLowerCase();

  let vId = "rfscVS0vtbw"; // Default Python/Tech masterclass
  let title = "Full Course Tutorial & Masterclass";
  let channel = "FreeCodeCamp / Tech Academy";

  if (text.includes("react") || text.includes("hook") || text.includes("frontend") || text.includes("jsx")) {
    vId = "bMknFK15FiU";
    title = "React Complete Course & Modern Hooks Masterclass";
    channel = "FreeCodeCamp";
  } else if (text.includes("python") || text.includes("django") || text.includes("flask") || text.includes("data")) {
    vId = "rfscVS0vtbw";
    title = "Python Programming Full Course for Beginners";
    channel = "FreeCodeCamp";
  } else if (text.includes("java") || text.includes("spring") || text.includes("oop")) {
    vId = "eIrMbAQSU34";
    title = "Java Full Course - Fundamentals to Advanced OOP";
    channel = "Programming with Mosh";
  } else if (text.includes("javascript") || text.includes("js") || text.includes("node") || text.includes("express")) {
    vId = "Oe421EPjeBE";
    title = "Node.js and Express.js - Full Course Tutorial";
    channel = "FreeCodeCamp";
  } else if (text.includes("c++") || text.includes("cpp") || text.includes("pointer")) {
    vId = "1Rs2ND1ryYc";
    title = "C++ Full Course for Beginners";
    channel = "Bro Code";
  } else if (text.includes("dsa") || text.includes("algorithm") || text.includes("structure") || text.includes("tree")) {
    vId = "8jLOx1hD3_o";
    title = "Data Structures and Algorithms in Depth";
    channel = "FreeCodeCamp";
  } else if (text.includes("sql") || text.includes("database") || text.includes("postgres") || text.includes("mongo")) {
    vId = "HXV3zeQKqGY";
    title = "SQL Full Course - Database Design and Queries";
    channel = "Luke Barousse";
  } else if (text.includes("html") || text.includes("css") || text.includes("web") || text.includes("layout")) {
    vId = "gQujLPbHMUG";
    title = "HTML & CSS Full Course - Beginner to Pro";
    channel = "SuperSimpleDev";
  } else if (text.includes("docker") || text.includes("kubernetes") || text.includes("devops") || text.includes("aws")) {
    vId = "fqMOX6JJhGo";
    title = "Docker & Containerization Tutorial for Beginners";
    channel = "TechWorld with Nana";
  } else if (text.includes("design") || text.includes("ui") || text.includes("ux") || text.includes("figma")) {
    vId = "c9Wg6Cb_YlU";
    title = "UI / UX Design Tutorial - Full Course";
    channel = "FreeCodeCamp";
  } else if (text.includes("marketing") || text.includes("seo") || text.includes("digital")) {
    vId = "nU-IIXBWlS4";
    title = "Digital Marketing Full Course - Masterclass";
    channel = "Simplilearn";
  } else if (text.includes("account") || text.includes("finance") || text.includes("banking")) {
    vId = "yYX4bvQSqbo";
    title = "Accounting Basics - Complete Tutorial";
    channel = "Accounting Stuff";
  }

  return {
    id: `v-curated-${vId}`,
    videoId: vId,
    title: `${queryStr} - ${title}`,
    channel,
    duration: "25-45 mins",
    searchQuery: queryStr,
    searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(queryStr + " tutorial")}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${vId}?rel=0`,
    topicsCovered: queryStr,
  };
}

async function searchYouTubePublic(query, maxResults = 3) {
  try {
    const cleanQuery = encodeURIComponent(`${query} tutorial`);
    const searchUrl = `https://www.youtube.com/results?search_query=${cleanQuery}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (res.ok) {
      const html = await res.text();
      // Match videoRenderer entries to get real videoId, title, and channel
      const videoMatches = [
        ...html.matchAll(
          /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"(?:.*?"title":\{"runs":\[\{"text":"([^"]+)"\}\])?(?:.*?"ownerText":\{"runs":\[\{"text":"([^"]+)"\}\])?/g
        ),
      ];

      if (videoMatches.length > 0) {
        const seen = new Set();
        const results = [];

        for (const match of videoMatches) {
          const vId = match[1];
          if (!vId || seen.has(vId)) continue;
          seen.add(vId);

          const title = match[2] || `${query} Tutorial & Lecture`;
          const channel = match[3] || 'YouTube Tech Educator';

          results.push({
            id: `v-yt-pub-${vId}`,
            videoId: vId,
            title,
            channel,
            duration: '20-40 mins',
            searchQuery: query,
            searchUrl: `https://www.youtube.com/results?search_query=${cleanQuery}`,
            embedUrl: `https://www.youtube-nocookie.com/embed/${vId}?rel=0`,
            topicsCovered: query,
          });

          if (results.length >= maxResults) break;
        }

        if (results.length > 0) {
          return results;
        }
      }

      // Secondary fallback: Extract videoId regex
      const idMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
      const ids = [...new Set(idMatches.map((m) => m[1]))];
      if (ids.length > 0) {
        return ids.slice(0, maxResults).map((vId, idx) => ({
          id: `v-yt-id-${vId}`,
          videoId: vId,
          title: `${query} - Tutorial Lecture ${idx + 1}`,
          channel: 'Tech Educator',
          duration: '25 mins',
          searchQuery: query,
          searchUrl: `https://www.youtube.com/results?search_query=${cleanQuery}`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${vId}?rel=0`,
          topicsCovered: query,
        }));
      }
    }
  } catch (err) {
    console.warn(`[YouTube Public Search Note]: ${err.message}`);
  }
  return [];
}

export const searchYouTubeVideos = async (query, maxResults = 3) => {
  const apiKey = (process.env.YOUTUBE_API_KEY || process.env.GOOGLE_CALENDAR_API_KEY || "").trim();

  // 1. Try Official YouTube Data API if valid key is provided
  if (apiKey) {
    try {
      const cleanQuery = encodeURIComponent(`${query} tutorial`);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${cleanQuery}&type=video&videoEmbeddable=true&maxResults=${maxResults}&key=${apiKey}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          const mapped = data.items.map((item, idx) => ({
            id: `v-yt-${item.id?.videoId || idx + 1}`,
            videoId: item.id?.videoId || null,
            title: item.snippet?.title || `${query} Tutorial`,
            channel: item.snippet?.channelTitle || 'Tech Educator',
            duration: '24 mins',
            searchQuery: query,
            searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            embedUrl: item.id?.videoId 
              ? `https://www.youtube-nocookie.com/embed/${item.id.videoId}?rel=0`
              : `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query + ' tutorial')}`,
            topicsCovered: query,
          }));
          const valid = mapped.filter(v => v.videoId && v.embedUrl);
          if (valid.length > 0) return valid;
        }
      }
    } catch (err) {
      console.warn(`[YouTube API Call Failed]: ${err.message}`);
    }
  }

  // 2. Direct Public YouTube Search (no API key restrictions or quotas)
  const publicResults = await searchYouTubePublic(query, maxResults);
  if (publicResults.length > 0) {
    return publicResults;
  }

  // 3. Dynamic YouTube Search Embed (plays the top result matching the exact topic directly in iframe)
  return [
    {
      id: `v-search-${Date.now()}`,
      videoId: `search-${encodeURIComponent(query)}`,
      title: `${query} - Video Lecture & Tutorial`,
      channel: 'YouTube Video Search',
      duration: '25-45 mins',
      searchQuery: query,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' tutorial')}`,
      embedUrl: `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query + ' tutorial')}`,
      topicsCovered: query,
    },
  ];
};

