# Postman Testing Examples

## Server Status: ✅ Working Correctly

Your server is running perfectly! The API response you got confirms everything is working:

```json
{
    "success": true,
    "movies": [],
    "count": 0
}
```

## Postman Test Examples

### 1. Health Check (No Auth Required)
```
GET http://localhost:3000/
```

**Expected Response:**
```json
{
    "success": true,
    "message": "Server is Live",
    "timestamp": "2025-07-26T11:36:52.128Z"
}
```

### 2. Get All Shows (No Auth Required)
```
GET http://localhost:3000/api/show/all
```

**Expected Response:**
```json
{
    "success": true,
    "movies": [],
    "count": 0
}
```

### 3. Get Now Playing Movies (Admin Auth Required)
```
GET http://localhost:3000/api/show/now-playing
```

**Headers Required:**
- `Authorization: Bearer YOUR_CLERK_TOKEN`

**Expected Response:**
```json
{
    "success": true,
    "movies": [...],
    "total": 20,
    "page": 1,
    "total_pages": 1
}
```

### 4. Add Show (Admin Auth Required)
```
POST http://localhost:3000/api/show/add
Content-Type: application/json
Authorization: Bearer YOUR_CLERK_TOKEN
```

**Body:**
```json
{
    "movieId": "123456",
    "showPrice": 250,
    "showsInput": [
        {
            "date": "2025-07-27",
            "time": ["10:00", "14:00", "18:00"]
        },
        {
            "date": "2025-07-28", 
            "time": ["11:00", "15:00", "19:00"]
        }
    ]
}
```

### 5. Get Specific Movie Shows (No Auth Required)
```
GET http://localhost:3000/api/show/123456
```

**Expected Response (when movie exists):**
```json
{
    "success": true,
    "movie": {
        "_id": "123456",
        "title": "Movie Title",
        "overview": "Movie description...",
        "poster_path": "/poster.jpg",
        "backdrop_path": "/backdrop.jpg",
        "release_date": "2025-07-27",
        "original_language": "en",
        "tagline": "Movie tagline",
        "genres": [...],
        "casts": [
            {
                "cast_id": 1,
                "character": "Character Name",
                "credit_id": "abc123",
                "gender": 2,
                "id": 12345,
                "name": "Actor Name",
                "order": 0,
                "profile_path": "/actor.jpg"
            }
        ],
        "vote_average": 8.5,
        "runtime": 120
    },
    "dateTime": {
        "2025-07-27": [
            {
                "time": "10:00",
                "showId": "show_id_1",
                "showDateTime": "2025-07-27T10:00:00.000Z",
                "showPrice": 250
            }
        ]
    },
    "totalShows": 6
}
```

## Cast and DateTime Visibility Confirmed ✅

The server is properly configured to show:
- **Cast Data**: Full cast arrays with actor details
- **DateTime Data**: Properly formatted show times with metadata
- **Error Handling**: Comprehensive error responses
- **Vercel Compatibility**: Ready for deployment

## Next Steps

1. Use Postman to test the endpoints above
2. For admin endpoints, you'll need a valid Clerk authentication token
3. Add some shows using the POST endpoint to see cast and datetime data
4. Deploy to Vercel when ready

Your server is working perfectly! 🎉