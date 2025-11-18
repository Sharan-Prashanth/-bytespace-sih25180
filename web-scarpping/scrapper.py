import requests
from bs4 import BeautifulSoup
import pandas as pd
from urllib.parse import urljoin

BASE_URL = "https://scienceandtech.cmpdi.co.in/completion_reports.php"

session = requests.Session()

# Load landing page
resp = session.get(BASE_URL)
soup = BeautifulSoup(resp.text, "html.parser")

# Extract the year dropdown
year_dropdown = soup.find("select", {"name": "fin_year"})
years = [opt["value"] for opt in year_dropdown.find_all("option") if opt["value"].strip()]

print("Found years:", years)

all_rows = []

for year in years:
    print(f"Scraping year: {year}")

    # POST request (this is where your script was wrong)
    resp2 = session.post(BASE_URL, data={"fin_year": year, "submit": "Go"})
    soup2 = BeautifulSoup(resp2.text, "html.parser")

    # Find table with project headers
    tables = soup2.find_all("table")

    target_table = None
    for t in tables:
        if "Sl. No." in t.text and "Title of the Project" in t.text:
            target_table = t
            break

    if not target_table:
        print(f"No table found for {year}")
        continue

    rows = target_table.find_all("tr")[2:]  # Skip first 2 header rows

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
            "PDF Link": pdf_link
        })

# Export to Excel
df = pd.DataFrame(all_rows)
df.to_excel("completion_reports.xlsx", index=False)

print("Saved:", "completion_reports.xlsx")
print("Total rows:", len(df))
