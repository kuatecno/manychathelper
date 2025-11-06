# Flowkick API Documentation

## Overview

Flowkick provides instant access to social media data through a simple REST API. No scraping, no technical setup - just plug in your API key and start displaying social media content on your website.

**Base URL:** `https://flowkick.kua.cl`

---

## Authentication

All API requests require an API key. You can provide it in two ways:

### Option 1: Header (Recommended)
```
X-API-Key: fk_your_api_key_here
```

### Option 2: Query Parameter
```
?api_key=fk_your_api_key_here
```

---

## Endpoints

### Get Social Media Posts

```
GET /api/v1/social/{platform}
```

Fetch posts, videos, or reviews from a social media platform.

**Supported Platforms:**
- `instagram` - Instagram posts and carousel items
- `tiktok` - TikTok videos
- `google_maps` - Google Reviews (4+ stars with text)

**Parameters:**
- `api_key` (optional if using header) - Your Flowkick API key

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ABC123",
      "platform": "instagram",
      "imageUrl": "https://...",
      "videoUrl": "https://...",
      "postUrl": "https://instagram.com/p/ABC123",
      "caption": "Amazing coffee! ☕",
      "timestamp": "2025-11-05T10:30:00.000Z",
      "likes": 1234,
      "comments": 56,
      "type": "image"
    }
  ],
  "meta": {
    "platform": "instagram",
    "count": 10,
    "cached": true,
    "cachedAt": "2025-11-05T10:00:00.000Z",
    "expiresAt": "2025-11-05T10:30:00.000Z"
  }
}
```

**Example Request:**
```javascript
fetch('https://flowkick.kua.cl/api/v1/social/instagram?api_key=fk_your_key')
  .then(res => res.json())
  .then(data => {
    data.data.forEach(post => {
      console.log(post.caption, post.likes);
    });
  });
```

**Response Speed:**
- **Cache Hit:** 50-100ms ⚡ (most requests)
- **Cache Miss:** 600-900ms (first request or after cache expires)

---

## Integration Examples

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Instagram Feed</title>
  <style>
    .instagram-feed {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    .post {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .post img {
      width: 100%;
      height: 300px;
      object-fit: cover;
    }
    .post-caption {
      padding: 15px;
      font-size: 14px;
    }
    .post-stats {
      padding: 0 15px 15px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div id="instagram-feed" class="instagram-feed"></div>

  <script>
    const API_KEY = 'fk_your_api_key_here';
    const feed = document.getElementById('instagram-feed');

    fetch(`https://flowkick.kua.cl/api/v1/social/instagram?api_key=${API_KEY}`)
      .then(res => res.json())
      .then(result => {
        result.data.forEach(post => {
          const postEl = document.createElement('div');
          postEl.className = 'post';
          postEl.innerHTML = `
            <a href="${post.postUrl}" target="_blank">
              <img src="${post.imageUrl}" alt="${post.caption}">
            </a>
            <div class="post-caption">${post.caption}</div>
            <div class="post-stats">
              ❤️ ${post.likes.toLocaleString()} likes ·
              💬 ${post.comments.toLocaleString()} comments
            </div>
          `;
          feed.appendChild(postEl);
        });
      });
  </script>
</body>
</html>
```

---

### React

```jsx
import { useEffect, useState } from 'react';

const API_KEY = 'fk_your_api_key_here';

