// Test file to demonstrate the API response mapping

const apiResponse = {
    "status": "success",
    "code": 200000,
    "message": "Successfully Retrieved",
    "data": {
        "dryRun": true,
        "sourceElectionId": 58,
        "targetElectionId": 116,
        "selectedFields": [
            "VOTER_HISTORY",
            "MOBILE_NUMBER",
            // ... other fields
        ],
        "votersMatched": 6088,
        "votersAffected": 6064,
        "missingEpicInTargetCount": 0,
        "missingEpicSample": [],
        "fieldStats": {
            "LOCATION": {
                "willUpdate": 6064
            },
            "LANGUAGE": {
                "willUpdate": 13
            }
            // ... other field stats
        },
        "fieldAvailability": {
            "PARTY": {
                "missingNames": [
                    "All India N.R. Congress",
                    "Bharatiya Janata Party"
                    // ... other missing names
                ],
                "status": "PARTIAL"
            }
            // ... other field availability
        },
        "warnings": [],
        "canProceed": true,
        "estimatedRuntimeSeconds": 0,
        "generatedAt": "2025-09-05T22:12:08.105333300Z"
    }
};

// How the component now extracts the data:
const dryRunData = apiResponse.data || apiResponse;

console.log("Extracted data:", {
    votersMatched: dryRunData.votersMatched, // 6088
    votersAffected: dryRunData.votersAffected, // 6064
    missingEpicInTargetCount: dryRunData.missingEpicInTargetCount, // 0
    canProceed: dryRunData.canProceed, // true
    generatedAt: dryRunData.generatedAt // "2025-09-05T22:12:08.105333300Z"
});

// This should now display correctly in the UI:
// - Summary cards will show: 6,088 | 6,064 | 0
// - Field update counts will show the actual numbers
// - Field availability will show the PARTIAL status and missing values
// - Can Proceed will show "YES"
// - Generated timestamp will be properly formatted
