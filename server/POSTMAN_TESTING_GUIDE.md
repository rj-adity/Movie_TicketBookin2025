# Postman Testing Guide - Copy & Paste Ready

## 🚀 Quick Test Instructions

### Step 1: Import Collection (Optional)
- Import the [`POSTMAN_COLLECTION.json`](server/POSTMAN_COLLECTION.json:1) file into Postman
- OR follow the manual steps below

### Step 2: Manual Testing (Copy-Paste Ready)

## 1. Health Check ✅
```
Method: GET
URL: http://localhost:3000/
```

## 2. Get All Shows (Empty Initially) ✅
```
Method: GET
URL: http://localhost:3000/api/show/all
```

## 3. Add Spider-Man Movie Shows 🎬

**⚠️ Note: This requires admin authentication. For testing without auth, skip to step 4.**

```
Method: POST
URL: http://localhost:3000/api/show/add
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_CLERK_TOKEN

Body (JSON):
{
  "movieId": "558449",
  "showPrice": 250,
  "showsInput": [
    {
      "date": "2025-07-27",
      "time": ["10:00", "14:00", "18:00", "21:00"]
    },
    {
      "date": "2025-07-28", 
      "time": ["11:00", "15:00", "19:00", "22:00"]
    },
    {
      "date": "2025-07-29",
      "time": ["12:00", "16:00", "20:00"]
    }
  ]
}
```

## 4. Add Avengers Movie Shows 🦸‍♂️

```
Method: POST
URL: http://localhost:3000/api/show/add
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_CLERK_TOKEN

Body (JSON):
{
  "movieId": "299536",
  "showPrice": 300,
  "showsInput": [
    {
      "date": "2025-07-27",
      "time": ["09:00", "13:00", "17:00", "21:30"]
    },
    {
      "date": "2025-07-28",
      "time": ["10:30", "14:30", "18:30", "22:30"]
    }
  ]
}
```

## 5. Test Cast & DateTime Visibility 🎭

After adding movies, test these endpoints to see cast and datetime data:

### Get All Shows (Will now show movies with cast data)
```
Method: GET
URL: http://localhost:3000/api/show/all
```

**Expected Response Structure:**
```json
{
  "success": true,
  "movies": [
    {
      "_id": "558449",
      "title": "Spider-Man: No Way Home",
      "overview": "Movie description...",
      "poster_path": "/poster.jpg",
      "backdrop_path": "/backdrop.jpg",
      "release_date": "2021-12-15",
      "casts": [
        {
          "cast_id": 1,
          "character": "Peter Parker / Spider-Man",
          "name": "Tom Holland",
          "profile_path": "/actor.jpg"
        }
      ],
      "genres": [...],
      "vote_average": 8.4,
      "runtime": 148
    }
  ],
  "count": 2
}
```

### Get Spider-Man Specific Shows (Cast + DateTime)
```
Method: GET
URL: http://localhost:3000/api/show/558449
```

**Expected Response Structure:**
```json
{
  "success": true,
  "movie": {
    "_id": "558449",
    "title": "Spider-Man: No Way Home",
    "casts": [
      {
        "cast_id": 1,
        "character": "Peter Parker / Spider-Man", 
        "name": "Tom Holland",
        "profile_path": "/actor.jpg"
      }
    ]
  },
  "dateTime": {
    "2025-07-27": [
      {
        "time": "10:00",
        "showId": "show_id_here",
        "showDateTime": "2025-07-27T10:00:00.000Z",
        "showPrice": 250
      },
      {
        "time": "14:00", 
        "showId": "show_id_here",
        "showDateTime": "2025-07-27T14:00:00.000Z",
        "showPrice": 250
      }
    ],
    "2025-07-28": [...]
  },
  "totalShows": 11
}
```

### Get Avengers Specific Shows
```
Method: GET
URL: http://localhost:3000/api/show/299536
```

## 6. Test Without Authentication (Public Endpoints)

These work without any authentication:
- ✅ `GET /` - Health check
- ✅ `GET /api/show/all` - All shows
- ✅ `GET /api/show/{movieId}` - Specific movie shows

## 🎯 What You'll See After Adding Movies:

1. **Cast Data**: Full actor information with names, characters, profile images
2. **DateTime Data**: Organized by date with show times, IDs, and prices  
3. **Movie Details**: Complete movie information from TMDB
4. **Error Handling**: Proper error responses if something goes wrong

## 🔑 Authentication Note:

For admin endpoints (adding shows), you need a valid Clerk token. If you don't have one set up yet, you can:
1. Test the public endpoints first (they work without auth)
2. Set up Clerk authentication later
3. Or temporarily disable auth for testing (not recommended for production)

## ✅ Success Confirmation:

If you see cast arrays and properly formatted datetime objects in the responses, then all the fixes are working perfectly! 🎉