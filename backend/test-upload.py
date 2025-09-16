import requests
import os

# Test file upload to scan endpoint
url = "http://localhost:5000/api/scan"
test_file_path = "test.txt"

# Create test file if it doesn't exist
if not os.path.exists(test_file_path):
    with open(test_file_path, 'w') as f:
        f.write("Hello, this is a malware scan test file")

# Test file upload
print("🔄 Testing file upload to scan endpoint...")
try:
    with open(test_file_path, 'rb') as f:
        files = {'file': ('test.txt', f, 'text/plain')}
        headers = {
            'Authorization': 'Bearer your_clerk_token'
        }
        
        response = requests.post(url, files=files, headers=headers)
        
        print(f"✅ HTTP Status: {response.status_code}")
        print("📄 Response Content:")
        print(response.text)
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n🔍 If you get 401 Unauthorized, you need to:")
print("  1. Get a valid Clerk JWT token")
print("  2. Replace 'your_clerk_token' with the actual token")
print("  3. Or temporarily disable authentication in the route for testing")