export default function InstagramFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://flowkick.kua.cl/api/v1/social/instagram?api_key=${API_KEY}`)
      .then(res => res.json())
      .then(result => {
        setPosts(result.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="instagram-feed">
      {posts.map(post => (
        <div key={post.id} className="post">
          <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
            <img src={post.imageUrl} alt={post.caption} />
          </a>
          <p>{post.caption}</p>
          <div className="stats">
            ❤️ {post.likes.toLocaleString()} · 💬 {post.comments.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### WordPress (PHP)

```php
<?php
$api_key = 'fk_your_api_key_here';
$platform = 'instagram';
$url = "https://flowkick.kua.cl/api/v1/social/{$platform}?api_key={$api_key}";

$response = wp_remote_get($url);
if (is_wp_error($response)) {
    echo 'Error loading feed';
    return;
}

$body = wp_remote_retrieve_body($response);
$data = json_decode($body);

if ($data->success) {
    echo '<div class="instagram-feed">';
    foreach ($data->data as $post) {
        echo '<div class="post">';
        echo '<a href="' . esc_url($post->postUrl) . '" target="_blank">';
        echo '<img src="' . esc_url($post->imageUrl) . '" alt="">';
        echo '</a>';
        echo '<p>' . esc_html($post->caption) . '</p>';
        echo '<span>❤️ ' . number_format($post->likes) . ' likes</span>';
        echo '</div>';
    }
    echo '</div>';
}
?>
```

---

## Data Format by Platform

### Instagram Posts

```json
{
  "id": "CxYz123",
  "platform": "instagram",
  "imageUrl": "https://flowkick.kua.cl/api/v1/media/proxy?url=...",
  "videoUrl": "https://flowkick.kua.cl/api/v1/media/proxy?url=...",
  "postUrl": "https://instagram.com/p/CxYz123",
  "caption": "Amazing coffee! ☕ #coffee #cafe",
  "timestamp": "2025-11-05T10:30:00.000Z",
  "likes": 1234,
  "comments": 56,
  "type": "image",
  "shortCode": "CxYz123"
}
```

### TikTok Videos

```json
{
  "id": "7123456789",
  "platform": "tiktok",
  "imageUrl": "https://...",
  "videoUrl": "https://...",
  "postUrl": "https://tiktok.com/@user/video/7123456789",
  "caption": "Check out this amazing latte art! #latteart",
  "timestamp": "2025-11-05T09:15:00.000Z",
  "likes": 5678,
  "comments": 123,
  "shares": 45,
  "views": 12345,
  "type": "video"
}
```

### Google Reviews

```json
{
  "id": "review_abc123",
  "platform": "google_maps",
  "authorName": "John Doe",
  "authorPhotoUrl": "https://...",
  "rating": 5,
  "text": "Best coffee in town! Highly recommend.",
  "timestamp": "2025-11-04T14:20:00.000Z",
  "images": ["https://...", "https://..."],
  "likes": 12
}
```

---

## Rate Limits

Rate limits depend on your subscription plan:

| Plan | Requests/Month | Response Time |
|------|----------------|---------------|
| **Free** | 1,000 | 50-100ms |
| **Starter** | 10,000 | 50-100ms |
| **Pro** | 100,000 | 10-20ms |
| **Enterprise** | Unlimited | 5-10ms |

---

## Caching

Flowkick automatically caches your social media data to ensure fast response times:

- **Cache Duration:** 30 minutes (configurable)
- **Auto-Refresh:** Caches are refreshed automatically before they expire
- **Cache Headers:** Standard HTTP caching headers are included
- **Cache Status:** Check the `X-Cache-Status` header (HIT/MISS)

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication failed",
  "message": "Invalid API key"
}
```

**Causes:**
- Invalid API key
- Inactive account
- Subscription expired

### 400 Bad Request
```json
{
  "error": "Platform not configured",
  "message": "Please configure your instagram account in your Flowkick dashboard"
}
```

**Causes:**
- Platform not configured in your account
- Unsupported platform

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch data",
  "message": "No data available from source"
}
```

**Causes:**
- Data source temporarily unavailable
- Network issues

---

## Best Practices

### 1. Handle Loading States
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
    setPosts(data.data);
    setLoading(false);
  })
  .catch(err => {
    setError(err.message);
    setLoading(false);
  });
```

### 2. Cache Client-Side
```javascript
// Cache in localStorage for 5 minutes
const CACHE_KEY = 'flowkick_instagram';
const CACHE_DURATION = 5 * 60 * 1000;

const cached = localStorage.getItem(CACHE_KEY);
if (cached) {
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < CACHE_DURATION) {
    setPosts(data);
    return;
  }
}

// Fetch fresh data...
fetch(apiUrl)
  .then(res => res.json())
  .then(result => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: result.data,
      timestamp: Date.now()
    }));
    setPosts(result.data);
  });
```

### 3. Use Environment Variables
```javascript
// .env.local
NEXT_PUBLIC_FLOWKICK_API_KEY=fk_your_api_key_here

// In your code
const API_KEY = process.env.NEXT_PUBLIC_FLOWKICK_API_KEY;
```

### 4. Add Image Optimization
```jsx
<img
  src={post.imageUrl}
  loading="lazy"
  alt={post.caption}
  onError={(e) => e.target.src = '/placeholder.jpg'}
/>
```

---

## Support

- **Email:** support@flowkick.com
- **Dashboard:** https://flowkick.kua.cl/dashboard
- **Status Page:** https://status.flowkick.com

---

## Changelog

### v1.0.0 (November 2025)
- Initial release
- Support for Instagram, TikTok, Google Reviews
- 30-minute cache with auto-refresh
- API key authentication
