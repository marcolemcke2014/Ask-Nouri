# NutriFlow Multi-Agent Implementation Plan

## 🧩 Issue Diagnosis

After testing the multi-agent system, we've identified several integration issues:

1. **API Response Parsing**: Our current `callAI` function doesn't properly handle the response format needed by our agents.
2. **Type Compatibility**: There's a mismatch between the OpenAI API response format and what our agents expect.
3. **Error Handling**: The current implementation lacks robust error handling for API failures.

## 🔧 Fix Implementation Plan

### 1. Update `callAI` function in `lib/ai.ts`

The `callAI` function needs to be updated to:
- Use JSON response formatting when calling the OpenAI API
- Properly parse the response to match the format expected by our agents
- Include better error handling and logging

### 2. Update OpenAI API Endpoint in `pages/api/openai.js`

- Set response_format to JSON by default
- Add better error logging
- Implement retry logic for transient failures

### 3. Update Agent Error Handling

Each agent should have improved error handling to:
- Gracefully handle API response format issues
- Provide reasonable fallbacks when the API fails
- Log detailed error information for debugging

### 4. Add Robust Validation for Menu Items

Add validation to ensure:
- Menu items have required fields before processing
- Scores are within expected ranges
- Empty or malformed responses are properly handled

## 🔄 Implementation Steps

1. **Update `lib/ai.ts`**
   - Modify `callAI` function to request and handle JSON responses
   - Add response transformation to match agent expectations
   - Improve error handling

2. **Update `pages/api/openai.js`**
   - Set response_format to JSON by default
   - Add retry logic for API calls
   - Improve error handling

3. **Add Fallback Mechanisms**
   - Implement better fallback for MenuStructurer when OCR fails
   - Add reasonable defaults for each agent when upstream data is missing
   - Create a "safe" response structure for the frontend

4. **Update API Endpoint**
   - Modify `/api/analyze-menu.ts` to handle errors gracefully
   - Add validation for input parameters
   - Improve error messages for frontend

## 📝 Test Plan

1. Test individual agents with mocked responses
2. Test the entire pipeline with real OCR data
3. Test error scenarios and verify fallback behavior
4. Test with variations in user profiles
5. Verify the output format matches frontend expectations

## 🚀 Frontend Integration

The frontend can expect a response in this format:

```json
{
  "averageMenuScore": 68,
  "menuCategory": "⚖️ Balanced",
  "topDishes": {
    "healthiest": {
      "title": "Roasted Salmon",
      "price": "$28",
      "category": "🥗 Healthiest",
      "summary": "High in omega-3 fatty acids with anti-inflammatory benefits. Supports protein needs for muscle recovery.",
      "macros": {
        "calories": 450,
        "protein": "High",
        "carbs": "Low",
        "fat": "Mid",
        "sugar": "Low",
        "confidence": 0.85
      },
      "health_prediction": {
        "short_term": "Mental clarity and sustained energy without bloating.",
        "long_term": "Improved muscle recovery and reduced inflammation."
      },
      "score": 88,
      "confidence": 0.9
    },
    "balanced": { /* similar structure */ },
    "indulgent": { /* similar structure */ }
  }
}
```

## ✅ Greenlight Status

The frontend team is **GREENLIT** to begin development based on this expected response format.

The backend team should implement the fixes outlined in this plan to ensure the actual API returns data in this format.

## 🔍 Monitoring Plan

Once implemented:
1. Add logging for API call success/failure rates
2. Track API response times
3. Monitor agent performance and fallback usage
4. Collect user feedback on recommendation quality 