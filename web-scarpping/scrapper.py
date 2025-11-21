import requests
from bs4 import BeautifulSoup
import pandas as pd
from urllib.parse import urljoin
import io
import json
import os
from PyPDF2 import PdfReader

BASE_URL = "https://scienceandtech.cmpdi.co.in/completion_reports.php"
PDF_DIR = "downloaded_pdfs"
os.makedirs(PDF_DIR, exist_ok=True)

session = requests.Session()

# ----------------------------
# Step 1: Get available years
# ----------------------------
resp = session.get(BASE_URL)
soup = BeautifulSoup(resp.text, "html.parser")

year_dropdown = soup.find("select", {"name": "fin_year"})
years = [opt["value"] for opt in year_dropdown.find_all("option") if opt["value"].strip()]

print("Found years:", years)

all_rows = []

# ----------------------------
# Step 2: Scrape for each year
# ----------------------------
for year in years:
    print(f"\nScraping year: {year}")

    resp2 = session.post(BASE_URL, data={"fin_year": year, "submit": "Go"})
    soup2 = BeautifulSoup(resp2.text, "html.parser")

    tables = soup2.find_all("table")
    target_table = None

    for t in tables:
        if "Sl. No." in t.text and "Title of the Project" in t.text:
            target_table = t
            break

    if not target_table:
        print(f"No table found for {year}")
        continue

    rows = target_table.find_all("tr")[2:]

    for r in rows:
        cols = r.find_all("td")
        if len(cols) < 7:
            continue

        sl_no = cols[0].get_text(strip=True)
        title = cols[1].get_text(strip=True)
        project_code = cols[2].get_text(strip=True)
        implementer = cols[3].get_text(strip=True)
        fin_year = cols[4].get_text(strip=True)
        cost = cols[5].get_text(strip=True)

        pdf_link = ""
        pdf_tag = cols[6].find("a")
        if pdf_tag and pdf_tag.get("href"):
            pdf_link = urljoin(BASE_URL, pdf_tag["href"])

        all_rows.append({
            "Selected Year": year,
            "Sl No": sl_no,
            "Title": title,
            "Project Code": project_code,
            "Implementing Agency": implementer,
            "Financial Year": fin_year,
            "Cost (Lakhs)": cost,
            "PDF Link": pdf_link,
        })

# Convert to DataFrame
df = pd.DataFrame(all_rows)
df["Extracted_JSON"] = ""   # New column for JSON output


# ----------------------------
# Step 3: PDF Download Helper
# ----------------------------
def download_pdf(url):
    if not url:
        return None

    filename = url.split("/")[-1] or f"file_{abs(hash(url))}.pdf"
    filepath = os.path.join(PDF_DIR, filename)

    if os.path.exists(filepath):
        return filepath

    r = requests.get(url, timeout=25)
    if r.status_code == 200:
        with open(filepath, "wb") as f:
            f.write(r.content)
        return filepath
    return None


# ----------------------------
# Step 4: Extract PDF from page 2+
# ----------------------------
def extract_from_second_page(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        total_pages = len(reader.pages)

        # If only 1 page, return blank
        if total_pages <= 1:
            return ""

        extracted = []
        for i in range(1, total_pages):  # start at page 2 => index 1
            try:
                text = reader.pages[i].extract_text()
                if text:
                    extracted.append(text.strip())
            except:
                continue

        return "\n\n".join(extracted)

    except Exception as e:
        print("Error reading PDF:", pdf_path, e)
        return ""


# ----------------------------
# Step 5: Process each PDF
# ----------------------------
for idx, row in df.iterrows():
    pdf_url = row["PDF Link"]

    if not pdf_url or not isinstance(pdf_url, str) or not pdf_url.strip():
        df.at[idx, "Extracted_JSON"] = json.dumps({"text": ""})
        continue

    print("Processing:", pdf_url)

    try:
        local_pdf_path = download_pdf(pdf_url)
        if not local_pdf_path:
            df.at[idx, "Extracted_JSON"] = json.dumps({"text": ""})
            continue

        extracted_text = extract_from_second_page(local_pdf_path)

        # Convert to JSON structure
        json_data = {
            "text": extracted_text
        }

        df.at[idx, "Extracted_JSON"] = json.dumps(json_data, ensure_ascii=False)

    except Exception as e:
        df.at[idx, "Extracted_JSON"] = json.dumps({"error": str(e)})


# ----------------------------
# Step 6: Save final Excel
# ----------------------------
df.to_excel("completion_reports_with_json.xlsx", index=False)

print("\n✔ DONE!")
print("Saved: completion_reports_with_json.xlsx")
