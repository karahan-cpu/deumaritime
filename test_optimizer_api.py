"""
Test the CII optimization API
"""

import requests
import json

# Test data
test_request = {
    "currentParams": {
        "annualFuelConsumption": 18500,
        "distanceTraveled": 95000,
        "fuelType": "HFO"
    },
    "shipInfo": {
        "shipType": "Bulk Carrier",
        "capacity": 85000,
        "year": 2025
    }
}

print("Testing CII Optimization API...")
print("=" * 60)

try:
    # Test the optimization endpoint
    response = requests.post(
        'http://localhost:5001/api/optimize/cii',
        json=test_request,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ Optimization Successful!\n")
        print(f"Current Rating: {result['currentRating']}")
        print(f"Target Rating: {result['targetRating']}")
        print(f"Achieved Rating: {result['achievedRating']}")
        print(f"\nCurrent CII: {result['currentCII']}")
        print(f"Optimized CII: {result['optimizedCII']}")
        print(f"Improvement: {result['improvement']}%")
        print(f"\n📊 Recommendations ({len(result['recommendations'])} found):")
        print("=" * 60)
        
        for i, rec in enumerate(result['recommendations'], 1):
            print(f"\n{i}. {rec['title']}")
            print(f"   Impact: {rec['impact'].upper()}")
            print(f"   {rec['description']}")
            
            if 'from' in rec and 'to' in rec:
                print(f"   Change: {rec['from']:.2f} → {rec['to']:.2f} {rec['unit']}")
            
            if 'suggestions' in rec:
                print("   How to achieve:")
                for suggestion in rec['suggestions']:
                    print(f"   • {suggestion}")
            
            if 'alternatives' in rec:
                print("   Alternative fuels:")
                for alt in rec['alternatives']:
                    print(f"   • {alt['fuel']}: Rating {alt['rating']} (+{alt['improvement']}% improvement)")
        
        print("\n" + "=" * 60)
        print("✅ Test completed successfully!")
        
    else:
        print(f"❌ Error: HTTP {response.status_code}")
        print(response.text)

except requests.exceptions.ConnectionError:
    print("❌ Error: Could not connect to optimization service")
    print("Make sure the Flask API is running on port 5001")
    print("Run: python server/optimizer_api.py")

except Exception as e:
    print(f"❌ Error: {e}")
