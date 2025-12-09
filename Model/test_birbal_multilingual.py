"""
Quick test script to verify BIRBAL multilingual functionality
Run this after starting the Python backend server
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_rag_multilingual():
    """Test RAG endpoint with different languages"""
    
    test_cases = [
        {
            "name": "English Question",
            "question": "What are the coal research guidelines?",
            "expected_language": "English"
        },
        {
            "name": "Hindi Question",
            "question": "कोयला अनुसंधान दिशानिर्देश क्या हैं?",
            "expected_language": "Hindi"
        },
        {
            "name": "Tamil Question",
            "question": "நிலக்கரி ஆராய்ச்சி வழிகாட்டுதல்கள் என்ன?",
            "expected_language": "Tamil"
        }
    ]
    
    print("=" * 80)
    print("TESTING BIRBAL RAG MULTILINGUAL SUPPORT")
    print("=" * 80)
    
    for test in test_cases:
        print(f"\n📝 Test: {test['name']}")
        print(f"Question: {test['question']}")
        print(f"Expected Response Language: {test['expected_language']}")
        print("-" * 80)
        
        try:
            response = requests.post(
                f"{BASE_URL}/chat",
                json={"question": test['question'], "top_k": 5},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Status: Success")
                print(f"\n🤖 BIRBAL Response:")
                print(data['answer'][:500])  # First 500 chars
                if len(data['answer']) > 500:
                    print("... (truncated)")
                print(f"\n📚 Sources: {len(data.get('sources', []))} found")
            else:
                print(f"❌ Error: Status {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        
        print("\n" + "=" * 80)

def test_proposal_chat_multilingual():
    """Test Proposal Chat endpoint with different languages"""
    
    # Note: You'll need a valid user_id from your MongoDB
    test_user_id = "test_user_id"  # Replace with actual user ID
    
    test_cases = [
        {
            "name": "English Proposal Question",
            "question": "What is my proposal status?",
            "expected_language": "English"
        },
        {
            "name": "Hindi Proposal Question",
            "question": "मेरे प्रस्ताव की स्थिति क्या है?",
            "expected_language": "Hindi"
        },
        {
            "name": "Tamil Proposal Question",
            "question": "என் திட்டத்தின் நிலை என்ன?",
            "expected_language": "Tamil"
        }
    ]
    
    print("\n" + "=" * 80)
    print("TESTING BIRBAL PROPOSAL CHAT MULTILINGUAL SUPPORT")
    print("=" * 80)
    
    for test in test_cases:
        print(f"\n📝 Test: {test['name']}")
        print(f"Question: {test['question']}")
        print(f"Expected Response Language: {test['expected_language']}")
        print("-" * 80)
        
        try:
            response = requests.post(
                f"{BASE_URL}/chat-proposals",
                json={"question": test['question'], "user_id": test_user_id},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Status: Success")
                print(f"\n🤖 BIRBAL Response:")
                print(data['answer'][:500])  # First 500 chars
                if len(data['answer']) > 500:
                    print("... (truncated)")
                print(f"\n📋 Proposals: {len(data.get('proposals', []))} found")
            else:
                print(f"❌ Error: Status {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    print("\n🚀 BIRBAL Multilingual Test Suite")
    print("Make sure Python backend is running on http://localhost:8000\n")
    
    # Test RAG
    test_rag_multilingual()
    
    # Uncomment to test proposal chat (need valid user_id)
    # test_proposal_chat_multilingual()
    
    print("\n✨ Testing Complete!")
    print("\nNote: To test proposal chat, update test_user_id in the script")
    print("      with a valid user ID from your MongoDB database.")
