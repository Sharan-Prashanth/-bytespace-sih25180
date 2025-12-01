#!/usr/bin/env python3
"""
Test script for FORM-I OCR extraction API
"""

import requests
import json
import os
from pathlib import Path

# API endpoint (update with your actual server URL)
API_BASE_URL = "http://localhost:8000"  # Adjust as needed
EXTRACT_ENDPOINT = f"{API_BASE_URL}/extract-form1"

def test_form_extraction(file_path: str):
    """Test the FORM-I extraction with a file."""
    
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} does not exist")
        return
    
    print(f"Testing FORM-I extraction with file: {file_path}")
    print("-" * 50)
    
    try:
        with open(file_path, 'rb') as file:
            files = {'file': (os.path.basename(file_path), file, 'application/pdf')}
            
            print("Uploading and processing file...")
            response = requests.post(EXTRACT_ENDPOINT, files=files)
            
            if response.status_code == 200:
                result = response.json()
                
                print("✅ Extraction successful!")
                print(f"📄 File: {result['file_info']['filename']}")
                print(f"🆔 Extraction ID: {result['extraction_id']}")
                print(f"💾 Stored in database: {result['database_stored']}")
                print(f"📊 Statistics:")
                print(f"   - Text length: {result['statistics']['text_length']} characters")
                print(f"   - Fields extracted: {result['statistics']['fields_extracted']}/{result['statistics']['total_fields']}")
                
                # Display key extracted information
                extracted_data = result['extracted_data']
                basic_info = extracted_data.get('basic_information', {})
                cost_info = extracted_data.get('cost_breakdown', {}).get('total_project_cost', {})
                project_details = extracted_data.get('project_details', {})
                
                print(f"\n📋 Key Information Extracted:")
                print(f"   - Project Title: {basic_info.get('project_title', 'Not found')}")
                print(f"   - Principal Agency: {basic_info.get('principal_implementing_agency', 'Not found')}")
                print(f"   - Project Leader: {basic_info.get('project_leader_name', 'Not found')}")
                print(f"   - Contact Email: {basic_info.get('contact_email', 'Not found')}")
                print(f"   - Total Cost: {cost_info.get('total', 'Not found')} lakhs")
                print(f"   - Project Duration: {basic_info.get('project_duration', 'Not found')}")
                
                # Display project details summary
                if project_details.get('definition_of_issue'):
                    issue_preview = project_details['definition_of_issue'][:100] + "..." if len(project_details['definition_of_issue']) > 100 else project_details['definition_of_issue']
                    print(f"   - Issue Definition: {issue_preview}")
                
                # Display cost breakdown summary
                cost_breakdown = extracted_data.get('cost_breakdown', {})
                print(f"\n💰 Cost Breakdown Summary:")
                
                capital = cost_breakdown.get('capital_expenditure', {})
                if capital.get('land_building', {}).get('total'):
                    print(f"   - Land & Building: {capital['land_building']['total']} lakhs")
                if capital.get('equipment', {}).get('total'):
                    print(f"   - Equipment: {capital['equipment']['total']} lakhs")
                
                revenue = cost_breakdown.get('revenue_expenditure', {})
                if revenue.get('salaries', {}).get('total'):
                    print(f"   - Salaries: {revenue['salaries']['total']} lakhs")
                if revenue.get('consumables', {}).get('total'):
                    print(f"   - Consumables: {revenue['consumables']['total']} lakhs")
                if revenue.get('travel', {}).get('total'):
                    print(f"   - Travel: {revenue['travel']['total']} lakhs")
                
                # Save the JSON structure to a file
                output_file = f"extracted_form_{result['extraction_id']}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(result['extracted_data'], f, indent=2, ensure_ascii=False)
                print(f"💾 JSON structure saved to: {output_file}")
                
                # Save raw data separately
                raw_output_file = f"raw_data_{result['extraction_id']}.json"
                with open(raw_output_file, 'w', encoding='utf-8') as f:
                    json.dump(result['raw_data'], f, indent=2, ensure_ascii=False)
                print(f"📊 Raw extracted data saved to: {raw_output_file}")
                
                return result
                
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def test_list_proposals():
    """Test listing all proposals."""
    try:
        response = requests.get(f"{API_BASE_URL}/proposals/list")
        if response.status_code == 200:
            result = response.json()
            print(f"📋 Found {result['count']} proposals in database:")
            for i, proposal in enumerate(result['proposals'][:5], 1):  # Show first 5
                print(f"   {i}. {proposal.get('project_title', 'Untitled')} (ID: {proposal['id'][:8]}...)")
        else:
            print(f"❌ Error listing proposals: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def display_json_structure_info(data):
    """Display information about the JSON structure."""
    print("\n🔍 JSON Structure Analysis:")
    
    if isinstance(data, dict):
        print(f"   - Root level keys: {len(data.keys())}")
        for key in data.keys():
            print(f"     • {key}")
            
        # Check nested structure
        basic_info = data.get('basic_information', {})
        if basic_info:
            print(f"   - Basic information fields: {len(basic_info.keys())}")
        
        project_details = data.get('project_details', {})
        if project_details:
            print(f"   - Project detail fields: {len(project_details.keys())}")
            
        cost_breakdown = data.get('cost_breakdown', {})
        if cost_breakdown:
            print(f"   - Cost breakdown sections: {len(cost_breakdown.keys())}")

def main():
    """Main test function."""
    print("🚀 FORM-I OCR Extraction Test")
    print("=" * 50)
    
    # Test file path - update this to your actual FORM-I file
    test_file = r"c:\Users\Shanmuga Shyam. B\OneDrive\Desktop\SIH25180\Model\data_files\FORM-I_NEW.pdf"
    
    if os.path.exists(test_file):
        # Test extraction
        result = test_form_extraction(test_file)
        
        if result:
            # Display JSON structure info
            display_json_structure_info(result.get('extracted_data', {}))
            
            print("\n" + "=" * 50)
            # Test listing proposals
            test_list_proposals()
    else:
        print(f"❌ Test file not found: {test_file}")
        print("Please update the 'test_file' variable with the correct path to your FORM-I PDF.")

if __name__ == "__main__":
    main()